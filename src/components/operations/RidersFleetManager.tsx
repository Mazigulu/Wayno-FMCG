import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ShieldCheck, 
  Clock, 
  Navigation,
  Sliders,
  Filter
} from 'lucide-react';
import { Rider, Order } from '../../types/wayno';
import { INITIAL_RIDERS } from '../../data/mockData';

interface RidersFleetManagerProps {
  orders: Order[];
  onReassignRider?: (orderId: string, newRider: Rider, reason: string) => void;
}

export const RidersFleetManager: React.FC<RidersFleetManagerProps> = ({ orders }) => {
  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL');

  const toggleRiderStatus = (riderId: string) => {
    setRiders(prev => prev.map(r => {
      if (r.id === riderId) {
        const nextStatus = r.status === 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const filteredRiders = riders.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesVehicle = vehicleFilter === 'ALL' || r.vehicleType === vehicleFilter;
    return matchesSearch && matchesStatus && matchesVehicle;
  });

  const totalRiders = riders.length;
  const availableRiders = riders.filter(r => r.status === 'AVAILABLE').length;
  const inTransitRiders = riders.filter(r => r.status === 'EN_ROUTE_PICKUP' || r.status === 'EN_ROUTE_DELIVERY').length;
  const avgRating = (riders.reduce((acc, r) => acc + r.rating, 0) / riders.length).toFixed(2);

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Active Courier Fleet</span>
          <span className="text-base font-bold text-slate-900 font-mono">{totalRiders} Vetted Couriers</span>
          <span className="text-[10px] text-emerald-700 block font-medium">100% Background Checked</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Ready for Dispatch</span>
          <span className="text-base font-bold text-emerald-800 font-mono">{availableRiders} Available</span>
          <span className="text-[10px] text-slate-500 block">Instant corridor allocation</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">In-Transit Missions</span>
          <span className="text-base font-bold text-indigo-700 font-mono">{inTransitRiders} On Road</span>
          <span className="text-[10px] text-slate-500 block">OTP handshake active</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Fleet Quality Rating</span>
          <span className="text-base font-bold text-amber-800 font-mono flex items-center space-x-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{avgRating} / 5.0</span>
          </span>
          <span className="text-[10px] text-slate-500 block">SLA satisfaction score</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Bike className="w-4 h-4 text-slate-700" />
              <span>Courier Fleet Management & Dispatch Command</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Real-time monitoring of boda-boda and cargo tuk-tuk couriers, license validation, GPS telemetry, and capacity states.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rider, phone, plate..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="EN_ROUTE_PICKUP">En Route Pickup</option>
              <option value="EN_ROUTE_DELIVERY">En Route Delivery</option>
              <option value="OFFLINE">Offline</option>
            </select>

            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Vehicles</option>
              <option value="Boda Boda (Motorbike)">Boda Boda</option>
              <option value="Tuk-Tuk Cargo">Tuk-Tuk Cargo</option>
              <option value="Electric Cargo">Electric Cargo</option>
            </select>
          </div>
        </div>

        {/* Riders Table */}
        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Courier Profile</th>
                <th className="py-2.5 px-3">Vehicle & Plate</th>
                <th className="py-2.5 px-3">Dispatch Status</th>
                <th className="py-2.5 px-3">Current Location</th>
                <th className="py-2.5 px-3">Performance</th>
                <th className="py-2.5 px-3">Active Order</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRiders.map(rider => {
                const assignedOrder = orders.find(o => o.riderId === rider.id && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
                const isLowRating = rider.rating < 4.5;

                return (
                  <tr key={rider.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {rider.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{rider.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{rider.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block">{rider.vehicleType}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {rider.vehiclePlate}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        rider.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : rider.status.includes('EN_ROUTE')
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          rider.status === 'AVAILABLE' ? 'bg-emerald-500' : rider.status.includes('EN_ROUTE') ? 'bg-indigo-500' : 'bg-slate-400'
                        }`} />
                        <span>{rider.status.replace(/_/g, ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{rider.currentLat.toFixed(4)}, {rider.currentLng.toFixed(4)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-900 font-mono">{rider.rating}</span>
                        <span className="text-slate-400 text-[10px]">({rider.completedTrips} trips)</span>
                      </div>
                      {isLowRating && (
                        <span className="text-[9px] text-rose-700 font-medium flex items-center space-x-0.5 mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Performance review flag</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {assignedOrder ? (
                        <div>
                          <span className="font-mono text-indigo-700 font-bold block text-xs">
                            {assignedOrder.id}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                            To: {assignedOrder.shopName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No active dispatch</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => toggleRiderStatus(rider.id)}
                        className={`text-[10px] font-medium px-2 py-1 rounded border transition-colors cursor-pointer ${
                          rider.status === 'AVAILABLE'
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {rider.status === 'AVAILABLE' ? 'Set Offline' : 'Set Available'}
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
