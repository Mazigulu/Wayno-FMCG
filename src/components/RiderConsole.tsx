import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  KeyRound,
  Compass,
  Store,
  Building,
  DollarSign,
  Package,
  Calendar,
  Check,
  User,
  Radio
} from 'lucide-react';
import { Rider, Order, DeliveryExceptionCode } from '../types/wayno';
import { INITIAL_RIDERS, WHOLESALERS } from '../data/mockData';
import { calculateDistanceKm } from '../services/searchEngine';

export type RiderPage = 'active-run' | 'available-jobs' | 'earnings';

interface RiderConsoleProps {
  orders: Order[];
  onAssignRider: (orderId: string, rider: Rider) => void;
  onUpdateOrderStatus: (orderId: string, nextStatus: any, note: string) => void;
  onCaptureDeliveryException?: (
    orderId: string,
    code: DeliveryExceptionCode,
    reason: string,
    rider: Rider
  ) => void;
}

export const RiderConsole: React.FC<RiderConsoleProps> = ({
  orders,
  onAssignRider,
  onUpdateOrderStatus,
  onCaptureDeliveryException,
}) => {
  const [currentPage, setCurrentPage] = useState<RiderPage>('active-run');
  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);
  const [activeRiderId, setActiveRiderId] = useState<string>(INITIAL_RIDERS[0].id);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Delivery Exception State (FR-FUL-007)
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionCode, setExceptionCode] = useState<DeliveryExceptionCode>('SHOP_CLOSED');
  const [exceptionReason, setExceptionReason] = useState('Duka roller shutter locked; shopkeeper not present');

  const activeRider = riders.find((r) => r.id === activeRiderId) || riders[0];

  // Active run for this rider
  const assignedOrder = orders.find((o) => o.riderId === activeRider.id && o.status !== 'DELIVERED');

  // Orders waiting for a courier in this rider's regional operational radius (max 25km dispatch corridor)
  const readyOrders = orders.filter((o) => {
    if (o.status !== 'READY_FOR_PICKUP') return false;
    const depot = WHOLESALERS.find((w) => w.id === o.wholesalerLocationId);
    if (!depot) return true;
    if (activeRider.currentLat && activeRider.currentLng && depot.latitude && depot.longitude) {
      const distanceToDepot = calculateDistanceKm(
        activeRider.currentLat,
        activeRider.currentLng,
        depot.latitude,
        depot.longitude
      );
      // Courier operational dispatch limit: 25 km from depot loading bay
      return distanceToDepot <= 25.0;
    }
    return true;
  });

  const handleSelfAssign = (order: Order) => {
    onAssignRider(order.id, activeRider);
    setRiders((prev) =>
      prev.map((r) => (r.id === activeRider.id ? { ...r, status: 'EN_ROUTE_PICKUP' } : r))
    );
    setCurrentPage('active-run');
  };

  const handleVerifyPickup = (order: Order) => {
    if (pickupCodeInput.trim() === order.pickupOtp) {
      setVerificationError(null);
      setPickupCodeInput('');
      onUpdateOrderStatus(
        order.id,
        'PICKED_UP',
        `Rider ${activeRider.name} verified pickup OTP ${order.pickupOtp} at wholesale bay`
      );
      // Automatically advance to OUT_FOR_DELIVERY for fast logistics
      setTimeout(() => {
        onUpdateOrderStatus(
          order.id,
          'OUT_FOR_DELIVERY',
          `Rider is en route to ${order.shopName}`
        );
        setRiders((prev) =>
          prev.map((r) => (r.id === activeRider.id ? { ...r, status: 'EN_ROUTE_DELIVERY' } : r))
        );
      }, 800);
    } else {
      setVerificationError(`Invalid Wholesaler Pickup OTP. (Expected: ${order.pickupOtp})`);
    }
  };

  const handleVerifyDelivery = (order: Order) => {
    if (deliveryCodeInput.trim() === order.deliveryOtp) {
      setVerificationError(null);
      setDeliveryCodeInput('');
      onUpdateOrderStatus(
        order.id,
        'DELIVERED',
        `Delivery confirmed by Duka owner via OTP ${order.deliveryOtp}. Proof of delivery recorded.`
      );
      setRiders((prev) =>
        prev.map((r) =>
          r.id === activeRider.id
            ? { ...r, status: 'AVAILABLE', completedTrips: r.completedTrips + 1 }
            : r
        )
      );
      setCurrentPage('earnings');
    } else {
      setVerificationError(`Invalid Duka Delivery OTP. (Expected: ${order.deliveryOtp})`);
    }
  };

  const handleConfirmException = (order: Order) => {
    if (onCaptureDeliveryException) {
      onCaptureDeliveryException(order.id, exceptionCode, exceptionReason, activeRider);
    } else {
      onUpdateOrderStatus(
        order.id,
        'FAILED',
        `Rider ${activeRider.name} reported delivery exception [${exceptionCode}]: ${exceptionReason}`
      );
    }
    setRiders((prev) =>
      prev.map((r) => (r.id === activeRider.id ? { ...r, status: 'AVAILABLE' } : r))
    );
    setIsExceptionModalOpen(false);
  };

  const todayEarnings = activeRider.completedTrips * 150;

  return (
    <div className="space-y-4 pb-20">
      {/* Rider Profile Card & Sub-Navigation Ribbon */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 sm:p-4 text-slate-900 shadow-2xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 min-w-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Bike className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 truncate">{activeRider.name}</h1>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                  ★ {activeRider.rating}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono border border-slate-200 shrink-0">
                  {activeRider.vehiclePlate}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-full">
                {activeRider.vehicleType} · {activeRider.phone} · Duty: {activeRider.status.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 min-w-0 max-w-full sm:max-w-[240px] md:max-w-[280px]">
            <label className="text-[11px] text-slate-500 font-medium hidden sm:inline shrink-0">Switch Account:</label>
            <select
              value={activeRiderId}
              onChange={(e) => setActiveRiderId(e.target.value)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded px-2.5 py-1.5 font-medium focus:border-slate-800 focus:outline-none transition-colors cursor-pointer w-full min-w-0 max-w-full truncate"
            >
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.vehiclePlate}) - {r.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Outlook Secondary Page Tabs Ribbon */}
        <div className="flex items-center space-x-1 pt-2.5 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentPage('active-run')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'active-run'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Active Delivery Mission</span>
            {assignedOrder && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1"></span>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('available-jobs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'available-jobs'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Available Pickups in Zone</span>
            {readyOrders.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                currentPage === 'available-jobs' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
              }`}>
                {readyOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('earnings')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'earnings'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Earnings & Trip History</span>
          </button>
        </div>
      </div>

      {/* Verification Error Alert */}
      {verificationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded flex items-center space-x-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{verificationError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 1: ACTIVE DELIVERY MISSION                                           */}
      {/* ========================================================================= */}
      {currentPage === 'active-run' && (
        <div className="space-y-4">
          {assignedOrder ? (
            <div className="bg-white border border-slate-300 rounded-md p-4 sm:p-5 text-slate-900 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <h2 className="font-bold text-sm text-slate-900">Active Delivery Run: {assignedOrder.id}</h2>
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  {assignedOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Interactive Routing Waypoint Timeline */}
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-2">
                {/* Pickup Node */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                    1
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Step 1: Wholesale Depot Pickup
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{assignedOrder.wholesalerName}</h3>
                    <p className="text-xs text-slate-500">Collect {assignedOrder.items.length} bulk packs</p>

                    {assignedOrder.status === 'RIDER_ASSIGNED' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 max-w-sm">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-700 block">
                            Enter Wholesaler Handover OTP:
                          </label>
                          <button
                            type="button"
                            onClick={() => setPickupCodeInput(assignedOrder.pickupOtp)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 underline font-mono cursor-pointer"
                          >
                            Fill OTP ({assignedOrder.pickupOtp})
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={pickupCodeInput}
                            onChange={(e) => setPickupCodeInput(e.target.value)}
                            placeholder={`Enter code (${assignedOrder.pickupOtp})`}
                            className="bg-white border border-slate-300 focus:border-slate-800 text-slate-900 px-2.5 py-1.5 rounded text-xs font-mono font-medium focus:outline-none flex-1 transition-colors"
                          />
                          <button
                            onClick={() => handleVerifyPickup(assignedOrder)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
                          >
                            Verify Pickup
                          </button>
                        </div>
                      </div>
                    )}

                    {['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(assignedOrder.status) && (
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-medium mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Packs Verified & Secured in Boda Cargo Box</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dropoff Node */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                    2
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                      Step 2: Duka Handover & Proof of Delivery
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{assignedOrder.shopName}</h3>
                    <p className="text-xs text-slate-500">{assignedOrder.shopAddress}</p>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{assignedOrder.retailerPhone}</span>
                    </p>

                    {assignedOrder.status === 'OUT_FOR_DELIVERY' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 max-w-md">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-700 block">
                            Ask Shopkeeper for Delivery Confirmation OTP:
                          </label>
                          <button
                            type="button"
                            onClick={() => setDeliveryCodeInput(assignedOrder.deliveryOtp)}
                            className="text-[11px] text-emerald-700 hover:text-emerald-800 underline font-mono cursor-pointer"
                          >
                            Fill OTP ({assignedOrder.deliveryOtp})
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={deliveryCodeInput}
                            onChange={(e) => setDeliveryCodeInput(e.target.value)}
                            placeholder={`Ask shopkeeper (${assignedOrder.deliveryOtp})`}
                            className="bg-white border border-slate-300 focus:border-slate-800 text-slate-900 px-2.5 py-1.5 rounded text-xs font-mono font-medium focus:outline-none flex-1 transition-colors"
                          />
                          <button
                            onClick={() => handleVerifyDelivery(assignedOrder)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-3 py-1.5 rounded text-xs transition-colors cursor-pointer"
                          >
                            Confirm Delivery
                          </button>
                        </div>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Issue completing run?</span>
                          <button
                            type="button"
                            onClick={() => setIsExceptionModalOpen(true)}
                            className="text-[11px] text-rose-700 hover:text-rose-800 font-medium underline flex items-center space-x-1 cursor-pointer"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Report Delivery Exception (FR-FUL-007)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Payload */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Payload in Transit:</span>
                {assignedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-slate-800 font-medium">
                      {it.quantity}x {it.productName} ({it.packSize})
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      KES {it.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 text-center space-y-3">
                <Bike className="w-8 h-8 text-slate-400 mx-auto" />
                <h2 className="text-sm font-bold text-slate-900">No Active Mission In Flight</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are online and ready for dispatch in Nairobi. {readyOrders.length > 0 ? `${readyOrders.length} wholesale orders are staged and awaiting pickup!` : 'Waiting for incoming wholesaler staging.'}
                </p>
                {readyOrders.length > 0 && (
                  <button
                    onClick={() => setCurrentPage('available-jobs')}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded transition-colors cursor-pointer"
                  >
                    View All Available Jobs ({readyOrders.length})
                  </button>
                )}
              </div>

              {readyOrders.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    <span>Orders Ready for Pickup in Zone</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {readyOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white border border-amber-300 rounded-md p-3.5 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                            + KES 150 Boda Payout
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-slate-800 font-medium">Pickup: {order.wholesalerName}</p>
                          <p className="text-slate-500">Deliver to: {order.shopName} ({order.shopAddress})</p>
                          <p className="text-slate-400 text-[11px]">{order.items.length} items · OTP: {order.pickupOtp}</p>
                        </div>
                        <button
                          onClick={() => handleSelfAssign(order)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 rounded transition-colors cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Claim & Start Pickup</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: AVAILABLE PICKUPS IN ZONE                                         */}
      {/* ========================================================================= */}
      {currentPage === 'available-jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Available Pickups in Zone</h2>
              <p className="text-xs text-slate-500">
                Wholesale depots that have packed and staged orders awaiting rider dispatch.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">
              {readyOrders.length} order(s) open
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-8 text-center space-y-2">
              <Package className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-slate-900 font-semibold text-sm">No pending pickups in your zone right now</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                As soon as retail dukas submit orders and wholesalers click "Ready for Rider", jobs will be listed here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-md p-4 flex flex-col justify-between space-y-3 transition-colors shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                        + KES 150 Payout
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div className="text-slate-700 flex items-center space-x-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">From: {order.wholesalerName}</span>
                      </div>
                      <div className="text-slate-700 flex items-center space-x-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">To: {order.shopName}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] text-slate-600">
                      Items: {order.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelfAssign(order)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Accept Job & Route to Depot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: EARNINGS & TRIP HISTORY                                           */}
      {/* ========================================================================= */}
      {currentPage === 'earnings' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rider Earnings & Trip Ledger</h2>
            <p className="text-xs text-slate-500">
              Completed FMCG delivery runs, M-Pesa B2C instant payouts, and rider telemetry credentials.
            </p>
          </div>

          {/* Earnings Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-md p-4">
              <span className="text-[10px] text-slate-400 font-medium uppercase block">Today's Delivery Payouts</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                KES {todayEarnings.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                {activeRider.completedTrips} trips @ KES 150/drop
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4">
              <span className="text-[10px] text-slate-400 font-medium uppercase block">M-Pesa B2C Settlement</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                Auto Instant
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Direct to {activeRider.phone}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4">
              <span className="text-[10px] text-slate-400 font-medium uppercase block">Safety & SLA Rating</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                ★ {activeRider.rating} / 5.0
              </span>
              <span className="text-[11px] text-emerald-700 mt-1 block font-medium">Verified Helmet & Box</span>
            </div>
          </div>

          {/* Trip History Table */}
          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Delivered Runs Log
              </h3>
            </div>
            <table className="w-full text-left text-xs text-slate-900">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3.5">Run ID</th>
                  <th className="py-2.5 px-3.5">Wholesale Hub</th>
                  <th className="py-2.5 px-3.5">Duka Destination</th>
                  <th className="py-2.5 px-3.5">FMCG Packs</th>
                  <th className="py-2.5 px-3.5">Payout</th>
                  <th className="py-2.5 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">RUN-88120</td>
                  <td className="py-2.5 px-3.5 text-slate-700">Eastleigh Mega Wholesale Depot</td>
                  <td className="py-2.5 px-3.5 text-slate-800 font-medium">Sarah's Baraka Duka</td>
                  <td className="py-2.5 px-3.5 text-slate-500">3 bulk packs</td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">KES 150</td>
                  <td className="py-2.5 px-3.5">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      COMPLETED
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">RUN-77341</td>
                  <td className="py-2.5 px-3.5 text-slate-700">Industrial Area Direct Supply Hub</td>
                  <td className="py-2.5 px-3.5 text-slate-800 font-medium">Kamau General Store</td>
                  <td className="py-2.5 px-3.5 text-slate-500">2 bulk packs</td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">KES 150</td>
                  <td className="py-2.5 px-3.5">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      COMPLETED
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Exception Modal (FR-FUL-007) */}
      {isExceptionModalOpen && assignedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-md w-full max-w-md p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900">Report Delivery Exception (FR-FUL-007)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExceptionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination Duka</span>
                <div className="font-bold text-slate-900">{assignedOrder.shopName}</div>
                <div className="text-slate-500">{assignedOrder.shopAddress}</div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Root Cause Exception Code:
                </label>
                <select
                  value={exceptionCode}
                  onChange={(e) => setExceptionCode(e.target.value as DeliveryExceptionCode)}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs text-slate-900 font-medium"
                >
                  <option value="SHOP_CLOSED">SHOP_CLOSED - Duka is locked/closed upon arrival</option>
                  <option value="RECIPIENT_UNREACHABLE">RECIPIENT_UNREACHABLE - Shopkeeper phone off / no response</option>
                  <option value="DAMAGED_GOODS_REFUSED">DAMAGED_GOODS_REFUSED - Goods damaged or rejected</option>
                  <option value="PAYMENT_DISPUTE">PAYMENT_DISPUTE - Pricing or settlement conflict</option>
                  <option value="WRONG_LOCATION">WRONG_LOCATION - Location incorrect / inaccessible road</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Rider Detailed Field Notes:
                </label>
                <textarea
                  rows={3}
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs text-slate-900"
                  placeholder="Provide explicit context for dispatch and operations auditing..."
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-900 space-y-1">
                <div className="font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Protocol Notice</span>
                </div>
                <p>
                  Submitting this exception marks the delivery attempt as failed. You are instructed to retain the sealed package in your cargo box and return it safely to the originating wholesale depot.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExceptionModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmException(assignedOrder)}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Confirm Exception & Abort Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

