import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { RetailerApp } from './components/RetailerApp';
import { ProductDetailPage } from './components/ProductDetailPage';
import { WholesalerPortal } from './components/WholesalerPortal';
import { RiderConsole } from './components/RiderConsole';
import { AdminOperationsHub } from './components/AdminOperationsHub';
import { CartCheckoutModal } from './components/CartCheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { WaynoProvider, useWayno } from './context/WaynoContext';

function AppContent() {
  const {
    orders,
    events,
    cart,
    payments,
    paymentTransactions,
    paymentRecords,
    currentShop,
    allShops,
    isCartOpen,
    trackingOrder,
    activeOrdersCount,
    cartCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    setIsCartOpen,
    setTrackingOrder,
    selectShop,
    handleOrderCreated,
    handleUpdateOrderStatus,
    handleAssignRider,
    handleReassignRider,
    handleSubstituteOrderItem,
    handleCaptureDeliveryException,
    handleInitiateRefund,
  } = useWayno();

  const renderAdminHub = (subTab?: any) => (
    <AdminOperationsHub
      orders={orders}
      events={events}
      payments={payments}
      paymentTransactions={paymentTransactions}
      paymentRecords={paymentRecords}
      onManualOverrideStatus={handleUpdateOrderStatus}
      onReassignRider={handleReassignRider}
      onInitiateRefund={(orderId, reason) => {
        const target = orders.find(o => o.id === orderId);
        if (target) {
          handleInitiateRefund(orderId, target.totalAmount, reason);
        }
      }}
      defaultSubTab={subTab}
    />
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Universal Top Bar Navigation with React Router */}
      <Header
        cartCount={cartCount}
        openCart={() => setIsCartOpen(true)}
        activeOrdersCount={activeOrdersCount}
      />

      {/* Main Perspective Body Routed Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-12">
        <Routes>
          <Route path="/" element={<Navigate to="/retailer" replace />} />

          <Route
            path="/retailer"
            element={
              <RetailerApp
                currentShop={currentShop}
                onSelectShop={selectShop}
                allShops={allShops}
                cart={cart}
                addToCart={addToCart}
                updateCartQuantity={updateCartQuantity}
                openCheckout={() => setIsCartOpen(true)}
                activeOrders={orders.filter(
                  (o) => o.retailerId === currentShop.retailerId && o.status !== 'DELIVERED'
                )}
                onOrderClick={(order) => setTrackingOrder(order)}
              />
            }
          />

          {/* Wholesale FMCG Product Terminal & Logistics Dossier */}
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/retailer/product/:productId" element={<ProductDetailPage />} />

          <Route
            path="/wholesaler"
            element={
              <WholesalerPortal
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onSubstituteOrderItem={handleSubstituteOrderItem}
              />
            }
          />

          <Route
            path="/rider"
            element={
              <RiderConsole
                orders={orders}
                onAssignRider={handleAssignRider}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onCaptureDeliveryException={handleCaptureDeliveryException}
              />
            }
          />

          {/* Consolidated Admin Operations Hub */}
          <Route path="/admin" element={renderAdminHub('operations')} />
          <Route path="/admin/:tab" element={renderAdminHub()} />

          {/* Integrated shortcuts / deep links to the modules within Admin Operations */}
          <Route path="/operations" element={renderAdminHub('operations')} />
          <Route path="/products" element={renderAdminHub('products')} />
          <Route path="/catalog" element={renderAdminHub('products')} />
          <Route path="/reconciliation" element={renderAdminHub('operations')} />
          <Route path="/reconcile" element={renderAdminHub('operations')} />
          <Route path="/demand" element={renderAdminHub('demand')} />
          <Route path="/demand-analytics" element={renderAdminHub('demand')} />

          {/* Aggregated Market Intelligence Pipeline Routes */}
          <Route path="/intelligence" element={renderAdminHub('intelligence')} />
          <Route path="/market-intelligence" element={renderAdminHub('intelligence')} />
          <Route path="/market" element={renderAdminHub('intelligence')} />
          <Route path="/pipeline" element={renderAdminHub('intelligence')} />

          <Route path="/promotions" element={renderAdminHub('promotions')} />
          <Route path="/promotional-placements" element={renderAdminHub('promotions')} />
          <Route path="/promos" element={renderAdminHub('promotions')} />

          <Route path="/benchmark" element={renderAdminHub('benchmark')} />
          <Route path="/search" element={renderAdminHub('benchmark')} />

          <Route path="/rules" element={renderAdminHub('rules')} />
          <Route path="/business-rules" element={renderAdminHub('rules')} />

          <Route path="/nfr" element={renderAdminHub('nfr')} />
          <Route path="/non-functional" element={renderAdminHub('nfr')} />
          <Route path="/requirements" element={renderAdminHub('nfr')} />

          <Route path="/architecture" element={renderAdminHub('architecture')} />
          <Route path="/flows" element={renderAdminHub('architecture')} />
          <Route path="/navigation" element={renderAdminHub('architecture')} />

          {/* Dedicated Monorepo Repository Structure Routes */}
          <Route path="/repository" element={renderAdminHub('repository')} />
          <Route path="/repo" element={renderAdminHub('repository')} />
          <Route path="/monorepo" element={renderAdminHub('repository')} />

          {/* Database & PostGIS Indexing Routes */}
          <Route path="/database" element={renderAdminHub('database')} />
          <Route path="/indexes" element={renderAdminHub('database')} />
          <Route path="/indexing" element={renderAdminHub('database')} />
          <Route path="/postgis" element={renderAdminHub('database')} />

          {/* Section 45: 5-Signal Recommendation Engine Routes */}
          <Route path="/recommendations" element={renderAdminHub('recommendations')} />
          <Route path="/recommend" element={renderAdminHub('recommendations')} />
          <Route path="/recommendation-engine" element={renderAdminHub('recommendations')} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/retailer" replace />} />
        </Routes>
      </main>

      {/* Cart & Checkout Modal */}
      <CartCheckoutModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        currentShop={currentShop}
        onOrderCreated={handleOrderCreated}
        onTrackOrder={setTrackingOrder}
        addToCart={addToCart}
      />

      {/* Order Tracking Modal - Real-Time reactive synchronization */}
      <OrderTrackingModal
        order={trackingOrder ? (orders.find((o) => o.id === trackingOrder.id) || trackingOrder) : null}
        onClose={() => setTrackingOrder(null)}
      />

      {/* Clean Global Footer */}
      <footer className="border-t border-slate-200 bg-white text-[11px] text-slate-500 py-3 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">
              WAYNO B2B FMCG Distribution
            </span>
            <span className="text-slate-300">|</span>
            <span>Nairobi Corridor Network</span>
          </div>
          <div className="text-slate-400">
            Rapid replenishment for informal retail & wholesale distribution
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <WaynoProvider>
        <AppContent />
      </WaynoProvider>
    </BrowserRouter>
  );
}
