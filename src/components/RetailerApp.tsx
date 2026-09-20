import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  ArrowRight,
  Package,
  Bike,
  Building,
  AlertCircle,
  FileText,
  User,
  Phone,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Tag,
  Star,
  Zap,
  Filter,
  Layers,
  Globe,
  Compass,
  CheckCircle2,
  Sliders,
  X
} from 'lucide-react';
import { 
  Product, 
  SupplierProduct, 
  SearchResultItem, 
  CartItem, 
  Order, 
  RetailerShop 
} from '../types/wayno';
import { 
  executeWaynoSearch, 
  getAutocompleteSuggestions,
  getPromotionalPlacements,
  recordPromotionalClick,
  recordPromotionalImpression,
  recordSearchResultClick
} from '../services/searchEngine';
import { SearchExecutionResultEnhanced, AutocompleteSuggestion, SearchFilters } from '../types/search';
import { PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS } from '../data/mockData';
import { 
  generateRetailerRecommendations, 
  DEFAULT_RECOMMENDATION_WEIGHTS 
} from '../services/recommendationEngine';
import { 
  RecommendationExecutionResult, 
  RecommendedProductItem, 
  RecommendationEngineWeights 
} from '../types/recommendation';
import { RetailerRecommendationTray } from './RetailerRecommendationTray';
import { RecommendationModelInspector } from './RecommendationModelInspector';

export type RetailerPage = 'catalog' | 'orders' | 'profile';

interface RetailerAppProps {
  currentShop: RetailerShop;
  onSelectShop: (shopId: string) => void;
  allShops: RetailerShop[];
  cart: CartItem[];
  addToCart: (
    product: Product, 
    supplierProduct: SupplierProduct, 
    campaignId?: string, 
    discountKES?: number
  ) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  openCheckout: () => void;
  activeOrders: Order[];
  onOrderClick: (order: Order) => void;
}

export const RetailerApp: React.FC<RetailerAppProps> = ({
  currentShop,
  onSelectShop,
  allShops,
  cart,
  addToCart,
  updateCartQuantity,
  openCheckout,
  activeOrders,
  onOrderClick,
}) => {
  const [currentPage, setCurrentPage] = useState<RetailerPage>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchExecutionResultEnhanced | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);
  const [rankingStrategy, setRankingStrategy] = useState<'SMART_BALANCED' | 'PRICE_LOW' | 'DISTANCE_NEAR' | 'MARGIN_HIGH'>('SMART_BALANCED');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [demandAlertSent, setDemandAlertSent] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Recent searches local state (persisting up to 5 frequent queries)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wayno_retailer_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
      }
    } catch {
      // fallback to defaults
    }
    return ['unga wa ugali 2kg bale', 'bluband', 'cooking oil', 'njugu', 'sabuni'];
  });

  const addToRecentSearches = (query: string) => {
    const clean = query.trim();
    if (!clean || clean.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('wayno_retailer_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const removeFromRecentSearches = (queryToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem('wayno_retailer_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('wayno_retailer_recent_searches');
    } catch {
      // ignore
    }
  };

  // 5-Signal Recommendation Engine State (Section 45)
  const [recommendationResult, setRecommendationResult] = useState<RecommendationExecutionResult | null>(null);
  const [isModelInspectorOpen, setIsModelInspectorOpen] = useState(false);
  const [selectedItemForInspect, setSelectedItemForInspect] = useState<RecommendedProductItem | null>(null);
  const [recommendationWeights, setRecommendationWeights] = useState<RecommendationEngineWeights>(DEFAULT_RECOMMENDATION_WEIGHTS);
  const [simulatedHour, setSimulatedHour] = useState<number | undefined>(undefined);

  // Compute recommendations reactively
  useEffect(() => {
    try {
      const res = generateRetailerRecommendations(
        currentShop,
        recentSearches,
        activeOrders,
        recommendationWeights,
        simulatedHour
      );
      setRecommendationResult(res);
      if (!selectedItemForInspect && res.recommendations.length > 0) {
        setSelectedItemForInspect(res.recommendations[0]);
      }
    } catch (err) {
      console.error('Failed to generate retailer recommendations:', err);
    }
  }, [currentShop, recentSearches, activeOrders, recommendationWeights, simulatedHour]);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((ci) => {
      map[ci.product.id] = (map[ci.product.id] || 0) + ci.quantity;
    });
    return map;
  }, [cart]);

  // Active promotional placements
  const heroPlacements = getPromotionalPlacements().filter(
    (p) => p.status === 'ACTIVE' && p.placementSlot === 'HERO_BANNER'
  );
  const currentHero = heroPlacements[heroIndex % (heroPlacements.length || 1)];

  // Record impression for active hero
  useEffect(() => {
    if (currentHero) {
      recordPromotionalImpression(currentHero.id);
    }
  }, [currentHero?.id]);

  // Suggested search chips from the V1 specification
  const SUGGESTED_CHIPS = [
    { label: '★ Sponsored Deals', query: 'sponsored deal' },
    { label: 'Unga 2kg Bale', query: 'unga wa ugali 2kg bale' },
    { label: 'Njugu (Peanuts)', query: 'njugu' },
    { label: 'Typo: "bluband"', query: 'bluband' },
    { label: 'Fresh Fri Oil', query: 'cooking oil' },
    { label: 'Things to wash clothes', query: 'things to wash clothes' },
    { label: 'Cheapest Flour', query: 'cheapest unga' },
    { label: 'Sabuni (Soap)', query: 'sabuni' },
  ];

  const CATEGORIES = [
    'All',
    'Promotional Rebates',
    'Flour & Staples',
    'Fats & Oils',
    'Spreads & Dairy',
    'Laundry & Personal Care',
    'Beverages & Snacks'
  ];

  // Perform search on query or filter changes
  useEffect(() => {
    const searchOptions = {
      userLat: currentShop.latitude,
      userLng: currentShop.longitude,
      shopId: currentShop.id,
      rankingStrategy,
      filters: searchFilters,
    };

    if (searchQuery.trim().length > 0) {
      const res = executeWaynoSearch(searchQuery, searchOptions);
      setSearchResult(res);
      setSuggestions(getAutocompleteSuggestions(searchQuery));
    } else {
      const res = executeWaynoSearch('', searchOptions);
      setSearchResult(res);
      setSuggestions([]);
    }
    setDemandAlertSent(false);
  }, [searchQuery, currentShop, rankingStrategy, searchFilters]);

  // Debounced registration of typed searches into recent searches
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        addToRecentSearches(searchQuery);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleChipClick = (query: string) => {
    setSearchQuery(query);
    addToRecentSearches(query);
  };

  const handleAdd = (
    product: Product, 
    supplierProduct: SupplierProduct, 
    campaignId?: string, 
    discountKES?: number
  ) => {
    if (searchQuery.trim()) {
      recordSearchResultClick(searchQuery, product.id);
    }
    if (campaignId) {
      recordPromotionalClick(campaignId);
    }
    const finalSupplierProduct = discountKES ? {
      ...supplierProduct,
      price: Math.max(1, supplierProduct.price - discountKES)
    } : supplierProduct;

    addToCart(product, finalSupplierProduct, campaignId, discountKES);
    setAddedAnimationId(product.id);
    setTimeout(() => setAddedAnimationId(null), 1200);
  };

  const getItemQuantityInCart = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Filter products by selected category if not 'All'
  const displayedResults = searchResult?.results.filter((item) => {
    const { product, isSponsored, promoDiscountKES } = item;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Promotional Rebates') return Boolean(isSponsored || promoDiscountKES);
    if (selectedCategory === 'Flour & Staples') return product.internalCategory.includes('Flour') || product.internalCategory.includes('Grains');
    if (selectedCategory === 'Fats & Oils') return product.internalCategory.includes('Oil') || product.internalCategory.includes('Fats');
    if (selectedCategory === 'Spreads & Dairy') return product.internalCategory.includes('Spread') || product.internalCategory.includes('Dairy');
    if (selectedCategory === 'Laundry & Personal Care') return product.internalCategory.includes('Soap') || product.internalCategory.includes('Cleaning');
    if (selectedCategory === 'Beverages & Snacks') return product.internalCategory.includes('Snacks') || product.internalCategory.includes('Beverages');
    return true;
  }) || [];

  return (
    <div className="space-y-4 pb-20">
      {/* Top Outlook Page Header & Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 sm:p-4 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900">{currentShop.name}</h1>
                <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                  {currentShop.serviceZoneId.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                {currentShop.address} · Owner: {currentShop.shopOwner}
              </p>
            </div>
          </div>

          {/* Quick shop switcher */}
          <div className="flex items-center space-x-2">
            <label className="text-[11px] text-slate-500 font-medium hidden md:inline">Switch Duka:</label>
            <select
              value={currentShop.id}
              onChange={(e) => onSelectShop(e.target.value)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded px-2.5 py-1 font-medium focus:border-slate-800 focus:outline-none transition-colors cursor-pointer"
              aria-label="Switch Duka Location"
            >
              {allShops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shopOwner})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Outlook Secondary Page Tabs Ribbon */}
        <div className="flex items-center space-x-1 pt-2.5 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentPage('catalog')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'catalog'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Wholesale Catalog & Search</span>
          </button>

          <button
            onClick={() => setCurrentPage('orders')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'orders'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Orders & Deliveries</span>
            {activeOrders.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                currentPage === 'orders' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
              }`}>
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('profile')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'profile'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Duka Profile & Geofence</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: CATALOG & SEARCH                                                 */}
      {/* ========================================================================= */}
      {currentPage === 'catalog' && (
        <div className="space-y-4">
          {/* Zero-Touch Wholesale Sourcing Assurance Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-md p-3 flex items-center justify-between text-xs gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-emerald-950 block text-xs">
                  Zero-Touch Sourcing Guarantee
                </span>
                <p className="text-[11px] text-emerald-800">
                  You never have to choose between wholesalers. Wayno automatically secures the lowest rate from nearby depots and coordinates doorstep delivery.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-900 bg-white border border-emerald-200 px-2.5 py-1 rounded shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Automated Depot Routing</span>
            </div>
          </div>

          {/* Active Order Progress Banner if any */}
          {activeOrders.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-900">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                  <Bike className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-mono font-bold text-slate-900">{activeOrders[0].id}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold uppercase border border-slate-200">
                      {activeOrders[0].status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {activeOrders[0].items.length} bulk packs · Delivery in ~{activeOrders[0].estimatedDeliveryMins} mins
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOrderClick(activeOrders[0])}
                  className="flex items-center space-x-1 text-xs font-semibold text-slate-900 hover:text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200"
                >
                  <span>Track Live Run</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setCurrentPage('orders')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  View All ({activeOrders.length})
                </button>
              </div>
            </div>
          )}

          {/* FMCG Manufacturer Hero Promotional Placement Banner */}
          {currentHero && (
            <div className="bg-gradient-to-r from-amber-50 via-white to-orange-50 border border-amber-300/80 rounded-md p-3.5 sm:p-4 shadow-2xs relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded flex items-center space-x-1">
                        <Star className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
                        <span>FMCG Manufacturer Sponsored Incentive</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {currentHero.sponsorName}
                      </span>
                      {heroPlacements.length > 1 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Deal {(heroIndex % heroPlacements.length) + 1} of {heroPlacements.length}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      {currentHero.headline}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-2xl line-clamp-2">
                      {currentHero.subtext}
                    </p>
                  </div>
                </div>

                {/* Right CTA and Hero Controls */}
                <div className="flex items-center space-x-2 sm:self-center shrink-0">
                  {heroPlacements.length > 1 && (
                    <div className="flex items-center space-x-1 mr-1">
                      <button
                        onClick={() => setHeroIndex((prev) => (prev - 1 + heroPlacements.length) % heroPlacements.length)}
                        className="w-7 h-7 rounded border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        title="Previous Deal"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setHeroIndex((prev) => (prev + 1) % heroPlacements.length)}
                        className="w-7 h-7 rounded border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                        title="Next Deal"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      recordPromotionalClick(currentHero.id);
                      setSearchQuery(currentHero.targetProductName);
                    }}
                    className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <span>Claim -KES {currentHero.discountKES} Rebate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Wholesale FMCG Procurement
                </h2>
                <p className="text-xs text-slate-500">
                  Natural language & Sheng search matching regional wholesale depots with sub-25ms multi-factor ranking.
                </p>
              </div>

              {/* Ranking & Filter Selector */}
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[11px] text-slate-500 font-medium">Rank By:</span>
                <select
                  value={rankingStrategy}
                  onChange={(e) => setRankingStrategy(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 font-medium text-slate-800"
                >
                  <option value="SMART_BALANCED">Smart Rank (Balanced)</option>
                  <option value="PRICE_LOW">Cheapest Wholesale</option>
                  <option value="DISTANCE_NEAR">Nearest Depot</option>
                  <option value="MARGIN_HIGH">Max Profit Margin</option>
                </select>

                {/* Filter Drawer Toggle */}
                <button
                  onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                  className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded font-medium border transition-colors cursor-pointer ${
                    showFilterDrawer || Object.keys(searchFilters).length > 0
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {Object.values(searchFilters).filter(Boolean).length > 0 && (
                    <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                      {Object.values(searchFilters).filter(Boolean).length}
                    </span>
                  )}
                </button>

                {/* 5-Signal Recommendation Model Trigger */}
                <button
                  onClick={() => setIsModelInspectorOpen(true)}
                  className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded font-medium border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 transition-colors cursor-pointer"
                  title="Inspect Section 45: 5-Signal Recommendation Model"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                  <span className="hidden sm:inline">5-Signal Recs</span>
                  <span className="sm:hidden">Recs</span>
                </button>
              </div>
            </div>

            {/* Input with Typeahead Autocomplete */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                id="retailer-fmcg-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsAutocompleteOpen(true);
                }}
                onFocus={() => setIsAutocompleteOpen(true)}
                onBlur={() => setTimeout(() => setIsAutocompleteOpen(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToRecentSearches(searchQuery);
                    setIsAutocompleteOpen(false);
                  }
                }}
                placeholder="Search: 'unga 2kg bale', 'bluband', 'njugu', 'things to wash clothes', 'cheapest cooking oil'..."
                className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-300 hover:border-slate-400 focus:border-slate-800 focus:outline-none pl-9 pr-14 py-2 rounded text-xs sm:text-sm transition-colors font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsAutocompleteOpen(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Clear
                </button>
              )}

              {/* Autocomplete Dropdown & Recent Searches Dropdown */}
              {isAutocompleteOpen && (suggestions.length > 0 || (!searchQuery.trim() && recentSearches.length > 0)) && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden divide-y divide-slate-100">
                  {/* Empty query: Show Recent Searches list */}
                  {!searchQuery.trim() && recentSearches.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 flex justify-between items-center">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Recent Searches ({recentSearches.length})</span>
                        </span>
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            clearRecentSearches();
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-600 lowercase underline cursor-pointer"
                        >
                          clear history
                        </button>
                      </div>
                      {recentSearches.map((term) => (
                        <div
                          key={term}
                          onMouseDown={() => {
                            setSearchQuery(term);
                            addToRecentSearches(term);
                            setIsAutocompleteOpen(false);
                          }}
                          className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-900">{term}</span>
                          </div>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeFromRecentSearches(term);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Suggestions when typing */}
                  {suggestions.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 flex justify-between">
                        <span>Sub-15ms Autocomplete & Sheng Suggestions</span>
                        <span>Click to apply query</span>
                      </div>
                      {suggestions.map((sug) => (
                        <div
                          key={sug.id}
                          onMouseDown={() => {
                            setSearchQuery(sug.query);
                            addToRecentSearches(sug.query);
                            setIsAutocompleteOpen(false);
                          }}
                          className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900">{sug.title}</span>
                            {sug.subtitle && (
                              <span className="text-[11px] text-slate-500">{sug.subtitle}</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            sug.type === 'SHENG_VERNACULAR' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            sug.type === 'BRAND' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            sug.type === 'PACK_SIZE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            sug.type === 'CATEGORY' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {sug.badge || sug.type}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Faceted Filter Drawer / Bar if open */}
            {showFilterDrawer && searchResult?.facets && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Faceted Search Filters (Geo-Aware Availability & Inventory)</span>
                  </span>
                  <button
                    onClick={() => setSearchFilters({})}
                    className="text-[11px] text-slate-500 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Supply Node Tree Tier Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Supply Node Tree Tier</label>
                    <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                      {[
                        { label: 'All Tiers', val: undefined },
                        { label: '🌐 Root (National)', val: 'ROOT' },
                        { label: '🏛️ Regional', val: 'REGION' },
                        { label: '📍 Local 20km', val: 'LOCAL_NODE' },
                      ].map((tier) => (
                        <button
                          key={tier.label}
                          onClick={() => setSearchFilters((prev) => ({ ...prev, supplyNodeLevel: tier.val as any }))}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                            (searchFilters.supplyNodeLevel === tier.val || (!searchFilters.supplyNodeLevel && tier.val === undefined))
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tier.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Geo-Distance Corridor Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Max Depot Distance</label>
                    <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                      {[
                        { label: 'All Corridors', val: undefined },
                        { label: '≤ 3km (Zone 1)', val: 3 },
                        { label: '≤ 6km (Zone 2)', val: 6 },
                      ].map((dist) => (
                        <button
                          key={dist.label}
                          onClick={() => setSearchFilters((prev) => ({ ...prev, maxDistanceKm: dist.val }))}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                            searchFilters.maxDistanceKm === dist.val
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {dist.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock & Rebates Toggles */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Availability & Deals</label>
                    <div className="flex flex-col space-y-1 pt-0.5">
                      <label className="flex items-center space-x-1.5 cursor-pointer text-slate-800">
                        <input
                          type="checkbox"
                          checked={Boolean(searchFilters.inStockOnly)}
                          onChange={(e) => setSearchFilters((prev) => ({ ...prev, inStockOnly: e.target.checked || undefined }))}
                          className="rounded text-slate-900 focus:ring-slate-900"
                        />
                        <span className="font-medium">In Stock ({searchResult.facets.inStockCount})</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer text-slate-800">
                        <input
                          type="checkbox"
                          checked={Boolean(searchFilters.promotionsOnly)}
                          onChange={(e) => setSearchFilters((prev) => ({ ...prev, promotionsOnly: e.target.checked || undefined }))}
                          className="rounded text-slate-900 focus:ring-slate-900"
                        />
                        <span className="font-medium">Rebates ({searchResult.facets.promotionsCount})</span>
                      </label>
                    </div>
                  </div>

                  {/* Brand Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Top Brands</label>
                    <div className="flex items-center space-x-1 flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {searchResult.facets.brands.slice(0, 8).map((b) => {
                        const isSelected = searchFilters.brands?.includes(b.value);
                        return (
                          <button
                            key={b.value}
                            onClick={() => {
                              const current = searchFilters.brands || [];
                              const next = isSelected ? current.filter((x) => x !== b.value) : [...current, b.value];
                              setSearchFilters((prev) => ({ ...prev, brands: next.length > 0 ? next : undefined }));
                            }}
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium border cursor-pointer ${
                              isSelected
                                ? 'bg-blue-900 text-white border-blue-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {b.value} ({b.count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Searches Pill Row (Last 5 Queries) */}
            {recentSearches.length > 0 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 text-xs">
                <span className="text-slate-500 font-semibold shrink-0 flex items-center space-x-1 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Recent Searches:</span>
                </span>
                {recentSearches.map((term) => {
                  const isActive = searchQuery.toLowerCase() === term.toLowerCase();
                  return (
                    <div
                      key={term}
                      className={`inline-flex items-center rounded text-xs transition-colors border shadow-xs ${
                        isActive
                          ? 'bg-blue-50 text-blue-900 border-blue-300 font-semibold'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSearchQuery(term);
                          addToRecentSearches(term);
                          setIsAutocompleteOpen(false);
                        }}
                        className="px-2 py-0.5 text-xs cursor-pointer flex items-center space-x-1"
                        title={`Re-run search for "${term}"`}
                      >
                        <span>{term}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromRecentSearches(term);
                        }}
                        className="pr-1.5 pl-0.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Remove from history"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={clearRecentSearches}
                  className="text-[10px] text-slate-400 hover:text-red-700 underline ml-1 cursor-pointer shrink-0"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Popular Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium shrink-0 flex items-center space-x-1 text-[11px]">
                <Sparkles className="w-3 h-3 text-slate-500" />
                <span>Quick Presets:</span>
              </span>
              {SUGGESTED_CHIPS.map((chip) => (
                <button
                  key={chip.query}
                  onClick={() => {
                    handleChipClick(chip.query);
                    setIsAutocompleteOpen(false);
                  }}
                  className={`px-2 py-0.5 rounded font-medium transition-colors whitespace-nowrap border text-xs cursor-pointer ${
                    searchQuery.toLowerCase() === chip.query.toLowerCase()
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center space-x-1 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-medium shrink-0 text-[11px] mr-1">Category:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Query Telemetry, Inverted Index & Enrichment Strip */}
            {searchResult && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-semibold text-slate-900">
                      {displayedResults.length} wholesale match(es)
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-mono text-[11px] font-semibold">
                      FastAPI Latency: {searchResult.executionTimeMs}ms
                    </span>
                    {searchResult.indexMetrics && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-700 text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          BM25 Index: {searchResult.indexMetrics.postingsEvaluated} postings ({searchResult.indexMetrics.indexLookupTimeMs}ms)
                        </span>
                      </>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-700 font-bold text-[10px] px-1.5 py-0.2 bg-blue-50 border border-blue-200 rounded">
                      Intent: {searchResult.detectedIntent}
                    </span>
                  </div>

                  {/* Fuzzy / Did you mean suggestion */}
                  {searchResult.spellCorrections.length > 0 && (
                    <div className="text-[11px] text-amber-800 flex items-center space-x-1">
                      <span>Showing results for</span>
                      <button
                        onClick={() => setSearchQuery(searchResult.spellCorrections[0].correctedTerm)}
                        className="font-bold text-slate-900 underline hover:text-blue-700 cursor-pointer"
                      >
                        {searchResult.spellCorrections[0].correctedTerm}
                      </button>
                      <span className="line-through text-slate-400">({searchResult.spellCorrections[0].originalTerm})</span>
                    </div>
                  )}

                  {/* Sheng Terminology */}
                  {searchResult.detectedDialectTerms.length > 0 && (
                    <div className="text-[11px] text-purple-700">
                      <span className="font-bold">Sheng:</span> "{searchResult.detectedDialectTerms[0].rawTerm}" = {searchResult.detectedDialectTerms[0].englishTranslation}
                    </div>
                  )}

                  {/* Synonyms Expanded */}
                  {searchResult.synonymsApplied && searchResult.synonymsApplied.length > 0 && (
                    <div className="text-[11px] text-emerald-700">
                      <span className="font-bold">Synonyms:</span> {searchResult.synonymsApplied[0].original} → {searchResult.synonymsApplied[0].expansions.slice(0, 2).join(', ')}
                    </div>
                  )}

                  {searchResult.extractedPackSize && (
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      Pack: {searchResult.extractedPackSize.raw}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 45: Multi-Signal Recommendation Tray (Search-First Safeguarded) */}
          <RetailerRecommendationTray
            recommendationResult={recommendationResult}
            currentShop={currentShop}
            searchQuery={searchQuery}
            onSelectProductForInspect={(item) => setSelectedItemForInspect(item)}
            onOpenModelInspector={() => setIsModelInspectorOpen(true)}
            onAddToCart={addToCart}
            cartQuantities={cartQuantities}
          />

          {/* Product Results Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Wholesale FMCG Stock List ({selectedCategory})
              </h3>
              <span className="text-xs text-slate-500">
                Verified regional suppliers in {currentShop.serviceZoneId.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Zero-Result Recovery View */}
            {displayedResults.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4 shadow-2xs">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      No Direct Wholesale Match for "{searchQuery || selectedCategory}"
                    </h4>
                    <p className="text-xs text-slate-600">
                      Requirement #11 (Zero-Result Handling): WAYNO prevents stockouts by connecting you with nearby wholesalers or finding in-stock alternatives.
                    </p>
                  </div>
                </div>

                {/* Did You Mean fallback if available */}
                {searchResult?.fallback?.didYouMean && (
                  <div className="text-xs text-slate-700 bg-blue-50 border border-blue-200 rounded p-2.5">
                    Did you mean:{' '}
                    <button
                      onClick={() => setSearchQuery(searchResult?.fallback?.didYouMean || '')}
                      className="font-bold text-blue-700 underline hover:text-blue-900 cursor-pointer"
                    >
                      "{searchResult.fallback.didYouMean}"
                    </button>?
                  </div>
                )}

                {/* Dispatch Demand Alert */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">Request Wayno Network to Stock this SKU</div>
                    <div className="text-[11px] text-slate-500">Sends instant restock telemetry across all in-range regional fulfillment depots.</div>
                  </div>
                  <button
                    onClick={() => setDemandAlertSent(true)}
                    disabled={demandAlertSent}
                    className={`px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
                      demandAlertSent ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {demandAlertSent ? 'Restock Signal Sent!' : 'Request SKU Restock'}
                  </button>
                </div>

                {/* Closest In-Stock Substitutes */}
                {searchResult?.fallback?.closestSubstitutes && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-800">
                      Popular FMCG Staples In-Stock Now:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {searchResult.fallback.closestSubstitutes.map((sub) => (
                        <div
                          key={sub.product.id}
                          onClick={() => setSearchQuery(sub.product.name)}
                          className="p-2.5 border border-slate-200 rounded hover:border-slate-300 cursor-pointer transition-colors bg-white"
                        >
                          <div className="font-bold text-slate-900 truncate">{sub.product.name}</div>
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            KES {sub.bestSupplierProduct.price} • {sub.product.packSize}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayedResults.map((item) => {
                  const { 
                    product, 
                    bestSupplierProduct, 
                    allSuppliers, 
                    matchedAliases, 
                    deliveryEstimatedMins, 
                    relevanceScore, 
                    matchedPackSize,
                    isSponsored,
                    promotedBy,
                    promoBadge,
                    promoDiscountKES,
                    placementSlot,
                    appliedCampaignId
                  } = item;

                  const qtyInCart = getItemQuantityInCart(product.id);
                  const wholesalePrice = bestSupplierProduct.price;
                  const rrp = product.recommendedRetailPrice;
                  const isItemSponsored = Boolean(isSponsored);
                  const effectiveWholesalePrice = promoDiscountKES ? Math.max(1, wholesalePrice - promoDiscountKES) : wholesalePrice;
                  const grossProfitPerPack = rrp - effectiveWholesalePrice;
                  const marginPercent = Math.round((grossProfitPerPack / rrp) * 100);

                  return (
                    <div
                      key={product.id}
                      className={`transition-colors rounded-md p-3.5 flex flex-col justify-between ${
                        isItemSponsored
                          ? 'bg-amber-50/20 border border-amber-300 ring-1 ring-amber-200/70 shadow-2xs'
                          : 'bg-white border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Sponsored Badge if active promotion */}
                        {isItemSponsored && (
                          <div className="flex items-center justify-between bg-amber-100/90 text-amber-950 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            <span className="flex items-center space-x-1">
                              <Star className="w-2.5 h-2.5 fill-amber-700 text-amber-700" />
                              <span>{promoBadge || `Sponsored Deal • ${promotedBy || 'Manufacturer'}`}</span>
                            </span>
                            {promoDiscountKES && (
                              <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded text-[9px] font-mono">
                                -KES {promoDiscountKES} REBATE
                              </span>
                            )}
                          </div>
                        )}

                        {/* Image & Pack badge */}
                        <div className="relative h-36 w-full rounded overflow-hidden bg-slate-50 border border-slate-100">
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-900">
                            {product.packSize}
                          </div>

                          <div className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            promoDiscountKES 
                              ? 'bg-amber-100 text-amber-950 border-amber-300' 
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            +{marginPercent}% Duka Margin {promoDiscountKES ? `(Rebate Boost)` : ''}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-700">{product.brand}</span>
                            <span className="text-slate-400">{product.internalCategory}</span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-900 mt-0.5 line-clamp-2">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        {/* Match Badges & Supply Node Tree Classification */}
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {/* Tree Tier Badge */}
                          {(item.supplyNodeLevel === 'LOCAL_NODE' || product.supplyNodeLevel === 'LOCAL_NODE' || item.searchScope === 'LOCAL' || product.searchScope === 'LOCAL') ? (
                            <span 
                              className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-200 flex items-center space-x-1"
                              title={item.treeClassificationPath ? `Tree Path: ${item.treeClassificationPath}` : 'Level 2: Geofenced Local Node (≤20km)'}
                            >
                              <MapPin className="w-2.5 h-2.5 text-emerald-700" />
                              <span>Local Node (≤20km)</span>
                            </span>
                          ) : (item.supplyNodeLevel === 'REGION' || product.supplyNodeLevel === 'REGION') ? (
                            <span 
                              className="bg-purple-50 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-purple-200 flex items-center space-x-1"
                              title={item.treeClassificationPath ? `Tree Path: ${item.treeClassificationPath}` : 'Level 1: Regional Supply Corridor'}
                            >
                              <Layers className="w-2.5 h-2.5 text-purple-700" />
                              <span>Regional Corridor</span>
                            </span>
                          ) : (
                            <span 
                              className="bg-blue-50 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200 flex items-center space-x-1"
                              title="Level 0: Kenya National FMCG Grid (Universal)"
                            >
                              <Globe className="w-2.5 h-2.5 text-blue-700" />
                              <span>National Grid</span>
                            </span>
                          )}
                          {relevanceScore && (
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                              Match: {relevanceScore}/100
                            </span>
                          )}
                          {matchedPackSize && (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                              Exact Size: {matchedPackSize.raw}
                            </span>
                          )}
                          {matchedAliases.length > 0 && matchedAliases.slice(0, 2).map((al) => (
                            <span
                              key={al}
                              className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded border border-slate-200"
                            >
                              {al}
                            </span>
                          ))}
                        </div>

                        {/* Autonomous Sourcing & Delivery Zone Info */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-800 font-semibold truncate max-w-[170px] text-[11px] flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Auto-Sourced (Best Rate)</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {bestSupplierProduct.distanceKm} km transit
                            </span>
                          </div>

                          {/* Real-Time Geo-Aware Delivery Zone Corridor */}
                          {item.deliveryZone && (
                            <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center justify-between border ${
                              item.deliveryZone.zoneTier === 'LOCAL_CORRIDOR' 
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                                : item.deliveryZone.zoneTier === 'SUBCOUNTY_EXPRESS'
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}>
                              <span className="flex items-center space-x-1">
                                <Bike className="w-2.5 h-2.5 text-emerald-700" />
                                <span>{item.deliveryZone.zoneName}</span>
                              </span>
                              <span>KES {item.deliveryZone.bodaFareKES} fee</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Automated Depot Dispatch</span>
                            </span>
                            <span className="text-emerald-700 font-medium flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5" />
                              <span>~{deliveryEstimatedMins}m delivery</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Add to Cart */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">
                            Wholesale Price {promoDiscountKES ? '(Subsidized)' : ''}
                          </span>
                          <div className="flex items-baseline space-x-1.5">
                            <span className={`text-sm font-bold font-mono ${promoDiscountKES ? 'text-amber-700' : 'text-slate-900'}`}>
                              KES {effectiveWholesalePrice.toLocaleString()}
                            </span>
                            {promoDiscountKES ? (
                              <span className="text-[10px] text-slate-400 line-through font-mono">
                                KES {wholesalePrice.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 line-through">
                                KES {rrp.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add / Qty controls */}
                        {qtyInCart > 0 ? (
                          <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            <button
                              onClick={() => updateCartQuantity(product.id, -1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold border border-slate-200 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 w-4 text-center font-mono">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(product.id, 1)}
                              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center font-bold transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAdd(product, bestSupplierProduct, appliedCampaignId, promoDiscountKES)}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                              addedAnimationId === product.id
                                ? 'bg-emerald-600 text-white'
                                : isItemSponsored
                                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {addedAnimationId === product.id ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>{promoDiscountKES ? 'Claim Deal' : 'Add Pack'}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: ORDERS & DELIVERIES                                               */}
      {/* ========================================================================= */}
      {currentPage === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Procurement Orders & Deliveries</h2>
              <p className="text-xs text-slate-500">
                Track live fulfillment runs, rider dispatches, and delivery confirmation OTPs for {currentShop.name}.
              </p>
            </div>
            <button
              onClick={() => setCurrentPage('catalog')}
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded transition-colors"
            >
              + Place New Order
            </button>
          </div>

          {/* Active Orders Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Active Orders in Transit ({activeOrders.length})</span>
            </h3>

            {activeOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-md p-6 text-center space-y-2">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No active deliveries at the moment</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you checkout FMCG wholesale packs via M-Pesa, your live orders appear here with turn-by-turn dispatch status.
                </p>
                <button
                  onClick={() => setCurrentPage('catalog')}
                  className="mt-2 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded"
                >
                  Browse Wholesale Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-bold text-slate-900">{order.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold uppercase border border-slate-200">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Fulfilled by: <span className="font-medium text-slate-800">Wayno Network ({order.wholesalerName})</span> · Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Total Paid</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">KES {order.totalAmount.toLocaleString()}</span>
                        </div>
                        <button
                          onClick={() => onOrderClick(order)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                          Track Live Run
                        </button>
                      </div>
                    </div>

                    {/* OTP Security Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">
                          Your Delivery Confirmation OTP:
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-base">
                          {order.deliveryOtp}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Give this code to the rider when they arrive</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">
                          Assigned Rider:
                        </span>
                        <span className="font-semibold text-slate-800 text-xs block">
                          {order.riderName ? `${order.riderName} (${order.riderPhone})` : 'Awaiting depot dispatch / rider assignment'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Estimated delivery in ~{order.estimatedDeliveryMins} mins</span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Packs in this order:</span>
                      <div className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-1 flex items-center justify-between">
                            <span className="text-slate-800">
                              {item.quantity}x {item.productName} ({item.packSize})
                            </span>
                            <span className="font-mono text-slate-600 font-medium">
                              KES {item.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Completed Orders */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Delivered Past Orders Archive
            </h3>

            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs text-slate-900">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5">Order ID</th>
                    <th className="py-2.5 px-3.5">FMCG Items</th>
                    <th className="py-2.5 px-3.5">Fulfillment Depot</th>
                    <th className="py-2.5 px-3.5">Amount Paid</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">WN-552190</td>
                    <td className="py-2.5 px-3.5 text-slate-700">2x Jogoo Maize Meal 2kg Bale, 1x Omo Fast Action 1kg Carton</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Industrial Area Direct Supply Hub</td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">KES 6,280</td>
                    <td className="py-2.5 px-3.5">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                        DELIVERED
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button className="text-[11px] text-slate-600 hover:text-slate-900 underline font-medium">
                        View Proof
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">WN-419820</td>
                    <td className="py-2.5 px-3.5 text-slate-700">4x Menengai Cream Bar Soap Carton, 2x Ketepa Pride Tea Bags</td>
                    <td className="py-2.5 px-3.5 text-slate-600">Eastleigh Mega Wholesale Depot</td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900">KES 8,420</td>
                    <td className="py-2.5 px-3.5">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                        DELIVERED
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button className="text-[11px] text-slate-600 hover:text-slate-900 underline font-medium">
                        View Proof
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: DUKA PROFILE & GEOFENCE                                           */}
      {/* ========================================================================= */}
      {currentPage === 'profile' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Duka Profile & Logistics Geofence</h2>
            <p className="text-xs text-slate-500">
              Verified retailer coordinates, assigned Nairobi fulfillment zone, and Safaricom M-Pesa merchant account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Details Card */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-md p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Store Registration Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block">Duka Name</label>
                  <span className="font-bold text-slate-900 text-sm block">{currentShop.name}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block">Registered Proprietor</label>
                  <span className="font-semibold text-slate-800 block">{currentShop.shopOwner}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block">M-Pesa STK Mobile Number</label>
                  <span className="font-mono font-semibold text-slate-800 block">{currentShop.phone}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-medium block">Retailer Internal ID</label>
                  <span className="font-mono text-slate-600 block">{currentShop.retailerId}</span>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-medium block">Physical Delivery Address</label>
                  <span className="text-slate-800 block">{currentShop.address}</span>
                </div>
              </div>

              {/* Geofence & GPS Info */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  <span>Geospatial Zone Boundary & GPS Coordinates</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Service Zone</span>
                    <span className="font-semibold text-slate-900 uppercase">
                      {currentShop.serviceZoneId.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Latitude</span>
                    <span className="font-mono text-slate-800">{currentShop.latitude}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Longitude</span>
                    <span className="font-mono text-slate-800">{currentShop.longitude}</span>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs space-y-1.5 text-emerald-950">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Zero-Touch Autonomous Sourcing Model</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    At no point do you need to browse, compare, or choose between wholesalers. Wayno's geofencing algorithms automatically query all in-range wholesale depots, secure the lowest price, calculate optimal vehicle payload, and dispatch riders directly to your duka. You are billed a single unified amount and receive your goods at your door.
                  </p>
                </div>
              </div>
            </div>

            {/* Side Card: Wallet & Wholesale Terms */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment & Credit Terms
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Default Payment:</span>
                    <span className="font-semibold text-emerald-700">M-Pesa Express</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Payment Reconciliation:</span>
                    <span className="font-mono text-slate-800">Auto Instant</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Trade Credit Limit:</span>
                    <span className="font-mono font-bold text-slate-900">KES 25,000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Credit Term Window:</span>
                    <span className="text-slate-700">7 Days Net</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-md p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Background Supply Depots
                  </h3>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">
                    Auto-Routed
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Depots servicing your 20 km zone in the background. Wayno routes orders autonomously without requiring merchant action:
                </p>
                <div className="space-y-1.5">
                  {WHOLESALERS.map((w) => (
                    <div key={w.id} className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-900 block text-[11px]">{w.name}</span>
                      <span className="text-[10px] text-slate-500">{w.address} · Avg Dispatch {w.avgPrepTimeMinutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar when items in cart - Outlook Clean Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-30 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="bg-white text-slate-900 rounded-md p-3 sm:p-3.5 shadow-xl flex items-center justify-between border border-slate-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                {cart.reduce((acc, i) => acc + i.quantity, 0)}
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">
                  {cart.length} wholesale SKU line(s)
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                  Subtotal: KES{' '}
                  {cart
                    .reduce((acc, i) => acc + i.supplierProduct.price * i.quantity, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={openCheckout}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Review & Pay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Model Inspector Modal (Section 45) */}
      {recommendationResult && (
        <RecommendationModelInspector
          isOpen={isModelInspectorOpen}
          onClose={() => setIsModelInspectorOpen(false)}
          result={recommendationResult}
          currentShop={currentShop}
          onSimulateTime={(hour) => setSimulatedHour(hour)}
          onUpdateWeights={(w) => setRecommendationWeights((prev) => ({ ...prev, ...w }))}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};

