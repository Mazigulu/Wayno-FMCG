import React from 'react';
import { 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  X, 
  ExternalLink, 
  Phone, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { useWayno } from '../../context/WaynoContext';
import { Order } from '../../types/wayno';

interface RetailerRefundAlertBannerProps {
  onOrderClick?: (order: Order) => void;
}

export const RetailerRefundAlertBanner: React.FC<RetailerRefundAlertBannerProps> = ({
  onOrderClick,
}) => {
  const { 
    currentShop, 
    retailerNotifications, 
    dismissRetailerNotification, 
    orders 
  } = useWayno();

  // Find all active, un-dismissed refund notifications for this shop
  const activeRefundNotifs = retailerNotifications.filter(
    (n) => 
      (n.retailerId === currentShop.retailerId || n.shopName === currentShop.name) &&
      !n.dismissed &&
      n.type === 'REFUND_PROCESSED'
  );

  if (activeRefundNotifs.length === 0) return null;

  // Show the most recent refund notification
  const latestNotif = activeRefundNotifs[0];
  const linkedOrder = orders.find((o) => o.id === latestNotif.orderId);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-emerald-400/90 rounded-xl p-3.5 sm:p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Decorative background aura */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 relative z-10">
        {/* Left Side: Icon & Content */}
        <div className="flex items-start space-x-3 sm:space-x-3.5 min-w-0">
          {/* Glowing Beacon Icon */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            {/* Live pulsating beacon dot */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          {/* Text Information */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded shadow-2xs">
                M-Pesa Refund Processed
              </span>
              <span className="text-xs font-bold text-emerald-950 font-mono">
                +KES {latestNotif.amountKES.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-800 font-medium">
                credited directly to {latestNotif.recipientPhone}
              </span>
            </div>

            <p className="text-xs text-slate-800 leading-snug">
              Admin has verified and approved your refund for Order <strong className="font-mono text-slate-950">{latestNotif.orderId}</strong>. Funds have been reversed via Safaricom Daraja B2C.
            </p>

            <div className="flex items-center space-x-2 text-[11px] text-slate-600 pt-0.5 flex-wrap gap-y-1">
              <span>
                Safaricom Reversal Ref: <strong className="font-mono text-emerald-800 font-bold">{latestNotif.mpesaReversalRef}</strong>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-700 italic">
                Reason: "{latestNotif.reason}"
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons & Dismiss */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
          {linkedOrder && onOrderClick && (
            <button
              type="button"
              onClick={() => onOrderClick(linkedOrder)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-white" />
              <span>View Order Receipt</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => dismissRetailerNotification(latestNotif.id)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeRefundNotifs.length > 1 && (
        <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px] text-emerald-800">
          <span>You have {activeRefundNotifs.length - 1} more processed refund alert(s) in your notification inbox.</span>
        </div>
      )}
    </div>
  );
};
