from django.core.management.base import BaseCommand
from api.models import CoinPackage, GiftType, PlatformSettings
from decimal import Decimal


class Command(BaseCommand):
    help = 'Set up the gift system with initial data'

    def handle(self, *args, **options):
        self.stdout.write('Setting up gift system...')
        
        # Create platform settings
        platform_settings, created = PlatformSettings.objects.get_or_create(
            defaults={
                'owner_bank_code': '128',  # Example bank code
                'owner_account_number': '1234567890',
                'owner_account_name': 'LunaLove Platform',
                'owner_business_name': 'LunaLove Dating Platform',
                'default_platform_cut': Decimal('30.00'),
                'min_withdrawal_etb': Decimal('100.00'),
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Platform settings created'))
        else:
            self.stdout.write('ℹ️ Platform settings already exist')

        # Create coin packages
        coin_packages = [
            {
                'name': 'Starter Pack',
                'coins': 100,
                'price_etb': Decimal('50.00'),
                'bonus_coins': 10,
            },
            {
                'name': 'Popular Pack',
                'coins': 250,
                'price_etb': Decimal('100.00'),
                'bonus_coins': 50,
            },
            {
                'name': 'Premium Pack',
                'coins': 500,
                'price_etb': Decimal('180.00'),
                'bonus_coins': 100,
            },
            {
                'name': 'VIP Pack',
                'coins': 1000,
                'price_etb': Decimal('300.00'),
                'bonus_coins': 250,
            },
            {
                'name': 'Ultimate Pack',
                'coins': 2500,
                'price_etb': Decimal('650.00'),
                'bonus_coins': 750,
            },
        ]

        for package_data in coin_packages:
            package, created = CoinPackage.objects.get_or_create(
                name=package_data['name'],
                defaults=package_data
            )
            if created:
                self.stdout.write(f'✅ Created coin package: {package.name}')

        # Create gift types
        gift_types = [
            {
                'name': 'Rose',
                'description': 'A beautiful red rose to show your affection',
                'icon': '🌹',
                'coin_cost': 10,
                'etb_value': Decimal('5.00'),
            },
            {
                'name': 'Heart',
                'description': 'Send your love with a heart',
                'icon': '❤️',
                'coin_cost': 15,
                'etb_value': Decimal('7.50'),
            },
            {
                'name': 'Kiss',
                'description': 'Blow a kiss to someone special',
                'icon': '💋',
                'coin_cost': 20,
                'etb_value': Decimal('10.00'),
            },
            {
                'name': 'Chocolate',
                'description': 'Sweet chocolate for your sweet person',
                'icon': '🍫',
                'coin_cost': 25,
                'etb_value': Decimal('12.50'),
            },
            {
                'name': 'Teddy Bear',
                'description': 'A cuddly teddy bear to show you care',
                'icon': '🧸',
                'coin_cost': 50,
                'etb_value': Decimal('25.00'),
            },
            {
                'name': 'Diamond Ring',
                'description': 'A sparkling diamond ring for someone precious',
                'icon': '💍',
                'coin_cost': 100,
                'etb_value': Decimal('50.00'),
            },
            {
                'name': 'Crown',
                'description': 'Crown your queen or king',
                'icon': '👑',
                'coin_cost': 200,
                'etb_value': Decimal('100.00'),
            },
            {
                'name': 'Luxury Car',
                'description': 'The ultimate luxury gift',
                'icon': '🚗',
                'coin_cost': 500,
                'etb_value': Decimal('250.00'),
            },
        ]

        for gift_data in gift_types:
            gift_type, created = GiftType.objects.get_or_create(
                name=gift_data['name'],
                defaults=gift_data
            )
            if created:
                self.stdout.write(f'✅ Created gift type: {gift_type.icon} {gift_type.name}')

        self.stdout.write(self.style.SUCCESS('\n🎉 Gift system setup complete!'))
        self.stdout.write('\n📊 Summary:')
        self.stdout.write(f'   • Coin Packages: {CoinPackage.objects.count()}')
        self.stdout.write(f'   • Gift Types: {GiftType.objects.count()}')
        self.stdout.write(f'   • Platform Cut: {platform_settings.default_platform_cut}%')
