import random
import os
from datetime import date, timedelta
from io import BytesIO

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils import timezone

from api.models import User, Interest, UserPhoto, UserPreference

try:
    from PIL import Image
except Exception:
    Image = None


GENDERS = ['Male', 'Female', 'Non-binary']
RELATIONSHIP_INTENTS = [
    'Long-term relationship',
    'Short-term relationship',
    'Casual dating',
    'Friendship',
    "I'm not sure yet",
]
RELIGIONS = [
    'Christianity', 'Islam', 'Hinduism', 'Judaism', 'Buddhism', 'Atheist', 'Agnostic', 'Other'
]
DRINKING = ['Yes', 'No', 'Socially', 'Occasionally']
SMOKING = ['Yes', 'No', 'Socially', 'Occasionally']
CITIES = [
    ('Ethiopia', 'Addis Ababa'), ('Kenya', 'Nairobi'), ('USA', 'San Francisco'),
    ('USA', 'New York'), ('UK', 'London'), ('UAE', 'Dubai'), ('Germany', 'Berlin')
]

DEFAULT_INTERESTS = [
    ('🎵', 'Music'), ('🎬', 'Movies'), ('📚', 'Reading'), ('🏃', 'Running'),
    ('🍳', 'Cooking'), ('🎮', 'Gaming'), ('✈️', 'Travel'), ('📷', 'Photography'),
    ('⚽', 'Football'), ('🏀', 'Basketball'), ('🎨', 'Art'), ('🧘', 'Yoga'),
]


def random_dob(min_age=18, max_age=45):
    today = timezone.now().date()
    age = random.randint(min_age, max_age)
    # Random day within the year
    extra_days = random.randint(0, 364)
    return today - timedelta(days=age * 365 + extra_days)


def ensure_interests():
    objs = []
    for emoji, name in DEFAULT_INTERESTS:
        obj, _ = Interest.objects.get_or_create(name=name, defaults={'emoji': emoji})
        objs.append(obj)
    return objs


def make_placeholder_image(username: str, size=(300, 300), color=None) -> ContentFile:
    """Create a simple colored square JPEG file in memory.
    Requires Pillow. If PIL is unavailable, returns an empty ContentFile.
    """
    if Image is None:
        return ContentFile(b'', name=f"{username}.jpg")

    if color is None:
        color = (random.randint(64, 192), random.randint(64, 192), random.randint(64, 192))

    img = Image.new('RGB', size, color=color)
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=80)
    buf.seek(0)
    cf = ContentFile(buf.read())
    cf.name = f"{username}.jpg"
    return cf


class Command(BaseCommand):
    help = "Seed the database with sample users, interests, photos, and preferences."

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=12, help='Number of users to create')
        parser.add_argument('--with-photos', action='store_true', help='Generate placeholder photos for users')
        parser.add_argument('--purge', action='store_true', help='Delete all non-superuser users before seeding')

    def handle(self, *args, **options):
        count = options['count']
        with_photos = options['with_photos']
        purge = options['purge']

        # Safety purge (optional)
        if purge:
            self.stdout.write(self.style.WARNING('Purging existing non-superuser users...'))
            User.objects.filter(is_superuser=False).delete()

        # Ensure MEDIA_ROOT/profile_pics exists
        media_profile_dir = os.path.join(settings.MEDIA_ROOT, 'profile_pics')
        os.makedirs(media_profile_dir, exist_ok=True)

        # Create baseline interests
        interests = ensure_interests()
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(interests)} interests."))

        created = 0
        for i in range(count):
            username = f"user_{random.randint(1000, 9999)}_{i}"
            email = f"{username}@example.com"
            gender = random.choice(GENDERS)
            country, city = random.choice(CITIES)

            user = User.objects.create_user(
                username=username,
                email=email,
                password='Password123!',
                first_name=username.split('_')[0].capitalize(),
                last_name='Test',
                is_premium=random.choice([True, False, False]),
                date_of_birth=random_dob(),
                gender=gender,
                bio=f"Hello! I'm {username} and I love {random.choice(DEFAULT_INTERESTS)[1].lower()}.",
                country=country,
                city=city,
                relationship_intent=random.choice(RELATIONSHIP_INTENTS),
                religion=random.choice(RELIGIONS),
                relationship_type=random.choice(['Monogamous', 'Open to exploring', 'Prefer not to say']),
                drinks_alcohol=random.choice(DRINKING),
                smokes=random.choice(SMOKING),
                accepted_terms_and_conditions=True,
            )

            # Add 2-4 random interests
            sample_interests = random.sample(interests, k=random.randint(2, 4))
            user.interests.add(*sample_interests)

            # Preferences
            UserPreference.objects.get_or_create(
                user=user,
                defaults={
                    'preferred_age_min': 18,
                    'preferred_age_max': 99,
                    'preferred_gender': [],
                    'preferred_religion': [],
                    'preferred_relationship_intent': [],
                    'preferred_religion_match': [],
                    'preferred_relationship_type_match': [],
                    'max_distance_km': 100,
                }
            )

            # Photos
            if with_photos:
                img_file = make_placeholder_image(username)
                # The ImageField is named 'photo_url' in UserPhoto
                photo = UserPhoto(user=user)
                photo.photo_url.save(f"{username}.jpg", img_file, save=True)
                photo.is_avatar = True
                photo.upload_order = 0
                photo.save(update_fields=['is_avatar', 'upload_order'])

            # Ensure completeness score is updated (dev override makes it 100)
            try:
                user.update_profile_completeness_score()
            except Exception:
                pass

            created += 1
            if created % 5 == 0:
                self.stdout.write(f"Created {created}/{count} users...")

        self.stdout.write(self.style.SUCCESS(f"Seeding complete. Created {created} users."))
