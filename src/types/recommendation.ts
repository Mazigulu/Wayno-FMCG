import { Product, SupplierProduct } from './wayno';

export type RecommendationSignalType = 
  | 'HISTORICAL_SEARCHES'
  | 'PURCHASES'
  | 'LOCATION'
  | 'TIME'
  | 'PRODUCT_PREFERENCES';

export type TimeWindow = 
  | 'MORNING_RESTOCK'   // 05:00 - 10:59: Breakfast staples, spreads, tea, milk
  | 'MIDDAY_RUSH'       // 11:00 - 16:29: Cooking oil, flour, rice, lunch prep
  | 'EVENING_PREP'      // 16:30 - 22:59: Dinner staples, maize meal, kerosene/cleaning
  | 'LATE_NIGHT_EMERGENCY'; // 23:00 - 04:59: Basic emergency replenishments

export interface RetailerHistoricalSearchSignal {
  recentQueries: string[];
  inferredCategoryAffinities: Record<string, number>; // category -> frequency weight 0-1
  inferredBrandAffinities: Record<string, number>;    // brand -> frequency weight 0-1
  topKeywords: string[];
}

export interface RetailerPurchaseSignal {
  totalPastOrders: number;
  frequentlyPurchasedProductIds: string[];
  daysSinceLastOrder: number;
  averageRestockCycleDays: number;
  estimatedDepletionProductIds: string[]; // products predicted to be running low in the duka
}

export interface RetailerLocationSignal {
  shopId: string;
  serviceZoneId: string;
  zoneName: string;
  latitude: number;
  longitude: number;
  nearestDepotId: string;
  nearestDepotDistanceKm: number;
  zoneFastMovingCategories: string[];
}

export interface RetailerTimeSignal {
  currentHour: number;
  dayOfWeek: string;
  timeWindow: TimeWindow;
  timeWindowLabel: string;
  isWeekendPrep: boolean; // Thursday/Friday/Saturday restocking ahead of high weekend footfall
  boostedCategories: string[];
}

export interface RetailerProductPreferenceSignal {
  marginSensitivity: 'HIGH' | 'BALANCED' | 'VOLUME'; // prefers high % margin vs raw volume
  preferredPackSizes: string[];                      // e.g. ['2kg', '1L', 'Bale', 'Carton']
  preferredUnits: string[];                          // e.g. ['Bale', 'Carton']
  minTargetMarginPercent: number;
  trustedBrands: string[];
}

export interface RetailerProfileSignals {
  historicalSearches: RetailerHistoricalSearchSignal;
  purchases: RetailerPurchaseSignal;
  location: RetailerLocationSignal;
  time: RetailerTimeSignal;
  productPreferences: RetailerProductPreferenceSignal;
}

export interface RecommendationScoreBreakdown {
  historicalSearchScore: number;    // 0 - 100
  purchaseHistoryScore: number;     // 0 - 100
  locationVelocityScore: number;    // 0 - 100
  temporalRelevanceScore: number;   // 0 - 100
  preferenceAffinityScore: number;  // 0 - 100
  compositeScore: number;           // 0 - 100
  primaryDriver: RecommendationSignalType;
  explanationTags: string[];
  confidenceScore: number;          // 0 - 100
}

export interface RecommendedProductItem {
  product: Product;
  bestSupplierProduct: SupplierProduct;
  scoreBreakdown: RecommendationScoreBreakdown;
  rank: number;
  recommendationReason: string;
  urgencyLevel: 'HIGH_RESTOCK_URGENCY' | 'POPULAR_IN_ZONE' | 'DAILY_TIME_STAPLE' | 'HIGH_MARGIN_OPPORTUNITY' | 'FAVORITE_REORDER';
}

export interface RecommendationEngineWeights {
  historicalSearches: number; // e.g. 0.25
  purchases: number;          // e.g. 0.30
  location: number;           // e.g. 0.15
  time: number;               // e.g. 0.15
  productPreferences: number; // e.g. 0.15
}

export interface RecommendationExecutionResult {
  shopId: string;
  shopName: string;
  evaluatedAt: string;
  executionTimeMs: number;
  signalsExtracted: RetailerProfileSignals;
  weightsApplied: RecommendationEngineWeights;
  recommendations: RecommendedProductItem[];
  searchFirstPreserved: boolean;
  totalCatalogEvaluated: number;
}
