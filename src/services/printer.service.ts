// Conditional import — not available in Expo Go, only in EAS builds
let BluetoothEscposPrinter: any = null
let BluetoothManager: any = null
try {
  const mod = require('react-native-bluetooth-escpos-printer')
  BluetoothEscposPrinter = mod.BluetoothEscposPrinter
  BluetoothManager = mod.BluetoothManager
} catch {
  // Running in Expo Go — printing not available
}

import { formatNaira } from '@/utils/format-currency'
import type { ReceiptData } from '@/utils/receipt'

export interface PrinterDevice {
  name: string
  address: string
}

export function isPrintingAvailable(): boolean {
  return !!(BluetoothEscposPrinter && BluetoothManager)
}

class PrinterService {
  async scanDevices(): Promise<PrinterDevice[]> {
    if (!isPrintingAvailable()) return []

    try {
      await BluetoothManager.enableBluetooth()
      const paired: unknown = await BluetoothManager.scanDevices()

      let devices: Array<{ name?: string; address?: string }> = []
      if (typeof paired === 'string') {
        const parsed = JSON.parse(paired) as { paired?: Array<{ name?: string; address?: string }> }
        devices = parsed?.paired ?? []
      } else if (Array.isArray(paired)) {
        devices = paired as Array<{ name?: string; address?: string }>
      } else if (paired && typeof paired === 'object') {
        const obj = paired as { paired?: Array<{ name?: string; address?: string }> }
        devices = obj?.paired ?? []
      }

      return devices
        .filter((d) => d.address)
        .map((d) => ({ name: d.name ?? d.address ?? 'Unknown', address: d.address! }))
    } catch {
      return []
    }
  }

  async connectDevice(address: string): Promise<void> {
    if (!isPrintingAvailable()) {
      throw new Error('Bluetooth printing is not available in this build')
    }
    await BluetoothManager.connect(address)
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    if (!isPrintingAvailable()) {
      throw new Error('Bluetooth printing is not available in this build')
    }

    const companyName = data.companyName ?? 'POS Choice'

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER)
    await BluetoothEscposPrinter.printText(companyName + '\n\n', { fonttype: 1 })
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT)
    await BluetoothEscposPrinter.printText(data.invoiceId + '\n', {})

    const now = data.createdAt ? new Date(data.createdAt) : new Date()
    const dateStr = now.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    await BluetoothEscposPrinter.printText(dateStr + '\n', {})
    await BluetoothEscposPrinter.printText('--------------------------------\n', {})
    await BluetoothEscposPrinter.printColumn(
      ['Product', 'Qty', 'Total'],
      [24, 4, 8],
      ['LEFT', 'CENTER', 'RIGHT'],
      {},
    )
    await BluetoothEscposPrinter.printText('--------------------------------\n', {})

    for (const item of data.items) {
      const label = `${item.name} (${item.unitName})`
      await BluetoothEscposPrinter.printColumn(
        [label, String(item.qty), formatNaira(item.lineTotal)],
        [24, 4, 8],
        ['LEFT', 'CENTER', 'RIGHT'],
        {},
      )
    }

    await BluetoothEscposPrinter.printText('--------------------------------\n', {})
    await BluetoothEscposPrinter.printText('Subtotal: ' + formatNaira(data.subtotal) + '\n', {})

    if (data.vatAmount > 0) {
      await BluetoothEscposPrinter.printText('VAT: ' + formatNaira(data.vatAmount) + '\n', {})
    }

    await BluetoothEscposPrinter.printText('TOTAL: ' + formatNaira(data.total) + '\n', { fonttype: 1 })
    await BluetoothEscposPrinter.printText('Payment: ' + data.paymentMethod + '\n', {})
    await BluetoothEscposPrinter.printText('--------------------------------\n', {})
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER)
    await BluetoothEscposPrinter.printText('Thank you for your business!\n', {})
    await BluetoothEscposPrinter.printText('\n\n\n', {})
  }
}

export const printerService = new PrinterService()
