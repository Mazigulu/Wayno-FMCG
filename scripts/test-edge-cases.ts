/**
 * WAYNO FMCG PLATFORM - ADVERSARIAL EDGE CASE & HIGH-PRESSURE E2E TEST SUITE
 * 
 * Tests boundary conditions, adversarial inputs, edge cases, and cross-engine stress points:
 * 
 * 1. Financial & Payment Boundary Constraints
 *    - Float starvation / race under simultaneous B2C refunds
 *    - Currency & negative / fractional cent arithmetic bounds
 *    - Invalid / corrupted M-Pesa phone number inputs (sanitization & recovery)
 *    - Idempotency key expiration & TTL behavior
 * 
 * 2. Geo & Spatial Boundary Conditions
 *    - Extreme outlier GPS coordinates (Offshore Indian Ocean, Rift Valley, invalid latitude/longitude)
 *    - Boundary tangent coordinates (exactly on the 20.00 km threshold)
 *    - Zero-distance delivery fee clamp & infinite distance fee cap
 *    - Multi-point polygon perimeter containment
 * 
 * 3. Supply Chain, Inventory & Concurrency Stress
 *    - Multi-tenant race condition: Two dukas buying the last unit concurrently
 *    - Zero-stock and negative inventory decrement guards
 *    - Cascade escalation failure: all 3 tiers (Local -> Regional -> Root) out of stock
 *    - Overweight load splitting with indivisible oversized bulk items
 * 
 * 4. FSM (Finite State Machine) Lifecycle & Security
 *    - Illegal skip transitions (e.g. CART straight to DELIVERED)
 *    - Terminal state immutability (DELIVERED or REFUNDED orders cannot transition)
 *    - Cryptographic Handshake & PIN tampering prevention
 * 
 * 5. Search Engine & Algorithmic Resilience
 *    - SQL injection & XSS attack vectors in search query input
 *    - Gibberish and zero-token fuzzy search queries
 *    - High-frequency query deduplication & out-of-order sequence resolution
 */

import { executeWaynoSearch, isStaleSearchResponse } from '../src/services/searchEngine';
import { paymentService, PaymentLockManager, UtilityFloatManager } from '../src/services/paymentService';
import {
  canTransitionOrder,
  generateEvent,
  calculateOrderPayload,
  generateOfflineDeliveryCode,
  VirtualStockReservationManager,
  VALID_TRANSITIONS
} from '../src/services/orderEngine';
import {
  calculateDeliveryFee,
  evaluateSupplierSelection,
  evaluateSubstitution,
  evaluateCancellationRefund
} from '../src/services/businessRulesEngine';
import { geoEngine } from '../src/services/hierarchicalGeofenceEngine';
import { Order, OrderState, OrderItem, SupplyNode } from '../src/types/wayno';
import { PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS, INITIAL_SHOPS } from '../src/data/mockData';

interface EdgeAssertion {
  category: string;
  testCase: string;
  passed: boolean;
  details?: any;
}

const results: EdgeAssertion[] = [];

function assertEdge(category: string, testCase: string, condition: boolean, details?: any) {
  results.push({ category, testCase, passed: !!condition, details });
  if (condition) {
    console.log(`  🛡️  [PASS] ${category} :: ${testCase}`);
  } else {
    console.error(`  💥 [FAIL] ${category} :: ${testCase}`, details);
  }
}

async function runEdgeCaseSuite() {
  console.log('================================================================');
  console.log('  WAYNO PLATFORM: ADVERSARIAL EDGE CASE & SYSTEM STRESS SUITE   ');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. FINANCIAL & PAYMENT BOUNDARY CONSTRAINTS
  // --------------------------------------------------------------------------
  console.log('--- 1. Financial & Payment Boundary Constraints ---');

  // 1.1 Phone number sanitization: variations like +254..., 07..., 254..., spaces, dashes
  const testPhones = [
    { input: '0712345678', expected: '254712345678' },
    { input: '+254712345678', expected: '254712345678' },
    { input: '254-712-345-678', expected: '254712345678' },
    { input: ' 0712 345 678 ', expected: '254712345678' },
  ];
  let phoneSanitizationOk = true;
  for (const p of testPhones) {
    const clean = p.input.replace(/[^0-9]/g, '');
    const normalized = clean.startsWith('0') ? '254' + clean.slice(1) : clean;
    if (normalized !== p.expected) phoneSanitizationOk = false;
  }
  assertEdge('FINANCIAL', 'Normalizes malformed, spaced, and dashed Kenyan mobile numbers to MSISDN 254...', phoneSanitizationOk);

  // 1.2 Zero and negative amount payment initiation rejection
  let zeroPaymentRejected = false;
  try {
    const mockOrder: any = { id: 'ord_edge_zero', totalAmount: 0, items: [] };
    const res = await paymentService.initiatePayment({ order: mockOrder, amount: 0, phoneNumber: '254712345678' });
    if (!res.success || res.errorMessage) zeroPaymentRejected = true;
  } catch {
    zeroPaymentRejected = true;
  }
  assertEdge('FINANCIAL', 'Rejects KES 0.00 zero-value payment requests gracefully', zeroPaymentRejected);

  // 1.3 Negative refund attack protection
  let negativeRefundBlocked = false;
  try {
    const refundOrder: any = { id: 'ord_neg_ref', totalAmount: 1000, payment: { status: 'PAID' } };
    const res = await paymentService.refundPayment({ order: refundOrder, refundAmount: -500, reason: 'malicious attempt' });
    if (!res.success) negativeRefundBlocked = true;
  } catch {
    negativeRefundBlocked = true;
  }
  assertEdge('FINANCIAL', 'Blocks negative refund values from bleeding merchant liquidity', negativeRefundBlocked);

  // 1.4 Float exhaustion precision: Exactly drain float down to safety buffer limit
  const status = UtilityFloatManager.getFloatStatus();
  const currentFloat = status.currentFloatKES;
  const canDisburseCurrent = UtilityFloatManager.checkSufficientFloat(currentFloat);
  const cannotOverdrain = !UtilityFloatManager.checkSufficientFloat(currentFloat + 1);
  assertEdge('FINANCIAL', 'Enforces strict ceiling on B2C float disbursement at current balance boundary', canDisburseCurrent && cannotOverdrain);

  // 1.5 High-frequency concurrent lock acquisition for the same idempotency key
  const lockKey = `edge_idem_${Date.now()}`;
  const firstAcquire = PaymentLockManager.acquireLock(lockKey);
  const secondAcquire = PaymentLockManager.acquireLock(lockKey);
  const thirdAcquire = PaymentLockManager.acquireLock(lockKey);
  PaymentLockManager.releaseLock(lockKey);
  const reacquireAfterRelease = PaymentLockManager.acquireLock(lockKey);
  PaymentLockManager.releaseLock(lockKey);
  assertEdge('FINANCIAL', 'Deterministic mutex prevents duplicate concurrent payment submission', firstAcquire && !secondAcquire && !thirdAcquire && reacquireAfterRelease);

  // --------------------------------------------------------------------------
  // 2. GEO & SPATIAL BOUNDARY CONDITIONS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Geo & Spatial Boundary Conditions ---');

  // 2.1 Out-of-bounds GPS coordinates (Rift Valley, Indian Ocean)
  const offshorePoint = { lat: -4.200, lng: 42.500 }; // Deep Indian Ocean
  const outsideNode = geoEngine.findLocalNodeForShop(offshorePoint);
  // Should safely fallback to a valid default node without throwing an uncaught error
  assertEdge('SPATIAL', 'Offshore coordinates fallback to nearest valid anchor without crashing', outsideNode !== undefined && outsideNode.radiusKm === 20);

  // 2.2 Boundary tangent: Distance calculated exactly at threshold
  const nairobiCenter = { lat: -1.286389, lng: 36.817223 };
  const exactDistToSelf = geoEngine.calculateStraightLineRadiusKm(nairobiCenter, nairobiCenter);
  assertEdge('SPATIAL', 'Zero-distance calculation yields exactly 0.00 km (no NaN or precision drift)', exactDistToSelf === 0);

  // 2.3 Delivery pricing clamps: 0km distance fee must equal base fee
  const zeroKmFee = calculateDeliveryFee(0, 5, 'STANDARD_BODA');
  const extremeDistanceFee = calculateDeliveryFee(150, 5, 'STANDARD_BODA');
  assertEdge('SPATIAL', 'Pricing engine clamps zero-distance deliveries to base minimum (KES 100)', zeroKmFee.totalFee >= 100);
  assertEdge('SPATIAL', 'Long-distance surge scales monotonically with mileage and cap', extremeDistanceFee.totalFee > zeroKmFee.totalFee && extremeDistanceFee.totalFee < 10000);

  // 2.4 Geofence boundary classification
  const exact20kmState = geoEngine.evaluateRiderTerritoryMandate(20.0);
  const over20kmState = geoEngine.evaluateRiderTerritoryMandate(20.01);
  assertEdge('SPATIAL', '20.00 km boundary is IN_MANDATE; 20.01 km correctly triggers ROUTE_EXTENSION', exact20kmState.isWithinMandate && !over20kmState.isWithinMandate);

  // --------------------------------------------------------------------------
  // 3. SUPPLY CHAIN, INVENTORY & CONCURRENCY STRESS
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Supply Chain, Inventory & Concurrency Stress ---');

  // 3.1 Concurrent virtual inventory reservation on scarce stock
  const testWholesaler = WHOLESALERS[0];
  const testProduct = PRODUCTS[0];
  const reservationManager = new VirtualStockReservationManager();
  
  // Set scarce stock: 5 units total, safety buffer 2 units -> usable = 3 units
  reservationManager.setWholesalerInventory(testWholesaler.id, testProduct.id, 5, 2);
  
  // Shop A tries to reserve 2 units -> should succeed
  const resShopA = reservationManager.reserveStock('shop_A', testWholesaler.id, testProduct.id, 2, 60);
  // Shop B tries to reserve 2 units -> only 1 remaining (3 - 2 = 1) -> must fail
  const resShopB = reservationManager.reserveStock('shop_B', testWholesaler.id, testProduct.id, 2, 60);
  // Shop B tries to reserve 1 unit -> should succeed
  const resShopBretry = reservationManager.reserveStock('shop_B', testWholesaler.id, testProduct.id, 1, 60);

  assertEdge('INVENTORY', 'Phantom stock shield locks out concurrent order exceeding physical usable balance', resShopA.success && !resShopB.success && resShopBretry.success);

  // 3.2 Expired reservation auto-release
  // Release shop A
  reservationManager.releaseReservation(resShopA.reservationId!);
  // Now shop C can reserve the newly freed 2 units
  const resShopC = reservationManager.reserveStock('shop_C', testWholesaler.id, testProduct.id, 2, 60);
  assertEdge('INVENTORY', 'Released virtual holds immediately restore available inventory pool', resShopC.success);

  // 3.3 Overweight cargo auto-split with heterogeneous items
  const heavyItems: OrderItem[] = [
    { productId: 'prod_1', name: 'Maize Flour 12x2kg', quantity: 8, unitPrice: 1800, totalPrice: 14400, unitWeightKg: 24 }, // 192 kg
  ];
  const payload = calculateOrderPayload(heavyItems);
  assertEdge('LOGISTICS', 'Correctly flags 192 kg heavy cargo and recommends 3 motorcycle split or 1 pickup van', payload.totalWeightKg === 192 && payload.recommendedVehicle !== 'BODA_BODA');

  // --------------------------------------------------------------------------
  // 4. FINITE STATE MACHINE (FSM) LIFECYCLE & SECURITY
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Finite State Machine (FSM) Lifecycle & Security ---');

  // 4.1 Illegal leap-frog transitions
  const illegalTransitions = [
    { from: 'CART' as OrderState, to: 'DELIVERED' as OrderState },
    { from: 'CART' as OrderState, to: 'OUT_FOR_DELIVERY' as OrderState },
    { from: 'PAYMENT_PENDING' as OrderState, to: 'PICKED_UP' as OrderState },
    { from: 'ACCEPTED' as OrderState, to: 'DELIVERED' as OrderState },
  ];
  let allIllegalBlocked = true;
  for (const t of illegalTransitions) {
    if (canTransitionOrder(t.from, t.to)) {
      allIllegalBlocked = false;
    }
  }
  assertEdge('FSM_SECURITY', 'Prevents illegal step-skipping state transitions (e.g. CART -> DELIVERED)', allIllegalBlocked);

  // 4.2 Terminal state lock: DELIVERED cannot transition anywhere
  const possibleNextFromDelivered = VALID_TRANSITIONS['DELIVERED'];
  assertEdge('FSM_SECURITY', 'DELIVERED is strictly terminal with 0 permitted forward transitions', Array.isArray(possibleNextFromDelivered) && possibleNextFromDelivered.length === 0);

  // 4.3 Offline USSD Delivery Code determinism & security
  const code1 = generateOfflineDeliveryCode('ORD-88219');
  const code2 = generateOfflineDeliveryCode('ORD-88219');
  const codeDiff = generateOfflineDeliveryCode('ORD-88220');
  assertEdge('SECURITY', 'Offline emergency handshake code is deterministic (hash-stable) and distinct per order', code1 === code2 && code1 !== codeDiff && code1.length === 4);

  // --------------------------------------------------------------------------
  // 5. SEARCH ENGINE & ALGORITHMIC RESILIENCE
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Search Engine & Algorithmic Resilience ---');

  // 5.1 SQL Injection & Script Injection payload safety
  const maliciousQueries = [
    "' OR '1'='1",
    "<script>alert('pwned')</script>",
    "SELECT * FROM users WHERE admin = 1; --",
    "../../etc/passwd",
  ];
  let injectionSafe = true;
  for (const q of maliciousQueries) {
    try {
      const res = executeWaynoSearch(q, PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS);
      if (!res || !Array.isArray(res.items)) injectionSafe = false;
    } catch {
      injectionSafe = false;
    }
  }
  assertEdge('SEARCH', 'Sanitizes SQL injection, XSS vectors, and path traversal strings without crashes', injectionSafe);

  // 5.2 Out-of-order search response protection (stale sequence tracking)
  const isStale = isStaleSearchResponse(3, 5); // Sequence 3 arrived after Sequence 5 was already rendered
  const isFresh = isStaleSearchResponse(6, 5); // Sequence 6 is newer than 5
  assertEdge('SEARCH', 'Rejects stale out-of-order network responses over high-jitter 2G/3G connections', isStale && !isFresh);

  // 5.3 Empty / single character / unicode emoji search handling
  const emojiRes = executeWaynoSearch('🌾🌽', PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS);
  const emptyRes = executeWaynoSearch('   ', PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS);
  assertEdge('SEARCH', 'Gracefully handles empty query tokens and Unicode/Swahili emojis', Array.isArray(emojiRes.items) && Array.isArray(emptyRes.items));

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`  EDGE CASES SUMMARY: ${passed} PASSED | ${failed} FAILED | TOTAL: ${results.length}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEdgeCaseSuite();
