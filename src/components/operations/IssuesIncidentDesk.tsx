import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Bike, 
  Search, 
  Filter, 
  DollarSign, 
  ShieldAlert, 
  Clock, 
  FileText,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { Order, Rider, OrderState, DeliveryException } from '../../types/wayno';
import { INITIAL_RIDERS } from '../../data/mockData';

interface IssuesIncidentDeskProps {
  orders: Order[];
  onInitiateRefund?: (orderId: string, reason: string) => void;
  onReassignRider?: (orderId: string, newRider: Rider, reason: string) => void;
  onManualOverrideStatus?: (orderId: string, newState: OrderState, note: string) => void;
}

export const IssuesIncidentDesk: React.FC<IssuesIncidentDeskProps> = ({
  orders,
  onInitiateRefund,
  onReassignRider,
  onManualOverrideStatus,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  // Collect all orders with exceptions, failed, or refunded status, plus mock edge cases
  const exceptionOrders = orders.filter(o => 
    o.deliveryException || 
    o.status === 'FAILED' || 
    o.status === 'CANCELLED' ||
    o.status === 'REFUNDED' ||
    o.status === 'PARTIALLY_FULFILLED' ||
    o.refundRecord
  );

  // If no live exception exists, provide comprehensive operational incidents showcasing all 4 exceptional states
  const displayIncidents: Order[] = exceptionOrders.length > 0 ? exceptionOrders : [
    {
      ...orders[0],
      id: 'ORD-NBO-8921-EX1',
      status: 'FAILED' as OrderState,
      deliveryException: {
        code: 'DAMAGED_GOODS_REFUSED',
        reason: 'Carton of Pembe wheat flour had ripped seal upon arrival. Shopkeeper refused acceptance.',
        timestamp: '14:22:10',
        reportedByRiderId: 'RDR-001',
        reportedByRiderName: 'Juma Mwangi',
      },
    },
    {
      ...(orders[1] || orders[0]),
      id: 'ORD-NBO-8922-EX2',
      status: 'CANCELLED' as OrderState,
      deliveryException: {
        code: 'SHOP_CLOSED',
        reason: 'Mama Sarah Provision Duka was shuttered for lunch prayer. 3 phone calls went unanswered; auto-cancelled by ops.',
        timestamp: '13:05:40',
        reportedByRiderId: 'RDR-002',
        reportedByRiderName: 'Kevin Otieno',
      },
    },
    {
      ...(orders[2] || orders[0]),
      id: 'ORD-NBO-8923-EX3',
      status: 'REFUNDED' as OrderState,
      refundRecord: {
        refundId: 'ref_8923',
        amount: 2450,
        reason: 'Duplicate payment callback resolution. Customer credited via Daraja B2C.',
        initiatedAt: '2025-01-20T12:08:12Z',
        completedAt: '2025-01-20T12:10:00Z',
        mpesaReversalRef: 'QHK88912KL',
        status: 'COMPLETED',
      },
      deliveryException: {
        code: 'PAYMENT_DISPUTE',
        reason: 'Customer charged twice on network latency; automated Daraja reversal completed.',
        timestamp: '12:08:12',
        reportedByRiderId: 'SYSTEM',
        reportedByRiderName: 'Daraja Gateway',
      },
    },
    {
      ...(orders[3] || orders[0]),
      id: 'ORD-NBO-8924-EX4',
      status: 'PARTIALLY_FULFILLED' as OrderState,
      deliveryException: {
        code: 'DAMAGED_GOODS_REFUSED',
        reason: '1 of 3 cases of cooking oil was unsealed. 2 accepted, 1 returned to depot with partial credit note.',
        timestamp: '10:30:15',
        reportedByRiderId: 'RDR-003',
        reportedByRiderName: 'Dennis Kipchoge',
      },
    },
  ];

  const filteredIncidents = displayIncidents.filter(order => {
    const code = order.deliveryException?.code || 'GENERAL_EXCEPTION';
    const matchesType = 
      filterType === 'ALL' || 
      code === filterType || 
      order.status === filterType;
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.deliveryException?.reason && order.deliveryException.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  const handleResolveIncident = (orderId: string, resolutionAction: string) => {
    setResolvedIds(prev => [...prev, orderId]);
    if (onManualOverrideStatus) {
      onManualOverrideStatus(orderId, 'CANCELLED', `Resolved via Incident Desk: ${resolutionAction}`);
    }
  };

  const handleRefund = (order: Order) => {
    if (onInitiateRefund) {
      onInitiateRefund(order.id, `Incident Resolution: ${order.deliveryException?.code || 'Field Exception'}`);
      setResolvedIds(prev => [...prev, order.id]);
    }
  };

  const handleRiderRetry = (order: Order) => {
    if (onReassignRider) {
      const backupRider = INITIAL_RIDERS.find(r => r.status === 'AVAILABLE') || INITIAL_RIDERS[0];
      onReassignRider(order.id, backupRider, `Priority re-attempt following ${order.deliveryException?.code || 'delivery exception'}`);
      setResolvedIds(prev => [...prev, order.id]);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Incident Tickets</span>
          <span className="text-base font-bold text-rose-800 font-mono">
            {displayIncidents.filter(i => !resolvedIds.includes(i.id)).length} Unresolved
          </span>
          <span className="text-[10px] text-rose-700 block font-medium">Requires ops action</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Damage Claim Rate</span>
          <span className="text-base font-bold text-slate-900 font-mono">0.18% of GMV</span>
          <span className="text-[10px] text-emerald-700 block font-medium">Within 0.5% threshold</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">First-Contact Resolution</span>
          <span className="text-base font-bold text-emerald-800 font-mono">92.4%</span>
          <span className="text-[10px] text-slate-500 block">Sub-10 min turnaround</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Reversal SLA</span>
          <span className="text-base font-bold text-slate-900 font-mono">&lt; 3 Minutes</span>
          <span className="text-[10px] text-slate-500 block">Automated Daraja B2C</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Operational Issues & Delivery Exceptions Desk</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Triage and resolve field exceptions, closed dukas, damaged goods rejections, and initiate instant M-Pesa reversals.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, order, or reason..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-60"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Incidents & States</option>
              <optgroup label="Exceptional Order States">
                <option value="CANCELLED">CANCELLED</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
                <option value="PARTIALLY_FULFILLED">PARTIALLY_FULFILLED</option>
              </optgroup>
              <optgroup label="Delivery Exceptions">
                <option value="DAMAGED_GOODS_REFUSED">Damaged Goods Refused</option>
                <option value="SHOP_CLOSED">Shop Shuttered / Closed</option>
                <option value="RECIPIENT_UNREACHABLE">Recipient Unreachable</option>
                <option value="WRONG_LOCATION">Wrong Location / Geofence</option>
                <option value="PAYMENT_DISPUTE">Payment Dispute</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Retail Duka</th>
                <th className="py-2.5 px-3">Exception Classification</th>
                <th className="py-2.5 px-3">Rider Field Notes</th>
                <th className="py-2.5 px-3">Claim Amount</th>
                <th className="py-2.5 px-3">Resolution State</th>
                <th className="py-2.5 px-3 text-right">Intervention Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.map(order => {
                const isResolved = resolvedIds.includes(order.id) || order.status === 'REFUNDED';
                const ex: DeliveryException = order.deliveryException || {
                  code: 'WRONG_LOCATION',
                  reason: 'Order required manual operator intervention during dispatch.',
                  timestamp: '12:00:00',
                  reportedByRiderId: 'SYSTEM',
                  reportedByRiderName: 'Dispatch Radar'
                };

                const getStatusBadge = (st: OrderState) => {
                  switch (st) {
                    case 'CANCELLED':
                      return 'bg-slate-100 text-slate-800 border-slate-300';
                    case 'FAILED':
                      return 'bg-rose-100 text-rose-800 border-rose-200';
                    case 'REFUNDED':
                      return 'bg-purple-100 text-purple-800 border-purple-200';
                    case 'PARTIALLY_FULFILLED':
                      return 'bg-amber-100 text-amber-800 border-amber-200';
                    default:
                      return 'bg-blue-100 text-blue-800 border-blue-200';
                  }
                };

                return (
                  <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${isResolved ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {order.id}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border inline-block ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block">{order.shopName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{order.shopOwnerPhone}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 block max-w-fit">
                        {ex.code}
                      </span>
                      <span className="text-[11px] text-slate-700 block mt-1 line-clamp-2 max-w-xs">
                        {ex.reason}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 max-w-xs">
                        <span className="text-[9px] text-slate-400 block font-mono">
                          Recorded at {ex.timestamp} • Rider: {ex.reportedByRiderName}
                        </span>
                        <span>"{ex.reason}"</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      KES {order.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isResolved
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{isResolved ? 'RESOLVED' : 'ACTION_REQUIRED'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {!isResolved ? (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleRefund(order)}
                            className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded transition-colors cursor-pointer"
                            title="Authorize full reversal to duka M-Pesa"
                          >
                            Reversal
                          </button>
                          <button
                            onClick={() => handleRiderRetry(order)}
                            className="text-[10px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded transition-colors cursor-pointer"
                            title="Reassign to backup priority courier"
                          >
                            Retry Rider
                          </button>
                          <button
                            onClick={() => handleResolveIncident(order.id, 'Operator manual audit confirmation')}
                            className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded transition-colors cursor-pointer"
                            title="Mark resolved"
                          >
                            Close
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Case Closed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
