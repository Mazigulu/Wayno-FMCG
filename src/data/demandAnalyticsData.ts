export interface DemandMetricSummary {
  totalDemandGMV: number;
  realizedDemandGMV: number;
  unmetDemandGMV: number;
  fulfillmentRate: number;
  totalUnitsOrdered: number;
  avgOrderValueKES: number;
  projectedGrowthWoW: number;
  activeRetailersCount: number;
  zeroResultSuppressedCount: number;
}

export interface CategoryDemand {
  id: string;
  category: string;
  sharePercent: number;
  gmvKES: number;
  units: number;
  fulfillmentRate: number;
  trend: 'surging' | 'stable' | 'deficit' | 'declining';
  trendRate: string;
  topItem: string;
  daysOfInventory: number;
  stockoutRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RegionalDemandZone {
  zoneId: string;
  name: string;
  neighborhoods: string;
  orderSharePercent: number;
  monthlyGMVKES: number;
  activeDukas: number;
  avgBasketSizeKES: number;
  fulfillmentRate: number;
  dominantCategory: string;
  primaryDepot: string;
  growthWoW: number;
}

export interface DailyDemandPoint {
  date: string;
  dayLabel: string;
  realizedGMV: number;
  unmetGMV: number;
  totalDemand: number;
  isForecast?: boolean;
  p10?: number;
  p90?: number;
  eventNote?: string;
}

export interface SuppressedDemandSignal {
  id: string;
  skuName: string;
  category: string;
  unmetAttemptsCount: number;
  lostGmvKES: number;
  primaryReason: 'Wholesaler Stockout' | 'No Wholesaler Sells Brand' | 'MOQ Too High' | 'Price Disconnect';
  affectedZones: string[];
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'OPEN_SIGNAL' | 'SUPPLIER_ALERTED' | 'RESTOCK_SCHEDULED';
  suggestedAction: string;
}

export interface MLModelInsight {
  modelName: string;
  version: string;
  mapeScore: number;
  lastTrained: string;
  features: { name: string; importanceWeight: number; description: string }[];
}

export const DEMAND_METRIC_SUMMARY: DemandMetricSummary = {
  totalDemandGMV: 28450000,
  realizedDemandGMV: 25102500,
  unmetDemandGMV: 3347500,
  fulfillmentRate: 88.2,
  totalUnitsOrdered: 142850,
  avgOrderValueKES: 14850,
  projectedGrowthWoW: 14.6,
  activeRetailersCount: 1240,
  zeroResultSuppressedCount: 1680,
};

export const CATEGORY_DEMAND_BREAKDOWN: CategoryDemand[] = [
  {
    id: 'cat_maize',
    category: 'Maize Meal & Grain Flours',
    sharePercent: 38.4,
    gmvKES: 10925000,
    units: 54625,
    fulfillmentRate: 96.2,
    trend: 'surging',
    trendRate: '+18.4%',
    topItem: 'Pembe Maize Meal (12x2kg Bale)',
    daysOfInventory: 4.2,
    stockoutRisk: 'LOW',
  },
  {
    id: 'cat_oil',
    category: 'Edible Cooking Oils & Fats',
    sharePercent: 24.1,
    gmvKES: 6856000,
    units: 28400,
    fulfillmentRate: 89.1,
    trend: 'surging',
    trendRate: '+12.1%',
    topItem: 'Rina Vegetable Oil (12x1L Carton)',
    daysOfInventory: 2.8,
    stockoutRisk: 'MEDIUM',
  },
  {
    id: 'cat_sugar',
    category: 'Pure Cane Sugar & Sweeteners',
    sharePercent: 16.5,
    gmvKES: 4702000,
    units: 21500,
    fulfillmentRate: 79.4,
    trend: 'deficit',
    trendRate: '-4.2%',
    topItem: 'Mumias Pure Sugar (20x1kg Bale)',
    daysOfInventory: 1.1,
    stockoutRisk: 'CRITICAL',
  },
  {
    id: 'cat_dairy',
    category: 'Dairy, Tea & Beverages',
    sharePercent: 11.2,
    gmvKES: 3186000,
    units: 22800,
    fulfillmentRate: 91.0,
    trend: 'stable',
    trendRate: '+5.8%',
    topItem: 'Brookside UHT Whole Milk (12x500ml)',
    daysOfInventory: 3.5,
    stockoutRisk: 'LOW',
  },
  {
    id: 'cat_detergent',
    category: 'Soap, Detergents & Home Care',
    sharePercent: 9.8,
    gmvKES: 2781000,
    units: 15525,
    fulfillmentRate: 94.5,
    trend: 'stable',
    trendRate: '+3.2%',
    topItem: 'Omo Hand Washing Powder (24x500g)',
    daysOfInventory: 6.4,
    stockoutRisk: 'LOW',
  },
];

export const REGIONAL_DEMAND_ZONES: RegionalDemandZone[] = [
  {
    zoneId: 'zone_nairobi_east',
    name: 'Nairobi East Corridor',
    neighborhoods: 'Eastlands, Dandora, Kayole, Kariobangi South, Umoja',
    orderSharePercent: 34.2,
    monthlyGMVKES: 9730000,
    activeDukas: 462,
    avgBasketSizeKES: 13200,
    fulfillmentRate: 87.2,
    dominantCategory: 'Maize Meal & Flours',
    primaryDepot: 'Eastleigh Mega Wholesale Depot',
    growthWoW: 16.2,
  },
  {
    zoneId: 'zone_nairobi_central',
    name: 'Central Commercial Corridor',
    neighborhoods: 'Eastleigh, Gikomba, Kamukunji, CBD Fringe, Kariokor',
    orderSharePercent: 28.5,
    monthlyGMVKES: 8108000,
    activeDukas: 348,
    avgBasketSizeKES: 17800,
    fulfillmentRate: 93.4,
    dominantCategory: 'Edible Oils & Sugar',
    primaryDepot: 'Industrial Area Supply Hub',
    growthWoW: 11.8,
  },
  {
    zoneId: 'zone_nairobi_west',
    name: 'Nairobi West Corridor',
    neighborhoods: 'Kawangware, Dagoretti Corner, Kangemi, Uthiru',
    orderSharePercent: 21.0,
    monthlyGMVKES: 5975000,
    activeDukas: 265,
    avgBasketSizeKES: 12400,
    fulfillmentRate: 84.1,
    dominantCategory: 'Maize Meal & Dairy',
    primaryDepot: 'Westlands Express Depot',
    growthWoW: 14.5,
  },
  {
    zoneId: 'zone_nairobi_north',
    name: 'Thika Road Corridor',
    neighborhoods: 'Kasarani, Roysambu, Githurai 44, Zimmerman, Kahawa',
    orderSharePercent: 16.3,
    monthlyGMVKES: 4637000,
    activeDukas: 165,
    avgBasketSizeKES: 15600,
    fulfillmentRate: 90.5,
    dominantCategory: 'Sugar & Detergents',
    primaryDepot: 'Eastleigh Mega Wholesale Depot',
    growthWoW: 18.1,
  },
];

export const HISTORICAL_AND_PROJECTED_DEMAND: DailyDemandPoint[] = [
  // Past 10 days realized vs unmet
  { date: '2026-08-31', dayLabel: 'Mon 31', realizedGMV: 780000, unmetGMV: 110000, totalDemand: 890000, eventNote: 'Month-end salary restock' },
  { date: '2026-09-01', dayLabel: 'Tue 01', realizedGMV: 920000, unmetGMV: 130000, totalDemand: 1050000 },
  { date: '2026-09-02', dayLabel: 'Wed 02', realizedGMV: 840000, unmetGMV: 95000, totalDemand: 935000 },
  { date: '2026-09-03', dayLabel: 'Thu 03', realizedGMV: 890000, unmetGMV: 105000, totalDemand: 995000 },
  { date: '2026-09-04', dayLabel: 'Fri 04', realizedGMV: 1080000, unmetGMV: 145000, totalDemand: 1225000, eventNote: 'Weekend retail spike' },
  { date: '2026-09-05', dayLabel: 'Sat 05', realizedGMV: 1150000, unmetGMV: 160000, totalDemand: 1310000 },
  { date: '2026-09-06', dayLabel: 'Sun 06', realizedGMV: 640000, unmetGMV: 75000, totalDemand: 715000 },
  { date: '2026-09-07', dayLabel: 'Mon 07', realizedGMV: 860000, unmetGMV: 115000, totalDemand: 975000 },
  { date: '2026-09-08', dayLabel: 'Tue 08', realizedGMV: 910000, unmetGMV: 120000, totalDemand: 1030000 },
  { date: '2026-09-09', dayLabel: 'Wed 09 (Today)', realizedGMV: 965000, unmetGMV: 135000, totalDemand: 1100000 },
  
  // Future 7 days AI Forecast (P10, P50, P90)
  { date: '2026-09-10', dayLabel: 'Thu 10', realizedGMV: 980000, unmetGMV: 110000, totalDemand: 1090000, isForecast: true, p10: 980000, p90: 1200000 },
  { date: '2026-09-11', dayLabel: 'Fri 11', realizedGMV: 1180000, unmetGMV: 130000, totalDemand: 1310000, isForecast: true, p10: 1180000, p90: 1440000, eventNote: 'Predicted weekend rush' },
  { date: '2026-09-12', dayLabel: 'Sat 12', realizedGMV: 1240000, unmetGMV: 140000, totalDemand: 1380000, isForecast: true, p10: 1230000, p90: 1520000 },
  { date: '2026-09-13', dayLabel: 'Sun 13', realizedGMV: 690000, unmetGMV: 80000, totalDemand: 770000, isForecast: true, p10: 670000, p90: 860000 },
  { date: '2026-09-14', dayLabel: 'Mon 14', realizedGMV: 920000, unmetGMV: 100000, totalDemand: 1020000, isForecast: true, p10: 890000, p90: 1150000 },
  { date: '2026-09-15', dayLabel: 'Tue 15', realizedGMV: 970000, unmetGMV: 110000, totalDemand: 1080000, isForecast: true, p10: 950000, p90: 1220000 },
  { date: '2026-09-16', dayLabel: 'Wed 16', realizedGMV: 1010000, unmetGMV: 115000, totalDemand: 1125000, isForecast: true, p10: 990000, p90: 1280000 },
];

export const SUPPRESSED_DEMAND_SIGNALS: SuppressedDemandSignal[] = [
  {
    id: 'sup_01',
    skuName: 'Mumias Pure Sugar (20x1kg Bale)',
    category: 'Pure Cane Sugar & Sweeteners',
    unmetAttemptsCount: 482,
    lostGmvKES: 723000,
    primaryReason: 'Wholesaler Stockout',
    affectedZones: ['Nairobi East', 'Thika Road Corridor', 'Nairobi West'],
    urgency: 'CRITICAL',
    status: 'OPEN_SIGNAL',
    suggestedAction: 'Incentivize Kabras Sugar staging at Eastleigh & Industrial Area depots via 1.5% margin relief.',
  },
  {
    id: 'sup_02',
    skuName: 'Ndovu Maize Flour (12x2kg Bale)',
    category: 'Maize Meal & Grain Flours',
    unmetAttemptsCount: 314,
    lostGmvKES: 596600,
    primaryReason: 'Wholesaler Stockout',
    affectedZones: ['Nairobi East', 'Central Commercial'],
    urgency: 'HIGH',
    status: 'SUPPLIER_ALERTED',
    suggestedAction: 'Re-route 250 bales from Unga Group depot to Kariobangi staging point.',
  },
  {
    id: 'sup_03',
    skuName: 'Fresh Fri Cooking Oil (4x3L Carton)',
    category: 'Edible Cooking Oils & Fats',
    unmetAttemptsCount: 198,
    lostGmvKES: 346500,
    primaryReason: 'Wholesaler Stockout',
    affectedZones: ['Nairobi West', 'Thika Road Corridor'],
    urgency: 'HIGH',
    status: 'OPEN_SIGNAL',
    suggestedAction: 'Notify Pwani Oil distributor for scheduled consignment replenishment.',
  },
  {
    id: 'sup_04',
    skuName: 'Rina Vegetable Oil (20L Jerrycan Commercial)',
    category: 'Edible Cooking Oils & Fats',
    unmetAttemptsCount: 89,
    lostGmvKES: 427200,
    primaryReason: 'MOQ Too High',
    affectedZones: ['Central Commercial', 'Nairobi East'],
    urgency: 'MEDIUM',
    status: 'RESTOCK_SCHEDULED',
    suggestedAction: 'Enable split 5L canister repackaging for small food vendor dukas.',
  },
  {
    id: 'sup_05',
    skuName: 'Ketepa Pride Tea Bags (100 Bags x 12 Pack)',
    category: 'Dairy, Tea & Beverages',
    unmetAttemptsCount: 145,
    lostGmvKES: 174000,
    primaryReason: 'No Wholesaler Sells Brand',
    affectedZones: ['Nairobi East', 'Nairobi West'],
    urgency: 'MEDIUM',
    status: 'OPEN_SIGNAL',
    suggestedAction: 'Onboard KTDA wholesale distributor into Industrial Area depot node.',
  },
];

export const ML_DEMAND_MODEL_INSIGHT: MLModelInsight = {
  modelName: 'LightGBM Hybrid FMCG Forecaster',
  version: 'v2.4.1-nairobi',
  mapeScore: 5.8, // 94.2% accuracy
  lastTrained: '2026-09-08 03:00 UTC',
  features: [
    { name: 'Prior 14-Day Retailer Cadence', importanceWeight: 0.34, description: 'Order frequency, basket size consistency, and historical restock timing' },
    { name: 'Payday & Salary Cycle Distance', importanceWeight: 0.22, description: 'Proximity to 1st/15th/30th monthly civil/corporate payroll peaks' },
    { name: 'Wholesaler Fulfillment SLA & Proximity', importanceWeight: 0.18, description: 'Depot preparation latency and distance within 8km delivery buffer' },
    { name: 'Weather & Precipitation Risk Index', importanceWeight: 0.14, description: 'Heavy rains increase duka safety-stock orders by +18% to hedge transport cuts' },
    { name: 'Wholesale Tier Price Volatility', importanceWeight: 0.12, description: 'Wholesale discounting shifts staple orders forward by 2-3 business days' },
  ],
};
