import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Sparkles, 
  ArrowUpRight,
  Filter,
  Clock,
  ExternalLink
} from 'lucide-react';
import { TelemetryEvent } from '../../types/wayno';

interface SearchAnalyticsDeskProps {
  events: TelemetryEvent[];
}

export const SearchAnalyticsDesk: React.FC<SearchAnalyticsDeskProps> = ({ events }) => {
  const [filterPeriod, setFilterPeriod] = useState<string>('24H');
  const [searchFilter, setSearchFilter] = useState('');

  const searchEvents = events.filter(e => e.eventType === 'SEARCH_PERFORMED');

  const topQueries = [
    { query: 'unga wa ngano', count: 482, ctr: '84.2%', conversion: '42.1%', topResult: 'Pembe Wheat Flour 2kg', category: 'Grains & Flours' },
    { query: 'mafuta ya kupika', count: 418, ctr: '79.5%', conversion: '38.6%', topResult: 'Rina Vegetable Oil 20L', category: 'Cooking Fats & Oils' },
    { query: 'sukari mumias', count: 356, ctr: '91.0%', conversion: '51.2%', topResult: 'Mumias White Sugar 1kg', category: 'Sugar & Sweeteners' },
    { query: 'sabuni ya kipande', count: 312, ctr: '76.8%', conversion: '34.0%', topResult: 'Menengai Cream Bar Soap', category: 'Cleaning & Soaps' },
    { query: 'ketepa tea', count: 284, ctr: '88.3%', conversion: '46.7%', topResult: 'Ketepa Pride 100s', category: 'Beverages & Tea' },
    { query: 'njugu karanga', count: 240, ctr: '82.0%', conversion: '39.5%', topResult: 'Mama Pima Roasted Peanuts', category: 'Snacks & Confectionery' },
    { query: 'soko unga', count: 198, ctr: '80.1%', conversion: '40.2%', topResult: 'Soko Fortified Maize Meal', category: 'Grains & Flours' },
  ];

  const zeroResultQueries = [
    { query: 'omo washing powder 500g', attempts: 64, lastSearched: '12 mins ago', note: 'Depot brand stockout - sourcing alert dispatched', priority: 'HIGH' },
    { query: 'dawaat pishori 5kg', attempts: 48, lastSearched: '28 mins ago', note: 'Pack size mismatch - only 2kg cartons stocked', priority: 'MEDIUM' },
    { query: 'broadways white bread', attempts: 39, lastSearched: '45 mins ago', note: 'Perishable bakery not yet on platform', priority: 'LOW' },
    { query: 'geisha soap rose 225g', attempts: 32, lastSearched: '1 hour ago', note: 'Category expansion request logged', priority: 'MEDIUM' },
  ];

  const filteredTopQueries = topQueries.filter(q => 
    q.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
    q.topResult.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Total Search Invocations</span>
          <span className="text-base font-bold text-slate-900 font-mono">
            {(searchEvents.length + 3840).toLocaleString()} Queries
          </span>
          <span className="text-[10px] text-emerald-700 block font-medium">+14.2% vs yesterday</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">p95 Latency SLA</span>
          <span className="text-base font-bold text-emerald-800 font-mono">38ms</span>
          <span className="text-[10px] text-slate-500 block">Sub-50ms target met</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Sheng / Swahili Hit Rate</span>
          <span className="text-base font-bold text-indigo-700 font-mono">98.6%</span>
          <span className="text-[10px] text-slate-500 block">Fuzzy phonetic matching</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Zero-Result Stockout Rate</span>
          <span className="text-base font-bold text-slate-900 font-mono">1.8%</span>
          <span className="text-[10px] text-emerald-700 block font-medium">Within 3% benchmark</span>
        </div>
      </div>

      {/* Top Search Queries Desk */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-700" />
              <span>Top FMCG Search Queries & Conversion Funnel</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Aggregated query frequency, click-through rate (CTR), and search-to-cart conversion across retail dukas.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/admin/benchmark"
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>SLA Benchmark Suite</span>
              <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
            </Link>

            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter query or product..."
              className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-40 sm:w-44"
            />

            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="24H">Last 24 Hours</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Top Queries Table */}
        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Search Query Term</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Query Volume</th>
                <th className="py-2.5 px-3">Click-Through Rate (CTR)</th>
                <th className="py-2.5 px-3">Search-to-Cart Conversion</th>
                <th className="py-2.5 px-3 text-right">Top Converted SKU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTopQueries.map((item, idx) => (
                <tr key={item.query} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400 w-4">#{idx + 1}</span>
                      <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        "{item.query}"
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-slate-600">
                    {item.category}
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {item.count.toLocaleString()}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-emerald-800 font-bold">
                    {item.ctr}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-indigo-700 font-bold">
                    {item.conversion}
                  </td>

                  <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                    {item.topResult}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zero-Result Queries: Stockout & Demand Sourcing Alert */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Zero-Result Queries (Unmet Demand & Depot Stockouts)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              High-frequency queries returning 0 matching results across Nairobi depots, flagging inventory gaps for procurement.
            </p>
          </div>

          <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold self-start sm:self-auto">
            Procurement Pipeline Alert
          </span>
        </div>

        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Unfulfilled Query Term</th>
                <th className="py-2.5 px-3">Attempts (24h)</th>
                <th className="py-2.5 px-3">Last Attempt</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Procurement Root Cause / Action</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zeroResultQueries.map(item => (
                <tr key={item.query} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                    "{item.query}"
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                    {item.attempts} searches
                  </td>

                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                    {item.lastSearched}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      item.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-800'
                        : item.priority === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.priority}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                    {item.note}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => alert(`Catalog addition request logged for: "${item.query}"`)}
                      className="text-[10px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      Request Sourcing
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
