import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shebalove_project.settings')
django.setup()

from api.models import User, CoinPackage
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

# Get a user and create token
user = User.objects.first()
if not user:
    print("ERROR: No users found")
    exit(1)

token, _ = Token.objects.get_or_create(user=user)
print(f"User: {user.username}")
print(f"Token: {token.key}")

# Get a package
package = CoinPackage.objects.filter(is_active=True).first()
if not package:
    print("ERROR: No active packages")
    exit(1)

print(f"Package ID: {package.id}")
print(f"Package Name: {package.name}")

# Test the API
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

response = client.post('/api/coins/purchase/', {
    'package_id': str(package.id)
}, format='json')

print(f"\nResponse Status: {response.status_code}")
print(f"Response Data: {response.data}")
