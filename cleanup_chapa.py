#!/usr/bin/env python3
"""
Helper script to complete Chapa removal from LunaLove backend
Run this from the backend directory: python ../cleanup_chapa.py
"""

import os
import re

def backup_file(filepath):
    """Create a backup of the file before modifying"""
    backup_path = filepath + '.backup'
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Backed up: {filepath} -> {backup_path}")
        return True
    return False

def remove_chapa_from_settings():
    """Remove CHAPA_SECRET_KEY from settings.py"""
    settings_path = 'shebalove_project/settings.py'
    if not os.path.exists(settings_path):
        print(f"❌ File not found: {settings_path}")
        return False
    
    backup_file(settings_path)
    
    with open(settings_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove CHAPA_SECRET_KEY line
    content = re.sub(r"CHAPA_SECRET_KEY\s*=\s*os\.getenv\(['\"]CHAPA_SECRET_KEY['\"],\s*['\"]['\"]?\)", '', content)
    
    with open(settings_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Removed CHAPA_SECRET_KEY from {settings_path}")
    return True

def comment_out_chapa_in_env():
    """Comment out CHAPA_SECRET_KEY in .env"""
    env_path = '.env'
    if not os.path.exists(env_path):
        print(f"⚠️  File not found: {env_path}")
        return False
    
    backup_file(env_path)
    
    with open(env_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if line.strip().startswith('CHAPA_SECRET_KEY'):
            new_lines.append(f"# {line}")
            print(f"✅ Commented out: {line.strip()}")
        else:
            new_lines.append(line)
    
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    return True

def update_urls():
    """Remove Chapa-related imports and URLs from api/urls.py"""
    urls_path = 'api/urls.py'
    if not os.path.exists(urls_path):
        print(f"❌ File not found: {urls_path}")
        return False
    
    backup_file(urls_path)
    
    with open(urls_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove ChapaWebhookView and CreateSubAccountView from imports
    content = re.sub(r',?\s*ChapaWebhookView\s*,?', '', content)
    content = re.sub(r',?\s*CreateSubAccountView\s*,?', '', content)
    
    # Remove URL patterns
    content = re.sub(r"path\('subaccount/create/',.*?name='create-subaccount'\),?\n", '', content)
    content = re.sub(r"path\('chapa/webhook/',.*?name='chapa-webhook'\),?\n", '', content)
    
    with open(urls_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Cleaned up {urls_path}")
    return True

def main():
    print("=" * 60)
    print("Chapa Integration Removal Helper Script")
    print("=" * 60)
    print()
    
    if not os.path.exists('manage.py'):
        print("❌ Error: This script must be run from the backend directory")
        print("   Usage: cd backend && python ../cleanup_chapa.py")
        return
    
    print("Starting cleanup...")
    print()
    
    # Step 1: Clean settings.py
    print("1. Cleaning settings.py...")
    remove_chapa_from_settings()
    print()
    
    # Step 2: Comment out .env
    print("2. Commenting out Chapa key in .env...")
    comment_out_chapa_in_env()
    print()
    
    # Step 3: Update urls.py
    print("3. Updating api/urls.py...")
    update_urls()
    print()
    
    print("=" * 60)
    print("✅ Automated cleanup complete!")
    print("=" * 60)
    print()
    print("📋 Manual steps remaining:")
    print("1. Edit api/views.py to remove Chapa views")
    print("2. Copy content from api/views_payment_stub.py")
    print("3. Update api/serializers.py")
    print("4. Run: python manage.py migrate api 0019")
    print()
    print("See CHAPA_REMOVAL_SUMMARY.md for detailed instructions")

if __name__ == '__main__':
    main()
