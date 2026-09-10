import React, { useState } from 'react';
import { 
  Cpu, 
  Zap, 
  Navigation, 
  Activity, 
  Layers, 
  Sparkles, 
  Server, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { ArchitectureBlueprint } from './ArchitectureBlueprint';
import { FlowExecutionRunner } from './FlowExecutionRunner';
import { NavigationAssistant } from './NavigationAssistant';
import { MonitoringConsole } from './MonitoringConsole';
import { NFRConsole } from './NFRConsole';
import { RepositoryStructureExplorer } from './RepositoryStructureExplorer';
import { FolderTree } from 'lucide-react';

export const ArchitectureWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'flows' | 'navigation' | 'monitoring' | 'nfr' | 'repository'>('flows');
  const [selectedFlowId, setSelectedFlowId] = useState<string>('flow_route_planning');

  const handleLaunchFlow = (flowId: string) => {
    setSelectedFlowId(flowId);
    setActiveTab('flows');
  };

  return (
    <div className="space-y-4">
      {/* Workspace Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Main Perspective Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('flows')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors cursor-pointer ${
                activeTab === 'flows'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Execute Architecture Flows (6 Master Flows)</span>
            </button>

            <button
              onClick={() => setActiveTab('blueprint')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors cursor-pointer ${
                activeTab === 'blueprint'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Interactive 9-Box Blueprint</span>
            </button>

            <button
              onClick={() => setActiveTab('navigation')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors cursor-pointer ${
                activeTab === 'navigation'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Navigation className="w-4 h-4 text-sky-400" />
              <span>AI Navigation & Bedrock Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('monitoring')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors cursor-pointer ${
                activeTab === 'monitoring'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Observability & Monitoring</span>
            </button>

            <button
              onClick={() => setActiveTab('nfr')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors cursor-pointer ${
                activeTab === 'nfr'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Non-Functional Requirements (14 Specs)</span>
            </button>

            <button
              onClick={() => setActiveTab('repository')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors cursor-pointer ${
                activeTab === 'repository'
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FolderTree className="w-4 h-4 text-amber-400" />
              <span>Repository Monorepo Layout</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Target V1: 10K RPS / &lt;200ms P95</span>
          </div>
        </div>
      </div>

      {/* Render Active View */}
      <div>
        {activeTab === 'flows' && (
          <FlowExecutionRunner initialFlowId={selectedFlowId} />
        )}

        {activeTab === 'blueprint' && (
          <ArchitectureBlueprint onSelectFlow={handleLaunchFlow} />
        )}

        {activeTab === 'navigation' && (
          <NavigationAssistant onExecuteFlow={handleLaunchFlow} />
        )}

        {activeTab === 'monitoring' && (
          <MonitoringConsole />
        )}

        {activeTab === 'nfr' && (
          <NFRConsole />
        )}

        {activeTab === 'repository' && (
          <RepositoryStructureExplorer />
        )}
      </div>
    </div>
  );
};
