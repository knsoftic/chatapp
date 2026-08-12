# 📱 Android APK & iOS Mobile Build Guide

This guide explains how to generate standalone **Android `.apk`** files and **iOS builds** for installation on physical mobile devices using Expo Application Services (EAS).

---

## 🚀 Prerequisites

1. **Install EAS CLI** globally:
   ```bash
   npm install -g eas-cli
   ```
2. Create a free **Expo account** at [expo.dev](https://expo.dev) if you don't have one.
3. Log in via terminal:
   ```bash
   eas login
   ```

---

## 🤖 1. Generate Direct Android `.apk` File

### Step 1.1: Configure `eas.json` for Standalone APK
Create or verify `frontend/eas.json`:
```json
{
  "cli": {
    "version": ">= 9.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### Step 1.2: Run Android APK Build Command
In the `frontend` folder, execute:
```bash
eas build -p android --profile preview
```

### Step 1.3: Download & Install APK on Phone
1. EAS will build your app in the cloud (takes 3-5 minutes).
2. Upon completion, EAS provides a **Direct Download Link** and a **QR Code**.
3. Scan the QR code with your Android phone to download `ChatApp.apk`.
4. Tap **Install** on your phone!

---

## 🍎 2. Generate iOS Build (TestFlight / Internal)

To build for iOS:
```bash
eas build -p ios --profile preview
```

*(Requires an Apple Developer Account for iOS Ad-Hoc distribution or TestFlight).*

---

## ⚡ Quick Testing Command Summary

| Goal | Command | Output |
|---|---|---|
| **Android APK** | `eas build -p android --profile preview` | Direct `.apk` download link |
| **Android Play Store AAB** | `eas build -p android --profile production` | Production `.aab` file |
| **iOS Build** | `eas build -p ios --profile preview` | `.ipa` for TestFlight / devices |
