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
  Filter,
  Layers,
  Globe,
  Code2,
  Compass,
  X
} from 'lucide-react';
import { WholesalerLocation, Wholesaler, Order } from '../../types/wayno';
import { WHOLESALERS, PARENT_WHOLESALERS, SUPPLIER_PRODUCTS } from '../../data/mockData';

interface WholesalersManagerProps {
  orders: Order[];
}

export const WholesalersManager: React.FC<WholesalersManagerProps> = ({ orders }) => {
  const [wholesalers, setWholesalers] = useState<WholesalerLocation[]>(WHOLESALERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<WholesalerLocation | null>(null);
  const [viewMode, setViewMode] = useState<'LOCATIONS' | 'ENTERPRISES'>('LOCATIONS');

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
      (w.businessName && w.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = zoneFilter === 'ALL' || w.serviceZoneId === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const activeHubs = wholesalers.filter(w => w.status === 'ACTIVE').length;
  const avgPrepTime = Math.round(
    wholesalers.reduce((sum, w) => sum + (w.avgPrepTimeMinutes || 15), 0) / wholesalers.length
  );
  const avgReliability = (
    wholesalers.reduce((sum, w) => sum + (w.reliabilityScore || 98), 0) / wholesalers.length
  ).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Architectural Pillar Callout: Section 14 Wholesaler Location */}
      <div className="bg-emerald-950 text-emerald-100 rounded-lg p-4 border border-emerald-800/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold tracking-wider uppercase border border-emerald-500/30">
                Section 14 Pillar
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide">
                WHOLESALER LOCATION (1:N Separation)
              </h3>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed max-w-3xl">
              <strong>This distinction is critical:</strong> One wholesaler might eventually have multiple physical locations. 
              The <code className="bg-emerald-900/60 px-1 py-0.5 rounded text-emerald-200 font-mono">wholesaler_locations</code> table 
              decouples the legal business enterprise from physical depots, allowing WAYNO to work geographically across Nairobi.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setViewMode(viewMode === 'LOCATIONS' ? 'ENTERPRISES' : 'LOCATIONS')}
              className="px-3 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold text-white border border-emerald-600 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{viewMode === 'LOCATIONS' ? 'View 1:N Enterprises' : 'View Depot Locations'}</span>
            </button>
          </div>
        </div>

        {/* 9 Canonical Schema Fields Checklist */}
        <div className="mt-3 pt-3 border-t border-emerald-800/60 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 text-center text-[10px]">
          {[
            { field: 'id', desc: 'Depot PK' },
            { field: 'wholesaler_id', desc: 'Parent FK' },
            { field: 'name', desc: 'Depot Name' },
            { field: 'address', desc: 'Physical Plot' },
            { field: 'latitude', desc: 'WGS-84 Lat' },
            { field: 'longitude', desc: 'WGS-84 Lng' },
            { field: 'service_zone_id', desc: 'Corridor ID' },
            { field: 'operating_hours', desc: 'Shift Window' },
            { field: 'status', desc: 'Active/Inactive' },
          ].map((item, idx) => (
            <div key={idx} className="bg-emerald-900/50 rounded px-1.5 py-1 border border-emerald-700/40">
              <span className="font-mono font-bold text-emerald-300 block">{item.field}</span>
              <span className="text-emerald-400 text-[9px]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Supply Depots</span>
          <span className="text-base font-bold text-slate-900 font-mono">{activeHubs} / {wholesalers.length} Locations</span>
          <span className="text-[10px] text-emerald-700 block font-medium">PostGIS Geo-Indexed</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Parent Wholesalers</span>
          <span className="text-base font-bold text-slate-900 font-mono">{PARENT_WHOLESALERS.length} Enterprises</span>
          <span className="text-[10px] text-slate-500 block font-medium">1:N Enterprise Hierarchy</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Network Reliability</span>
          <span className="text-base font-bold text-emerald-800 font-mono">{avgReliability}%</span>
          <span className="text-[10px] text-slate-500 block">Depot fill rate SLA</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Master SKU Feeds</span>
          <span className="text-base font-bold text-slate-900 font-mono">
            {SUPPLIER_PRODUCTS.length} Price Feeds
          </span>
          <span className="text-[10px] text-slate-500 block">Live supplier inventory</span>
        </div>
      </div>

      {viewMode === 'ENTERPRISES' ? (
        /* 1:N Enterprises View */
        <div className="bg-white border border-slate-200 rounded-md p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <span>Parent Wholesalers (`wholesalers` table) & Linked Depot Locations</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Demonstrates the 1:N relational architecture where one corporate wholesaler enterprise owns multiple physical fulfillment depots.
              </p>
            </div>
            <button
              onClick={() => setViewMode('LOCATIONS')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Switch to Geographic Depots &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {PARENT_WHOLESALERS.map(parent => {
              const childLocations = wholesalers.filter(w => w.wholesalerId === parent.id || w.wholesaler_id === parent.id);
              return (
                <div key={parent.id} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {parent.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{parent.name}</h4>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          {parent.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-4">
                        <span>Reg No: <span className="font-mono">{parent.businessRegNo}</span></span>
                        <span>Contact: <span className="font-mono">{parent.phone}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {childLocations.length} Physical Depot Location{childLocations.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Child locations under this wholesaler */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {childLocations.map(loc => (
                      <div 
                        key={loc.id} 
                        onClick={() => setSelectedLocation(loc)}
                        className="bg-white p-2.5 rounded border border-slate-200 hover:border-emerald-500 cursor-pointer transition-all hover:shadow-xs group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] font-bold text-emerald-800 block">
                              {loc.id} (wholesaler_id: {loc.wholesalerId})
                            </span>
                            <span className="font-semibold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors">
                              {loc.name}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{loc.address}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {loc.serviceZoneId}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Hours: <strong className="font-mono text-slate-700">{loc.operatingHours}</strong></span>
                          <span>Coords: <strong className="font-mono text-slate-700">{loc.latitude}, {loc.longitude}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standard Geographic Locations Table */
        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                <span>Geographic Wholesale Depots (`wholesaler_locations`)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                PostGIS-indexed physical distribution hubs for nearest-supplier routing, corridor dispatch, and staging bay SLAs.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search depot, address, or ID..."
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
                  <th className="py-2.5 px-3">id & Depot Name</th>
                  <th className="py-2.5 px-3">wholesaler_id (Parent)</th>
                  <th className="py-2.5 px-3">address & GPS Coordinates</th>
                  <th className="py-2.5 px-3">service_zone_id</th>
                  <th className="py-2.5 px-3">operating_hours</th>
                  <th className="py-2.5 px-3">status & SLA</th>
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
                  const isSlow = (wholesaler.avgPrepTimeMinutes || 15) > 15;

                  return (
                    <tr key={wholesaler.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {wholesaler.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{wholesaler.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">id: {wholesaler.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-slate-800 block">
                          {wholesaler.wholesalerId}
                        </span>
                        <span className="text-[10px] text-slate-500">{wholesaler.businessName}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-800 block">{wholesaler.address}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Lat: {wholesaler.latitude}, Lng: {wholesaler.longitude}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {wholesaler.serviceZoneId}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1 text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-[11px]">{wholesaler.operatingHours}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            wholesaler.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {wholesaler.status}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono font-medium">
                            {wholesaler.reliabilityScore}% rel
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedLocation(wholesaler)}
                          className="text-[10px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Inspect Schema
                        </button>
                        <button
                          onClick={() => toggleWholesalerStatus(wholesaler.id)}
                          className={`text-[10px] font-medium px-2 py-1 rounded border transition-colors cursor-pointer ${
                            wholesaler.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {wholesaler.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

      {/* Location Schema Inspector Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Wholesaler Location Specification (Section 14)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    wholesaler_locations record: {selectedLocation.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-3.5 rounded font-mono text-xs overflow-x-auto space-y-1">
              <div>// Canonical Database Record: wholesaler_locations</div>
              <div>{JSON.stringify({
                id: selectedLocation.id,
                wholesaler_id: selectedLocation.wholesaler_id || selectedLocation.wholesalerId,
                name: selectedLocation.name,
                address: selectedLocation.address,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                service_zone_id: selectedLocation.service_zone_id || selectedLocation.serviceZoneId,
                operating_hours: selectedLocation.operating_hours || selectedLocation.operatingHours,
                status: selectedLocation.status,
              }, null, 2)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">Geographic Capability:</span>
                <p className="text-slate-600 text-[11px] mt-1">
                  Allows PostGIS proximity queries (<code className="font-mono text-emerald-700">ST_DWithin</code>) to dispatch the nearest bodega or duka order to this depot within 5ms.
                </p>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block text-[11px]">1:N Multi-Depot Support:</span>
                <p className="text-slate-600 text-[11px] mt-1">
                  Foreign key <code className="font-mono text-emerald-700">{selectedLocation.wholesalerId}</code> links to parent <code className="font-mono text-emerald-700">wholesalers</code> enterprise, enabling multi-depot expansion.
                </p>
              </div>
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold cursor-pointer"
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
