# POS-Choice Mobile — Biometric Authentication

> **Status: ✅ IMPLEMENTED** — 2026-06-14 (MOB-BL-01)
>
> This document was originally a future-feature spec. It has been updated to reflect what was actually built.

---

## What Was Built

Biometric authentication (Face ID / Touch ID / Fingerprint) is fully implemented.
Cashiers can enable it after their first successful PIN login, and the app will prompt
for biometrics on every subsequent cold start — replacing the PIN for fast re-authentication.

### Files

| File | Role |
|------|------|
| `src/services/biometric.service.ts` | Core wrapper around `expo-local-authentication` |
| `src/store/settings.store.ts` | Persists `biometricEnabled: boolean` to AsyncStorage |
| `app/(auth)/login.tsx` | Enrolment prompt + biometric login button |
| `app/_layout.tsx` | Bootstrap gate — biometric check before session restore |
| `app/(cashier)/settings.tsx` | SECURITY section toggle |

---

## Implementation vs Original Spec

| Aspect | Original spec | What was built |
|--------|--------------|----------------|
| Trigger | Auto-lock re-entry only | **Cold start** — if `biometricEnabled && valid JWT`, biometric fires before session restore |
| Enrolment | PIN confirmation → biometric test | **Alert after first successful PIN login** — non-blocking, "Enable Face ID?" dialog |
| Storage key | `biometric_enabled_<cashierId>` per-cashier | Single `biometricEnabled` flag in Zustand `settings.store.ts` (AsyncStorage `pos-settings`) |
| Settings entry | Settings → Security | ✅ Added SECURITY section to `app/(cashier)/settings.tsx` |
| Fallback | 3 failed attempts → PIN | **OS handles fallback automatically** — `disableDeviceFallback: false` allows device PIN |

---

## How It Works

### Cold Start Flow

```
App opens
  → bootstrap reads SecureStore token
  → JWT still valid?
    YES → biometricEnabled?
      YES → biometricService.authenticate('Sign in to POS Choice')
        SUCCESS → restore session → navigate to POS
        FAIL    → deleteItemAsync(TOKEN_KEY) → navigate to /login (PIN required)
      NO  → restore session → navigate to POS
    NO  → navigate to /login
```

### Enrolment Flow (first time)

```
Cashier enters correct PIN
  → session created
  → biometricService.isAvailable() → true?
    YES & biometricEnabled === false
      → Alert: "Enable Face ID?"
        [Enable] → setBiometricEnabled(true)
        [Not now] → skip
  → normal post-login navigation
```

### Login Screen Biometric Button

Shown only when `biometricEnabled && biometricAvailable`:

```
┌──────────────────────────────────────┐
│        [PIN numpad]                  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │   🔐  Use Face ID            │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

Tapping the button calls `biometricService.authenticate()`. On success, checks active shift and navigates accordingly.

---

## biometric.service.ts API

```typescript
biometricService.isAvailable(): Promise<boolean>
// Returns true only if hardware present AND enrolled.

biometricService.authenticate(promptMessage?: string): Promise<{ success: boolean; error?: string }>
// Shows OS biometric prompt. Falls back to device PIN/passcode automatically.

biometricService.getSupportedTypes(): Promise<string>
// Returns 'Face ID' on iPhone X+, 'Fingerprint' on Android/older iOS.
```

---

## Permissions

Already configured in `app.json`:

**iOS** `infoPlist`:
```json
"NSFaceIDUsageDescription": "POS-Choice uses Face ID for faster cashier sign-in."
```

**Android**: No explicit permission needed — OS biometric prompt handles it.

---

## NDPR Note

Biometric data is processed **on-device only** by the OS.
POS-Choice never sees, stores, or transmits biometric data.
Only the `boolean` result (`success: true/false`) is used.
NDPR consent is not required for this feature.

---

## Settings Toggle

Located in `app/(cashier)/settings.tsx` → **SECURITY** section:

```
SECURITY
┌───────────────────────────────────────────────┐
│ Face ID / Fingerprint    Faster sign-in   [ ●] │
└───────────────────────────────────────────────┘
```

Toggling off disables biometric; next cold start will show PIN screen.
