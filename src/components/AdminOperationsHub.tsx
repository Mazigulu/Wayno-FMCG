import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Search, 
  Scale, 
  ShieldCheck, 
  Zap, 
  Database, 
  Radio, 
  TrendingUp,
  Cpu,
  BarChart3,
  Tag,
  FolderTree,
  Sparkles,
  Package,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Boxes,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { Order, TelemetryEvent, OrderState, PaymentRecord, Payment, PaymentTransaction, Rider } from '../types/wayno';
import { OperationsConsole } from './OperationsConsole';
import { DemandAnalyticsConsole } from './DemandAnalyticsConsole';
import { MarketIntelligenceConsole } from './MarketIntelligenceConsole';
import { PromotionsManagerConsole } from './PromotionsManagerConsole';
import { SearchBenchmark } from './SearchBenchmark';
import { BusinessRulesConsole } from './BusinessRulesConsole';
import { NFRConsole } from './NFRConsole';
import { ArchitectureWorkspace } from './ArchitectureWorkspace';
import { RepositoryStructureExplorer } from './RepositoryStructureExplorer';
import { DatabaseIndexingConsole } from './DatabaseIndexingConsole';
import { RecommendationEngineConsole } from './RecommendationEngineConsole';
import { ProductsMasterCatalog } from './operations/ProductsMasterCatalog';
import { SupplyNodeTreeVisualizer } from './hierarchical/SupplyNodeTreeVisualizer';

export type AdminSubTab = 
  | 'operations' 
  | 'products' 
  | 'geofence' 
  | 'demand' 
  | 'intelligence' 
  | 'promotions' 
  | 'benchmark' 
  | 'rules' 
  | 'nfr' 
  | 'architecture' 
  | 'repository' 
  | 'database' 
  | 'recommendations';

interface AdminOperationsHubProps {
  orders: Order[];
  events: TelemetryEvent[];
  payments?: Payment[];
  paymentTransactions?: PaymentTransaction[];
  paymentRecords?: PaymentRecord[];
  onManualOverrideStatus: (orderId: string, newState: OrderState, note: string) => void;
  onReassignRider?: (orderId: string, newRider: Rider, reason: string) => void;
  onInitiateRefund?: (orderId: string, reason: string) => void;
  defaultSubTab?: AdminSubTab;
}

interface NavItem {
  id: AdminSubTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  badge?: string;
  items: NavItem[];
}

export const AdminOperationsHub: React.FC<AdminOperationsHubProps> = ({
  orders,
  events,
  payments = [],
  paymentTransactions = [],
  paymentRecords = [],
  onManualOverrideStatus,
  onReassignRider,
  onInitiateRefund,
  defaultSubTab,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Determine active sub-tab from current route or props
  const resolveTabFromPath = (): AdminSubTab => {
    const path = location.pathname;
    if (path.includes('/geofence') || path.includes('/supply-nodes') || path.includes('/nodes')) return 'geofence';
    if (path.includes('/products') || path.includes('/catalog')) return 'products';
    if (path.includes('/promo') || path.includes('/placement') || path.includes('/ads')) return 'promotions';
    if (path.includes('/intelligence') || path.includes('/market') || path.includes('/pipeline')) return 'intelligence';
    if (path.includes('/demand') || path.includes('/forecast') || path.includes('/analytics')) return 'demand';
    if (path.includes('/benchmark') || path.includes('/search')) return 'benchmark';
    if (path.includes('/rules') || path.includes('/business-rules')) return 'rules';
    if (path.includes('/nfr') || path.includes('/non-functional') || path.includes('/requirements')) return 'nfr';
    if (path.includes('/architecture') || path.includes('/flows') || path.includes('/navigation')) return 'architecture';
    if (path.includes('/repo') || path.includes('/repository') || path.includes('/monorepo')) return 'repository';
    if (path.includes('/recommend') || path.includes('/recommendations')) return 'recommendations';
    if (path.includes('/database') || path.includes('/indexes') || path.includes('/indexing') || path.includes('/postgis') || path.includes('/sql')) return 'database';
    if (
      path.includes('/operations') || 
      path.includes('/retailers') || 
      path.includes('/wholesalers') || 
      path.includes('/riders') || 
      path.includes('/payments') || 
      path.includes('/deliveries') || 
      path.includes('/issues') || 
      path.includes('/search-analytics')
    ) return 'operations';
    return defaultSubTab || 'operations';
  };

  const resolveOperationsPage = () => {
    const path = location.pathname;
    if (path.includes('/retailers')) return 'retailers';
    if (path.includes('/wholesalers')) return 'wholesalers';
    if (path.includes('/riders')) return 'riders';
    if (path.includes('/products')) return 'products';
    if (path.includes('/payments') || path.includes('/reconciliation')) return 'payments';
    if (path.includes('/deliveries')) return 'deliveries';
    if (path.includes('/issues')) return 'issues';
    if (path.includes('/search-analytics')) return 'search_analytics';
    if (path.includes('/telemetry')) return 'telemetry';
    return undefined;
  };

  const [activeTab, setActiveTab] = useState<AdminSubTab>(resolveTabFromPath);

  // Keep state synchronized if URL path changes externally
  useEffect(() => {
    setActiveTab(resolveTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tab: AdminSubTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false); // Close drawer on mobile selection
    navigate(`/admin/${tab}`);
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;

  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0) + 184500;

  // Segmented Navigation Structure
  const navigationSections: NavSection[] = [
    {
      title: 'Core Operations & Supply',
      badge: 'Live',
      items: [
        {
          id: 'operations',
          label: 'Operations & Telemetry',
          sublabel: 'Desks, Orders & Dispatch',
          icon: Activity,
          badge: `${activeOrdersCount} Active`,
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
        {
          id: 'products',
          label: 'Product Master Catalog',
          sublabel: 'Section 13 FMCG Taxonomy',
          icon: Package,
          badge: 'Catalog',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        },
        {
          id: 'geofence',
          label: 'Supply Node Hierarchy',
          sublabel: '20 km Leaf Nodes & Tree',
          icon: Network,
          badge: '20km Grid',
          badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
        },
      ],
    },
    {
      title: 'Market & Growth Intelligence',
      badge: 'AI Powered',
      items: [
        {
          id: 'demand',
          label: 'Demand Analytics',
          sublabel: 'Predictive Stocking & Forecasts',
          icon: BarChart3,
          badge: 'Forecast',
          badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
        },
        {
          id: 'intelligence',
          label: 'Market Intelligence',
          sublabel: '5-Stage Aggregation Pipeline',
          icon: Cpu,
          badge: '5 Stages',
          badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        },
        {
          id: 'promotions',
          label: 'Promotional Placements',
          sublabel: 'Sponsored Ads & Banners',
          icon: Tag,
          badge: 'Ads',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'recommendations',
          label: 'Recommendation Engine',
          sublabel: 'Section 45 5-Signal Scoring',
          icon: Sparkles,
          badge: 'Sec 45',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        },
      ],
    },
    {
      title: 'Search, Governance & SLAs',
      items: [
        {
          id: 'benchmark',
          label: 'Search & SLA Benchmark',
          sublabel: '16 Search Specs & Live Logs',
          icon: Search,
          badge: '<300ms',
          badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        },
        {
          id: 'rules',
          label: 'Business Rules Engine',
          sublabel: '14 Core Commerce Guardrails',
          icon: Scale,
          badge: '14 Rules',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        },
        {
          id: 'nfr',
          label: 'NFR Specifications',
          sublabel: '14 Hardened SLAs & Audits',
          icon: ShieldCheck,
          badge: '14 NFRs',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
      ],
    },
    {
      title: 'Infrastructure & Engineering',
      badge: 'PostGIS / Code',
      items: [
        {
          id: 'database',
          label: 'Database & PostGIS',
          sublabel: 'Spatial Indexing & Schema',
          icon: Database,
          badge: 'PostGIS',
          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
        },
        {
          id: 'architecture',
          label: 'Architecture & Flows',
          sublabel: 'System Blueprint & Workspaces',
          icon: Zap,
          badge: 'Blueprint',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        {
          id: 'repository',
          label: 'Monorepo Structure',
          sublabel: 'wayno/ Project Organization',
          icon: FolderTree,
          badge: 'wayno/',
          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
      ],
    },
  ];

  // Flat items map for quick title lookups
  const allItems: NavItem[] = navigationSections.flatMap((s) => s.items);
  const activeItem = allItems.find((i) => i.id === activeTab) || allItems[0];
  const ActiveIcon = activeItem.icon;

  const renderNavList = (isMobile = false) => (
    <div className="p-2 space-y-3">
      {navigationSections.map((section, sIdx) => (
        <div key={sIdx} className="space-y-1">
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </span>
              {section.badge && (
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {section.badge}
                </span>
              )}
            </div>
          )}

          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-tab-${item.id}`}
                  onClick={() => handleTabChange(item.id)}
                  title={sidebarCollapsed && !isMobile ? `${item.label} (${item.sublabel})` : undefined}
                  className={`w-full flex items-center text-left rounded-md transition-all cursor-pointer ${
                    sidebarCollapsed && !isMobile
                      ? 'justify-center p-2.5' 
                      : 'px-2.5 py-2 space-x-2.5'
                  } ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`} />

                  {(!sidebarCollapsed || isMobile) && (
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                      <div className="truncate">
                        <div className="text-xs truncate leading-tight">
                          {item.label}
                        </div>
                        <div className={`text-[10px] truncate leading-tight ${
                          isActive ? 'text-slate-300' : 'text-slate-400'
                        }`}>
                          {item.sublabel}
                        </div>
                      </div>

                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 border ${
                          isActive 
                            ? 'bg-white/20 text-white border-white/30' 
                            : (item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200')
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3 sm:space-y-4 pb-20">
      {/* Top Telemetry & Status Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3 sm:p-4 text-slate-900 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Admin Operations Command Center
                </h1>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>13 Modules</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[260px] sm:max-w-xl">
                Unified administration: Live Dispatch · Master Catalog · Demand Analytics · Market Intelligence · Benchmark · NFRs · PostGIS
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs overflow-x-auto pb-0.5 no-scrollbar">
            <span className="font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 sm:py-1 rounded text-slate-700 font-medium flex items-center space-x-1 shrink-0 text-[11px] sm:text-xs">
              <Radio className="w-3 h-3 text-emerald-600" />
              <span>Pipeline: <strong className="text-slate-900">{activeOrdersCount}</strong></span>
            </span>
            <span className="font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 sm:py-1 rounded text-slate-700 font-medium flex items-center space-x-1 shrink-0 text-[11px] sm:text-xs">
              <TrendingUp className="w-3 h-3 text-indigo-600" />
              <span>GMV: <strong className="text-slate-900 font-mono">KES {totalGMV.toLocaleString()}</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Module Selector & Drawer Toggle Button */}
      <div className="lg:hidden flex items-center justify-between bg-white border border-slate-200 rounded-md p-2.5 shadow-2xs">
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center space-x-2.5 text-left flex-1 min-w-0 cursor-pointer"
        >
          <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center shrink-0">
            <ActiveIcon className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Current Module
            </div>
            <div className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1.5">
              <span>{activeItem.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium flex items-center space-x-1 cursor-pointer shrink-0 border border-slate-200"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Mobile Drawer Backdrop & Modal Side Sheet */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Admin Modules
                </span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderNavList(true)}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
              <span>13 Modules Active</span>
              <span className="font-mono text-emerald-700 font-semibold">WAYNO V1</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout: Desktop Side Menu + Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Desktop Sidebar Navigation (Hidden on mobile, drawer is used) */}
        <aside 
          className={`hidden lg:block shrink-0 bg-white border border-slate-200 rounded-md transition-all duration-200 ${
            sidebarCollapsed ? 'w-16' : 'w-72'
          }`}
        >
          {/* Sidebar Header & Toggle */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/60 rounded-t-md">
            <div className={`flex items-center space-x-2 ${sidebarCollapsed ? 'hidden' : ''}`}>
              <Boxes className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Admin Console
              </span>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto cursor-pointer"
              title={sidebarCollapsed ? 'Expand Side Menu' : 'Collapse Side Menu'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {renderNavList(false)}
        </aside>

        {/* Right Active Content Area */}
        <main className="flex-1 min-w-0 w-full">
          {activeTab === 'operations' && (
             <OperationsConsole
               orders={orders}
               events={events}
               payments={payments}
               paymentTransactions={paymentTransactions}
               paymentRecords={paymentRecords}
               onManualOverrideStatus={onManualOverrideStatus}
               onReassignRider={onReassignRider}
               onInitiateRefund={onInitiateRefund}
               initialPage={resolveOperationsPage()}
             />
          )}

          {activeTab === 'products' && (
            <ProductsMasterCatalog />
          )}

          {activeTab === 'geofence' && (
            <div className="space-y-4">
              <SupplyNodeTreeVisualizer orders={orders} />
            </div>
          )}

          {activeTab === 'demand' && (
            <DemandAnalyticsConsole orders={orders} />
          )}

          {activeTab === 'intelligence' && (
            <MarketIntelligenceConsole />
          )}

          {activeTab === 'promotions' && (
            <PromotionsManagerConsole />
          )}

          {activeTab === 'benchmark' && (
            <SearchBenchmark />
          )}

          {activeTab === 'rules' && (
            <BusinessRulesConsole />
          )}

          {activeTab === 'nfr' && (
            <NFRConsole />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureWorkspace />
          )}

          {activeTab === 'repository' && (
            <RepositoryStructureExplorer />
          )}

          {activeTab === 'database' && (
            <DatabaseIndexingConsole />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationEngineConsole orders={orders} />
          )}
        </main>
      </div>
    </div>
  );
};
