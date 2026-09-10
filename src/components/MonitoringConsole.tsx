import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Terminal, 
  BarChart3, 
  Server, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Zap, 
  RefreshCw,
  Sliders,
  CheckCircle2,
  Database
} from 'lucide-react';

export const MonitoringConsole: React.FC = () => {
  const [rps, setRps] = useState<number>(8420);
  const [p95Latency, setP95Latency] = useState<number>(142);
  const [errorRate, setErrorRate] = useState<number>(0.018);
  const [trafficSimScale, setTrafficSimScale] = useState<number>(85); // 10% to 100% of 10K peak
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'grafana' | 'elk' | 'quicksight'>('grafana');

  // Live telemetry pulse
  useEffect(() => {
    const interval = setInterval(() => {
      const calculatedRps = Math.floor((trafficSimScale / 100) * 10000 + (Math.random() * 400 - 200));
      setRps(calculatedRps);
      setP95Latency(Math.floor(135 + (calculatedRps / 10000) * 35 + (Math.random() * 8 - 4)));
      setErrorRate(parseFloat((0.012 + Math.random() * 0.008).toFixed(3)));

      const endpoints = ['/v1/routes/plan', '/v1/telemetry/ping', '/v1/places/search', '/v1/rides/book'];
      const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
      const lat = Math.floor(12 + Math.random() * 45);
      const newLog = `{"timestamp":"${new Date().toISOString()}","service":"navigation-service","method":"POST","endpoint":"${ep}","status":200,"latency_ms":${lat},"trace_id":"trace_${Math.random().toString(36).substring(2, 9)}","region":"us-east-1"}`;
      
      setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    }, 1200);

    return () => clearInterval(interval);
  }, [trafficSimScale]);

  return (
    <div className="space-y-4">
      {/* Top Banner: Metrics & SLA Telemetry */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Monitoring & Analytics Dashboard (Box 8)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time Prometheus scraping, Grafana dashboards, ELK structured logs, and QuickSight KPIs.
            </p>
          </div>

          {/* Traffic Simulator Slider */}
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-700">Traffic Load:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={trafficSimScale}
              onChange={(e) => setTrafficSimScale(Number(e.target.value))}
              className="w-24 accent-slate-900 cursor-pointer"
            />
            <span className="font-mono font-bold text-slate-900 text-[11px]">
              {trafficSimScale}% ({rps} RPS)
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Peak Traffic Rate
            </span>
            <div className="text-lg font-bold font-mono text-slate-900">{rps.toLocaleString()} RPS</div>
            <span className="text-[10px] text-emerald-600 font-medium">Capacity Target: 10,000 RPS</span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              P95 Global Latency
            </span>
            <div className="text-lg font-bold font-mono text-emerald-600">{p95Latency} ms</div>
            <span className="text-[10px] text-slate-500 font-medium">SLA Limit: &lt; 200ms Target</span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Availability Uptime
            </span>
            <div className="text-lg font-bold font-mono text-slate-900">99.98%</div>
            <span className="text-[10px] text-emerald-600 font-medium">Target: 99.9% Multi-AZ</span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Error Rate (HTTP 5xx)
            </span>
            <div className="text-lg font-bold font-mono text-slate-900">{errorRate}%</div>
            <span className="text-[10px] text-slate-500 font-medium">Zero-Trust Istio Guard</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('grafana')}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'grafana'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Prometheus / Grafana Cluster Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('elk')}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'elk'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>ELK / OpenSearch Structured Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('quicksight')}
          className={`px-4 py-2 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'quicksight'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>QuickSight Business Impact (1M+ MAU)</span>
        </button>
      </div>

      {/* Tab 1: Prometheus & Grafana Cluster Telemetry */}
      {activeTab === 'grafana' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Kubernetes Pod Fleet Health */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Server className="w-4 h-4 text-slate-700" />
                <span>EKS Kubernetes Pod Fleet (18 Pods)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                ALL PODS RUNNING
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: 'navigation-service (FastAPI)', pods: '6/6 Pods', cpu: '48%', mem: '1.2 GB', az: 'Multi-AZ (1a, 1b, 1c)' },
                { name: 'realtime-service (Node.js)', pods: '4/4 Pods', cpu: '62%', mem: '840 MB', az: 'Multi-AZ (1a, 1b, 1c)' },
                { name: 'recommendation-service (Python)', pods: '3/3 Pods', cpu: '34%', mem: '2.1 GB', az: 'Multi-AZ (1a, 1b)' },
                { name: 'user-service (Spring Boot)', pods: '3/3 Pods', cpu: '22%', mem: '1.6 GB', az: 'Multi-AZ (1a, 1b)' },
                { name: 'notification-service (Node.js)', pods: '2/2 Pods', cpu: '18%', mem: '512 MB', az: 'Multi-AZ (1a, 1c)' },
              ].map((svc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">{svc.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{svc.az}</span>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <span className="text-slate-800 font-bold">{svc.pods}</span>
                    <span className="text-slate-400 block text-[10px]">CPU: {svc.cpu} · RAM: {svc.mem}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database & Cache Cluster Health */}
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-slate-700" />
                <span>Database & Cache Engine Metrics</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">AWS Managed</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">PostgreSQL + PostGIS (Aurora Multi-AZ)</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">4ms Latency</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Active connections: 42/200 · Continuous backup RPO &lt; 1s · Automatic failover ready.
                </p>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Redis ElastiCache Cluster (6 Shards)</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">&lt; 1ms Latency</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Hit ratio: 94.8% · Memory usage: 4.2 GB / 16 GB · 50K concurrent driver geofences.
                </p>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">TimescaleDB Hypertables (Telemetry)</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">3ms Write</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  1Hz GPS ingestion rate: 45,000 writes/s · 92% compression footprint reduction.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ELK Structured Logs */}
      {activeTab === 'elk' && (
        <div className="bg-slate-950 rounded-md border border-slate-800 p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>ELK / OpenSearch Structured JSON Stream</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Live Ingestion Lag: &lt; 120ms
            </span>
          </div>

          <div className="font-mono text-[11px] text-slate-300 space-y-1.5 max-h-96 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 font-mono text-[10px] leading-relaxed break-all">
                <span className="text-emerald-400 font-bold">INFO: </span>
                <span className="text-slate-300">{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: QuickSight Business Impact */}
      {activeTab === 'quicksight' && (
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">QuickSight Executive KPIs (Target V1 Scale)</h3>
              <p className="text-xs text-slate-500">Monthly Active Users (1M+ MAU), Time Saved & Eco-Impact</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              SPICE Engine Synchronized
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-blue-50 border border-blue-200 space-y-1">
              <span className="text-[10px] text-blue-700 font-bold uppercase block">Total Active Commuters</span>
              <div className="text-xl font-bold font-mono text-blue-950">1,240,892</div>
              <span className="text-[10px] text-blue-700">+14.2% MoM growth across urban corridors</span>
            </div>

            <div className="p-3 rounded bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Commuter Hours Saved</span>
              <div className="text-xl font-bold font-mono text-emerald-950">284,510 hrs</div>
              <span className="text-[10px] text-emerald-700">Via Bedrock AI proactive dynamic rerouting</span>
            </div>

            <div className="p-3 rounded bg-purple-50 border border-purple-200 space-y-1">
              <span className="text-[10px] text-purple-700 font-bold uppercase block">CO2 Emissions Avoided</span>
              <div className="text-xl font-bold font-mono text-purple-950">142.8 Metric Tons</div>
              <span className="text-[10px] text-purple-700">Through multi-modal transit & EV routing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
