import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Clock, 
  Warehouse, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Radio,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { RetailerShop, Order, SupplyNode } from '../../types/wayno';
import { WHOLESALERS } from '../../data/mockData';
import { geoEngine } from '../../services/hierarchicalGeofenceEngine';
import { 
  getZoneDailyFulfillmentEfficiency, 
  DailyFulfillmentPoint 
} from '../../data/zoneFulfillmentEfficiencyData';

export interface ZonePerformanceMetricsCardProps {
  currentShop?: RetailerShop;
  selectedNode?: SupplyNode;
  orders?: Order[];
  className?: string;
  isCompact?: boolean;
}

export const ZonePerformanceMetricsCard: React.FC<ZonePerformanceMetricsCardProps> = ({
  currentShop,
  selectedNode,
  orders = [],
  className = '',
  isCompact = false
}) => {
  // Time window for time-series chart
  const [timeWindowDays, setTimeWindowDays] = useState<7 | 14 | 30>(7);
  const [showOrdersLine, setShowOrdersLine] = useState<boolean>(true);
  const [showDeliveryTimeLine, setShowDeliveryTimeLine] = useState<boolean>(true);
  const [showSlaLine, setShowSlaLine] = useState<boolean>(true);

  // 1. Identify active supply node (either direct selectedNode or via shop coordinates)
  const activeNode: SupplyNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    if (currentShop) {
      try {
        return geoEngine.findLocalNodeForShop({
          lat: currentShop.latitude,
          lng: currentShop.longitude
        });
      } catch {
        return geoEngine.getLocalNodes()[0];
      }
    }
    return geoEngine.getAllNodes()[0];
  }, [selectedNode, currentShop]);

  // 2. Compute active wholesale depots servicing this specific geofence/zone/node
  const zoneWholesalers = useMemo(() => {
    return WHOLESALERS.filter((w) => {
      if (w.status !== 'ACTIVE') return false;
      if (activeNode) {
        if (activeNode.level === 'ROOT') return true;
        if (activeNode.level === 'REGION') {
          if (activeNode.id === 'region_western_kenya') {
            return w.address?.toLowerCase().includes('bungoma') || w.name?.toLowerCase().includes('western') || w.id === activeNode.wholesalerId;
          }
          return w.id === activeNode.wholesalerId || !w.address?.toLowerCase().includes('bungoma');
        }
        // Local 20km node
        return (
          w.id === activeNode.wholesalerId ||
          w.wholesalerId === activeNode.wholesalerId ||
          (activeNode.id === 'node_eastleigh_20km' && (w.serviceZoneId === 'zone_nairobi_east' || w.address?.toLowerCase().includes('eastleigh'))) ||
          (activeNode.id === 'node_industrial_area_20km' && (w.serviceZoneId === 'zone_nairobi_central' || w.serviceZoneId === 'zone_nairobi_south' || w.address?.toLowerCase().includes('industrial'))) ||
          (activeNode.id === 'node_nairobi_west_20km' && (w.serviceZoneId === 'zone_nairobi_west' || w.address?.toLowerCase().includes('west'))) ||
          (activeNode.id === 'node_bungoma_04_20km' && (w.address?.toLowerCase().includes('bungoma') || w.name?.toLowerCase().includes('western')))
        );
      }
      if (currentShop) {
        return (
          w.serviceZoneId === currentShop.serviceZoneId ||
          w.id === activeNode.wholesalerId ||
          w.wholesalerId === activeNode.wholesalerId
        );
      }
      return true;
    });
  }, [activeNode, currentShop]);

  // Total active depots in this geofence (with fallback to at least 1)
  const activeWholesaleDepotCount = Math.max(1, zoneWholesalers.length);

  // 3. Compute fulfillment metrics (average speed, SLA compliance, and dispatch turnaround)
  const metrics = useMemo(() => {
    // Check historical orders for this specific retailer/shop or matching zone wholesalers
    const relevantOrders = orders.filter((o) => {
      if (currentShop && (o.retailerId === currentShop.retailerId || o.shopName === currentShop.name)) {
        return true;
      }
      if (activeNode) {
        if (activeNode.level === 'ROOT') return true;
        if (activeNode.level === 'REGION' && activeNode.id === 'region_nairobi_metro') {
          return !o.wholesalerName?.toLowerCase().includes('western');
        }
        if (activeNode.wholesalerId && (o.wholesalerLocationId === activeNode.wholesalerId || o.wholesalerLocationId?.includes(activeNode.wholesalerId))) {
          return true;
        }
      }
      return zoneWholesalers.some((w) => w.id === o.wholesalerLocationId || w.name === o.wholesalerName);
    });

    let avgSpeedMins: number;
    let sampleSize = relevantOrders.length;

    if (relevantOrders.length > 0) {
      const sumMins = relevantOrders.reduce(
        (acc, o) => acc + (o.estimatedDeliveryMins || 25),
        0
      );
      avgSpeedMins = Math.round(sumMins / relevantOrders.length);
    } else {
      const baseSpeedMap: Record<string, number> = {
        node_eastleigh_20km: 22,
        node_industrial_area_20km: 24,
        node_nairobi_west_20km: 25,
        node_bungoma_04_20km: 28,
        region_nairobi_metro: 24,
        region_western_kenya: 29,
        root_kenya: 25
      };
      avgSpeedMins = (activeNode && baseSpeedMap[activeNode.id]) || (
        zoneWholesalers.length > 0
          ? Math.round(zoneWholesalers.reduce((acc, w) => acc + (w.avgPrepTimeMinutes || 15), 0) / zoneWholesalers.length) + 12
          : 25
      );
    }

    const avgReliability = zoneWholesalers.length > 0
      ? (zoneWholesalers.reduce((acc, w) => acc + (w.reliabilityScore || 95), 0) / zoneWholesalers.length).toFixed(1)
      : '97.2';

    const anchorName = activeNode?.wholesalerName || (zoneWholesalers[0] ? zoneWholesalers[0].name : 'Primary Distribution Depot');

    return {
      avgSpeedMins,
      sampleSize,
      avgReliability,
      anchorName,
      slaTargetMins: 35,
      slaComplianceRate: avgSpeedMins <= 30 ? '98.6%' : avgSpeedMins <= 35 ? '96.2%' : '92.4%',
      coverageRadiusKm: activeNode?.radiusKm || 20,
      inventoryCoveragePct: activeNode?.inventoryCoveragePct || 96.5,
      level: activeNode?.level || 'LOCAL_NODE',
      code: activeNode?.code || 'NODE-01',
      shopsCount: activeNode?.shopsCount || 120,
    };
  }, [orders, currentShop, activeNode, zoneWholesalers]);

  // 4. Time-series Daily Fulfillment Efficiency data for this specific node or zone
  const efficiencyData = useMemo(() => {
    const targetId = activeNode?.id || currentShop?.serviceZoneId || 'zone_nairobi_central';
    return getZoneDailyFulfillmentEfficiency(targetId, timeWindowDays, orders);
  }, [activeNode, currentShop, timeWindowDays, orders]);

  const zoneDisplayName = selectedNode
    ? selectedNode.name
    : currentShop?.serviceZoneId
    ? currentShop.serviceZoneId.replace(/_/g, ' ').toUpperCase()
    : 'NAIROBI METRO';

  // Custom Chart Tooltip
  const CustomEfficiencyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as DailyFulfillmentPoint;
      return (
        <div className="bg-slate-900 text-white p-3 rounded shadow-xl border border-slate-700 text-xs z-50 min-w-[210px] pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
            <span className="font-bold text-slate-200">
              {dataPoint.dayOfWeek}, {dataPoint.date}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {dataPoint.fullDate}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Orders Fulfilled:</span>
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {dataPoint.ordersCount} orders
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                <span>Avg Delivery Time:</span>
              </span>
              <span className="font-mono font-bold text-indigo-300">
                {dataPoint.avgDeliveryMins} mins
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-400">SLA (&lt;35m) On-Time:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {dataPoint.slaCompliancePct}% ({dataPoint.onTimeOrders}/{dataPoint.ordersCount})
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Active Wholesale Hubs:</span>
              <span className="font-mono text-slate-300">
                {dataPoint.activeDepotsCount} depots
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Peak Dispatch:</span>
              <span className="font-mono text-slate-300">{dataPoint.peakHourWindow}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="zone-performance-metrics-card"
      className={`bg-white border border-slate-200 rounded-md p-4 space-y-4 shadow-2xs ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                {selectedNode ? `${selectedNode.name}` : 'Zone Performance Metrics'}
              </h3>
              <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                <span>{selectedNode ? `${selectedNode.code} · ${selectedNode.level}` : 'LIVE GEOFENCE'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {selectedNode
                ? `Daily fulfillment efficiency, delivery turnaround vs 35m SLA, and depot metrics across ${selectedNode.radiusKm} km territory`
                : <>Real-time fulfillment metrics & supply depot density for <span className="font-semibold text-slate-800">{zoneDisplayName}</span></>}
            </p>
          </div>
        </div>

        {/* Primary Assigned Supply Node Badge */}
        <div className="flex items-center space-x-1 text-[11px] font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-700">
          <MapPin className="w-3 h-3 text-slate-500" />
          <span className="text-slate-400">{selectedNode ? 'Territory:' : 'Node:'}</span>
          <span className="font-bold text-slate-900">{selectedNode ? `${selectedNode.radiusKm} km Envelope` : activeNode.name}</span>
          {selectedNode && (
            <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
              {selectedNode.shopsCount} Shops
            </span>
          )}
        </div>
      </div>

      {/* Main KPI Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Average Fulfillment Speed */}
        <div
          id="stat-fulfillment-speed"
          className="bg-slate-50/80 border border-slate-200 rounded p-3 relative overflow-hidden group hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Avg Fulfillment Speed</span>
            <Clock className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.avgSpeedMins}
            </span>
            <span className="text-xs font-semibold text-slate-600 font-sans">mins</span>
          </div>
          <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
            <Zap className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>Target &lt; {metrics.slaTargetMins}m ({metrics.slaComplianceRate} on SLA)</span>
          </div>
        </div>

        {/* Metric 2: Active Wholesale Depots */}
        <div
          id="stat-active-wholesale-depots"
          className="bg-slate-50/80 border border-slate-200 rounded p-3 relative overflow-hidden group hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Wholesale Depots</span>
            <Warehouse className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {activeWholesaleDepotCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 font-sans">
              depot{activeWholesaleDepotCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-slate-600 font-medium">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>Servicing {metrics.coverageRadiusKm} km geo-fence</span>
          </div>
        </div>

        {/* Metric 3: Zone Inventory Coverage */}
        <div
          id="stat-inventory-coverage"
          className="bg-slate-50/80 border border-slate-200 rounded p-3 relative overflow-hidden group hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Coverage</span>
            <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.inventoryCoveragePct}%
            </span>
          </div>
          <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-slate-600 font-medium">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>Essential FMCG SKUs in stock</span>
          </div>
        </div>

        {/* Metric 4: Wholesale Reliability Score */}
        <div
          id="stat-wholesale-reliability"
          className="bg-slate-50/80 border border-slate-200 rounded p-3 relative overflow-hidden group hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Depot Reliability</span>
            <Truck className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.avgReliability}%
            </span>
          </div>
          <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium truncate">
            <span>Anchor: {metrics.anchorName.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIME-SERIES LINE CHART: Daily Fulfillment Efficiency (Orders vs Delivery) */}
      {/* ========================================================================= */}
      <div 
        id="zone-daily-fulfillment-efficiency-section"
        className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-3"
      >
        {/* Chart Header & Control Ribbon */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-2.5 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              </span>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Daily Fulfillment Efficiency
              </h4>
              <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                Orders vs. Delivery Time ({efficiencyData.zoneName})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Historical fulfillment turnaround velocity correlated against daily order dispatch volume in this service zone.
            </p>
          </div>

          {/* Controls: Time Window & Metric Visibility Toggles */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Metric Toggles */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setShowOrdersLine(!showOrdersLine)}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded font-medium transition-colors ${
                  showOrdersLine 
                    ? 'text-emerald-800 bg-emerald-50 font-bold' 
                    : 'text-slate-400 hover:text-slate-600 line-through'
                }`}
                title="Toggle Orders line"
              >
                <span className={`w-2 h-2 rounded-full ${showOrdersLine ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                <span>Orders</span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={() => setShowDeliveryTimeLine(!showDeliveryTimeLine)}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded font-medium transition-colors ${
                  showDeliveryTimeLine 
                    ? 'text-indigo-800 bg-indigo-50 font-bold' 
                    : 'text-slate-400 hover:text-slate-600 line-through'
                }`}
                title="Toggle Delivery Time line"
              >
                <span className={`w-2 h-2 rounded-full ${showDeliveryTimeLine ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                <span>Delivery Time (m)</span>
              </button>

              <span className="text-slate-300">|</span>

              <button
                type="button"
                onClick={() => setShowSlaLine(!showSlaLine)}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded font-medium transition-colors ${
                  showSlaLine 
                    ? 'text-rose-700 bg-rose-50 font-bold' 
                    : 'text-slate-400 hover:text-slate-600 line-through'
                }`}
                title="Toggle 35m SLA Benchmark"
              >
                <span className={`w-2 h-0.5 ${showSlaLine ? 'bg-rose-500' : 'bg-slate-300'}`} />
                <span>35m SLA</span>
              </button>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded p-0.5 text-[11px] font-mono">
              {([7, 14, 30] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeWindowDays(days)}
                  className={`px-2 py-0.5 rounded font-bold transition-colors ${
                    timeWindowDays === days
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="bg-white border border-slate-200 rounded p-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Period Orders</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-base font-black font-mono text-slate-900">{efficiencyData.totalOrders}</span>
              <span className="text-[10px] text-slate-500">in zone</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Delivery Time</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-base font-black font-mono text-indigo-700">{efficiencyData.periodAvgDeliveryMins}</span>
              <span className="text-[10px] text-slate-500">mins</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fastest Turnaround</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-base font-black font-mono text-emerald-700">{efficiencyData.fastestDeliveryMins}m</span>
              <span className="text-[9px] text-slate-500 truncate" title={efficiencyData.fastestDay}>({efficiencyData.fastestDay.split(',')[0]})</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded p-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Order Day</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-base font-black font-mono text-slate-900">{efficiencyData.busiestOrdersCount}</span>
              <span className="text-[9px] text-slate-500 truncate" title={efficiencyData.busiestDay}>({efficiencyData.busiestDay.split(',')[0]})</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded p-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">SLA Compliance</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-base font-black font-mono text-emerald-700">{efficiencyData.slaComplianceRate}%</span>
              <span className="text-[10px] text-emerald-800 font-semibold">&lt;35m</span>
            </div>
          </div>
        </div>

        {/* Recharts Dual-Axis Line Chart */}
        <div className="bg-white border border-slate-200 rounded p-2.5 pt-3">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={efficiencyData.points}
                margin={{ top: 12, right: 18, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />

                {/* Left Y-Axis: Orders Count */}
                <YAxis
                  yAxisId="orders"
                  orientation="left"
                  tick={{ fontSize: 10, fill: '#059669', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#059669' }}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
                  label={{
                    value: 'Orders Fulfilled',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#059669',
                    fontSize: 10,
                    offset: 14
                  }}
                />

                {/* Right Y-Axis: Delivery Time in Minutes */}
                <YAxis
                  yAxisId="delivery"
                  orientation="right"
                  unit="m"
                  tick={{ fontSize: 10, fill: '#4f46e5', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#4f46e5' }}
                  tickLine={false}
                  domain={[10, (dataMax: number) => Math.max(40, Math.ceil(dataMax + 4))]}
                  label={{
                    value: 'Avg Turnaround (mins)',
                    angle: 90,
                    position: 'insideRight',
                    fill: '#4f46e5',
                    fontSize: 10,
                    offset: 14
                  }}
                />

                <Tooltip content={<CustomEfficiencyTooltip />} />

                {/* SLA Benchmark Reference Line */}
                {showSlaLine && (
                  <ReferenceLine
                    yAxisId="delivery"
                    y={35}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'SLA Target (35m)',
                      position: 'insideTopRight',
                      fill: '#e11d48',
                      fontSize: 9,
                      fontWeight: 'bold'
                    }}
                  />
                )}

                {/* Orders Line */}
                {showOrdersLine && (
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="ordersCount"
                    name="Orders Fulfilled"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#059669', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}

                {/* Delivery Time Line */}
                {showDeliveryTimeLine && (
                  <Line
                    yAxisId="delivery"
                    type="monotone"
                    dataKey="avgDeliveryMins"
                    name="Avg Delivery Time (mins)"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#4f46e5', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#4338ca', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Zone Correlation Note */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 gap-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 font-medium text-emerald-800">
                <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" />
                <span>Orders Fulfilled (Daily Volume)</span>
              </span>
              <span className="flex items-center space-x-1.5 font-medium text-indigo-800">
                <span className="w-2.5 h-0.5 bg-indigo-600 inline-block" />
                <span>Avg Delivery Time (Turnaround in Minutes)</span>
              </span>
            </div>

            <div className="flex items-center space-x-1 text-slate-600 font-medium">
              <Info className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {efficiencyData.efficiencyTrendPercent <= 0 ? (
                  <span className="text-emerald-700 font-semibold">
                    Delivery turnaround improved by {Math.abs(efficiencyData.efficiencyTrendPercent)}% across {timeWindowDays} days
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    Turnaround latency variance of +{efficiencyData.efficiencyTrendPercent}% during peak volume
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Servicing Wholesale Depots Breakdown */}
      <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
            <Warehouse className="w-3 h-3 text-slate-500" />
            <span>Depots Servicing This Territory ({zoneWholesalers.length})</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Territory Radius: {activeNode.radiusKm} km · Geofence Enforced
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {zoneWholesalers.map((depot) => (
            <div
              key={depot.id}
              className="bg-white border border-slate-200 rounded p-2 flex items-start justify-between space-x-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-slate-900 text-[11px] truncate block">
                    {depot.name}
                  </span>
                  {depot.id === activeNode.wholesalerId && (
                    <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold font-mono shrink-0">
                      ANCHOR
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{depot.address}</p>
                <div className="mt-1 flex items-center space-x-2 text-[10px] font-mono text-slate-600">
                  <span>Prep: ~{depot.avgPrepTimeMinutes}m</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold">{depot.reliabilityScore}% rel</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Active Hub" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
