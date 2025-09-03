from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from apps.payments.views import ChapaWebhookView


def health(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health),
    path('', include('apps.payments.urls')),
    path('webhooks/chapa/', ChapaWebhookView.as_view(), name='chapa-webhook'),
]
