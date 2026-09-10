import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  AlertTriangle, 
  Layers, 
  MapPin, 
  Calendar, 
  Download, 
  Sparkles, 
  Sliders, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  CheckCircle2, 
  Search, 
  Filter, 
  Send, 
  Eye, 
  HelpCircle,
  Package,
  DollarSign,
  Activity,
  ShieldAlert,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  DEMAND_METRIC_SUMMARY, 
  CATEGORY_DEMAND_BREAKDOWN, 
  REGIONAL_DEMAND_ZONES, 
  HISTORICAL_AND_PROJECTED_DEMAND, 
  SUPPRESSED_DEMAND_SIGNALS, 
  ML_DEMAND_MODEL_INSIGHT,
  CategoryDemand,
  SuppressedDemandSignal
} from '../data/demandAnalyticsData';
import { Order } from '../types/wayno';

interface DemandAnalyticsConsoleProps {
  orders?: Order[];
}

export const DemandAnalyticsConsole: React.FC<DemandAnalyticsConsoleProps> = ({ orders = [] }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'categories' | 'zones' | 'suppressed' | 'forecast_simulator'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'quarter'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [suppressedSignals, setSuppressedSignals] = useState<SuppressedDemandSignal[]>(SUPPRESSED_DEMAND_SIGNALS);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  // Scenario Simulator State
  const [simFuelSurcharge, setSimFuelSurcharge] = useState<number>(0); // % change
  const [simInventoryInjection, setSimInventoryInjection] = useState<number>(500); // Bales
  const [simPromoDiscount, setSimPromoDiscount] = useState<number>(5); // % discount
  const [simWeatherSeverity, setSimWeatherSeverity] = useState<'none' | 'moderate' | 'severe'>('none');

  // Interactive Action Handler for Suppressed Demand
  const handleTriggerAction = (signalId: string, actionType: string) => {
    setSuppressedSignals(prev => 
      prev.map(sig => {
        if (sig.id === signalId) {
          return {
            ...sig,
            status: actionType === 'alert' ? 'SUPPLIER_ALERTED' : 'RESTOCK_SCHEDULED'
          };
        }
        return sig;
      })
    );

    const signal = suppressedSignals.find(s => s.id === signalId);
    setAlertSuccessMsg(`Action triggered: ${actionType === 'alert' ? 'Wholesaler Stock Alert dispatched' : 'Restock consignment scheduled'} for ${signal?.skuName}`);
    setTimeout(() => setAlertSuccessMsg(null), 4000);
  };

  // Scenario Simulator Computed Projections
  const simulationResults = useMemo(() => {
    const baseGMV = DEMAND_METRIC_SUMMARY.totalDemandGMV;
    const baseFulfillment = DEMAND_METRIC_SUMMARY.fulfillmentRate;

    // Price elasticity effect: each 1% promo discount increases demand by 1.8%
    const promoDemandLift = simPromoDiscount * 1.8;

    // Fuel surcharge dampens demand: each 5% surcharge reduces demand by 2.2%
    const fuelDemandDampener = (simFuelSurcharge / 5) * 2.2;

    // Weather impact: rain increases safety-stocking but slows delivery
    const weatherImpact = simWeatherSeverity === 'severe' ? -4.5 : simWeatherSeverity === 'moderate' ? -1.5 : 0;
    const weatherSafetyStockLift = simWeatherSeverity === 'severe' ? 7.2 : simWeatherSeverity === 'moderate' ? 3.0 : 0;

    const netDemandLiftPercent = promoDemandLift - fuelDemandDampener + weatherSafetyStockLift;
    const projectedGMV = Math.round(baseGMV * (1 + netDemandLiftPercent / 100));

    // Inventory injection improves fulfillment rate
    const fulfillmentImprovement = Math.min(99.2, baseFulfillment + (simInventoryInjection / 250) * 1.6 + weatherImpact);
    const projectedUnmetGMV = Math.round(projectedGMV * (1 - fulfillmentImprovement / 100));
    const projectedRealizedGMV = projectedGMV - projectedUnmetGMV;

    // Additional riders needed
    const additionalBodaTrips = Math.round((projectedRealizedGMV - DEMAND_METRIC_SUMMARY.realizedDemandGMV) / 4500);

    return {
      netDemandLiftPercent: Number(netDemandLiftPercent.toFixed(1)),
      projectedGMV,
      projectedRealizedGMV,
      projectedUnmetGMV,
      projectedFulfillmentRate: Number(fulfillmentImprovement.toFixed(1)),
      additionalBodaTrips: Math.max(0, additionalBodaTrips),
    };
  }, [simFuelSurcharge, simInventoryInjection, simPromoDiscount, simWeatherSeverity]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (selectedCategory === 'all') return CATEGORY_DEMAND_BREAKDOWN;
    return CATEGORY_DEMAND_BREAKDOWN.filter(c => c.id === selectedCategory);
  }, [selectedCategory]);

  // Export report handler
  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: DEMAND_METRIC_SUMMARY,
      categories: CATEGORY_DEMAND_BREAKDOWN,
      zones: REGIONAL_DEMAND_ZONES,
      suppressedSignals: suppressedSignals,
      mlModel: ML_DEMAND_MODEL_INSIGHT
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wayno-demand-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find max demand point for visual scaling
  const maxDemand = Math.max(...HISTORICAL_AND_PROJECTED_DEMAND.map(d => d.totalDemand));

  return (
    <div className="space-y-4">
      {/* Action Notification Banner */}
      {alertSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-md flex items-center justify-between text-xs animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{alertSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setAlertSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Section Sub-Navbar */}
      <div className="bg-white border border-slate-200 rounded-md p-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'overview'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demand Overview & Telemetry</span>
            </button>

            <button
              onClick={() => setActiveSection('categories')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'categories'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>Category & SKU Velocity</span>
            </button>

            <button
              onClick={() => setActiveSection('zones')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'zones'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Corridor Geography (Nairobi)</span>
            </button>

            <button
              onClick={() => setActiveSection('suppressed')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'suppressed'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Suppressed Demand & Stockouts</span>
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-mono">
                {suppressedSignals.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('forecast_simulator')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'forecast_simulator'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>ML Forecast & What-If Simulator</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportReport}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
              title="Export complete demand analytics data in JSON format"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Intel</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: OVERVIEW & TELEMETRY */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Top Metric Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Demand Card */}
            <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Total Aggregated Demand</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  +{DEMAND_METRIC_SUMMARY.projectedGrowthWoW}% WoW
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                KES {(DEMAND_METRIC_SUMMARY.totalDemandGMV / 1000000).toFixed(2)}M
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                <span>Total Units: <strong>{DEMAND_METRIC_SUMMARY.totalUnitsOrdered.toLocaleString()}</strong></span>
                <span>Avg Basket: <strong>KES {DEMAND_METRIC_SUMMARY.avgOrderValueKES.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Realized vs Unmet Fulfillment */}
            <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Demand Fulfillment Ratio</span>
                <span className="text-slate-800 font-bold font-mono text-xs">
                  {DEMAND_METRIC_SUMMARY.fulfillmentRate}%
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-700">
                KES {(DEMAND_METRIC_SUMMARY.realizedDemandGMV / 1000000).toFixed(2)}M
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${DEMAND_METRIC_SUMMARY.fulfillmentRate}%` }}
                />
                <div 
                  className="bg-rose-500 h-full rounded-full" 
                  style={{ width: `${100 - DEMAND_METRIC_SUMMARY.fulfillmentRate}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                <span className="text-emerald-700">● Fulfilled: {(DEMAND_METRIC_SUMMARY.realizedDemandGMV / 1000000).toFixed(1)}M</span>
                <span className="text-rose-600 font-semibold">● Unmet Gap: {(DEMAND_METRIC_SUMMARY.unmetDemandGMV / 1000000).toFixed(2)}M</span>
              </div>
            </div>

            {/* Active Dukas Ordering */}
            <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Active Retail Duka Base</span>
                <span className="text-slate-600 font-mono text-[10px]">Nairobi Metropolitan</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {DEMAND_METRIC_SUMMARY.activeRetailersCount.toLocaleString()} <span className="text-xs font-normal text-slate-500">Merchants</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-1.5 flex items-center justify-between">
                <span>Avg Orders/Month: <strong>14.7</strong></span>
                <span className="text-indigo-600 font-semibold">Retention: 92.4%</span>
              </div>
            </div>

            {/* Suppressed / Lost Demand Signals */}
            <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-md p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-rose-800 mb-1">
                <span className="font-semibold flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  Suppressed Demand Signals
                </span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                  Lost Revenue
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-rose-700">
                KES {(DEMAND_METRIC_SUMMARY.unmetDemandGMV / 1000000).toFixed(2)}M
              </div>
              <div className="mt-2 text-[11px] text-slate-600 border-t border-rose-100 pt-1.5 flex items-center justify-between">
                <span>Stockout Signal Logs: <strong>{DEMAND_METRIC_SUMMARY.zeroResultSuppressedCount}</strong></span>
                <button 
                  onClick={() => setActiveSection('suppressed')}
                  className="text-rose-700 hover:text-rose-900 font-bold underline"
                >
                  Inspect Gaps →
                </button>
              </div>
            </div>
          </div>

          {/* Time Series Demand Graph (Past 10 Days + Next 7 Days AI Forecast) */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Continuous Network Demand Curve & LightGBM 7-Day Forecast
                  </h3>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                    P10 - P50 - P90 Model
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily aggregated retail GMV showing realized vs unmet demand, leading into automated machine learning trajectory.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="flex items-center space-x-1 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
                  <span>Realized</span>
                </span>
                <span className="flex items-center space-x-1 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded bg-rose-400 inline-block" />
                  <span>Unmet Gap</span>
                </span>
                <span className="flex items-center space-x-1 text-indigo-700">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block border border-dashed border-indigo-800" />
                  <span>AI Forecast</span>
                </span>
              </div>
            </div>

            {/* Custom SVG/Bar Time Series Chart */}
            <div className="pt-4 overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-17 gap-1.5 items-end h-44 pb-2 border-b border-slate-200">
                  {HISTORICAL_AND_PROJECTED_DEMAND.map((point, idx) => {
                    const heightPercent = Math.round((point.totalDemand / maxDemand) * 100);
                    const realizedPercent = Math.round((point.realizedGMV / point.totalDemand) * 100);
                    const unmetPercent = 100 - realizedPercent;

                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] rounded p-2 z-20 pointer-events-none whitespace-nowrap shadow-lg">
                          <div className="font-bold text-slate-200">{point.date} ({point.dayLabel})</div>
                          <div className="text-emerald-400">Realized: KES {point.realizedGMV.toLocaleString()}</div>
                          <div className="text-rose-300">Unmet Gap: KES {point.unmetGMV.toLocaleString()}</div>
                          <div className="text-slate-300 font-mono font-bold">Total: KES {point.totalDemand.toLocaleString()}</div>
                          {point.eventNote && (
                            <div className="text-amber-300 text-[9px] mt-0.5 italic">★ {point.eventNote}</div>
                          )}
                          {point.isForecast && (
                            <div className="text-indigo-300 text-[9px] mt-0.5">P10: {point.p10?.toLocaleString()} | P90: {point.p90?.toLocaleString()}</div>
                          )}
                        </div>

                        {/* Event indicator pin */}
                        {point.eventNote && (
                          <span className="text-[10px] text-amber-500 font-bold mb-0.5">★</span>
                        )}

                        {/* Bar Container */}
                        <div 
                          className={`w-full rounded-t overflow-hidden transition-all duration-300 flex flex-col justify-end ${
                            point.isForecast 
                              ? 'border-2 border-dashed border-indigo-400/80 bg-indigo-50/40' 
                              : 'bg-slate-100'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {/* Realized portion */}
                          <div 
                            className={point.isForecast ? 'bg-indigo-500/80' : 'bg-emerald-600'} 
                            style={{ height: `${realizedPercent}%` }}
                          />
                          {/* Unmet portion */}
                          <div 
                            className={point.isForecast ? 'bg-rose-400/70' : 'bg-rose-500'} 
                            style={{ height: `${unmetPercent}%` }}
                          />
                        </div>

                        {/* X-axis label */}
                        <span className={`text-[9px] mt-1.5 font-mono text-center truncate w-full ${
                          point.isForecast ? 'text-indigo-700 font-bold' : 'text-slate-500'
                        }`}>
                          {point.dayLabel.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Annotation bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 px-1">
                  <span className="text-slate-600">← Past 10 Days Historical Ground Truth</span>
                  <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Next 7 Days ML Forecast (LightGBM Inference Engine) →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dual Columns: Category Velocity Quick Matrix + Regional Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Demand Snapshot */}
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Core Category Demand Share
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveSection('categories')}
                  className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold flex items-center space-x-0.5"
                >
                  <span>Detailed View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 pt-3">
                {CATEGORY_DEMAND_BREAKDOWN.map(cat => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.category}</span>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-slate-500">KES {(cat.gmvKES / 1000000).toFixed(2)}M ({cat.sharePercent}%)</span>
                        <span className={`text-[10px] font-bold px-1.5 rounded ${
                          cat.trend === 'surging' ? 'bg-emerald-100 text-emerald-800' :
                          cat.trend === 'deficit' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {cat.trendRate}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-slate-800 h-full rounded-full" 
                        style={{ width: `${cat.sharePercent * 2.5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Corridor Snapshot */}
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Nairobi Corridor Demand Distribution
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveSection('zones')}
                  className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold flex items-center space-x-0.5"
                >
                  <span>Corridor Intel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 pt-3">
                {REGIONAL_DEMAND_ZONES.map(zone => (
                  <div key={zone.zoneId} className="p-2.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{zone.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{zone.neighborhoods}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-900">KES {(zone.monthlyGMVKES / 1000000).toFixed(2)}M</div>
                      <div className="text-[10px] text-emerald-700 font-semibold">{zone.fulfillmentRate}% Fulfilled · +{zone.growthWoW}% WoW</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CATEGORY & SKU VELOCITY */}
      {activeSection === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  FMCG Category Demand & Inventory Depletion Velocity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time analysis of staple flour, cooking oil, sugar, and beverage demand cadence across the wholesale depot network.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500">Filter Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold bg-white text-slate-800"
                >
                  <option value="all">All Categories (5 Core)</option>
                  {CATEGORY_DEMAND_BREAKDOWN.map(c => (
                    <option key={c.id} value={c.id}>{c.category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Cards Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-3">
              {filteredCategories.map(cat => (
                <div key={cat.id} className="border border-slate-200 rounded-md p-3.5 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        {cat.sharePercent}% Total Network Share
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{cat.category}</h4>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      cat.stockoutRisk === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      cat.stockoutRisk === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      cat.stockoutRisk === 'MEDIUM' ? 'bg-yellow-50 text-yellow-800' :
                      'bg-emerald-50 text-emerald-800'
                    }`}>
                      {cat.stockoutRisk} RISK
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono border-y border-slate-100 py-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">GMV Volume</span>
                      <span className="font-bold text-slate-900">KES {(cat.gmvKES / 1000000).toFixed(2)}M</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Units Consumed</span>
                      <span className="font-bold text-slate-900">{cat.units.toLocaleString()} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Fulfillment Rate</span>
                      <span className={`font-bold ${cat.fulfillmentRate < 85 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {cat.fulfillmentRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Days of Inventory</span>
                      <span className={`font-bold ${cat.daysOfInventory <= 1.5 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {cat.daysOfInventory} Days Left
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[11px] text-slate-600">
                    <span className="text-slate-400 block text-[10px]">Top Demand SKU:</span>
                    <strong className="text-slate-900">{cat.topItem}</strong>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-50 pt-1.5">
                    <span>WoW Velocity: <strong className="text-emerald-700">{cat.trendRate}</strong></span>
                    <span className="text-indigo-600 font-medium">Reorder Cadence: 3.2 days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CORRIDOR GEOGRAPHY */}
      {activeSection === 'zones' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Nairobi Urban Corridor Demand Intelligence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Micro-regional demand density, fulfillment rates, and primary wholesale depot fulfillment nodes.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>4 Active Logistics Corridors</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              {REGIONAL_DEMAND_ZONES.map(zone => (
                <div key={zone.zoneId} className="border border-slate-200 rounded-md p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{zone.name}</h4>
                        <span className="text-[10px] text-slate-500">{zone.orderSharePercent}% Total Network Orders</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +{zone.growthWoW}% WoW
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 my-2.5">
                    <strong>Coverage:</strong> {zone.neighborhoods}
                  </p>

                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded border border-slate-100 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Monthly Demand</span>
                      <strong className="text-slate-900">KES {(zone.monthlyGMVKES / 1000000).toFixed(2)}M</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Active Dukas</span>
                      <strong className="text-slate-900">{zone.activeDukas} Shops</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fulfillment SLA</span>
                      <strong className={zone.fulfillmentRate < 86 ? 'text-rose-600' : 'text-emerald-700'}>
                        {zone.fulfillmentRate}%
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Dominant Staple:</span>
                      <strong className="text-slate-900">{zone.dominantCategory}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Serving Depot:</span>
                      <strong className="text-slate-800">{zone.primaryDepot}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SUPPRESSED DEMAND & ZERO-RESULT SIGNALS */}
      {activeSection === 'suppressed' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-rose-900">
                    Suppressed & Unmet Demand Intelligence
                  </h3>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                    KES {(DEMAND_METRIC_SUMMARY.unmetDemandGMV / 1000000).toFixed(2)}M Lost Opportunity
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-frequency retail checkout dropouts and zero-result search telemetry where customer intent exceeded wholesale depot availability.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-500">
                <span>Total Gaps Logged: <strong>{suppressedSignals.length} Critical Items</strong></span>
              </div>
            </div>

            {/* Suppressed Signals Table */}
            <div className="mt-3 space-y-3">
              {suppressedSignals.map(sig => (
                <div 
                  key={sig.id} 
                  className="border border-slate-200 rounded-md p-3.5 bg-white hover:border-rose-200 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          sig.urgency === 'CRITICAL' ? 'bg-rose-600 text-white' :
                          sig.urgency === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
                        }`}>
                          {sig.urgency}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{sig.skuName}</h4>
                        <span className="text-xs text-slate-400">({sig.category})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Reason:</strong> <span className="text-rose-700 font-semibold">{sig.primaryReason}</span> · Affected Zones: {sig.affectedZones.join(', ')}
                      </p>
                    </div>

                    {/* Volume and Lost GMV */}
                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Failed Attempts</span>
                        <span className="font-bold text-slate-900">{sig.unmetAttemptsCount} Dukas</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Estimated Lost GMV</span>
                        <span className="font-bold text-rose-700">KES {sig.lostGmvKES.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="text-slate-600 italic text-[11px]">
                      💡 <strong>Recommended:</strong> {sig.suggestedAction}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {sig.status === 'OPEN_SIGNAL' && (
                        <>
                          <button
                            onClick={() => handleTriggerAction(sig.id, 'alert')}
                            className="px-2.5 py-1 bg-slate-900 text-white font-medium rounded hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                          >
                            Alert Wholesaler Depot
                          </button>
                          <button
                            onClick={() => handleTriggerAction(sig.id, 'schedule')}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 transition-colors cursor-pointer text-xs"
                          >
                            Schedule Inbound Consignment
                          </button>
                        </>
                      )}
                      {sig.status === 'SUPPLIER_ALERTED' && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200 text-xs flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Supplier Alert Dispatched</span>
                        </span>
                      )}
                      {sig.status === 'RESTOCK_SCHEDULED' && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 text-xs flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Consignment Scheduled</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: ML PREDICTIVE FORECAST & WHAT-IF SIMULATOR */}
      {activeSection === 'forecast_simulator' && (
        <div className="space-y-4">
          {/* Machine Learning Model Header */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {ML_DEMAND_MODEL_INSIGHT.modelName} ({ML_DEMAND_MODEL_INSIGHT.version})
                    </h3>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                      {100 - ML_DEMAND_MODEL_INSIGHT.mapeScore}% Accuracy (MAPE: {ML_DEMAND_MODEL_INSIGHT.mapeScore}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trained on 250,000+ FMCG duka transactions across Nairobi East, West, and Central nodes.
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-500">
                <span>Last Updated: {ML_DEMAND_MODEL_INSIGHT.lastTrained}</span>
              </div>
            </div>

            {/* Model Feature Weights */}
            <div className="mt-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Top Predictive Feature Weights (Permutation Importance)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs font-mono">
                {ML_DEMAND_MODEL_INSIGHT.features.map((feat, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{(feat.importanceWeight * 100).toFixed(0)}% Weight</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-1 line-clamp-1">{feat.name}</div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{feat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive What-If Scenario Simulator */}
          <div className="bg-white border border-indigo-200 rounded-md p-4 shadow-2xs">
            <div className="flex items-center space-x-2 pb-3 border-b border-indigo-100">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Interactive FMCG Demand Scenario Simulator
              </h3>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                Dynamic Monte Carlo Model
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
              {/* Controls Column */}
              <div className="lg:col-span-6 space-y-4">
                {/* 1. Fuel & Logistics Surcharge Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Fuel & Transport Surcharge Shift</span>
                    <span className="font-mono font-bold text-slate-900">
                      {simFuelSurcharge > 0 ? `+${simFuelSurcharge}%` : `${simFuelSurcharge}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="20"
                    step="2"
                    value={simFuelSurcharge}
                    onChange={(e) => setSimFuelSurcharge(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>-10% (Subsidy)</span>
                    <span>0% (Baseline)</span>
                    <span>+20% (Spike)</span>
                  </div>
                </div>

                {/* 2. Wholesale Depot Inventory Injection */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Depot Staple Buffer Injection (Bales/Cartons)</span>
                    <span className="font-mono font-bold text-slate-900">+{simInventoryInjection} Bales</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="100"
                    value={simInventoryInjection}
                    onChange={(e) => setSimInventoryInjection(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>0 Bales</span>
                    <span>+1,000 Bales</span>
                    <span>+2,000 Bales</span>
                  </div>
                </div>

                {/* 3. Promotional Flash Discount */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">Flash Retail Restock Discount</span>
                    <span className="font-mono font-bold text-slate-900">{simPromoDiscount}% Off</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={simPromoDiscount}
                    onChange={(e) => setSimPromoDiscount(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>0% (No Promo)</span>
                    <span>7%</span>
                    <span>15% (Aggressive)</span>
                  </div>
                </div>

                {/* 4. Weather / Rain Disruption */}
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Weather Logistics Disruption Factor
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimWeatherSeverity('none')}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                        simWeatherSeverity === 'none'
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ☀️ Clear Weather
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimWeatherSeverity('moderate')}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                        simWeatherSeverity === 'moderate'
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🌧️ Moderate Rains
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimWeatherSeverity('severe')}
                      className={`py-1.5 text-xs font-medium rounded border transition-colors ${
                        simWeatherSeverity === 'severe'
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⛈️ Heavy Downpour
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulated Projections Column */}
              <div className="lg:col-span-6 bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Simulated 30-Day Outcomes
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      Lift: {simulationResults.netDemandLiftPercent > 0 ? `+${simulationResults.netDemandLiftPercent}%` : `${simulationResults.netDemandLiftPercent}%`}
                    </span>
                  </div>

                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Projected Total Demand:</span>
                      <strong className="font-mono text-slate-900 text-sm">
                        KES {(simulationResults.projectedGMV / 1000000).toFixed(2)}M
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Projected Realized GMV:</span>
                      <strong className="font-mono text-emerald-700 text-sm">
                        KES {(simulationResults.projectedRealizedGMV / 1000000).toFixed(2)}M
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Unmet Demand Deficit:</span>
                      <strong className="font-mono text-rose-600 text-sm">
                        KES {(simulationResults.projectedUnmetGMV / 1000000).toFixed(2)}M
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Projected Network Fulfillment:</span>
                      <strong className="font-mono text-indigo-800 text-sm">
                        {simulationResults.projectedFulfillmentRate}%
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
                      <span className="text-slate-600">Required Fleet Boda-Boda Capacity:</span>
                      <strong className="font-mono text-slate-900">
                        +{simulationResults.additionalBodaTrips} Courier Trips / Day
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2.5 bg-white rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Machine Learning Summary</span>
                  </div>
                  <p>
                    {simPromoDiscount > 0 
                      ? `A ${simPromoDiscount}% promo discount drives high duka conversion, but requires an extra ${simulationResults.additionalBodaTrips} courier trips per day to meet delivery SLAs.` 
                      : 'Baseline demand remains stable. Consider scheduling inventory injections to lower unmet deficit.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
