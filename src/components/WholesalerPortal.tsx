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
  Truck
} from 'lucide-react';
import { Order, WholesalerLocation, Product, SupplierProduct } from '../types/wayno';
import { WHOLESALERS, PRODUCTS, SUPPLIER_PRODUCTS } from '../data/mockData';

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
  const [currentPage, setCurrentPage] = useState<WholesalerPage>('dispatch');
  const [selectedWholesalerId, setSelectedWholesalerId] = useState<string>(WHOLESALERS[0].id);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>(SUPPLIER_PRODUCTS);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<number>(0);
  const [inventorySearch, setInventorySearch] = useState('');
  const [dispatchFilter, setDispatchFilter] = useState<'ALL' | 'PENDING' | 'STAGED' | 'DISPATCHED'>('ALL');
  
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

  const handleToggleAvailability = (spId: string) => {
    setSupplierProducts((prev) =>
      prev.map((sp) => (sp.id === spId ? { ...sp, availability: !sp.availability } : sp))
    );
  };

  const handleSavePrice = (spId: string) => {
    if (priceInput > 0) {
      setSupplierProducts((prev) =>
        prev.map((sp) => (sp.id === spId ? { ...sp, price: priceInput } : sp))
      );
    }
    setEditingPriceId(null);
  };

  // Filter products for inventory search
  const filteredProducts = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    p.internalCategory.toLowerCase().includes(inventorySearch.toLowerCase())
  );

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
                                    const candidate = PRODUCTS.find((p) => p.id !== it.productId);
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
      {/* PAGE 2: INVENTORY & PRICING                                               */}
      {/* ========================================================================= */}
      {currentPage === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Inventory Stock & Price Master</h2>
              <p className="text-xs text-slate-500">
                Update wholesale pack pricing and stock availability. Changes instantly sync with duka search indexing.
              </p>
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Search stock by SKU..."
                className="w-full bg-white border border-slate-300 text-xs px-3 py-1.5 rounded focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-900">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">FMCG SKU</th>
                  <th className="py-2.5 px-3.5">Pack Unit</th>
                  <th className="py-2.5 px-3.5">Wholesale Price (KES)</th>
                  <th className="py-2.5 px-3.5">Stock Count</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const sp = supplierProducts.find(
                    (item) => item.productId === product.id && item.wholesalerLocationId === currentWholesaler.id
                  ) || {
                    id: `sp_${product.id}`,
                    productId: product.id,
                    wholesalerLocationId: currentWholesaler.id,
                    wholesalerName: currentWholesaler.name,
                    price: product.recommendedRetailPrice * 0.85,
                    availability: true,
                    stockQty: 50,
                    distanceKm: 3.2,
                    updatedAt: 'Recently',
                  };

                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">{product.name}</span>
                            <span className="text-[10px] text-slate-400">{product.brand} · {product.internalCategory}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600">{product.packSize}</td>
                      <td className="py-2.5 px-3.5">
                        {editingPriceId === sp.id ? (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="number"
                              value={priceInput}
                              onChange={(e) => setPriceInput(Number(e.target.value))}
                              className="w-20 bg-white border border-slate-300 text-slate-900 px-2 py-1 rounded text-xs focus:border-slate-800 focus:outline-none font-medium font-mono"
                            />
                            <button
                              onClick={() => handleSavePrice(sp.id)}
                              className="bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900">
                              KES {sp.price.toLocaleString()}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceId(sp.id);
                                setPriceInput(sp.price);
                              }}
                              className="text-[10px] text-slate-500 hover:text-slate-900 font-medium underline cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600">{sp.stockQty} units</td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            sp.availability
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {sp.availability ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={() => handleToggleAvailability(sp.id)}
                          className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Toggle Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        const candidateProduct = PRODUCTS.find((p) => p.id === selectedSubstituteId) || PRODUCTS.find((p) => p.id !== currentItem.productId) || PRODUCTS[0];
        const candidateSupplierProduct = SUPPLIER_PRODUCTS.find(
          (sp) => sp.productId === candidateProduct.id && sp.supplierId === currentWholesaler.id
        ) || SUPPLIER_PRODUCTS.find((sp) => sp.productId === candidateProduct.id) || {
          id: 'sp_default',
          productId: candidateProduct.id,
          supplierId: currentWholesaler.id,
          price: candidateProduct.basePrice,
          availability: true,
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
                    {PRODUCTS.filter((p) => p.id !== currentItem.productId).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.packSize}) - KES {p.basePrice}
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

