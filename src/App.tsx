import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { RetailerApp } from './components/RetailerApp';
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
        addToCart={addToCart}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
      />

      {/* Bottom Global Status Bar - Outlook Clean Footer */}
      <footer className="border-t border-slate-200 bg-white text-[11px] text-slate-500 py-2.5 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">
              WAYNO FMCG Pilot Network
            </span>
            <span className="text-slate-300">|</span>
            <span>Nairobi Geo-fence Active</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 font-medium">
            <span>FastAPI ML: Connected</span>
            <span>•</span>
            <span>Rust Axum: Ready</span>
            <span>•</span>
            <span>PostGIS: Active</span>
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
