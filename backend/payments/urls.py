from django.urls import path
from .views import (
    TopUpCreateView,
    ReceiptRetrieveView,
    GiftSendView,
    WalletView,
    GiftListView,
    CoinPackageListView,
    WithdrawRequestView,
    AdminWithdrawalListView,
    AdminWithdrawalApproveView,
    AdminWithdrawalRejectView,
    KYCSubmitView,
    ChapaWebhookView,
    DevGrantCoinsView,
    SubscriptionPlansView,
    SubscribeToPlanView,
    ActivateSubscriptionView,
)

urlpatterns = [
    path('api/gifts/', GiftListView.as_view(), name='gift-list'),
    path('api/coins/packages/', CoinPackageListView.as_view(), name='coinpackage-list'),
    path('api/coins/topup/', TopUpCreateView.as_view(), name='topup-create'),
    path('api/payments/webhooks/chapa/', ChapaWebhookView.as_view(), name='chapa-webhook'),
    path('api/payments/<int:pk>/receipt/', ReceiptRetrieveView.as_view(), name='receipt-detail'),
    path('api/gifts/send/', GiftSendView.as_view(), name='gift-send'),
    path('api/wallet/', WalletView.as_view(), name='wallet'),
    path('api/wallet/withdraw/', WithdrawRequestView.as_view(), name='wallet-withdraw'),
    path('api/kyc/submit/', KYCSubmitView.as_view(), name='kyc-submit'),
    # Dev utilities (only active when PAYMENTS_BYPASS or DEBUG is true)
    path('api/dev/grant-coins/', DevGrantCoinsView.as_view(), name='dev-grant-coins'),
    # Subscriptions (dev/test stub)
    path('api/subscription-plans/', SubscriptionPlansView.as_view(), name='subscription-plans'),
    path('api/subscriptions/subscribe/', SubscribeToPlanView.as_view(), name='subscriptions-subscribe'),
    path('api/subscriptions/activate/', ActivateSubscriptionView.as_view(), name='subscriptions-activate'),
    # Admin endpoints
    path('api/admin/withdrawals/', AdminWithdrawalListView.as_view(), name='admin-withdrawal-list'),
    path('api/admin/withdrawals/<int:pk>/approve', AdminWithdrawalApproveView.as_view(), name='admin-withdrawal-approve'),
    path('api/admin/withdrawals/<int:pk>/reject', AdminWithdrawalRejectView.as_view(), name='admin-withdrawal-reject'),
]
