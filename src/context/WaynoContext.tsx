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
  PaymentTransaction,
  Payment,
  DeliveryExceptionCode,
  DeliveryException
} from '../types/wayno';
import { INITIAL_SHOPS, INITIAL_RIDERS, PRODUCTS, SUPPLIER_PRODUCTS } from '../data/mockData';
import { generateEvent } from '../services/orderEngine';
import { paymentService } from '../services/paymentService';
import { recordOrderPromotionalConversions } from '../services/searchEngine';

interface WaynoContextType {
  orders: Order[];
  events: TelemetryEvent[];
  cart: CartItem[];
  payments: Payment[];
  paymentTransactions: PaymentTransaction[];
  paymentRecords: PaymentRecord[]; // Backwards-compatible alias
  currentShop: RetailerShop;
  allShops: RetailerShop[];
  isCartOpen: boolean;
  trackingOrder: Order | null;
  activeOrdersCount: number;
  cartCount: number;

  // Section 13: Product Management & Wholesaler Adoption
  products: Product[];
  supplierProducts: SupplierProduct[];
  categories: string[];
  handleCreateProduct: (productData: Omit<Product, 'id'>) => Product;
  handleUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  handleToggleProductStatus: (productId: string) => void;
  handleAddCategory: (newCategory: string) => void;
  handleAdoptProductForWholesaler: (
    wholesalerLocationId: string,
    wholesalerName: string,
    productId: string,
    customPrice: number,
    stockQty: number
  ) => void;
  handleUpdateWholesalerProductPriceAndStock: (
    supplierProductId: string,
    newPrice: number,
    newStock: number,
    availability?: boolean
  ) => void;
  handleRemoveWholesalerProduct: (supplierProductId: string) => void;

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

  // Section 13: Product Management state
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>(SUPPLIER_PRODUCTS);
  const [categories, setCategories] = useState<string[]>(() => 
    Array.from(new Set(PRODUCTS.map(p => p.category_internal || p.internalCategory))).filter(Boolean)
  );

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

  // Section 26: Authoritative Parent Payments Ledger
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: 'pay_892410',
      orderId: 'WN-892410',
      amount: 4530,
      currency: 'KES',
      status: 'PAID',
      provider: 'M-Pesa',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3500000).toISOString(),
      transactionCount: 1,
      latestTransactionId: 'txn_rec_01',
      reconciliationStatus: 'RECONCILED',
    },
    {
      id: 'pay_741920',
      orderId: 'WN-741920',
      amount: 8110,
      currency: 'KES',
      status: 'PAID',
      provider: 'M-Pesa',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      updatedAt: new Date(Date.now() - 1700000).toISOString(),
      transactionCount: 1,
      latestTransactionId: 'txn_rec_02',
      reconciliationStatus: 'RECONCILED',
    },
    {
      id: 'pay_382911',
      orderId: 'WN-382911',
      amount: 3200,
      currency: 'KES',
      status: 'PAID',
      provider: 'M-Pesa',
      createdAt: new Date(Date.now() - 7260000).toISOString(),
      updatedAt: new Date(Date.now() - 7180000).toISOString(),
      transactionCount: 2, // 1st failed attempt, 2nd successful retry!
      latestTransactionId: 'txn_rec_03b',
      reconciliationStatus: 'RECONCILED',
    },
    {
      id: 'pay_119284',
      orderId: 'WN-119284',
      amount: 1450,
      currency: 'KES',
      status: 'REFUNDED',
      provider: 'M-Pesa',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      updatedAt: new Date(Date.now() - 13780000).toISOString(),
      transactionCount: 2, // 1st capture, 2nd reversal
      latestTransactionId: 'txn_rec_04_rev',
      reconciliationStatus: 'RECONCILED',
    },
    {
      id: 'pay_502914',
      orderId: 'WN-502914',
      amount: 2100,
      currency: 'KES',
      status: 'PENDING',
      provider: 'M-Pesa',
      createdAt: new Date(Date.now() - 420000).toISOString(),
      updatedAt: new Date(Date.now() - 420000).toISOString(),
      transactionCount: 1,
      latestTransactionId: 'txn_rec_05_init',
      reconciliationStatus: 'PENDING_AUDIT',
    }
  ]);

  // Section 26: Granular Transaction Records (payment_transactions)
  // Track: payment_id, order_id, provider, provider_reference, amount, currency, status, initiated_at, completed_at, failure_reason
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([
    {
      id: 'txn_rec_01',
      paymentId: 'pay_892410',
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
      id: 'txn_rec_02',
      paymentId: 'pay_741920',
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
      id: 'txn_rec_03a',
      paymentId: 'pay_382911',
      orderId: 'WN-382911',
      provider: 'M-Pesa',
      providerReference: 'ERR_USER_1032',
      idempotencyKey: 'mpesa_idemp_WN-382911_attempt_1',
      phoneNumber: '254733112233',
      amount: 3200,
      currency: 'KES',
      status: 'FAILED',
      failureReason: 'User cancelled STK push prompt on SIM toolkit (M-Pesa error code 1032)',
      reconciliationState: 'PENDING_RECONCILIATION',
      initiatedAt: new Date(Date.now() - 7260000).toISOString(),
      completedAt: new Date(Date.now() - 7240000).toISOString(),
    },
    {
      id: 'txn_rec_03b',
      paymentId: 'pay_382911',
      orderId: 'WN-382911',
      provider: 'M-Pesa',
      providerReference: 'QG77419024KE',
      idempotencyKey: 'mpesa_idemp_WN-382911_attempt_2',
      phoneNumber: '254733112233',
      amount: 3200,
      currency: 'KES',
      status: 'SUCCESS',
      reconciliationState: 'MATCHED',
      initiatedAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 7180000).toISOString(),
    },
    {
      id: 'txn_rec_04_pay',
      paymentId: 'pay_119284',
      orderId: 'WN-119284',
      provider: 'M-Pesa',
      providerReference: 'QG10294857KE',
      idempotencyKey: 'mpesa_idemp_WN-119284_prev',
      phoneNumber: '254799001122',
      amount: 1450,
      currency: 'KES',
      status: 'SUCCESS',
      reconciliationState: 'MATCHED',
      initiatedAt: new Date(Date.now() - 14400000).toISOString(),
      completedAt: new Date(Date.now() - 14350000).toISOString(),
    },
    {
      id: 'txn_rec_04_rev',
      paymentId: 'pay_119284',
      orderId: 'WN-119284',
      provider: 'M-Pesa',
      providerReference: 'REV_99281044KE',
      idempotencyKey: 'mpesa_rev_idemp_WN-119284',
      phoneNumber: '254799001122',
      amount: 1450,
      currency: 'KES',
      status: 'REVERSED',
      failureReason: 'Stockout at depot; customer requested instant B2C reversal',
      reconciliationState: 'REFUNDED',
      initiatedAt: new Date(Date.now() - 13800000).toISOString(),
      completedAt: new Date(Date.now() - 13780000).toISOString(),
    },
    {
      id: 'txn_rec_05_init',
      paymentId: 'pay_502914',
      orderId: 'WN-502914',
      provider: 'M-Pesa',
      providerReference: 'STK_AWAITING_CALLBACK',
      idempotencyKey: 'mpesa_idemp_WN-502914_init',
      phoneNumber: '254701234567',
      amount: 2100,
      currency: 'KES',
      status: 'INITIATED',
      reconciliationState: 'PENDING_RECONCILIATION',
      initiatedAt: new Date(Date.now() - 420000).toISOString(),
    }
  ]);

  // Backward-compatible alias referencing paymentTransactions
  const paymentRecords = paymentTransactions;

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

    // Section 26: Create parent payment and ledger transaction record
    const paymentId = newOrder.paymentId || `pay_${newOrder.id.replace('WN-', '')}`;
    const newTxnId = `txn_${Date.now()}`;
    const newPayment: Payment = {
      id: paymentId,
      orderId: newOrder.id,
      amount: newOrder.totalAmount,
      currency: newOrder.currency || 'KES',
      status: 'PAID',
      provider: 'M-Pesa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      transactionCount: 1,
      latestTransactionId: newTxnId,
      reconciliationStatus: 'RECONCILED',
    };
    const newTxn: PaymentTransaction = {
      id: newTxnId,
      paymentId: paymentId,
      orderId: newOrder.id,
      provider: 'M-Pesa',
      providerReference: `QG${Math.floor(10000000 + Math.random() * 90000000)}KE`,
      idempotencyKey: `mpesa_idemp_${newOrder.id}_${Date.now()}`,
      phoneNumber: newOrder.retailerPhone,
      amount: newOrder.totalAmount,
      currency: newOrder.currency || 'KES',
      status: 'SUCCESS',
      reconciliationState: 'MATCHED',
      initiatedAt: new Date(Date.now() - 1500).toISOString(),
      completedAt: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);
    setPaymentTransactions((prev) => [newTxn, ...prev]);

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
    handleUpdateOrderStatus(orderId, 'REFUND_PENDING', `Initiating refund of KES ${amountKES} via PaymentService. Reason: ${reason}`, 'FINANCE_ENGINE');

    // Section 25: Application calls PaymentService abstraction directly
    const result = await paymentService.refundPayment({
      order: targetOrder,
      refundAmount: amountKES,
      reason,
      provider: targetOrder.paymentMethod || 'M-Pesa',
    });

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
                  note: `${result.provider} reversal completed under reference ${result.reversalRef}. Amount: KES ${amountKES}.`,
                  actor: 'PAYMENT_SERVICE_GATEWAY',
                },
              ],
              updatedAt: new Date().toISOString(),
            };
          }
          return o;
        })
      );

      setPaymentTransactions((prev) => [result.paymentRecord, ...prev]);
      setPayments((prev) => prev.map((p) => p.orderId === orderId ? {
        ...p,
        status: 'REFUNDED',
        transactionCount: p.transactionCount + 1,
        latestTransactionId: result.paymentRecord.id,
        reconciliationStatus: 'RECONCILED',
        updatedAt: new Date().toISOString()
      } : p));

      logEvent('PAYMENT_REVERSED', { orderId, reversalRef: result.reversalRef, amountKES });
      return true;
    }
    return false;
  };

  const selectShop = (shopId: string) => {
    const found = INITIAL_SHOPS.find((s) => s.id === shopId);
    if (found) setCurrentShop(found);
  };

  // Section 13: Product Management handlers (Admin)
  const handleCreateProduct = (productData: Omit<Product, 'id'>): Product => {
    const newId = `prod_${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      product_id: newId,
      status: productData.status || 'ACTIVE',
    };
    setProducts((prev) => [newProduct, ...prev]);

    const cat = productData.category_internal || productData.internalCategory;
    if (cat && !categories.includes(cat)) {
      setCategories((prev) => [...prev, cat]);
    }

    logEvent('PRODUCT_CREATED', {
      productId: newId,
      name: newProduct.name,
      brand: newProduct.brand,
      category: cat,
      rrp: newProduct.recommendedRetailPrice,
      wholesalePrice: newProduct.wholesalePrice,
    });
    return newProduct;
  };

  const handleUpdateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = { ...p, ...updates };
          const cat = updated.category_internal || updated.internalCategory;
          if (cat && !categories.includes(cat)) {
            setCategories((c) => [...c, cat]);
          }
          return updated;
        }
        return p;
      })
    );

    logEvent('PRODUCT_UPDATED', { productId, updates });
  };

  const handleToggleProductStatus = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          logEvent('PRODUCT_STATUS_TOGGLED', {
            productId,
            oldStatus: p.status,
            newStatus: nextStatus,
          });
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      logEvent('CATEGORY_ADDED', { category: trimmed });
    }
  };

  // Wholesaler Adoption & Alteration handlers
  const handleAdoptProductForWholesaler = (
    wholesalerLocationId: string,
    wholesalerName: string,
    productId: string,
    customPrice: number,
    stockQty: number
  ) => {
    // ENFORCE: Product has to be originally made available by the admin
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      throw new Error('Product not found in platform master catalog');
    }
    if (targetProduct.status !== 'ACTIVE') {
      throw new Error('Cannot adopt product: Product is currently disabled/inactive on the platform');
    }

    const existingIdx = supplierProducts.findIndex(
      (sp) => sp.wholesalerLocationId === wholesalerLocationId && sp.productId === productId
    );

    if (existingIdx >= 0) {
      setSupplierProducts((prev) =>
        prev.map((sp, idx) =>
          idx === existingIdx
            ? {
                ...sp,
                price: customPrice,
                stockQty,
                availability: stockQty > 0,
                updatedAt: new Date().toISOString(),
              }
            : sp
        )
      );
    } else {
      const newSp: SupplierProduct = {
        id: `sp_${wholesalerLocationId}_${productId}_${Date.now()}`,
        productId,
        wholesalerLocationId,
        wholesalerName,
        price: customPrice,
        availability: stockQty > 0,
        stockQty,
        distanceKm: 2.8,
        updatedAt: new Date().toISOString(),
      };
      setSupplierProducts((prev) => [newSp, ...prev]);
    }

    logEvent('WHOLESALER_ADOPTED_PRODUCT', {
      wholesalerLocationId,
      wholesalerName,
      productId,
      customPrice,
      stockQty,
    });
  };

  const handleUpdateWholesalerProductPriceAndStock = (
    supplierProductId: string,
    newPrice: number,
    newStock: number,
    availability?: boolean
  ) => {
    setSupplierProducts((prev) =>
      prev.map((sp) =>
        sp.id === supplierProductId
          ? {
              ...sp,
              price: newPrice,
              stockQty: newStock,
              availability: availability !== undefined ? availability : newStock > 0,
              updatedAt: new Date().toISOString(),
            }
          : sp
      )
    );

    logEvent('WHOLESALER_PRICE_STOCK_ALTERED', {
      supplierProductId,
      newPrice,
      newStock,
      availability,
    });
  };

  const handleRemoveWholesalerProduct = (supplierProductId: string) => {
    setSupplierProducts((prev) => prev.filter((sp) => sp.id !== supplierProductId));
    logEvent('WHOLESALER_PRODUCT_REMOVED', { supplierProductId });
  };

  const activeOrdersCount = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'REFUNDED').length;
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <WaynoContext.Provider
      value={{
        orders,
        events,
        cart,
        payments,
        paymentTransactions,
        paymentRecords: paymentTransactions,
        currentShop,
        allShops: INITIAL_SHOPS,
        isCartOpen,
        trackingOrder,
        activeOrdersCount,
        cartCount,

        // Section 13: Product Management & Wholesaler Adoption
        products,
        supplierProducts,
        categories,
        handleCreateProduct,
        handleUpdateProduct,
        handleToggleProductStatus,
        handleAddCategory,
        handleAdoptProductForWholesaler,
        handleUpdateWholesalerProductPriceAndStock,
        handleRemoveWholesalerProduct,

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
