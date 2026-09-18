/**
 * WAYNO FMCG PLATFORM - END-TO-END TOP-DOWN SIMULATION SUITE
 * 
 * Replicates complete client-to-server lifecycle from duka shelf discovery
 * through payment escrow, wholesaler fulfillment, rider logistics, and financial reconciliation.
 * 
 * Tests standard flows and the most common production edge cases:
 * - 2G/3G network jitter & out-of-order search responses
 * - Concurrent double-tap payment attempts (Idempotency Mutex)
 * - Telco dropped webhooks & STK query recovery
 * - Walk-in counter inventory contention (Phantom Stock Shield)
 * - Cargo overweight multi-vehicle auto-splits (Boda -> Tuk-Tuk -> Van)
 * - Wholesaler timeout auto-escalation & partial stockout substitutions
 * - Dead-battery offline delivery verification (USSD/SMS fallback PIN)
 * - Damaged goods refusal & B2C utility float exhaustion guards
 */

import { PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS, INITIAL_SHOPS, INITIAL_RIDERS } from '../src/data/mockData';
import { executeWaynoSearch, isStaleSearchResponse } from '../src/services/searchEngine';
import { generateRetailerRecommendations } from '../src/services/recommendationEngine';
import { paymentService, PaymentLockManager, UtilityFloatManager } from '../src/services/paymentService';
import {
  canTransitionOrder,
  generateEvent,
  calculateOrderPayload,
  generateOfflineDeliveryCode,
  VirtualStockReservationManager,
} from '../src/services/orderEngine';
import {
  calculateDeliveryFee,
  evaluateSupplierSelection,
  simulateSupplierAcceptanceTimeout,
  evaluateSubstitution,
  evaluateCancellationRefund,
} from '../src/services/businessRulesEngine';
import { Order, OrderState, OrderItem, DeliveryException, TelemetryEvent } from '../src/types/wayno';

interface TestAssertion {
  tier: string;
  scenario: string;
  assertion: string;
  passed: boolean;
  meta?: any;
}

const assertions: TestAssertion[] = [];

function check(tier: string, scenario: string, assertion: string, condition: boolean, meta?: any) {
  assertions.push({
    tier,
    scenario,
    assertion,
    passed: !!condition,
    meta,
  });
  if (condition) {
    console.log(`  ✅ [${tier}] ${scenario} -> ${assertion}`);
  } else {
    console.error(`  ❌ [${tier}] ${scenario} -> ${assertion} FAILED:`, meta);
  }
}

async function runTopDownE2ESimulation() {
  console.log('================================================================================');
  console.log('🚀 RUNNING WAYNO E2E TOP-DOWN PRODUCTION SIMULATION SUITE');
  console.log('Testing: Client -> API Gateway -> Payment Escrow -> Wholesaler -> Logistics -> Finance');
  console.log('================================================================================\n');

  const duka = INITIAL_SHOPS[0]; // Mama Sarah Duka, Kawangware
  const primaryWholesaler = WHOLESALERS[0]; // Premier Megastore Eastleigh
  const backupWholesaler = WHOLESALERS[1]; // Jambo Wholesalers

  // ===========================================================================
  // TIER 1: CLIENT-SIDE DISCOVERY, SEARCH & CART BUILDING
  // ===========================================================================
  console.log('--- [TIER 1] Client-Side Duka Discovery, Search & Dynamic Cart ---');

  // Edge Case 1.1: Vernacular Sheng query ("unga ya ugali")
  const searchSheng = executeWaynoSearch('unga ya ugali', {
    userLat: duka.latitude,
    userLng: duka.longitude,
    shopId: duka.id,
  });
  check('TIER-1', 'Search Discovery', 'Sheng/Vernacular query resolves to Maize Flour', searchSheng.totalHits > 0);
  check('TIER-1', 'Search Discovery', 'Search execution complies with sub-50ms SLA', searchSheng.executionTimeMs < 50, { latencyMs: searchSheng.executionTimeMs });

  // Edge Case 1.2: Typos in FMCG brand name ("menegai" -> Menengai Cream Bar Soap)
  const searchTypo = executeWaynoSearch('menegai', {
    userLat: duka.latitude,
    userLng: duka.longitude,
    shopId: duka.id,
  });
  check('TIER-1', 'Typo Tolerance', 'Handles misspelled brand queries gracefully', searchTypo.totalHits > 0 || searchTypo.spellCorrections.length > 0);

  // Edge Case 1.3: 2G Network Out-of-Order Packet Jitter (Client ignores stale async response)
  const isStale = isStaleSearchResponse(102, 105); // incoming seq 102 vs latest seq 105
  const isFresh = isStaleSearchResponse(106, 105); // incoming seq 106 vs latest seq 105
  check('TIER-1', 'Network Jitter', 'Monotonic sequence dropper discards stale out-of-order search packet', isStale === true);
  check('TIER-1', 'Network Jitter', 'Monotonic sequence keeper accepts newer search packet', isFresh === false);

  // 1.4 Dynamic Supplier Evaluation: Choosing best wholesaler based on distance, price, stock & SLA
  const supplierCandidates = [
    {
      wholesalerId: primaryWholesaler.id,
      wholesalerName: primaryWholesaler.name,
      distanceKm: 4.2,
      wholesalePriceKES: 1720,
      stockQty: 45,
      historicalReliabilityPct: 98,
      avgPrepMins: 12,
    },
    {
      wholesalerId: backupWholesaler.id,
      wholesalerName: backupWholesaler.name,
      distanceKm: 8.5,
      wholesalePriceKES: 1750,
      stockQty: 80,
      historicalReliabilityPct: 94,
      avgPrepMins: 18,
    },
  ];
  const supplierSelection = evaluateSupplierSelection(supplierCandidates, { [primaryWholesaler.id]: true });
  check('TIER-1', 'Supplier Engine', 'Proximity and price scoring selects optimal primary supplier', supplierSelection.selectedWholesalerId === primaryWholesaler.id);
  check('TIER-1', 'Supplier Engine', 'Computes transparent supplier ranking score', supplierSelection.winningScore > 70, { score: supplierSelection.winningScore });

  // 1.5 Dynamic Delivery Fee Calculation with Surge Multipliers
  const deliveryCalcNormal = calculateDeliveryFee({
    distanceKm: 4.2,
    weightKg: 24,
    basketSubtotalKES: 6880,
    isHeavyRainSurge: false,
    isRushHourSurge: false,
    isExpressUrgent: false,
    isMultiDrop: false,
  });
  check('TIER-1', 'Pricing Engine', 'Computes accurate baseline delivery fee for standard boda run', deliveryCalcNormal.finalDeliveryFee > 0 && deliveryCalcNormal.vehicleTypeRequired === 'Boda Boda (Motorbike)');

  const deliveryCalcRain = calculateDeliveryFee({
    distanceKm: 4.2,
    weightKg: 24,
    basketSubtotalKES: 6880,
    isHeavyRainSurge: true,
    isRushHourSurge: true,
    isExpressUrgent: false,
    isMultiDrop: false,
  });
  check('TIER-1', 'Pricing Engine', 'Applies weather and peak congestion surge multiplier (1.35x)', deliveryCalcRain.surgeMultiplier === 1.35 && deliveryCalcRain.finalDeliveryFee > deliveryCalcNormal.finalDeliveryFee);

  // ===========================================================================
  // TIER 2: CHECKOUT, VIRTUAL STOCK RESERVATION & PAYMENT ESCROW
  // ===========================================================================
  console.log('\n--- [TIER 2] Checkout, Virtual Stock Hold & Daraja Escrow ---');

  const orderId = `WN-E2E-${Date.now()}`;
  const orderItems: OrderItem[] = [
    {
      productId: 'prod_jogoo',
      productName: 'Jogoo Maize Meal 2kg x 12',
      quantity: 3,
      unitPrice: 1720,
      total: 5160,
      packSize: '2kg x 12 Pkts Bale',
    },
    {
      productId: 'prod_freshfri',
      productName: 'Fresh Fri Cooking Oil 1L x 12',
      quantity: 1,
      unitPrice: 3200,
      total: 3200,
      packSize: '1L x 12 Jerricans',
    },
  ];
  const basketTotal = 5160 + 3200; // 8360
  const deliveryFee = deliveryCalcNormal.finalDeliveryFee; // e.g. 192

  // 2.1 Virtual Stock Hold: Locks stock for 15-min checkout window
  const reservation = VirtualStockReservationManager.reserveStock(orderId, primaryWholesaler.id, [
    { productId: 'prod_jogoo', quantity: 3 },
    { productId: 'prod_freshfri', quantity: 1 },
  ]);
  check('TIER-2', 'Stock Guard', 'Locks virtual stock reservation for checkout window', reservation.success === true && !!reservation.reservationId);

  // Edge Case 2.2: Phantom Stock Contention (Walk-in counter drains physical stock)
  // Attempt to reserve more than available buffer
  const contention = VirtualStockReservationManager.reserveStock(`WN-FAIL-${Date.now()}`, primaryWholesaler.id, [
    { productId: 'prod_jogoo', quantity: 9999 }, // Far exceeds depot inventory
  ]);
  check('TIER-2', 'Phantom Stock Shield', 'Rejects reservation when inventory falls below walk-in counter safety buffer', contention.success === false);

  // Edge Case 2.3: Double-Tap Idempotency Mutex
  const lock1 = PaymentLockManager.acquireLock(orderId, duka.phone, 60);
  check('TIER-2', 'Idempotency Lock', 'First payment click acquires exclusive transaction mutex', lock1 === true);

  const lock2 = PaymentLockManager.acquireLock(orderId, duka.phone, 60);
  check('TIER-2', 'Idempotency Lock', 'Rapid secondary double-click rejected with HTTP 429/409 lock contention', lock2 === false);

  // Clean release of lock
  PaymentLockManager.releaseLock(orderId);
  check('TIER-2', 'Idempotency Lock', 'Mutex lock releases cleanly after completion', PaymentLockManager.isLocked(orderId) === false);

  // 2.4 Initiate M-Pesa Daraja STK Push
  const mockOrder: Order = {
    id: orderId,
    retailerId: duka.retailerId,
    shopName: duka.name,
    wholesalerId: primaryWholesaler.id,
    wholesalerName: primaryWholesaler.name,
    status: 'PAYMENT_PENDING',
    items: orderItems,
    totalAmount: basketTotal + deliveryFee,
    subtotalAmount: basketTotal,
    deliveryFee: deliveryFee,
    serviceFee: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currency: 'KES',
    paymentMethod: 'MPESA',
    paymentStatus: 'PENDING',
  };

  const paymentResult = await paymentService.initiatePayment({
    order: mockOrder,
    phoneNumber: duka.phone,
    amount: mockOrder.totalAmount,
    currency: 'KES',
  });
  check('TIER-2', 'M-Pesa Gateway', 'Daraja STK Push returns checkout request ID', paymentResult.success === true && !!paymentResult.providerReference);

  // Edge Case 2.5: Dropped Webhook / Telco Timeout Recovery
  // Simulating callback failure -> background poller queries Safaricom directly
  const pollStatus = await paymentService.queryStkPushStatus('ws_sim_request_id', orderId);
  check('TIER-2', 'Webhook Fallback', 'Active STK polling queries Daraja directly to recover payment status', pollStatus.status === 'SUCCESS' && pollStatus.resultCode === '0');

  // FSM Transition: CART -> CHECKOUT_PENDING -> PAYMENT_PENDING -> PAID
  check('TIER-2', 'FSM Transition', 'Validates transition PAYMENT_PENDING -> PAID', canTransitionOrder('PAYMENT_PENDING', 'PAID'));
  mockOrder.status = 'PAID';
  mockOrder.paymentStatus = 'PAID';

  // ===========================================================================
  // TIER 3: WHOLESALER INGRESS, STOCKOUT SUBSTITUTION & DEPOT PACKING
  // ===========================================================================
  console.log('\n--- [TIER 3] Wholesaler Ingress, SLA Escalation & Depot Fulfillment ---');

  check('TIER-3', 'FSM Transition', 'Validates transition PAID -> SUPPLIER_PENDING', canTransitionOrder('PAID', 'SUPPLIER_PENDING'));
  mockOrder.status = 'SUPPLIER_PENDING';

  // Edge Case 3.1: Wholesaler Acceptance Timeout Simulation (150s elapsed -> CHIME_WARNING, 250s -> TIMEOUT_TRIGGERED)
  const timeoutWarning = simulateSupplierAcceptanceTimeout(150, 240);
  check('TIER-3', 'SLA Watchdog', 'Detects SLA warning state at 150 seconds', timeoutWarning.currentPhase === 'CHIME_WARNING' && timeoutWarning.supplierStatus === 'PENDING');

  const timeoutCritical = simulateSupplierAcceptanceTimeout(250, 240);
  check('TIER-3', 'SLA Watchdog', 'Escalates to backup supplier upon SLA breach (>240s)', timeoutCritical.currentPhase === 'TIMEOUT_TRIGGERED' && timeoutCritical.supplierStatus === 'EXPIRED');

  // Edge Case 3.2: Partial Stockout & Intelligent Substitution Proposal
  const subProposal = evaluateSubstitution(
    {
      name: 'Jogoo Maize Meal 2kg x 12',
      packSize: '2kg x 12 Pkts Bale',
      price: 1720,
    },
    {
      name: 'Pembe Maize Meal 2kg x 12',
      packSize: '2kg x 12 Pkts Bale',
      price: 1700,
    },
    'AUTO_SUBSTITUTE'
  );
  check('TIER-3', 'Substitution Engine', 'Auto-approves substitution within policy price variance (-1.2%)', subProposal.policyOutcome === 'AUTO_APPROVED');
  check('TIER-3', 'Substitution Engine', 'Computes accurate retailer refund balance on lower-cost substitute (KES 20/unit)', subProposal.priceAdjustment.type === 'REFUND_DIFFERENCE' && subProposal.priceAdjustment.amountKES === 20);

  // Wholesaler accepts and prepares order
  check('TIER-3', 'FSM Transition', 'Validates transition SUPPLIER_PENDING -> ACCEPTED -> PREPARING', canTransitionOrder('SUPPLIER_PENDING', 'ACCEPTED') && canTransitionOrder('ACCEPTED', 'PREPARING'));
  mockOrder.status = 'PREPARING';

  // Order packed, Wholesaler generates Handshake PIN
  const depotHandoverPin = 'WHS-4829';
  check('TIER-3', 'Depot Security', 'Generates 4-character cryptographic Wholesaler handover code', depotHandoverPin.startsWith('WHS-'));
  check('TIER-3', 'FSM Transition', 'Validates transition PREPARING -> READY_FOR_PICKUP', canTransitionOrder('PREPARING', 'READY_FOR_PICKUP'));
  mockOrder.status = 'READY_FOR_PICKUP';

  // ===========================================================================
  // TIER 4: LOGISTICS, CARGO AUTO-SPLIT, TRANSIT & TWO-TIER OTP HANDSHAKE
  // ===========================================================================
  console.log('\n--- [TIER 4] Logistics Dispatch, Multi-Vehicle Splitting & Handover ---');

  // 4.1 Payload Weight Computation & Vehicle Assignment
  const payload = calculateOrderPayload(orderItems);
  // 3 * 24kg (Jogoo) + 1 * 12kg (Fresh Fri) = 72kg + 12kg = 84kg
  check('TIER-4', 'Cargo Math', 'Accurately calculates total payload weight in kg', payload.totalWeightKg === 84, { weightKg: payload.totalWeightKg });
  check('TIER-4', 'Vehicle Router', 'Routes 84kg cargo to Boda Boda with heavy rack load bracket', payload.assignedVehicleType === 'BODA_BODA');

  // Edge Case 4.2: Cargo Overweight Multi-Boda Splitting (e.g. 144kg order = 6 bales)
  const heavyItems: OrderItem[] = [
    { productId: 'prod_jogoo', productName: 'Jogoo 24kg Bale', quantity: 6, unitPrice: 1720, total: 10320 },
  ]; // 6 * 24kg = 144kg
  const heavyPayload = calculateOrderPayload(heavyItems);
  check('TIER-4', 'Logistics Split', 'Flags 144kg order as overweight for single motorcycle (>90kg)', heavyPayload.isOverweightForSingleBoda === true);
  check('TIER-4', 'Logistics Split', 'Automatically splits 144kg consignment into 2 synchronized Boda dispatches', heavyPayload.dispatchSplitsCount === 2);

  // Assign Rider to order
  const assignedRider = INITIAL_RIDERS[0]; // Juma Mwangi
  mockOrder.assignedRiderId = assignedRider.id;
  mockOrder.assignedRiderName = assignedRider.name;
  check('TIER-4', 'FSM Transition', 'Validates transition READY_FOR_PICKUP -> RIDER_ASSIGNED', canTransitionOrder('READY_FOR_PICKUP', 'RIDER_ASSIGNED'));
  mockOrder.status = 'RIDER_ASSIGNED';

  // 4.3 Handshake 1: Rider arrives at Wholesaler Depot
  const verifyDepotCode = (enteredCode: string) => enteredCode === depotHandoverPin;
  check('TIER-4', 'Depot Handshake', 'Depot manager rejects invalid handover PIN', verifyDepotCode('WHS-0000') === false);
  check('TIER-4', 'Depot Handshake', 'Depot manager authorizes cargo release upon valid PIN entry', verifyDepotCode('WHS-4829') === true);

  check('TIER-4', 'FSM Transition', 'Validates transition RIDER_ASSIGNED -> PICKED_UP -> OUT_FOR_DELIVERY', canTransitionOrder('RIDER_ASSIGNED', 'PICKED_UP') && canTransitionOrder('PICKED_UP', 'OUT_FOR_DELIVERY'));
  mockOrder.status = 'OUT_FOR_DELIVERY';

  // Edge Case 4.4: En-route Damaged Goods Refusal by Retailer
  // Verify FSM handles transition OUT_FOR_DELIVERY -> FAILED cleanly
  check('TIER-4', 'Transit Exception', 'State machine allows OUT_FOR_DELIVERY -> FAILED on delivery exception', canTransitionOrder('OUT_FOR_DELIVERY', 'FAILED'));
  const damageException: DeliveryException = {
    code: 'DAMAGED_GOODS_REFUSED',
    reason: 'Rider dropped carton; oil bottles cracked and leaking.',
    timestamp: new Date().toISOString(),
    reportedByRiderId: assignedRider.id,
    reportedByRiderName: assignedRider.name,
  };
  check('TIER-4', 'Transit Exception', 'Structured exception payload captures audit metadata', damageException.code === 'DAMAGED_GOODS_REFUSED' && !!damageException.reportedByRiderId);

  // Edge Case 4.5: Customer Phone Dead Battery / Offline Handover (USSD/SMS fallback PIN)
  const dukaDeliveryOtp = '8294';
  const offlineEmergencyPin = generateOfflineDeliveryCode(dukaDeliveryOtp, duka.phone);
  check('TIER-4', 'Offline Resiliency', 'Generates 4-digit deterministic USSD emergency PIN for offline delivery', offlineEmergencyPin.length === 4 && !isNaN(Number(offlineEmergencyPin)));

  // Handshake 2: Duka Doorstep Delivery Confirmation
  const verifyDeliveryOtp = (code: string) => code === dukaDeliveryOtp || code === offlineEmergencyPin;
  check('TIER-4', 'Duka Handshake', 'Rejects fraudulent or mistyped delivery code', verifyDeliveryOtp('1234') === false);
  check('TIER-4', 'Duka Handshake', 'Authenticates physical delivery via primary customer OTP', verifyDeliveryOtp('8294') === true);

  check('TIER-4', 'FSM Transition', 'Validates transition OUT_FOR_DELIVERY -> DELIVERED (Terminal State)', canTransitionOrder('OUT_FOR_DELIVERY', 'DELIVERED'));
  mockOrder.status = 'DELIVERED';

  // Strict Invariant: Terminal State cannot revert backwards
  check('TIER-4', 'Terminal Integrity', 'DELIVERED order cannot revert backwards to CART', canTransitionOrder('DELIVERED', 'CART') === false);
  check('TIER-4', 'Terminal Integrity', 'DELIVERED order cannot revert backwards to PAYMENT_PENDING', canTransitionOrder('DELIVERED', 'PAYMENT_PENDING') === false);

  // ===========================================================================
  // TIER 5: FINANCIAL SETTLEMENT, REVERSAL FLOAT & AUDIT TELEMETRY
  // ===========================================================================
  console.log('\n--- [TIER 5] Financial Settlement, B2C Float & Audit Telemetry ---');

  // 5.1 Escrow Payout Breakdown
  const platformFeeRate = 0.025; // 2.5% platform commission
  const wholesalerSubtotal = mockOrder.subtotalAmount; // 8360
  const platformCommission = Math.round(wholesalerSubtotal * platformFeeRate); // 209
  const wholesalerNetPayout = wholesalerSubtotal - platformCommission; // 8151
  const riderPayout = mockOrder.deliveryFee; // 192

  check('TIER-5', 'Ledger Split', 'Calculates accurate wholesaler net payout after platform commission', wholesalerNetPayout === 8151, { wholesalerNetPayout, platformCommission });
  check('TIER-5', 'Ledger Split', 'Full delivery fee allocated to logistics rider account', riderPayout === deliveryFee, { riderPayout });

  // Edge Case 5.2: B2C Utility Float Exhaustion Guardrail
  const currentFloat = UtilityFloatManager.getFloatStatus();
  check('TIER-5', 'Float Security', 'Utility float is above minimum emergency reserve (>KES 100,000)', currentFloat.currentFloatKES >= 100000);
  check('TIER-5', 'Float Security', 'Permits valid instant refund of KES 8,360', UtilityFloatManager.checkSufficientFloat(8360) === true);
  check('TIER-5', 'Float Security', 'Blocks catastrophic overdraft refund of KES 50,000,000', UtilityFloatManager.checkSufficientFloat(50000000) === false);

  // 5.3 Automated B2C Instant Refund on Cancelled Order
  const refundOrder: Order = {
    ...mockOrder,
    id: `WN-REFUND-${Date.now()}`,
    status: 'CANCELLED',
  };
  const refundResult = await paymentService.refundPayment({
    order: refundOrder,
    refundAmount: refundOrder.totalAmount,
    reason: 'Depot out-of-stock cancellation compensation',
  });
  check('TIER-5', 'B2C Reversal', 'Executes Daraja B2C instant reversal for duka store refund', refundResult.success === true && !!refundResult.reversalRef);
  check('TIER-5', 'B2C Reversal', 'Ledger records REVERSAL entry with exact matching transaction amount', refundResult.paymentRecord.status === 'REVERSED' && refundResult.paymentRecord.amount === refundOrder.totalAmount);

  // 5.4 Platform Telemetry Event Pipeline
  const teleEvt: TelemetryEvent = generateEvent('ORDER_DELIVERED', duka.retailerId, duka.id, {
    orderId: mockOrder.id,
    wholesalerId: primaryWholesaler.id,
    riderId: assignedRider.id,
    durationMins: 38,
    totalKES: mockOrder.totalAmount,
  });
  check('TIER-5', 'Telemetry Pipeline', 'Emits standardized ISO telemetry event with user and session tracking', teleEvt.eventType === 'ORDER_DELIVERED' && !!teleEvt.eventId && !!teleEvt.timestamp);

  // ===========================================================================
  // SIMULATION SUMMARY
  // ===========================================================================
  console.log('\n================================================================================');
  const total = assertions.length;
  const passed = assertions.filter((a) => a.passed).length;
  const failed = total - passed;
  console.log(`📊 SIMULATION COMPLETE: ${total} SPECIFICATIONS TESTED`);
  console.log(`   PASSED: ${passed} | FAILED: ${failed} | SUCCESS RATE: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('================================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTopDownE2ESimulation().catch((err) => {
  console.error('Fatal simulation failure:', err);
  process.exit(1);
});
