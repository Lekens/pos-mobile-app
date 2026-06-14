import React, { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { inventoryService, type AdjustmentReason } from '@/services/inventory.service'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import axiosInstance from '@/lib/axios'
import { API_PATHS } from '@/constants/api-paths'
import type { CartProduct } from '@/store/cart.store'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductSearchResult {
  id: string
  name: string
  quantityInStock: number
  sellingPrice: number
  minimumSellingPrice: number
  barcode?: string
  categoryId?: string
  sellingUnits?: CartProduct['sellingUnits']
  baseUnit?: string
  packDefinition?: CartProduct['packDefinition']
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REASONS: AdjustmentReason[] = [
  'Damaged goods',
  'Expired products',
  'Stock count discrepancy',
  'Theft / missing',
  'Other',
]

const DEBOUNCE_MS = 300

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function DamageReportScreen() {
  const user      = useAuthStore((s) => s.user)
  const pushToast = useUIStore((s) => s.pushToast)

  // Search state
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([])
  const [searching, setSearching]         = useState(false)

  // Selection state
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null)

  // Form state
  const [quantity, setQuantity]   = useState('')
  const [reason, setReason]       = useState<AdjustmentReason | null>(null)
  const [photoUri, setPhotoUri]   = useState<string | null>(null)
  const [note, setNote]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Debounce timer ref
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Search ──────────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const params: Record<string, unknown> = { search: q, limit: 10 }
      // Backend controller uses 'storeIds' (plural, comma-separated)
      if (user?.storeId) params.storeIds = user.storeId
      const res = await axiosInstance.get(API_PATHS.PRODUCTS.LIST, { params })
      // Response envelope: { data: { items: [...], nextCursor } }
      const body = res.data as { data?: { items?: ProductSearchResult[] } }
      setSearchResults(body.data?.items ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [user?.storeId])

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      void runSearch(text)
    }, DEBOUNCE_MS)
  }, [runSearch])

  const handleSelectProduct = useCallback((product: ProductSearchResult) => {
    setSelectedProduct(product)
    setSearchQuery(product.name)
    setSearchResults([])
  }, [])

  // ── Photo picker ────────────────────────────────────────────────────────────

  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      pushToast('Gallery permission denied', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
    }
  }, [pushToast])

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      pushToast('Camera permission denied', 'error')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
    }
  }, [pushToast])

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!selectedProduct) {
      pushToast('Please select a product', 'error')
      return
    }
    const qty = parseInt(quantity, 10)
    if (!quantity || isNaN(qty) || qty <= 0) {
      pushToast('Enter a valid quantity', 'error')
      return
    }
    if (!reason) {
      pushToast('Please select a reason', 'error')
      return
    }

    setSubmitting(true)
    try {
      await inventoryService.createAdjustment({
        productId: selectedProduct.id,
        type: 'remove',
        quantity: qty,
        reason,
        note: note.trim() || undefined,
      })
      pushToast('Adjustment submitted', 'success')
      // Reset form
      setSelectedProduct(null)
      setSearchQuery('')
      setSearchResults([])
      setQuantity('')
      setReason(null)
      setPhotoUri(null)
      setNote('')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to submit adjustment'
      pushToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }, [selectedProduct, quantity, reason, note, pushToast])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Damage / Adjustment Report</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Search */}
          <Text style={styles.label}>Product</Text>
          <View style={styles.searchWrapper}>
            <View style={styles.searchInputRow}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search product by name..."
                placeholderTextColor="#475569"
              />
              {searching && (
                <ActivityIndicator
                  size="small"
                  color="#6366f1"
                  style={styles.searchSpinner}
                />
              )}
            </View>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.dropdown}>
                {searchResults.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectProduct(product)}
                  >
                    <Text style={styles.dropdownName}>{product.name}</Text>
                    <Text style={styles.dropdownStock}>
                      Stock: {product.quantityInStock}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Selected product card */}
          {selectedProduct && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedCardLeft}>
                <Text style={styles.selectedCardName}>{selectedProduct.name}</Text>
                <Text style={styles.selectedCardStock}>
                  Current stock: {selectedProduct.quantityInStock} unit
                  {selectedProduct.quantityInStock !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.clearProductBtn}
                onPress={() => {
                  setSelectedProduct(null)
                  setSearchQuery('')
                }}
              >
                <Text style={styles.clearProductText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quantity */}
          <Text style={[styles.label, styles.labelSpacing]}>Quantity to Remove</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g. 3"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            returnKeyType="done"
          />

          {/* Reason chips */}
          <Text style={[styles.label, styles.labelSpacing]}>Reason</Text>
          <View style={styles.reasonGrid}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                onPress={() => setReason(r)}
              >
                <Text style={[styles.reasonChipText, reason === r && styles.reasonChipTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Photo */}
          <Text style={[styles.label, styles.labelSpacing]}>Photo (optional)</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={() => void handleTakePhoto()}>
              <Text style={styles.photoBtnIcon}>📷</Text>
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={() => void handlePickPhoto()}>
              <Text style={styles.photoBtnIcon}>🖼️</Text>
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          {photoUri && (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setPhotoUri(null)}
              >
                <Text style={styles.removePhotoBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Note */}
          <Text style={[styles.label, styles.labelSpacing]}>Note (optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="Additional details..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Adjustment</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // Labels
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  labelSpacing: {
    marginTop: 20,
  },

  // Search
  searchWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 48,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  dropdownName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  dropdownStock: {
    color: '#94a3b8',
    fontSize: 12,
  },

  // Selected product card
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    padding: 12,
    marginTop: 10,
  },
  selectedCardLeft: {
    flex: 1,
    gap: 2,
  },
  selectedCardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  selectedCardStock: {
    color: '#94a3b8',
    fontSize: 13,
  },
  clearProductBtn: {
    padding: 4,
  },
  clearProductText: {
    color: '#64748b',
    fontSize: 16,
  },

  // Generic input
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 14,
    height: 48,
  },
  noteInput: {
    height: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },

  // Reason chips
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  reasonChipActive: {
    backgroundColor: '#312e81',
    borderColor: '#6366f1',
  },
  reasonChipText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  reasonChipTextActive: {
    color: '#a5b4fc',
    fontWeight: '600',
  },

  // Photo
  photoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  photoBtnIcon: {
    fontSize: 18,
  },
  photoBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  photoPreviewWrapper: {
    marginTop: 12,
    alignItems: 'flex-start',
    gap: 8,
  },
  photoPreview: {
    width: 120,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  removePhotoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#1e293b',
    borderRadius: 6,
  },
  removePhotoBtnText: {
    color: '#94a3b8',
    fontSize: 12,
  },

  // Submit
  submitBtn: {
    marginTop: 32,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
