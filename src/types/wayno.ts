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

export interface Retailer {
  id: string; // retailer_id
  name: string; // Legal merchant name
  shopOwner: string;
  phone: string;
  serviceZoneId: string;
  operatingStatus: 'OPEN' | 'CLOSED';
  creditLimit?: number;
  createdAt: string;
}

// Section 12: SHOP (A retailer account should be associated with a physical shop. PostGIS stores geographical position.)
export interface Shop {
  id: string;
  retailer_id?: string; // Canonical schema attribute
  retailerId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  service_zone_id?: string; // Canonical schema attribute
  serviceZoneId: string;
  operating_status?: 'OPEN' | 'CLOSED'; // Canonical schema attribute
  operatingStatus: 'OPEN' | 'CLOSED';
  created_at?: string; // Canonical schema attribute
  createdAt?: string;
  shopOwner?: string;
  phone?: string;
}

export type RetailerShop = Shop;

export interface Wholesaler {
  id: string; // wholesaler_id (e.g. 'wholesaler_01')
  name: string; // Legal company name (e.g. 'Somlink FMCG Distributorship Ltd')
  businessRegNo?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

// Section 14: WHOLESALER LOCATION (1:N under Wholesaler - allows WAYNO to work geographically)
export interface WholesalerLocation {
  id: string;
  wholesaler_id?: string; // Canonical schema attribute
  wholesalerId: string;
  name: string;
  businessName?: string;
  address: string;
  latitude: number;
  longitude: number;
  service_zone_id?: string; // Canonical schema attribute
  serviceZoneId: string;
  operating_hours?: string; // Canonical schema attribute
  operatingHours: string;
  status: 'ACTIVE' | 'INACTIVE';
  reliabilityScore: number; // 0 - 100
  avgPrepTimeMinutes: number;
}

export interface Product {
  id: string; // product_id (e.g. 'prod_njugu')
  product_id?: string; // canonical schema attribute
  name: string;
  brand: string;
  manufacturer: string;
  description: string;
  packSize: string; // pack_size (e.g. '50g x 24pk Carton')
  pack_size?: string; // canonical schema attribute
  unit: string;
  internalCategory: string; // category_internal (e.g. 'Snacks & Confectionery')
  category_internal?: string; // canonical schema attribute
  keywords: string[];
  synonyms: string[];
  aliases: string[];
  barcode: string;
  image: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'ARCHIVED';
  recommendedRetailPrice: number; // KES
  basePrice?: number;
  wholesalePrice?: number; // Admin recommended wholesale price (Section 13)
  minimumOrderQuantity?: number; // Admin minimum order quantity (Section 13)
  unitWeightKg?: number; // Weight in KG per wholesale unit (e.g. 24kg for bale of flour)
  unitVolumeCbm?: number; // Volume in cubic meters per wholesale unit (e.g. 0.04 cbm)
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
  supplierId?: string;
  safetyStockBuffer?: number; // Safety buffer to shield against digital vs walk-in counter stockouts
  reservedQty?: number; // Quantity held under virtual reservation
  reservedUntil?: string; // Expiration ISO string for virtual reservation
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
  // V1 Master Spec 16-State Finite State Machine
  | 'CART'
  | 'CHECKOUT_PENDING'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'SUPPLIER_PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  // Intermediary / UI Aliases for backward compatibility
  | 'CREATED'
  | 'FULFILLMENT_PENDING'
  | 'SUPPLIER_CONFIRMED'
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
  isSubstituted?: boolean;
  originalProductId?: string;
  originalProductName?: string;
  substitutionReason?: string;
}

export type DeliveryExceptionCode =
  | 'SHOP_CLOSED'
  | 'RECIPIENT_UNREACHABLE'
  | 'DAMAGED_GOODS_REFUSED'
  | 'PAYMENT_DISPUTE'
  | 'WRONG_LOCATION';

export interface DeliveryException {
  code: DeliveryExceptionCode;
  reason: string;
  timestamp: string;
  reportedByRiderId: string;
  reportedByRiderName: string;
  reportedByName?: string;
  resolved?: boolean;
  resolutionNote?: string;
}

export interface RefundRecord {
  refundId: string;
  amount: number;
  reason: string;
  initiatedAt: string;
  completedAt?: string;
  mpesaReversalRef?: string;
  reversalTransactionId?: string;
  authorizedBy?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface Order {
  id: string;
  retailerId: string;
  shopName: string;
  shopAddress: string;
  retailerPhone: string;
  shopOwnerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  status: OrderState;
  stateHistory: { state: OrderState; timestamp: string; note: string; actor?: string }[];
  paymentId?: string;
  paymentMethod: 'M-PESA' | 'CREDIT_LINE' | 'CASH_ON_DELIVERY';
  wholesalerLocationId: string;
  wholesalerName: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  pickupOtp: string;
  deliveryOtp: string;
  offlineDeliveryCode?: string; // USSD / SMS fallback code if retailer phone battery dies
  estimatedDeliveryMins: number;
  totalWeightKg?: number; // Total weight of ordered cargo
  totalVolumeCbm?: number; // Total volume in cubic meters
  assignedVehicleType?: 'BODA_BODA' | 'TUK_TUK' | 'PICKUP_VAN';
  dispatchSplitsCount?: number; // Number of delivery runs required if cargo exceeds vehicle limit
  stockReservedUntil?: string; // 15-minute virtual reservation expiration
  deliveryException?: DeliveryException;
  reconciliationStatus?: 'SETTLED' | 'PENDING' | 'DISCREPANCY' | 'REVERSED';
  refundRecord?: RefundRecord;
  createdAt: string;
  updatedAt: string;
}

/**
 * SECTION 26: PAYMENT LEDGER (TRANSACTION RECORDS)
 * Do not rely simply on order.payment_status = PAID.
 * We need transaction records: payments and ideally payment_transactions.
 * Track:
 * - payment_id (parent payment entity ID)
 * - order_id (linked order)
 * - provider (e.g. M-Pesa)
 * - provider_reference (Daraja receipt number or reversal reference)
 * - amount (monetary figure in KES)
 * - currency ('KES')
 * - status ('INITIATED' | 'SUCCESS' | 'FAILED' | 'REVERSED')
 * - initiated_at (timestamp)
 * - completed_at (timestamp when webhook callback received)
 * - failure_reason (e.g. user cancelled, insufficient funds, timeout)
 * This allows true reconciliation.
 */
export interface PaymentTransaction {
  id: string; // transaction_id (e.g. txn_01)
  paymentId: string; // payment_id foreign key
  orderId: string; // order_id foreign key
  provider: 'M-Pesa' | 'Airtel Money' | 'Bank Transfer' | 'Cash on Delivery' | string;
  providerReference: string; // provider_reference (e.g. QG48291048KE or reversal ref)
  amount: number; // amount in KES
  currency: string; // currency (e.g. 'KES')
  status: 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  initiatedAt: string; // initiated_at ISO timestamp
  completedAt?: string; // completed_at ISO timestamp
  failureReason?: string; // failure_reason
  idempotencyKey?: string;
  phoneNumber?: string;
  reconciliationState?: 'MATCHED' | 'UNMATCHED_AMOUNT' | 'DUPLICATE_CALLBACK_PREVENTED' | 'REFUNDED' | 'PENDING_RECONCILIATION';
}

/**
 * SECTION 26: PAYMENT ENTITY
 * Parent ledger record representing the payment commitment for an order.
 */
export interface Payment {
  id: string; // payment_id
  orderId: string; // order_id
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'FAILED' | 'REFUNDED';
  provider: 'M-Pesa' | 'Airtel Money' | 'Bank Transfer' | 'Cash on Delivery' | string;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  latestTransactionId?: string;
  reconciliationStatus: 'RECONCILED' | 'PENDING_AUDIT' | 'DISCREPANCY';
}

export type PaymentRecord = PaymentTransaction;

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'Boda Boda (Motorbike)' | 'Tuk-Tuk Cargo' | 'Electric Cargo';
  vehiclePlate: string;
  plateNumber?: string;
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
  | 'SUPPLIER_INVENTORY_UPDATED'
  | 'ORDER_ITEM_SUBSTITUTED'
  | 'RIDER_ASSIGNED'
  | 'RIDER_REASSIGNED'
  | 'ORDER_PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'DELIVERY_EXCEPTION_RECORDED'
  | 'REFUND_PROCESSED'
  | 'CREDIT_REPAYMENT_RECORDED'
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

// ============================================================================
// HIERARCHICAL GEOGRAPHIC SUPPLY NETWORK & 20 KM NODE ARCHITECTURE
// ============================================================================

export type SupplyNodeLevel = 'ROOT' | 'REGION' | 'LOCAL_NODE';

export interface SupplyNode {
  id: string; // e.g. 'node_eastleigh_20km', 'region_nairobi_metro', 'root_kenya'
  parentZoneId: string | null; // Creates explicit tree topology
  name: string;
  code: string;
  level: SupplyNodeLevel;
  centerPoint: { lat: number; lng: number };
  radiusKm: number; // 20 km standard for local supply node
  wholesalerId: string | null; // Primary anchor supplier for this node
  wholesalerName: string | null;
  shopsCount: number;
  status: 'ACTIVE' | 'CONGESTED' | 'MAINTENANCE';
  inventoryCoveragePct: number;
}

export interface HierarchicalEscalationStep {
  stepNumber: number;
  nodeId: string;
  nodeName: string;
  level: SupplyNodeLevel;
  wholesalerName: string;
  wholesalerId: string;
  isAvailable: boolean;
  stockQuantity: number;
  wholesalePriceKES: number;
  sourceType: 'LOCAL_NODE' | 'PARENT_HIERARCHY' | 'GRANDPARENT_ROOT' | 'CROSS_NODE_ESCAPE';
  distanceKm: number;
  travelTimeMinutes: number;
  reason: string;
}

export interface HierarchicalProcurementResolution {
  requestId: string;
  shopId: string;
  shopName: string;
  shopCoordinates: { lat: number; lng: number };
  assignedLocalNode: SupplyNode;
  productName: string;
  requestedQty: number;
  traversalSteps: HierarchicalEscalationStep[];
  resolvedStep: HierarchicalEscalationStep | null;
  fulfillmentStatus: 'FULFILLED_LOCAL' | 'FULFILLED_PARENT' | 'FULFILLED_CROSS_NODE' | 'STOCKOUT_ESCALATED_ROOT';
  totalCostKES: number;
  leadTimeMinutes: number;
  transportSurchargeKES: number;
  procurementIntelligenceNote: string;
}

export interface VehicleRoutingStop {
  id: string;
  shopName: string;
  latitude: number;
  longitude: number;
  cargoWeightKg: number;
  priority: 'HIGH' | 'NORMAL';
  timeWindow: string;
}

export interface VehicleRoutingComparison {
  depotName: string;
  stopsCount: number;
  naiveSequence: string[];
  naiveDistanceKm: number;
  naiveDurationMinutes: number;
  optimizedSequence: string[];
  optimizedDistanceKm: number;
  optimizedDurationMinutes: number;
  fuelSavingsPct: number;
  timeSavedMinutes: number;
  carbonReductionKg: number;
}

export interface RiderMandateEvaluation {
  roadDistanceKm: number;
  straightLineDistanceKm: number;
  normalMandateRadiusKm: number; // 20 km
  isWithinMandate: boolean;
  exceptionType: 'IN_MANDATE' | 'ROUTE_EXTENSION' | 'BOUNDARY_HANDOFF' | 'DEDICATED_CARRIER';
  extraKm: number;
  baseDeliveryFeeKES: number;
  extensionFeeKES: number;
  totalDeliveryFeeKES: number;
  slaMinutes: string;
  handoffExchangeHub?: { name: string; latitude: number; longitude: number };
  recommendedVehicle: 'Boda Boda (Single)' | 'Boda Relay (2 Riders)' | 'Cargo Tuk-Tuk' | '1-Tonne Pickup Van';
  operationalProcedure: string;
}
