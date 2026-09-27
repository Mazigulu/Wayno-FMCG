import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  ArrowUpLeft,
  ArrowUp,
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
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<RetailerPage>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchSubmitted, setIsSearchSubmitted] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<SearchExecutionResultEnhanced | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);
  const [rankingStrategy, setRankingStrategy] = useState<'SMART_BALANCED' | 'PRICE_LOW' | 'DISTANCE_NEAR' | 'MARGIN_HIGH'>('SMART_BALANCED');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [demandAlertSent, setDemandAlertSent] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  // Retailer purchase interest queries for recommendation engine
  const [frequentKeywords] = useState<string[]>([
    'unga wa ugali 2kg bale',
    'bluband',
    'cooking oil',
    'njugu',
    'sabuni'
  ]);

  // Recommendations for Retailer Tray
  const [recommendationResult, setRecommendationResult] = useState<RecommendationExecutionResult | null>(null);

  // Mobile viewport detection for responsive search box layout
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const mobileSearchInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile scroll listener for Google-style Floating Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-focus input and lock background scroll when mobile Google search is active
  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSearchOpen]);

  // Compute recommendations reactively
  useEffect(() => {
    try {
      const res = generateRetailerRecommendations(
        currentShop,
        frequentKeywords,
        activeOrders
      );
      setRecommendationResult(res);
    } catch (err) {
      console.error('Failed to generate retailer recommendations:', err);
    }
  }, [currentShop, frequentKeywords, activeOrders]);

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
    'Special Deals',
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

  const handleSearchSubmit = (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (q.trim().length > 0) {
      if (overrideQuery !== undefined) {
        setSearchQuery(overrideQuery);
      }
      setIsSearchSubmitted(true);
    } else {
      setIsSearchSubmitted(false);
    }
    setSelectedCategory('All');
    setIsAutocompleteOpen(false);
    setIsMobileSearchOpen(false);
    const inputEl = document.getElementById('retailer-fmcg-search') as HTMLInputElement | null;
    inputEl?.blur();
    const topInputEl = document.getElementById('retailer-fmcg-search-top') as HTMLInputElement | null;
    topInputEl?.blur();
  };

  const handleChipClick = (query: string) => {
    setSearchQuery(query);
    setIsSearchSubmitted(true);
    setSelectedCategory('All');
    setIsAutocompleteOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleResetToHome = () => {
    setSearchQuery('');
    setIsSearchSubmitted(false);
    setSelectedCategory('All');
    setIsAutocompleteOpen(false);
    setIsMobileSearchOpen(false);
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
    if (selectedCategory === 'Special Deals') return Boolean(isSponsored || promoDiscountKES);
    if (selectedCategory === 'Flour & Staples') return product.internalCategory.includes('Flour') || product.internalCategory.includes('Grains');
    if (selectedCategory === 'Fats & Oils') return product.internalCategory.includes('Oil') || product.internalCategory.includes('Fats');
    if (selectedCategory === 'Spreads & Dairy') return product.internalCategory.includes('Spread') || product.internalCategory.includes('Dairy');
    if (selectedCategory === 'Laundry & Personal Care') return product.internalCategory.includes('Soap') || product.internalCategory.includes('Cleaning');
    if (selectedCategory === 'Beverages & Snacks') return product.internalCategory.includes('Snacks') || product.internalCategory.includes('Beverages');
    return true;
  }) || [];

  return (
    <div className="space-y-4 pb-20">
      {/* ========================================================================= */}
      {/* GOOGLE SEARCH ENGINE MOBILE FULL-SCREEN ACTIVE SEARCH OVERLAY             */}
      {/* Matches native Google Mobile search: immediate take-over with back button, */}
      {/* autofocus, clear button, trending queries, and refine diagonal arrows (↖) */}
      {/* ========================================================================= */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col sm:hidden animate-in fade-in duration-150">
          {/* Top Google Search Bar Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 bg-white shadow-2xs shrink-0">
            {/* Back button to dismiss/unfocus search overlay */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Back"
              aria-label="Back to page"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Google-style search input container */}
            <div className="flex-1 flex items-center bg-slate-100/90 rounded-full px-3.5 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 border border-slate-200 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsMobileSearchOpen(false);
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search wholesale products, brands..."
                className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-normal [&::-webkit-search-cancel-button]:hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    mobileSearchInputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors ml-1"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Direct Submit Action */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen(false);
                handleSearchSubmit();
              }}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold px-3 py-2 rounded-full cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              Search
            </button>
          </div>

          {/* Google Mobile Search Suggestions List */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white pb-8 divide-y divide-slate-100">
            {/* When user has typed query: Autocomplete predictions */}
            {searchQuery.trim().length > 0 ? (
              <>
                {suggestions.length > 0 ? (
                  <div>
                    {suggestions.map((sug, idx) => (
                      <div
                        key={`mob-sug-${sug.id}-${idx}`}
                        onClick={() => {
                          setIsMobileSearchOpen(false);
                          handleSearchSubmit(sug.query);
                        }}
                        className="px-4 py-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer flex items-center justify-between text-sm group"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                          <Search className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-slate-900">{sug.title}</span>
                            {sug.subtitle && (
                              <span className="text-xs text-slate-400 ml-2 font-normal">{sug.subtitle}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            sug.type === 'BRAND' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            sug.type === 'PACK_SIZE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            sug.type === 'CATEGORY' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {sug.badge || (sug.type === 'PRODUCT' ? 'Product' : sug.type.replace('_', ' '))}
                          </span>

                          {/* Google Refine Arrow (↖): copies query to input without submitting */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery(sug.query);
                              mobileSearchInputRef.current?.focus();
                            }}
                            className="p-2 -mr-1 text-slate-400 hover:text-slate-700 active:text-blue-600 transition-colors"
                            title="Insert into search"
                            aria-label={`Insert ${sug.title} into search`}
                          >
                            <ArrowUpLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      setIsMobileSearchOpen(false);
                      handleSearchSubmit();
                    }}
                    className="px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 cursor-pointer flex items-center space-x-3 text-sm text-blue-600 font-medium"
                  >
                    <Search className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Search wholesale inventory for <span className="font-bold underline">"{searchQuery}"</span></span>
                  </div>
                )}
              </>
            ) : (
              /* When query is empty: Google Mobile Trending Searches & Category pills */
              <div>
                <div className="px-4 pt-3 pb-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trending FMCG Searches</span>
                </div>
                {TRENDING_SEARCHES.map((item) => (
                  <div
                    key={`mob-trend-${item.query}`}
                    onClick={() => {
                      setIsMobileSearchOpen(false);
                      handleSearchSubmit(item.query);
                    }}
                    className="px-4 py-3 hover:bg-slate-50 active:bg-slate-100 cursor-pointer flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                      <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Wholesale
                      </span>
                      {/* Google Refine Arrow (↖) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery(item.query);
                          mobileSearchInputRef.current?.focus();
                        }}
                        className="p-2 -mr-1 text-slate-400 hover:text-slate-700 active:text-blue-600 transition-colors"
                        title="Insert into search"
                        aria-label={`Insert ${item.label} into search`}
                      >
                        <ArrowUpLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Popular Suggested Presets */}
                <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                  Popular Suggested Presets
                </div>
                <div className="px-4 flex flex-wrap gap-1.5 pb-4">
                  {SUGGESTED_CHIPS.map((chip) => (
                    <button
                      key={`mob-chip-${chip.query}`}
                      type="button"
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        handleChipClick(chip.query);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 active:bg-blue-50 active:text-blue-700 text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            onClick={() => {
              setCurrentPage('catalog');
              if (currentPage === 'catalog' && isSearchSubmitted) {
                handleResetToHome();
              }
            }}
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

          {/* ========================================================================= */}
          {/* SEARCH RESULTS MODE: Clean Google-Style Top Search Bar                   */}
          {/* Only the search bar is at the top in a clean model, minus trending/wholesale buttons beneath it */}
          {/* ========================================================================= */}
          {isSearchSubmitted && (
            <>
              {/* ========================================================================= */}
              {/* MOBILE GOOGLE SEARCH ENGINE RESULTS HEADER (< sm)                         */}
              {/* Full-width sticky search pill + horizontally scrollable Google filter tabs */}
              {/* ========================================================================= */}
              <div className="sm:hidden bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-xs space-y-2 sticky top-2 z-30">
                {/* Row 1: Back to Home + Full-width Google Search Bar Pill */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToHome}
                    className="flex items-center justify-center w-8 h-8 text-slate-600 hover:text-slate-900 bg-slate-100 active:bg-slate-200 rounded-full cursor-pointer transition-colors shrink-0"
                    title="Back to Home / Browse All"
                    aria-label="Back to Home"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Clean Search Pill: Tapping opens Google Mobile Search view with query pre-filled */}
                  <div
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="flex-1 flex items-center bg-white rounded-full border border-slate-300 px-3 py-1.5 shadow-2xs gap-2 cursor-pointer active:border-blue-500"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="flex-1 text-xs font-medium text-slate-900 truncate">
                      {searchQuery || 'Search wholesale goods...'}
                    </span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetToHome();
                        }}
                        className="p-0.5 rounded-full text-slate-400 hover:text-slate-700"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="bg-blue-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                      Search
                    </span>
                  </div>
                </div>

                {/* Row 2: Horizontally Scrollable Google Filter & Sort Tabs */}
                <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5 text-xs">
                  {/* Sort Pill */}
                  <div className="shrink-0">
                    <select
                      value={rankingStrategy}
                      onChange={(e) => setRankingStrategy(e.target.value as any)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full px-2.5 py-1 font-semibold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="SMART_BALANCED">⚡ Recommended</option>
                      <option value="PRICE_LOW">💰 Cheapest</option>
                      <option value="DISTANCE_NEAR">📍 Nearest</option>
                      <option value="MARGIN_HIGH">📈 Max Margin</option>
                    </select>
                  </div>

                  {/* Category Pills */}
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={`mob-res-cat-${cat}`}
                        onClick={() => setSelectedCategory((prev) => (prev === cat ? 'All' : cat))}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{cat}</span>
                        {isSelected && cat !== 'All' && <span className="ml-1 opacity-80 text-[10px]">✕</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DESKTOP GOOGLE SEARCH RESULTS HEADER (>= sm)                              */}
              {/* ========================================================================= */}
              <div className="hidden sm:block bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs space-y-2.5 sticky top-2 z-30">
                <div className="flex items-center gap-3">
                  {/* Back to Home / Reset Button */}
                  <button
                    type="button"
                    onClick={handleResetToHome}
                    className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-full cursor-pointer transition-colors text-xs font-semibold shrink-0"
                    title="Back to Home / Browse All"
                    aria-label="Back to Home"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>

                  {/* Clean Top Search Bar Input */}
                  <div className="flex-1 relative">
                    <div 
                      className={`bg-white ${
                        isAutocompleteOpen
                          ? 'absolute top-0 left-0 right-0 rounded-2xl shadow-xl border border-slate-300 z-40'
                          : 'relative w-full rounded-full border border-slate-300 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center px-4 py-2 gap-2">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="search"
                          id="retailer-fmcg-search-top"
                          name="q"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
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
                          placeholder="Search live wholesale goods (e.g. unga, oil, soap)..."
                          className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-normal truncate [&::-webkit-search-cancel-button]:hidden"
                        />

                        {searchQuery && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleResetToHome();
                            }}
                            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Clear search"
                            aria-label="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSearchSubmit();
                          }}
                          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-full shadow-xs cursor-pointer transition-all shrink-0"
                          title="Search"
                        >
                          <span className="mr-1">Search</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Autocomplete dropdown when editing in top search bar */}
                      {isAutocompleteOpen && suggestions.length > 0 && (
                        <div className="border-t border-slate-100 pt-1 pb-2 max-h-[50vh] overflow-y-auto">
                          {suggestions.map((sug, idx) => (
                            <div
                              key={`top-sug-${sug.id}-${idx}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setIsAutocompleteOpen(false);
                                handleSearchSubmit(sug.query);
                              }}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-sm group"
                            >
                              <div className="flex items-center space-x-2.5 truncate">
                                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-900 truncate">{sug.title}</span>
                                {sug.subtitle && <span className="text-xs text-slate-400 font-normal">{sug.subtitle}</span>}
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700 shrink-0">
                                {sug.badge || sug.type.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sort Dropdown on right */}
                  <div className="flex items-center space-x-1.5 shrink-0 text-slate-500">
                    <span className="text-[11px] font-medium hidden md:inline">Sort:</span>
                    <select
                      value={rankingStrategy}
                      onChange={(e) => setRankingStrategy(e.target.value as any)}
                      className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="SMART_BALANCED">Recommended</option>
                      <option value="PRICE_LOW">Cheapest</option>
                      <option value="DISTANCE_NEAR">Nearest</option>
                      <option value="MARGIN_HIGH">Max Margin</option>
                    </select>
                  </div>
                </div>

                {/* Clean Google-style Category Navigation Tabs & Results Count */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={`desk-cat-${cat}`}
                          onClick={() => setSelectedCategory((prev) => (prev === cat ? 'All' : cat))}
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span>{cat}</span>
                          {isSelected && cat !== 'All' && <span className="ml-1 opacity-80 text-[10px]">✕</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                    {displayedResults.length} {displayedResults.length === 1 ? 'result' : 'results'}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* HOME MODE: Centered Google-Style Homepage Search Section                 */}
          {/* ========================================================================= */}
          {!isSearchSubmitted && (
            <>
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
                          handleSearchSubmit(currentHero.targetProductName);
                        }}
                        className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        <span>Claim Deal (-KES {currentHero.discountKES})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Search Section - Inspired by modern Google Search */}
              <div className="bg-gradient-to-b from-white via-slate-50/50 to-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-7 shadow-xs space-y-3 sm:space-y-4">
                {/* Header & Context */}
                <div className="text-center max-w-xl mx-auto space-y-1">
                  <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">
                    Find Wholesale Goods in Seconds
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Search bulk flour, cooking oil, beverages, and daily FMCG staples at live Nairobi depot rates
                  </p>
                </div>

                {/* Google-Style Centerpiece Search Bar - Responsive, Plain & Immediate (No Animations) */}
                <div className="max-w-2xl mx-auto w-full relative min-h-[46px] sm:min-h-[56px] z-30">
                  <div 
                    onClick={() => {
                      if (isMobile) {
                        setIsMobileSearchOpen(true);
                      }
                    }}
                    className={`bg-white cursor-pointer sm:cursor-auto ${
                      isAutocompleteOpen
                        ? 'absolute top-0 left-0 right-0 rounded-2xl sm:rounded-[28px] shadow-2xl border border-slate-200/90 overflow-hidden z-40'
                        : 'relative w-full rounded-full border border-slate-200 hover:border-slate-300 shadow-md'
                    }`}
                  >
                    {/* Search Input Row (Top Unit) - Mobile Responsive Spacing */}
                    <div className="flex items-center px-3 sm:px-5 py-2 sm:py-3.5 gap-1.5 sm:gap-2">
                      {/* Search Magnifier Icon */}
                      <div className="flex items-center pointer-events-none text-slate-400 shrink-0">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                      </div>

                      {/* Input Field - flex-1 min-w-0 prevents mobile overflow and cramped typing */}
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
                        onClick={() => {
                          if (isMobile) {
                            setIsMobileSearchOpen(true);
                          }
                        }}
                        onFocus={() => {
                          if (isMobile) {
                            setIsMobileSearchOpen(true);
                          } else {
                            setIsAutocompleteOpen(true);
                          }
                        }}
                        onBlur={() => setTimeout(() => setIsAutocompleteOpen(false), 220)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearchSubmit();
                          }
                        }}
                        placeholder={
                          isMobile
                            ? "Search unga, oil, soap, drinks..."
                            : "Try 'unga 2kg bale', 'bluband', 'cooking oil 20l', or 'omo'..."
                        }
                        className="flex-1 min-w-0 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-xs sm:text-base font-normal tracking-normal truncate sm:text-clip [&::-webkit-search-cancel-button]:hidden"
                      />

                      {/* Right controls inside pill */}
                      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                        {searchQuery && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleResetToHome();
                            }}
                            className="p-1 sm:p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                            title="Clear search"
                            aria-label="Clear search"
                          >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}

                        {/* Primary Enter / Search Action Button */}
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (isMobile && !searchQuery.trim()) {
                              setIsMobileSearchOpen(true);
                            } else {
                              handleSearchSubmit();
                            }
                          }}
                          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium w-8 h-8 sm:w-auto sm:px-4 sm:py-2 rounded-full shadow-xs cursor-pointer transition-all shrink-0"
                          title="Search (Enter ↵)"
                          aria-label="Submit search"
                        >
                          <span className="hidden sm:inline sm:mr-1.5">Search</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Extended Unit Content: Plain & Immediate without animations */}
                    {isAutocompleteOpen && (
                      <div className="border-t border-slate-100/90 pt-1 pb-2.5 text-slate-700 max-h-[60vh] sm:max-h-[420px] overflow-y-auto">
                        {/* Empty query: Show Trending FMCG Searches */}
                        {!searchQuery.trim() && (
                          <div className="pt-1">
                            <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                              Trending Searches
                            </div>
                            {TRENDING_SEARCHES.map((item) => (
                              <div
                                key={item.query}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setIsAutocompleteOpen(false);
                                  handleSearchSubmit(item.query);
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
                        )}

                        {/* Autocomplete Predictions when typing */}
                        {searchQuery.trim() && suggestions.length > 0 && (
                          <div className="space-y-0.5">
                            {suggestions.map((sug, idx) => (
                              <div
                                key={`${sug.id}-${idx}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setIsAutocompleteOpen(false);
                                  handleSearchSubmit(sug.query);
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
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      if (searchQuery.trim()) {
                        handleSearchSubmit();
                      } else {
                        handleSearchSubmit('unga');
                      }
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 sm:px-4 py-1.5 rounded-full cursor-pointer border border-slate-200 text-xs"
                  >
                    Search Wholesale
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const randomChip = SUGGESTED_CHIPS[Math.floor(Math.random() * SUGGESTED_CHIPS.length)];
                      handleChipClick(randomChip.query);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 sm:px-4 py-1.5 rounded-full cursor-pointer border border-slate-200 flex items-center space-x-1.5 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>I'm Feeling Lucky</span>
                  </button>

                  {/* Ranking Mode Dropdown */}
                  <div className="flex items-center space-x-1.5 pl-0 sm:pl-2 sm:border-l sm:border-slate-200 text-slate-500">
                    <span className="text-[11px] font-medium hidden sm:inline">Sort:</span>
                    <select
                      value={rankingStrategy}
                      onChange={(e) => setRankingStrategy(e.target.value as any)}
                      className="text-xs bg-white border border-slate-200 rounded-full px-2.5 sm:px-3 py-1 font-medium text-slate-700 hover:border-slate-300 focus:outline-none cursor-pointer"
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
                      onClick={() => handleChipClick(chip.query)}
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
            </>
          )}

          {/* Product Results Grid */}
          <div className="space-y-3">
            {/* Google Results Stats Bar & Did You Mean Spell Check */}
            {isSearchSubmitted && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-600 font-medium">
                      About {displayedResults.length} wholesale {displayedResults.length === 1 ? 'result' : 'results'} ({((searchResult?.executionTimeMs || 4) / 1000).toFixed(2)}s)
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-500">
                      Nairobi {currentShop.serviceZoneId.replace(/_/g, ' ')} corridor
                    </span>
                  </div>
                  <button
                    onClick={handleResetToHome}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer text-xs shrink-0 ml-2"
                  >
                    Clear / Home
                  </button>
                </div>

                {searchResult?.fallback?.didYouMean && (
                  <div className="bg-blue-50/90 border border-blue-200 rounded-lg p-2.5 sm:p-3 text-xs text-slate-800 flex items-center space-x-1.5 shadow-2xs">
                    <span className="text-slate-600">
                      Showing results for <span className="font-semibold text-slate-900 italic">"{searchQuery}"</span>. Did you mean:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const fallback = searchResult?.fallback?.didYouMean || '';
                        setSelectedCategory('All');
                        setSearchQuery(fallback);
                        handleSearchSubmit(fallback);
                      }}
                      className="font-bold text-blue-700 underline hover:text-blue-900 cursor-pointer italic"
                    >
                      "{searchResult.fallback.didYouMean}"
                    </button>?
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              {isSearchSubmitted ? (
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Wholesale Results for <span className="text-blue-700 normal-case font-extrabold">"{searchQuery}"</span>
                  </h3>
                  {selectedCategory !== 'All' && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                      Category: {selectedCategory}
                    </span>
                  )}
                </div>
              ) : (
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Wholesale FMCG Stock List ({selectedCategory})
                </h3>
              )}
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span className="hidden sm:inline">
                  Verified regional suppliers in {currentShop.serviceZoneId.replace(/_/g, ' ')}
                </span>
                {isSearchSubmitted && (
                  <button
                    onClick={handleResetToHome}
                    className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer text-xs"
                  >
                    View all products
                  </button>
                )}
              </div>
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
                <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-4 shadow-2xs">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        Your search - <span className="text-blue-700 italic">"{searchQuery || selectedCategory}"</span> - did not match any wholesale products.
                      </h4>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-medium text-slate-700">Suggestions:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
                          <li>Make sure all words are spelled correctly.</li>
                          <li>Try different keywords or broader terms (e.g. "unga", "cooking oil", "soap").</li>
                          <li>Try fewer keywords or clear the active category filter.</li>
                        </ul>
                      </div>

                      {/* Quick alternative pills */}
                      <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] font-semibold text-slate-500 mr-1">Popular wholesale staples:</span>
                        {['unga 2kg', 'cooking oil', 'blue band', 'menengai soap', 'royco'].map((term) => (
                          <button
                            key={`zero-sug-${term}`}
                            type="button"
                            onClick={() => {
                              setSelectedCategory('All');
                              setSearchQuery(term);
                              handleSearchSubmit(term);
                            }}
                            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-blue-50 active:text-blue-700 text-slate-700 border border-slate-200 cursor-pointer font-medium"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Did You Mean fallback if available */}
                  {searchResult?.fallback?.didYouMean && (
                    <div className="text-xs text-slate-700 bg-blue-50 border border-blue-200 rounded p-2.5">
                      Did you mean:{' '}
                      <button
                        onClick={() => {
                          const fallback = searchResult?.fallback?.didYouMean || '';
                          setSelectedCategory('All');
                          setSearchQuery(fallback);
                          handleSearchSubmit(fallback);
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
                              navigate(`/product/${sub.product.id}`);
                            }}
                            className="p-2.5 border border-slate-200 rounded hover:border-slate-300 hover:shadow-2xs cursor-pointer transition-all bg-white group"
                          >
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 truncate">{sub.product.name}</div>
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
                              <span>{promoBadge?.startsWith('Sponsored Deal') ? promoBadge : `Sponsored Deal • ${promotedBy || product.brand || 'Manufacturer'}`}</span>
                            </span>
                            {promoDiscountKES && (
                              <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap inline-flex items-center space-x-1.5 shadow-2xs shrink-0">
                                <span className="line-through text-amber-200">
                                  KES {wholesalePrice.toLocaleString()}
                                </span>
                                <span className="font-bold text-white">
                                  KES {effectiveWholesalePrice.toLocaleString()}
                                </span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Clickable Product Header, Image & Details - Navigates to wholesale terminal */}
                        <div
                          onClick={() => {
                            recordSearchResultClick(searchQuery || 'catalog', product.id);
                            navigate(`/product/${product.id}`);
                          }}
                          className="cursor-pointer group space-y-2.5"
                        >
                          {/* Image & Pack badge */}
                          <div className="relative h-36 w-full rounded overflow-hidden bg-slate-50 border border-slate-100">
                            <img
                              src={product.image}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                              +{marginPercent}% Duka Margin {promoDiscountKES ? `(Discount Boost)` : ''}
                            </div>
                          </div>

                          {/* Product Details */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-700">{product.brand}</span>
                              <span className="text-slate-400">{product.internalCategory}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-900 mt-0.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center text-[10px] font-semibold text-slate-800 group-hover:text-blue-600 group-hover:underline mt-1 pt-0.5">
                              <span>Wholesale Details & Logistics</span>
                              <ArrowRight className="w-2.5 h-2.5 ml-1" />
                            </div>
                          </div>
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
                        <div
                          onClick={() => {
                            recordSearchResultClick(searchQuery || 'catalog', product.id);
                            navigate(`/product/${product.id}`);
                          }}
                          className="cursor-pointer"
                        >
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
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQuantity(product.id, -1);
                              }}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold border border-slate-200 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 w-4 text-center font-mono">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateCartQuantity(product.id, 1);
                              }}
                              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdd(product, bestSupplierProduct, appliedCampaignId, promoDiscountKES);
                            }}
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

      {/* Google-Style Floating Back to Top Button on Mobile */}
      {showBackToTop && isMobile && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed right-4 z-40 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg flex items-center space-x-1.5 border border-slate-700 cursor-pointer backdrop-blur-xs transition-all ${
            cart.length > 0 ? 'bottom-20' : 'bottom-6'
          }`}
          title="Back to Top"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Top</span>
        </button>
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

