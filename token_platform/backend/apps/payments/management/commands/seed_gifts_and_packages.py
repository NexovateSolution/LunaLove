from decimal import Decimal
from django.core.management.base import BaseCommand
from django.conf import settings

from apps.payments.models import CoinPackage, Gift
from apps.payments.utils.money import gross_topup_price_etb


def _d(x) -> Decimal:
    if isinstance(x, Decimal):
        return x
    return Decimal(str(x))


class Command(BaseCommand):
    help = "Seed coin packages and default gift catalog (idempotent)."

    def handle(self, *args, **options):
        vat = _d(getattr(settings, "VAT_RATE", "0.15"))
        gw_rate = _d(getattr(settings, "GATEWAY_RATE", "0.03"))
        gw_fixed = _d(getattr(settings, "GATEWAY_FIXED", "2.00"))

        self.stdout.write(self.style.NOTICE("Seeding coin packages..."))
        targets = [Decimal("100"), Decimal("250"), Decimal("500")]
        for t in targets:
            base, vat_amount, total = gross_topup_price_etb(
                target_net_etb=t, vat=vat, gw_rate=gw_rate, gw_fixed=gw_fixed
            )
            name = f"Top-up {t} ETB"
            coins = int(t * Decimal(str(getattr(settings, 'COINS_PER_ETB', 1))))
            obj, created = CoinPackage.objects.update_or_create(
                target_net_etb=base,
                defaults={
                    "name": name,
                    "coins": coins,
                    "base_etb": base,
                    "vat_etb": vat_amount,
                    "price_total_etb": total,
                },
            )
            self.stdout.write(
                f"{'[created] ' if created else '[updated] '}CoinPackage: {obj.name} -> total {obj.price_total_etb} ETB"
            )

        self.stdout.write(self.style.NOTICE("Seeding gifts..."))
        gifts = [
            ("Love Note 💌", 10, Decimal("5.00")),
            ("Single Rose 🌹", 15, Decimal("7.50")),
            ("Heart-shaped Chocolate 🍫❤️", 25, Decimal("12.50")),
            ("Cute Teddy 🧸", 40, Decimal("20.00")),
            ("Romantic Song 🎶", 50, Decimal("25.00")),
            ("Candlelight Dinner 🍷✨", 75, Decimal("37.50")),
            ("Bouquet of Roses 💐", 120, Decimal("60.00")),
            ("Couple’s Photo Frame 🖼️", 150, Decimal("75.00")),
            ("Sweet Kiss 💋", 180, Decimal("90.00")),
            ("Perfume of Love 🧴", 220, Decimal("110.00")),
            ("Promise Ring 💍", 350, Decimal("175.00")),
            ("Weekend Getaway ✈️💕", 600, Decimal("300.00")),
            ("Romantic Car Ride 🚗💖", 900, Decimal("450.00")),
            ("Forever Home 🏡❤️", 2500, Decimal("1250.00")),
        ]

        for name, coins, value_etb in gifts:
            obj, created = Gift.objects.update_or_create(
                name=name,
                defaults={"coins": coins, "value_etb": value_etb},
            )
            self.stdout.write(f"{'[created] ' if created else '[updated] '}Gift: {obj.name}")

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
