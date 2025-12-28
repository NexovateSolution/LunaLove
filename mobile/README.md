# LunaLove Mobile App

A production-grade React Native dating application built with Expo, TypeScript, and modern mobile development best practices.

## 🚀 Features

### Core Features
- **Swipe-based Discovery**: Tinder-style card swiping with smooth animations
- **Real-time Matching**: Instant match notifications with celebration animations
- **Three-Section Matches**:
  - My Matches (mutual likes with chat unlocked)
  - People I Like (private list with remove functionality)
  - Who Likes Me (subscription-gated with blur effect)
- **Real-time Chat**: WebSocket-based messaging with typing indicators and read receipts
- **Gift System**: Send virtual gifts with TikTok-style animations
- **Coin Economy**: Purchase coins via Chapa payment gateway
- **Subscription System**:
  - Boost (increase profile visibility)
  - Likes Reveal (see who liked you)
  - Ad-Free (remove ads)
- **Ad Logic**: Show ads every 7 swipes for free users

### Technical Highlights
- **TypeScript**: Full type safety across the codebase
- **State Management**: Zustand for global state + React Query for server state
- **Real-time**: WebSocket integration for live updates
- **Animations**: React Native Reanimated for 60fps animations
- **Secure Storage**: Expo Secure Store for auth tokens
- **API Integration**: Axios with interceptors for authentication
- **Navigation**: React Navigation with type-safe routing

## 📁 Project Structure

```
mobile/
├── src/
│   ├── navigation/          # Navigation setup and types
│   ├── screens/             # Screen components
│   │   ├── Auth/           # Google login
│   │   ├── Home/           # Swiping interface
│   │   ├── Matches/        # Three-section matches
│   │   ├── Chat/           # Real-time messaging
│   │   ├── BuyCoins/       # Coin purchase
│   │   ├── Purchase/       # Subscriptions
│   │   ├── Profile/        # User profile
│   │   └── Settings/       # App settings
│   ├── components/          # Reusable components
│   │   ├── cards/          # SwipeCard component
│   │   ├── chat/           # GiftAnimation component
│   │   └── common/         # Shared components
│   ├── services/            # API and WebSocket services
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   ├── constants/           # App configuration
│   └── utils/               # Utility functions
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
└── package.json             # Dependencies
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode (for iOS)
- Backend API running at `http://localhost:8000`

### Installation

1. **Install Dependencies**
```bash
cd mobile
npm install
```

2. **Configure Backend URL**

Update `src/constants/config.ts` if your backend is not on localhost:
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_BACKEND_IP:8000/api',
  WS_URL: 'ws://YOUR_BACKEND_IP:8000/ws',
};
```

3. **Configure Google OAuth**

Update `src/screens/Auth/AuthScreen.tsx` with your Google OAuth credentials:
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  webClientId: '88081205961-an236jgbinv50ef8h6ogpa9sm59ii5dg.apps.googleusercontent.com',
});
```

### Running the App

#### Development Mode

**Start Expo Dev Server:**
```bash
npm start
```

**Run on Android:**
```bash
npm run android
```

**Run on iOS (macOS only):**
```bash
npm run ios
```

**Run on Web:**
```bash
npm run web
```

#### Using Expo Go App

1. Install Expo Go on your phone from App Store or Play Store
2. Run `npm start`
3. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### Building for Production

#### Android APK

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Configure EAS:**
```bash
eas build:configure
```

3. **Build APK:**
```bash
eas build --platform android --profile preview
```

#### iOS App

```bash
eas build --platform ios --profile preview
```

## 🔧 Configuration

### Environment Variables

The app uses these configuration constants in `src/constants/config.ts`:

- `API_BASE_URL`: Backend API endpoint
- `WS_URL`: WebSocket endpoint
- `AD_SWIPES_BETWEEN_ADS`: Number of swipes between ads (default: 7)
- `ANIMATION_DURATIONS`: Animation timing constants

### Subscription Plans

Configured in backend. The app dynamically fetches:
- Boost (profile visibility)
- Likes Reveal (see who likes you)
- Ad-Free (remove ads)

### Coin Packages

Configured in backend. The app displays packages with:
- Coin amount
- Bonus coins
- Price in ETB
- Popular badge

## 🎨 Design System

### Colors
- Primary: `#FF4458` (Pink/Red)
- Secondary: `#FE9A8B` (Light Pink)
- Success: `#4CAF50` (Green)
- Error: `#F44336` (Red)
- Warning: `#FFC107` (Yellow)

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

### Font Sizes
- xs: 12px
- sm: 14px
- md: 16px
- lg: 18px
- xl: 24px
- xxl: 32px

## 🔐 Security

- Auth tokens stored in Expo Secure Store
- HTTPS/WSS for production
- Token refresh on 401 errors
- Secure payment flow via Chapa

## 📱 Features Implementation

### Swiping Logic
- Cards stack with depth effect
- Swipe left (dislike) or right (like)
- Threshold-based swipe detection
- Smooth animations with React Native Reanimated
- Photo navigation (tap left/right)
- Match celebration modal

### Ad System
- Shows ad every 7 swipes for free users
- Completely disabled for Ad-Free subscribers
- 5-second ad duration
- Upgrade prompt in ad modal

### Subscription Gating
- "Who Likes Me" locked without Likes Reveal
- Blurred photos with lock icon
- Clear upgrade prompts
- Active subscription badges

### Real-time Features
- WebSocket connection on login
- Auto-reconnect with exponential backoff
- Heartbeat ping every 30 seconds
- Typing indicators
- Read receipts
- New message notifications

### Gift Animations
- TikTok-style full-screen animations
- Queue system for multiple gifts
- 3-second display duration
- Smooth entrance and exit animations

## 🐛 Troubleshooting

### Common Issues

**1. Metro Bundler Issues**
```bash
npm start -- --reset-cache
```

**2. Android Build Errors**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**3. iOS Pod Issues**
```bash
cd ios
pod install
cd ..
npm run ios
```

**4. WebSocket Connection Failed**
- Check backend is running
- Verify WebSocket URL in config
- Check firewall settings
- Use ngrok for testing on physical device

**5. Google Login Not Working**
- Verify OAuth credentials
- Check SHA-1 fingerprint for Android
- Enable Google Sign-In API in Google Console

## 📊 Performance

- 60fps animations with Reanimated
- Optimistic updates for instant feedback
- Image caching with React Native Fast Image
- Lazy loading for large lists
- Debounced typing indicators

## 🚢 Deployment Checklist

- [ ] Update API URLs to production
- [ ] Configure Google OAuth for production
- [ ] Set up Chapa production keys
- [ ] Generate app icons and splash screens
- [ ] Configure app signing
- [ ] Test on physical devices
- [ ] Submit to Play Store / App Store
- [ ] Set up crash reporting (Sentry)
- [ ] Configure analytics (Firebase)

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For support, email support@lunalove.app

---

Built with ❤️ using React Native & Expo
