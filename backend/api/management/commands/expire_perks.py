from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone


class Command(BaseCommand):
    help = "Disable expired subscription perks for users (run via cron/scheduler)"

    def handle(self, *args, **options):
        User = get_user_model()
        now = timezone.now()
        updated = 0
        total = 0
        for user in User.objects.all().iterator():
            total += 1
            try:
                if hasattr(user, 'enforce_perk_expiry'):
                    changed = user.enforce_perk_expiry(save=True)
                    if changed:
                        updated += 1
            except Exception as e:
                self.stderr.write(f"Failed to enforce expiry for user {user.id}: {e}")
        self.stdout.write(self.style.SUCCESS(f"Perk expiry enforcement complete. Users checked: {total}, updated: {updated}"))
