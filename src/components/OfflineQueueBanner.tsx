import React, { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useOfflineQueueStore } from '@/store/offline-queue.store'
import { transactionsService } from '@/services/transactions.service'
import { notificationsService } from '@/services/notifications.service'
import { useUIStore } from '@/store/ui.store'
import { useSettingsStore } from '@/store/settings.store'

export default function OfflineQueueBanner() {
  const queue              = useOfflineQueueStore((s) => s.queue)
  const removeFromQueue    = useOfflineQueueStore((s) => s.removeFromQueue)
  const updateStatus       = useOfflineQueueStore((s) => s.updateStatus)
  const clearFailed        = useOfflineQueueStore((s) => s.clearFailed)
  const pushToast          = useUIStore((s) => s.pushToast)
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled)
  const [syncing, setSyncing] = useState(false)

  const pending = queue.filter((tx) => tx.status === 'pending')
  const failed  = queue.filter((tx) => tx.status === 'failed')

  const handleSync = useCallback(async () => {
    if (pending.length === 0 || syncing) return
    setSyncing(true)
    let successCount = 0
    for (const tx of pending) {
      updateStatus(tx.id, 'syncing')
      try {
        await transactionsService.create(tx.payload, tx.idempotencyKey)
        removeFromQueue(tx.id)
        successCount++
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to sync'
        updateStatus(tx.id, 'failed', msg)
      }
    }
    setSyncing(false)
    if (successCount > 0) {
      pushToast(successCount + ' transaction' + (successCount !== 1 ? 's' : '') + ' synced', 'success')
      if (notificationsEnabled) void notificationsService.sendSyncCompleteAlert(successCount)
    }
    if (pending.length - successCount > 0) {
      pushToast('Some transactions failed to sync', 'error')
    }
  }, [pending, syncing, updateStatus, removeFromQueue, pushToast, notificationsEnabled])

  if (queue.length === 0) return null

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <Text style={styles.title}>
          {pending.length > 0
            ? pending.length + ' offline sale' + (pending.length !== 1 ? 's' : '') + ' pending'
            : failed.length + ' sale' + (failed.length !== 1 ? 's' : '') + ' failed to sync'}
        </Text>
        {failed.length > 0 && (
          <TouchableOpacity onPress={clearFailed}>
            <Text style={styles.clearFailed}>Clear failed</Text>
          </TouchableOpacity>
        )}
      </View>
      {pending.length > 0 && (
        <TouchableOpacity
          style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
          onPress={() => void handleSync()}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.syncBtnText}>Sync</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  banner:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#7c3aed', paddingVertical: 8, paddingHorizontal: 16, gap: 12 },
  left:            { flex: 1, gap: 2 },
  title:           { color: '#fff', fontSize: 12, fontWeight: '600' },
  clearFailed:     { color: '#ddd6fe', fontSize: 11, textDecorationLine: 'underline' },
  syncBtn:         { backgroundColor: '#4c1d95', borderRadius: 6, paddingVertical: 5, paddingHorizontal: 14, minWidth: 56, alignItems: 'center' },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText:     { color: '#fff', fontSize: 13, fontWeight: '600' },
})
