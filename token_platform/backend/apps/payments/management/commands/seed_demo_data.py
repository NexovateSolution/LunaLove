from decimal import Decimal
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction

from apps.payments.models import (
    Wallet,
    CoinPackage,
    Gift,
    Payment,
    Receipt,
    GiftTransaction,
    AuditLog,
    WithdrawalRequest,
)
from apps.payments.utils.money import split_gift_value_inclusive_commission


class Command(BaseCommand):
    help = "Seed demo users and sample transactions (idempotent for key items)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding gifts and coin packages..."))
        call_command("seed_gifts_and_packages")

        User = get_user_model()

        with transaction.atomic():
            # Create two demo users
            alice, _ = User.objects.get_or_create(
                username="alice",
                defaults={
                    "email": "alice@example.com",
                    "is_active": True,
                },
            )
            if not alice.has_usable_password():
                alice.set_password("password123")
                alice.save(update_fields=["password"])  # type: ignore

            bob, _ = User.objects.get_or_create(
                username="bob",
                defaults={
                    "email": "bob@example.com",
                    "is_active": True,
                },
            )
            if not bob.has_usable_password():
                bob.set_password("password123")
                bob.save(update_fields=["password"])  # type: ignore

            # Ensure wallets
            alice_wallet, _ = Wallet.objects.get_or_create(user=alice)
            bob_wallet, _ = Wallet.objects.get_or_create(user=bob)

            # Choose a package and perform a successful top-up for Alice
            package = (
                CoinPackage.objects.order_by("target_net_etb").first()
                or CoinPackage.objects.first()
            )
            if not package:
                self.stdout.write(self.style.ERROR("No CoinPackage found after seeding."))
                return

            # Idempotent payment by provider_ref
            provider_ref = "DEMO-TOPUP-ALICE"
            payment, created = Payment.objects.get_or_create(
                provider_ref=provider_ref,
                defaults={
                    "user": alice,
                    "package": package,
                    "provider": Payment.Provider.CHAPA,
                    "status": Payment.Status.SUCCESS,
                    "price_total_etb": package.price_total_etb,
                    "vat_etb": package.vat_etb,
                    # gateway fee = total - (base + vat)
                    "gw_fee_etb": (package.price_total_etb - (package.base_etb + package.vat_etb)),
                },
            )
            if created:
                Receipt.objects.create(
                    payment=payment,
                    price_etb=payment.price_total_etb,
                    vat_etb=payment.vat_etb,
                    provider_ref=provider_ref,
                )
                # Credit coins to Alice
                alice_wallet.coin_balance += int(package.coins)
                alice_wallet.save(update_fields=["coin_balance"])  # type: ignore
                AuditLog.objects.create(
                    user=alice,
                    event="demo_topup_success",
                    metadata={
                        "provider_ref": provider_ref,
                        "package": package.name,
                        "coins": package.coins,
                        "total_etb": str(package.price_total_etb),
                    },
                )
                self.stdout.write(self.style.SUCCESS(
                    f"[created] Payment + receipt for Alice. Credited {package.coins} coins."
                ))
            else:
                self.stdout.write("[skipped] Payment already exists for Alice.")

            # Top-up for Bob (idempotent by provider_ref)
            provider_ref_bob = "DEMO-TOPUP-BOB"
            payment_bob, created_bob = Payment.objects.get_or_create(
                provider_ref=provider_ref_bob,
                defaults={
                    "user": bob,
                    "package": package,
                    "provider": Payment.Provider.TELEBIRR,
                    "status": Payment.Status.SUCCESS,
                    "price_total_etb": package.price_total_etb,
                    "vat_etb": package.vat_etb,
                    "gw_fee_etb": (package.price_total_etb - (package.base_etb + package.vat_etb)),
                },
            )
            if created_bob:
                Receipt.objects.create(
                    payment=payment_bob,
                    price_etb=payment_bob.price_total_etb,
                    vat_etb=payment_bob.vat_etb,
                    provider_ref=provider_ref_bob,
                )
                bob_wallet.coin_balance += int(package.coins)
                bob_wallet.save(update_fields=["coin_balance"])  # type: ignore
                AuditLog.objects.create(
                    user=bob,
                    event="demo_topup_success",
                    metadata={
                        "provider_ref": provider_ref_bob,
                        "package": package.name,
                        "coins": package.coins,
                        "total_etb": str(package.price_total_etb),
                    },
                )
                self.stdout.write(self.style.SUCCESS(
                    f"[created] Payment + receipt for Bob. Credited {package.coins} coins."
                ))
            else:
                self.stdout.write("[skipped] Payment already exists for Bob.")

            # Pick a gift Alice can afford and send to Bob (idempotent via AuditLog tag)
            if not AuditLog.objects.filter(event="demo_seed_gift_tx").exists():
                gift = Gift.objects.order_by("coins").first()
                if not gift:
                    self.stdout.write(self.style.ERROR("No Gift found after seeding."))
                    return
                if alice_wallet.coin_balance < gift.coins:
                    self.stdout.write(self.style.WARNING(
                        f"Alice has {alice_wallet.coin_balance} coins but gift requires {gift.coins}."
                    ))
                else:
                    # Commission split
                    commission_rate = Decimal(getattr(settings, "PLATFORM_COMMISSION_RATE", "0.25"))
                    vat_rate = Decimal(getattr(settings, "VAT_RATE", "0.15"))
                    (
                        commission_gross,
                        vat_on_commission,
                        commission_net,
                        creator_payout,
                    ) = split_gift_value_inclusive_commission(gift.value_etb, commission_rate, vat_rate)

                    GiftTransaction.objects.create(
                        sender=alice,
                        recipient=bob,
                        gift=gift,
                        coins_spent=gift.coins,
                        value_etb=gift.value_etb,
                        commission_gross=commission_gross,
                        vat_on_commission=vat_on_commission,
                        commission_net=commission_net,
                        creator_payout=creator_payout,
                        status=GiftTransaction.Status.SUCCESS,
                    )

                    # Update wallets
                    alice_wallet.coin_balance -= int(gift.coins)
                    alice_wallet.save(update_fields=["coin_balance"])  # type: ignore

                    bob_wallet.balance_etb = (bob_wallet.balance_etb + creator_payout)
                    bob_wallet.save(update_fields=["balance_etb"])  # type: ignore

                    AuditLog.objects.create(
                        user=alice,
                        event="demo_seed_gift_tx",
                        metadata={
                            "gift": gift.name,
                            "coins_spent": gift.coins,
                            "recipient": bob.username,
                            "creator_payout_etb": str(creator_payout),
                        },
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"Gift sent: {gift.name} from alice -> bob. Coins deducted: {gift.coins}."
                    ))
            else:
                self.stdout.write("[skipped] Demo gift transaction already seeded.")

            # Second gift: Bob -> Alice (idempotent via AuditLog tag)
            if not AuditLog.objects.filter(event="demo_seed_gift_tx_2").exists():
                gift2 = Gift.objects.order_by("-coins").first() or Gift.objects.first()
                if not gift2:
                    self.stdout.write(self.style.ERROR("No Gift found after seeding."))
                    return
                if bob_wallet.coin_balance < gift2.coins:
                    self.stdout.write(self.style.WARNING(
                        f"Bob has {bob_wallet.coin_balance} coins but gift requires {gift2.coins}."
                    ))
                else:
                    commission_rate = Decimal(getattr(settings, "PLATFORM_COMMISSION_RATE", "0.25"))
                    vat_rate = Decimal(getattr(settings, "VAT_RATE", "0.15"))
                    (
                        commission_gross2,
                        vat_on_commission2,
                        commission_net2,
                        creator_payout2,
                    ) = split_gift_value_inclusive_commission(gift2.value_etb, commission_rate, vat_rate)

                    GiftTransaction.objects.create(
                        sender=bob,
                        recipient=alice,
                        gift=gift2,
                        coins_spent=gift2.coins,
                        value_etb=gift2.value_etb,
                        commission_gross=commission_gross2,
                        vat_on_commission=vat_on_commission2,
                        commission_net=commission_net2,
                        creator_payout=creator_payout2,
                        status=GiftTransaction.Status.SUCCESS,
                    )

                    bob_wallet.coin_balance -= int(gift2.coins)
                    bob_wallet.save(update_fields=["coin_balance"])  # type: ignore

                    alice_wallet.balance_etb = (alice_wallet.balance_etb + creator_payout2)
                    alice_wallet.save(update_fields=["balance_etb"])  # type: ignore

                    AuditLog.objects.create(
                        user=bob,
                        event="demo_seed_gift_tx_2",
                        metadata={
                            "gift": gift2.name,
                            "coins_spent": gift2.coins,
                            "recipient": alice.username,
                            "creator_payout_etb": str(creator_payout2),
                        },
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f"Gift sent: {gift2.name} from bob -> alice. Coins deducted: {gift2.coins}."
                    ))

            # Create a pending withdrawal for Bob (holds funds)
            if not AuditLog.objects.filter(event="demo_seed_withdrawal_bob").exists():
                wd_amount = Decimal("100.00")
                wd = WithdrawalRequest.objects.create(
                    user=bob,
                    method=WithdrawalRequest.Method.TELEBIRR,
                    destination="0912345678",
                    amount_etb=wd_amount,
                    status=WithdrawalRequest.Status.PENDING,
                )
                # Move to hold
                bob_wallet.hold_etb = bob_wallet.hold_etb + wd.amount_etb
                bob_wallet.save(update_fields=["hold_etb"])  # type: ignore

                AuditLog.objects.create(
                    user=bob,
                    event="demo_seed_withdrawal_bob",
                    metadata={"withdrawal_id": wd.id, "amount_etb": str(wd.amount_etb)},
                )
                self.stdout.write(self.style.SUCCESS(
                    f"Created pending withdrawal for Bob: {wd.amount_etb} ETB to {wd.destination}"
                ))

        # Summary
        alice_wallet.refresh_from_db()
        bob_wallet.refresh_from_db()
        self.stdout.write(self.style.SUCCESS(
            f"Done. Users: alice/bob (password: password123). Alice coins: {alice_wallet.coin_balance}. Bob earnings ETB: {bob_wallet.balance_etb}."
        ))
