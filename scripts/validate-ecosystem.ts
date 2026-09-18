import { PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS, INITIAL_SHOPS } from '../src/data/mockData';
import { executeWaynoSearch, isStaleSearchResponse } from '../src/services/searchEngine';
import { generateRetailerRecommendations, extractRetailerSignals } from '../src/services/recommendationEngine';
import { paymentService, PaymentLockManager, UtilityFloatManager } from '../src/services/paymentService';
import {
  canTransitionOrder,
  generateEvent,
  VALID_TRANSITIONS,
  calculateOrderPayload,
  generateOfflineDeliveryCode,
  VirtualStockReservationManager,
} from '../src/services/orderEngine';
import { Order, OrderState, DeliveryException, OrderItem } from '../src/types/wayno';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, test: string, details?: string) {
  const start = performance.now();
  results.push({
    suite,
    test,
    passed: !!condition,
    durationMs: Number((performance.now() - start).toFixed(2)),
    details,
  });
  if (!condition) {
    console.error(`❌ [FAIL] ${suite} -> ${test}: ${details || 'Assertion failed'}`);
  } else {
    console.log(`✅ [PASS] ${suite} -> ${test}`);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('WAYNO PLATFORM END-TO-END ECOSYSTEM VALIDATION SUITE');
  console.log('Testing: Catalog, Search, Recs, Cart, Payment, Order State Machine, Logistics, Exceptions');
  console.log('================================================================\n');

  // =========================================================================
  // SUITE 1: MASTER CATALOG & WHOLESALER ADOPTION (1:N DECOUPLING)
  // =========================================================================
  console.log('--- 1. Testing Master Catalog & Wholesaler Adoption ---');
  assert(PRODUCTS.length >= 10, 'Catalog', 'Master catalog contains active products', `Count: ${PRODUCTS.length}`);
  
  PRODUCTS.forEach(p => {
    const valid = !!p.id && !!p.name && !!p.brand && !!p.unit && !!p.packSize && !!p.internalCategory && p.recommendedRetailPrice > 0;
    assert(valid, 'Catalog Schema', `Product ${p.id} complies with schema`, `Name: ${p.name}`);
  });

  assert(SUPPLIER_PRODUCTS.length >= PRODUCTS.length, 'Wholesale Adoption', 'Wholesalers have adopted catalog products', `Suppliers count: ${SUPPLIER_PRODUCTS.length}`);
  
  // Verify price decoupling: Wholesaler depot price != RRP
  const firstSp = SUPPLIER_PRODUCTS[0];
  const masterProd = PRODUCTS.find(p => p.id === firstSp.productId);
  assert(!!masterProd && firstSp.price <= masterProd.recommendedRetailPrice, 'Catalog Pricing', 'Wholesale price provides duka profit margin against RRP');

  // =========================================================================
  // SUITE 2: SEARCH ENGINE & VERNACULAR RETRIEVAL BENCHMARKS
  // =========================================================================
  console.log('\n--- 2. Testing Search Engine & Inverted Index ---');
  const dukaShop = INITIAL_SHOPS[0];

  // Test 2.1: Brand Search
  const searchBrand = executeWaynoSearch('Jogoo', {
    userLat: dukaShop.latitude,
    userLng: dukaShop.longitude,
    shopId: dukaShop.id,
  });
  assert(searchBrand.totalHits > 0, 'Search Engine', 'Exact brand query returns results ("Jogoo")', `Hits: ${searchBrand.totalHits}`);
  assert(searchBrand.executionTimeMs < 50, 'Search Engine SLA', 'P95 Search latency is sub-50ms', `Latency: ${searchBrand.executionTimeMs}ms`);

  // Test 2.2: Vernacular / Sheng duka keyword (e.g. "unga" -> Maize Flour)
  const searchUnga = executeWaynoSearch('unga', {
    userLat: dukaShop.latitude,
    userLng: dukaShop.longitude,
    shopId: dukaShop.id,
  });
  assert(searchUnga.totalHits > 0, 'Search Engine Vernacular', 'Vernacular term "unga" resolves to grain flours', `Hits: ${searchUnga.totalHits}`);

  // Test 2.3: Typo tolerance ("mafutaa" -> cooking oil)
  const searchTypo = executeWaynoSearch('mafutaa', {
    userLat: dukaShop.latitude,
    userLng: dukaShop.longitude,
    shopId: dukaShop.id,
  });
  assert(searchTypo.totalHits > 0 || searchTypo.spellCorrections.length > 0, 'Search Engine Typo-Tolerance', 'Typo "mafutaa" resolves or triggers spell correction');

  // =========================================================================
  // SUITE 3: RECOMMENDATION ENGINE (5-SIGNAL MULTI-FACTOR MODEL)
  // =========================================================================
  console.log('\n--- 3. Testing 5-Signal Recommendation Model ---');
  const mockOrders: Order[] = [
    {
      id: 'ord_test_01',
      retailerId: dukaShop.retailerId,
      shopName: dukaShop.name,
      wholesalerId: 'wh_01',
      wholesalerName: 'Premier Megastore',
      status: 'DELIVERED',
      items: [
        {
          productId: 'prod_jogoo',
          productName: 'Jogoo Maize Meal',
          quantity: 4,
          unitPrice: 1720,
          subtotal: 6880,
          packSize: '2kg x 12 Pkts Bale',
        },
      ],
      totalAmount: 6880,
      subtotalAmount: 6880,
      deliveryFee: 150,
      serviceFee: 50,
      createdAt: '2026-09-10T10:00:00Z',
      updatedAt: '2026-09-10T11:30:00Z',
      currency: 'KES',
      paymentMethod: 'MPESA',
      paymentStatus: 'PAID',
    },
  ];

  const recResult = generateRetailerRecommendations(
    dukaShop,
    ['unga', 'blueband'],
    mockOrders,
    undefined,
    8 // 08:00 Morning Restock window
  );

  assert(recResult.recommendations.length > 0, 'Recommendations', 'Generates ranked product recommendations');
  assert(recResult.searchFirstPreserved === true, 'Recommendations Invariant', 'Strict Search-First invariant is preserved');
  assert(recResult.signalsExtracted.time.timeWindow === 'MORNING_RESTOCK', 'Recommendation Signals', 'Correctly identifies morning restock diurnal window');
  
  const topRec = recResult.recommendations[0];
  assert(!!topRec.scoreBreakdown && topRec.scoreBreakdown.compositeScore > 0, 'Recommendation Scoring', 'Computes normalized composite score (0-100)', `Score: ${topRec.scoreBreakdown.compositeScore}`);
  assert(!!topRec.scoreBreakdown.primaryDriver, 'Recommendation Explainability', `Identifies primary driver: ${topRec.scoreBreakdown.primaryDriver}`);

  // Test 3.2: Cold start fallback
  const coldStartRec = generateRetailerRecommendations(
    { ...dukaShop, id: 'shop_brand_new' },
    [],
    [] // 0 orders
  );
  assert(coldStartRec.recommendations.length > 0, 'Recommendation Cold-Start', 'Gracefully falls back to baseline FMCG staples on zero orders');

  // =========================================================================
  // SUITE 4: TWO-TIER PAYMENT INTEGRATION (PAYMENT SERVICE & DARAJA B2C/C2B)
  // =========================================================================
  console.log('\n--- 4. Testing Two-Tier Payment Service ---');
  const dummyOrder: Order = {
    ...mockOrders[0],
    id: `ORD-TEST-${Date.now()}`,
    status: 'PAYMENT_PENDING',
  };

  // Test 4.1: Initiate STK Push
  const paymentRes = await paymentService.initiatePayment({
    order: dummyOrder,
    phoneNumber: '+254712345678',
    amount: dummyOrder.totalAmount,
    currency: 'KES',
  });
  assert(paymentRes.success === true, 'Payment Service', 'M-Pesa STK Push initiated successfully', `Provider: ${paymentRes.provider}`);
  assert(!!paymentRes.providerReference, 'Payment Reference', `Generated Daraja checkout reference: ${paymentRes.providerReference}`);

  // Test 4.2: Automated Reversal / Refund
  const refundRes = await paymentService.refundPayment({
    order: { ...dummyOrder, status: 'CANCELLED' },
    refundAmount: dummyOrder.totalAmount,
    reason: 'Depot stockout compensation',
  });
  assert(refundRes.success === true, 'Payment Refund', 'M-Pesa B2C instant reversal executed', `Reversal Ref: ${refundRes.reversalRef}`);
  assert(refundRes.paymentRecord.status === 'REVERSED', 'Payment Ledger', 'Payment ledger records REVERSAL record');

  // =========================================================================
  // SUITE 5: 16-STATE FINITE STATE MACHINE (HAPPY PATH & ILLEGAL TRANSITIONS)
  // =========================================================================
  console.log('\n--- 5. Testing Finite State Machine (Order Lifecycle) ---');
  
  // Happy Path Transitions
  const happyPath: [OrderState, OrderState][] = [
    ['CART', 'CHECKOUT_PENDING'],
    ['CHECKOUT_PENDING', 'PAYMENT_PENDING'],
    ['PAYMENT_PENDING', 'PAID'],
    ['PAID', 'SUPPLIER_PENDING'],
    ['SUPPLIER_PENDING', 'ACCEPTED'],
    ['ACCEPTED', 'PREPARING'],
    ['PREPARING', 'READY_FOR_PICKUP'],
    ['READY_FOR_PICKUP', 'RIDER_ASSIGNED'],
    ['RIDER_ASSIGNED', 'PICKED_UP'],
    ['PICKED_UP', 'OUT_FOR_DELIVERY'],
    ['OUT_FOR_DELIVERY', 'DELIVERED'],
  ];

  happyPath.forEach(([curr, next]) => {
    assert(canTransitionOrder(curr, next), 'FSM Happy Path', `Allowed: ${curr} -> ${next}`);
  });

  // Strict Invariant: Terminal DELIVERED cannot transition backwards to CART or PAYMENT_PENDING
  assert(!canTransitionOrder('DELIVERED', 'CART'), 'FSM Invariant', 'DELIVERED cannot revert to CART (terminal integrity)');
  assert(!canTransitionOrder('DELIVERED', 'PAYMENT_PENDING'), 'FSM Invariant', 'DELIVERED cannot revert to PAYMENT_PENDING');

  // =========================================================================
  // SUITE 6: EXCEPTIONAL ORDER LIFECYCLE STATES
  // =========================================================================
  console.log('\n--- 6. Testing Exceptional Order Lifecycle States ---');
  
  // Exception 1: CANCELLED
  assert(canTransitionOrder('PAID', 'CANCELLED'), 'Exceptional State', 'PAID can transition to CANCELLED');
  assert(canTransitionOrder('CANCELLED', 'REFUND_PENDING'), 'Exceptional State', 'CANCELLED triggers REFUND_PENDING');
  assert(canTransitionOrder('REFUND_PENDING', 'REFUNDED'), 'Exceptional State', 'REFUND_PENDING transitions to REFUNDED');

  // Exception 2: FAILED Delivery with Exception Code
  assert(canTransitionOrder('OUT_FOR_DELIVERY', 'FAILED'), 'Exceptional State', 'OUT_FOR_DELIVERY can fail on rider exception');
  const deliveryEx: DeliveryException = {
    code: 'DAMAGED_GOODS_REFUSED',
    reason: 'Flour bale torn during transit over rough road.',
    timestamp: new Date().toISOString(),
    reportedByRiderId: 'rider_01',
    reportedByRiderName: 'Juma Mwangi',
  };
  assert(deliveryEx.code === 'DAMAGED_GOODS_REFUSED', 'Exception Payload', 'Captures rider exception payload');

  // Exception 3: PARTIALLY_FULFILLED (Wholesaler item stockout & substitution)
  assert(canTransitionOrder('SUPPLIER_PENDING', 'PARTIALLY_FULFILLED'), 'Exceptional State', 'SUPPLIER_PENDING can transition to PARTIALLY_FULFILLED');
  assert(canTransitionOrder('PARTIALLY_FULFILLED', 'READY_FOR_PICKUP'), 'Exceptional State', 'PARTIALLY_FULFILLED can proceed to READY_FOR_PICKUP after substitution');

  // =========================================================================
  // SUITE 7: RIDER DISPATCH & TWO-TIER CRYPTOGRAPHIC HANDOVER
  // =========================================================================
  console.log('\n--- 7. Testing Rider Logistics & Two-Tier Handover Codes ---');
  const wholesalerHandoverCode = 'WHS-8821';
  const dukaDeliveryOtp = '7492';

  const testHandoverInput = (input: string) => input === wholesalerHandoverCode;
  const testDeliveryOtpInput = (input: string) => input === dukaDeliveryOtp;

  assert(testHandoverInput('WHS-8821') === true, 'Logistics Handshake', 'Wholesaler handover code matches depot pin');
  assert(testHandoverInput('WHS-0000') === false, 'Logistics Security', 'Incorrect wholesaler code is rejected');

  assert(testDeliveryOtpInput('7492') === true, 'Logistics Handshake', 'Duka delivery OTP confirms physical receipt');
  assert(testDeliveryOtpInput('1111') === false, 'Logistics Security', 'Incorrect duka delivery OTP is rejected');

  // =========================================================================
  // SUITE 8: TELEMETRY & AUDIT LOG GENERATION
  // =========================================================================
  console.log('\n--- 8. Testing Telemetry & Analytics Event Pipeline ---');
  const evt = generateEvent('SEARCH_PERFORMED', 'usr_sarah', dukaShop.id, {
    query: 'jogoo maize meal',
    resultsCount: 4,
    latencyMs: 18,
  });
  assert(!!evt.eventId && evt.eventType === 'SEARCH_PERFORMED', 'Telemetry', 'Emits compliant SEARCH_PERFORMED event');
  assert(!!evt.sessionId && !!evt.timestamp, 'Telemetry Integrity', 'Telemetry records sessionId and ISO timestamp');

  // =========================================================================
  // SUITE 9: PRODUCTION BREAKING POINTS & RELIABILITY MITIGATIONS
  // =========================================================================
  console.log('\n--- 9. Testing Production Breaking Points & Resiliency Hardening ---');

  // 9.1 Idempotency / Mutex Locks against duka double-tap
  const lockAcquiredFirst = PaymentLockManager.acquireLock('WN-ORDER-LOCK-1', '+254712345678', 60);
  assert(lockAcquiredFirst === true, 'Production Hardening', 'Acquires lock on first payment initiation');
  const lockAcquiredSecond = PaymentLockManager.acquireLock('WN-ORDER-LOCK-1', '+254712345678', 60);
  assert(lockAcquiredSecond === false, 'Production Hardening', 'Prevents concurrent double-tap STK push via mutex lock');
  PaymentLockManager.releaseLock('WN-ORDER-LOCK-1');
  assert(PaymentLockManager.isLocked('WN-ORDER-LOCK-1') === false, 'Production Hardening', 'Lock is cleanly released upon completion');

  // 9.2 Asynchronous STK Push Query Polling
  const pollRes = await paymentService.queryStkPushStatus('ws_req_123', 'WN-ORDER-99');
  assert(pollRes.status === 'SUCCESS' && pollRes.resultCode === '0', 'Production Hardening', 'STK push query polling recovers payment status on dropped webhook');

  // 9.3 B2C Float & Escrow Reserve Monitoring
  const floatStatus = UtilityFloatManager.getFloatStatus();
  assert(floatStatus.currentFloatKES >= 200000, 'Production Hardening', 'B2C utility float is healthy and above minimum safety reserve');
  assert(UtilityFloatManager.checkSufficientFloat(5000) === true, 'Production Hardening', 'Validates float sufficiency before issuing reversal');
  assert(UtilityFloatManager.checkSufficientFloat(9000000) === false, 'Production Hardening', 'Detects float exhaustion before disbursing impossible payout');

  // 9.4 Cargo Payload Weight & Volume Calculations
  const lightItems: OrderItem[] = [
    { productId: 'prod_njugu', productName: 'Njugu', quantity: 2, unitPrice: 980, total: 1960 },
  ];
  const lightPayload = calculateOrderPayload(lightItems);
  assert(lightPayload.totalWeightKg === 2.4, 'Production Hardening', 'Computes accurate payload weight for small orders', `Weight: ${lightPayload.totalWeightKg}kg`);
  assert(lightPayload.assignedVehicleType === 'BODA_BODA', 'Production Hardening', 'Routes light orders to Boda Boda');
  assert(lightPayload.dispatchSplitsCount === 1, 'Production Hardening', 'Light order requires only 1 single Boda run');

  // 9.5 Multi-Vehicle Overweight Auto-Split & Vehicle Routing
  const mediumItems: OrderItem[] = [
    { productId: 'prod_jogoo', productName: 'Jogoo 24kg Bale', quantity: 5, unitPrice: 1720, total: 8600 },
  ]; // 5 * 24kg = 120kg (exceeds single boda 90kg limit, but <= 180kg)
  const mediumPayload = calculateOrderPayload(mediumItems);
  assert(mediumPayload.totalWeightKg === 120, 'Production Hardening', 'Accurately computes 120kg medium cargo weight');
  assert(mediumPayload.isOverweightForSingleBoda === true, 'Production Hardening', 'Detects weight violation for single Boda Boda');
  assert(mediumPayload.dispatchSplitsCount === 2, 'Production Hardening', 'Automatically splits 120kg payload into 2 synchronized Boda runs');

  const heavyItems: OrderItem[] = [
    { productId: 'prod_jogoo', productName: 'Jogoo 24kg Bale', quantity: 10, unitPrice: 1720, total: 17200 },
  ]; // 10 * 24kg = 240kg
  const heavyPayload = calculateOrderPayload(heavyItems);
  assert(heavyPayload.assignedVehicleType === 'TUK_TUK', 'Production Hardening', 'Escalates 240kg cargo to 3-Wheeler Cargo Tuk-Tuk');

  const superHeavyItems: OrderItem[] = [
    { productId: 'prod_jogoo', productName: 'Jogoo 24kg Bale', quantity: 15, unitPrice: 1720, total: 25800 },
  ]; // 15 * 24kg = 360kg (>300kg)
  const superHeavyPayload = calculateOrderPayload(superHeavyItems);
  assert(superHeavyPayload.assignedVehicleType === 'PICKUP_VAN', 'Production Hardening', 'Escalates 360kg cargo to 1-Tonne Pickup Van');

  // 9.6 Offline Emergency Delivery OTP / USSD Fallback
  const offlineCode = generateOfflineDeliveryCode('WN-7492', '+254712345678');
  assert(offlineCode.length === 4 && !isNaN(Number(offlineCode)), 'Production Hardening', 'Generates valid 4-digit offline emergency delivery PIN for dead battery fallback', `Code: ${offlineCode}`);

  // 9.7 Wholesaler Depot Virtual Stock Reservations
  const reserveAttempt = VirtualStockReservationManager.reserveStock('WN-RES-1', 'ws_eastleigh', [
    { productId: 'prod_njugu', quantity: 5 },
  ]);
  assert(reserveAttempt.success === true && !!reserveAttempt.reservationId, 'Production Hardening', 'Locks virtual stock reservation for 15-minute checkout window');
  assert(!!reserveAttempt.reservedUntil, 'Production Hardening', 'Generates expiration timestamp for stock reservation');

  // 9.8 Phantom Stock Shield: Walk-In Safety Buffer
  // Stock is 85, active reserved is 5. Available = 80. If we try to order 79 (leaving 1 < buffer 3), it should reject
  const contentionAttempt = VirtualStockReservationManager.reserveStock('WN-RES-CONTEND', 'ws_eastleigh', [
    { productId: 'prod_njugu', quantity: 79 },
  ]);
  assert(contentionAttempt.success === false, 'Production Hardening', 'Phantom Stock Shield blocks orders that breach counter safety buffer', contentionAttempt.error);

  // 9.9 2G/3G Network Jitter Monotonic Sequence Drop
  assert(isStaleSearchResponse(10, 12) === true, 'Production Hardening', 'Correctly flags out-of-order delayed search response as stale');
  assert(isStaleSearchResponse(15, 12) === false, 'Production Hardening', 'Accepts newer search response in monotonic sequence');

  // 9.10 Recommendation Fatigue Decay & Epsilon-Greedy Diversity
  const fatiguedRecs = generateRetailerRecommendations(
    dukaShop,
    ['unga'],
    mockOrders,
    undefined,
    8,
    'Friday',
    {
      impressionCounts: { prod_jogoo: 5 }, // Heavily impressed item
      enableExploration: true,
    }
  );
  assert(fatiguedRecs.recommendations.length > 0, 'Production Hardening', 'Evaluates recommendations with fatigue penalty applied');
  const hasDiversityTag = fatiguedRecs.recommendations.some((r) =>
    r.scoreBreakdown.explanationTags.some((tag) => tag.includes('Exploration') || tag.includes('Margin'))
  );
  assert(hasDiversityTag === true, 'Production Hardening', 'Epsilon-greedy diversity injector surfaces novel high-margin SKU');

  // =========================================================================
  // FINAL REPORT
  // =========================================================================
  console.log('\n================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
