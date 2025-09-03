import hmac
import hashlib
import json
from decimal import Decimal
import pytest
from django.urls import reverse
from django.test import override_settings
from rest_framework.test import APIClient

from apps.payments.models import CoinPackage, Payment, Wallet, Receipt


@pytest.mark.django_db
@override_settings(CHAPA_SECRET="testsecret")
def test_chapa_webhook_idempotent_flow(django_user_model):
    # Create user
    user = django_user_model.objects.create_user(username="alice", password="pass123")

    # Create a coin package
    pkg = CoinPackage.objects.create(
        name="Top-up 100 ETB",
        target_net_etb=Decimal("100.00"),
        coins=100,
        base_etb=Decimal("100.00"),
        vat_etb=Decimal("15.00"),
        price_total_etb=Decimal("115.00"),
    )

    client = APIClient()
    client.force_authenticate(user=user)

    # Initiate top-up
    resp = client.post(
        "/api/coins/topup/",
        {"package_id": pkg.id},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    payment_id = resp.data["payment"]["id"]
    provider_ref = resp.data["payment"]["provider_ref"]

    # Wallet should exist
    wallet = Wallet.objects.get(user=user)
    before = wallet.coin_balance
    assert before == 0

    # Prepare webhook payload
    payload = {
        "provider_ref": provider_ref,
        "status": "success",
        "payment_id": payment_id,
    }
    raw = json.dumps(payload).encode("utf-8")
    signature = hmac.new(b"testsecret", raw, hashlib.sha256).hexdigest()

    # First webhook call
    w1 = client.post(
        "/webhooks/chapa/",
        data=raw,
        content_type="application/json",
        HTTP_X_CHAPA_SIGNATURE=signature,
    )
    assert w1.status_code == 200, w1.content

    wallet.refresh_from_db()
    assert wallet.coin_balance == before + pkg.coins

    payment = Payment.objects.get(id=payment_id)
    assert payment.status == Payment.Status.SUCCESS

    # Receipt exists
    assert Receipt.objects.filter(payment=payment).exists()

    # Receipt retrieval endpoint
    r = client.get(f"/api/payments/{payment_id}/receipt/")
    assert r.status_code == 200
    assert r.data["provider_ref"] == provider_ref

    # Second identical webhook (idempotent)
    w2 = client.post(
        "/webhooks/chapa/",
        data=raw,
        content_type="application/json",
        HTTP_X_CHAPA_SIGNATURE=signature,
    )
    assert w2.status_code == 200

    wallet.refresh_from_db()
    assert wallet.coin_balance == before + pkg.coins, "Balance must not double-credit"
