import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  Store, 
  Bike, 
  Activity, 
  Cpu, 
  FlaskConical, 
  Layers, 
  CheckCircle2, 
  ShieldCheck,
  Search,
  Zap,
  Scale
} from 'lucide-react';

export type ActiveTab = 'retailer' | 'wholesaler' | 'rider' | 'admin' | 'operations' | 'architecture' | 'benchmark' | 'rules' | 'nfr';

interface HeaderProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  cartCount: number;
  openCart: () => void;
  activeOrdersCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab: propActiveTab,
  setActiveTab,
  cartCount,
  openCart,
  activeOrdersCount,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine current active tab from pathname or prop fallback
  const getActiveTab = (): ActiveTab => {
    if (currentPath.startsWith('/wholesaler')) return 'wholesaler';
    if (currentPath.startsWith('/rider')) return 'rider';
    if (
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/operations') ||
      currentPath.startsWith('/intelligence') ||
      currentPath.startsWith('/market') ||
      currentPath.startsWith('/pipeline') ||
      currentPath.startsWith('/demand') ||
      currentPath.startsWith('/promotions') ||
      currentPath.startsWith('/benchmark') ||
      currentPath.startsWith('/search') ||
      currentPath.startsWith('/rules') ||
      currentPath.startsWith('/business-rules') ||
      currentPath.startsWith('/nfr') ||
      currentPath.startsWith('/non-functional') ||
      currentPath.startsWith('/requirements') ||
      currentPath.startsWith('/architecture') ||
      currentPath.startsWith('/flows') ||
      currentPath.startsWith('/navigation')
    ) {
      return 'admin';
    }
    if (currentPath.startsWith('/retailer')) return 'retailer';
    return propActiveTab || 'retailer';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: ActiveTab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand Identity */}
          <Link 
            to="/retailer" 
            onClick={() => handleTabClick('retailer')}
            className="flex items-center space-x-3 group"
          >
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center font-bold text-white text-sm tracking-tight group-hover:bg-slate-800 transition-colors">
              W
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-base tracking-tight text-slate-900">WAYNO</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                v1.0
              </span>
            </div>
          </Link>

          {/* Clean Outlook Navigation Tabs */}
          <nav className="hidden lg:flex items-center h-full space-x-1">
            <Link
              to="/retailer"
              onClick={() => handleTabClick('retailer')}
              className={`h-full flex items-center space-x-1.5 px-3.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'retailer'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Duka Retailer</span>
            </Link>

            <Link
              to="/wholesaler"
              onClick={() => handleTabClick('wholesaler')}
              className={`h-full flex items-center space-x-1.5 px-3.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'wholesaler'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Wholesale Hub</span>
            </Link>

            <Link
              to="/rider"
              onClick={() => handleTabClick('rider')}
              className={`h-full flex items-center space-x-1.5 px-3.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'rider'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Rider Console</span>
            </Link>

            {/* Consolidated Admin Operations (Operations, Benchmark, Rules, NFR, Architecture) */}
            <Link
              to="/admin"
              onClick={() => handleTabClick('admin')}
              className={`h-full flex items-center space-x-1.5 px-3.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'admin'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Operations</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Command Center
              </span>
              {activeOrdersCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
            </Link>
          </nav>

          {/* Quick Actions / Cart */}
          <div className="flex items-center space-x-3">
            {/* Cart Button */}
            <button
              onClick={openCart}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
              id="header-cart-button"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="ml-1 bg-white text-slate-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto py-1.5 border-t border-slate-200 text-xs">
          <Link
            to="/retailer"
            onClick={() => handleTabClick('retailer')}
            className={`px-3 py-1 rounded whitespace-nowrap font-medium transition-colors ${
              activeTab === 'retailer' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Retailer
          </Link>
          <Link
            to="/wholesaler"
            onClick={() => handleTabClick('wholesaler')}
            className={`px-3 py-1 rounded whitespace-nowrap font-medium transition-colors ${
              activeTab === 'wholesaler' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Wholesale
          </Link>
          <Link
            to="/rider"
            onClick={() => handleTabClick('rider')}
            className={`px-3 py-1 rounded whitespace-nowrap font-medium transition-colors ${
              activeTab === 'rider' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Riders
          </Link>
          <Link
            to="/admin"
            onClick={() => handleTabClick('admin')}
            className={`px-3 py-1 rounded whitespace-nowrap font-medium transition-colors ${
              activeTab === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Admin Operations
          </Link>
        </div>
      </div>
    </header>
  );
};

