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
import requests # Import the requests library
import uuid # Import the uuid library for generating unique IDs
from django.core.cache import cache # Import Django's cache
from django.conf import settings
import os
import hmac
import hashlib
import logging
import time

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
from rest_framework.authtoken.views import ObtainAuthToken # Import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes # Import api_view decorator
# AllowAny for registration, IsAuthenticated for protected views

from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserPreferenceSerializer, 
    UserPhotoSerializer, InterestSerializer, SwipeSerializer, 
    PotentialMatchSerializer, LikeSerializer, LikeCreateSerializer, 
    PeopleWhoLikeMeSerializer, ChatbotConversationSerializer, 
    ChatbotMessageSerializer, ChatMessageSerializer
)
from .models import (
    User, UserPreference, UserPhoto, Interest, Swipe, Like, Match, Message, 
    ChatbotConversation, ChatbotMessage, ChatMessage
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
        api_url = f"http://api.geonames.org/searchJSON?country={country_code}&featureClass=P&maxRows=1000&orderby=population&username={geonames_username}"

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
                
                # Cache the result for 24 hours (86400 seconds)
                cache.set(cache_key, unique_cities, timeout=86400)
                
                return Response(unique_cities, status=status.HTTP_200_OK)
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

    def post(self, request, *args, **kwargs):
        try:
            plan_id = int(request.data.get('plan_id'))
        except (TypeError, ValueError):
            return Response({'detail': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic validation for demo plans
        if plan_id not in {1, 2, 3}:
            return Response({'detail': 'Invalid plan_id'}, status=status.HTTP_400_BAD_REQUEST)

        # Build a stubbed checkout URL redirecting back to the frontend
        base = getattr(settings, 'FRONTEND_URL', os.environ.get('FRONTEND_URL', 'http://localhost:5173'))
        reference = f"sub-{plan_id}-{request.user.id}-{uuid.uuid4().hex[:8]}"
        checkout_url = f"{base}/purchase-success/?status=success&reference={reference}&plan_id={plan_id}"
        return Response({'checkout_url': checkout_url, 'reference': reference}, status=status.HTTP_201_CREATED)


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