import factory
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.payments.models import (
    Wallet,
    Gift,
    CoinPackage,
    Payment,
    WithdrawalRequest,
    KYCSubmission,
)


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.com")
    password = factory.PostGenerationMethodCall('set_password', 'pass')


class WalletFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Wallet

    user = factory.SubFactory(UserFactory)
    coin_balance = 0
    balance_etb = Decimal('0.00')
    hold_etb = Decimal('0.00')
    kyc_level = 1


class GiftFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Gift

    name = factory.Sequence(lambda n: f"Gift{n}")
    coins = 10
    value_etb = Decimal('10.00')


class CoinPackageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CoinPackage

    name = factory.Sequence(lambda n: f"Top-up {n}")
    target_net_etb = Decimal('100.00')
    coins = 100
    base_etb = Decimal('100.00')
    vat_etb = Decimal('15.00')
    price_total_etb = Decimal('115.00')


class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Payment

    user = factory.SubFactory(UserFactory)
    package = factory.SubFactory(CoinPackageFactory)
    status = Payment.Status.INITIATED
    provider = Payment.Provider.CHAPA
    provider_ref = factory.Sequence(lambda n: f"ref_{n}")
    price_total_etb = Decimal('115.00')
    vat_etb = Decimal('15.00')
    gw_fee_etb = Decimal('0.00')


class WithdrawalRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = WithdrawalRequest

    user = factory.SubFactory(UserFactory)
    method = WithdrawalRequest.Method.CHAPA
    destination = factory.Sequence(lambda n: f"acct_{n}")
    amount_etb = Decimal('500.00')
    status = WithdrawalRequest.Status.PENDING


class KYCSubmissionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = KYCSubmission

    user = factory.SubFactory(UserFactory)
    doc_type = KYCSubmission.DocType.NID
    # Use dummy files by leveraging SimpleUploadedFile in tests that need actual file objects
    document = factory.django.FileField(filename='doc.png')
    selfie = factory.django.FileField(filename='selfie.png')
