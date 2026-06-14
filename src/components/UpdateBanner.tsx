import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import * as Updates from 'expo-updates'

/**
 * Silently checks for an OTA update on mount.
 * If one is available, fetches it and shows a non-blocking banner.
 * Tapping "Restart" calls Updates.reloadAsync() to apply the update.
 * Invisible in Expo Go / dev mode — try/catch guards all Updates calls.
 */
export default function UpdateBanner() {
  const [available, setAvailable] = useState(false)
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    async function check() {
      // expo-updates throws in Expo Go and in development builds
      // without a configured update URL — catch all errors silently.
      if (__DEV__) return
      try {
        const update = await Updates.checkForUpdateAsync()
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync()
          setAvailable(true)
        }
      } catch {
        // Not configured yet, or running in Expo Go — ignore.
      }
    }
    void check()
  }, [])

  if (!available) return null

  async function handleRestart() {
    setReloading(true)
    try {
      await Updates.reloadAsync()
    } catch {
      setReloading(false)
    }
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>✨ Update ready — restart to apply</Text>
      <TouchableOpacity
        style={[styles.btn, reloading && styles.btnDisabled]}
        onPress={() => void handleRestart()}
        disabled={reloading}
        activeOpacity={0.8}
      >
        {reloading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.btnText}>Restart</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4f46e5',
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 12,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  btn: {
    backgroundColor: '#312e81',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 64,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
})
