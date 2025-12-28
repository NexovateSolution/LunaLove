from django.shortcuts import render
from django.db.models import Q, Count, Case, When, IntegerField, FloatField, Value, F, OuterRef, Subquery
from django.db.models.functions import ExtractYear, Now, Coalesce, Abs, Cast, Replace
from django.db.models import CharField
# from django.contrib.gis.geos import Point # Commented out to avoid GDAL dependency for now
# from django.contrib.gis.measure import D # For distance # Commented out
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from geopy.distance import geodesic # Import geopy
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import requests # Import the requests library
import uuid # Import the uuid library for generating unique IDs
from django.core.cache import cache # Import Django's cache
from django.conf import settings
import os
import hmac
import hashlib
import logging
import time
import re
from urllib.parse import quote

# Imports for Google Auth
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.utils.crypto import get_random_string
import logging
import base64
import json

# Create your views here.
from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.http import HttpResponse
from rest_framework.authtoken.views import ObtainAuthToken # Import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes # Import api_view decorator
# AllowAny for registration, IsAuthenticated for protected views

from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserPreferenceSerializer, 
    UserPhotoSerializer, InterestSerializer, SwipeSerializer, 
    PotentialMatchSerializer, LikeSerializer, LikeCreateSerializer, 
    PeopleWhoLikeMeSerializer, ChatbotConversationSerializer, 
    ChatbotMessageSerializer, ChatMessageSerializer,
    CoinPackageSerializer, UserWalletSerializer,
    CoinPurchaseSerializer, GiftTypeSerializer, GiftTransactionSerializer, SendGiftSerializer
)
from .models import (
    User, UserPreference, UserPhoto, Interest, Swipe, Like, Match, Message, 
    ChatbotConversation, ChatbotMessage, ChatMessage,
    CoinPackage, UserWallet, CoinPurchase, GiftType, GiftTransaction, PlatformSettings
)
# User = get_user_model()

# --- Matchmaking Configuration ---
# Rebalanced weights to include popularity and implicit preferences
W_INTERESTS = 0.20
W_AGE = 0.20
W_LOCATION = 0.20
W_RELIGION = 0.10 # Explicit preference
W_GENDER = 0.05
W_POPULARITY = 0.15
W_IMPLICIT_PREFS = 0.10 # New weight for learned preferences

# Normalization constants
MAX_COMMON_INTERESTS = 5  # Max interests to consider for full score
MAX_DISTANCE_KM = 100.0  # Max distance for score calculation
MAX_LIKES_FOR_SCORE = 50 # A user with 50 likes in the last 30 days gets the max popularity score

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.db import transaction
            with transaction.atomic():
                user = serializer.save()
                # Ensure a preferences row exists for the new user
                from .models import UserPreference
                UserPreference.objects.get_or_create(user=user)
                token, _ = Token.objects.get_or_create(user=user)
        except Exception as e:
            logging.exception("Registration failed")
            detail = str(e) if settings.DEBUG else "Registration failed due to a server error."
            return Response({"error": detail}, status=status.HTTP_400_BAD_REQUEST)

        user_data = UserSerializer(user, context={'request': request}).data
        return Response({"user": user_data, "token": token.key}, status=status.HTTP_201_CREATED)


class CustomLoginView(ObtainAuthToken):
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        login_identifier = request.data.get("username") # This can be username or email
        password = request.data.get("password")

        # --- Start Debugging --- 
        print(f"[DEBUG] Login attempt with identifier: '{login_identifier}'")
        # Do NOT log the raw password in a real production environment
        print(f"[DEBUG] Password received: {'*' * len(password) if password else 'None'}")
        # --- End Debugging ---
        
        if not login_identifier or not password:
            return Response({"error": "Username/email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Determine if the login identifier is an email or a username
        if '@' in login_identifier:
            # Resolve by email case-insensitively; handle duplicates by picking most recently active
            user_obj = (
                User.objects
                .filter(email__iexact=login_identifier)
                .order_by('-last_login', '-date_joined')
                .first()
            )
            if not user_obj:
                # Prevent user enumeration by returning a generic error
                return Response({"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST)
            username = user_obj.username
        else:
            username = login_identifier

        # Authenticate with the resolved username and password
        print(f"[DEBUG] Attempting to authenticate user: '{username}'") # Debugging
        user = authenticate(username=username, password=password)
        print(f"[DEBUG] Authentication result (user object): {user}") # Debugging

        if user:
            token, _ = Token.objects.get_or_create(user=user)
            user_data = UserSerializer(user).data
            return Response({
                'token': token.key,
                'user': user_data
            })
        
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        id_token_from_request = request.data.get("id_token")
        if not id_token_from_request:
            return Response({"error": "Google token not provided."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            logging.info("[GoogleLoginView] Received Google auth request")
            # Decode the JWT payload first to validate 'aud' early and improve error messages
            try:
                parts = id_token_from_request.split('.')
                payload_segment = parts[1] if len(parts) >= 2 else ''
                padding = '=' * (-len(payload_segment) % 4)
                decoded_payload = json.loads(base64.urlsafe_b64decode(payload_segment + padding).decode('utf-8')) if payload_segment else {}
            except Exception:
                decoded_payload = {}

            req_aud = decoded_payload.get('aud')
            server_aud = settings.GOOGLE_CLIENT_ID
            if server_aud and req_aud and req_aud != server_aud:
                logging.error(f"[GoogleLoginView] Audience mismatch. token.aud={req_aud} settings.GOOGLE_CLIENT_ID={server_aud}")
                return Response(
                    {
                        "error": "audience_mismatch",
                        "detail": "Google token audience does not match server client ID.",
                        "token_aud": req_aud if settings.DEBUG else None,
                        "server_client_id": server_aud if settings.DEBUG else None,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verify the token with Google unless bypass is explicitly enabled
            bypass = os.getenv('GOOGLE_AUTH_BYPASS', '0') in ('1', 'true', 'True')
            if not bypass:
                logging.info(f"Verifying Google ID token with audience: {settings.GOOGLE_CLIENT_ID}")
                try:
                    # Try with small clock skew allowance (env configurable)
                    skew = int(os.getenv('GOOGLE_AUTH_CLOCK_SKEW', '10'))
                    idinfo = id_token.verify_oauth2_token(
                        id_token_from_request,
                        google_requests.Request(),
                        settings.GOOGLE_CLIENT_ID,
                        clock_skew_in_seconds=skew,
                    )
                except TypeError:
                    # Older google-auth versions don't support clock_skew_in_seconds; fall back
                    idinfo = id_token.verify_oauth2_token(
                        id_token_from_request,
                        google_requests.Request(),
                        settings.GOOGLE_CLIENT_ID,
                    )
                except ValueError as e:
                    # Handle 'Token used too early' due to small clock skew by retrying once
                    if 'used too early' in str(e).lower():
                        logging.warning("Google ID token used too early; retrying verification after brief delay")
                        time.sleep(3)
                        try:
                            skew = int(os.getenv('GOOGLE_AUTH_CLOCK_SKEW', '10'))
                            idinfo = id_token.verify_oauth2_token(
                                id_token_from_request,
                                google_requests.Request(),
                                settings.GOOGLE_CLIENT_ID,
                                clock_skew_in_seconds=skew,
                            )
                        except TypeError:
                            idinfo = id_token.verify_oauth2_token(
                                id_token_from_request,
                                google_requests.Request(),
                                settings.GOOGLE_CLIENT_ID,
                            )
                    else:
                        raise
            else:
                # Dev bypass: decode JWT payload without verification
                logging.warning("GOOGLE_AUTH_BYPASS enabled: decoding ID token without verification (dev only)")
                try:
                    parts = id_token_from_request.split('.')
                    if len(parts) < 2:
                        raise ValueError("Malformed ID token")
                    payload_segment = parts[1]
                    # Add missing padding for base64url
                    padding = '=' * (-len(payload_segment) % 4)
                    payload_json = base64.urlsafe_b64decode(payload_segment + padding).decode('utf-8')
                    idinfo = json.loads(payload_json)
                    # If email missing, synthesize one
                    if not idinfo.get('email'):
                        rid = get_random_string(8)
                        idinfo['email'] = f"dev_{rid}@example.com"
                except Exception as e:
                    # Final fallback to a synthesized identity
                    rid = get_random_string(8)
                    idinfo = {
                        'email': f"dev_{rid}@example.com",
                        'given_name': 'Dev',
                        'family_name': 'User',
                    }
            # Additional claims validation
            iss = idinfo.get('iss', '')
            if iss and (iss != 'accounts.google.com' and not iss.startswith('https://accounts.google.com')):
                return Response({
                    "error": "invalid_issuer",
                    "detail": "Token issuer is not Google.",
                    "iss": iss if settings.DEBUG else None,
                }, status=status.HTTP_400_BAD_REQUEST)

            email = idinfo.get('email')
            if not email:
                return Response({
                    "error": "missing_email",
                    "detail": "Google token did not include an email claim.",
                }, status=status.HTTP_400_BAD_REQUEST)

            if idinfo.get('email_verified') is False:
                return Response({
                    "error": "email_not_verified",
                    "detail": "Email address is not verified by Google.",
                }, status=status.HTTP_400_BAD_REQUEST)

            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            # Check if user already exists (handle duplicates deterministically)
            user = (
                User.objects
                .filter(email__iexact=email)
                .order_by('-last_login', '-date_joined')
                .first()
            )
            if user is not None:
                # Existing user found, log them in.
                token_obj, created = Token.objects.get_or_create(user=user)
                # FIX: Pass context to serializer to build absolute photo URLs
                user_data = UserSerializer(user, context={'request': request}).data
                return Response({
                    "user": user_data,
                    "token": token_obj.key,
                    "message": "User logged in successfully."
                }, status=status.HTTP_200_OK)
            else:
                # New user, create an account.
                # Generate a temporary, unique username.
                base_name = first_name.lower() if first_name else email.split('@')[0]
                base_name = ''.join(filter(str.isalnum, base_name))
                username = f"{base_name}_{get_random_string(4)}"
                while User.objects.filter(username=username).exists():
                    username = f"{base_name}_{get_random_string(4)}"

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=get_random_string(12) # Set a secure, unusable password
                )
                
                # Create preferences for the new user
                UserPreference.objects.get_or_create(user=user)

                token, _ = Token.objects.get_or_create(user=user)

                # Ensure the profile score is updated before sending the response
                user.update_profile_completeness_score()

                # FIX: Pass context to serializer to build absolute photo URLs
                user_data = UserSerializer(user, context={'request': request}).data

                return Response({
                    'token': token.key,
                    'user': user_data
                }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            # Invalid token
            logging.error(f"Google Auth Error: {e}")
            # In development, expose the specific reason to help debug
            if settings.DEBUG:
                return Response({"error": f"Invalid Google token: {e}"}, status=status.HTTP_401_UNAUTHORIZED)
            return Response({"error": "Invalid Google token."}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            # Catch-all for upstream/network errors (e.g., cert fetch failed)
            logging.exception("Unexpected error during Google ID token verification")
            detail = str(e)
            msg = {
                "error": "provider_unavailable",
                "detail": (f"Google auth verification failed: {detail}" if settings.DEBUG else "Upstream auth provider unavailable. Please try again."),
            }
            # Prefer 502 for upstream network problems; 500 if unknown
            return Response(msg, status=status.HTTP_502_BAD_GATEWAY)


class DevLoginView(APIView):
    """Create or fetch a development user and return token. Dev-only."""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # Only allow in dev/test bypass modes
        allowed = (
            getattr(settings, 'DEBUG', False)
            or os.getenv('GOOGLE_AUTH_BYPASS', '0') in ('1', 'true', 'True')
            or os.getenv('PAYMENTS_BYPASS', '0') in ('1', 'true', 'True')
        )
        if not allowed:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email') or f"dev_{get_random_string(8)}@example.com"
        first_name = request.data.get('first_name') or 'Dev'
        last_name = request.data.get('last_name') or 'User'

        user = (
            User.objects.filter(email__iexact=email).order_by('-last_login', '-date_joined').first()
        )
        if not user:
            base_name = first_name.lower() if first_name else email.split('@')[0]
            base_name = ''.join(filter(str.isalnum, base_name)) or 'devuser'
            username = f"{base_name}_{get_random_string(4)}"
            while User.objects.filter(username=username).exists():
                username = f"{base_name}_{get_random_string(4)}"
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=get_random_string(12),
            )
            UserPreference.objects.get_or_create(user=user)

        token, _ = Token.objects.get_or_create(user=user)
        user.update_profile_completeness_score()
        data = UserSerializer(user, context={'request': request}).data
        return Response({"token": token.key, "user": data}, status=status.HTTP_200_OK)

class CurrentUserView(generics.RetrieveUpdateAPIView):
    authentication_classes = [TokenAuthentication]
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can access

    def get_object(self):
        return self.request.user # Returns the currently authenticated user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Explicitly update the score before sending the user data.
        # This ensures our temporary fix in models.py is always applied.
        instance.update_profile_completeness_score()
        # Enforce perk expiry at read time so frontend always sees up-to-date flags
        try:
            instance.enforce_perk_expiry(save=True)
        except Exception:
            pass
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        """Perform the update and then recalculate profile completeness."""
        super().perform_update(serializer) # Save the instance with incoming data
        user = serializer.instance # Get the updated user instance
        user.update_profile_completeness_score() # Recalculate and save the score
        # The serializer will now pick up the updated score for the response

    def delete(self, request, *args, **kwargs):
        """Allow the authenticated user to delete their own account."""
        user = self.get_object()
        user_id = str(user.id)
        try:
            user.delete()
            return Response({"detail": f"User {user_id} deleted."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CityListView(APIView):
    """
    A view to fetch a list of cities for a given country from the GeoNames API,
    with caching to improve performance.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        country_code = request.query_params.get('country')
        if not country_code:
            return Response({"error": "Country code is required."}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"cities_{country_code}"
        cached_cities = cache.get(cache_key)

        if cached_cities:
            return Response(cached_cities, status=status.HTTP_200_OK)

        # IMPORTANT: Replace 'nexovate' with your own free username from geonames.org if needed.
        geonames_username = 'nexovate'
        # Fetch a reasonable number of cities ordered by population, we'll trim to the top ~50 below
        api_url = (
            f"http://api.geonames.org/searchJSON?country={country_code}"
            f"&featureClass=P&maxRows=300&orderby=population&username={geonames_username}"
        )

        try:
            response = requests.get(api_url)
            response.raise_for_status()
            data = response.json()

            if 'geonames' in data:
                cities = [
                    {"value": city['name'], "label": f"{city['name']}, {city.get('adminName1', '')}"}
                    for city in data['geonames']
                ]
                unique_cities = list({city['label']: city for city in cities}.values())

                # Limit to the first 50 entries so the mobile dropdown stays fast and focused on major cities
                limited_cities = unique_cities[:50]

                # Cache the result for 24 hours (86400 seconds)
                cache.set(cache_key, limited_cities, timeout=86400)

                return Response(limited_cities, status=status.HTTP_200_OK)
            else:
                error_message = data.get('status', {}).get('message', 'No cities found or API error.')
                return Response({"error": error_message}, status=status.HTTP_404_NOT_FOUND)

        except requests.exceptions.RequestException as e:
            return Response({"error": f"Failed to connect to GeoNames API: {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class UserPreferenceView(generics.RetrieveUpdateAPIView):
    """
    View to retrieve or update the user's preferences.
    Creates preferences for a user if they don't exist on first access.
    """
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_object(self):
        # get_or_create returns a tuple (object, created_boolean)
        preferences, created = UserPreference.objects.get_or_create(user=self.request.user)
        return preferences


class UserPhotoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user photos.
    Allows users to list, create, retrieve, update, and delete their own photos.
    """
    serializer_class = UserPhotoSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        """Ensure users can only see and manage their own photos."""
        return UserPhoto.objects.filter(user=self.request.user).order_by('upload_order')

    # The serializer's create method already handles associating the photo with the request.user
    # perform_create is not strictly needed here if the serializer handles it, but can be used for extra logic.
    # def perform_create(self, serializer):
    #     serializer.save(user=self.request.user)


class InterestListView(generics.ListAPIView):
    """
    View to list all available interests.
    """
    queryset = Interest.objects.all().order_by('name')
    serializer_class = InterestSerializer
    permission_classes = [AllowAny] # Anyone can see the list of interests


class SwipeCreateView(generics.CreateAPIView):
    serializer_class = SwipeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        swipe = serializer.save()

        # After saving the swipe, check if it resulted in a match
        if swipe.swipe_type == 'like':
            # Check for a mutual like from the other user
            if Swipe.objects.filter(swiper=swipe.swiped_on, swiped_on=swipe.swiper, swipe_type='like').exists():
                # It's a match!
                user1, user2 = sorted([swipe.swiper, swipe.swiped_on], key=lambda u: u.id)
                match, created = Match.objects.get_or_create(user1=user1, user2=user2)
                
                if created:
                    # Return the new match data
                    match_serializer = LikeSerializer(match, context={'request': request})
                    return Response({'match': True, 'is_new_match': True, 'data': match_serializer.data}, status=status.HTTP_201_CREATED)
                else:
                    # A match already existed
                    return Response({'match': True, 'is_new_match': False}, status=status.HTTP_200_OK)
            else:
                # A 'like' swipe that did not result in a match
                return Response({'match': False, 'is_new_match': False}, status=status.HTTP_200_OK)

        # For 'pass' swipes or any other type
        return Response({'match': False, 'is_new_match': False}, status=status.HTTP_200_OK)


 


class PotentialMatchView(generics.ListAPIView):
    """
    View to list potential matches for the authenticated user.
    Applies discovery filters from query parameters.
    """
    serializer_class = PotentialMatchSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        user = self.request.user

        # --- 1. Initial Filtering: Exclude self and swiped users ---
        swiped_user_ids = Swipe.objects.filter(swiper=user).values_list('swiped_on_id', flat=True)
        potential_matches_qs = User.objects.exclude(id=user.id).exclude(id__in=swiped_user_ids)

        # --- 2. Exclude users with no photos (re-enable this for production) ---
        # potential_matches_qs = potential_matches_qs.annotate(num_photos=Count('photos')).filter(num_photos__gt=0)

        # --- 3. Apply Discovery Filters from Query Params ---
        filters = self.request.query_params
        min_age_raw = filters.get('minAge')
        max_age_raw = filters.get('maxAge')
        gender = filters.get('gender')

        # Parse age values safely
        try:
            min_age = int(min_age_raw) if min_age_raw is not None else None
        except (ValueError, TypeError):
            min_age = None
        try:
            max_age = int(max_age_raw) if max_age_raw is not None else None
        except (ValueError, TypeError):
            max_age = None

        # Only apply age filters if they are not the frontend defaults (18-99).
        # This prevents excluding users who haven't set their DOB yet during onboarding.
        if not (min_age == 18 and max_age == 99):
            today = timezone.now().date()
            if min_age is not None:
                latest_birth_date = today - relativedelta(years=min_age)
                potential_matches_qs = potential_matches_qs.filter(date_of_birth__lte=latest_birth_date)
            if max_age is not None:
                earliest_birth_date = today - relativedelta(years=(max_age + 1))
                potential_matches_qs = potential_matches_qs.filter(date_of_birth__gte=earliest_birth_date)

        if gender and gender.lower() != 'all':
            potential_matches_qs = potential_matches_qs.filter(gender__iexact=gender)

        # --- 4. Final Step: Prioritize boosted users, then random ---
        boost_score = Case(
            When(has_boost=True, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
        return potential_matches_qs.annotate(boost_score=boost_score).order_by('-boost_score', '?')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # --- Debugging ---
        print(f"[DEBUG] Found {queryset.count()} potential matches with filters: {request.query_params}")
        # --- End Debugging ---
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ChatbotView(APIView):
    """
    A view to handle chatbot interactions using the OpenAI API.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        import openai
        openai.api_key = settings.OPENAI_API_KEY

        user_message = request.data.get('message', '')
        if not user_message:
            return Response({'error': 'A message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Define the role and behavior of the chatbot
            system_prompt = (
                "You are 'Sheba,' a friendly and helpful AI assistant for the ShebaLove dating app. "
                "Your goal is to assist users, answer their questions about the app, and provide fun conversation starters. "
                "Keep your responses concise, positive, and encouraging. Do not generate unsafe or adult content."
            )

            # Call the OpenAI API
            completion = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=150 # Limit response length
            )

            bot_reply = completion.choices[0].message.content.strip()

        except Exception as e:
            print(f"[ERROR] OpenAI API call failed: {e}")
            bot_reply = "I'm sorry, I'm having a little trouble thinking right now. Please try again in a moment."
            return Response({'reply': bot_reply}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({'reply': bot_reply}, status=status.HTTP_200_OK)


class InitializePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        # Allow client-provided reference to be used if sent
        incoming_tx_ref = (
            request.data.get('tx_ref')
            or request.data.get('trx_ref')
            or request.data.get('reference')
        )
        tx_ref = incoming_tx_ref or f"sl-{str(user.id).replace('-', '')[:12]}-{uuid.uuid4().hex[:12]}"

        # Save the tx_ref to the user model *before* initializing payment
        user.current_payment_tx_ref = tx_ref
        user.save()

        amount = '100'  # Example amount, you can make this dynamic
        currency = 'ETB'
        
        # Use a configurable frontend URL for the return path
        frontend_return_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173') + '/purchase-success/'

        # Sanitize required fields to avoid null/undefined at Chapa
        safe_email = (user.email or f"{user.username or 'user'}@example.com").strip()
        safe_first_name = (user.first_name or (user.username or 'Sheba')).strip() or 'Sheba'
        safe_last_name = (user.last_name or 'User').strip() or 'User'
        safe_phone = (user.phone_number or '0900000000').strip()

        payload = {
            'amount': str(amount),
            'currency': str(currency),
            'email': safe_email,
            'first_name': safe_first_name,
            'last_name': safe_last_name,
            'phone_number': safe_phone, # Ensure a valid phone number is always provided
            'tx_ref': tx_ref,
            'callback_url': request.build_absolute_uri('/api/payment-webhook/'),
            'return_url': frontend_return_url, # Use the correctly configured frontend URL
            'customization': {
                'title': 'ShebaLove', # Keep title under 16 chars
                'description': 'Unlock all features of ShebaLove.'
            }
        }

        headers = {
            'Authorization': f"Bearer {os.environ.get('CHAPA_SECRET_KEY')}",
            'Content-Type': 'application/json'
        }

        # Avoid logging secrets directly
        sk = os.environ.get('CHAPA_SECRET_KEY', '')
        logging.info(f"Using Chapa Secret Key: {'***' + sk[-4:] if sk else 'MISSING'}") # Masked

        try:
            logging.info(f"Initializing Chapa payment for user {user.id} with tx_ref: {tx_ref}")
            logging.info(f"Chapa payload: {payload}")
            url = 'https://api.chapa.co/v1/transaction/initialize'
            response = requests.post(url, headers=headers, json=payload, timeout=(10, 20)) # (connect, read)
            response.raise_for_status() 
            data = response.json()
            logging.debug(f"Chapa response: {data}")

            if data.get('status') == 'success':
                logging.info(f"Successfully initialized payment for tx_ref: {tx_ref}")
                return Response({'checkout_url': data['data']['checkout_url'], 'tx_ref': tx_ref})
            else:
                logging.error(f"Chapa payment initialization failed for tx_ref: {tx_ref}. Reason: {data.get('message')}")
                return Response(data, status=status.HTTP_400_BAD_REQUEST)
        except requests.exceptions.HTTPError as e:
            # Server responded with 4xx/5xx
            error_details = "No response body"
            status_code = None
            resp = getattr(e, 'response', None)
            if resp is not None:
                status_code = resp.status_code
                try:
                    error_details = resp.json()
                except ValueError:
                    error_details = resp.text
            logging.critical(
                f"Chapa API HTTPError for tx_ref: {tx_ref}. Status: {status_code}. Details: {error_details}",
                exc_info=False
            )
            return Response({'error': 'Payment provider request failed.', 'details': error_details}, status=status.HTTP_502_BAD_GATEWAY)
        except requests.exceptions.RequestException as e:
            # Network/connection timeout/DNS etc.
            logging.critical(f"Could not connect to Chapa API for tx_ref: {tx_ref}. Error: {e}", exc_info=True)
            return Response({'error': 'Could not connect to payment provider.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# We will implement these views next
class ChapaWebhookView(APIView):
    permission_classes = [AllowAny] # Webhooks need to be accessible by Chapa's servers

    def get(self, request, *args, **kwargs):
        # Handle GET request from Chapa, data is in query params
        return self.handle_webhook(request.query_params)

    def post(self, request, *args, **kwargs):
        # Handle POST request from Chapa, data is in the body
        return self.handle_webhook(request.data)

    def handle_webhook(self, data):
        # It's good practice to verify the webhook event is from Chapa
        tx_ref = data.get('tx_ref') or data.get('trx_ref') # Chapa uses both trx_ref and tx_ref
        status_from_webhook = data.get('status')

        logging.info(f"Received webhook for tx_ref: {tx_ref} with status: {status_from_webhook}")

        if not tx_ref or not status_from_webhook:
            return Response({'error': 'Invalid webhook data'}, status=status.HTTP_400_BAD_REQUEST)

        if status_from_webhook == 'success':
            # Verify the transaction again with Chapa's API as a security measure
            headers = {
                'Authorization': f"Bearer {os.environ.get('CHAPA_SECRET_KEY')}",
            }
            verification_url = f'https://api.chapa.co/v1/transaction/verify/{tx_ref}'
            
            try:
                logging.info(f"Verifying Chapa transaction for tx_ref: {tx_ref}")
                response = requests.get(verification_url, headers=headers, timeout=(10, 20)) # (connect, read)
                response.raise_for_status()
                verification_data = response.json()

                if verification_data.get('data', {}).get('status') == 'success':
                    # Find the user associated with the transaction
                    try:
                        user = User.objects.get(current_payment_tx_ref=tx_ref)
                    except User.DoesNotExist:
                        logging.error(f"Webhook received for tx_ref {tx_ref}, but no user found with this ref.")
                        return Response(status=status.HTTP_404_NOT_FOUND)

                    if not user.is_premium:
                        user.is_premium = True
                        user.current_payment_tx_ref = None # Clear the ref after successful payment
                        user.save()
                        logging.info(f"Successfully granted premium access to user {user.id} for tx_ref: {tx_ref}")
                    return Response(status=status.HTTP_200_OK)
                else:
                    logging.warning(f"Webhook verification for tx_ref {tx_ref} resulted in status: {verification_data.get('data', {}).get('status')}")
            except requests.exceptions.RequestException as e:
                logging.error(f"Webhook verification failed for tx_ref: {tx_ref}. Error: {e}")
                return Response({'error': 'Verification request failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'status': 'webhook received'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_match(request, profile_id):
    swiper = request.user
    try:
        swiped_on = User.objects.get(id=profile_id)
    except User.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if the other user has already liked the current user
    mutual_swipe = Swipe.objects.filter(
        swiper=swiped_on, 
        swiped_on=swiper,
        swipe_type__in=[Swipe.SwipeType.LIKE, Swipe.SwipeType.SUPERLIKE]
    ).exists()

    if mutual_swipe:
        # It's a match! Create a Match instance.
        # Ensure user1 and user2 are ordered to prevent duplicates (user1.id < user2.id)
        user1, user2 = sorted([swiper, swiped_on], key=lambda u: str(u.id))
        match, created = Match.objects.get_or_create(user1=user1, user2=user2)

        if created:
            # A new match was created
            serializer = LikeSerializer(match, context={'request': request})
            return Response({'match': True, 'is_new_match': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)
        else:
            # A match already existed
            serializer = LikeSerializer(match, context={'request': request})
            return Response({'match': True, 'is_new_match': False, 'data': serializer.data}, status=status.HTTP_200_OK)

    return Response({'match': False}, status=status.HTTP_200_OK)


class RewindSwipeView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        try:
            # Find the last swipe made by the user
            last_swipe = Swipe.objects.filter(swiper=user).latest('created_at')
        except Swipe.DoesNotExist:
            return Response({"error": "No swipes to rewind."}, status=status.HTTP_404_NOT_FOUND)

        swiped_on_user = last_swipe.swiped_on
        swipe_type = last_swipe.swipe_type

        # If the last swipe was a 'like', check for and delete any resulting match
        if swipe_type == 'like':
            user1, user2 = sorted([user, swiped_on_user], key=lambda u: u.id)
            Match.objects.filter(user1=user1, user2=user2).delete()

        # Delete the swipe itself
        last_swipe.delete()

        # Return the profile of the user that was swiped on, so the frontend can display it again
        # We can reuse the PotentialMatchSerializer for this
        serializer = PotentialMatchSerializer(swiped_on_user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ResetSwipesView(APIView):
    """
    A developer-only view to reset all swipes for the current user.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        # Delete all swipes made by the user
        count, _ = Swipe.objects.filter(swiper=user).delete()
        # Also delete any matches the user is part of, as they are now invalid
        Match.objects.filter(Q(user1=user) | Q(user2=user)).delete()
        return Response({'message': f'Successfully deleted {count} swipes and all related matches.'}, status=status.HTTP_200_OK)


class MatchListView(generics.ListAPIView):
    """
    Lists all active matches for the authenticated user.
    """
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        """
        This view should return a list of all the active matches
        for the currently authenticated user.
        """
        user = self.request.user
        # Find matches where the user is either user1 or user2, and the match is active
        return Match.objects.filter(
            Q(user1=user) | Q(user2=user),
            is_active=True
        ).order_by('-matched_at') # Changed from '-created_at'


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # To ensure we have the absolute latest user data (post-webhook),
        # we re-fetch the user object from the database instead of just using request.user.
        try:
            user = User.objects.get(pk=request.user.pk)
        except User.DoesNotExist:
            # This is a fallback, should not happen for an authenticated user.
            return Response({'status': 'error', 'message': 'No verification parameters provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # If already premium, return success immediately
        if user.is_premium:
            return Response({'status': 'success', 'message': 'Account is premium.'}, status=status.HTTP_200_OK)

        # Optional fallback: allow direct verification with Chapa using tx_ref when webhook hasn't updated yet
        tx_ref = (
            request.query_params.get('tx_ref')
            or request.query_params.get('trx_ref')
            or request.query_params.get('reference')
        )

        if tx_ref:
            headers = {
                'Authorization': f"Bearer {os.environ.get('CHAPA_SECRET_KEY')}",
            }
            verification_url = f'https://api.chapa.co/v1/transaction/verify/{tx_ref}'

            try:
                logging.info(f"[VerifyPaymentView] Attempting direct verification for tx_ref: {tx_ref}")
                resp = requests.get(verification_url, headers=headers, timeout=(10, 20))
                resp.raise_for_status()
                verification_data = resp.json()

                if verification_data.get('data', {}).get('status') == 'success':
                    # Upgrade the user and clear the stored tx_ref
                    if not user.is_premium:
                        user.is_premium = True
                        # Clear if it matches current stored ref to avoid stomping unrelated state
                        if getattr(user, 'current_payment_tx_ref', None) == tx_ref:
                            user.current_payment_tx_ref = None
                        user.save()
                        logging.info(f"[VerifyPaymentView] Upgraded user {user.id} to premium after direct verification of {tx_ref}")
                    return Response({'status': 'success', 'message': 'Account is premium.'}, status=status.HTTP_200_OK)
                else:
                    st = verification_data.get('data', {}).get('status')
                    logging.warning(f"[VerifyPaymentView] Direct verification for {tx_ref} returned status: {st}")
                    return Response({'status': 'pending', 'message': f'Awaiting webhook/verification. Provider status: {st or "unknown"}.'}, status=status.HTTP_202_ACCEPTED)
            except requests.exceptions.RequestException as e:
                logging.error(f"[VerifyPaymentView] Direct verification failed for tx_ref {tx_ref}: {e}")
                # Network/timeout/errors -> allow frontend to retry shortly
                return Response({'status': 'pending', 'message': 'Verification request failed. Please retry shortly.'}, status=status.HTTP_202_ACCEPTED)

        # No tx_ref provided and user not yet premium -> allow frontend to retry while waiting for webhook
        return Response({'status': 'pending', 'message': 'Premium status not yet active.'}, status=status.HTTP_202_ACCEPTED)


# ---------------- Subscriptions (Plans + Subscribe) ----------------
class SubscriptionPlansView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        plans = [
            {
                'id': 1,
                'code': 'BOOST',
                'name': 'Boost Plan',
                'description': 'Get featured more and reach more profiles for better matching!',
                'price_etb': '199.00',
                'icon': '🔥',
            },
            {
                'id': 2,
                'code': 'LIKES_REVEAL',
                'name': 'Likes Reveal Plan',
                'description': 'See who liked you and decide if you like them back!',
                'price_etb': '149.00',
                'icon': '❤️',
            },
            {
                'id': 3,
                'code': 'AD_FREE',
                'name': 'Ad-Free Plan',
                'description': 'Remove ads that appear every 5–10 swipes and enjoy smooth swiping!',
                'price_etb': '99.00',
                'icon': '🚫📢',
            },
        ]
        return Response(plans, status=status.HTTP_200_OK)


class SubscribePlanView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def post(self, request, *args, **kwargs):
        from .models import SubscriptionPurchase
        
        try:
            plan_id = int(request.data.get('plan_id'))
        except (TypeError, ValueError):
            return Response({'detail': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Define plan details
        plans = {
            1: {'code': 'BOOST', 'name': 'Boost Plan', 'price': '199.00'},
            2: {'code': 'LIKES_REVEAL', 'name': 'Likes Reveal Plan', 'price': '149.00'},
            3: {'code': 'AD_FREE', 'name': 'Ad-Free Plan', 'price': '99.00'},
        }
        
        if plan_id not in plans:
            return Response({'detail': 'Invalid plan_id'}, status=status.HTTP_400_BAD_REQUEST)
        
        plan = plans[plan_id]
        
        # Create subscription purchase record
        # Keep tx_ref under 50 chars: sub-BOOST-abc123 (max ~20 chars)
        tx_ref = f"sub-{plan['code']}-{get_random_string(12)}"
        subscription_purchase = SubscriptionPurchase.objects.create(
            user=request.user,
            plan_code=plan['code'],
            plan_name=plan['name'],
            amount_etb=plan['price'],
            duration_days=30,
            transaction_ref=tx_ref,
            payment_method='Chapa'
        )
        
        # Prepare user info for Chapa
        safe_email = (request.user.email or f"{(request.user.username or 'user').strip()}@example.com").strip()
        safe_first_name = (request.user.first_name or (request.user.username or 'Luna')).strip() or 'Luna'
        safe_last_name = (request.user.last_name or 'User').strip() or 'User'
        raw_phone = getattr(request.user, 'phone_number', None)
        phone_str = str(raw_phone).strip() if raw_phone else ''
        phone_valid = bool(re.fullmatch(r'(09|07)\d{8}', phone_str))
        
        # Build metadata
        meta_data = {
            "user_id": str(request.user.id),
            "username": request.user.username,
            "plan_code": plan['code'],
            "plan_name": plan['name'],
            "purchase_id": str(subscription_purchase.id),
            "type": "subscription"
        }
        
        # Allow mobile clients to override the return URL so they can deep-link back into the app.
        # Like coins, we must give Chapa a valid HTTP/HTTPS URL. If a mobile deep link is provided,
        # wrap it in the MobileDeepLinkReturnView bridge, using the same host the mobile app used
        # (via request.build_absolute_uri) instead of any hard-coded BACKEND_URL/ngrok domain.
        mobile_return_url = request.data.get('return_url')
        if mobile_return_url:
            deep_link = f"{mobile_return_url}?tx_ref={tx_ref}&purchase_id={subscription_purchase.id}"
            encoded_deep_link = quote(deep_link, safe='')
            bridge_base = request.build_absolute_uri('/api/mobile-return/')
            sub_return_url = f"{bridge_base}?deeplink={encoded_deep_link}"
        else:
            sub_return_url = (
                f"{settings.FRONTEND_URL}/#/subscription/payment-return"
                f"?tx_ref={tx_ref}&purchase_id={subscription_purchase.id}"
            )

        # Prepare Chapa payload
        chapa_payload = {
            "amount": str(plan['price']),
            "currency": "ETB",
            "email": safe_email,
            "first_name": safe_first_name,
            "last_name": safe_last_name,
            "tx_ref": tx_ref,
            "callback_url": f"{settings.BACKEND_URL}/api/chapa/subscription-webhook/",
            "return_url": sub_return_url,
            "customization": {
                "title": "LunaLove Pro",
                "description": plan['name'][:50]
            },
            "meta": meta_data
        }
        if phone_valid:
            chapa_payload["phone_number"] = phone_str
        
        try:
            logging.info(f"Chapa subscription payload: {chapa_payload}")
            
            chapa_response = requests.post(
                'https://api.chapa.co/v1/transaction/initialize',
                json=chapa_payload,
                headers={
                    'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
                    'Content-Type': 'application/json'
                }
            )
            
            logging.info(f"Chapa subscription response status: {chapa_response.status_code}")
            logging.info(f"Chapa subscription response body: {chapa_response.text}")
            
            if chapa_response.status_code == 200:
                chapa_data = chapa_response.json()
                if chapa_data.get('status') == 'success':
                    checkout_url = chapa_data['data']['checkout_url']
                    
                    return Response({
                        'success': True,
                        'checkout_url': checkout_url,
                        'purchase_id': str(subscription_purchase.id),
                        'tx_ref': tx_ref,
                        'plan': plan
                    })
                else:
                    logging.error(f"Chapa subscription init non-success: {chapa_data}")
                    return Response({
                        'error': 'Payment initialization failed',
                        'provider_response': chapa_data if settings.DEBUG else None
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                body = None
                try:
                    body = chapa_response.json()
                except Exception:
                    try:
                        body = chapa_response.text
                    except Exception:
                        body = None
                logging.error(f"Chapa subscription init failed with status {chapa_response.status_code}: {body}")
                return Response({
                    'error': 'Payment initialization failed',
                    'provider_status': chapa_response.status_code,
                    'provider_response': body if settings.DEBUG else None
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logging.error(f"Chapa subscription payment initialization error: {e}")
            return Response({'error': 'Payment service unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class SubscriptionActivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            plan_id = int(request.data.get('plan_id'))
        except (TypeError, ValueError):
            return Response({'detail': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        now = timezone.now()
        expires = now + timedelta(days=30)

        if plan_id == 1:  # Boost
            user.has_boost = True
            user.boost_expiry = expires
        elif plan_id == 2:  # Likes Reveal
            user.can_see_likes = True
            user.likes_reveal_expiry = expires
        elif plan_id == 3:  # Ad-Free
            user.ad_free = True
            user.ad_free_expiry = expires
        else:
            return Response({'detail': 'Invalid plan_id'}, status=status.HTTP_400_BAD_REQUEST)

        user.save(update_fields=['has_boost', 'can_see_likes', 'ad_free', 'boost_expiry', 'likes_reveal_expiry', 'ad_free_expiry', 'updated_at'])
        data = UserSerializer(user, context={'request': request}).data
        return Response({'ok': True, 'user': data, 'expires_at': expires.isoformat()}, status=status.HTTP_200_OK)


# ===== NEW ENHANCED MATCHING SYSTEM VIEWS =====

class LikeUserView(APIView):
    """Create a like for another user"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request, *args, **kwargs):
        serializer = LikeCreateSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            like = serializer.save()
            # Check for mutual match
            logging.info(f"Calling check_for_mutual_match for like: {like.id}")
            match = like.check_for_mutual_match()
            logging.info(f"Mutual match result: {match}")
            
            response_data = {
                'like_id': like.id,
                'status': like.status,
                'mutual_match': match is not None
            }
            
            logging.info(f"Response data: {response_data}")
            
            if match:
                response_data['match_data'] = LikeSerializer(match, context={'request': request}).data
                
                # Send real-time notifications to both users (disabled for now)
                # from .websocket_utils import send_match_notification
                # from .serializers import UserSerializer
                
                # match_data = LikeSerializer(match, context={'request': request}).data
                # user1_data = UserSerializer(like.liker, context={'request': request}).data
                # user2_data = UserSerializer(like.liked, context={'request': request}).data
                
                # Notify both users about the match
                # send_match_notification(like.liker.id, {
                #     'id': str(match.id),
                #     'other_user': user2_data,
                #     'matched_at': match.matched_at.isoformat()
                # })
                # send_match_notification(like.liked.id, {
                #     'id': str(match.id),
                #     'other_user': user1_data,
                #     'matched_at': match.matched_at.isoformat()
                # })
                
                logging.info(f"Mutual match created between {like.liker.first_name} and {like.liked.first_name}")
                
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            logging.error(f"Error in LikeUserView: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            
            if 'UNIQUE constraint failed' in str(e) or 'duplicate key' in str(e):
                return Response({'error': 'You have already liked this user'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': f'Failed to create like: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PeopleILikeView(generics.ListAPIView):
    """List of people the current user has liked"""
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        return Like.objects.filter(
            liker=self.request.user,
            status__in=[Like.LikeStatus.LIKED, Like.LikeStatus.MATCHED]
        ).select_related('liked').prefetch_related('liked__photos')


class PeopleWhoLikeMeView(generics.ListAPIView):
    """List of people who liked the current user - with subscription gating"""
    serializer_class = PeopleWhoLikeMeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        return Like.objects.filter(
            liked=self.request.user,
            status__in=[Like.LikeStatus.LIKED, Like.LikeStatus.MATCHED]
        ).select_related('liker').prefetch_related('liker__photos')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Add subscription upsell info for non-subscribers
        response_data = {
            'count': queryset.count(),
            'has_subscription': request.user.can_see_likes,
            'results': []
        }
        
        if not request.user.can_see_likes and queryset.count() > 0:
            response_data['upsell_message'] = f"You have {queryset.count()} people who liked you! Subscribe to see who they are."
        
        serializer = self.get_serializer(queryset, many=True)
        response_data['results'] = serializer.data
        
        return Response(response_data)


class MyMatchesView(generics.ListAPIView):
    """List of mutual matches for the current user"""
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        user = self.request.user
        return Like.objects.filter(
            Q(liker=user) | Q(liked=user),
            status=Like.LikeStatus.MATCHED
        ).select_related('liker', 'liked').prefetch_related(
            'liker__photos', 'liked__photos'
        ).order_by('-updated_at')


class RemoveLikeView(APIView):
    """Remove/undo a like"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request, *args, **kwargs):
        like_id = request.data.get('like_id')
        if not like_id:
            return Response({'error': 'like_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            like = Like.objects.get(
                id=like_id,
                liker=request.user,
                status__in=[Like.LikeStatus.LIKED, Like.LikeStatus.MATCHED]
            )
            
            # If it was a match, we need to handle the match removal
            if like.status == Like.LikeStatus.MATCHED:
                # Find and deactivate the match
                user1, user2 = sorted([like.liker, like.liked], key=lambda u: str(u.id))
                try:
                    match = Match.objects.get(user1=user1, user2=user2)
                    match.is_active = False
                    match.save()
                    
                    # Update the other user's like back to LIKED status
                    other_like = Like.objects.get(liker=like.liked, liked=like.liker)
                    other_like.status = Like.LikeStatus.LIKED
                    other_like.save()
                except Match.DoesNotExist:
                    pass
            
            like.status = Like.LikeStatus.REMOVED
            like.save()
            
            return Response({'success': True, 'message': 'Like removed successfully'})
            
        except Like.DoesNotExist:
            return Response({'error': 'Like not found'}, status=status.HTTP_404_NOT_FOUND)


class MatchDetailView(generics.RetrieveAPIView):
    """Get details of a specific match"""
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        user = self.request.user
        return Match.objects.filter(
            Q(user1=user) | Q(user2=user),
            is_active=True
        ).select_related('user1', 'user2').prefetch_related(
            'user1__photos', 'user2__photos'
        )


class SendMessageView(APIView):
    """Send a message in a match"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request, match_id, *args, **kwargs):
        try:
            user = request.user
            # The match_id is actually a like_id in our system
            like = Like.objects.get(
                id=match_id,
                status=Like.LikeStatus.MATCHED
            )
            
            # Verify user is part of this match
            if user not in [like.liker, like.liked]:
                return Response({'error': 'You are not part of this match'}, status=status.HTTP_403_FORBIDDEN)
            
            # Get the corresponding Match object
            user1, user2 = sorted([like.liker, like.liked], key=lambda u: str(u.id))
            match = Match.objects.get(user1=user1, user2=user2)
            
            content = request.data.get('content', '').strip()
            if not content:
                return Response({'error': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create message
            from .models import Message
            message = Message.objects.create(
                match=match,
                sender=user,
                content=content
            )
            
            # Update match last interaction
            match.last_interaction_at = timezone.now()
            match.save(update_fields=['last_interaction_at'])
            
            # Send real-time notification to the other user (disabled for now)
            # from .websocket_utils import send_message_notification
            # other_user = match.get_other_user(user)
            
            # send_message_notification(
            #     other_user.id,
            #     match.id,
            #     {
            #         'id': message.id,
            #         'content': message.content,
            #         'sent_at': message.sent_at.isoformat()
            #     },
            #     {
            #         'id': str(user.id),
            #         'name': user.first_name,
            #         'avatar': user.photos.first().photo.url if user.photos.exists() else None
            #     }
            # )
            
            return Response({
                'id': message.id,
                'content': message.content,
                'sender_id': str(user.id),
                'sent_at': message.sent_at.isoformat(),
                'match_id': str(match.id)
            }, status=status.HTTP_201_CREATED)
            
        except Match.DoesNotExist:
            return Response({'error': 'Match not found'}, status=status.HTTP_404_NOT_FOUND)


class MatchMessagesView(generics.ListAPIView):
    """Get messages for a specific match"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_serializer_class(self):
        from .serializers import MessageSerializer
        return MessageSerializer
    
    def get_queryset(self):
        match_id = self.kwargs['match_id']  # This is actually a like_id
        user = self.request.user
        
        try:
            # Get the Like object first
            like = Like.objects.get(
                id=match_id,
                status=Like.LikeStatus.MATCHED
            )
            
            # Verify user is part of this match
            if user not in [like.liker, like.liked]:
                return []
            
            # Get the corresponding Match object
            user1, user2 = sorted([like.liker, like.liked], key=lambda u: str(u.id))
            match = Match.objects.get(user1=user1, user2=user2)
            
            from .models import Message
            return Message.objects.filter(match=match).select_related('sender').order_by('sent_at')
            
        except (Match.DoesNotExist, Like.DoesNotExist):
            return []


class ChatMessagesView(generics.ListCreateAPIView):
    """API view for chat messages between matched users"""
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        match_id = self.kwargs.get('match_id')
        try:
            # Verify the match exists and user is part of it
            match = Like.objects.get(
                id=match_id,
                status=Like.LikeStatus.MATCHED
            )
            
            # Ensure current user is part of this match
            if self.request.user not in [match.liker, match.liked]:
                return ChatMessage.objects.none()
                
            return ChatMessage.objects.filter(match=match).select_related('sender')
            
        except Like.DoesNotExist:
            return ChatMessage.objects.none()
    
    def perform_create(self, serializer):
        match_id = self.kwargs.get('match_id')
        try:
            match = Like.objects.get(
                id=match_id,
                status=Like.LikeStatus.MATCHED
            )
            
            # Ensure current user is part of this match
            if self.request.user not in [match.liker, match.liked]:
                raise serializers.ValidationError("You are not part of this match")
                
            serializer.save(sender=self.request.user, match=match)
            
        except Like.DoesNotExist:
            raise serializers.ValidationError("Match not found")


class MatchDetailView(generics.RetrieveAPIView):
    """API view to get match details for chat"""
    serializer_class = LikeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        return Like.objects.filter(
            status=Like.LikeStatus.MATCHED
        ).select_related('liker', 'liked')
    
    def get_object(self):
        match_id = self.kwargs.get('match_id')
        try:
            match = self.get_queryset().get(id=match_id)
            
            # Ensure current user is part of this match
            if self.request.user not in [match.liker, match.liked]:
                raise Http404("Match not found")
                
            return match
            
        except Like.DoesNotExist:
            raise Http404("Match not found")


class CreateFakeLikeView(APIView):
    """Create a fake like for testing mutual matches - Dev only"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        if not settings.DEBUG:
            return Response({'error': 'Only available in debug mode'}, status=status.HTTP_403_FORBIDDEN)
            
        liker_id = request.data.get('liker_id')
        liked_id = request.data.get('liked_id')
        
        if not liker_id or not liked_id:
            return Response({'error': 'liker_id and liked_id required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            liker = User.objects.get(id=liker_id)
            liked = User.objects.get(id=liked_id)
            
            # Create or update the like
            like, created = Like.objects.get_or_create(
                liker=liker,
                liked=liked,
                defaults={'status': Like.LikeStatus.LIKED}
            )
            
            if not created and like.status != Like.LikeStatus.LIKED:
                like.status = Like.LikeStatus.LIKED
                like.save()
                
            return Response({
                'success': True,
                'like_id': like.id,
                'created': created,
                'message': f'{liker.first_name} now likes {liked.first_name}'
            })
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class ClearLikesView(APIView):
    """Clear all likes for testing - Dev only"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        if not settings.DEBUG:
            return Response({'error': 'Only available in debug mode'}, status=status.HTTP_403_FORBIDDEN)
            
        user = request.user
        
        # Delete all likes involving this user
        likes_deleted = Like.objects.filter(
            Q(liker=user) | Q(liked=user)
        ).delete()
        
        # Delete all matches involving this user
        matches_deleted = Match.objects.filter(
            Q(user1=user) | Q(user2=user)
        ).delete()
        
        return Response({
            'success': True,
            'likes_deleted': likes_deleted[0] if likes_deleted[0] else 0,
            'matches_deleted': matches_deleted[0] if matches_deleted[0] else 0,
            'message': f'Cleared {likes_deleted[0]} likes and {matches_deleted[0]} matches for {user.first_name}'
        })


# ===== GIFT AND PAYMENT SYSTEM VIEWS =====

class MobileDeepLinkReturnView(APIView):
    """HTML bridge page that redirects the browser to a mobile deep link.

    Chapa requires return_url to be a valid HTTP/HTTPS URL, so we can't send
    a custom scheme (like lunalove://) directly. Instead, we point Chapa to
    this bridge endpoint with an encoded deep link in the query string.
    When Chapa redirects here, we immediately redirect the user to the
    provided deep link using JavaScript.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        deeplink_param = request.query_params.get('deeplink', '')
        if not deeplink_param:
            return HttpResponse("Missing deeplink", status=400)

        # We stored the deep link percent-encoded in the URL; use it directly
        # in the href and decode it client-side in JS for window.location.
        safe_deeplink = deeplink_param

        html = f"""<!DOCTYPE html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <title>Returning to LunaLove</title>
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <script>
      (function() {{
        try {{
          var encoded = '{safe_deeplink}';
          var target = decodeURIComponent(encoded);
          if (target) {{
            window.location.href = target;
          }}
        }} catch (e) {{
          console.error('Deep link redirect failed', e);
        }}
      }})();
    </script>
  </head>
  <body>
    <p>Redirecting you back to the LunaLove app...</p>
    <p>If you are not redirected automatically, <a href=\"{safe_deeplink}\">tap here to continue</a>.</p>
  </body>
</html>"""

        return HttpResponse(html)


class CoinPackageListView(generics.ListAPIView):
    """List available coin packages"""
    serializer_class = CoinPackageSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        return CoinPackage.objects.filter(is_active=True)


class UserWalletView(APIView):
    """Get user's wallet information"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        wallet, created = UserWallet.objects.get_or_create(user=request.user)
        serializer = UserWalletSerializer(wallet)
        return Response(serializer.data)


class PurchaseCoinsView(APIView):
    """Initialize coin purchase via Chapa"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        package_id = request.data.get('package_id')
        
        try:
            package = CoinPackage.objects.get(id=package_id, is_active=True)
        except CoinPackage.DoesNotExist:
            return Response({'error': 'Invalid package'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create coin purchase record
        tx_ref = f"coin-{request.user.id}-{get_random_string(8)}"
        coin_purchase = CoinPurchase.objects.create(
            user=request.user,
            package=package,
            amount_etb=package.price_etb,
            coins_purchased=package.total_coins,
            transaction_ref=tx_ref,
            payment_method='Chapa'
        )
        
        # Initialize Chapa payment
        # Sanitize user fields (Chapa requires valid strings; email recommended)
        safe_email = (request.user.email or f"{(request.user.username or 'user').strip()}@example.com").strip()
        safe_first_name = (request.user.first_name or (request.user.username or 'Luna')).strip() or 'Luna'
        safe_last_name = (request.user.last_name or 'User').strip() or 'User'
        raw_phone = getattr(request.user, 'phone_number', None)
        phone_str = str(raw_phone).strip() if raw_phone else ''
        phone_valid = bool(re.fullmatch(r'(09|07)\d{8}', phone_str))

        # Build detailed payment metadata
        meta_data = {
            "user_id": str(request.user.id),
            "username": request.user.username,
            "package_name": package.name,
            "coins": package.total_coins,
            "bonus_coins": package.bonus_coins,
            "purchase_id": str(coin_purchase.id)
        }
        
        # Allow mobile clients to override the return URL so they can deep-link back into the app.
        # IMPORTANT: Chapa requires return_url to be a valid HTTP/HTTPS URL, so we can't send
        # a custom scheme (like lunalove://) directly. Instead, we send Chapa to a small
        # HTML bridge endpoint that then redirects to the deep link.
        mobile_return_url = request.data.get('return_url')
        if mobile_return_url:
            deep_link = f"{mobile_return_url}?tx_ref={tx_ref}&purchase_id={coin_purchase.id}"
            encoded_deep_link = quote(deep_link, safe='')
            # Build bridge URL on the same host the mobile app used (e.g. http://10.x.x.x:8000)
            bridge_base = request.build_absolute_uri('/api/mobile-return/')
            chapa_return_url = f"{bridge_base}?deeplink={encoded_deep_link}"
        else:
            chapa_return_url = (
                f"{settings.FRONTEND_URL}/#/coins/payment-return"
                f"?tx_ref={tx_ref}&purchase_id={coin_purchase.id}"
            )

        chapa_payload = {
            "amount": str(package.price_etb),
            "currency": "ETB",
            "email": safe_email,
            "first_name": safe_first_name,
            "last_name": safe_last_name,
            "tx_ref": tx_ref,
            # Callback URL - Chapa will send webhook here (must be publicly accessible)
            # For local dev, this should be your ngrok URL
            "callback_url": f"{settings.BACKEND_URL}/api/chapa/webhook/",
            "return_url": chapa_return_url,
            "customization": {
                "title": "LunaLove Coins",
                "description": f"{package.total_coins} coins"[:50]  # Max 50 chars
            },
            "meta": meta_data
        }
        if phone_valid:
            chapa_payload["phone_number"] = phone_str
        
        try:
            # Log the payload for debugging
            logging.info(f"Chapa payload: {chapa_payload}")
            
            chapa_response = requests.post(
                'https://api.chapa.co/v1/transaction/initialize',
                json=chapa_payload,
                headers={
                    'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
                    'Content-Type': 'application/json'
                }
            )
            
            logging.info(f"Chapa response status: {chapa_response.status_code}")
            logging.info(f"Chapa response body: {chapa_response.text}")
            
            if chapa_response.status_code == 200:
                chapa_data = chapa_response.json()
                if chapa_data.get('status') == 'success':
                    checkout_url = chapa_data['data']['checkout_url']
                    
                    return Response({
                        'success': True,
                        'checkout_url': checkout_url,
                        'purchase_id': str(coin_purchase.id),
                        'tx_ref': tx_ref,
                        'package': CoinPackageSerializer(package).data
                    })
                else:
                    logging.error(f"Chapa init non-success body: {chapa_data}")
                    return Response({
                        'error': 'Payment initialization failed',
                        'provider_response': chapa_data if settings.DEBUG else None
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                body = None
                try:
                    body = chapa_response.json()
                except Exception:
                    try:
                        body = chapa_response.text
                    except Exception:
                        body = None
                logging.error(f"Chapa init failed with status {chapa_response.status_code}: {body}")
                return Response({
                    'error': 'Payment initialization failed',
                    'provider_status': chapa_response.status_code,
                    'provider_response': body if settings.DEBUG else None
                }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logging.error(f"Chapa payment initialization error: {e}")
            return Response({'error': 'Payment service unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CoinPurchaseStatusView(APIView):
    """Get coin purchase status and details for receipt"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        purchase_id = request.query_params.get('purchase_id')
        chapa_ref = request.query_params.get('chapa_ref')
        status_param = request.query_params.get('status')
        
        try:
            # Try to find purchase by ID first, then by transaction reference
            if purchase_id:
                coin_purchase = CoinPurchase.objects.get(id=purchase_id, user=request.user)
            elif chapa_ref:
                coin_purchase = CoinPurchase.objects.get(transaction_ref=chapa_ref, user=request.user)
            else:
                return Response({'error': 'Purchase ID or transaction reference required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get current wallet balance
            wallet, _ = UserWallet.objects.get_or_create(user=request.user)
            
            return Response({
                'transaction_id': str(coin_purchase.id),
                'transaction_ref': coin_purchase.transaction_ref,
                'package_name': coin_purchase.package.name,
                'coins_purchased': coin_purchase.coins_purchased,
                'amount_etb': str(coin_purchase.amount_etb),
                'status': coin_purchase.status,
                'created_at': coin_purchase.created_at.isoformat() if coin_purchase.created_at else None,
                'completed_at': coin_purchase.completed_at.isoformat() if coin_purchase.completed_at else None,
                'payment_method': coin_purchase.payment_method or 'Chapa',
                'new_balance': wallet.coins
            })
            
        except CoinPurchase.DoesNotExist:
            # If purchase not found, return mock data for testing
            if purchase_id and purchase_id.startswith('test-'):
                # Use the chapa_ref if provided, otherwise generate a test one
                test_chapa_ref = chapa_ref if chapa_ref else 'TEST-APQ1kcaiCZi2'
                return Response({
                    'transaction_id': purchase_id,
                    'chapa_reference': test_chapa_ref,
                    'package_name': 'Test Premium Pack - 600 Coins',
                    'coins_purchased': 600,
                    'amount_etb': 180.00,
                    'status': 'completed',
                    'created_at': timezone.now().isoformat(),
                    'completed_at': timezone.now().isoformat(),
                    'payment_method': 'Chapa (Test Mode)',
                    'new_balance': 1000,
                    'receipt_url': f'https://chapa.link/payment-receipt/{test_chapa_ref}'
                })
            return Response({'error': 'Purchase not found'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            # Handle UUID validation errors for test cases
            if purchase_id and purchase_id.startswith('test-'):
                test_chapa_ref = chapa_ref if chapa_ref else 'TEST-APQ1kcaiCZi2'
                return Response({
                    'transaction_id': purchase_id,
                    'chapa_reference': test_chapa_ref,
                    'package_name': 'Test Premium Pack - 600 Coins',
                    'coins_purchased': 600,
                    'amount_etb': 180.00,
                    'status': 'completed',
                    'created_at': timezone.now().isoformat(),
                    'completed_at': timezone.now().isoformat(),
                    'payment_method': 'Chapa (Test Mode)',
                    'new_balance': 1000,
                    'receipt_url': f'https://chapa.link/payment-receipt/{test_chapa_ref}'
                })
            return Response({'error': 'Invalid purchase ID format'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logging.error(f"Error fetching purchase status: {e}")
            return Response({'error': 'Failed to fetch purchase details'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyCoinPaymentView(APIView):
    """Manually verify a coin purchase payment with Chapa"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        tx_ref = request.data.get('tx_ref')
        
        if not tx_ref:
            return Response({'error': 'Transaction reference required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Find the purchase
            coin_purchase = CoinPurchase.objects.get(transaction_ref=tx_ref, user=request.user)
            
            # Call Chapa verify API
            verify_response = requests.get(
                f'https://api.chapa.co/v1/transaction/verify/{tx_ref}',
                headers={
                    'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}'
                }
            )
            
            logging.info(f"Chapa verify response for {tx_ref}: {verify_response.status_code} - {verify_response.text}")
            
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                
                if verify_data.get('status') == 'success':
                    payment_status = verify_data['data'].get('status')
                    
                    if payment_status == 'success':
                        # Payment verified successfully
                        if coin_purchase.status != 'completed':
                            coin_purchase.status = 'completed'
                            coin_purchase.completed_at = timezone.now()
                            coin_purchase.save()
                            
                            # Credit coins to user wallet
                            wallet, _ = UserWallet.objects.get_or_create(user=request.user)
                            wallet.coins += coin_purchase.coins_purchased
                            wallet.save()
                            
                            logging.info(f"Payment verified and coins credited: {tx_ref}, user: {request.user.username}, coins: {coin_purchase.coins_purchased}")
                        
                        return Response({
                            'success': True,
                            'status': 'completed',
                            'message': 'Payment verified successfully',
                            'coins_credited': coin_purchase.coins_purchased,
                            'new_balance': wallet.coins,
                            'payment_details': verify_data['data']
                        })
                    else:
                        # Payment not successful
                        coin_purchase.status = 'failed'
                        coin_purchase.save()
                        
                        return Response({
                            'success': False,
                            'status': payment_status,
                            'message': f'Payment status: {payment_status}',
                            'payment_details': verify_data['data']
                        })
                else:
                    return Response({
                        'error': 'Verification failed',
                        'details': verify_data
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'Failed to verify payment',
                    'status_code': verify_response.status_code
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except CoinPurchase.DoesNotExist:
            return Response({'error': 'Purchase not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.error(f"Payment verification error: {e}")
            return Response({'error': 'Verification failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CancelCoinPaymentView(APIView):
    """Cancel a pending coin purchase payment"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        tx_ref = request.data.get('tx_ref')
        
        if not tx_ref:
            return Response({'error': 'Transaction reference required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Find the purchase
            coin_purchase = CoinPurchase.objects.get(transaction_ref=tx_ref, user=request.user)
            
            # Only allow cancellation of pending purchases
            if coin_purchase.status == 'completed':
                return Response({'error': 'Cannot cancel completed purchase'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Call Chapa cancel API (if available in their API)
            # Note: Chapa may not have a cancel endpoint, so we just mark as cancelled locally
            coin_purchase.status = 'cancelled'
            coin_purchase.save()
            
            logging.info(f"Payment cancelled: {tx_ref}, user: {request.user.username}")
            
            return Response({
                'success': True,
                'message': 'Payment cancelled successfully',
                'transaction_ref': tx_ref
            })
                
        except CoinPurchase.DoesNotExist:
            return Response({'error': 'Purchase not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.error(f"Payment cancellation error: {e}")
            return Response({'error': 'Cancellation failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GiftTypeListView(generics.ListAPIView):
    """List available gift types"""
    serializer_class = GiftTypeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        return GiftType.objects.filter(is_active=True)


class SendGiftView(APIView):
    """Send a gift to another user"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        serializer = SendGiftSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        sender = request.user
        
        try:
            receiver = User.objects.get(id=data['receiver_id'])
            gift_type = GiftType.objects.get(id=data['gift_type_id'], is_active=True)
        except (User.DoesNotExist, GiftType.DoesNotExist):
            return Response({'error': 'Invalid receiver or gift type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if sender has enough coins
        sender_wallet, _ = UserWallet.objects.get_or_create(user=sender)
        total_cost = gift_type.coin_cost * data['quantity']
        
        # For testing: Auto-add coins if insufficient (only in DEBUG mode)
        if settings.DEBUG and sender_wallet.coins < total_cost:
            logging.info(f"TEST MODE: Adding {total_cost} coins to {sender.username} for testing")
            sender_wallet.coins += total_cost
            sender_wallet.save()
        
        if sender_wallet.coins < total_cost:
            return Response({
                'error': 'Insufficient coins',
                'required': total_cost,
                'available': sender_wallet.coins
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create gift transaction
        gift_transaction = GiftTransaction.objects.create(
            sender=sender,
            receiver=receiver,
            gift_type=gift_type,
            quantity=data['quantity'],
            message=data.get('message', '')
        )
        
        # Deduct coins from sender
        sender_wallet.coins -= total_cost
        sender_wallet.save()
        
        # Check if receiver has subaccount for split payment
        has_subaccount = hasattr(receiver, 'subaccount') and receiver.subaccount.is_active
        
        # Add earnings to receiver if they have a subaccount
        if has_subaccount:
            receiver.subaccount.total_earnings_etb += gift_transaction.receiver_share_etb
            receiver.subaccount.save()
        
        # Also track in wallet
        receiver_wallet, _ = UserWallet.objects.get_or_create(user=receiver)
        receiver_wallet.total_earned += gift_transaction.receiver_share_etb
        receiver_wallet.save()
        
        # Mark split payment as processed (actual transfer happens via Chapa automatically)
        if has_subaccount:
            gift_transaction.split_payment_processed = True
            gift_transaction.save()
        
        return Response({
            'success': True,
            'message': 'Gift sent successfully!',
            'gift': GiftTransactionSerializer(gift_transaction).data,
            'sender_coins_remaining': sender_wallet.coins,
            'split_payment': has_subaccount,
            'receiver_earnings': str(gift_transaction.receiver_share_etb) if has_subaccount else None,
            'platform_cut': str(gift_transaction.platform_cut_etb)
        })
    
    def _process_split_payment_old(self, gift_transaction):
        """OLD: Process split payment via Chapa - NOT USED, kept for reference"""
        try:
            receiver_subaccount = gift_transaction.receiver.subaccount
            if not receiver_subaccount or not receiver_subaccount.is_active:
                return  # Skip split payment if no subaccount
            
            # Get platform settings
            platform_settings, _ = PlatformSettings.objects.get_or_create()
            
            tx_ref = f"gift-{gift_transaction.id}-{get_random_string(8)}"
            
            # Initialize split payment
            split_payload = {
                "amount": str(gift_transaction.total_etb_value),
                "currency": "ETB",
                "email": gift_transaction.receiver.email,
                "first_name": gift_transaction.receiver.first_name,
                "last_name": gift_transaction.receiver.last_name,
                "tx_ref": tx_ref,
                "callback_url": f"{settings.FRONTEND_URL}/api/chapa/gift-webhook/",
                "customization": {
                    "title": f"Gift from {gift_transaction.sender.first_name}",
                    "description": f"{gift_transaction.quantity}x {gift_transaction.gift_type.name}"
                },
                "subaccounts": {
                    "id": receiver_subaccount.subaccount_id
                }
            }
            
            response = requests.post(
                'https://api.chapa.co/v1/transaction/initialize',
                json=split_payload,
                headers={
                    'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
                    'Content-Type': 'application/json'
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    gift_transaction.chapa_tx_ref = tx_ref
                    gift_transaction.split_payment_processed = True
                    gift_transaction.save()
                    
        except Exception as e:
            logging.error(f"Split payment processing error: {e}")


class GiftHistoryView(generics.ListAPIView):
    """Get user's gift history (sent and received)"""
    serializer_class = GiftTransactionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        gift_type = self.request.query_params.get('type', 'all')
        
        if gift_type == 'sent':
            return GiftTransaction.objects.filter(sender=user).order_by('-created_at')
        elif gift_type == 'received':
            return GiftTransaction.objects.filter(receiver=user).order_by('-created_at')
        else:
            return GiftTransaction.objects.filter(
                Q(sender=user) | Q(receiver=user)
            ).order_by('-created_at')


class CreateSubAccountView(APIView):
    """Create Chapa subaccount for user"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        bank_code = request.data.get('bank_code')
        account_number = request.data.get('account_number')
        account_name = request.data.get('account_name')
        
        if not all([bank_code, account_number, account_name]):
            return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already has a subaccount
        if hasattr(request.user, 'chapa_subaccount'):
            return Response({'error': 'Subaccount already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create subaccount via Chapa API
        platform_settings, _ = PlatformSettings.objects.get_or_create()
        
        subaccount_payload = {
            "business_name": f"{request.user.first_name} {request.user.last_name}",
            "account_name": account_name,
            "bank_code": int(bank_code),
            "account_number": account_number,
            "split_value": float(platform_settings.default_platform_cut) / 100,
            "split_type": "percentage"
        }
        
        try:
            response = requests.post(
                'https://api.chapa.co/v1/subaccount',
                json=subaccount_payload,
                headers={
                    'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
                    'Content-Type': 'application/json'
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'success':
                    subaccount_id = data['data']['subaccount_id']
                    
                    # Save subaccount to database
                    chapa_subaccount = ChapaSubAccount.objects.create(
                        user=request.user,
                        subaccount_id=subaccount_id,
                        bank_code=bank_code,
                        account_number=account_number,
                        account_name=account_name,
                        business_name=subaccount_payload['business_name']
                    )
                    
                    return Response({
                        'success': True,
                        'subaccount': ChapaSubAccountSerializer(chapa_subaccount).data
                    })
            
            return Response({'error': 'Subaccount creation failed'}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logging.error(f"Subaccount creation error: {e}")
            return Response({'error': 'Service unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ChapaWebhookView(APIView):
    """Handle Chapa payment webhooks with automatic verification"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            # Extract webhook data
            tx_ref = request.data.get('tx_ref') or request.data.get('trx_ref')
            status_webhook = request.data.get('status')
            ref_id = request.data.get('ref_id') or request.data.get('reference')
            
            if not tx_ref:
                return Response({'error': 'Missing tx_ref'}, status=status.HTTP_400_BAD_REQUEST)
            
            logging.info(f"Webhook received for tx_ref: {tx_ref}, status: {status_webhook}")
            
            # Automatically verify the transaction with Chapa API
            if status_webhook == 'success':
                try:
                    verify_response = requests.get(
                        f'https://api.chapa.co/v1/transaction/verify/{tx_ref}',
                        headers={'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}'}
                    )
                    
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        if verify_data.get('status') == 'success':
                            verified_status = verify_data['data'].get('status')
                            verified_ref = verify_data['data'].get('reference')
                            
                            if verified_status != 'success':
                                logging.warning(f"Verification failed for {tx_ref}: status={verified_status}")
                                return Response({'status': 'verification_failed'})
                            
                            # Use verified reference if available
                            if verified_ref:
                                ref_id = verified_ref
                        else:
                            logging.error(f"Verification API returned non-success: {verify_data}")
                            return Response({'status': 'verification_failed'})
                    else:
                        logging.error(f"Verification API error: {verify_response.status_code}")
                        return Response({'status': 'verification_failed'})
                        
                except Exception as e:
                    logging.error(f"Verification request failed: {e}")
                    return Response({'status': 'verification_error'})
            
            # Handle coin purchase completion
            if tx_ref.startswith('coin-'):
                try:
                    coin_purchase = CoinPurchase.objects.get(transaction_ref=tx_ref)
                    
                    if status_webhook == 'success' and coin_purchase.status == 'pending':
                        # Add coins to user's wallet
                        wallet, _ = UserWallet.objects.get_or_create(user=coin_purchase.user)
                        wallet.coins += coin_purchase.coins_purchased
                        wallet.total_spent += coin_purchase.amount_etb
                        wallet.save()
                        
                        # Update purchase status
                        coin_purchase.status = 'completed'
                        coin_purchase.completed_at = timezone.now()
                        coin_purchase.save()
                        
                        logging.info(f"Coin purchase completed: {tx_ref}, user: {coin_purchase.user.username}, coins: {coin_purchase.coins_purchased}")
                        
                    elif status_webhook == 'failed':
                        coin_purchase.status = 'failed'
                        coin_purchase.save()
                        logging.info(f"Coin purchase failed: {tx_ref}")
                        
                except CoinPurchase.DoesNotExist:
                    logging.error(f"Coin purchase not found: {tx_ref}")
                    return Response({'error': 'Purchase not found'}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({'status': 'success', 'message': 'Webhook processed successfully'})
            
        except Exception as e:
            logging.error(f"Webhook processing error: {e}")
            return Response({'error': 'Webhook processing failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubscriptionWebhookView(APIView):
    """Handle Chapa subscription payment webhooks with automatic verification"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        from .models import SubscriptionPurchase
        
        try:
            # Extract webhook data
            tx_ref = request.data.get('tx_ref') or request.data.get('trx_ref')
            status_webhook = request.data.get('status')
            
            if not tx_ref:
                return Response({'error': 'Missing tx_ref'}, status=status.HTTP_400_BAD_REQUEST)
            
            logging.info(f"Subscription webhook received for tx_ref: {tx_ref}, status: {status_webhook}")
            
            # Automatically verify the transaction with Chapa API
            if status_webhook == 'success':
                try:
                    verify_response = requests.get(
                        f'https://api.chapa.co/v1/transaction/verify/{tx_ref}',
                        headers={'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}'}
                    )
                    
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        if verify_data.get('status') == 'success':
                            verified_status = verify_data['data'].get('status')
                            
                            if verified_status != 'success':
                                logging.warning(f"Subscription verification failed for {tx_ref}: status={verified_status}")
                                return Response({'status': 'verification_failed'})
                        else:
                            logging.error(f"Subscription verification API returned non-success: {verify_data}")
                            return Response({'status': 'verification_failed'})
                    else:
                        logging.error(f"Subscription verification API error: {verify_response.status_code}")
                        return Response({'status': 'verification_failed'})
                        
                except Exception as e:
                    logging.error(f"Subscription verification request failed: {e}")
                    return Response({'status': 'verification_error'})
            
            # Handle subscription purchase completion
            if tx_ref.startswith('sub-'):
                try:
                    subscription_purchase = SubscriptionPurchase.objects.get(transaction_ref=tx_ref)
                    
                    if status_webhook == 'success' and subscription_purchase.status == 'pending':
                        # Activate the subscription
                        user = subscription_purchase.user
                        now = timezone.now()
                        expires = now + timedelta(days=subscription_purchase.duration_days)
                        
                        # Apply the subscription benefits based on plan code
                        if subscription_purchase.plan_code == 'BOOST':
                            user.has_boost = True
                            user.boost_expiry = expires
                        elif subscription_purchase.plan_code == 'LIKES_REVEAL':
                            user.can_see_likes = True
                            user.likes_reveal_expiry = expires
                        elif subscription_purchase.plan_code == 'AD_FREE':
                            user.ad_free = True
                            user.ad_free_expiry = expires
                        
                        user.save()
                        
                        # Update purchase status
                        subscription_purchase.status = 'completed'
                        subscription_purchase.completed_at = now
                        subscription_purchase.activated_at = now
                        subscription_purchase.expires_at = expires
                        subscription_purchase.save()
                        
                        logging.info(f"Subscription activated: {tx_ref}, user: {user.username}, plan: {subscription_purchase.plan_code}")
                        
                    elif status_webhook == 'failed':
                        subscription_purchase.status = 'failed'
                        subscription_purchase.save()
                        logging.info(f"Subscription purchase failed: {tx_ref}")
                        
                except SubscriptionPurchase.DoesNotExist:
                    logging.error(f"Subscription purchase not found: {tx_ref}")
                    return Response({'error': 'Purchase not found'}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({'status': 'success', 'message': 'Subscription webhook processed successfully'})
            
        except Exception as e:
            logging.error(f"Subscription webhook processing error: {e}")
            return Response({'error': 'Webhook processing failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BankListView(APIView):
    """Get list of Ethiopian banks for subaccount creation"""
    # Bank list is non-sensitive; allow public read so clients (web/mobile) and
    # browser tools can fetch it without an auth token.
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        try:
            response = requests.get(
                'https://api.chapa.co/v1/banks',
                headers={
                    'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return Response(data)
            else:
                return Response({'error': 'Failed to fetch banks'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logging.error(f"Bank list fetch error: {e}")
            return Response({'error': 'Service unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CreateSubaccountView(APIView):
    """Create a Chapa subaccount for receiving gift earnings"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        from .models import UserSubaccount
        
        # Check if user already has a subaccount
        if hasattr(request.user, 'subaccount'):
            return Response({
                'error': 'You already have a subaccount',
                'subaccount_id': request.user.subaccount.subaccount_id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get bank details from request
        bank_code = request.data.get('bank_code')
        account_number = request.data.get('account_number')
        account_name = request.data.get('account_name')
        
        if not all([bank_code, account_number, account_name]):
            return Response({
                'error': 'bank_code, account_number, and account_name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get bank name from bank_code
        try:
            banks_response = requests.get(
                'https://api.chapa.co/v1/banks',
                headers={'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}'}
            )
            
            if banks_response.status_code == 200:
                banks_data = banks_response.json()
                banks = banks_data.get('data', [])
                bank = next((b for b in banks if str(b.get('id')) == str(bank_code)), None)
                bank_name = bank.get('name', 'Unknown Bank') if bank else 'Unknown Bank'
            else:
                bank_name = 'Unknown Bank'
        except Exception as e:
            logging.error(f"Failed to fetch bank name: {e}")
            bank_name = 'Unknown Bank'
        
        # Create Chapa subaccount
        chapa_payload = {
            "account_name": account_name,
            "bank_code": int(bank_code),
            "account_number": account_number,
            "split_value": 0.70,  # 70% to receiver
            "split_type": "percentage"
        }
        
        try:
            logging.info(f"Creating Chapa subaccount for user {request.user.username}: {chapa_payload}")
            
            response = requests.post(
                'https://api.chapa.co/v1/subaccount',
                json=chapa_payload,
                headers={
                    'Authorization': f'Bearer {settings.CHAPA_SECRET_KEY}',
                    'Content-Type': 'application/json'
                }
            )
            
            logging.info(f"Chapa subaccount response: {response.status_code} - {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'success':
                    # Extract subaccount ID from response - try multiple possible formats
                    data_obj = data.get('data', {})
                    subaccount_id = (
                        data_obj.get('subaccounts[id]') or 
                        data_obj.get('id') or
                        data_obj.get('subaccount_id') or
                        data_obj.get('sub_account_id')
                    )
                    
                    # If data is a string, it might be the ID itself
                    if not subaccount_id and isinstance(data_obj, str):
                        subaccount_id = data_obj
                    
                    # Log the full response for debugging
                    logging.info(f"Extracted subaccount_id: {subaccount_id} from data: {data}")
                    
                    if not subaccount_id:
                        logging.error(f"No subaccount ID in response: {data}")
                        return Response({
                            'error': 'Failed to get subaccount ID from Chapa',
                            'details': data if settings.DEBUG else None
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Create UserSubaccount record
                    subaccount = UserSubaccount.objects.create(
                        user=request.user,
                        bank_code=bank_code,
                        bank_name=bank_name,
                        account_number=account_number,
                        account_name=account_name,
                        subaccount_id=subaccount_id,
                        split_type='percentage',
                        split_value=0.70,
                        is_verified=True  # Assume verified if Chapa accepted it
                    )
                    
                    logging.info(f"Subaccount created successfully for user {request.user.username}: {subaccount_id}")
                    
                    return Response({
                        'success': True,
                        'message': 'Subaccount created successfully',
                        'subaccount_id': subaccount_id,
                        'bank_name': bank_name,
                        'account_number': account_number[-4:].rjust(len(account_number), '*')  # Mask account number
                    })
                else:
                    logging.error(f"Chapa subaccount creation failed: {data}")
                    return Response({
                        'error': 'Subaccount creation failed',
                        'message': data.get('message', 'Unknown error'),
                        'details': data if settings.DEBUG else None
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                error_data = None
                try:
                    error_data = response.json()
                except:
                    error_data = response.text
                
                logging.error(f"Chapa subaccount API error {response.status_code}: {error_data}")
                return Response({
                    'error': 'Failed to create subaccount',
                    'status_code': response.status_code,
                    'details': error_data if settings.DEBUG else None
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logging.error(f"Subaccount creation error: {e}")
            return Response({
                'error': 'Service unavailable',
                'message': str(e) if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class SubaccountStatusView(APIView):
    """Get user's subaccount status and earnings"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get(self, request):
        from .models import UserSubaccount
        
        try:
            subaccount = request.user.subaccount
            
            return Response({
                'has_subaccount': True,
                'bank_name': subaccount.bank_name,
                'account_number': subaccount.account_number[-4:].rjust(len(subaccount.account_number), '*'),
                'total_earnings': str(subaccount.total_earnings_etb),
                'total_withdrawn': str(subaccount.total_withdrawn_etb),
                'available_balance': str(subaccount.available_balance),
                'is_active': subaccount.is_active,
                'is_verified': subaccount.is_verified,
                'created_at': subaccount.created_at.isoformat()
            })
            
        except UserSubaccount.DoesNotExist:
            return Response({
                'has_subaccount': False,
                'message': 'No subaccount found. Create one to start earning from gifts!'
            })
        except Exception as e:
            logging.error(f"Subaccount status error: {e}")
            return Response({'error': 'Failed to fetch subaccount status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeleteSubaccountView(APIView):
    """Delete user's subaccount (allows them to add a new one)"""
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def post(self, request):
        from .models import UserSubaccount
        
        try:
            subaccount = request.user.subaccount
            
            # Check if user has pending earnings
            if subaccount.available_balance > 0:
                return Response({
                    'error': 'Cannot delete subaccount with pending earnings',
                    'available_balance': str(subaccount.available_balance),
                    'message': 'Please withdraw or wait for settlement of your earnings before changing accounts'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Store info for logging
            bank_name = subaccount.bank_name
            account_number = subaccount.account_number
            
            # Delete the subaccount
            subaccount.delete()
            
            logging.info(f"Subaccount deleted for user {request.user.username}: {bank_name} - {account_number}")
            
            return Response({
                'success': True,
                'message': 'Bank account removed successfully. You can now add a new account.'
            })
            
        except UserSubaccount.DoesNotExist:
            return Response({
                'error': 'No subaccount found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logging.error(f"Delete subaccount error: {e}")
            return Response({
                'error': 'Failed to delete subaccount',
                'message': str(e) if settings.DEBUG else 'Please try again later'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)