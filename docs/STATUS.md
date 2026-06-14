# POS-Choice Mobile — Build Status

> Last updated: 2026-06-14

## Phase Status

| Phase | Name | Status | Completed |
|-------|------|--------|-----------|
| M1 | Foundation & Authentication | ✅ **COMPLETED** | 2026-06-04 |
| M2 | Core POS Selling Flow | ✅ **COMPLETED** | 2026-06-04 |
| M3 | Hold, Return & Shift Management | ✅ **COMPLETED** | 2026-06-04 |
| M4 | Polish, Bluetooth Print & Launch | ✅ **COMPLETED (code)** | 2026-06-13 |
| Backlog | Biometric, Notifications, Offline Queue, Damage Report | ✅ **COMPLETED** | 2026-06-14 |

---

## Phases M1, M2 & M3 — COMPLETED ✅

**Completed:** 2026-06-04  
**Status:** All screens and logic implemented — ready for `npm install` + `expo start`

### What Was Built

#### Phase M1 — Foundation & Authentication
- Expo project scaffold with Expo Router (file-based navigation)
- Zustand auth store (in-memory, no persist) and cart store (AsyncStorage persist)
- `PinPad` component — 10-button numpad, PIN dots, backspace, confirm
- PIN login screen — company config fetch, PIN input, loading + error state
- Auth guard in root layout — redirects to login if no token
- Shift open screen — opening float input, note, [Open Shift] button
- Shift close screen — declare cash/transfer/POS, see variance, [Close Shift]
- Toast system — `ui.store.ts` + `ToastContainer` component
- `constants/config.ts`, `constants/api-paths.ts`, `src/lib/axios.ts` singleton

#### Phase M2 — Core POS Selling Flow
- Products service, `useProducts` hook (cursor-paginated, normalises `_id → id`)
- `ProductCard` and product grid (FlatList, pull-to-refresh, infinite scroll)
- Category filter chips (horizontal scroll)
- Search bar with debounced 300ms input and camera icon button
- `BarcodeScanner` overlay — full-screen camera with targeting frame (`expo-camera`)
- `UnitPickerSheet` — bottom sheet: pack vs piece selector, qty input, line total
- Cart footer (sticky: item count + total + [Charge] button)
- `CheckoutSheet` — bottom sheet: cash/transfer/card/split payment tabs
- Idempotency key (`crypto.randomUUID()`) generated on checkout open
- `transactionsService.create()` with same payload as web
- WhatsApp receipt share — `Linking.openURL('whatsapp://send?...')` with formatted text receipt
- Customer modal — search by phone/name, quick-create form

#### Phase M3 — Hold, Return & Shift Management
- Hold transaction — [Hold] button saves to cart store
- `held.tsx` screen — list of held carts; tap to resume
- `stats.tsx` screen — my today's transactions, revenue, shift timer
- Shift stats fetch (`GET /reports/cashier-performance/me`)
- Cart persistence verified — AsyncStorage persist/restore on app restart
- Split payment — multiple methods with sum-must-equal-total validation
- Auto-lock screen — 15min inactivity → PIN re-entry overlay

---

## Phase M4 — COMPLETED (code) ✅

**Completed:** 2026-06-13 — All code implemented. Hardware testing and store submission remain.

### What Was Built

#### MOB-4.01 & MOB-4.02 — Bluetooth Printer (`src/services/printer.service.ts`)
- Conditionally loads `react-native-bluetooth-escpos-printer` — graceful fallback when unavailable (Expo Go)
- `scanDevices()` — scans for paired BT devices via `BluetoothManager`
- `connectDevice(address)` — connects and saves to settings store
- `printReceipt(data)` — full ESC/POS receipt: center-aligned header, columnar item list, totals, paper feed + cut
- Exported singleton `printerService` + `isPrintingAvailable()` guard

#### MOB-4.03 — Print Settings (`src/store/settings.store.ts`)
- Zustand store persisted to AsyncStorage (`pos-settings`)
- `autoPrint: boolean` — auto-print on sale completion
- `pairedPrinter: { name, address } | null` — last connected device

#### MOB-4.04 / MOB-4.05 — App Icon & Splash
- `app.json` already configured: `./assets/icon.png`, `./assets/splash.png`, `./assets/adaptive-icon.png`
- `assets/README.md` documents required file sizes (1024×1024 icon, 1284×2778 splash)
- Splash screen hide implemented in `app/_layout.tsx` via `SplashScreen.hideAsync()` after bootstrap

#### MOB-4.06 — Dark Theme
- Consistent `#020617` background throughout; `#0f172a` cards; `#1e293b` borders; verified in all new screens

#### MOB-4.07 & MOB-4.08 — EAS Build Scripts (`package.json`)
- `npm run build:android` — EAS preview APK for testing
- `npm run build:android:prod` — production AAB for Play Store
- `npm run build:ios` — EAS preview build for iOS
- `npm run build:all` — both platforms at once
- `npm run submit:android` — submit to Play Store

#### MOB-4.09 — Performance
- `ProductCard` wrapped in `React.memo` — avoids unnecessary re-renders on product grid scroll

#### MOB-4.10 — Offline Banner (`src/components/OfflineBanner.tsx`)
- Uses `@react-native-community/netinfo` to detect connectivity changes
- Red `#7f1d1d` banner appears when offline: "⚠️ You're offline — data may be stale"
- Rendered in root `_layout.tsx` above all screens

#### MOB-4.11 — Haptic Feedback
- Already wired in `pos.tsx` (`Haptics.impactAsync`) — fires on product add
- `CheckoutSheet` fires success haptic after transaction commit

#### Settings Screen (`app/(cashier)/settings.tsx`)
- New fourth tab (⚙️) added to cashier bottom navigation
- **Printer** section: [Configure Bluetooth Printer] button + auto-print Switch
- **Session** section: cashier name + role display
- **App** section: version + sign-out button (clears SecureStore token, navigates to login)

#### Bluetooth Printer Modal (`src/components/BluetoothPrinterModal.tsx`)
- Full-screen React Native `Modal`
- Scan for devices → list available → Connect button per device
- Shows connected device name + [Test Print] + [Disconnect]
- Shows helpful message in Expo Go: "Bluetooth printing only available in EAS builds"

#### New Dependencies
- `@react-native-community/netinfo@11.4.1` — offline detection
- `react-native-bluetooth-escpos-printer@^2.4.3` — ESC/POS via Bluetooth

#### `app.json` Additions
- Android permissions: `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`
- iOS `infoPlist`: `NSBluetoothPeripheralUsageDescription`, `NSBluetoothAlwaysUsageDescription`
- Added `@react-native-community/netinfo` to plugins

### Still Requires (hardware/accounts)

| Task | Status | Requires |
|------|--------|---------|
| Bluetooth printing hardware test | ⏳ Pending | Physical Bluetooth thermal printer |
| EAS Build (Android APK) | ⏳ Pending | `npm run build:android` + Expo account |
| iOS TestFlight build | ⏳ Pending | Apple Developer account ($99/year) |
| App icon PNG files | ⏳ Pending | Design per `assets/README.md` |
| Google Play / App Store submission | ⏳ Pending | Store accounts + screenshots |

---

---

## Backlog Features — COMPLETED ✅

**Completed:** 2026-06-14

### Biometric Login

- **`src/services/biometric.service.ts`** — wraps `expo-local-authentication`: `isAvailable()`, `authenticate()`, `getSupportedTypes()`
- `settings.store.ts` extended with `biometricEnabled` flag (AsyncStorage persisted)
- **Login screen** — detects Face ID / Fingerprint hardware; shows "🔐 Use Face ID" button when enrolled; after first successful PIN, offers to enable biometrics via `Alert`
- **Root layout bootstrap** — when biometric enabled + valid token found, prompts biometric auth before restoring session; on failure clears token and redirects to PIN

### Push Notifications

- **`src/services/notifications.service.ts`** — wraps `expo-notifications`; foreground handler configured at module load
- Held cart reminder: 30-minute `TIME_INTERVAL` scheduled notification when cart is held; cancelled on resume/delete
- Low stock alert: immediate local notification
- Sync complete alert: fires when offline queue is processed
- `settings.store.ts` extended with `notificationsEnabled` flag
- **Settings screen** — Notifications toggle; requests OS permission on first enable

### Offline Transaction Queue

- **`src/store/offline-queue.store.ts`** — Zustand + AsyncStorage (`pos-offline-queue`); `QueuedTransaction` shape with status `pending | syncing | failed`
- **`CheckoutSheet`** — checks `NetInfo.fetch()` before `transactionsService.create()`; if offline, queues locally and completes checkout UX (cart cleared, success callback fired, toast shown)
- **`src/components/OfflineQueueBanner.tsx`** — purple banner showing pending count + [Sync] button; processes queue sequentially; fires notification on completion; [Clear failed] link

### Damage Report + Photo Upload

- **`app/(cashier)/damage-report.tsx`** — full screen: debounced product search, selected product card (name + stock), numeric quantity, 5 reason chips, photo picker (`expo-image-picker` camera or gallery, local only), note field, submit
- **`src/services/inventory.service.ts`** — `createAdjustment()` → `POST /inventory/adjustments` with `type: remove`
- Accessible from Settings → TOOLS → "Damage Report"
- Photo stored locally as URI (documentation only — not sent to server)
- `API_PATHS.INVENTORY.ADJUSTMENTS` + `API_PATHS.REPORTS.CASHIER_ME` added

### New packages added (run `npm install`)

| Package | Purpose |
|---------|---------|
| `expo-local-authentication ~15.0.0` | Face ID / Fingerprint auth |
| `expo-notifications ~0.29.0` | Local + push notifications |
| `expo-device ~7.0.0` | Device detection for notifications |
| `expo-image-picker ~16.0.0` | Camera / gallery photo picker |

### `app.json` additions

- iOS `infoPlist`: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSFaceIDUsageDescription`
- Android permissions: `USE_BIOMETRIC`, `USE_FINGERPRINT`, `CAMERA`, `READ_MEDIA_IMAGES`, `VIBRATE`
- Plugins: `expo-local-authentication`, `expo-notifications` (with icon/color config), `expo-image-picker`

---

## Start Command (Ready to Run)

```bash
cd POS-mobile-app
npm install
npx expo start
```

The backend must be running and accessible from the device (use LAN IP, not localhost).
