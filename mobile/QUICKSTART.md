# LunaLove Mobile - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Backend

```bash
cd ../backend
python manage.py runserver
```

Make sure PostgreSQL is running and the backend is accessible at `http://localhost:8000`

### Step 2: Configure Google OAuth (Important!)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials for:
   - **Android**: Get SHA-1 fingerprint and create Android client
   - **iOS**: Create iOS client
   - **Web**: Use existing web client ID

3. Update `src/screens/Auth/AuthScreen.tsx`:
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId: '88081205961-an236jgbinv50ef8h6ogpa9sm59ii5dg.apps.googleusercontent.com',
});
```

### Step 3: Update API Configuration

If testing on a physical device, update `src/constants/config.ts`:

```typescript
export const API_CONFIG = {
  // Use your computer's IP address, not localhost
  BASE_URL: 'http://192.168.1.XXX:8000/api',
  WS_URL: 'ws://192.168.1.XXX:8000/ws',
  TIMEOUT: 10000,
};
```

**Find your IP:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### Step 4: Start the Mobile App

```bash
npm start
```

This will open Expo Dev Tools in your browser.

### Step 5: Run on Device

**Option A: Expo Go (Easiest)**
1. Install Expo Go from App Store or Play Store
2. Scan the QR code from the terminal
3. App will load on your phone

**Option B: Android Emulator**
```bash
npm run android
```

**Option C: iOS Simulator (Mac only)**
```bash
npm run ios
```

## 🔧 Testing Features

### 1. Authentication
- Tap "Continue with Google"
- Sign in with your Google account
- Should redirect to Home screen

### 2. Swiping
- Swipe right to like
- Swipe left to dislike
- Every 7 swipes, an ad will appear (if not Ad-Free subscriber)

### 3. Matching
- Like a profile
- If they like you back, you'll see a match celebration
- Go to Matches tab to see your matches

### 4. Chat
- Tap on a match to open chat
- Send text messages
- Tap gift icon to send virtual gifts (requires coins)

### 5. Coins & Subscriptions
- Go to Profile tab
- Tap "Buy Coins" to purchase coins
- Tap "Upgrade to Premium" for subscriptions

## 🐛 Common Issues & Fixes

### Issue: "Network request failed"
**Solution:** 
- Check backend is running
- Update API_CONFIG with correct IP address
- Disable firewall temporarily for testing

### Issue: Google login not working
**Solution:**
- Verify OAuth credentials are correct
- Check bundle identifier matches Google Console
- For Android, ensure SHA-1 fingerprint is added

### Issue: "Unable to resolve module"
**Solution:**
```bash
npm start -- --reset-cache
```

### Issue: WebSocket connection failed
**Solution:**
- Check WebSocket URL in config
- Ensure backend WebSocket is configured correctly
- Try using ngrok for testing: `ngrok http 8000`

### Issue: App crashes on startup
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -- --reset-cache
```

## 📱 Testing on Physical Device

### Android
1. Enable Developer Options on your phone
2. Enable USB Debugging
3. Connect phone via USB
4. Run: `npm run android`

### iOS (Mac only)
1. Connect iPhone via USB
2. Trust computer on iPhone
3. Run: `npm run ios`

## 🎨 Customization

### Change Colors
Edit `src/constants/config.ts`:
```typescript
export const COLORS = {
  primary: '#FF4458',     // Change this
  secondary: '#FE9A8B',   // And this
  // ...
};
```

### Adjust Ad Frequency
Edit `src/constants/config.ts`:
```typescript
export const AD_CONFIG = {
  SWIPES_BETWEEN_ADS: 7,  // Change this number
  AD_DURATION_MS: 5000,
};
```

### Modify Animations
Edit `src/constants/config.ts`:
```typescript
export const ANIMATION_DURATIONS = {
  SWIPE_CARD: 300,
  GIFT_ANIMATION: 3000,
  MATCH_CELEBRATION: 2500,
  LIKE_BUTTON: 150,
};
```

## 📊 Performance Tips

1. **Enable Hermes** (already enabled in Expo)
2. **Use Production Build** for testing performance:
   ```bash
   eas build --platform android --profile preview
   ```
3. **Monitor Performance** with React DevTools
4. **Optimize Images** - compress profile photos before upload

## 🚢 Building for Production

### Android APK

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure build:
```bash
eas build:configure
```

4. Build APK:
```bash
eas build --platform android --profile preview
```

5. Download APK from Expo dashboard and install on device

### iOS App (Mac only)

```bash
eas build --platform ios --profile preview
```

## 🔐 Security Checklist

Before deploying to production:

- [ ] Update API URLs to production endpoints
- [ ] Use HTTPS/WSS for all connections
- [ ] Configure production Google OAuth credentials
- [ ] Set up Chapa production keys in backend
- [ ] Enable ProGuard for Android
- [ ] Configure app signing
- [ ] Add error tracking (Sentry)
- [ ] Set up analytics (Firebase)

## 📞 Need Help?

- Check the main README.md for detailed documentation
- Review backend API documentation
- Test API endpoints with Postman
- Check Expo documentation: https://docs.expo.dev

## 🎯 Next Steps

1. **Add More Features:**
   - Profile editing
   - Photo upload
   - Location-based filtering
   - Push notifications

2. **Improve UX:**
   - Add skeleton loaders
   - Improve error messages
   - Add haptic feedback
   - Implement pull-to-refresh

3. **Optimize:**
   - Image caching
   - Reduce bundle size
   - Lazy load screens
   - Implement pagination

4. **Deploy:**
   - Submit to Play Store
   - Submit to App Store
   - Set up CI/CD pipeline
   - Configure app updates

---

**Happy Coding! 🚀**
