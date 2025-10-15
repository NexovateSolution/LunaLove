from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter
from .views import (
    UserRegistrationView, 
    CustomLoginView, 
    CurrentUserView, 
    UserPreferenceView, 
    UserPhotoViewSet, 
    InterestListView, 
    SwipeCreateView, 
    RewindSwipeView,
    MatchListView,
    PotentialMatchView,
    CityListView,
    GoogleLoginView,
    ChatbotView,
    InitializePaymentView,
    ChapaWebhookView,
    VerifyPaymentView,
    ResetSwipesView,
    SubscriptionPlansView,
    SubscribePlanView,
    SubscriptionActivateView,
    DevLoginView,
    # New enhanced matching system views
    LikeUserView,
    PeopleILikeView,
    PeopleWhoLikeMeView,
    MyMatchesView,
    RemoveLikeView,
    MatchDetailView,
    SendMessageView,
    MatchMessagesView,
    ChatMessagesView,
    CreateFakeLikeView,
    ClearLikesView,
)

app_name = 'api'

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'user/photos', UserPhotoViewSet, basename='userphoto')

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', CustomLoginView.as_view(), name='user-login'),
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    # Dev-only login bypass endpoint (requires DEBUG or GOOGLE_AUTH_BYPASS or PAYMENTS_BYPASS)
    path('dev/login/', DevLoginView.as_view(), name='dev-login'),
    # Subscriptions
    path('subscription-plans/', SubscriptionPlansView.as_view(), name='subscription-plans'),
    path('subscriptions/subscribe/', SubscribePlanView.as_view(), name='subscription-subscribe'),
    path('subscriptions/activate/', SubscriptionActivateView.as_view(), name='subscription-activate'),
    path('user/me/', CurrentUserView.as_view(), name='current-user'),
    path('user/preferences/', UserPreferenceView.as_view(), name='user-preference-detail'),
    path('interests/', InterestListView.as_view(), name='interest-list'),
    path('swipes/', SwipeCreateView.as_view(), name='swipe-create'),
    path('rewind/', RewindSwipeView.as_view(), name='rewind-swipe'),
    path('matches/', MatchListView.as_view(), name='match-list'),
    path('reset-swipes/', ResetSwipesView.as_view(), name='reset-swipes'),
    path('potential-matches/', PotentialMatchView.as_view(), name='potential-match-list'),
    path('cities/', CityListView.as_view(), name='city-list'),
    path('chatbot/', ChatbotView.as_view(), name='chatbot'),
    path('initialize-payment/', InitializePaymentView.as_view(), name='initialize-payment'),
    path('payment-webhook/', ChapaWebhookView.as_view(), name='payment-webhook'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
    
    # Enhanced Matching System URLs
    path('matches/like/', LikeUserView.as_view(), name='like-user'),
    path('matches/people-i-like/', PeopleILikeView.as_view(), name='people-i-like'),
    path('matches/people-who-like-me/', PeopleWhoLikeMeView.as_view(), name='people-who-like-me'),
    path('matches/my-matches/', MyMatchesView.as_view(), name='my-matches'),
    path('matches/remove-like/', RemoveLikeView.as_view(), name='remove-like'),
    path('matches/<uuid:pk>/', MatchDetailView.as_view(), name='match-detail'),
    path('matches/<uuid:match_id>/send-message/', SendMessageView.as_view(), name='send-message'),
    path('matches/<uuid:match_id>/messages/', MatchMessagesView.as_view(), name='match-messages'),
    
    # Real-time chat endpoints
    path('chat/<uuid:match_id>/messages/', ChatMessagesView.as_view(), name='chat-messages'),
    
    # Dev/Testing endpoints
    path('dev/create-fake-like/', CreateFakeLikeView.as_view(), name='create-fake-like'),
    path('dev/clear-likes/', ClearLikesView.as_view(), name='clear-likes'),
    
    # The DRF router will generate the URLs for the UserPhotoViewSet for list, create, detail, update, delete.
    path('', include(router.urls)),
]