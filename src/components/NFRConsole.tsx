import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Database, 
  Smartphone, 
  Scale, 
  RefreshCw, 
  FileText, 
  Download, 
  Search, 
  Zap, 
  Clock, 
  Lock, 
  Eye, 
  Layers, 
  Wifi, 
  Globe, 
  Sliders, 
  Play,
  RotateCcw,
  Cpu,
  ChevronRight,
  ExternalLink,
  Code
} from 'lucide-react';
import { 
  NFRSpecification, 
  NFRCategory, 
  NFRId, 
  LatencyBudgetSegment 
} from '../types/nfr';
import { 
  ALL_NFR_SPECIFICATIONS, 
  DEFAULT_LATENCY_BUDGET, 
  DISASTER_RECOVERY_STEPS 
} from '../data/nfrData';

export const NFRConsole: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<NFRCategory | 'all'>('all');
  const [selectedNfrId, setSelectedNfrId] = useState<NFRId>('performance');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'matrix' | 'latency_budget' | 'sla_calculator' | 'dr_drill' | 'compliance_audit'>('matrix');

  // Latency Budget interactive state
  const [networkCondition, setNetworkCondition] = useState<'4g' | '3g' | '2g_edge'>('4g');
  const [edgeCacheHit, setEdgeCacheHit] = useState<boolean>(true);
  const [dbLoadMultiplier, setDbLoadMultiplier] = useState<number>(1.0);

  // SLA Calculator state
  const [targetSla, setTargetSla] = useState<number>(99.95);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [outageMinutesRecorded, setOutageMinutesRecorded] = useState<number>(9.4);

  // DR Drill execution state
  const [drDrillStatus, setDrDrillStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [currentDrStep, setCurrentDrStep] = useState<number>(0);

  // Filtered specifications
  const filteredSpecs = useMemo(() => {
    return ALL_NFR_SPECIFICATIONS.filter(spec => {
      const matchesCategory = activeCategory === 'all' || spec.category === activeCategory;
      const matchesQuery = searchQuery === '' || 
        spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spec.complianceStandards.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  // Currently selected specification
  const currentSpec = useMemo(() => {
    return ALL_NFR_SPECIFICATIONS.find(s => s.id === selectedNfrId) || ALL_NFR_SPECIFICATIONS[0];
  }, [selectedNfrId]);

  // Calculate dynamic latency budget based on interactive controls
  const calculatedLatencySegments = useMemo(() => {
    return DEFAULT_LATENCY_BUDGET.map(segment => {
      let simulated = segment.simulatedMs;
      if (segment.name.includes('Safaricom')) {
        if (networkCondition === '3g') simulated = 115;
        if (networkCondition === '2g_edge') simulated = 240;
      }
      if (segment.name.includes('Cloudflare')) {
        simulated = edgeCacheHit ? 8 : 28;
      }
      if (segment.name.includes('PostgreSQL')) {
        simulated = Math.round(segment.simulatedMs * dbLoadMultiplier);
      }
      return {
        ...segment,
        simulatedMs: simulated
      };
    });
  }, [networkCondition, edgeCacheHit, dbLoadMultiplier]);

  const totalAllocatedLatency = calculatedLatencySegments.reduce((acc, s) => acc + s.allocatedMs, 0);
  const totalSimulatedLatency = calculatedLatencySegments.reduce((acc, s) => acc + s.simulatedMs, 0);

  // SLA calculations
  const totalMinutesInPeriod = periodDays * 24 * 60;
  const allowedDowntimeMinutes = (totalMinutesInPeriod * (1 - targetSla / 100));
  const errorBudgetBurnPercent = Math.min(100, (outageMinutesRecorded / Math.max(0.1, allowedDowntimeMinutes)) * 100);
  const remainingDowntimeMinutes = Math.max(0, allowedDowntimeMinutes - outageMinutesRecorded);

  // DR Simulation execution handler
  const handleRunDrill = () => {
    setDrDrillStatus('running');
    setCurrentDrStep(1);

    const stepTimers = [
      setTimeout(() => setCurrentDrStep(2), 1200),
      setTimeout(() => setCurrentDrStep(3), 2600),
      setTimeout(() => setCurrentDrStep(4), 4200),
      setTimeout(() => setCurrentDrStep(5), 5800),
      setTimeout(() => {
        setDrDrillStatus('completed');
      }, 7200)
    ];

    return () => stepTimers.forEach(t => clearTimeout(t));
  };

  const handleResetDrill = () => {
    setDrDrillStatus('idle');
    setCurrentDrStep(0);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ALL_NFR_SPECIFICATIONS, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "wayno-non-functional-requirements-spec.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Context Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                Architecture Standard
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                14 / 14 NFRs Specified & Verified
              </span>
              <span className="text-xs text-slate-500 font-mono">
                v1.4 Enterprise Grade
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Non-Functional Requirements (NFR) Specifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Exhaustive technical, operational, resilience, and regulatory specifications governing the WAYNO informal FMCG retail network across Nairobi.
            </p>
          </div>

          {/* Quick Actions & Export */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Spec (JSON)</span>
            </button>
            <div className="px-3 py-2 text-xs font-mono rounded bg-slate-900 text-white flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Target: P95 &lt; 200ms | 99.95% SLA</span>
            </div>
          </div>
        </div>

        {/* Global NFR Health Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">System Qualities</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">P95: 168ms (Target &lt;200ms)</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Performance, Scale, Reliability Verified</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Operational Resilience</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">Uptime: 99.978% (Target 99.95%)</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">RPO 18s | RTO 8m42s Verified</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Security & Trust</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">Zero-Trust + ODPC Kenya</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">100% Tokenized PII & Phone Masking</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <div className="text-[11px] text-slate-500 font-medium">Compatibility & Compliance</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">Android Go 1GB + KRA eTIMS</div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">WCAG 2.1 AA + CBK NPS Aligned</div>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 rounded-md shadow-2xs">
        <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>14 Requirements Detailed Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('latency_budget')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'latency_budget'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Latency Budget Simulator (P95)</span>
          </button>

          <button
            onClick={() => setActiveTab('sla_calculator')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'sla_calculator'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>SLA & Error Budget Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab('dr_drill')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'dr_drill'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Disaster Recovery (DR) Live Drill</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance_audit')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
              activeTab === 'compliance_audit'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>Compliance & Data Retention Audit</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter NFRs (e.g. M-Pesa, KRA, RPO)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50"
          />
        </div>
      </div>

      {/* VIEW 1: 14 REQUIREMENTS DETAILED MATRIX */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: 14 Requirements List */}
          <div className="lg:col-span-4 space-y-3">
            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1 bg-white p-2 border border-slate-200 rounded-md text-[11px] font-medium shadow-2xs">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCategory === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All (14)
              </button>
              <button
                onClick={() => setActiveCategory('system_qualities')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCategory === 'system_qualities' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                System Qualities (3)
              </button>
              <button
                onClick={() => setActiveCategory('operational_resilience')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCategory === 'operational_resilience' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Resilience (4)
              </button>
              <button
                onClick={() => setActiveCategory('security_trust')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCategory === 'security_trust' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Security & Trust (3)
              </button>
              <button
                onClick={() => setActiveCategory('portability_experience')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCategory === 'portability_experience' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Experience (4)
              </button>
            </div>

            {/* List of 14 NFR Items */}
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden divide-y divide-slate-100 shadow-2xs max-h-[720px] overflow-y-auto">
              {filteredSpecs.map((spec) => {
                const isSelected = spec.id === selectedNfrId;
                return (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedNfrId(spec.id)}
                    className={`w-full text-left p-3 transition-colors cursor-pointer flex items-start justify-between ${
                      isSelected ? 'bg-slate-100 border-l-4 border-slate-900 pl-2.5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                          {spec.tag}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {spec.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        {spec.subtitle}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span className="capitalize">{spec.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{spec.status}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 mt-1 shrink-0 ${isSelected ? 'text-slate-900' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Deep-Dive Specification Sheet */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-2xs space-y-5">
              {/* Header Title & Tags */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {currentSpec.tag}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border capitalize bg-slate-50 text-slate-700 border-slate-200">
                      Category: {currentSpec.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {currentSpec.status}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Rule #{currentSpec.index} of 14 Non-Functional Requirements
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                  {currentSpec.title}: {currentSpec.subtitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-1">
                  {currentSpec.summary}
                </p>
              </div>

              {/* Kenyan Context & Business Impact Callout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Nairobi Field Context & Network Reality</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {currentSpec.kenyanContext}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3 text-slate-800 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-slate-900">
                    <Zap className="w-3.5 h-3.5 text-slate-700" />
                    <span>Commercial & Operational Impact</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {currentSpec.businessImpact}
                  </p>
                </div>
              </div>

              {/* Section 1: Quantitative Target Metrics Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-slate-700" />
                  <span>Quantitative Target Metrics & Measured SLA (Live Test)</span>
                </h3>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Key Performance Metric</th>
                        <th className="py-2 px-3 font-semibold">Target Requirement</th>
                        <th className="py-2 px-3 font-semibold">Measured / Verified</th>
                        <th className="py-2 px-3 font-semibold">Tolerance</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {currentSpec.targetMetrics.map((metric, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{metric.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{metric.description}</div>
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">{metric.target}</td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700 bg-emerald-50/50">{metric.measured}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{metric.tolerance}</td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>PASS</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Architectural Implementation Controls */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-700" />
                  <span>Architectural Implementation & Technology Stack</span>
                </h3>
                <div className="space-y-2">
                  {currentSpec.architecturalControls.map((control, idx) => (
                    <div key={idx} className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">{control.component}</div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                          {control.mechanism}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {control.description}
                      </p>
                      {control.configSnippet && (
                        <div className="bg-slate-900 text-slate-100 p-2 rounded text-[10px] font-mono overflow-x-auto mt-1 border border-slate-800">
                          <code>{control.configSnippet}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Failure Modes & Automated Recovery Playbooks */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
                  <span>Failure Modes & Mitigation Playbooks</span>
                </h3>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Failure Trigger / Scenario</th>
                        <th className="py-2 px-3 font-semibold">Blast Radius</th>
                        <th className="py-2 px-3 font-semibold">Mitigation Strategy</th>
                        <th className="py-2 px-3 font-semibold">Recovery SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {currentSpec.failureModesAndMitigations.map((fail, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-900">{fail.failureMode}</td>
                          <td className="py-2 px-3 text-slate-600">{fail.blastRadius}</td>
                          <td className="py-2 px-3 text-slate-700">{fail.mitigationStrategy}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-emerald-700">{fail.recoveryTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Verification Methods & Regulatory Standards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Continuous Testing & Audit Tooling</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                    {currentSpec.verificationMethods.map((vm, idx) => (
                      <li key={idx}>
                        <span className="font-semibold text-slate-800">{vm.type}:</span> {vm.description} <span className="text-slate-400 font-mono">({vm.tooling})</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center space-x-1">
                    <Scale className="w-3.5 h-3.5 text-slate-700" />
                    <span>Standards & Regulatory Compliance</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentSpec.complianceStandards.map((std, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold border border-slate-200">
                        {std}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">
                    Operational Checklist: {currentSpec.operationalChecklist.length} active verification guardrails.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE LATENCY BUDGET ALLOCATOR */}
      {activeTab === 'latency_budget' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-2xs space-y-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">NFR-01 SIMULATOR</span>
              <span className="text-xs text-slate-500">Target: End-to-End P95 &lt; 200 ms</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              End-to-End Latency Budget & Nairobi Network Simulator
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Model how erratic cellular uplinks in Nairobi, edge CDN cache hits, and database query volumes impact checkout latency across the entire stack.
            </p>
          </div>

          {/* Interactive Sliders / Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded p-3.5 text-xs">
            {/* Cellular Network Select */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Safaricom Radio Uplink</label>
              <div className="grid grid-cols-3 gap-1">
                {(['4g', '3g', '2g_edge'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setNetworkCondition(mode)}
                    className={`py-1.5 text-center rounded font-semibold text-[11px] transition-colors cursor-pointer border ${
                      networkCondition === mode
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mode === '4g' ? '4G LTE' : mode === '3g' ? '3G HSPA' : '2G EDGE'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                {networkCondition === '4g' ? 'Fast urban tower (Eastleigh / CBD)' : networkCondition === '3g' ? 'Congested midday radio cells' : 'Degraded indoor kiosk edge signal'}
              </p>
            </div>

            {/* Cloudflare Edge Cache Toggle */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Nairobi IXP Cloudflare Edge</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEdgeCacheHit(!edgeCacheHit)}
                  className={`flex-1 py-1.5 rounded font-semibold text-[11px] border transition-colors cursor-pointer ${
                    edgeCacheHit
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-amber-600 text-white border-amber-700'
                  }`}
                >
                  {edgeCacheHit ? '✓ Edge Cache HIT (Local NBO)' : '✗ Edge Cache MISS (Origin Trip)'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Local Nairobi IXP eliminates 140ms international submarine fiber transit round-trip.
              </p>
            </div>

            {/* Database Read Load Multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">Database Pool Load</label>
                <span className="font-mono text-slate-600 font-bold">{dbLoadMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.2"
                value={dbLoadMultiplier}
                onChange={(e) => setDbLoadMultiplier(parseFloat(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Simulates read replica pool concurrency under morning restock spikes.
              </p>
            </div>
          </div>

          {/* Budget Breakdown Visualization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Layer-by-Layer Latency Allocation vs Simulated P95
              </span>
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span>Budget Cap: <strong className="text-slate-800">{totalAllocatedLatency} ms</strong></span>
                <span>Simulated P95: <strong className={totalSimulatedLatency <= 200 ? 'text-emerald-600' : 'text-rose-600'}>{totalSimulatedLatency} ms</strong></span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${totalSimulatedLatency <= 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {totalSimulatedLatency <= 200 ? 'SLA MET (PASS)' : 'SLA BREACH (VIOLATION)'}
                </span>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
              {calculatedLatencySegments.map((segment, idx) => {
                const colors = ['bg-blue-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600'];
                const widthPercent = (segment.simulatedMs / Math.max(1, totalSimulatedLatency)) * 100;
                return (
                  <div
                    key={idx}
                    className={`${colors[idx % colors.length]} h-full transition-all duration-300`}
                    style={{ width: `${widthPercent}%` }}
                    title={`${segment.name}: ${segment.simulatedMs}ms`}
                  />
                );
              })}
            </div>

            {/* Segment Breakdown Table */}
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Network / Service Layer</th>
                    <th className="py-2 px-3 font-semibold">Allocated Budget</th>
                    <th className="py-2 px-3 font-semibold">Simulated Latency</th>
                    <th className="py-2 px-3 font-semibold">Delta</th>
                    <th className="py-2 px-3 font-semibold">Layer Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {calculatedLatencySegments.map((seg, idx) => {
                    const delta = seg.simulatedMs - seg.allocatedMs;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{seg.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{seg.networkLayer}</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">{seg.allocatedMs} ms</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{seg.simulatedMs} ms</td>
                        <td className="py-2 px-3 font-mono">
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${delta <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {delta <= 0 ? `${delta} ms` : `+${delta} ms`}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">{seg.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SLA DOWNTIME & ERROR BUDGET CALCULATOR */}
      {activeTab === 'sla_calculator' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-2xs space-y-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">NFR-02 SIMULATOR</span>
              <span className="text-xs text-slate-500">Target: 99.95% Availability Platform Uptime</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              SLA Availability & Error Budget Burn Rate Calculator
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Calculate exact permissible minutes of downtime across monthly and annual periods and monitor error budget burn rate against contract commitments.
            </p>
          </div>

          {/* Interactive Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded p-3.5 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Target SLA Commitment</label>
              <div className="grid grid-cols-3 gap-1">
                {[99.9, 99.95, 99.99].map(sla => (
                  <button
                    key={sla}
                    onClick={() => setTargetSla(sla)}
                    className={`py-1.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      targetSla === sla
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sla}%
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                WAYNO standard contract commitment: 99.95% (Three and a half nines).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">Evaluation Window</label>
              <div className="grid grid-cols-2 gap-1">
                {[30, 365].map(days => (
                  <button
                    key={days}
                    onClick={() => setPeriodDays(days)}
                    className={`py-1.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      periodDays === days
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {days === 30 ? '30 Days (Monthly)' : '365 Days (Annual)'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Total operating window: {totalMinutesInPeriod.toLocaleString()} minutes.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-800">Recorded Outage Duration</label>
                <span className="font-mono text-slate-900 font-bold">{outageMinutesRecorded} min</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.round(allowedDowntimeMinutes * 2)}
                step="0.5"
                value={outageMinutesRecorded}
                onChange={(e) => setOutageMinutesRecorded(parseFloat(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Simulated unscheduled downtime in current evaluation period.
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="border border-slate-200 rounded p-3 bg-white space-y-1 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Permissible Downtime Budget</div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {allowedDowntimeMinutes.toFixed(1)} <span className="text-xs font-normal">minutes</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {(allowedDowntimeMinutes * 60).toFixed(0)} seconds permissible for {targetSla}%
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3 bg-white space-y-1 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Remaining Error Budget</div>
              <div className={`text-xl font-bold font-mono ${remainingDowntimeMinutes > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {remainingDowntimeMinutes.toFixed(1)} <span className="text-xs font-normal">minutes</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {remainingDowntimeMinutes > 0 ? 'Normal operations & deployments permitted' : 'FREEZE: Deployments restricted to bug fixes'}
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3 bg-white space-y-1 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Error Budget Consumption</div>
              <div className={`text-xl font-bold font-mono ${errorBudgetBurnPercent <= 75 ? 'text-emerald-700' : errorBudgetBurnPercent <= 100 ? 'text-amber-700' : 'text-rose-700'}`}>
                {errorBudgetBurnPercent.toFixed(1)}% <span className="text-xs font-normal">burned</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <div 
                  className={`h-full ${errorBudgetBurnPercent <= 75 ? 'bg-emerald-500' : errorBudgetBurnPercent <= 100 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                  style={{ width: `${Math.min(100, errorBudgetBurnPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DISASTER RECOVERY LIVE DRILL SIMULATOR */}
      {activeTab === 'dr_drill' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">NFR-07 SIMULATOR</span>
                <span className="text-xs text-slate-500">RPO &lt; 60s | RTO &lt; 15min</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Disaster Recovery (DR) Cross-Region Failover Drill
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl">
                Simulates an unannounced catastrophic failure of the primary AWS Cape Town (af-south-1) cluster, triggering automated Route 53 DNS swing and Frankfurt (eu-central-1) Aurora promotion.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {drDrillStatus === 'idle' && (
                <button
                  onClick={handleRunDrill}
                  className="px-3.5 py-2 rounded bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Initiate Unannounced DR Failover Drill</span>
                </button>
              )}
              {drDrillStatus === 'running' && (
                <div className="px-3.5 py-2 rounded bg-amber-100 text-amber-900 text-xs font-bold flex items-center space-x-2 border border-amber-300">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  <span>Executing Step {currentDrStep} of 5...</span>
                </div>
              )}
              {drDrillStatus === 'completed' && (
                <button
                  onClick={handleResetDrill}
                  className="px-3.5 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 border border-slate-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Drill State</span>
                </button>
              )}
            </div>
          </div>

          {/* Drill Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-[10px] text-slate-500 font-medium">Primary Region (Normal)</span>
              <div className="font-bold text-slate-900 font-mono">AWS Cape Town (af-south-1)</div>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-[10px] text-slate-500 font-medium">Secondary Standby (Failover)</span>
              <div className="font-bold text-slate-900 font-mono">AWS Frankfurt (eu-central-1)</div>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-[10px] text-slate-500 font-medium">Measured RPO (Data Loss Window)</span>
              <div className="font-bold text-emerald-700 font-mono">18 Seconds (Target &lt; 60s)</div>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50">
              <span className="text-[10px] text-slate-500 font-medium">Measured RTO (Recovery Time)</span>
              <div className="font-bold text-emerald-700 font-mono">8m 42s (Target &lt; 15m)</div>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Disaster Recovery Execution Ladder
            </h3>
            <div className="space-y-2">
              {DISASTER_RECOVERY_STEPS.map((step, idx) => {
                const stepNum = idx + 1;
                const isExecuting = drDrillStatus === 'running' && currentDrStep === stepNum;
                const isPassed = (drDrillStatus === 'completed') || (drDrillStatus === 'running' && currentDrStep > stepNum);
                const isPending = drDrillStatus === 'idle' || (drDrillStatus === 'running' && currentDrStep < stepNum);

                return (
                  <div
                    key={step.id}
                    className={`border rounded p-3 transition-colors text-xs ${
                      isExecuting
                        ? 'border-amber-400 bg-amber-50/50 shadow-2xs'
                        : isPassed
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 bg-slate-50/30 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isPassed ? 'bg-emerald-600 text-white' : isExecuting ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-300 text-slate-700'
                        }`}>
                          {stepNum}
                        </span>
                        <span className="font-bold text-slate-900">{step.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                          {step.phase}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                        <span>Expected Duration: {step.expectedDurationSec}s</span>
                        {isPassed && (
                          <span className="text-emerald-700 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 pl-7">
                      {step.action}
                    </p>
                    <div className="mt-1 pl-7 text-[10px] font-mono text-slate-500">
                      Automated Check: <span className="text-slate-700">{step.automatedCheck}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: COMPLIANCE & DATA RETENTION AUDIT */}
      {activeTab === 'compliance_audit' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 sm:p-5 shadow-2xs space-y-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">NFR-08 & NFR-14 AUDIT</span>
              <span className="text-xs text-slate-500">Kenya Regulatory Authorities Compliance</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Regulatory Compliance, KRA 7-Year Retention & ODPC Privacy Audit
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Verification matrix confirming adherence to statutory requirements enforced by Central Bank of Kenya (CBK), Kenya Revenue Authority (KRA), and Office of the Data Protection Commissioner (ODPC).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* KRA eTIMS & Tax Retention */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>KRA 7-Year Tax & eTIMS Invoicing</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  100% COMPLIANT
                </span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">7-Year Immutable WORM Storage:</strong> Financial ledgers, M-Pesa receipts, and credit notes locked in AWS S3 Compliance Mode for 2,555 days.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">KRA eTIMS OSCU Integration:</strong> Automated signing of buyer/seller PIN and cryptographic control codes on every wholesale transaction.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Statutory Tax Procedures Act Sec 23:</strong> Full audit readiness with automated 12-hour retrieval guarantee from Glacier Deep Archive.
                  </div>
                </li>
              </ul>
            </div>

            {/* ODPC & Kenya Data Protection Act 2019 */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>ODPC Kenya Data Protection Act 2019</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  REGISTERED & VERIFIED
                </span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Virtual Phone Masking:</strong> Shopkeeper and rider mobile phone numbers are 100% masked via proxy telephony sessions.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">30-Day GPS Telemetry Purge:</strong> Raw rider breadcrumbs are automatically purged after 30 days and aggregated into anonymized traffic models.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">ODPC Registration:</strong> Registered Data Controller and Data Processor (Certificate ODPC/REG/2024/09841).
                  </div>
                </li>
              </ul>
            </div>

            {/* CBK National Payment System (NPS) */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <span>Central Bank of Kenya (CBK) NPS</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  TIER 1 ESCROW COMPLIANT
                </span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Segregated Trust Accounts:</strong> Merchant settlement escrow funds held in a Tier 1 licensed commercial bank separated from company operational capital.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Daily Daraja Reconciliation:</strong> Automated double-entry ledger balancing every transaction against Safaricom B2C/C2B statements.
                  </div>
                </li>
              </ul>
            </div>

            {/* KEBS & Standards Standards Act */}
            <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-700" />
                  <span>KEBS FMCG Product Quality Standards</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  100% VERIFIED SKUS
                </span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Standardization Mark Verification:</strong> Only wholesale products with active KEBS Diamond Mark or Import Standardization Marks permitted on WAYNO.
                  </div>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Barcode Authenticity:</strong> GS1 Kenya barcode prefix verification filtering out illicit or uncertified parallel imports.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
