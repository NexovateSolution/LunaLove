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
)

urlpatterns = [
    path('api/gifts/', GiftListView.as_view(), name='gift-list'),
    path('api/coins/packages/', CoinPackageListView.as_view(), name='coinpackage-list'),
    path('api/coins/topup/', TopUpCreateView.as_view(), name='topup-create'),
    path('api/payments/<int:pk>/receipt/', ReceiptRetrieveView.as_view(), name='receipt-detail'),
    path('api/gifts/send/', GiftSendView.as_view(), name='gift-send'),
    path('api/wallet/', WalletView.as_view(), name='wallet'),
    path('api/wallet/withdraw/', WithdrawRequestView.as_view(), name='wallet-withdraw'),
    path('api/kyc/submit/', KYCSubmitView.as_view(), name='kyc-submit'),
    # Admin endpoints
    path('api/admin/withdrawals/', AdminWithdrawalListView.as_view(), name='admin-withdrawal-list'),
    path('api/admin/withdrawals/<int:pk>/approve', AdminWithdrawalApproveView.as_view(), name='admin-withdrawal-approve'),
    path('api/admin/withdrawals/<int:pk>/reject', AdminWithdrawalRejectView.as_view(), name='admin-withdrawal-reject'),
]
