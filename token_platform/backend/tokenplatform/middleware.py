import os
from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.shortcuts import redirect


class DevAutoLoginMiddleware:
    """
    Auto-login the first active superuser for /admin requests in development.

    Enabled only when DEBUG=True and DEV_AUTO_LOGIN=1 in environment.
    This is for local development convenience. DO NOT enable in production.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            if settings.DEBUG and os.environ.get("DEV_AUTO_LOGIN", "0") == "1":
                # Only affect admin URLs
                if request.path.startswith("/admin"):
                    # If not already authenticated, log in a superuser and redirect
                    user = getattr(request, "user", None)
                    if not getattr(user, "is_authenticated", False):
                        User = get_user_model()
                        su = (
                            User.objects.filter(is_superuser=True, is_active=True)
                            .order_by("id")
                            .first()
                        )
                        if su:
                            login(
                                request,
                                su,
                                backend="django.contrib.auth.backends.ModelBackend",
                            )
                            # Ensure AuthenticationMiddleware picks up the session on a new request.
                            # Redirect to /admin/ explicitly (not the login URL) to avoid showing the form.
                            return redirect("/admin/")
        except Exception:
            # Fail open (no auto-login) if anything goes wrong
            pass

        return self.get_response(request)
