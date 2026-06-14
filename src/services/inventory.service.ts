import axiosInstance from '@/lib/axios'
import { API_PATHS } from '@/constants/api-paths'

export type AdjustmentReason =
  | 'Damaged goods'
  | 'Expired products'
  | 'Stock count discrepancy'
  | 'Theft / missing'
  | 'Other'

export interface CreateAdjustmentPayload {
  productId: string
  type: 'remove'
  quantity: number
  reason: AdjustmentReason
  note?: string
}

export const inventoryService = {
  createAdjustment: (payload: CreateAdjustmentPayload) =>
    axiosInstance.post(API_PATHS.INVENTORY.ADJUSTMENTS, {
      ...payload,
      quantity: Math.abs(Math.floor(payload.quantity)),
    }),
}
