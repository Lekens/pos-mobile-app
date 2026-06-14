import * as LocalAuthentication from 'expo-local-authentication'

export const biometricService = {
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync()
      return hasHardware && isEnrolled
    } catch {
      return false
    }
  },

  async authenticate(promptMessage = 'Sign in to POS Choice'): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })
      return result
    } catch (err: unknown) {
      return { success: false, error: String(err) }
    }
  },

  async getSupportedTypes(): Promise<string> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
      const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      return hasFace ? 'Face ID' : 'Fingerprint'
    } catch {
      return 'Biometrics'
    }
  },
}
