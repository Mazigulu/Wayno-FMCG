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
  TrendingUp,
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
  Layers,
  Globe,
  Compass,
  CheckCircle2,
  Sliders,
  Filter,
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
import { SearchExecutionResultEnhanced, AutocompleteSuggestion } from '../types/search';
import { PRODUCTS, SUPPLIER_PRODUCTS, WHOLESALERS } from '../data/mockData';
import { 
  generateRetailerRecommendations 
} from '../services/recommendationEngine';
import { 
  RecommendationExecutionResult 
} from '../types/recommendation';
import { RetailerRecommendationTray } from './RetailerRecommendationTray';

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

  // Recommendations for Retailer Tray
  const [recommendationResult, setRecommendationResult] = useState<RecommendationExecutionResult | null>(null);

  // Compute recommendations reactively
  useEffect(() => {
    try {
      const res = generateRetailerRecommendations(
        currentShop,
        recentSearches,
        activeOrders
      );
      setRecommendationResult(res);
    } catch (err) {
      console.error('Failed to generate retailer recommendations:', err);
    }
  }, [currentShop, recentSearches, activeOrders]);

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

  const TRENDING_SEARCHES = [
    { label: 'Unga 2kg Bale (Jogoo / Ndovu)', query: 'unga 2kg' },
    { label: 'Cooking Oil 20L Jerrycan', query: 'cooking oil' },
    { label: 'Royco Mchuzi Mix Cubes', query: 'royco' },
    { label: 'Broadways Bread White 400g', query: 'broadways' },
    { label: 'Menengai Cream Bar Soap', query: 'menengai' }
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

  // Perform search on query or ranking strategy changes
  useEffect(() => {
    const searchOptions = {
      userLat: currentShop.latitude,
      userLng: currentShop.longitude,
      shopId: currentShop.id,
      rankingStrategy,
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
  }, [searchQuery, currentShop, rankingStrategy]);

  // Debounced registration of typed searches into recent searches
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        addToRecentSearches(searchQuery);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    const clean = searchQuery.trim();
    if (clean) {
      addToRecentSearches(clean);
    }
    setSelectedCategory('All');
    setIsAutocompleteOpen(false);
    const inputEl = document.getElementById('retailer-fmcg-search') as HTMLInputElement | null;
    inputEl?.blur();
  };

  const handleChipClick = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory('All');
    addToRecentSearches(query);
    setIsAutocompleteOpen(false);
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
      <div className="bg-white border border-slate-200 rounded-md p-3.5 sm:p-4 text-slate-900 shadow-2xs min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 min-w-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 truncate">{currentShop.name}</h1>
                <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                  {currentShop.serviceZoneId.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-full">
                {currentShop.address} · Owner: {currentShop.shopOwner}
              </p>
            </div>
          </div>

          {/* Quick shop switcher */}
          <div className="flex items-center space-x-2 shrink-0 min-w-0 max-w-full sm:max-w-[240px] md:max-w-[280px]">
            <label className="text-[11px] text-slate-500 font-medium hidden md:inline shrink-0">Switch Duka:</label>
            <select
              value={currentShop.id}
              onChange={(e) => onSelectShop(e.target.value)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded px-2.5 py-1.5 font-medium focus:border-slate-800 focus:outline-none transition-colors cursor-pointer w-full min-w-0 max-w-full truncate"
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
          {/* Hero Search Section - Inspired by modern Google Search */}
          <div className="bg-gradient-to-b from-white via-slate-50/50 to-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
            {/* Header & Context */}
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
                Find Wholesale Goods in Seconds
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Search bulk flour, cooking oil, beverages, and daily FMCG staples at live Nairobi depot rates
              </p>
            </div>

            {/* Google-Style Centerpiece Search Bar - Plain & Immediate (No Animations) */}
            <div className="max-w-2xl mx-auto w-full relative min-h-[52px] sm:min-h-[56px] z-30">
              <div 
                className={`bg-white ${
                  isAutocompleteOpen
                    ? 'absolute top-0 left-0 right-0 rounded-[28px] shadow-2xl border border-slate-200/90 overflow-hidden z-40'
                    : 'relative w-full rounded-full border border-slate-200 hover:border-slate-300 shadow-md'
                }`}
              >
                {/* Search Input Row (Top Unit) */}
                <div className="flex items-center px-4 sm:px-5 py-3 sm:py-3.5">
                  {/* Search Magnifier Icon */}
                  <div className="pr-2 sm:pr-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>

                  {/* Input Field */}
                  <input
                    type="search"
                    id="retailer-fmcg-search"
                    name="q"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedCategory !== 'All') {
                        setSelectedCategory('All');
                      }
                      setIsAutocompleteOpen(true);
                    }}
                    onFocus={() => setIsAutocompleteOpen(true)}
                    onBlur={() => setTimeout(() => setIsAutocompleteOpen(false), 220)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit();
                      }
                    }}
                    placeholder="Try 'unga 2kg bale', 'bluband', 'cooking oil 20l', or 'omo'..."
                    className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm sm:text-base font-normal tracking-normal [&::-webkit-search-cancel-button]:hidden"
                  />

                  {/* Right controls inside pill */}
                  <div className="pr-1 sm:pr-1.5 flex items-center space-x-1.5 shrink-0">
                    {searchQuery && (
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setIsAutocompleteOpen(false);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Primary Enter / Search Action Button */}
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSearchSubmit();
                      }}
                      className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-xs cursor-pointer"
                      title="Search (Enter ↵)"
                    >
                      <span>Search</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Extended Unit Content: Plain & Immediate without animations */}
                {isAutocompleteOpen && (
                  <div className="border-t border-slate-100/90 pt-1 pb-2.5 text-slate-700">
                    {/* Empty query: Show Recent Searches & Trending FMCG Searches */}
                    {!searchQuery.trim() && (
                      <>
                        {recentSearches.length > 0 && (
                          <div className="mb-2">
                            <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 flex justify-between items-center tracking-wider uppercase">
                              <span>Recent Searches</span>
                              <button
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  clearRecentSearches();
                                }}
                                className="text-[11px] text-slate-400 hover:text-red-600 font-semibold cursor-pointer lowercase"
                              >
                                Clear history
                              </button>
                            </div>
                            {recentSearches.map((term) => (
                              <div
                                key={term}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSearchQuery(term);
                                  setSelectedCategory('All');
                                  addToRecentSearches(term);
                                  setIsAutocompleteOpen(false);
                                }}
                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm group"
                              >
                                <div className="flex items-center space-x-3 text-slate-700 group-hover:text-blue-600 min-w-0">
                                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="font-medium text-slate-800 truncate">{term}</span>
                                </div>
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeFromRecentSearches(term);
                                  }}
                                  className="text-slate-300 hover:text-red-500 p-1 rounded"
                                  title="Remove"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Trending Searches Section */}
                        <div className={recentSearches.length > 0 ? "border-t border-slate-100 pt-2" : "pt-1"}>
                          <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                            Trending Searches
                          </div>
                          {TRENDING_SEARCHES.map((item) => (
                            <div
                              key={item.query}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSearchQuery(item.query);
                                setSelectedCategory('All');
                                addToRecentSearches(item.query);
                                setIsAutocompleteOpen(false);
                              }}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm group"
                            >
                              <div className="flex items-center space-x-3 text-slate-700 group-hover:text-blue-600 min-w-0">
                                <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-800 truncate">{item.label}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Wholesale
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Autocomplete Predictions when typing */}
                    {searchQuery.trim() && suggestions.length > 0 && (
                      <div className="space-y-0.5">
                        {suggestions.map((sug, idx) => (
                          <div
                            key={`${sug.id}-${idx}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSearchQuery(sug.query);
                              setSelectedCategory('All');
                              addToRecentSearches(sug.query);
                              setIsAutocompleteOpen(false);
                            }}
                            className="px-4 py-2.5 hover:bg-slate-50/90 cursor-pointer flex items-center justify-between text-sm group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <Search className="w-4 h-4 text-slate-400 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900">{sug.title}</span>
                                {sug.subtitle && (
                                  <span className="text-xs text-slate-400 ml-2 font-normal">{sug.subtitle}</span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 tracking-wider ${
                              sug.type === 'BRAND' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              sug.type === 'PACK_SIZE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              sug.type === 'CATEGORY' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {sug.badge || (sug.type === 'PRODUCT' ? 'Product' : sug.type.replace('_', ' '))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* If user is typing and no suggestions yet */}
                    {searchQuery.trim() && suggestions.length === 0 && (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSearchSubmit();
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center space-x-3 text-sm text-blue-600 group"
                      >
                        <Search className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-medium">
                          Search live wholesale inventory for <span className="font-bold underline">"{searchQuery}"</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Google-Style Action Buttons & Sort Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              <button
                onClick={() => {
                  addToRecentSearches(searchQuery || 'Popular');
                  setSelectedCategory('All');
                  setIsAutocompleteOpen(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-1.5 rounded-full cursor-pointer border border-slate-200"
              >
                Search Wholesale
              </button>

              <button
                onClick={() => {
                  const randomChip = SUGGESTED_CHIPS[Math.floor(Math.random() * SUGGESTED_CHIPS.length)];
                  setSelectedCategory('All');
                  handleChipClick(randomChip.query);
                  setIsAutocompleteOpen(false);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-1.5 rounded-full cursor-pointer border border-slate-200 flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>I'm Feeling Lucky</span>
              </button>

              {/* Ranking Mode Dropdown */}
              <div className="flex items-center space-x-1.5 pl-2 sm:border-l sm:border-slate-200 text-slate-500">
                <span className="text-[11px] font-medium hidden sm:inline">Sort:</span>
                <select
                  value={rankingStrategy}
                  onChange={(e) => setRankingStrategy(e.target.value as any)}
                  className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1 font-medium text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="SMART_BALANCED">Recommended (Balanced)</option>
                  <option value="PRICE_LOW">Cheapest Wholesale</option>
                  <option value="DISTANCE_NEAR">Nearest Depot</option>
                  <option value="MARGIN_HIGH">Max Profit Margin</option>
                </select>
              </div>
            </div>

            {/* Popular Suggested Presets as Google-style pills */}
            <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1 text-xs">
              <span className="text-slate-400 font-medium text-[11px] mr-1">Trending:</span>
              {SUGGESTED_CHIPS.map((chip) => (
                <button
                  key={chip.query}
                  onClick={() => {
                    handleChipClick(chip.query);
                    setIsAutocompleteOpen(false);
                  }}
                  className={`px-3 py-1 rounded-full font-medium text-xs cursor-pointer border ${
                    searchQuery.toLowerCase() === chip.query.toLowerCase()
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pt-3 border-t border-slate-200/80 text-xs justify-center">
              <span className="text-slate-400 font-medium shrink-0 text-[11px] mr-1">Categories:</span>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory((prev) => (prev === cat ? 'All' : cat));
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat}</span>
                    {isSelected && cat !== 'All' && (
                      <span className="ml-1.5 opacity-80 text-[10px]">✕</span>
                    )}
                  </button>
                );
              })}
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline shrink-0 cursor-pointer ml-1.5"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Recommendation Tray for Quick Restock */}
          <RetailerRecommendationTray
            recommendationResult={recommendationResult}
            currentShop={currentShop}
            searchQuery={searchQuery}
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
              selectedCategory !== 'All' && (searchResult?.results.length ?? 0) > 0 ? (
                <div className="bg-white border border-blue-200 rounded-md p-5 space-y-3 shadow-2xs">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded shrink-0">
                      <Filter className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        {searchResult?.results.length} wholesale {searchResult?.results.length === 1 ? 'item found' : 'items found'} in another category
                      </h4>
                      <p className="text-xs text-slate-600">
                        Category filter <span className="font-semibold text-blue-700">"{selectedCategory}"</span> is active, but your search for <span className="font-semibold text-slate-900">"{searchQuery}"</span> matches products in a different department.
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md cursor-pointer transition-colors shadow-xs"
                    >
                      Show All {searchResult?.results.length} Matches (Uncouple Category)
                    </button>
                  </div>
                </div>
              ) : (
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
                        We couldn't find an exact match right now. Check our in-stock substitutes below or request the network to stock this SKU.
                      </p>
                    </div>
                  </div>

                  {/* Did You Mean fallback if available */}
                  {searchResult?.fallback?.didYouMean && (
                    <div className="text-xs text-slate-700 bg-blue-50 border border-blue-200 rounded p-2.5">
                      Did you mean:{' '}
                      <button
                        onClick={() => {
                          setSelectedCategory('All');
                          setSearchQuery(searchResult?.fallback?.didYouMean || '');
                        }}
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
                      <div className="text-[11px] text-slate-500">Sends instant restock request across all in-range regional fulfillment depots.</div>
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
                            onClick={() => {
                              setSelectedCategory('All');
                              setSearchQuery(sub.product.name);
                            }}
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
              )
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
                          {matchedPackSize && (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-200">
                              {matchedPackSize.raw}
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
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar when items in cart - Outlook Clean Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-30">
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
    </div>
  );
};

