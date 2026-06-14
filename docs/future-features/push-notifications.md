# POS-Choice Mobile — Push Notifications

> **Status: ✅ IMPLEMENTED (local notifications)** — 2026-06-14 (MOB-BL-02, MOB-BL-03)
>
> This document was originally a future-feature spec. It has been updated to reflect what was actually built.
> **Remote push notifications** (server → device) remain a future enhancement.

---

## What Was Built vs Original Spec

| Feature | Original spec | What was built |
|---------|--------------|----------------|
| Held cart reminder | Remote push (server-initiated) | ✅ **Local notification** — scheduled 30 min after holding, device-only |
| Low stock alert | Remote push | ✅ **Local notification** — fired immediately when stock is low |
| Sync complete | Not in spec | ✅ **Local notification** — fires when offline queue sync completes |
| Daily summary | Remote push | ⏳ Not implemented — requires backend cron + push token registration |
| Shift reminder | Remote push | ⏳ Not implemented |
| New credit customer | Remote push | ⏳ Not implemented |
| Expo push token registration | `POST /users/push-token` | ⏳ Not implemented — `PATCH /users/:id` in Phase 5 |
| FCM / APNs credentials | EAS Credentials | ⏳ Not configured — needed for remote push |

---

## What Was Built — Local Notifications

Local notifications are **scheduled on-device** — they don't require a server, an Expo push token, or FCM/APNs credentials. They work in any EAS build.

### Files

| File | Role |
|------|------|
| `src/services/notifications.service.ts` | All notification logic; wraps `expo-notifications` |
| `src/store/settings.store.ts` | `notificationsEnabled: boolean` persisted to AsyncStorage |
| `app/_layout.tsx` | Calls `requestPermission()` when `notificationsEnabled` is true |
| `app/(cashier)/settings.tsx` | NOTIFICATIONS toggle — requests OS permission on first enable |
| `app/(cashier)/pos.tsx` | Calls `scheduleHeldCartReminder()` when a cart is held |

### notifications.service.ts API

```typescript
// Request OS permission (required before any notification)
notificationsService.requestPermission(): Promise<boolean>

// Schedule a 30-minute reminder for a held cart
notificationsService.scheduleHeldCartReminder(label: string, holdId: string): Promise<void>

// Cancel the reminder when the cart is resumed or deleted
notificationsService.cancelHeldCartReminder(holdId: string): Promise<void>

// Immediate alert when a product hits low stock
notificationsService.sendLowStockAlert(productName: string, qty: number): Promise<void>

// Immediate alert after offline queue finishes syncing
notificationsService.sendSyncCompleteAlert(count: number): Promise<void>
```

### Held Cart Reminder — How It Works

```
Cashier holds a cart
  → pos.tsx calls notificationsService.scheduleHeldCartReminder(label, holdId)
  → expo-notifications schedules a TIME_INTERVAL trigger (30 × 60 seconds)
  → If the cashier resumes or deletes the cart:
      → cancelHeldCartReminder(holdId) cancels the scheduled notification
  → If 30 minutes pass and cart is still held:
      → Notification fires: "📌 Held Cart Reminder — You have a held cart 'Morning sales' waiting"
```

### Notification Handler (set at module load)

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  true,
  }),
})
```

Configured in `notifications.service.ts` at module level — no setup required in `_layout.tsx`.

---

## Settings Toggle

Located in `app/(cashier)/settings.tsx` → **NOTIFICATIONS** section:

```
NOTIFICATIONS
┌────────────────────────────────────────────────────────┐
│ Notifications    Held cart reminders, low stock   [ ●] │
└────────────────────────────────────────────────────────┘
```

- First enable → `notificationsService.requestPermission()` → OS dialog
- Permission denied → toast: "Permission denied — enable in device Settings"
- Toggling off → `setNotificationsEnabled(false)`; existing scheduled notifications remain until cancelled/fired

---

## Permissions

Already configured in `app.json`:

**iOS**: Handled automatically by `expo-notifications` plugin.

**Android**: `RECEIVE_BOOT_COMPLETED` and `VIBRATE` in `android.permissions`.
`expo-notifications` plugin configured with icon and colour:
```json
["expo-notifications", { "icon": "./assets/icon.png", "color": "#6366f1", "sounds": [] }]
```

---

## Notification Tap Handling (Future)

When a notification is tapped while the app is open or in background, navigation to
the relevant screen is a future enhancement. The infrastructure is in place:

```typescript
// To implement in _layout.tsx when deep linking is needed:
const subscription = Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data as { type?: string; holdId?: string }
  if (data.type === 'held_cart') router.push('/(cashier)/held')
  if (data.type === 'low_stock') router.push('/(cashier)/pos')
  if (data.type === 'sync_complete') { /* already on POS, no navigation needed */ }
})
```

---

## Remote Push Notifications (Future Work)

The remaining use cases from the original spec require the following backend and
infrastructure work before they can be implemented:

### Required backend changes

1. **`PATCH /users/:id`** — accept and store `pushToken: string` on User document
2. **`POST /notifications/send`** (internal) — call Expo Push API
3. **Low stock cron** — after each transaction, check if stock crossed reorder level; if yes, send push to store admin
4. **Daily summary cron** — `@Cron('0 23 * * *')` — aggregate today's transactions; push to admin

### Required infrastructure

```bash
# 1. Link the Expo project (gets projectId for push token)
npx eas project:init

# 2. Register FCM credentials with EAS
eas credentials --platform android
# Follow prompts with Firebase project credentials

# 3. EAS handles APNs automatically for iOS
```

### Frontend addition needed

```typescript
// Register push token after login and send to backend
const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId,
})
await usersService.updatePushToken(token.data)
```

### Privacy (NDPR)

- Notification bodies must not expose sensitive customer data on the lock screen.
- Use vague text: `"You have a new held transaction"` — never customer names or amounts.
- `notificationsEnabled` flag on the User document must be respected server-side before sending.

---

## Known Limitations (v1)

| Limitation | Future fix |
|------------|-----------|
| Local only — app must be open or in background to receive | Implement remote push with Expo Push API |
| No navigation on notification tap | Add `addNotificationResponseReceivedListener` handler |
| Permission not re-requested after denial | Guide user to device Settings |
| No notification for new credit customer, daily summary, shift reminder | Implement with backend cron after push token registration |
