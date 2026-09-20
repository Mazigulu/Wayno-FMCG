import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  ExternalLink,
  FileText,
  ArrowUpRight,
  Smartphone,
  Receipt,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Order, Payment, PaymentTransaction } from '../../types/wayno';
import {
  SettlementWindowTransactionItem,
  DiscrepancyRecord,
  ReconciliationHourlyTrend,
  generateSettlementWindowTransactions
} from '../../data/reconciliationData';

interface SettlementWindowModalProps {
  windowInfo: ReconciliationHourlyTrend | { timeLabel: string; [key: string]: any } | null;
  baseTransactions?: PaymentTransaction[];
  orders?: Order[];
  discrepancies?: DiscrepancyRecord[];
  onClose: () => void;
  onInvestigateOrder?: (orderId: string) => void;
}

export const SettlementWindowModal: React.FC<SettlementWindowModalProps> = ({
  windowInfo,
  baseTransactions = [],
  orders = [],
  discrepancies = [],
  onClose,
  onInvestigateOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'VARIANCE'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPayloadId, setExpandedPayloadId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const timeLabel = windowInfo?.timeLabel || '10:00';
  const hourPrefix = timeLabel.includes(':') ? timeLabel.split(':')[0] : '10';
  const startHour = parseInt(hourPrefix, 10);
  const endHour = (startHour + 2) % 24;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const windowTimeFormatted = `${pad(startHour)}:00 - ${pad(endHour)}:00 EAT`;
  const windowBatchId = `BATCH-2026-W38-${pad(startHour)}00`;

  // Generate / filter individual transaction logs for this specific settlement window
  const windowTransactions: SettlementWindowTransactionItem[] = useMemo(() => {
    return generateSettlementWindowTransactions(
      timeLabel,
      baseTransactions,
      orders,
      discrepancies
    );
  }, [timeLabel, baseTransactions, orders, discrepancies]);

  // Filtered transactions based on UI controls
  const filteredTransactions = useMemo(() => {
    return windowTransactions.filter(item => {
      if (statusFilter === 'SUCCESS' && item.status !== 'SUCCESS') return false;
      if (statusFilter === 'FAILED' && item.status !== 'FAILED') return false;
      if (statusFilter === 'REVERSED' && item.status !== 'REVERSED') return false;
      if (statusFilter === 'VARIANCE' && !item.isVarianceAlert && item.reconciliationState !== 'UNMATCHED_AMOUNT') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q) ||
        item.phoneNumber.includes(q) ||
        item.providerReference.toLowerCase().includes(q) ||
        item.shopName.toLowerCase().includes(q) ||
        item.checkoutRequestId.toLowerCase().includes(q)
      );
    });
  }, [windowTransactions, statusFilter, searchQuery]);

  // Aggregate Metrics for this window
  const metrics = useMemo(() => {
    const total = windowTransactions.length;
    const successCount = windowTransactions.filter(t => t.status === 'SUCCESS').length;
    const failedCount = windowTransactions.filter(t => t.status === 'FAILED').length;
    const reversedCount = windowTransactions.filter(t => t.status === 'REVERSED').length;
    const varianceCount = windowTransactions.filter(t => t.isVarianceAlert || t.reconciliationState === 'UNMATCHED_AMOUNT').length;
    const totalVolumeKES = windowTransactions
      .filter(t => t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);
    const avgLatency = total > 0
      ? (windowTransactions.reduce((sum, t) => sum + t.latencySeconds, 0) / total).toFixed(1)
      : '3.4';
    const successRate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '94.4';

    return {
      total,
      successCount,
      failedCount,
      reversedCount,
      varianceCount,
      totalVolumeKES: windowInfo?.volumeCapturedKES || totalVolumeKES,
      avgLatency,
      successRate: windowInfo?.successRate ? windowInfo.successRate.toFixed(1) : successRate
    };
  }, [windowTransactions, windowInfo]);

  // Clipboard copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setToastMessage(`Copied ${label}: ${text}`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2500);
  };

  // Export CSV logs helper
  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Order ID',
      'Timestamp (EAT)',
      'Shop Name',
      'Phone Number',
      'Amount (KES)',
      'Status',
      'Reconciliation State',
      'Daraja Receipt',
      'Result Code',
      'Checkout Request ID'
    ];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.orderId,
      t.timestamp,
      `"${t.shopName.replace(/"/g, '""')}"`,
      t.phoneNumber,
      t.amount,
      t.status,
      t.reconciliationState,
      t.providerReference,
      t.darajaResultCode,
      t.checkoutRequestId
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Settlement_Logs_${timeLabel.replace(':', '')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`Exported ${filteredTransactions.length} transaction records to CSV.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!windowInfo) return null;

  return (
    <div
      id="settlement-window-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settlement-window-modal-container"
        className="bg-white border border-slate-300 rounded-lg w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-98 duration-150"
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {windowBatchId}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>Settlement Window Verified</span>
                </span>
                {metrics.varianceCount > 0 && (
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3 text-rose-700" />
                    <span>{metrics.varianceCount} M-Pesa Variance Flag</span>
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1 flex items-center space-x-2">
                <span>Settlement Window Transaction Logs:</span>
                <span className="font-mono text-emerald-700">{windowTimeFormatted}</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Itemized transaction audit trail from Safaricom Daraja STK Push & C2B gateway. Click any transaction or order to audit.
              </p>
            </div>
          </div>

          {/* Top Actions: Export CSV & Close */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="btn-export-window-csv"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Download transaction logs as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              id="btn-close-window-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Window Diagnostic Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 border-b border-slate-200 text-xs shrink-0">
          <div className="bg-white border border-slate-200 rounded p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Captured Volume (KES)</span>
            <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">
              KES {Number(metrics.totalVolumeKES).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">{metrics.successCount} completed payments</span>
          </div>

          <div className="bg-white border border-slate-200 rounded p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">STK Push Success Rate</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{metrics.successRate}%</span>
              <span className="text-[10px] text-slate-500">
                ({metrics.successCount}/{metrics.total})
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, parseFloat(metrics.successRate)))}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Terminal Outliers</span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-700">{metrics.failedCount}</span>
              <span className="text-[10px] text-slate-500">Failed</span>
              <span className="text-slate-300">·</span>
              <span className="text-lg font-bold font-mono text-purple-700">{metrics.reversedCount}</span>
              <span className="text-[10px] text-slate-500">Reversals</span>
            </div>
            <span className="text-[10px] text-slate-500">Protected via auto-idempotency</span>
          </div>

          <div className="bg-white border border-slate-200 rounded p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Mean Webhook Latency</span>
            <span className="text-lg font-bold font-mono text-blue-700 mt-0.5 block">
              {metrics.avgLatency}s
            </span>
            <span className="text-[10px] text-slate-500">Safaricom Daraja API response time</span>
          </div>
        </div>

        {/* Filter Ribbon & Search Bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0">
          {/* Status Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
            {[
              { id: 'ALL', label: `All Logs (${metrics.total})` },
              { id: 'SUCCESS', label: `Successful (${metrics.successCount})` },
              { id: 'FAILED', label: `Failed (${metrics.failedCount})` },
              { id: 'REVERSED', label: `Reversed (${metrics.reversedCount})` },
              ...(metrics.varianceCount > 0
                ? [{ id: 'VARIANCE', label: `Variance Alerts (${metrics.varianceCount})` }]
                : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Txn, Phone, Receipt..."
              className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Scrollable Transaction Logs List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">No Transactions Found</h4>
              <p className="text-[11px] text-slate-500">
                No transaction logs matched your search or status filter in this settlement window.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredTransactions.map(txn => {
              const isExpanded = expandedPayloadId === txn.id;
              const isVariance = txn.isVarianceAlert || txn.reconciliationState === 'UNMATCHED_AMOUNT';

              return (
                <div
                  key={txn.id}
                  id={`window-txn-row-${txn.id}`}
                  className={`p-3.5 hover:bg-slate-50/80 transition-colors space-y-2 ${
                    isVariance ? 'bg-amber-50/40 border-l-3 border-amber-500' : ''
                  }`}
                >
                  {/* Row Top: Time + IDs + Status Badges + Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Monospace Timestamp */}
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {new Date(txn.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}{' '}
                        EAT
                      </span>

                      {/* Transaction ID */}
                      <div className="flex items-center space-x-1 font-mono text-xs font-semibold text-slate-800">
                        <span>{txn.id}</span>
                        <button
                          onClick={() => handleCopy(txn.id, 'Transaction ID')}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                          title="Copy Transaction ID"
                        >
                          {copiedId === txn.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Linked Order ID (Highlighted) */}
                      <div className="flex items-center space-x-1 bg-slate-900 text-white px-2 py-0.5 rounded text-xs font-mono font-bold shadow-2xs">
                        <span className="text-amber-400 text-[10px]">ORDER:</span>
                        <span>{txn.orderId}</span>
                        <button
                          onClick={() => handleCopy(txn.orderId, 'Order ID')}
                          className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedId === txn.orderId ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded flex items-center space-x-1 ${
                          txn.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : txn.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : txn.status === 'REVERSED'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {txn.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : txn.status === 'FAILED' ? (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        ) : (
                          <RotateCcw className="w-3 h-3 text-purple-600" />
                        )}
                        <span>{txn.status}</span>
                      </span>

                      {/* Ledger Reconciliation Tag */}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          txn.reconciliationState === 'MATCHED'
                            ? 'bg-slate-100 text-slate-700'
                            : txn.reconciliationState === 'UNMATCHED_AMOUNT'
                            ? 'bg-amber-200 text-amber-900 font-bold border border-amber-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {txn.reconciliationState.replace('_', ' ')}
                      </span>

                      {isVariance && (
                        <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded flex items-center space-x-1 shadow-2xs">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{txn.variancePercentage}% Variance Alert</span>
                        </span>
                      )}
                    </div>

                    {/* Right-Hand Action Buttons */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setExpandedPayloadId(isExpanded ? null : txn.id)}
                        className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 hover:bg-slate-100 text-slate-700 rounded transition-colors cursor-pointer"
                      >
                        <span>Raw Payload</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {onInvestigateOrder && (
                        <button
                          id={`btn-audit-order-${txn.orderId}`}
                          onClick={() => onInvestigateOrder(txn.orderId)}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors cursor-pointer shadow-2xs"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Audit Order</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financial & Retailer Data Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Collected Amount</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        KES {txn.amount.toLocaleString()}
                      </span>
                      {txn.varianceKES && txn.varianceKES !== 0 ? (
                        <span className="text-[10px] text-rose-600 block font-mono">
                          ({txn.varianceKES < 0 ? `Short KES ${Math.abs(txn.varianceKES)}` : `Over KES ${txn.varianceKES}`})
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 block">100% matched to bill</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Retail Customer / Phone</span>
                      <div className="font-medium text-slate-800 truncate">{txn.shopName}</div>
                      <div className="font-mono text-slate-500 text-[11px]">{txn.phoneNumber}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Gateway Reference / Receipt</span>
                      <div className="font-mono font-semibold text-slate-800 text-[11px] truncate">
                        {txn.providerReference || 'Pending Webhook'}
                      </div>
                      <div className="text-[10px] text-slate-500">{txn.provider}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block">Turnaround / Webhook Latency</span>
                      <span className="font-mono text-blue-700 font-semibold text-xs block">
                        {txn.latencySeconds}s
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Code {txn.darajaResultCode}
                      </span>
                    </div>
                  </div>

                  {/* Error or Root Cause Note if Applicable */}
                  {(txn.failureReason || isVariance) && (
                    <div className="text-xs bg-rose-50 border border-rose-200 text-rose-900 p-2 rounded flex items-start space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="leading-snug text-[11px]">
                        {txn.failureReason && <div><strong>Failure Diagnostic:</strong> {txn.failureReason}</div>}
                        {isVariance && (
                          <div>
                            <strong>Variance Watchdog:</strong> Collected KES {txn.amount.toLocaleString()} vs committed order total KES {txn.orderTotalAmount.toLocaleString()} ({txn.variancePercentage}% deviation).
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Expandable Raw Daraja Callback Payload */}
                  {isExpanded && (
                    <div className="bg-slate-950 text-slate-200 p-3 rounded text-[11px] font-mono space-y-2 border border-slate-800 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                        <span>SAFARICOM DARAJA RAW WEBHOOK CALLBACK BODY</span>
                        <span>HTTP 200 OK · Idempotency Guaranteed</span>
                      </div>
                      <pre className="overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
{JSON.stringify(
  {
    Body: {
      stkCallback: {
        MerchantRequestID: txn.merchantRequestId,
        CheckoutRequestID: txn.checkoutRequestId,
        ResultCode: txn.darajaResultCode,
        ResultDesc: txn.darajaResultDesc,
        CallbackMetadata: txn.status === 'SUCCESS' ? {
          Item: [
            { Name: 'Amount', Value: txn.amount },
            { Name: 'MpesaReceiptNumber', Value: txn.providerReference },
            { Name: 'Balance', Value: 0 },
            { Name: 'TransactionDate', Value: 20260918000000 + startHour * 10000 },
            { Name: 'PhoneNumber', Value: txn.phoneNumber }
          ]
        } : undefined
      }
    }
  },
  null,
  2
)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="text-slate-600 font-mono text-[11px] flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Showing {filteredTransactions.length} of {metrics.total} settlement logs for window {windowTimeFormatted}.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
