# 🔧 Native Module Error Fix - expo-image-picker

## ❌ **Error**
```
Error: Cannot find native module 'ExponentImagePicker'
```

## 🔍 **Root Cause**
The `expo-image-picker` native module isn't properly linked in the runtime. This happens when:
1. Native dependencies aren't installed
2. The development server needs to be restarted
3. The app cache needs to be cleared

## ✅ **Solution**

### **Step 1: Clear Cache and Restart**
```bash
# Stop the current Expo server (Ctrl+C)

# Clear Expo cache
npx expo start -c
```

### **Step 2: If Step 1 Doesn't Work - Reinstall Dependencies**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear Expo cache and start
npx expo start -c
```

### **Step 3: If Using Expo Go App**
Make sure you're using the latest version of Expo Go on your device:
- iOS: Update from App Store
- Android: Update from Google Play Store

### **Step 4: If Building Custom Dev Client**
```bash
# Build a new development client
npx expo run:android
# or
npx expo run:ios
```

## 🎯 **Quick Fix (Recommended)**

**Run this command:**
```bash
npx expo start -c
```

This will:
- Clear the Metro bundler cache
- Clear the Expo cache
- Restart the development server
- Reload all native modules

## 📝 **Why This Happens**

Native modules like `expo-image-picker` require:
1. Native code compilation (handled by Expo)
2. Proper linking in the runtime
3. Fresh cache after installation

When you add or update native dependencies, always restart with cache clearing.

## ✅ **Verification**

After restarting, the error should be gone and you should be able to:
- Use image picker in EditProfileScreen
- Upload photos in ProfileSetup
- Change profile photos

## 🚀 **Next Steps**

1. Stop current Expo server
2. Run: `npx expo start -c`
3. Reload the app on your device/emulator
4. Test the image picker functionality

---

**Status:** Dependencies are installed correctly. Just need to restart with cache clearing.
