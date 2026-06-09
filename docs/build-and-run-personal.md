# Build & Run — Personal iPhone and Android Device

This guide gets the POS mobile app running on your own physical devices for development
and testing. No App Store or Google Play account is needed.

There are two approaches:

| Approach | What it does | Best for |
|---|---|---|
| **Expo Go** (fastest) | Scan a QR code — app runs instantly in the Expo Go app | Quick testing, no native features |
| **Development Build** (recommended) | Install a real `.ipa` / `.apk` on your device | Full features, barcode scanner, production-like |

Use **Expo Go first** to verify the app starts. Then do a **Development Build** for
real testing on your device.

---

## Before You Start — What You Need

| Requirement | Mac (for iOS + Android) | Windows (Android only) |
|---|---|---|
| Node.js v18+ | ✅ | ✅ |
| Expo CLI | ✅ | ✅ |
| Expo Go app on your phone | ✅ iPhone + Android | ✅ Android |
| Xcode 15+ (iOS only) | ✅ Mac only | ✗ |
| Android Studio (optional) | Optional | Optional |
| EAS CLI (for device builds) | ✅ | ✅ |
| Expo account (free) | ✅ | ✅ |

> **iOS note:** Building for a real iPhone always requires a Mac with Xcode.
> There is no way to build an `.ipa` from Windows. The cloud EAS build approach
> (covered below) lets you trigger the build from any machine and download the result.

---

## Step 1 — Install Prerequisites

```bash
# Check Node.js version (needs v18+)
node --version

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI globally (needed for device builds)
npm install -g eas-cli

# Verify both installed
expo --version
eas --version
```

---

## Step 2 — Install App Dependencies

```bash
cd /path/to/POS_CHOICES/POS-mobile-app

npm install
```

---

## Step 3 — Configure the API URL

The app connects to the POS backend (`POS-backend-v2`). You need to tell it where
your backend is running.

```bash
# Create your local environment file
cp .env.example .env.local 2>/dev/null || touch .env.local
```

Open `.env.local` (or `.env`) in any text editor and set:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3003/api/v1
EXPO_PUBLIC_COMPANY_ID=
```

**Finding your computer's IP address:**

```bash
# Mac
ipconfig getifaddr en0          # Wi-Fi
ipconfig getifaddr en1          # Ethernet (if connected)

# Windows
ipconfig                        # Look for "IPv4 Address" under your Wi-Fi adapter
```

Example: if your Mac's IP is `192.168.1.105`, set:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.105:3003/api/v1
```

> Your phone and your computer must be on the **same Wi-Fi network**.
> If your backend is cloud-hosted, use the cloud URL instead (e.g. `https://api.yourstore.com/api/v1`).

---

## Part A — Quick Test with Expo Go (No Build Required)

This runs the app through the [Expo Go](https://expo.dev/go) app on your phone.
No installation or account needed. Ideal for a quick first look.

**Limitations:** Expo Go cannot run native modules like the barcode scanner in full
production mode. Use this to verify the UI and basic flows only.

### A.1 — Install Expo Go on your phone

- **iPhone:** Search "Expo Go" on the App Store → Install
- **Android:** Search "Expo Go" on the Google Play Store → Install

### A.2 — Start the dev server

```bash
cd /path/to/POS_CHOICES/POS-mobile-app

# Make sure your backend is also running in a separate terminal:
# cd ../POS-backend-v2 && npm run start:dev

npm start
# or: npx expo start
```

You will see a QR code in the terminal and a browser tab opens automatically.

### A.3 — Open on your phone

- **iPhone:** Open the Camera app → point at the QR code → tap the Expo Go banner
- **Android:** Open the Expo Go app → tap "Scan QR code" → scan the QR code

The app loads on your phone within a few seconds. Changes to source code
hot-reload on the device automatically.

---

## Part B — Development Build on Your iPhone (Recommended)

A development build installs a real `.ipa` on your device, enabling all native features
(camera/barcode scanner, secure storage, haptics). This is how you test the real app.

There are two ways:
- **B1 (EAS Cloud Build):** Expo's servers build it. No Xcode setup needed. Takes ~10 min.
- **B2 (Local Build):** Xcode on your Mac builds it. Faster after first setup.

### B.1 — EAS Cloud Build (Easiest)

#### B.1.1 — Create a free Expo account

```bash
# Create account at https://expo.dev/signup (free)
# Then log in:
eas login
# Enter your Expo email and password when prompted
```

#### B.1.2 — Link the project to your Expo account

```bash
cd /path/to/POS_CHOICES/POS-mobile-app

eas init
# If asked to create a new project: yes
# Project name: POS Choice (or whatever you prefer)
```

This adds an `extra.eas.projectId` to `app.json`. It is safe to commit.

#### B.1.3 — Register your iPhone as a test device

```bash
eas device:create
```

This opens a URL. Open it on your iPhone (you must do this on the iPhone itself).
Follow the prompt to install the Expo device profile — this allows unsigned builds
to run on your specific device. You only do this once per iPhone.

#### B.1.4 — Trigger the cloud build

```bash
eas build --platform ios --profile development
```

Expo uploads your source code and builds it on Apple's infrastructure (via their cloud servers).
This takes **5–15 minutes**. You will see a build URL — you can close the terminal;
the build continues on their servers.

When the build finishes:
1. You receive an email from Expo with a download link
2. Or: run `eas build:list` to see the link
3. Open the link **on your iPhone** → tap Install
4. Go to Settings → General → VPN & Device Management → trust the developer certificate

#### B.1.5 — Start the dev server and open the app

```bash
cd /path/to/POS_CHOICES/POS-mobile-app

npx expo start --dev-client
```

Scan the QR code with your iPhone's Camera app. The app opens using your installed
development build (not Expo Go), with all native features enabled.

---

### B.2 — Local Xcode Build (Faster for Ongoing Development)

This requires Xcode on your Mac and a free Apple ID (no paid developer account needed
for personal testing on one device).

#### B.2.1 — Install Xcode

1. Open the Mac App Store → search "Xcode" → Install (it is large, ~15 GB)
2. Open Xcode once to accept the license and install components
3. Verify:

```bash
xcode-select -p
# Expected: /Applications/Xcode.app/Contents/Developer
```

#### B.2.2 — Generate the iOS native project

```bash
cd /path/to/POS_CHOICES/POS-mobile-app

npx expo prebuild --platform ios --clean
# Creates an ios/ folder with the Xcode project
```

#### B.2.3 — Open in Xcode

```bash
open ios/poschoice.xcworkspace
# Always open the .xcworkspace, never the .xcodeproj
```

#### B.2.4 — Connect your iPhone and configure signing

1. Plug your iPhone into your Mac with a USB cable
2. In Xcode: click the project name in the left sidebar (top item)
3. Select the **poschoice** target → **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Under **Team**, select your Apple ID (add one via Xcode → Settings → Accounts if needed)
6. A free Apple ID is enough — no paid developer account required for personal device

#### B.2.5 — Trust your Mac on the iPhone

The first time you connect, your iPhone shows a "Trust This Computer?" prompt.
Tap **Trust** and enter your iPhone passcode.

#### B.2.6 — Select your device and run

1. In the Xcode toolbar at the top, click the device selector (currently shows a simulator name)
2. Select your iPhone from the list
3. Click the **▶ Run** button (or press Cmd+R)

Xcode builds the app and installs it on your iPhone. First build takes 2–4 minutes.

After installation, your iPhone may show **"Untrusted Developer"** when opening the app:
1. Settings → General → VPN & Device Management
2. Find your Apple ID under "Developer App"
3. Tap **Trust [your Apple ID]** → Trust

The app opens. Leave the Xcode terminal running — it serves the JS bundle.

---

## Part C — Development Build on Your Android Device

Android is simpler than iOS — no code signing or Apple account is needed for direct
APK installation.

### C.1 — Enable Developer Mode on Your Android Phone

1. Open **Settings** → **About phone**
2. Tap **Build number** seven times rapidly
3. You will see "You are now a developer!"
4. Go back to Settings → **Developer options** (now visible)
5. Enable **USB debugging**

### C.2 — EAS Cloud Build (Recommended — No Android Studio needed)

#### C.2.1 — Log in to Expo (if not already done)

```bash
eas login
```

#### C.2.2 — Trigger the Android build

```bash
eas build --platform android --profile development
```

This produces a `.apk` file (not an `.aab` — the `eas.json` `development` profile
sets `buildType: "apk"` specifically for this).

Build takes **5–10 minutes** on Expo's servers.

#### C.2.3 — Install the APK on your Android phone

When the build finishes, open the download link on your Android phone.
Chrome will download the APK. Tap it to install.

If you see **"Install blocked"**: Settings → Apps → Chrome (or your browser) →
Install unknown apps → Allow.

#### C.2.4 — Start the dev server and open

```bash
npx expo start --dev-client
```

Scan the QR code with your Android camera. The app opens in your development build.

---

### C.3 — Direct USB Install (Fastest — No Cloud Build)

If your Android phone is connected via USB:

```bash
cd /path/to/POS_CHOICES/POS-mobile-app

# Build and run directly on a connected Android device
npx expo run:android
```

This requires Android Studio (or at minimum the Android SDK and ADB tools).

**Install Android Studio** (if not already installed):
1. Download from https://developer.android.com/studio
2. Run the installer with default settings
3. Open Android Studio once to let it download the Android SDK

After Android Studio is installed:

```bash
# Verify ADB can see your device (must have USB debugging enabled)
adb devices
# Should show your device serial number

# Build and install
npx expo run:android
```

This compiles and installs the app on your device via USB.
The first run takes 3–5 minutes. Subsequent runs are faster (~30 seconds).

---

## Part D — Running the Backend Alongside the App

The mobile app connects to `POS-backend-v2` for all data. While developing, run the
backend on your Mac in a separate terminal:

```bash
# Terminal 1 — Backend
cd /path/to/POS_CHOICES/POS-backend-v2
npm run start:dev
# NestJS starts on port 3003
```

```bash
# Terminal 2 — Mobile app dev server
cd /path/to/POS_CHOICES/POS-mobile-app
npx expo start --dev-client
```

Your phone connects to the backend over Wi-Fi using the IP address you set in `.env.local`.
Make sure both your Mac and your phone are on the same Wi-Fi network.

**Verify the backend is reachable from your phone:**

Open Safari (iPhone) or Chrome (Android) on your phone and go to:
```
http://YOUR_COMPUTER_IP:3003/health
```
You should see `{"status":"ok"}`. If you see an error, the phone cannot reach
the backend — check your firewall or Wi-Fi settings.

**macOS firewall:** If your Mac firewall blocks port 3003:
1. System Settings → Network → Firewall → Options
2. Find `node` or your NestJS process and set it to **Allow incoming connections**
3. Or temporarily disable the firewall while testing on your local network

---

## Quick Command Reference

| What you want to do | Command | Notes |
|---|---|---|
| Start dev server (Expo Go) | `npm start` | Scan QR with Expo Go app |
| Start dev server (dev build) | `npx expo start --dev-client` | Requires dev build installed first |
| EAS cloud build — iOS | `eas build --platform ios --profile development` | ~10 min, free tier available |
| EAS cloud build — Android | `eas build --platform android --profile development` | ~5 min |
| USB install — Android | `npx expo run:android` | Requires ADB + Android Studio |
| Local Xcode build — iOS | `npx expo run:ios --device` | Requires Xcode + device connected |
| Generate native iOS folder | `npx expo prebuild --platform ios` | Run before Xcode build |
| Generate native Android folder | `npx expo prebuild --platform android` | Run before Android Studio |
| List your EAS builds | `eas build:list` | Shows all past builds with download links |
| Register a new test device | `eas device:create` | iPhone: opens registration URL |
| Check connected devices | `adb devices` | Android only |

---

## Troubleshooting

### "Network request failed" — app cannot reach the backend

1. Confirm your Mac and phone are on the **same Wi-Fi network**
2. Open `http://YOUR_IP:3003/health` in the phone's browser — does it load?
3. Check `.env.local` has the correct IP (not `localhost` — `localhost` on a phone means the phone itself)
4. macOS may block the port — see the firewall note above

### iPhone: "Untrusted Developer" when opening the app

Settings → General → VPN & Device Management → tap your Apple ID → Trust.
This only needs to be done once per Apple ID per device.

### iPhone: App expires after 7 days (free Apple ID)

A free Apple ID signs apps valid for 7 days. After that, rebuild and reinstall:
```bash
# In Xcode: press Cmd+R again (with phone connected)
# Or: eas build --platform ios --profile development (EAS build, 90 days)
```
An EAS development build signed with a registered device certificate lasts 90 days.

### Android: "App not installed" or installation blocked

1. Enable **Install unknown apps** for your browser in Android Settings
2. If the APK was built for a different device ABI, rebuild:
   ```bash
   eas build --platform android --profile development
   ```

### Expo Go shows a blank screen or "Something went wrong"

The app has native dependencies (camera, barcode scanner) that cannot run in Expo Go.
Use a development build instead (Part B or C).

### Metro bundler stuck or shows old code

```bash
# Clear Metro cache
npx expo start --clear
```

### "SDK version mismatch" error

Your installed Expo Go app is a different version from the SDK in `package.json`.
Either update Expo Go on your phone (App Store / Play Store) or use a dev build.

### `eas build` fails — "You must be logged in"

```bash
eas login
# Enter your expo.dev credentials
```

### EAS free tier build queue is slow

Expo's free tier queues builds. Paid plans skip the queue.
For personal development: trigger the build and do other work while it runs.
You get an email when it's done.

### Barcode scanner shows black screen on device

Camera permission not granted. On your phone:
- iPhone: Settings → POS Choice → Camera → Allow
- Android: Settings → Apps → POS Choice → Permissions → Camera → Allow

---

## Build Profiles Summary

The `eas.json` has three build profiles:

| Profile | Distribution | Android output | iOS target | Use case |
|---|---|---|---|---|
| `development` | Internal (your devices) | `.apk` | Real device | Daily development |
| `preview` | Internal (your devices) | `.apk` | Real device | Sharing with testers |
| `production` | App Store / Play Store | `.aab` | App Store | Public release |

For personal device testing, always use the **`development`** profile.
