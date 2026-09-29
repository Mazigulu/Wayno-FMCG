import React, { useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  ExternalLink,
  Wallet,
  AlertCircle,
  FileSpreadsheet,
  Check,
  RefreshCw
} from 'lucide-react';
import { Order, WholesalerLocation } from '../../types/wayno';
import { useWayno } from '../../context/WaynoContext';
import { calculateOrderRevenueSplit, SettlementPayoutRecord } from '../../services/revenueSharingService';

interface WholesalerSettlementViewProps {
  wholesaler: WholesalerLocation;
  orders: Order[];
}

export const WholesalerSettlementView: React.FC<WholesalerSettlementViewProps> = ({
  wholesaler,
  orders,
}) => {
  const { 
    wholesalerWallets, 
    settlementPayouts, 
    handleWholesalerWithdrawal 
  } = useWayno();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawNote, setWithdrawNote] = useState('');
  const [payoutResult, setPayoutResult] = useState<{ success: boolean; message: string; record?: SettlementPayoutRecord } | null>(null);

  // Active wallet for this depot
  const wallet = wholesalerWallets[wholesaler.id] || {
    wholesalerId: wholesaler.id,
    wholesalerName: wholesaler.name,
    availableBalanceKES: 142850,
    escrowLockedBalanceKES: 16800,
    totalLifetimeEarnedKES: 1845000,
    totalWithdrawnKES: 1702150,
    payoutMethod: 'BANK_PESALINK',
    bankName: 'Equity Bank Kenya',
    accountNumber: '0810293849102',
    autoSweepSchedule: 'DAILY_1700_EOD',
    lastSweepAt: 'Yesterday at 17:00 EAT',
  };

  // Orders fulfilled by this wholesaler
  const depotOrders = orders.filter(
    (o) => o.wholesalerLocationId === wholesaler.id || o.items?.some(it => it.wholesalerLocationId === wholesaler.id)
  );

  // Payout history for this wholesaler
  const depotPayouts = settlementPayouts.filter(
    (p) => p.recipientId === wholesaler.id
  );

  const handleOpenWithdrawModal = () => {
    setWithdrawAmount(wallet.availableBalanceKES);
    setPayoutResult(null);
    setIsWithdrawModalOpen(true);
  };

  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) return;
    const res = handleWholesalerWithdrawal(wholesaler.id, withdrawAmount, withdrawNote);
    setPayoutResult(res);
    if (res.success) {
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setPayoutResult(null);
      }, 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub-title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              SafeSettle Escrow & Wholesale Revenue Clearing
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent split payments: 100% retailer funds collected into escrow, 98% net goods payout released to your wallet upon delivery OTP confirmation.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenWithdrawModal}
            disabled={wallet.availableBalanceKES <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-4 py-2 rounded text-xs flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Instant Bank / B2B Sweep</span>
          </button>
        </div>
      </div>

      {/* Hero Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Available Balance */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase">
            <span>Available Balance</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
              READY TO WITHDRAW
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            KES {wallet.availableBalanceKES.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Auto-sweep scheduled for 17:00 EAT</span>
          </div>
        </div>

        {/* Escrow Locked Balance */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase">
            <span>Locked in Escrow</span>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-mono px-1.5 py-0.2 rounded border border-amber-200 font-bold">
              IN-TRANSIT
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">
            KES {wallet.escrowLockedBalanceKES.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Releases on Retailer Delivery OTP</span>
          </div>
        </div>

        {/* Total Lifetime Volume */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase">
            <span>Lifetime Sourced Volume</span>
            <span className="text-[10px] text-slate-400 font-mono">ALL-TIME</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            KES {wallet.totalLifetimeEarnedKES.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Total Withdrawn: KES {wallet.totalWithdrawnKES.toLocaleString()}</span>
          </div>
        </div>

        {/* Platform Take-rate & Destination */}
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase">
            <span>Settlement Channel</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-1.5 py-0.2 rounded font-bold">
              ZERO FEE
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {wallet.payoutMethod === 'BANK_PESALINK' ? wallet.bankName : 'M-Pesa B2B Paybill'}
          </div>
          <div className="text-[11px] text-slate-500 truncate pt-1">
            {wallet.payoutMethod === 'BANK_PESALINK' ? `Acc: ${wallet.accountNumber}` : wallet.paybillNumber}
          </div>
        </div>
      </div>

      {/* Tripartite Split Explanation Banner */}
      <div className="bg-slate-900 text-white rounded-md p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
            How Revenue Is Shared & Protected
          </span>
          <span className="text-slate-400 text-[11px]">Sustainable B2B Margin Architecture</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
            <div className="text-amber-400 font-bold mb-1">1. Retailer Pay-in (Escrow)</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              100% of cart total is charged via Safaricom M-Pesa Daraja and held in WAYNO Escrow. Money never goes directly to couriers, protecting buyers from stockouts and damaged goods.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
            <div className="text-emerald-400 font-bold mb-1">2. Wholesaler Net (98.0%)</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Wholesalers earn 98.0% net on bulk inventory. WAYNO retains a small 2.0% platform facilitation fee. Settlement is guaranteed with zero bad debt from informal shop credit.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3 rounded border border-slate-700">
            <div className="text-blue-400 font-bold mb-1">3. Automated Sweep / Withdrawal</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Upon retailer delivery confirmation, funds release instantly. Wholesalers enjoy free daily 17:00 bank sweeps via PesaLink/RTGS or instant midday on-demand cashout.
            </p>
          </div>
        </div>
      </div>

      {/* Order Settlement Split Ledger */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Wholesale Order Payout Ledger ({depotOrders.length} Orders)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Live Escrow Clearing</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Retailer Duka</th>
                <th className="py-2.5 px-3 text-right">Gross Goods (KES)</th>
                <th className="py-2.5 px-3 text-right">WAYNO Fee (2.0%)</th>
                <th className="py-2.5 px-3 text-right">Net Payout (KES)</th>
                <th className="py-2.5 px-3 text-center">Escrow Status</th>
                <th className="py-2.5 px-3">Settlement Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {depotOrders.map((order) => {
                const split = calculateOrderRevenueSplit(order);
                const isDelivered = order.status === 'DELIVERED';
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{order.id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 font-medium truncate max-w-xs">
                      {order.shopName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                      {split.wholesalerGrossGoodsKES.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-700">
                      -{split.wholesalerCommissionKES.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                      KES {split.wholesalerNetPayoutKES.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isDelivered ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SETTLED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>IN ESCROW</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-slate-500">
                      {isDelivered ? 'Delivery OTP Confirmed' : `Awaiting Handover (${order.status})`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Payouts & Bank Sweeps */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Disbursed Bank & B2B Sweeps Log
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Auto Daily 17:00 PesaLink Sweeps</span>
        </div>

        {depotPayouts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No external withdrawal sweeps recorded yet for this warehouse.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-900">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Disbursement ID</th>
                  <th className="py-2.5 px-3">Settlement Channel</th>
                  <th className="py-2.5 px-3">Destination Reference</th>
                  <th className="py-2.5 px-3">Bank / Daraja Ref</th>
                  <th className="py-2.5 px-3 text-right">Amount Disbursed</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {depotPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 font-medium">
                      {p.channel === 'BANK_PESALINK' ? 'Commercial Bank (PesaLink)' : 'M-Pesa B2B Paybill'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">{p.destinationRef}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-700">{p.referenceNumber}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                      KES {p.amountKES.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-slate-500">
                      {new Date(p.completedAt).toLocaleDateString()} {new Date(p.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instant Sweep Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 animate-in fade-in">
          <div className="bg-white border border-slate-300 rounded-lg w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Instant Wholesale Liquidity Sweep
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {payoutResult ? (
              <div className={`p-4 rounded-lg text-xs space-y-2 ${payoutResult.success ? 'bg-emerald-50 text-emerald-950 border border-emerald-200' : 'bg-rose-50 text-rose-950 border border-rose-200'}`}>
                <div className="flex items-center space-x-2 font-bold">
                  {payoutResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{payoutResult.success ? 'Sweep Executed Successfully' : 'Transfer Failed'}</span>
                </div>
                <p className="leading-relaxed">{payoutResult.message}</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteWithdrawal} className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Destination</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {wallet.payoutMethod === 'BANK_PESALINK' ? wallet.bankName : 'M-Pesa B2B Paybill'}
                  </div>
                  <div className="text-slate-600">
                    {wallet.payoutMethod === 'BANK_PESALINK' ? `Account Number: ${wallet.accountNumber}` : wallet.paybillNumber}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold pt-1">
                    Zero Transfer Fee · Instant Clearing via PesaLink
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Amount to Sweep (KES):
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Max: KES {wallet.availableBalanceKES.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={100}
                    max={wallet.availableBalanceKES}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono font-bold focus:border-slate-800 focus:outline-none"
                    required
                  />
                  <div className="flex items-center space-x-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.round(wallet.availableBalanceKES * 0.25))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.round(wallet.availableBalanceKES * 0.50))}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-medium"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(wallet.availableBalanceKES)}
                      className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded text-[10px] font-bold"
                    >
                      Full Balance (100%)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Internal Note / Reference (Optional):
                  </label>
                  <input
                    type="text"
                    value={withdrawNote}
                    onChange={(e) => setWithdrawNote(e.target.value)}
                    placeholder="e.g. Supplier unga replenishment batch #92"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs focus:border-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded cursor-pointer transition-colors shadow-2xs"
                  >
                    Confirm & Sweep KES {withdrawAmount.toLocaleString()}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
