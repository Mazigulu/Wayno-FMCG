import React, { useState, useMemo } from 'react';
import {
  Network,
  GitFork,
  Compass,
  Route,
  Truck,
  Database,
  BrainCircuit,
  ArrowUpRight,
  Check,
  X,
  Copy,
  ChevronRight,
  ShieldCheck,
  Bike,
  AlertCircle,
  Building2,
  Store,
  Fuel,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  geoEngine,
  supplyEngine,
  routingEngine,
  optimizationEngine,
  procurementIntelligence,
  POSTGIS_SERVICE_ZONE_SCHEMA,
  SUPPLY_NODES,
} from '../../services/hierarchicalGeofenceEngine';
import { VehicleRoutingStop, SupplyNode } from '../../types/wayno';
import { SupplyNodeTreeVisualizer } from './SupplyNodeTreeVisualizer';

type LabTab =
  | 'HIERARCHY_TREE'
  | 'PROCUREMENT_SIM'
  | 'ROUTING_VRP'
  | 'RIDER_MANDATE'
  | 'POSTGIS_SQL'
  | 'ML_INTELLIGENCE';

export const HierarchicalSupplyNetworkLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabTab>('HIERARCHY_TREE');

  // --- TAB 1: TREE TOPOLOGY SELECTION ---
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_eastleigh_20km');
  const selectedNode = useMemo(() => {
    return geoEngine.getNodeById(selectedNodeId) || SUPPLY_NODES[3];
  }, [selectedNodeId]);

  const ancestorPath = useMemo(() => {
    return geoEngine.getAncestorHierarchy(selectedNode.id);
  }, [selectedNode]);

  // --- TAB 2: LOCAL-FIRST PROCUREMENT SIMULATOR ---
  const sampleShops = useMemo(
    () => [
      {
        id: 'shop_01',
        name: 'Mama Sarah Provision Duka',
        location: 'Kariobangi South Commercial Area',
        lat: -1.2585,
        lng: 36.8834,
      },
      {
        id: 'shop_02',
        name: 'Baraka Mini Mart',
        location: 'Kawangware Stage 2, Gitanga Rd',
        lat: -1.2912,
        lng: 36.7451,
      },
      {
        id: 'shop_03',
        name: 'Zawadi Wholesome Kiosk',
        location: 'Industrial Area, Enterprise Road',
        lat: -1.3120,
        lng: 36.8480,
      },
      {
        id: 'shop_04',
        name: 'Western Jirani Super Grocery',
        location: 'Bungoma Town, Kanduyi Corridor',
        lat: 0.5696,
        lng: 34.5584,
      },
    ],
    []
  );

  const [simShopId, setSimShopId] = useState<string>('shop_01');
  const [simProduct, setSimProduct] = useState<string>('Jogoo Maize Meal 2kg x 12 (10 Bales)');
  const [simQty, setSimQty] = useState<number>(10);
  const [simLocalStock, setSimLocalStock] = useState<boolean>(false);
  const [simParentStock, setSimParentStock] = useState<boolean>(true);
  const [simEscapeStock, setSimEscapeStock] = useState<boolean>(true);

  const activeShopObj = useMemo(() => {
    return sampleShops.find((s) => s.id === simShopId) || sampleShops[0];
  }, [sampleShops, simShopId]);

  const procurementResolution = useMemo(() => {
    return supplyEngine.executeHierarchicalProcurement({
      shopId: activeShopObj.id,
      shopName: activeShopObj.name,
      shopCoordinates: { lat: activeShopObj.lat, lng: activeShopObj.lng },
      productId: 'prod_jogoo',
      productName: simProduct,
      requestedQty: simQty,
      mockLocalStockAvailable: simLocalStock,
      mockParentStockAvailable: simParentStock,
      mockNearbyEscapeStockAvailable: simEscapeStock,
    });
  }, [activeShopObj, simProduct, simQty, simLocalStock, simParentStock, simEscapeStock]);

  // --- TAB 3: VRP MULTI-DROP ROUTING SIMULATOR ---
  const defaultVrpStops: VehicleRoutingStop[] = useMemo(
    () => [
      {
        id: 'v1',
        shopName: 'Mama Sarah Duka (Kariobangi South)',
        latitude: -1.2585,
        longitude: 36.8834,
        cargoWeightKg: 40,
        priority: 'HIGH',
        timeWindow: '08:00 - 09:30',
      },
      {
        id: 'v2',
        shopName: 'Starehe Kiosk (Pangani Barrier)',
        latitude: -1.2680,
        longitude: 36.8390,
        cargoWeightKg: 25,
        priority: 'NORMAL',
        timeWindow: '09:00 - 10:30',
      },
      {
        id: 'v3',
        shopName: 'Baraka Mart (Kawangware Stage 2)',
        latitude: -1.2912,
        longitude: 36.7451,
        cargoWeightKg: 50,
        priority: 'NORMAL',
        timeWindow: '09:30 - 11:00',
      },
      {
        id: 'v4',
        shopName: 'Zawadi Kiosk (Donholm Phase 5)',
        latitude: -1.2980,
        longitude: 36.8920,
        cargoWeightKg: 30,
        priority: 'HIGH',
        timeWindow: '08:30 - 10:00',
      },
      {
        id: 'v5',
        shopName: 'Amani Corner Duka (Eastleigh Sec 3)',
        latitude: -1.2720,
        longitude: 36.8580,
        cargoWeightKg: 20,
        priority: 'NORMAL',
        timeWindow: '08:00 - 09:00',
      },
    ],
    []
  );

  const vrpDepot = useMemo(
    () => ({
      name: 'Eastleigh Mega Wholesale Depot (Somlink Ltd)',
      lat: -1.2750,
      lng: 36.8510,
    }),
    []
  );

  const vrpComparison = useMemo(() => {
    return routingEngine.optimizeMultiDropTour(vrpDepot, defaultVrpStops);
  }, [vrpDepot, defaultVrpStops]);

  // --- TAB 4: RIDER 20 KM MANDATE & OUT-OF-ZONE EXCEPTIONS ---
  const [mandateDistance, setMandateDistance] = useState<number>(24.8);
  const [mandateWeight, setMandateWeight] = useState<number>(35);

  const mandateEvaluation = useMemo(() => {
    const straightLine = parseFloat((mandateDistance / 1.38).toFixed(1));
    return optimizationEngine.evaluateRiderMandate(mandateDistance, straightLine, mandateWeight);
  }, [mandateDistance, mandateWeight]);

  // --- TAB 5: POSTGIS SCHEMA COPY ---
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTGIS_SERVICE_ZONE_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // --- TAB 6: ML TELEMETRY ---
  const telemetryInsights = useMemo(() => {
    return procurementIntelligence.getTelemetryInsights();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/30">
              Macro Geofencing & Supply Hierarchy
            </span>
            <span className="text-slate-400 text-xs font-mono">Tree Architecture + 4 Engines</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Hierarchical Geographic Supply Network & 20 km Node Lab
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            20 km wholesaler territories as fundamental WAYNO nodes, tree-based local-first procurement with upward escalation, secondary cross-node escape routing, and decoupled vehicle routing (VRP).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Node Architecture</div>
            <div className="text-xs font-mono font-bold text-emerald-400">Tree (parent_zone_id)</div>
          </div>
        </div>
      </div>

      {/* Engine Separation Badge Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-800 text-white text-xs border-b border-slate-700">
        <div className="p-2.5 border-r border-slate-700/60 flex items-center space-x-2">
          <Compass className="w-4 h-4 text-sky-400 shrink-0" />
          <div>
            <div className="text-[10px] font-bold text-sky-300 uppercase">1. Geo Engine</div>
            <div className="text-[11px] text-slate-300 truncate">Where? (20km radius vs road)</div>
          </div>
        </div>
        <div className="p-2.5 border-r border-slate-700/60 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] font-bold text-emerald-300 uppercase">2. Supply Engine</div>
            <div className="text-[11px] text-slate-300 truncate">Who has it? (Local-first & tree)</div>
          </div>
        </div>
        <div className="p-2.5 border-r border-slate-700/60 flex items-center space-x-2">
          <Route className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] font-bold text-amber-300 uppercase">3. Routing Engine</div>
            <div className="text-[11px] text-slate-300 truncate">How to deliver? (VRP multi-drop)</div>
          </div>
        </div>
        <div className="p-2.5 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <div className="text-[10px] font-bold text-rose-300 uppercase">4. Optimization Engine</div>
            <div className="text-[11px] text-slate-300 truncate">Feasibility & 20km Mandate</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('HIERARCHY_TREE')}
          className={`px-4 py-2.5 font-medium whitespace-nowrap flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'HIERARCHY_TREE'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Supply Tree Topology</span>
        </button>

        <button
          onClick={() => setActiveTab('PROCUREMENT_SIM')}
          className={`px-4 py-2.5 font-medium whitespace-nowrap flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'PROCUREMENT_SIM'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Local-First Sourcing & Escalation</span>
        </button>

        <button
          onClick={() => setActiveTab('ROUTING_VRP')}
          className={`px-4 py-2.5 font-medium whitespace-nowrap flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'ROUTING_VRP'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>Vehicle Routing Problem (VRP)</span>
        </button>

        <button
          onClick={() => setActiveTab('RIDER_MANDATE')}
          className={`px-4 py-2.5 font-medium whitespace-nowrap flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'RIDER_MANDATE'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Rider 20 km Mandate & Exceptions</span>
        </button>

        <button
          onClick={() => setActiveTab('POSTGIS_SQL')}
          className={`px-4 py-2.5 font-medium whitespace-nowrap flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'POSTGIS_SQL'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>PostGIS Schema & Recursive CTE</span>
        </button>

        <button
          onClick={() => setActiveTab('ML_INTELLIGENCE')}
          className={`px-4 py-2.5 font-medium whitespace-nowrap flex items-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'ML_INTELLIGENCE'
              ? 'border-emerald-600 text-emerald-700 bg-white font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Procurement ML Telemetry</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* ================================================================= */}
        {/* TAB 1: SUPPLY TREE TOPOLOGY */}
        {/* ================================================================= */}
        {activeTab === 'HIERARCHY_TREE' && (
          <div className="space-y-6">
            {/* Interactive Hierarchical Supply Node Tree Component */}
            <SupplyNodeTreeVisualizer
              initialSelectedNodeId={selectedNodeId}
              onSelectNode={(node) => setSelectedNodeId(node.id)}
            />

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900">Geographic Tree Structure:</span> Root
                (National FMCG Buffer) &rarr; Region (Nairobi/Western Corridor) &rarr; Local Node (20
                km Wholesaler Radius).
              </div>
              <div className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded">
                Leaf Nodes = 20.0 km Territory Radiuses
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Visual Tree Navigator */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Hierarchical Supply Grid
                </h3>

                {/* Root Level */}
                <div className="border-2 border-slate-800 bg-slate-900 text-white rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        Level 0: ROOT
                      </span>
                      <span className="font-bold text-sm">WAYNO Kenya National Supply Grid</span>
                    </div>
                    <span className="font-mono text-xs text-slate-300">Radius: 500 km</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Anchor: National FMCG Buffer Terminal &bull; 1,420 Onboarded Dukas &bull; 99.8% Coverage
                  </div>
                </div>

                {/* Connecting Lines */}
                <div className="pl-6 border-l-2 border-dashed border-slate-300 ml-6 space-y-4">
                  {/* Region Nairobi */}
                  <div className="border border-sky-300 bg-sky-50/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          Level 1: REGION
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          Nairobi Metropolitan Supply Corridor (REG-NBI-01)
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-500">Radius: 60 km</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Anchor: Nairobi Metro Regional Distribution Hub &bull; parent_zone_id: root_kenya
                    </div>

                    {/* Local 20km Nodes inside Nairobi */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {geoEngine
                        .getLocalNodes()
                        .filter((n) => n.parentZoneId === 'region_nairobi_metro')
                        .map((node) => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeId(node.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedNodeId === node.id
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                {node.code}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                {node.radiusKm} km
                              </span>
                            </div>
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {node.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-1">
                              {node.wholesalerName}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium mt-2">
                              {node.shopsCount} Dukas mapped
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Region Western */}
                  <div className="border border-amber-300 bg-amber-50/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          Level 1: REGION
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          Western Kenya FMCG Corridor (REG-WST-02)
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-500">Radius: 120 km</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {geoEngine
                        .getLocalNodes()
                        .filter((n) => n.parentZoneId === 'region_western_kenya')
                        .map((node) => (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeId(node.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedNodeId === node.id
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                {node.code}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                                {node.radiusKm} km
                              </span>
                            </div>
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {node.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-1">
                              {node.wholesalerName}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-medium mt-2">
                              {node.shopsCount} Dukas mapped
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Node Inspector & Relational Path */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Selected Node Inspector
                </h3>

                <div className="bg-slate-900 text-white rounded-xl p-4 font-mono text-xs space-y-3">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Node Code:</span>
                    <span className="text-emerald-400 font-bold">{selectedNode.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Node Name:</span>
                    <span className="text-slate-200">{selectedNode.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hierarchy Level:</span>
                    <span className="text-sky-300 font-bold">{selectedNode.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">parent_zone_id:</span>
                    <span className="text-amber-300">{selectedNode.parentZoneId || 'NULL (Root)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Geographic Radius:</span>
                    <span className="text-emerald-300 font-bold">{selectedNode.radiusKm} km Circle</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Center GPS:</span>
                    <span className="text-slate-300">
                      {selectedNode.centerPoint.lat}, {selectedNode.centerPoint.lng}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Anchor Wholesaler:</span>
                    <span className="text-white font-bold">{selectedNode.wholesalerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mapped Retailers:</span>
                    <span className="text-slate-200">{selectedNode.shopsCount} Dukas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stock Coverage:</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedNode.inventoryCoveragePct}%
                    </span>
                  </div>
                </div>

                {/* Recursive Ancestor Traversal Chain */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <GitFork className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upward Tree Traversal Path:</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {ancestorPath.map((node, index) => (
                      <div
                        key={node.id}
                        className="flex items-center space-x-2 bg-white border border-slate-200 p-2 rounded"
                      >
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          Step {index + 1}
                        </span>
                        <div className="flex-1 truncate">
                          <span className="font-semibold text-slate-900">{node.name}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({node.level})</span>
                        </div>
                        {index < ancestorPath.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: LOCAL-FIRST PROCUREMENT & ESCALATION SIMULATOR */}
        {/* ================================================================= */}
        {activeTab === 'PROCUREMENT_SIM' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900">Local-First Procurement Rule:</span> WAYNO queries the 20 km anchor wholesaler first. Only if unavailable does it traverse upward to the Parent Node or activate a closer Secondary Cross-Node Escape Path.
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Controlled Escalation Engine
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Simulation Controls */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                  Procurement Order Parameters
                </h3>

                <div>
                  <label className="font-semibold text-slate-700">Select Ordering Duka:</label>
                  <select
                    value={simShopId}
                    onChange={(e) => setSimShopId(e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2 bg-white text-xs"
                  >
                    {sampleShops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name} ({shop.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Target FMCG Item:</label>
                  <input
                    type="text"
                    value={simProduct}
                    onChange={(e) => setSimProduct(e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded p-2 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Requested Quantity (Bales):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={simQty}
                    onChange={(e) => setSimQty(parseInt(e.target.value) || 1)}
                    className="w-full mt-1 border border-slate-300 rounded p-2 bg-white text-xs font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">Simulate Inventory Availability:</div>

                  {/* Toggle 1: Local Wholesaler */}
                  <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-700">
                      1. Local Anchor Node Wholesaler has stock:
                    </span>
                    <input
                      type="checkbox"
                      checked={simLocalStock}
                      onChange={(e) => setSimLocalStock(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  {/* Toggle 2: Parent Regional Hub */}
                  <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-700">
                      2. Parent Regional Hub has stock:
                    </span>
                    <input
                      type="checkbox"
                      checked={simParentStock}
                      onChange={(e) => setSimParentStock(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  {/* Toggle 3: Secondary Escape Path (Adjacent Wholesaler) */}
                  <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer">
                    <span className="font-medium text-slate-700">
                      3. Secondary Escape Path (Adjacent Wholesaler) has stock:
                    </span>
                    <input
                      type="checkbox"
                      checked={simEscapeStock}
                      onChange={(e) => setSimEscapeStock(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Resolution Result Card */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 text-xs font-mono">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Procurement Status
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          procurementResolution.fulfillmentStatus === 'FULFILLED_LOCAL'
                            ? 'text-emerald-400'
                            : procurementResolution.fulfillmentStatus === 'FULFILLED_CROSS_NODE'
                            ? 'text-sky-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {procurementResolution.fulfillmentStatus}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Assigned 20km Node
                      </span>
                      <span className="text-emerald-300 font-bold">
                        {procurementResolution.assignedLocalNode.code}
                      </span>
                    </div>
                  </div>

                  {/* Traversal Steps */}
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase text-slate-400 tracking-wider">
                      Hierarchical Traversal Steps:
                    </div>
                    {procurementResolution.traversalSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className={`p-2 rounded border text-xs ${
                          step.isAvailable
                            ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                            : 'bg-rose-950/30 border-rose-800 text-rose-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold">
                            Step {step.stepNumber}: {step.sourceType} ({step.nodeName})
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-black/40">
                            {step.isAvailable ? 'AVAILABLE' : 'STOCKOUT'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">{step.reason}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                          <span>Wholesaler: {step.wholesalerName}</span>
                          <span>Road Dist: {step.distanceKm} km ({step.travelTimeMinutes} mins)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Unit Wholesale Price:</span>
                      <span className="text-white">
                        KES {procurementResolution.resolvedStep?.wholesalePriceKES.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Inter-Node Transit Bridge Surcharge:</span>
                      <span className="text-amber-300">
                        +KES {procurementResolution.transportSurchargeKES}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Estimated Boda Travel Time:</span>
                      <span className="text-emerald-300 font-bold">
                        {procurementResolution.leadTimeMinutes} Minutes
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800">
                      <span>Total Procurement Cost:</span>
                      <span>KES {procurementResolution.totalCostKES.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded border border-slate-700 text-[11px] text-slate-300">
                    <span className="font-bold text-white">Procurement Intelligence Note: </span>
                    {procurementResolution.procurementIntelligenceNote}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: VEHICLE ROUTING PROBLEM (VRP) VS SHORTEST PATH */}
        {/* ================================================================= */}
        {activeTab === 'ROUTING_VRP' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900">Routing Engine Distinction:</span> The 20 km radius is a geographic territory, not a static rider constraint. For multi-shop dispatches, WAYNO solves the Vehicle Routing Problem (VRP / TSP 2-opt) to optimize multi-stop delivery tours.
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                TSP 2-Opt Heuristic
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Fuel Savings
                </div>
                <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                  {vrpComparison.fuelSavingsPct}%
                </div>
                <div className="text-xs text-emerald-600 mt-0.5">Distance reduced by { (vrpComparison.naiveDistanceKm - vrpComparison.optimizedDistanceKm).toFixed(1) } km</div>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                  Time Saved
                </div>
                <div className="text-2xl font-bold text-sky-700 font-mono mt-1">
                  {vrpComparison.timeSavedMinutes} mins
                </div>
                <div className="text-xs text-sky-600 mt-0.5">
                  {vrpComparison.optimizedDurationMinutes}m tour vs {vrpComparison.naiveDurationMinutes}m naive
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 text-center">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Carbon Footprint Reduction
                </div>
                <div className="text-2xl font-bold text-white font-mono mt-1">
                  -{vrpComparison.carbonReductionKg} kg
                </div>
                <div className="text-xs text-slate-400 mt-0.5">CO2 avoided per delivery wave</div>
              </div>
            </div>

            {/* Side-by-Side Tour Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Naive Order of Arrival */}
              <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-rose-200 pb-2">
                  <span className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                    1. Naive Order-of-Arrival (FIFO)
                  </span>
                  <span className="font-mono text-xs font-bold text-rose-700">
                    {vrpComparison.naiveDistanceKm} km &bull; {vrpComparison.naiveDurationMinutes} mins
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Rider delivers in the random order customers clicked checkout, causing criss-crossing across Nairobi traffic.
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {vrpComparison.naiveSequence.map((stop, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-2 bg-white border border-rose-200 p-2 rounded"
                    >
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-slate-800 truncate">{stop}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* VRP 2-Opt Optimized Circuit */}
              <div className="border border-emerald-300 bg-emerald-50/40 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                  <span className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                    2. VRP Nearest-Neighbor / 2-Opt Tour
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {vrpComparison.optimizedDistanceKm} km &bull; {vrpComparison.optimizedDurationMinutes} mins
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Routing engine sequences stops along geographical corridors, eliminating backtracking and cutting fuel burn.
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {vrpComparison.optimizedSequence.map((stop, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-2 bg-white border border-emerald-300 p-2 rounded"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-slate-900 font-medium truncate">{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: RIDER 20 KM MANDATE & OUT-OF-ZONE EXCEPTIONS */}
        {/* ================================================================= */}
        {activeTab === 'RIDER_MANDATE' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900">Rider Operating Mandate:</span> Boda boda riders have a normal 20 km operating territory mandate. When an exception exceeds 20 km, WAYNO activates one of 3 exception mechanisms: Route Extension, Boundary Relay Handoff, or Dedicated Carrier.
              </div>
              <span className="text-xs font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                20 km Mandate Cap
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              {/* Interactive Controls */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                  Dispatch Journey Parameters
                </h3>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-700">Actual Road Network Distance:</span>
                    <span className="font-bold font-mono text-emerald-800 text-sm">
                      {mandateDistance.toFixed(1)} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2.0}
                    max={55.0}
                    step={0.5}
                    value={mandateDistance}
                    onChange={(e) => setMandateDistance(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>2.0 km</span>
                    <span className="font-bold text-emerald-700">20.0 km (Normal Mandate Cap)</span>
                    <span>28.0 km (Extension Limit)</span>
                    <span>55.0 km</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span className="text-slate-700">Consignment Cargo Weight:</span>
                    <span className="font-bold font-mono text-slate-800">{mandateWeight} kg</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={mandateWeight}
                    onChange={(e) => setMandateWeight(parseInt(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>5 kg</span>
                    <span>45 kg (Boda limit)</span>
                    <span>150 kg (Tuk-Tuk)</span>
                    <span>200 kg</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800">Straight-Line vs Road Factor:</div>
                  <div className="flex justify-between">
                    <span>Euclidean Straight-Line:</span>
                    <span className="font-mono font-bold">
                      {mandateEvaluation.straightLineDistanceKm} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Road Winding Factor:</span>
                    <span className="font-mono">1.38x Kenyan urban topology</span>
                  </div>
                </div>
              </div>

              {/* Exception Outcome Card */}
              <div className="bg-slate-900 text-white rounded-xl p-5 font-mono text-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Mandate Evaluation
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        mandateEvaluation.isWithinMandate
                          ? 'text-emerald-400'
                          : mandateEvaluation.exceptionType === 'ROUTE_EXTENSION'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {mandateEvaluation.exceptionType}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Recommended Carrier
                    </span>
                    <span className="text-white font-bold">
                      {mandateEvaluation.recommendedVehicle}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mandate Status:</span>
                    <span
                      className={
                        mandateEvaluation.isWithinMandate ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {mandateEvaluation.isWithinMandate
                        ? 'Within 20 km Standard Envelope'
                        : `Exceeds Mandate by +${mandateEvaluation.extraKm} km`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Delivery Fee:</span>
                    <span>KES {mandateEvaluation.baseDeliveryFeeKES}</span>
                  </div>
                  {mandateEvaluation.extensionFeeKES > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Out-of-Mandate Surcharge / Mileage:</span>
                      <span>+KES {mandateEvaluation.extensionFeeKES}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-slate-800 text-sm">
                    <span>Total Rider Compensation:</span>
                    <span>KES {mandateEvaluation.totalDeliveryFeeKES}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery SLA Window:</span>
                    <span className="text-sky-300 font-bold">{mandateEvaluation.slaMinutes}</span>
                  </div>
                </div>

                {mandateEvaluation.handoffExchangeHub && (
                  <div className="p-2.5 bg-slate-800 rounded border border-slate-700 text-[11px] text-sky-200">
                    <span className="font-bold text-white">Relay Exchange Hub: </span>
                    {mandateEvaluation.handoffExchangeHub.name} (OTP verification transfer between Rider 1 and Rider 2)
                  </div>
                )}

                <div className="p-3 bg-slate-800/80 rounded border border-slate-700 text-[11px] text-slate-300">
                  <span className="font-bold text-white">Operational Protocol: </span>
                  {mandateEvaluation.operationalProcedure}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: POSTGIS SCHEMA & RECURSIVE SQL CTE */}
        {/* ================================================================= */}
        {activeTab === 'POSTGIS_SQL' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm">
                  PostGIS Relational Schema & Recursive Tree Traversal Query
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Service zones with parent_zone_id foreign keys, GiST spatial indexing, and WITH RECURSIVE SQL tree queries.
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center space-x-1.5 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied to Clipboard' : 'Copy PostGIS SQL'}</span>
              </button>
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
              <pre>{POSTGIS_SERVICE_ZONE_SCHEMA}</pre>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: PROCUREMENT & ML INTELLIGENCE */}
        {/* ================================================================= */}
        {activeTab === 'ML_INTELLIGENCE' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900">Procurement Intelligence Layer:</span> Telemetry tracks node escalation rates, identifying where local stockouts cause unnecessary upward transport to parent hubs, and auto-recommends safety stock buffers.
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Predictive Node Replenishment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {telemetryInsights.map((insight) => (
                <div
                  key={insight.nodeId}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900">{insight.nodeName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        insight.healthStatus === 'HEALTHY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : insight.healthStatus === 'WARNING_FREQUENT_ESCALATIONS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {insight.healthStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="text-[10px] text-slate-400 uppercase">Local Fulfillment</div>
                      <div className="font-bold text-emerald-600 font-mono text-sm mt-0.5">
                        {insight.localFulfillmentRatePct}%
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="text-[10px] text-slate-400 uppercase">Parent Escalation</div>
                      <div className="font-bold text-amber-600 font-mono text-sm mt-0.5">
                        {insight.parentEscalationRatePct}%
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="text-[10px] text-slate-400 uppercase">Cross-Node Escape</div>
                      <div className="font-bold text-sky-600 font-mono text-sm mt-0.5">
                        {insight.crossNodeEscapeRatePct}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Top Stockout Item:</span>
                      <span className="font-semibold text-slate-900">{insight.topStockoutCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Safety Buffer Recommendation:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        +{insight.recommendedSafetyStockBufferCases} Cases Buffer
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projected Transport Savings:</span>
                      <span className="font-mono text-slate-900">
                        KES {insight.potentialTransportSavingsKES.toLocaleString()} / mo
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
