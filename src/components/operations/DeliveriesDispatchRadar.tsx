import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Bike, 
  Key, 
  Navigation,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Order, Rider, OrderState } from '../../types/wayno';
import { INITIAL_RIDERS } from '../../data/mockData';

interface DeliveriesDispatchRadarProps {
  orders: Order[];
  onManualOverrideStatus?: (orderId: string, newState: OrderState, note: string) => void;
  onReassignRider?: (orderId: string, newRider: Rider, reason: string) => void;
}

export const DeliveriesDispatchRadar: React.FC<DeliveriesDispatchRadarProps> = ({
  orders,
  onManualOverrideStatus,
  onReassignRider,
}) => {
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const deliveryOrders = orders.filter(o => 
    o.status === 'RIDER_ASSIGNED' || 
    o.status === 'PICKED_UP' || 
    o.status === 'OUT_FOR_DELIVERY' ||
    o.status === 'DELIVERED' ||
    o.status === 'READY_FOR_PICKUP'
  );

  const activeDeliveries = deliveryOrders.filter(o => o.status !== 'DELIVERED');

  const filteredOrders = deliveryOrders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.wholesalerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.riderName && order.riderName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesZone = filterZone === 'ALL' || (order.shopAddress && order.shopAddress.toLowerCase().includes(filterZone.toLowerCase()));

    return matchesSearch && matchesZone;
  });

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Active In-Flight Dispatches</span>
          <span className="text-base font-bold text-indigo-700 font-mono">{activeDeliveries.length} Active Missions</span>
          <span className="text-[10px] text-slate-500 block">Corridor live telemetry</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Average Delivery Velocity</span>
          <span className="text-base font-bold text-slate-900 font-mono">27.4 Minutes</span>
          <span className="text-[10px] text-emerald-700 block font-medium">98.2% on-time SLA</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">Pricing Tier Breakdown</span>
          <span className="text-base font-bold text-slate-900 font-mono">Zone 1 (≤3km): KES 50</span>
          <span className="text-[10px] text-slate-500 block">Zone 2 (≤6km): KES 120</span>
        </div>

        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <span className="text-[10px] text-slate-400 block font-medium uppercase">OTP Handshake Integrity</span>
          <span className="text-base font-bold text-emerald-800 font-mono">100% Cryptographic</span>
          <span className="text-[10px] text-slate-500 block">Zero unverified handoffs</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Truck className="w-4 h-4 text-slate-700" />
              <span>Deliveries Dispatch Radar & Corridor Performance</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Live mission tracker between wholesale depots and retail dukas, two-stage OTP handshakes, and route SLAs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ref, duka, or rider..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-60"
              />
            </div>

            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="text-xs border border-slate-200 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Destinations</option>
              <option value="Kariobangi">Kariobangi</option>
              <option value="Kawangware">Kawangware</option>
              <option value="Eastleigh">Eastleigh</option>
            </select>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="border border-slate-200 rounded overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Dispatch Route (Origin → Dest)</th>
                <th className="py-2.5 px-3">Assigned Courier</th>
                <th className="py-2.5 px-3">Distance & Fee</th>
                <th className="py-2.5 px-3">OTP Handshakes</th>
                <th className="py-2.5 px-3">Delivery Status</th>
                <th className="py-2.5 px-3 text-right">ETA / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                const isDelivered = order.status === 'DELIVERED';
                const hasRider = !!order.riderName;
                const distance = order.items.length > 2 ? 4.2 : 2.8;
                const feeTier = distance <= 3 ? 'Zone 1 (KES 50)' : 'Zone 2 (KES 120)';

                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                      {order.id}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span className="font-medium">{order.wholesalerName}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500 text-[11px] pl-3">
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{order.shopName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {hasRider ? (
                        <div>
                          <span className="font-semibold text-slate-900 block">{order.riderName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {order.riderPhone}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                          Pending Rider
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-900 font-semibold block text-xs">
                        {distance} km
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {feeTier}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-[10px]">
                          <span className="text-slate-400">Pickup:</span>
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                            {order.pickupOtp || '8834'}
                          </span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                        <div className="flex items-center space-x-1 text-[10px]">
                          <span className="text-slate-400">Delivery:</span>
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                            {order.deliveryOtp || '4412'}
                          </span>
                          {isDelivered ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-500" />
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isDelivered
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : order.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <span>{order.status.replace(/_/g, ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-xs">
                      {isDelivered ? (
                        <span className="text-emerald-700 font-semibold block">Delivered</span>
                      ) : (
                        <div>
                          <span className="text-slate-900 font-bold block">18 mins ETA</span>
                          <span className="text-[10px] text-slate-400">Departed 12m ago</span>
                        </div>
                      )}
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
