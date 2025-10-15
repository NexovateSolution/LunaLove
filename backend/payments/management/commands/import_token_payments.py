import os
import sqlite3
from decimal import Decimal
from contextlib import closing

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from payments.models import Gift, CoinPackage


class Command(BaseCommand):
    help = "Import gifts and coin packages from an external token_platform SQLite database into the main backend."

    def add_arguments(self, parser):
        parser.add_argument(
            "--db",
            dest="db_path",
            default=None,
            help="Path to the token_platform SQLite database (db.sqlite3)",
        )
        parser.add_argument(
            "--only",
            dest="only",
            choices=["gifts", "coinpackages", "all"],
            default="all",
            help="Import only gifts, only coinpackages, or both",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Perform a dry run without writing changes",
        )

    def handle(self, *args, **options):
        db_path = options.get("db_path")
        only = options.get("only") or "all"
        dry_run = options.get("dry_run")

        # Best-effort default db path (relative to monorepo)
        if not db_path:
            candidate = os.path.abspath(
                os.path.join(
                    os.path.dirname(__file__),
                    "..",
                    "..",
                    "..",
                    "..",
                    "..",
                    "token_platform",
                    "backend",
                    "db.sqlite3",
                )
            )
            if os.path.exists(candidate):
                db_path = candidate

        if not db_path or not os.path.exists(db_path):
            raise CommandError(
                "External DB path not found. Provide --db pointing to token_platform/backend/db.sqlite3"
            )

        self.stdout.write(self.style.NOTICE(f"Using external DB: {db_path}"))

        imported_gifts = 0
        updated_gifts = 0
        imported_pkgs = 0
        updated_pkgs = 0

        with closing(sqlite3.connect(db_path)) as conn:
            conn.row_factory = sqlite3.Row

            if only in ("gifts", "all"):
                gifts = self._fetch_rows(conn, "SELECT id, name, coins, value_etb FROM payments_gift ORDER BY coins ASC")
                self.stdout.write(f"Found {len(gifts)} gifts in external DB")
                if not dry_run:
                    with transaction.atomic():
                        for row in gifts:
                            name = row["name"]
                            coins = int(row["coins"]) if row["coins"] is not None else 0
                            value_etb = Decimal(str(row["value_etb"])) if row["value_etb"] is not None else Decimal("0.00")
                            obj, created = Gift.objects.update_or_create(
                                name=name,
                                defaults={
                                    "coins": coins,
                                    "value_etb": value_etb,
                                },
                            )
                            if created:
                                imported_gifts += 1
                            else:
                                updated_gifts += 1

            if only in ("coinpackages", "all"):
                # Match field names to our main model schema
                pkgs = self._fetch_rows(
                    conn,
                    """
                    SELECT id, name, target_net_etb, coins, base_etb, vat_etb, price_total_etb
                    FROM payments_coinpackage
                    ORDER BY price_total_etb ASC
                    """,
                )
                self.stdout.write(f"Found {len(pkgs)} coin packages in external DB")
                if not dry_run:
                    with transaction.atomic():
                        for row in pkgs:
                            name = row["name"]
                            target = Decimal(str(row["target_net_etb"]))
                            defaults = {
                                "coins": int(row["coins"]),
                                "base_etb": Decimal(str(row["base_etb"])),
                                "vat_etb": Decimal(str(row["vat_etb"])),
                                "price_total_etb": Decimal(str(row["price_total_etb"])),
                            }
                            obj, created = CoinPackage.objects.update_or_create(
                                target_net_etb=target,
                                defaults={"name": name, **defaults},
                            )
                            if created:
                                imported_pkgs += 1
                            else:
                                updated_pkgs += 1

        self.stdout.write(self.style.SUCCESS(
            f"Import complete. Gifts: created={imported_gifts}, updated={updated_gifts}; "
            f"CoinPackages: created={imported_pkgs}, updated={updated_pkgs}"
        ))

    def _fetch_rows(self, conn: sqlite3.Connection, query: str):
        try:
            with closing(conn.cursor()) as cur:
                cur.execute(query)
                return cur.fetchall()
        except sqlite3.Error as e:
            raise CommandError(f"Failed to fetch rows: {e}")
