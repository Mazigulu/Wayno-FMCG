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
  DollarSign,
  Layers,
  Code2,
  Globe,
  X,
  UserCheck
} from 'lucide-react';
import { RetailerShop, Order, Retailer, Shop } from '../../types/wayno';
import { INITIAL_SHOPS, RETAILER_ACCOUNTS } from '../../data/mockData';
import { ZonePerformanceMetricsCard } from './ZonePerformanceMetricsCard';

interface RetailersManagerProps {
  orders: Order[];
}

export const RetailersManager: React.FC<RetailersManagerProps> = ({ orders }) => {
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [editingCreditShopId, setEditingCreditShopId] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [viewMode, setViewMode] = useState<'SHOPS' | 'ACCOUNTS'>('SHOPS');
  const [creditLimits, setCreditLimits] = useState<Record<string, number>>({
    shop_01: 45000,
    shop_02: 30000,
    shop_03: 60000,
  });

  const toggleShopStatus = (shopId: string) => {
    setShops(prev => prev.map(shop => {
      if (shop.id === shopId) {
        const nextStatus = shop.operatingStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        return { 
          ...shop, 
          operatingStatus: nextStatus,
          operating_status: nextStatus
        };
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
      (shop.shopOwner && shop.shopOwner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.phone && shop.phone.includes(searchQuery));

    const matchesZone = selectedZone === 'ALL' || shop.serviceZoneId === selectedZone;
    const matchesStatus = statusFilter === 'ALL' || shop.operatingStatus === statusFilter;

    return matchesSearch && matchesZone && matchesStatus;
  });

  const totalDukas = shops.length;
  const openDukas = shops.filter(s => s.operatingStatus === 'OPEN').length;

  return (
    <div className="space-y-4">
      {/* Section 12 Architectural Callout Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-lg p-3.5 border border-blue-800/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-blue-800/40">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-400/30">
              SECTION 12
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Shop Architecture & Retailer Association</span>
                <span className="text-[11px] text-blue-300 font-normal font-mono">(`shops` table)</span>
              </h2>
              <p className="text-[11px] text-slate-300">
                A retailer account (<span className="font-mono text-blue-200">retailers</span>) is associated with a physical shop (<span className="font-mono text-blue-200">shops</span>). PostGIS stores the geographical position for corridor dispatch and route optimization.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'SHOPS' ? 'ACCOUNTS' : 'SHOPS')}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-medium border border-blue-500/40 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-300" />
              <span>{viewMode === 'SHOPS' ? 'View Retailer Accounts (1:N)' : 'View Physical Shops'}</span>
            </button>
            <button
              onClick={() => setSelectedShop(shops[0])}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspect Schema & PostGIS</span>
            </button>
          </div>
        </div>

        {/* Section 12 Schema Pillars */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-2 text-[10px]">
          {[
            { field: 'id', desc: 'Shop PK' },
            { field: 'retailer_id', desc: 'Parent Account FK' },
            { field: 'name', desc: 'Duka Name' },
            { field: 'address', desc: 'Street / Plot' },
            { field: 'latitude', desc: 'WGS-84 Lat' },
            { field: 'longitude', desc: 'WGS-84 Lng' },
            { field: 'service_zone_id', desc: 'Corridor ID' },
            { field: 'operating_status', desc: 'OPEN / CLOSED' },
            { field: 'created_at', desc: 'Timestamp' },
          ].map((item, idx) => (
            <div key={idx} className="bg-blue-900/40 rounded px-1.5 py-1 border border-blue-700/30">
              <span className="font-mono font-bold text-blue-300 block">{item.field}</span>
              <span className="text-blue-400 text-[9px]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Overview Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Registered Dukas</span>
          <span className="text-base font-bold text-slate-900 font-mono">{totalDukas} Physical Shops</span>
          <span className="text-[10px] text-emerald-700 block font-medium">PostGIS Geo-Indexed</span>
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

      {viewMode === 'ACCOUNTS' ? (
        /* Retailer Accounts & Associated Physical Shops Hierarchy */
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-slate-700" />
                <span>Retailer Accounts (`retailers` table) & Associated Physical Shops</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Demonstrates the relational link where a merchant retailer account is associated with a physical shop registered in PostGIS.
              </p>
            </div>
            <button
              onClick={() => setViewMode('SHOPS')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Switch back to Physical Shops &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RETAILER_ACCOUNTS.map((retailer) => {
              const associatedShop = shops.find(s => s.retailerId === retailer.id || s.retailer_id === retailer.id);
              return (
                <div key={retailer.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold block">{retailer.id}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{retailer.name}</h4>
                      <span className="text-xs text-slate-600">{retailer.shopOwner}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {retailer.operatingStatus}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 font-mono bg-white p-2 rounded border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="text-slate-800">{retailer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Zone:</span>
                      <span className="text-slate-800">{retailer.serviceZoneId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credit Limit:</span>
                      <span className="text-emerald-700 font-bold">KES {retailer.creditLimit?.toLocaleString()}</span>
                    </div>
                  </div>

                  {associatedShop ? (
                    <div className="border-t border-slate-200 pt-2 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Associated Physical Shop (`shops`)
                      </span>
                      <div className="bg-blue-50/60 p-2 rounded border border-blue-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-950">{associatedShop.name}</span>
                          <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1.5 rounded">{associatedShop.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{associatedShop.address}</p>
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{associatedShop.latitude.toFixed(4)}, {associatedShop.longitude.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-rose-500 italic">No physical shop associated</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Control Bar: Search & Filtering */
        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Store className="w-4 h-4 text-slate-700" />
                <span>Physical Retail Shops (`shops` table)</span>
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
                  <th className="py-2.5 px-3">GPS Coordinates (PostGIS)</th>
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
                            <span className="font-mono text-[9px] text-blue-600 block">
                              FK: {shop.retailerId || shop.retailer_id}
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
                          Point(4326) GiST Indexed
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
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedShop(shop)}
                            className="text-[10px] font-medium px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Schema
                          </button>
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schema Inspector Modal for Section 12: Shop */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Section 12: `shops` Schema Inspector
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedShop.name} ({selectedShop.id})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedShop(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Zone Performance Metrics Card */}
              <ZonePerformanceMetricsCard
                currentShop={{
                  ...selectedShop,
                  serviceZoneId: selectedShop.serviceZoneId || selectedShop.service_zone_id || 'zone_nairobi_central'
                }}
                orders={orders}
              />

              <div className="bg-blue-50 p-2.5 rounded border border-blue-200 text-[11px] text-blue-900">
                <span className="font-bold block">Physical Shop Record with PostGIS Position</span>
                A retailer account (<span className="font-mono font-semibold">retailer_id: {selectedShop.retailerId || selectedShop.retailer_id}</span>) is associated with this physical shop. PostGIS stores geographical position <span className="font-mono font-semibold">ST_SetSRID(ST_MakePoint({selectedShop.longitude}, {selectedShop.latitude}), 4326)</span>.
              </div>

              {/* JSON Representation */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Canonical JSON Record
                </span>
                <pre className="bg-slate-950 text-emerald-400 p-3 rounded text-[11px] font-mono overflow-x-auto max-h-56">
                  {JSON.stringify({
                    id: selectedShop.id,
                    retailer_id: selectedShop.retailerId || selectedShop.retailer_id,
                    name: selectedShop.name,
                    address: selectedShop.address,
                    latitude: selectedShop.latitude,
                    longitude: selectedShop.longitude,
                    service_zone_id: selectedShop.serviceZoneId || selectedShop.service_zone_id,
                    operating_status: selectedShop.operatingStatus || selectedShop.operating_status,
                    created_at: selectedShop.createdAt || selectedShop.created_at || '2024-01-10T08:00:00Z',
                    postgis_geom: `POINT(${selectedShop.longitude} ${selectedShop.latitude})`
                  }, null, 2)}
                </pre>
              </div>

              {/* PostGIS DDL snippet */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  PostGIS DDL Definition
                </span>
                <pre className="bg-slate-900 text-blue-300 p-2.5 rounded text-[10px] font-mono overflow-x-auto">
{`CREATE TABLE shops (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    geom GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    service_zone_id VARCHAR(32) NOT NULL,
    operating_status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_shops_location_geom_gist ON shops USING GIST (geom);
CREATE INDEX idx_shops_retailer_id ON shops (retailer_id);`}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedShop(null)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
