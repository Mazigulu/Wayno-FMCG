import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Zap, 
  Clock, 
  Lock, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Sliders, 
  FileText, 
  RefreshCw,
  Server,
  Layers,
  Search,
  CreditCard,
  Bike,
  Building,
  KeyRound,
  XCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  rateLimiter, 
  RateLimitPolicy, 
  RateLimitPolicyKey, 
  RateLimitDecision, 
  ClientPenaltyRecord 
} from '../services/rateLimiterService';

export const RateLimitingConsole: React.FC = () => {
  const [policies, setPolicies] = useState<RateLimitPolicy[]>(() => rateLimiter.getAllPolicies());
  const [telemetry, setTelemetry] = useState(() => rateLimiter.getTelemetry());
  const [penalties, setPenalties] = useState<ClientPenaltyRecord[]>(() => rateLimiter.getActivePenalties());

  // Interactive Simulator State
  const [simPolicy, setSimPolicy] = useState<RateLimitPolicyKey>('SEARCH_KEYSTROKE');
  const [simClientId, setSimClientId] = useState('retailer_sarah_baraka');
  const [simBurstCount, setSimBurstCount] = useState<number>(15);
  const [simResults, setSimResults] = useState<RateLimitDecision[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Policy editing state
  const [editingPolicyKey, setEditingPolicyKey] = useState<RateLimitPolicyKey | null>(null);
  const [editedLimit, setEditedLimit] = useState<number>(30);
  const [editedWindow, setEditedWindow] = useState<number>(60);

  // Auto-refresh telemetry every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(rateLimiter.getTelemetry());
      setPenalties(rateLimiter.getActivePenalties());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const results = rateLimiter.simulateBurst(simPolicy, simClientId, simBurstCount);
      setSimResults(results);
      setTelemetry(rateLimiter.getTelemetry());
      setPenalties(rateLimiter.getActivePenalties());
      setIsSimulating(false);
    }, 250);
  };

  const handleResetClient = (clientId: string) => {
    rateLimiter.resetClient(clientId);
    setTelemetry(rateLimiter.getTelemetry());
    setPenalties(rateLimiter.getActivePenalties());
    setSimResults([]);
  };

  const handleReleasePenalty = (clientId: string, policyKey: RateLimitPolicyKey) => {
    rateLimiter.releasePenalty(clientId, policyKey);
    setPenalties(rateLimiter.getActivePenalties());
    setTelemetry(rateLimiter.getTelemetry());
  };

  const handleSavePolicyEdit = (policyKey: RateLimitPolicyKey) => {
    rateLimiter.updatePolicy(policyKey, {
      limit: editedLimit,
      windowSec: editedWindow,
    });
    setPolicies(rateLimiter.getAllPolicies());
    setEditingPolicyKey(null);
  };

  const getAlgorithmBadge = (algo: string) => {
    switch (algo) {
      case 'TOKEN_BUCKET':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">TOKEN BUCKET</span>;
      case 'SLIDING_WINDOW_COUNTER':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">SLIDING WINDOW</span>;
      case 'LEAKY_BUCKET':
        return <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold">LEAKY BUCKET</span>;
      case 'PENALTY_BOX':
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">PENALTY BOX</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-4 text-slate-900 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h1 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Production Rate Limiting & Abuse Prevention Architecture
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-algorithm traffic policing at the API Gateway: Token Bucket, Sliding Window Counter, Leaky Bucket, and Circuit Breaker Penalty Box.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Gateway Policer: ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Inspected</span>
            <span className="text-xl font-bold font-mono text-slate-900">{telemetry.totalInspected.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-emerald-600 font-semibold uppercase block">Allowed (200 OK)</span>
            <span className="text-xl font-bold font-mono text-emerald-700">{telemetry.totalAllowed.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-rose-600 font-semibold uppercase block">Throttled (429)</span>
            <span className="text-xl font-bold font-mono text-rose-700">{telemetry.totalThrottled.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <span className="text-[10px] text-amber-600 font-semibold uppercase block">Penalty Box Quarantines</span>
            <span className="text-xl font-bold font-mono text-amber-700">{penalties.length}</span>
          </div>
        </div>
      </div>

      {/* Algorithm Philosophy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-blue-700">1. Token Bucket</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-1 rounded">BURSTY TRAFFIC</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Allows instant bursts up to capacity $C$, smoothly replenished at $r$ tokens/sec. Used for <strong>Search & Rider Telemetry</strong> to absorb rapid keystrokes without artificial lag.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-emerald-700">2. Sliding Window Counter</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono px-1 rounded">BORDER SMOOTHING</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Computes a weighted sum of previous and current window intervals. Eliminates the double-rate burst spike at window boundaries. Used for <strong>M-Pesa STK Pushes</strong>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-purple-700">3. Leaky Bucket</span>
            <span className="text-[10px] bg-purple-50 text-purple-800 font-mono px-1 rounded">BACKPRESSURE</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Maintains a constant outflow queue rate. Prevents concurrent checkout race conditions and bulk hoarding where multiple dukas lock out unga stock simultaneously.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-rose-700">4. Penalty Box (Tarpit)</span>
            <span className="text-[10px] bg-rose-50 text-rose-800 font-mono px-1 rounded">CIRCUIT BREAKER</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Escalates repeated limit violations to a hard quarantine lock. Quarantines brute-force courier delivery OTP guessing and malicious scrapers for 5 to 15 minutes.
          </p>
        </div>
      </div>

      {/* Interactive Traffic & Burst Simulator Bench */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Interactive Traffic Simulator & Burst Stress Test
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Live RFC-6585 Rate Limit Header Verification</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Endpoint Policy:</label>
            <select
              value={simPolicy}
              onChange={(e) => setSimPolicy(e.target.value as RateLimitPolicyKey)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:border-slate-800 focus:outline-none"
            >
              {policies.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name} ({p.algorithm})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Simulated Client Tenant ID / IP:</label>
            <input
              type="text"
              value={simClientId}
              onChange={(e) => setSimClientId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs focus:border-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Burst Traffic Load (Requests):</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={1}
                max={50}
                value={simBurstCount}
                onChange={(e) => setSimBurstCount(Number(e.target.value))}
                className="w-20 bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono text-xs focus:border-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold py-1.5 px-3 rounded text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isSimulating ? 'Firing Burst...' : 'Fire Traffic Burst'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulation Results Stream */}
        {simResults.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Burst Execution Stream ({simResults.length} Ingress Calls):</span>
              <button
                type="button"
                onClick={() => handleResetClient(simClientId)}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline cursor-pointer"
              >
                Reset Quota for {simClientId}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 font-mono text-[11px]">
              {simResults.map((res, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                    res.allowed ? 'bg-emerald-50/40 text-emerald-950' : 'bg-rose-50/70 text-rose-950'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">Req #{idx + 1}:</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                      res.allowed ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}>
                      {res.allowed ? '200 OK' : '429 THROTTLED'}
                    </span>
                    <span className="text-slate-600 text-[10px]">{res.policyKey}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] flex-wrap">
                    <span>X-RateLimit-Remaining: <strong>{res.headers['X-RateLimit-Remaining']}</strong></span>
                    {res.headers['Retry-After'] && (
                      <span className="text-rose-700 font-bold">
                        Retry-After: {res.headers['Retry-After']}s
                      </span>
                    )}
                    {res.penaltyBoxActive && (
                      <span className="bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded text-[9px]">
                        PENALTY BOX LOCKOUT
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Rate Limiting Policies Configuration Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Enforced Rate Limiting Policy Registry ({policies.length} Policies)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Distributed Gateway Enforcer</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">Policy & Protected Endpoint</th>
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3 text-right">Limit / Window</th>
                <th className="py-2.5 px-3 text-right">Burst / Inflow</th>
                <th className="py-2.5 px-3">Penalty Duration</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {policies.map((p) => {
                const isEditing = editingPolicyKey === p.key;

                return (
                  <tr key={p.key} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.description}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {getAlgorithmBadge(p.algorithm)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-1">
                          <input
                            type="number"
                            value={editedLimit}
                            onChange={(e) => setEditedLimit(Number(e.target.value))}
                            className="w-14 border border-slate-300 rounded px-1 text-right text-xs"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            value={editedWindow}
                            onChange={(e) => setEditedWindow(Number(e.target.value))}
                            className="w-14 border border-slate-300 rounded px-1 text-right text-xs"
                          />
                          <span>s</span>
                        </div>
                      ) : (
                        <span>{p.limit} req / {p.windowSec}s</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {p.burstCapacity ? `Max Burst: ${p.burstCapacity}` : 'Strict'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {p.penaltyDurationSec ? `${p.penaltyDurationSec}s lockout` : 'None'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={() => handleSavePolicyEdit(p.key)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-semibold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPolicyKey(null)}
                            className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPolicyKey(p.key);
                            setEditedLimit(p.limit);
                            setEditedWindow(p.windowSec);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold underline cursor-pointer"
                        >
                          Tune Limits
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Penalty Box Quarantine Desk */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Penalty Box Quarantine Desk ({penalties.length} Active Lockouts)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Automatic Circuit Breaker</span>
        </div>

        {penalties.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <div className="font-semibold text-slate-800">Clean Ingress Traffic</div>
            <div>No clients or IP addresses currently quarantined in the penalty box.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-900">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Quarantined Client / IP</th>
                  <th className="py-2.5 px-3">Policy Violated</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3 text-right">Time Remaining</th>
                  <th className="py-2.5 px-3 text-right">Release Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {penalties.map((pen, idx) => {
                  const remainingSec = Math.max(0, Math.ceil((pen.quarantinedUntil - Date.now()) / 1000));
                  return (
                    <tr key={idx} className="hover:bg-rose-50/40">
                      <td className="py-2.5 px-3 font-bold text-rose-900">{pen.clientId}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{pen.policyKey}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 text-xs">{pen.reason}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-700">{remainingSec}s</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleReleasePenalty(pen.clientId, pen.policyKey)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] font-semibold px-2.5 py-1 rounded cursor-pointer"
                        >
                          Release Quarantine
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
