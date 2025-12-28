from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import UserWallet

User = get_user_model()


class Command(BaseCommand):
    help = 'Add demo coins to a user for testing'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='User email')
        parser.add_argument('--coins', type=int, default=1000, help='Number of coins to add')

    def handle(self, *args, **options):
        email = options.get('email')
        coins = options.get('coins')
        
        if not email:
            self.stdout.write(self.style.ERROR('Please provide --email argument'))
            return
        
        try:
            user = User.objects.get(email=email)
            wallet, created = UserWallet.objects.get_or_create(user=user)
            
            old_coins = wallet.coins
            wallet.coins += coins
            wallet.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Added {coins} coins to {user.first_name} ({email})\n'
                    f'   Previous: {old_coins} coins\n'
                    f'   New total: {wallet.coins} coins'
                )
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ User with email {email} not found')
            )
