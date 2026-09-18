import { Order } from '../types/wayno';
import { INITIAL_SHOPS, WHOLESALERS } from './mockData';

export interface DailyFulfillmentPoint {
  date: string;          // e.g. 'Sep 10'
  fullDate: string;      // e.g. '2026-09-10'
  dayOfWeek: string;     // e.g. 'Wed'
  ordersCount: number;   // Orders fulfilled that day
  avgDeliveryMins: number; // Average delivery turnaround time in minutes
  slaCompliancePct: number; // Percentage delivered within 35 min SLA
  onTimeOrders: number;
  delayedOrders: number;
  activeDepotsCount: number;
  peakHourWindow: string;
}

export interface ZoneEfficiencySummary {
  zoneId: string;
  zoneName: string;
  totalOrders: number;
  periodAvgDeliveryMins: number;
  slaComplianceRate: number;
  fastestDay: string;
  fastestDeliveryMins: number;
  busiestDay: string;
  busiestOrdersCount: number;
  efficiencyTrendPercent: number; // e.g. -8.4% (negative means faster delivery, which is good)
  points: DailyFulfillmentPoint[];
}

// Canonical supply node calibration baselines for realistic simulation across Kenyan geographic zones
const NODE_BASELINES: Record<string, {
  name: string;
  baseOrders: number;
  baseDeliveryMins: number;
  varianceMins: number;
  varianceOrders: number;
  activeDepots: number;
  slaTarget: number;
}> = {
  node_eastleigh_20km: {
    name: 'Eastleigh Commercial Node (20 km)',
    baseOrders: 28,
    baseDeliveryMins: 22.4,
    varianceMins: 3.8,
    varianceOrders: 7,
    activeDepots: 3,
    slaTarget: 35
  },
  node_industrial_area_20km: {
    name: 'Industrial Area Supply Node (20 km)',
    baseOrders: 33,
    baseDeliveryMins: 24.1,
    varianceMins: 4.5,
    varianceOrders: 8,
    activeDepots: 3,
    slaTarget: 35
  },
  node_nairobi_west_20km: {
    name: 'Nairobi West & Dagoretti Node (20 km)',
    baseOrders: 20,
    baseDeliveryMins: 25.3,
    varianceMins: 4.2,
    varianceOrders: 5,
    activeDepots: 2,
    slaTarget: 35
  },
  node_bungoma_04_20km: {
    name: 'Bungoma Central Node (20 km)',
    baseOrders: 14,
    baseDeliveryMins: 28.5,
    varianceMins: 5.2,
    varianceOrders: 4,
    activeDepots: 1,
    slaTarget: 35
  },
  region_nairobi_metro: {
    name: 'Nairobi Metropolitan Supply Corridor',
    baseOrders: 81,
    baseDeliveryMins: 24.0,
    varianceMins: 3.5,
    varianceOrders: 14,
    activeDepots: 8,
    slaTarget: 35
  },
  region_western_kenya: {
    name: 'Western Kenya FMCG Corridor',
    baseOrders: 35,
    baseDeliveryMins: 29.1,
    varianceMins: 4.8,
    varianceOrders: 7,
    activeDepots: 3,
    slaTarget: 35
  },
  root_kenya: {
    name: 'WAYNO Kenya National Supply Grid',
    baseOrders: 122,
    baseDeliveryMins: 25.2,
    varianceMins: 2.8,
    varianceOrders: 18,
    activeDepots: 12,
    slaTarget: 35
  },
  default: {
    name: 'Nairobi Metro Region',
    baseOrders: 20,
    baseDeliveryMins: 25.0,
    varianceMins: 4.5,
    varianceOrders: 5,
    activeDepots: 2,
    slaTarget: 35
  }
};

// Aliases mapping legacy zone identifiers directly to canonical supply node keys
const ZONE_KEY_ALIASES: Record<string, string> = {
  zone_nairobi_east: 'node_eastleigh_20km',
  zone_nairobi_central: 'node_industrial_area_20km',
  zone_nairobi_west: 'node_nairobi_west_20km',
  zone_nairobi_south: 'node_industrial_area_20km'
};

/**
 * Deterministic pseudo-random generator with a seed for consistent historical trendline
 */
function seededRand(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate time-series daily fulfillment efficiency data for a given zone and days window
 */
export function getZoneDailyFulfillmentEfficiency(
  zoneId: string,
  daysCount: number = 7,
  liveOrders: Order[] = []
): ZoneEfficiencySummary {
  const canonicalKey = ZONE_KEY_ALIASES[zoneId] || zoneId;
  const baseline = NODE_BASELINES[canonicalKey] || NODE_BASELINES.default;
  const now = new Date('2026-09-17T16:29:03'); // Anchor to app reference time

  const points: DailyFulfillmentPoint[] = [];

  // Filter live orders for this zone or node
  const zoneLiveOrders = liveOrders.filter((o) => {
    if (zoneId === 'root_kenya' || zoneId === 'region_nairobi_metro') return true;
    const shop = INITIAL_SHOPS.find((s) => s.retailerId === o.retailerId || s.name === o.shopName);
    if (shop && (shop.serviceZoneId === zoneId || zoneId.includes(shop.serviceZoneId.replace('zone_', '')))) return true;
    const depot = WHOLESALERS.find((w) => w.id === o.wholesalerLocationId || w.name === o.wholesalerName);
    if (depot && (depot.serviceZoneId === zoneId || depot.id === zoneId || zoneId.includes(depot.serviceZoneId.replace('zone_', '')))) return true;
    return false;
  });

  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);

    const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDateStr = targetDate.toISOString().split('T')[0];
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'short' });

    // Seed hash from date and zoneId
    const daySeed = targetDate.getFullYear() * 10000 + (targetDate.getMonth() + 1) * 100 + targetDate.getDate();
    const zoneSeed = zoneId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const combinedSeed = daySeed + zoneSeed;

    const r1 = seededRand(combinedSeed);
    const r2 = seededRand(combinedSeed + 13);
    const r3 = seededRand(combinedSeed + 29);

    // Weekend factor (Saturdays higher retail volume, Sundays slightly lower)
    const isSaturday = dayOfWeek === 'Sat';
    const isSunday = dayOfWeek === 'Sun';
    const weekendMultiplier = isSaturday ? 1.25 : isSunday ? 0.75 : 1.0;

    // Daily volume calculation
    const rawOrders = Math.round((baseline.baseOrders + (r1 - 0.5) * baseline.varianceOrders * 2) * weekendMultiplier);
    const ordersCount = Math.max(8, rawOrders);

    // Turnaround time: higher order volume slightly increases fulfillment time unless optimized
    const volumeImpact = (ordersCount - baseline.baseOrders) * 0.15;
    const rawDeliveryMins = baseline.baseDeliveryMins + volumeImpact + (r2 - 0.5) * baseline.varianceMins;
    const avgDeliveryMins = Number(Math.max(16, rawDeliveryMins).toFixed(1));

    // SLA compliance calculation (<35m target)
    const slaCompliancePct = Number(Math.min(100, Math.max(88, 99 - (avgDeliveryMins > 30 ? (avgDeliveryMins - 30) * 2.5 : 0) + (r3 - 0.5) * 3)).toFixed(1));
    const onTimeOrders = Math.round(ordersCount * (slaCompliancePct / 100));
    const delayedOrders = ordersCount - onTimeOrders;

    const peakHours = ['10:00 AM - 12:30 PM', '11:00 AM - 1:30 PM', '09:30 AM - 11:30 AM', '02:00 PM - 04:00 PM'];
    const peakHourWindow = peakHours[Math.floor(r1 * peakHours.length)];

    points.push({
      date: dateStr,
      fullDate: fullDateStr,
      dayOfWeek,
      ordersCount,
      avgDeliveryMins,
      slaCompliancePct,
      onTimeOrders,
      delayedOrders,
      activeDepotsCount: baseline.activeDepots,
      peakHourWindow
    });
  }

  // If today has live orders in session, integrate them into the last point
  if (zoneLiveOrders.length > 0 && points.length > 0) {
    const todayPoint = points[points.length - 1];
    todayPoint.ordersCount += zoneLiveOrders.length;
    // Blend the live orders delivery time
    const liveAvgMins = zoneLiveOrders.reduce((acc, o) => acc + (o.estimatedDeliveryMins || 25), 0) / zoneLiveOrders.length;
    todayPoint.avgDeliveryMins = Number(((todayPoint.avgDeliveryMins + liveAvgMins) / 2).toFixed(1));
  }

  const totalOrders = points.reduce((sum, p) => sum + p.ordersCount, 0);
  const periodAvgDeliveryMins = Number((points.reduce((sum, p) => sum + p.avgDeliveryMins, 0) / points.length).toFixed(1));
  const slaComplianceRate = Number((points.reduce((sum, p) => sum + p.slaCompliancePct, 0) / points.length).toFixed(1));

  let fastestPoint = points[0];
  let busiestPoint = points[0];

  points.forEach((p) => {
    if (p.avgDeliveryMins < fastestPoint.avgDeliveryMins) fastestPoint = p;
    if (p.ordersCount > busiestPoint.ordersCount) busiestPoint = p;
  });

  // Calculate efficiency trend comparing first half of window to second half
  const halfIdx = Math.floor(points.length / 2);
  const firstHalfAvg = points.slice(0, halfIdx).reduce((acc, p) => acc + p.avgDeliveryMins, 0) / Math.max(1, halfIdx);
  const secondHalfAvg = points.slice(halfIdx).reduce((acc, p) => acc + p.avgDeliveryMins, 0) / Math.max(1, points.length - halfIdx);
  const efficiencyTrendPercent = Number((((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1));

  return {
    zoneId,
    zoneName: baseline.name,
    totalOrders,
    periodAvgDeliveryMins,
    slaComplianceRate,
    fastestDay: `${fastestPoint.dayOfWeek}, ${fastestPoint.date}`,
    fastestDeliveryMins: fastestPoint.avgDeliveryMins,
    busiestDay: `${busiestPoint.dayOfWeek}, ${busiestPoint.date}`,
    busiestOrdersCount: busiestPoint.ordersCount,
    efficiencyTrendPercent,
    points
  };
}
