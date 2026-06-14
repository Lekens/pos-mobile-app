/**
 * Receipt deep-link screen.
 *
 * Opened when the user taps  poschoice://receipt/<invoiceId>  from WhatsApp.
 * Expo Router automatically routes /receipt/[invoiceId] to this file.
 *
 * Auth: if the cashier is not logged in, redirects to the PIN screen.
 * The 8h JWT means cashiers are almost always already authenticated.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { transactionsService } from '@/services/transactions.service'
import { buildWhatsAppReceipt } from '@/utils/receipt'
import { formatNaira } from '@/utils/format-currency'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'

// Shape of data returned by GET /transactions/receipt/:invoiceId
interface ReceiptLineItem {
  productName: string
  sellingUnitName: string
  sellingUnitQty: number
  lineTotal: number
}

interface ReceiptPayload {
  invoiceId: string
  items: ReceiptLineItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  cashierName?: string
  createdAt?: string
  companyName?: string
}

export default function ReceiptScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>()
  const user          = useAuthStore((s) => s.user)
  const pushToast     = useUIStore((s) => s.pushToast)

  const [receipt, setReceipt]   = useState<ReceiptPayload | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login')
    }
  }, [user])

  const fetchReceipt = useCallback(async () => {
    if (!invoiceId || !user) {
      setLoading(false) // auth redirect or missing param — clear spinner
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await transactionsService.getReceipt(invoiceId)
      const data = (res as { data: { data: ReceiptPayload } }).data?.data
      if (!data) throw new Error('Receipt not found')
      setReceipt(data)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not load receipt'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [invoiceId, user])

  useEffect(() => {
    void fetchReceipt()
  }, [fetchReceipt])

  function handleShareAgain() {
    if (!receipt) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const text = buildWhatsAppReceipt({
      invoiceId: receipt.invoiceId,
      items: receipt.items.map((item) => ({
        name: item.productName,
        unitName: item.sellingUnitName,
        qty: item.sellingUnitQty,
        lineTotal: item.lineTotal,
      })),
      subtotal:      receipt.subtotal,
      vatAmount:     receipt.taxAmount,
      total:         receipt.totalAmount,
      paymentMethod: receipt.paymentMethod,
      companyName:   receipt.companyName,
      createdAt:     receipt.createdAt,
    })
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`
    Linking.openURL(url).catch(() => {
      pushToast('Could not open WhatsApp', 'error')
    })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back()
            else router.replace('/(cashier)/pos')
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        {receipt && (
          <TouchableOpacity
            onPress={handleShareAgain}
            style={styles.shareBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.shareBtnText}>↗ WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centred}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading receipt…</Text>
          </View>
        ) : error ? (
          <View style={styles.centred}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void fetchReceipt()}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : receipt ? (
          <View style={styles.receiptCard}>
            {/* Store header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.storeName}>
                {receipt.companyName ?? 'POS Choice'}
              </Text>
              <Text style={styles.receiptLabel}>RECEIPT</Text>
              <Text style={styles.invoiceId}>{receipt.invoiceId}</Text>
              {receipt.createdAt && (
                <Text style={styles.receiptDate}>
                  {new Date(receipt.createdAt).toLocaleDateString('en-NG', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
              {receipt.cashierName && (
                <Text style={styles.cashierName}>Cashier: {receipt.cashierName}</Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* Items */}
            <View style={styles.itemsSection}>
              {receipt.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemUnit}>
                      {item.sellingUnitName} × {item.sellingUnitQty}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatNaira(item.lineTotal)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatNaira(receipt.subtotal)}</Text>
              </View>
              {receipt.taxAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>VAT</Text>
                  <Text style={styles.totalValue}>{formatNaira(receipt.taxAmount)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>TOTAL</Text>
                <Text style={styles.grandTotalValue}>
                  {formatNaira(receipt.totalAmount)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Payment</Text>
                <Text style={styles.paymentMethod}>
                  {receipt.paymentMethod.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.thankYou}>Thank you for your business!</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#020617' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 12 },
  backBtn:       { padding: 4 },
  backArrow:     { color: '#94a3b8', fontSize: 22 },
  headerTitle:   { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1 },
  shareBtn:      { backgroundColor: '#25d366', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  shareBtnText:  { color: '#fff', fontSize: 12, fontWeight: '700' },
  scroll:        { flex: 1 },
  content:       { padding: 16, paddingBottom: 48 },

  centred:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorIcon:   { fontSize: 36 },
  errorText:   { color: '#f87171', fontSize: 14, textAlign: 'center' },
  retryBtn:    { backgroundColor: '#1e293b', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText:{ color: '#a5b4fc', fontSize: 14, fontWeight: '600' },

  receiptCard:    { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  receiptHeader:  { alignItems: 'center', padding: 20, gap: 4 },
  storeName:      { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  receiptLabel:   { color: '#6366f1', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  invoiceId:      { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace', marginTop: 4 },
  receiptDate:    { color: '#64748b', fontSize: 12, marginTop: 2 },
  cashierName:    { color: '#64748b', fontSize: 12 },

  divider: { height: 1, backgroundColor: '#1e293b' },

  itemsSection: { padding: 16, gap: 12 },
  itemRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemLeft:     { flex: 1 },
  itemName:     { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  itemUnit:     { color: '#64748b', fontSize: 12, marginTop: 1 },
  itemTotal:    { color: '#fff', fontSize: 14, fontWeight: '600', tabularNums: true } as object,

  totalsSection:   { padding: 16, gap: 8 },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:      { color: '#64748b', fontSize: 13 },
  totalValue:      { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  grandTotalRow:   { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' },
  grandTotalLabel: { color: '#fff', fontSize: 16, fontWeight: '800' },
  grandTotalValue: { color: '#6366f1', fontSize: 18, fontWeight: '800' },
  paymentMethod:   { color: '#10b981', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },

  thankYou: { color: '#475569', fontSize: 13, textAlign: 'center', padding: 20 },
})
