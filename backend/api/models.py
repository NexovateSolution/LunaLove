from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
import uuid
from django.contrib.auth.models import AbstractUser # If you want to extend the default user

# Use JSONField for list-like fields across environments for migration consistency
ArrayField = models.JSONField

# For PostgreSQL specific array fields and PostGIS (optional for now)
# from django.contrib.gis.db import models as gis_models

# You can extend Django's built-in User model or create your own.
# For simplicity, let's start with a custom User model that has common fields.
# If you extend AbstractUser, many fields like email, password, username are handled.
# For a fully custom model, inherit from models.Model and handle auth yourself or use AbstractBaseUser.

class User(AbstractUser): # Extending Django's User
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # username is already part of AbstractUser
    # email is already part of AbstractUser
    # password is already part of AbstractUser
    # name (first_name, last_name are part of AbstractUser, or add a custom 'name' field)
    
    is_premium = models.BooleanField(default=False)
    # Store the most recent payment transaction reference for webhook/verification correlation
    current_payment_tx_ref = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    phone_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True) # Make sure to get this during signup
    # gender is tricky, choices are good
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Non-binary', 'Non-binary'),
        ('Other', 'Other'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    gender = models.CharField(max_length=50, choices=GENDER_CHOICES, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    # Location - can be more detailed if needed (e.g., separate model or GeoDjango fields)
    location_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    location_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)

    # Relationship Intent
    RELATIONSHIP_INTENT_CHOICES = [
        ('Long-term relationship', 'Long-term relationship'),
        ('Short-term relationship', 'Short-term relationship'),
        ('Casual dating', 'Casual dating'),
        ('Friendship', 'Friendship'),
        ("I'm not sure yet", "I'm not sure yet"),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    relationship_intent = models.CharField(max_length=50, choices=RELATIONSHIP_INTENT_CHOICES, null=True, blank=True)

    # Religion
    RELIGION_CHOICES = [
        ('Agnostic', 'Agnostic'),
        ('Atheist', 'Atheist'),
        ('Baháʼí', 'Baháʼí'),
        ('Buddhism', 'Buddhism'),
        ('Christianity', 'Christianity'),
        ('Hinduism', 'Hinduism'),
        ('Islam', 'Islam'),
        ('Jainism', 'Jainism'),
        ('Judaism', 'Judaism'),
        ('Shinto', 'Shinto'),
        ('Sikhism', 'Sikhism'),
        ('Spiritual but not religious', 'Spiritual but not religious'),
        ('Taoism', 'Taoism'),
        ('Other', 'Other'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    religion = models.CharField(max_length=50, choices=RELIGION_CHOICES, null=True, blank=True)

    # Relationship Type
    RELATIONSHIP_TYPE_CHOICES = [
        ('Monogamous', 'Monogamous'),
        ('Polyamorous', 'Polyamorous'),
        ('Open to exploring', 'Open to exploring'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    relationship_type = models.CharField(max_length=50, choices=RELATIONSHIP_TYPE_CHOICES, null=True, blank=True)

    # Habits
    DRINKS_ALCOHOL_CHOICES = [
        ('Yes', 'Yes'),
        ('No', 'No'),
        ('Socially', 'Socially'),
        ('Occasionally', 'Occasionally'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    drinks_alcohol = models.CharField(max_length=20, choices=DRINKS_ALCOHOL_CHOICES, null=True, blank=True)

    SMOKES_CHOICES = [
        ('Yes', 'Yes'),
        ('No', 'No'),
        ('Socially', 'Socially'),
        ('Occasionally', 'Occasionally'),
        ('Prefer not to say', 'Prefer not to say'),
    ]
    smokes = models.CharField(max_length=20, choices=SMOKES_CHOICES, null=True, blank=True)
    
    profile_completeness_score = models.IntegerField(default=0) # Could be calculated based on filled fields
    interests = models.ManyToManyField('Interest', blank=True, related_name='users')
    
    # New field for terms and conditions
    accepted_terms_and_conditions = models.BooleanField(default=False)
    # End of new fields for User model

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Subscription perks
    has_boost = models.BooleanField(default=False)
    can_see_likes = models.BooleanField(default=False)
    ad_free = models.BooleanField(default=False)
    boost_expiry = models.DateTimeField(null=True, blank=True)
    likes_reveal_expiry = models.DateTimeField(null=True, blank=True)
    ad_free_expiry = models.DateTimeField(null=True, blank=True)

    # To use this custom user model, you need to set AUTH_USER_MODEL in settings.py
    # AUTH_USER_MODEL = 'api.User'

    def __str__(self):
        return self.username # or self.email

    def update_profile_completeness_score(self):
        """Calculates and updates the profile completeness score."""
        # Compute based on filled fields
        score = 0
        filled_fields = 0
        total_possible_fields = 10  # Adjust as more criteria are added

        # Define criteria and their contribution
        if self.bio and str(self.bio).strip():
            filled_fields += 1
        if self.date_of_birth:
            filled_fields += 1
        if self.gender:
            filled_fields += 1
        if (self.city and str(self.city).strip()) or (self.location_latitude and self.location_longitude):
            filled_fields += 1
        if self.relationship_intent:
            filled_fields += 1
        if self.religion:
            filled_fields += 1
        if self.drinks_alcohol:
            filled_fields += 1
        if self.smokes:
            filled_fields += 1
        try:
            if self.interests.exists():
                filled_fields += 1
        except Exception:
            pass
        try:
            if hasattr(self, 'photos') and self.photos.exists():  # 'photos' related_name for UserPhoto
                filled_fields += 1
        except Exception:
            pass

        # Calculate score as a percentage
        if total_possible_fields > 0:
            score = int((filled_fields / total_possible_fields) * 100)

        if self.profile_completeness_score != score:
            self.profile_completeness_score = score
            with transaction.atomic():
                self.save(update_fields=['profile_completeness_score'])
        return score

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    # --- Perks expiry enforcement ---
    def enforce_perk_expiry(self, save=True):
        """If any perk has expired, disable it and optionally save."""
        now = timezone.now()
        changed = False
        if self.has_boost and self.boost_expiry and self.boost_expiry <= now:
            self.has_boost = False
            changed = True
        if self.can_see_likes and self.likes_reveal_expiry and self.likes_reveal_expiry <= now:
            self.can_see_likes = False
            changed = True
        if self.ad_free and self.ad_free_expiry and self.ad_free_expiry <= now:
            self.ad_free = False
            changed = True
        if changed and save:
            with transaction.atomic():
                self.save(update_fields=[
                    'has_boost', 'can_see_likes', 'ad_free',
                    'updated_at',
                ])
        return changed

class UserPhoto(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='photos', on_delete=models.CASCADE)
    photo_url = models.ImageField(upload_to='profile_pics/', max_length=512)
    is_avatar = models.BooleanField(default=False)
    upload_order = models.SmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['upload_order']

class Interest(models.Model):
    name = models.CharField(max_length=100, unique=True)
    emoji = models.CharField(max_length=10, blank=True, null=True) # New field for emoji

    def __str__(self):
        if self.emoji:
            return f"{self.emoji} {self.name}"
        return self.name

# UserInterests will be a through model if you define it explicitly,
# or Django can create it implicitly for ManyToManyField
# For now, let's add it directly to User model:
# User.add_to_class('interests', models.ManyToManyField(Interest, blank=True, related_name='users_interested'))
# Note: If you use ManyToManyField directly on User, you don't need a separate UserInterest model
# unless you want to store extra data on the relationship (e.g., when the interest was added).

class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='preferences')
    preferred_age_min = models.IntegerField(default=18)
    preferred_age_max = models.IntegerField(default=99)
    
    preferred_gender = ArrayField(
        models.CharField(max_length=50), 
        blank=True, 
        null=True, 
        default=list # Important to provide a default callable like list for ArrayField
    )
    preferred_religion = ArrayField(
        models.CharField(max_length=50), 
        blank=True, 
        null=True,
        default=list
    )
    preferred_relationship_intent = ArrayField(
        models.CharField(max_length=50), 
        blank=True, 
        null=True,
        default=list
    )
    
    preferred_religion_match = ArrayField(
        models.CharField(max_length=50), 
        blank=True, 
        null=True,
        default=list
    )
    preferred_relationship_type_match = ArrayField(
        models.CharField(max_length=50), 
        blank=True, 
        null=True,
        default=list
    )
    
    # New fields for preferred age gap
    preferred_min_age_gap = models.IntegerField(null=True, blank=True, help_text="How many years younger they can be (e.g., 0 for same age or older, 2 for up to 2 years younger)")
    preferred_max_age_gap = models.IntegerField(null=True, blank=True, help_text="How many years older they can be (e.g., 0 for same age or younger, 5 for up to 5 years older)")

    # Location related preferences
    max_distance_km = models.IntegerField(default=100)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Preferences"

# Enhanced Like system for the new matching flow
class Like(models.Model):
    class LikeStatus(models.TextChoices):
        LIKED = 'liked', 'Liked'
        REMOVED = 'removed', 'Removed'
        MATCHED = 'matched', 'Matched'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    liker = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='likes_given', on_delete=models.CASCADE)
    liked = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='likes_received', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=LikeStatus.choices, default=LikeStatus.LIKED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('liker', 'liked')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['liker', 'status']),
            models.Index(fields=['liked', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"{self.liker.username} {self.status} {self.liked.username}"

    def check_for_mutual_match(self):
        """Check if this like creates a mutual match and create Match if so"""
        import logging
        logging.info(f"Checking mutual match for {self.liker.first_name} -> {self.liked.first_name}")
        logging.info(f"Current like status: {self.status}")
        
        if self.status != self.LikeStatus.LIKED:
            logging.info("Current like is not LIKED status, returning None")
            return None
        
        # Check if the liked user also liked back
        mutual_like = Like.objects.filter(
            liker=self.liked,
            liked=self.liker,
            status=self.LikeStatus.LIKED
        ).first()
        
        logging.info(f"Looking for mutual like: {self.liked.first_name} -> {self.liker.first_name}")
        logging.info(f"Mutual like found: {mutual_like}")
        
        if mutual_like:
            logging.info("Mutual like found! Creating match...")
            # Create match
            user1, user2 = sorted([self.liker, self.liked], key=lambda u: str(u.id))
            match, created = Match.objects.get_or_create(
                user1=user1,
                user2=user2,
                defaults={'matched_at': timezone.now()}
            )
            
            logging.info(f"Match created: {created}, Match ID: {match.id if match else 'None'}")
            
            # Update both likes to matched status (regardless of whether match was just created)
            if self.status != self.LikeStatus.MATCHED:
                self.status = self.LikeStatus.MATCHED
                self.save(update_fields=['status', 'updated_at'])
                logging.info(f"Updated current like {self.id} to MATCHED status")
            
            if mutual_like.status != self.LikeStatus.MATCHED:
                mutual_like.status = self.LikeStatus.MATCHED
                mutual_like.save(update_fields=['status', 'updated_at'])
                logging.info(f"Updated mutual like {mutual_like.id} to MATCHED status")
            
            logging.info("Both likes are now MATCHED status")
            # Return the current like object (which is now matched)
            return self
        else:
            logging.info("No mutual like found")
        return None

class Swipe(models.Model):
    class SwipeType(models.TextChoices):
        LIKE = 'like', 'Like'
        DISLIKE = 'dislike', 'Dislike'
        SUPERLIKE = 'superlike', 'Superlike'
        # Add more if needed, e.g., UNDO

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    swiper = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='swipes_made', on_delete=models.CASCADE)
    swiped_on = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='swipes_received', on_delete=models.CASCADE)
    swipe_type = models.CharField(max_length=10, choices=SwipeType.choices, default=SwipeType.LIKE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('swiper', 'swiped_on') # A user can only swipe once on another user
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.swiper.username} swiped {self.swipe_type} on {self.swiped_on.username}"


class Match(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, related_name='matches_as_user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='matches_as_user2', on_delete=models.CASCADE)
    matched_at = models.DateTimeField(auto_now_add=True)
    last_interaction_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user1', 'user2') # Ensure unique pairs
        ordering = ['-matched_at']

    def __str__(self):
        return f"Match between {self.user1.username} and {self.user2.username}"

    def get_other_user(self, current_user):
        """Get the other user in this match"""
        return self.user2 if self.user1 == current_user else self.user1


class Message(models.Model):
    id = models.BigAutoField(primary_key=True)
    match = models.ForeignKey(Match, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    # receiver is implicitly the other user in the match
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['sent_at']

    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username} in match {self.match.id}"


class ChatbotConversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='chatbot_conversations', on_delete=models.CASCADE)
    session_started_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-last_message_at']

    def __str__(self):
        return f"Chatbot conversation for {self.user.username} started at {self.session_started_at}"

class ChatbotMessage(models.Model):
    id = models.BigAutoField(primary_key=True)
    conversation = models.ForeignKey(ChatbotConversation, related_name='messages', on_delete=models.CASCADE)
    SENDER_TYPE_CHOICES = [('user', 'User'), ('bot', 'Bot')]
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPE_CHOICES)
    message_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    # For feedback on bot responses
    FEEDBACK_CHOICES = [
        (1, '👍'), # Thumbs Up
        (-1, '👎'), # Thumbs Down
        (0, 'No Feedback') 
    ]
    feedback = models.SmallIntegerField(choices=FEEDBACK_CHOICES, null=True, blank=True, default=0)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender_type.capitalize()} message: '{self.message_text}' at {self.timestamp}"


class ChatMessage(models.Model):
    """Model for real-time chat messages between matched users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match = models.ForeignKey('Like', on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_chat_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"Message from {self.sender.first_name} at {self.timestamp}"


# ===== GIFT AND PAYMENT SYSTEM MODELS =====

class CoinPackage(models.Model):
    """Predefined coin packages for purchase"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # e.g., "Starter Pack", "Premium Pack"
    coins = models.IntegerField()  # Number of coins in this package
    price_etb = models.DecimalField(max_digits=10, decimal_places=2)  # Price in Ethiopian Birr
    bonus_coins = models.IntegerField(default=0)  # Extra coins for this package
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['price_etb']
    
    def __str__(self):
        return f"{self.name} - {self.coins} coins for {self.price_etb} ETB"
    
    @property
    def total_coins(self):
        return self.coins + self.bonus_coins


class UserWallet(models.Model):
    """User's coin wallet"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coin_wallet')
    coins = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Total ETB spent
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Total ETB earned from gifts
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s wallet - {self.coins} coins"


class CoinPurchase(models.Model):
    """Records of coin purchases - payment provider to be integrated"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_purchases')
    package = models.ForeignKey(CoinPackage, on_delete=models.CASCADE)
    amount_etb = models.DecimalField(max_digits=10, decimal_places=2)
    coins_purchased = models.IntegerField()
    
    # Payment transaction details (provider-agnostic)
    transaction_ref = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=50, blank=True, null=True)  # To be populated by payment provider
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.coins_purchased} coins for {self.amount_etb} ETB"


class SubscriptionPurchase(models.Model):
    """Records of subscription/premium plan purchases"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscription_purchases')
    
    # Plan details
    PLAN_CHOICES = [
        ('BOOST', 'Boost Plan'),
        ('LIKES_REVEAL', 'Likes Reveal Plan'),
        ('AD_FREE', 'Ad-Free Plan'),
    ]
    plan_code = models.CharField(max_length=20, choices=PLAN_CHOICES)
    plan_name = models.CharField(max_length=100)
    amount_etb = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField(default=30)
    
    # Payment transaction details (provider-agnostic)
    transaction_ref = models.CharField(max_length=100, unique=True)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.plan_name} for {self.amount_etb} ETB"


class UserSubaccount(models.Model):
    """Chapa subaccount for receiving gift earnings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subaccount')
    
    # Bank account details
    bank_code = models.CharField(max_length=10)  # Bank ID from Chapa
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=200)
    
    # Chapa subaccount details
    subaccount_id = models.CharField(max_length=100, unique=True)  # From Chapa API
    split_type = models.CharField(max_length=20, default='percentage')  # 'percentage' or 'flat'
    split_value = models.DecimalField(max_digits=10, decimal_places=4, default=0.70)  # 70% to receiver
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Earnings tracking
    total_earnings_etb = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_withdrawn_etb = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}'s subaccount - {self.bank_name}"
    
    @property
    def available_balance(self):
        """Calculate available balance for withdrawal"""
        return self.total_earnings_etb - self.total_withdrawn_etb


class GiftType(models.Model):
    """Available gift types"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # e.g., "Rose", "Diamond", "Crown"
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10)  # Emoji or icon code
    coin_cost = models.IntegerField()  # Cost in coins
    etb_value = models.DecimalField(max_digits=8, decimal_places=2)  # Real money value
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['coin_cost']
    
    def __str__(self):
        return f"{self.icon} {self.name} - {self.coin_cost} coins"


class GiftTransaction(models.Model):
    """Records of gifts sent between users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gifts_sent')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gifts_received')
    gift_type = models.ForeignKey(GiftType, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    
    # Financial details
    total_coins = models.IntegerField()  # Total coins spent
    total_etb_value = models.DecimalField(max_digits=10, decimal_places=2)  # Total ETB value
    platform_cut_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)  # Platform's cut %
    platform_cut_etb = models.DecimalField(max_digits=10, decimal_places=2)  # Platform's cut in ETB
    receiver_share_etb = models.DecimalField(max_digits=10, decimal_places=2)  # Receiver's share in ETB
    
    # Chapa split payment details
    chapa_tx_ref = models.CharField(max_length=100, unique=True, null=True, blank=True)
    split_payment_processed = models.BooleanField(default=False)
    
    message = models.TextField(blank=True)  # Optional message with gift
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        from decimal import Decimal
        
        if not self.total_coins:
            self.total_coins = self.gift_type.coin_cost * self.quantity
        if not self.total_etb_value:
            self.total_etb_value = self.gift_type.etb_value * self.quantity
        if not self.platform_cut_etb:
            self.platform_cut_etb = self.total_etb_value * (Decimal(str(self.platform_cut_percentage)) / Decimal('100'))
        if not self.receiver_share_etb:
            self.receiver_share_etb = self.total_etb_value - self.platform_cut_etb
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username}: {self.quantity}x {self.gift_type.name}"


class PlatformSettings(models.Model):
    """Platform-wide settings for the gift system"""
    # Owner's bank account for receiving platform cuts
    owner_bank_code = models.CharField(max_length=10, default="")
    owner_account_number = models.CharField(max_length=50, default="")
    owner_account_name = models.CharField(max_length=100, default="")
    owner_business_name = models.CharField(max_length=100, default="LunaLove Platform")
    
    # Default platform cut percentage
    default_platform_cut = models.DecimalField(max_digits=5, decimal_places=2, default=30.00)
    
    # Minimum withdrawal amount for users
    min_withdrawal_etb = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Platform Settings"
        verbose_name_plural = "Platform Settings"
    
    def __str__(self):
        return f"Platform Settings - {self.default_platform_cut}% cut"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        if not self.pk and PlatformSettings.objects.exists():
            raise ValueError("Only one PlatformSettings instance is allowed")
        super().save(*args, **kwargs)