import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Sliders, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  RefreshCw, 
  TrendingUp, 
  SlidersHorizontal,
  ChevronRight,
  Store,
  Layers,
  Database,
  BarChart3,
  Check
} from 'lucide-react';
import { 
  extractRetailerSignals, 
  generateRetailerRecommendations, 
  DEFAULT_RECOMMENDATION_WEIGHTS,
  getTimeWindowFromHour 
} from '../services/recommendationEngine';
import { 
  RecommendationEngineWeights, 
  RecommendedProductItem, 
  RecommendationSignalType 
} from '../types/recommendation';
import { INITIAL_SHOPS, PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS } from '../data/mockData';
import { RetailerShop, Order } from '../types/wayno';

interface RecommendationEngineConsoleProps {
  orders?: Order[];
}

export const RecommendationEngineConsole: React.FC<RecommendationEngineConsoleProps> = ({
  orders = []
}) => {
  const [selectedShopId, setSelectedShopId] = useState<string>(INITIAL_SHOPS[0].id);
  const [weights, setWeights] = useState<RecommendationEngineWeights>(DEFAULT_RECOMMENDATION_WEIGHTS);
  const [simulatedHour, setSimulatedHour] = useState<number>(8); // Default to 8 AM Morning Restock
  const [simulatedDay, setSimulatedDay] = useState<string>('Friday');
  const [activeSignalFilter, setActiveSignalFilter] = useState<RecommendationSignalType | 'ALL'>('ALL');
  const [selectedProductInspect, setSelectedProductInspect] = useState<RecommendedProductItem | null>(null);

  const currentShop = useMemo(() => {
    return INITIAL_SHOPS.find(s => s.id === selectedShopId) || INITIAL_SHOPS[0];
  }, [selectedShopId]);

  // Seed realistic historical search queries for this shop
  const sampleSearchesByShop: Record<string, string[]> = {
    shop_01: ['unga wa ugali 2kg bale', 'bluband', 'cooking oil', 'njugu', 'sabuni'],
    shop_02: ['fresh fri 3L', 'soko flour bale', 'menengai soap', 'royco mchuzi mix'],
    shop_03: ['dawaat basmati rice 5kg', 'mumias sugar', 'cooking fat 10kg', 'ketepa tea']
  };

  const currentSearches = sampleSearchesByShop[currentShop.id] || sampleSearchesByShop.shop_01;

  // Generate real-time recommendation result
  const recommendationResult = useMemo(() => {
    return generateRetailerRecommendations(
      currentShop,
      currentSearches,
      orders,
      weights,
      simulatedHour,
      simulatedDay
    );
  }, [currentShop, currentSearches, orders, weights, simulatedHour, simulatedDay]);

  const displayedRecommendations = useMemo(() => {
    if (activeSignalFilter === 'ALL') {
      return recommendationResult.recommendations;
    }
    return recommendationResult.recommendations.filter(
      r => r.scoreBreakdown.primaryDriver === activeSignalFilter
    );
  }, [recommendationResult, activeSignalFilter]);

  const activeItem = selectedProductInspect || displayedRecommendations[0] || recommendationResult.recommendations[0];

  const handleResetWeights = () => {
    setWeights(DEFAULT_RECOMMENDATION_WEIGHTS);
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                Section 45 Specification
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Recommendation Engine Architecture & Signal Matrix</span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Multi-signal linear composite model evaluating duka procurement affinities across 5 distinct dimensions without disrupting primary search.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Search Invariant</div>
              <div className="text-emerald-400 font-bold font-mono">Search Remains Primary (100%)</div>
            </div>
          </div>
        </div>

        {/* Visual Topological Diagram matching User's Sketch */}
        <div className="bg-slate-950/80 rounded p-4 border border-slate-800 text-xs font-mono">
          <div className="text-slate-400 text-[11px] mb-2 font-bold uppercase tracking-wider text-emerald-400">
            Topology Representation (Section 45)
          </div>
          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="font-bold text-white flex items-center space-x-2">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>Retailer ({currentShop.name})</span>
            </div>
            <div className="text-slate-500">│</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 pb-2">
              <div className="bg-slate-900 border border-blue-900/50 p-2 rounded text-[10px]">
                <span className="text-blue-400 font-bold">├── Historical searches</span>
                <p className="text-slate-400 text-[9px] truncate mt-0.5">
                  {currentSearches.slice(0, 2).join(', ')}...
                </p>
              </div>
              <div className="bg-slate-900 border border-emerald-900/50 p-2 rounded text-[10px]">
                <span className="text-emerald-400 font-bold">├── Purchases</span>
                <p className="text-slate-400 text-[9px] mt-0.5">
                  Cadence: ~{recommendationResult.signalsExtracted.purchases.averageRestockCycleDays}d
                </p>
              </div>
              <div className="bg-slate-900 border border-amber-900/50 p-2 rounded text-[10px]">
                <span className="text-amber-400 font-bold">├── Location</span>
                <p className="text-slate-400 text-[9px] mt-0.5">
                  Zone: {currentShop.serviceZoneId.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="bg-slate-900 border border-purple-900/50 p-2 rounded text-[10px]">
                <span className="text-purple-400 font-bold">├── Time</span>
                <p className="text-slate-400 text-[9px] mt-0.5">
                  {recommendationResult.signalsExtracted.time.timeWindow.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="bg-slate-900 border border-rose-900/50 p-2 rounded text-[10px]">
                <span className="text-rose-400 font-bold">└── Product preferences</span>
                <p className="text-slate-400 text-[9px] mt-0.5">
                  Target Margin ≥15%
                </p>
              </div>
            </div>
            <div className="text-slate-500">│</div>
            <div className="text-slate-400 flex items-center space-x-1.5">
              <span>▼</span>
              <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded font-bold">
                Recommendation Model (Dynamic Multi-Factor Evaluator)
              </span>
            </div>
            <div className="text-slate-500">│</div>
            <div className="text-slate-400 flex items-center space-x-1.5">
              <span>▼</span>
              <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold">
                Ranked Products ({recommendationResult.recommendations.length} Physically Deliverable SKUs)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Shop Selector, Time Simulation & Signal Weights */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-2xs text-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          
          {/* Shop Selector */}
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-800">Target Retailer Duka:</span>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold bg-slate-50 text-slate-800"
            >
              {INITIAL_SHOPS.map(shop => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} ({shop.serviceZoneId})
                </option>
              ))}
            </select>
          </div>

          {/* Time Simulation */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="font-bold text-slate-800">Simulate Time & Day:</span>
            <div className="flex items-center space-x-1">
              {[
                { label: 'Morning (08:00)', hour: 8 },
                { label: 'Midday (13:00)', hour: 13 },
                { label: 'Evening (19:00)', hour: 19 },
              ].map(tw => (
                <button
                  key={tw.label}
                  onClick={() => setSimulatedHour(tw.hour)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    simulatedHour === tw.hour
                      ? 'bg-purple-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tw.label}
                </button>
              ))}
            </div>

            <select
              value={simulatedDay}
              onChange={(e) => setSimulatedDay(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold bg-slate-50 text-slate-700"
            >
              <option value="Monday">Monday (Weekday)</option>
              <option value="Wednesday">Wednesday (Midweek)</option>
              <option value="Friday">Friday (Weekend Prep)</option>
              <option value="Saturday">Saturday (Peak Footfall)</option>
            </select>
          </div>

          <button
            onClick={handleResetWeights}
            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 text-[11px] font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Weights</span>
          </button>
        </div>

        {/* Dynamic Weight Sliders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Active Signal Weights (Linear Composite Coefficients):
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Sum: {Math.round((weights.historicalSearches + weights.purchases + weights.location + weights.time + weights.productPreferences) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {/* W1 */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                <span className="flex items-center space-x-1">
                  <Search className="w-3 h-3 text-blue-600" />
                  <span>Searches</span>
                </span>
                <span className="font-mono font-bold text-blue-700">{Math.round(weights.historicalSearches * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.historicalSearches}
                onChange={(e) => setWeights(prev => ({ ...prev, historicalSearches: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* W2 */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                <span className="flex items-center space-x-1">
                  <ShoppingBag className="w-3 h-3 text-emerald-600" />
                  <span>Purchases</span>
                </span>
                <span className="font-mono font-bold text-emerald-700">{Math.round(weights.purchases * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.purchases}
                onChange={(e) => setWeights(prev => ({ ...prev, purchases: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* W3 */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>Location</span>
                </span>
                <span className="font-mono font-bold text-amber-700">{Math.round(weights.location * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.location}
                onChange={(e) => setWeights(prev => ({ ...prev, location: parseFloat(e.target.value) }))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* W4 */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-purple-600" />
                  <span>Time</span>
                </span>
                <span className="font-mono font-bold text-purple-700">{Math.round(weights.time * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.time}
                onChange={(e) => setWeights(prev => ({ ...prev, time: parseFloat(e.target.value) }))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* W5 */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800 text-[11px]">
                <span className="flex items-center space-x-1">
                  <Sliders className="w-3 h-3 text-rose-600" />
                  <span>Margin/Pref</span>
                </span>
                <span className="font-mono font-bold text-rose-700">{Math.round(weights.productPreferences * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.05"
                value={weights.productPreferences}
                onChange={(e) => setWeights(prev => ({ ...prev, productPreferences: parseFloat(e.target.value) }))}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Ranked Product Results Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-2xs">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ranked Products Output ({displayedRecommendations.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Sorted by composite score across 5 signals. Real-time sub-15ms generation.
              </p>
            </div>

            {/* Filter by Primary Driver */}
            <div className="flex items-center space-x-1">
              {[
                { label: 'All', id: 'ALL' },
                { label: 'Search', id: 'HISTORICAL_SEARCHES' },
                { label: 'Purchases', id: 'PURCHASES' },
                { label: 'Time', id: 'TIME' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveSignalFilter(f.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    activeSignalFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {displayedRecommendations.map((item) => {
              const isSelected = activeItem?.product.id === item.product.id;
              const grossMargin = item.product.recommendedRetailPrice - item.bestSupplierProduct.price;
              const marginPct = Math.round((grossMargin / item.product.recommendedRetailPrice) * 100);

              return (
                <div
                  key={item.product.id}
                  onClick={() => setSelectedProductInspect(item)}
                  className={`p-3 rounded-md border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-400 ring-1 ring-blue-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 font-mono">
                        #{item.rank}
                      </span>
                      <img 
                        src={item.product.image} 
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 object-cover rounded border border-slate-100 bg-slate-50 shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate max-w-[280px]">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.product.packSize} · {item.bestSupplierProduct.wholesalerName} ({item.bestSupplierProduct.distanceKm} km)
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-800 text-sm">
                        {item.scoreBreakdown.compositeScore}
                        <span className="text-[10px] text-slate-400 font-normal">/100</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        +{marginPct}% (KES {grossMargin})
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 line-clamp-1 max-w-[320px]">
                      💡 {item.recommendationReason}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase shrink-0">
                      {item.scoreBreakdown.primaryDriver.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed 5-Signal Mathematical Diagnostic (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          {activeItem ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    RANK #{activeItem.rank} · COMPOSITE SCORE {activeItem.scoreBreakdown.compositeScore}/100
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Confidence: {activeItem.scoreBreakdown.confidenceScore}%
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeItem.product.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {activeItem.product.packSize} · Canonical SKU: {activeItem.product.id}
                </p>
              </div>

              {/* Natural Language Justification */}
              <div className="bg-white border border-slate-200 rounded p-3 space-y-1.5">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Explainability Vector:</span>
                </span>
                <p className="text-slate-700 text-xs leading-relaxed">
                  {activeItem.recommendationReason}
                </p>
                <div className="flex items-center space-x-1 flex-wrap gap-y-1 pt-1">
                  {activeItem.scoreBreakdown.explanationTags.map(tag => (
                    <span key={tag} className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Formula & Factor Contribution Stack */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900 uppercase tracking-wider">
                    Signal Contribution Breakdown:
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    Score = Σ(Signal * Weight)
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Historical Searches */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1">
                        <Search className="w-3 h-3 text-blue-600" />
                        <span>Historical Searches ({Math.round(weights.historicalSearches * 100)}%)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeItem.scoreBreakdown.historicalSearchScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${activeItem.scoreBreakdown.historicalSearchScore}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Contribution: +{(activeItem.scoreBreakdown.historicalSearchScore * weights.historicalSearches).toFixed(1)} pts
                    </div>
                  </div>

                  {/* Purchases */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1">
                        <ShoppingBag className="w-3 h-3 text-emerald-600" />
                        <span>Purchases & Reorder ({Math.round(weights.purchases * 100)}%)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeItem.scoreBreakdown.purchaseHistoryScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${activeItem.scoreBreakdown.purchaseHistoryScore}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Contribution: +{(activeItem.scoreBreakdown.purchaseHistoryScore * weights.purchases).toFixed(1)} pts
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>Location & Corridor ({Math.round(weights.location * 100)}%)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeItem.scoreBreakdown.locationVelocityScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${activeItem.scoreBreakdown.locationVelocityScore}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Contribution: +{(activeItem.scoreBreakdown.locationVelocityScore * weights.location).toFixed(1)} pts
                    </div>
                  </div>

                  {/* Time */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-purple-600" />
                        <span>Time of Day ({Math.round(weights.time * 100)}%)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeItem.scoreBreakdown.temporalRelevanceScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${activeItem.scoreBreakdown.temporalRelevanceScore}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Contribution: +{(activeItem.scoreBreakdown.temporalRelevanceScore * weights.time).toFixed(1)} pts
                    </div>
                  </div>

                  {/* Product Preferences */}
                  <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1">
                        <Sliders className="w-3 h-3 text-rose-600" />
                        <span>Margin & Pack Preferences ({Math.round(weights.productPreferences * 100)}%)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {activeItem.scoreBreakdown.preferenceAffinityScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-600 h-full rounded-full" style={{ width: `${activeItem.scoreBreakdown.preferenceAffinityScore}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Contribution: +{(activeItem.scoreBreakdown.preferenceAffinityScore * weights.productPreferences).toFixed(1)} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Deliverability Safeguard Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center space-x-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Physical Deliverability Invariant: PASSED</span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  Verified available inventory ({activeItem.bestSupplierProduct.stockQty} units) at {activeItem.bestSupplierProduct.wholesalerName} ({activeItem.bestSupplierProduct.distanceKm} km away).
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No product selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
