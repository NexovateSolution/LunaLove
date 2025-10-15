from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.auth import get_user_model, login
import json
from apps.payments.views import ChapaWebhookView


def health(_request):
    return JsonResponse({"status": "ok"})


@csrf_exempt
def google_auth_stub(request):
    """DEV ONLY: Stub endpoint for Google auth used by the web app.

    Accepts POST with JSON body that may include 'email' and 'name'.
    In DEBUG, will create/get a user and log them in; returns basic user info.
    In non-DEBUG, returns 404 to avoid exposing this in production.
    """
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    if not settings.DEBUG:
        return JsonResponse({"detail": "Not Found"}, status=404)

    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
    except Exception:
        data = {}

    email = (data.get("email") or "devuser@example.com").lower()
    name = data.get("name") or email.split("@")[0]

    User = get_user_model()
    user, _ = User.objects.get_or_create(
        username=email,
        defaults={"email": email, "is_active": True},
    )
    # Log the user into the session for convenience
    try:
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    except Exception:
        pass

    return JsonResponse({
        "message": "Google auth stub OK (DEBUG only)",
        "user": {"id": user.id, "username": user.username, "email": user.email, "name": name},
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health),
    path('api/auth/google/', google_auth_stub, name='google-auth-stub'),
    path('', include('apps.payments.urls')),
    path('webhooks/chapa/', ChapaWebhookView.as_view(), name='chapa-webhook'),
]
