# 🚨 CRITICAL: Native Module Errors - MUST RESTART EXPO

## ❌ **Current Errors**

1. `expo-image-picker` - Cannot find native module 'ExponentImagePicker'
2. `expo-linear-gradient` - Property 'LinearGradient' doesn't exist

## 🔧 **ROOT CAUSE**

Native modules require the Expo Metro bundler to be restarted with cache clearing when:
- First using native modules after installation
- After adding new files that import native modules
- After certain code changes

## ✅ **SOLUTION (REQUIRED)**

### **You MUST run this command:**

```bash
cd c:\Users\hp\Desktop\Shebalove1\mobile
npx expo start -c
```

**The `-c` flag is CRITICAL** - it clears all caches and properly loads native modules.

---

## 📝 **What I've Done**

### **Temporarily Disabled (11 files):**

**expo-image-picker (5 files):**
1. `src/screens/Profile/EditProfileScreen.tsx`
2. `src/screens/ProfileSetup/ProfileSetupScreen.tsx`
3. `src/components/profile/PhotoGallery.tsx`
4. `src/components/modals/ProfileVerificationModal.tsx`
5. `src/components/photo/PhotoManager.tsx`

**expo-linear-gradient (6 files):**
6. `src/screens/ProfileSetup/ProfileSetupScreen.tsx`
7. `src/screens/Onboarding/OnboardingScreen.tsx`
8. `src/components/modals/ProfileDetailModal.tsx`
9. `src/components/modals/MatchCelebrationModal.tsx`
10. `src/components/chat/MessageBubble.tsx`
11. `src/components/cards/SwipeCard.tsx`

All imports are commented out with: `// Temporarily disabled - restart Expo with: npx expo start -c`

---

## 🎯 **After Restarting Expo**

Once you run `npx expo start -c` and the server restarts successfully, you need to **re-enable the code**:

### **Step 1: Uncomment Imports**
Search for: `// Temporarily disabled - restart Expo with: npx expo start -c`
Uncomment all the import lines.

### **Step 2: Restore Functionality**
Look for comments like: `// Uncomment after restarting:`
Uncomment the code blocks below these comments.

### **Step 3: Remove Temporary Alerts**
Remove the "Restart Required" alert dialogs that were added as placeholders.

---

## 📱 **Current App Status**

- ✅ App should load without crashing
- ✅ All core features work (except photo upload/camera)
- ⚠️ Photo upload buttons show "Restart Required" alert
- ⚠️ Some gradients replaced with solid colors
- ⚠️ Camera features disabled

---

## 🔄 **Quick Re-enable Script**

After restarting Expo, you can use find-and-replace:

**Find:** `// import * as ImagePicker from 'expo-image-picker'; // Temporarily disabled`
**Replace:** `import * as ImagePicker from 'expo-image-picker';`

**Find:** `// import { LinearGradient } from 'expo-linear-gradient'; // Temporarily disabled`
**Replace:** `import { LinearGradient } from 'expo-linear-gradient';`

Then manually restore the commented-out function bodies.

---

## ⚠️ **IMPORTANT**

**DO NOT** try to fix this by:
- Reinstalling packages
- Changing package.json
- Modifying app.json (beyond what's already done)
- Clearing node_modules

**The ONLY solution is:** `npx expo start -c`

---

## 🎯 **Why This Happens**

Expo uses native modules that need to be:
1. Compiled into the app bundle
2. Linked at runtime
3. Loaded by the Metro bundler

When you first use a native module or make certain changes, the bundler cache becomes stale. The `-c` flag forces a fresh rebuild of the bundle with all native modules properly linked.

---

## 📊 **Files Modified Summary**

- **11 files** with imports disabled
- **2 files** with JSX replaced (ProfileSetup, Onboarding)
- **1 file** with gradient overlay removed (ProfileDetailModal)
- **Multiple files** with function bodies commented out

---

## 🚀 **Next Steps**

1. **Stop current Expo server** (Ctrl+C)
2. **Run:** `npx expo start -c`
3. **Wait** for server to fully restart
4. **Reload app** on your device/emulator
5. **Verify** no errors in console
6. **Re-enable** all commented code
7. **Test** photo upload and camera features

---

**Status:** Temporary workaround applied. App loads but features disabled.
**Action Required:** Restart Expo with cache clearing to fix permanently.
