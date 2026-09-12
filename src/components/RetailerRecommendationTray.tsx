import React, { useState } from 'react';
import { 
  Sparkles, 
  ShoppingBag, 
  Search, 
  MapPin, 
  Clock, 
  Sliders, 
  ChevronRight, 
  Info, 
  Plus, 
  Check, 
  Bike, 
  TrendingUp, 
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  RecommendationExecutionResult, 
  RecommendedProductItem 
} from '../types/recommendation';
import { Product, SupplierProduct, RetailerShop } from '../types/wayno';

interface RetailerRecommendationTrayProps {
  recommendationResult: RecommendationExecutionResult | null;
  currentShop: RetailerShop;
  searchQuery: string;
  onSelectProductForInspect: (item: RecommendedProductItem) => void;
  onOpenModelInspector: () => void;
  onAddToCart: (product: Product, supplierProduct: SupplierProduct) => void;
  cartQuantities: Record<string, number>;
}

export const RetailerRecommendationTray: React.FC<RetailerRecommendationTrayProps> = ({
  recommendationResult,
  currentShop,
  searchQuery,
  onSelectProductForInspect,
  onOpenModelInspector,
  onAddToCart,
  cartQuantities
}) => {
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  if (!recommendationResult || recommendationResult.recommendations.length === 0) {
    return null;
  }

  // When a specific search is typed, the search-first experience is 100% active!
  // We keep the recommendation tray hidden or minimal so it doesn't destroy or distract from search.
  const isSearchActive = searchQuery.trim().length > 0;
  if (isSearchActive) {
    return null; // Search takes 100% precedence!
  }

  const topRecommendations = recommendationResult.recommendations.slice(0, 6);
  const timeLabel = recommendationResult.signalsExtracted.time.timeWindowLabel.split('(')[0].trim();

  const handleAdd = (item: RecommendedProductItem) => {
    onAddToCart(item.product, item.bestSupplierProduct);
    setAddedAnimationId(item.product.id);
    setTimeout(() => setAddedAnimationId(null), 1200);
  };

  const getUrgencyBadge = (urgency: RecommendedProductItem['urgencyLevel']) => {
    switch (urgency) {
      case 'HIGH_RESTOCK_URGENCY':
        return { label: 'Reorder Due', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'DAILY_TIME_STAPLE':
        return { label: 'Time Staple', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'HIGH_MARGIN_OPPORTUNITY':
        return { label: 'High Margin', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'FAVORITE_REORDER':
        return { label: 'Past Search', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: 'Zone Popular', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-md p-3.5 sm:p-4 space-y-3 shadow-2xs">
      {/* Header with Search-First Safeguard note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Recommended for {currentShop.name}
            </h3>
            <span className="text-[10px] bg-slate-200 text-slate-800 font-semibold px-1.5 py-0.2 rounded font-mono">
              {timeLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Ranked by 5 real-time signals: Historical Searches • Purchases • Location • Time • Product Preferences.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenModelInspector}
            className="flex items-center space-x-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>Inspect 5-Signal Model</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll / Responsive Grid of Recommended Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topRecommendations.map((item) => {
          const { product, bestSupplierProduct, scoreBreakdown, urgencyLevel } = item;
          const wholesalePrice = bestSupplierProduct.price;
          const rrp = product.recommendedRetailPrice;
          const grossProfit = rrp - wholesalePrice;
          const marginPercent = Math.round((grossProfit / rrp) * 100);
          const badge = getUrgencyBadge(urgencyLevel);
          const currentQty = cartQuantities[product.id] || 0;
          const isAdded = addedAnimationId === product.id;

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-md p-3 flex flex-col justify-between transition-shadow hover:shadow-2xs space-y-2.5 text-xs"
            >
              {/* Top Details & Reason */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <button
                    onClick={() => {
                      onSelectProductForInspect(item);
                      onOpenModelInspector();
                    }}
                    className="text-[10px] font-medium text-slate-500 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
                    title="Inspect why this SKU was recommended"
                  >
                    <Info className="w-3 h-3 text-blue-600" />
                    <span>Score: {scoreBreakdown.compositeScore}/100</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative w-14 h-14 rounded bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-500 font-semibold">{product.brand}</div>
                    <div className="font-bold text-slate-900 text-xs truncate" title={product.name}>
                      {product.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {product.packSize}
                    </div>
                  </div>
                </div>

                {/* Explanatory Tag */}
                <div className="bg-slate-50 border border-slate-100 rounded px-2 py-1 text-[10px] text-slate-600 line-clamp-1">
                  💡 {scoreBreakdown.explanationTags[0] || item.recommendationReason}
                </div>
              </div>

              {/* Bottom Price & Add Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    KES {wholesalePrice.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    +{marginPercent}% margin (KES {grossProfit})
                  </div>
                </div>

                <button
                  onClick={() => handleAdd(item)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>{currentQty > 0 ? `Add (${currentQty})` : 'Restock'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
