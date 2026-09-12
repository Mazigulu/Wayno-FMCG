import { Order, OrderState, TelemetryEvent, EventType, PaymentRecord } from '../types/wayno';

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

export function simulateMpesaStkPush(
  order: Order,
  phoneNumber: string
): Promise<{ success: boolean; paymentRecord: PaymentRecord; mpesaReceiptNumber: string }> {
  return new Promise((resolve) => {
    const idempotencyKey = `mpesa_idemp_${order.id}_${Date.now()}`;
    const receiptNum = `QG${Math.floor(10000000 + Math.random() * 90000000)}KE`;

    setTimeout(() => {
      const payment: PaymentRecord = {
        id: `pay_${Date.now()}`,
        orderId: order.id,
        provider: 'M-Pesa',
        providerReference: receiptNum,
        idempotencyKey,
        phoneNumber,
        amount: order.totalAmount,
        currency: 'KES',
        status: 'SUCCESS',
        initiatedAt: new Date(Date.now() - 2200).toISOString(),
        completedAt: new Date().toISOString(),
      };

      resolve({
        success: true,
        paymentRecord: payment,
        mpesaReceiptNumber: receiptNum,
      });
    }, 1200);
  });
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

export function simulateMpesaReversal(
  order: Order,
  refundAmountKES: number,
  reason: string
): Promise<{ success: boolean; reversalRef: string; paymentRecord: PaymentRecord }> {
  return new Promise((resolve) => {
    const reversalRef = `REV_${Math.floor(10000000 + Math.random() * 90000000)}`;
    setTimeout(() => {
      const record: PaymentRecord = {
        id: `rev_${Date.now()}`,
        orderId: order.id,
        provider: 'M-Pesa',
        providerReference: reversalRef,
        idempotencyKey: `mpesa_rev_idemp_${order.id}_${Date.now()}`,
        phoneNumber: order.retailerPhone,
        amount: refundAmountKES,
        currency: 'KES',
        status: 'REVERSED',
        reconciliationState: 'REFUNDED',
        initiatedAt: new Date(Date.now() - 1500).toISOString(),
        completedAt: new Date().toISOString(),
      };

      resolve({
        success: true,
        reversalRef,
        paymentRecord: record,
      });
    }, 1200);
  });
}
