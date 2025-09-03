from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from apps.payments.models import Wallet, Gift, GiftTransaction
from apps.payments.serializers import (
    TopUpCreateSerializer,
    GiftSendSerializer,
    WalletSerializer,
    WithdrawalCreateSerializer,
)


@pytest.mark.django_db
def test_topup_create_serializer_valid_and_invalid():
    from apps.payments.models import CoinPackage

    # Invalid package
    s = TopUpCreateSerializer(data={"package_id": 9999})
    assert not s.is_valid()
    assert "package_id" in s.errors or s.errors

    # Valid package
    pkg = CoinPackage.objects.create(
        name="Top-up 50",
        target_net_etb=Decimal("50.00"),
        coins=50,
        base_etb=Decimal("50.00"),
        vat_etb=Decimal("7.50"),
        price_total_etb=Decimal("57.50"),
    )
    s2 = TopUpCreateSerializer(data={"package_id": pkg.id})
    assert s2.is_valid(), s2.errors


@pytest.mark.django_db
def test_gift_send_serializer_validation_self_and_invalid_gift():
    User = get_user_model()
    sender = User.objects.create_user(username="alice", password="pass")

    rf = APIRequestFactory()
    req = rf.post("/api/gifts/send/")
    req.user = sender

    # Cannot gift yourself
    s = GiftSendSerializer(data={"recipient_id": sender.id, "gift_id": 1}, context={"request": req})
    assert not s.is_valid()

    # Invalid gift id
    s2 = GiftSendSerializer(data={"recipient_id": sender.id + 1, "gift_id": 999}, context={"request": req})
    assert not s2.is_valid()


@pytest.mark.django_db
def test_withdrawal_create_serializer_auth_and_wallet_creation():
    User = get_user_model()
    user = User.objects.create_user(username="bob", password="pass")

    rf = APIRequestFactory()
    req = rf.post("/api/wallet/withdraw/")
    req.user = user

    assert not hasattr(user, "wallet")

    s = WithdrawalCreateSerializer(
        data={"method": "CHAPA", "destination": "acct_x", "amount_etb": "500.00"},
        context={"request": req},
    )
    assert s.is_valid(), s.errors

    # Wallet should exist after validation (serializer ensures get_or_create)
    assert Wallet.objects.filter(user=user).exists()


@pytest.mark.django_db
def test_wallet_serializer_recent_gifts_representation():
    User = get_user_model()
    sender = User.objects.create_user(username="u1", password="pass")
    recipient = User.objects.create_user(username="u2", password="pass")

    # Ensure recipient has a wallet
    Wallet.objects.get_or_create(user=recipient)

    gift = Gift.objects.create(name="Rose", coins=10, value_etb=Decimal("10.00"))

    # Create a gift transaction to show up in recent_gifts
    GiftTransaction.objects.create(
        sender=sender,
        recipient=recipient,
        gift=gift,
        coins_spent=gift.coins,
        value_etb=gift.value_etb,
        commission_gross=Decimal("2.50"),
        vat_on_commission=Decimal("0.38"),
        commission_net=Decimal("2.12"),
        creator_payout=Decimal("7.50"),
        status=GiftTransaction.Status.SUCCESS,
    )

    wallet = Wallet.objects.get(user=recipient)
    data = WalletSerializer(wallet).data

    assert "recent_gifts" in data
    assert isinstance(data["recent_gifts"], list)
    assert len(data["recent_gifts"]) >= 1
    item = data["recent_gifts"][0]
    for key in ("tx_id", "gift", "coins", "valueETB", "creator_payout", "created_at"):
        assert key in item
