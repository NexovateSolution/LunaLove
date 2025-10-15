from django.contrib import admin
from django.utils import timezone
from django.db import transaction
from .models import CoinPackage, Gift, Wallet, Payment, Receipt, AuditLog, GiftTransaction, WithdrawalRequest, KYCSubmission
from . import tasks


@admin.register(CoinPackage)
class CoinPackageAdmin(admin.ModelAdmin):
    list_display = ("name", "coins", "target_net_etb", "base_etb", "vat_etb", "price_total_etb", "created_at")
    search_fields = ("name",)
    list_filter = ("created_at",)


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = ("name", "coins", "value_etb", "created_at")
    search_fields = ("name",)
    list_filter = ("created_at",)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("user", "coin_balance", "balance_etb", "kyc_level", "withdrawals_blocked", "is_banned", "created_at", "updated_at")
    search_fields = ("user__username", "user__email")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "provider",
        "status",
        "provider_ref",
        "price_total_etb",
        "vat_etb",
        "gw_fee_etb",
        "created_at",
    )
    search_fields = ("provider_ref", "user__username", "user__email")
    list_filter = ("provider", "status", "created_at")


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ("id", "payment", "price_etb", "vat_etb", "provider_ref", "created_at")
    search_fields = ("provider_ref",)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "event", "occurred_at")
    search_fields = ("event", "user__username", "user__email")
    list_filter = ("event", "occurred_at")


@admin.register(GiftTransaction)
class GiftTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "sender",
        "recipient",
        "gift",
        "coins_spent",
        "value_etb",
        "creator_payout",
        "status",
        "created_at",
    )
    search_fields = ("sender__username", "recipient__username", "gift__name")
    list_filter = ("status", "created_at")


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user", "method", "destination", "amount_etb", "status", "provider_ref", "created_at"
    )
    search_fields = ("user__username", "destination", "provider_ref")
    list_filter = ("status", "method", "created_at")
    actions = ("approve_withdrawals", "reject_withdrawals", "rerun_payouts",)

    def approve_withdrawals(self, request, queryset):
        count = 0
        for wd in queryset.select_related("user"):
            if wd.status != WithdrawalRequest.Status.PENDING:
                continue
            with transaction.atomic():
                wd.status = WithdrawalRequest.Status.APPROVED
                wd.approved_at = timezone.now()
                wd.save(update_fields=["status", "approved_at", "updated_at"])
                AuditLog.objects.create(
                    user=wd.user,
                    event="WITHDRAWAL_APPROVED",
                    metadata={"withdrawal_id": wd.id, "amount": str(wd.amount_etb), "method": wd.method},
                )
            try:
                tasks.process_withdrawal_payout(wd.id)
            except Exception:
                pass
            count += 1
        self.message_user(request, f"Approved {count} withdrawal(s). Payouts triggered.")
    approve_withdrawals.short_description = "Approve selected withdrawals"

    def reject_withdrawals(self, request, queryset):
        reason = request.POST.get("reason", "Rejected by admin via Django action")
        count = 0
        for wd in queryset.select_related("user"):
            if wd.status != WithdrawalRequest.Status.PENDING:
                continue
            with transaction.atomic():
                wallet = Wallet.objects.select_for_update().get(user=wd.user)
                wallet.hold_etb = (wallet.hold_etb - wd.amount_etb)
                from decimal import Decimal
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
            count += 1
        self.message_user(request, f"Rejected {count} withdrawal(s). Holds released.")
    reject_withdrawals.short_description = "Reject selected withdrawals (releases holds)"

    def rerun_payouts(self, request, queryset):
        count = 0
        for wd in queryset:
            if wd.status == WithdrawalRequest.Status.APPROVED:
                try:
                    tasks.process_withdrawal_payout(wd.id)
                    count += 1
                except Exception:
                    continue
        self.message_user(request, f"Re-triggered payout for {count} approved withdrawal(s).")
    rerun_payouts.short_description = "Re-run payout for APPROVED withdrawals"


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "doc_type", "status", "created_at", "reviewed_at")
    search_fields = ("user__username", "user__email")
    list_filter = ("status", "doc_type", "created_at")
    readonly_fields = ("document", "selfie", "created_at")

    actions = ("mark_verified", "mark_rejected")

    def mark_verified(self, request, queryset):
        updated = 0
        for sub in queryset:
            if sub.status != KYCSubmission.Status.VERIFIED:
                sub.status = KYCSubmission.Status.VERIFIED
                sub.reviewed_at = timezone.now()
                sub.reviewed_by = request.user
                sub.save(update_fields=["status", "reviewed_at", "reviewed_by", "updated_at"])
                wallet, _ = Wallet.objects.get_or_create(user=sub.user)
                if wallet.kyc_level < 2:
                    wallet.kyc_level = 2
                    wallet.save(update_fields=["kyc_level", "updated_at"])
                updated += 1
        self.message_user(request, f"Marked {updated} submission(s) as VERIFIED and updated wallets.")

    def mark_rejected(self, request, queryset):
        updated = queryset.update(status=KYCSubmission.Status.REJECTED, reviewed_at=timezone.now(), reviewed_by=request.user)
        self.message_user(request, f"Marked {updated} submission(s) as REJECTED.")
    mark_verified.short_description = "Verify selected KYC submissions"
    mark_rejected.short_description = "Reject selected KYC submissions"
