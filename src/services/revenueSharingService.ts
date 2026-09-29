import { Order } from '../types/wayno';

// ============================================================================
// WAYNO SAFESETTLE: B2B TRIPARTITE REVENUE SHARING & ESCROW ARCHITECTURE
// ============================================================================

export interface RevenueSplitBreakdown {
  orderId: string;
  grossOrderTotalKES: number;        // Total paid by duka into WAYNO Escrow
  subtotalGoodsKES: number;          // Value of wholesale inventory
  deliveryFeeKES: number;            // Total delivery fee paid by retailer

  // 1. Wholesaler Share (Inventory Fulfillment)
  wholesalerId: string;
  wholesalerName: string;
  wholesalerGrossGoodsKES: number;   // Gross goods value (100%)
  wholesalerTakeRatePercent: number; // Platform commission (e.g., 2.0%)
  wholesalerCommissionKES: number;   // WAYNO take on goods
  wholesalerNetPayoutKES: number;    // 98.0% Net payout credited to wholesaler wallet

  // 2. Rider Share (Last-Mile Corridor Logistics)
  riderId?: string;
  riderName?: string;
  riderGrossDeliveryKES: number;     // Gross delivery fee paid
  riderPlatformCutPercent: number;   // Logistics platform share (e.g., 15.0%)
  riderPlatformCutKES: number;       // WAYNO dispatch routing fee
  riderNetEarningsKES: number;       // 85.0% Net earnings credited to rider wallet

  // 3. WAYNO Platform Treasury
  platformWholesaleTakeKES: number;  // From wholesale goods commission
  platformLogisticsTakeKES: number;  // From delivery fee
  platformTechFeeKES: number;        // Nominal gateway & clearing fee
  platformTotalRevenueKES: number;   // Total platform gross margin

  // 4. Escrow Lifecycle
  escrowStatus: 'LOCKED_IN_ESCROW' | 'SETTLED_TO_WALLETS' | 'REFUNDED' | 'DISPUTE_HELD';
  escrowReleaseTrigger: 'DELIVERY_OTP_CONFIRMED' | 'INSTANT_PAYMENT' | 'ADMIN_OVERRIDE';
  settledAt?: string;
}

export interface WholesalerWallet {
  wholesalerId: string;
  wholesalerName: string;
  availableBalanceKES: number;       // Ready for withdrawal / auto-sweep
  escrowLockedBalanceKES: number;    // In-transit orders awaiting delivery OTP
  totalLifetimeEarnedKES: number;
  totalWithdrawnKES: number;
  payoutMethod: 'BANK_PESALINK' | 'MPESA_PAYBILL_B2B';
  bankName?: string;
  accountNumber?: string;
  paybillNumber?: string;
  autoSweepSchedule: 'DAILY_1700_EOD' | 'INSTANT_ON_DELIVERY' | 'MANUAL_ON_DEMAND';
  lastSweepAt?: string;
}

export interface RiderWallet {
  riderId: string;
  riderName: string;
  riderPhone: string;
  availableBalanceKES: number;       // Ready for instant M-Pesa cashout
  escrowLockedBalanceKES: number;    // In-transit deliveries
  totalLifetimeEarnedKES: number;
  totalWithdrawnKES: number;
  completedRunsCount: number;
  autoCashoutThresholdKES?: number;  // Optional threshold trigger
  lastCashoutAt?: string;
}

export interface SettlementPayoutRecord {
  id: string;
  recipientType: 'WHOLESALER' | 'RIDER';
  recipientId: string;
  recipientName: string;
  amountKES: number;
  channel: 'MPESA_B2C' | 'BANK_PESALINK' | 'MPESA_PAYBILL_B2B';
  destinationRef: string; // Phone number or Bank Account
  referenceNumber: string; // e.g. QK89201948KE or PESALINK-091823
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  initiatedAt: string;
  completedAt: string;
  feeKES: number;
  note: string;
}

// ----------------------------------------------------------------------------
// REVENUE SPLIT CALCULATOR
// ----------------------------------------------------------------------------

export function calculateOrderRevenueSplit(order: Order): RevenueSplitBreakdown {
  const grossOrderTotalKES = order.totalAmount || (order.subtotal + order.deliveryFee);
  const subtotalGoodsKES = order.subtotal;
  const deliveryFeeKES = order.deliveryFee || 150;

  // Wholesaler: 2.0% platform commission on wholesale volume (98.0% net payout)
  const wholesalerTakeRatePercent = 2.0;
  const wholesalerCommissionKES = Math.round(subtotalGoodsKES * (wholesalerTakeRatePercent / 100));
  const wholesalerNetPayoutKES = subtotalGoodsKES - wholesalerCommissionKES;

  // Rider: 85% of delivery fare goes to rider, 15% to platform dispatch maintenance
  const riderPlatformCutPercent = 15.0;
  const riderPlatformCutKES = Math.round(deliveryFeeKES * (riderPlatformCutPercent / 100));
  const riderNetEarningsKES = deliveryFeeKES - riderPlatformCutKES;

  // Platform: Wholesale take + Logistics cut + nominal KES 35 clearing fee
  const platformTechFeeKES = 35;
  const platformTotalRevenueKES = wholesalerCommissionKES + riderPlatformCutKES + platformTechFeeKES;

  const isDelivered = order.status === 'DELIVERED';
  const isRefunded = order.status === 'REFUNDED' || order.status === 'CANCELLED';

  let escrowStatus: RevenueSplitBreakdown['escrowStatus'] = 'LOCKED_IN_ESCROW';
  if (isDelivered) escrowStatus = 'SETTLED_TO_WALLETS';
  if (isRefunded) escrowStatus = 'REFUNDED';

  return {
    orderId: order.id,
    grossOrderTotalKES,
    subtotalGoodsKES,
    deliveryFeeKES,

    wholesalerId: order.wholesalerLocationId || 'ws_eastleigh',
    wholesalerName: order.wholesalerName || 'Eastleigh Mega Wholesale Depot',
    wholesalerGrossGoodsKES: subtotalGoodsKES,
    wholesalerTakeRatePercent,
    wholesalerCommissionKES,
    wholesalerNetPayoutKES,

    riderId: order.riderId,
    riderName: order.riderName,
    riderGrossDeliveryKES: deliveryFeeKES,
    riderPlatformCutPercent,
    riderPlatformCutKES,
    riderNetEarningsKES,

    platformWholesaleTakeKES: wholesalerCommissionKES,
    platformLogisticsTakeKES: riderPlatformCutKES,
    platformTechFeeKES,
    platformTotalRevenueKES,

    escrowStatus,
    escrowReleaseTrigger: isDelivered ? 'DELIVERY_OTP_CONFIRMED' : 'INSTANT_PAYMENT',
    settledAt: isDelivered ? order.updatedAt : undefined,
  };
}

// ----------------------------------------------------------------------------
// INITIAL SEEDED WALLETS
// ----------------------------------------------------------------------------

export const INITIAL_WHOLESALER_WALLETS: Record<string, WholesalerWallet> = {
  ws_eastleigh: {
    wholesalerId: 'ws_eastleigh',
    wholesalerName: 'Eastleigh Mega Wholesale Depot',
    availableBalanceKES: 142850,
    escrowLockedBalanceKES: 16800,
    totalLifetimeEarnedKES: 1845000,
    totalWithdrawnKES: 1702150,
    payoutMethod: 'BANK_PESALINK',
    bankName: 'Equity Bank Kenya',
    accountNumber: '0810293849102',
    autoSweepSchedule: 'DAILY_1700_EOD',
    lastSweepAt: 'Yesterday at 17:00 EAT',
  },
  ws_industrial: {
    wholesalerId: 'ws_industrial',
    wholesalerName: 'Industrial Area Direct Supply Hub',
    availableBalanceKES: 98400,
    escrowLockedBalanceKES: 12500,
    totalLifetimeEarnedKES: 1250000,
    totalWithdrawnKES: 1151600,
    payoutMethod: 'MPESA_PAYBILL_B2B',
    paybillNumber: '880120 (Acc: IND-SUPPLY)',
    autoSweepSchedule: 'DAILY_1700_EOD',
    lastSweepAt: 'Yesterday at 17:00 EAT',
  },
  ws_westlands: {
    wholesalerId: 'ws_westlands',
    wholesalerName: 'Westlands Central Distribution Depot',
    availableBalanceKES: 64200,
    escrowLockedBalanceKES: 0,
    totalLifetimeEarnedKES: 780000,
    totalWithdrawnKES: 715800,
    payoutMethod: 'BANK_PESALINK',
    bankName: 'KCB Bank Kenya',
    accountNumber: '1120491823901',
    autoSweepSchedule: 'DAILY_1700_EOD',
    lastSweepAt: 'Yesterday at 17:00 EAT',
  },
};

export const INITIAL_RIDER_WALLETS: Record<string, RiderWallet> = {
  rider_01: {
    riderId: 'rider_01',
    riderName: 'Kipchoge Maina',
    riderPhone: '+254 712 345 678',
    availableBalanceKES: 2450,
    escrowLockedBalanceKES: 255,
    totalLifetimeEarnedKES: 68400,
    totalWithdrawnKES: 65950,
    completedRunsCount: 348,
    lastCashoutAt: 'Today at 08:30 EAT',
  },
  rider_02: {
    riderId: 'rider_02',
    riderName: 'David Ochieng',
    riderPhone: '+254 723 456 789',
    availableBalanceKES: 1890,
    escrowLockedBalanceKES: 0,
    totalLifetimeEarnedKES: 45200,
    totalWithdrawnKES: 43310,
    completedRunsCount: 215,
    lastCashoutAt: 'Yesterday at 19:15 EAT',
  },
  rider_03: {
    riderId: 'rider_03',
    riderName: 'Hassan Noor',
    riderPhone: '+254 734 567 890',
    availableBalanceKES: 3120,
    escrowLockedBalanceKES: 0,
    totalLifetimeEarnedKES: 89400,
    totalWithdrawnKES: 86280,
    completedRunsCount: 420,
    lastCashoutAt: 'Today at 07:45 EAT',
  },
};

export const INITIAL_SETTLEMENT_HISTORY: SettlementPayoutRecord[] = [
  {
    id: 'PAYOUT-9021',
    recipientType: 'WHOLESALER',
    recipientId: 'ws_eastleigh',
    recipientName: 'Eastleigh Mega Wholesale Depot',
    amountKES: 185400,
    channel: 'BANK_PESALINK',
    destinationRef: 'Equity Bank (Acc: ...9102)',
    referenceNumber: 'PESALINK-9918230',
    status: 'COMPLETED',
    initiatedAt: '2026-09-28T17:00:00Z',
    completedAt: '2026-09-28T17:01:14Z',
    feeKES: 0,
    note: 'Automated 17:00 EOD settlement sweep for 14 delivered orders',
  },
  {
    id: 'PAYOUT-9022',
    recipientType: 'RIDER',
    recipientId: 'rider_01',
    recipientName: 'Kipchoge Maina',
    amountKES: 1200,
    channel: 'MPESA_B2C',
    destinationRef: '+254 712 345 678',
    referenceNumber: 'QG88129034KE',
    status: 'COMPLETED',
    initiatedAt: '2026-09-29T08:30:00Z',
    completedAt: '2026-09-29T08:30:04Z',
    feeKES: 0,
    note: 'Instant Daraja B2C cashout to M-Pesa line',
  },
  {
    id: 'PAYOUT-9023',
    recipientType: 'WHOLESALER',
    recipientId: 'ws_industrial',
    recipientName: 'Industrial Area Direct Supply Hub',
    amountKES: 112000,
    channel: 'MPESA_PAYBILL_B2B',
    destinationRef: 'Paybill 880120 (Acc: IND-SUPPLY)',
    referenceNumber: 'QG77482910KE',
    status: 'COMPLETED',
    initiatedAt: '2026-09-28T17:00:00Z',
    completedAt: '2026-09-28T17:00:45Z',
    feeKES: 0,
    note: 'Automated 17:00 EOD B2B Paybill sweep for 8 delivered orders',
  },
];
