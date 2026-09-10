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
  KeyRound
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
        return 1;
      case 'SUPPLIER_CONFIRMED':
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
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

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
          {/* OTP Box */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-medium block">
                Wholesaler Pickup OTP
              </span>
              <span className="font-mono text-base font-bold text-slate-900">
                {order.pickupOtp}
              </span>
              <span className="text-[10px] text-slate-500 block">Checked at depot bay</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-medium block">
                Your Delivery Proof OTP
              </span>
              <span className="font-mono text-base font-bold text-emerald-700">
                {order.deliveryOtp}
              </span>
              <span className="text-[10px] text-slate-500 block">Give to rider on arrival</span>
            </div>
          </div>

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
                <div key={idx} className="pt-1.5 first:pt-0 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-slate-900 block">{it.productName}</span>
                    <span className="text-[10px] text-slate-500">
                      {it.quantity}x {it.packSize}
                    </span>
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
