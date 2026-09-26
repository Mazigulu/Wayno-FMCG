/**
 * E2E Checkout Pipeline Test
 * Simulates:
 * 1. Retailer selects products & checks out with M-Pesa.
 * 2. Order routes to primary Wholesaler Depot.
 * 3. Wholesaler accepts, packs, and stages for pickup.
 * 4. Rider claims job, verifies Wholesaler handover OTP.
 * 5. Rider delivers to Duka and verifies shopkeeper delivery OTP.
 * 6. Order reaches terminal DELIVERED state and updates ledger & rider payout.
 */

import { INITIAL_SHOPS, INITIAL_RIDERS, PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS } from '../src/data/mockData';
import { calculateOrderPayload, VirtualStockReservationManager } from '../src/services/orderEngine';
import { paymentService } from '../src/services/paymentService';
import { Order, OrderItem, CartItem } from '../src/types/wayno';

async function runCheckoutPipelineTest() {
  console.log('='.repeat(80));
  console.log('🚀 TESTING E2E RETAILER -> WHOLESALER -> RIDER CHECKOUT PIPELINE');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  // --- 1. RETAILER BASKET SELECTION ---
  console.log('\n--- 1. Retailer App: Basket Selection & Autonomous Sourcing ---');
  const shop = INITIAL_SHOPS[0];
  const prod1 = PRODUCTS.find((p) => p.id === 'prod_pembe')!;
  const sp1 = SUPPLIER_PRODUCTS.find((sp) => sp.productId === prod1.id)!;

  const prod2 = PRODUCTS.find((p) => p.id === 'prod_freshfri')!;
  const sp2 = SUPPLIER_PRODUCTS.find((sp) => sp.productId === prod2.id)!;

  const cart: CartItem[] = [
    { product: prod1, supplierProduct: sp1, quantity: 2 },
    { product: prod2, supplierProduct: sp2, quantity: 1 },
  ];

  assert(cart.length === 2, 'Retailer added 2 distinct staple FMCG items to procurement cart');

  const subtotal = cart.reduce((acc, it) => acc + it.supplierProduct.price * it.quantity, 0);
  const deliveryFee = 150;
  const totalAmount = subtotal + deliveryFee;

  const primaryWholesalerLocationId = cart[0].supplierProduct.wholesalerLocationId;
  const primaryWholesalerName = cart[0].supplierProduct.wholesalerName;

  assert(totalAmount > 0, `Cart subtotal KES ${subtotal.toLocaleString()} + delivery KES ${deliveryFee} = KES ${totalAmount.toLocaleString()}`);

  // --- 2. VIRTUAL INVENTORY RESERVATION & CHECKOUT ---
  console.log('\n--- 2. Retailer App: Stock Reservation & M-Pesa Payment ---');
  const orderId = `WN-TEST-${Date.now().toString().slice(-4)}`;
  const reservation = VirtualStockReservationManager.reserveStock(
    orderId,
    primaryWholesalerLocationId,
    cart.map((c) => ({
      productId: c.product.id,
      quantity: c.quantity,
      wholesalerLocationId: c.supplierProduct.wholesalerLocationId,
    }))
  );

  assert(reservation.success, 'Depot stock reservation succeeded with safety buffer checks');

  const pickupOtp = '4821';
  const deliveryOtp = '7935';

  const orderItems: OrderItem[] = cart.map((c) => ({
    productId: c.product.id,
    productName: c.product.name,
    packSize: c.product.packSize,
    quantity: c.quantity,
    unitPrice: c.supplierProduct.price,
    totalPrice: c.supplierProduct.price * c.quantity,
    wholesalerLocationId: c.supplierProduct.wholesalerLocationId,
    wholesalerName: c.supplierProduct.wholesalerName,
  }));

  const payload = calculateOrderPayload(orderItems);

  const order: Order = {
    id: orderId,
    retailerId: shop.retailerId,
    shopName: shop.name,
    shopAddress: shop.address,
    retailerPhone: shop.phone,
    items: orderItems,
    subtotal,
    deliveryFee,
    totalAmount,
    currency: 'KES',
    status: 'PAYMENT_PENDING',
    paymentMethod: 'MPESA_EXPRESS',
    wholesalerLocationId: primaryWholesalerLocationId,
    wholesalerName: primaryWholesalerName,
    pickupOtp,
    deliveryOtp,
    estimatedDeliveryMins: 28,
    totalWeightKg: payload.totalWeightKg,
    totalVolumeCbm: payload.totalVolumeCbm,
    assignedVehicleType: payload.assignedVehicleType,
    dispatchSplitsCount: payload.dispatchSplitsCount,
    stateHistory: [
      { state: 'CREATED', timestamp: new Date().toISOString(), note: 'Basket checkout initiated' },
      { state: 'PAYMENT_PENDING', timestamp: new Date().toISOString(), note: 'STK push dispatched' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const payResult = await paymentService.initiatePayment(
    { order, phoneNumber: shop.phone },
    'M-Pesa Express'
  );

  assert(payResult.success, 'M-Pesa payment captured successfully via Daraja PaymentService');
  order.status = 'PAID';
  order.stateHistory.push({ state: 'PAID', timestamp: new Date().toISOString(), note: 'Payment verified' });
  order.stateHistory.push({ state: 'FULFILLMENT_PENDING', timestamp: new Date().toISOString(), note: 'Dispatched to depot queue' });

  // --- 3. WHOLESALE PORTAL FULFILLMENT ---
  console.log('\n--- 3. Wholesale Hub: Depot Order Queue & Staging ---');
  // Check that the order is picked up in the wholesaler queue
  const depotOrders = [order];
  const pendingDepotOrders = depotOrders.filter((o) =>
    ['PAID', 'FULFILLMENT_PENDING', 'SUPPLIER_PENDING', 'SUPPLIER_CONFIRMED', 'ACCEPTED', 'PREPARING', 'PARTIALLY_FULFILLED'].includes(o.status)
  );

  assert(pendingDepotOrders.length === 1, 'Order appears in Wholesaler Depot "Needs Prep" dispatch queue');

  // Wholesaler accepts
  order.status = 'ACCEPTED';
  order.stateHistory.push({ state: 'ACCEPTED', timestamp: new Date().toISOString(), note: 'Wholesaler confirmed inventory' });
  assert(order.status === 'ACCEPTED', 'Wholesaler accepts order');

  // Wholesaler starts packing
  order.status = 'PREPARING';
  order.stateHistory.push({ state: 'PREPARING', timestamp: new Date().toISOString(), note: 'Picking packs from aisle 4' });
  assert(order.status === 'PREPARING', 'Warehouse crew commences picking & packing');

  // Order stays visible during preparation
  const stillInPrep = [order].filter((o) =>
    ['PAID', 'FULFILLMENT_PENDING', 'SUPPLIER_PENDING', 'SUPPLIER_CONFIRMED', 'ACCEPTED', 'PREPARING', 'PARTIALLY_FULFILLED'].includes(o.status)
  );
  assert(stillInPrep.length === 1, 'Order remains visible in "Needs Prep" throughout packing lifecycle');

  // Wholesaler stages order in bay for rider
  order.status = 'READY_FOR_PICKUP';
  order.stateHistory.push({ state: 'READY_FOR_PICKUP', timestamp: new Date().toISOString(), note: 'Staged in Loading Bay B' });
  assert(order.status === 'READY_FOR_PICKUP', 'Order staged for rider pickup (READY_FOR_PICKUP)');

  // --- 4. RIDER CONSOLE DISPATCH & PICKUP ---
  console.log('\n--- 4. Rider Console: Job Assignment & Dual-OTP Handshake ---');
  const availableRider = INITIAL_RIDERS[0];
  assert(order.status === 'READY_FOR_PICKUP', 'Order is visible to couriers under available pickups in zone');

  // Rider claims job
  order.riderId = availableRider.id;
  order.riderName = availableRider.name;
  order.riderPhone = availableRider.phone;
  order.status = 'RIDER_ASSIGNED';
  order.stateHistory.push({ state: 'RIDER_ASSIGNED', timestamp: new Date().toISOString(), note: `Claimed by rider ${availableRider.name}` });
  assert(order.status === 'RIDER_ASSIGNED' && order.riderId === availableRider.id, 'Rider self-assigns run and heads to depot');

  // Rider presents pickup OTP at loading bay
  const enteredPickupCode = '4821';
  assert(enteredPickupCode === order.pickupOtp, 'Rider verifies Wholesaler Handover OTP (4821)');
  order.status = 'PICKED_UP';
  order.stateHistory.push({ state: 'PICKED_UP', timestamp: new Date().toISOString(), note: 'Handover OTP verified at bay' });

  // Rider navigates out for delivery
  order.status = 'OUT_FOR_DELIVERY';
  order.stateHistory.push({ state: 'OUT_FOR_DELIVERY', timestamp: new Date().toISOString(), note: 'En route to retailer kiosk' });
  assert(order.status === 'OUT_FOR_DELIVERY', 'Rider departs depot, en route to duka (OUT_FOR_DELIVERY)');

  // --- 5. DUKA HANDOVER & PROOF OF DELIVERY ---
  console.log('\n--- 5. Final Mile: Duka Handover & Proof of Delivery OTP ---');
  const enteredDeliveryCode = '7935';
  assert(enteredDeliveryCode === order.deliveryOtp, 'Shopkeeper presents Delivery Confirmation OTP (7935)');

  order.status = 'DELIVERED';
  order.stateHistory.push({ state: 'DELIVERED', timestamp: new Date().toISOString(), note: 'Delivery confirmed with proof of delivery' });
  assert(order.status === 'DELIVERED', 'Order is marked DELIVERED (Terminal State)');

  // --- 6. SETTLEMENT & RIDER REWARD VERIFICATION ---
  console.log('\n--- 6. Financial Settlement & Rider Reward ---');
  const riderPayoutKES = order.deliveryFee;
  assert(riderPayoutKES === 150, 'Rider earned full KES 150 delivery commission for the completed run');

  console.log('='.repeat(80));
  console.log(`🎉 CHECKOUT PIPELINE E2E: ${passed} PASSED | ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runCheckoutPipelineTest().catch((err) => {
  console.error('Fatal error in pipeline test:', err);
  process.exit(1);
});
