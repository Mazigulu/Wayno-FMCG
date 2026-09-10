export type UserRole = 'RETAILER' | 'WHOLESALER' | 'RIDER' | 'ADMIN' | 'OPERATIONS';

export interface User {
  id: string;
  phone: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  createdAt: string;
}

export interface RetailerShop {
  id: string;
  retailerId: string;
  name: string;
  shopOwner: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceZoneId: string;
  operatingStatus: 'OPEN' | 'CLOSED';
}

export interface WholesalerLocation {
  id: string;
  wholesalerId: string;
  name: string;
  businessName: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceZoneId: string;
  operatingHours: string;
  status: 'ACTIVE' | 'INACTIVE';
  reliabilityScore: number; // 0 - 100
  avgPrepTimeMinutes: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  manufacturer: string;
  description: string;
  packSize: string;
  unit: string;
  internalCategory: string;
  keywords: string[];
  synonyms: string[];
  aliases: string[];
  barcode: string;
  image: string;
  recommendedRetailPrice: number; // KES
}

export interface SupplierProduct {
  id: string;
  productId: string;
  wholesalerLocationId: string;
  wholesalerName: string;
  price: number; // KES wholesale
  availability: boolean;
  stockQty: number;
  distanceKm: number;
  updatedAt: string;
}

export interface SearchResultItem {
  product: Product;
  bestSupplierProduct: SupplierProduct;
  allSuppliers: SupplierProduct[];
  matchedAliases: string[];
  relevanceScore: number;
  deliveryEstimatedMins: number;
}

export interface CartItem {
  product: Product;
  supplierProduct: SupplierProduct;
  quantity: number;
  campaignId?: string;
  appliedDiscountKES?: number;
}

export type OrderState =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'FULFILLMENT_PENDING'
  | 'SUPPLIER_CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PARTIALLY_FULFILLED';

export interface OrderItem {
  productId: string;
  productName: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  wholesalerLocationId: string;
  wholesalerName: string;
}

export interface Order {
  id: string;
  retailerId: string;
  shopName: string;
  shopAddress: string;
  retailerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  status: OrderState;
  stateHistory: { state: OrderState; timestamp: string; note: string }[];
  paymentId?: string;
  paymentMethod: 'M-PESA' | 'CREDIT_LINE' | 'CASH_ON_DELIVERY';
  wholesalerLocationId: string;
  wholesalerName: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  pickupOtp: string;
  deliveryOtp: string;
  estimatedDeliveryMins: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: 'M-Pesa';
  providerReference: string;
  idempotencyKey: string;
  phoneNumber: string;
  amount: number;
  currency: string;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED';
  initiatedAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'Boda Boda (Motorbike)' | 'Tuk-Tuk Cargo' | 'Electric Cargo';
  vehiclePlate: string;
  rating: number;
  status: 'AVAILABLE' | 'EN_ROUTE_PICKUP' | 'EN_ROUTE_DELIVERY' | 'OFFLINE';
  currentLat: number;
  currentLng: number;
  assignedOrderId?: string;
  completedTrips: number;
}

export type EventType =
  | 'USER_REGISTERED'
  | 'SHOP_CREATED'
  | 'SEARCH_PERFORMED'
  | 'SEARCH_RESULT_CLICKED'
  | 'PRODUCT_VIEWED'
  | 'PRODUCT_ADDED_TO_CART'
  | 'PRODUCT_REMOVED_FROM_CART'
  | 'CHECKOUT_STARTED'
  | 'ORDER_CREATED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'SUPPLIER_ORDERED'
  | 'SUPPLIER_ACCEPTED'
  | 'RIDER_ASSIGNED'
  | 'ORDER_PICKED_UP'
  | 'ORDER_DELIVERED'
  | 'PROMOTION_IMPRESSION'
  | 'PROMOTION_CLICK'
  | 'PROMOTION_CONVERTED';

export interface TelemetryEvent {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  userId: string;
  shopId: string;
  sessionId: string;
  deviceId: string;
  location: { lat: number; lng: number };
  metadata: Record<string, any>;
}

export interface SprintInfo {
  sprint: number;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED';
  deliverables: string[];
  focus: string;
}
