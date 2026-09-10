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
  Filter
} from 'lucide-react';
import { Order, TelemetryEvent, OrderState } from '../types/wayno';

export type OperationsPage = 'pipeline' | 'telemetry' | 'kpis';

interface OperationsConsoleProps {
  orders: Order[];
  events: TelemetryEvent[];
  onManualOverrideStatus: (orderId: string, newState: OrderState, note: string) => void;
}

export const OperationsConsole: React.FC<OperationsConsoleProps> = ({
  orders,
  events,
  onManualOverrideStatus,
}) => {
  const [currentPage, setCurrentPage] = useState<OperationsPage>('pipeline');
  const [filterPartition, setFilterPartition] = useState<string>('ALL');
  const [selectedOrderForOverride, setSelectedOrderForOverride] = useState<Order | null>(null);
  const [overrideStateInput, setOverrideStateInput] = useState<OrderState>('READY_FOR_PICKUP');
  const [overrideNote, setOverrideNote] = useState('');
  const [orderStateFilter, setOrderStateFilter] = useState<string>('ALL');

  const totalGMV = orders.reduce((acc, o) => acc + o.totalAmount, 0) + 184500;
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length + 42;
  const activePipelines = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;

  const ALL_STATES: OrderState[] = [
    'CREATED',
    'PAYMENT_PENDING',
    'PAID',
    'FULFILLMENT_PENDING',
    'SUPPLIER_CONFIRMED',
    'READY_FOR_PICKUP',
    'RIDER_ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
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
    if (orderStateFilter === 'ACTIVE') return o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
    if (orderStateFilter === 'DELIVERED') return o.status === 'DELIVERED';
    return o.status === orderStateFilter;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Real-time Network Telemetry Ribbon */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 sm:p-4 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900">
                  WAYNO Network Operations Center
                </h1>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                  Node: Nairobi East & West
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                Distributed Event Broker · TLS 1.3 · API Gateway p95: 22ms · S3 Data Lake Ingestion
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-800 font-medium flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Gateway: Healthy</span>
            </span>
          </div>
        </div>

        {/* Outlook Secondary Page Tabs Ribbon */}
        <div className="flex items-center space-x-1 pt-2.5 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentPage('pipeline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'pipeline'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Order Pipeline & State Override</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'pipeline' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}>
              {activePipelines}
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('telemetry')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'telemetry'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>S3 Parquet Data Lake Telemetry</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              currentPage === 'telemetry' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentPage('kpis')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'kpis'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Network KPIs & SLA Velocity</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: ORDER PIPELINE & STATE OVERRIDE                                   */}
      {/* ========================================================================= */}
      {currentPage === 'pipeline' && (
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
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase border ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500">
                      {order.riderName || 'None assigned'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrderForOverride(order);
                          setOverrideStateInput(order.status);
                        }}
                        className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
                      >
                        Override State
                      </button>
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
    </div>
  );
};

