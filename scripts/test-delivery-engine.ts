import { DeliveryEngine } from '../src/services/dispatchEngine';
import { Rider, OrderItem } from '../src/types/wayno';
import { INITIAL_RIDERS, WHOLESALERS, SHOPS } from '../src/data/mockData';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, title: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${title}${details ? ` -> ${details}` : ''}`);
    failedCount++;
  }
}

console.log('================================================================');
console.log('WAYNO DELIVERY & RIDER SELECTION SIMULATION: PRODUCTION AUDIT');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SCENARIO 1: STANDARD LIGHT CARGO DISPATCH & MULTI-FACTOR RANKING
// Standard FMCG order (24kg Jogoo Flour) within Eastleigh 20km corridor
// -----------------------------------------------------------------------------
console.log('--- SCENARIO 1: Standard Light Cargo Dispatch & Multi-Factor Scoring ---');
const engine = new DeliveryEngine();

const standardItems: OrderItem[] = [
  {
    productId: 'prod_jogoo',
    productName: 'Jogoo Maize Meal Flour 2kg (Bale of 12 Packets)',
    packSize: '2kg x 12 Pkts Bale',
    quantity: 1,
    unitPrice: 1980,
    totalPrice: 1980,
    wholesalerLocationId: 'ws_eastleigh',
    wholesalerName: 'Eastleigh Mega Wholesale Depot',
    unitWeightKg: 24.0,
    unitVolumeCbm: 0.045,
  },
];

const standardResult = engine.selectBestRider({
  orderId: 'ord_sim_01',
  wholesalerLocationId: 'ws_eastleigh',
  retailerShopId: 'shop_01',
  items: standardItems,
});

assert(standardResult.success, 'Successfully selects a rider for standard FMCG run');
assert(Boolean(standardResult.assignedRider), `Assigned rider is present: ${standardResult.assignedRider?.name}`);
assert(standardResult.dispatchSplitsRequired === 1, 'Standard 24kg cargo requires only 1 delivery split');
assert(!standardResult.payloadAnalysis.isOverweightForSingleBoda, '24kg cargo is safely within single Boda limit (<= 90kg)');
assert(standardResult.candidateScores.length >= 3, `Evaluated all registered candidate riders (${standardResult.candidateScores.length} candidates)`);

// Verify that candidate ranking sorted by composite score descending
const topScore = standardResult.candidateScores[0].totalCompositeScore;
const secondScore = standardResult.candidateScores[1].totalCompositeScore;
assert(topScore >= secondScore, `Riders ranked correctly by multi-factor score (${topScore} >= ${secondScore})`);

// -----------------------------------------------------------------------------
// SCENARIO 2: HEAVY CARGO AUTO-SPLITTING (144kg ORDER ON 90kg BODA CAPACITY)
// 6 Bales of Flour (144 kg) exceeds 90kg single motorbike limit. Must auto-split into 2 dispatches.
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 2: Heavy Cargo Payload Auto-Splitting (144kg Consignment) ---');

const heavyItems: OrderItem[] = [
  {
    productId: 'prod_jogoo',
    productName: 'Jogoo Maize Meal Flour 2kg (Bale of 12 Packets)',
    packSize: '2kg x 12 Pkts Bale',
    quantity: 6, // 6 * 24kg = 144kg
    unitPrice: 1980,
    totalPrice: 11880,
    wholesalerLocationId: 'ws_eastleigh',
    wholesalerName: 'Eastleigh Mega Wholesale Depot',
    unitWeightKg: 24.0,
    unitVolumeCbm: 0.045,
  },
];

const heavyResult = engine.selectBestRider({
  orderId: 'ord_sim_02',
  wholesalerLocationId: 'ws_eastleigh',
  retailerShopId: 'shop_01',
  items: heavyItems,
});

assert(heavyResult.payloadAnalysis.totalWeightKg === 144.0, 'Correctly computes total weight as 144.0 kg');
assert(heavyResult.payloadAnalysis.isOverweightForSingleBoda, 'Flags consignment as overweight for single motorcycle (>90kg)');
assert(heavyResult.dispatchSplitsRequired === 2, `Automatically schedules 2 synchronized Boda dispatches (got ${heavyResult.dispatchSplitsRequired})`);
assert(heavyResult.warningFlags.some(f => f.includes('CARGO_OVERWEIGHT')), 'Emits operational safety warning flag');

// -----------------------------------------------------------------------------
// SCENARIO 3: BULK INDUSTRIAL TUK-TUK ROUTING (240kg ORDER)
// 10 Bales of Flour (240kg) exceeds multi-boda threshold (<=180kg). Must route to Cargo Tuk-Tuk.
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 3: Bulk Consignment Tuk-Tuk Vehicle Routing (240kg Order) ---');

const bulkItems: OrderItem[] = [
  {
    productId: 'prod_pembe',
    productName: 'Pembe Home Baking Wheat Flour 2kg (Bale of 12 Packets)',
    packSize: '2kg x 12 Pkts Bale',
    quantity: 10, // 10 * 24kg = 240kg
    unitPrice: 1820,
    totalPrice: 18200,
    wholesalerLocationId: 'ws_industrial',
    wholesalerName: 'Industrial Area Direct Supply Hub',
    unitWeightKg: 24.0,
    unitVolumeCbm: 0.045,
  },
];

const bulkResult = engine.selectBestRider({
  orderId: 'ord_sim_03',
  wholesalerLocationId: 'ws_industrial',
  retailerShopId: 'shop_01',
  items: bulkItems,
});

assert(bulkResult.payloadAnalysis.totalWeightKg === 240.0, 'Correctly computes bulk payload weight as 240.0 kg');
assert(bulkResult.payloadAnalysis.assignedVehicleType === 'TUK_TUK', 'Escalates vehicle classification to 3-Wheeler Cargo Tuk-Tuk');
assert(bulkResult.assignedRider?.vehicleType === 'Tuk-Tuk Cargo', `Assigned Tuk-Tuk specialized rider (${bulkResult.assignedRider?.name})`);

// -----------------------------------------------------------------------------
// SCENARIO 4: EDGE CASE - ALL NEARBY RIDERS BUSY / EN_ROUTE
// When nearest riders are busy, engine selects next available rider without deadlock.
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 4: Busy Rider Congestion & State Fallback ---');

const customRiders: Rider[] = [
  {
    id: 'rider_busy_01',
    name: 'Samuel Kamau',
    phone: '+254 700 111 222',
    vehicleType: 'Boda Boda (Motorbike)',
    vehiclePlate: 'KMFB 111A',
    rating: 4.95,
    status: 'EN_ROUTE_DELIVERY', // Busy
    currentLat: -1.2760,
    currentLng: 36.8530,
    completedTrips: 512,
  },
  {
    id: 'rider_avail_02',
    name: 'Amina Hassan',
    phone: '+254 700 333 444',
    vehicleType: 'Boda Boda (Motorbike)',
    vehiclePlate: 'KMFB 222B',
    rating: 4.88,
    status: 'AVAILABLE',
    currentLat: -1.2680,
    currentLng: 36.8650,
    completedTrips: 180,
  },
];

const engineCongestion = new DeliveryEngine(customRiders);
const congestionResult = engineCongestion.selectBestRider({
  orderId: 'ord_sim_04',
  wholesalerLocationId: 'ws_eastleigh',
  retailerShopId: 'shop_01',
  items: standardItems,
});

assert(congestionResult.success, 'Dispatches order successfully during fleet contention');
assert(congestionResult.assignedRider?.id === 'rider_avail_02', 'Skips busy rider and dispatches available rider (Amina Hassan)');
assert(
  congestionResult.candidateScores.find((c) => c.rider.id === 'rider_busy_01')?.isEligible === false,
  'Disqualifies EN_ROUTE_DELIVERY rider from consideration'
);

// -----------------------------------------------------------------------------
// SCENARIO 5: EDGE CASE - TOTAL FLEET EXHAUSTION (ALL RIDERS OFFLINE)
// System gracefully returns structured error without crashing or leaving orders stuck.
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 5: Total Fleet Exhaustion Graceful Error Response ---');

const offlineRiders: Rider[] = [
  {
    ...customRiders[0],
    status: 'OFFLINE',
  },
  {
    ...customRiders[1],
    status: 'OFFLINE',
  },
];

const engineOffline = new DeliveryEngine(offlineRiders);
const offlineResult = engineOffline.selectBestRider({
  orderId: 'ord_sim_05',
  wholesalerLocationId: 'ws_eastleigh',
  retailerShopId: 'shop_01',
  items: standardItems,
});

assert(!offlineResult.success, 'Returns false when no eligible riders are online');
assert(Boolean(offlineResult.failureReason), `Provides descriptive reason: "${offlineResult.failureReason}"`);
assert(!offlineResult.assignedRider, 'No rider erroneously assigned');

// -----------------------------------------------------------------------------
// SCENARIO 6: END-TO-END SIMULATION: DEPOT OTP MISMATCH & RESOLUTION
// Verification of cryptographic PIN handshake at depot loading dock.
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 6: Depot Loading Dock Handshake & Security PIN Retry ---');

const depotSim = engine.simulateDeliveryLifecycle(
  {
    orderId: 'ord_sim_06',
    wholesalerLocationId: 'ws_eastleigh',
    retailerShopId: 'shop_01',
    items: standardItems,
  },
  'DEPOT_WRONG_HANDSHAKE_PIN'
);

assert(depotSim.success, 'Simulation completes successfully after security PIN retry');
assert(depotSim.timeline.some((t) => t.details.includes('Depot rejected release')), 'Depot initially blocked release on invalid PIN');
assert(depotSim.timeline.some((t) => t.details.includes('Handshake resolved')), 'Depot authorized release upon cryptographic PIN presentation');
assert(depotSim.auditTrail.some((a) => a.includes('SECURITY_ALERT')), 'Emitted audit trail security warning');

// -----------------------------------------------------------------------------
// SCENARIO 7: END-TO-END SIMULATION: DUKA OFFLINE BATTERY / USSD FALLBACK
// Shopkeeper smartphone dies; delivery confirmed via USSD emergency fallback code (*384*PIN#).
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 7: Duka Smartphone Battery Dead & USSD Offline Fallback ---');

const ussdSim = engine.simulateDeliveryLifecycle(
  {
    orderId: 'ord_sim_07',
    wholesalerLocationId: 'ws_eastleigh',
    retailerShopId: 'shop_01',
    items: standardItems,
  },
  'DUKA_OFFLINE_BATTERY_FALLBACK'
);

assert(ussdSim.success, 'Delivery successfully completes using offline fallback');
assert(ussdSim.timeline.some((t) => t.status === 'EXCEPTION_ESCALATED'), 'Logged offline smartphone exception state');
assert(ussdSim.timeline.some((t) => t.details.includes('USSD fallback code')), 'Resolved physical handover via USSD channel (*384*PIN#)');
assert(ussdSim.auditTrail.some((a) => a.includes('OFFLINE_RESILIENCE')), 'Audit log records offline fallback execution');

// -----------------------------------------------------------------------------
// SCENARIO 8: TRANSIT EXCEPTION & M-PESA B2C REVERSAL TRIGGER
// Goods damaged in transit; shopkeeper rejects cargo. System terminates delivery and triggers refund.
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 8: Damaged Goods Rejection & Reverse Logistics ---');

const damagedSim = engine.simulateDeliveryLifecycle(
  {
    orderId: 'ord_sim_08',
    wholesalerLocationId: 'ws_eastleigh',
    retailerShopId: 'shop_01',
    items: standardItems,
  },
  'CUSTOMER_REJECTED_DAMAGED_GOODS'
);

assert(!damagedSim.success, 'Delivery marked as failed upon physical damage rejection');
assert(damagedSim.exceptionEncountered === 'DAMAGED_GOODS_REFUSED', 'Correctly captures DAMAGED_GOODS_REFUSED exception code');
assert(damagedSim.exceptionResolution === 'B2C_REVERSAL_TRIGGERED', 'Automatically routes to Daraja B2C instant refund reversal');
assert(damagedSim.timeline.some((t) => t.status === 'FAILED'), 'Timeline records transit exception failure');

// -----------------------------------------------------------------------------
// SCENARIO 9: DEADHEAD RADIUS LIMIT CHECK (>15KM DEADHEAD REJECTION)
// A rider located in Machakos/Athi River (30km away) must be disqualified to preserve SLAs.
// -----------------------------------------------------------------------------
console.log('\n--- SCENARIO 9: Deadhead Distance Threshold Rejection (>15km) ---');

const distantRiders: Rider[] = [
  {
    id: 'rider_distant_01',
    name: 'George Mutua',
    phone: '+254 700 555 666',
    vehicleType: 'Boda Boda (Motorbike)',
    vehiclePlate: 'KMFB 999Z',
    rating: 5.0,
    status: 'AVAILABLE',
    currentLat: -1.4500, // Athi River / Machakos corridor (~30km away from Eastleigh)
    currentLng: 36.9800,
    completedTrips: 800,
  },
];

const engineDistant = new DeliveryEngine(distantRiders);
const distantResult = engineDistant.selectBestRider({
  orderId: 'ord_sim_09',
  wholesalerLocationId: 'ws_eastleigh',
  retailerShopId: 'shop_01',
  items: standardItems,
  maxPickupRadiusKm: 15.0,
});

assert(!distantResult.success, 'Distant rider disqualified due to excessive deadhead distance (>15km)');
assert(
  distantResult.candidateScores[0].disqualificationReason?.includes('Deadhead distance') || false,
  `Disqualification reason specifies deadhead threshold breach (${distantResult.candidateScores[0].disqualificationReason})`
);

console.log('\n================================================================');
console.log(`DELIVERY ENGINE VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
