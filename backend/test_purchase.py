import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shebalove_project.settings')
django.setup()

from api.models import CoinPackage, CoinPurchase, User
from django.utils.crypto import get_random_string

# Test creating a purchase
try:
    user = User.objects.first()
    package = CoinPackage.objects.filter(is_active=True).first()
    
    if not user:
        print("ERROR: No users found in database")
    elif not package:
        print("ERROR: No active coin packages found")
    else:
        print(f"User: {user.username}")
        print(f"Package: {package.name}")
        
        # Try to create a purchase
        tx_ref = f"coin-{user.id}-{get_random_string(8)}"
        coin_purchase = CoinPurchase.objects.create(
            user=user,
            package=package,
            amount_etb=package.price_etb,
            coins_purchased=package.total_coins,
            transaction_ref=tx_ref,
            payment_method='Chapa'
        )
        print(f"✅ Purchase created successfully: {coin_purchase.id}")
        print(f"Transaction ref: {coin_purchase.transaction_ref}")
        
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
