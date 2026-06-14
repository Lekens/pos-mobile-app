# POS-Choice Mobile — Offline Transaction Queue

> **Status: ✅ IMPLEMENTED** — 2026-06-14 (MOB-BL-04)
>
> This document was originally a future-feature spec. It has been updated to reflect what was actually built.

---

## What Was Built

When the cashier has no internet connection, the checkout flow queues the transaction
locally in Zustand (persisted to AsyncStorage) instead of failing. A purple banner shows
the pending count and a [Sync] button. When connectivity is restored the cashier taps
Sync (or it can be triggered automatically) to upload all queued transactions.

### Files

| File | Role |
|------|------|
| `src/store/offline-queue.store.ts` | Zustand store persisted to AsyncStorage (`pos-offline-queue`) |
| `src/components/OfflineQueueBanner.tsx` | Purple banner with count + [Sync] button |
| `src/components/CheckoutSheet.tsx` | NetInfo check before API call; queues if offline |
| `src/services/notifications.service.ts` | Fires local notification on sync completion |
| `app/_layout.tsx` | Renders `OfflineQueueBanner` globally above all screens |

---

## Implementation vs Original Spec

| Aspect | Original spec | What was built |
|--------|--------------|----------------|
| Storage | Raw AsyncStorage JSON | **Zustand `persist` middleware** — cleaner API, same AsyncStorage backing |
| Status values | `pending / syncing / synced / failed / conflict` | `pending / syncing / failed` — `synced` items are removed immediately; `conflict` merged into `failed` |
| Retry strategy | Exponential back-off (5s → 120s, max 10 retries) | **Manual sync** — cashier taps [Sync] button; no auto-retry timer in v1 |
| NetInfo listener | Auto-trigger on reconnect | Banner always visible; auto-trigger is a future enhancement |
| Conflict screen | Separate conflict UI | Failed items show inline with [Clear failed] link in banner |
| Stock cache | Local stock cache decremented offline | Not implemented in v1 — server validates on sync |
| Notification | — | **Sync complete notification** fires via `notificationsService.sendSyncCompleteAlert()` |

---

## How It Works

### Checkout Flow

```
Cashier taps [Confirm] in checkout
  → NetInfo.fetch()
    isConnected && isInternetReachable?
      YES → transactionsService.create(payload, idempotencyKey)
        SUCCESS → normal receipt flow
        FAIL    → error toast
      NO  → offlineQueueStore.addToQueue({
                id: randomUUID(),
                payload,
                idempotencyKey: randomUUID(),
                queuedAt: ISO timestamp,
                status: 'pending'
              })
           → toast: "Saved offline — will sync when connected"
           → clearCart() + onSuccess()  (completes UX as if successful)
```

### QueuedTransaction Shape

```typescript
interface QueuedTransaction {
  id: string                          // local UUID
  payload: Record<string, unknown>    // full POST /transactions body
  idempotencyKey: string              // sent as X-Idempotency-Key on sync
  queuedAt: string                    // ISO timestamp
  status: 'pending' | 'syncing' | 'failed'
  errorMessage?: string
}
```

### Sync Flow

```
Cashier taps [Sync] on OfflineQueueBanner
  → for each pending transaction (sequential):
      updateStatus(id, 'syncing')
      transactionsService.create(payload, idempotencyKey)
        SUCCESS → removeFromQueue(id)
        FAIL    → updateStatus(id, 'failed', errorMessage)
  → successCount > 0 → success toast + sync notification
  → any failures → error toast
```

The `X-Idempotency-Key` header ensures that if a transaction was already processed
on a previous sync attempt (e.g. the response was lost), the server returns the
cached result rather than creating a duplicate.

---

## OfflineQueueBanner

A purple (`#7c3aed`) sticky bar rendered above all screens in `_layout.tsx`.
Only visible when `queue.length > 0`.

```
 ┌────────────────────────────────────────────────────┐
 │ 3 offline sales pending                   [Sync]  │
 └────────────────────────────────────────────────────┘

 ┌────────────────────────────────────────────────────┐
 │ 1 sale failed to sync     [Clear failed]           │
 └────────────────────────────────────────────────────┘
```

---

## offline-queue.store.ts API

```typescript
useOfflineQueueStore.getState().addToQueue(tx: QueuedTransaction): void
useOfflineQueueStore.getState().removeFromQueue(id: string): void
useOfflineQueueStore.getState().updateStatus(id, status, error?): void
useOfflineQueueStore.getState().clearFailed(): void
useOfflineQueueStore.getState().pendingCount(): number
```

---

## Idempotency Key Strategy

- A **new** `idempotencyKey = crypto.randomUUID()` is generated at queue-time (not at checkout-open time).
- This key is reused on every retry, so the server deduplicates correctly.
- The backend caches results under this key for 24 hours.
- If the server returns HTTP 200 for a previously processed key, that counts as success.

---

## Known Limitations (v1)

| Limitation | Future fix |
|------------|-----------|
| No auto-sync on reconnect (manual only) | Add `NetInfo.addEventListener` to trigger sync on connectivity restored |
| No exponential back-off on failures | Add retry timer to `OfflineQueueBanner` |
| No conflict screen for validation errors | Parse `errorMessage` and show product-specific guidance |
| Stock not decremented locally while offline | Cache stock locally and decrement; revert on sync failure |
| Queue not encrypted on Android | Use `expo-secure-store` for enterprise deployments |
