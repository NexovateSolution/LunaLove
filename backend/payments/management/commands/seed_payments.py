from decimal import Decimal, ROUND_HALF_UP
from django.core.management.base import BaseCommand
from django.conf import settings

from payments.models import CoinPackage, Gift


def q2(amount: Decimal) -> Decimal:
    return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


class Command(BaseCommand):
    help = "Seed default CoinPackages and Gifts for the payments app (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing CoinPackages and Gifts before seeding",
        )

    def handle(self, *args, **options):
        if options.get("reset"):
            self.stdout.write(self.style.WARNING("Resetting CoinPackages and Gifts..."))
            CoinPackage.objects.all().delete()
            Gift.objects.all().delete()

        # Load config from settings
        vat_rate = Decimal(str(getattr(settings, 'VAT_RATE', '0.15')))
        gw_rate = Decimal(str(getattr(settings, 'GATEWAY_RATE', '0.03')))
        gw_fixed = Decimal(str(getattr(settings, 'GATEWAY_FIXED', '2.00')))
        coins_per_etb = int(getattr(settings, 'COINS_PER_ETB', 1))

        # Define target net ETB tiers (what we credit to wallet in ETB-equivalent via coins)
        tiers = [Decimal('50.00'), Decimal('100.00'), Decimal('250.00'), Decimal('500.00'), Decimal('1000.00')]

        created = 0
        updated = 0
        for idx, net in enumerate(tiers, start=1):
            # Compute base (pre-VAT) such that net credited equals the target net
            # Here we treat package.target_net_etb as the net wallet credit reference value.
            base = net
            vat = q2(base * vat_rate)
            gw_fee = q2(gw_fixed + (gw_rate * (base + vat)))
            total = q2(base + vat + gw_fee)

            name = f"{int(net)} ETB"
            coins = int(net * coins_per_etb)

            obj, was_created = CoinPackage.objects.update_or_create(
                target_net_etb=net,
                defaults={
                    "name": name,
                    "coins": coins,
                    "base_etb": base,
                    "vat_etb": vat,
                    "price_total_etb": total,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        # Seed a small set of gifts with coin prices and a reference ETB value
        gifts_seed = [
            ("Rose", 5, Decimal('5.00')),
            ("Coffee", 15, Decimal('15.00')),
            ("Diamond", 100, Decimal('100.00')),
            ("Super Fan", 250, Decimal('250.00')),
        ]

        g_created = 0
        g_updated = 0
        for name, coins, value_etb in gifts_seed:
            obj, was_created = Gift.objects.update_or_create(
                name=name,
                defaults={
                    "coins": coins,
                    "value_etb": q2(Decimal(value_etb)),
                },
            )
            if was_created:
                g_created += 1
            else:
                g_updated += 1

        self.stdout.write(self.style.SUCCESS(
            f"CoinPackages: created={created}, updated={updated}; Gifts: created={g_created}, updated={g_updated}"
        ))
