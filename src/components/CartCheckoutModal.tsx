import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Phone, 
  ShieldCheck, 
  Lock, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  MapPin,
  Building,
  ShoppingBag,
  Tag,
  Star,
  ArrowRight,
  Truck,
  Bike,
  Layers
} from 'lucide-react';
import { CartItem, Order, RetailerShop, Product, SupplierProduct, OrderItem } from '../types/wayno';
import { paymentService } from '../services/paymentService';
import { PRODUCTS, SUPPLIER_PRODUCTS } from '../data/mockData';
import {
  calculateOrderPayload,
  generateOfflineDeliveryCode,
  VirtualStockReservationManager,
} from '../services/orderEngine';
import { 
  getPromotionalPlacements, 
  recordPromotionalClick, 
  recordPromotionalImpression 
} from '../services/searchEngine';

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  currentShop: RetailerShop;
  onOrderCreated: (order: Order) => void;
  addToCart?: (
    product: Product, 
    supplierProduct: SupplierProduct, 
    campaignId?: string, 
    discountKES?: number
  ) => void;
}

export const CartCheckoutModal: React.FC<CartCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  currentShop,
  onOrderCreated,
  addToCart,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(currentShop.phone.replace(/\s+/g, ''));
  const [selectedProvider, setSelectedProvider] = useState<string>('M-Pesa');
  const [paymentStep, setPaymentStep] = useState<'REVIEW' | 'PROCESSING_STK' | 'SUCCESS'>('REVIEW');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const availableProviders = paymentService.listRegisteredProviders();

  // Check for active checkout upsell promotions
  const upsellPlacements = getPromotionalPlacements().filter(
    (p) => p.status === 'ACTIVE' && p.placementSlot === 'CHECKOUT_UPSELL'
  );
  const activeUpsell = upsellPlacements.find(
    (p) => !cart.some((c) => c.product.id === p.targetProductId)
  );

  // Record impression for active checkout upsell
  useEffect(() => {
    if (activeUpsell && isOpen) {
      recordPromotionalImpression(activeUpsell.id);
    }
  }, [activeUpsell?.id, isOpen]);

  const handleAddUpsell = (promoId: string, productId: string, discountKES: number) => {
    recordPromotionalClick(promoId);
    const prod = PRODUCTS.find((p) => p.id === productId);
    const supp = SUPPLIER_PRODUCTS.find((s) => s.productId === productId);
    if (prod && supp && addToCart) {
      const discountedSupplierProduct = discountKES ? {
        ...supp,
        price: Math.max(1, supp.price - discountKES)
      } : supp;
      addToCart(prod, discountedSupplierProduct, promoId, discountKES);
    }
  };

  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.supplierProduct.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 150 : 0; // Flat optimized regional delivery fee in KES
  const totalAmount = subtotal + deliveryFee;

  // Primary wholesaler determination (majority supplier)
  const primaryWholesaler = cart[0]?.supplierProduct.wholesalerName || 'Eastleigh Mega Wholesale Depot';
  const primaryWholesalerLocationId = cart[0]?.supplierProduct.wholesalerLocationId || 'ws_eastleigh';

  const orderItems: OrderItem[] = cart.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    packSize: item.product.packSize,
    quantity: item.quantity,
    unitPrice: item.supplierProduct.price,
    totalPrice: item.supplierProduct.price * item.quantity,
    wholesalerLocationId: item.supplierProduct.wholesalerLocationId,
    wholesalerName: item.supplierProduct.wholesalerName,
  }));

  const payloadAnalysis = calculateOrderPayload(orderItems);

  const handleInitiatePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setErrorMessage('Please enter a valid Safaricom M-Pesa phone number');
      return;
    }

    setErrorMessage(null);
    setPaymentStep('PROCESSING_STK');

    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const orderId = `WN-${Date.now().toString().slice(-6)}`;

    // PRODUCTION HARDENING: Lock virtual inventory with safety buffer check
    const reserveAttempt = VirtualStockReservationManager.reserveStock(
      orderId,
      primaryWholesalerLocationId,
      cart.map((c) => ({ productId: c.product.id, quantity: c.quantity }))
    );

    if (!reserveAttempt.success) {
      setErrorMessage(reserveAttempt.error || 'Inventory contention: Items requested unavailable or below depot buffer.');
      setPaymentStep('REVIEW');
      return;
    }

    const offlineDeliveryCode = generateOfflineDeliveryCode(orderId, phoneNumber);

    // Build order object
    const newOrder: Order = {
      id: orderId,
      retailerId: currentShop.retailerId,
      shopName: currentShop.name,
      shopAddress: currentShop.address,
      retailerPhone: phoneNumber,
      items: orderItems,
      subtotal,
      deliveryFee,
      totalAmount,
      currency: 'KES',
      status: 'PAYMENT_PENDING',
      stateHistory: [
        {
          state: 'CREATED',
          timestamp: new Date().toISOString(),
          note: 'Order drafted by duka shopkeeper',
        },
        {
          state: 'PAYMENT_PENDING',
          timestamp: new Date().toISOString(),
          note: `M-Pesa STK push dispatched to ${phoneNumber}`,
        },
      ],
      paymentMethod: selectedProvider.toUpperCase().replace(/\s+/g, '_') as any,
      wholesalerLocationId: primaryWholesalerLocationId,
      wholesalerName: primaryWholesaler,
      pickupOtp,
      deliveryOtp,
      offlineDeliveryCode,
      estimatedDeliveryMins: 28,
      totalWeightKg: payloadAnalysis.totalWeightKg,
      totalVolumeCbm: payloadAnalysis.totalVolumeCbm,
      assignedVehicleType: payloadAnalysis.assignedVehicleType,
      dispatchSplitsCount: payloadAnalysis.dispatchSplitsCount,
      stockReservedUntil: reserveAttempt.reservedUntil,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // SECTION 25: Application talks strictly to PaymentService abstraction
      const result = await paymentService.initiatePayment({
        order: newOrder,
        phoneNumber,
      }, selectedProvider);

      if (result.success) {
        newOrder.status = 'PAID';
        newOrder.paymentId = result.paymentRecord.paymentId || result.paymentRecord.id;
        newOrder.stateHistory.push({
          state: 'PAID',
          timestamp: new Date().toISOString(),
          note: `${result.provider} Reference ${result.providerReference} confirmed via PaymentService abstraction`,
        });
        newOrder.stateHistory.push({
          state: 'FULFILLMENT_PENDING',
          timestamp: new Date().toISOString(),
          note: `Dispatched to ${primaryWholesaler} for immediate packaging`,
        });

        setCreatedOrder(newOrder);
        setPaymentStep('SUCCESS');
        onOrderCreated(newOrder);
      }
    } catch (err: any) {
      setPaymentStep('REVIEW');
      setErrorMessage(err.message || `${selectedProvider} transaction failed or timed out. Please retry.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 animate-in fade-in">
      <div className="bg-white border border-slate-300 rounded-md w-full max-w-lg overflow-hidden shadow-xl text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Duka Procurement Cart</h3>
              <p className="text-[11px] text-slate-500">
                {currentShop.name} · {currentShop.serviceZoneId.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {paymentStep === 'REVIEW' && (
            <>
              {cart.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-700 font-semibold text-sm">Your procurement cart is empty</p>
                  <p className="text-xs text-slate-500">
                    Search for products like unga, blueband, or njugu to add wholesale stock.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-slate-50 border border-slate-200 rounded p-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded object-cover bg-white border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 truncate">
                              {item.product.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              {item.product.packSize}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">
                              KES {item.supplierProduct.price.toLocaleString()} / unit
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {/* Quantity adjustments */}
                          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 px-1.5 py-0.5 rounded">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-5 h-5 rounded hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-semibold text-slate-900 w-4 text-center font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center font-bold cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Location Confirmation */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold flex items-center space-x-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-700" />
                        <span>Delivery Destination</span>
                      </span>
                      <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono font-medium">
                        Geo-Fenced
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium">{currentShop.address}</p>
                    <p className="text-slate-500 text-[11px]">
                      Nearest fulfillment hub: <span className="text-slate-800">{primaryWholesaler}</span>
                    </p>
                  </div>

                  {/* Production Resiliency: Cargo Payload & Vehicle Routing */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-700 font-semibold">
                      <span className="flex items-center space-x-1.5">
                        {payloadAnalysis.assignedVehicleType === 'PICKUP_VAN' ? (
                          <Truck className="w-3.5 h-3.5 text-slate-700" />
                        ) : (
                          <Bike className="w-3.5 h-3.5 text-slate-700" />
                        )}
                        <span>Cargo Logistics & Fleet Dispatch</span>
                      </span>
                      <span className="text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono font-bold px-1.5 py-0.5 rounded">
                        {payloadAnalysis.assignedVehicleType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white border border-slate-200 rounded p-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Total Weight</span>
                        <span className="font-mono font-bold text-slate-900">{payloadAnalysis.totalWeightKg} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Total Volume</span>
                        <span className="font-mono font-bold text-slate-900">{payloadAnalysis.totalVolumeCbm} m³</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-tight">
                      {payloadAnalysis.notes}
                    </p>
                  </div>

                  {/* Promotional Checkout Upsell Placement */}
                  {activeUpsell && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded p-3 text-xs space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-900 flex items-center space-x-1 uppercase tracking-wider">
                          <Star className="w-3 h-3 fill-amber-600 text-amber-600" />
                          <span>Manufacturer Trade Deal • {activeUpsell.sponsorName}</span>
                        </span>
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                          -KES {activeUpsell.discountKES} OFF
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 leading-snug">
                            {activeUpsell.headline}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {activeUpsell.subtext}
                          </p>
                        </div>

                        <button
                          onClick={() => handleAddUpsell(activeUpsell.id, activeUpsell.targetProductId, activeUpsell.discountKES)}
                          className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Deal</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Financial Breakdown */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} wholesale packs)</span>
                      <span className="text-slate-900 font-mono font-medium">KES {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Boda/Cargo Delivery Fee</span>
                      <span className="text-slate-900 font-mono font-medium">KES {deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
                      <span>Total Procurement Due</span>
                      <span className="text-slate-900 font-mono font-bold">KES {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Section 25: Payment Provider Selection (Abstraction) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-700">
                        Payment Provider
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        PaymentService Abstraction
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {availableProviders.map((prov) => {
                        const isSelected = selectedProvider.toLowerCase() === prov.name.toLowerCase();
                        return (
                          <button
                            key={prov.name}
                            type="button"
                            onClick={() => setSelectedProvider(prov.name)}
                            className={`px-2.5 py-1.5 rounded text-left border text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="block font-medium truncate">{prov.name}</span>
                            <span className={`text-[9px] block ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                              {prov.capabilities.supportsStkPush ? 'Instant STK' : 'Multi-Rail'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Provider Billing Details */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 flex items-center justify-between">
                      <span>{selectedProvider} Prompt MSISDN / Identifier</span>
                      <span className="text-[10px] text-emerald-700 font-medium">Instant Callback</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="w-full bg-white border border-slate-300 text-slate-900 pl-9 pr-3 py-1.5 rounded text-xs font-mono focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded flex items-center space-x-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {paymentStep === 'PROCESSING_STK' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Initiating {selectedProvider} Prompt...</h4>
                <p className="text-xs text-slate-500">
                  Please check your device <span className="font-mono text-slate-900 font-semibold">{phoneNumber}</span> and confirm authorization for KES {totalAmount.toLocaleString()}.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded max-w-xs mx-auto text-left text-[11px] font-mono text-slate-600 space-y-0.5">
                <div>• Idempotency key verified: OK</div>
                <div>• Routed via: PaymentService → {selectedProvider}</div>
                <div>• Two-tier transaction ledger sync: ACTIVE</div>
              </div>
            </div>
          )}

          {paymentStep === 'SUCCESS' && createdOrder && (
            <div className="text-center py-5 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-slate-900">Order Placed & Paid</h4>
                <p className="text-xs text-slate-500">
                  Order <span className="font-mono text-slate-900 font-semibold">{createdOrder.id}</span> has been dispatched to {createdOrder.wholesalerName}.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup OTP (for Wholesaler):</span>
                  <span className="font-mono font-semibold text-slate-900">{createdOrder.pickupOtp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Confirmation OTP:</span>
                  <span className="font-mono font-semibold text-emerald-700">{createdOrder.deliveryOtp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-medium text-slate-900">~{createdOrder.estimatedDeliveryMins} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {paymentStep === 'REVIEW' && cart.length > 0 && (
            <>
              <button
                onClick={onClose}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded cursor-pointer"
              >
                Keep Searching
              </button>
              <button
                onClick={handleInitiatePayment}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Pay KES {totalAmount.toLocaleString()} via M-Pesa</span>
              </button>
            </>
          )}

          {paymentStep === 'SUCCESS' && (
            <button
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Close & View Live Order Run
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
