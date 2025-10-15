from django.utils import timezone


class PayoutAdapter:
    """Simple payout adapter stub. Replace with real Chapa/Telebirr integrations later.

    For now, always returns PAID with a synthetic provider_ref.
    """

    @staticmethod
    def pay(withdrawal_request) -> dict:
        ts = timezone.now().strftime('%Y%m%d%H%M%S')
        return {
            "status": "PAID",
            "provider_ref": f"STUB-{withdrawal_request.id}-{ts}",
        }
