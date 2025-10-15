try:  # Optional Celery
    from celery import shared_task  # type: ignore
except Exception:  # pragma: no cover
    def shared_task(func=None, *args, **kwargs):
        if func is None:
            def wrapper(f):
                return f
            return wrapper
        return func

from django.utils import timezone
from asgiref.sync import async_to_sync

try:
    from channels.layers import get_channel_layer  # type: ignore
except Exception:  # pragma: no cover
    def get_channel_layer():
        return None

from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Count

from .models import WithdrawalRequest, Wallet, AuditLog, Payment, GiftTransaction
from .payouts import PayoutAdapter


def notify_admin_new_withdrawal(withdrawal_id: int) -> None:
    try:
        layer = get_channel_layer()
        if layer:
            async_to_sync(layer.group_send)(
                "admins",
                {"type": "notify", "payload": {"event": "withdrawal.new", "id": withdrawal_id}},
            )
    except Exception:
        pass


@shared_task
def process_withdrawal_payout_task(withdrawal_id: int) -> None:
    process_withdrawal_payout(withdrawal_id)


def process_withdrawal_payout(withdrawal_id: int) -> None:
    wd = WithdrawalRequest.objects.select_related("user").get(pk=withdrawal_id)
    if wd.status != WithdrawalRequest.Status.APPROVED:
        return

    res = PayoutAdapter.pay(wd)
    provider_ref = res.get("provider_ref")
    status = res.get("status")
    if status != "PAID":
        return

    with transaction.atomic():
        wallet = Wallet.objects.select_for_update().get(user=wd.user)
        amount = Decimal(wd.amount_etb).quantize(Decimal('0.01'))
        wallet.balance_etb = (wallet.balance_etb - amount).quantize(Decimal('0.01'))
        wallet.hold_etb = (wallet.hold_etb - amount).quantize(Decimal('0.01'))
        if wallet.hold_etb < 0:
            wallet.hold_etb = Decimal('0.00')
        wallet.save(update_fields=["balance_etb", "hold_etb", "updated_at"]) 

        wd.status = WithdrawalRequest.Status.PAID
        wd.provider_ref = provider_ref
        wd.paid_at = timezone.now()
        wd.save(update_fields=["status", "provider_ref", "paid_at", "updated_at"]) 

        AuditLog.objects.create(
            user=wd.user,
            event="WITHDRAWAL_PAID",
            metadata={"withdrawal_id": wd.id, "amount": str(amount), "provider_ref": provider_ref},
        )

    try:
        layer = get_channel_layer()
        if layer:
            async_to_sync(layer.group_send)(
                f"user_{wd.user_id}",
                {"type": "notify", "payload": {"event": "withdrawal.paid", "id": wd.id, "amount": str(wd.amount_etb)}}
            )
            async_to_sync(layer.group_send)(
                f"user_{wd.user_id}",
                {"type": "notify", "payload": {"event": "wallet.updated"}}
            )
    except Exception:
        pass


def _within_minutes(minutes: int):
    return {"created_at__gte": timezone.now() - timezone.timedelta(minutes=minutes)}


def evaluate_rules_for_user(user) -> list[str]:
    reasons: list[str] = []
    topups_recent = Payment.objects.filter(user=user, status=Payment.Status.SUCCESS, **_within_minutes(60)).count()
    if topups_recent >= 5:
        reasons.append(f"excessive_topups:{topups_recent} in 60m")

    gifts_sum = GiftTransaction.objects.filter(recipient=user, status=GiftTransaction.Status.SUCCESS, **_within_minutes(60)).aggregate(s=Sum('value_etb'))['s'] or Decimal('0.00')
    if gifts_sum >= Decimal('10000'):
        reasons.append(f"large_gifts:{gifts_sum} in 60m")

    recent_wd = (
        WithdrawalRequest.objects.filter(user=user, **_within_minutes(60))
        .values('destination')
        .annotate(c=Count('id'))
        .order_by('-c')
    )
    if recent_wd and recent_wd[0]['c'] >= 3:
        reasons.append(f"repeat_withdraw_destination:{recent_wd[0]['destination']} x{recent_wd[0]['c']}")
    return reasons


@shared_task
def evaluate_risk_for_user_task(user_id: int) -> None:
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(pk=user_id)
    except Exception:
        return
    evaluate_risk_for_user(user)


def evaluate_risk_for_user(user) -> None:
    reasons = evaluate_rules_for_user(user)
    wallet, _ = Wallet.objects.get_or_create(user=user)
    if reasons:
        if not wallet.withdrawals_blocked:
            wallet.withdrawals_blocked = True
            wallet.save(update_fields=["withdrawals_blocked", "updated_at"])
        AuditLog.objects.create(user=user, event="RISK_FLAGGED", metadata={"reasons": reasons})
    else:
        if wallet.withdrawals_blocked:
            wallet.withdrawals_blocked = False
            wallet.save(update_fields=["withdrawals_blocked", "updated_at"])
        AuditLog.objects.create(user=user, event="RISK_CLEARED", metadata={})
