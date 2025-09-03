import threading
from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.payments.models import Wallet, Gift, GiftTransaction


@pytest.mark.django_db(transaction=True)
def test_gift_send_success_and_split(settings):
    User = get_user_model()
    sender = User.objects.create_user(username='alice', password='pass')
    recipient = User.objects.create_user(username='bob', password='pass')

    # Gift worth 100 ETB, 25% commission, 15% VAT on commission
    gift = Gift.objects.create(name='Rose', coins=100, value_etb=Decimal('100.00'))

    sender_wallet, _ = Wallet.objects.get_or_create(user=sender)
    recipient_wallet, _ = Wallet.objects.get_or_create(user=recipient)

    sender_wallet.coin_balance = gift.coins
    sender_wallet.save()

    client = APIClient()
    client.force_authenticate(user=sender)

    resp = client.post('/api/gifts/send/', {"recipient_id": recipient.id, "gift_id": gift.id}, format='json')
    assert resp.status_code == 200, resp.content

    sender_wallet.refresh_from_db()
    recipient_wallet.refresh_from_db()

    # Coins deducted once
    assert sender_wallet.coin_balance == 0

    # Creator payout = value - commission_gross = 100 - 25 = 75.00
    assert recipient_wallet.balance_etb == Decimal('75.00')

    # Transaction recorded
    tx = GiftTransaction.objects.get()
    assert tx.coins_spent == gift.coins
    assert tx.value_etb == gift.value_etb
    assert tx.commission_gross == Decimal('25.00')
    assert tx.vat_on_commission == Decimal('3.75')
    assert tx.commission_net == Decimal('21.25')
    assert tx.creator_payout == Decimal('75.00')
    assert tx.status == GiftTransaction.Status.SUCCESS


@pytest.mark.django_db(transaction=True)
def test_gift_send_concurrent_race_allows_single_spend(settings):
    User = get_user_model()
    sender = User.objects.create_user(username='alice2', password='pass')
    recipient = User.objects.create_user(username='bob2', password='pass')

    gift = Gift.objects.create(name='Crown', coins=50, value_etb=Decimal('20.00'))

    sender_wallet, _ = Wallet.objects.get_or_create(user=sender)
    recipient_wallet, _ = Wallet.objects.get_or_create(user=recipient)

    sender_wallet.coin_balance = gift.coins  # Enough for exactly one send
    sender_wallet.save()

    client1 = APIClient()
    client1.force_authenticate(user=sender)
    client2 = APIClient()
    client2.force_authenticate(user=sender)

    results = []

    def do_send(c):
        r = c.post('/api/gifts/send/', {"recipient_id": recipient.id, "gift_id": gift.id}, format='json')
        results.append(r.status_code)

    t1 = threading.Thread(target=do_send, args=(client1,))
    t2 = threading.Thread(target=do_send, args=(client2,))
    t1.start(); t2.start()
    t1.join(); t2.join()

    # Exactly one success, one failure (insufficient coins)
    assert sorted(results) == [200, 400]

    sender_wallet.refresh_from_db()
    recipient_wallet.refresh_from_db()

    assert sender_wallet.coin_balance == 0
    # creator payout = 20 - 5 = 15
    assert recipient_wallet.balance_etb in (Decimal('15.00'), Decimal('15'))
    assert GiftTransaction.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_gift_send_rollback_on_failure(monkeypatch):
    User = get_user_model()
    sender = User.objects.create_user(username='alice3', password='pass')
    recipient = User.objects.create_user(username='bob3', password='pass')

    gift = Gift.objects.create(name='FailGift', coins=10, value_etb=Decimal('10.00'))

    sender_wallet, _ = Wallet.objects.get_or_create(user=sender)
    recipient_wallet, _ = Wallet.objects.get_or_create(user=recipient)

    sender_wallet.coin_balance = gift.coins
    sender_wallet.save()

    # Force failure when creating tx to trigger atomic rollback
    def raise_on_create(*args, **kwargs):
        raise RuntimeError('boom')

    monkeypatch.setattr(GiftTransaction.objects, 'create', raise_on_create)

    client = APIClient()
    client.force_authenticate(user=sender)

    resp = client.post('/api/gifts/send/', {"recipient_id": recipient.id, "gift_id": gift.id}, format='json')
    assert resp.status_code == 500

    # Ensure rollback
    sender_wallet.refresh_from_db()
    recipient_wallet.refresh_from_db()

    assert sender_wallet.coin_balance == gift.coins
    assert recipient_wallet.balance_etb == Decimal('0.00')
    assert GiftTransaction.objects.count() == 0
