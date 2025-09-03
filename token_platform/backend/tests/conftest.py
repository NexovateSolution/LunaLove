import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient


@pytest.fixture()
def api_client():
    return APIClient()


@pytest.fixture()
def user(db):
    User = get_user_model()
    return User.objects.create_user(username='tester', password='pass')


@pytest.fixture()
def admin_user(db):
    User = get_user_model()
    return User.objects.create_superuser(username='admin', password='adminpass', email='admin@example.com')
