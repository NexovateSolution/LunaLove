import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.payments.models import Wallet, WithdrawalRequest


@pytest.mark.django_db(transaction=True)
def test_wallet_get_and_withdraw_kyc_enforced(settings):
    User = get_user_model()
    user = User.objects.create_user(username='carol', password='pass')
    wallet, _ = Wallet.objects.get_or_create(user=user)
    wallet.balance_etb = Decimal('1000.00')
    wallet.kyc_level = 1  # below threshold
    wallet.save()

    client = APIClient()
    client.force_authenticate(user=user)

    # Wallet endpoint works
    r = client.get('/api/wallet/')
    assert r.status_code == 200
    body = r.json()
    assert 'balance_etb' in body and 'hold_etb' in body and 'recent_gifts' in body

    # Withdrawal should be blocked by KYC
    r = client.post('/api/wallet/withdraw/', {
        'method': 'CHAPA',
        'destination': 'acc_123',
        'amount_etb': '600.00',
    }, format='json')
    assert r.status_code == 403


@pytest.mark.django_db(transaction=True)
def test_withdraw_approve_and_paid_flow(settings):
    User = get_user_model()
    user = User.objects.create_user(username='dave', password='pass')
    wallet, _ = Wallet.objects.get_or_create(user=user)
    wallet.balance_etb = Decimal('1200.00')
    wallet.kyc_level = 2
    wallet.save()

    client = APIClient()
    client.force_authenticate(user=user)

    # Create withdrawal
    r = client.post('/api/wallet/withdraw/', {
        'method': 'CHAPA',
        'destination': 'acc_987',
        'amount_etb': '600.00',
    }, format='json')
    assert r.status_code == 201, r.content
    wd_id = r.json()['withdrawal_id']

    wallet.refresh_from_db()
    assert wallet.hold_etb == Decimal('600.00')
    assert wallet.balance_etb == Decimal('1200.00')  # not deducted yet

    # Admin approves
    admin = User.objects.create_superuser(username='admin', password='adminpass', email='a@a.com')
    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)

    r = admin_client.post(f'/api/admin/withdrawals/{wd_id}/approve')
    assert r.status_code == 200

    # After approval, payout adapter marks PAID and wallet is decremented
    wallet.refresh_from_db()
    wd = WithdrawalRequest.objects.get(pk=wd_id)
    assert wd.status == WithdrawalRequest.Status.PAID
    assert wallet.balance_etb == Decimal('600.00')
    assert wallet.hold_etb == Decimal('0.00')


@pytest.mark.django_db(transaction=True)
def test_withdraw_reject_releases_hold(settings):
    User = get_user_model()
    user = User.objects.create_user(username='erin', password='pass')
    wallet, _ = Wallet.objects.get_or_create(user=user)
    wallet.balance_etb = Decimal('800.00')
    wallet.kyc_level = 2
    wallet.save()

    client = APIClient()
    client.force_authenticate(user=user)

    r = client.post('/api/wallet/withdraw/', {
        'method': 'TELEBIRR',
        'destination': 'msisdn_911',
        'amount_etb': '500.00',
    }, format='json')
    assert r.status_code == 201
    wd_id = r.json()['withdrawal_id']

    wallet.refresh_from_db()
    assert wallet.hold_etb == Decimal('500.00')

    admin = User.objects.create_superuser(username='admin2', password='adminpass', email='b@b.com')
    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)

    r = admin_client.post(f'/api/admin/withdrawals/{wd_id}/reject', {"reason": "Bad account"}, format='json')
    assert r.status_code == 200

    wallet.refresh_from_db()
    wd = WithdrawalRequest.objects.get(pk=wd_id)
    assert wd.status == WithdrawalRequest.Status.REJECTED
    assert wallet.hold_etb == Decimal('0.00')
    assert wallet.balance_etb == Decimal('800.00')
