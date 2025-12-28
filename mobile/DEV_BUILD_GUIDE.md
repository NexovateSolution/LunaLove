# Development Build Setup - Fix Reanimated Issue

## Why Development Build?

Expo Go has limitations with native modules like React Native Reanimated. A development build is a custom version of your app that includes all native dependencies properly configured.

## 🚀 Quick Setup (Android)

### Step 1: Install Android Studio

If you don't have it:
1. Download [Android Studio](https://developer.android.com/studio)
2. Install Android SDK
3. Set up Android emulator or connect physical device

### Step 2: Build the Development App

```bash
npx expo run:android
```

This will:
- Build a custom development version of your app
- Install it on your connected device/emulator
- Start Metro bundler
- Your app will load with all native modules working!

**Note**: First build takes 5-10 minutes. Subsequent builds are faster.

### Step 3: Development Workflow

After the initial build, you can develop normally:

```bash
npm start
```

The app will reload automatically when you make changes (just like Expo Go).

---

## 📱 Alternative: Use EAS Build (Cloud Build)

If you don't want to install Android Studio:

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure EAS

```bash
eas build:configure
```

### Step 3: Build Development APK

```bash
eas build --profile development --platform android
```

This builds in the cloud (takes ~10-15 minutes). You'll get a download link for the APK.

### Step 4: Install APK on Your Phone

1. Download APK from the link
2. Install on your phone
3. Run `npm start`
4. Open the development app
5. Scan QR code or enter URL

---

## 🔄 Comparison

| Method | Pros | Cons |
|--------|------|------|
| **Expo Go** | Fast, no build needed | Limited native modules |
| **expo run:android** | Full control, fast rebuilds | Requires Android Studio |
| **EAS Build** | No local setup needed | Slower, requires internet |

---

## ⚡ Fastest Solution Right Now

Run this command:

```bash
npx expo run:android
```

If you have Android Studio installed, this will build and run your app in ~5-10 minutes with all native modules working perfectly.

If you don't have Android Studio, I can help you set it up or use EAS Build instead.

---

## 🎯 What This Fixes

✅ React Native Reanimated works perfectly
✅ All native modules properly initialized
✅ No version mismatch errors
✅ Full animation support (60fps)
✅ All app features work as designed

---

## 💡 After Development Build

Once you have the development build installed:
- You only build once
- Then use `npm start` like normal
- Hot reload works just like Expo Go
- All features work perfectly
