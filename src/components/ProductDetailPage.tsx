import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  MapPin,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  Share2,
  Package,
  AlertCircle,
  BadgeCheck,
  TrendingUp,
  Tag,
  ChevronRight,
  Copy,
  CircleDollarSign,
  Scale
} from 'lucide-react';
import { useWayno } from '../context/WaynoContext';
import { Product, SupplierProduct } from '../types/wayno';
import { INITIAL_PROMOTIONAL_PLACEMENTS } from '../data/promotionsData';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const {
    products,
    supplierProducts,
    currentShop,
    cart,
    addToCart,
    setIsCartOpen,
  } = useWayno();

  // Find target product
  const product = useMemo(() => {
    return products.find(
      (p) => p.id === productId || p.product_id === productId
    );
  }, [products, productId]);

  // Automated corridor supplier assignment (best wholesale rate & proximity)
  const activeSupplier = useMemo(() => {
    if (!product) return null;
    const available = supplierProducts
      .filter((sp) => sp.productId === product.id && sp.availability)
      .sort((a, b) => a.price - b.price);
    if (available.length > 0) return available[0];
    const anyMatching = supplierProducts.find((sp) => sp.productId === product.id);
    if (anyMatching) return anyMatching;
    return {
      id: `supp_${product.id}`,
      supplierId: 'hub_nairobi',
      wholesalerLocationId: 'loc_corridor_hub',
      productId: product.id,
      price: product.wholesalePrice || 1000,
      availability: true,
      stockQty: 100,
      updatedAt: 'Just now',
      wholesalerName: 'Corridor Fulfillment Hub',
      distanceKm: 2.5,
    };
  }, [supplierProducts, product]);

  // Check if there is an active trade promotion or manufacturer rebate
  const activePromo = useMemo(() => {
    if (!product) return null;
    return INITIAL_PROMOTIONAL_PLACEMENTS.find(
      (c) => c.status === 'ACTIVE' && c.targetProductId === product.id
    );
  }, [product]);

  // Order quantity
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedViewIndex, setSelectedViewIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // Category alternatives / substitutes
  const alternativeProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (p) =>
          p.id !== product.id &&
          (p.internalCategory === product.internalCategory || p.brand === product.brand)
      )
      .slice(0, 4);
  }, [products, product]);

  // Pricing & margin calculations
  const rawPrice = activeSupplier ? activeSupplier.price : product?.wholesalePrice || 1000;
  const promoDiscount = activePromo?.discountKES || 0;
  const effectiveWholesalePrice = Math.max(1, rawPrice - promoDiscount);
  const rrp = product?.recommendedRetailPrice || Math.round(effectiveWholesalePrice * 1.25);
  const unitProfit = rrp - effectiveWholesalePrice;
  const marginPercent = Math.round((unitProfit / rrp) * 100);

  // Packet breakdown approximation (e.g. 12 or 24 units inside bale/carton)
  const estimatedPackPieces = useMemo(() => {
    if (!product) return 12;
    const match = product.packSize.match(/(\d+)\s*(pk|pkts|cans|tubs|bars|loaves|pouches|jerrycans|sachets)/i);
    if (match) return parseInt(match[1], 10);
    return 12;
  }, [product]);

  const wholesalePerPiece = Math.round((effectiveWholesalePrice / estimatedPackPieces) * 100) / 100;
  const resalePerPiece = Math.round((rrp / estimatedPackPieces) * 100) / 100;
  const profitPerPiece = Math.round((resalePerPiece - wholesalePerPiece) * 100) / 100;

  // In-cart quantity check
  const cartItem = cart.find((item) => item.product.id === product?.id);
  const currentCartQty = cartItem ? cartItem.quantity : 0;

  // Multiple inspection angles for packaging & logistics
  const inspectionViews = useMemo(() => {
    if (!product) return [];
    const baseImg = product.image;
    return [
      {
        id: 'outer_case',
        title: 'Master Trade Packaging',
        subtitle: `Wholesale outer ${product.unit.toLowerCase()}`,
        imageUrl: baseImg,
      },
      {
        id: 'consumer_unit',
        title: 'Retail Display Unit',
        subtitle: 'Individual shop counter shelf presentation',
        imageUrl: baseImg,
      },
      {
        id: 'compliance',
        title: 'KEBS Quality & Barcode',
        subtitle: `EAN-13 ${product.barcode} Verified Batch`,
        imageUrl: baseImg,
      },
    ];
  }, [product]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyBarcode = () => {
    if (product && navigator.clipboard) {
      navigator.clipboard.writeText(product.barcode);
      setCopiedBarcode(true);
      setTimeout(() => setCopiedBarcode(false), 2000);
    }
  };

  const handleAddToCart = () => {
    if (!product || !activeSupplier) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product, activeSupplier, activePromo?.id, promoDiscount);
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const handleInstantDispatch = () => {
    if (!product || !activeSupplier) return;
    addToCart(product, activeSupplier, activePromo?.id, promoDiscount);
    setIsCartOpen(true);
  };

  if (!product) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-4 max-w-2xl mx-auto mt-8 shadow-xs">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Wholesale SKU Not Found</h2>
        <p className="text-sm text-slate-600">
          This product is currently not cataloged in your active corridor territory.
        </p>
        <Link
          to="/retailer"
          className="inline-flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Wholesale Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Wholesale Terminal Top Bar & Breadcrumbs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-slate-500 flex-wrap">
            <Link
              to="/retailer"
              className="text-slate-900 hover:text-slate-700 font-semibold flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
              <span>Catalog</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">{product.internalCategory}</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{product.brand}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 truncate max-w-xs">{product.name}</span>
          </div>

          {/* Corridor & Quick Utility Controls */}
          <div className="flex items-center space-x-3 text-slate-500 shrink-0 flex-wrap gap-y-1">
            <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {currentShop.name} · {currentShop.serviceZoneId.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="text-slate-300">·</span>
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Copy product link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied' : 'Share SKU'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Executive Dossier & Rapid Replenishment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Industrial Trade Packaging & Physical Logistics (5 of 12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
            {/* Packaging Image Stage */}
            <div className="relative aspect-4/3 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center">
              <img
                src={inspectionViews[selectedViewIndex]?.imageUrl || product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />

              {/* Master Pack Overlay */}
              <div className="absolute top-3 left-3 bg-slate-900/90 text-white px-2.5 py-1 rounded text-xs font-mono font-semibold shadow-xs">
                {product.packSize}
              </div>

              {/* Genuine Certification */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs flex items-center space-x-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>KEBS Certified Genuine</span>
              </div>

              {/* Unit Resale Profit Indicator */}
              <div className="absolute bottom-3 left-3 bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold shadow-xs flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{marginPercent}% Resale Profit</span>
              </div>
            </div>

            {/* Inspection Views Selector */}
            <div className="grid grid-cols-3 gap-2">
              {inspectionViews.map((view, idx) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedViewIndex(idx)}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedViewIndex === idx
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-900 block truncate">
                    {view.title}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {view.subtitle}
                  </span>
                </button>
              ))}
            </div>

            {/* Physical Logistics & Courier Feasibility Card */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center space-x-1">
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  <span>Physical Handling & Transport</span>
                </span>
                <span className="font-mono text-slate-900 font-medium">
                  {product.unitWeightKg ? `${product.unitWeightKg} kg` : 'Trade Standard'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block uppercase font-medium text-[9px]">
                    Courier Carrier Class
                  </span>
                  <span className="font-bold text-slate-800">
                    Boda-Friendly (≤ 25kg)
                  </span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">
                    Max 2 bales per motorcycle rack
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block uppercase font-medium text-[9px]">
                    Turnover Velocity
                  </span>
                  <span className="font-bold text-emerald-700">
                    Class A (High Frequency)
                  </span>
                  <span className="text-slate-500 text-[10px] block mt-0.5">
                    Avg shop restock: 2-3 days
                  </span>
                </div>
              </div>

              {/* Barcode Quick Copy */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Master EAN-13 Barcode
                  </span>
                  <span className="font-mono font-bold text-slate-900 tracking-wider">
                    {product.barcode}
                  </span>
                </div>
                <button
                  onClick={handleCopyBarcode}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:text-slate-900 text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  {copiedBarcode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Commercial Economics, Wholesale Pricing & Order Console (7 of 12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Product Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{product.brand}</span>
                <span>·</span>
                <span>{product.manufacturer}</span>
                <span>·</span>
                <span className="font-mono">{product.unit}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {product.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                {product.description}
              </p>
            </div>

            {/* Active Discount Banner if present */}
            {promoDiscount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold block">
                      Manufacturer Trade Discount: -KES {promoDiscount} / {product.unit}
                    </span>
                    <span className="text-amber-800 text-[11px]">
                      Subsidy automatically deducted at wholesale billing.
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs bg-amber-200/70 px-2 py-0.5 rounded text-amber-950 flex items-center space-x-1.5">
                  <span className="line-through text-amber-800/70 font-normal">
                    KES {rawPrice.toLocaleString()}
                  </span>
                  <span>
                    KES {effectiveWholesalePrice.toLocaleString()}
                  </span>
                </span>
              </div>
            )}

            {/* The Kiosk Profit & Unit Economics Matrix */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                    Master Wholesale Price ({product.unit})
                  </span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                      KES {effectiveWholesalePrice.toLocaleString()}
                    </span>
                    {promoDiscount > 0 && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        KES {rawPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium">
                      per {product.unit.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                    Kiosk Unit Margin
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    +KES {unitProfit.toLocaleString()} ({marginPercent}%)
                  </span>
                </div>
              </div>

              {/* Breakdown Per Single Retail Packet/Piece */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Wholesale Cost / Pkt
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    KES {wholesalePerPiece.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    approx {estimatedPackPieces} units
                  </span>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Consumer Resale (RRP)
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    KES {resalePerPiece.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    shelf price
                  </span>
                </div>

                <div className="p-2 bg-emerald-50/60 rounded border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block uppercase font-medium">
                    Profit Per Piece
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    +KES {profitPerPiece.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    +{marginPercent}% margin
                  </span>
                </div>
              </div>
            </div>

            {/* Replenishment Order Panel */}
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 block uppercase tracking-wide">
                  Order Quantity ({product.unit}s):
                </label>

                {/* Presets and Stepper */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center font-mono font-bold text-base text-slate-900 py-1">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity Preset Buttons */}
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 5, 10].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setQuantity(preset)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          quantity === preset
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset} {preset === 1 ? product.unit : `${product.unit}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Order Math */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Total Wholesale Investment:</span>
                  <div className="font-mono font-bold text-slate-900 text-base">
                    KES {(effectiveWholesalePrice * quantity).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Projected Kiosk Revenue:</span>
                  <div className="font-mono font-bold text-slate-900 text-base">
                    KES {(rrp * quantity).toLocaleString()}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-emerald-800 font-semibold">Total Expected Profit:</span>
                  <div className="font-mono font-bold text-emerald-700 text-base">
                    +KES {(unitProfit * quantity).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleAddToCart}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Added {quantity} {product.unit} to Cart!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>
                        Add {quantity} {quantity === 1 ? product.unit : `${product.unit}s`} to Cart
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleInstantDispatch}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Instant Dispatch (Checkout)</span>
                </button>
              </div>

              {currentCartQty > 0 && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-medium flex items-center justify-between">
                  <span>Currently in active order cart:</span>
                  <span className="font-mono font-bold">
                    {currentCartQty} {product.unit}{currentCartQty > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Trade Assurance & Fulfillment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>25-35 min Boda dispatch</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero-loss burst replacement</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CircleDollarSign className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>M-Pesa Till / COD on arrival</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Wholesale Brands in this Category */}
      {alternativeProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Alternative Wholesale Brands in {product.internalCategory}
            </h3>
            <Link
              to="/retailer"
              className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center space-x-1"
            >
              <span>View Full Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {alternativeProducts.map((alt) => {
              const altSupplier =
                supplierProducts.find((sp) => sp.productId === alt.id && sp.availability) ||
                supplierProducts.find((sp) => sp.productId === alt.id);
              const price = altSupplier?.price || alt.wholesalePrice || 1200;

              return (
                <div
                  key={alt.id}
                  onClick={() => navigate(`/product/${alt.id}`)}
                  className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-400 hover:shadow-2xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-4/3 w-full bg-slate-50 rounded overflow-hidden border border-slate-100 flex items-center justify-center">
                      <img
                        src={alt.image}
                        alt={alt.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">{alt.brand}</div>
                    <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                      {alt.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold font-mono text-slate-900">
                      KES {price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {alt.packSize}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
