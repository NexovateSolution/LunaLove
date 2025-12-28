# LunaLove Mobile - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### Backend Configuration
- [ ] Backend deployed to production server
- [ ] PostgreSQL database configured and migrated
- [ ] HTTPS enabled with valid SSL certificate
- [ ] WebSocket (WSS) configured and working
- [ ] Chapa production keys configured
- [ ] CORS configured for mobile app
- [ ] Static files served correctly
- [ ] Environment variables set

### Mobile App Configuration
- [ ] Update API URLs to production
- [ ] Configure production Google OAuth
- [ ] Update app name and bundle identifier
- [ ] Generate app icons (1024x1024)
- [ ] Generate splash screen
- [ ] Configure app signing
- [ ] Test on multiple devices
- [ ] Performance optimization complete

## 🔧 Production Configuration

### 1. Update API Configuration

Edit `src/constants/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:8000/api' 
    : 'https://api.lunalove.app/api',  // Your production URL
  WS_URL: __DEV__ 
    ? 'ws://localhost:8000/ws' 
    : 'wss://api.lunalove.app/ws',     // Your production WebSocket URL
  TIMEOUT: 10000,
};
```

### 2. Configure Google OAuth

#### Get Production Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "Credentials"
4. Create OAuth 2.0 Client IDs:

**For Android:**
```bash
# Get SHA-1 fingerprint
cd android
./gradlew signingReport

# Or for release keystore
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

**For iOS:**
- Bundle ID: `com.lunalove.app`
- Download GoogleService-Info.plist

#### Update Auth Screen

Edit `src/screens/Auth/AuthScreen.tsx`:

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'YOUR_PROD_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_PROD_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_PROD_WEB_CLIENT_ID.apps.googleusercontent.com',
});
```

### 3. Update App Configuration

Edit `app.json`:

```json
{
  "expo": {
    "name": "LunaLove",
    "slug": "lunalove",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.lunalove.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.lunalove.app",
      "versionCode": 1
    }
  }
}
```

## 🏗️ Building for Production

### Android Build

#### 1. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

#### 2. Configure EAS Build

```bash
eas build:configure
```

This creates `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

#### 3. Build APK

```bash
# For testing
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

#### 4. Build AAB (for Play Store)

Update `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

```bash
eas build --platform android --profile production
```

### iOS Build (Mac Required)

#### 1. Configure Signing

```bash
eas credentials
```

Follow prompts to:
- Create/upload distribution certificate
- Create/upload provisioning profile
- Configure push notification keys

#### 2. Build IPA

```bash
eas build --platform ios --profile production
```

## 📱 App Store Submission

### Google Play Store

#### 1. Prepare Assets

- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: 
  - Phone: 1080x1920 or 1080x2340
  - Tablet: 1536x2048
  - At least 2 screenshots per device type

#### 2. Create Play Console Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Complete account setup

#### 3. Create App Listing

- App name: LunaLove
- Short description (80 chars)
- Full description (4000 chars)
- Category: Dating
- Content rating: Mature 17+
- Privacy policy URL
- Contact email

#### 4. Upload AAB

1. Go to "Production" → "Create new release"
2. Upload AAB file
3. Add release notes
4. Review and rollout

### Apple App Store

#### 1. Prepare Assets

- **App Icon**: 1024x1024 PNG (no transparency)
- **Screenshots**: 
  - iPhone 6.7": 1290x2796
  - iPhone 6.5": 1284x2778
  - iPad Pro 12.9": 2048x2732
  - At least 3 screenshots per device

#### 2. Create App Store Connect Account

1. Enroll in [Apple Developer Program](https://developer.apple.com) ($99/year)
2. Complete enrollment
3. Access App Store Connect

#### 3. Create App Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: LunaLove
   - Primary Language: English
   - Bundle ID: com.lunalove.app
   - SKU: lunalove-ios

#### 4. Upload Build

```bash
# Build was created with EAS
# Download IPA from Expo dashboard
# Upload to App Store Connect via Transporter app
```

#### 5. Complete App Information

- App description
- Keywords
- Screenshots
- App preview video (optional)
- Age rating: 17+
- Privacy policy
- Support URL

#### 6. Submit for Review

1. Complete all required fields
2. Submit for review
3. Wait 1-3 days for approval

## 🔐 Security Configuration

### 1. Enable ProGuard (Android)

Create `android/app/proguard-rules.pro`:

```
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.reanimated.** { *; }
```

### 2. Configure App Transport Security (iOS)

In `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": false
        }
      }
    }
  }
}
```

### 3. Secure API Keys

Never commit:
- Google OAuth credentials
- Chapa API keys
- Any production secrets

Use environment variables or Expo Secrets:

```bash
eas secret:create --scope project --name GOOGLE_CLIENT_ID --value "your-client-id"
```

## 📊 Monitoring & Analytics

### 1. Crash Reporting - Sentry

```bash
npm install @sentry/react-native
```

Configure in `App.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

### 2. Analytics - Firebase

```bash
expo install @react-native-firebase/app @react-native-firebase/analytics
```

### 3. Performance Monitoring

```bash
expo install @react-native-firebase/perf
```

## 🚀 Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build Mobile App

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --profile production --non-interactive
```

## 📈 Post-Launch

### 1. Monitor Metrics

- Daily Active Users (DAU)
- Retention rates
- Crash-free sessions
- API response times
- Match success rate
- Revenue metrics

### 2. Gather Feedback

- In-app feedback form
- App Store reviews
- User surveys
- Support tickets

### 3. Iterate

- Fix critical bugs immediately
- Release updates every 2-4 weeks
- A/B test new features
- Optimize based on data

## 🔄 Update Strategy

### Over-The-Air (OTA) Updates

For JavaScript changes only:

```bash
eas update --branch production --message "Bug fixes"
```

### Full App Updates

For native code changes:

```bash
# Increment version
# Update app.json version and buildNumber/versionCode
eas build --platform all --profile production
```

## 📞 Support

### App Store Support

- Respond to reviews within 24 hours
- Provide clear update notes
- Maintain 4+ star rating

### User Support

- Email: support@lunalove.app
- In-app chat support
- FAQ section
- Video tutorials

## ✅ Launch Day Checklist

- [ ] Backend stable and monitored
- [ ] All features tested on real devices
- [ ] Privacy policy and terms published
- [ ] Support email configured
- [ ] Social media accounts ready
- [ ] Press kit prepared
- [ ] App Store listings complete
- [ ] Monitoring tools active
- [ ] Team briefed on launch procedures
- [ ] Rollback plan ready

---

**Good luck with your launch! 🎉**
