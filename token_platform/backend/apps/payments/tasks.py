from celery import shared_task
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from decimal import Decimal
from django.db import transaction
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count

from .models import WithdrawalRequest, Wallet, AuditLog, Payment, GiftTransaction
from .payouts import PayoutAdapter


def notify_admin_new_withdrawal(withdrawal_id: int) -> None:
    """Best-effort notify admin listeners about a new withdrawal."""
    try:
        layer = get_channel_layer()
        if layer:
            async_to_sync(layer.group_send)(
                "admins",
                {
                    "type": "notify",
                    "payload": {"event": "withdrawal.new", "id": withdrawal_id},
                },
            )
    except Exception:
        # Silent best-effort
        pass


@shared_task
def process_withdrawal_payout_task(withdrawal_id: int) -> None:
    process_withdrawal_payout(withdrawal_id)


def process_withdrawal_payout(withdrawal_id: int) -> None:
    """Process payout synchronously; usable in tests/dev without a celery worker.

    Flow:
    - Only proceed if status is APPROVED
    - Call payout adapter to simulate provider payout
    - On success: mark PAID, set provider_ref/paid_at, decrement wallet.balance_etb and wallet.hold_etb
    - Emit audit logs and best-effort user notification
    """
    wd = WithdrawalRequest.objects.select_related("user").get(pk=withdrawal_id)
    if wd.status != WithdrawalRequest.Status.APPROVED:
        return

    # Simulate provider payout
    res = PayoutAdapter.pay(wd)
    provider_ref = res.get("provider_ref")
    status = res.get("status")

    if status != "PAID":
        # In a real system we'd handle retries/failures. For now, leave as APPROVED
        return

    with transaction.atomic():
        # Re-fetch and lock wallet
        wallet = Wallet.objects.select_for_update().get(user=wd.user)

        # Decrement balances
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

    # Notify user
    try:
        layer = get_channel_layer()
        if layer:
            async_to_sync(layer.group_send)(
                f"user_{wd.user_id}",
                {"type": "notify", "payload": {"event": "withdrawal.paid", "id": wd.id, "amount": str(wd.amount_etb)}},
            )
            # Also push wallet updated snapshot
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


# ---- Simple Rule-based Risk Evaluation ----

def _notify_admin_flag(user_id: int, reasons: list[str]):
    try:
        layer = get_channel_layer()
        if layer:
            async_to_sync(layer.group_send)(
                "admins",
                {"type": "notify", "payload": {"event": "risk.flag", "user_id": user_id, "reasons": reasons}},
            )
    except Exception:
        pass


def _within_minutes(dt, minutes: int):
    window_start = timezone.now() - timezone.timedelta(minutes=minutes)
    return {"created_at__gte": window_start}


def evaluate_rules_for_user(user) -> list[str]:
    reasons: list[str] = []

    # Rule 1: Excessive top-ups in short window
    topups_window = int(getattr(settings, "RISK_TOPUPS_WINDOW_MIN", 60))
    topups_count_thr = int(getattr(settings, "RISK_TOPUPS_COUNT", 5))
    topups_recent = Payment.objects.filter(user=user, status=Payment.Status.SUCCESS, **_within_minutes(None, topups_window)).count()
    if topups_recent >= topups_count_thr:
        reasons.append(f"excessive_topups:{topups_recent} in {topups_window}m")

    # Rule 2: Large gifts received in window
    gifts_window = int(getattr(settings, "RISK_GIFTS_ETB_WINDOW_MIN", 60))
    gifts_threshold = Decimal(str(getattr(settings, "RISK_GIFTS_ETB_THRESHOLD", "10000")))
    gifts_sum = GiftTransaction.objects.filter(recipient=user, status=GiftTransaction.Status.SUCCESS, **_within_minutes(None, gifts_window)).aggregate(s=Sum('value_etb'))['s'] or Decimal('0.00')
    if gifts_sum >= gifts_threshold:
        reasons.append(f"large_gifts:{gifts_sum} in {gifts_window}m")

    # Rule 3: Multiple withdrawals to same dest in short period
    wd_thr = int(getattr(settings, "RISK_WITHDRAWALS_SAME_DEST_THRESHOLD", 3))
    lookback_min = 60
    recent_wd = (
        WithdrawalRequest.objects.filter(user=user, **_within_minutes(None, lookback_min))
        .values('destination')
        .annotate(c=Count('id'))
        .order_by('-c')
    )
    if recent_wd and recent_wd[0]['c'] >= wd_thr:
        reasons.append(f"repeat_withdraw_destination:{recent_wd[0]['destination']} x{recent_wd[0]['c']}")

    return reasons


@shared_task
def evaluate_risk_for_user_task(user_id: int) -> None:
    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
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
        _notify_admin_flag(user.id, reasons)
    else:
        if wallet.withdrawals_blocked:
            wallet.withdrawals_blocked = False
            wallet.save(update_fields=["withdrawals_blocked", "updated_at"])
        AuditLog.objects.create(user=user, event="RISK_CLEARED", metadata={})


@shared_task
def evaluate_risk_all_users_task() -> None:
    User = get_user_model()
    for user in User.objects.all().only('id'):
        try:
            evaluate_risk_for_user(user)
        except Exception:
            continue
