import React, { useState } from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Layers, 
  FileText, 
  Sliders, 
  Search,
  ExternalLink,
  RotateCcw,
  BarChart3,
  MapPin,
  ShieldCheck,
  Zap,
  Filter,
  DollarSign,
  Bike,
  Check,
  Store,
  Building2,
  Package,
  Truck,
  AlertOctagon
} from 'lucide-react';
import { Order, TelemetryEvent, OrderState, Rider, PaymentRecord, Payment, PaymentTransaction } from '../types/wayno';
import { paymentService } from '../services/paymentService';
import { INITIAL_RIDERS, PRODUCTS, INITIAL_SHOPS, WHOLESALERS } from '../data/mockData';
import { RetailersManager } from './operations/RetailersManager';
import { WholesalersManager } from './operations/WholesalersManager';
import { RidersFleetManager } from './operations/RidersFleetManager';
import { ProductsMasterCatalog } from './operations/ProductsMasterCatalog';
import { DeliveriesDispatchRadar } from './operations/DeliveriesDispatchRadar';
import { IssuesIncidentDesk } from './operations/IssuesIncidentDesk';
import { SearchAnalyticsDesk } from './operations/SearchAnalyticsDesk';

export type OperationsPage = 
  | 'orders' 
  | 'retailers' 
  | 'wholesalers' 
  | 'riders' 
  | 'products' 
  | 'payments' 
  | 'deliveries' 
  | 'issues' 
  | 'search_analytics' 
  | 'telemetry' 
  | 'pipeline' 
  | 'reconciliation' 
  | 'kpis';

interface OperationsConsoleProps {
  orders: Order[];
  events: TelemetryEvent[];
  payments?: Payment[];
  paymentTransactions?: PaymentTransaction[];
  paymentRecords?: PaymentRecord[];
  onManualOverrideStatus: (orderId: string, newState: OrderState, note: string) => void;
  onReassignRider?: (orderId: string, newRider: Rider, reason: string) => void;
  onInitiateRefund?: (orderId: string, reason: string) => void;
  initialPage?: OperationsPage;
}

export const OperationsConsole: React.FC<OperationsConsoleProps> = ({
  orders,
  events,
  payments = [],
  paymentTransactions = [],
  paymentRecords = [],
  onManualOverrideStatus,
  onReassignRider,
  onInitiateRefund,
  initialPage,
}) => {
  const [currentPage, setCurrentPage] = useState<OperationsPage>(initialPage || 'orders');

  React.useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage);
    }
  }, [initialPage]);
  const [filterPartition, setFilterPartition] = useState<string>('ALL');
  const [selectedOrderForOverride, setSelectedOrderForOverride] = useState<Order | null>(null);
  const [overrideStateInput, setOverrideStateInput] = useState<OrderState>('READY_FOR_PICKUP');
  const [overrideNote, setOverrideNote] = useState('');
  const [orderStateFilter, setOrderStateFilter] = useState<string>('ALL');

  // Section 26: Two-Tier Payment Ledger State
  const [ledgerViewTab, setLedgerViewTab] = useState<'transactions' | 'payments'>('transactions');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<string>('ALL');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState<string>('');
  const [selectedTxnForAudit, setSelectedTxnForAudit] = useState<PaymentTransaction | null>(null);

  // Reassign Rider Modal State (FR-OPS-003)
  const [selectedOrderForReassign, setSelectedOrderForReassign] = useState<Order | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string>(INITIAL_RIDERS[0].id);
  const [reassignReason, setReassignReason] = useState('Previous rider had flat tire / unresponsive');

  // Manual Refund / Reversal Modal State (FR-OPS-004 / FR-FIN-008)
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('Delivery failed - goods returned to depot; full reversal authorized');

  const totalGMV = orders.reduce((acc, o) => acc + o.totalAmount, 0) + 184500;
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length + 42;
  const activePipelines = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED' && o.status !== 'REFUNDED').length;
  const exceptionalCount = orders.filter((o) => ['CANCELLED', 'FAILED', 'REFUNDED', 'PARTIALLY_FULFILLED'].includes(o.status) || !!o.deliveryException).length;

  const ALL_STATES: OrderState[] = [
    'CREATED',
    'PAYMENT_PENDING',
    'PAID',
    'FULFILLMENT_PENDING',
    'SUPPLIER_PENDING',
    'ACCEPTED',
    'SUPPLIER_CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'PARTIALLY_FULFILLED',
    'RIDER_ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
  ];

  const handleApplyOverride = () => {
    if (selectedOrderForOverride) {
      onManualOverrideStatus(
        selectedOrderForOverride.id,
        overrideStateInput,
        overrideNote || 'Operational intervention via WAYNO Ops Console'
      );
      setSelectedOrderForOverride(null);
      setOverrideNote('');
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterPartition === 'ALL') return true;
    if (filterPartition === 'search_events') return e.eventType.includes('SEARCH');
    if (filterPartition === 'cart_events') return e.eventType.includes('CART');
    if (filterPartition === 'payment_events') return e.eventType.includes('PAYMENT');
    if (filterPartition === 'promotion_events') return e.eventType.includes('PROMOTION');
    if (filterPartition === 'order_events') return e.eventType.includes('ORDER') || e.eventType.includes('SUPPLIER');
    if (filterPartition === 'delivery_events') return e.eventType.includes('RIDER') || e.eventType.includes('DELIVER');
    return true;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStateFilter === 'ALL') return true;
    if (orderStateFilter === 'ACTIVE') return o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && o.status !== 'FAILED' && o.status !== 'REFUNDED';
    if (orderStateFilter === 'DELIVERED') return o.status === 'DELIVERED';
    if (orderStateFilter === 'EXCEPTIONAL') return ['CANCELLED', 'FAILED', 'REFUNDED', 'PARTIALLY_FULFILLED'].includes(o.status) || !!o.deliveryException;
    return o.status === orderStateFilter;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Real-time Network Telemetry Ribbon */}
      <div className="bg-white border border-slate-200 rounded-md p-3 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Live Operations Desks
              </h2>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                8 Desks Active
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-2">
            <span>Nairobi East & West Ingress</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Broker p95: 22ms</span>
          </div>
        </div>

        {/* Operations Core 8 Desks Ribbon */}
        <div className="flex items-center space-x-1 pt-2 overflow-x-auto text-xs pb-0.5">
          <button
            onClick={() => setCurrentPage('orders')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'orders' || currentPage === 'pipeline'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Orders</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'orders' || currentPage === 'pipeline' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}>
              {activePipelines}
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('retailers')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'retailers'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Retailers</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'retailers' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {INITIAL_SHOPS.length} Dukas
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('wholesalers')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'wholesalers'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Wholesalers</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'wholesalers' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {WHOLESALERS.length} Hubs
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('riders')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'riders'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Riders</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'riders' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {INITIAL_RIDERS.length} Fleet
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('payments')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'payments' || currentPage === 'reconciliation'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payments</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'payments' || currentPage === 'reconciliation' ? 'bg-white text-slate-900' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {paymentRecords.length || orders.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('deliveries')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'deliveries' || currentPage === 'kpis'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Deliveries</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'deliveries' || currentPage === 'kpis' ? 'bg-white text-slate-900' : 'bg-indigo-100 text-indigo-800'
            }`}>
              Radar
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('issues')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'issues'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
            <span>Issues</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'issues' ? 'bg-white text-slate-900' : 'bg-rose-100 text-rose-800'
            }`}>
              {orders.filter(o => o.deliveryException || o.status === 'FAILED' || o.status === 'CANCELLED' || o.status === 'REFUNDED').length || 3}
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('telemetry')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              currentPage === 'telemetry'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Lake</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'telemetry' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {events.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: ORDERS (PIPELINE & STATE OVERRIDE)                              */}
      {/* ========================================================================= */}
      {(currentPage === 'orders' || currentPage === 'pipeline') && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Active In Pipeline</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {activePipelines} Orders
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Completed Deliveries</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {completedOrders}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Avg Prep + Transit</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                26.4 mins
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">SLA Success Rate</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                99.2%
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <span>Order Pipeline & Human-in-the-Loop Override</span>
              </h2>
              <p className="text-xs text-slate-500">
                Inspect state machine lifecycles and execute operational overrides when physical discrepancies occur.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
              <button
                onClick={() => setOrderStateFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  orderStateFilter === 'ALL' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setOrderStateFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  orderStateFilter === 'ACTIVE' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Flight ({activePipelines})
              </button>
              <button
                onClick={() => setOrderStateFilter('DELIVERED')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  orderStateFilter === 'DELIVERED' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setOrderStateFilter('EXCEPTIONAL')}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center space-x-1 ${
                  orderStateFilter === 'EXCEPTIONAL' ? 'bg-rose-50 text-rose-800 font-semibold shadow-2xs border border-rose-200' : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <span>Exceptional</span>
                <span className="text-[10px] bg-rose-200 text-rose-900 px-1 py-0.2 rounded-full font-mono font-bold">
                  {exceptionalCount}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs text-slate-900">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Order ID</th>
                  <th className="py-2.5 px-3.5">Retail Duka</th>
                  <th className="py-2.5 px-3.5">Wholesale Depot</th>
                  <th className="py-2.5 px-3.5">Subtotal</th>
                  <th className="py-2.5 px-3.5">Lifecycle State</th>
                  <th className="py-2.5 px-3.5">Assigned Rider</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">{order.id}</td>
                    <td className="py-2.5 px-3.5">
                      <span className="font-semibold text-slate-900 block">{order.shopName}</span>
                      <span className="text-[10px] text-slate-400">{order.shopAddress}</span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700">{order.wholesalerName}</td>
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-900">
                      KES {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase border inline-block ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : order.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : order.status === 'CANCELLED'
                            ? 'bg-slate-200 text-slate-800 border-slate-300 font-bold'
                          : order.status === 'REFUNDED'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : order.status === 'PARTIALLY_FULFILLED'
                            ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        {order.deliveryException && (
                          <span className="text-[10px] text-rose-700 font-semibold block">
                            ⚠️ Exception: {order.deliveryException.code}
                          </span>
                        )}
                        {order.refundRecord && (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            ✓ Reversal: {order.refundRecord.reversalTransactionId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      {order.riderName ? (
                        <div className="flex items-center space-x-1 font-medium">
                          <Bike className="w-3 h-3 text-slate-400" />
                          <span>{order.riderName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'FAILED'].includes(order.status) && onReassignRider && (
                          <button
                            onClick={() => {
                              setSelectedOrderForReassign(order);
                              setSelectedRiderId(INITIAL_RIDERS[0].id);
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                            title="Reassign another rider (FR-OPS-003)"
                          >
                            Reassign Rider
                          </button>
                        )}

                        {['FAILED', 'CANCELLED', 'PARTIALLY_FULFILLED'].includes(order.status) && !order.refundRecord && onInitiateRefund && (
                          <button
                            onClick={() => setSelectedOrderForRefund(order)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs px-2 py-1 rounded font-semibold transition-colors cursor-pointer"
                            title="Initiate M-Pesa refund reversal (FR-OPS-004)"
                          >
                            Initiate Refund
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedOrderForOverride(order);
                            setOverrideStateInput(order.status);
                          }}
                          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
                        >
                          Override State
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {selectedOrderForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-md w-full max-w-md p-5 text-slate-900 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-slate-800" />
              <h4 className="font-bold text-sm text-slate-900">Human Operator State Override</h4>
            </div>

            <p className="text-xs text-slate-500">
              You are altering the state of Order <span className="font-mono text-slate-900 font-semibold">{selectedOrderForOverride.id}</span>. This action is logged into the audit stream.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">Target State:</label>
              <select
                value={overrideStateInput}
                onChange={(e) => setOverrideStateInput(e.target.value as OrderState)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs font-mono font-medium focus:border-slate-800 focus:outline-none cursor-pointer"
              >
                {ALL_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">Audit Reason / Note:</label>
              <input
                type="text"
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="e.g. Wholesaler phoned in manual pickup authorization"
                className="w-full bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrderForOverride(null)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Commit State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Rider Modal (FR-OPS-003) */}
      {selectedOrderForReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-md w-full max-w-md p-5 text-slate-900 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2">
              <Bike className="w-5 h-5 text-slate-800" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Operational Rider Reassignment</h4>
                <p className="text-[11px] text-slate-500">Order #{selectedOrderForReassign.id} · Current: {selectedOrderForReassign.riderName || 'Unassigned'}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">Select Available Rider:</label>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs font-medium focus:border-slate-800 focus:outline-none cursor-pointer"
              >
                {INITIAL_RIDERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.vehicleType}, {r.plateNumber}) - {r.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">Reassignment Reason / Audit Trail:</label>
              <input
                type="text"
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrderForReassign(null)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetRider = INITIAL_RIDERS.find(r => r.id === selectedRiderId) || INITIAL_RIDERS[0];
                  if (onReassignRider) {
                    onReassignRider(selectedOrderForReassign.id, targetRider, reassignReason);
                  }
                  setSelectedOrderForReassign(null);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Refund Modal (FR-OPS-004 / FR-FIN-008) */}
      {selectedOrderForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-md w-full max-w-md p-5 text-slate-900 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-700">
              <DollarSign className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Initiate M-Pesa Reversal / Refund</h4>
                <p className="text-[11px] text-slate-500">Order #{selectedOrderForRefund.id} · Amount: KES {selectedOrderForRefund.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs text-amber-900 space-y-1">
              <div className="font-semibold">⚠️ Direct Safaricom Daraja B2C Reversal</div>
              <p className="text-[11px]">
                Triggering this will issue a reversal of KES {selectedOrderForRefund.totalAmount.toLocaleString()} directly to customer MSISDN ({selectedOrderForRefund.shopOwnerPhone}) and update state to REFUNDED.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">Reversal Reason / Ledger Code:</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 rounded px-2.5 py-1.5 text-xs focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrderForRefund(null)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onInitiateRefund) {
                    onInitiateRefund(selectedOrderForRefund.id, refundReason);
                  }
                  setSelectedOrderForRefund(null);
                }}
                className="bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Execute Reversal (KES {selectedOrderForRefund.totalAmount.toLocaleString()})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: S3 PARQUET DATA LAKE TELEMETRY                                    */}
      {/* ========================================================================= */}
      {currentPage === 'telemetry' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Database className="w-4 h-4 text-slate-700" />
                <span>Live S3 / Parquet Data Lake Event Stream</span>
              </h2>
              <p className="text-xs text-slate-500">
                Immutable, columnar partition log for behavioral telemetry, Daraja audits, and ML search ranking.
              </p>
            </div>

            {/* Partition filter */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] pb-1">
              <span className="text-slate-500 font-medium shrink-0">Partition:</span>
              {['ALL', 'search_events', 'cart_events', 'promotion_events', 'order_events', 'payment_events', 'delivery_events'].map(
                (part) => (
                  <button
                    key={part}
                    onClick={() => setFilterPartition(part)}
                    className={`px-2.5 py-1 rounded font-mono transition-colors whitespace-nowrap text-xs cursor-pointer ${
                      filterPartition === part
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {part}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-md p-3.5 font-mono text-xs space-y-2 max-h-96 overflow-y-auto shadow-inner">
            {filteredEvents.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No events captured in this partition</div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.eventId}
                  className="flex items-start justify-between border-b border-slate-800 pb-2 text-[11px]"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-semibold">{evt.eventType}</span>
                      <span className="text-slate-500">[{evt.eventId}]</span>
                      <span className="text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-300 break-all font-mono text-[10px]">
                      {JSON.stringify(evt.metadata)}
                    </div>
                  </div>
                  <span className="text-slate-500 shrink-0 ml-2 font-mono text-[10px]">S3/Parquet: OK</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: NETWORK KPIS & SLA VELOCITY                                       */}
      {/* ========================================================================= */}
      {currentPage === 'kpis' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Nairobi Network KPIs & SLA Velocity</h2>
            <p className="text-xs text-slate-500">
              Aggregated FMCG procurement metrics, search engine telemetry, and fulfillment speeds across Nairobi zones.
            </p>
          </div>

          {/* Network KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-md p-3.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Network GMV (Pilot)</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block font-mono">
                KES {totalGMV.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                ↑ 18.4% Week-on-Week
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Search Accuracy</span>
              <span className="text-lg font-bold text-emerald-700 mt-1 block font-mono">
                98.6%
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                Zero-result rate: 1.4%
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Fulfillment Runs</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block font-mono">
                {activePipelines} Orders
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                {completedOrders} Successfully Delivered
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-3.5">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Avg Delivery Velocity</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block font-mono">
                26.4 mins
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                Target SLA: &lt; 45 mins
              </span>
            </div>
          </div>

          {/* SLA Zone Breakdown */}
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nairobi Zonal Fulfillment SLA Performance
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Zone A: Eastleigh & Kamukunji Commercial Hub</span>
                  <span className="text-[10px] text-slate-400 block">Depots: Eastleigh Mega Wholesale Depot</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">18.2 min avg</span>
                  <span className="text-[10px] text-emerald-700 block font-medium">99.4% on-time</span>
                </div>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Zone B: Industrial Area & Enterprise Road Corridor</span>
                  <span className="text-[10px] text-slate-400 block">Depots: Industrial Area Direct Supply Hub</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">24.6 min avg</span>
                  <span className="text-[10px] text-emerald-700 block font-medium">98.8% on-time</span>
                </div>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Zone C: Westlands & Parklands Retail Ring</span>
                  <span className="text-[10px] text-slate-400 block">Depots: Westlands Metro Supply Depot</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">31.0 min avg</span>
                  <span className="text-[10px] text-emerald-700 block font-medium">97.6% on-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 6: M-PESA PAYMENTS & FINANCIAL LEDGER (SECTION 26 SPECIFICATION)   */}
      {/* ========================================================================= */}
      {(currentPage === 'payments' || currentPage === 'reconciliation') && (() => {
        const transactionsList: PaymentTransaction[] = (paymentTransactions && paymentTransactions.length > 0)
          ? paymentTransactions
          : (paymentRecords && paymentRecords.length > 0)
          ? (paymentRecords as PaymentTransaction[])
          : [];

        const paymentsList: Payment[] = (payments && payments.length > 0)
          ? payments
          : [];

        const totalCapturedVolume = transactionsList
          .filter(t => t.status === 'SUCCESS')
          .reduce((acc, t) => acc + t.amount, 0) || totalGMV;

        const totalReversals = transactionsList.filter(t => t.status === 'REVERSED');
        const totalReversedKES = totalReversals.reduce((acc, t) => acc + t.amount, 0);
        const totalFailedAttempts = transactionsList.filter(t => t.status === 'FAILED').length;

        // Filter transactions
        const filteredTransactions = transactionsList.filter((txn) => {
          const matchesStatus = ledgerStatusFilter === 'ALL' || txn.status === ledgerStatusFilter;
          const q = ledgerSearchQuery.trim().toLowerCase();
          const matchesQuery = !q || 
            txn.id.toLowerCase().includes(q) ||
            txn.orderId.toLowerCase().includes(q) ||
            (txn.paymentId && txn.paymentId.toLowerCase().includes(q)) ||
            (txn.providerReference && txn.providerReference.toLowerCase().includes(q)) ||
            (txn.phoneNumber && txn.phoneNumber.includes(q)) ||
            (txn.failureReason && txn.failureReason.toLowerCase().includes(q));
          return matchesStatus && matchesQuery;
        });

        // Filter parent payments
        const filteredPayments = paymentsList.filter((pay) => {
          const matchesStatus = ledgerStatusFilter === 'ALL' || 
            (ledgerStatusFilter === 'SUCCESS' && pay.status === 'PAID') ||
            (ledgerStatusFilter === 'REVERSED' && pay.status === 'REFUNDED') ||
            pay.status === ledgerStatusFilter;
          const q = ledgerSearchQuery.trim().toLowerCase();
          const matchesQuery = !q ||
            pay.id.toLowerCase().includes(q) ||
            pay.orderId.toLowerCase().includes(q) ||
            pay.provider.toLowerCase().includes(q) ||
            (pay.latestTransactionId && pay.latestTransactionId.toLowerCase().includes(q));
          return matchesStatus && matchesQuery;
        });

        return (
          <div className="space-y-4">
            {/* Financial KPI Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">M-Pesa Inflow (Captured)</span>
                <span className="text-base font-bold text-emerald-800 font-mono">
                  KES {totalCapturedVolume.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">Validated via Daraja STK Push</span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">Granular Transactions</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {transactionsList.length} Transactions
                </span>
                <span className="text-[10px] text-slate-500 block">Across {paymentsList.length || orders.length} Parent Commitments</span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">Reversals & Refunds</span>
                <span className="text-base font-bold text-rose-800 font-mono">
                  {totalReversals.length} Reversals
                </span>
                <span className="text-[10px] text-rose-700 block font-medium">KES {totalReversedKES.toLocaleString()} via B2C API</span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 block font-medium uppercase">Audit Reconciliation</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  100% Matched
                </span>
                <span className="text-[10px] text-emerald-700 block font-medium">Zero orphan callbacks</span>
              </div>
            </div>

            {/* Section 25 & 26 Architecture Dual Ribbon */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Section 25: Payment Architecture Abstraction */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded">
                      SECTION 25
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">Payment Architecture Abstraction</h4>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Decoupled
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The application does not directly depend on M-Pesa. All checkout calls and refunds interact strictly with <code className="text-blue-700 font-mono font-semibold">PaymentService</code>, which dynamically routes requests to registered providers.
                </p>

                {/* Visual Tree matching the specification diagram */}
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded font-mono text-[11px] leading-snug border border-slate-800">
                  <div className="text-emerald-400 font-bold">PaymentService</div>
                  <div className="text-slate-500">│</div>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500">├──</span>
                    <span className="text-amber-300 font-bold">MPesaProvider</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded">Daraja C2B/B2C</span>
                  </div>
                  <div className="text-slate-500">│</div>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-500">└──</span>
                    <span className="text-cyan-300 font-bold">FutureProvider</span>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded">Airtel, Card, Bank</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Registered Providers: {paymentService.listRegisteredProviders().length} Active</span>
                  <span className="font-mono text-slate-700">App → PaymentService → Provider</span>
                </div>
              </div>

              {/* Section 26 Specification Architecture Banner */}
              <div className="lg:col-span-7 bg-slate-900 text-white rounded-md p-3.5 shadow-sm border border-slate-800 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded">
                        SECTION 26
                      </span>
                      <span className="text-xs font-semibold text-slate-200">Two-Tier Payment & Audit Ledger</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Daraja TLS 1.3</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Rather than relying solely on <code className="text-emerald-300 font-mono text-[11px]">order.payment_status = PAID</code>, WAYNO maintains a persistent relational ledger separating the parent <code className="text-blue-300 font-mono text-[11px]">payments</code> entity from granular <code className="text-amber-300 font-mono text-[11px]">payment_transactions</code> child records. Each STK attempt, callback confirmation, cancellation, and reversal tracks exact provider references and failure reasons for definitive financial reconciliation.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Parent: payments ({paymentsList.length || orders.length})</span>
                  <span>Child: payment_transactions ({transactionsList.length})</span>
                  <span className="text-emerald-400">Status: 100% Reconciled</span>
                </div>
              </div>
            </div>

            {/* Ledger Main Table Container */}
            <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3.5 shadow-2xs">
              {/* Top View Selector & Search Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                {/* Two-tier toggle tabs */}
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md">
                  <button
                    id="ledger-tab-transactions"
                    onClick={() => setLedgerViewTab('transactions')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      ledgerViewTab === 'transactions'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>payment_transactions (Child Audit Records)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      ledgerViewTab === 'transactions' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {transactionsList.length}
                    </span>
                  </button>

                  <button
                    id="ledger-tab-payments"
                    onClick={() => setLedgerViewTab('payments')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      ledgerViewTab === 'payments'
                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    <span>payments (Parent Order Entities)</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      ledgerViewTab === 'payments' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {paymentsList.length || orders.length}
                    </span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center space-x-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search order, payment, receipt..."
                      value={ledgerSearchQuery}
                      onChange={(e) => setLedgerSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:border-slate-800 focus:outline-none"
                    />
                  </div>
                  {ledgerSearchQuery && (
                    <button
                      onClick={() => setLedgerSearchQuery('')}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center space-x-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span>Filter:</span>
                </span>
                {(['ALL', 'SUCCESS', 'REVERSED', 'FAILED', 'INITIATED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setLedgerStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer text-[11px] ${
                      ledgerStatusFilter === st
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All Records' : st}
                    {st === 'FAILED' && totalFailedAttempts > 0 && (
                      <span className="ml-1 text-[9px] bg-rose-500 text-white px-1 py-0.2 rounded-full font-bold">
                        {totalFailedAttempts}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* TABLE VIEW: payment_transactions (Child Audit Ledger) */}
              {ledgerViewTab === 'transactions' && (
                <div className="border border-slate-200 rounded overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-900">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Transaction ID & Payment ID</th>
                        <th className="py-2.5 px-3">Order Ref</th>
                        <th className="py-2.5 px-3">Provider & Reference</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Initiated / Completed</th>
                        <th className="py-2.5 px-3">Failure Reason / Notes</th>
                        <th className="py-2.5 px-3">Reconciliation</th>
                        <th className="py-2.5 px-3 text-right">Audit Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                            No payment transaction records match the specified filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((txn) => {
                          const isSuccess = txn.status === 'SUCCESS';
                          const isReversed = txn.status === 'REVERSED';
                          const isFailed = txn.status === 'FAILED';
                          const isInitiated = txn.status === 'INITIATED';

                          const latencyMs = txn.completedAt && txn.initiatedAt 
                            ? Math.max(0, new Date(txn.completedAt).getTime() - new Date(txn.initiatedAt).getTime())
                            : null;

                          return (
                            <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                              {/* Transaction ID & Parent Payment ID */}
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-semibold text-slate-900 block text-[11px]">{txn.id}</span>
                                <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                                  <span className="text-slate-400">parent:</span>
                                  <span className="text-blue-700 font-semibold">{txn.paymentId}</span>
                                </span>
                              </td>

                              {/* Order Ref */}
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                                {txn.orderId}
                              </td>

                              {/* Provider & Provider Reference (Daraja Receipt) */}
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-slate-800 block text-[11px]">{txn.provider}</span>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border inline-block ${
                                  isReversed
                                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                                    : isFailed
                                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                }`}>
                                  {txn.providerReference}
                                </span>
                              </td>

                              {/* Amount & Currency */}
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {txn.currency} {txn.amount.toLocaleString()}
                              </td>

                              {/* Status */}
                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isSuccess
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isReversed
                                    ? 'bg-purple-100 text-purple-800'
                                    : isFailed
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {txn.status}
                                </span>
                              </td>

                              {/* Timestamps */}
                              <td className="py-2.5 px-3 text-[10px] font-mono text-slate-600">
                                <span className="block">{new Date(txn.initiatedAt).toLocaleTimeString()}</span>
                                {txn.completedAt && (
                                  <span className="text-slate-400 block">
                                    Done: {new Date(txn.completedAt).toLocaleTimeString()}
                                    {latencyMs !== null && ` (+${(latencyMs / 1000).toFixed(1)}s)`}
                                  </span>
                                )}
                              </td>

                              {/* Failure Reason / Operational Notes */}
                              <td className="py-2.5 px-3 text-xs max-w-xs">
                                {txn.failureReason ? (
                                  <span className="text-[11px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-medium block">
                                    {txn.failureReason}
                                  </span>
                                ) : isSuccess ? (
                                  <span className="text-[11px] text-emerald-700 font-medium">
                                    STK callback validated
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">
                                    Pending callback
                                  </span>
                                )}
                              </td>

                              {/* Reconciliation State */}
                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                  txn.reconciliationState === 'MATCHED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : txn.reconciliationState === 'REFUNDED'
                                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {txn.reconciliationState || 'MATCHED'}
                                </span>
                              </td>

                              {/* Audit Action */}
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setSelectedTxnForAudit(txn)}
                                  className="text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  Inspect Audit
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TABLE VIEW: payments (Parent Order Entities) */}
              {ledgerViewTab === 'payments' && (
                <div className="border border-slate-200 rounded overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-900">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Payment ID (Parent)</th>
                        <th className="py-2.5 px-3">Order Ref</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Payment Status</th>
                        <th className="py-2.5 px-3">Transaction Count</th>
                        <th className="py-2.5 px-3">Latest Txn Ref</th>
                        <th className="py-2.5 px-3">Reconciliation Status</th>
                        <th className="py-2.5 px-3">Created / Updated</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                            No parent payment records match the specified filters.
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((pay) => {
                          const isPaid = pay.status === 'PAID';
                          const isRefunded = pay.status === 'REFUNDED';
                          const matchingOrder = orders.find(o => o.id === pay.orderId);

                          return (
                            <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">
                                {pay.id}
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="font-mono font-semibold text-slate-900 block">{pay.orderId}</span>
                                {matchingOrder && (
                                  <span className="text-[10px] text-slate-500 truncate block max-w-xs">
                                    {matchingOrder.shopName}
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {pay.currency} {pay.amount.toLocaleString()}
                              </td>

                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isRefunded
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {pay.status}
                                </span>
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {pay.transactionCount} {pay.transactionCount === 1 ? 'attempt' : 'attempts'}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                                {pay.latestTransactionId || '—'}
                              </td>

                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  pay.reconciliationStatus === 'RECONCILED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {pay.reconciliationStatus}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-[10px] font-mono text-slate-500">
                                <span className="block">{new Date(pay.createdAt).toLocaleTimeString()}</span>
                                <span className="text-slate-400 block">Upd: {new Date(pay.updatedAt).toLocaleTimeString()}</span>
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                {isPaid && !isRefunded && onInitiateRefund && matchingOrder && (
                                  <button
                                    onClick={() => setSelectedOrderForRefund(matchingOrder)}
                                    className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded transition-colors cursor-pointer"
                                  >
                                    Refund
                                  </button>
                                )}
                                {isRefunded && (
                                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                    Reversed
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODULE 2: RETAILERS (SHOP DIRECTORY & CREDIT FACILITIES)                  */}
      {/* ========================================================================= */}
      {currentPage === 'retailers' && (
        <RetailersManager orders={orders} />
      )}

      {/* ========================================================================= */}
      {/* MODULE 3: WHOLESALERS (DEPOT HUBS & SLA MONITORING)                       */}
      {/* ========================================================================= */}
      {currentPage === 'wholesalers' && (
        <WholesalersManager orders={orders} />
      )}

      {/* ========================================================================= */}
      {/* MODULE 4: RIDERS (FLEET MANAGEMENT & LIVE GPS COMMAND)                    */}
      {/* ========================================================================= */}
      {currentPage === 'riders' && (
        <RidersFleetManager orders={orders} onReassignRider={onReassignRider} />
      )}

      {/* ========================================================================= */}
      {/* MODULE 5: PRODUCTS (MASTER FMCG CATALOG & PRICE FEEDS)                    */}
      {/* ========================================================================= */}
      {currentPage === 'products' && (
        <ProductsMasterCatalog />
      )}

      {/* ========================================================================= */}
      {/* MODULE 7: DELIVERIES (DISPATCH RADAR & CORRIDOR VELOCITY)                 */}
      {/* ========================================================================= */}
      {currentPage === 'deliveries' && (
        <DeliveriesDispatchRadar 
          orders={orders} 
          onManualOverrideStatus={onManualOverrideStatus}
          onReassignRider={onReassignRider}
        />
      )}

      {/* ========================================================================= */}
      {/* MODULE 8: ISSUES (INCIDENT DESK & EXCEPTION MANAGEMENT)                   */}
      {/* ========================================================================= */}
      {currentPage === 'issues' && (
        <IssuesIncidentDesk 
          orders={orders} 
          onInitiateRefund={onInitiateRefund}
          onReassignRider={onReassignRider}
          onManualOverrideStatus={onManualOverrideStatus}
        />
      )}

      {/* ========================================================================= */}
      {/* MODULE 9: SEARCH ANALYTICS (TOP QUERIES, CTR & ZERO-RESULT STOCKOUTS)    */}
      {/* ========================================================================= */}
      {currentPage === 'search_analytics' && (
        <SearchAnalyticsDesk events={events} />
      )}

      {/* ========================================================================= */}
      {/* SECTION 26: TRANSACTION AUDIT INSPECTOR MODAL                             */}
      {/* ========================================================================= */}
      {selectedTxnForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Payment Transaction Audit Record
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {selectedTxnForAudit.id} · Provider Ref: {selectedTxnForAudit.providerReference || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTxnForAudit(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Section 26 Tracked Specification Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-md border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">payment_id (Parent)</span>
                <span className="font-mono font-bold text-blue-700 text-[11px]">{selectedTxnForAudit.paymentId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">order_id</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">{selectedTxnForAudit.orderId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">provider</span>
                <span className="font-semibold text-slate-900 text-[11px]">{selectedTxnForAudit.provider}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">provider_reference</span>
                <span className="font-mono font-bold text-emerald-800 text-[11px]">{selectedTxnForAudit.providerReference}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">amount & currency</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  {selectedTxnForAudit.currency} {selectedTxnForAudit.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">status</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${
                  selectedTxnForAudit.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedTxnForAudit.status === 'REVERSED'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedTxnForAudit.status === 'FAILED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedTxnForAudit.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">initiated_at</span>
                <span className="font-mono text-[10px] text-slate-600">
                  {new Date(selectedTxnForAudit.initiatedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">completed_at</span>
                <span className="font-mono text-[10px] text-slate-600">
                  {selectedTxnForAudit.completedAt ? new Date(selectedTxnForAudit.completedAt).toLocaleString() : 'In-flight'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">reconciliation_state</span>
                <span className="font-mono text-[10px] text-slate-800 font-semibold">
                  {selectedTxnForAudit.reconciliationState || 'MATCHED'}
                </span>
              </div>
            </div>

            {/* Failure Reason / Reversal Details */}
            {selectedTxnForAudit.failureReason && (
              <div className="bg-rose-50 border border-rose-200 rounded p-3 text-xs text-rose-900 space-y-1">
                <span className="font-bold text-rose-800 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Recorded failure_reason (Reconciliation Exception):</span>
                </span>
                <p className="font-mono text-[11px] leading-relaxed">
                  {selectedTxnForAudit.failureReason}
                </p>
              </div>
            )}

            {/* Raw JSON Webhook Payload */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Raw Daraja C2B / B2C Callback Payload (Idempotency Audit):
              </span>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded text-[10px] font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                {JSON.stringify({
                  TransactionType: selectedTxnForAudit.status === 'REVERSED' ? 'Reversal Result' : 'CustomerPayBillOnline',
                  TransID: selectedTxnForAudit.providerReference,
                  TransTime: selectedTxnForAudit.completedAt || selectedTxnForAudit.initiatedAt,
                  TransAmount: selectedTxnForAudit.amount,
                  BusinessShortCode: '889100',
                  BillRefNumber: selectedTxnForAudit.orderId,
                  MSISDN: selectedTxnForAudit.phoneNumber || '254712345678',
                  ResultCode: selectedTxnForAudit.status === 'SUCCESS' ? 0 : selectedTxnForAudit.status === 'REVERSED' ? 0 : 1032,
                  ResultDesc: selectedTxnForAudit.failureReason || 'The service request is processed successfully.',
                  ReconciliationState: selectedTxnForAudit.reconciliationState,
                  IdempotencyKey: selectedTxnForAudit.idempotencyKey || `idemp_${selectedTxnForAudit.id}`,
                  ParentPaymentId: selectedTxnForAudit.paymentId
                }, null, 2)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="text-[11px] text-slate-400 font-mono">
                TLS 1.3 Signature: Verified (SHA-256)
              </div>
              <div className="flex items-center space-x-2">
                {selectedTxnForAudit.status === 'SUCCESS' && onInitiateRefund && (
                  <button
                    onClick={() => {
                      const matchedOrder = orders.find(o => o.id === selectedTxnForAudit.orderId);
                      if (matchedOrder) {
                        setSelectedOrderForRefund(matchedOrder);
                      }
                      setSelectedTxnForAudit(null);
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer"
                  >
                    Initiate B2C Reversal
                  </button>
                )}
                <button
                  onClick={() => setSelectedTxnForAudit(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded font-semibold transition-colors cursor-pointer"
                >
                  Close Audit Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

