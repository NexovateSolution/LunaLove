#!/usr/bin/env python3
"""
Quick test script to verify Google Auth endpoint is working.
Run this from the backend directory after starting the Django server.
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_google_auth_bypass():
    """Test the Google Auth endpoint with bypass enabled."""
    
    # Mock Google ID token (this will be bypassed in dev mode)
    mock_token = "mock.eyJhdWQiOiI4ODA4MTIwNTk2MS1hbjIzNmpnYmludjUwZWY4aDZvZ3BhOXNtNTlpaTVkZy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImdpdmVuX25hbWUiOiJUZXN0IiwiZmFtaWx5X25hbWUiOiJVc2VyIn0.signature"
    
    url = "http://localhost:8000/api/auth/google/"
    payload = {"id_token": mock_token}
    headers = {"Content-Type": "application/json"}
    
    try:
        print("Testing Google Auth endpoint...")
        print(f"URL: {url}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print(f"GOOGLE_AUTH_BYPASS: {os.getenv('GOOGLE_AUTH_BYPASS', 'Not set')}")
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response Body: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Response Body (raw): {response.text}")
            
        if response.status_code == 200 or response.status_code == 201:
            print("\n✅ Google Auth endpoint is working!")
        else:
            print(f"\n❌ Google Auth endpoint failed with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error testing Google Auth: {e}")

if __name__ == "__main__":
    test_google_auth_bypass()
