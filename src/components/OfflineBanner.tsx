import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import NetInfo, { NetInfoState } from '@react-native-community/netinfo'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOffline(!(state.isConnected && state.isInternetReachable !== false))
    })
    return unsub
  }, [])

  if (!isOffline) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️  You're offline — data may be stale</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fca5a5',
    fontSize: 12,
  },
})
