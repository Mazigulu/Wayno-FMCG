import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Search, 
  Scale, 
  ShieldCheck, 
  Zap, 
  Server, 
  Database, 
  Radio, 
  TrendingUp,
  Cpu,
  Layers,
  BarChart3,
  Tag,
  FolderTree,
  Sparkles,
  Package,
  Network
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

export type AdminSubTab = 'operations' | 'products' | 'geofence' | 'demand' | 'intelligence' | 'promotions' | 'benchmark' | 'rules' | 'nfr' | 'architecture' | 'repository' | 'database' | 'recommendations';

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
    navigate(`/admin/${tab}`);
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;

  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0) + 184500;

  return (
    <div className="space-y-4 pb-20">
      {/* Consolidated Admin Operations Command Banner & Sub-Navigation */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 sm:p-4 text-slate-900 shadow-2xs">
        {/* Title and Telemetry Status Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-slate-900">
                  Admin Operations Command Center
                </h1>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>12 Enterprise Modules</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-xl">
                Unified administration: Live Dispatch & Telemetry · Master Catalog · Demand Analytics · Market Intelligence · Promotions · Search & SLA Benchmark · Recommendations · Business Rules · NFRs · Architecture · Database · Monorepo
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-700 font-medium flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pipeline: <strong className="text-slate-900">{activeOrdersCount}</strong></span>
            </span>
            <span className="hidden sm:flex font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-700 font-medium items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>GMV: <strong className="text-slate-900 font-mono">KES {totalGMV.toLocaleString()}</strong></span>
            </span>
            <span className="hidden md:flex font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-700 font-medium items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-600" />
              <span>SLA: <strong className="text-slate-900 font-mono">99.98%</strong></span>
            </span>
            <span className="hidden lg:flex font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-700 font-medium items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-amber-600" />
              <span>P95: <strong className="text-slate-900 font-mono">168ms</strong></span>
            </span>
          </div>
        </div>

        {/* The 8 Merged Modules Tabs */}
        <div className="flex items-center space-x-1 pt-2.5 overflow-x-auto text-xs">
          {/* 1. Operations & Pipeline */}
          <button
            id="admin-tab-operations"
            onClick={() => handleTabChange('operations')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'operations'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Operations & Telemetry</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'operations' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'
            }`}>
              {activeOrdersCount} Active
            </span>
          </button>

          {/* 1B. Product Management (Section 13) */}
          <button
            id="admin-tab-products"
            onClick={() => handleTabChange('products')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span>Product Management (Sec 13)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'products' ? 'bg-white text-slate-900' : 'bg-blue-100 text-blue-800'
            }`}>
              Master Catalog
            </span>
          </button>

          {/* 1C. Geographic Supply Nodes & Geofencing */}
          <button
            id="admin-tab-geofence"
            onClick={() => handleTabChange('geofence')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'geofence'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supply Node Tree</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'geofence' ? 'bg-white text-slate-900' : 'bg-emerald-100 text-emerald-800'
            }`}>
              20 km Nodes
            </span>
          </button>

          {/* 2. Demand Analytics & Forecasting */}
          <button
            id="admin-tab-demand"
            onClick={() => handleTabChange('demand')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'demand'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
            <span>Demand Analytics</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'demand' ? 'bg-white text-slate-900' : 'bg-rose-100 text-rose-800'
            }`}>
              AI Forecast
            </span>
          </button>

          {/* 3. Aggregated Market Intelligence Pipeline */}
          <button
            id="admin-tab-intelligence"
            onClick={() => handleTabChange('intelligence')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'intelligence'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Market Intelligence</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'intelligence' ? 'bg-white text-slate-900' : 'bg-indigo-100 text-indigo-800'
            }`}>
              5 Stages
            </span>
          </button>

          {/* 4. Promotional Placements & Sponsored Ads */}
          <button
            id="admin-tab-promotions"
            onClick={() => handleTabChange('promotions')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'promotions'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Promotional Placements</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'promotions' ? 'bg-white text-slate-900' : 'bg-amber-100 text-amber-800'
            }`}>
              Live Ads
            </span>
          </button>

          {/* 4. Search Benchmark Core */}
          <button
            id="admin-tab-benchmark"
            onClick={() => handleTabChange('benchmark')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search & SLA Benchmark</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'benchmark' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'
            }`}>
              16 Specs + Logs
            </span>
          </button>

          {/* 5. Business Rules */}
          <button
            id="admin-tab-rules"
            onClick={() => handleTabChange('rules')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Business Rules</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'rules' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'
            }`}>
              14 Rules
            </span>
          </button>

          {/* 4. NFR Specs */}
          <button
            id="admin-tab-nfr"
            onClick={() => handleTabChange('nfr')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'nfr'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>NFR Specifications</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'nfr' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'
            }`}>
              14 NFRs
            </span>
          </button>

          {/* 5. Architecture & Flows */}
          <button
            id="admin-tab-architecture"
            onClick={() => handleTabChange('architecture')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Architecture & Flows</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'architecture' ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-800'
            }`}>
              Blueprint
            </span>
          </button>

          {/* 6. Repository Monorepo Structure */}
          <button
            id="admin-tab-repository"
            onClick={() => handleTabChange('repository')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'repository'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
            <span>Repository Monorepo</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'repository' ? 'bg-white text-slate-900' : 'bg-emerald-100 text-emerald-800'
            }`}>
              wayno/
            </span>
          </button>

          {/* 7. Database & PostGIS Indexing */}
          <button
            id="admin-tab-database"
            onClick={() => handleTabChange('database')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'database'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Database & Indexes</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'database' ? 'bg-white text-slate-900' : 'bg-blue-100 text-blue-800'
            }`}>
              PostGIS
            </span>
          </button>

          {/* 8. 5-Signal Recommendation Engine (Section 45) */}
          <button
            id="admin-tab-recommendations"
            onClick={() => handleTabChange('recommendations')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'recommendations'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Recommendation Engine</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'recommendations' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
            }`}>
              Sec 45
            </span>
          </button>
        </div>
      </div>

      {/* Render Active Merged Module */}
      <div>
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
      </div>
    </div>
  );
};
