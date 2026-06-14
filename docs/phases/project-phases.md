# POS-Choice Mobile — Project Phases & Tasks

## Overview

| Phase | Name | Duration | Tasks | Status |
|-------|------|----------|-------|--------|
| ~~M1~~ | ~~Foundation & Authentication~~ | ~~2 weeks~~ | ~~20~~ | ✅ **COMPLETED** (2026-06-04) |
| ~~M2~~ | ~~Core POS Selling Flow~~ | ~~3 weeks~~ | ~~24~~ | ✅ **COMPLETED** (2026-06-04) |
| ~~M3~~ | ~~Hold, Return & Shift Management~~ | ~~2 weeks~~ | ~~14~~ | ✅ **COMPLETED** (2026-06-04) |
| ~~M4~~ | ~~Polish, Bluetooth Print & Launch~~ | ~~2 weeks~~ | ~~12~~ | ✅ **COMPLETED** (code — 2026-06-13) |
| ~~BL~~ | ~~Backlog: Biometric, Notifications, Offline, Damage Report~~ | ~~—~~ | ~~6~~ | ✅ **COMPLETED** (2026-06-14) |
| ~~BL2~~ | ~~OTA Updates + WhatsApp Deep Links~~ | ~~—~~ | ~~2~~ | ✅ **COMPLETED** (2026-06-14) |

**All phases and backlog features complete. Only remaining steps require hardware or external accounts (Bluetooth printer, EAS project ID, app store accounts).**

---

## ✅ Phase M1 — Foundation & Authentication (COMPLETED — 2026-06-04)

**Goal:** App opens, cashier can log in with PIN, shift open/close works.

### Setup Tasks

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-1.01 | Expo project scaffold | ✅ | `npx create-expo-app POS-mobile-app --template expo-template-blank-typescript` |
| MOB-1.02 | Install Expo Router | ✅ | `npx expo install expo-router expo-linking expo-constants expo-status-bar` |
| MOB-1.03 | Install dependencies | ✅ | `npm install zustand axios @react-native-async-storage/async-storage react-native-safe-area-context react-native-screens` |
| MOB-1.04 | Configure app.json | ✅ | App name "POS-Choice", bundle ID `ng.poschoice.app`, icon, splash `#020617` |
| MOB-1.05 | eas.json | ✅ | EAS Build profiles: development (APK), preview (internal), production (AAB) |
| MOB-1.06 | API constants | ✅ | `constants/config.ts` — `EXPO_PUBLIC_API_URL`; LAN IP in dev, HTTPS in production |
| MOB-1.07 | Axios instance | ✅ | Singleton with auth header interceptor, 401 → `navigateToLogin()` callback |
| MOB-1.08 | Auth store | ✅ | Zustand in-memory store: `user`, `token`, `setSession()`, `clearSession()` |
| MOB-1.09 | Cart store | ✅ | Zustand with `AsyncStorage` persist (`pos-cart`); full `CartItem` + `HeldCart` shapes |

### Auth Tasks

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-1.10 | `PinPad` component | ✅ | 10-button numpad, 4–6 PIN dots, backspace, confirm; full-width on phone |
| MOB-1.11 | PIN login screen | ✅ | Company name fetch, PIN input, loading state, error handling, lockout countdown |
| MOB-1.12 | Auth guard | ✅ | Root `_layout.tsx` reads SecureStore token on bootstrap; JWT exp check; redirect |
| MOB-1.13 | Auth service | ✅ | `cashierLogin(pin, companyId)` — identical API payload to web |
| MOB-1.14 | Company config fetch | ✅ | `GET /companies/config` — public endpoint, auto-fills companyId from SecureStore |

### Shift Tasks

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-1.15 | Shift open screen | ✅ | Opening float input, note field, `[Open Shift]` → `POST /shifts` |
| MOB-1.16 | Shift close screen | ✅ | Declare cash/transfer/POS totals, computed variance display, `[Close Shift]` |
| MOB-1.17 | Shift service | ✅ | `getActive()`, `open(float, note)`, `close(id, declared)` |
| MOB-1.18 | Post-login flow | ✅ | PIN success → check active shift → shift-open screen OR POS screen |
| MOB-1.19 | `ui.store.ts` | ✅ | Toast queue with `pushToast(message, type, duration)` |
| MOB-1.20 | Toast component | ✅ | `ToastContainer` — bottom-of-screen compact toasts; auto-dismiss; stacked |

---

## ✅ Phase M2 — Core POS Selling Flow (COMPLETED — 2026-06-04)

**Goal:** Full sell-to-receipt flow working. This is the core value of the app.

### Product Display

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-2.01 | Products service | ✅ | `list(storeId, categoryId, search, cursor)`, `scan(barcode, storeId)` |
| MOB-2.02 | `useProducts` hook | ✅ | Cursor-paginated; normalises `_id → id`; `search`, `setSearch`, `category`, `setCategory`, `loadMore`, `refresh` |
| MOB-2.03 | `ProductCard` | ✅ | 2-column grid card: name, price badge, stock indicator, pack/piece label; `React.memo` |
| MOB-2.04 | `ProductGrid` | ✅ | `FlatList` 2-column; pull-to-refresh (`RefreshControl`); `onEndReached` infinite scroll |
| MOB-2.05 | Category chips | ✅ | Horizontal `ScrollView`; "All" chip + category names; active highlight |
| MOB-2.06 | Search bar | ✅ | `TextInput` with camera icon → scanner; debounced 300ms; `placeholderTextColor` |

### Barcode Scanner

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-2.07 | Camera permission | ✅ | `expo-camera` permission request on first use; handled gracefully |
| MOB-2.08 | `BarcodeScanner` overlay | ✅ | Full-screen camera; targeting reticle; cancel button; `onBarcodeScanned` callback |
| MOB-2.09 | Scan handler | ✅ | Exact barcode match → add to cart; multiple results → unit picker |

### Cart

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-2.10 | `UnitPicker` bottom sheet | ✅ | `@gorhom/bottom-sheet`; active selling units as rows; qty stepper; live line total |
| MOB-2.11 | Cart footer | ✅ | `CartBadge` sticky at bottom: item count badge + total + `[Charge]` button |
| MOB-2.12 | Cart drawer | ✅ | `CheckoutSheet` at `85%` snap point; cart items visible in scroll view |
| MOB-2.13 | `CartItem` row | ✅ | Name, unit label, `[−][qty][+]` controls, line total, trash icon |
| MOB-2.14 | `−` button disabled at qty=1 | ✅ | Minus fires `removeItem` when `sellingUnitQty === 1` |

### Checkout

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-2.15 | `CheckoutModal` | ✅ | Bottom sheet: Total Due tile, Cash / Transfer / Card / Split tabs, Confirm |
| MOB-2.16 | Cash tab | ✅ | Tendered amount input (₦), change display; validates ≥ total |
| MOB-2.17 | Transfer tab | ✅ | "Confirm received" Switch + optional reference input |
| MOB-2.18 | POS/Card tab | ✅ | Terminal reference input field |
| MOB-2.19 | Idempotency key | ✅ | `crypto.randomUUID()` on sheet open; stored in `useRef`; sent as `X-Idempotency-Key` |
| MOB-2.20 | `transactionsService.create()` | ✅ | Identical payload + header to web; error toast on failure |
| MOB-2.21 | Success flow | ✅ | Toast + `[Share on WhatsApp]` button; `clearCart()` immediately |
| MOB-2.22 | WhatsApp receipt | ✅ | `buildWhatsAppReceipt()` → `Linking.openURL('whatsapp://send?phone=&text=...')` |
| MOB-2.23 | Customer modal | ✅ | Bottom sheet: search by phone/name via `GET /customers/search?q=`; quick-create inline |
| MOB-2.24 | Credit payment tab | ✅ | Shown when credit customer assigned; available balance; partial/full deduction |

---

## ✅ Phase M3 — Hold, Return & Shift Management (COMPLETED — 2026-06-04)

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-3.01 | Hold transaction | ✅ | `[Hold]` button saves to Zustand cart store (`holdCart(label)`) |
| MOB-3.02 | Held carts list | ✅ | `held.tsx` tab screen: held cart cards with label, item count, total; tap to resume |
| MOB-3.03 | Auto-hold on resume | ✅ | `resumeCart(holdId)` auto-saves active cart if non-empty before resuming |
| MOB-3.04 | Delete held cart | ✅ | Long-press / delete button on held cart row calls `deleteHeld(holdId)` |
| MOB-3.05 | My Stats tab | ✅ | `stats.tsx` screen: today's transactions, revenue, avg sale, shift timer countdown |
| MOB-3.06 | Shift stats fetch | ✅ | `GET /reports/cashier-performance/me`; cached 60s |
| MOB-3.07 | Shift close flow | ✅ | Declare cash/transfer/POS; variance shown; submit `PATCH /shifts/:id/close` |
| MOB-3.08 | Quotation screen | ✅ | Cart in "quote mode"; `[Save as Quote]`; share via WhatsApp; `[Convert to Sale]` |
| MOB-3.09 | Return screen | ✅ | Search by invoice ID; select items + qty; reason picker; submit |
| MOB-3.10 | Auto-lock screen | ✅ | 15 min inactivity → PIN re-entry overlay; cart preserved behind lock |
| MOB-3.11 | Exit → auto-hold | ✅ | App backgrounded or logout → auto-holds current cart if non-empty |
| MOB-3.12 | Cart persistence | ✅ | Zustand `persist` middleware — cart survives app restart and token expiry |
| MOB-3.13 | Split payment | ✅ | Multiple method rows `[method][amount]`; sum-must-equal-total validation |
| MOB-3.14 | Background fetch | ✅ | On app foreground: re-fetches active shift and company config |

---

## ✅ Phase M4 — Polish, Bluetooth Print & Launch (COMPLETED — code 2026-06-13)

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-4.01 | Bluetooth printer pairing | ✅ | `BluetoothPrinterModal` — scan devices, connect, test print, disconnect; saves paired device to `settings.store.ts` |
| MOB-4.02 | `react-native-bluetooth-escpos-printer` | ✅ | `printer.service.ts` — conditional `require()` (graceful no-op in Expo Go); `scanDevices()`, `connectDevice()`, `printReceipt()` with ESC/POS commands |
| MOB-4.03 | Print toggle | ✅ | `settings.store.ts` — `autoPrint: boolean` persisted; Switch in Settings tab; auto-prints after sale if enabled |
| MOB-4.04 | App icon | ✅ | `app.json` configured for `./assets/icon.png` (1024×1024) and `./assets/adaptive-icon.png`; `assets/README.md` documents specs |
| MOB-4.05 | Splash screen | ✅ | `expo-splash-screen` `preventAutoHideAsync()` on load; `hideAsync()` after bootstrap; `backgroundColor: #020617` |
| MOB-4.06 | Dark theme | ✅ | `#020617` background, `#0f172a` cards, `#1e293b` borders — consistent throughout all screens |
| MOB-4.07 | Android APK build | ✅ | `npm run build:android` → `eas build --platform android --profile preview`; production AAB via `build:android:prod` |
| MOB-4.08 | iOS TestFlight | ✅ | `npm run build:ios` → `eas build --platform ios --profile preview`; production profile for App Store |
| MOB-4.09 | Performance audit | ✅ | `ProductCard` wrapped in `React.memo`; `useCallback` on `renderItem` + `keyExtractor`; `onEndReachedThreshold: 0.3` |
| MOB-4.10 | Network error handling | ✅ | `OfflineBanner.tsx` — `@react-native-community/netinfo`; red banner "⚠️ You're offline"; in root layout |
| MOB-4.11 | Haptic feedback | ✅ | `Haptics.impactAsync(Medium)` on product add; `NotificationFeedbackType.Success` on sale; error vibration on failure |
| MOB-4.12 | Google Play / App Store listing | ✅ | `npm run submit:android`; store descriptions ready; screenshot specs in `assets/README.md` |

### New files added in M4

| File | Purpose |
|------|---------|
| `src/services/printer.service.ts` | Bluetooth ESC/POS wrapper (conditional native load) |
| `src/store/settings.store.ts` | Print + biometric + notifications settings persisted to AsyncStorage |
| `src/components/OfflineBanner.tsx` | Connectivity detection + offline warning banner |
| `src/components/BluetoothPrinterModal.tsx` | Device scan/pair/test/disconnect UI |
| `app/(cashier)/settings.tsx` | Settings tab: printer, biometric, notifications, tools, sign-out |
| `assets/README.md` | Asset file specs for icon, adaptive-icon, splash, favicon |

### Pending (hardware / accounts only)

| Item | Status |
|------|--------|
| Physical Bluetooth thermal printer test | ⏳ Needs hardware |
| App icon PNG files (1024×1024) | ⏳ Needs design |
| EAS build run (`npm run build:android`) | ⏳ Needs Expo account |
| Apple Developer account + iOS build | ⏳ Needs $99/yr account |
| Play Store + App Store submission | ⏳ Needs store accounts |

---

## ✅ Backlog Features (COMPLETED — 2026-06-14)

| ID | Task | Status | Detail |
|----|------|--------|--------|
| MOB-BL-01 | Biometric login (Face ID / Fingerprint) | ✅ | `biometric.service.ts` wraps `expo-local-authentication`; settings store `biometricEnabled` flag; login screen offers enrolment after first PIN; bootstrap checks biometric before restoring token; "🔐 Use Face ID" button shown when enrolled |
| MOB-BL-02 | Push notifications — held cart reminders | ✅ | `notifications.service.ts` — 30-min `TIME_INTERVAL` scheduled notification when cart is held; cancelled on resume/delete |
| MOB-BL-03 | Push notifications — low stock alerts | ✅ | `notificationsService.sendLowStockAlert()` — immediate local notification; wired from products |
| MOB-BL-04 | Offline transaction queue | ✅ | `offline-queue.store.ts` — Zustand + AsyncStorage (`pos-offline-queue`); `QueuedTransaction` with `pending/syncing/failed` status; `CheckoutSheet` queues locally when `NetInfo` reports offline; `OfflineQueueBanner.tsx` (purple) shows count + [Sync] button; processes sequentially; fires sync-complete notification |
| MOB-BL-05 | Product photo upload (damage report) | ✅ | `expo-image-picker` in `damage-report.tsx`; camera or gallery; local URI preview (documentation only, not sent to server) |
| MOB-BL-06 | Cashier quick stock adjustment (damage report) | ✅ | `app/(cashier)/damage-report.tsx` — product search, qty, 5 reason chips, photo, note; submits `POST /inventory/adjustments` with `type: remove`; accessible from Settings → TOOLS |

### New files added in Backlog

| File | Purpose |
|------|---------|
| `src/services/biometric.service.ts` | Face ID / Touch ID wrapper (`expo-local-authentication`) |
| `src/services/notifications.service.ts` | Local + push notifications (`expo-notifications`) |
| `src/services/inventory.service.ts` | Stock adjustment API calls |
| `src/store/offline-queue.store.ts` | Offline transaction queue persisted to AsyncStorage |
| `src/components/OfflineQueueBanner.tsx` | Purple banner showing queued tx count + sync button |
| `app/(cashier)/damage-report.tsx` | Full damage / adjustment report screen |

### Modified files in Backlog

| File | Change |
|------|--------|
| `src/store/settings.store.ts` | Added `biometricEnabled`, `notificationsEnabled` flags |
| `src/constants/api-paths.ts` | Added `INVENTORY.ADJUSTMENTS`, `REPORTS.CASHIER_ME` |
| `app/(cashier)/_layout.tsx` | Registered `damage-report` as hidden tab route |
| `app/(cashier)/settings.tsx` | Added SECURITY, NOTIFICATIONS, TOOLS sections |
| `app/_layout.tsx` | Biometric gate in bootstrap; notification permission request; `OfflineQueueBanner` |
| `app/(auth)/login.tsx` | Biometric check state, `handleBiometricLogin()`, enrolment offer after PIN |
| `src/components/CheckoutSheet.tsx` | `NetInfo` offline check + `addToQueue()` before API call |
| `package.json` | Added `expo-local-authentication`, `expo-notifications`, `expo-device`, `expo-image-picker` |
| `app.json` | Biometric, camera, photo library permissions; notification + image-picker plugins |

---

## ✅ Additional Backlog Features (COMPLETED — 2026-06-14)

| ID | Feature | Status | Detail |
|----|---------|--------|--------|
| MOB-BL-07 | OTA updates via Expo Updates | ✅ | `UpdateBanner.tsx` silently checks + fetches on mount; indigo banner "Update ready — Restart" applies update via `Updates.reloadAsync()`; `eas.json` build channels (`preview`, `production`); `app.json` `updates` config + `runtimeVersion: appVersion`; `npm run update:preview` / `update:production` scripts |
| MOB-BL-08 | Deep-link from WhatsApp receipt to app | ✅ | `app/receipt/[invoiceId].tsx` — Expo Router auto-routes `poschoice://receipt/INV-123` to this screen; fetches `GET /transactions/receipt/:invoiceId`; shows styled receipt card; "↗ WhatsApp" button re-shares; `buildWhatsAppReceipt` appends "📱 View receipt in POS Choice:\nposchoice://receipt/INV-123" line; `useURL()` deep link handler in `_layout.tsx` for in-app links while the app is already open |

### New files added

| File | Purpose |
|------|---------|
| `src/components/UpdateBanner.tsx` | OTA update available banner with restart button |
| `app/receipt/[invoiceId].tsx` | Receipt viewer screen opened via deep link |

### Modified files

| File | Change |
|------|--------|
| `src/utils/receipt.ts` | `buildWhatsAppReceipt` now appends deep link line to every receipt |
| `app/_layout.tsx` | Added `useURL()` deep link parser + `UpdateBanner` in render tree |
| `app.json` | Added `updates.url`, `runtimeVersion` for EAS Update |
| `eas.json` | Added `channel: "preview"/"production"` to build profiles |
| `package.json` | Added `update:preview` and `update:production` scripts |

### One-time setup required for OTA updates

```bash
# 1. Create an Expo account and link this project
npx eas login
npx eas project:init   # generates an EAS project ID

# 2. Replace the placeholder in app.json
#    "url": "https://u.expo.dev/YOUR_ACTUAL_PROJECT_ID"

# 3. Build and deploy an update
npm run update:preview -- "Fix: product search improved"
npm run update:production -- "Release: v1.0.1 stability fixes"
```

---

## Remaining Good-to-Have (Backlog)

| Feature | Effort | Value | Status |
|---------|--------|-------|--------|
| Multi-language UI (Yoruba, Hausa, Igbo) | High | Medium | — |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | React Native + Expo (managed) | Team knows React; Expo SDK covers all native needs |
| Navigation | Expo Router (file-based) | Same mental model as Next.js App Router |
| State | Zustand | Same library as web app — team familiarity |
| HTTP | Axios | Same as web; interceptors for auth/error |
| Camera | `expo-camera` | Expo SDK, well-maintained, barcode support |
| Storage | `@react-native-async-storage/async-storage` | Standard for Expo projects |
| Secure storage | `expo-secure-store` | JWT token stored securely on device |
| Bottom sheets | `@gorhom/bottom-sheet` | Best-in-class RN bottom sheet |
| Lists | `FlatList` (built-in RN) | Best performance for long product lists |
| Bluetooth print | `react-native-bluetooth-escpos-printer` | Most maintained ESC/POS RN library |
| Biometric auth | `expo-local-authentication` | Expo SDK, covers Face ID + Touch ID |
| Notifications | `expo-notifications` | Expo SDK, local + push, works in EAS builds |
| Photo picker | `expo-image-picker` | Expo SDK, camera + gallery, managed permissions |
| Offline detection | `@react-native-community/netinfo` | Official RN community library |
| Build | EAS Build (Expo) | Cloud builds, no local Xcode/Android Studio needed |
| Money | kobo integers | Identical to web; `formatNaira(kobo)` for all display |
