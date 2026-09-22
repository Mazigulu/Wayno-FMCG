import { Product, SupplierProduct, RetailerShop } from '../types/wayno';
import { 
  QueryIntent, 
  ParsedPackSize, 
  ParsedBulkUnit, 
  SpellCorrection, 
  KenyanTerminologyMatch, 
  FactorScoreBreakdown, 
  EnhancedSearchResultItem, 
  SearchExecutionResultEnhanced,
  ZeroResultFallback,
  AutocompleteSuggestion,
  SearchAnalyticsEntry,
  SearchFilters,
  SearchFacets,
  InvertedIndexMetrics
} from '../types/search';
import { PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS, INITIAL_SHOPS } from '../data/mockData';
import { PromotionalPlacement } from '../types/promotions';
import { 
  INITIAL_PROMOTIONAL_PLACEMENTS, 
  evaluateCampaignForShop, 
  getDukaProfileById 
} from '../data/promotionsData';
import { TargetedConquestOffer } from '../types/search';
import {
  invertedIndexInstance,
  synonymEngineInstance,
  fuzzyEngineInstance,
  evaluateGeoDeliveryZone,
  GeoDeliveryZoneInfo,
  FMCG_SYNONYM_CLUSTERS
} from './invertedIndex';
import { geoEngine } from './hierarchicalGeofenceEngine';
import {
  supplyNodeBitmapIndex,
  prefixTrieInstance,
  calculateAABB,
  isPointInAABB,
  localNodeSnapshotCache
} from './fastSpatialSearchIndex';

// ---------------------------------------------------------------------------
// 0. ACTIVE PROMOTIONAL PLACEMENTS REGISTRY (FMCG SPONSORED ADS & TRADE PROMOS)
// ---------------------------------------------------------------------------

let activePromotionalPlacements: PromotionalPlacement[] = [...INITIAL_PROMOTIONAL_PLACEMENTS];

export const getPromotionalPlacements = (): PromotionalPlacement[] => {
  return activePromotionalPlacements;
};

export const updatePromotionalPlacement = (updated: PromotionalPlacement): void => {
  activePromotionalPlacements = activePromotionalPlacements.map(p => p.id === updated.id ? updated : p);
};

export const addPromotionalPlacement = (placement: PromotionalPlacement): void => {
  activePromotionalPlacements = [placement, ...activePromotionalPlacements];
};

export const togglePromotionalPlacementStatus = (id: string): PromotionalPlacement | undefined => {
  let updatedPlacement: PromotionalPlacement | undefined;
  activePromotionalPlacements = activePromotionalPlacements.map(p => {
    if (p.id === id) {
      const nextStatus = p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      updatedPlacement = { ...p, status: nextStatus };
      return updatedPlacement;
    }
    return p;
  });
  return updatedPlacement;
};

export const recordPromotionalImpression = (placementId: string): void => {
  activePromotionalPlacements = activePromotionalPlacements.map(p => {
    if (p.id === placementId) {
      return { ...p, impressions: p.impressions + 1 };
    }
    return p;
  });
};

export const recordPromotionalClick = (placementId: string): void => {
  activePromotionalPlacements = activePromotionalPlacements.map(p => {
    if (p.id === placementId) {
      const newClicks = p.clicks + 1;
      const addedSpend = p.cpcBidKES;
      return { 
        ...p, 
        clicks: newClicks, 
        spentKES: Math.min(p.budgetKES, p.spentKES + addedSpend) 
      };
    }
    return p;
  });
};

export const recordPromotionalPurchase = (placementId: string, gmvKES: number): void => {
  activePromotionalPlacements = activePromotionalPlacements.map(p => {
    if (p.id === placementId) {
      return {
        ...p,
        conversions: p.conversions + 1,
        gmvGeneratedKES: p.gmvGeneratedKES + gmvKES,
      };
    }
    return p;
  });
};

export const recordOrderPromotionalConversions = (
  items: Array<{ productId: string; totalPrice: number; campaignId?: string }>
): { attributedCampaigns: string[]; totalAttributedGmvKES: number } => {
  const attributedCampaigns: string[] = [];
  let totalAttributedGmvKES = 0;

  items.forEach((item) => {
    let targetCampaignId = item.campaignId;
    if (!targetCampaignId) {
      // Find active promotion matching this product
      const match = activePromotionalPlacements.find(
        (p) => p.status === 'ACTIVE' && p.targetProductId === item.productId
      );
      if (match) {
        targetCampaignId = match.id;
      }
    }

    if (targetCampaignId) {
      recordPromotionalPurchase(targetCampaignId, item.totalPrice);
      if (!attributedCampaigns.includes(targetCampaignId)) {
        attributedCampaigns.push(targetCampaignId);
      }
      totalAttributedGmvKES += item.totalPrice;
    }
  });

  return { attributedCampaigns, totalAttributedGmvKES };
};

// ---------------------------------------------------------------------------
// 1. DICTIONARIES & TAXONOMIES FOR KENYAN FMCG DUKA TRADE
// ---------------------------------------------------------------------------

export const KENYAN_TERMINOLOGY_MAP: Record<string, KenyanTerminologyMatch> = {
  njugu: {
    rawTerm: 'njugu',
    canonicalConcept: 'groundnuts / peanuts',
    dialect: 'Swahili/Sheng',
    englishTranslation: 'Roasted whole groundnuts / peanuts',
    categoryHint: 'Snacks & Confectionery'
  },
  karanga: {
    rawTerm: 'karanga',
    canonicalConcept: 'peanuts / groundnuts',
    dialect: 'Swahili',
    englishTranslation: 'Roasted peanuts snack',
    categoryHint: 'Snacks & Confectionery'
  },
  'njugu karanga': {
    rawTerm: 'njugu karanga',
    canonicalConcept: 'groundnuts',
    dialect: 'Swahili',
    englishTranslation: 'Salted roasted groundnuts',
    categoryHint: 'Snacks & Confectionery'
  },
  unga: {
    rawTerm: 'unga',
    canonicalConcept: 'flour (maize or wheat)',
    dialect: 'Swahili',
    englishTranslation: 'Flour / Maize meal / Wheat baking flour',
    categoryHint: 'Grains & Flours'
  },
  'unga wa ugali': {
    rawTerm: 'unga wa ugali',
    canonicalConcept: 'maize meal flour',
    dialect: 'Swahili',
    englishTranslation: 'Sifted maize meal for cooking ugali',
    categoryHint: 'Grains & Flours'
  },
  'unga wa ngano': {
    rawTerm: 'unga wa ngano',
    canonicalConcept: 'wheat flour',
    dialect: 'Swahili',
    englishTranslation: 'Baking wheat flour for chapati / mandazi',
    categoryHint: 'Grains & Flours'
  },
  posho: {
    rawTerm: 'posho',
    canonicalConcept: 'maize meal',
    dialect: 'Kenyan English',
    englishTranslation: 'Staple cornmeal / ugali meal',
    categoryHint: 'Grains & Flours'
  },
  sembe: {
    rawTerm: 'sembe',
    canonicalConcept: 'maize flour',
    dialect: 'Sheng',
    englishTranslation: 'Fine white maize meal for ugali',
    categoryHint: 'Grains & Flours'
  },
  chapo: {
    rawTerm: 'chapo',
    canonicalConcept: 'wheat flour',
    dialect: 'Sheng',
    englishTranslation: 'Chapati flour (Home baking wheat flour)',
    categoryHint: 'Grains & Flours'
  },
  sabuni: {
    rawTerm: 'sabuni',
    canonicalConcept: 'soap',
    dialect: 'Swahili',
    englishTranslation: 'Soap, laundry bar or bath soap',
    categoryHint: 'Laundry & Household Cleaning'
  },
  'sabuni ya kipande': {
    rawTerm: 'sabuni ya kipande',
    canonicalConcept: 'laundry bar soap',
    dialect: 'Trade Colloquial',
    englishTranslation: 'Multi-purpose long laundry bar soap',
    categoryHint: 'Laundry & Household Cleaning'
  },
  'sabuni ya unga': {
    rawTerm: 'sabuni ya unga',
    canonicalConcept: 'washing powder',
    dialect: 'Swahili',
    englishTranslation: 'Powder laundry detergent (Omo, Sunlight)',
    categoryHint: 'Laundry & Household Cleaning'
  },
  mafuta: {
    rawTerm: 'mafuta',
    canonicalConcept: 'cooking oil',
    dialect: 'Swahili',
    englishTranslation: 'Vegetable cooking oil or frying fat',
    categoryHint: 'Oils & Fats'
  },
  salad: {
    rawTerm: 'salad',
    canonicalConcept: 'cooking oil',
    dialect: 'Kenyan English',
    englishTranslation: 'Liquid cooking vegetable oil (Fresh Fri, Rina)',
    categoryHint: 'Oils & Fats'
  },
  sukari: {
    rawTerm: 'sukari',
    canonicalConcept: 'sugar',
    dialect: 'Swahili',
    englishTranslation: 'White cane table sugar',
    categoryHint: 'Sugar & Sweeteners'
  },
  chai: {
    rawTerm: 'chai',
    canonicalConcept: 'tea',
    dialect: 'Swahili',
    englishTranslation: 'Black tea or tea bags',
    categoryHint: 'Beverages & Tea'
  },
  'majani ya chai': {
    rawTerm: 'majani ya chai',
    canonicalConcept: 'tea leaves',
    dialect: 'Swahili',
    englishTranslation: 'Black tea leaves or tea bags (Ketepa)',
    categoryHint: 'Beverages & Tea'
  },
  mchele: {
    rawTerm: 'mchele',
    canonicalConcept: 'rice',
    dialect: 'Swahili',
    englishTranslation: 'Milled grains of rice (Basmati/Pishori)',
    categoryHint: 'Grains & Flours'
  },
  mchuzi: {
    rawTerm: 'mchuzi',
    canonicalConcept: 'seasoning / stew flavoring',
    dialect: 'Swahili',
    englishTranslation: 'Stew gravy seasoning / food spice (Royco)',
    categoryHint: 'Spices & Seasoning'
  },
  chwani: {
    rawTerm: 'chwani',
    canonicalConcept: 'budget retail sachet (50 KES)',
    dialect: 'Sheng',
    englishTranslation: '50-shilling consumer portion packet',
    categoryHint: 'Snacks & Confectionery'
  },
  bale: {
    rawTerm: 'bale',
    canonicalConcept: 'bulk bundle package',
    dialect: 'Trade Colloquial',
    englishTranslation: 'Wholesale bale of 10, 12, or 24 retail units',
    categoryHint: 'Grains & Flours'
  }
};

// Brand Aliases & Colloquialisms
export const BRAND_ALIASES: Record<string, string> = {
  blueband: 'Blue Band',
  'blue band': 'Blue Band',
  bluband: 'Blue Band',
  blewband: 'Blue Band',
  upfield: 'Blue Band',
  jogoo: 'Jogoo',
  soko: 'Soko',
  pembe: 'Pembe',
  'fresh fri': 'Fresh Fri',
  freshfri: 'Fresh Fri',
  rina: 'Rina',
  omo: 'Omo',
  sunlight: 'Sunlight',
  geisha: 'Geisha',
  menengai: 'Menengai',
  ketepa: 'Ketepa',
  mumias: 'Mumias',
  dawaat: 'Dawaat',
  royco: 'Royco',
};

// Product Aliases
export const PRODUCT_ALIASES: Record<string, string[]> = {
  groundnuts: ['peanuts', 'njugu', 'karanga', 'roasted peanuts'],
  peanuts: ['groundnuts', 'njugu', 'karanga'],
  njugu: ['peanuts', 'groundnuts', 'karanga'],
  margarine: ['spread', 'blue band', 'blueband', 'butter'],
  butter: ['margarine', 'blue band', 'spread'],
  flour: ['unga', 'maize meal', 'wheat flour', 'posho', 'sembe'],
  'maize meal': ['flour', 'unga', 'unga wa ugali', 'jogoo', 'soko', 'posho'],
  'wheat flour': ['unga wa ngano', 'pembe', 'baking flour', 'chapo'],
  soap: ['sabuni', 'menengai', 'geisha', 'bar soap', 'bathing soap', 'omo'],
  detergent: ['washing powder', 'omo', 'sunlight', 'sabuni ya unga', 'laundry'],
  'cooking oil': ['mafuta', 'salad', 'fresh fri', 'rina', 'vegetable oil', 'frying oil'],
  oil: ['cooking oil', 'mafuta', 'fresh fri', 'rina'],
  tea: ['chai', 'majani ya chai', 'ketepa', 'tea bags'],
  sugar: ['sukari', 'mumias', 'white sugar'],
  rice: ['mchele', 'basmati', 'dawaat', 'pilau'],
  seasoning: ['royco', 'mchuzi mix', 'spices'],
};

// ---------------------------------------------------------------------------
// 2. SPELL-CHECKER & FUZZY DISTANCE (LEVENSHTEIN)
// ---------------------------------------------------------------------------

export function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Canonical dictionary of search terms for spell-checking
const CANONICAL_DICTIONARY = [
  'blueband', 'blue band', 'margarine', 'spread',
  'jogoo', 'pembe', 'soko', 'unga', 'ugali', 'flour', 'maize', 'wheat',
  'fresh fri', 'freshfri', 'rina', 'cooking oil', 'oil', 'mafuta', 'salad',
  'omo', 'sunlight', 'detergent', 'powder', 'washing',
  'geisha', 'menengai', 'sabuni', 'soap', 'bar soap',
  'ketepa', 'tea', 'chai', 'majani',
  'njugu', 'peanuts', 'groundnuts', 'karanga',
  'mumias', 'sugar', 'sukari',
  'dawaat', 'rice', 'mchele', 'basmati',
  'royco', 'mchuzi', 'seasoning'
];

export function checkSpelling(word: string): SpellCorrection | null {
  const cleanWord = word.toLowerCase().trim();
  if (cleanWord.length < 4) return null;
  if (CANONICAL_DICTIONARY.includes(cleanWord)) return null;

  let bestMatch = '';
  let minDistance = 999;

  for (const dictWord of CANONICAL_DICTIONARY) {
    const dist = calculateLevenshteinDistance(cleanWord, dictWord);
    // Allow edit distance up to 2 for words of length 5+, or 1 for length 4
    const threshold = cleanWord.length <= 4 ? 1 : 2;
    if (dist <= threshold && dist < minDistance) {
      minDistance = dist;
      bestMatch = dictWord;
    }
  }

  if (bestMatch && minDistance <= 2) {
    const confidence = Math.max(0.6, 1 - (minDistance / Math.max(cleanWord.length, bestMatch.length)));
    return {
      originalTerm: word,
      correctedTerm: bestMatch,
      levenshteinDistance: minDistance,
      confidence: Math.round(confidence * 100) / 100,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 3. PACK-SIZE & BULK-UNIT PARSER
// ---------------------------------------------------------------------------

export function parsePackSize(query: string): ParsedPackSize | undefined {
  // Regex looks for: 500g, 2kg, 2 kilo, 3L, 3 litre, 24pk, 100s, 800g
  const regex = /\b(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|g|gm|grams|l|litre|litres|liter|liters|ml|pk|packets|sachets|bars|bags|tubs|cans)\b/i;
  const match = query.match(regex);
  if (!match) return undefined;

  const numericValue = parseFloat(match[1]);
  const rawUnit = match[2].toLowerCase();

  let normalizedUnit: ParsedPackSize['normalizedUnit'] = 'UNKNOWN';
  let standardizedGramsOrMl: number | undefined;

  if (['kg', 'kilo', 'kilos'].includes(rawUnit)) {
    normalizedUnit = 'KG';
    standardizedGramsOrMl = numericValue * 1000;
  } else if (['g', 'gm', 'grams'].includes(rawUnit)) {
    normalizedUnit = 'G';
    standardizedGramsOrMl = numericValue;
  } else if (['l', 'litre', 'litres', 'liter', 'liters'].includes(rawUnit)) {
    normalizedUnit = 'L';
    standardizedGramsOrMl = numericValue * 1000; // ml equivalent
  } else if (rawUnit === 'ml') {
    normalizedUnit = 'ML';
    standardizedGramsOrMl = numericValue;
  } else if (['pk', 'packets', 'sachets', 'bars', 'bags', 'tubs', 'cans'].includes(rawUnit)) {
    normalizedUnit = 'PIECES';
  }

  return {
    raw: match[0],
    numericValue,
    unit: rawUnit,
    normalizedUnit,
    standardizedGramsOrMl,
  };
}

export function parseBulkUnit(query: string): ParsedBulkUnit | undefined {
  const bulkRegex = /\b(bale|bales|carton|cartons|crate|crates|box|boxes|debe|debes|tin|tins|sachet|sachets|piece|pieces|packet|packets|jerrycan|jerrycans|long bar)\b/i;
  const match = query.match(bulkRegex);
  if (!match) return undefined;

  const raw = match[0].toLowerCase();
  let canonicalUnit: ParsedBulkUnit['canonicalUnit'] = 'PIECE';
  let unitMultiplier = 1;

  if (raw.includes('bale')) {
    canonicalUnit = 'BALE';
    unitMultiplier = 12; // typical Kenyan FMCG flour bale
  } else if (raw.includes('carton') || raw.includes('box')) {
    canonicalUnit = 'CARTON';
    unitMultiplier = 24;
  } else if (raw.includes('crate')) {
    canonicalUnit = 'CRATE';
    unitMultiplier = 12;
  } else if (raw.includes('debe') || raw.includes('tin')) {
    canonicalUnit = 'DEBE';
    unitMultiplier = 1;
  }

  return {
    raw: match[0],
    canonicalUnit,
    unitMultiplier,
  };
}

// ---------------------------------------------------------------------------
// 4. QUERY INTENT CLASSIFIER
// ---------------------------------------------------------------------------

export function classifyQueryIntent(
  rawQuery: string,
  packSize?: ParsedPackSize,
  bulkUnit?: ParsedBulkUnit
): { intent: QueryIntent; explanation: string } {
  const lower = rawQuery.toLowerCase();

  // 1. Need/Problem based queries
  if (
    lower.includes('wash') ||
    lower.includes('clean') ||
    lower.includes('fry') ||
    lower.includes('cooking') ||
    lower.includes('breakfast') ||
    lower.includes('things to') ||
    lower.includes('uniform') ||
    lower.includes('stain') ||
    lower.includes('kuosha')
  ) {
    return {
      intent: 'NEED_BASED',
      explanation: 'Customer is expressing a functional household or trade need (e.g. laundry, breakfast, cooking) rather than a brand name.'
    };
  }

  // 2. Price/Bargain sensitivity
  if (
    lower.includes('cheap') ||
    lower.includes('cheapest') ||
    lower.includes('discount') ||
    lower.includes('wholesale') ||
    lower.includes('lowest') ||
    lower.includes('bargain') ||
    lower.includes('bei nafuu') ||
    lower.includes('offer')
  ) {
    return {
      intent: 'BARGAIN_PRICE',
      explanation: 'Retailer is price-sensitive and seeking maximum profit margin / lowest wholesale cost.'
    };
  }

  // 3. Urgent restock
  if (
    lower.includes('fast') ||
    lower.includes('urgent') ||
    lower.includes('emergency') ||
    lower.includes('haraka') ||
    lower.includes('express') ||
    lower.includes('near me') ||
    lower.includes('karibu')
  ) {
    return {
      intent: 'URGENT_RESTOCK',
      explanation: 'Duka is stock-out and prioritizing fast dispatch and closest wholesaler depot proximity.'
    };
  }

  // 4. Specific SKU targeting
  if (packSize || bulkUnit || Object.keys(BRAND_ALIASES).some((b) => lower.includes(b) && lower.length > b.length + 3)) {
    return {
      intent: 'SPECIFIC_SKU',
      explanation: 'Direct target purchase with specific brand, pack size (e.g. 2kg), or bulk packaging unit specified.'
    };
  }

  // 5. Brand explore
  if (Object.keys(BRAND_ALIASES).some((b) => lower.trim() === b)) {
    return {
      intent: 'BRAND_EXPLORE',
      explanation: 'Browsing all stock items produced or distributed under a single FMCG brand umbrella.'
    };
  }

  // 6. Category explore (default fallback)
  return {
    intent: 'CATEGORY_EXPLORE',
    explanation: 'High-level category browsing across available FMCG suppliers in the service zone.'
  };
}

// ---------------------------------------------------------------------------
// 5. HAVERSINE DISTANCE CALCULATOR
// ---------------------------------------------------------------------------

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ---------------------------------------------------------------------------
// 6. IN-MEMORY SEARCH ANALYTICS LOGS
// ---------------------------------------------------------------------------

const SEARCH_ANALYTICS_STORE: SearchAnalyticsEntry[] = [
  {
    id: 'ana_init_01',
    timestamp: '2 mins ago',
    query: 'unga wa ugali 2kg bale',
    normalizedQuery: 'unga wa ugali 2kg bale',
    latencyMs: 18,
    hitsCount: 3,
    intent: 'SPECIFIC_SKU',
    zeroResult: false,
    selectedRanking: 'SMART_BALANCED',
    dukaShopId: 'shop_01',
    dukaShopName: 'Mama Sarah Provision Duka',
  },
  {
    id: 'ana_init_02',
    timestamp: '5 mins ago',
    query: 'bluband',
    normalizedQuery: 'bluband',
    latencyMs: 14,
    hitsCount: 1,
    intent: 'BRAND_EXPLORE',
    zeroResult: false,
    selectedRanking: 'SMART_BALANCED',
    dukaShopId: 'shop_01',
    dukaShopName: 'Mama Sarah Provision Duka',
    correctedFrom: 'Blue Band',
  },
  {
    id: 'ana_init_03',
    timestamp: '12 mins ago',
    query: 'cooking oil near me',
    normalizedQuery: 'cooking oil near me',
    latencyMs: 22,
    hitsCount: 2,
    intent: 'URGENT_RESTOCK',
    zeroResult: false,
    selectedRanking: 'DISTANCE_NEAR',
    dukaShopId: 'shop_02',
    dukaShopName: 'Baraka Mini Mart',
  },
  {
    id: 'ana_init_04',
    timestamp: '25 mins ago',
    query: 'premium italian espresso beans',
    normalizedQuery: 'premium italian espresso beans',
    latencyMs: 15,
    hitsCount: 0,
    intent: 'CATEGORY_EXPLORE',
    zeroResult: true,
    selectedRanking: 'SMART_BALANCED',
    dukaShopId: 'shop_03',
    dukaShopName: 'Amani Corner Duka',
  }
];

export function logSearchAnalytics(entry: Omit<SearchAnalyticsEntry, 'id'>): void {
  const newEntry: SearchAnalyticsEntry = {
    ...entry,
    id: `ana_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
  };
  SEARCH_ANALYTICS_STORE.unshift(newEntry);
  if (SEARCH_ANALYTICS_STORE.length > 100) {
    SEARCH_ANALYTICS_STORE.pop();
  }
}

export function getSearchAnalyticsLogs(): SearchAnalyticsEntry[] {
  return [...SEARCH_ANALYTICS_STORE];
}

export function recordSearchResultClick(queryOrId: string, resultId: string): void {
  const entry = SEARCH_ANALYTICS_STORE.find(
    (e) => e.id === queryOrId || e.query.toLowerCase() === queryOrId.toLowerCase()
  );
  if (entry) {
    entry.clickedResultId = resultId;
  }
}

export function recordSearchConversion(queryOrId: string, orderId: string): void {
  const entry = SEARCH_ANALYTICS_STORE.find(
    (e) => e.id === queryOrId || e.query.toLowerCase() === queryOrId.toLowerCase()
  );
  if (entry) {
    entry.convertedOrderId = orderId;
  }
}

export interface ExtendedAnalyticsMetrics {
  totalQueries: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgLatencyMs: number;
  zeroResultCount: number;
  zeroResultPercentage: number;
  clickCount: number;
  ctrPercentage: number;
  conversionCount: number;
  conversionPercentage: number;
  shengDialectQueryShare: number;
  topQueries: Array<{
    query: string;
    count: number;
    intent: QueryIntent;
    ctr: number;
    conversions: number;
  }>;
  zeroResultDemands: Array<{
    query: string;
    count: number;
    dukaShopName: string;
    unmetCategoryHint: string;
    lastSeen: string;
  }>;
}

export function getExtendedSearchAnalytics(): ExtendedAnalyticsMetrics {
  const logs = [...SEARCH_ANALYTICS_STORE];
  const total = logs.length;
  if (total === 0) {
    return {
      totalQueries: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      avgLatencyMs: 0,
      zeroResultCount: 0,
      zeroResultPercentage: 0,
      clickCount: 0,
      ctrPercentage: 0,
      conversionCount: 0,
      conversionPercentage: 0,
      shengDialectQueryShare: 0,
      topQueries: [],
      zeroResultDemands: [],
    };
  }

  const latencies = logs.map((l) => l.latencyMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1];
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || latencies[latencies.length - 1];
  const avgLatency = Math.round((latencies.reduce((a, b) => a + b, 0) / total) * 10) / 10;

  const zeroHits = logs.filter((l) => l.zeroResult);
  const clicks = logs.filter((l) => l.clickedResultId);
  const conversions = logs.filter((l) => l.convertedOrderId);

  // Group by query
  const queryMap = new Map<string, { count: number; intent: QueryIntent; clicks: number; convs: number }>();
  for (const l of logs) {
    const q = l.query.trim().toLowerCase();
    if (!queryMap.has(q)) {
      queryMap.set(q, { count: 0, intent: l.intent, clicks: 0, convs: 0 });
    }
    const item = queryMap.get(q)!;
    item.count++;
    if (l.clickedResultId) item.clicks++;
    if (l.convertedOrderId) item.convs++;
  }

  const topQueries = Array.from(queryMap.entries())
    .map(([query, data]) => ({
      query,
      count: data.count,
      intent: data.intent,
      ctr: Math.round((data.clicks / Math.max(1, data.count)) * 100),
      conversions: data.convs,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Zero result unmet demand
  const zeroMap = new Map<string, { count: number; shop: string; hint: string; lastSeen: string }>();
  for (const z of zeroHits) {
    const q = z.query.trim().toLowerCase();
    if (!zeroMap.has(q)) {
      zeroMap.set(q, {
        count: 0,
        shop: z.dukaShopName,
        hint: z.intent === 'CATEGORY_EXPLORE' ? 'Missing FMCG Category' : 'Unstocked SKU',
        lastSeen: z.timestamp,
      });
    }
    zeroMap.get(q)!.count++;
  }

  const zeroResultDemands = Array.from(zeroMap.entries())
    .map(([query, data]) => ({
      query,
      count: data.count,
      dukaShopName: data.shop,
      unmetCategoryHint: data.hint,
      lastSeen: data.lastSeen,
    }))
    .sort((a, b) => b.count - a.count);

  const shengCount = logs.filter((l) => {
    const q = l.normalizedQuery.toLowerCase();
    return Object.keys(KENYAN_TERMINOLOGY_MAP).some((k) => q.includes(k));
  }).length;

  return {
    totalQueries: total,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    avgLatencyMs: avgLatency,
    zeroResultCount: zeroHits.length,
    zeroResultPercentage: Math.round((zeroHits.length / total) * 100),
    clickCount: clicks.length,
    ctrPercentage: Math.round((clicks.length / total) * 100),
    conversionCount: conversions.length,
    conversionPercentage: Math.round((conversions.length / total) * 100),
    shengDialectQueryShare: Math.round((shengCount / total) * 100),
    topQueries,
    zeroResultDemands,
  };
}

// ---------------------------------------------------------------------------
// 7. MULTI-FACTOR RANKING & EXECUTION ENGINE
// ---------------------------------------------------------------------------

let monotonicSearchSequence = 0;

export function isStaleSearchResponse(responseSeqId: number, latestAcceptedSeqId: number): boolean {
  return responseSeqId < latestAcceptedSeqId;
}

export interface WaynoSearchOptions {
  userLat?: number;
  userLng?: number;
  shopId?: string;
  rankingStrategy?: 'SMART_BALANCED' | 'PRICE_LOW' | 'DISTANCE_NEAR' | 'MARGIN_HIGH' | 'SPEED_FAST';
  filters?: SearchFilters;
}

export function executeWaynoSearch(
  rawQuery: string,
  optionsOrLat?: number | WaynoSearchOptions,
  userLngParam?: number
): SearchExecutionResultEnhanced {
  const startTime = performance.now();

  let userLat = -1.2585;
  let userLng = 36.8834;
  let shopId = 'shop_01';
  let rankingStrategy: 'SMART_BALANCED' | 'PRICE_LOW' | 'DISTANCE_NEAR' | 'MARGIN_HIGH' | 'SPEED_FAST' = 'SMART_BALANCED';
  let appliedFilters: SearchFilters | undefined = undefined;

  if (typeof optionsOrLat === 'number') {
    userLat = optionsOrLat;
    userLng = userLngParam ?? 36.8834;
  } else if (optionsOrLat && typeof optionsOrLat === 'object') {
    if (optionsOrLat.userLat !== undefined) userLat = optionsOrLat.userLat;
    if (optionsOrLat.userLng !== undefined) userLng = optionsOrLat.userLng;
    if (optionsOrLat.shopId) shopId = optionsOrLat.shopId;
    if (optionsOrLat.rankingStrategy) rankingStrategy = optionsOrLat.rankingStrategy;
    if (optionsOrLat.filters) appliedFilters = optionsOrLat.filters;
  }

  const currentShop = INITIAL_SHOPS.find((s) => s.id === shopId) || INITIAL_SHOPS[0];
  const currentShopProfile = getDukaProfileById(shopId);

  const normalized = rawQuery.trim().toLowerCase().replace(/[^\w\s]/gi, ' ');
  const rawTokens = normalized.split(/\s+/).filter(Boolean);

  // 1. Spell-checking step & Dynamic Damerau-Levenshtein Fuzzy Search
  const spellCorrections: SpellCorrection[] = [];
  const fuzzyMatches: Array<{ original: string; matched: string; distance: number; score: number }> = [];

  const correctedTokens = rawTokens.map((token) => {
    // Check static spell dictionary first
    const correction = checkSpelling(token);
    if (correction) {
      spellCorrections.push(correction);
      return correction.correctedTerm;
    }

    // Dynamic fuzzy vocabulary check if word length > 2
    if (token.length > 2 && !KENYAN_TERMINOLOGY_MAP[token]) {
      const fuzzy = fuzzyEngineInstance.findBestFuzzyMatch(token, 2);
      if (fuzzy && fuzzy.distance > 0) {
        fuzzyMatches.push({
          original: token,
          matched: fuzzy.bestCorrection,
          distance: fuzzy.distance,
          score: fuzzy.confidence,
        });
        if (fuzzy.confidence >= 0.70 && !spellCorrections.some((s) => s.originalTerm === token)) {
          spellCorrections.push({
            originalTerm: token,
            correctedTerm: fuzzy.bestCorrection,
            levenshteinDistance: fuzzy.distance,
            confidence: fuzzy.confidence,
          });
        }
        return fuzzy.bestCorrection;
      }
    }

    return token;
  });

  const effectiveNormalized = correctedTokens.join(' ');

  // 1.5. Inverted Index Lookup & Topological Tree Pre-Pruning (Filter First, Score Later)
  const indexLookupStart = performance.now();
  const indexSearchTokens = Array.from(new Set([...rawTokens, ...correctedTokens]));
  const indexSearchResult = invertedIndexInstance.searchCandidates(indexSearchTokens, effectiveNormalized);
  const indexLookupEnd = performance.now();

  // Find the retailer shop's primary local supply node
  const shopSupplyNode = geoEngine.findLocalNodeForShop({ lat: userLat, lng: userLng });
  const eligibleProductIds = supplyNodeBitmapIndex.getEligibleProductIdsForNode(shopSupplyNode.id);

  // Client-side snapshot cache verification
  const snapshotCache = localNodeSnapshotCache.getSnapshot(shopSupplyNode.id);
  const isSnapshotHit = Boolean(snapshotCache && snapshotCache.cachedProductIds.length > 0);
  if (!snapshotCache) {
    // Populate snapshot cache for future instant offline lookups
    localNodeSnapshotCache.compileSnapshotForNode(shopSupplyNode);
  }

  // Prune candidate SKUs: only retain products present in this supply node's bitset/Set
  let treePrunedCount = 0;
  const candidateProducts: Product[] = [];
  for (const p of PRODUCTS) {
    if (eligibleProductIds.has(p.id)) {
      candidateProducts.push(p);
    } else {
      treePrunedCount++;
    }
  }

  let aabbEvaluatedCount = 0;
  let haversineCalculatedCount = 0;

  const indexMetrics: InvertedIndexMetrics = {
    ...invertedIndexInstance.getIndexMetrics(),
    postingsEvaluated: indexSearchResult.postingsEvaluated,
    indexLookupTimeMs: Math.round((indexLookupEnd - indexLookupStart) * 100) / 100,
    treePrunedCount,
    candidatePoolSize: candidateProducts.length,
    activeSupplyNodeId: shopSupplyNode.id,
    aabbGeoEvaluated: 0,
    exactHaversineCalculated: 0,
    snapshotCacheHit: isSnapshotHit,
  };
  const indexCandidateMap = new Map<string, typeof indexSearchResult.candidates[0]>();
  indexSearchResult.candidates.forEach((c) => indexCandidateMap.set(c.docId, c));

  // 2. Kenyan / Swahili / Sheng dialect detection
  const detectedDialectTerms: KenyanTerminologyMatch[] = [];
  
  // Exact phrase match in dialect map
  if (KENYAN_TERMINOLOGY_MAP[normalized]) {
    detectedDialectTerms.push(KENYAN_TERMINOLOGY_MAP[normalized]);
  } else if (KENYAN_TERMINOLOGY_MAP[effectiveNormalized]) {
    detectedDialectTerms.push(KENYAN_TERMINOLOGY_MAP[effectiveNormalized]);
  }

  // Token level match
  for (const token of correctedTokens) {
    if (KENYAN_TERMINOLOGY_MAP[token]) {
      if (!detectedDialectTerms.some((d) => d.rawTerm === token)) {
        detectedDialectTerms.push(KENYAN_TERMINOLOGY_MAP[token]);
      }
    }
  }

  // 3. Pack-size & Bulk-unit extraction
  const extractedPackSize = parsePackSize(rawQuery) || parsePackSize(effectiveNormalized);
  const extractedBulkUnit = parseBulkUnit(rawQuery) || parseBulkUnit(effectiveNormalized);

  // 4. Query Intent Classification
  const { intent: detectedIntent, explanation: intentExplanation } = classifyQueryIntent(
    rawQuery,
    extractedPackSize,
    extractedBulkUnit
  );

  // 5. Semantic Term & Bidirectional Synonym Expansion
  const expandedTermsSet = new Set<string>();
  expandedTermsSet.add(normalized);
  expandedTermsSet.add(effectiveNormalized);
  rawTokens.forEach((t) => expandedTermsSet.add(t));
  correctedTokens.forEach((t) => expandedTermsSet.add(t));

  // Bidirectional Synonym Graph Expansion
  const synonymResult = synonymEngineInstance.expand(effectiveNormalized, indexSearchTokens);
  synonymResult.expandedTerms.forEach((t) => expandedTermsSet.add(t.toLowerCase()));
  const synonymsApplied = synonymResult.synonymMatches.map((m) => ({
    original: m.original,
    expansions: m.expansions,
  }));

  // Add brand alias expansions
  for (const [aliasKey, brandVal] of Object.entries(BRAND_ALIASES)) {
    if (effectiveNormalized.includes(aliasKey)) {
      expandedTermsSet.add(brandVal.toLowerCase());
    }
  }

  // Add product alias expansions
  for (const [prodKey, aliasesList] of Object.entries(PRODUCT_ALIASES)) {
    if (effectiveNormalized.includes(prodKey)) {
      aliasesList.forEach((a) => expandedTermsSet.add(a.toLowerCase()));
    }
  }

  // Add dialect canonical definitions
  for (const dialect of detectedDialectTerms) {
    expandedTermsSet.add(dialect.canonicalConcept.toLowerCase());
    if (dialect.categoryHint) {
      expandedTermsSet.add(dialect.categoryHint.toLowerCase());
    }
  }

  const expandedTerms = Array.from(expandedTermsSet);

  // 6. Match and Score Candidates (Iterating over pre-pruned node candidates)
  const matchedItems: EnhancedSearchResultItem[] = [];

  for (const product of candidateProducts) {
    let textScore = 0;
    const matchedAliases: string[] = [];

    const searchableBlob = [
      product.name.toLowerCase(),
      product.brand.toLowerCase(),
      product.manufacturer.toLowerCase(),
      product.description.toLowerCase(),
      product.packSize.toLowerCase(),
      product.unit.toLowerCase(),
      product.internalCategory.toLowerCase(),
      ...product.keywords.map((k) => k.toLowerCase()),
      ...product.synonyms.map((s) => s.toLowerCase()),
      ...product.aliases.map((a) => a.toLowerCase()),
    ].join(' ');

    // Inverted Index BM25 Match Contribution
    const indexMatch = indexCandidateMap.get(product.id);
    if (indexMatch) {
      textScore += Math.min(45, indexMatch.bm25Score * 1.5);
    }

    // Match exact phrase
    if (product.name.toLowerCase().includes(effectiveNormalized)) {
      textScore += 80;
    }
    if (product.brand.toLowerCase() === effectiveNormalized || effectiveNormalized.includes(product.brand.toLowerCase())) {
      textScore += 70;
    }

    // Match aliases
    for (const alias of product.aliases) {
      if (effectiveNormalized.includes(alias.toLowerCase()) || alias.toLowerCase().includes(effectiveNormalized)) {
        textScore += 55;
        matchedAliases.push(alias);
      }
    }

    // Match pack size
    let packSizeMatch = false;
    if (extractedPackSize) {
      if (product.packSize.toLowerCase().includes(extractedPackSize.raw.toLowerCase())) {
        textScore += 45;
        packSizeMatch = true;
      } else if (
        extractedPackSize.normalizedUnit === 'KG' &&
        product.packSize.toLowerCase().includes(`${extractedPackSize.numericValue}kg`)
      ) {
        textScore += 45;
        packSizeMatch = true;
      } else if (
        extractedPackSize.normalizedUnit === 'L' &&
        product.packSize.toLowerCase().includes(`${extractedPackSize.numericValue}l`)
      ) {
        textScore += 45;
        packSizeMatch = true;
      }
    }

    // Match bulk unit
    let bulkUnitMatch = false;
    if (extractedBulkUnit) {
      if (product.unit.toLowerCase().includes(extractedBulkUnit.raw.toLowerCase()) ||
          product.packSize.toLowerCase().includes(extractedBulkUnit.raw.toLowerCase())) {
        textScore += 35;
        bulkUnitMatch = true;
      }
    }

    // Match expanded terms
    for (const term of expandedTerms) {
      if (term.length > 2 && searchableBlob.includes(term)) {
        textScore += 18;
      }
    }

    // Need based intent boosts
    if (detectedIntent === 'NEED_BASED') {
      if (
        (effectiveNormalized.includes('wash') || effectiveNormalized.includes('clean') || effectiveNormalized.includes('uniform')) &&
        (product.internalCategory.includes('Laundry') || product.internalCategory.includes('Personal Care'))
      ) {
        textScore += 50;
      }
      if (
        (effectiveNormalized.includes('fry') || effectiveNormalized.includes('cooking') || effectiveNormalized.includes('oil')) &&
        product.internalCategory.includes('Oils & Fats')
      ) {
        textScore += 50;
      }
      if (
        (effectiveNormalized.includes('breakfast') || effectiveNormalized.includes('spread')) &&
        (product.internalCategory.includes('Spreads') || product.internalCategory.includes('Beverages'))
      ) {
        textScore += 45;
      }
    }

    // If candidate has sufficient text relevance
    if (textScore >= 25) {
      // 5.5 Supply Node Tree Classification & Subtree Geofence Check
      // Evaluates whether the retailer shop is authorized within the product's Supply Node Tree
      // (ROOT: National Grid, REGION: Regional Corridor, LOCAL_NODE: 20 km Local Territory)
      const nodeEligibility = geoEngine.evaluateShopNodeEligibility(
        { lat: userLat, lng: userLng },
        product
      );

      if (!nodeEligibility.isEligible) {
        // Retailer is outside this product's authorized tree branch/territory; prune from candidate list
        continue;
      }

      // Find suppliers stocking this SKU
      const suppliersForProd = SUPPLIER_PRODUCTS.filter(
        (sp) => sp.productId === product.id && sp.availability && sp.stockQty > 0
      );

      if (suppliersForProd.length > 0) {
        // Hierarchical Radius Bounding Box: Fast AABB check before expensive Haversine trigonometric calculation
        const maxThresholdKm = product.maxSearchRadiusKm || (nodeEligibility.productNodeLevel === 'LOCAL_NODE' ? 20 : 60);
        const aabbBox = calculateAABB(userLat, userLng, maxThresholdKm);

        let enrichedSuppliers = suppliersForProd.map((sp) => {
          const wholesaler = WHOLESALERS.find((w) => w.id === sp.wholesalerLocationId);
          if (!wholesaler) {
            return { ...sp, distanceKm: sp.distanceKm };
          }

          aabbEvaluatedCount++;
          // AABB pre-filtering: if wholesaler coordinate falls outside the bounding box, skip full Haversine
          const inBox = isPointInAABB(wholesaler.latitude, wholesaler.longitude, aabbBox);
          if (!inBox) {
            return {
              ...sp,
              distanceKm: 999, // Out of corridor bounds
            };
          }

          haversineCalculatedCount++;
          const distanceKm = calculateDistanceKm(userLat, userLng, wholesaler.latitude, wholesaler.longitude);
          return {
            ...sp,
            distanceKm,
          };
        });

        // If product is a LOCAL_NODE commodity or specifies a maximum search radius, enforce local corridor threshold
        const isLocalCommodity = nodeEligibility.productNodeLevel === 'LOCAL_NODE' || product.searchScope === 'LOCAL' || Boolean(product.maxSearchRadiusKm);
        if (isLocalCommodity) {
          const maxRadius = product.maxSearchRadiusKm || 20;
          enrichedSuppliers = enrichedSuppliers.filter((s) => s.distanceKm <= maxRadius);
          if (enrichedSuppliers.length === 0) {
            // No wholesaler within local corridor radius (e.g. Soko Supreme not stocked by local wholesaler)
            continue;
          }
        }

        // Sort suppliers based on active ranking strategy
        const sortedSuppliers = [...enrichedSuppliers].sort((a, b) => {
          if (rankingStrategy === 'PRICE_LOW') {
            return a.price - b.price;
          }
          if (rankingStrategy === 'DISTANCE_NEAR') {
            return a.distanceKm - b.distanceKm;
          }
          if (rankingStrategy === 'SPEED_FAST') {
            return a.distanceKm - b.distanceKm;
          }
          // Default balanced: Price + distance penalty
          const costScoreA = a.price * 0.7 + a.distanceKm * 40;
          const costScoreB = b.price * 0.7 + b.distanceKm * 40;
          return costScoreA - costScoreB;
        });

        const bestSupplier = sortedSuppliers[0];
        const wholesaler = WHOLESALERS.find((w) => w.id === bestSupplier.wholesalerLocationId);
        const reliability = wholesaler ? wholesaler.reliabilityScore : 95.0;

        // Calculate factors
        const geoProximityScore = Math.max(10, Math.round(100 - bestSupplier.distanceKm * 8));
        const priceCompetitiveness = Math.max(10, Math.round(100 - (bestSupplier.price / 50)));
        const grossMarginKes = product.recommendedRetailPrice - bestSupplier.price;
        const retailerMarginScore = Math.min(100, Math.max(10, Math.round((grossMarginKes / product.recommendedRetailPrice) * 100 * 3)));
        const stockAvailabilityScore = Math.min(100, Math.round(50 + bestSupplier.stockQty * 0.3));

        // Personalization boost based on shop history
        let personalizedBoost = 10;
        if (shopId === 'shop_01') {
          // Mama Sarah frequently restocks unga and oil
          if (product.internalCategory.includes('Grains') || product.internalCategory.includes('Oils')) {
            personalizedBoost = 35;
          }
        } else if (shopId === 'shop_02') {
          // Baraka Mini Mart buys high-volume snacks and soaps
          if (product.internalCategory.includes('Snacks') || product.internalCategory.includes('Cleaning')) {
            personalizedBoost = 35;
          }
        }

        // Composite Multi-Factor Score Calculation
        let totalWeightedScore = 0;

        if (rankingStrategy === 'PRICE_LOW') {
          totalWeightedScore = 
            textScore * 0.25 + 
            priceCompetitiveness * 0.50 + 
            retailerMarginScore * 0.15 + 
            geoProximityScore * 0.10;
        } else if (rankingStrategy === 'DISTANCE_NEAR' || rankingStrategy === 'SPEED_FAST') {
          totalWeightedScore = 
            textScore * 0.25 + 
            geoProximityScore * 0.50 + 
            reliability * 0.15 + 
            priceCompetitiveness * 0.10;
        } else if (rankingStrategy === 'MARGIN_HIGH') {
          totalWeightedScore = 
            textScore * 0.25 + 
            retailerMarginScore * 0.50 + 
            priceCompetitiveness * 0.15 + 
            geoProximityScore * 0.10;
        } else {
          // SMART_BALANCED
          totalWeightedScore = 
            textScore * 0.35 + 
            geoProximityScore * 0.25 + 
            priceCompetitiveness * 0.15 + 
            retailerMarginScore * 0.10 + 
            reliability * 0.10 + 
            personalizedBoost * 0.05;
        }

        // Apply bonus for exact pack size / bulk unit
        if (packSizeMatch) totalWeightedScore += 15;
        if (bulkUnitMatch) totalWeightedScore += 10;

        // Check for active promotional placement / sponsored campaign
        const activePlacement = activePromotionalPlacements.find(
          (p) => p.targetProductId === product.id && p.status === 'ACTIVE'
        );

        let promotionalBoost = 0;
        let isEligiblePlacement = false;
        let targetingEval: any = undefined;

        if (activePlacement) {
          targetingEval = evaluateCampaignForShop(activePlacement, currentShopProfile, { query: rawQuery });
          if (targetingEval.isEligible) {
            isEligiblePlacement = true;
            promotionalBoost = activePlacement.boostScore;
            totalWeightedScore += promotionalBoost;
            activePlacement.impressions += 1;
          }
        }

        const scoreBreakdown: FactorScoreBreakdown = {
          textRelevance: Math.min(100, Math.round(textScore)),
          geoProximity: geoProximityScore,
          priceCompetitiveness,
          retailerMargin: retailerMarginScore,
          supplierReliability: Math.round(reliability),
          personalizedBoost,
          stockAvailability: stockAvailabilityScore,
          promotionalBoost,
          totalWeightedScore: Math.round(totalWeightedScore),
        };

        const estimatedMins = Math.round(15 + bestSupplier.distanceKm * 4);

        matchedItems.push({
          product,
          bestSupplierProduct: bestSupplier,
          allSuppliers: sortedSuppliers,
          matchedAliases: Array.from(new Set(matchedAliases)),
          relevanceScore: Math.round(totalWeightedScore),
          deliveryEstimatedMins: estimatedMins,
          scoreBreakdown,
          matchedPackSize: packSizeMatch ? extractedPackSize : undefined,
          matchedBulkUnit: bulkUnitMatch ? extractedBulkUnit : undefined,
          detectedDialects: detectedDialectTerms,
          isSponsored: isEligiblePlacement,
          promotedBy: isEligiblePlacement ? activePlacement?.sponsorName : undefined,
          promoBadge: isEligiblePlacement ? (targetingEval?.exclusiveBadgeText || activePlacement?.badgeText) : undefined,
          promoDiscountKES: isEligiblePlacement ? (targetingEval?.appliedDiscount || activePlacement?.discountKES) : undefined,
          placementSlot: isEligiblePlacement ? activePlacement?.placementSlot : undefined,
          isTargetedPromotion: isEligiblePlacement && Boolean(activePlacement?.targeting),
          conquestMatch: Boolean(targetingEval?.conquestTriggered),
          conquestRivalBrand: targetingEval?.conquestRivalBrand,
          targetedBadgeText: targetingEval?.exclusiveBadgeText,
          appliedCampaignId: isEligiblePlacement ? activePlacement?.id : undefined,
          deliveryZone: evaluateGeoDeliveryZone(bestSupplier.distanceKm),
          searchScope: product.searchScope || 'NATIONAL',
          targetServiceZones: product.targetServiceZones,
          supplyNodeLevel: nodeEligibility.productNodeLevel,
          primarySupplyNodeId: product.primarySupplyNodeId || nodeEligibility.assignedNodes[0]?.id,
          assignedSupplyNode: nodeEligibility.assignedNodes[0],
          shopSupplyNode: nodeEligibility.shopNode,
          treeClassificationPath: nodeEligibility.assignedNodes[0] 
            ? geoEngine.getNodePath(nodeEligibility.assignedNodes[0].id) 
            : 'ROOT-KE-01',
        });
      }
    }
  }

  // Sort matched items descending by final relevance score
  matchedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 7. ZERO-RESULT RECOVERY PIPELINE
  let fallback: ZeroResultFallback | undefined = undefined;
  const isZeroResult = matchedItems.length === 0;

  if (isZeroResult) {
    // Generate intelligent zero-result alternatives:
    // A. Did you mean suggestion
    let didYouMean: string | undefined;
    if (spellCorrections.length > 0) {
      didYouMean = spellCorrections[0].correctedTerm;
    }

    // B. Category substitutes (find closest available FMCG in stock)
    const closestSubstitutes: EnhancedSearchResultItem[] = [];
    const topFallbackProducts = PRODUCTS.slice(0, 3);

    for (const prod of topFallbackProducts) {
      const suppliers = SUPPLIER_PRODUCTS.filter((sp) => sp.productId === prod.id && sp.availability);
      if (suppliers.length > 0) {
        closestSubstitutes.push({
          product: prod,
          bestSupplierProduct: suppliers[0],
          allSuppliers: suppliers,
          matchedAliases: [],
          relevanceScore: 60,
          deliveryEstimatedMins: 25,
          scoreBreakdown: {
            textRelevance: 40,
            geoProximity: 80,
            priceCompetitiveness: 75,
            retailerMargin: 70,
            supplierReliability: 96,
            personalizedBoost: 20,
            stockAvailability: 90,
            totalWeightedScore: 65,
          },
          detectedDialects: [],
          isSubstituted: true,
          substitutionReason: 'Alternative top-selling FMCG staple with verified Eastleigh depot stock',
        });
      }
    }

    fallback = {
      didYouMean,
      relaxedQuery: rawTokens.filter((t) => !['cheap', 'wholesale', 'best', 'super', 'near', 'me'].includes(t)).join(' '),
      closestSubstitutes,
      unmetDemandCategory: rawQuery,
      wholesalerStockRequestSent: false,
    };
  }

  // 7.5. TARGETED BRAND CONQUESTING EVALUATION
  let targetedConquest: TargetedConquestOffer | undefined = undefined;
  if (rawQuery.trim().length > 0) {
    const conquestCampaign = activePromotionalPlacements.find((p) => {
      if (p.status !== 'ACTIVE' || p.objective !== 'BRAND_CONQUESTING' || !p.targeting?.conquestRivalBrands) return false;
      const q = rawQuery.toLowerCase();
      return p.targeting.conquestRivalBrands.some((brand) => q.includes(brand.toLowerCase()));
    });

    if (conquestCampaign) {
      const evalRes = evaluateCampaignForShop(conquestCampaign, currentShopProfile, { query: rawQuery });
      if (evalRes.isEligible) {
        const altProd = PRODUCTS.find((p) => p.id === conquestCampaign.targetProductId);
        if (altProd) {
          const matchedAlt = matchedItems.find((m) => m.product.id === altProd.id);
          const suppliers = SUPPLIER_PRODUCTS.filter((sp) => sp.productId === altProd.id);
          const altItem: EnhancedSearchResultItem = matchedAlt || {
            product: altProd,
            bestSupplierProduct: suppliers[0] || SUPPLIER_PRODUCTS[0],
            allSuppliers: suppliers.length > 0 ? suppliers : [SUPPLIER_PRODUCTS[0]],
            matchedAliases: [],
            detectedDialects: [],
            relevanceScore: 98,
            deliveryEstimatedMins: 20,
            scoreBreakdown: {
              textRelevance: 88,
              geoProximity: 92,
              priceCompetitiveness: 94,
              retailerMargin: 95,
              supplierReliability: 96,
              personalizedBoost: 25,
              stockAvailability: 92,
              promotionalBoost: conquestCampaign.boostScore,
              totalWeightedScore: 98,
            },
            isSponsored: true,
            promotedBy: conquestCampaign.sponsorName,
            promoBadge: evalRes.exclusiveBadgeText || conquestCampaign.badgeText,
            promoDiscountKES: evalRes.appliedDiscount,
            placementSlot: conquestCampaign.placementSlot,
            isTargetedPromotion: true,
            conquestMatch: true,
            conquestRivalBrand: evalRes.conquestRivalBrand,
            targetedBadgeText: evalRes.exclusiveBadgeText,
            appliedCampaignId: conquestCampaign.id,
          };

          targetedConquest = {
            campaignId: conquestCampaign.id,
            campaignName: conquestCampaign.campaignName,
            sponsorName: conquestCampaign.sponsorName,
            triggerBrand: evalRes.conquestRivalBrand || 'Competitor Brand',
            alternativeProduct: altItem,
            discountKES: evalRes.appliedDiscount,
            headline: conquestCampaign.headline,
            subtext: conquestCampaign.subtext,
            badgeText: evalRes.exclusiveBadgeText || conquestCampaign.badgeText,
            callToActionText: evalRes.callToActionText || 'Claim Trader Rebate',
          };
        }
      }
    }
  }

  // 6.5. COMPUTE FACETS ACROSS CANDIDATES
  const catCountMap = new Map<string, number>();
  const brandCountMap = new Map<string, number>();
  const packCountMap = new Map<string, number>();
  const wholesalerCountMap = new Map<string, number>();
  let minCandidatePrice = Infinity;
  let maxCandidatePrice = 0;
  let inStockCount = 0;
  let promotionsCount = 0;

  for (const item of matchedItems) {
    const cat = item.product.internalCategory;
    catCountMap.set(cat, (catCountMap.get(cat) || 0) + 1);

    const brand = item.product.brand;
    brandCountMap.set(brand, (brandCountMap.get(brand) || 0) + 1);

    const pack = item.product.packSize;
    packCountMap.set(pack, (packCountMap.get(pack) || 0) + 1);

    if (item.bestSupplierProduct) {
      const whName = item.bestSupplierProduct.wholesalerName;
      wholesalerCountMap.set(whName, (wholesalerCountMap.get(whName) || 0) + 1);

      const price = item.bestSupplierProduct.price;
      if (price < minCandidatePrice) minCandidatePrice = price;
      if (price > maxCandidatePrice) maxCandidatePrice = price;

      if (item.bestSupplierProduct.stockQty > 0) inStockCount++;
    }

    if (item.isSponsored) promotionsCount++;
  }

  const facets: SearchFacets = {
    categories: Array.from(catCountMap.entries()).map(([value, count]) => ({ value, count })),
    brands: Array.from(brandCountMap.entries()).map(([value, count]) => ({ value, count })),
    packSizes: Array.from(packCountMap.entries()).map(([value, count]) => ({ value, count })),
    wholesalers: Array.from(wholesalerCountMap.entries()).map(([value, count]) => ({ value, count })),
    priceRange: {
      min: minCandidatePrice === Infinity ? 0 : minCandidatePrice,
      max: maxCandidatePrice === 0 ? 3000 : maxCandidatePrice,
    },
    inStockCount,
    promotionsCount,
  };

  // 6.6. APPLY SEARCH FILTERS
  let finalResults = matchedItems;
  if (appliedFilters) {
    finalResults = matchedItems.filter((item) => {
      if (appliedFilters!.category && item.product.internalCategory !== appliedFilters!.category) {
        return false;
      }
      if (appliedFilters!.brands && appliedFilters!.brands.length > 0) {
        if (!appliedFilters!.brands.includes(item.product.brand)) return false;
      }
      if (appliedFilters!.minPrice !== undefined && item.bestSupplierProduct.price < appliedFilters!.minPrice) {
        return false;
      }
      if (appliedFilters!.maxPrice !== undefined && item.bestSupplierProduct.price > appliedFilters!.maxPrice) {
        return false;
      }
      if (appliedFilters!.inStockOnly && item.bestSupplierProduct.stockQty <= 0) {
        return false;
      }
      if (appliedFilters!.packSizes && appliedFilters!.packSizes.length > 0) {
        if (!appliedFilters!.packSizes.some((p) => item.product.packSize.toLowerCase().includes(p.toLowerCase()))) {
          return false;
        }
      }
      if (appliedFilters!.maxDistanceKm !== undefined && item.bestSupplierProduct.distanceKm > appliedFilters!.maxDistanceKm) {
        return false;
      }
      if (appliedFilters!.promotionsOnly && !item.isSponsored) {
        return false;
      }
      if (appliedFilters!.wholesalerLocationId && item.bestSupplierProduct.wholesalerLocationId !== appliedFilters!.wholesalerLocationId) {
        return false;
      }
      if (appliedFilters!.searchScope && appliedFilters!.searchScope !== 'ALL') {
        const itemScope = item.searchScope || item.product.searchScope || 'NATIONAL';
        if (itemScope !== appliedFilters!.searchScope) {
          return false;
        }
      }
      if (appliedFilters!.supplyNodeLevel && appliedFilters!.supplyNodeLevel !== 'ALL') {
        const itemLevel = item.supplyNodeLevel || item.product.supplyNodeLevel || 'ROOT';
        if (itemLevel !== appliedFilters!.supplyNodeLevel) {
          return false;
        }
      }
      if (appliedFilters!.supplyNodeId) {
        const itemNodeId = item.primarySupplyNodeId || item.product.primarySupplyNodeId;
        if (itemNodeId !== appliedFilters!.supplyNodeId) {
          return false;
        }
      }
      return true;
    });
  }

  const isFinalZeroResult = finalResults.length === 0;

  const endTime = performance.now();
  const simulatedTime = Math.max(14, Math.round(endTime - startTime + Math.random() * 8));

  const result: SearchExecutionResultEnhanced = {
    query: rawQuery,
    normalizedQuery: effectiveNormalized,
    spellCorrections,
    detectedDialectTerms,
    extractedPackSize,
    extractedBulkUnit,
    detectedIntent,
    intentExplanation,
    expandedTerms,
    results: finalResults,
    executionTimeMs: simulatedTime,
    totalHits: finalResults.length,
    zeroResult: isFinalZeroResult,
    fallback: isFinalZeroResult ? fallback : undefined,
    activeShopId: shopId,
    rankingStrategy,
    targetedConquest,
    facets,
    appliedFilters,
    indexMetrics: {
      ...indexMetrics,
      aabbGeoEvaluated: aabbEvaluatedCount,
      exactHaversineCalculated: haversineCalculatedCount,
    },
    synonymsApplied,
    fuzzyMatches,
    sequenceId: ++monotonicSearchSequence,
  };

  // Log to search analytics
  logSearchAnalytics({
    timestamp: 'Just now',
    query: rawQuery,
    normalizedQuery: effectiveNormalized,
    latencyMs: simulatedTime,
    hitsCount: finalResults.length,
    intent: detectedIntent,
    zeroResult: isFinalZeroResult,
    selectedRanking: rankingStrategy,
    dukaShopId: currentShop.id,
    dukaShopName: currentShop.name,
    correctedFrom: spellCorrections.length > 0 ? spellCorrections[0].correctedTerm : undefined,
    appliedFiltersSummary: appliedFilters ? JSON.stringify(appliedFilters) : undefined,
  });

  return result;
}

// ---------------------------------------------------------------------------
// 8. AUTOCOMPLETE & TYPEAHEAD SUGGESTION ENGINE
// ---------------------------------------------------------------------------

export function getAutocompleteSuggestions(prefix: string): AutocompleteSuggestion[] {
  const clean = prefix.trim().toLowerCase();
  if (!clean || clean.length < 1) {
    // Return trending duka searches
    return [
      {
        id: 'trend_1',
        type: 'SHENG_VERNACULAR',
        title: 'Unga wa Ugali (Jogoo 2kg Bale)',
        subtitle: 'Swahili staple • High duka turnover',
        query: 'unga wa ugali 2kg bale',
        badge: 'Trending',
        iconName: 'Flame'
      },
      {
        id: 'trend_2',
        type: 'PRODUCT',
        title: 'Fresh Fri Pure Cooking Oil 3L',
        subtitle: 'Pwani Oil • Eastleigh stock 60 cans',
        query: 'fresh fri cooking oil 3l',
        badge: 'Top Mover',
        iconName: 'Package'
      },
      {
        id: 'trend_3',
        type: 'NEED_INTENT',
        title: 'Things to wash clothes (Laundry detergents)',
        subtitle: 'Natural language query • Omo & Sunlight',
        query: 'things to wash clothes',
        badge: 'Intent',
        iconName: 'Sparkles'
      },
      {
        id: 'trend_4',
        type: 'SHENG_VERNACULAR',
        title: 'Njugu Karanga Fresh Roasted Peanuts',
        subtitle: 'Sheng term • Carton of 24 packets',
        query: 'njugu',
        badge: 'Sheng',
        iconName: 'Zap'
      }
    ];
  }

  // 0. Instant Radix Trie Keystroke Prefix Match (< 1ms)
  const trieMatches = prefixTrieInstance.searchPrefix(clean, 7);
  if (trieMatches.length >= 4) {
    return trieMatches.map((t) => ({
      id: t.id,
      type: t.type as any,
      title: t.title,
      subtitle: t.subtitle,
      query: t.query,
      badge: t.badge,
      iconName: t.iconName,
    }));
  }

  const suggestions: AutocompleteSuggestion[] = [];

  // Seed with available trie matches
  for (const t of trieMatches) {
    suggestions.push({
      id: t.id,
      type: t.type as any,
      title: t.title,
      subtitle: t.subtitle,
      query: t.query,
      badge: t.badge,
      iconName: t.iconName,
    });
  }

  // 1. Check Kenyan / Sheng terminology
  for (const [termKey, dialect] of Object.entries(KENYAN_TERMINOLOGY_MAP)) {
    if (termKey.includes(clean) || clean.includes(termKey)) {
      suggestions.push({
        id: `sheng_${termKey}`,
        type: 'SHENG_VERNACULAR',
        title: `${dialect.rawTerm} (${dialect.canonicalConcept})`,
        subtitle: `${dialect.dialect} • ${dialect.englishTranslation}`,
        query: dialect.rawTerm,
        badge: dialect.dialect,
        iconName: 'Globe'
      });
    }
  }

  // 2. Check Brands
  for (const [brandKey, brandName] of Object.entries(BRAND_ALIASES)) {
    if (brandKey.includes(clean) || brandName.toLowerCase().includes(clean)) {
      if (!suggestions.some((s) => s.title.includes(brandName))) {
        suggestions.push({
          id: `brand_${brandKey}`,
          type: 'BRAND',
          title: brandName,
          subtitle: `FMCG Brand Catalog • Verified Kenyan distributor`,
          query: brandName.toLowerCase(),
          badge: 'Brand',
          iconName: 'Building'
        });
      }
    }
  }

  // 2.5. Check Categories
  const categories = Array.from(new Set(PRODUCTS.map((p) => p.internalCategory)));
  for (const cat of categories) {
    if (cat.toLowerCase().includes(clean)) {
      const count = PRODUCTS.filter((p) => p.internalCategory === cat).length;
      suggestions.push({
        id: `cat_${cat.replace(/\s+/g, '_')}`,
        type: 'CATEGORY',
        title: cat,
        subtitle: `FMCG Category • ${count} verified items in stock`,
        query: cat,
        badge: 'Category',
        iconName: 'Tag',
        count,
      });
    }
  }

  // 2.6. Check Synonym Clusters
  for (const cluster of FMCG_SYNONYM_CLUSTERS) {
    if (cluster.terms.some((t) => t.includes(clean))) {
      const matchingTerm = cluster.terms.find((t) => t.includes(clean)) || cluster.terms[0];
      if (!suggestions.some((s) => s.query.toLowerCase() === matchingTerm.toLowerCase())) {
        suggestions.push({
          id: `syn_${cluster.id}`,
          type: 'NEED_INTENT',
          title: `${matchingTerm} (${cluster.name})`,
          subtitle: `Synonym cluster • Resolves ${cluster.terms.slice(0, 3).join(', ')}`,
          query: matchingTerm,
          badge: 'Synonym',
          iconName: 'Sparkles',
        });
      }
    }
  }

  // 3. Check Products directly
  for (const product of PRODUCTS) {
    if (
      product.name.toLowerCase().includes(clean) ||
      product.keywords.some((k) => k.toLowerCase().includes(clean))
    ) {
      suggestions.push({
        id: `prod_${product.id}`,
        type: 'PRODUCT',
        title: product.name,
        subtitle: `${product.packSize} • RRP KES ${product.recommendedRetailPrice}`,
        query: product.name,
        badge: product.internalCategory.split(' ')[0],
        iconName: 'ShoppingBag'
      });
    }
  }

  // 4. Pack sizes
  if (/\d+/.test(clean)) {
    ['2kg', '1kg', '3L', '5L', '500g'].forEach((pack) => {
      if (pack.toLowerCase().includes(clean)) {
        suggestions.push({
          id: `pack_${pack}`,
          type: 'PACK_SIZE',
          title: `Filter pack size: ${pack}`,
          subtitle: `Show FMCG items in ${pack} units`,
          query: `${clean} ${pack}`,
          badge: 'Pack Size',
          iconName: 'Scale'
        });
      }
    });
  }

  return suggestions.slice(0, 7);
}
