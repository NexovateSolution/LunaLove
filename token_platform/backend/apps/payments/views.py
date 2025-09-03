import hmac
import hashlib
import json
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Sum
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import UserRateThrottle
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

from .models import (
    CoinPackage,
    Payment,
    Wallet,
    Receipt,
    AuditLog,
    Gift,
    GiftTransaction,
    WithdrawalRequest,
    KYCSubmission,
)
from .serializers import (
    TopUpCreateSerializer,
    PaymentSerializer,
    ReceiptSerializer,
    GiftSendSerializer,
    WalletSerializer,
    GiftSerializer,
    CoinPackageListSerializer,
    WithdrawalCreateSerializer,
    WithdrawalSerializer,
    KYCSubmitSerializer,
)
from . import tasks


def _stub_checkout_url(payment: Payment) -> str:
    return f"{settings.FRONTEND_URL}/purchase/checkout?payment_id={payment.id}&ref={payment.provider_ref}"


def _split_gift_value_inclusive_commission(value_etb: Decimal, commission_rate: Decimal, vat_rate: Decimal):
    """Return (commission_gross, vat_on_commission, commission_net, creator_payout).

    Commission is applied on the gross "value_etb". VAT is applied on the commission
    and withheld from platform revenue, not deducted from creator payout.
    """
    value = Decimal(value_etb)
    rate = Decimal(commission_rate)
    vat = Decimal(vat_rate)
    commission_gross = (value * rate).quantize(Decimal('0.01'))
    vat_on_commission = (commission_gross * vat).quantize(Decimal('0.01'))
    commission_net = (commission_gross - vat_on_commission).quantize(Decimal('0.01'))
    creator_payout = (value - commission_gross).quantize(Decimal('0.01'))
    return commission_gross, vat_on_commission, commission_net, creator_payout


class GiftsSendThrottle(UserRateThrottle):
    scope = 'gifts_send'


class TopUpCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TopUpCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        package = get_object_or_404(CoinPackage, pk=serializer.validated_data['package_id'])

        # Ensure wallet exists
        Wallet.objects.get_or_create(user=request.user)

        # Create payment with stubbed provider_ref and checkout url
        provider = Payment.Provider.CHAPA
        provider_ref = f"ch_{request.user.id}_{package.id}_{Payment.objects.count()+1}"
        payment = Payment.objects.create(
            user=request.user,
            package=package,
            status=Payment.Status.INITIATED,
            provider=provider,
            provider_ref=provider_ref,
            price_total_etb=package.price_total_etb,
            vat_etb=package.vat_etb,
        )
        payment.checkout_url = _stub_checkout_url(payment)
        payment.save(update_fields=["checkout_url"])

        return Response({
            "checkout_url": payment.checkout_url,
            "payment": PaymentSerializer(payment).data,
        }, status=status.HTTP_201_CREATED)


class ChapaWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw = request.body
        signature = request.headers.get('X-CHAPA-SIGNATURE') or request.headers.get('verif-hash') or request.headers.get('X-Signature')
        if not signature:
            return HttpResponseBadRequest("Missing signature header")

        computed = hmac.new(settings.CHAPA_SECRET.encode('utf-8'), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, computed):
            return HttpResponse(status=401)

        try:
            payload = json.loads(raw.decode('utf-8'))
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON")

        provider_ref = payload.get('provider_ref')
        status_str = payload.get('status', '').lower()
        payment_id = payload.get('payment_id')
        if not provider_ref and not payment_id:
            return HttpResponseBadRequest("Missing provider_ref or payment_id")

        # idempotent processing by provider_ref
        with transaction.atomic():
            payment = None
            if provider_ref:
                payment = Payment.objects.select_for_update().filter(provider_ref=provider_ref).first()
            if payment is None and payment_id:
                payment = Payment.objects.select_for_update().filter(id=payment_id).first()
            if payment is None:
                return HttpResponseBadRequest("Unknown payment")

            if payment.status == Payment.Status.SUCCESS:
                return JsonResponse({"ok": True, "idempotent": True})

            if status_str != 'success':
                # ignore non-success for now (ack)
                return JsonResponse({"ok": True, "ignored": True})

            # Compute gateway fee as residual: total - base - vat
            gw_fee = (payment.price_total_etb - payment.package.base_etb - payment.vat_etb)
            if gw_fee is None:
                gw_fee = Decimal('0.00')

            payment.status = Payment.Status.SUCCESS
            payment.gw_fee_etb = gw_fee
            payment.save(update_fields=["status", "gw_fee_etb", "updated_at"])

            # Credit wallet coins
            wallet, _ = Wallet.objects.get_or_create(user=payment.user)
            before = wallet.coin_balance
            wallet.coin_balance = before + payment.package.coins
            wallet.save(update_fields=["coin_balance", "updated_at"])

            # After commit, notify user wallet updated (best-effort)
            def _emit_wallet_update():
                try:
                    layer = get_channel_layer()
                    if layer:
                        async_to_sync(layer.group_send)(
                            f"user_{payment.user_id}",
                            {
                                "type": "notify",
                                "payload": {
                                    "event": "wallet.updated",
                                    "coin_balance": str(wallet.coin_balance),
                                    "balance_etb": str(wallet.balance_etb),
                                    "hold_etb": str(wallet.hold_etb),
                                },
                            },
                        )
                except Exception:
                    pass
            transaction.on_commit(_emit_wallet_update)

            # Create receipt if not exists
            Receipt.objects.get_or_create(
                payment=payment,
                defaults={
                    "price_etb": payment.price_total_etb,
                    "vat_etb": payment.vat_etb,
                    "provider_ref": payment.provider_ref or provider_ref,
                },
            )

            # Audit log
            AuditLog.objects.create(
                user=payment.user,
                event="PAYMENT_SUCCESS",
                metadata={
                    "payment_id": payment.id,
                    "provider": payment.provider,
                    "provider_ref": payment.provider_ref,
                    "credited_coins": payment.package.coins,
                    "balance_before": before,
                    "balance_after": wallet.coin_balance,
                },
            )

        return JsonResponse({"ok": True})


class ReceiptRetrieveView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        payment = get_object_or_404(Payment, pk=pk, user=request.user)
        receipt = getattr(payment, 'receipt', None)
        if not receipt:
            return Response({"detail": "Receipt not available"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ReceiptSerializer(receipt).data)


class GiftSendView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [GiftsSendThrottle]

    def post(self, request):
        serializer = GiftSendSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        sender = request.user
        recipient_id = serializer.validated_data['recipient_id']
        gift_id = serializer.validated_data['gift_id']

        User = get_user_model()
        recipient = get_object_or_404(User, pk=recipient_id)
        gift = get_object_or_404(Gift, pk=gift_id)

        # Commission and VAT from settings
        commission_rate = Decimal(settings.PLATFORM_COMMISSION_RATE)
        vat_rate = Decimal(settings.VAT_RATE)

        # Transactional operation with row-level locks to avoid double spend
        try:
            with transaction.atomic():
                # Lock wallets
                sender_wallet = Wallet.objects.select_for_update().get_or_create(user=sender)[0]
                recipient_wallet = Wallet.objects.select_for_update().get_or_create(user=recipient)[0]

                if sender_wallet.is_banned:
                    return Response({"detail": "Sender is banned from sending gifts"}, status=status.HTTP_403_FORBIDDEN)

                if sender_wallet.coin_balance < gift.coins:
                    return Response({"detail": "Insufficient coin balance"}, status=status.HTTP_400_BAD_REQUEST)

                # Deduct coins atomically to avoid races
                updated = (
                    Wallet.objects
                    .filter(pk=sender_wallet.pk, coin_balance__gte=gift.coins)
                    .update(coin_balance=F('coin_balance') - gift.coins)
                )
                if updated != 1:
                    return Response({"detail": "Insufficient coin balance"}, status=status.HTTP_400_BAD_REQUEST)
                sender_wallet.refresh_from_db(fields=["coin_balance", "updated_at"])  # reflect new balance

                # Compute split
                commission_gross, vat_on_commission, commission_net, creator_payout = _split_gift_value_inclusive_commission(
                    gift.value_etb, commission_rate, vat_rate
                )

                # Credit recipient earnings
                before = recipient_wallet.balance_etb
                recipient_wallet.balance_etb = (recipient_wallet.balance_etb + creator_payout).quantize(Decimal('0.01'))
                recipient_wallet.save(update_fields=["balance_etb", "updated_at"])

                # Persist transaction
                tx = GiftTransaction.objects.create(
                    sender=sender,
                    recipient=recipient,
                    gift=gift,
                    coins_spent=gift.coins,
                    value_etb=gift.value_etb,
                    commission_gross=commission_gross,
                    vat_on_commission=vat_on_commission,
                    commission_net=commission_net,
                    creator_payout=creator_payout,
                    status=GiftTransaction.Status.SUCCESS,
                )

                # Audit logs
                AuditLog.objects.create(
                    user=sender,
                    event="GIFT_SENT",
                    metadata={
                        "tx_id": tx.id,
                        "gift": gift.name,
                        "coins": gift.coins,
                        "value_etb": str(gift.value_etb),
                        "to": recipient.id,
                    },
                )
                AuditLog.objects.create(
                    user=recipient,
                    event="GIFT_RECEIVED",
                    metadata={
                        "tx_id": tx.id,
                        "gift": gift.name,
                        "coins": gift.coins,
                        "value_etb": str(gift.value_etb),
                        "creator_payout": str(creator_payout),
                        "from": sender.id,
                        "balance_before": str(before),
                        "balance_after": str(recipient_wallet.balance_etb),
                    },
                )

        except Exception as e:
            # Rollback ensured by atomic; record failure log for observability
            AuditLog.objects.create(
                user=sender,
                event="GIFT_SEND_FAILED",
                metadata={"error": str(e), "recipient_id": recipient_id, "gift_id": gift_id},
            )
            return Response({"detail": "Failed to send gift"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Emit realtime events after commit
        def _emit():
            try:
                layer = get_channel_layer()
                if not layer:
                    return
                payload_sender = {
                    "event": "gift.sent",
                    "tx_id": tx.id,
                    "gift": gift.name,
                    "coins": gift.coins,
                    "valueETB": str(gift.value_etb),
                }
                payload_recipient = {
                    "event": "gift.received",
                    "tx_id": tx.id,
                    "gift": gift.name,
                    "coins": gift.coins,
                    "valueETB": str(gift.value_etb),
                    "creator_payout": str(creator_payout),
                }
                # Group naming scheme per user
                async_to_sync(layer.group_send)(f"user_{sender.id}", {"type": "notify", "payload": payload_sender})
                async_to_sync(layer.group_send)(f"user_{recipient.id}", {"type": "notify", "payload": payload_recipient})

                # Also push wallet.updated snapshots
                async_to_sync(layer.group_send)(
                    f"user_{sender.id}",
                    {
                        "type": "notify",
                        "payload": {
                            "event": "wallet.updated",
                            "coin_balance": str(sender_wallet.coin_balance),
                            "balance_etb": str(sender_wallet.balance_etb),
                            "hold_etb": str(sender_wallet.hold_etb),
                        },
                    },
                )
                async_to_sync(layer.group_send)(
                    f"user_{recipient.id}",
                    {
                        "type": "notify",
                        "payload": {
                            "event": "wallet.updated",
                            "coin_balance": str(recipient_wallet.coin_balance),
                            "balance_etb": str(recipient_wallet.balance_etb),
                            "hold_etb": str(recipient_wallet.hold_etb),
                        },
                    },
                )
            except Exception:
                # Best-effort; do not fail main flow
                pass

        transaction.on_commit(_emit)

        return Response({
            "ok": True,
            "coins_spent": gift.coins,
            "creator_payout": str(creator_payout),
        }, status=status.HTTP_200_OK)


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        data = WalletSerializer(wallet).data
        return Response(data)


class GiftListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        gifts = Gift.objects.all().order_by('coins')
        return Response(GiftSerializer(gifts, many=True).data)


class CoinPackageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        packages = CoinPackage.objects.all().order_by('price_total_etb')
        return Response(CoinPackageListSerializer(packages, many=True).data)


class WithdrawRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WithdrawalCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        method = serializer.validated_data['method']
        destination = serializer.validated_data['destination']
        amount = Decimal(serializer.validated_data['amount_etb'])

        # Business validations
        min_withdrawal = Decimal(str(settings.MIN_WITHDRAWAL_ETB))
        if getattr(user, 'wallet', None) is None:
            Wallet.objects.get_or_create(user=user)
        wallet = Wallet.objects.get(user=user)

        if wallet.withdrawals_blocked:
            return Response({"detail": "Withdrawals blocked pending risk review"}, status=status.HTTP_403_FORBIDDEN)
        if wallet.kyc_level < 2:
            return Response({"detail": "KYC level insufficient"}, status=status.HTTP_403_FORBIDDEN)
        if amount < min_withdrawal:
            return Response({"detail": f"Minimum withdrawal is {min_withdrawal}"}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce available funds: available = balance - hold
        available = (wallet.balance_etb - wallet.hold_etb).quantize(Decimal('0.01'))
        if amount > available:
            return Response({"detail": "Insufficient available balance"}, status=status.HTTP_400_BAD_REQUEST)

        # Limits
        max_daily = Decimal(str(getattr(settings, 'MAX_DAILY_WITHDRAWAL_ETB', '5000')))
        max_month = Decimal(str(getattr(settings, 'MAX_MONTHLY_WITHDRAWAL_ETB', '50000')))
        now = timezone.now()
        start_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        def _sum_withdrawals(qs):
            return qs.aggregate(s=Sum('amount_etb'))['s'] or Decimal('0.00')
        qs_user = WithdrawalRequest.objects.filter(user=user, status__in=[
            WithdrawalRequest.Status.PENDING,
            WithdrawalRequest.Status.APPROVED,
            WithdrawalRequest.Status.PAID,
        ])
        total_day = _sum_withdrawals(qs_user.filter(created_at__gte=start_day))
        total_month = _sum_withdrawals(qs_user.filter(created_at__gte=start_month))
        if total_day + amount > max_daily:
            return Response({"detail": "Daily withdrawal limit exceeded"}, status=status.HTTP_400_BAD_REQUEST)
        if total_month + amount > max_month:
            return Response({"detail": "Monthly withdrawal limit exceeded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Re-fetch with lock
                wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
                # Recompute available in transaction
                available = (wallet.balance_etb - wallet.hold_etb).quantize(Decimal('0.01'))
                if amount > available:
                    return Response({"detail": "Insufficient available balance"}, status=status.HTTP_400_BAD_REQUEST)

                # Place amount on hold, do not decrease balance yet
                wallet.hold_etb = (wallet.hold_etb + amount).quantize(Decimal('0.01'))
                wallet.save(update_fields=["hold_etb", "updated_at"])

                wd = WithdrawalRequest.objects.create(
                    user=user,
                    method=method,
                    destination=destination,
                    amount_etb=amount,
                    status=WithdrawalRequest.Status.PENDING,
                )

                AuditLog.objects.create(
                    user=user,
                    event="WITHDRAWAL_REQUESTED",
                    metadata={"withdrawal_id": wd.id, "amount": str(amount), "method": method, "destination": destination},
                )

        except Exception as e:
            return Response({"detail": "Failed to create withdrawal request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Notify admin queue (best-effort)
        try:
            tasks.notify_admin_new_withdrawal(wd.id)
        except Exception:
            pass

        return Response({"ok": True, "withdrawal_id": wd.id}, status=status.HTTP_201_CREATED)


class AdminWithdrawalListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_q = request.GET.get('status')
        qs = WithdrawalRequest.objects.all().order_by('-created_at')
        if status_q:
            qs = qs.filter(status=status_q)
        data = WithdrawalSerializer(qs, many=True).data
        return Response(data)


class AdminWithdrawalApproveView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk: int):
        wd = get_object_or_404(WithdrawalRequest, pk=pk)
        if wd.status != WithdrawalRequest.Status.PENDING:
            return Response({"detail": "Only pending withdrawals can be approved"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            wd.status = WithdrawalRequest.Status.APPROVED
            wd.approved_at = timezone.now()
            wd.save(update_fields=["status", "approved_at", "updated_at"])
            # No wallet change yet; processed in payout task

            AuditLog.objects.create(
                user=wd.user,
                event="WITHDRAWAL_APPROVED",
                metadata={"withdrawal_id": wd.id, "amount": str(wd.amount_etb), "method": wd.method},
            )

        # Trigger payout (synchronously for now)
        try:
            tasks.process_withdrawal_payout(wd.id)
        except Exception as e:
            # Keep APPROVED; payout async could retry
            pass
        return Response({"ok": True})


class AdminWithdrawalRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk: int):
        wd = get_object_or_404(WithdrawalRequest, pk=pk)
        if wd.status != WithdrawalRequest.Status.PENDING:
            return Response({"detail": "Only pending withdrawals can be rejected"}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason') or 'Rejected by admin'
        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=wd.user)
            # Release hold back to available
            wallet.hold_etb = (wallet.hold_etb - wd.amount_etb).quantize(Decimal('0.01'))
            if wallet.hold_etb < 0:
                wallet.hold_etb = Decimal('0.00')
            wallet.save(update_fields=["hold_etb", "updated_at"])

            wd.status = WithdrawalRequest.Status.REJECTED
            wd.failure_reason = reason
            wd.save(update_fields=["status", "failure_reason", "updated_at"])

            AuditLog.objects.create(
                user=wd.user,
                event="WITHDRAWAL_REJECTED",
                metadata={"withdrawal_id": wd.id, "reason": reason},
            )

        # Notify user (best-effort)
        try:
            layer = get_channel_layer()
            if layer:
                async_to_sync(layer.group_send)(f"user_{wd.user_id}", {"type": "notify", "payload": {"event": "withdrawal.rejected", "id": wd.id, "reason": reason}})
        except Exception:
            pass

        # After commit, also notify wallet updated
        def _emit_wallet_update():
            try:
                layer = get_channel_layer()
                if layer:
                    async_to_sync(layer.group_send)(
                        f"user_{wd.user_id}",
                        {
                            "type": "notify",
                            "payload": {
                                "event": "wallet.updated",
                                "coin_balance": str(wallet.coin_balance),
                                "balance_etb": str(wallet.balance_etb),
                                "hold_etb": str(wallet.hold_etb),
                            },
                        },
                    )
            except Exception:
                pass
        transaction.on_commit(_emit_wallet_update)

        return Response({"ok": True})


class KYCSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = KYCSubmitSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        # Prevent multiple pending submissions
        existing = KYCSubmission.objects.filter(user=request.user, status=KYCSubmission.Status.PENDING).first()
        if existing:
            return Response({"detail": "KYC submission already pending", "id": existing.id}, status=status.HTTP_200_OK)

        sub = serializer.save()

        AuditLog.objects.create(
            user=request.user,
            event="KYC_SUBMITTED",
            metadata={"submission_id": sub.id, "doc_type": sub.doc_type},
        )

        return Response(serializer.to_representation(sub), status=status.HTTP_201_CREATED)
