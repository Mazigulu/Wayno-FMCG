import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  X, 
  ExternalLink, 
  Check, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useWayno } from '../../context/WaynoContext';
import { Order } from '../../types/wayno';

interface RetailerNotificationBellProps {
  onOrderClick?: (order: Order) => void;
}

export const RetailerNotificationBell: React.FC<RetailerNotificationBellProps> = ({
  onOrderClick,
}) => {
  const { 
    currentShop, 
    retailerNotifications, 
    dismissRetailerNotification, 
    markRetailerNotificationAsRead, 
    clearAllRetailerNotifications,
    orders 
  } = useWayno();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter notifications for this retailer shop
  const shopNotifs = retailerNotifications.filter(
    (n) => n.retailerId === currentShop.retailerId || n.shopName === currentShop.name
  );

  const unreadCount = shopNotifs.filter((n) => !n.read && !n.dismissed).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
        title="Notifications & Alerts"
        aria-label="Shop notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Shop Alerts & Refunds ({shopNotifs.length})
              </h3>
            </div>
            {shopNotifs.length > 0 && (
              <button
                type="button"
                onClick={clearAllRetailerNotifications}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {shopNotifs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-600">No new alerts</p>
                <p className="text-[11px] text-slate-400">
                  When admin processes an M-Pesa refund or order update, it will appear here.
                </p>
              </div>
            ) : (
              shopNotifs.map((n) => {
                const linkedOrder = orders.find((o) => o.id === n.orderId);
                const isRefund = n.type === 'REFUND_PROCESSED';

                return (
                  <div
                    key={n.id}
                    className={`p-3 transition-colors ${!n.read ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isRefund ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isRefund ? <RotateCcw className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">{n.title}</span>
                            {isRefund && (
                              <span className="font-mono font-bold text-emerald-700 text-xs">
                                +KES {n.amountKES.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] leading-snug">
                            {n.message}
                          </p>
                          {n.mpesaReversalRef && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Ref: <strong className="text-emerald-800">{n.mpesaReversalRef}</strong> · {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          {linkedOrder && onOrderClick && (
                            <button
                              type="button"
                              onClick={() => {
                                markRetailerNotificationAsRead(n.id);
                                setIsOpen(false);
                                onOrderClick(linkedOrder);
                              }}
                              className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer inline-flex items-center space-x-1 pt-1"
                            >
                              <span>View Order Receipt ({n.orderId})</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => dismissRetailerNotification(n.id)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
