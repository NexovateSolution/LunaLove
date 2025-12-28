from rest_framework import serializers
from .models import (
    User, UserPhoto, Interest, UserPreference, Swipe, Like, Message,
    ChatbotConversation, ChatbotMessage, ChatMessage,
    CoinPackage, UserWallet, CoinPurchase, GiftType, GiftTransaction, PlatformSettings
)
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from datetime import date

User = get_user_model()
class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ['id', 'name', 'emoji'] # Assuming your Interest model has name and emoji

class UserRegistrationSerializer(serializers.ModelSerializer):
    # password and password2 fields are correctly defined from previous steps
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'}, label="Confirm password")
    gender = serializers.ChoiceField(choices=User.GENDER_CHOICES, required=False, allow_null=True)

    class Meta:
        model = User
        # Fields to include during registration.
        fields = [
            'username', 'email', 'password', 'password2', 'first_name', 'last_name', 
            'date_of_birth', 'gender',
            # Added missing profile fields
            'bio', 'location_latitude', 'location_longitude', 'country', 'city',
            'relationship_intent', 'religion', 'relationship_type', 
            'drinks_alcohol', 'smokes', 'interests' # interests is ManyToMany
        ]
        extra_kwargs = {
            'username': {'required': False, 'read_only': True}, 
            'first_name': {'required': True},
            'last_name': {'required': True},
            'date_of_birth': {'required': False},
            # Mark new fields as optional during registration for now
            'bio': {'required': False, 'allow_null': True},
            'location_latitude': {'required': False, 'allow_null': True},
            'location_longitude': {'required': False, 'allow_null': True},
            'country': {'required': False, 'allow_blank': True, 'allow_null': True},
            'city': {'required': False, 'allow_blank': True, 'allow_null': True},
            'relationship_intent': {'required': False, 'allow_blank': True, 'allow_null': True},
            'religion': {'required': False, 'allow_blank': True, 'allow_null': True},
            'relationship_type': {'required': False, 'allow_blank': True, 'allow_null': True},
            'drinks_alcohol': {'required': False, 'allow_null': True}, # Assuming boolean or choice
            'smokes': {'required': False, 'allow_null': True}, # Assuming boolean or choice
            'interests': {'required': False} # M2M fields are not typically 'required' in the same way
        }

    def validate_email(self, value):
        """
        Check that the email is not already in use.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        # You can add more email/username validation if needed here
        # e.g., check if email already exists, though ModelSerializer unique=True handles some of this.
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        interests_data = validated_data.pop('interests', None)

        # --- Generate a unique temporary username ---
        email = validated_data.get('email')
        first_name = validated_data.get('first_name', '')
        # Base the username on first name if available, otherwise on email prefix
        base_name = first_name.lower() if first_name else email.split('@')[0]
        base_name = ''.join(filter(str.isalnum, base_name)) # Sanitize

        while True:
            # Add a random suffix to ensure uniqueness
            random_suffix = get_random_string(4, '0123456789')
            username = f"{base_name}{random_suffix}"
            if not User.objects.filter(username=username).exists():
                break
        
        validated_data['username'] = username
        # --- End of username generation ---

        user = User.objects.create_user(**validated_data)

        if interests_data is not None:
            user.interests.set(interests_data)
            
        return user


class UserPreferenceSerializer(serializers.ModelSerializer):
    # To show user details within preferences, but keep it read-only to avoid complex nested writes here
    # user = UserSerializer(read_only=True) 
    # Simpler: just show user_id or username if needed, or rely on the fact that this is accessed via /user/preferences/ for the logged-in user.

    class Meta:
        model = UserPreference
        fields = [
            'user',
            'preferred_age_min',
            'preferred_age_max',
            'preferred_gender',
            'preferred_religion',
            'preferred_relationship_intent',
            'preferred_religion_match',
            'preferred_relationship_type_match',
            'preferred_min_age_gap',
            'preferred_max_age_gap',
            'max_distance_km',
            'updated_at'
        ]
        read_only_fields = ['user', 'updated_at'] # User is set by the view based on authenticated user

    def validate(self, data):
        return data

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class UserPhotoSerializer(serializers.ModelSerializer):
    # Use 'photo' as the write/read field mapped to model's 'photo_url'
    photo = serializers.ImageField(source='photo_url', required=True)

    class Meta:
        model = UserPhoto
        fields = ['id', 'photo', 'is_avatar', 'upload_order']
        read_only_fields = ['id', 'is_avatar', 'upload_order']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # Convert 'photo' to an absolute URL
        request = self.context.get('request')
        try:
            if instance.photo_url:
                url = instance.photo_url.url
                rep['photo'] = request.build_absolute_uri(url) if request else url
            else:
                rep['photo'] = None
        except Exception:
            pass
        return rep

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SwipeSerializer(serializers.ModelSerializer):
    # Explicitly define the user to be the current authenticated user
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    profile = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Swipe
        fields = ['id', 'user', 'profile', 'swipe_type', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_profile(self, value):
        """Check that the profile exists and is not the swiper themselves."""
        swiper = self.context['request'].user
        if not User.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("The profile you tried to swipe on does not exist.")
        if swiper.id == value.id:
            raise serializers.ValidationError("You cannot swipe on yourself.")
        return value

    def create(self, validated_data):
        """Create or update a swipe instance."""
        swiper = self.context['request'].user
        # The 'profile' in validated_data is already a User instance because we used PrimaryKeyRelatedField.
        # We don't need to fetch it again.
        profile = validated_data.pop('profile')
        swipe_type = validated_data.pop('swipe_type')

        # Use the user and profile objects directly
        swipe, created = Swipe.objects.update_or_create(
            swiper=swiper, 
            swiped_on=profile,
            defaults={'swipe_type': swipe_type}
        )

        # Check for a mutual like
        return swipe


class UserSerializer(serializers.ModelSerializer):
    user_photos = UserPhotoSerializer(many=True, read_only=True, source='photos')
    # Add fields to match frontend expectations, using 'source' to map to model fields
    drinking_habits = serializers.CharField(source='drinks_alcohol', read_only=True, allow_null=True)
    smoking_habits = serializers.CharField(source='smokes', read_only=True, allow_null=True)
    # Writable counterparts so PATCH /user/me/ can set them
    drinks_alcohol = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    smokes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    interests = InterestSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 
            'phone_number', 'date_of_birth', 'gender', 'bio', 
            'location_latitude', 'location_longitude', 
            'country', 'city', 
            'relationship_intent', 'religion', 'relationship_type', 
            'drinking_habits', 'smoking_habits', # Read-only aliases for display
            'drinks_alcohol', 'smokes',          # Writable fields
            'profile_completeness_score', 'interests', 'last_login', 
            'is_active', 'date_joined', 'updated_at', 'accepted_terms_and_conditions',
            # Subscription/perk fields
            'is_premium',
            'has_boost', 'can_see_likes', 'ad_free',
            'boost_expiry', 'likes_reveal_expiry', 'ad_free_expiry',
            'user_photos'  # This is correctly included
        ]
        read_only_fields = ['id', 'last_login', 'is_active', 'date_joined', 'updated_at', 'profile_completeness_score']


class PotentialMatchSerializer(serializers.ModelSerializer):
    """
    Serializer for presenting potential matches to the user.
    Includes all necessary details for the frontend card.
    """
    user_photos = UserPhotoSerializer(many=True, read_only=True, source='photos')
    interests = InterestSerializer(many=True, read_only=True)
    age = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'age', 'bio', 'interests', 'user_photos',
            'gender', 'relationship_intent', 'city', 'country'
        ]

    def get_age(self, obj):
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))
        return None


# MatchSerializer removed - using LikeSerializer for matches

class LikeSerializer(serializers.ModelSerializer):
    liker = UserSerializer(read_only=True)
    liked = UserSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'liker', 'liked', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LikeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['liked']
        
    def create(self, validated_data):
        validated_data['liker'] = self.context['request'].user
        liker = validated_data['liker']
        liked = validated_data['liked']
        
        # Check if a like already exists
        existing_like = Like.objects.filter(liker=liker, liked=liked).first()
        
        if existing_like:
            if existing_like.status == Like.LikeStatus.REMOVED:
                # Re-activate the removed like
                existing_like.status = Like.LikeStatus.LIKED
                existing_like.save()
                return existing_like
            else:
                # Like already exists and is active
                raise serializers.ValidationError({'error': 'You have already liked this user'})
        
        # Create new like
        return super().create(validated_data)


class PeopleWhoLikeMeSerializer(serializers.ModelSerializer):
    """Serializer for people who liked the current user - with subscription gating"""
    user_profile = serializers.SerializerMethodField()
    is_blurred = serializers.SerializerMethodField()
    
    class Meta:
        model = Like
        fields = ['id', 'user_profile', 'is_blurred', 'created_at']
        
    def get_user_profile(self, obj):
        current_user = self.context['request'].user
        
        # Check if this is a mutual match (user should not see mutual matches in "who likes me")
        is_mutual_match = obj.status == Like.LikeStatus.MATCHED
        
        # Check if user has likes reveal subscription and it's not a mutual match
        if current_user.can_see_likes and not is_mutual_match:
            return UserSerializer(obj.liker, context=self.context).data
        else:
            # Return blurred/limited profile for non-subscribers or mutual matches
            blur_reason = 'You matched! Check your matches section.' if is_mutual_match else 'Subscribe to see who liked you!'
            return {
                'id': 'blurred',
                'first_name': '***',
                'photos': [],
                'age': '**',
                'bio': blur_reason
            }
    
    def get_is_blurred(self, obj):
        current_user = self.context['request'].user
        is_mutual_match = obj.status == Like.LikeStatus.MATCHED
        return not current_user.can_see_likes or is_mutual_match


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages between matched users"""
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    sender_id = serializers.UUIDField(source='sender.id', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sent_at', 'sender', 'sender_name', 'sender_id']
        read_only_fields = ['id', 'sent_at', 'sender', 'sender_name', 'sender_id']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages between matched users"""
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'content', 'timestamp', 'sender', 'sender_name', 'is_read']
        read_only_fields = ['id', 'timestamp', 'sender', 'sender_name']


class ChatbotConversationSerializer(serializers.ModelSerializer):
    """Serializer for chatbot conversations"""
    class Meta:
        model = ChatbotConversation
        fields = ['id', 'user', 'started_at', 'last_message_at', 'is_active']
        read_only_fields = ['id', 'started_at', 'last_message_at']


class ChatbotMessageSerializer(serializers.ModelSerializer):
    """Serializer for chatbot messages"""
    class Meta:
        model = ChatbotMessage
        fields = ['id', 'conversation', 'sender_type', 'message_text', 'timestamp', 'feedback']
        read_only_fields = ['id', 'timestamp']


# ===== GIFT AND PAYMENT SYSTEM SERIALIZERS =====

class CoinPackageSerializer(serializers.ModelSerializer):
    """Serializer for coin packages"""
    total_coins = serializers.ReadOnlyField()
    
    class Meta:
        model = CoinPackage
        fields = ['id', 'name', 'coins', 'price_etb', 'bonus_coins', 'total_coins', 'is_active']


class UserWalletSerializer(serializers.ModelSerializer):
    """Serializer for user wallet"""
    class Meta:
        model = UserWallet
        fields = ['coins', 'total_spent', 'total_earned', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ChapaSubAccountSerializer removed - payment provider to be integrated


class CoinPurchaseSerializer(serializers.ModelSerializer):
    """Serializer for coin purchases"""
    package_name = serializers.CharField(source='package.name', read_only=True)
    
    class Meta:
        model = CoinPurchase
        fields = ['id', 'package', 'package_name', 'amount_etb', 'coins_purchased', 'transaction_ref', 'payment_method', 'status', 'created_at', 'completed_at']
        read_only_fields = ['id', 'transaction_ref', 'created_at', 'completed_at']


class GiftTypeSerializer(serializers.ModelSerializer):
    """Serializer for gift types"""
    class Meta:
        model = GiftType
        fields = ['id', 'name', 'description', 'icon', 'coin_cost', 'etb_value', 'is_active']


class GiftTransactionSerializer(serializers.ModelSerializer):
    """Serializer for gift transactions"""
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.first_name', read_only=True)
    gift_name = serializers.CharField(source='gift_type.name', read_only=True)
    gift_icon = serializers.CharField(source='gift_type.icon', read_only=True)
    
    class Meta:
        model = GiftTransaction
        fields = [
            'id', 'sender', 'receiver', 'sender_name', 'receiver_name',
            'gift_type', 'gift_name', 'gift_icon', 'quantity',
            'total_coins', 'total_etb_value', 'platform_cut_percentage',
            'platform_cut_etb', 'receiver_share_etb', 'message', 'created_at'
        ]
        read_only_fields = [
            'id', 'sender_name', 'receiver_name', 'gift_name', 'gift_icon',
            'total_coins', 'total_etb_value', 'platform_cut_etb', 'receiver_share_etb', 'created_at'
        ]


class SendGiftSerializer(serializers.Serializer):
    """Serializer for sending gifts"""
    receiver_id = serializers.UUIDField()
    gift_type_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, max_value=100)
    message = serializers.CharField(max_length=500, required=False, allow_blank=True)


class PlatformSettingsSerializer(serializers.ModelSerializer):
    """Serializer for platform settings"""
    class Meta:
        model = PlatformSettings
        fields = [
            'owner_bank_code', 'owner_account_number', 'owner_account_name',
            'owner_business_name', 'default_platform_cut', 'min_withdrawal_etb', 'updated_at'
        ]
        read_only_fields = ['updated_at']
