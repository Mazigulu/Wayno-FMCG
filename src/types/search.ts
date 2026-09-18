import { Product, SupplierProduct, SearchResultItem, RetailerShop } from './wayno';

export type QueryIntent = 
  | 'SPECIFIC_SKU'       // e.g. "Jogoo 2kg bale"
  | 'CATEGORY_EXPLORE'   // e.g. "cooking oil", "flour"
  | 'NEED_BASED'         // e.g. "things to wash clothes", "clean greasy pots"
  | 'BARGAIN_PRICE'      // e.g. "cheapest unga", "discount bulk soap"
  | 'URGENT_RESTOCK'     // e.g. "emergency stock near me", "fast delivery"
  | 'BRAND_EXPLORE';     // e.g. "Unilever products", "Pembe"

export interface ParsedPackSize {
  raw: string;                 // e.g. "2kg", "500g", "3L", "24pk"
  numericValue: number;        // e.g. 2, 500, 3, 24
  unit: string;                // e.g. "kg", "g", "L", "ml", "pk"
  normalizedUnit: 'KG' | 'G' | 'L' | 'ML' | 'PIECES' | 'SACHET' | 'UNKNOWN';
  standardizedGramsOrMl?: number;
}

export interface ParsedBulkUnit {
  raw: string;                 // e.g. "bale", "carton", "crate", "box", "debe", "tin"
  canonicalUnit: 'BALE' | 'CARTON' | 'CRATE' | 'BOX' | 'DEBE' | 'TIN' | 'PIECE';
  unitMultiplier?: number;     // e.g. 12 pkts per bale
}

export interface SpellCorrection {
  originalTerm: string;
  correctedTerm: string;
  levenshteinDistance: number;
  confidence: number;
}

export interface KenyanTerminologyMatch {
  rawTerm: string;
  canonicalConcept: string;
  dialect: 'Sheng' | 'Swahili' | 'Swahili/Sheng' | 'Kenyan English' | 'Trade Colloquial';
  englishTranslation: string;
  categoryHint?: string;
}

export interface FactorScoreBreakdown {
  textRelevance: number;       // 0 - 100
  geoProximity: number;        // 0 - 100 (distance penalty)
  priceCompetitiveness: number;// 0 - 100 (lowest wholesale cost)
  retailerMargin: number;      // 0 - 100 (RRP - wholesale profit)
  supplierReliability: number; // 0 - 100 (depot fulfillment track record)
  personalizedBoost: number;   // 0 - 100 (duka historical affinity)
  stockAvailability: number;   // 0 - 100
  promotionalBoost?: number;   // 0 - 50 (active sponsored placement boost)
  totalWeightedScore: number;  // 0 - 100
}

export interface EnhancedSearchResultItem extends SearchResultItem {
  scoreBreakdown: FactorScoreBreakdown;
  matchedPackSize?: ParsedPackSize;
  matchedBulkUnit?: ParsedBulkUnit;
  detectedDialects: KenyanTerminologyMatch[];
  isSubstituted?: boolean;
  substitutionReason?: string;
  isSponsored?: boolean;
  promotedBy?: string;
  promoBadge?: string;
  promoDiscountKES?: number;
  placementSlot?: 'HERO_BANNER' | 'TOP_SEARCH_SPONSORED' | 'CATEGORY_FEATURED' | 'CHECKOUT_UPSELL';
  isTargetedPromotion?: boolean;
  conquestMatch?: boolean;
  conquestRivalBrand?: string;
  targetedBadgeText?: string;
  appliedCampaignId?: string;
  deliveryZone?: {
    zoneTier: 'LOCAL_CORRIDOR' | 'SUBCOUNTY_EXPRESS' | 'EXTENDED_DISPATCH' | 'OUT_OF_CORRIDOR';
    zoneName: string;
    distanceKm: number;
    estimatedMinutes: number;
    bodaFareKES: number;
    availableForDispatch: boolean;
    zoneBadgeColor: string;
  };
}

export interface ZeroResultFallback {
  didYouMean?: string;
  relaxedQuery?: string;
  closestSubstitutes: EnhancedSearchResultItem[];
  unmetDemandCategory?: string;
  wholesalerStockRequestSent: boolean;
}

export type AutocompleteType = 
  | 'PRODUCT' 
  | 'BRAND' 
  | 'SHENG_VERNACULAR' 
  | 'CATEGORY' 
  | 'PACK_SIZE' 
  | 'NEED_INTENT';

export interface AutocompleteSuggestion {
  id: string;
  type: AutocompleteType;
  title: string;
  subtitle: string;
  query: string;
  badge?: string;
  iconName?: string;
  count?: number;
}

export interface TargetedConquestOffer {
  campaignId: string;
  campaignName: string;
  sponsorName: string;
  triggerBrand: string;
  alternativeProduct: EnhancedSearchResultItem;
  discountKES: number;
  headline: string;
  subtext: string;
  badgeText: string;
  callToActionText: string;
}

export interface SearchFilters {
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  packSizes?: string[];
  maxDistanceKm?: number;
  promotionsOnly?: boolean;
  wholesalerLocationId?: string;
}

export interface FacetCount {
  value: string;
  count: number;
  label?: string;
}

export interface SearchFacets {
  categories: FacetCount[];
  brands: FacetCount[];
  packSizes: FacetCount[];
  wholesalers: FacetCount[];
  priceRange: { min: number; max: number };
  inStockCount: number;
  promotionsCount: number;
}

export interface InvertedIndexMetrics {
  totalDocuments: number;
  totalTokensIndexed: number;
  uniqueTermsCount: number;
  avgDocLength: number;
  postingsEvaluated: number;
  indexLookupTimeMs: number;
}

export interface SearchExecutionResultEnhanced {
  query: string;
  normalizedQuery: string;
  spellCorrections: SpellCorrection[];
  detectedDialectTerms: KenyanTerminologyMatch[];
  extractedPackSize?: ParsedPackSize;
  extractedBulkUnit?: ParsedBulkUnit;
  detectedIntent: QueryIntent;
  intentExplanation: string;
  expandedTerms: string[];
  results: EnhancedSearchResultItem[];
  executionTimeMs: number;
  totalHits: number;
  zeroResult: boolean;
  fallback?: ZeroResultFallback;
  activeShopId?: string;
  rankingStrategy: 'SMART_BALANCED' | 'PRICE_LOW' | 'DISTANCE_NEAR' | 'MARGIN_HIGH' | 'SPEED_FAST';
  targetedConquest?: TargetedConquestOffer;
  facets?: SearchFacets;
  appliedFilters?: SearchFilters;
  indexMetrics?: InvertedIndexMetrics;
  synonymsApplied?: Array<{ original: string; expansions: string[] }>;
  fuzzyMatches?: Array<{ original: string; matched: string; distance: number; score: number }>;
  sequenceId?: number; // Monotonic counter to prevent out-of-order 2G/3G jitter overwrite
}

export interface SearchAnalyticsEntry {
  id: string;
  timestamp: string;
  query: string;
  normalizedQuery: string;
  latencyMs: number;
  hitsCount: number;
  intent: QueryIntent;
  zeroResult: boolean;
  selectedRanking: string;
  dukaShopId: string;
  dukaShopName: string;
  correctedFrom?: string;
  clickedResultId?: string;
  convertedOrderId?: string;
  appliedFiltersSummary?: string;
}

export interface SearchRequirementSpec {
  id: string;
  number: number;
  title: string;
  shortDesc: string;
  businessImportance: string;
  technicalImplementation: string;
  sampleQueries: string[];
  verificationCriteria: string;
  status: 'IMPLEMENTED' | 'ACTIVE_BENCHMARKED';
}
