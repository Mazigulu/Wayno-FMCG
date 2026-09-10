import React, { useState, useMemo } from 'react';
import {
  Store,
  MapPin,
  Award,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Tag,
  Crosshair,
  Building2,
  Zap,
  Truck,
  Smartphone,
  Info,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { 
  PromotionalPlacement, 
  DukaTargetingProfile 
} from '../types/promotions';
import { 
  DUKA_TARGETING_PROFILES, 
  evaluateCampaignForShop 
} from '../data/promotionsData';

interface DukaEligibilityMatrixProps {
  placements: PromotionalPlacement[];
  onSelectCampaign?: (placement: PromotionalPlacement) => void;
}

export const DukaEligibilityMatrix: React.FC<DukaEligibilityMatrixProps> = ({
  placements,
  onSelectCampaign
}) => {
  const [selectedShopId, setSelectedShopId] = useState<string>(DUKA_TARGETING_PROFILES[0].shopId);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [eligibilityFilter, setEligibilityFilter] = useState<'ALL' | 'ELIGIBLE' | 'EXCLUDED'>('ALL');

  const selectedProfile = useMemo(() => {
    return DUKA_TARGETING_PROFILES.find((p) => p.shopId === selectedShopId) || DUKA_TARGETING_PROFILES[0];
  }, [selectedShopId]);

  // Evaluate all campaigns for the selected shop
  const evaluations = useMemo(() => {
    return placements.map((campaign) => {
      const evalResult = evaluateCampaignForShop(campaign, selectedProfile);
      return {
        campaign,
        evalResult,
      };
    });
  }, [placements, selectedProfile]);

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(({ campaign, evalResult }) => {
      if (eligibilityFilter === 'ELIGIBLE' && !evalResult.isEligible) return false;
      if (eligibilityFilter === 'EXCLUDED' && evalResult.isEligible) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchName = campaign.campaignName.toLowerCase().includes(q);
        const matchSponsor = campaign.sponsorName.toLowerCase().includes(q);
        const matchSku = campaign.targetProductName.toLowerCase().includes(q);
        return matchName || matchSponsor || matchSku;
      }
      return true;
    });
  }, [evaluations, eligibilityFilter, searchFilter]);

  const eligibleCount = evaluations.filter((e) => e.evalResult.isEligible).length;

  return (
    <div className="space-y-4">
      {/* Intro Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                <Store className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Targeted Duka Eligibility Matrix
              </h3>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                Real-Time Rules Evaluation
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Inspect how manufacturer promotions, regional subsidies, and brand conquesting campaigns match individual dukas based on geographic zones, purchase volume tiers, and behavioral cohorts.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Qualified Deals for Selected Shop:</span>
            <span className="font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              {eligibleCount} / {placements.length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Duka Selector Strip */}
      <div className="bg-white border border-slate-200 rounded-md p-3 shadow-2xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Select Simulated Retail Duka to Test Targeting:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 text-xs">
          {DUKA_TARGETING_PROFILES.map((shop) => {
            const isSelected = shop.shopId === selectedShopId;
            const tierColor =
              shop.tier === 'PLATINUM'
                ? 'bg-purple-100 text-purple-900 border-purple-200'
                : shop.tier === 'GOLD'
                ? 'bg-amber-100 text-amber-900 border-amber-200'
                : shop.tier === 'SILVER'
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-orange-100 text-orange-900 border-orange-200';

            return (
              <button
                key={shop.shopId}
                onClick={() => setSelectedShopId(shop.shopId)}
                className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/20 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    isSelected ? 'bg-white/20 text-white border-white/30' : tierColor
                  }`}>
                    {shop.tier}
                  </span>
                  <span className={`text-[10px] font-medium truncate ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {shop.zoneName.replace('Nairobi ', '')}
                  </span>
                </div>

                <div className="font-bold text-xs mt-1.5 truncate">
                  {shop.shopName}
                </div>
                <div className={`text-[11px] truncate ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {shop.ownerName}
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[10px]">
                  <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>GMV/Mo:</span>
                  <span className="font-mono font-bold">
                    KES {(shop.monthlyGmvKES / 1000).toFixed(0)}k
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Duka Profile Inspector Card */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-md p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Shop identity */}
          <div>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <Store className="w-3.5 h-3.5 text-rose-400" />
              <span>Duka Identity</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {selectedProfile.shopName}
            </div>
            <div className="text-slate-300 text-xs mt-0.5">
              Proprietor: <span className="font-semibold text-white">{selectedProfile.ownerName}</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {selectedProfile.tier} Tier
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {selectedProfile.archetype.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Location & Depot */}
          <div>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Location & Zone</span>
            </div>
            <div className="font-semibold text-white mt-1">
              {selectedProfile.zoneName}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Address: {selectedProfile.address}
            </div>
            <div className="text-[10px] text-slate-400 mt-2 font-mono">
              Phone: {selectedProfile.phone}
            </div>
          </div>

          {/* Economics & Restock cadence */}
          <div>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              <span>Duka Financials & Cadence</span>
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
              KES {selectedProfile.monthlyGmvKES.toLocaleString()} / mo
            </div>
            <div className="text-slate-300 text-xs mt-0.5">
              Orders/Month: {selectedProfile.ordersThisMonth} (Avg: KES {selectedProfile.avgOrderValueKES.toLocaleString()})
            </div>
            <div className="mt-2 text-[10px]">
              {selectedProfile.lastOrderDaysAgo > 6 ? (
                <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Lapsed Alert: {selectedProfile.lastOrderDaysAgo} days inactive
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Trader ({selectedProfile.lastOrderDaysAgo}d ago)
                </span>
              )}
            </div>
          </div>

          {/* Behavioral cohorts */}
          <div>
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Assigned Behavioral Cohorts</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {selectedProfile.cohorts.map((cohort) => (
                <span
                  key={cohort}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700"
                >
                  {cohort.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 mt-2">
              Frequent Brands: {selectedProfile.favoriteBrands.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Evaluation Table Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">Filter Placements:</span>
          <div className="flex items-center space-x-1 border border-slate-200 rounded p-0.5 bg-slate-50">
            <button
              onClick={() => setEligibilityFilter('ALL')}
              className={`px-2 py-1 rounded text-xs cursor-pointer ${
                eligibilityFilter === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              All ({evaluations.length})
            </button>
            <button
              onClick={() => setEligibilityFilter('ELIGIBLE')}
              className={`px-2 py-1 rounded text-xs cursor-pointer ${
                eligibilityFilter === 'ELIGIBLE'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-emerald-700 font-medium'
              }`}
            >
              Eligible ({eligibleCount})
            </button>
            <button
              onClick={() => setEligibilityFilter('EXCLUDED')}
              className={`px-2 py-1 rounded text-xs cursor-pointer ${
                eligibilityFilter === 'EXCLUDED'
                  ? 'bg-rose-600 text-white font-bold shadow-2xs'
                  : 'text-rose-700 font-medium'
              }`}
            >
              Excluded ({evaluations.length - eligibleCount})
            </button>
          </div>
        </div>

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

      {/* Campaign Qualifications Grid */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold">
                <th className="py-2.5 px-3">Campaign & FMCG Sponsor</th>
                <th className="py-2.5 px-3">Target SKU & Slot</th>
                <th className="py-2.5 px-3">Targeting Objective</th>
                <th className="py-2.5 px-3">Shop Eligibility Status</th>
                <th className="py-2.5 px-3">Applied Trader Incentive</th>
                <th className="py-2.5 px-3">Targeting Diagnostic Rule</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvaluations.map(({ campaign, evalResult }) => {
                const isConquest = campaign.objective === 'BRAND_CONQUESTING';
                const hasConquestTrigger = evalResult.isConquestMatch;

                return (
                  <tr
                    key={campaign.id}
                    className={`transition-colors ${
                      evalResult.isEligible
                        ? 'hover:bg-emerald-50/40 bg-emerald-50/10'
                        : 'hover:bg-slate-50/60 opacity-80'
                    }`}
                  >
                    {/* Campaign & Sponsor */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {campaign.campaignName}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-700">{campaign.sponsorName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          {campaign.sponsorType}
                        </span>
                      </div>
                    </td>

                    {/* Target SKU */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 line-clamp-1 max-w-xs">
                        {campaign.targetProductName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Slot: <span className="font-semibold text-slate-700">{campaign.placementSlot.replace(/_/g, ' ')}</span>
                      </div>
                    </td>

                    {/* Objective */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        campaign.objective === 'BRAND_CONQUESTING'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : campaign.objective === 'LAPSED_DUKA_WINBACK'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : campaign.objective === 'GEO_ZONE_SURGE'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {campaign.objective === 'BRAND_CONQUESTING' && <Crosshair className="w-2.5 h-2.5" />}
                        {campaign.objective === 'GEO_ZONE_SURGE' && <MapPin className="w-2.5 h-2.5" />}
                        {campaign.objective === 'LAPSED_DUKA_WINBACK' && <Zap className="w-2.5 h-2.5" />}
                        <span>{campaign.objective?.replace(/_/g, ' ') || 'STANDARD_PROMO'}</span>
                      </span>
                    </td>

                    {/* Eligibility Status */}
                    <td className="py-3 px-3">
                      {evalResult.isEligible ? (
                        <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>ELIGIBLE</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>EXCLUDED</span>
                        </div>
                      )}
                    </td>

                    {/* Applied Trader Incentive */}
                    <td className="py-3 px-3">
                      {evalResult.isEligible ? (
                        <div>
                          <div className="font-bold text-emerald-700">
                            -KES {evalResult.appliedDiscount} per unit
                          </div>
                          <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-0.5">
                            {campaign.incentiveMechanism === 'FREE_BODA_DELIVERY' ? (
                              <>
                                <Truck className="w-3 h-3 text-emerald-600" />
                                <span className="font-semibold text-emerald-700">Free Boda Delivery</span>
                              </>
                            ) : campaign.incentiveMechanism === 'MPESA_CASHBACK' ? (
                              <>
                                <Smartphone className="w-3 h-3 text-emerald-600" />
                                <span className="font-semibold text-emerald-700">M-Pesa Cashback</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-3 h-3 text-emerald-600" />
                                <span>Wholesale Cash Rebate</span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No subsidy applied</span>
                      )}
                    </td>

                    {/* Targeting Diagnostic Rule */}
                    <td className="py-3 px-3 max-w-sm">
                      <div className="text-[11px] text-slate-700 font-medium">
                        {evalResult.reason}
                      </div>

                      {isConquest && (
                        <div className="mt-1 flex items-center space-x-1 text-[10px] bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                          <Crosshair className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>
                            Conquest Active: Intercepts when duka searches "Jogoo", "Soko"
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectCampaign && onSelectCampaign(campaign)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
