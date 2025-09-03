from django.db import models, transaction
from django.conf import settings
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

    # To use this custom user model, you need to set AUTH_USER_MODEL in settings.py
    # AUTH_USER_MODEL = 'api.User'

    def __str__(self):
        return self.username # or self.email

    def update_profile_completeness_score(self):
        """Calculates and updates the profile completeness score."""
        # --- TEMPORARY DEVELOPMENT FIX ---
        # Force profile to be 100% complete to avoid being stuck on profile setup.
        # This should be removed before going to production.
        score = 100
        if self.profile_completeness_score != score:
            self.profile_completeness_score = score
            # Use a separate transaction to ensure this save happens immediately
            with transaction.atomic():
                self.save(update_fields=['profile_completeness_score'])
        return score
        # --- END TEMPORARY FIX ---

        # Original logic below
        '''
        score = 0
        filled_fields = 0
        total_possible_fields = 10  # Adjust as more criteria are added

        # Define criteria and their contribution
        if self.bio and self.bio.strip():
            filled_fields += 1
        if self.date_of_birth:
            filled_fields += 1
        if self.gender:
            filled_fields += 1
        if self.city and self.city.strip(): # Or check latitude/longitude
            filled_fields += 1
        if self.relationship_intent:
            filled_fields += 1
        if self.religion:
            filled_fields += 1
        if self.drinks_alcohol:
            filled_fields += 1
        if self.smokes:
            filled_fields += 1
        if self.interests.exists():
            filled_fields += 1
        if hasattr(self, 'photos') and self.photos.exists(): # 'photos' is the related_name for UserPhoto
            filled_fields += 1
        
        # Calculate score as a percentage
        if total_possible_fields > 0:
            score = int((filled_fields / total_possible_fields) * 100)
        
        if self.profile_completeness_score != score:
            self.profile_completeness_score = score
            # Use transaction.atomic to ensure this save is part of the overall request transaction if applicable
            # and only update the score field to avoid unintended side effects or signals.
            with transaction.atomic():
                self.save(update_fields=['profile_completeness_score'])
        return score
        '''

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

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
        return f"Message from {self.sender.username} in match {self.match.id}"

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