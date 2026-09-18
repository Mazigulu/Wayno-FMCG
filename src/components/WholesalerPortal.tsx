import React, { useState } from 'react';
import { 
  Building, 
  Package, 
  Check, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Bike, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight,
  Store,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Calendar,
  CheckCircle2,
  Layers,
  MapPin,
  Truck,
  X,
  AlertTriangle,
  Plus,
  SlidersHorizontal,
  Edit3,
  Trash2,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { Order, WholesalerLocation, Product, SupplierProduct } from '../types/wayno';
import { WHOLESALERS } from '../data/mockData';
import { useWayno } from '../context/WaynoContext';

export type WholesalerPage = 'dispatch' | 'inventory' | 'analytics';

interface WholesalerPortalProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: any, note: string) => void;
  onSubstituteOrderItem?: (
    orderId: string,
    itemIdx: number,
    newProduct: Product,
    newSupplierProduct: SupplierProduct,
    reason: string
  ) => void;
}

export const WholesalerPortal: React.FC<WholesalerPortalProps> = ({
  orders,
  onUpdateOrderStatus,
  onSubstituteOrderItem,
}) => {
  const {
    products,
    supplierProducts,
    handleAdoptProductForWholesaler,
    handleUpdateWholesalerProductPriceAndStock,
    handleRemoveWholesalerProduct,
  } = useWayno();

  const [currentPage, setCurrentPage] = useState<WholesalerPage>('dispatch');
  const [selectedWholesalerId, setSelectedWholesalerId] = useState<string>(WHOLESALERS[0].id);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<number>(0);
  const [inventorySearch, setInventorySearch] = useState('');
  const [dispatchFilter, setDispatchFilter] = useState<'ALL' | 'PENDING' | 'STAGED' | 'DISPATCHED'>('ALL');

  // Section 13 Wholesaler Customization State
  const [inventoryTab, setInventoryTab] = useState<'my_depot' | 'platform_catalog'>('my_depot');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('ALL');
  const [adoptingProduct, setAdoptingProduct] = useState<Product | null>(null);
  const [alteringSp, setAlteringSp] = useState<{ sp: SupplierProduct; product: Product } | null>(null);
  const [modalPrice, setModalPrice] = useState<number>(0);
  const [modalStock, setModalStock] = useState<number>(50);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Line-Item Substitution Modal State (FR-WHS-006)
  const [substitutionTarget, setSubstitutionTarget] = useState<{ order: Order; itemIdx: number } | null>(null);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');
  const [substitutionReasonText, setSubstitutionReasonText] = useState('Stockout of original brand; replaced with equivalent grade');

  const currentWholesaler = WHOLESALERS.find((w) => w.id === selectedWholesalerId) || WHOLESALERS[0];

  // Filter orders assigned to this wholesaler
  const wholesalerOrders = orders.filter(
    (o) => o.wholesalerLocationId === currentWholesaler.id
  );

  const pendingOrders = wholesalerOrders.filter((o) =>
    ['PAID', 'FULFILLMENT_PENDING', 'SUPPLIER_CONFIRMED'].includes(o.status)
  );

  const readyOrders = wholesalerOrders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const dispatchedOrders = wholesalerOrders.filter((o) =>
    ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
  );

  const filteredOrders = wholesalerOrders.filter((o) => {
    if (dispatchFilter === 'PENDING') return ['PAID', 'FULFILLMENT_PENDING', 'SUPPLIER_CONFIRMED'].includes(o.status);
    if (dispatchFilter === 'STAGED') return o.status === 'READY_FOR_PICKUP';
    if (dispatchFilter === 'DISPATCHED') return ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status);
    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleAvailability = (spId: string) => {
    const sp = supplierProducts.find(s => s.id === spId);
    if (sp) {
      handleUpdateWholesalerProductPriceAndStock(spId, sp.price, sp.stockQty, !sp.availability);
      showToast(`Toggled availability for SKU: ${!sp.availability ? 'In Stock' : 'Out of Stock'}`);
    }
  };

  const handleSaveInlinePrice = (spId: string) => {
    const sp = supplierProducts.find(s => s.id === spId);
    if (sp && priceInput > 0) {
      handleUpdateWholesalerProductPriceAndStock(spId, priceInput, sp.stockQty, sp.availability);
      showToast(`Updated wholesale price to KES ${priceInput.toLocaleString()}`);
    }
    setEditingPriceId(null);
  };

  // Wholesaler Depot Catalog: Products currently stocked by this wholesaler
  const myDepotSupplierProducts = supplierProducts.filter(
    sp => sp.wholesalerLocationId === currentWholesaler.id
  );

  // Filtered depot products
  const filteredMyDepotItems = myDepotSupplierProducts.filter(sp => {
    const p = products.find(prod => prod.id === sp.productId);
    if (!p) return false;
    const q = inventorySearch.toLowerCase();
    const cat = p.category_internal || p.internalCategory;
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      cat.toLowerCase().includes(q)
    );
  });

  // Filtered platform master catalog for adoption
  const filteredPlatformCatalog = products.filter(p => {
    const q = inventorySearch.toLowerCase();
    const cat = p.category_internal || p.internalCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      cat.toLowerCase().includes(q);
    const matchesCat = catalogCategoryFilter === 'ALL' || cat === catalogCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Open adoption modal for admin product
  const handleOpenAdoptionModal = (product: Product) => {
    if (product.status === 'INACTIVE') {
      showToast('Cannot adopt product: Product is currently INACTIVE / disabled by Admin.');
      return;
    }
    setAdoptingProduct(product);
    // Default to admin recommended wholesale price or 85% of RRP
    const defaultWholesale = product.wholesalePrice || Math.round(product.recommendedRetailPrice * 0.85);
    setModalPrice(defaultWholesale);
    setModalStock(50);
  };

  // Confirm adoption of admin product with custom alterations
  const handleConfirmAdoption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adoptingProduct) return;

    try {
      handleAdoptProductForWholesaler(
        currentWholesaler.id,
        currentWholesaler.name,
        adoptingProduct.id,
        Number(modalPrice),
        Number(modalStock)
      );
      showToast(`Successfully adopted "${adoptingProduct.name}" into ${currentWholesaler.name} at KES ${modalPrice.toLocaleString()}`);
      setAdoptingProduct(null);
      setInventoryTab('my_depot');
    } catch (err: any) {
      showToast(err.message || 'Failed to adopt product');
    }
  };

  // Open alteration modal for existing depot product
  const handleOpenAlterModal = (sp: SupplierProduct) => {
    const p = products.find(prod => prod.id === sp.productId);
    if (!p) return;
    setAlteringSp({ sp, product: p });
    setModalPrice(sp.price);
    setModalStock(sp.stockQty);
  };

  // Save alterations to existing depot product
  const handleConfirmAlteration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alteringSp) return;

    handleUpdateWholesalerProductPriceAndStock(
      alteringSp.sp.id,
      Number(modalPrice),
      Number(modalStock),
      modalStock > 0
    );
    showToast(`Updated wholesale price to KES ${modalPrice.toLocaleString()} and stock to ${modalStock} units`);
    setAlteringSp(null);
  };

  // Remove SKU from depot
  const handleRemoveFromDepot = (spId: string, productName: string) => {
    if (confirm(`Remove "${productName}" from your depot catalog? Retailers in your delivery zone will no longer see this SKU from your warehouse.`)) {
      handleRemoveWholesalerProduct(spId);
      showToast(`Removed "${productName}" from depot inventory.`);
    }
  };

  const totalWholesaleGMV = wholesalerOrders.reduce((sum, o) => sum + o.subtotal, 0);

  return (
    <div className="space-y-4 pb-20">
      {/* Wholesaler Hub Header & Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 sm:p-4 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900">{currentWholesaler.name}</h1>
                <span className="text-[10px] font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                  Reliability: {currentWholesaler.reliabilityScore}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
                {currentWholesaler.address} · Avg Prep: {currentWholesaler.avgPrepTimeMinutes} mins · {currentWholesaler.operatingHours}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-[11px] text-slate-500 font-medium hidden sm:inline">Switch Depot:</label>
            <select
              value={selectedWholesalerId}
              onChange={(e) => setSelectedWholesalerId(e.target.value)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded px-2.5 py-1 font-medium focus:border-slate-800 focus:outline-none transition-colors cursor-pointer"
            >
              {WHOLESALERS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Outlook Secondary Page Tabs Ribbon */}
        <div className="flex items-center space-x-1 pt-2.5 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentPage('dispatch')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'dispatch'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Order Dispatch & Packing Queue</span>
            {pendingOrders.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                currentPage === 'dispatch' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
              }`}>
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentPage('inventory')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'inventory'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Inventory Stock & Price Master</span>
          </button>

          <button
            onClick={() => setCurrentPage('analytics')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              currentPage === 'analytics'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Depot Analytics & Settlements</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: DISPATCH & PACKING QUEUE                                          */}
      {/* ========================================================================= */}
      {currentPage === 'dispatch' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Needs Packing</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {pendingOrders.length}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Ready in Bay (Awaiting Rider)</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                {readyOrders.length}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Dispatched Today</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {dispatchedOrders.length + 18} runs
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">Fulfillment SLA</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                &lt; 12m avg
              </span>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
              <button
                onClick={() => setDispatchFilter('ALL')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  dispatchFilter === 'ALL' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Orders ({wholesalerOrders.length})
              </button>
              <button
                onClick={() => setDispatchFilter('PENDING')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  dispatchFilter === 'PENDING' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Needs Prep ({pendingOrders.length})
              </button>
              <button
                onClick={() => setDispatchFilter('STAGED')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  dispatchFilter === 'STAGED' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Staged for Pickup ({readyOrders.length})
              </button>
              <button
                onClick={() => setDispatchFilter('DISPATCHED')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  dispatchFilter === 'DISPATCHED' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Transit ({dispatchedOrders.length})
              </button>
            </div>

            <span className="text-xs text-slate-500 hidden sm:inline">
              FMCG picking list & dual-OTP verification
            </span>
          </div>

          {/* Orders list */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-8 text-center space-y-2">
              <Package className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-slate-800 font-semibold text-sm">No orders in this dispatch filter</p>
              <p className="text-xs text-slate-500">
                Incoming orders from retail dukas in your zone will appear here with instant alerts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between space-y-3 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 uppercase border border-slate-200">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Destination Duka:</span>
                      <h4 className="text-xs font-bold text-slate-900">{order.shopName}</h4>
                      <p className="text-[11px] text-slate-500">{order.shopAddress}</p>
                    </div>

                    {/* Items to Pack */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                          Packs to Pick from Shelves:
                        </span>
                        {['PAID', 'FULFILLMENT_PENDING', 'SUPPLIER_PENDING', 'ACCEPTED', 'SUPPLIER_CONFIRMED', 'PREPARING', 'PARTIALLY_FULFILLED'].includes(order.status) && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Stockout? Click item to substitute
                          </span>
                        )}
                      </div>
                      {order.items.map((it, idx) => (
                        <div key={idx} className="p-1.5 rounded bg-white border border-slate-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-slate-800 font-medium">
                                {it.quantity}x {it.productName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">({it.packSize})</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-slate-700 text-[11px] font-semibold">
                                KES {it.totalPrice.toLocaleString()}
                              </span>
                              {['PAID', 'FULFILLMENT_PENDING', 'SUPPLIER_PENDING', 'ACCEPTED', 'SUPPLIER_CONFIRMED', 'PREPARING', 'PARTIALLY_FULFILLED'].includes(order.status) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubstitutionTarget({ order, itemIdx: idx });
                                    const candidate = products.find((p) => p.id !== it.productId && p.status === 'ACTIVE');
                                    if (candidate) setSelectedSubstituteId(candidate.id);
                                  }}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300 font-medium transition-colors"
                                  title="Replace with in-stock alternative (FR-WHS-006)"
                                >
                                  Substitute
                                </button>
                              )}
                            </div>
                          </div>
                          {it.isSubstituted && (
                            <div className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 rounded px-2 py-0.5 flex items-center justify-between">
                              <span>
                                <strong>Substituted:</strong> Replaced "{it.originalProductName}"
                              </span>
                              <span className="italic text-amber-800">{it.substitutionReason}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pickup OTP */}
                    <div className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium text-[11px]">Wholesale Pickup OTP:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                        {order.pickupOtp}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px]">Depot Subtotal</span>
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        KES {order.subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {['PAID', 'FULFILLMENT_PENDING', 'SUPPLIER_PENDING'].includes(order.status) && (
                        <>
                          <button
                            onClick={() =>
                              onUpdateOrderStatus(
                                order.id,
                                'ACCEPTED',
                                'Wholesaler accepted order and locked inventory'
                              )
                            }
                            className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Accept Order</span>
                          </button>
                          <button
                            onClick={() =>
                              onUpdateOrderStatus(
                                order.id,
                                'CANCELLED',
                                'Wholesaler declined: complete stockout of required inventory'
                              )
                            }
                            className="flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                            title="Decline order due to stockout"
                          >
                            <X className="w-3 h-3" />
                            <span>Decline / Cancel</span>
                          </button>
                        </>
                      )}

                      {['ACCEPTED', 'SUPPLIER_CONFIRMED', 'PARTIALLY_FULFILLED'].includes(order.status) && (
                        <button
                          onClick={() =>
                            onUpdateOrderStatus(
                              order.id,
                              'PREPARING',
                              'Warehouse crew commenced picking and crate boxing'
                            )
                          }
                          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Package className="w-3 h-3" />
                          <span>Start Packing</span>
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <>
                          <button
                            onClick={() =>
                              onUpdateOrderStatus(
                                order.id,
                                'PARTIALLY_FULFILLED',
                                'Wholesaler packed available units; partial stockout recorded'
                              )
                            }
                            className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                            title="Flag partial inventory availability"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>Partial Stockout</span>
                          </button>
                          <button
                            onClick={() =>
                              onUpdateOrderStatus(
                                order.id,
                                'READY_FOR_PICKUP',
                                'Order packaged, labeled, and staged in wholesale loading bay'
                              )
                            }
                            className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Package className="w-3 h-3" />
                            <span>Stage for Rider</span>
                          </button>
                        </>
                      )}

                      {order.status === 'READY_FOR_PICKUP' && (
                        <span className="text-[11px] text-slate-700 font-medium flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          <Clock className="w-3 h-3 animate-spin text-slate-500" />
                          <span>Staged in Bay · Awaiting Rider</span>
                        </span>
                      )}
                    </div>

                    {['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
                      order.status
                    ) && (
                      <span className="text-[11px] text-emerald-800 font-medium flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>Dispatched to {order.riderName || 'Rider'}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: INVENTORY & PRICING (Section 13 Wholesaler Customization)          */}
      {/* ========================================================================= */}
      {currentPage === 'inventory' && (
        <div className="space-y-4">
          {/* Architectural Notice Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-md p-3.5 sm:p-4 border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                    WAYNO Catalog Architecture
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    Wholesaler Customization Engine
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mt-1">
                  Admin-Sourced Products with Wholesaler Customization
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                  All master products are originally authorized and published by <strong>WAYNO Operations (Admin)</strong>. As a wholesaler, you can choose from these approved products to stock your depot, and make your own alterations in terms of <strong>wholesale selling price (KES)</strong> and <strong>depot inventory stock levels</strong>.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setInventoryTab('platform_catalog')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                    inventoryTab === 'platform_catalog'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Choose from Admin Catalog</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: My Depot vs Platform Catalog */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-2.5 shadow-2xs">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setInventoryTab('my_depot')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  inventoryTab === 'my_depot'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>My Depot Inventory</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  inventoryTab === 'my_depot' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'
                }`}>
                  {myDepotSupplierProducts.length} SKUs
                </span>
              </button>

              <button
                onClick={() => setInventoryTab('platform_catalog')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  inventoryTab === 'platform_catalog'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Browse Admin Master Catalog</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  inventoryTab === 'platform_catalog' ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {products.filter(p => p.status === 'ACTIVE').length} Available
                </span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search SKU, brand, category..."
                  className="w-full bg-slate-50 border border-slate-300 text-xs pl-8 pr-3 py-1 rounded text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none"
                />
              </div>

              {inventoryTab === 'platform_catalog' && (
                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded py-1 px-2 bg-slate-50 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {Array.from(new Set(products.map(p => p.category_internal || p.internalCategory))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* TAB 1: MY DEPOT INVENTORY */}
          {inventoryTab === 'my_depot' && (
            <div className="bg-white border border-slate-200 rounded-md overflow-x-auto shadow-2xs">
              {filteredMyDepotItems.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">No matching products in your depot inventory</h3>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                      Choose from the products originally authorized by the platform admin to start stocking your warehouse.
                    </p>
                  </div>
                  <button
                    onClick={() => setInventoryTab('platform_catalog')}
                    className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Browse Admin Master Catalog</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-900">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3.5">FMCG SKU & Admin Brand</th>
                      <th className="py-2.5 px-3.5">Pack Size</th>
                      <th className="py-2.5 px-3.5">Admin RRP</th>
                      <th className="py-2.5 px-3.5">Your Custom Price (KES)</th>
                      <th className="py-2.5 px-3.5">Depot Stock</th>
                      <th className="py-2.5 px-3.5">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Wholesaler Alterations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMyDepotItems.map((sp) => {
                      const product = products.find((p) => p.id === sp.productId);
                      if (!product) return null;

                      const isEditingInline = editingPriceId === sp.id;
                      const adminRRP = product.recommendedRetailPrice;
                      const marginPercent = Math.round(((adminRRP - sp.price) / adminRRP) * 100);

                      return (
                        <tr key={sp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={product.image}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                              <div>
                                <span className="font-semibold text-slate-900 block line-clamp-1">{product.name}</span>
                                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                                  <span className="font-medium text-slate-800">{product.brand}</span>
                                  <span>·</span>
                                  <span>{product.category_internal || product.internalCategory}</span>
                                  <span className="bg-slate-100 text-slate-600 px-1 rounded text-[9px] font-mono">Admin Verified</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                            {product.pack_size || product.packSize}
                          </td>

                          <td className="py-2.5 px-3.5 font-mono text-slate-500">
                            KES {adminRRP.toLocaleString()}
                          </td>

                          <td className="py-2.5 px-3.5">
                            {isEditingInline ? (
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  value={priceInput}
                                  onChange={(e) => setPriceInput(Number(e.target.value))}
                                  className="w-20 bg-white border border-slate-300 text-slate-900 px-2 py-1 rounded text-xs focus:border-slate-800 focus:outline-none font-medium font-mono"
                                />
                                <button
                                  onClick={() => handleSaveInlinePrice(sp.id)}
                                  className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono font-bold text-slate-900 text-xs">
                                    KES {sp.price.toLocaleString()}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingPriceId(sp.id);
                                      setPriceInput(sp.price);
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-slate-800 underline cursor-pointer"
                                  >
                                    quick
                                  </button>
                                </div>
                                <span className="text-[10px] text-indigo-600 font-medium block">
                                  {marginPercent >= 0 ? `${marginPercent}% Retail Margin` : 'Price Above RRP'}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5 font-mono text-slate-700">
                            <span className="font-bold">{sp.stockQty}</span> units
                          </td>

                          <td className="py-2.5 px-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                                sp.availability && sp.stockQty > 0
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {sp.availability && sp.stockQty > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Open Alteration Modal */}
                              <button
                                onClick={() => handleOpenAlterModal(sp)}
                                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1"
                              >
                                <SlidersHorizontal className="w-3 h-3 text-indigo-600" />
                                <span>Alter Price & Stock</span>
                              </button>

                              {/* Toggle Availability */}
                              <button
                                onClick={() => handleToggleAvailability(sp.id)}
                                className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                {sp.availability ? 'Mark Out' : 'Mark In'}
                              </button>

                              {/* Remove from Depot */}
                              <button
                                onClick={() => handleRemoveFromDepot(sp.id, product.name)}
                                title="Remove SKU from depot"
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: BROWSE ADMIN MASTER CATALOG (Choose products made available by admin) */}
          {inventoryTab === 'platform_catalog' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Section 13 Compliance: Products Originally Authorized by Admin</span>
                  <span>
                    The items below represent the platform's canonical master FMCG catalog created and approved by Admin. You can adopt any active SKU into your physical warehouse depot ({currentWholesaler.name}) and customize your own wholesale selling price and inventory count.
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-md overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs text-slate-900">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3.5">Admin Master SKU</th>
                      <th className="py-2.5 px-3.5">Pack Unit</th>
                      <th className="py-2.5 px-3.5">Admin Pricing (WS / RRP)</th>
                      <th className="py-2.5 px-3.5">Admin MOQ</th>
                      <th className="py-2.5 px-3.5">Platform Status</th>
                      <th className="py-2.5 px-3.5">Your Depot Status</th>
                      <th className="py-2.5 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPlatformCatalog.map((product) => {
                      const existingSp = myDepotSupplierProducts.find(sp => sp.productId === product.id);
                      const isAlreadyAdopted = !!existingSp;
                      const isActiveOnPlatform = product.status === 'ACTIVE';
                      const adminRecWS = product.wholesalePrice || Math.round(product.recommendedRetailPrice * 0.85);

                      return (
                        <tr 
                          key={product.id} 
                          className={`hover:bg-slate-50 transition-colors ${!isActiveOnPlatform ? 'bg-slate-50/60 opacity-60' : ''}`}
                        >
                          <td className="py-2.5 px-3.5">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={product.image}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                              <div>
                                <span className="font-semibold text-slate-900 block line-clamp-1">{product.name}</span>
                                <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                                  <span className="font-medium text-slate-800">{product.brand}</span>
                                  <span>·</span>
                                  <span>{product.manufacturer}</span>
                                  <span>·</span>
                                  <span className="font-mono text-slate-400">EAN: {product.barcode}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                            {product.pack_size || product.packSize} ({product.unit})
                          </td>

                          <td className="py-2.5 px-3.5 font-mono text-xs">
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-slate-400 w-12">Rec WS:</span>
                              <span className="font-bold text-indigo-700">KES {adminRecWS.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-slate-400 w-12">RRP:</span>
                              <span className="text-slate-600">KES {product.recommendedRetailPrice.toLocaleString()}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3.5 font-mono text-slate-700">
                            {product.minimumOrderQuantity || 1} {product.unit}
                          </td>

                          <td className="py-2.5 px-3.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono ${
                              isActiveOnPlatform 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {isActiveOnPlatform ? 'ACTIVE (Admin)' : 'INACTIVE (Admin)'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3.5">
                            {isAlreadyAdopted ? (
                              <div>
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  <span>In Depot: KES {existingSp.price.toLocaleString()}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                                  Stock: {existingSp.stockQty} units
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Not in your depot
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3.5 text-right">
                            {!isActiveOnPlatform ? (
                              <span className="text-[10px] text-rose-700 font-medium flex items-center justify-end space-x-1">
                                <Lock className="w-3 h-3" />
                                <span>Disabled by Admin</span>
                              </span>
                            ) : isAlreadyAdopted ? (
                              <button
                                onClick={() => handleOpenAlterModal(existingSp)}
                                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1 ml-auto"
                              >
                                <Edit3 className="w-3 h-3 text-indigo-600" />
                                <span>Alter Price</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenAdoptionModal(product)}
                                className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1 ml-auto shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Adopt & Set Price</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-md shadow-lg border border-slate-700 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADOPT ADMIN PRODUCT INTO WHOLESALER DEPOT                          */}
      {/* ========================================================================= */}
      {adoptingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  <Store className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Adopt SKU into {currentWholesaler.name}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Originally made available by Admin Catalog (Section 13)
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setAdoptingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdoption} className="p-5 space-y-4 text-xs">
              {/* Product Info Card */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded border border-slate-200">
                <img
                  src={adoptingProduct.image}
                  alt={adoptingProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded object-cover bg-white shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{adoptingProduct.name}</h4>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {adoptingProduct.brand} · Pack: {adoptingProduct.pack_size || adoptingProduct.packSize}
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500 mt-1">
                    <span>Admin RRP: <strong>KES {adoptingProduct.recommendedRetailPrice.toLocaleString()}</strong></span>
                    <span>Admin Rec WS: <strong className="text-indigo-700">KES {(adoptingProduct.wholesalePrice || Math.round(adoptingProduct.recommendedRetailPrice * 0.85)).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Wholesaler Custom Alterations */}
              <div className="space-y-3 pt-1">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Your Wholesaler Alterations
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-900 mb-1">
                      Your Wholesale Selling Price <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono text-xs">KES</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={modalPrice}
                        onChange={(e) => setModalPrice(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded pl-11 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Selling price to duka retailers
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-900 mb-1">
                      Initial Depot Stock Count <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={modalStock}
                      onChange={(e) => setModalStock(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Available cartons / units in bay
                    </span>
                  </div>
                </div>

                {/* Profit Margin Delta Breakdown */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Admin Benchmark RRP:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      KES {adoptingProduct.recommendedRetailPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Your Wholesaler Price:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      KES {modalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-indigo-100">
                    <span className="text-slate-700 font-medium">Retailer Gross Margin:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {Math.round(((adoptingProduct.recommendedRetailPrice - modalPrice) / adoptingProduct.recommendedRetailPrice) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdoptingProduct(null)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Adopt into Depot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALTER PRICE & STOCK OF EXISTING DEPOT SKU                          */}
      {/* ========================================================================= */}
      {alteringSp && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Alter Wholesale Price & Stock
                </h3>
              </div>
              <button 
                onClick={() => setAlteringSp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAlteration} className="p-5 space-y-4 text-xs">
              <div className="flex items-center space-x-3 p-2.5 bg-slate-50 rounded border border-slate-200">
                <img
                  src={alteringSp.product.image}
                  alt={alteringSp.product.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded object-cover bg-white shrink-0 border border-slate-200"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{alteringSp.product.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Admin RRP: KES {alteringSp.product.recommendedRetailPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 mb-1">
                    Wholesale Price (KES) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={modalPrice}
                    onChange={(e) => setModalPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-900 mb-1">
                    Physical Stock Count <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={modalStock}
                    onChange={(e) => setModalStock(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAlteringSp(null)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Save Alterations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: DEPOT ANALYTICS & SETTLEMENTS                                     */}
      {/* ========================================================================= */}
      {currentPage === 'analytics' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Depot Performance & Settlements</h2>
            <p className="text-xs text-slate-500">
              Operational fulfillment KPIs, M-Pesa automated bank settlements, and turnaround benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-md p-4">
              <span className="text-[10px] text-slate-400 font-medium uppercase block">Total Dispatched GMV</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                KES {(totalWholesaleGMV + 145000).toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-700 mt-1 block">100% reconciled via Daraja B2B</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4">
              <span className="text-[10px] text-slate-400 font-medium uppercase block">On-Time Staging Rate</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                {currentWholesaler.reliabilityScore}%
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Target: &gt;95% within 15 mins</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-4">
              <span className="text-[10px] text-slate-400 font-medium uppercase block">Next Bank Settlement</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                Today, 18:00 EAT
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Auto-wire to Standard Chartered</span>
            </div>
          </div>

          {/* Top Moving FMCG SKUs */}
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Top 5 Fast-Moving FMCG Lines
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Roasted Njugu (Salted Peanuts) 50g x 24</span>
                  <span className="text-[10px] text-slate-400 block">Category: Snacks & Staples</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">142 cartons</span>
                  <span className="text-[10px] text-emerald-700 block">KES 170,400</span>
                </div>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Jogoo Maize Meal 2kg Bale (12 Packets)</span>
                  <span className="text-[10px] text-slate-400 block">Category: Grains & Flour</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">98 bales</span>
                  <span className="text-[10px] text-emerald-700 block">KES 225,400</span>
                </div>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Blue Band Margarine 500g Tub (Carton of 12)</span>
                  <span className="text-[10px] text-slate-400 block">Category: Spreads & Dairy</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">76 cartons</span>
                  <span className="text-[10px] text-emerald-700 block">KES 243,200</span>
                </div>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Fresh Fri Cooking Oil 3 Litres (Box of 4)</span>
                  <span className="text-[10px] text-slate-400 block">Category: Fats & Oils</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">64 boxes</span>
                  <span className="text-[10px] text-emerald-700 block">KES 224,000</span>
                </div>
              </div>
              <div className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Menengai Cream Bar Soap 800g Carton</span>
                  <span className="text-[10px] text-slate-400 block">Category: Cleaning & Laundry</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">58 cartons</span>
                  <span className="text-[10px] text-emerald-700 block">KES 127,600</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Line-Item Substitution Modal (FR-WHS-006) */}
      {substitutionTarget && (() => {
        const order = substitutionTarget.order;
        const currentItem = order.items[substitutionTarget.itemIdx];
        const candidateProduct = products.find((p) => p.id === selectedSubstituteId) || products.find((p) => p.id !== currentItem.productId) || products[0];
        const candidateSupplierProduct = supplierProducts.find(
          (sp) => sp.productId === candidateProduct.id && sp.wholesalerLocationId === currentWholesaler.id
        ) || supplierProducts.find((sp) => sp.productId === candidateProduct.id) || {
          id: `sp_${candidateProduct.id}`,
          productId: candidateProduct.id,
          wholesalerLocationId: currentWholesaler.id,
          wholesalerName: currentWholesaler.name,
          price: candidateProduct.wholesalePrice || candidateProduct.basePrice,
          availability: true,
          stockQty: 50,
          distanceKm: 2.5,
          updatedAt: 'Now'
        };

        const oldItemTotal = currentItem.totalPrice;
        const newItemTotal = candidateSupplierProduct.price * currentItem.quantity;
        const delta = newItemTotal - oldItemTotal;

        const handleConfirmSubstitution = () => {
          if (onSubstituteOrderItem) {
            onSubstituteOrderItem(
              order.id,
              substitutionTarget.itemIdx,
              candidateProduct,
              candidateSupplierProduct as SupplierProduct,
              substitutionReasonText
            );
          }
          setSubstitutionTarget(null);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 animate-in fade-in">
            <div className="bg-white border border-slate-300 rounded-md w-full max-w-md p-4 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-slate-800" />
                  <h3 className="font-bold text-sm text-slate-900">Line-Item Substitution (FR-WHS-006)</h3>
                </div>
                <button
                  onClick={() => setSubstitutionTarget(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-3">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Out-of-Stock Item</span>
                  <div className="font-bold text-slate-900">{currentItem.productName}</div>
                  <div className="text-slate-500 font-mono">
                    {currentItem.quantity}x @ KES {currentItem.unitPrice} = KES {currentItem.totalPrice.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select In-Stock Alternative Product:
                  </label>
                  <select
                    value={selectedSubstituteId || candidateProduct.id}
                    onChange={(e) => setSelectedSubstituteId(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs text-slate-900 font-medium"
                  >
                    {products.filter((p) => p.id !== currentItem.productId && p.status === 'ACTIVE').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.pack_size || p.packSize}) - KES {p.wholesalePrice || p.basePrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Substitution Reason & Wholesaler Audit Note:
                  </label>
                  <input
                    type="text"
                    value={substitutionReasonText}
                    onChange={(e) => setSubstitutionReasonText(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs text-slate-900"
                    placeholder="e.g. Out of stock; substituted with equivalent brand"
                  />
                </div>

                <div className="bg-slate-100 p-2.5 rounded border border-slate-200 flex items-center justify-between font-mono">
                  <span className="text-slate-700 text-[11px]">Financial Delta:</span>
                  <span className={`font-bold ${delta >= 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                    {delta >= 0 ? `+KES ${delta.toLocaleString()}` : `-KES ${Math.abs(delta).toLocaleString()} (Refunded to Duka)`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubstitutionTarget(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubstitution}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  Confirm Substitution
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

