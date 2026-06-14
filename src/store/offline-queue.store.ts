import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface QueuedTransaction {
  id: string
  payload: Record<string, unknown>
  idempotencyKey: string
  queuedAt: string
  status: 'pending' | 'syncing' | 'failed'
  errorMessage?: string
}

interface OfflineQueueState {
  queue: QueuedTransaction[]
  addToQueue:      (tx: QueuedTransaction) => void
  removeFromQueue: (id: string) => void
  updateStatus:    (id: string, status: QueuedTransaction['status'], error?: string) => void
  clearFailed:     () => void
  pendingCount:    () => number
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      addToQueue: (tx) =>
        set((s) => ({ queue: [...s.queue, tx] })),
      removeFromQueue: (id) =>
        set((s) => ({ queue: s.queue.filter((tx) => tx.id !== id) })),
      updateStatus: (id, status, error) =>
        set((s) => ({
          queue: s.queue.map((tx) =>
            tx.id === id ? { ...tx, status, errorMessage: error } : tx,
          ),
        })),
      clearFailed: () =>
        set((s) => ({ queue: s.queue.filter((tx) => tx.status !== 'failed') })),
      pendingCount: () =>
        get().queue.filter((tx) => tx.status === 'pending').length,
    }),
    {
      name: 'pos-offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
