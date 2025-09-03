from rest_framework import serializers
from .models import CoinPackage, Payment, Receipt, Gift, Wallet, GiftTransaction, WithdrawalRequest, KYCSubmission


class TopUpCreateSerializer(serializers.Serializer):
    package_id = serializers.IntegerField()

    def validate_package_id(self, value):
        if not CoinPackage.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid package_id")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "status",
            "provider",
            "provider_ref",
            "checkout_url",
            "price_total_etb",
            "vat_etb",
            "gw_fee_etb",
            "created_at",
        ]


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = [
            "id",
            "payment",
            "price_etb",
            "vat_etb",
            "provider_ref",
            "created_at",
        ]


class GiftSendSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField()
    gift_id = serializers.IntegerField()

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication required")

        recipient_id = attrs.get('recipient_id')
        gift_id = attrs.get('gift_id')

        if user.id == recipient_id:
            raise serializers.ValidationError("Cannot gift yourself")

        if not Gift.objects.filter(id=gift_id).exists():
            raise serializers.ValidationError({"gift_id": "Invalid gift_id"})

        return attrs


class WalletSerializer(serializers.ModelSerializer):
    recent_gifts = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = [
            "coin_balance",
            "balance_etb",
            "hold_etb",
            "kyc_level",
            "recent_gifts",
        ]

    def get_recent_gifts(self, obj: Wallet):
        qs = GiftTransaction.objects.filter(recipient=obj.user).order_by('-created_at')[:10]
        return [
            {
                "tx_id": tx.id,
                "gift": tx.gift.name,
                "coins": tx.coins_spent,
                "valueETB": str(tx.value_etb),
                "creator_payout": str(tx.creator_payout),
                "created_at": tx.created_at.isoformat(),
            }
            for tx in qs
        ]


class GiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gift
        fields = ["id", "name", "coins", "value_etb"]


class CoinPackageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinPackage
        fields = [
            "id",
            "name",
            "coins",
            "base_etb",
            "vat_etb",
            "price_total_etb",
        ]


class WithdrawalCreateSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=WithdrawalRequest.Method.choices)
    destination = serializers.CharField(max_length=255)
    amount_etb = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        if not hasattr(user, 'wallet'):
            Wallet.objects.get_or_create(user=user)
        return attrs


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user', 'method', 'destination', 'amount_etb', 'status', 'provider_ref', 'created_at', 'approved_at', 'paid_at'
        ]


class KYCSubmitSerializer(serializers.Serializer):
    doc_type = serializers.ChoiceField(choices=KYCSubmission.DocType.choices)
    document = serializers.FileField()
    selfie = serializers.FileField()

    def create(self, validated_data):
        user = self.context['request'].user
        return KYCSubmission.objects.create(user=user, **validated_data)

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "status": instance.status,
            "created_at": instance.created_at.isoformat(),
        }
