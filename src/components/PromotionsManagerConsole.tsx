import React, { useState, useMemo } from 'react';
import {
  Tag,
  TrendingUp,
  DollarSign,
  Sparkles,
  Eye,
  MousePointer,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Sliders,
  Play,
  Pause,
  Layers,
  Store,
  Building2,
  Award,
  Zap,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Target,
  MapPin,
  Users,
  Split,
  Percent,
  Truck,
  Smartphone,
  Crosshair,
  Flame,
  Shield,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { 
  PromotionalPlacement, 
  PromotionalSlot, 
  SponsorType, 
  CampaignStatus,
  CampaignObjective,
  DukaTier,
  DukaArchetype,
  BehavioralCohort,
  IncentiveMechanism,
  CampaignTargetingRules,
  DukaTargetingProfile
} from '../types/promotions';
import { 
  getPromotionalPlacements, 
  updatePromotionalPlacement, 
  addPromotionalPlacement, 
  togglePromotionalPlacementStatus 
} from '../services/searchEngine';
import { 
  calculatePromotionsAnalytics,
  DUKA_TARGETING_PROFILES,
  evaluateCampaignForShop,
  simulateAudienceReach
} from '../data/promotionsData';
import { PRODUCTS } from '../data/mockData';
import { DukaEligibilityMatrix } from './DukaEligibilityMatrix';
import { AudienceReachSimulator } from './AudienceReachSimulator';
import { BrandConquestingView } from './BrandConquestingView';

export type PromotionsConsoleTab = 'campaigns' | 'duka_matrix' | 'simulator' | 'conquest';

interface PromotionsManagerConsoleProps {
  onRefreshSearch?: () => void;
}

export const PromotionsManagerConsole: React.FC<PromotionsManagerConsoleProps> = ({
  onRefreshSearch,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<PromotionsConsoleTab>('campaigns');
  const [placements, setPlacements] = useState<PromotionalPlacement[]>(() => getPromotionalPlacements());
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] = useState<PromotionalPlacement | null>(null);

  // Active Duka selection for the Eligibility Matrix
  const [selectedMatrixShopId, setSelectedMatrixShopId] = useState<string>(DUKA_TARGETING_PROFILES[0].shopId);

  // Audience Reach Simulator sandbox state
  const [simObjective, setSimObjective] = useState<CampaignObjective>('BRAND_CONQUESTING');
  const [simZones, setSimZones] = useState<string[]>(['zone_nairobi_east', 'zone_nairobi_central']);
  const [simTiers, setSimTiers] = useState<DukaTier[]>(['SILVER', 'GOLD', 'PLATINUM']);
  const [simArchetypes, setSimArchetypes] = useState<DukaArchetype[]>(['STANDARD_DUKA', 'MINI_MART']);
  const [simCohorts, setSimCohorts] = useState<BehavioralCohort[]>(['HIGH_VELOCITY_STAPLES', 'MARGIN_SEEKERS']);
  const [simIncentive, setSimIncentive] = useState<IncentiveMechanism>('CASH_DISCOUNT_KES');
  const [simDiscountKES, setSimDiscountKES] = useState<number>(120);

  // Form state for creating a new promotional placement with precision targeting
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorType, setNewSponsorType] = useState<SponsorType>('MANUFACTURER');
  const [newTargetProductId, setNewTargetProductId] = useState(PRODUCTS[0].id);
  const [newPlacementSlot, setNewPlacementSlot] = useState<PromotionalSlot>('TOP_SEARCH_SPONSORED');
  const [newHeadline, setNewHeadline] = useState('');
  const [newSubtext, setNewSubtext] = useState('');
  const [newBadgeText, setNewBadgeText] = useState('Sponsored Deal');
  const [newDiscountKES, setNewDiscountKES] = useState<number>(100);
  const [newBoostScore, setNewBoostScore] = useState<number>(30);
  const [newCpcBidKES, setNewCpcBidKES] = useState<number>(8.0);
  const [newBudgetKES, setNewBudgetKES] = useState<number>(100000);

  // Targeted Campaign creation fields
  const [newObjective, setNewObjective] = useState<CampaignObjective>('BRAND_CONQUESTING');
  const [newTargetZones, setNewTargetZones] = useState<string[]>(['zone_nairobi_east', 'zone_nairobi_central']);
  const [newTargetTiers, setNewTargetTiers] = useState<DukaTier[]>(['SILVER', 'GOLD']);
  const [newTargetCohorts, setNewTargetCohorts] = useState<BehavioralCohort[]>(['HIGH_VELOCITY_STAPLES']);
  const [newIncentiveMechanism, setNewIncentiveMechanism] = useState<IncentiveMechanism>('CASH_DISCOUNT_KES');
  const [newConquestRivals, setNewConquestRivals] = useState<string>('Jogoo, Soko');

  // Sync state whenever placements change
  const refreshPlacements = () => {
    const updated = getPromotionalPlacements();
    setPlacements([...updated]);
    if (onRefreshSearch) onRefreshSearch();
  };

  const handleToggleStatus = (id: string) => {
    togglePromotionalPlacementStatus(id);
    refreshPlacements();
  };

  const handleCreatePlacement = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProd = PRODUCTS.find((p) => p.id === newTargetProductId) || PRODUCTS[0];
    const rivalsList = newConquestRivals.split(',').map((s) => s.trim()).filter(Boolean);

    const newPlacement: PromotionalPlacement = {
      id: `promo_${Date.now()}`,
      campaignName: newCampaignName || `${targetProd.name} Targeted Trade Push`,
      sponsorName: newSponsorName || targetProd.manufacturer,
      sponsorType: newSponsorType,
      targetProductId: targetProd.id,
      targetProductName: targetProd.name,
      targetCategory: targetProd.internalCategory,
      placementSlot: newPlacementSlot,
      headline: newHeadline || `${targetProd.name} - Targeted Trader Subsidy`,
      subtext: newSubtext || `Instant manufacturer discount of KES ${newDiscountKES} per unit.`,
      badgeText: newBadgeText || `Sponsored • ${newSponsorName || targetProd.brand}`,
      discountKES: Number(newDiscountKES),
      boostScore: Number(newBoostScore),
      cpcBidKES: Number(newCpcBidKES),
      budgetKES: Number(newBudgetKES),
      spentKES: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      gmvGeneratedKES: 0,
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-10-31',
      imageUrl: targetProd.image,
      priority: placements.length + 1,
      objective: newObjective,
      incentiveMechanism: newIncentiveMechanism,
      exclusiveBadgeText: newBadgeText,
      targeting: {
        targetZones: newTargetZones,
        targetZoneNames: newTargetZones.map((z) => z.replace('zone_nairobi_', '').toUpperCase()),
        dukaTiers: newTargetTiers,
        dukaArchetypes: ['ALL'],
        behavioralCohorts: newTargetCohorts,
        incentiveMechanism: newIncentiveMechanism,
        conquestRivalBrands: rivalsList.length > 0 ? rivalsList : undefined,
      },
    };

    addPromotionalPlacement(newPlacement);
    refreshPlacements();
    setIsCreateModalOpen(false);

    // Reset form
    setNewCampaignName('');
    setNewSponsorName('');
    setNewHeadline('');
    setNewSubtext('');
  };

  // Analytics computation
  const analytics = useMemo(() => calculatePromotionsAnalytics(placements), [placements]);

  // Audience simulation computation for the interactive sandbox
  const simReach = useMemo(() => {
    return simulateAudienceReach({
      targetZones: simZones,
      targetZoneNames: simZones.map((z) => z.replace('zone_nairobi_', '').toUpperCase()),
      dukaTiers: simTiers,
      dukaArchetypes: simArchetypes,
      behavioralCohorts: simCohorts,
      incentiveMechanism: simIncentive,
    });
  }, [simZones, simTiers, simArchetypes, simCohorts, simIncentive]);

  // Selected Duka profile for Eligibility Matrix
  const selectedMatrixProfile = useMemo(() => {
    return DUKA_TARGETING_PROFILES.find((p) => p.shopId === selectedMatrixShopId) || DUKA_TARGETING_PROFILES[0];
  }, [selectedMatrixShopId]);

  // Matrix evaluations across all campaigns for the selected shop
  const dukaEvaluations = useMemo(() => {
    return placements.map((campaign) => {
      const evalResult = evaluateCampaignForShop(campaign, selectedMatrixProfile);
      return {
        campaign,
        evalResult,
      };
    });
  }, [placements, selectedMatrixProfile]);

  // Filtered placements
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const matchSlot = selectedSlotFilter === 'ALL' || p.placementSlot === selectedSlotFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;
      const matchSearch =
        !searchFilter ||
        p.campaignName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.sponsorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.targetProductName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.targetCategory.toLowerCase().includes(searchFilter.toLowerCase());
      return matchSlot && matchStatus && matchSearch;
    });
  }, [placements, selectedSlotFilter, selectedStatusFilter, searchFilter]);

  const targetProductForModal = PRODUCTS.find((p) => p.id === newTargetProductId) || PRODUCTS[0];

  return (
    <div className="space-y-4">
      {/* Header & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              <Tag className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Promotional Placement & Sponsored Ads Engine
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Live Auction & Margin Subsidies
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Coordinate FMCG manufacturer trade incentives, sponsored search boosts, hero deal banners, and checkout upsell placements across retail dukas in Nairobi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-create-campaign"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Placement Campaign</span>
          </button>
        </div>
      </div>

      {/* Console Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-1 text-xs overflow-x-auto">
        <button
          id="tab-btn-campaigns"
          onClick={() => setActiveSubTab('campaigns')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-t font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'campaigns'
              ? 'border-b-2 border-slate-900 text-slate-900 bg-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Campaigns & Placements</span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
            {placements.length}
          </span>
        </button>

        <button
          id="tab-btn-matrix"
          onClick={() => setActiveSubTab('duka_matrix')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-t font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'duka_matrix'
              ? 'border-b-2 border-slate-900 text-slate-900 bg-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-rose-600" />
          <span>Targeted Duka Eligibility Matrix</span>
          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full font-semibold">
            6 Sample Dukas
          </span>
        </button>

        <button
          id="tab-btn-simulator"
          onClick={() => setActiveSubTab('simulator')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-t font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'simulator'
              ? 'border-b-2 border-slate-900 text-slate-900 bg-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          <span>Audience Reach Simulator</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-semibold">
            Interactive
          </span>
        </button>

        <button
          id="tab-btn-conquest"
          onClick={() => setActiveSubTab('conquest')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-t font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeSubTab === 'conquest'
              ? 'border-b-2 border-slate-900 text-slate-900 bg-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5 text-amber-600" />
          <span>Brand Conquesting & Intercepts</span>
          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-semibold">
            Competitor Triggers
          </span>
        </button>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Active Placements</span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {analytics.activeCampaignsCount}
          </div>
          <span className="text-[10px] text-slate-400">of {placements.length} registered</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Targeted Reach</span>
            <Target className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {analytics.activeTargetedDukas || 540} dukas
          </div>
          <span className="text-[10px] text-rose-700 font-semibold">{analytics.targetedCampaignsCount} targeted campaigns</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Attributed GMV</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            KES {(analytics.totalGMVDrivenKES / 1000000).toFixed(2)}M
          </div>
          <span className="text-[10px] text-blue-700 font-semibold">{analytics.targetedGMVSharePercent}% from targeted</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Blended ROAS</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {analytics.overallROAS}x
          </div>
          <span className="text-[10px] text-purple-700 font-semibold">KES 20 GMV per KES 1 ad</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Duka CTR</span>
            <MousePointer className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {analytics.avgCTRPercent}%
          </div>
          <span className="text-[10px] text-slate-500">{analytics.totalClicks.toLocaleString()} duka clicks</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Conversion Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {analytics.avgConversionRatePercent}%
          </div>
          <span className="text-[10px] text-slate-500">Cart additions to order</span>
        </div>
      </div>

      {/* Sub-Views */}
      {activeSubTab === 'campaigns' && (
        <>
          {/* Placement Slots Architectural Breakdown */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Wayno Promotional Placement Inventory Architecture
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">4 Display Slots Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div 
            onClick={() => setSelectedSlotFilter('HERO_BANNER')}
            className={`p-3 rounded border cursor-pointer transition-all ${
              selectedSlotFilter === 'HERO_BANNER'
                ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-400'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Hero Deals Carousel</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold">
                Slot #1
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Top-of-catalog high-impact banner on retailer home screen with 1-click cart addition.
            </p>
            <div className="mt-2 text-[10px] text-slate-600 flex justify-between pt-1.5 border-t border-slate-200">
              <span>Avg CTR: 18.4%</span>
              <span className="font-bold text-slate-900">Highest GMV</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedSlotFilter('TOP_SEARCH_SPONSORED')}
            className={`p-3 rounded border cursor-pointer transition-all ${
              selectedSlotFilter === 'TOP_SEARCH_SPONSORED'
                ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-400'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Top-of-Search Sponsored</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                Slot #2
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Boosted rank in algorithmic search results with clear "Sponsored" disclosure & discount badge.
            </p>
            <div className="mt-2 text-[10px] text-slate-600 flex justify-between pt-1.5 border-t border-slate-200">
              <span>Avg CTR: 22.1%</span>
              <span className="font-bold text-emerald-700">+40 pts boost</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedSlotFilter('CATEGORY_FEATURED')}
            className={`p-3 rounded border cursor-pointer transition-all ${
              selectedSlotFilter === 'CATEGORY_FEATURED'
                ? 'bg-purple-50/50 border-purple-300 ring-1 ring-purple-400'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Category Header Shelf</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                Slot #3
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pinned leader card atop specific category filters (e.g., Grains, Cooking Oils, Cleaning).
            </p>
            <div className="mt-2 text-[10px] text-slate-600 flex justify-between pt-1.5 border-t border-slate-200">
              <span>Avg CTR: 14.8%</span>
              <span className="font-bold text-slate-900">High Repeat</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedSlotFilter('CHECKOUT_UPSELL')}
            className={`p-3 rounded border cursor-pointer transition-all ${
              selectedSlotFilter === 'CHECKOUT_UPSELL'
                ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Checkout Cart Upsell</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                Slot #4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Contextual add-on item in the retailer cart drawer with instant KES discount per carton.
            </p>
            <div className="mt-2 text-[10px] text-slate-600 flex justify-between pt-1.5 border-t border-slate-200">
              <span>Conv: 26.8%</span>
              <span className="font-bold text-emerald-700">Basket Lifter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Placements Table */}
      <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Slot Filter Buttons */}
          <div className="flex items-center space-x-1 border border-slate-200 rounded p-0.5 bg-slate-50">
            {['ALL', 'HERO_BANNER', 'TOP_SEARCH_SPONSORED', 'CATEGORY_FEATURED', 'CHECKOUT_UPSELL'].map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlotFilter(slot)}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  selectedSlotFilter === slot
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {slot === 'ALL'
                  ? 'All Slots'
                  : slot === 'HERO_BANNER'
                  ? 'Hero Banner'
                  : slot === 'TOP_SEARCH_SPONSORED'
                  ? 'Top Search'
                  : slot === 'CATEGORY_FEATURED'
                  ? 'Category Shelf'
                  : 'Cart Upsell'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="PAUSED">Paused Only</option>
          </select>
        </div>

        {/* Text search filter */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns, brands, SKUs..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Campaigns & Placements List */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold">
                <th className="py-2.5 px-3">Campaign & Sponsor</th>
                <th className="py-2.5 px-3">Target SKU & Category</th>
                <th className="py-2.5 px-3">Placement Slot</th>
                <th className="py-2.5 px-3">Trade Subsidy / Boost</th>
                <th className="py-2.5 px-3">Performance (Impr / Clicks)</th>
                <th className="py-2.5 px-3">Budget & Spend</th>
                <th className="py-2.5 px-3 text-right">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlacements.map((placement) => {
                const ctr = placement.impressions > 0 
                  ? ((placement.clicks / placement.impressions) * 100).toFixed(1) 
                  : '0.0';
                const spendPercent = Math.min(100, Math.round((placement.spentKES / placement.budgetKES) * 100));

                return (
                  <tr 
                    key={placement.id} 
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{placement.campaignName}</div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-700">{placement.sponsorName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          {placement.sponsorType}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 line-clamp-1 max-w-xs">
                        {placement.targetProductName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {placement.targetCategory}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        placement.placementSlot === 'HERO_BANNER'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : placement.placementSlot === 'TOP_SEARCH_SPONSORED'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : placement.placementSlot === 'CATEGORY_FEATURED'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {placement.placementSlot.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                        {placement.badgeText}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-emerald-700">
                        -KES {placement.discountKES} discount
                      </div>
                      <div className="text-[11px] text-slate-500">
                        +{placement.boostScore} pts search rank
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {placement.clicks.toLocaleString()} clicks
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          ({ctr}% CTR)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {placement.conversions} orders · KES {(placement.gmvGeneratedKES / 1000).toFixed(0)}k GMV
                      </div>
                    </td>

                    <td className="py-3 px-3 min-w-[130px]">
                      <div className="flex justify-between text-[11px] font-medium text-slate-700 mb-1">
                        <span>KES {(placement.spentKES / 1000).toFixed(1)}k</span>
                        <span className="text-slate-400">/ {(placement.budgetKES / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            spendPercent > 90 ? 'bg-amber-500' : 'bg-slate-900'
                          }`}
                          style={{ width: `${spendPercent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        CPC: KES {placement.cpcBidKES.toFixed(1)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleToggleStatus(placement.id)}
                          className={`px-2 py-1 rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                            placement.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={placement.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                        >
                          {placement.status === 'ACTIVE' ? (
                            <>
                              <Pause className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Paused</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedCampaignForDetail(placement)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Inspect Placement Detail & Preview"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

  {/* Targeted Duka Eligibility Matrix Sub-View */}
  {activeSubTab === 'duka_matrix' && (
    <DukaEligibilityMatrix
      placements={placements}
      onSelectCampaign={(p) => setSelectedCampaignForDetail(p)}
    />
  )}

  {/* Audience Reach Simulator Sub-View */}
  {activeSubTab === 'simulator' && (
    <AudienceReachSimulator
      onLaunchWithRules={(rules) => {
        setNewObjective(rules.objective);
        setNewTargetZones(rules.zones);
        setNewTargetTiers(rules.tiers);
        setNewTargetCohorts(rules.cohorts);
        setNewIncentiveMechanism(rules.incentive);
        setNewDiscountKES(rules.discountKES);
        setIsCreateModalOpen(true);
      }}
    />
  )}

  {/* Brand Conquesting Sub-View */}
  {activeSubTab === 'conquest' && (
    <BrandConquestingView
      onSelectCampaign={(p) => setSelectedCampaignForDetail(p)}
      onNavigateToShop={() => {
        if (onRefreshSearch) onRefreshSearch();
      }}
    />
  )}

  {/* Campaign Detail Modal */}
      {selectedCampaignForDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Promotional Placement Preview
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedCampaignForDetail.campaignName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCampaignForDetail(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Visual Preview of how the placement renders on the retailer screen */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Live Duka UI Preview ({selectedCampaignForDetail.placementSlot}):
              </span>
              
              <div className="border border-slate-200 rounded p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px]">
                    {selectedCampaignForDetail.badgeText}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Sponsored by {selectedCampaignForDetail.sponsorName}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  {selectedCampaignForDetail.headline}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {selectedCampaignForDetail.subtext}
                </p>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <span className="text-xs font-bold text-emerald-400">
                    Discount: -KES {selectedCampaignForDetail.discountKES} Per Unit
                  </span>
                  <span className="text-[11px] bg-white text-slate-900 px-2 py-0.5 rounded font-bold">
                    1-Click Stock Now
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Technical Specifications */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 text-[11px]">Sponsor:</span>
                <p className="font-semibold text-slate-900">{selectedCampaignForDetail.sponsorName}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Target Product:</span>
                <p className="font-semibold text-slate-900 truncate">{selectedCampaignForDetail.targetProductName}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Rank Boost:</span>
                <p className="font-semibold text-slate-900">+{selectedCampaignForDetail.boostScore} points</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">CPC Bid:</span>
                <p className="font-semibold text-slate-900">KES {selectedCampaignForDetail.cpcBidKES.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Total Spend:</span>
                <p className="font-semibold text-slate-900">
                  KES {selectedCampaignForDetail.spentKES.toLocaleString()} / {selectedCampaignForDetail.budgetKES.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px]">Attributed GMV:</span>
                <p className="font-semibold text-emerald-700">
                  KES {selectedCampaignForDetail.gmvGeneratedKES.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  handleToggleStatus(selectedCampaignForDetail.id);
                  setSelectedCampaignForDetail(null);
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                  selectedCampaignForDetail.status === 'ACTIVE'
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {selectedCampaignForDetail.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate Campaign'}
              </button>
              <button
                onClick={() => setSelectedCampaignForDetail(null)}
                className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Placement Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-xl w-full p-5 space-y-4 shadow-xl text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Create Promotional Placement Campaign
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlacement} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Pembe Maize Meal Restock Surge Q3"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sponsor Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Unga Group PLC"
                    value={newSponsorName}
                    onChange={(e) => setNewSponsorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sponsor Entity Type
                  </label>
                  <select
                    value={newSponsorType}
                    onChange={(e) => setNewSponsorType(e.target.value as SponsorType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="MANUFACTURER">Brand Manufacturer</option>
                    <option value="WHOLESALER_DEPOT">Regional Wholesaler Hub</option>
                    <option value="BRAND_AGGREGATOR">FMCG Trade Distributor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target FMCG Product (SKU)
                  </label>
                  <select
                    value={newTargetProductId}
                    onChange={(e) => setNewTargetProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Promotional Placement Slot
                  </label>
                  <select
                    value={newPlacementSlot}
                    onChange={(e) => setNewPlacementSlot(e.target.value as PromotionalSlot)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="HERO_BANNER">Hero Deals Carousel (Home)</option>
                    <option value="TOP_SEARCH_SPONSORED">Top-of-Search Sponsored Slot</option>
                    <option value="CATEGORY_FEATURED">Category Header Shelf</option>
                    <option value="CHECKOUT_UPSELL">Checkout Cart Drawer Upsell</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Headline Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Unga Group Trader Incentive: KES 120 Off"
                    value={newHeadline}
                    onChange={(e) => setNewHeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Badge / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Sponsored • Unga Group"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subtext / Value Proposition
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain the volume discount, delivery guarantee, or stock priority for retail dukas..."
                  value={newSubtext}
                  onChange={(e) => setNewSubtext(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              {/* Targeted Campaign Precision Rules */}
              <div className="p-3 bg-rose-50/50 rounded border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 text-[11px] uppercase tracking-wider flex items-center space-x-1">
                    <Target className="w-3.5 h-3.5 text-rose-600" />
                    <span>Targeted Campaign Precision Rules</span>
                  </span>
                  <span className="text-[10px] text-rose-700 font-semibold bg-rose-100 px-1.5 py-0.2 rounded">
                    Zone & Tier Gates
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Campaign Objective
                    </label>
                    <select
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value as CampaignObjective)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                    >
                      <option value="BRAND_CONQUESTING">Brand Conquesting (Intercept Rival Brand Searches)</option>
                      <option value="GEO_ZONE_SURGE">Geo-Zone Surge (Target Specific Nairobi Clusters)</option>
                      <option value="LAPSED_DUKA_WINBACK">Lapsed Duka Win-Back (Re-engage Inactive Shops)</option>
                      <option value="VOLUME_TIER_MARGIN_SHIELD">Volume Tier Margin Shield</option>
                      <option value="DEPOT_SURPLUS_CLEARANCE">Depot Clearance</option>
                      <option value="CATEGORY_CROSS_SELL">Category Cross-Sell</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Incentive Delivery Mechanism
                    </label>
                    <select
                      value={newIncentiveMechanism}
                      onChange={(e) => setNewIncentiveMechanism(e.target.value as IncentiveMechanism)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                    >
                      <option value="CASH_DISCOUNT_KES">Direct Wholesale Cash Discount (KES)</option>
                      <option value="FREE_BODA_DELIVERY">Free Boda Boda Micro-Delivery</option>
                      <option value="MPESA_CASHBACK">Instant M-Pesa Merchant Cashback</option>
                    </select>
                  </div>
                </div>

                {newObjective === 'BRAND_CONQUESTING' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Conquest Rival Brand Trigger Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Jogoo, Soko, Sunlight"
                      value={newConquestRivals}
                      onChange={(e) => setNewConquestRivals(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded px-3 py-1.5 text-slate-900 focus:outline-none focus:border-rose-400"
                    />
                  </div>
                )}
              </div>

              {/* Bidding & Economics */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Commercial Bidding & Margins
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">
                      Discount (KES)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newDiscountKES}
                      onChange={(e) => setNewDiscountKES(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">
                      Rank Boost (pts)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={newBoostScore}
                      onChange={(e) => setNewBoostScore(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">
                      CPC Bid (KES)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="0.5"
                      value={newCpcBidKES}
                      onChange={(e) => setNewCpcBidKES(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[11px] mb-0.5">
                      Total Budget (KES)
                    </label>
                    <input
                      type="number"
                      min={5000}
                      step="5000"
                      value={newBudgetKES}
                      onChange={(e) => setNewBudgetKES(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Activate Promotional Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
