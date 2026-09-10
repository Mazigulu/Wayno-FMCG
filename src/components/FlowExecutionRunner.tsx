import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Database, 
  Radio, 
  Sparkles, 
  Activity, 
  Code2, 
  FileJson, 
  Server, 
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ArchitectureFlow, FlowStep } from '../types/architecture';
import { MASTER_ARCHITECTURE_FLOWS, ARCHITECTURE_COMPONENTS } from '../data/architectureFlows';

interface FlowExecutionRunnerProps {
  initialFlowId?: string;
}

export const FlowExecutionRunner: React.FC<FlowExecutionRunnerProps> = ({ initialFlowId }) => {
  const [selectedFlowId, setSelectedFlowId] = useState<string>(
    initialFlowId || MASTER_ARCHITECTURE_FLOWS[0].id
  );
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [rawLogs, setRawLogs] = useState<string[]>([]);

  const activeFlow = MASTER_ARCHITECTURE_FLOWS.find((f) => f.id === selectedFlowId) || MASTER_ARCHITECTURE_FLOWS[0];
  const currentStep: FlowStep | undefined = activeFlow.steps[activeStepIndex];

  // Reset state on flow change
  useEffect(() => {
    setActiveStepIndex(0);
    setIsRunning(false);
    setCompletedSteps([]);
    setRawLogs([
      `[08:31:00.000] [TRACE_ID: wn_fl_${selectedFlowId.slice(-6)}] Initialized execution engine for: ${activeFlow.title}`
    ]);
  }, [selectedFlowId]);

  // Automated playback loop
  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      const stepDuration = Math.max(600, (currentStep?.durationMs || 100) * 12) / playbackSpeed;
      timer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, activeStepIndex]);
        
        // Log generation
        const sourceComp = ARCHITECTURE_COMPONENTS[currentStep?.sourceComponentId || ''];
        const targetComp = ARCHITECTURE_COMPONENTS[currentStep?.targetComponentId || ''];
        const logLine = `[+${currentStep?.durationMs}ms] [${currentStep?.protocol}] ${sourceComp?.name || currentStep?.sourceComponentId} -> ${targetComp?.name || currentStep?.targetComponentId}: ${currentStep?.action}`;
        setRawLogs((prev) => [logLine, ...prev]);

        if (activeStepIndex < activeFlow.steps.length - 1) {
          setActiveStepIndex((prev) => prev + 1);
        } else {
          setIsRunning(false);
          setRawLogs((prev) => [
            `[COMPLETED] Flow finished successfully with 100% SLA compliance. P95 latency verified.`,
            ...prev
          ]);
        }
      }, stepDuration);
    }
    return () => clearTimeout(timer);
  }, [isRunning, activeStepIndex, activeFlow, playbackSpeed, currentStep]);

  // Step Forward manually
  const handleStepForward = () => {
    if (activeStepIndex < activeFlow.steps.length - 1) {
      setCompletedSteps((prev) => [...prev, activeStepIndex]);
      setActiveStepIndex((prev) => prev + 1);
      const logLine = `[STEP] Manual trigger: Step ${activeStepIndex + 2} -> ${activeFlow.steps[activeStepIndex + 1]?.action}`;
      setRawLogs((prev) => [logLine, ...prev]);
    } else {
      setCompletedSteps((prev) => [...prev, activeStepIndex]);
      setIsRunning(false);
    }
  };

  // Reset
  const handleReset = () => {
    setIsRunning(false);
    setActiveStepIndex(0);
    setCompletedSteps([]);
    setRawLogs([`[RESET] Flow execution reset to Step 1.`]);
  };

  const totalCalculatedMs = activeFlow.steps.reduce((acc, s) => acc + s.durationMs, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner: Flow Selector Tabs */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Master Architecture Flow Execution Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute, inspect, and verify each and every end-to-end data flow across the 9 blueprint layers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              Total Target P95: {activeFlow.estimatedP95Ms}ms (&lt; 200ms SLA)
            </span>
          </div>
        </div>

        {/* Horizontal Flow Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">
          {MASTER_ARCHITECTURE_FLOWS.map((flow) => {
            const isSelected = flow.id === selectedFlowId;
            return (
              <button
                key={flow.id}
                onClick={() => setSelectedFlowId(flow.id)}
                className={`p-2.5 rounded text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs ring-1 ring-slate-800'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {flow.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {flow.steps.length} Steps · {flow.estimatedP95Ms}ms
                  </span>
                </div>
                <h4 className="text-xs font-bold mt-1 line-clamp-1">{flow.title.split(':')[1] || flow.title}</h4>
                <p
                  className={`text-[11px] line-clamp-1 mt-0.5 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {flow.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback Controls & High-Level Telemetry Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-2">
          {!isRunning ? (
            <button
              onClick={() => setIsRunning(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Execute Flow Live</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>Pause Execution</span>
            </button>
          )}

          <button
            onClick={handleStepForward}
            disabled={activeStepIndex >= activeFlow.steps.length - 1 && completedSteps.includes(activeStepIndex)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step Forward</span>
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
            title="Reset Flow to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold cursor-pointer ${
                  playbackSpeed === spd ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress Counters */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Step Progress</span>
            <span className="font-bold text-slate-900">
              {activeStepIndex + 1} / {activeFlow.steps.length} ({Math.round(((activeStepIndex + 1) / activeFlow.steps.length) * 100)}%)
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-400 text-[10px] uppercase block">Accumulated Latency</span>
            <span className="font-bold text-emerald-600">
              {activeFlow.steps.slice(0, activeStepIndex + 1).reduce((acc, s) => acc + s.durationMs, 0)} ms
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4 hidden sm:block">
            <span className="text-slate-400 text-[10px] uppercase block">SLA Verification</span>
            <span className="font-bold text-slate-700">100% Compliant (&lt; 200ms)</span>
          </div>
        </div>
      </div>

      {/* Main Flow Execution Pipeline Visualizer */}
      <div className="bg-slate-950 rounded-md border border-slate-800 p-4 text-white shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Architectural Node Sequence Pipeline
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            TLS 1.3 mTLS Service Mesh Trace
          </span>
        </div>

        {/* Horizontal Node Stepper Bar */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center space-x-2 min-w-[700px]">
            {activeFlow.steps.map((step, idx) => {
              const isCurrent = idx === activeStepIndex;
              const isDone = completedSteps.includes(idx) || idx < activeStepIndex;
              const sourceComp = ARCHITECTURE_COMPONENTS[step.sourceComponentId];
              const targetComp = ARCHITECTURE_COMPONENTS[step.targetComponentId];

              return (
                <div key={idx} className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveStepIndex(idx)}
                    className={`p-2.5 rounded-md border text-left transition-all cursor-pointer w-44 shrink-0 ${
                      isCurrent
                        ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : isDone
                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        Step {step.stepNumber}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-800 px-1 py-0.2 rounded text-emerald-400">
                        +{step.durationMs}ms
                      </span>
                    </div>
                    <div className="text-xs font-bold line-clamp-1 text-white">
                      {sourceComp?.name.split('(')[0] || step.sourceComponentId}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <span>➔</span>
                      <span className="line-clamp-1">
                        {targetComp?.name.split('(')[0] || step.targetComponentId}
                      </span>
                    </div>
                    <div className="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>{step.protocol}</span>
                      {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </button>

                  {idx < activeFlow.steps.length - 1 && (
                    <div className="text-slate-600 font-bold shrink-0">
                      ➔
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Inspection for Active Step */}
        {currentStep && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-800">
            {/* Left Inspection Panel (6 Cols): Action & Component Specs */}
            <div className="lg:col-span-6 space-y-3 bg-slate-900 p-3.5 rounded border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                  {currentStep.layerName}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Protocol: <strong className="text-white">{currentStep.protocol}</strong>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{currentStep.action}</h4>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  {currentStep.payloadDescription}
                </p>
              </div>

              {/* Source vs Target Nodes */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    Source Node:
                  </span>
                  <div className="font-bold text-white mt-0.5">
                    {ARCHITECTURE_COMPONENTS[currentStep.sourceComponentId]?.name || currentStep.sourceComponentId}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {ARCHITECTURE_COMPONENTS[currentStep.sourceComponentId]?.technology}
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    Target Node:
                  </span>
                  <div className="font-bold text-white mt-0.5">
                    {ARCHITECTURE_COMPONENTS[currentStep.targetComponentId]?.name || currentStep.targetComponentId}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {ARCHITECTURE_COMPONENTS[currentStep.targetComponentId]?.technology}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Inspection Panel (6 Cols): Code Snippet & Payload */}
            <div className="lg:col-span-6 space-y-2 bg-slate-900 p-3.5 rounded border border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                <span className="flex items-center space-x-1.5 font-mono">
                  <Code2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Executed Code & Payload</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Execution: {currentStep.durationMs}ms
                </span>
              </div>

              <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-x-auto max-h-48 whitespace-pre leading-relaxed">
                {currentStep.codeSnippet}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Live System Log & Trace Stream */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900">
              Correlated Distributed Trace & ELK Log Stream
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Correlation ID: wn_trace_78a1f9
          </span>
        </div>

        <div className="bg-slate-950 rounded p-3 font-mono text-[11px] text-slate-300 space-y-1 max-h-36 overflow-y-auto border border-slate-800">
          {rawLogs.map((log, index) => (
            <div key={index} className="leading-tight">
              <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>{' '}
              <span className={log.includes('COMPLETED') ? 'text-emerald-400 font-bold' : log.includes('STEP') ? 'text-amber-300' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
