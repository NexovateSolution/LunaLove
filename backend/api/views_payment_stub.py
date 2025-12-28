# Simplified payment views - ready for new payment provider integration
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.utils.crypto import get_random_string
from .models import CoinPackage, CoinPurchase, UserWallet
from .serializers import CoinPackageSerializer
import logging

logger = logging.getLogger(__name__)


class PurchaseCoinsView(APIView):
    """Initialize coin purchase - payment provider to be integrated"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        package_id = request.data.get('package_id')
        
        try:
            package = CoinPackage.objects.get(id=package_id, is_active=True)
        except CoinPackage.DoesNotExist:
            return Response({'error': 'Invalid package'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create coin purchase record
        tx_ref = f"coin-{request.user.id}-{get_random_string(8)}"
        coin_purchase = CoinPurchase.objects.create(
            user=request.user,
            package=package,
            amount_etb=package.price_etb,
            coins_purchased=package.total_coins,
            transaction_ref=tx_ref,
            status='pending'
        )
        
        # TODO: Integrate payment provider here
        # For now, return error indicating payment integration needed
        return Response({
            'error': 'Payment integration pending',
            'message': 'Payment provider not yet configured. Please contact support.',
            'purchase_id': str(coin_purchase.id)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CoinPurchaseStatusView(APIView):
    """Get coin purchase status and details"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        purchase_id = request.query_params.get('purchase_id')
        
        if not purchase_id:
            return Response({'error': 'Purchase ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            coin_purchase = CoinPurchase.objects.get(id=purchase_id, user=request.user)
            wallet, _ = UserWallet.objects.get_or_create(user=request.user)
            
            return Response({
                'transaction_id': str(coin_purchase.id),
                'transaction_ref': coin_purchase.transaction_ref,
                'package_name': coin_purchase.package.name,
                'coins_purchased': coin_purchase.coins_purchased,
                'amount_etb': str(coin_purchase.amount_etb),
                'status': coin_purchase.status,
                'payment_method': coin_purchase.payment_method or 'Pending',
                'created_at': coin_purchase.created_at.isoformat(),
                'completed_at': coin_purchase.completed_at.isoformat() if coin_purchase.completed_at else None,
                'current_balance': wallet.coins
            })
            
        except CoinPurchase.DoesNotExist:
            return Response({'error': 'Purchase not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching purchase status: {e}")
            return Response({'error': 'Failed to fetch purchase details'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
