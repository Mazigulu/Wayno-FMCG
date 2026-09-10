import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Users,
  Target,
  DollarSign,
  TrendingUp,
  MapPin,
  Award,
  Split,
  Percent,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Store,
  Zap,
  Truck,
  Smartphone,
  Info
} from 'lucide-react';
import {
  CampaignObjective,
  DukaTier,
  DukaArchetype,
  BehavioralCohort,
  IncentiveMechanism
} from '../types/promotions';
import {
  DUKA_TARGETING_PROFILES,
  simulateAudienceReach
} from '../data/promotionsData';

interface AudienceReachSimulatorProps {
  onLaunchWithRules?: (rules: {
    objective: CampaignObjective;
    zones: string[];
    tiers: DukaTier[];
    cohorts: BehavioralCohort[];
    incentive: IncentiveMechanism;
    discountKES: number;
  }) => void;
}

export const AudienceReachSimulator: React.FC<AudienceReachSimulatorProps> = ({
  onLaunchWithRules
}) => {
  const [objective, setObjective] = useState<CampaignObjective>('BRAND_CONQUESTING');
  const [selectedZones, setSelectedZones] = useState<string[]>([
    'zone_nairobi_east',
    'zone_nairobi_central'
  ]);
  const [selectedTiers, setSelectedTiers] = useState<DukaTier[]>(['SILVER', 'GOLD', 'PLATINUM']);
  const [selectedArchetypes, setSelectedArchetypes] = useState<DukaArchetype[]>([
    'STANDARD_DUKA',
    'MINI_MART'
  ]);
  const [selectedCohorts, setSelectedCohorts] = useState<BehavioralCohort[]>([
    'HIGH_VELOCITY_STAPLES',
    'MARGIN_SEEKERS'
  ]);
  const [incentive, setIncentive] = useState<IncentiveMechanism>('CASH_DISCOUNT_KES');
  const [discountKES, setDiscountKES] = useState<number>(120);

  // Available options
  const allZones = [
    { id: 'zone_nairobi_east', name: 'Nairobi East (Eastleigh, Kariobangi)' },
    { id: 'zone_nairobi_central', name: 'Nairobi Central (Gikomba, CBD Fringe)' },
    { id: 'zone_nairobi_west', name: 'Nairobi West (Kawangware, Dagoretti)' },
    { id: 'zone_nairobi_north', name: 'Nairobi North (Dandora, Kasarani)' },
    { id: 'zone_nairobi_south', name: 'Nairobi South (Kibera, Industrial Area)' },
  ];

  const allTiers: DukaTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

  const allCohorts: { id: BehavioralCohort; label: string }[] = [
    { id: 'HIGH_VELOCITY_STAPLES', label: 'High Velocity Staples (Maize, Flour, Oil)' },
    { id: 'LAPSED_RESTOCKERS', label: 'Lapsed Restockers (>7 days inactive)' },
    { id: 'MARGIN_SEEKERS', label: 'Margin Seekers (Deal sensitive)' },
    { id: 'FREQUENT_MPESA_USERS', label: 'M-Pesa Frequent Payers' },
    { id: 'NEW_DUKAS', label: 'New Dukas (<30 days onboarded)' },
  ];

  const toggleZone = (zoneId: string) => {
    setSelectedZones((prev) =>
      prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]
    );
  };

  const toggleTier = (tier: DukaTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const toggleCohort = (cohort: BehavioralCohort) => {
    setSelectedCohorts((prev) =>
      prev.includes(cohort) ? prev.filter((c) => c !== cohort) : [...prev, cohort]
    );
  };

  // Run real-time simulation
  const simReach = useMemo(() => {
    return simulateAudienceReach({
      targetZones: selectedZones,
      targetZoneNames: selectedZones.map((z) => z.replace('zone_nairobi_', '').toUpperCase()),
      dukaTiers: selectedTiers,
      dukaArchetypes: selectedArchetypes,
      behavioralCohorts: selectedCohorts,
      minOrderValueKES: 1000,
      incentiveMechanism: incentive,
    });
  }, [selectedZones, selectedTiers, selectedArchetypes, selectedCohorts, incentive]);

  const sampleMatchingDukas = useMemo(() => {
    return DUKA_TARGETING_PROFILES.filter((p) => simReach.matchingShopIds.includes(p.shopId));
  }, [simReach.matchingShopIds]);

  // A/B Elasticity Projections
  const variantA = useMemo(() => {
    const conversionRate = Math.min(42, 18 + (discountKES / 100) * 8);
    const estimatedWeeklyOrders = Math.round(simReach.matchedDukasCount * (conversionRate / 100) * 1.8);
    const estimatedWeeklyGMV = estimatedWeeklyOrders * 3200;
    const weeklySpend = estimatedWeeklyOrders * discountKES;
    return {
      discount: discountKES,
      conversionRate: conversionRate.toFixed(1),
      weeklyOrders: estimatedWeeklyOrders,
      weeklyGMV: estimatedWeeklyGMV,
      weeklySpend,
      roas: (estimatedWeeklyGMV / Math.max(1, weeklySpend)).toFixed(1)
    };
  }, [discountKES, simReach.matchedDukasCount]);

  const variantB = useMemo(() => {
    const discountB = discountKES + 40;
    const conversionRate = Math.min(48, 18 + (discountB / 100) * 8.5);
    const estimatedWeeklyOrders = Math.round(simReach.matchedDukasCount * (conversionRate / 100) * 2.2);
    const estimatedWeeklyGMV = estimatedWeeklyOrders * 3400;
    const weeklySpend = estimatedWeeklyOrders * discountB;
    return {
      discount: discountB,
      conversionRate: conversionRate.toFixed(1),
      weeklyOrders: estimatedWeeklyOrders,
      weeklyGMV: estimatedWeeklyGMV,
      weeklySpend,
      roas: (estimatedWeeklyGMV / Math.max(1, weeklySpend)).toFixed(1)
    };
  }, [discountKES, simReach.matchedDukasCount]);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Audience Reach & Campaign Elasticity Simulator
              </h3>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Predictive Trade Modeling
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Model addressable retail dukas, projected GMV reach, and conversion elasticity before committing manufacturer trade spend to promotional placements.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (onLaunchWithRules) {
                  onLaunchWithRules({
                    objective,
                    zones: selectedZones,
                    tiers: selectedTiers,
                    cohorts: selectedCohorts,
                    incentive,
                    discountKES
                  });
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              <span>Deploy Targeting Rule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Controls (Left) & Real-Time Projections (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Targeting Parameter Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Targeting Parameters Sandbox
              </span>
              <span className="text-[10px] text-slate-400">540 Retail Dukas in Pool</span>
            </div>

            {/* Campaign Objective */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Strategic Campaign Objective
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as CampaignObjective)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
              >
                <option value="BRAND_CONQUESTING">Brand Conquesting (Intercept Rival Brand Searches)</option>
                <option value="GEO_ZONE_SURGE">Geo-Zone Surge (Target Specific Nairobi Clusters)</option>
                <option value="LAPSED_DUKA_WINBACK">Lapsed Duka Win-Back (Re-engage Inactive Shops)</option>
                <option value="VOLUME_TIER_MARGIN_SHIELD">Volume Tier Margin Shield (Protect High-GMV Traders)</option>
                <option value="DEPOT_SURPLUS_CLEARANCE">Depot Clearance (Clear Regional Warehouse Batches)</option>
                <option value="CATEGORY_CROSS_SELL">Category Cross-Sell (Attach Cleaners to Flour Orders)</option>
              </select>
            </div>

            {/* Geographic Zones Multi-Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Target Geographic Zones</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {selectedZones.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {allZones.map((z) => {
                  const isChecked = selectedZones.includes(z.id);
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => toggleZone(z.id)}
                      className={`p-2 rounded border text-left cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-rose-50/70 border-rose-300 text-rose-900 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-[11px] truncate">{z.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duka Tiers Multi-Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target Duka Volume Tiers</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {selectedTiers.join(', ')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {allTiers.map((tier) => {
                  const isChecked = selectedTiers.includes(tier);
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => toggleTier(tier)}
                      className={`py-1.5 px-2 rounded border text-center font-bold text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Behavioral Cohorts Multi-Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  <span>Behavioral & Order Cohorts</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {selectedCohorts.length} active
                </span>
              </div>
              <div className="space-y-1.5">
                {allCohorts.map((cohort) => {
                  const isChecked = selectedCohorts.includes(cohort.id);
                  return (
                    <button
                      key={cohort.id}
                      type="button"
                      onClick={() => toggleCohort(cohort.id)}
                      className={`w-full p-2 rounded border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-blue-50/60 border-blue-300 text-blue-900 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="w-2.5 h-2.5" />}
                        </div>
                        <span className="text-[11px]">{cohort.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cohort.id === 'HIGH_VELOCITY_STAPLES' ? '72% dukas' : '28% dukas'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Incentive Mechanism & Subsidy Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Incentive Mechanism
                </label>
                <select
                  value={incentive}
                  onChange={(e) => setIncentive(e.target.value as IncentiveMechanism)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
                >
                  <option value="CASH_DISCOUNT_KES">Direct Cash Discount (KES)</option>
                  <option value="FREE_BODA_DELIVERY">Free Boda Boda Micro-Delivery</option>
                  <option value="MPESA_CASHBACK">Instant M-Pesa Trader Cashback</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Subsidy Value (KES):
                  </label>
                  <span className="font-mono font-bold text-emerald-700">
                    KES {discountKES}
                  </span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={300}
                  step={10}
                  value={discountKES}
                  onChange={(e) => setDiscountKES(Number(e.target.value))}
                  className="w-full cursor-pointer accent-slate-900"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>KES 40 (Low)</span>
                  <span>KES 120 (Standard)</span>
                  <span>KES 300 (Aggressive)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Projection & A/B Elasticity Split (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Reach Projection Card */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-md p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Simulated Target Reach</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                Real-time
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/80 rounded p-2.5 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Addressable Dukas</span>
                <span className="text-xl font-bold font-mono text-white">
                  {simReach.matchedDukasCount}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  {((simReach.matchedDukasCount / 540) * 100).toFixed(0)}% of network
                </span>
              </div>

              <div className="bg-slate-800/80 rounded p-2.5 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Reachable Monthly GMV</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  KES {(simReach.totalReachableGMV / 1000000).toFixed(2)}M
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Wholesale flow
                </span>
              </div>

              <div className="bg-slate-800/80 rounded p-2.5 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Est. Weekly Impressions</span>
                <span className="text-xl font-bold font-mono text-white">
                  {simReach.estimatedImpressionsWeekly.toLocaleString()}
                </span>
                <span className="text-[10px] text-blue-400 block mt-0.5">
                  In-app view slots
                </span>
              </div>

              <div className="bg-slate-800/80 rounded p-2.5 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Avg Duka GMV</span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  KES {(simReach.avgDukaGmv / 1000).toFixed(0)}k
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Per retail shop
                </span>
              </div>
            </div>

            {/* Sample matching shops */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                Sample Qualifying Shops in Network:
              </span>
              <div className="space-y-1">
                {sampleMatchingDukas.slice(0, 3).map((shop) => (
                  <div
                    key={shop.shopId}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/50 text-slate-300"
                  >
                    <span className="font-medium text-white truncate max-w-[140px]">
                      {shop.shopName}
                    </span>
                    <div className="flex items-center space-x-1.5 text-[10px]">
                      <span className="font-mono text-amber-300">{shop.tier}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{shop.zoneName.replace('Nairobi ', '')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* A/B Elasticity Split Experiment Preview */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Split className="w-3.5 h-3.5 text-purple-600" />
                <span>A/B Subsidy Elasticity Split Test</span>
              </span>
              <span className="text-[10px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-bold border border-purple-200">
                50 / 50 Traffic Split
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Compare trade conversion rate and GMV return across two subsidy price points before full rollout:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Variant A */}
              <div className="p-3 rounded border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Variant A</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                    Control
                  </span>
                </div>
                <div className="mt-2 text-base font-bold text-emerald-700">
                  -KES {variantA.discount} rebate
                </div>
                <div className="mt-1 space-y-0.5 text-[10px] text-slate-600">
                  <div>Conv Rate: <span className="font-bold text-slate-900">{variantA.conversionRate}%</span></div>
                  <div>Est Weekly Orders: <span className="font-bold text-slate-900">{variantA.weeklyOrders}</span></div>
                  <div>Weekly GMV: <span className="font-bold text-slate-900">KES {(variantA.weeklyGMV / 1000).toFixed(0)}k</span></div>
                  <div>Projected ROAS: <span className="font-bold text-emerald-700">{variantA.roas}x</span></div>
                </div>
              </div>

              {/* Variant B */}
              <div className="p-3 rounded border border-purple-200 bg-purple-50/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">Variant B</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900">
                    Aggressive
                  </span>
                </div>
                <div className="mt-2 text-base font-bold text-purple-700">
                  -KES {variantB.discount} rebate
                </div>
                <div className="mt-1 space-y-0.5 text-[10px] text-slate-600">
                  <div>Conv Rate: <span className="font-bold text-purple-900">{variantB.conversionRate}%</span></div>
                  <div>Est Weekly Orders: <span className="font-bold text-purple-900">{variantB.weeklyOrders}</span></div>
                  <div>Weekly GMV: <span className="font-bold text-purple-900">KES {(variantB.weeklyGMV / 1000).toFixed(0)}k</span></div>
                  <div>Projected ROAS: <span className="font-bold text-emerald-700">{variantB.roas}x</span></div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Predicted Variant B Uplift:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +{(Number(variantB.conversionRate) - Number(variantA.conversionRate)).toFixed(1)}% Conversion Lift
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
