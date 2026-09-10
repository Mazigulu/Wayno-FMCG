import { 
  PromotionalPlacement, 
  PromotionAnalyticsSummary, 
  DukaTargetingProfile, 
  TargetingEvaluationResult, 
  CampaignTargetingRules 
} from '../types/promotions';

// ---------------------------------------------------------------------------
// 1. RICH TARGETED CAMPAIGNS REPOSITORY
// ---------------------------------------------------------------------------

export const INITIAL_PROMOTIONAL_PLACEMENTS: PromotionalPlacement[] = [
  {
    id: 'promo_pembe_hero',
    campaignName: 'Pembe National Harvest — Jogoo Conquesting Trade Incentive',
    sponsorName: 'Unga Group PLC',
    sponsorType: 'MANUFACTURER',
    targetProductId: 'prod_pembe',
    targetProductName: 'Pembe Maize Meal (12x2kg Bale)',
    targetCategory: 'Grains & Flours',
    placementSlot: 'HERO_BANNER',
    headline: 'Switch from Jogoo to Pembe: KES 120 Off Per Bale + Margin Shield',
    subtext: 'Targeted manufacturer trade subsidy for high-density Nairobi East & Central dukas. Guaranteed next-morning boda delivery from Eastleigh Mega Depot.',
    badgeText: '★ Jogoo Trader Switch • -KES 120',
    discountKES: 120,
    boostScore: 35,
    cpcBidKES: 8.5,
    budgetKES: 150000,
    spentKES: 84200,
    impressions: 24850,
    clicks: 3420,
    conversions: 890,
    gmvGeneratedKES: 1780000,
    status: 'ACTIVE',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    priority: 1,
    // Targeted configuration
    objective: 'BRAND_CONQUESTING',
    targeting: {
      targetZones: ['zone_nairobi_east', 'zone_nairobi_central'],
      targetZoneNames: ['Eastleigh', 'Dandora', 'Kariobangi South', 'Gikomba'],
      dukaTiers: ['SILVER', 'GOLD', 'PLATINUM'],
      dukaArchetypes: ['STANDARD_DUKA', 'MINI_MART', 'SUPERETTE'],
      behavioralCohorts: ['HIGH_VELOCITY_STAPLES', 'MARGIN_SEEKERS'],
      minOrderValueKES: 1500,
      triggerKeywords: ['jogoo', 'soko', 'unga wa ugali', 'flour', 'sembe'],
      conquestRivalBrands: ['Jogoo', 'Soko'],
    },
    incentiveMechanism: 'CASH_DISCOUNT_KES',
    incentiveValue: 120,
    incentiveDescription: 'Instant wholesale rebate of KES 120 per bale when switching from Jogoo/Soko.',
    exclusiveBadgeText: '🎯 Brand Conquest Exclusive • KES 120 Rebate',
    callToActionText: 'Claim KES 120 Pembe Subsidy',
    estimatedTargetDukas: 184,
    projectedGMVKES: 2400000,
    dailySpendCapKES: 6000,
    currentDaySpendKES: 3420,
    hasABTest: true,
    abVariantB: {
      variantName: 'Variant B (KES 150 Elasticity Test)',
      headline: 'Aggressive Trade Switch: Save KES 150 Per Bale on Pembe 2kg',
      subtext: 'Limited 48-hour pilot comparing conversion uplift of KES 150 vs KES 120 subsidy.',
      discountKES: 150,
      impressions: 11200,
      clicks: 1840,
      conversions: 520,
      gmvGeneratedKES: 1040000,
    }
  },
  {
    id: 'promo_freshfri_search',
    campaignName: 'Fresh Fri Cooking Oil — Gold & Platinum Tier Margin Shield',
    sponsorName: 'Pwani Oil Products',
    sponsorType: 'MANUFACTURER',
    targetProductId: 'prod_freshfri',
    targetProductName: 'Fresh Fri Cooking Oil (4x3L Carton)',
    targetCategory: 'Cooking Oils & Fats',
    placementSlot: 'TOP_SEARCH_SPONSORED',
    headline: 'Fresh Fri 4x3L Carton — Gold Tier Exclusive KES 150 Margin Protection',
    subtext: 'High-velocity 3L family carton. Reserved exclusively for Gold & Platinum volume dukas committing to 2+ cartons per restock cycle.',
    badgeText: 'Sponsored Deal • Pwani Oil',
    discountKES: 150,
    boostScore: 40,
    cpcBidKES: 12.0,
    budgetKES: 120000,
    spentKES: 92400,
    impressions: 18400,
    clicks: 2890,
    conversions: 640,
    gmvGeneratedKES: 1472000,
    status: 'ACTIVE',
    startDate: '2026-09-03',
    endDate: '2026-09-24',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    priority: 2,
    // Targeted configuration
    objective: 'VOLUME_TIER_REBATE',
    targeting: {
      targetZones: ['zone_nairobi_east', 'zone_nairobi_central', 'zone_nairobi_west'],
      targetZoneNames: ['Eastleigh', 'Kariobangi', 'Kawangware', 'Industrial Area'],
      dukaTiers: ['GOLD', 'PLATINUM'],
      dukaArchetypes: ['STANDARD_DUKA', 'MINI_MART', 'SUPERETTE'],
      behavioralCohorts: ['HIGH_VELOCITY_STAPLES', 'MARGIN_SEEKERS'],
      minOrderValueKES: 5000,
      minUnitsThreshold: 2,
      triggerKeywords: ['cooking oil', 'fresh fri', 'mafuta', 'oil'],
    },
    incentiveMechanism: 'CASH_DISCOUNT_KES',
    incentiveValue: 150,
    incentiveDescription: 'KES 150 rebate per carton on orders of 2+ cartons for verified Gold/Platinum dukas.',
    exclusiveBadgeText: '👑 Gold & Platinum Tier • KES 150 Margin Shield',
    callToActionText: 'Unlock Volume Margin Shield',
    estimatedTargetDukas: 96,
    projectedGMVKES: 1800000,
    dailySpendCapKES: 5000,
    currentDaySpendKES: 4100,
  },
  {
    id: 'promo_mumias_category',
    campaignName: 'Mumias Pure Sugar Flash Depot Staging & Clearance',
    sponsorName: 'Industrial Area Supply Hub',
    sponsorType: 'WHOLESALER_DEPOT',
    targetProductId: 'prod_mumias',
    targetProductName: 'Mumias Pure Sugar (20x1kg Bale)',
    targetCategory: 'Sugar & Sweeteners',
    placementSlot: 'CATEGORY_FEATURED',
    headline: 'Mumias Cane Sugar (20x1kg) — Fresh Stock Staged for Fast Dispatch',
    subtext: 'Solving the regional sugar shortage. Max 10 bales per duka to ensure equitable distribution across Dandora and Kayole.',
    badgeText: 'Depot Feature • In Stock',
    discountKES: 80,
    boostScore: 30,
    cpcBidKES: 6.0,
    budgetKES: 80000,
    spentKES: 45600,
    impressions: 12300,
    clicks: 1950,
    conversions: 520,
    gmvGeneratedKES: 1300000,
    status: 'ACTIVE',
    startDate: '2026-09-05',
    endDate: '2026-09-18',
    imageUrl: 'https://images.unsplash.com/photo-1622484216800-47b1c4e7436b?w=600&auto=format&fit=crop&q=80',
    priority: 3,
    // Targeted configuration
    objective: 'DEPOT_CLEARANCE',
    targeting: {
      targetZones: ['zone_nairobi_east', 'zone_nairobi_central'],
      targetZoneNames: ['Dandora', 'Kariobangi', 'Eastleigh'],
      dukaTiers: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'ALL'],
      dukaArchetypes: ['ALL'],
      behavioralCohorts: ['ALL'],
      minOrderValueKES: 2500,
      triggerKeywords: ['sugar', 'sukari', 'mumias'],
    },
    incentiveMechanism: 'CASH_DISCOUNT_KES',
    incentiveValue: 80,
    incentiveDescription: 'Depot-subsidized KES 80 rebate per bale to clear inventory before silo cycle.',
    exclusiveBadgeText: '⚡ Flash Depot Allocation • KES 80 Subsidy',
    callToActionText: 'Lock In Sugar Stock',
    estimatedTargetDukas: 240,
    projectedGMVKES: 1500000,
    dailySpendCapKES: 4000,
    currentDaySpendKES: 2600,
  },
  {
    id: 'promo_blueband_upsell',
    campaignName: 'Blue Band Breakfast Restock & Category Cross-Sell',
    sponsorName: 'Upfield Kenya',
    sponsorType: 'MANUFACTURER',
    targetProductId: 'prod_blueband',
    targetProductName: 'Blue Band Original Spread (24x500g Tub Carton)',
    targetCategory: 'Spreads & Breakfast',
    placementSlot: 'CHECKOUT_UPSELL',
    headline: 'Add Blue Band 24x500g to your cart and unlock KES 95 M-Pesa Cashback',
    subtext: 'High repeat purchase item for family tea and school snacks. Low storage footprint, high cash turnover.',
    badgeText: 'Cart Add-On • Save KES 95',
    discountKES: 95,
    boostScore: 25,
    cpcBidKES: 5.0,
    budgetKES: 60000,
    spentKES: 31200,
    impressions: 9800,
    clicks: 1420,
    conversions: 380,
    gmvGeneratedKES: 874000,
    status: 'ACTIVE',
    startDate: '2026-09-02',
    endDate: '2026-09-28',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    priority: 4,
    // Targeted configuration
    objective: 'CATEGORY_CROSS_SELL',
    targeting: {
      targetZones: ['zone_nairobi_east', 'zone_nairobi_west', 'zone_nairobi_central'],
      targetZoneNames: ['Eastleigh', 'Kariobangi', 'Kawangware'],
      dukaTiers: ['SILVER', 'GOLD', 'PLATINUM'],
      dukaArchetypes: ['STANDARD_DUKA', 'MINI_MART', 'SUPERETTE'],
      behavioralCohorts: ['HIGH_VELOCITY_STAPLES'],
      minOrderValueKES: 2000,
      triggerKeywords: ['blue band', 'spread', 'butter', 'breakfast', 'mkate'],
    },
    incentiveMechanism: 'MPESA_CASHBACK',
    incentiveValue: 95,
    incentiveDescription: 'KES 95 credited directly to duka owner M-Pesa till on delivery confirmation.',
    exclusiveBadgeText: '☕ Breakfast Cross-Sell • KES 95 M-Pesa Cashback',
    callToActionText: 'Add For KES 95 Cashback',
    estimatedTargetDukas: 160,
    projectedGMVKES: 950000,
    dailySpendCapKES: 3000,
    currentDaySpendKES: 1800,
  },
  {
    id: 'promo_menengai_depot',
    campaignName: 'Menengai Pure Soap — Dandora & East Micro-Zone Surge',
    sponsorName: 'Menengai Oil Refineries',
    sponsorType: 'MANUFACTURER',
    targetProductId: 'prod_menengai',
    targetProductName: 'Menengai Pure Bar Soap (25x800g Carton)',
    targetCategory: 'Cleaning & Household',
    placementSlot: 'HERO_BANNER',
    headline: 'Menengai Soap (25x800g): KES 110 Trade Subsidy + Subsidized Boda Delivery',
    subtext: 'Long-lasting multipurpose laundry bar soap. Essential staple for high-density residential dukas with 18.2% margin.',
    badgeText: '★ Bulk Trader Subsidy • -KES 110',
    discountKES: 110,
    boostScore: 35,
    cpcBidKES: 7.0,
    budgetKES: 100000,
    spentKES: 58900,
    impressions: 16500,
    clicks: 2180,
    conversions: 460,
    gmvGeneratedKES: 966000,
    status: 'ACTIVE',
    startDate: '2026-09-04',
    endDate: '2026-09-25',
    imageUrl: 'https://images.unsplash.com/photo-1607006314148-39a04a3e74e4?w=600&auto=format&fit=crop&q=80',
    priority: 2,
    // Targeted configuration
    objective: 'GEO_ZONE_SURGE',
    targeting: {
      targetZones: ['zone_nairobi_east'],
      targetZoneNames: ['Dandora', 'Kariobangi South', 'Kayole'],
      dukaTiers: ['BRONZE', 'SILVER'],
      dukaArchetypes: ['KIOSK', 'STANDARD_DUKA'],
      behavioralCohorts: ['MARGIN_SEEKERS', 'NEW_DUKAS'],
      minOrderValueKES: 1800,
      triggerKeywords: ['sabuni', 'menengai', 'soap', 'bar soap', 'laundry'],
    },
    incentiveMechanism: 'FREE_BODA_DELIVERY',
    incentiveValue: 110,
    incentiveDescription: 'KES 110 wholesale discount + zero delivery fee via Wayno Boda express.',
    exclusiveBadgeText: '🚚 Dandora & East Free Boda Delivery',
    callToActionText: 'Order Soap With Zero Delivery Fee',
    estimatedTargetDukas: 112,
    projectedGMVKES: 1100000,
    dailySpendCapKES: 4500,
    currentDaySpendKES: 2750,
  },
  {
    id: 'promo_omo_search',
    campaignName: 'Omo Multi-Active Hygiene — Lapsed Duka Win-Back Stimulus',
    sponsorName: 'Unilever Kenya',
    sponsorType: 'MANUFACTURER',
    targetProductId: 'prod_omo',
    targetProductName: 'Omo Hand Washing Powder (24x500g)',
    targetCategory: 'Cleaning & Household',
    placementSlot: 'TOP_SEARCH_SPONSORED',
    headline: 'Welcome Back Trader Rebate: Omo 24x500g + Branded Retail Counter Display',
    subtext: 'Unilever Kenya official trade re-engagement package for retail dukas resuming restock after 5+ days.',
    badgeText: 'Sponsored • Unilever Kenya',
    discountKES: 75,
    boostScore: 30,
    cpcBidKES: 6.5,
    budgetKES: 75000,
    spentKES: 38200,
    impressions: 11200,
    clicks: 1350,
    conversions: 310,
    gmvGeneratedKES: 589000,
    status: 'ACTIVE',
    startDate: '2026-09-06',
    endDate: '2026-09-27',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    priority: 3,
    // Targeted configuration
    objective: 'LAPSED_DUKA_REACTIVATION',
    targeting: {
      targetZones: ['zone_nairobi_east', 'zone_nairobi_west', 'zone_nairobi_central'],
      targetZoneNames: ['Eastleigh', 'Kariobangi', 'Kawangware'],
      dukaTiers: ['BRONZE', 'SILVER', 'GOLD'],
      dukaArchetypes: ['KIOSK', 'STANDARD_DUKA'],
      behavioralCohorts: ['LAPSED_RESTOCKERS'],
      minOrderValueKES: 1500,
      triggerKeywords: ['detergent', 'omo', 'powder', 'sabuni ya unga', 'things to wash clothes'],
    },
    incentiveMechanism: 'CASH_DISCOUNT_KES',
    incentiveValue: 75,
    incentiveDescription: 'KES 75 re-engagement rebate per carton + complimentary Unilever countertop display unit.',
    exclusiveBadgeText: '🔄 Welcome Back Trader • KES 75 Rebate',
    callToActionText: 'Claim Win-Back Offer',
    estimatedTargetDukas: 74,
    projectedGMVKES: 720000,
    dailySpendCapKES: 3500,
    currentDaySpendKES: 1950,
  }
];

// ---------------------------------------------------------------------------
// 2. DUKA TARGETING PROFILES (REPRESENTATIVE NAIROBI RETAILERS)
// ---------------------------------------------------------------------------

export const DUKA_TARGETING_PROFILES: DukaTargetingProfile[] = [
  {
    shopId: 'shop_01',
    shopName: 'Mama Sarah Provision Duka',
    ownerName: 'Sarah Wanjiku',
    zoneId: 'zone_nairobi_east',
    zoneName: 'Kariobangi South & Eastleigh Border',
    address: 'Plot 42, Kariobangi South Commercial Zone, Nairobi',
    phone: '+254 712 345 678',
    tier: 'GOLD',
    archetype: 'STANDARD_DUKA',
    monthlyGmvKES: 148000,
    cohorts: ['HIGH_VELOCITY_STAPLES', 'FREQUENT_MPESA_USERS'],
    avgOrderValueKES: 8400,
    lastOrderDaysAgo: 1,
    frequentCategories: ['Grains & Flours', 'Cooking Oils & Fats', 'Cleaning & Household'],
    favoriteBrands: ['Pembe', 'Fresh Fri', 'Menengai', 'Mumias'],
    creditLimitKES: 35000,
    ordersThisMonth: 16,
  },
  {
    shopId: 'shop_02',
    shopName: 'Baraka Mini Mart',
    ownerName: 'Hassan Omar',
    zoneId: 'zone_nairobi_west',
    zoneName: 'Kawangware Stage 2 & Lavington Fringe',
    address: 'Kawangware Stage 2, Gitanga Road, Nairobi',
    phone: '+254 722 987 654',
    tier: 'PLATINUM',
    archetype: 'MINI_MART',
    monthlyGmvKES: 320000,
    cohorts: ['HIGH_VELOCITY_STAPLES', 'MARGIN_SEEKERS'],
    avgOrderValueKES: 16500,
    lastOrderDaysAgo: 2,
    frequentCategories: ['Cooking Oils & Fats', 'Spreads & Breakfast', 'Personal Care & Hygiene'],
    favoriteBrands: ['Blue Band', 'Omo', 'Geisha', 'Rina'],
    creditLimitKES: 75000,
    ordersThisMonth: 22,
  },
  {
    shopId: 'shop_03',
    shopName: 'Amani Corner Duka',
    ownerName: 'Esther Mutua',
    zoneId: 'zone_nairobi_central',
    zoneName: 'Eastleigh 12th Street Commercial Hub',
    address: 'Eastleigh 12th Street, Near Garissa Lodge, Nairobi',
    phone: '+254 733 456 789',
    tier: 'SILVER',
    archetype: 'STANDARD_DUKA',
    monthlyGmvKES: 85000,
    cohorts: ['MARGIN_SEEKERS'],
    avgOrderValueKES: 5200,
    lastOrderDaysAgo: 3,
    frequentCategories: ['Sugar & Sweeteners', 'Grains & Flours', 'Spices & Seasoning'],
    favoriteBrands: ['Mumias', 'Pembe', 'Royco'],
    creditLimitKES: 20000,
    ordersThisMonth: 11,
  },
  {
    shopId: 'shop_04',
    shopName: 'Dandora Express Kiosk',
    ownerName: 'Bernard Otieno',
    zoneId: 'zone_nairobi_east',
    zoneName: 'Dandora Phase 4 Market Strip',
    address: 'Dandora Phase 4, Terminus Road, Nairobi',
    phone: '+254 701 555 777',
    tier: 'BRONZE',
    archetype: 'KIOSK',
    monthlyGmvKES: 42000,
    cohorts: ['LAPSED_RESTOCKERS', 'NEW_DUKAS', 'MARGIN_SEEKERS'],
    avgOrderValueKES: 3100,
    lastOrderDaysAgo: 8, // Lapsed restocker!
    frequentCategories: ['Grains & Flours', 'Cleaning & Household'],
    favoriteBrands: ['Jogoo', 'Menengai'],
    creditLimitKES: 10000,
    ordersThisMonth: 4,
  },
  {
    shopId: 'shop_05',
    shopName: 'Gikomba Wholesale Traders',
    ownerName: 'Peter Kamau',
    zoneId: 'zone_nairobi_central',
    zoneName: 'Gikomba Central Market',
    address: 'Line 3B, Gikomba Market, Nairobi',
    phone: '+254 711 888 999',
    tier: 'PLATINUM',
    archetype: 'SUPERETTE',
    monthlyGmvKES: 580000,
    cohorts: ['HIGH_VELOCITY_STAPLES', 'MARGIN_SEEKERS'],
    avgOrderValueKES: 28000,
    lastOrderDaysAgo: 1,
    frequentCategories: ['Grains & Flours', 'Cooking Oils & Fats', 'Sugar & Sweeteners'],
    favoriteBrands: ['Pembe', 'Fresh Fri', 'Mumias', 'Sunlight'],
    creditLimitKES: 120000,
    ordersThisMonth: 28,
  },
  {
    shopId: 'shop_06',
    shopName: 'Kibera Olympic Grocers',
    ownerName: 'Faith Chebet',
    zoneId: 'zone_nairobi_west',
    zoneName: 'Kibera Olympic Junction',
    address: 'Olympic Bus Stage, Kibera, Nairobi',
    phone: '+254 723 444 111',
    tier: 'SILVER',
    archetype: 'KIOSK',
    monthlyGmvKES: 68000,
    cohorts: ['FREQUENT_MPESA_USERS', 'LAPSED_RESTOCKERS'],
    avgOrderValueKES: 4200,
    lastOrderDaysAgo: 6, // Lapsed!
    frequentCategories: ['Grains & Flours', 'Cleaning & Household'],
    favoriteBrands: ['Jogoo', 'Menengai'],
    creditLimitKES: 15000,
    ordersThisMonth: 7,
  },
];

export const getDukaTargetingProfiles = (): DukaTargetingProfile[] => {
  return DUKA_TARGETING_PROFILES;
};

export const getDukaProfileById = (shopId: string): DukaTargetingProfile => {
  const found = DUKA_TARGETING_PROFILES.find(d => d.shopId === shopId);
  return found || DUKA_TARGETING_PROFILES[0];
};

// ---------------------------------------------------------------------------
// 3. TARGETING EVALUATOR ENGINE
// ---------------------------------------------------------------------------

/**
 * Evaluates whether a given promotional campaign qualifies for a specific retail duka
 * based on geographic zone, duka tier, archetype, behavioral cohorts, and search triggers.
 */
export const evaluateCampaignForShop = (
  campaign: PromotionalPlacement,
  shopProfile: DukaTargetingProfile,
  context?: { query?: string; cartCategory?: string }
): TargetingEvaluationResult => {
  // If campaign is paused or exhausted, immediately disqualify
  if (campaign.status !== 'ACTIVE') {
    return {
      isEligible: false,
      reason: `Campaign is currently ${campaign.status.toLowerCase()}`,
      appliedDiscount: 0,
      conquestTriggered: false,
    };
  }

  // Non-targeted legacy campaign fallback
  if (!campaign.targeting) {
    return {
      isEligible: true,
      reason: 'General broadcast campaign (no targeting restrictions)',
      appliedDiscount: campaign.discountKES,
      conquestTriggered: false,
      exclusiveBadgeText: campaign.badgeText,
      callToActionText: 'Claim Offer',
    };
  }

  const { targeting } = campaign;

  // 1. Geographic zone evaluation
  const zoneMatches = 
    targeting.targetZones.length === 0 || 
    targeting.targetZones.includes(shopProfile.zoneId) ||
    targeting.targetZones.includes('ALL');

  if (!zoneMatches) {
    return {
      isEligible: false,
      reason: `Excluded by location: Target zones are ${targeting.targetZoneNames.join(', ')}, but shop is in ${shopProfile.zoneName}`,
      appliedDiscount: 0,
      conquestTriggered: false,
    };
  }

  // 2. Duka Tier evaluation
  const tierMatches = 
    targeting.dukaTiers.length === 0 || 
    targeting.dukaTiers.includes('ALL') || 
    targeting.dukaTiers.includes(shopProfile.tier);

  if (!tierMatches) {
    return {
      isEligible: false,
      reason: `Tier gate: Requires ${targeting.dukaTiers.join('/')} tier, shop is ${shopProfile.tier} tier`,
      appliedDiscount: 0,
      conquestTriggered: false,
    };
  }

  // 3. Duka Archetype evaluation
  const archetypeMatches = 
    targeting.dukaArchetypes.length === 0 || 
    targeting.dukaArchetypes.includes('ALL') || 
    targeting.dukaArchetypes.includes(shopProfile.archetype);

  if (!archetypeMatches) {
    return {
      isEligible: false,
      reason: `Format mismatch: Target formats are ${targeting.dukaArchetypes.join('/')}, shop is ${shopProfile.archetype}`,
      appliedDiscount: 0,
      conquestTriggered: false,
    };
  }

  // 4. Behavioral cohort evaluation
  let cohortMatches = true;
  if (targeting.behavioralCohorts.length > 0 && !targeting.behavioralCohorts.includes('ALL')) {
    cohortMatches = targeting.behavioralCohorts.some(cohort => {
      if (cohort === 'LAPSED_RESTOCKERS') return shopProfile.lastOrderDaysAgo >= 5;
      return shopProfile.cohorts.includes(cohort);
    });
  }

  if (!cohortMatches) {
    return {
      isEligible: false,
      reason: `Behavioral gate: Requires ${targeting.behavioralCohorts.join('/')} cohort membership`,
      appliedDiscount: 0,
      conquestTriggered: false,
    };
  }

  // 5. Contextual Brand Conquesting evaluation
  let conquestTriggered = false;
  let conquestRivalBrand: string | undefined;

  if (campaign.objective === 'BRAND_CONQUESTING' && context?.query) {
    const q = context.query.toLowerCase().trim();
    if (targeting.conquestRivalBrands) {
      const matchedRival = targeting.conquestRivalBrands.find(rival => q.includes(rival.toLowerCase()));
      if (matchedRival) {
        conquestTriggered = true;
        conquestRivalBrand = matchedRival;
      }
    }
  }

  return {
    isEligible: true,
    reason: `Targeting match: ${shopProfile.zoneName} · ${shopProfile.tier} Tier · Eligible for ${campaign.incentiveMechanism || 'CASH_DISCOUNT_KES'}`,
    appliedDiscount: campaign.discountKES,
    conquestTriggered,
    conquestRivalBrand,
    exclusiveBadgeText: campaign.exclusiveBadgeText || campaign.badgeText,
    callToActionText: campaign.callToActionText || 'Claim Trader Rebate',
  };
};

// ---------------------------------------------------------------------------
// 4. AUDIENCE ESTIMATOR & REACH SIMULATOR
// ---------------------------------------------------------------------------

export const simulateAudienceReach = (
  targeting: CampaignTargetingRules
): {
  matchedDukasCount: number;
  totalReachableGMV: number;
  estimatedImpressionsWeekly: number;
  avgDukaGmv: number;
  matchingShopIds: string[];
} => {
  const matchingProfiles = DUKA_TARGETING_PROFILES.filter(shop => {
    // Zone check
    const zoneMatch = 
      targeting.targetZones.length === 0 || 
      targeting.targetZones.includes('ALL') || 
      targeting.targetZones.includes(shop.zoneId);
    
    // Tier check
    const tierMatch = 
      targeting.dukaTiers.length === 0 || 
      targeting.dukaTiers.includes('ALL') || 
      targeting.dukaTiers.includes(shop.tier);

    // Archetype check
    const archetypeMatch = 
      targeting.dukaArchetypes.length === 0 || 
      targeting.dukaArchetypes.includes('ALL') || 
      targeting.dukaArchetypes.includes(shop.archetype);

    // Cohort check
    let cohortMatch = true;
    if (targeting.behavioralCohorts.length > 0 && !targeting.behavioralCohorts.includes('ALL')) {
      cohortMatch = targeting.behavioralCohorts.some(cohort => {
        if (cohort === 'LAPSED_RESTOCKERS') return shop.lastOrderDaysAgo >= 5;
        return shop.cohorts.includes(cohort);
      });
    }

    return zoneMatch && tierMatch && archetypeMatch && cohortMatch;
  });

  const matchingShopIds = matchingProfiles.map(s => s.shopId);
  const totalReachableGMV = matchingProfiles.reduce((sum, s) => sum + s.monthlyGmvKES, 0);
  const avgDukaGmv = matchingProfiles.length > 0 ? Math.round(totalReachableGMV / matchingProfiles.length) : 0;

  // Extrapolate to regional cluster (scaling prototype 6 shops to representative Nairobi universe factor ~35x)
  const scalingFactor = 32;
  const estimatedDukas = Math.max(matchingProfiles.length, matchingProfiles.length * scalingFactor);
  const scaledGMV = Math.round(totalReachableGMV * (scalingFactor / 2));
  const estimatedImpressionsWeekly = estimatedDukas * 45;

  return {
    matchedDukasCount: estimatedDukas,
    totalReachableGMV: scaledGMV,
    estimatedImpressionsWeekly,
    avgDukaGmv,
    matchingShopIds,
  };
};

// ---------------------------------------------------------------------------
// 5. LIVE SUMMARY ANALYTICS
// ---------------------------------------------------------------------------

export const calculatePromotionsAnalytics = (placements: PromotionalPlacement[]): PromotionAnalyticsSummary => {
  const active = placements.filter(p => p.status === 'ACTIVE');
  const totalAdSpend = placements.reduce((sum, p) => sum + p.spentKES, 0);
  const totalGMVDriven = placements.reduce((sum, p) => sum + p.gmvGeneratedKES, 0);
  const totalImpressions = placements.reduce((sum, p) => sum + p.impressions, 0);
  const totalClicks = placements.reduce((sum, p) => sum + p.clicks, 0);
  const totalConversions = placements.reduce((sum, p) => sum + p.conversions, 0);

  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgConversion = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const overallROAS = totalAdSpend > 0 ? totalGMVDriven / totalAdSpend : 0;

  const targetedCampaigns = placements.filter(p => !!p.targeting);
  const targetedGMV = targetedCampaigns.reduce((sum, p) => sum + p.gmvGeneratedKES, 0);
  const targetedGMVSharePercent = totalGMVDriven > 0 ? Number(((targetedGMV / totalGMVDriven) * 100).toFixed(1)) : 0;
  const activeTargetedDukas = targetedCampaigns.reduce((sum, p) => sum + (p.estimatedTargetDukas || 0), 0);

  return {
    activeCampaignsCount: active.length,
    totalAdSpendKES: totalAdSpend,
    totalGMVDrivenKES: totalGMVDriven,
    overallROAS: Number(overallROAS.toFixed(1)),
    totalImpressions,
    totalClicks,
    avgCTRPercent: Number(avgCTR.toFixed(2)),
    avgConversionRatePercent: Number(avgConversion.toFixed(1)),
    targetedCampaignsCount: targetedCampaigns.length,
    targetedGMVSharePercent,
    activeTargetedDukas,
  };
};
