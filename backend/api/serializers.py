from rest_framework import serializers
from .models import User, UserPreference, Interest, UserPhoto, Swipe, Match
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
    # The 'photo' field will now be a read-only field that returns the full URL.
    photo = serializers.SerializerMethodField(source='get_photo')

    class Meta:
        model = UserPhoto
        # We only need to expose the 'photo' field with the full URL.
        # 'photo_url' is removed as it's now redundant.
        fields = ['id', 'photo', 'is_avatar', 'upload_order']
        read_only_fields = ['id', 'photo', 'is_avatar', 'upload_order']

    def get_photo(self, obj):
        """
        Returns the absolute URL for the photo.
        """
        request = self.context.get('request')
        if request and obj.photo_url:
            return request.build_absolute_uri(obj.photo_url.url)
        return None

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return UserPhoto.objects.create(**validated_data)


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
    
    interests = InterestSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 
            'phone_number', 'date_of_birth', 'gender', 'bio', 
            'location_latitude', 'location_longitude', 
            'country', 'city', 
            'relationship_intent', 'religion', 'relationship_type', 
            'drinking_habits', 'smoking_habits', # Use new field names
            'profile_completeness_score', 'interests', 'last_login', 
            'is_active', 'date_joined', 'updated_at', 'accepted_terms_and_conditions',
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


class MatchSerializer(serializers.ModelSerializer):
    """
    Serializer for the Match model.
    It dynamically serializes the *other* user in the match.
    """
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = ['id', 'other_user', 'matched_at', 'is_active']

    def get_other_user(self, obj):     
        """
        Returns the user in the match who is not the current request user.
        """
        current_user = self.context['request'].user
        if obj.user1 == current_user:
            # The other user is user2
            return UserSerializer(obj.user2, context=self.context).data
        else:
            # The other user is user1
            return UserSerializer(obj.user1, context=self.context).data
