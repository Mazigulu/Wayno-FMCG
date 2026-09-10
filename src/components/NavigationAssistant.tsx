import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Compass, 
  Car, 
  Train, 
  Bike, 
  ShieldCheck, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  AlertTriangle, 
  CloudRain, 
  Clock, 
  Layers, 
  Smartphone, 
  Laptop, 
  Watch, 
  Headphones, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  Navigation2, 
  Eye, 
  Search,
  Activity,
  Maximize2
} from 'lucide-react';
import { 
  UserPersona, 
  DeviceType, 
  TravelMode, 
  RouteOption, 
  IncidentAlert, 
  POIItem, 
  NavigationTelemetry 
} from '../types/navigation';
import { 
  ORIGIN_PRESETS, 
  DESTINATION_PRESETS, 
  MOCK_ROUTES, 
  MOCK_INCIDENTS, 
  MOCK_POIS, 
  INITIAL_TELEMETRY 
} from '../data/navigationData';

interface NavigationAssistantProps {
  onExecuteFlow?: (flowId: string) => void;
}

export const NavigationAssistant: React.FC<NavigationAssistantProps> = ({ onExecuteFlow }) => {
  // State
  const [persona, setPersona] = useState<UserPersona>('commuter');
  const [device, setDevice] = useState<DeviceType>('mobile');
  const [travelMode, setTravelMode] = useState<TravelMode>('drive');
  const [selectedOrigin, setSelectedOrigin] = useState(ORIGIN_PRESETS[0]);
  const [selectedDest, setSelectedDest] = useState(DESTINATION_PRESETS[0]);
  const [activeRoute, setActiveRoute] = useState<RouteOption>(MOCK_ROUTES[0]);
  const [incidents, setIncidents] = useState<IncidentAlert[]>(MOCK_INCIDENTS);
  const [pois, setPois] = useState<POIItem[]>(MOCK_POIS);
  const [telemetry, setTelemetry] = useState<NavigationTelemetry>(INITIAL_TELEMETRY);

  // Map view layers
  const [showTraffic, setShowTraffic] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showPois, setShowPois] = useState(true);

  // Interactive Live Navigation Simulation
  const [isNavigating, setIsNavigating] = useState(false);
  const [carProgress, setCarProgress] = useState(0.25); // 0 to 1 along route
  const [voiceAssistantActive, setVoiceAssistantActive] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceResponse, setVoiceResponse] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [customReportOpen, setCustomReportOpen] = useState(false);
  const [reportType, setReportType] = useState<'hazard' | 'police' | 'traffic' | 'weather'>('hazard');
  const [reportNote, setReportNote] = useState('');

  // Auto-drive simulation loop
  useEffect(() => {
    let interval: any = null;
    if (isNavigating) {
      interval = setInterval(() => {
        setCarProgress((prev) => {
          const next = prev + 0.008;
          if (next >= 1) {
            setIsNavigating(false);
            return 1;
          }
          return next;
        });

        // Fluctuating speed & metrics
        setTelemetry((prev) => ({
          ...prev,
          currentSpeedKmh: Math.floor(45 + Math.random() * 14),
          remainingMinutes: Math.max(1, Math.floor(16 * (1 - carProgress))),
          remainingDistanceKm: parseFloat((9.4 * (1 - carProgress)).toFixed(1)),
        }));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isNavigating, carProgress]);

  // Handle Bedrock AI prompt
  const handleAskBedrock = (customText?: string) => {
    const query = customText || voiceQuery || 'Why is this route better than the surface streets?';
    setIsSynthesizing(true);
    setVoiceResponse(null);

    setTimeout(() => {
      setIsSynthesizing(false);
      if (query.toLowerCase().includes('coffee') || query.toLowerCase().includes('wifi')) {
        setVoiceResponse(
          'Bedrock Foundation Model: I found Java House Rooftop on Mpaka Road, 3 mins off your current route with 150 Mbps WiFi and underground parking. Added as waypoint.'
        );
      } else if (query.toLowerCase().includes('transit') || query.toLowerCase().includes('train')) {
        setVoiceResponse(
          'Bedrock Foundation Model: Commuter Line 2 departs Central Station in 4 minutes. It avoids 100% of motor traffic, saving KES 180 and 78% CO2 compared to driving.'
        );
      } else {
        setVoiceResponse(
          `Bedrock Foundation Model: Recommended ${activeRoute.title} (${activeRoute.durationMinutes} mins) because real-time TomTom telemetry shows a 18-minute gridlock on Uhuru Highway. Elevated Expressway bypasses all rainslick surface intersections.`
        );
      }
    }, 850);
  };

  // Add Community Report
  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote) return;
    const newInc: IncidentAlert = {
      id: `inc_${Date.now()}`,
      type: reportType,
      title: reportNote,
      location: 'Near current GPS coordinates',
      impact: '+4 min delay',
      delayMinutes: 4,
      coordinates: [-1.272, 36.812],
      timestamp: 'Just now'
    };
    setIncidents([newInc, ...incidents]);
    setCustomReportOpen(false);
    setReportNote('');
  };

  // Switch travel mode
  const handleSelectMode = (mode: TravelMode) => {
    setTravelMode(mode);
    const match = MOCK_ROUTES.find((r) => r.mode === mode) || MOCK_ROUTES[0];
    setActiveRoute(match);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Persona & Device Form Factor Ribbons */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Persona selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              User Persona:
            </span>
            <div className="flex items-center space-x-1 overflow-x-auto text-xs">
              {(['commuter', 'traveler', 'driver', 'rider'] as UserPersona[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                    persona === p
                      ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Device Viewport switch (Client & Edge Box 1) */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Client & Edge Viewport:
            </span>
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                onClick={() => setDevice('mobile')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  device === 'mobile' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile App</span>
              </button>
              <button
                onClick={() => setDevice('web_pwa')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  device === 'web_pwa' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Web PWA</span>
              </button>
              <button
                onClick={() => setDevice('voice')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  device === 'voice' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice Assistant</span>
              </button>
              <button
                onClick={() => setDevice('wearable')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  device === 'wearable' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Watch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wearable HUD</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Journey Controls & Right Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 Cols): Origin/Dest, Mode Comparison, Bedrock Reasoning */}
        <div className="lg:col-span-5 space-y-4">
          {/* Origin & Destination Card */}
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Navigation className="w-3.5 h-3.5 text-slate-700" />
                <span>Multi-Modal Journey Planner</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">PostGIS + A*</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Origin (Starting Location)
                </label>
                <select
                  value={selectedOrigin.id}
                  onChange={(e) => {
                    const match = ORIGIN_PRESETS.find((p) => p.id === e.target.value);
                    if (match) setSelectedOrigin(match);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded p-2 text-xs font-medium focus:outline-none focus:border-slate-800"
                >
                  {ORIGIN_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Destination (Target Endpoint)
                </label>
                <select
                  value={selectedDest.id}
                  onChange={(e) => {
                    const match = DESTINATION_PRESETS.find((p) => p.id === e.target.value);
                    if (match) setSelectedDest(match);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded p-2 text-xs font-medium focus:outline-none focus:border-slate-800"
                >
                  {DESTINATION_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Mode Pills */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                onClick={() => handleSelectMode('drive')}
                className={`flex flex-col items-center justify-center p-2 rounded text-center transition-colors cursor-pointer border ${
                  travelMode === 'drive'
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Car className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Drive</span>
                <span className="text-[9px] opacity-75 font-mono">16m</span>
              </button>

              <button
                onClick={() => handleSelectMode('transit')}
                className={`flex flex-col items-center justify-center p-2 rounded text-center transition-colors cursor-pointer border ${
                  travelMode === 'transit'
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Train className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Transit</span>
                <span className="text-[9px] opacity-75 font-mono">28m</span>
              </button>

              <button
                onClick={() => handleSelectMode('ride_hail')}
                className={`flex flex-col items-center justify-center p-2 rounded text-center transition-colors cursor-pointer border ${
                  travelMode === 'ride_hail'
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Ride-Hail</span>
                <span className="text-[9px] opacity-75 font-mono">19m</span>
              </button>

              <button
                onClick={() => handleSelectMode('bike')}
                className={`flex flex-col items-center justify-center p-2 rounded text-center transition-colors cursor-pointer border ${
                  travelMode === 'bike'
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bike className="w-4 h-4 mb-1" />
                <span className="text-[10px]">e-Bike</span>
                <span className="text-[9px] opacity-75 font-mono">24m</span>
              </button>
            </div>
          </div>

          {/* Active Route Details Card */}
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                  Optimal Choice: {activeRoute.mode.toUpperCase()}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{activeRoute.title}</h3>
                <p className="text-[11px] text-slate-500">{activeRoute.via}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {activeRoute.durationMinutes} min
                </span>
                <span className="text-[11px] text-slate-500 block font-mono">
                  {activeRoute.distanceKm} km · KES {activeRoute.costKes}
                </span>
              </div>
            </div>

            {/* Turn by turn segments summary */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Itinerary Segments:
              </span>
              {activeRoute.segments.map((seg, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs py-1">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-900">{seg.instruction}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {seg.distance}
                  </span>
                </div>
              ))}
            </div>

            {/* Simulation Action Bar */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
              {!isNavigating ? (
                <button
                  onClick={() => setIsNavigating(true)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Turn-by-Turn Navigation</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsNavigating(false)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>Pause Active Simulation</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsNavigating(false);
                  setCarProgress(0);
                }}
                className="p-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Reset simulation position"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bedrock AI Route Reasoning & Voice Card */}
          <div className="bg-slate-900 text-white rounded-md p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-tight">
                  Bedrock LLM Route Reasoning
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                Claude 3.5 Sonnet
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-emerald-500 pl-3">
              "{activeRoute.aiRecommendationReason}"
            </p>

            {/* Interactive Ask Bedrock Input */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ask Bedrock (e.g. 'Coffee with wifi along the way?')..."
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskBedrock()}
                  className="flex-1 bg-slate-800 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                />
                <button
                  onClick={() => handleAskBedrock()}
                  disabled={isSynthesizing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSynthesizing ? 'Thinking...' : 'Reason'}
                </button>
              </div>

              {/* Quick AI Suggestion Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto text-[10px] text-slate-300">
                <span className="text-slate-500">Try:</span>
                <button
                  onClick={() => handleAskBedrock('Find a coffee shop with fast wifi on this route')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  ☕ Coffee + WiFi
                </button>
                <button
                  onClick={() => handleAskBedrock('What if I take the metro train instead?')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  🚆 Compare Train
                </button>
                <button
                  onClick={() => handleAskBedrock('Is there EV charging at my destination?')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  ⚡ EV Charger
                </button>
              </div>

              {voiceResponse && (
                <div className="bg-slate-800/90 border border-emerald-500/30 rounded p-2.5 text-xs text-emerald-200 mt-2 space-y-1">
                  <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold">
                    <Volume2 className="w-3 h-3" />
                    <span>AI Voice Response</span>
                  </div>
                  <p className="leading-snug">{voiceResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Interactive Vector Navigation Map Canvas */}
        <div className="lg:col-span-7 space-y-3">
          {/* Live Turn Banner when Navigating */}
          {isNavigating && (
            <div className="bg-slate-900 text-white p-3.5 rounded-md flex items-center justify-between border border-slate-800 shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0">
                  <Navigation2 className="w-6 h-6 rotate-45" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
                    Next Maneuver in {Math.floor(telemetry.remainingDistanceKm * 100)}m
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold">{telemetry.nextManeuver.action}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Current: {telemetry.currentStreet}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl font-bold font-mono text-white">
                  {telemetry.currentSpeedKmh}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">km/h (Limit 60)</span>
              </div>
            </div>
          )}

          {/* Interactive Map Visual Stage */}
          <div className="relative bg-slate-950 rounded-md border border-slate-800 overflow-hidden shadow-sm h-[480px]">
            {/* Map Layer Toolbar Top Right */}
            <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded border border-slate-800 text-[11px] text-slate-300">
              <button
                onClick={() => setShowTraffic(!showTraffic)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  showTraffic ? 'bg-emerald-600 text-white font-semibold' : 'hover:bg-slate-800'
                }`}
                title="Toggle Real-Time Traffic Ingestion (TomTom)"
              >
                Traffic
              </button>
              <button
                onClick={() => setShowWeather(!showWeather)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  showWeather ? 'bg-sky-600 text-white font-semibold' : 'hover:bg-slate-800'
                }`}
                title="Toggle OpenWeather Radar Overlay"
              >
                Weather
              </button>
              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  showIncidents ? 'bg-amber-600 text-white font-semibold' : 'hover:bg-slate-800'
                }`}
                title="Toggle Community Incident Reports"
              >
                Alerts ({incidents.length})
              </button>
              <button
                onClick={() => setShowPois(!showPois)}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  showPois ? 'bg-purple-600 text-white font-semibold' : 'hover:bg-slate-800'
                }`}
                title="Toggle Semantic POIs (OpenSearch)"
              >
                POIs
              </button>
            </div>

            {/* GPS & Sensor HUD Top Left */}
            <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md p-2 rounded border border-slate-800 text-[10px] font-mono text-slate-300 space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-white">GNSS LOCK: 14 SATS</span>
              </div>
              <div>Accuracy: ±1.2m · Alt: 1,684m</div>
              <div>TimescaleDB 1Hz Sync: Active</div>
            </div>

            {/* SVG Vector Map Rendering */}
            <svg
              className="w-full h-full"
              viewBox="0 0 800 500"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background Grid - Dark Clean Cartography */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
                </pattern>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="70%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              <rect width="100%" height="100%" fill="#090d16" />
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Major Roads / Arterials */}
              <path d="M 50 250 Q 250 180 450 260 T 750 230" stroke="#334155" strokeWidth="8" fill="none" />
              <path d="M 400 40 L 400 460" stroke="#334155" strokeWidth="6" fill="none" />
              <path d="M 120 440 L 680 80" stroke="#1e293b" strokeWidth="5" fill="none" />
              <path d="M 100 80 L 700 420" stroke="#1e293b" strokeWidth="5" fill="none" />

              {/* Transit Ring / Rail line */}
              <path
                d="M 150 220 Q 300 120 500 140 T 700 320"
                stroke="#047857"
                strokeWidth="3"
                strokeDasharray="6,6"
                fill="none"
              />

              {/* Real-time Traffic Overlay (Congestion Red segment on surface road) */}
              {showTraffic && (
                <g>
                  {/* Heavy traffic zone near Nyayo roundabout */}
                  <path
                    d="M 280 225 L 370 250"
                    stroke="#ef4444"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.85"
                  />
                  <text x="300" y="275" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    +18m Jam (Uhuru Hwy)
                  </text>
                </g>
              )}

              {/* Weather Precipitation Overlay */}
              {showWeather && (
                <g>
                  <circle cx="580" cy="180" r="70" fill="#0284c7" fillOpacity="0.12" stroke="#38bdf8" strokeDasharray="4,4" />
                  <text x="540" y="185" fill="#7dd3fc" fontSize="9" fontFamily="sans-serif">
                    🌧️ Rainstorm (18mm/hr)
                  </text>
                </g>
              )}

              {/* Active Route Polyline */}
              {/* Route: Start at (120, 260) -> (240, 200) -> (450, 210) -> (660, 190) */}
              <path
                d="M 120 260 C 200 240, 260 170, 420 180 S 580 230, 680 180"
                stroke="url(#routeGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />

              {/* Origin Marker */}
              <g transform="translate(120, 260)">
                <circle r="8" fill="#0284c7" />
                <circle r="3" fill="#ffffff" />
                <text x="14" y="4" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  {selectedOrigin.name.split(' ')[0]} (Start)
                </text>
              </g>

              {/* Destination Marker */}
              <g transform="translate(680, 180)">
                <circle r="10" fill="#10b981" />
                <circle r="4" fill="#ffffff" />
                <text x="-120" y="-14" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  {selectedDest.name.split(' ')[0]} (Destination)
                </text>
              </g>

              {/* POI Markers along corridor */}
              {showPois &&
                pois.map((poi, idx) => {
                  const px = 260 + idx * 110;
                  const py = 150 + (idx % 2) * 80;
                  return (
                    <g key={poi.id} transform={`translate(${px}, ${py})`} className="cursor-pointer">
                      <circle r="6" fill="#a855f7" />
                      <circle r="2" fill="#ffffff" />
                      <text x="10" y="4" fill="#d8b4fe" fontSize="9" fontFamily="sans-serif">
                        {poi.name.split(' ')[0]} ({poi.rating}★)
                      </text>
                    </g>
                  );
                })}

              {/* Incident Markers */}
              {showIncidents &&
                incidents.map((inc, idx) => {
                  const ix = 320 + (idx % 3) * 110;
                  const iy = 240 + (idx % 2) * 50;
                  return (
                    <g key={inc.id} transform={`translate(${ix}, ${iy})`}>
                      <circle r="7" fill="#f59e0b" fillOpacity="0.3" className="animate-ping" />
                      <circle r="7" fill="#f59e0b" />
                      <text x="-4" y="4" fill="#ffffff" fontSize="8" fontWeight="bold">
                        !
                      </text>
                      <text x="10" y="3" fill="#fde68a" fontSize="8" fontFamily="monospace">
                        {inc.title.slice(0, 16)}...
                      </text>
                    </g>
                  );
                })}

              {/* Real-time Moving Vehicle Position */}
              {/* Interpolated position: Start (120, 260), Mid (420, 180), End (680, 180) */}
              {(() => {
                const cx = 120 + (680 - 120) * carProgress;
                const cy = 260 + Math.sin(carProgress * Math.PI) * -80 + (180 - 260) * carProgress;
                return (
                  <g transform={`translate(${cx}, ${cy})`}>
                    <circle r="14" fill="#38bdf8" fillOpacity="0.25" className="animate-pulse" />
                    <circle r="8" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                    <polygon points="0,-12 4,-5 -4,-5" fill="#0284c7" />
                    <text x="-30" y="24" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      {telemetry.currentSpeedKmh} km/h
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* Bottom HUD: Trip Summary & Community Incident Report Trigger */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md p-2.5 rounded border border-slate-800 text-xs">
              <div className="flex items-center space-x-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">ETA</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {telemetry.estimatedTimeArrival}
                  </span>
                </div>
                <div className="border-l border-slate-700 pl-3">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Remaining</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {telemetry.remainingMinutes} min ({telemetry.remainingDistanceKm} km)
                  </span>
                </div>
                <div className="border-l border-slate-700 pl-3 hidden md:block">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Corridor</span>
                  <span className="text-xs text-slate-200">Expressway Flyover</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCustomReportOpen(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  title="Report road incident (accidents, police radar, rain)"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Hazard</span>
                </button>

                {onExecuteFlow && (
                  <button
                    onClick={() => onExecuteFlow('flow_dynamic_reroute')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition-colors cursor-pointer"
                    title="Simulate sudden traffic incident & auto-reroute"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Auto-Reroute Flow</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Report Modal */}
      {customReportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-sm w-full p-4 space-y-3 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">Community Incident Ingestion</h4>
              </div>
              <button
                onClick={() => setCustomReportOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReport} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                  Incident Type (Real-Time Source 7)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['hazard', 'police', 'traffic', 'weather'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setReportType(t)}
                      className={`p-2 rounded border text-left capitalize font-medium cursor-pointer ${
                        reportType === t
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t === 'hazard' && '🚧 Road Hazard'}
                      {t === 'police' && '👮 Speed Camera'}
                      {t === 'traffic' && '🚗 Heavy Jam'}
                      {t === 'weather' && '🌧️ Rain / Flood'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Broken water pipe flooding right lane"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustomReportOpen(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded font-semibold cursor-pointer"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
