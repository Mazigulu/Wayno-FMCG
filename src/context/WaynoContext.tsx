import React, { createContext, useContext, useState } from 'react';
import { 
  Product, 
  SupplierProduct, 
  CartItem, 
  Order, 
  RetailerShop, 
  Rider, 
  TelemetryEvent, 
  OrderState,
  PaymentRecord,
  DeliveryExceptionCode,
  DeliveryException
} from '../types/wayno';
import { INITIAL_SHOPS, INITIAL_RIDERS } from '../data/mockData';
import { generateEvent, simulateMpesaReversal } from '../services/orderEngine';
import { recordOrderPromotionalConversions } from '../services/searchEngine';

interface WaynoContextType {
  orders: Order[];
  events: TelemetryEvent[];
  cart: CartItem[];
  paymentRecords: PaymentRecord[];
  currentShop: RetailerShop;
  allShops: RetailerShop[];
  isCartOpen: boolean;
  trackingOrder: Order | null;
  activeOrdersCount: number;
  cartCount: number;
  addToCart: (
    product: Product, 
    supplierProduct: SupplierProduct, 
    campaignId?: string, 
    discountKES?: number
  ) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  setTrackingOrder: (order: Order | null) => void;
  selectShop: (shopId: string) => void;
  handleOrderCreated: (newOrder: Order) => void;
  handleUpdateOrderStatus: (orderId: string, nextStatus: OrderState, note: string, actor?: string) => void;
  handleAssignRider: (orderId: string, rider: Rider) => void;
  handleReassignRider: (orderId: string, newRider: Rider, reason: string) => void;
  handleSubstituteOrderItem: (orderId: string, itemIdx: number, newProduct: Product, newSupplierProduct: SupplierProduct, reason: string) => void;
  handleCaptureDeliveryException: (orderId: string, code: DeliveryExceptionCode, reason: string, rider: Rider) => void;
  handleInitiateRefund: (orderId: string, amountKES: number, reason: string) => Promise<boolean>;
  logEvent: (type: any, metadata?: Record<string, any>) => void;
}

const WaynoContext = createContext<WaynoContextType | undefined>(undefined);

export const WaynoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentShop, setCurrentShop] = useState<RetailerShop>(INITIAL_SHOPS[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Seeded active orders to showcase the full live network across Wholesalers, Riders, and Ops
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'WN-892410',
      retailerId: INITIAL_SHOPS[0].retailerId,
      shopName: INITIAL_SHOPS[0].name,
      shopAddress: INITIAL_SHOPS[0].address,
      retailerPhone: INITIAL_SHOPS[0].phone,
      items: [
        {
          productId: 'prod_njugu',
          productName: 'Njugu Karanga Fresh Roasted Peanuts (Carton of 24 Packets)',
          packSize: '50g x 24pk Carton',
          quantity: 2,
          unitPrice: 980,
          totalPrice: 1960,
          wholesalerLocationId: 'ws_eastleigh',
          wholesalerName: 'Eastleigh Mega Wholesale Depot',
        },
        {
          productId: 'prod_blueband',
          productName: 'Blue Band Original Spread Margarine 500g (Crate of 12 Tubs)',
          packSize: '500g x 12 Tubs Crate',
          quantity: 1,
          unitPrice: 2420,
          totalPrice: 2420,
          wholesalerLocationId: 'ws_eastleigh',
          wholesalerName: 'Eastleigh Mega Wholesale Depot',
        },
      ],
      subtotal: 4380,
      deliveryFee: 150,
      totalAmount: 4530,
      currency: 'KES',
      status: 'READY_FOR_PICKUP',
      stateHistory: [
        { state: 'CREATED', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Order created via duka search' },
        { state: 'PAID', timestamp: new Date(Date.now() - 3500000).toISOString(), note: 'M-Pesa STK push completed' },
        { state: 'SUPPLIER_CONFIRMED', timestamp: new Date(Date.now() - 2400000).toISOString(), note: 'Depot accepted order' },
        { state: 'READY_FOR_PICKUP', timestamp: new Date(Date.now() - 900000).toISOString(), note: 'Boxes packed and in dispatch bay' },
      ],
      paymentId: 'pay_init_01',
      paymentMethod: 'M-PESA',
      wholesalerLocationId: 'ws_eastleigh',
      wholesalerName: 'Eastleigh Mega Wholesale Depot',
      pickupOtp: '8492',
      deliveryOtp: '3157',
      estimatedDeliveryMins: 18,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 'WN-741920',
      retailerId: INITIAL_SHOPS[1].retailerId,
      shopName: INITIAL_SHOPS[1].name,
      shopAddress: INITIAL_SHOPS[1].address,
      retailerPhone: INITIAL_SHOPS[1].phone,
      items: [
        {
          productId: 'prod_jogoo',
          productName: 'Jogoo Maize Meal Flour 2kg (Bale of 12 Packets)',
          packSize: '2kg x 12 Pkts Bale',
          quantity: 3,
          unitPrice: 1680,
          totalPrice: 5040,
          wholesalerLocationId: 'ws_industrial',
          wholesalerName: 'Industrial Area Direct Supply Hub',
        },
        {
          productId: 'prod_freshfri',
          productName: 'Fresh Fri Pure Vegetable Cooking Oil 3L (Carton of 4 Cans)',
          packSize: '3L x 4 Jerrycans Carton',
          quantity: 1,
          unitPrice: 2920,
          totalPrice: 2920,
          wholesalerLocationId: 'ws_industrial',
          wholesalerName: 'Industrial Area Direct Supply Hub',
        },
      ],
      subtotal: 7960,
      deliveryFee: 150,
      totalAmount: 8110,
      currency: 'KES',
      status: 'PAID',
      stateHistory: [
        { state: 'CREATED', timestamp: new Date(Date.now() - 1800000).toISOString(), note: 'Bulk grocery replenishment requested' },
        { state: 'PAID', timestamp: new Date(Date.now() - 1700000).toISOString(), note: 'M-Pesa payment QG91827361KE confirmed' },
      ],
      paymentId: 'pay_init_02',
      paymentMethod: 'M-PESA',
      wholesalerLocationId: 'ws_industrial',
      wholesalerName: 'Industrial Area Direct Supply Hub',
      pickupOtp: '6214',
      deliveryOtp: '9841',
      estimatedDeliveryMins: 32,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1700000).toISOString(),
    },
  ]);

  // Telemetry event stream partitioned for S3/Parquet
  const [events, setEvents] = useState<TelemetryEvent[]>([
    generateEvent('USER_REGISTERED', 'ret_01', 'shop_01', { role: 'RETAILER', name: 'Sarah Wanjiku' }),
    generateEvent('SHOP_CREATED', 'ret_01', 'shop_01', { zone: 'zone_nairobi_east', coordinates: [-1.2585, 36.8834] }),
    generateEvent('SEARCH_PERFORMED', 'ret_01', 'shop_01', { query: 'njugu', latencyMs: 16, hits: 1 }),
    generateEvent('ORDER_CREATED', 'ret_01', 'shop_01', { orderId: 'WN-892410', total: 4530 }),
    generateEvent('PAYMENT_COMPLETED', 'ret_01', 'shop_01', { orderId: 'WN-892410', provider: 'M-Pesa' }),
  ]);

  // Authoritative Payment & Settlement Ledger Records
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([
    {
      id: 'pay_rec_01',
      orderId: 'WN-892410',
      provider: 'M-Pesa',
      providerReference: 'QG48291048KE',
      idempotencyKey: 'mpesa_idemp_WN-892410_171000',
      phoneNumber: '254712345678',
      amount: 4530,
      currency: 'KES',
      status: 'SUCCESS',
      reconciliationState: 'MATCHED',
      initiatedAt: new Date(Date.now() - 3550000).toISOString(),
      completedAt: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: 'pay_rec_02',
      orderId: 'WN-741920',
      provider: 'M-Pesa',
      providerReference: 'QG91827361KE',
      idempotencyKey: 'mpesa_idemp_WN-741920_172000',
      phoneNumber: '254722998877',
      amount: 8110,
      currency: 'KES',
      status: 'SUCCESS',
      reconciliationState: 'MATCHED',
      initiatedAt: new Date(Date.now() - 1750000).toISOString(),
      completedAt: new Date(Date.now() - 1700000).toISOString(),
    },
    {
      id: 'pay_rec_03',
      orderId: 'WN-382911',
      provider: 'M-Pesa',
      providerReference: 'QG77419024KE',
      idempotencyKey: 'mpesa_idemp_WN-382911_prev',
      phoneNumber: '254733112233',
      amount: 3200,
      currency: 'KES',
      status: 'SUCCESS',
      reconciliationState: 'DUPLICATE_CALLBACK_PREVENTED',
      initiatedAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 7180000).toISOString(),
    },
    {
      id: 'pay_rec_04',
      orderId: 'WN-119284',
      provider: 'M-Pesa',
      providerReference: 'QG10294857KE',
      idempotencyKey: 'mpesa_idemp_WN-119284_prev',
      phoneNumber: '254799001122',
      amount: 1450,
      currency: 'KES',
      status: 'REVERSED',
      reconciliationState: 'REFUNDED',
      initiatedAt: new Date(Date.now() - 14400000).toISOString(),
      completedAt: new Date(Date.now() - 14350000).toISOString(),
    }
  ]);

  const logEvent = (type: any, metadata: Record<string, any> = {}) => {
    const newEvt = generateEvent(type, currentShop.retailerId, currentShop.id, metadata);
    setEvents((prev) => [newEvt, ...prev]);
  };

  const addToCart = (
    product: Product, 
    supplierProduct: SupplierProduct, 
    campaignId?: string, 
    discountKES?: number
  ) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                campaignId: item.campaignId || campaignId,
                appliedDiscountKES: item.appliedDiscountKES || discountKES
              } 
            : item
        );
      }
      return [
        ...prev, 
        { 
          product, 
          supplierProduct, 
          quantity: 1, 
          campaignId, 
          appliedDiscountKES: discountKES 
        }
      ];
    });
    logEvent('PRODUCT_ADDED_TO_CART', {
      productId: product.id,
      productName: product.name,
      supplierPrice: supplierProduct.price,
      campaignId: campaignId || null,
      discountKES: discountKES || 0,
    });
    if (campaignId) {
      logEvent('PROMOTION_CLICK', {
        campaignId,
        productId: product.id,
        slot: 'SEARCH_OR_CATALOG',
      });
    }
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    logEvent('PRODUCT_REMOVED_FROM_CART', { productId });
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleOrderCreated = (newOrder: Order) => {
    // Closed-loop purchase attribution for promotional placements
    const conversionResult = recordOrderPromotionalConversions(
      cart.map((item) => ({
        productId: item.product.id,
        totalPrice: item.supplierProduct.price * item.quantity,
        campaignId: item.campaignId,
      }))
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    logEvent('ORDER_CREATED', { orderId: newOrder.id, gmv: newOrder.totalAmount });
    logEvent('PAYMENT_COMPLETED', { orderId: newOrder.id, provider: 'M-Pesa' });
    logEvent('SUPPLIER_ORDERED', { orderId: newOrder.id, wholesalerId: newOrder.wholesalerLocationId });

    if (conversionResult.attributedCampaigns.length > 0) {
      logEvent('PROMOTION_CONVERTED', {
        orderId: newOrder.id,
        campaignIds: conversionResult.attributedCampaigns,
        attributedGmvKES: conversionResult.totalAttributedGmvKES,
      });
    }
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderState, note: string, actor?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: nextStatus,
            stateHistory: [
              ...o.stateHistory,
              { 
                state: nextStatus, 
                timestamp: new Date().toISOString(), 
                note,
                actor: actor || 'SYSTEM' 
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    if (nextStatus === 'SUPPLIER_CONFIRMED' || nextStatus === 'ACCEPTED') logEvent('SUPPLIER_ACCEPTED', { orderId, note, actor });
    if (nextStatus === 'PICKED_UP') logEvent('ORDER_PICKED_UP', { orderId, note });
    if (nextStatus === 'DELIVERED') logEvent('ORDER_DELIVERED', { orderId, note });
    if (nextStatus === 'FAILED') logEvent('ORDER_DELIVERY_FAILED', { orderId, note });
  };

  const handleAssignRider = (orderId: string, rider: Rider) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            riderId: rider.id,
            riderName: rider.name,
            riderPhone: rider.phone,
            status: 'RIDER_ASSIGNED',
            stateHistory: [
              ...o.stateHistory,
              {
                state: 'RIDER_ASSIGNED',
                timestamp: new Date().toISOString(),
                note: `Assigned rider ${rider.name} (${rider.vehiclePlate})`,
                actor: 'RIDER_DISPATCH',
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    logEvent('RIDER_ASSIGNED', { orderId, riderId: rider.id, riderName: rider.name });
  };

  const handleReassignRider = (orderId: string, newRider: Rider, reason: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const prevRider = o.riderName || 'None';
          return {
            ...o,
            riderId: newRider.id,
            riderName: newRider.name,
            riderPhone: newRider.phone,
            status: 'RIDER_ASSIGNED',
            stateHistory: [
              ...o.stateHistory,
              {
                state: 'RIDER_ASSIGNED',
                timestamp: new Date().toISOString(),
                note: `Rider reassigned by Operations from [${prevRider}] to [${newRider.name} (${newRider.vehiclePlate})]. Reason: ${reason}`,
                actor: 'OPERATIONS_ADMIN',
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    logEvent('RIDER_REASSIGNED', { orderId, newRiderId: newRider.id, newRiderName: newRider.name, reason });
  };

  const handleSubstituteOrderItem = (
    orderId: string,
    itemIdx: number,
    newProduct: Product,
    newSupplierProduct: SupplierProduct,
    reason: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedItems = [...o.items];
          const targetItem = updatedItems[itemIdx];
          if (!targetItem) return o;

          const oldSubtotal = o.subtotal;
          const newUnitPrice = newSupplierProduct.price;
          const newTotalPrice = newUnitPrice * targetItem.quantity;
          
          updatedItems[itemIdx] = {
            ...targetItem,
            productId: newProduct.id,
            productName: newProduct.name,
            packSize: newProduct.packSize,
            unitPrice: newUnitPrice,
            totalPrice: newTotalPrice,
            wholesalerLocationId: newSupplierProduct.supplierId,
            isSubstituted: true,
            originalProductId: targetItem.productId,
            originalProductName: targetItem.productName,
            substitutionReason: reason,
          };

          const newSubtotal = updatedItems.reduce((acc, it) => acc + it.totalPrice, 0);
          const priceDiff = newSubtotal - oldSubtotal;
          const newTotalAmount = newSubtotal + o.deliveryFee;

          return {
            ...o,
            items: updatedItems,
            subtotal: newSubtotal,
            totalAmount: newTotalAmount,
            status: 'PARTIALLY_FULFILLED',
            stateHistory: [
              ...o.stateHistory,
              {
                state: 'PARTIALLY_FULFILLED',
                timestamp: new Date().toISOString(),
                note: `Wholesaler substitution: "${targetItem.productName}" replaced with "${newProduct.name}". Price delta: KES ${priceDiff}. Reason: ${reason}`,
                actor: 'WHOLESALER',
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    logEvent('ORDER_ITEM_SUBSTITUTED', { orderId, itemIdx, substituteProduct: newProduct.name, reason });
  };

  const handleCaptureDeliveryException = (
    orderId: string,
    code: DeliveryExceptionCode,
    reason: string,
    rider: Rider
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'FAILED',
            deliveryException: {
              code,
              reason,
              timestamp: new Date().toISOString(),
              reportedByRiderId: rider.id,
              reportedByRiderName: rider.name,
              resolved: false,
            },
            stateHistory: [
              ...o.stateHistory,
              {
                state: 'FAILED',
                timestamp: new Date().toISOString(),
                note: `Delivery Exception reported by rider ${rider.name}: [${code}] ${reason}`,
                actor: 'RIDER',
              },
            ],
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    logEvent('DELIVERY_EXCEPTION_RECORDED', { orderId, code, reason, riderId: rider.id });
  };

  const handleInitiateRefund = async (orderId: string, amountKES: number, reason: string): Promise<boolean> => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return false;

    // Transition to REFUND_PENDING
    handleUpdateOrderStatus(orderId, 'REFUND_PENDING', `Initiating M-Pesa B2C refund of KES ${amountKES}. Reason: ${reason}`, 'FINANCE_ENGINE');

    const result = await simulateMpesaReversal(targetOrder, amountKES, reason);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              status: 'REFUNDED',
              reconciliationStatus: 'REVERSED',
              refundRecord: {
                refundId: result.paymentRecord.id,
                amount: amountKES,
                reason,
                initiatedAt: result.paymentRecord.initiatedAt,
                completedAt: result.paymentRecord.completedAt,
                mpesaReversalRef: result.reversalRef,
                status: 'COMPLETED',
              },
              stateHistory: [
                ...o.stateHistory,
                {
                  state: 'REFUNDED',
                  timestamp: new Date().toISOString(),
                  note: `M-Pesa reversal completed under reference ${result.reversalRef}. Amount: KES ${amountKES}.`,
                  actor: 'M-PESA_B2C_GATEWAY',
                },
              ],
              updatedAt: new Date().toISOString(),
            };
          }
          return o;
        })
      );

      setPaymentRecords((prev) => [result.paymentRecord, ...prev]);
      logEvent('PAYMENT_REVERSED', { orderId, reversalRef: result.reversalRef, amountKES });
      return true;
    }
    return false;
  };

  const selectShop = (shopId: string) => {
    const found = INITIAL_SHOPS.find((s) => s.id === shopId);
    if (found) setCurrentShop(found);
  };

  const activeOrdersCount = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'REFUNDED').length;
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <WaynoContext.Provider
      value={{
        orders,
        events,
        cart,
        paymentRecords,
        currentShop,
        allShops: INITIAL_SHOPS,
        isCartOpen,
        trackingOrder,
        activeOrdersCount,
        cartCount,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        setIsCartOpen,
        setTrackingOrder,
        selectShop,
        handleOrderCreated,
        handleUpdateOrderStatus,
        handleAssignRider,
        handleReassignRider,
        handleSubstituteOrderItem,
        handleCaptureDeliveryException,
        handleInitiateRefund,
        logEvent,
      }}
    >
      {children}
    </WaynoContext.Provider>
  );
};

export const useWayno = () => {
  const context = useContext(WaynoContext);
  if (!context) {
    throw new Error('useWayno must be used within a WaynoProvider');
  }
  return context;
};
