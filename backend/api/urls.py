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
    ResetSwipesView
)

app_name = 'api'

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'user/photos', UserPhotoViewSet, basename='userphoto')

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', CustomLoginView.as_view(), name='user-login'),
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
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
    # The DRF router will generate the URLs for the UserPhotoViewSet for list, create, detail, update, delete.
    path('', include(router.urls)),
]