# Expo Go Not Loading - Troubleshooting Guide

## Issue: App doesn't load after scanning QR code

### ✅ Step 1: Verify Both Devices Are on Same Network

**This is the most common issue!**

Your phone and computer MUST be on the same WiFi network.

- Computer: Connected to WiFi (not Ethernet)
- Phone: Connected to same WiFi network
- No VPN active on either device
- No firewall blocking connections

### ✅ Step 2: Use Tunnel Mode (Easiest Fix)

If same network doesn't work, use tunnel mode:

```bash
npm start -- --tunnel
```

This creates a secure tunnel through Expo servers. Slower but works everywhere.

### ✅ Step 3: Check Firewall Settings

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" and check both Private and Public
4. Click OK

**Or temporarily disable:**
```bash
# Run as Administrator
netsh advfirewall set allprofiles state off
```

### ✅ Step 4: Verify Expo Go Version

Make sure you have the latest Expo Go:
- Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### ✅ Step 5: Try Manual Connection

Instead of scanning QR:

1. Note the URL from terminal: `exp://192.168.x.x:8081`
2. Open Expo Go
3. Tap "Enter URL manually"
4. Type the URL
5. Tap "Connect"

### ✅ Step 6: Use Your Computer's IP Address

Find your IP:
```bash
ipconfig
```

Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.1.100`)

Then connect using: `exp://192.168.1.100:8081`

### ✅ Step 7: Clear Expo Cache

```bash
npm start -- --clear
# or
npx expo start -c
```

### ✅ Step 8: Restart Everything

1. Close Expo Go completely
2. Stop Metro bundler (Ctrl+C)
3. Clear cache: `npm start -- --clear`
4. Reopen Expo Go
5. Scan QR again

### ✅ Step 9: Check Port Availability

Make sure port 8081 is not blocked:

```bash
netstat -ano | findstr :8081
```

If something is using it, kill that process or change Expo port:

```bash
npm start -- --port 8082
```

### ✅ Step 10: Try LAN Mode Explicitly

```bash
npm start -- --lan
```

This forces LAN connection instead of localhost.

## Common Error Messages & Fixes

### "Unable to resolve module"
```bash
npm install
npm start -- --clear
```

### "Network request failed"
- Check WiFi connection
- Use tunnel mode: `npm start -- --tunnel`
- Check firewall settings

### "Uncaught Error: Cannot find module"
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### "Metro bundler has encountered an error"
```bash
# Clear watchman cache (if installed)
watchman watch-del-all

# Clear Metro cache
npm start -- --reset-cache
```

## Alternative: Use Development Build

If Expo Go continues to have issues, create a development build:

```bash
npx expo install expo-dev-client
eas build --profile development --platform android
```

This creates a standalone app with your code built-in.

## Quick Checklist

- [ ] Same WiFi network
- [ ] Firewall allows Node.js
- [ ] Latest Expo Go installed
- [ ] Metro bundler running
- [ ] No VPN active
- [ ] Port 8081 available
- [ ] Tried tunnel mode
- [ ] Cleared cache

## Still Not Working?

### Option 1: Use Android Emulator
```bash
npm run android
```

### Option 2: Use Web Version
```bash
npm run web
```

### Option 3: Use Tunnel Mode
```bash
npm start -- --tunnel
```

### Option 4: Check Backend Connection

Make sure backend is accessible:
```bash
curl http://localhost:8000/api/
```

## Debug Information to Collect

If still having issues, collect this info:

1. **Computer IP**: Run `ipconfig`
2. **Phone IP**: Settings → WiFi → Your Network → IP Address
3. **Expo CLI version**: `npx expo --version`
4. **Node version**: `node --version`
5. **Error message**: Screenshot from Expo Go
6. **Terminal output**: Copy full error from terminal

## Contact Support

If nothing works, provide the debug info above to:
- Expo Forums: https://forums.expo.dev
- Discord: https://chat.expo.dev
