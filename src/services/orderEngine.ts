import { Order, OrderState, TelemetryEvent, EventType, PaymentRecord } from '../types/wayno';

export const VALID_TRANSITIONS: Record<OrderState, OrderState[]> = {
  CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLMENT_PENDING', 'CANCELLED'],
  FULFILLMENT_PENDING: ['SUPPLIER_CONFIRMED', 'CANCELLED', 'PARTIALLY_FULFILLED'],
  SUPPLIER_CONFIRMED: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['RIDER_ASSIGNED', 'CANCELLED'],
  RIDER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  PARTIALLY_FULFILLED: ['READY_FOR_PICKUP', 'CANCELLED'],
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
    }, 1800);
  });
}
