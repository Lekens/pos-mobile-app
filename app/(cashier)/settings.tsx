import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import * as Haptics from 'expo-haptics'
import { useAuthStore } from '@/store/auth.store'
import { useSettingsStore } from '@/store/settings.store'
import { useUIStore } from '@/store/ui.store'
import { TOKEN_KEY } from '@/constants/config'
import BluetoothPrinterModal from '@/components/BluetoothPrinterModal'
import { notificationsService } from '@/services/notifications.service'

export default function SettingsScreen() {
  const user         = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)

  const autoPrint      = useSettingsStore((s) => s.autoPrint)
  const pairedPrinter  = useSettingsStore((s) => s.pairedPrinter)
  const setAutoPrint   = useSettingsStore((s) => s.setAutoPrint)

  const biometricEnabled        = useSettingsStore((s) => s.biometricEnabled)
  const setBiometricEnabled     = useSettingsStore((s) => s.setBiometricEnabled)
  const notificationsEnabled    = useSettingsStore((s) => s.notificationsEnabled)
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled)

  const pushToast = useUIStore((s) => s.pushToast)

  const [printerModalVisible, setPrinterModalVisible] = useState(false)

  async function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    clearSession()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Security */}
        <Text style={styles.sectionHeader}>SECURITY</Text>
        <View style={styles.section}>
          <View style={[styles.row, styles.rowNoPress]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Face ID / Fingerprint</Text>
              <Text style={styles.rowValue}>Faster sign-in</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setBiometricEnabled(v)
              }}
              trackColor={{ false: '#1e293b', true: '#4f46e5' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionHeader}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          <View style={[styles.row, styles.rowNoPress]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowValue}>Held cart reminders, low stock</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                if (v) {
                  const granted = await notificationsService.requestPermission()
                  if (granted) setNotificationsEnabled(true)
                  else pushToast('Permission denied — enable in device Settings', 'error')
                } else {
                  setNotificationsEnabled(false)
                }
              }}
              trackColor={{ false: '#1e293b', true: '#4f46e5' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Printer section */}
        <Text style={styles.sectionHeader}>PRINTER</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setPrinterModalVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Bluetooth Printer</Text>
              <Text style={styles.rowValue}>
                {pairedPrinter ? pairedPrinter.name : 'Not connected'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={[styles.row, styles.rowNoPress]}>
            <Text style={styles.rowLabel}>Auto-print on sale</Text>
            <Switch
              value={autoPrint}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setAutoPrint(v)
              }}
              trackColor={{ false: '#1e293b', true: '#4f46e5' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Tools */}
        <Text style={styles.sectionHeader}>TOOLS</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push('/(cashier)/damage-report')}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowLabel}>Damage Report</Text>
              <Text style={styles.rowValue}>Report damaged or missing stock</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Session section */}
        <Text style={styles.sectionHeader}>SESSION</Text>
        <View style={styles.section}>
          <View style={[styles.row, styles.rowNoPress]}>
            <Text style={styles.rowLabel}>Cashier</Text>
            <Text style={styles.rowValue}>
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.row, styles.rowNoPress]}>
            <Text style={styles.rowLabel}>Role</Text>
            <Text style={styles.rowValue}>{user?.role ?? '—'}</Text>
          </View>
        </View>

        {/* App section */}
        <Text style={styles.sectionHeader}>APP</Text>
        <View style={styles.section}>
          <View style={[styles.row, styles.rowNoPress]}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BluetoothPrinterModal
        visible={printerModalVisible}
        onClose={() => setPrinterModalVisible(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 48,
  },
  screenTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowNoPress: {
    // Just layout, no active feedback
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 15,
  },
  rowValue: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    color: '#475569',
    fontSize: 22,
    fontWeight: '300',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginLeft: 20,
  },
  signOutBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#450a0a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  signOutText: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '700',
  },
})
