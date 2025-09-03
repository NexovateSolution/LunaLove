from functools import wraps
from rest_framework.response import Response
from rest_framework import status

from .models import Wallet


def require_kyc(level: int = 1):
    """Decorator to enforce a minimum KYC level and check risk block on a view method.

    Usage on class-based views:

        from django.utils.decorators import method_decorator
        @method_decorator(require_kyc(2), name='post')
        class WithdrawRequestView(APIView):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(self, request, *args, **kwargs):
            user = request.user
            if not user or not user.is_authenticated:
                return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            wallet, _ = Wallet.objects.get_or_create(user=user)
            if wallet.withdrawals_blocked:
                return Response({"detail": "Withdrawals blocked pending risk review"}, status=status.HTTP_403_FORBIDDEN)
            if wallet.kyc_level < level:
                return Response({"detail": "KYC level insufficient"}, status=status.HTTP_403_FORBIDDEN)
            return view_func(self, request, *args, **kwargs)
        return _wrapped

    return decorator
