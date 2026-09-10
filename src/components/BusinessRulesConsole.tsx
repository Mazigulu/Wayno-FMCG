import React, { useState, useMemo } from 'react';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bike,
  DollarSign,
  Package,
  Layers,
  ChevronRight,
  Calculator,
  RefreshCw,
  Sliders,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { DETAILED_BUSINESS_RULES } from '../data/businessRulesData';
import { BusinessRuleSpec } from '../types/businessRules';
import {
  calculateDeliveryFee,
  evaluateSupplierSelection,
  simulateSupplierAcceptanceTimeout,
  evaluateSubstitution,
  evaluateCancellationRefund,
  evaluateServiceZoneEligibility,
} from '../services/businessRulesEngine';
import { OrderState } from '../types/wayno';

export const BusinessRulesConsole: React.FC = () => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rule_01_supplier_selection');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Active Rule Object
  const activeRule: BusinessRuleSpec = useMemo(() => {
    return (
      DETAILED_BUSINESS_RULES.find((r) => r.id === selectedRuleId) ||
      DETAILED_BUSINESS_RULES[0]
    );
  }, [selectedRuleId]);

  // Filtered Rules List
  const filteredRules = useMemo(() => {
    return DETAILED_BUSINESS_RULES.filter((rule) => {
      const matchesSearch =
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.businessObjective.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.ruleNumber.toString() === searchQuery.trim();

      const matchesCategory =
        selectedCategory === 'ALL' || rule.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // --- Interactive State 1: Delivery Fee Calculator (Rule 3) ---
  const [calcDistance, setCalcDistance] = useState<number>(4.8);
  const [calcWeight, setCalcWeight] = useState<number>(36);
  const [calcRushHour, setCalcRushHour] = useState<boolean>(false);
  const [calcRain, setCalcRain] = useState<boolean>(false);
  const [calcExpress, setCalcExpress] = useState<boolean>(false);
  const [calcMultiDrop, setCalcMultiDrop] = useState<boolean>(false);
  const [calcBasketSubtotal, setCalcBasketSubtotal] = useState<number>(6800);

  const deliveryResult = useMemo(() => {
    return calculateDeliveryFee({
      distanceKm: calcDistance,
      weightKg: calcWeight,
      isRushHourSurge: calcRushHour,
      isHeavyRainSurge: calcRain,
      isExpressUrgent: calcExpress,
      isMultiDrop: calcMultiDrop,
      zoneId: 'zone_nairobi_central',
      basketSubtotalKES: calcBasketSubtotal,
    });
  }, [calcDistance, calcWeight, calcRushHour, calcRain, calcExpress, calcMultiDrop, calcBasketSubtotal]);

  // --- Interactive State 2: Supplier Selection Simulator (Rule 1) ---
  const [mockCandidates, setMockCandidates] = useState([
    {
      wholesalerId: 'ws_eastleigh',
      wholesalerName: 'Eastleigh Mega Wholesale Depot',
      depotLocation: 'First Avenue Eastleigh',
      distanceKm: 2.8,
      wholesalePriceKES: 1820,
      stockQty: 45,
      historicalReliabilityPct: 98.4,
      avgPrepMins: 12,
    },
    {
      wholesalerId: 'ws_industrial',
      wholesalerName: 'Industrial Area Supply Hub',
      depotLocation: 'Enterprise Road',
      distanceKm: 5.6,
      wholesalePriceKES: 1780,
      stockQty: 80,
      historicalReliabilityPct: 96.1,
      avgPrepMins: 15,
    },
    {
      wholesalerId: 'ws_westlands',
      wholesalerName: 'Nairobi West Wholesale Terminal',
      depotLocation: 'Gandhi Ave Nairobi West',
      distanceKm: 7.2,
      wholesalePriceKES: 1850,
      stockQty: 18,
      historicalReliabilityPct: 94.7,
      avgPrepMins: 18,
    },
  ]);
  const [basketConsolidatedId, setBasketConsolidatedId] = useState<string>('ws_eastleigh');

  const supplierSelectionResult = useMemo(() => {
    return evaluateSupplierSelection(mockCandidates, { [basketConsolidatedId]: true });
  }, [mockCandidates, basketConsolidatedId]);

  // --- Interactive State 3: Timeout Simulator (Rule 5) ---
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(130);
  const timeoutSimulation = useMemo(() => {
    return simulateSupplierAcceptanceTimeout(timeoutSeconds);
  }, [timeoutSeconds]);

  // --- Interactive State 4: Substitution Simulator (Rule 6) ---
  const [substituteOption, setSubstituteOption] = useState<'SOKO' | 'PEMBE' | 'EXPENSIVE_PREMIUM'>('SOKO');
  const [retailerSubPreference, setRetailerSubPreference] = useState<'AUTO_SUBSTITUTE' | 'CONFIRM_REQUIRED' | 'NEVER_SUBSTITUTE'>('AUTO_SUBSTITUTE');

  const substitutionResult = useMemo(() => {
    const original = { name: 'Jogoo Maize Meal Flour 2kg (Bale of 12)', packSize: '2kg x 12', price: 1850 };
    let proposed = { name: 'Soko Sifted Maize Flour 2kg (Bale of 12)', packSize: '2kg x 12', price: 1820 };

    if (substituteOption === 'PEMBE') {
      proposed = { name: 'Pembe Supreme Maize Meal 2kg (Bale of 12)', packSize: '2kg x 12', price: 1890 };
    } else if (substituteOption === 'EXPENSIVE_PREMIUM') {
      proposed = { name: 'Hostess Extra Fine Sifted Maize Meal (Bale of 12)', packSize: '2kg x 12', price: 2150 };
    }

    return evaluateSubstitution(original, proposed, retailerSubPreference);
  }, [substituteOption, retailerSubPreference]);

  // --- Interactive State 5: Cancellation & Refund Simulator (Rule 8 & 9) ---
  const [cancelOrderState, setCancelOrderState] = useState<OrderState>('SUPPLIER_CONFIRMED');
  const [cancelledByActor, setCancelledByActor] = useState<'RETAILER' | 'WHOLESALER' | 'SYSTEM'>('RETAILER');
  const [simSubtotal, setSimSubtotal] = useState<number>(5400);
  const [simDeliveryFee, setSimDeliveryFee] = useState<number>(250);

  const cancellationResult = useMemo(() => {
    return evaluateCancellationRefund(cancelOrderState, simSubtotal, simDeliveryFee, cancelledByActor);
  }, [cancelOrderState, simSubtotal, simDeliveryFee, cancelledByActor]);

  // --- Interactive State 6: Service Zone Boundary Checker (Rule 14) ---
  const [zoneShop, setZoneShop] = useState<string>('zone_nairobi_east');
  const [zoneWholesaler, setZoneWholesaler] = useState<string>('zone_nairobi_central');
  const [zoneDistance, setZoneDistance] = useState<number>(5.8);

  const zoneEligibilityResult = useMemo(() => {
    return evaluateServiceZoneEligibility(zoneShop, zoneWholesaler, zoneDistance);
  }, [zoneShop, zoneWholesaler, zoneDistance]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Platform Governance & Protocol
              </span>
              <span className="text-slate-400 text-xs font-mono">14 Operational Rules</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              WAYNO Operating Rules & Commercial Engine
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Comprehensive specifications governing supplier selection, pricing tiers, boda delivery calculations, M-Pesa automated refunds, supplier SLA timeouts, and geofenced service zones across Nairobi informal retail corridors.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-right">
              <div className="text-[11px] font-medium text-slate-500 uppercase">Settlement Engine</div>
              <div className="text-xs font-bold text-emerald-700 flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Daraja M-Pesa B2C Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search business rules by keyword, parameter, formula, or rule number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'ALL', label: 'All (14)' },
              { id: 'PRICING_FEES', label: 'Pricing & Fees' },
              { id: 'FULFILLMENT_OPERATIONS', label: 'Fulfillment & SLA' },
              { id: 'ORDER_LIFECYCLE', label: 'Order Lifecycle & Refunds' },
              { id: 'LOGISTICS_ROUTING', label: 'Logistics & Zones' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left Directory, Right Deep Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Rules Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Rules Catalog ({filteredRules.length})
          </div>

          <div className="space-y-1.5 max-h-[820px] overflow-y-auto pr-1">
            {filteredRules.map((rule) => {
              const isSelected = rule.id === activeRule.id;
              return (
                <button
                  key={rule.id}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {rule.ruleNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {rule.title}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-emerald-700 translate-x-0.5' : 'text-slate-400'
                      }`}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 pl-7">
                    {rule.summary}
                  </p>

                  <div className="mt-2 pl-7 flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {rule.category.replace('_', ' ')}
                    </span>
                    {rule.interactiveType && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-0.5">
                        <Sliders className="w-2.5 h-2.5" />
                        <span>Interactive Simulator</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredRules.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-lg text-xs">
                No business rules matching "{searchQuery}". Try searching for "timeout", "fee", "refund", or "margin".
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rule Deep-Dive Inspector & Live Simulation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Rule Main Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            {/* Title & Metadata Header */}
            <div className="border-b border-slate-100 pb-5 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                  RULE #{activeRule.ruleNumber}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {activeRule.category.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeRule.title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeRule.summary}
              </p>
            </div>

            {/* Business Objective */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                <span>Commercial Objective & Value Creation</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeRule.businessObjective}
              </p>
            </div>

            {/* Key Mathematical Formulas & Parameters */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5 text-slate-600" />
                <span>Core Mathematical Formulas & Parameter Matrix</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                {activeRule.keyFormulasOrParameters.map((param, idx) => (
                  <div key={idx} className="p-3 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700 w-full sm:w-1/3">
                      {param.label}
                    </span>
                    <span className="font-mono text-emerald-800 bg-emerald-50/60 px-2 py-1 rounded border border-emerald-100 w-full sm:w-2/3 break-words text-[11px]">
                      {param.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Execution Protocol */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>Step-by-Step Execution Protocol</span>
              </div>
              <div className="space-y-2">
                {activeRule.stepByStepProtocol.map((step, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="leading-relaxed">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge Cases and Exceptions */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Edge Cases & Boundary Resolutions</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {activeRule.edgeCasesAndExceptions.map((ec, idx) => (
                  <div key={idx} className="p-3.5 border border-amber-200 bg-amber-50/40 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-amber-900 flex items-center space-x-1">
                      <span>Condition:</span>
                      <span className="font-normal">{ec.scenario}</span>
                    </div>
                    <div className="text-slate-700 flex items-start space-x-1 pt-0.5">
                      <span className="font-bold text-emerald-800 shrink-0">Resolution:</span>
                      <span>{ec.resolution}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kenyan Market Context */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 space-y-1">
              <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Nairobi Informal Trade & Duka Reality</span>
              </div>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                {activeRule.kenyanMarketContext}
              </p>
            </div>

            {/* SLAs & Enforcement Penalties */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>SLA Metrics & Enforcement Thresholds</span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Metric</th>
                      <th className="p-2.5">Target SLA</th>
                      <th className="p-2.5">Enforcement Action / Penalty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeRule.slaOrThresholds.map((sla, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-800">{sla.metric}</td>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">{sla.target}</td>
                        <td className="p-2.5 text-slate-600">{sla.penaltyOrAction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DYNAMIC INTERACTIVE SIMULATORS (Based on active rule) */}

          {/* 1. DELIVERY FEE CALCULATOR (Rule 3) */}
          {activeRule.id === 'rule_03_delivery_fee' && (
            <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Interactive Engine
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Rule 3 Delivery-Fee Formula Simulator
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Output Delivery Fee</span>
                  <div className="text-xl font-bold text-emerald-700">
                    KES {deliveryResult.finalDeliveryFee.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Sliders */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Road Distance (Haversine × 1.28)</span>
                      <span className="font-bold font-mono text-slate-800">{calcDistance.toFixed(1)} km</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={12.0}
                      step={0.1}
                      value={calcDistance}
                      onChange={(e) => setCalcDistance(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>0.5 km</span>
                      <span>3.0 km (Base)</span>
                      <span>12.0 km</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Cargo Payload Weight</span>
                      <span className="font-bold font-mono text-slate-800">{calcWeight} kg</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={120}
                      step={1}
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>5 kg</span>
                      <span>30 kg (Boda max)</span>
                      <span>60 kg (Tuk-tuk upgrade)</span>
                      <span>120 kg</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Basket Subtotal (KES)</span>
                      <span className="font-bold font-mono text-slate-800">KES {calcBasketSubtotal.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={40000}
                      step={500}
                      value={calcBasketSubtotal}
                      onChange={(e) => setCalcBasketSubtotal(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>KES 1,000</span>
                      <span>KES 25,000 (Free Delivery Threshold)</span>
                      <span>KES 40,000</span>
                    </div>
                  </div>
                </div>

                {/* Toggles & Environmental Factors */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">Environmental Modifiers</span>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calcRushHour}
                        onChange={(e) => setCalcRushHour(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Nairobi Rush-Hour Surge (1.15x multiplier, 17:00 - 19:30)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calcRain}
                        onChange={(e) => setCalcRain(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Torrential Rain / Flash Flood Surge (1.25x multiplier)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calcExpress}
                        onChange={(e) => setCalcExpress(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Urgent Priority Dispatch (+KES 100 dedicated boda jump)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calcMultiDrop}
                        onChange={(e) => setCalcMultiDrop(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Bundled Multi-Drop (-20% second-leg discount)</span>
                    </label>
                  </div>

                  {/* Vehicle Type Pill */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Allocated Vehicle:</span>
                    <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-300">
                      {deliveryResult.vehicleTypeRequired}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formula Ledger Breakdown */}
              <div className="bg-slate-900 text-white rounded-lg p-4 font-mono text-xs space-y-1.5">
                <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                  Algorithmic Breakdown Ledger
                </div>
                <div className="flex justify-between">
                  <span>1. Base Boarding Charge (≤ 3km, ≤ 30kg):</span>
                  <span className="text-emerald-400">KES {deliveryResult.baseFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>2. Incremental Distance Fee ({Math.max(0, calcDistance - 3.0).toFixed(1)} km @ KES 35/km):</span>
                  <span className="text-emerald-400">KES {deliveryResult.distanceFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>3. Weight / Vehicle Surcharge ({calcWeight} kg):</span>
                  <span className="text-emerald-400">KES {deliveryResult.weightSurcharge}</span>
                </div>
                {deliveryResult.surgeAmount > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>4. Weather/Traffic Surge ({deliveryResult.surgeMultiplier}x):</span>
                    <span>+KES {deliveryResult.surgeAmount}</span>
                  </div>
                )}
                {deliveryResult.expressSurcharge > 0 && (
                  <div className="flex justify-between text-blue-300">
                    <span>5. Express Urgency Surcharge:</span>
                    <span>+KES {deliveryResult.expressSurcharge}</span>
                  </div>
                )}
                {deliveryResult.multiDropDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>6. Multi-Drop Discount:</span>
                    <span>-KES {deliveryResult.multiDropDiscount}</span>
                  </div>
                )}
                {deliveryResult.freeDeliveryDiscount > 0 && (
                  <div className="flex justify-between text-emerald-300 font-bold">
                    <span>7. Free Delivery Subsidy (Basket &gt; KES 25,000):</span>
                    <span>-KES {deliveryResult.freeDeliveryDiscount}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-1.5 flex justify-between font-bold text-sm">
                  <span>FINAL RETAILER FEE:</span>
                  <span className="text-emerald-400">KES {deliveryResult.finalDeliveryFee.toLocaleString()}</span>
                </div>
                <div className="text-slate-400 text-[10px] pt-1">
                  Estimated Transit Time: ~{deliveryResult.estimatedTransitMins} minutes to shop
                </div>
              </div>
            </div>
          )}

          {/* 2. SUPPLIER SELECTION SIMULATOR (Rule 1) */}
          {activeRule.id === 'rule_01_supplier_selection' && (
            <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Candidate Evaluation
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Rule 1 Multi-Factor Candidate Scoring Engine
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Selected Wholesaler</span>
                  <div className="text-sm font-bold text-emerald-800">
                    {supplierSelectionResult.selectedWholesalerName}
                  </div>
                </div>
              </div>

              {/* Basket Affinity Toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Existing Items in Cart Stored at:</span>
                <select
                  value={basketConsolidatedId}
                  onChange={(e) => setBasketConsolidatedId(e.target.value)}
                  className="border border-slate-300 rounded px-2.5 py-1 bg-white text-xs font-medium"
                >
                  <option value="ws_eastleigh">Eastleigh Mega Wholesale (+15 Basket Bonus)</option>
                  <option value="ws_industrial">Industrial Area Supply Hub (+15 Basket Bonus)</option>
                  <option value="ws_westlands">Nairobi West Wholesale (+15 Basket Bonus)</option>
                  <option value="none">Empty Cart (No Basket Bonus)</option>
                </select>
              </div>

              {/* Candidate Scoring Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Wholesale Depot</th>
                      <th className="p-3">Distance (30%)</th>
                      <th className="p-3">Wholesale Price (25%)</th>
                      <th className="p-3">Stock (20%)</th>
                      <th className="p-3">Fill SLA (15%)</th>
                      <th className="p-3">Composite Score</th>
                      <th className="p-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierSelectionResult.rankedCandidates.map((cand, idx) => {
                      const isWinner = cand.wholesalerId === supplierSelectionResult.selectedWholesalerId;
                      return (
                        <tr key={cand.wholesalerId} className={isWinner ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50'}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{cand.wholesalerName}</div>
                            <div className="text-[10px] text-slate-500">{cand.depotLocation}</div>
                          </td>
                          <td className="p-3 font-mono">{cand.distanceKm} km</td>
                          <td className="p-3 font-mono text-emerald-800">KES {cand.wholesalePriceKES.toLocaleString()}</td>
                          <td className="p-3 font-mono">{cand.stockQty} bales</td>
                          <td className="p-3 font-mono">{cand.historicalReliabilityPct}%</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${isWinner ? 'bg-emerald-600' : 'bg-slate-500'}`}
                                  style={{ width: `${Math.min(100, cand.compositeScore || 0)}%` }}
                                />
                              </div>
                              <span className="font-bold font-mono text-xs">{cand.compositeScore}/100</span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {isWinner ? (
                              <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                WINNER #1
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Rank #{idx + 1}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                <span className="font-bold text-slate-800">Scoring Engine Rationale: </span>
                {supplierSelectionResult.rationale}
              </div>
            </div>
          )}

          {/* 3. SUPPLIER ACCEPTANCE TIMEOUT SIMULATOR (Rule 5) */}
          {activeRule.id === 'rule_05_supplier_acceptance_timeouts' && (
            <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Live SLA Timeline
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Rule 5 Supplier Acceptance Escalation Ladder
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Timer State</span>
                  <div className={`text-sm font-bold ${timeoutSeconds >= 240 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {timeoutSeconds >= 240 ? 'EXPIRED (FAILOVER)' : `${240 - timeoutSeconds}s Remaining`}
                  </div>
                </div>
              </div>

              {/* Scrubber */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Elapsed Seconds from Order Payment:</span>
                  <span className="font-mono text-emerald-800 font-bold">{timeoutSeconds} seconds ({Math.floor(timeoutSeconds / 60)}m {timeoutSeconds % 60}s)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={260}
                  step={5}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>T=0s (Order Paid)</span>
                  <span>T=120s (Audio Chime)</span>
                  <span>T=200s (IVR Call)</span>
                  <span>T=240s (Hard Timeout & Failover)</span>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'T=0s Push/SMS', active: timeoutSeconds >= 0, desc: 'Tablet push to depot manager' },
                  { label: 'T=120s Audio Chime', active: timeoutSeconds >= 120, desc: 'High-pitch depot speaker chime' },
                  { label: 'T=200s IVR Call', active: timeoutSeconds >= 200, desc: 'Safaricom IVR dials depot phone' },
                  { label: 'T=240s Failover SLA', active: timeoutSeconds >= 240, desc: 'Hard cancel & secondary reroute' },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      step.active
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="font-bold flex items-center space-x-1">
                      {step.active ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5" />}
                      <span>{step.label}</span>
                    </div>
                    <div className="text-[10px] mt-1">{step.desc}</div>
                  </div>
                ))}
              </div>

              {/* Active Action Display */}
              <div className={`p-4 rounded-lg border text-xs leading-relaxed ${
                timeoutSimulation.currentPhase === 'TIMEOUT_TRIGGERED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <div className="font-bold text-[11px] uppercase tracking-wider mb-1">
                  Engine Action & Policy Enforcement
                </div>
                <div>{timeoutSimulation.actionTaken}</div>
              </div>
            </div>
          )}

          {/* 4. SUBSTITUTION & PARTIAL FULFILLMENT SIMULATOR (Rule 6 & 7) */}
          {(activeRule.id === 'rule_06_substitutions' || activeRule.id === 'rule_07_partial_fulfillment') && (
            <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    SKU Variance Engine
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Rule 6 & 7 Brand Substitution & Partial Settlement
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">1. Select Proposed Substitute</span>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="subOption"
                        checked={substituteOption === 'SOKO'}
                        onChange={() => setSubstituteOption('SOKO')}
                        className="text-emerald-600"
                      />
                      <span>Soko Flour @ KES 1,820 (Cheaper by KES 30 / -1.6%)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="subOption"
                        checked={substituteOption === 'PEMBE'}
                        onChange={() => setSubstituteOption('PEMBE')}
                        className="text-emerald-600"
                      />
                      <span>Pembe Supreme @ KES 1,890 (Pricier by KES 40 / +2.1%)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="subOption"
                        checked={substituteOption === 'EXPENSIVE_PREMIUM'}
                        onChange={() => setSubstituteOption('EXPENSIVE_PREMIUM')}
                        className="text-emerald-600"
                      />
                      <span>Hostess Premium @ KES 2,150 (Out of Tolerance / +16.2%)</span>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">2. Retailer Shop Preference Profile</span>
                    <select
                      value={retailerSubPreference}
                      onChange={(e) => setRetailerSubPreference(e.target.value as any)}
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 bg-white text-xs"
                    >
                      <option value="AUTO_SUBSTITUTE">Auto-Approve Equivalent Grade</option>
                      <option value="CONFIRM_REQUIRED">Require 3-Min SMS Confirmation</option>
                      <option value="NEVER_SUBSTITUTE">Never Substitute (Drop & Partial Fulfill)</option>
                    </select>
                  </div>
                </div>

                {/* Outcome Display */}
                <div className="space-y-3 bg-slate-900 text-white p-4 rounded-lg font-mono text-xs flex flex-col justify-between">
                  <div>
                    <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-2">
                      Policy Resolution & Ledger Result
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Original Ordered Item:</span>
                        <span>{substitutionResult.originalItem.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Proposed Item:</span>
                        <span className="text-emerald-300">{substitutionResult.proposedSubstitute.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Price Variance:</span>
                        <span className={substitutionResult.proposedSubstitute.priceDiffPct > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                          {substitutionResult.proposedSubstitute.priceDiffPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span>POLICY OUTCOME:</span>
                      <span className={
                        substitutionResult.policyOutcome === 'AUTO_APPROVED'
                          ? 'text-emerald-400'
                          : substitutionResult.policyOutcome === 'REQUIRES_RETAILER_CONFIRMATION'
                          ? 'text-amber-300'
                          : 'text-rose-400'
                      }>
                        {substitutionResult.policyOutcome}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Financial Action:</span>
                      <span className="text-emerald-300">
                        {substitutionResult.priceAdjustment.type === 'REFUND_DIFFERENCE' && `Refund KES ${substitutionResult.priceAdjustment.amountKES} to Retailer M-Pesa`}
                        {substitutionResult.priceAdjustment.type === 'WAYNO_SUBSIDY' && `WAYNO absorbs KES ${substitutionResult.priceAdjustment.amountKES} differential`}
                        {substitutionResult.priceAdjustment.type === 'EXACT_MATCH' && `0 Price Variance`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. CANCELLATION & REFUND SIMULATOR (Rule 8 & 9) */}
          {(activeRule.id === 'rule_08_refunds' || activeRule.id === 'rule_09_cancellations') && (
            <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Daraja M-Pesa Settlement
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Rule 8 & 9 Cancellation Fee & Refund Calculator
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">M-Pesa Refund Amount</span>
                  <div className="text-xl font-bold text-emerald-700">
                    KES {cancellationResult.totalRefundKES.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Selector Inputs */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-700">Order State at Cancellation:</label>
                    <select
                      value={cancelOrderState}
                      onChange={(e) => setCancelOrderState(e.target.value as OrderState)}
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 bg-white text-xs font-mono"
                    >
                      <option value="PAYMENT_PENDING">PAYMENT_PENDING (Unpaid)</option>
                      <option value="FULFILLMENT_PENDING">FULFILLMENT_PENDING (Paid, Pre-packing)</option>
                      <option value="SUPPLIER_CONFIRMED">SUPPLIER_CONFIRMED (Goods Staged)</option>
                      <option value="RIDER_ASSIGNED">RIDER_ASSIGNED (Boda Dispatched)</option>
                      <option value="PICKED_UP">PICKED_UP (Out on Road)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Cancelled By:</label>
                    <select
                      value={cancelledByActor}
                      onChange={(e) => setCancelledByActor(e.target.value as any)}
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 bg-white text-xs"
                    >
                      <option value="RETAILER">Retailer (Duka Owner requested)</option>
                      <option value="WHOLESALER">Wholesaler (Depot fault / stockout)</option>
                      <option value="SYSTEM">WAYNO System (Timeout failover / SLA breach)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-500">Order Subtotal (KES):</label>
                      <input
                        type="number"
                        value={simSubtotal}
                        onChange={(e) => setSimSubtotal(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded p-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Delivery Fee (KES):</label>
                      <input
                        type="number"
                        value={simDeliveryFee}
                        onChange={(e) => setSimDeliveryFee(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded p-1 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Ledger Outcome */}
                <div className="space-y-2 bg-slate-900 text-white p-4 rounded-lg font-mono text-xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-2">
                      Settlement Ledger Statement
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Subtotal Refund:</span>
                      <span className="text-emerald-300">KES {cancellationResult.refundSubtotalKES.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Delivery Fee Refund:</span>
                      <span className="text-emerald-300">KES {cancellationResult.refundDeliveryFeeKES.toLocaleString()}</span>
                    </div>
                    {cancellationResult.restockingFeeKES > 0 && (
                      <div className="flex justify-between text-rose-300">
                        <span>Depot Restocking Fee (Retained):</span>
                        <span>-KES {cancellationResult.restockingFeeKES}</span>
                      </div>
                    )}
                    {cancellationResult.riderDispatchFeeKES > 0 && (
                      <div className="flex justify-between text-amber-300">
                        <span>Rider Dispatch Compensation (Retained):</span>
                        <span>-KES {cancellationResult.riderDispatchFeeKES}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex justify-between text-sm font-bold">
                      <span>NET M-PESA REVERSAL:</span>
                      <span className="text-emerald-400">KES {cancellationResult.totalRefundKES.toLocaleString()}</span>
                    </div>
                    <div className="text-slate-400 text-[10px] mt-1">
                      {cancellationResult.explanation}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. SERVICE ZONE BOUNDARY CHECKER (Rule 14) */}
          {activeRule.id === 'rule_14_service_zone_rules' && (
            <div className="bg-white border border-emerald-300 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Geofence Protocol
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Rule 14 Geofenced Service Zones & Cross-Town Routing
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Eligibility Status</span>
                  <div className={`text-sm font-bold ${zoneEligibilityResult.isEligible ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {zoneEligibilityResult.transitType}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-700">Retailer Duka Zone:</label>
                    <select
                      value={zoneShop}
                      onChange={(e) => setZoneShop(e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 bg-white text-xs"
                    >
                      <option value="zone_nairobi_central">Zone Central (Eastleigh / Pangani / CBD)</option>
                      <option value="zone_nairobi_east">Zone East (Kariobangi / Dandora / Umoja)</option>
                      <option value="zone_nairobi_south">Zone South (Industrial Area / South B)</option>
                      <option value="zone_nairobi_west">Zone West (Kawangware / Kibera / Westlands)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Wholesale Depot Zone:</label>
                    <select
                      value={zoneWholesaler}
                      onChange={(e) => setZoneWholesaler(e.target.value)}
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 bg-white text-xs"
                    >
                      <option value="zone_nairobi_central">Zone Central (Eastleigh Mega Wholesale)</option>
                      <option value="zone_nairobi_south">Zone South (Industrial Area Supply Hub)</option>
                      <option value="zone_nairobi_west">Zone West (Nairobi West Wholesale)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Road Distance:</span>
                      <span className="font-bold font-mono">{zoneDistance.toFixed(1)} km</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={14.0}
                      step={0.2}
                      value={zoneDistance}
                      onChange={(e) => setZoneDistance(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>1.0 km</span>
                      <span>9.0 km (Inter-zone cap)</span>
                      <span>10.0 km (Hard cutoff)</span>
                      <span>14.0 km</span>
                    </div>
                  </div>
                </div>

                {/* Geofence Outcome */}
                <div className="space-y-3 bg-slate-900 text-white p-4 rounded-lg font-mono text-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-slate-400 text-[11px] uppercase tracking-wider">
                      Geofence Transit Evaluation
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transit Classification:</span>
                      <span className={zoneEligibilityResult.isEligible ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {zoneEligibilityResult.transitType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inter-Zone Surcharge:</span>
                      <span>+KES {zoneEligibilityResult.interZoneSurchargeKES}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expected Boda SLA:</span>
                      <span className="text-emerald-300">{zoneEligibilityResult.estimatedSlaMinutes}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 text-slate-300 text-[11px]">
                    <span className="font-bold text-white">Geofence Policy Notes: </span>
                    {zoneEligibilityResult.notes}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
