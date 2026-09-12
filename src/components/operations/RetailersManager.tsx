import React, { useState } from 'react';
import { 
  Store, 
  MapPin, 
  Phone, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Clock, 
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';
import { RetailerShop, Order } from '../../types/wayno';
import { INITIAL_SHOPS } from '../../data/mockData';

interface RetailersManagerProps {
  orders: Order[];
}

export const RetailersManager: React.FC<RetailersManagerProps> = ({ orders }) => {
  const [shops, setShops] = useState<RetailerShop[]>(INITIAL_SHOPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [editingCreditShopId, setEditingCreditShopId] = useState<string | null>(null);
  const [creditLimits, setCreditLimits] = useState<Record<string, number>>({
    shop_01: 45000,
    shop_02: 30000,
    shop_03: 60000,
  });

  const toggleShopStatus = (shopId: string) => {
    setShops(prev => prev.map(shop => {
      if (shop.id === shopId) {
        const nextStatus = shop.operatingStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        return { ...shop, operatingStatus: nextStatus };
      }
      return shop;
    }));
  };

  const handleUpdateCreditLimit = (shopId: string, newLimit: number) => {
    setCreditLimits(prev => ({ ...prev, [shopId]: Math.max(5000, newLimit) }));
    setEditingCreditShopId(null);
  };

  const filteredShops = shops.filter(shop => {
    const matchesSearch = 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.shopOwner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.phone.includes(searchQuery);

    const matchesZone = selectedZone === 'ALL' || shop.serviceZoneId === selectedZone;
    const matchesStatus = statusFilter === 'ALL' || shop.operatingStatus === statusFilter;

    return matchesSearch && matchesZone && matchesStatus;
  });

  const totalDukas = shops.length;
  const openDukas = shops.filter(s => s.operatingStatus === 'OPEN').length;

  return (
    <div className="space-y-4">
      {/* KPI Overview Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Registered Dukas</span>
          <span className="text-base font-bold text-slate-900 font-mono">{totalDukas} Active Retailers</span>
          <span className="text-[10px] text-emerald-700 block font-medium">100% KYC Verified</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Operating Status</span>
          <span className="text-base font-bold text-emerald-800 font-mono">{openDukas} / {totalDukas} Open</span>
          <span className="text-[10px] text-slate-500 block">Accepting replenishment orders</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Total Extended Credit Line</span>
          <span className="text-base font-bold text-slate-900 font-mono">
            KES {Object.values(creditLimits).reduce((a, b) => a + b, 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">7-day BNPL revolving facility</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Corridor Compliance</span>
          <span className="text-base font-bold text-emerald-700 font-mono">100% Geofenced</span>
          <span className="text-[10px] text-slate-500 block">Nairobi Metro bounds locked</span>
        </div>
      </div>

      {/* Control Bar: Search & Filtering */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Store className="w-4 h-4 text-slate-700" />
              <span>Retail Duka Management & Credit Registry</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Manage informal retail merchant profiles, operating hours, geofence anchors, and revolving trade credit lines.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search duka, owner, or phone..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-64"
              />
            </div>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Service Zones</option>
              <option value="zone_nairobi_east">Nairobi East (Kariobangi/Dandora)</option>
              <option value="zone_nairobi_west">Nairobi West (Kawangware)</option>
              <option value="zone_nairobi_central">Nairobi Central (Eastleigh)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="CLOSED">Closed Only</option>
            </select>
          </div>
        </div>

        {/* Dukas Table */}
        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Duka & Owner</th>
                <th className="py-2.5 px-3">Location & Service Zone</th>
                <th className="py-2.5 px-3">GPS Coordinates</th>
                <th className="py-2.5 px-3">Credit Facility</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Order History</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShops.map(shop => {
                const shopOrders = orders.filter(o => o.retailerId === shop.retailerId);
                const totalSpent = shopOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                const activeOrder = shopOrders.find(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
                const limit = creditLimits[shop.id] || 30000;
                const creditUtilization = Math.min(100, Math.round((totalSpent % limit) / limit * 100));

                return (
                  <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {shop.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{shop.name}</span>
                          <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <span>{shop.shopOwner}</span>
                            <span>•</span>
                            <span className="font-mono">{shop.phone}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-800 block">{shop.address}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {shop.serviceZoneId}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}</span>
                      </div>
                      <span className="text-[9px] text-emerald-700 font-sans font-medium block">
                        Verified Geofence
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {editingCreditShopId === shop.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            defaultValue={limit}
                            id={`credit-input-${shop.id}`}
                            className="w-20 px-1 py-0.5 text-xs border border-slate-300 rounded font-mono"
                          />
                          <button
                            onClick={() => {
                              const el = document.getElementById(`credit-input-${shop.id}`) as HTMLInputElement;
                              if (el) handleUpdateCreditLimit(shop.id, Number(el.value));
                            }}
                            className="text-[10px] px-2 py-0.5 bg-slate-900 text-white rounded font-medium"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-semibold text-slate-900">KES {limit.toLocaleString()}</span>
                            <button
                              onClick={() => setEditingCreditShopId(shop.id)}
                              className="text-[9px] text-slate-500 hover:text-slate-800 underline ml-1"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-full ${creditUtilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${creditUtilization}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {creditUtilization}% utilized
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        shop.operatingStatus === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${shop.operatingStatus === 'OPEN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{shop.operatingStatus}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block font-mono text-[11px]">
                        {shopOrders.length} orders (KES {totalSpent.toLocaleString()})
                      </span>
                      {activeOrder ? (
                        <span className="text-[10px] text-emerald-700 font-medium">
                          Active: {activeOrder.status}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">No active dispatch</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => toggleShopStatus(shop.id)}
                        className={`text-[10px] font-medium px-2 py-1 rounded border transition-colors cursor-pointer ${
                          shop.operatingStatus === 'OPEN'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {shop.operatingStatus === 'OPEN' ? 'Set Closed' : 'Set Open'}
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
