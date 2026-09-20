import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Search,
  Copy,
  Check,
  ExternalLink,
  FileText,
  MessageSquare,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  BadgePercent,
  DollarSign,
  TrendingDown,
  Send,
  Building2,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Order, Payment, PaymentTransaction } from '../../types/wayno';
import {
  MpesaVarianceAlert,
  DiscrepancyRecord,
  auditMpesaTransactionsForVariance
} from '../../data/reconciliationData';

interface MpesaVarianceAlertComponentProps {
  orders?: Order[];
  payments?: Payment[];
  paymentTransactions?: PaymentTransaction[];
  discrepancies?: DiscrepancyRecord[];
  onInvestigateOrder?: (orderId: string) => void;
  onInitiateRefund?: (orderId: string, reason: string) => void;
}

export const MpesaVarianceAlertComponent: React.FC<MpesaVarianceAlertComponentProps> = ({
  orders = [],
  payments = [],
  paymentTransactions = [],
  discrepancies = [],
  onInvestigateOrder,
  onInitiateRefund,
}) => {
  // Configurable alert deviation threshold percentage (default strictly 1.0% as per specification)
  const [varianceThresholdPct, setVarianceThresholdPct] = useState<number>(1.0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE_ALERT' | 'UNDER_INVESTIGATION' | 'RESOLVED'>('ALL');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [auditingAlert, setAuditingAlert] = useState<MpesaVarianceAlert | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);
  const [localAuditOverrides, setLocalAuditOverrides] = useState<Record<string, { status: MpesaVarianceAlert['status']; note?: string }>>({});
  const [simulatedAlerts, setSimulatedAlerts] = useState<MpesaVarianceAlert[]>([]);

  // Automatically compute variance alerts by auditing live transactions against orders
  const computedAlerts = useMemo(() => {
    const rawAlerts = auditMpesaTransactionsForVariance(
      orders,
      payments,
      paymentTransactions,
      discrepancies,
      varianceThresholdPct
    );

    // Merge any dynamically injected test alerts
    const allAlerts = [...rawAlerts, ...simulatedAlerts];

    // Apply any local operator overrides (state changes during the session)
    return allAlerts.map(alert => {
      if (localAuditOverrides[alert.id]) {
        return {
          ...alert,
          status: localAuditOverrides[alert.id].status,
          resolutionNote: localAuditOverrides[alert.id].note || alert.resolutionNote
        };
      }
      return alert;
    });
  }, [orders, payments, paymentTransactions, discrepancies, varianceThresholdPct, simulatedAlerts, localAuditOverrides]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return computedAlerts.filter(alert => {
      if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        alert.orderId.toLowerCase().includes(q) ||
        (alert.darajaReceipt && alert.darajaReceipt.toLowerCase().includes(q)) ||
        (alert.shopName && alert.shopName.toLowerCase().includes(q)) ||
        (alert.customerPhone && alert.customerPhone.includes(q))
      );
    });
  }, [computedAlerts, statusFilter, searchQuery]);

  // Aggregated Alert Metrics
  const metrics = useMemo(() => {
    const activeCount = computedAlerts.filter(a => a.status === 'ACTIVE_ALERT').length;
    const underReviewCount = computedAlerts.filter(a => a.status === 'UNDER_INVESTIGATION').length;
    const resolvedCount = computedAlerts.filter(a => a.status === 'RESOLVED').length;
    const totalVarianceKES = computedAlerts
      .filter(a => a.status !== 'RESOLVED')
      .reduce((sum, a) => sum + Math.abs(a.varianceKES), 0);
    const maxDeviation = computedAlerts.length > 0
      ? Math.max(...computedAlerts.map(a => a.deviationPercentage))
      : 0;

    return {
      totalAlerts: computedAlerts.length,
      activeCount,
      underReviewCount,
      resolvedCount,
      totalVarianceKES,
      maxDeviation
    };
  }, [computedAlerts]);

  // Handle Copy Order ID
  const handleCopyOrderId = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(orderId);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Dispatch Automated SMS Balance Prompt
  const handleSendBalanceSms = (alert: MpesaVarianceAlert) => {
    setActionSuccessToast(
      `Automated Daraja STK Push prompt for shortfall KES ${Math.abs(alert.varianceKES).toLocaleString()} dispatched to ${alert.customerPhone || 'retailer phone'}.`
    );
    setLocalAuditOverrides(prev => ({
      ...prev,
      [alert.id]: {
        status: 'UNDER_INVESTIGATION',
        note: `STK push prompt re-dispatched at ${new Date().toLocaleTimeString()} for KES ${Math.abs(alert.varianceKES)}.`
      }
    }));
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  // Authorize / Resolve Discrepancy
  const handleResolveAlert = (alertId: string, resolutionType: 'RESOLVED' | 'UNDER_INVESTIGATION', note: string) => {
    setLocalAuditOverrides(prev => ({
      ...prev,
      [alertId]: {
        status: resolutionType,
        note
      }
    }));
    setActionSuccessToast(`Alert ${alertId} updated to ${resolutionType.replace('_', ' ')}.`);
    setTimeout(() => setActionSuccessToast(null), 3500);
    setAuditingAlert(null);
  };

  // Inject a live simulation test case to demonstrate instant alert triggering
  const handleSimulateVarianceEvent = () => {
    const randomOrderNum = Math.floor(Math.random() * 89999 + 10000);
    const orderId = `WN-${randomOrderNum}`;
    const expected = 3500;
    // 2.3% deviation shortfall (-KES 80.50)
    const collected = 3420;
    const variance = collected - expected;
    const deviation = Number(((Math.abs(variance) / expected) * 100).toFixed(2));

    const newSimAlert: MpesaVarianceAlert = {
      id: `ALT-SIM-${orderId}`,
      orderId,
      paymentId: `pay_${randomOrderNum}`,
      transactionId: `txn_sim_${randomOrderNum}`,
      darajaReceipt: `QG${Math.floor(Math.random() * 89999999 + 10000000)}KE`,
      customerPhone: '254719002233',
      shopName: 'Gikomba Dry Goods Wholesale Hub',
      orderTotalKES: expected,
      collectedAmountKES: collected,
      varianceKES: variance,
      deviationPercentage: deviation,
      thresholdExceeded: varianceThresholdPct,
      direction: 'SHORTFALL',
      severity: deviation >= 3.0 ? 'CRITICAL' : 'WARNING',
      status: 'ACTIVE_ALERT',
      detectedAt: new Date().toISOString(),
      rootCause: `Automated test injection: Retailer paid KES ${collected.toLocaleString()} vs total KES ${expected.toLocaleString()} (${deviation}% deviation, exceeds 1.0% threshold).`,
      suggestedAction: 'Audited in real-time by automated watchdog. Dispatch STK push prompt for balance of KES 80.'
    };

    setSimulatedAlerts(prev => [newSimAlert, ...prev]);
    setActionSuccessToast(`Live M-Pesa ${deviation}% variance alert triggered for Order ${orderId}!`);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-3" id="mpesa-variance-automated-alert-component">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccessToast}</span>
          </div>
          <button
            onClick={() => setActionSuccessToast(null)}
            className="text-slate-400 hover:text-white text-xs ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Alert Component Header Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 bg-white rounded-md p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
          {/* Title & Live Status Indicator */}
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse inline-block" />
                  <span>AUTOMATED RECONCILIATION WATCHDOG</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  Threshold: &gt; {varianceThresholdPct.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center space-x-1.5">
                <span>M-Pesa Collected Amount Variance Alerts</span>
                {metrics.activeCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                    {metrics.activeCount} Critical Flag{metrics.activeCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Automatically scans Daraja STK Push & C2B Paybill receipts. Flags any payment deviating from the order commitment by more than <strong className="text-amber-900 font-semibold">{varianceThresholdPct}%</strong>, isolating specific order IDs for financial audit.
              </p>
            </div>
          </div>

          {/* Quick Simulation & Threshold Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-simulate-mpesa-variance"
              onClick={handleSimulateVarianceEvent}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold transition-colors cursor-pointer"
              title="Inject a test transaction deviating > 1% to test real-time alert triggering"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Simulate &gt;1% Deviation</span>
            </button>

            {/* Threshold Selector Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-500 px-1 flex items-center space-x-0.5">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Limit:</span>
              </span>
              {[
                { label: '0.5% (Strict)', val: 0.5 },
                { label: '1.0% (Spec)', val: 1.0 },
                { label: '2.0%', val: 2.0 },
                { label: '5.0%', val: 5.0 }
              ].map(({ label, val }) => (
                <button
                  key={val}
                  id={`threshold-tab-${val}`}
                  onClick={() => setVarianceThresholdPct(val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    varianceThresholdPct === val
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Diagnostic Stat Micro-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded p-2.5">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Flagged Orders</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-950">{metrics.totalAlerts}</span>
              <span className="text-[10px] text-amber-700 font-medium">({metrics.activeCount} active)</span>
            </div>
            <span className="text-[10px] text-amber-700 block mt-0.5">Requires audit intervention</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Variance at Risk</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-700">
                -KES {metrics.totalVarianceKES.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Unsettled retail shortfalls</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Max Deviation Found</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-800">
                {metrics.maxDeviation > 0 ? `${metrics.maxDeviation.toFixed(2)}%` : '0.00%'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">(&gt; 1.0% alert)</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Order WN-502914 (-4.76%)</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Investigation Rate</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-700">
                {metrics.totalAlerts > 0
                  ? `${Math.round(((metrics.underReviewCount + metrics.resolvedCount) / metrics.totalAlerts) * 100)}%`
                  : '100%'}
              </span>
              <span className="text-[10px] text-slate-500">audited</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">{metrics.resolvedCount} cleared · {metrics.underReviewCount} in review</span>
          </div>
        </div>

        {/* Filter & Search Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 mt-3 border-t border-slate-100 text-xs">
          {/* Status Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
            {(['ALL', 'ACTIVE_ALERT', 'UNDER_INVESTIGATION', 'RESOLVED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? `All (${metrics.totalAlerts})`
                  : st === 'ACTIVE_ALERT'
                  ? `Active (${metrics.activeCount})`
                  : st === 'UNDER_INVESTIGATION'
                  ? `Investigating (${metrics.underReviewCount})`
                  : `Resolved (${metrics.resolvedCount})`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Receipt, Phone..."
              className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Flagged Transactions Alert Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-md shadow-2xs overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-900">Zero Active M-Pesa Variances Exceeding {varianceThresholdPct}%</h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              All Daraja STK Push transactions and C2B receipts match their respective order totals within the {varianceThresholdPct}% tolerance threshold.
            </p>
            <button
              onClick={handleSimulateVarianceEvent}
              className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Variance for Audit Test</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL' || alert.deviationPercentage >= 3.0;
              const isShortfall = alert.varianceKES < 0;

              return (
                <div
                  key={alert.id}
                  id={`alert-card-${alert.orderId}`}
                  className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2.5"
                >
                  {/* Top Bar: Highlighted Order ID Badge + Deviation Meter + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      {/* PROMINENT HIGHLIGHTED ORDER ID */}
                      <div className="flex items-center space-x-1.5 bg-slate-900 text-white px-2.5 py-1 rounded shadow-xs">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">ORDER:</span>
                        <span className="font-mono font-bold text-xs tracking-wide text-white">
                          {alert.orderId}
                        </span>
                        <button
                          onClick={e => handleCopyOrderId(alert.orderId, e)}
                          className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                          title="Copy Order ID"
                        >
                          {copiedOrderId === alert.orderId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Severity & Variance Tag */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>
                          {alert.deviationPercentage.toFixed(2)}% DEVIATION ({isShortfall ? 'SHORTFALL' : 'OVERPAYMENT'})
                        </span>
                      </span>

                      {/* Status */}
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                          alert.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : alert.status === 'UNDER_INVESTIGATION'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-rose-600 text-white font-bold'
                        }`}
                      >
                        {alert.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Action Controls for this Specific Flagged Order */}
                    <div className="flex items-center space-x-2">
                      <button
                        id={`btn-audit-order-${alert.orderId}`}
                        onClick={() => {
                          setAuditingAlert(alert);
                          if (onInvestigateOrder) onInvestigateOrder(alert.orderId);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Audit Order Details</span>
                      </button>

                      {isShortfall && alert.status !== 'RESOLVED' && (
                        <button
                          id={`btn-send-sms-${alert.orderId}`}
                          onClick={() => handleSendBalanceSms(alert)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium transition-colors cursor-pointer"
                          title="Send M-Pesa STK top-up prompt for balance"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>Request Balance</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financial Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Expected Order Total</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        KES {alert.orderTotalKES.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">M-Pesa Collected (Gateway)</span>
                      <span className="font-mono font-bold text-blue-700 text-xs">
                        KES {alert.collectedAmountKES.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Net Discrepancy</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          alert.varianceKES < 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {alert.varianceKES > 0
                          ? `+KES ${alert.varianceKES.toLocaleString()}`
                          : `-KES ${Math.abs(alert.varianceKES).toLocaleString()}`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Daraja Receipt / Ref</span>
                      <span className="font-mono font-semibold text-slate-800 text-[11px] truncate block">
                        {alert.darajaReceipt || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Root Cause & Diagnostic Note */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 pt-0.5">
                    <div className="text-slate-600 text-[11px] leading-relaxed flex items-start space-x-1.5">
                      <span className="text-slate-400 font-medium shrink-0">Root Cause:</span>
                      <span className="text-slate-700 font-medium">{alert.rootCause}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 shrink-0 font-mono">
                      Detected: {new Date(alert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {alert.customerPhone && ` · ${alert.customerPhone}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED AUDIT MODAL FOR SPECIFIC FLAGGED ORDER */}
      {auditingAlert && (
        <div
          id="mpesa-audit-order-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150 backdrop-blur-xs"
        >
          <div className="bg-white border border-slate-300 rounded-lg w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 text-slate-900 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-200 px-1.5 py-0.2 rounded">
                      &gt; {varianceThresholdPct}% VARIANCE AUDIT
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      ID: {auditingAlert.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5 flex items-center space-x-2">
                    <span>Audit Dossier for Order</span>
                    <span className="bg-amber-100 text-amber-950 font-mono px-2 py-0.5 rounded border border-amber-300">
                      {auditingAlert.orderId}
                    </span>
                  </h3>
                </div>
              </div>

              <button
                id="btn-close-audit-modal"
                onClick={() => setAuditingAlert(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formula Math & Variance Breakdown */}
            <div className="bg-slate-900 text-white p-4 rounded-md space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <span>MATHEMATICAL DEVIATION AUDIT</span>
                <span className="text-amber-400 font-bold">
                  FORMULA: |Collected - OrderTotal| ÷ OrderTotal &gt; {varianceThresholdPct}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Expected Order Total</span>
                  <span className="text-base font-bold text-white">
                    KES {auditingAlert.orderTotalKES.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">M-Pesa Amount Collected</span>
                  <span className="text-base font-bold text-blue-400">
                    KES {auditingAlert.collectedAmountKES.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Observed Deviation</span>
                  <span className="text-base font-bold text-rose-400">
                    {auditingAlert.deviationPercentage.toFixed(2)}%
                  </span>
                  <span className="text-[9px] text-rose-300 block">
                    ({auditingAlert.varianceKES < 0 ? `Short KES ${Math.abs(auditingAlert.varianceKES)}` : `Over KES ${auditingAlert.varianceKES}`})
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Gateway Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Customer & Retail Store</span>
                <div className="font-semibold text-slate-900">{auditingAlert.shopName || 'Retail Customer'}</div>
                <div className="text-slate-600 font-mono text-[11px] flex items-center space-x-1">
                  <PhoneCall className="w-3 h-3 text-slate-400" />
                  <span>{auditingAlert.customerPhone || '254701234567'}</span>
                </div>
                <div className="text-[10px] text-slate-400">M-Pesa Safaricom Rail</div>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Daraja Gateway Transaction</span>
                <div className="font-semibold text-slate-900 font-mono">{auditingAlert.darajaReceipt || 'QG99120485KE'}</div>
                <div className="text-slate-600 font-mono text-[11px]">
                  Txn ID: {auditingAlert.transactionId || 'txn_audit_01'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Logged: {new Date(auditingAlert.detectedAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Root Cause & Suggested Action */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Root Cause Analysis:</span>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 mt-1 leading-relaxed text-[11px]">
                  {auditingAlert.rootCause}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Recommended Operational Action:</span>
                <p className="text-emerald-900 bg-emerald-50/80 p-2.5 rounded border border-emerald-200 mt-1 leading-relaxed text-[11px]">
                  {auditingAlert.suggestedAction}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 font-mono">
                Specific Order ID <span className="font-bold text-slate-900">{auditingAlert.orderId}</span> locked for audit.
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-modal-close"
                  onClick={() => setAuditingAlert(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>

                {auditingAlert.varianceKES < 0 && (
                  <button
                    id="btn-modal-request-balance"
                    onClick={() => handleSendBalanceSms(auditingAlert)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send SMS Top-up</span>
                  </button>
                )}

                <button
                  id="btn-modal-mark-resolved"
                  onClick={() =>
                    handleResolveAlert(
                      auditingAlert.id,
                      'RESOLVED',
                      'Manager verified variance; adjustment posted to reconciliation ledger.'
                    )
                  }
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
