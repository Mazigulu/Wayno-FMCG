import {
  Order,
  OrderState,
  TelemetryEvent,
  EventType,
  PaymentRecord,
  PaymentTransaction,
  Payment,
  OrderItem,
  Product,
  SupplierProduct,
} from '../types/wayno';
import { paymentService } from './paymentService';
import { PRODUCTS, SUPPLIER_PRODUCTS } from '../data/mockData';

export const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  // 1. Initial / Draft
  CART: ['CHECKOUT_PENDING', 'CANCELLED'],
  CHECKOUT_PENDING: ['PAYMENT_PENDING', 'CANCELLED', 'FAILED'],
  
  // 2. Financial / Settlement
  PAYMENT_PENDING: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['SUPPLIER_PENDING', 'FULFILLMENT_PENDING', 'CANCELLED', 'REFUND_PENDING'],

  // 3. Supplier / Depot Fulfillment
  SUPPLIER_PENDING: ['ACCEPTED', 'PREPARING', 'SUPPLIER_CONFIRMED', 'CANCELLED', 'REFUND_PENDING', 'PARTIALLY_FULFILLED'],
  ACCEPTED: ['PREPARING', 'READY_FOR_PICKUP', 'CANCELLED', 'REFUND_PENDING'],
  PREPARING: ['READY_FOR_PICKUP', 'PARTIALLY_FULFILLED', 'CANCELLED', 'REFUND_PENDING'],
  READY_FOR_PICKUP: ['RIDER_ASSIGNED', 'CANCELLED', 'REFUND_PENDING'],

  // 4. Logistics & Delivery Handshake
  RIDER_ASSIGNED: ['PICKED_UP', 'RIDER_ASSIGNED', 'FAILED', 'CANCELLED', 'REFUND_PENDING'], // Allows reassignment
  PICKED_UP: ['OUT_FOR_DELIVERY', 'FAILED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED', 'REFUND_PENDING'],

  // 5. Terminal & Exception States
  DELIVERED: [], // Terminal successful state: completed deliveries cannot silently revert per spec
  CANCELLED: ['REFUND_PENDING', 'REFUNDED'],
  FAILED: ['REFUND_PENDING', 'CANCELLED', 'READY_FOR_PICKUP'], // Exception can trigger refund or re-dispatch
  REFUND_PENDING: ['REFUNDED', 'FAILED'],
  REFUNDED: [], // Terminal financial reversal

  // Backwards-compatible aliases
  CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
  FULFILLMENT_PENDING: ['SUPPLIER_CONFIRMED', 'ACCEPTED', 'PREPARING', 'CANCELLED', 'PARTIALLY_FULFILLED'],
  SUPPLIER_CONFIRMED: ['PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'],
  PARTIALLY_FULFILLED: ['READY_FOR_PICKUP', 'PREPARING', 'CANCELLED', 'REFUND_PENDING'],
};

export function canTransitionOrder(currentState: OrderState, nextState: OrderState): boolean {
  return VALID_TRANSITIONS[currentState]?.includes(nextState) ?? false;
}

export function generateEvent(
  eventType: EventType,
  userId: string,
  shopId: string,
  metadata: Record<string, any> = {}
): TelemetryEvent {
  return {
    eventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
    eventType,
    timestamp: new Date().toISOString(),
    userId,
    shopId,
    sessionId: `sess_${userId}_${new Date().toISOString().slice(0, 10)}`,
    deviceId: 'android_duka_client_v1_s21',
    location: { lat: -1.2585, lng: 36.8834 },
    metadata,
  };
}

export async function simulateMpesaStkPush(
  order: Order,
  phoneNumber: string
): Promise<{ success: boolean; paymentRecord: PaymentTransaction; mpesaReceiptNumber: string }> {
  // Delegate directly to Section 25 PaymentService abstraction
  const res = await paymentService.initiatePayment({ order, phoneNumber }, 'M-Pesa');
  return {
    success: res.success,
    paymentRecord: res.paymentRecord,
    mpesaReceiptNumber: res.providerReference,
  };
}

export function executeTransitionGuarded(
  order: Order,
  nextState: OrderState,
  actor: string,
  note: string
): { success: boolean; updatedOrder?: Order; error?: string } {
  if (!canTransitionOrder(order.status, nextState)) {
    return {
      success: false,
      error: `Illegal state transition from ${order.status} to ${nextState} rejected by server authority.`,
    };
  }

  const updatedOrder: Order = {
    ...order,
    status: nextState,
    stateHistory: [
      ...order.stateHistory,
      {
        state: nextState,
        timestamp: new Date().toISOString(),
        actor,
        note,
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  return { success: true, updatedOrder };
}

export async function simulateMpesaReversal(
  order: Order,
  refundAmountKES: number,
  reason: string
): Promise<{ success: boolean; reversalRef: string; paymentRecord: PaymentTransaction }> {
  // Delegate directly to Section 25 PaymentService abstraction
  const res = await paymentService.refundPayment({
    order,
    refundAmount: refundAmountKES,
    reason,
    provider: 'M-Pesa',
  });
  return {
    success: res.success,
    reversalRef: res.reversalRef,
    paymentRecord: res.paymentRecord,
  };
}

// ============================================================================
// PRODUCTION HARDENING 1: CARGO PAYLOAD & MULTI-VEHICLE DISPATCH
// Prevents overloading 150cc Boda Bodas (>90kg or >0.25 CBM) with auto-split.
// ============================================================================
export interface PayloadAnalysis {
  totalWeightKg: number;
  totalVolumeCbm: number;
  assignedVehicleType: 'BODA_BODA' | 'TUK_TUK' | 'PICKUP_VAN';
  dispatchSplitsCount: number;
  isOverweightForSingleBoda: boolean;
  notes: string;
}

export function calculateOrderPayload(
  items: OrderItem[],
  customProducts?: Product[]
): PayloadAnalysis {
  const catalog = customProducts || PRODUCTS;
  let totalWeightKg = 0;
  let totalVolumeCbm = 0;

  for (const item of items) {
    const prod = catalog.find((p) => p.id === item.productId);
    const unitWeight = item.unitWeightKg !== undefined ? item.unitWeightKg : (prod?.unitWeightKg || 5.0);
    const unitVolume = prod?.unitVolumeCbm || 0.015; // default 0.015 cbm
    totalWeightKg += unitWeight * item.quantity;
    totalVolumeCbm += unitVolume * item.quantity;
  }

  totalWeightKg = Number(totalWeightKg.toFixed(2));
  totalVolumeCbm = Number(totalVolumeCbm.toFixed(3));

  // Max payload constraints
  const BODA_MAX_WEIGHT_KG = 90;
  const BODA_MAX_VOLUME_CBM = 0.25;

  let assignedVehicleType: 'BODA_BODA' | 'TUK_TUK' | 'PICKUP_VAN' = 'BODA_BODA';
  let dispatchSplitsCount = 1;
  let isOverweightForSingleBoda = false;
  let notes = 'Standard single Boda Boda dispatch within safe operating payload limits.';

  if (totalWeightKg > 300 || totalVolumeCbm > 0.8) {
    assignedVehicleType = 'PICKUP_VAN';
    dispatchSplitsCount = 1;
    isOverweightForSingleBoda = true;
    notes = `Exceeds Tuk-Tuk capacity (${totalWeightKg}kg / ${totalVolumeCbm}m³). Escalate to 1-Tonne Pickup Van.`;
  } else if (totalWeightKg > BODA_MAX_WEIGHT_KG || totalVolumeCbm > BODA_MAX_VOLUME_CBM) {
    // Check if multi-boda or tuk-tuk
    if (totalWeightKg <= 180) {
      assignedVehicleType = 'BODA_BODA';
      dispatchSplitsCount = Math.ceil(totalWeightKg / BODA_MAX_WEIGHT_KG);
      isOverweightForSingleBoda = true;
      notes = `Overweight for single motorcycle (${totalWeightKg}kg). Auto-split into ${dispatchSplitsCount} synchronized Boda runs.`;
    } else {
      assignedVehicleType = 'TUK_TUK';
      dispatchSplitsCount = 1;
      isOverweightForSingleBoda = true;
      notes = `Cargo payload (${totalWeightKg}kg) dispatched via high-capacity 3-Wheeler Cargo Tuk-Tuk.`;
    }
  }

  return {
    totalWeightKg,
    totalVolumeCbm,
    assignedVehicleType,
    dispatchSplitsCount,
    isOverweightForSingleBoda,
    notes,
  };
}

// ============================================================================
// PRODUCTION HARDENING 2: OFFLINE EMERGENCY DELIVERY OTP / USSD FALLBACK
// Prevents deadlocks when duka smartphone battery runs out upon rider arrival.
// ============================================================================
export function generateOfflineDeliveryCode(orderId: string, phone: string): string {
  // Generate a numeric 4-digit code and USSD string format (*384*<PIN>#)
  const seed = (orderId + phone).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pin = String((seed * 9301 + 49297) % 10000).padStart(4, '0');
  return pin;
}

// ============================================================================
// PRODUCTION HARDENING 3: VIRTUAL STOCK RESERVATIONS & PHANTOM STOCK SHIELD
// Shields against simultaneous walk-in counter sales at wholesale depots.
// ============================================================================
export interface StockReservation {
  reservationId: string;
  wholesalerLocationId: string;
  orderId: string;
  items: { productId: string; quantity: number }[];
  expiresAt: number; // 15-minute TTL
  status: 'ACTIVE' | 'COMMITTED' | 'EXPIRED' | 'CANCELLED';
}

export class VirtualStockReservationManager {
  private static reservations = new Map<string, StockReservation>();
  private static readonly RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Attempt to lock inventory with safety buffer check
   */
  static reserveStock(
    orderId: string,
    wholesalerLocationId: string,
    items: { productId: string; quantity: number }[],
    supplierInventory: SupplierProduct[] = SUPPLIER_PRODUCTS
  ): { success: boolean; reservationId?: string; reservedUntil?: string; error?: string } {
    const now = Date.now();
    this.purgeExpiredReservations();

    // Verify all items are above safety stock threshold
    for (const item of items) {
      const sp = supplierInventory.find(
        (s) => s.productId === item.productId && s.wholesalerLocationId === wholesalerLocationId
      );

      if (!sp) {
        return { success: false, error: `Product ${item.productId} not stocked at this depot.` };
      }

      const activeReserved = this.getCurrentlyReservedQuantity(wholesalerLocationId, item.productId);
      const effectiveAvailable = sp.stockQty - activeReserved;
      const safetyBuffer = sp.safetyStockBuffer || 3;

      if (effectiveAvailable - item.quantity < safetyBuffer) {
        return {
          success: false,
          error: `Stock contention: Item ${item.productId} available quantity (${effectiveAvailable}) is at or below depot counter safety buffer (${safetyBuffer}).`,
        };
      }
    }

    const reservationId = `res_${orderId}_${now.toString(36)}`;
    const expiresAt = now + this.RESERVATION_TTL_MS;
    const reservation: StockReservation = {
      reservationId,
      wholesalerLocationId,
      orderId,
      items,
      expiresAt,
      status: 'ACTIVE',
    };

    this.reservations.set(reservationId, reservation);

    return {
      success: true,
      reservationId,
      reservedUntil: new Date(expiresAt).toISOString(),
    };
  }

  static commitReservation(reservationId: string): boolean {
    const res = this.reservations.get(reservationId);
    if (!res || res.status !== 'ACTIVE') return false;
    res.status = 'COMMITTED';
    return true;
  }

  static cancelReservation(reservationId: string): void {
    const res = this.reservations.get(reservationId);
    if (res) {
      res.status = 'CANCELLED';
      this.reservations.delete(reservationId);
    }
  }

  static getCurrentlyReservedQuantity(wholesalerLocationId: string, productId: string): number {
    let total = 0;
    const now = Date.now();
    for (const res of this.reservations.values()) {
      if (res.status === 'ACTIVE' && res.expiresAt > now && res.wholesalerLocationId === wholesalerLocationId) {
        const matching = res.items.find((i) => i.productId === productId);
        if (matching) total += matching.quantity;
      }
    }
    return total;
  }

  static purgeExpiredReservations(): number {
    const now = Date.now();
    let purged = 0;
    for (const [id, res] of this.reservations.entries()) {
      if (res.status === 'ACTIVE' && res.expiresAt <= now) {
        res.status = 'EXPIRED';
        this.reservations.delete(id);
        purged++;
      }
    }
    return purged;
  }

  static getActiveReservationsCount(): number {
    this.purgeExpiredReservations();
    return this.reservations.size;
  }
}

