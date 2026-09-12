import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Award, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  PackageCheck,
  Zap,
  TrendingUp,
  Filter
} from 'lucide-react';
import { WholesalerLocation, Order } from '../../types/wayno';
import { WHOLESALERS, SUPPLIER_PRODUCTS } from '../../data/mockData';

interface WholesalersManagerProps {
  orders: Order[];
}

export const WholesalersManager: React.FC<WholesalersManagerProps> = ({ orders }) => {
  const [wholesalers, setWholesalers] = useState<WholesalerLocation[]>(WHOLESALERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  const toggleWholesalerStatus = (id: string) => {
    setWholesalers(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, status: w.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
      }
      return w;
    }));
  };

  const filteredWholesalers = wholesalers.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = zoneFilter === 'ALL' || w.serviceZoneId === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const activeHubs = wholesalers.filter(w => w.status === 'ACTIVE').length;
  const avgPrepTime = Math.round(
    wholesalers.reduce((sum, w) => sum + w.avgPrepTimeMinutes, 0) / wholesalers.length
  );
  const avgReliability = (
    wholesalers.reduce((sum, w) => sum + w.reliabilityScore, 0) / wholesalers.length
  ).toFixed(1);

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Supply Hubs</span>
          <span className="text-base font-bold text-slate-900 font-mono">{activeHubs} / {wholesalers.length} Depots</span>
          <span className="text-[10px] text-emerald-700 block font-medium">Nairobi Core Corridors</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Avg Prep Time SLA</span>
          <span className="text-base font-bold text-slate-900 font-mono">{avgPrepTime} Minutes</span>
          <span className="text-[10px] text-emerald-700 block font-medium">Sub-20m target met</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Network Reliability</span>
          <span className="text-base font-bold text-emerald-800 font-mono">{avgReliability}%</span>
          <span className="text-[10px] text-slate-500 block">Stock fill rate accuracy</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Master SKU Linkage</span>
          <span className="text-base font-bold text-slate-900 font-mono">
            {SUPPLIER_PRODUCTS.length} Price Feeds
          </span>
          <span className="text-[10px] text-slate-500 block">Live supplier inventory</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>Wholesale Depot Network & Fulfillment SLAs</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Oversee distribution partners, depot staging bays, dispatch preparation performance, and inventory sync health.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search depot or business..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-64"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Zones</option>
              <option value="zone_nairobi_central">Central (Eastleigh)</option>
              <option value="zone_nairobi_south">South (Industrial Area)</option>
              <option value="zone_nairobi_west">West (Nairobi West)</option>
            </select>
          </div>
        </div>

        {/* Wholesalers Table */}
        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Depot & Legal Entity</th>
                <th className="py-2.5 px-3">Location & Service Zone</th>
                <th className="py-2.5 px-3">Operating Hours</th>
                <th className="py-2.5 px-3">Reliability & SLA</th>
                <th className="py-2.5 px-3">Inventory Feeds</th>
                <th className="py-2.5 px-3">Fulfillment Queue</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWholesalers.map(wholesaler => {
                const depotOrders = orders.filter(o => o.wholesalerLocationId === wholesaler.id);
                const pendingOrders = depotOrders.filter(o => 
                  o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'SUPPLIER_PENDING'
                ).length;
                const depotSkus = SUPPLIER_PRODUCTS.filter(sp => sp.wholesalerLocationId === wholesaler.id);
                const isSlow = wholesaler.avgPrepTimeMinutes > 15;

                return (
                  <tr key={wholesaler.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {wholesaler.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{wholesaler.name}</span>
                          <span className="text-[11px] text-slate-500">{wholesaler.businessName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-800 block">{wholesaler.address}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {wholesaler.serviceZoneId}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1 text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-[11px]">{wholesaler.operatingHours}</span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase mt-0.5 inline-block ${
                        wholesaler.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {wholesaler.status}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 font-mono text-xs">
                          {wholesaler.reliabilityScore}%
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                          isSlow ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {wholesaler.avgPrepTimeMinutes}m avg
                        </span>
                      </div>
                      {isSlow && (
                        <span className="text-[9px] text-amber-700 flex items-center space-x-0.5 mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Approaching SLA cap</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-slate-900 block text-xs">
                        {depotSkus.length} active SKUs
                      </span>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        {depotSkus.filter(s => s.availability).length} in stock
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-xs">
                      {pendingOrders > 0 ? (
                        <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          {pendingOrders} in prep
                        </span>
                      ) : (
                        <span className="text-slate-400">Queue clear</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => toggleWholesalerStatus(wholesaler.id)}
                        className={`text-[10px] font-medium px-2 py-1 rounded border transition-colors cursor-pointer ${
                          wholesaler.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {wholesaler.status === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                      </button>
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
