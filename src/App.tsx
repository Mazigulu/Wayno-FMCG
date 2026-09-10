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
  } = useWayno();

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
              />
            }
          />

          {/* Consolidated Admin Operations Hub */}
          <Route
            path="/admin"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="operations"
              />
            }
          />
          <Route
            path="/admin/:tab"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
              />
            }
          />

          {/* Integrated shortcuts / deep links to the modules within Admin Operations */}
          <Route
            path="/operations"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="operations"
              />
            }
          />

          <Route
            path="/demand"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="demand"
              />
            }
          />
          <Route
            path="/demand-analytics"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="demand"
              />
            }
          />

          {/* Aggregated Market Intelligence Pipeline Routes */}
          <Route
            path="/intelligence"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="intelligence"
              />
            }
          />
          <Route
            path="/market-intelligence"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="intelligence"
              />
            }
          />
          <Route
            path="/market"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="intelligence"
              />
            }
          />
          <Route
            path="/pipeline"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="intelligence"
              />
            }
          />

          <Route
            path="/promotions"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="promotions"
              />
            }
          />
          <Route
            path="/promotional-placements"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="promotions"
              />
            }
          />
          <Route
            path="/promos"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="promotions"
              />
            }
          />

          <Route
            path="/benchmark"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="benchmark"
              />
            }
          />
          <Route
            path="/search"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="benchmark"
              />
            }
          />

          <Route
            path="/rules"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="rules"
              />
            }
          />
          <Route
            path="/business-rules"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="rules"
              />
            }
          />

          <Route
            path="/nfr"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="nfr"
              />
            }
          />
          <Route
            path="/non-functional"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="nfr"
              />
            }
          />
          <Route
            path="/requirements"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="nfr"
              />
            }
          />

          <Route
            path="/architecture"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="architecture"
              />
            }
          />
          <Route
            path="/flows"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="architecture"
              />
            }
          />
          <Route
            path="/navigation"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="architecture"
              />
            }
          />

          {/* Dedicated Monorepo Repository Structure Routes */}
          <Route
            path="/repository"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="repository"
              />
            }
          />
          <Route
            path="/repo"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="repository"
              />
            }
          />
          <Route
            path="/monorepo"
            element={
              <AdminOperationsHub
                orders={orders}
                events={events}
                onManualOverrideStatus={handleUpdateOrderStatus}
                defaultSubTab="repository"
              />
            }
          />

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
