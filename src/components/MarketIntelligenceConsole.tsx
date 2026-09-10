import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Radio, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Play, 
  Pause, 
  ArrowRight, 
  Scale, 
  DollarSign, 
  MapPin, 
  ShoppingBag, 
  Building, 
  Zap, 
  ShieldAlert, 
  ChevronRight, 
  Filter, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  MarketIntelligenceSnapshot, 
  PipelineStageId, 
  MarketEventType, 
  WholesalePriceDispersion, 
  ZoneLiquidityMetric,
  MarketAnomalyAlert
} from '../types/marketIntelligence';
import { marketIntelligenceEngine } from '../services/marketIntelligenceEngine';

type SubView = 'pipeline' | 'pricing' | 'liquidity' | 'brands' | 'inflation' | 'anomalies';

export const MarketIntelligenceConsole: React.FC = () => {
  const [snapshot, setSnapshot] = useState<MarketIntelligenceSnapshot>(() => marketIntelligenceEngine.getSnapshot());
  const [events, setEvents] = useState(() => marketIntelligenceEngine.getEventsStream());
  const [isStreaming, setIsStreaming] = useState(() => marketIntelligenceEngine.isLiveStreaming());
  const [activeView, setActiveView] = useState<SubView>('pipeline');
  const [selectedStageId, setSelectedStageId] = useState<PipelineStageId>('STREAM_INGESTION');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [copiedExport, setCopiedExport] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Subscribe to real-time engine telemetry
  useEffect(() => {
    const unsubscribe = marketIntelligenceEngine.subscribe(() => {
      setSnapshot(marketIntelligenceEngine.getSnapshot());
      setEvents(marketIntelligenceEngine.getEventsStream());
      setIsStreaming(marketIntelligenceEngine.isLiveStreaming());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleStreaming = () => {
    const nextState = marketIntelligenceEngine.toggleStreaming();
    setIsStreaming(nextState);
  };

  const handleSimulateOne = () => {
    marketIntelligenceEngine.simulateNextEvent();
  };

  const handleResolveAnomaly = (anomaly: MarketAnomalyAlert) => {
    setResolvingId(anomaly.id);
    setTimeout(() => {
      marketIntelligenceEngine.resolveAnomaly(anomaly.id);
      setResolvingId(null);
    }, 400);
  };

  const handleCopyExport = () => {
    const text = marketIntelligenceEngine.exportIntelligenceFeed(exportFormat);
    navigator.clipboard.writeText(text);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const selectedStage = snapshot.stages.find((s) => s.id === selectedStageId) || snapshot.stages[0];

  const filteredEvents = selectedEventType === 'ALL' 
    ? events 
    : events.filter((e) => e.type === selectedEventType);

  const activeAnomaliesCount = snapshot.recentAnomalies.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Primary Telemetry Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Aggregated Market Intelligence Pipeline
              </h1>
              <span className="flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isStreaming ? 'LIVE AGGREGATION STREAMING' : 'STREAM PAUSED'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              End-to-end continuous ingestion, Sheng & master catalog normalization, sliding-window spatial rollups, LightGBM demand forecasts, and automated action syndication across Kenyan FMCG distribution.
            </p>
          </div>

          {/* Controls: Stream Toggle, Manual Pulse, Export */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleToggleStreaming}
              className={`text-xs px-3 py-1.5 rounded font-semibold flex items-center space-x-1.5 border transition-colors cursor-pointer ${
                isStreaming 
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            <button
              onClick={handleSimulateOne}
              className="text-xs px-3 py-1.5 rounded font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Pulse Ingest</span>
            </button>

            <button
              onClick={() => setExportModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Feed</span>
            </button>
          </div>
        </div>

        {/* Global Pipeline Health Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Ingestion Rate</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 flex items-baseline space-x-1">
              <span>{snapshot.liveEventsPerSec.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 font-normal">ev/s</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Pipeline E2E Latency</div>
            <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5 flex items-baseline space-x-1">
              <span>{snapshot.avgPipelineLatencyMs}</span>
              <span className="text-[10px] text-slate-500 font-normal">ms (P95)</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Events Processed (24h)</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
              {(snapshot.totalEventsProcessed24h / 1000000).toFixed(2)}M
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Active Micro-Zones</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 flex items-baseline space-x-1">
              <span>{snapshot.zoneLiquidity.length}</span>
              <span className="text-[10px] text-slate-500 font-normal">Nairobi hubs</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Disruption Anomalies</div>
            <div className={`text-sm font-bold font-mono mt-0.5 flex items-baseline space-x-1 ${
              activeAnomaliesCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              <span>{activeAnomaliesCount}</span>
              <span className="text-[10px] text-slate-500 font-normal">active alerts</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Syndication Subscribers</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 flex items-baseline space-x-1">
              <span>{snapshot.syndicatedSubscribersCount}</span>
              <span className="text-[10px] text-slate-500 font-normal">depots & brands</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-1.5 overflow-x-auto text-xs font-medium shadow-2xs">
        <button
          onClick={() => setActiveView('pipeline')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'pipeline'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Pipeline Topology & Live Stream</span>
          <span className="bg-emerald-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveView('pricing')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'pricing'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span>Wholesale Price Dispersion</span>
          <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {snapshot.priceDispersion.length} SKUs
          </span>
        </button>

        <button
          onClick={() => setActiveView('liquidity')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'liquidity'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zone Liquidity Matrix</span>
          <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            {snapshot.zoneLiquidity.length} Zones
          </span>
        </button>

        <button
          onClick={() => setActiveView('brands')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'brands'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-rose-400" />
          <span>Brand Market Shares</span>
          <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            4 Categories
          </span>
        </button>

        <button
          onClick={() => setActiveView('inflation')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'inflation'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-cyan-400" />
          <span>FMCG Essential Basket Index</span>
          <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
            6 Months
          </span>
        </button>

        <button
          onClick={() => setActiveView('anomalies')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'anomalies'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Anomalies & Actions</span>
          {activeAnomaliesCount > 0 && (
            <span className="bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              {activeAnomaliesCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. VIEW: Pipeline Topology & Live Stream */}
      {activeView === 'pipeline' && (
        <div className="space-y-6">
          {/* Interactive 5-Stage Architecture Topology Map */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Continuous Aggregation Pipeline Architecture (5 Stages)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Select a stage to inspect operational specs, queue health, worker allocations, and throughput.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                End-to-End Latency: {snapshot.avgPipelineLatencyMs}ms
              </span>
            </div>

            {/* Stage Cards Flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4">
              {snapshot.stages.map((stage, idx) => {
                const isSelected = stage.id === selectedStageId;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`text-left p-3 rounded-lg border transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-700'
                      }`}>
                        Stage 0{stage.stepNumber}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>

                    <h3 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {stage.name}
                    </h3>
                    
                    <p className={`text-[10px] line-clamp-2 mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {stage.description}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px] font-mono">
                      <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                        {stage.throughputPerSec} ev/s
                      </span>
                      <span className={isSelected ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}>
                        {stage.latencyMs}ms
                      </span>
                    </div>

                    {/* Step indicator arrow for desktop */}
                    {idx < 4 && (
                      <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Stage Detail Inspector */}
            <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Stage {selectedStage.stepNumber}: {selectedStage.name}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                    {selectedStage.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-600">
                  Tech Stack: <strong className="text-slate-900">{selectedStage.techStack}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white border border-slate-200 rounded p-2">
                  <div className="text-[10px] text-slate-500">Active Compute Workers</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {selectedStage.activeWorkers} Nodes
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-2">
                  <div className="text-[10px] text-slate-500">Queue Buffer Depth</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {selectedStage.queueDepth} pkts
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-2">
                  <div className="text-[10px] text-slate-500">24h Throughput Volume</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {(selectedStage.processed24h / 1000).toFixed(1)}k ops
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded p-2">
                  <div className="text-[10px] text-slate-500">Drop / Error Rate</div>
                  <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                    {selectedStage.errorRatePercent}%
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Core Stage Sub-Routines & Handlers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedStage.keyFunctions.map((fn, i) => (
                    <div key={i} className="flex items-center space-x-1.5 text-[11px] text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{fn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Streaming Event Visualizer Feed */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Event Stream Telemetry (Recent 40 Signals)
                </h2>
              </div>

              {/* Event Type Filter */}
              <div className="flex items-center space-x-1 text-xs">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700"
                >
                  <option value="ALL">All Event Types</option>
                  <option value="DUKA_SEARCH_QUERY">Duka Search Queries</option>
                  <option value="CHECKOUT_ORDER">Checkout Transactions</option>
                  <option value="DEPOT_STOCK_SYNC">Depot Stock Deltas</option>
                  <option value="SPOT_PRICE_PING">Spot Price Pings</option>
                  <option value="RIDER_CORRIDOR_METRIC">Rider Logistics</option>
                </select>
              </div>
            </div>

            {/* Scrollable Event Stream Table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Source & Location</th>
                    <th className="py-2 px-3">Routing Stage</th>
                    <th className="py-2 px-3">Payload Summary</th>
                    <th className="py-2 px-3 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredEvents.map((evt) => {
                    return (
                      <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                          {evt.timestamp}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            evt.type === 'DUKA_SEARCH_QUERY' ? 'bg-indigo-50 text-indigo-700' :
                            evt.type === 'CHECKOUT_ORDER' ? 'bg-emerald-50 text-emerald-700' :
                            evt.type === 'DEPOT_STOCK_SYNC' ? 'bg-amber-50 text-amber-700' :
                            evt.type === 'SPOT_PRICE_PING' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {evt.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-sans">
                          <div className="font-semibold text-slate-900 text-xs truncate max-w-xs">{evt.source}</div>
                          <div className="text-[10px] text-slate-500">{evt.zone}</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
                            {evt.pipelineStage}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-700 text-xs">
                          {evt.type === 'DUKA_SEARCH_QUERY' && (
                            <span>Query: <strong className="text-slate-900">"{evt.payload.query}"</strong> · Results: {evt.payload.resultsCount}</span>
                          )}
                          {evt.type === 'CHECKOUT_ORDER' && (
                            <span>Order #{evt.payload.orderId} · KES {evt.payload.totalKES?.toLocaleString()} · {evt.payload.itemCount} items ({evt.payload.paymentMethod})</span>
                          )}
                          {evt.type === 'DEPOT_STOCK_SYNC' && (
                            <span>Stock delta: <strong className="text-amber-700 font-mono">{evt.payload.delta}</strong> · Buffer: {evt.payload.bufferHoursRemaining}h</span>
                          )}
                          {evt.type === 'SPOT_PRICE_PING' && (
                            <span>Spot: <strong className="text-rose-700 font-mono">KES {evt.payload.spotPriceKES}</strong> (RRP: KES {evt.payload.rrpKES})</span>
                          )}
                          {evt.type === 'RIDER_CORRIDOR_METRIC' && (
                            <span>Route: {evt.payload.route} · {evt.payload.transitMins} mins · {evt.payload.cargoWeightKg}kg cargo</span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-right font-mono text-emerald-700">
                          {evt.latencyMs}ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW: Wholesale Price Dispersion */}
      {activeView === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cross-Depot Wholesale Price Dispersion & Arbitrage Matrix
                </h2>
                <p className="text-[11px] text-slate-500">
                  Monitors real-time wholesale pricing variance across Nairobi hubs to identify margin compression, regional price gouging, and arbitrage opportunities.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                Max Allowed Spread: 7.0%
              </span>
            </div>

            {/* Price Dispersion SKU Cards */}
            <div className="mt-4 space-y-4">
              {snapshot.priceDispersion.map((item) => {
                const spreadPercent = item.spreadPercent;
                const isHighSpread = spreadPercent >= 6.0;

                return (
                  <div key={item.skuId} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
                    {/* SKU Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">{item.skuName}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-mono">
                            {item.packSize}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            item.arbitrageRisk === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                            item.arbitrageRisk === 'MODERATE' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.arbitrageRisk} Arbitrage Risk
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Category: {item.category} · Manufacturer RRP: <span className="font-mono text-slate-700">KES {item.manufacturerRRP.toLocaleString()}</span> · Elasticity: <strong className="text-slate-800">{item.priceElasticity}</strong>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">Avg Wholesale</div>
                          <div className="font-mono font-bold text-slate-900">KES {item.avgWholesalePrice.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">Cross-Depot Spread</div>
                          <div className={`font-mono font-bold flex items-center space-x-1 ${
                            isHighSpread ? 'text-rose-600' : 'text-slate-900'
                          }`}>
                            <span>KES {item.spreadKES}</span>
                            <span className="text-[10px]">({item.spreadPercent}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Depot Prices Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                      {item.depotPrices.map((dp) => (
                        <div 
                          key={dp.depotId} 
                          className={`p-2.5 rounded border text-xs bg-white ${
                            dp.price === item.minWholesalePrice ? 'border-emerald-300 ring-1 ring-emerald-300/40' :
                            dp.price === item.maxWholesalePrice ? 'border-amber-300' :
                            'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs truncate max-w-[130px]">{dp.depotName}</span>
                            {dp.price === item.minWholesalePrice && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.2 rounded">
                                Lowest
                              </span>
                            )}
                            {dp.price === item.maxWholesalePrice && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 py-0.2 rounded">
                                Highest
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-slate-500 truncate">{dp.zone}</div>

                          <div className="mt-2 flex items-baseline justify-between">
                            <div className="font-mono font-bold text-slate-900 text-sm">
                              KES {dp.price.toLocaleString()}
                            </div>
                            <span className={`text-[10px] font-semibold px-1 py-0.2 rounded ${
                              dp.stockStatus === 'IN_STOCK' ? 'text-emerald-700 bg-emerald-50' :
                              dp.stockStatus === 'LOW_STOCK' ? 'text-amber-700 bg-amber-50' :
                              'text-rose-700 bg-rose-50'
                            }`}>
                              {dp.stockStatus.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>MOQ: {dp.minOrderQty} pkts</span>
                            <span>{dp.lastUpdated}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW: Zone Liquidity Matrix */}
      {activeView === 'liquidity' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Nairobi Urban Zone Liquidity & Supply-Demand Deficit Matrix
                </h2>
                <p className="text-[11px] text-slate-500">
                  Aggregates duka density, daily GMV velocity, fulfillment completion rates, and depot buffer hours by commercial sector.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Commercial Sector</th>
                    <th className="py-2.5 px-3">Active Dukas</th>
                    <th className="py-2.5 px-3">Daily GMV</th>
                    <th className="py-2.5 px-3">Fulfillment</th>
                    <th className="py-2.5 px-3">Depot Buffer</th>
                    <th className="py-2.5 px-3">Liquidity Status</th>
                    <th className="py-2.5 px-3">Unmet Demand</th>
                    <th className="py-2.5 px-3">Top Moving SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {snapshot.zoneLiquidity.map((z) => (
                    <tr key={z.zoneId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div>{z.zoneName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {z.primaryDepots.join(' · ')}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {z.activeDukas} shops
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        KES {z.dailyGMVKES.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`font-bold ${
                          z.fulfillmentRate >= 90 ? 'text-emerald-700' :
                          z.fulfillmentRate >= 80 ? 'text-amber-700' :
                          'text-rose-700'
                        }`}>
                          {z.fulfillmentRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          z.supplyBufferHours >= 24 ? 'bg-emerald-100 text-emerald-800' :
                          z.supplyBufferHours >= 10 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800 animate-pulse'
                        }`}>
                          {z.supplyBufferHours} hrs
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          z.liquidityStatus === 'SURPLUS' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          z.liquidityStatus === 'BALANCED' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                          z.liquidityStatus === 'TIGHT' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                        }`}>
                          {z.liquidityStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-600">
                        KES {z.unmetDemandKES.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-700 text-[11px]">
                        {z.topMovingSKU}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW: Brand Market Shares */}
      {activeView === 'brands' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  FMCG Brand Market Share & Competitive Intelligence
                </h2>
                <p className="text-[11px] text-slate-500">
                  Tracks brand volume share, monthly GMV capture, and duka penetration across Nairobi's core commodity categories.
                </p>
              </div>
            </div>

            {/* Category Brand Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
              {snapshot.brandShares.map((cat) => (
                <div key={cat.category} className="border border-slate-200 rounded-lg p-4 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{cat.category}</h3>
                      <p className="text-[10px] text-slate-500">
                        Total Category GMV: <strong className="font-mono text-slate-800">KES {(cat.totalCategoryMonthlyGMVKES / 1000000).toFixed(1)}M/mo</strong>
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                      Tension Index: {cat.competitiveTensionIndex}/100
                    </span>
                  </div>

                  {/* Brand Breakdown Bar */}
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200">
                    {cat.brands.map((b, i) => (
                      <div
                        key={b.brandName}
                        style={{ width: `${b.sharePercent}%` }}
                        className={`h-full ${
                          i === 0 ? 'bg-slate-900' :
                          i === 1 ? 'bg-indigo-600' :
                          i === 2 ? 'bg-emerald-600' :
                          'bg-amber-500'
                        }`}
                        title={`${b.brandName}: ${b.sharePercent}%`}
                      />
                    ))}
                  </div>

                  {/* Brand Table */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    {cat.brands.map((b) => (
                      <div key={b.brandName} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                            <span>{b.brandName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({b.manufacturer})</span>
                            {b.rebateActive && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded font-mono">
                                Trade Rebate Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Duka Penetration: {b.penetrationDukasPercent}% · GMV: KES {(b.monthlyGMVKES / 1000000).toFixed(2)}M
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-bold text-slate-900 text-xs">{b.sharePercent}%</div>
                          <div className={`text-[10px] flex items-center justify-end space-x-0.5 ${
                            b.changeWoW >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {b.changeWoW >= 0 ? '+' : ''}{b.changeWoW}% WoW
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW: FMCG Essential Duka Basket Index */}
      {activeView === 'inflation' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  WAYNO Essential Food Basket Index (Nairobi Duka Benchmark)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Tracks wholesale price inflation of a standardized staple food bundle (Maize Meal, Cooking Oil, Sugar, Flour, Laundry Soap).
                </p>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Current Basket: KES 17,625 (+0.8% MoM)
              </span>
            </div>

            {/* 6-Month Inflation Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {snapshot.basketIndex.map((point) => (
                <div 
                  key={point.month} 
                  className={`p-3 rounded-lg border text-xs ${
                    point.month.includes('Current')
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`text-[10px] font-mono ${
                    point.month.includes('Current') ? 'text-emerald-400 font-bold' : 'text-slate-500'
                  }`}>
                    {point.month}
                  </div>
                  <div className={`text-sm font-bold font-mono mt-1 ${
                    point.month.includes('Current') ? 'text-white' : 'text-slate-900'
                  }`}>
                    KES {point.basketCostKES.toLocaleString()}
                  </div>
                  <div className={`text-[10px] font-semibold mt-1 flex items-center space-x-1 ${
                    point.month.includes('Current')
                      ? 'text-emerald-400'
                      : point.inflationMoMPercent > 1.5 ? 'text-rose-600' : 'text-slate-600'
                  }`}>
                    <span>{point.inflationMoMPercent >= 0 ? '+' : ''}{point.inflationMoMPercent}% MoM</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Basket Itemized Composition Table */}
            <div className="mt-5">
              <h3 className="text-xs font-bold text-slate-900 mb-2">
                Standard Duka Procurement Bundle Composition (September 2026)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-2 px-3">Commodity Item</th>
                      <th className="py-2 px-3">Wholesale Unit</th>
                      <th className="py-2 px-3">Basket Weight</th>
                      <th className="py-2 px-3">Current Price</th>
                      <th className="py-2 px-3">Last Month</th>
                      <th className="py-2 px-3 text-right">MoM Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono">
                    {snapshot.basketIndex[snapshot.basketIndex.length - 1].itemsBreakdown.map((item) => (
                      <tr key={item.name} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-sans">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.weightPercent}%
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          KES {item.currentPriceKES.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          KES {item.lastMonthPriceKES.toLocaleString()}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${
                          item.priceChangePercent > 0 ? 'text-rose-600' :
                          item.priceChangePercent < 0 ? 'text-emerald-600' :
                          'text-slate-600'
                        }`}>
                          {item.priceChangePercent >= 0 ? '+' : ''}{item.priceChangePercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. VIEW: Anomalies & Automated Actions */}
      {activeView === 'anomalies' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Algorithmic Market Anomaly Detection & Action Dispatch
                </h2>
                <p className="text-[11px] text-slate-500">
                  Isolation Forest ML models detecting stockout vulnerabilities, price collusion, and competitive share loss with single-click mitigation routing.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold">
                {activeAnomaliesCount} Actionable Dispatches
              </span>
            </div>

            {/* Anomaly Cards List */}
            <div className="mt-4 space-y-4">
              {snapshot.recentAnomalies.map((anom) => {
                const isResolved = anom.status === 'RESOLVED';
                const isResolving = resolvingId === anom.id;

                return (
                  <div 
                    key={anom.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      isResolved 
                        ? 'bg-slate-50 border-slate-200 opacity-75' 
                        : anom.severity === 'CRITICAL' 
                          ? 'bg-rose-50/30 border-rose-200 shadow-2xs' 
                          : 'bg-amber-50/30 border-amber-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            isResolved ? 'bg-emerald-100 text-emerald-800' :
                            anom.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                            'bg-amber-600 text-white'
                          }`}>
                            {isResolved ? 'RESOLVED & MITIGATED' : anom.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{anom.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({anom.timestamp})</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                          {anom.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1">
                          <span>Target Zone: <strong className="text-slate-900">{anom.affectedZone}</strong></span>
                          <span>SKU: <strong className="text-slate-900">{anom.affectedSKU}</strong></span>
                          <span className="font-mono text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-semibold">
                            {anom.metricDeviation}
                          </span>
                        </div>
                      </div>

                      {/* Action Dispatch Button */}
                      <div className="shrink-0 self-end sm:self-center">
                        {isResolved ? (
                          <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Action Dispatched</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleResolveAnomaly(anom)}
                            disabled={isResolving}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isResolving ? 'Dispatching...' : anom.automatedAction.label}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Action Execution Description */}
                    {!isResolved && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-start space-x-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>Automated routing target: <strong className="text-slate-700">{anom.automatedAction.targetService}</strong> — {anom.automatedAction.description}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 9. Export Feed Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Export Aggregated Market Intelligence Feed
                </h3>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Download or syndicate live multi-factor aggregated market intelligence for enterprise FMCG brand partners, wholesale depots, and banking partners.
            </p>

            {/* Format Selector */}
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <button
                onClick={() => setExportFormat('json')}
                className={`px-3 py-1.5 rounded cursor-pointer ${
                  exportFormat === 'json'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                JSON API Payload
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`px-3 py-1.5 rounded cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                CSV Tabular Report
              </button>
            </div>

            {/* Preview Box */}
            <div className="bg-slate-950 text-slate-100 rounded p-3 font-mono text-[10px] max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {marketIntelligenceEngine.exportIntelligenceFeed(exportFormat).slice(0, 1200)}...
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-xs px-3 py-1.5 rounded text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleCopyExport}
                className="text-xs px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedExport ? 'Copied to Clipboard' : 'Copy Full Feed'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
