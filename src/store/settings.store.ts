import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface PrinterDevice {
  name: string
  address: string
}

interface SettingsState {
  autoPrint: boolean
  pairedPrinter: PrinterDevice | null
  biometricEnabled: boolean
  notificationsEnabled: boolean
  setAutoPrint: (v: boolean) => void
  setPairedPrinter: (device: PrinterDevice | null) => void
  setBiometricEnabled: (v: boolean) => void
  setNotificationsEnabled: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoPrint: false,
      pairedPrinter: null,
      biometricEnabled: false,
      notificationsEnabled: false,
      setAutoPrint: (v) => set({ autoPrint: v }),
      setPairedPrinter: (device) => set({ pairedPrinter: device }),
      setBiometricEnabled: (v) => set({ biometricEnabled: v }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
    }),
    {
      name: 'pos-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
