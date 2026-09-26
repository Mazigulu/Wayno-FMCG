import React from 'react';
import { 
  X, 
  Bike, 
  Store, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Phone, 
  Package,
  KeyRound,
  AlertTriangle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { Order, OrderState } from '../types/wayno';

interface OrderTrackingModalProps {
  order: Order | null;
  onClose: () => void;
}

const ORDER_LIFECYCLE_STEPS: { state: OrderState; label: string; desc: string }[] = [
  { state: 'CREATED', label: 'Order Drafted', desc: 'Shopkeeper built basket' },
  { state: 'PAID', label: 'M-Pesa Verified', desc: 'Safaricom Daraja STK receipt logged' },
  { state: 'SUPPLIER_CONFIRMED', label: 'Wholesaler Packing', desc: 'Packs collected from depot shelves' },
  { state: 'READY_FOR_PICKUP', label: 'Staged at Bay', desc: 'Awaiting rider pickup' },
  { state: 'RIDER_ASSIGNED', label: 'Rider Dispatched', desc: 'En route to wholesale depot' },
  { state: 'PICKED_UP', label: 'Picked Up', desc: 'Wholesaler handover code verified' },
  { state: 'OUT_FOR_DELIVERY', label: 'En Route to Duka', desc: 'Final-mile run underway' },
  { state: 'DELIVERED', label: 'Delivered', desc: 'Duka handover OTP verified' },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const getStepIndex = (state: OrderState) => {
    switch (state) {
      case 'CREATED':
      case 'PAYMENT_PENDING':
        return 0;
      case 'PAID':
      case 'FULFILLMENT_PENDING':
      case 'SUPPLIER_PENDING':
        return 1;
      case 'ACCEPTED':
      case 'SUPPLIER_CONFIRMED':
      case 'PREPARING':
      case 'PARTIALLY_FULFILLED':
        return 2;
      case 'READY_FOR_PICKUP':
        return 3;
      case 'RIDER_ASSIGNED':
        return 4;
      case 'PICKED_UP':
        return 5;
      case 'OUT_FOR_DELIVERY':
        return 6;
      case 'DELIVERED':
        return 7;
      case 'CANCELLED':
      case 'FAILED':
      case 'REFUNDED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);
  const isFailedOrCancelled = ['CANCELLED', 'FAILED', 'REFUNDED'].includes(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 animate-in fade-in">
      <div className="bg-white border border-slate-300 rounded-md w-full max-w-lg overflow-hidden shadow-xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-slate-900">Live Order Dispatch Run</h3>
                <span className="font-mono text-xs font-bold text-slate-600">[{order.id}]</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {order.shopName} · {order.wholesalerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* 1. CANCELLED Exceptional State Banner */}
          {order.status === 'CANCELLED' && (
            <div className="bg-slate-100 border border-slate-300 rounded p-3 text-slate-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <XCircle className="w-4 h-4 text-slate-700" />
                <span className="uppercase tracking-wide text-[11px]">Order State: CANCELLED</span>
              </div>
              <p className="text-xs text-slate-600">
                This order was terminated and removed from the active delivery queue.
                {order.stateHistory.find(h => h.state === 'CANCELLED')?.note && (
                  <span className="block font-mono text-[11px] text-slate-700 mt-0.5">
                    Reason: {order.stateHistory.find(h => h.state === 'CANCELLED')?.note}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* 2. FAILED Exceptional State Banner (Without Delivery Exception) */}
          {order.status === 'FAILED' && !order.deliveryException && (
            <div className="bg-rose-50 border border-rose-300 rounded p-3 text-rose-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <span className="uppercase tracking-wide text-[11px]">Order State: FAILED</span>
              </div>
              <p className="text-xs text-rose-700">
                Delivery or fulfillment could not be completed. Pending operational intervention or re-dispatch.
              </p>
            </div>
          )}

          {/* 3. REFUNDED Exceptional State Banner */}
          {order.status === 'REFUNDED' && (
            <div className="bg-purple-50 border border-purple-300 rounded p-3 text-purple-950 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-purple-900">
                <div className="flex items-center space-x-1.5">
                  <RotateCcw className="w-4 h-4 text-purple-700" />
                  <span className="uppercase tracking-wide text-[11px]">Order State: REFUNDED</span>
                </div>
                <span className="font-mono font-bold text-xs text-purple-800">
                  KES {order.totalAmount.toLocaleString()} Reversible
                </span>
              </div>
              <p className="text-xs text-purple-800">
                Payment was refunded back to the retailer via M-Pesa B2C reversal.
              </p>
            </div>
          )}

          {/* 4. PARTIALLY_FULFILLED State Banner */}
          {order.status === 'PARTIALLY_FULFILLED' && (
            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-950 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span className="uppercase tracking-wide text-[11px]">Order State: PARTIALLY FULFILLED</span>
              </div>
              <p className="text-xs text-amber-800">
                Due to stockout constraints at the wholesale depot, some items were substituted or adjusted.
              </p>
            </div>
          )}

          {/* Delivery Exception Alert (FR-FUL-007) */}
          {order.deliveryException && (
            <div className="bg-rose-50 border border-rose-300 rounded p-3 text-rose-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                <span className="font-mono bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded text-[10px]">
                  {order.deliveryException.code}
                </span>
                <span>Delivery Exception Logged</span>
              </div>
              <p className="text-xs">{order.deliveryException.reason}</p>
              <div className="text-[10px] text-rose-700 flex items-center justify-between pt-1 border-t border-rose-200">
                <span>Reported by: {order.deliveryException.reportedByName}</span>
                <span>{new Date(order.deliveryException.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {/* Refund Confirmation Record (FR-FIN-008) */}
          {order.refundRecord && (
            <div className="bg-emerald-50 border border-emerald-300 rounded p-3 text-emerald-900 space-y-1 font-mono">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span>M-PESA REVERSAL COMPLETED</span>
                <span>KES {order.refundRecord.amount.toLocaleString()}</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                Reversal ID: {order.refundRecord.reversalTransactionId}
              </div>
              <div className="text-[10px] text-emerald-700 font-sans">
                Reason: {order.refundRecord.reason} · Handled by: {order.refundRecord.authorizedBy}
              </div>
            </div>
          )}

          {/* Duka Delivery Handover PIN */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded p-3 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-emerald-900 font-bold uppercase tracking-wide block">
                Your Delivery Handover PIN
              </span>
              <p className="text-[11px] text-emerald-800">
                Give this 4-digit PIN to the motorcycle rider when your goods arrive at the duka.
              </p>
            </div>
            <span className="font-mono text-xl font-bold text-emerald-800 bg-white border border-emerald-300 px-3 py-1 rounded shadow-2xs">
              {order.deliveryOtp}
            </span>
          </div>

          {/* Emergency Offline Delivery OTP / USSD Fallback */}
          {order.offlineDeliveryCode && (
            <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Offline USSD Backup PIN</span>
                </span>
                <p className="text-[11px] text-amber-800">
                  If smartphone battery runs out, rider can verify delivery using this offline code:
                </p>
              </div>
              <span className="font-mono text-sm font-bold bg-white px-2 py-1 border border-amber-300 rounded text-amber-900">
                {order.offlineDeliveryCode}
              </span>
            </div>
          )}

          {/* Cargo Payload & Fleet Dispatch Spec */}
          {order.totalWeightKg !== undefined && (
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center space-x-1 font-medium text-slate-700">
                <Bike className="w-3.5 h-3.5 text-slate-600" />
                <span>Cargo Fleet:</span>
                <span className="font-bold text-slate-900">{order.assignedVehicleType || 'BODA_BODA'}</span>
                {order.dispatchSplitsCount && order.dispatchSplitsCount > 1 && (
                  <span className="text-[10px] bg-slate-200 px-1 py-0.2 rounded font-mono">
                    {order.dispatchSplitsCount} split runs
                  </span>
                )}
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {order.totalWeightKg} kg · {order.totalVolumeCbm} m³
              </span>
            </div>
          )}

          {/* Stepper Timeline */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
              10-State Order Life Cycle
            </h4>

            <div className="relative pl-5 border-l-2 border-slate-200 space-y-3.5 my-2">
              {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.state} className="relative">
                    <div
                      className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-slate-900 text-white ring-3 ring-slate-200'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </div>

                    <div>
                      <span
                        className={`font-semibold block text-xs ${
                          isCurrent
                            ? 'text-slate-900 font-bold'
                            : isPassed
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[11px] text-slate-500 block">{step.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
            <span className="font-semibold text-slate-700 block uppercase text-[10px]">
              Procured FMCG Packs
            </span>
            <div className="space-y-1.5 divide-y divide-slate-200">
              {order.items.map((it, idx) => (
                <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-medium text-slate-900">{it.productName}</span>
                      {it.isSubstituted && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 font-semibold px-1 rounded border border-amber-300">
                          SUBSTITUTED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {it.quantity}x {it.packSize}
                    </span>
                    {it.isSubstituted && (
                      <span className="text-[10px] text-amber-800 italic block">
                        Replaced "{it.originalProductName}" ({it.substitutionReason})
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-800 font-medium">
                    KES {it.totalPrice.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Total Paid (via M-Pesa)</span>
              <span className="text-slate-900 font-mono font-bold">KES {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-1.5 rounded text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
