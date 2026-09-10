export type PromotionalSlot = 
  | 'HERO_BANNER' 
  | 'TOP_SEARCH_SPONSORED' 
  | 'CATEGORY_FEATURED' 
  | 'CHECKOUT_UPSELL';

export type SponsorType = 'MANUFACTURER' | 'WHOLESALER_DEPOT' | 'BRAND_AGGREGATOR';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'SCHEDULED' | 'EXHAUSTED';

export type CampaignObjective = 
  | 'BRAND_CONQUESTING' 
  | 'GEO_ZONE_SURGE' 
  | 'LAPSED_DUKA_REACTIVATION' 
  | 'VOLUME_TIER_REBATE' 
  | 'CATEGORY_CROSS_SELL' 
  | 'DEPOT_CLEARANCE';

export type DukaTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'ALL';

export type DukaArchetype = 'KIOSK' | 'STANDARD_DUKA' | 'MINI_MART' | 'SUPERETTE' | 'ALL';

export type BehavioralCohort = 
  | 'ALL' 
  | 'LAPSED_RESTOCKERS' 
  | 'HIGH_VELOCITY_STAPLES' 
  | 'NEW_DUKAS' 
  | 'MARGIN_SEEKERS' 
  | 'FREQUENT_MPESA_USERS';

export type IncentiveMechanism = 
  | 'CASH_DISCOUNT_KES' 
  | 'PERCENT_OFF' 
  | 'FREE_BODA_DELIVERY' 
  | 'MPESA_CASHBACK' 
  | 'BUY_X_GET_Y_SUBSIDY';

export interface CampaignTargetingRules {
  targetZones: string[]; // e.g. ['zone_nairobi_east', 'zone_nairobi_central']
  targetZoneNames: string[]; // e.g. ['Eastleigh', 'Dandora', 'Kariobangi']
  dukaTiers: DukaTier[];
  dukaArchetypes: DukaArchetype[];
  behavioralCohorts: BehavioralCohort[];
  minOrderValueKES?: number;
  minUnitsThreshold?: number;
  triggerKeywords?: string[]; // e.g. ['jogoo', 'soko', 'flour']
  conquestRivalBrands?: string[]; // e.g. ['Jogoo', 'Soko', 'Kasuku']
  excludedShopIds?: string[];
  incentiveMechanism?: IncentiveMechanism;
}

export interface ABTestVariant {
  variantName: string;
  headline: string;
  subtext: string;
  discountKES: number;
  impressions: number;
  clicks: number;
  conversions: number;
  gmvGeneratedKES: number;
}

export interface PromotionalPlacement {
  id: string;
  campaignName: string;
  sponsorName: string;
  sponsorType: SponsorType;
  targetProductId: string;
  targetProductName: string;
  targetCategory: string;
  placementSlot: PromotionalSlot;
  headline: string;
  subtext: string;
  badgeText: string;
  discountKES: number; // Wholesale discount rebate per unit
  boostScore: number;  // 10 - 50 points added to search ranking score
  cpcBidKES: number;   // Cost per click / interaction
  budgetKES: number;
  spentKES: number;
  impressions: number;
  clicks: number;
  conversions: number;
  gmvGeneratedKES: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  priority: number;
  // Targeted campaigns extensions
  objective?: CampaignObjective;
  targeting?: CampaignTargetingRules;
  incentiveMechanism?: IncentiveMechanism;
  incentiveValue?: number;
  incentiveDescription?: string;
  exclusiveBadgeText?: string;
  callToActionText?: string;
  estimatedTargetDukas?: number;
  projectedGMVKES?: number;
  dailySpendCapKES?: number;
  currentDaySpendKES?: number;
  hasABTest?: boolean;
  abVariantB?: ABTestVariant;
}

export interface DukaTargetingProfile {
  shopId: string;
  shopName: string;
  ownerName: string;
  zoneId: string;
  zoneName: string;
  address: string;
  phone: string;
  tier: DukaTier;
  archetype: DukaArchetype;
  monthlyGmvKES: number;
  cohorts: BehavioralCohort[];
  avgOrderValueKES: number;
  lastOrderDaysAgo: number;
  frequentCategories: string[];
  favoriteBrands: string[];
  creditLimitKES: number;
  ordersThisMonth: number;
}

export interface TargetingEvaluationResult {
  isEligible: boolean;
  reason: string;
  appliedDiscount: number;
  conquestTriggered: boolean;
  conquestRivalBrand?: string;
  exclusiveBadgeText?: string;
  callToActionText?: string;
}

export interface PromotionAnalyticsSummary {
  activeCampaignsCount: number;
  totalAdSpendKES: number;
  totalGMVDrivenKES: number;
  overallROAS: number; // Return on Ad Spend (GMV / Ad Spend)
  totalImpressions: number;
  totalClicks: number;
  avgCTRPercent: number;
  avgConversionRatePercent: number;
  targetedCampaignsCount: number;
  targetedGMVSharePercent: number;
  activeTargetedDukas: number;
}
