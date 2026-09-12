import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  X, 
  Info, 
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Tag,
  Store,
  ChevronDown
} from 'lucide-react';
import { 
  RecommendationExecutionResult, 
  RecommendedProductItem, 
  RecommendationEngineWeights,
  TimeWindow,
  RecommendationSignalType 
} from '../types/recommendation';
import { RetailerShop, Product, SupplierProduct } from '../types/wayno';

interface RecommendationModelInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  result: RecommendationExecutionResult;
  currentShop: RetailerShop;
  onUpdateWeights?: (weights: Partial<RecommendationEngineWeights>) => void;
  onSimulateTime?: (hour: number) => void;
  onAddToCart: (product: Product, supplierProduct: SupplierProduct) => void;
}

export const RecommendationModelInspector: React.FC<RecommendationModelInspectorProps> = ({
  isOpen,
  onClose,
  result,
  currentShop,
  onUpdateWeights,
  onSimulateTime,
  onAddToCart,
}) => {
  const [selectedItem, setSelectedItem] = useState<RecommendedProductItem | null>(
    result.recommendations[0] || null
  );
  const [activeSignalTab, setActiveSignalTab] = useState<RecommendationSignalType>('HISTORICAL_SEARCHES');
  const [simulatedHour, setSimulatedHour] = useState<number>(result.signalsExtracted.time.currentHour);

  if (!isOpen) return null;

  const { signalsExtracted: s, weightsApplied: w } = result;

  const handleTimeChange = (hour: number) => {
    setSimulatedHour(hour);
    if (onSimulateTime) {
      onSimulateTime(hour);
    }
  };

  const SIGNAL_ICONS: Record<RecommendationSignalType, React.ReactNode> = {
    HISTORICAL_SEARCHES: <Search className="w-4 h-4 text-blue-600" />,
    PURCHASES: <ShoppingBag className="w-4 h-4 text-emerald-600" />,
    LOCATION: <MapPin className="w-4 h-4 text-amber-600" />,
    TIME: <Clock className="w-4 h-4 text-purple-600" />,
    PRODUCT_PREFERENCES: <Sliders className="w-4 h-4 text-rose-600" />
  };

  const SIGNAL_TITLES: Record<RecommendationSignalType, string> = {
    HISTORICAL_SEARCHES: '1. Historical Searches',
    PURCHASES: '2. Purchases & Reorder Cycle',
    LOCATION: '3. Location & Corridor Velocity',
    TIME: '4. Time of Day & Restock Window',
    PRODUCT_PREFERENCES: '5. Product Preferences & Margin'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Recommendation Engine Model Inspector (Section 45)
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Search-First Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Multi-signal mathematical evaluation pipeline powering contextual duka restock recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Architectural Diagram Banner */}
          <div className="bg-slate-950 text-slate-100 rounded-md p-4 border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400">ENGINE TOPOLOGY: 5-SIGNAL HIERARCHY</span>
              <span>Evaluated in {result.executionTimeMs} ms • {result.totalCatalogEvaluated} SKUs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px]">
              {/* Signal 1 */}
              <div 
                onClick={() => setActiveSignalTab('HISTORICAL_SEARCHES')}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  activeSignalTab === 'HISTORICAL_SEARCHES' 
                    ? 'bg-blue-950/80 border-blue-400 text-blue-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <Search className="w-3 h-3 text-blue-400" />
                  <span>Historical Searches</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-300">Weight: {Math.round(w.historicalSearches * 100)}%</div>
                <div className="text-[9px] text-slate-400 truncate">{s.historicalSearches.recentQueries[0] || 'Queries'}</div>
              </div>

              {/* Signal 2 */}
              <div 
                onClick={() => setActiveSignalTab('PURCHASES')}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  activeSignalTab === 'PURCHASES' 
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <ShoppingBag className="w-3 h-3 text-emerald-400" />
                  <span>Purchases</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-300">Weight: {Math.round(w.purchases * 100)}%</div>
                <div className="text-[9px] text-slate-400">Cycle: ~{s.purchases.averageRestockCycleDays}d</div>
              </div>

              {/* Signal 3 */}
              <div 
                onClick={() => setActiveSignalTab('LOCATION')}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  activeSignalTab === 'LOCATION' 
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Location</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-300">Weight: {Math.round(w.location * 100)}%</div>
                <div className="text-[9px] text-slate-400">{s.location.nearestDepotDistanceKm}km to Depot</div>
              </div>

              {/* Signal 4 */}
              <div 
                onClick={() => setActiveSignalTab('TIME')}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  activeSignalTab === 'TIME' 
                    ? 'bg-purple-950/80 border-purple-400 text-purple-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>Time of Day</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-300">Weight: {Math.round(w.time * 100)}%</div>
                <div className="text-[9px] text-slate-400 truncate">{s.time.timeWindow.replace(/_/g, ' ')}</div>
              </div>

              {/* Signal 5 */}
              <div 
                onClick={() => setActiveSignalTab('PRODUCT_PREFERENCES')}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  activeSignalTab === 'PRODUCT_PREFERENCES' 
                    ? 'bg-rose-950/80 border-rose-400 text-rose-200' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <Sliders className="w-3 h-3 text-rose-400" />
                  <span>Preferences</span>
                </div>
                <div className="text-[10px] mt-1 text-slate-300">Weight: {Math.round(w.productPreferences * 100)}%</div>
                <div className="text-[9px] text-slate-400">Margin Focus ≥{s.productPreferences.minTargetMarginPercent}%</div>
              </div>
            </div>

            {/* Invariant Statement from User's Spec */}
            <div className="bg-slate-900/80 rounded p-2 text-slate-300 text-[11px] flex items-center justify-between border border-slate-800">
              <span className="flex items-center space-x-1.5 text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold">Core Architectural Mandate:</span>
                <span className="text-slate-300">"Recommendations shouldn't destroy the search-first experience. Search remains primary."</span>
              </span>
              <span className="text-emerald-400 text-[10px] font-bold">STATE: 100% PRESERVED</span>
            </div>
          </div>

          {/* Time-of-Day Simulation Bar */}
          <div className="bg-white border border-slate-200 rounded p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <div>
                <span className="font-bold text-slate-900">Simulate Restock Window:</span>
                <span className="text-slate-500 ml-1.5">
                  Currently: {s.time.timeWindowLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {[
                { label: 'Morning (08:00)', hour: 8 },
                { label: 'Midday (13:00)', hour: 13 },
                { label: 'Evening (19:00)', hour: 19 },
              ].map(tw => (
                <button
                  key={tw.label}
                  onClick={() => handleTimeChange(tw.hour)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    simulatedHour === tw.hour
                      ? 'bg-purple-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Inspector Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: Ranked Output Products (5 cols) */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Model Output: Ranked Products ({result.recommendations.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Sorted by Composite Score</span>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {result.recommendations.map((item) => {
                  const isSelected = selectedItem?.product.id === item.product.id;
                  const marginKES = item.product.recommendedRetailPrice - item.bestSupplierProduct.price;
                  const marginPct = Math.round((marginKES / item.product.recommendedRetailPrice) * 100);

                  return (
                    <div
                      key={item.product.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 rounded-md border transition-colors cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                            #{item.rank}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">{item.product.name}</div>
                            <div className="text-[11px] text-slate-500">{item.product.packSize} • {item.product.brand}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-emerald-800 text-xs font-mono">
                            {item.scoreBreakdown.compositeScore}
                            <span className="text-[10px] text-slate-400 font-normal">/100</span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-semibold">+{marginPct}% margin</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold uppercase">
                          Driver: {item.scoreBreakdown.primaryDriver.replace(/_/g, ' ')}
                        </span>
                        <span className="text-slate-500 truncate max-w-[170px]">
                          KES {item.bestSupplierProduct.price.toLocaleString()} wholesale
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Mathematical Factor Breakdown for Selected Item (7 cols) */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-md p-4 space-y-4">
              {selectedItem ? (
                <>
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={selectedItem.product.image} 
                        alt={selectedItem.product.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded border border-slate-200 bg-white" 
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{selectedItem.product.name}</span>
                          <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.2 rounded text-[10px] font-mono">
                            Rank #{selectedItem.rank}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedItem.product.packSize} · Best Supplier: {selectedItem.bestSupplierProduct.wholesalerName} ({selectedItem.bestSupplierProduct.distanceKm} km)
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onAddToCart(selectedItem.product, selectedItem.bestSupplierProduct)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded text-xs transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                    >
                      + Add to Duka Cart
                    </button>
                  </div>

                  {/* Why Recommended Headline */}
                  <div className="bg-white border border-slate-200 rounded p-3 space-y-1.5">
                    <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>Model Rationalization (Natural Language Explainability):</span>
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {selectedItem.recommendationReason}
                    </p>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-1">
                      {selectedItem.scoreBreakdown.explanationTags.map((tag) => (
                        <span 
                          key={tag} 
                          className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 5-Signal Mathematical Contribution Breakdown */}
                  <div className="space-y-2.5">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      5-Signal Weight Matrix Evaluation:
                    </span>

                    <div className="space-y-2">
                      {/* Signal 1: Historical Searches */}
                      <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <Search className="w-3 h-3 text-blue-600" />
                            <span>1. Historical Searches (Weight: {Math.round(w.historicalSearches * 100)}%)</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedItem.scoreBreakdown.historicalSearchScore} / 100
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all" 
                            style={{ width: `${selectedItem.scoreBreakdown.historicalSearchScore}%` }} 
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Matched queries: {s.historicalSearches.recentQueries.slice(0, 3).join(', ')}
                        </div>
                      </div>

                      {/* Signal 2: Purchases */}
                      <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <ShoppingBag className="w-3 h-3 text-emerald-600" />
                            <span>2. Purchases & Reorder Cycle (Weight: {Math.round(w.purchases * 100)}%)</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedItem.scoreBreakdown.purchaseHistoryScore} / 100
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all" 
                            style={{ width: `${selectedItem.scoreBreakdown.purchaseHistoryScore}%` }} 
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Avg replenishment cycle: {s.purchases.averageRestockCycleDays} days · Past orders: {s.purchases.totalPastOrders}
                        </div>
                      </div>

                      {/* Signal 3: Location */}
                      <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>3. Location & Corridor Velocity (Weight: {Math.round(w.location * 100)}%)</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedItem.scoreBreakdown.locationVelocityScore} / 100
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-amber-600 h-full rounded-full transition-all" 
                            style={{ width: `${selectedItem.scoreBreakdown.locationVelocityScore}%` }} 
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Zone: {s.location.zoneName} · Nearest Depot: {selectedItem.bestSupplierProduct.distanceKm} km away
                        </div>
                      </div>

                      {/* Signal 4: Time */}
                      <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <Clock className="w-3 h-3 text-purple-600" />
                            <span>4. Time of Day & Restock Window (Weight: {Math.round(w.time * 100)}%)</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedItem.scoreBreakdown.temporalRelevanceScore} / 100
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-purple-600 h-full rounded-full transition-all" 
                            style={{ width: `${selectedItem.scoreBreakdown.temporalRelevanceScore}%` }} 
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Active window: {s.time.timeWindowLabel}
                        </div>
                      </div>

                      {/* Signal 5: Product Preferences */}
                      <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <Sliders className="w-3 h-3 text-rose-600" />
                            <span>5. Product Preferences & Margin (Weight: {Math.round(w.productPreferences * 100)}%)</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {selectedItem.scoreBreakdown.preferenceAffinityScore} / 100
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-rose-600 h-full rounded-full transition-all" 
                            style={{ width: `${selectedItem.scoreBreakdown.preferenceAffinityScore}%` }} 
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Margin: KES {selectedItem.product.recommendedRetailPrice - selectedItem.bestSupplierProduct.price} (RRP: KES {selectedItem.product.recommendedRetailPrice})
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  Select a product on the left to inspect its factor contribution.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500">
            Duka: <span className="font-semibold text-slate-900">{currentShop.name}</span> ({currentShop.serviceZoneId})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
