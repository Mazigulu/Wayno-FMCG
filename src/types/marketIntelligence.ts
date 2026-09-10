export type PipelineStageId = 
  | 'STREAM_INGESTION' 
  | 'CLEANSING_ETL' 
  | 'AGGREGATION_ROLLUP' 
  | 'ML_INFERENCE' 
  | 'SYNDICATION_ACTION';

export interface PipelineStageInfo {
  id: PipelineStageId;
  name: string;
  stepNumber: number;
  description: string;
  status: 'HEALTHY' | 'PROCESSING' | 'DEGRADED';
  throughputPerSec: number;
  latencyMs: number;
  queueDepth: number;
  processed24h: number;
  activeWorkers: number;
  errorRatePercent: number;
  techStack: string;
  keyFunctions: string[];
}

export type MarketEventType = 
  | 'DUKA_SEARCH_QUERY' 
  | 'CHECKOUT_ORDER' 
  | 'DEPOT_STOCK_SYNC' 
  | 'SPOT_PRICE_PING' 
  | 'RIDER_CORRIDOR_METRIC';

export interface MarketEvent {
  id: string;
  timestamp: string;
  type: MarketEventType;
  source: string;
  zone: string;
  payload: Record<string, any>;
  pipelineStage: PipelineStageId;
  latencyMs: number;
}

export interface DepotWholesalePrice {
  depotId: string;
  depotName: string;
  zone: string;
  price: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: string;
  minOrderQty: number;
}

export interface WholesalePriceDispersion {
  skuId: string;
  skuName: string;
  category: string;
  packSize: string;
  manufacturerRRP: number;
  avgWholesalePrice: number;
  minWholesalePrice: number;
  maxWholesalePrice: number;
  spreadKES: number;
  spreadPercent: number;
  depotPrices: DepotWholesalePrice[];
  priceElasticity: 'HIGH' | 'MODERATE' | 'INELASTIC';
  arbitrageRisk: 'HIGH' | 'MODERATE' | 'LOW';
  recommendedCeilingKES: number;
  recommendedFloorKES: number;
}

export interface ZoneLiquidityMetric {
  zoneId: string;
  zoneName: string;
  primaryDepots: string[];
  activeDukas: number;
  dailyGMVKES: number;
  orderCount24h: number;
  avgBasketKES: number;
  fulfillmentRate: number;
  supplyBufferHours: number;
  liquidityStatus: 'SURPLUS' | 'BALANCED' | 'TIGHT' | 'DEFICIT';
  dominantCategory: string;
  unmetDemandKES: number;
  topMovingSKU: string;
}

export interface BrandShareItem {
  brandName: string;
  manufacturer: string;
  sharePercent: number;
  monthlyGMVKES: number;
  changeWoW: number;
  penetrationDukasPercent: number;
  rebateActive: boolean;
}

export interface BrandMarketShare {
  category: string;
  totalCategoryMonthlyGMVKES: number;
  brands: BrandShareItem[];
  dominantBrand: string;
  competitiveTensionIndex: number; // 0 - 100
}

export interface FMCGBasketItem {
  name: string;
  unit: string;
  weightPercent: number;
  currentPriceKES: number;
  lastMonthPriceKES: number;
  priceChangePercent: number;
}

export interface FMCGBasketIndexPoint {
  month: string;
  timestamp: string;
  basketCostKES: number;
  inflationMoMPercent: number;
  foodPressureRating: 'STABLE' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  itemsBreakdown: FMCGBasketItem[];
}

export interface MarketAnomalyAlert {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  affectedSKU?: string;
  affectedZone: string;
  metricDeviation: string;
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  automatedAction: {
    actionId: string;
    label: string;
    targetService: 'WHOLESALER_DISPATCH' | 'SEARCH_BOOST' | 'PROMOTIONAL_REBATE' | 'DEPOT_REALLOCATION';
    description: string;
  };
}

export interface MarketIntelligenceSnapshot {
  pipelineHealth: 'OPTIMAL' | 'ELEVATED_LOAD' | 'DEGRADED';
  stages: PipelineStageInfo[];
  totalEventsProcessed24h: number;
  liveEventsPerSec: number;
  avgPipelineLatencyMs: number;
  activeAnomaliesCount: number;
  zoneLiquidity: ZoneLiquidityMetric[];
  priceDispersion: WholesalePriceDispersion[];
  brandShares: BrandMarketShare[];
  basketIndex: FMCGBasketIndexPoint[];
  recentAnomalies: MarketAnomalyAlert[];
  syndicatedSubscribersCount: number;
}
