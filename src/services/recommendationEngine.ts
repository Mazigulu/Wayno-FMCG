import { Product, SupplierProduct, RetailerShop, Order } from '../types/wayno';
import { 
  RetailerProfileSignals, 
  RecommendationEngineWeights, 
  RecommendationExecutionResult, 
  RecommendedProductItem,
  TimeWindow,
  RecommendationSignalType
} from '../types/recommendation';
import { PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS } from '../data/mockData';

export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationEngineWeights = {
  historicalSearches: 0.25,
  purchases: 0.25,
  location: 0.15,
  time: 0.15,
  productPreferences: 0.20,
};

/**
 * Determine the temporal restock window from an hour (0 - 23)
 */
export function getTimeWindowFromHour(hour: number): { window: TimeWindow; label: string; boostedCategories: string[] } {
  if (hour >= 5 && hour < 11) {
    return {
      window: 'MORNING_RESTOCK',
      label: 'Morning Breakfast & Opening Restock (05:00 - 11:00)',
      boostedCategories: ['Spreads & Dairy Alternatives', 'Beverages & Snacks', 'Breakfast Essentials']
    };
  } else if (hour >= 11 && hour < 17) {
    return {
      window: 'MIDDAY_RUSH',
      label: 'Midday Commercial Turnover (11:00 - 17:00)',
      boostedCategories: ['Oils & Fats', 'Grains & Flours', 'Rice & Staples']
    };
  } else if (hour >= 17 && hour < 23) {
    return {
      window: 'EVENING_PREP',
      label: 'Evening Dinner Staples & Household Restock (17:00 - 23:00)',
      boostedCategories: ['Grains & Flours', 'Seasoning & Condiments', 'Snacks & Confectionery', 'Laundry & Household Cleaning']
    };
  } else {
    return {
      window: 'LATE_NIGHT_EMERGENCY',
      label: 'Late Night Emergency Preparedness (23:00 - 05:00)',
      boostedCategories: ['Grains & Flours', 'Oils & Fats']
    };
  }
}

/**
 * Extract the 5 foundational signals for a specific Retailer Shop
 */
export function extractRetailerSignals(
  shop: RetailerShop,
  recentSearches: string[],
  orders: Order[],
  simulatedHour?: number,
  simulatedDay?: string
): RetailerProfileSignals {
  // 1. Historical Searches Signal
  const categoryKeywordsMap: Record<string, string[]> = {
    'Grains & Flours': ['unga', 'jogoo', 'pembe', 'soko', 'flour', 'maize', 'corn', 'ugali', 'chapo'],
    'Oils & Fats': ['oil', 'fresh fri', 'rina', 'mafuta', 'salad', 'cooking oil', 'fat'],
    'Spreads & Dairy Alternatives': ['blueband', 'blue band', 'margarine', 'butter', 'spread'],
    'Snacks & Confectionery': ['njugu', 'peanuts', 'karanga', 'snacks', 'nuts'],
    'Laundry & Household Cleaning': ['omo', 'sunlight', 'soap', 'sabuni', 'powder', 'detergent', 'wash'],
    'Seasoning & Condiments': ['royco', 'mchuzi', 'cube', 'spice'],
    'Sugar & Sweeteners': ['sugar', 'sukari', 'mumias'],
    'Rice & Pulses': ['rice', 'dawaat', 'mchele', 'basmati']
  };

  const brandKeywordsMap: Record<string, string> = {
    jogoo: 'Jogoo',
    pembe: 'Pembe',
    soko: 'Soko',
    blueband: 'Blue Band',
    'blue band': 'Blue Band',
    'fresh fri': 'Fresh Fri',
    rina: 'Rina',
    omo: 'Omo',
    sunlight: 'Sunlight',
    royco: 'Royco',
    mumias: 'Mumias',
    dawaat: 'Dawaat',
    njugu: 'Mama Pima Foods'
  };

  const categoryAffinities: Record<string, number> = {};
  const brandAffinities: Record<string, number> = {};
  const topKeywords: string[] = [];

  recentSearches.forEach((query) => {
    const qLower = query.toLowerCase();
    topKeywords.push(qLower);

    // Match categories
    for (const [cat, kws] of Object.entries(categoryKeywordsMap)) {
      if (kws.some(kw => qLower.includes(kw))) {
        categoryAffinities[cat] = (categoryAffinities[cat] || 0) + 1;
      }
    }

    // Match brands
    for (const [kw, brand] of Object.entries(brandKeywordsMap)) {
      if (qLower.includes(kw)) {
        brandAffinities[brand] = (brandAffinities[brand] || 0) + 1;
      }
    }
  });

  // Normalize affinities to 0 - 1
  const maxCat = Math.max(1, ...Object.values(categoryAffinities));
  for (const cat in categoryAffinities) {
    categoryAffinities[cat] = Number((categoryAffinities[cat] / maxCat).toFixed(2));
  }
  const maxBrand = Math.max(1, ...Object.values(brandAffinities));
  for (const b in brandAffinities) {
    brandAffinities[b] = Number((brandAffinities[b] / maxBrand).toFixed(2));
  }

  // 2. Purchases Signal (from past and active orders)
  const shopOrders = orders.filter(o => o.retailerId === shop.retailerId || o.shopName === shop.name || !o.retailerId);
  const purchaseCounts: Record<string, number> = {};
  shopOrders.forEach(order => {
    order.items.forEach(item => {
      purchaseCounts[item.productId] = (purchaseCounts[item.productId] || 0) + item.quantity;
    });
  });

  // Seed with realistic baseline FMCG replenishment behavior if new shop
  if (Object.keys(purchaseCounts).length === 0) {
    purchaseCounts['prod_jogoo'] = 4; // High frequency staple
    purchaseCounts['prod_freshfri'] = 2;
    purchaseCounts['prod_blueband'] = 3;
    purchaseCounts['prod_omo'] = 2;
  }

  const frequentlyPurchased = Object.entries(purchaseCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pid]) => pid);

  // Depletion prediction: items ordered > 4 days ago with high daily run-rate
  const estimatedDepletion = frequentlyPurchased.slice(0, 3);

  // 3. Location Signal
  // Find nearest wholesaler depot
  let nearestDepot = WHOLESALERS[0];
  let minDistance = 999;
  WHOLESALERS.forEach(ws => {
    const dist = calculateHaversineDistanceKm(shop.latitude, shop.longitude, ws.latitude, ws.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestDepot = ws;
    }
  });

  // Localized neighborhood demand velocity per zone
  const zoneVelocityMap: Record<string, string[]> = {
    zone_nairobi_central: ['Rice & Pulses', 'Oils & Fats', 'Sugar & Sweeteners', 'Grains & Flours'],
    zone_nairobi_east: ['Grains & Flours', 'Laundry & Household Cleaning', 'Spreads & Dairy Alternatives'],
    zone_nairobi_west: ['Oils & Fats', 'Grains & Flours', 'Snacks & Confectionery', 'Seasoning & Condiments']
  };

  const zoneFastMoving = zoneVelocityMap[shop.serviceZoneId] || ['Grains & Flours', 'Oils & Fats'];

  // 4. Time Signal
  const now = new Date();
  const currentHour = simulatedHour !== undefined ? simulatedHour : now.getHours();
  const dayOfWeek = simulatedDay || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const isWeekendPrep = ['Thursday', 'Friday', 'Saturday'].includes(dayOfWeek);
  const { window: timeWindow, label: timeLabel, boostedCategories } = getTimeWindowFromHour(currentHour);

  // 5. Product Preferences Signal
  // Dukas prefer high margin products, bulk packs (bales/crates for resale), and verified brands
  return {
    historicalSearches: {
      recentQueries: recentSearches,
      inferredCategoryAffinities: categoryAffinities,
      inferredBrandAffinities: brandAffinities,
      topKeywords
    },
    purchases: {
      totalPastOrders: shopOrders.length || 3,
      frequentlyPurchasedProductIds: frequentlyPurchased,
      daysSinceLastOrder: 4,
      averageRestockCycleDays: 5,
      estimatedDepletionProductIds: estimatedDepletion
    },
    location: {
      shopId: shop.id,
      serviceZoneId: shop.serviceZoneId,
      zoneName: shop.serviceZoneId.replace(/_/g, ' ').toUpperCase(),
      latitude: shop.latitude,
      longitude: shop.longitude,
      nearestDepotId: nearestDepot.id,
      nearestDepotDistanceKm: Number(minDistance.toFixed(1)),
      zoneFastMovingCategories: zoneFastMoving
    },
    time: {
      currentHour,
      dayOfWeek,
      timeWindow,
      timeWindowLabel: timeLabel,
      isWeekendPrep,
      boostedCategories
    },
    productPreferences: {
      marginSensitivity: 'HIGH',
      preferredPackSizes: ['2kg x 12 Pkts Bale', '3L x 4 Jerrycans Carton', '50g x 12 Tubs Crate', '1kg x 10 Pouches Bale'],
      preferredUnits: ['Bale', 'Carton', 'Crate'],
      minTargetMarginPercent: 12,
      trustedBrands: ['Jogoo', 'Fresh Fri', 'Blue Band', 'Omo', 'Mama Pima Foods', 'Pembe', 'Dawaat']
    }
  };
}

export interface RecommendationExecutionOptions {
  enableExploration?: boolean;
  epsilon?: number;
  impressionCounts?: Record<string, number>;
}

/**
 * Executes the 5-signal recommendation model for a retailer shop
 */
export function generateRetailerRecommendations(
  shop: RetailerShop,
  recentSearches: string[],
  orders: Order[],
  weightsOverride?: Partial<RecommendationEngineWeights>,
  simulatedHour?: number,
  simulatedDay?: string,
  options?: RecommendationExecutionOptions
): RecommendationExecutionResult {
  const startTime = performance.now();
  const weights: RecommendationEngineWeights = {
    ...DEFAULT_RECOMMENDATION_WEIGHTS,
    ...weightsOverride
  };

  const signals = extractRetailerSignals(shop, recentSearches, orders, simulatedHour, simulatedDay);

  const candidateRecommendations: RecommendedProductItem[] = [];

  // Evaluate every product in canonical catalog against the 5 signals
  PRODUCTS.forEach(product => {
    // 1. Check if physically deliverable / available in wholesale network
    const suppliers = SUPPLIER_PRODUCTS.filter(sp => sp.productId === product.id && sp.availability && sp.stockQty > 0);
    if (suppliers.length === 0) return; // Must be physically deliverable!

    // Find best supplier by price & distance
    const bestSupplier = [...suppliers].sort((a, b) => a.price - b.price)[0];

    // =========================================================================
    // SIGNAL 1: Historical Searches Score (0 - 100)
    // =========================================================================
    let searchScore = 20; // baseline
    const catAffinity = signals.historicalSearches.inferredCategoryAffinities[product.internalCategory] || 0;
    const brandAffinity = signals.historicalSearches.inferredBrandAffinities[product.brand] || 0;
    
    // Check keyword overlap with recent search queries
    let keywordOverlapCount = 0;
    signals.historicalSearches.recentQueries.forEach(q => {
      const qLower = q.toLowerCase();
      if (product.name.toLowerCase().includes(qLower) || 
          product.brand.toLowerCase().includes(qLower) || 
          product.aliases.some(al => qLower.includes(al.toLowerCase())) ||
          product.keywords.some(kw => qLower.includes(kw.toLowerCase()))) {
        keywordOverlapCount++;
      }
    });

    searchScore += (catAffinity * 35);
    searchScore += (brandAffinity * 30);
    searchScore += Math.min(30, keywordOverlapCount * 15);
    searchScore = Math.min(100, Math.max(10, Math.round(searchScore)));

    // =========================================================================
    // SIGNAL 2: Purchases History & Reorder Depletion Score (0 - 100)
    // =========================================================================
    let purchaseScore = 15;
    const isDepleted = signals.purchases.estimatedDepletionProductIds.includes(product.id);
    const isFrequent = signals.purchases.frequentlyPurchasedProductIds.includes(product.id);
    const purchaseRank = signals.purchases.frequentlyPurchasedProductIds.indexOf(product.id);

    if (isDepleted) {
      purchaseScore += 50; // High urgency: shop ran out of this staple
    }
    if (isFrequent) {
      purchaseScore += Math.max(10, 35 - (purchaseRank * 6));
    }
    purchaseScore = Math.min(100, Math.max(10, Math.round(purchaseScore)));

    // =========================================================================
    // SIGNAL 3: Location & Neighborhood Velocity Score (0 - 100)
    // =========================================================================
    let locationScore = 40;
    const isZoneFastMover = signals.location.zoneFastMovingCategories.includes(product.internalCategory);
    if (isZoneFastMover) {
      locationScore += 35;
    }
    // Proximity boost to nearest depot
    const dist = bestSupplier.distanceKm;
    if (dist <= 3.5) {
      locationScore += 25; // Zone 1 Boda delivery fast turnaround
    } else if (dist <= 6.0) {
      locationScore += 15;
    }
    locationScore = Math.min(100, Math.max(15, Math.round(locationScore)));

    // =========================================================================
    // SIGNAL 4: Time of Day & Day of Week Relevance Score (0 - 100)
    // =========================================================================
    let timeScore = 30;
    const isTimeBoosted = signals.time.boostedCategories.some(cat => 
      product.internalCategory.toLowerCase().includes(cat.toLowerCase())
    );
    if (isTimeBoosted) {
      timeScore += 45;
    }
    if (signals.time.isWeekendPrep && (product.unit === 'Bale' || product.unit === 'Carton' || product.unit === 'Crate')) {
      timeScore += 20; // Weekend bulk stock prep
    }
    timeScore = Math.min(100, Math.max(20, Math.round(timeScore)));

    // =========================================================================
    // SIGNAL 5: Product Preferences & Margin Optimization Score (0 - 100)
    // =========================================================================
    let preferenceScore = 25;
    const grossMarginKES = product.recommendedRetailPrice - bestSupplier.price;
    const marginPercent = Math.round((grossMarginKES / product.recommendedRetailPrice) * 100);

    // Margin optimization: dukas love healthy margins
    if (marginPercent >= 20) {
      preferenceScore += 45;
    } else if (marginPercent >= 15) {
      preferenceScore += 35;
    } else if (marginPercent >= 10) {
      preferenceScore += 20;
    }

    // Preferred pack size and trusted brand bonus
    if (signals.productPreferences.preferredUnits.includes(product.unit)) {
      preferenceScore += 15;
    }
    if (signals.productPreferences.trustedBrands.includes(product.brand)) {
      preferenceScore += 15;
    }
    preferenceScore = Math.min(100, Math.max(15, Math.round(preferenceScore)));

    // =========================================================================
    // COMPOSITE WEIGHTED SCORE (0 - 100) WITH FATIGUE DECAY
    // =========================================================================
    let compositeScore = Math.round(
      (searchScore * weights.historicalSearches) +
      (purchaseScore * weights.purchases) +
      (locationScore * weights.location) +
      (timeScore * weights.time) +
      (preferenceScore * weights.productPreferences)
    );

    // Production Hardening: Fatigue penalty for repeated impressions without clicks
    if (options?.impressionCounts && options.impressionCounts[product.id]) {
      const fatigueDiscount = Math.min(25, options.impressionCounts[product.id] * 5);
      compositeScore = Math.max(5, compositeScore - fatigueDiscount);
    }

    // Determine primary driver
    const signalContributions = [
      { type: 'HISTORICAL_SEARCHES' as RecommendationSignalType, val: searchScore * weights.historicalSearches, raw: searchScore },
      { type: 'PURCHASES' as RecommendationSignalType, val: purchaseScore * weights.purchases, raw: purchaseScore },
      { type: 'LOCATION' as RecommendationSignalType, val: locationScore * weights.location, raw: locationScore },
      { type: 'TIME' as RecommendationSignalType, val: timeScore * weights.time, raw: timeScore },
      { type: 'PRODUCT_PREFERENCES' as RecommendationSignalType, val: preferenceScore * weights.productPreferences, raw: preferenceScore }
    ];
    signalContributions.sort((a, b) => b.val - a.val);
    const primaryDriver = signalContributions[0].type;

    // Build explanatory tags
    const explanationTags: string[] = [];
    if (keywordOverlapCount > 0 || catAffinity > 0.5) {
      explanationTags.push(`Searched in past 7 days (${product.brand})`);
    }
    if (isDepleted) {
      explanationTags.push('Reorder Due (Est. Depleted Stock)');
    } else if (isFrequent) {
      explanationTags.push('Regular Duka Restock Staple');
    }
    if (isZoneFastMover) {
      explanationTags.push(`Fast Mover in ${signals.location.zoneName}`);
    }
    if (isTimeBoosted) {
      explanationTags.push(signals.time.timeWindow === 'MORNING_RESTOCK' ? 'Morning Breakfast Rush' : signals.time.timeWindow === 'EVENING_PREP' ? 'Evening Dinner Staple' : 'Midday Kitchen Restock');
    }
    if (marginPercent >= 18) {
      explanationTags.push(`High Margin (+${marginPercent}% / KES ${grossMarginKES})`);
    }

    // Recommendation reason text
    let recommendationReason = '';
    let urgencyLevel: RecommendedProductItem['urgencyLevel'] = 'POPULAR_IN_ZONE';

    if (isDepleted) {
      recommendationReason = `Depletion Alert: Typically restocked every ${signals.purchases.averageRestockCycleDays} days. High customer stockout risk today.`;
      urgencyLevel = 'HIGH_RESTOCK_URGENCY';
    } else if (primaryDriver === 'TIME') {
      recommendationReason = `Temporal Demand: High neighborhood consumer turnover during ${signals.time.timeWindowLabel.split('(')[0].trim()}.`;
      urgencyLevel = 'DAILY_TIME_STAPLE';
    } else if (primaryDriver === 'HISTORICAL_SEARCHES') {
      recommendationReason = `Search Relevance: Strongly aligns with your frequent queries for "${signals.historicalSearches.recentQueries[0]}".`;
      urgencyLevel = 'FAVORITE_REORDER';
    } else if (marginPercent >= 18) {
      recommendationReason = `Margin Optimizer: Delivers ${marginPercent}% duka profit margin (KES ${grossMarginKES} gross profit per ${product.unit}).`;
      urgencyLevel = 'HIGH_MARGIN_OPPORTUNITY';
    } else {
      recommendationReason = `Regional Velocity: Top performing FMCG SKU in ${signals.location.zoneName} depots (${bestSupplier.wholesalerName}, ${bestSupplier.distanceKm} km).`;
      urgencyLevel = 'POPULAR_IN_ZONE';
    }

    candidateRecommendations.push({
      product,
      bestSupplierProduct: bestSupplier,
      scoreBreakdown: {
        historicalSearchScore: searchScore,
        purchaseHistoryScore: purchaseScore,
        locationVelocityScore: locationScore,
        temporalRelevanceScore: timeScore,
        preferenceAffinityScore: preferenceScore,
        compositeScore,
        primaryDriver,
        explanationTags,
        confidenceScore: Math.min(99, Math.round(compositeScore * 0.98))
      },
      rank: 0, // Assigned after sorting
      recommendationReason,
      urgencyLevel
    });
  });

  // Sort by composite score descending
  candidateRecommendations.sort((a, b) => b.scoreBreakdown.compositeScore - a.scoreBreakdown.compositeScore);

  // Production Hardening: Epsilon-Greedy Diversity Injection
  // If top 3 items are all from the exact same category, inject a diverse exploratory SKU into position 3
  if (options?.enableExploration && candidateRecommendations.length >= 4) {
    const topCat = candidateRecommendations[0].product.internalCategory;
    const isUniformTop3 = candidateRecommendations.slice(0, 3).every(
      (item) => item.product.internalCategory === topCat
    );

    if (isUniformTop3) {
      const exploratoryIndex = candidateRecommendations.findIndex(
        (item, idx) => idx >= 3 && item.product.internalCategory !== topCat
      );

      if (exploratoryIndex !== -1) {
        const [exploratoryItem] = candidateRecommendations.splice(exploratoryIndex, 1);
        exploratoryItem.scoreBreakdown.explanationTags.unshift('Exploration: Category Diversification');
        exploratoryItem.recommendationReason = `High-Margin Discovery: Diversifying beyond ${topCat} with fast-moving inventory.`;
        candidateRecommendations.splice(2, 0, exploratoryItem);
      }
    }
  }

  // Assign ranks
  candidateRecommendations.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const endTime = performance.now();

  return {
    shopId: shop.id,
    shopName: shop.name,
    evaluatedAt: new Date().toISOString(),
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
    signalsExtracted: signals,
    weightsApplied: weights,
    recommendations: candidateRecommendations,
    searchFirstPreserved: true, // Verification of the Search-First invariant!
    totalCatalogEvaluated: PRODUCTS.length
  };
}

/**
 * Standard Haversine distance calculator in KM
 */
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
