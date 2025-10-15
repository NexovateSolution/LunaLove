from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone
from .storage import EncryptedFileSystemStorage


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class CoinPackage(TimeStampedModel):
    """A coin package a user can purchase. target_net_etb is the net top-up credited.

    price_total_etb is what the customer pays (gross), computed via money utils
    including VAT and gateway fees.
    """

    name = models.CharField(max_length=100, unique=True)
    target_net_etb = models.DecimalField(max_digits=12, decimal_places=2, db_index=True, unique=True)
    coins = models.PositiveIntegerField(default=0)
    base_etb = models.DecimalField(max_digits=12, decimal_places=2)
    vat_etb = models.DecimalField(max_digits=12, decimal_places=2)
    price_total_etb = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.name} (net {self.target_net_etb} ETB, total {self.price_total_etb} ETB)"


class Gift(TimeStampedModel):
    """A catalog gift priced in coins with a reference ETB value for display/settlement."""

    name = models.CharField(max_length=255, unique=True)
    coins = models.PositiveIntegerField()
    value_etb = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.name} — {self.coins} coins (~{self.value_etb} ETB)"


class Wallet(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    coin_balance = models.PositiveIntegerField(default=0)
    # Whether the user is banned from sending gifts or transacting
    is_banned = models.BooleanField(default=False)
    # Creator earnings/payout balance in ETB
    balance_etb = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    # Held funds reserved for pending withdrawals
    hold_etb = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    # Simple KYC level flag
    kyc_level = models.PositiveSmallIntegerField(default=1)
    # If true, withdrawals are blocked pending risk review
    withdrawals_blocked = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"Wallet<{self.user_id}>: {self.coin_balance} coins"


class Payment(TimeStampedModel):
    class Status(models.TextChoices):
        INITIATED = 'INITIATED', 'Initiated'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'

    class Provider(models.TextChoices):
        CHAPA = 'CHAPA', 'Chapa'
        TELEBIRR = 'TELEBIRR', 'Telebirr'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    package = models.ForeignKey(CoinPackage, on_delete=models.PROTECT, related_name='payments')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INITIATED, db_index=True)
    provider = models.CharField(max_length=20, choices=Provider.choices)
    provider_ref = models.CharField(max_length=128, unique=True, null=True, blank=True)
    checkout_url = models.URLField(null=True, blank=True)

    # Pricing fields (ETB)
    price_total_etb = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    vat_etb = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    gw_fee_etb = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def __str__(self) -> str:
        return f"Payment<{self.pk}> {self.status} {self.provider} ref={self.provider_ref}"


class Receipt(TimeStampedModel):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    price_etb = models.DecimalField(max_digits=12, decimal_places=2)
    vat_etb = models.DecimalField(max_digits=12, decimal_places=2)
    provider_ref = models.CharField(max_length=128)

    def __str__(self) -> str:
        return f"Receipt<{self.pk}> for Payment {self.payment_id}"


class AuditLog(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='audit_logs')
    event = models.CharField(max_length=64)
    metadata = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"AuditLog<{self.pk}> {self.event} user={self.user_id}"


class GiftTransaction(TimeStampedModel):
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_gifts')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_gifts')
    gift = models.ForeignKey('payments.Gift', on_delete=models.PROTECT, related_name='transactions')

    # Costs and values
    coins_spent = models.PositiveIntegerField()
    value_etb = models.DecimalField(max_digits=12, decimal_places=2)

    # Commission split
    commission_gross = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    vat_on_commission = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    commission_net = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    creator_payout = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.SUCCESS)
    failure_reason = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self) -> str:
        return f"GiftTx<{self.pk}> {self.gift_id} {self.sender_id}->{self.recipient_id} {self.status}"


class WithdrawalRequest(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        PAID = 'PAID', 'Paid'

    class Method(models.TextChoices):
        CHAPA = 'CHAPA', 'Chapa'
        TELEBIRR = 'TELEBIRR', 'Telebirr'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawals')
    method = models.CharField(max_length=16, choices=Method.choices)
    destination = models.CharField(max_length=255)
    amount_etb = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    provider_ref = models.CharField(max_length=128, null=True, blank=True)
    failure_reason = models.CharField(max_length=255, null=True, blank=True)

    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"Withdrawal<{self.pk}> {self.user_id} {self.amount_etb} {self.status}"


class KYCSubmission(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    class DocType(models.TextChoices):
        NID = 'NID', 'National ID'
        PASSPORT = 'PASSPORT', 'Passport'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc_submissions')
    doc_type = models.CharField(max_length=16, choices=DocType.choices)
    document = models.FileField(upload_to='kyc/documents/', storage=EncryptedFileSystemStorage())
    selfie = models.FileField(upload_to='kyc/selfies/', storage=EncryptedFileSystemStorage())
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True)
    notes = models.TextField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='kyc_reviews')

    def __str__(self) -> str:
        return f"KYC<{self.pk}> {self.user_id} {self.doc_type} {self.status}"
