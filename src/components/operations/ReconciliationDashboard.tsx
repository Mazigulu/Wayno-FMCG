import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Activity,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  Info,
  Check,
  Building2,
  Bike,
  CreditCard,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Order, Payment, PaymentTransaction } from '../../types/wayno';
import {
  MOCK_DISCREPANCIES,
  MOCK_SETTLEMENTS,
  generateReconciliationTrends,
  DiscrepancyRecord,
  SettlementRecord,
  auditMpesaTransactionsForVariance
} from '../../data/reconciliationData';
import { MpesaVarianceAlertComponent } from './MpesaVarianceAlertComponent';
import { SettlementWindowModal } from './SettlementWindowModal';

interface ReconciliationDashboardProps {
  orders?: Order[];
  payments?: Payment[];
  paymentTransactions?: PaymentTransaction[];
  onInitiateRefund?: (orderId: string, reason: string) => void;
  onNavigateToRawLedger?: () => void;
}

export const ReconciliationDashboard: React.FC<ReconciliationDashboardProps> = ({
  orders = [],
  payments = [],
  paymentTransactions = [],
  onInitiateRefund,
  onNavigateToRawLedger,
}) => {
  // Filter & Search State
  const [activeSubView, setActiveSubView] = useState<'overview' | 'variance_alerts' | 'discrepancies' | 'settlements'>('overview');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<string>('ALL');
  const [settlementFilter, setSettlementFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyRecord | null>(null);
  const [discrepanciesList, setDiscrepanciesList] = useState<DiscrepancyRecord[]>(MOCK_DISCREPANCIES);
  const [settlementsList, setSettlementsList] = useState<SettlementRecord[]>(MOCK_SETTLEMENTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedSettlementWindow, setSelectedSettlementWindow] = useState<any | null>(null);

  // Automated Watchdog: Active M-Pesa transactions deviating by > 1%
  const activeVarianceAlerts = useMemo(() => {
    return auditMpesaTransactionsForVariance(
      orders,
      payments,
      paymentTransactions,
      discrepanciesList,
      1.0
    ).filter(a => a.status === 'ACTIVE_ALERT');
  }, [orders, payments, paymentTransactions, discrepanciesList]);

  // Time-series trend data
  const trendData = useMemo(() => {
    return generateReconciliationTrends(paymentTransactions, payments);
  }, [paymentTransactions, payments]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalTransactions = paymentTransactions.length > 0 ? paymentTransactions.length : 18;
    const successfulTxns = paymentTransactions.filter(t => t.status === 'SUCCESS').length;
    const failedTxns = paymentTransactions.filter(t => t.status === 'FAILED').length;
    const reversedTxns = paymentTransactions.filter(t => t.status === 'REVERSED').length;
    
    // Calculate actual success rate
    const calculatedRate = totalTransactions > 0 
      ? Number(((successfulTxns / totalTransactions) * 100).toFixed(1)) 
      : 96.4;
    const successRate = calculatedRate > 0 ? calculatedRate : 96.4;

    // Discrepancies
    const unresolvedDiscrepancies = discrepanciesList.filter(d => d.status === 'UNRESOLVED' || d.status === 'INVESTIGATING');
    const totalVarianceKES = unresolvedDiscrepancies.reduce((acc, d) => acc + Math.abs(d.varianceKES), 0);

    // Pending Settlements
    const pendingSettlements = settlementsList.filter(s => s.status === 'PENDING_SETTLEMENT' || s.status === 'PROCESSING');
    const pendingAmountKES = pendingSettlements.reduce((acc, s) => acc + s.netPayoutKES, 0);
    const heldEscrowAmountKES = settlementsList
      .filter(s => s.status === 'HELD_DISPUTE' || s.escrowReleaseStatus === 'ESCROW_LOCKED')
      .reduce((acc, s) => acc + s.netPayoutKES, 0);

    // Wholesaler vs Rider Pending
    const wholesalerPendingKES = pendingSettlements
      .filter(s => s.recipientType === 'WHOLESALER')
      .reduce((acc, s) => acc + s.netPayoutKES, 0);
    const riderPendingKES = pendingSettlements
      .filter(s => s.recipientType === 'RIDER')
      .reduce((acc, s) => acc + s.netPayoutKES, 0);

    return {
      successRate,
      totalTransactions,
      successfulTxns,
      failedTxns,
      reversedTxns,
      unresolvedCount: unresolvedDiscrepancies.length,
      totalVarianceKES,
      pendingAmountKES,
      heldEscrowAmountKES,
      wholesalerPendingKES,
      riderPendingKES,
      settledCount: settlementsList.filter(s => s.status === 'SETTLED').length,
    };
  }, [paymentTransactions, discrepanciesList, settlementsList]);

  // Payment Status Donut / Breakdown Chart Data
  const statusPieData = useMemo(() => {
    return [
      { name: 'Successful (Captured)', value: metrics.successfulTxns || 14, color: '#059669' },
      { name: 'Pending Callback', value: 2, color: '#eab308' },
      { name: 'Reversed (B2C)', value: metrics.reversedTxns || 1, color: '#8b5cf6' },
      { name: 'Failed / Cancelled', value: metrics.failedTxns || 1, color: '#e11d48' },
    ];
  }, [metrics]);

  // Settlement Distribution Data
  const settlementDistributionData = useMemo(() => {
    const wholesalerSettled = settlementsList
      .filter(s => s.recipientType === 'WHOLESALER' && s.status === 'SETTLED')
      .reduce((sum, s) => sum + s.netPayoutKES, 0);
    const wholesalerPending = settlementsList
      .filter(s => s.recipientType === 'WHOLESALER' && s.status !== 'SETTLED')
      .reduce((sum, s) => sum + s.netPayoutKES, 0);

    const riderSettled = settlementsList
      .filter(s => s.recipientType === 'RIDER' && s.status === 'SETTLED')
      .reduce((sum, s) => sum + s.netPayoutKES, 0);
    const riderPending = settlementsList
      .filter(s => s.recipientType === 'RIDER' && s.status !== 'SETTLED')
      .reduce((sum, s) => sum + s.netPayoutKES, 0);

    return [
      {
        channel: 'Wholesalers (Pesalink)',
        settled: wholesalerSettled,
        pending: wholesalerPending,
        rate: 82.4
      },
      {
        channel: 'Riders Fleet (M-Pesa B2C)',
        settled: riderSettled,
        pending: riderPending,
        rate: 98.1
      },
      {
        channel: 'Customer Returns / Escrow',
        settled: 1450,
        pending: 1261,
        rate: 76.5
      }
    ];
  }, [settlementsList]);

  // Discrepancy resolution action handler
  const handleResolveDiscrepancy = (id: string, resolution: 'AUTO_RESOLVED' | 'ADJUSTMENT_POSTED') => {
    setDiscrepanciesList(prev =>
      prev.map(d => (d.id === id ? { ...d, status: resolution } : d))
    );
    setToastMessage(`Discrepancy ${id} marked as ${resolution.replace('_', ' ')}.`);
    setTimeout(() => setToastMessage(null), 3500);
    setSelectedDiscrepancy(null);
  };

  // Settlement approval action handler
  const handleAuthorizeBatch = (batchId: string) => {
    setSettlementsList(prev =>
      prev.map(s =>
        s.settlementBatchId === batchId && s.status === 'PENDING_SETTLEMENT'
          ? { ...s, status: 'PROCESSING', escrowReleaseStatus: 'RELEASED' }
          : s
      )
    );
    setToastMessage(`Batch ${batchId} released for M-Pesa B2C & Pesalink disbursement.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-4" id="reconciliation-dashboard-view">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="bg-emerald-900 text-emerald-100 border border-emerald-700 px-4 py-2.5 rounded text-xs flex items-center justify-between shadow-md animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-300 hover:text-white text-xs ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner & Control Ribbon */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 px-1.5 py-0.5 rounded">
                DARAJA FINANCIAL RECONCILIATION
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Payment Success, M-Pesa Variance & Settlement Desk
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-time audit comparing Daraja STK Push callbacks, Paybill C2B receipts, and B2C escrow settlement disbursements.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateToRawLedger && (
              <button
                onClick={onNavigateToRawLedger}
                className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Raw Relational Ledger</span>
              </button>
            )}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md text-xs">
              <button
                id="recon-tab-overview"
                onClick={() => setActiveSubView('overview')}
                className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeSubView === 'overview'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Analytics & Charts
              </button>
              <button
                id="recon-tab-variance-alerts"
                onClick={() => setActiveSubView('variance_alerts')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  activeSubView === 'variance_alerts'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Variance Alerts (&gt;1%)</span>
                {activeVarianceAlerts.length > 0 && (
                  <span className="bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {activeVarianceAlerts.length}
                  </span>
                )}
              </button>
              <button
                id="recon-tab-discrepancies"
                onClick={() => setActiveSubView('discrepancies')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  activeSubView === 'discrepancies'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Discrepancies</span>
                {metrics.unresolvedCount > 0 && (
                  <span className="bg-rose-600 text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {metrics.unresolvedCount}
                  </span>
                )}
              </button>
              <button
                id="recon-tab-settlements"
                onClick={() => setActiveSubView('settlements')}
                className={`px-3 py-1 rounded font-medium transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  activeSubView === 'settlements'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pending Settlements</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                  KES {(metrics.pendingAmountKES / 1000).toFixed(1)}k
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Core Financial KPI Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          {/* Card 1: Payment Success Rate */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">M-Pesa STK Success Rate</span>
              <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                <TrendingUp className="w-3 h-3" />
                <span>+1.8% vs avg</span>
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-emerald-700">
                {metrics.successRate}%
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({metrics.successfulTxns} / {metrics.totalTransactions} STKs)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(metrics.successRate, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
              <span>SLA Target: 95.0%</span>
              <span className="text-emerald-700 font-semibold">Exceeding SLA</span>
            </div>
          </div>

          {/* Card 2: Active Discrepancies & Variances */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">M-Pesa Ledger Variance</span>
              <button
                id="btn-kpi-variance-alerts"
                onClick={() => setActiveSubView('variance_alerts')}
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border cursor-pointer hover:opacity-90 ${
                  activeVarianceAlerts.length > 0 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
                title="View M-Pesa transactions deviating > 1%"
              >
                {activeVarianceAlerts.length} &gt;1% Variance Alert{activeVarianceAlerts.length > 1 ? 's' : ''}
              </button>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-xl font-bold font-mono ${metrics.totalVarianceKES > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
                KES {metrics.totalVarianceKES.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Unmatched Gap</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              <span>Flagging Order <strong className="font-mono text-slate-800">WN-502914</strong> (-4.76% deviation).</span>
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
              <span>Audit Watchdog:</span>
              <button
                onClick={() => setActiveSubView('variance_alerts')}
                className="font-mono text-rose-700 font-bold hover:underline cursor-pointer"
              >
                Audit Orders &gt;
              </button>
            </div>
          </div>

          {/* Card 3: Pending Settlements */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Pending Settlements</span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                Next Cycle: 18:00
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-slate-900">
                KES {metrics.pendingAmountKES.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Net Escrow</span>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Wholesalers: KES {metrics.wholesalerPendingKES.toLocaleString()}</span>
              <span>Riders: KES {metrics.riderPendingKES.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
              <span>Ready for Batch:</span>
              <span className="font-mono text-slate-700 font-semibold">Batch W38-02 / W38-03</span>
            </div>
          </div>

          {/* Card 4: Escrow Hold / Dispute Safety Reserve */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Held in Escrow / Disputes</span>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                Collateral Shield
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-purple-800">
                KES {metrics.heldEscrowAmountKES.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Protected</span>
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              Held pending delivery OTP handshake & returns verification.
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
              <span>B2C Float Health:</span>
              <span className="font-mono text-emerald-700 font-semibold">&gt; KES 1.2M Safe</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: ANALYTICS, RECHARTS VISUALIZATIONS */}
      {activeSubView === 'overview' && (
        <div className="space-y-4">
          {/* Automated M-Pesa Variance Alert Component (Flags transactions deviating > 1%) */}
          <MpesaVarianceAlertComponent
            orders={orders}
            payments={payments}
            paymentTransactions={paymentTransactions}
            discrepancies={discrepanciesList}
            onInvestigateOrder={(orderId) => {
              const matching = discrepanciesList.find(d => d.orderId === orderId);
              if (matching) setSelectedDiscrepancy(matching);
            }}
            onInitiateRefund={onInitiateRefund}
          />

          {/* Chart Row 1: Hourly Success Rate Trend & Volume (Recharts Area & Line) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Hourly Success Rates & STK Latency */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hourly Payment Success Rate & Throughput (Daraja STK Push)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calculated across today's initiated checkout requests vs confirmed STK webhook callbacks.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <div className="flex items-center space-x-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold shadow-2xs">
                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Click any data point to inspect logs</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block" />
                    <span className="text-slate-600">Success Rate (%)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block" />
                    <span className="text-slate-600">Successful Txns</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block" />
                    <span className="text-slate-600">Failed / Expired</span>
                  </div>
                </div>
              </div>

              {/* Recharts Area / Line Chart Container */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        setSelectedSettlementWindow(e.activePayload[0].payload);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="timeLabel"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="rate"
                      domain={[80, 100]}
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#059669' }}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="volume"
                      orientation="left"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded shadow-xl text-xs space-y-1 border border-slate-700">
                              <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
                                <span>Time Window: {label}</span>
                                <span className="text-[10px] text-emerald-400 font-normal">Click to open logs</span>
                              </p>
                              <div className="flex justify-between space-x-4">
                                <span className="text-emerald-400 font-semibold">Success Rate:</span>
                                <span className="font-mono font-bold text-emerald-300">{data.successRate}%</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-slate-400">Initiated STK:</span>
                                <span className="font-mono text-slate-200">{data.initiated}</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-blue-400">Confirmed (Paid):</span>
                                <span className="font-mono text-blue-300">{data.successful}</span>
                              </div>
                              <div className="flex justify-between space-x-4">
                                <span className="text-rose-400">Failed/Cancelled:</span>
                                <span className="font-mono text-rose-300">{data.failed}</span>
                              </div>
                              <div className="flex justify-between space-x-4 pt-1 border-t border-slate-800">
                                <span className="text-amber-400">Volume Captured:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  KES {data.volumeCapturedKES.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-emerald-400 font-semibold">
                                <span>Click data point to inspect logs</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      yAxisId="volume"
                      type="monotone"
                      dataKey="successful"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVolume)"
                      name="Successful STK Txns"
                      onClick={(data: any) => {
                        if (data && data.payload) {
                          setSelectedSettlementWindow(data.payload);
                        }
                      }}
                      cursor="pointer"
                    />
                    <Line
                      yAxisId="rate"
                      type="monotone"
                      dataKey="successRate"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        fill: '#059669',
                        stroke: '#ffffff',
                        strokeWidth: 1.5,
                        cursor: 'pointer'
                      }}
                      activeDot={{
                        r: 7,
                        fill: '#ffffff',
                        stroke: '#059669',
                        strokeWidth: 2.5,
                        cursor: 'pointer',
                        onClick: (_: any, payload: any) => {
                          if (payload && payload.payload) {
                            setSelectedSettlementWindow(payload.payload);
                          }
                        }
                      }}
                      name="Success Rate %"
                      onClick={(data: any) => {
                        if (data && data.payload) {
                          setSelectedSettlementWindow(data.payload);
                        }
                      }}
                      cursor="pointer"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Payment Transaction Status Breakdown (Donut PieChart) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-md p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Daraja Callback Status Composition</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Distribution of STK payment transactions by definitive settlement outcome.
                </p>
              </div>

              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} txns`, name]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.375rem',
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {metrics.totalTransactions}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">Total Txns</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                {statusPieData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="truncate">
                      <span className="text-slate-600 block text-[10px] leading-tight truncate">{item.name}</span>
                      <span className="font-mono font-bold text-slate-900">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Row 2: Pending Settlements by Channel & Wholesaler (Recharts BarChart) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Settlement Channels (BarChart) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Settlement Liquidity: Settled vs Pending Escrow (KES)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Compares settled disbursements with pending escrow balances by disbursement rail.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Daily Cycle (T+0 / T+1)
                </span>
              </div>

              <div className="h-56 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={settlementDistributionData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    barGap={4}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const channelName = e.activePayload[0].payload.channel;
                        const defaultHour = channelName.includes('M-Pesa') ? '10:00' : '14:00';
                        setSelectedSettlementWindow({
                          timeLabel: defaultHour,
                          volumeCapturedKES: (e.activePayload[0].payload.settled || 0) + (e.activePayload[0].payload.pending || 0),
                          successRate: 97.5,
                          channel: channelName
                        });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="channel"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`KES ${Number(val).toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.375rem',
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar
                      dataKey="settled"
                      name="Settled Payouts (KES)"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(data: any) => {
                        if (data) {
                          setSelectedSettlementWindow({
                            timeLabel: '10:00',
                            volumeCapturedKES: data.settled,
                            successRate: 98.2
                          });
                        }
                      }}
                    />
                    <Bar
                      dataKey="pending"
                      name="Pending Escrow Hold (KES)"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={(data: any) => {
                        if (data) {
                          setSelectedSettlementWindow({
                            timeLabel: '14:00',
                            volumeCapturedKES: data.pending,
                            successRate: 96.0
                          });
                        }
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Quick Action Settlement Batch Table */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Eligible Settlement Batches</span>
                  </h3>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                    Escrow Cleared
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Batches ready for bulk disbursement via Safaricom B2C & Pesalink gateway.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {/* Batch 1 */}
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-[11px]">BATCH-2026-W38-02</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      Ready to Disburse
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Kenya Fast-Move & Brian Otieno</span>
                    <span className="font-mono font-bold text-slate-900">KES 7,874.20</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500">Order WN-741920 (Delivered & OTP Verified)</span>
                    <button
                      onClick={() => handleAuthorizeBatch('BATCH-2026-W38-02')}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors"
                    >
                      Authorize Batch
                    </button>
                  </div>
                </div>

                {/* Batch 2 */}
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-[11px]">BATCH-2026-W38-03</span>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                      Escrow Locked
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Somlink FMCG & Francis Kimani</span>
                    <span className="font-mono font-bold text-slate-900">KES 3,108.50</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500">Awaiting Rider Delivery Handshake OTP</span>
                    <span className="text-[10px] text-slate-400 font-mono">In Transit</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Utility Float Balance:</span>
                <span className="font-mono font-bold text-emerald-700">KES 2,450,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1.5: DEDICATED M-PESA VARIANCE ALERT AUDIT WORKSPACE */}
      {activeSubView === 'variance_alerts' && (
        <div className="space-y-4">
          <MpesaVarianceAlertComponent
            orders={orders}
            payments={payments}
            paymentTransactions={paymentTransactions}
            discrepancies={discrepanciesList}
            onInvestigateOrder={(orderId) => {
              const matching = discrepanciesList.find(d => d.orderId === orderId);
              if (matching) setSelectedDiscrepancy(matching);
            }}
            onInitiateRefund={onInitiateRefund}
          />
        </div>
      )}

      {/* VIEW 2: M-PESA TRANSACTION DISCREPANCIES TABLE & DETAIL AUDIT */}
      {activeSubView === 'discrepancies' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3.5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>M-Pesa Transaction Discrepancies & Callback Exceptions</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Detailed audit logs flagging short-payments, duplicate callbacks, delayed STK prompts, and unallocated Paybill sums.
              </p>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
              {['ALL', 'UNRESOLVED', 'INVESTIGATING', 'AUTO_RESOLVED'].map((filterVal) => (
                <button
                  key={filterVal}
                  onClick={() => setDiscrepancyFilter(filterVal)}
                  className={`px-2.5 py-1 rounded font-medium text-xs transition-colors cursor-pointer ${
                    discrepancyFilter === filterVal
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filterVal.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Discrepancies Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px] bg-slate-50">
                  <th className="py-2 px-3">Discrepancy ID</th>
                  <th className="py-2 px-3">Type & Severity</th>
                  <th className="py-2 px-3">Order / Payment ID</th>
                  <th className="py-2 px-3">Daraja Receipt</th>
                  <th className="py-2 px-3 text-right">Ledger Amount</th>
                  <th className="py-2 px-3 text-right">Gateway Amount</th>
                  <th className="py-2 px-3 text-right">Variance</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discrepanciesList
                  .filter(d => discrepancyFilter === 'ALL' || d.status === discrepancyFilter)
                  .map((item) => {
                    const isUnresolved = item.status === 'UNRESOLVED' || item.status === 'INVESTIGATING';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {item.id}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              item.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : item.severity === 'WARNING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.severity}
                            </span>
                            <span className="font-medium text-slate-800 text-[11px]">
                              {item.discrepancyType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <span className="text-blue-700 font-semibold block">{item.orderId}</span>
                          <span className="text-slate-400 text-[10px] block">{item.paymentId}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {item.darajaReceipt || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-900">
                          KES {item.ledgerAmountKES.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-900 font-semibold">
                          KES {item.gatewayAmountKES.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right font-bold">
                          <span className={item.varianceKES < 0 ? 'text-rose-600' : item.varianceKES > 0 ? 'text-emerald-700' : 'text-slate-500'}>
                            {item.varianceKES > 0 ? `+KES ${item.varianceKES.toLocaleString()}` : item.varianceKES < 0 ? `-KES ${Math.abs(item.varianceKES).toLocaleString()}` : 'KES 0'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            item.status === 'AUTO_RESOLVED' || item.status === 'ADJUSTMENT_POSTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'INVESTIGATING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setSelectedDiscrepancy(item)}
                            className="text-xs text-blue-600 hover:text-blue-900 font-semibold underline cursor-pointer"
                          >
                            Investigate
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: PENDING SETTLEMENTS LEDGER (Wholesalers & Riders) */}
      {activeSubView === 'settlements' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3.5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supplier & Rider Settlement Schedule (Escrow Release)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Track gross sales, platform take-rate commissions, and automated B2C payout disbursements.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
              {['ALL', 'PENDING_SETTLEMENT', 'PROCESSING', 'SETTLED', 'HELD_DISPUTE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSettlementFilter(f)}
                  className={`px-2.5 py-1 rounded font-medium text-xs transition-colors cursor-pointer ${
                    settlementFilter === f
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px] bg-slate-50">
                  <th className="py-2 px-3">Settlement ID</th>
                  <th className="py-2 px-3">Recipient & Type</th>
                  <th className="py-2 px-3">Order ID</th>
                  <th className="py-2 px-3">Disbursement Channel</th>
                  <th className="py-2 px-3 text-right">Gross Amount</th>
                  <th className="py-2 px-3 text-right">Fee (Take-Rate)</th>
                  <th className="py-2 px-3 text-right">Net Payout</th>
                  <th className="py-2 px-3">Escrow Status</th>
                  <th className="py-2 px-3">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlementsList
                  .filter(s => settlementFilter === 'ALL' || s.status === settlementFilter)
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {s.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          {s.recipientType === 'WHOLESALER' ? (
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Bike className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 block text-[11px]">{s.recipientName}</span>
                            <span className="text-slate-400 text-[10px] font-mono">{s.bankOrPhoneReference}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700 font-semibold">
                        {s.orderId}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 text-[11px]">
                        {s.disbursementChannel}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-slate-700">
                        KES {s.grossAmountKES.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-slate-500">
                        {s.platformFeeKES > 0 ? `KES ${s.platformFeeKES.toFixed(2)}` : 'KES 0'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-900">
                        KES {s.netPayoutKES.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          s.escrowReleaseStatus === 'RELEASED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : s.escrowReleaseStatus === 'ESCROW_RELEASE_ELIGIBLE'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {s.escrowReleaseStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          s.status === 'SETTLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : s.status === 'HELD_DISPUTE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discrepancy Investigation Modal */}
      {selectedDiscrepancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Discrepancy Audit: {selectedDiscrepancy.id}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Order: {selectedDiscrepancy.orderId} · Type: {selectedDiscrepancy.discrepancyType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Variance Numbers */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Ledger Expectation</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  KES {selectedDiscrepancy.ledgerAmountKES.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Daraja Received</span>
                <span className="font-mono font-bold text-blue-700 text-sm">
                  KES {selectedDiscrepancy.gatewayAmountKES.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Net Variance</span>
                <span className={`font-mono font-bold text-sm ${selectedDiscrepancy.varianceKES < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {selectedDiscrepancy.varianceKES > 0 ? `+KES ${selectedDiscrepancy.varianceKES}` : `KES ${selectedDiscrepancy.varianceKES}`}
                </span>
              </div>
            </div>

            {/* Audit Details */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Root Cause Investigation</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 mt-1 leading-relaxed">
                  {selectedDiscrepancy.details}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Recommended Action</span>
                <p className="text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 mt-1 leading-relaxed">
                  {selectedDiscrepancy.suggestedAction}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleResolveDiscrepancy(selectedDiscrepancy.id, 'ADJUSTMENT_POSTED')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Post Ledger Adjustment
              </button>
              <button
                onClick={() => handleResolveDiscrepancy(selectedDiscrepancy.id, 'AUTO_RESOLVED')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                Mark Reconciled
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED SETTLEMENT WINDOW INDIVIDUAL TRANSACTION LOGS MODAL */}
      {selectedSettlementWindow && (
        <SettlementWindowModal
          windowInfo={selectedSettlementWindow}
          baseTransactions={paymentTransactions}
          orders={orders}
          discrepancies={discrepanciesList}
          onClose={() => setSelectedSettlementWindow(null)}
          onInvestigateOrder={(orderId) => {
            const matching = discrepanciesList.find(d => d.orderId === orderId);
            if (matching) {
              setSelectedDiscrepancy(matching);
            } else {
              const matchedOrder = orders.find(o => o.id === orderId);
              const orderTotal = matchedOrder?.totalAmount || 2100;
              setSelectedDiscrepancy({
                id: `DISC-${orderId}`,
                discrepancyType: 'AMOUNT_MISMATCH',
                orderId,
                paymentId: `pay_${orderId.replace('WN-', '')}`,
                ledgerAmountKES: orderTotal,
                gatewayAmountKES: 2000,
                varianceKES: 2000 - orderTotal,
                severity: Math.abs(2000 - orderTotal) / orderTotal > 0.03 ? 'CRITICAL' : 'WARNING',
                status: 'UNRESOLVED',
                detectedAt: new Date().toISOString(),
                details: `Audit trace for transaction in settlement window ${selectedSettlementWindow.timeLabel}. Retailer: ${matchedOrder?.shopName || 'Retail Customer'}. Phone: ${matchedOrder?.retailerPhone || '+254 701 234 567'}.`,
                suggestedAction: 'Review Safaricom Daraja STK Push callback payload and initiate customer balance prompt or partial ledger adjustment.'
              });
            }
          }}
        />
      )}
    </div>
  );
};
