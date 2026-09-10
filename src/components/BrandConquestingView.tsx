import React, { useState } from 'react';
import {
  Crosshair,
  TrendingUp,
  Search,
  Building2,
  Tag,
  DollarSign,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Store,
  AlertCircle,
  Info
} from 'lucide-react';
import { PRODUCTS } from '../data/mockData';
import { executeWaynoSearch } from '../services/searchEngine';
import { PromotionalPlacement } from '../types/promotions';

interface BrandConquestingViewProps {
  onSelectCampaign?: (placement: PromotionalPlacement) => void;
  onNavigateToShop?: () => void;
}

export const BrandConquestingView: React.FC<BrandConquestingViewProps> = ({
  onSelectCampaign,
  onNavigateToShop
}) => {
  const [testQuery, setTestQuery] = useState('jogoo');
  const [activeDukaZone, setActiveDukaZone] = useState('zone_nairobi_east');

  // Competitive Intercept Pairs
  const conquestPairs = [
    {
      id: 'conquest_pembe_jogoo',
      rivalBrand: 'Jogoo / Soko Maize Flour',
      rivalCategory: 'Grains & Flours',
      interceptProduct: PRODUCTS.find((p) => p.id === 'prod_pembe_flour_2kg') || PRODUCTS[1],
      sponsor: 'Unga Group PLC',
      subsidy: 'KES 120 Rebate per bale',
      incentiveType: 'Cash Rebate',
      interceptCTR: '31.4%',
      conversionsMonthly: 420,
      marginDifference: '+7.8% extra profit',
      status: 'ACTIVE_CONQUEST',
      targetZones: ['Nairobi East (Eastleigh)', 'Nairobi Central (Gikomba)'],
    },
    {
      id: 'conquest_menengai_sunlight',
      rivalBrand: 'Sunlight / Omo Bar Soap',
      rivalCategory: 'Household Cleaning',
      interceptProduct: PRODUCTS.find((p) => p.id === 'prod_menengai_cream_bar') || PRODUCTS[4],
      sponsor: 'Menengai Oil Refineries',
      subsidy: 'Free Boda Delivery (Nairobi North & East)',
      incentiveType: 'Logistics Subsidy',
      interceptCTR: '24.8%',
      conversionsMonthly: 195,
      marginDifference: '+12.4% extra profit (zero freight)',
      status: 'ACTIVE_CONQUEST',
      targetZones: ['Nairobi North (Dandora)', 'Nairobi East (Eastleigh)'],
    }
  ];

  // Execute live search simulation
  const searchResults = executeWaynoSearch(testQuery, {
    shopId: 'shop_001',
  });

  const interceptedItem = searchResults.results.find(
    (item) => item.conquestMatch || item.isTargetedPromotion || !!item.promotedBy
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                <Crosshair className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Brand Conquesting & Competitive Intercept Engine
              </h3>
              <span className="text-[10px] font-semibold bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                Rival Keyword Bidding
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Brand Conquesting monitors retailer searches for competitor brands and delivers manufacturer-subsidized alternative SKUs with instant margin advantage and sponsored placement badges.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Live Intercept Rate:</span>
            <span className="font-bold font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-900">
              28.6% of Rival Searches Converted
            </span>
          </div>
        </div>
      </div>

      {/* Conquest Architecture Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {conquestPairs.map((pair) => (
          <div
            key={pair.id}
            className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <span className="p-1 rounded bg-rose-100 text-rose-800">
                  <Crosshair className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-900 text-xs">
                  Target Rival: {pair.rivalBrand}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live Intercept Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Intercepting SKU
                </span>
                <div className="font-bold text-slate-900 mt-0.5 line-clamp-1">
                  {pair.interceptProduct.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sponsor: <span className="font-semibold text-slate-700">{pair.sponsor}</span>
                </div>
              </div>

              <div className="bg-emerald-50/60 p-2.5 rounded border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                  Manufacturer Trade Subsidy
                </span>
                <div className="font-bold text-emerald-800 mt-0.5">
                  {pair.subsidy}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5 font-semibold">
                  Retailer Margin: {pair.marginDifference}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <div className="text-slate-500">
                Intercept Conversion: <span className="font-bold text-slate-900">{pair.interceptCTR}</span>
              </div>
              <div className="text-slate-500">
                Monthly Switched Orders: <span className="font-bold text-slate-900">{pair.conversionsMonthly} units</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
              <span className="font-semibold text-slate-600">Active Zones:</span>
              <span>{pair.targetZones.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Conquest Search Sandbox */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Interactive Conquest Search Simulator</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Type a rival brand name to simulate how the Wayno search engine intercepts retailer queries with subsidized alternatives.
            </p>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-500">Sample Rival Triggers:</span>
            {['jogoo', 'soko', 'sunlight', 'pembe'].map((k) => (
              <button
                key={k}
                onClick={() => setTestQuery(k)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  testQuery.toLowerCase() === k
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Type rival brand: 'jogoo', 'soko', 'sunlight'..."
            className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-24 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-medium"
          />
          <div className="absolute right-2 top-1.5">
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded font-mono font-bold">
              {searchResults.totalHits} Results
            </span>
          </div>
        </div>

        {/* Intercept Result Card */}
        {interceptedItem ? (
          <div className="p-3.5 rounded-md border-2 border-rose-300 bg-rose-50/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Crosshair className="w-3 h-3" />
                  <span>Conquest Intercept Triggered</span>
                </span>
                <span className="text-[11px] font-semibold text-rose-900">
                  {interceptedItem.promoBadge || interceptedItem.targetedBadgeText || 'Sponsored Alternative'}
                </span>
              </div>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                Rank Boost: +40 pts
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded border border-rose-200">
              <div className="flex items-center space-x-3">
                <img
                  src={interceptedItem.product.image}
                  alt={interceptedItem.product.name}
                  className="w-12 h-12 rounded object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {interceptedItem.product.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Manufacturer: {interceptedItem.product.manufacturer} ({interceptedItem.product.brand})
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Manufacturer rebate of KES {interceptedItem.promoDiscountKES || 120} applied</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 line-through">
                    KES {interceptedItem.bestSupplierProduct.price}
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    KES {interceptedItem.bestSupplierProduct.price - (interceptedItem.promoDiscountKES || 120)}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    -KES {interceptedItem.promoDiscountKES || 120} Off
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToShop && onNavigateToShop()}
                  className="px-3 py-1.5 rounded bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                >
                  View in Retailer App
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">Why was this intercepted?</span> The duka searched for "{testQuery}", matching the rival brand conquest rule funded by Unga Group PLC. Pembe is injected at Rank #1 with a trader incentive of KES 120 per unit.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              No active conquest intercept for query "{testQuery}". Try typing <span className="font-bold text-slate-900 font-mono">jogoo</span>, <span className="font-bold text-slate-900 font-mono">soko</span>, or <span className="font-bold text-slate-900 font-mono">sunlight</span> to see a competitor brand conquest trigger.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
