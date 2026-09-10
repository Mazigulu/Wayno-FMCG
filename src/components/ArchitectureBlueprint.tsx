import React, { useState } from 'react';
import { 
  Smartphone, 
  Laptop, 
  Headphones, 
  Watch, 
  Users, 
  Shield, 
  Globe, 
  Server, 
  Cpu, 
  Database, 
  CloudRain, 
  Radio, 
  Activity, 
  Code, 
  Lock, 
  RefreshCw, 
  CheckCircle, 
  Zap, 
  ExternalLink, 
  Terminal, 
  Layers,
  MapPin,
  TrendingUp,
  Car,
  CreditCard,
  Building
} from 'lucide-react';
import { ARCHITECTURE_COMPONENTS, MASTER_ARCHITECTURE_FLOWS } from '../data/architectureFlows';
import { ArchitectureComponent } from '../types/architecture';

interface ArchitectureBlueprintProps {
  onSelectFlow?: (flowId: string) => void;
}

export const ArchitectureBlueprint: React.FC<ArchitectureBlueprintProps> = ({ onSelectFlow }) => {
  const [selectedComponent, setSelectedComponent] = useState<ArchitectureComponent | null>(null);
  const [highlightLayer, setHighlightLayer] = useState<string>('all');

  const handleComponentClick = (componentId: string) => {
    const comp = ARCHITECTURE_COMPONENTS[componentId];
    if (comp) {
      setSelectedComponent(comp);
    }
  };

  return (
    <div className="space-y-4">
      {/* Blueprint Header */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center font-bold text-white text-sm">
                W
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">WAYNO V1</h1>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    System Architecture
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  AI-Powered Personal Navigation & Mobility Assistant · Detailed Infrastructure Blueprint
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md border-l-2 border-slate-300 pl-3">
            <span className="text-xs font-bold text-slate-900 block">Smarter Journeys. Better Decisions.</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              WAYNO V1 combines real-time data, AI, and multi-modal navigation to help users get from anywhere to anywhere — safer, faster, and more efficiently.
            </p>
          </div>
        </div>

        {/* Quick Filter / Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filter Layer:
            </span>
            {['all', 'clients_edge', 'cloud_infra', 'application_layer', 'data_layer', 'ai_ml_layer', 'monitoring_analytics'].map((lyr) => (
              <button
                key={lyr}
                onClick={() => setHighlightLayer(lyr)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors cursor-pointer text-[11px] ${
                  highlightLayer === lyr
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lyr.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>All 42 Cloud Infrastructure Nodes Online</span>
          </div>
        </div>
      </div>

      {/* Blueprint Visual Grid Matching the Blueprint Architecture Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* ============================================================== */}
        {/* COLUMN 1 (Left 2.5 Cols): 1. CLIENTS & EDGE */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border-2 border-blue-500 rounded-md p-3.5 shadow-2xs space-y-3">
            <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
              1. CLIENTS & EDGE
            </div>

            {/* User Applications */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                User Applications
              </span>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => handleComponentClick('client_mobile')}
                  className="w-full flex items-center space-x-2 p-2 rounded bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">Mobile App</div>
                    <div className="text-[10px] text-slate-500">(iOS / Android)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleComponentClick('client_web')}
                  className="w-full flex items-center space-x-2 p-2 rounded bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">Web App</div>
                    <div className="text-[10px] text-slate-500">(Progressive Web App)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleComponentClick('client_voice')}
                  className="w-full flex items-center space-x-2 p-2 rounded bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <Headphones className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">Voice Assistant</div>
                    <div className="text-[10px] text-slate-500">(Voice + Audio)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleComponentClick('client_wearable')}
                  className="w-full flex items-center space-x-2 p-2 rounded bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <Watch className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">Wearables</div>
                    <div className="text-[10px] text-slate-500">(Smartwatch / AR Glasses)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Users */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                User Personas
              </span>
              <div className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-700 font-medium text-[11px]">
                  Commuters, Travelers, Drivers, Riders (etc.)
                </span>
              </div>
            </div>

            {/* Edge Infrastructure */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Edge Infrastructure
              </span>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => handleComponentClick('edge_cdn')}
                  className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">CDN</div>
                    <div className="text-[9px] text-slate-500">CloudFront / Cloudflare</div>
                  </div>
                </button>

                <button
                  onClick={() => handleComponentClick('edge_shield')}
                  className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">DDoS Protection</div>
                    <div className="text-[9px] text-slate-500">AWS Shield / Cloudflare</div>
                  </div>
                </button>

                <button
                  onClick={() => handleComponentClick('edge_route53')}
                  className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px]">Global Load Balancer</div>
                    <div className="text-[9px] text-slate-500">Geo-routing Route 53</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-2 rounded bg-blue-50 border border-blue-200 text-[10px] text-blue-900 font-mono text-center">
              🔒 Secure Connection (TLS 1.3) · HTTPS & WSS
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 2 (Middle 6 Cols): 2, 3, 4, 5 CLOUD INFRA & CORE */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-3">
          {/* 2. CLOUD INFRASTRUCTURE (AWS) */}
          <div className="bg-white border-2 border-blue-500 rounded-md p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                2. CLOUD INFRASTRUCTURE (AWS)
              </span>
              <span className="text-[10px] font-mono text-slate-400">VPC (Multi-AZ)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <Globe className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="font-semibold text-[11px] block">Internet Gateway</span>
                <span className="text-[9px] text-slate-500">VPC Ingress</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <Activity className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="font-semibold text-[11px] block">Application Load Balancer</span>
                <span className="text-[9px] text-slate-500">L7 SSL Offload</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <Server className="w-4 h-4 mx-auto mb-1 text-slate-700" />
                <span className="font-semibold text-[11px] block">Auto Scaling Group</span>
                <span className="text-[9px] text-slate-500">EC2 & Fargate</span>
              </div>
            </div>
          </div>

          {/* 3. APPLICATION LAYER (Kubernetes) */}
          <div className="bg-white border-2 border-blue-500 rounded-md p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                3. APPLICATION LAYER (Kubernetes EKS)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Microservices Mesh</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => handleComponentClick('app_gateway')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">API Gateway</div>
                <div className="text-[9px] text-slate-500">Kong / AWS API GW</div>
                <span className="text-[8px] bg-slate-200 text-slate-700 px-1 rounded mt-1 inline-block">
                  REST / GraphQL
                </span>
              </button>

              <button
                onClick={() => handleComponentClick('app_user_service')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">User Service</div>
                <div className="text-[9px] text-slate-500">Profiles, Auth</div>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded mt-1 inline-block">
                  Spring Boot
                </span>
              </button>

              <button
                onClick={() => handleComponentClick('app_nav_service')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Navigation Service</div>
                <div className="text-[9px] text-slate-500">Route Planning</div>
                <span className="text-[8px] bg-blue-100 text-blue-800 px-1 rounded mt-1 inline-block">
                  Python / FastAPI
                </span>
              </button>

              <button
                onClick={() => handleComponentClick('app_realtime_service')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Realtime Service</div>
                <div className="text-[9px] text-slate-500">Tracking, Updates</div>
                <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded mt-1 inline-block">
                  Node.js
                </span>
              </button>

              <button
                onClick={() => handleComponentClick('app_recom_service')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Recommendation</div>
                <div className="text-[9px] text-slate-500">Personalization</div>
                <span className="text-[8px] bg-purple-100 text-purple-800 px-1 rounded mt-1 inline-block">
                  Python / ML
                </span>
              </button>

              <button
                onClick={() => handleComponentClick('app_notif_service')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Notification Service</div>
                <div className="text-[9px] text-slate-500">Alerts, Messaging</div>
                <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded mt-1 inline-block">
                  Node.js
                </span>
              </button>
            </div>

            {/* Istio Service Mesh Banner */}
            <button
              onClick={() => handleComponentClick('app_service_mesh')}
              className="w-full flex items-center justify-between p-2 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-colors cursor-pointer text-xs"
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <div>
                  <span className="font-bold text-blue-950 text-[11px]">Service Mesh (Istio)</span>
                  <p className="text-[10px] text-blue-700">Traffic management · Security (mTLS) · Observability</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-blue-800 font-bold">mTLS Active</span>
            </button>
          </div>

          {/* 4. DATA LAYER */}
          <div className="bg-white border-2 border-emerald-500 rounded-md p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                4. DATA LAYER
              </span>
              <span className="text-[10px] font-mono text-slate-400">Multi-Engine Persistent Tier</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => handleComponentClick('data_postgres')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">PostgreSQL</div>
                <div className="text-[9px] text-slate-500">Primary Multi-AZ DB</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">Read Replicas</div>
              </button>

              <button
                onClick={() => handleComponentClick('data_postgis')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">PostGIS</div>
                <div className="text-[9px] text-slate-500">Spatial Extensions</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">Road Graph</div>
              </button>

              <button
                onClick={() => handleComponentClick('data_redis')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Redis Cluster</div>
                <div className="text-[9px] text-slate-500">Session, Cache, Geo</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">&lt; 1ms Latency</div>
              </button>

              <button
                onClick={() => handleComponentClick('data_timescaledb')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">TimescaleDB</div>
                <div className="text-[9px] text-slate-500">Tracking, Events</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">1Hz Hypertables</div>
              </button>

              <button
                onClick={() => handleComponentClick('data_s3')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">S3 Data Lake</div>
                <div className="text-[9px] text-slate-500">Raw & Processed Data</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">Parquet Columns</div>
              </button>

              <button
                onClick={() => handleComponentClick('data_opensearch')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">OpenSearch</div>
                <div className="text-[9px] text-slate-500">Location & Content</div>
                <div className="text-[8px] font-mono text-slate-400 mt-1">Fuzzy POI Index</div>
              </button>
            </div>
          </div>

          {/* 5. AI/ML LAYER */}
          <div className="bg-white border-2 border-purple-500 rounded-md p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                5. AI/ML LAYER
              </span>
              <span className="text-[10px] font-mono text-slate-400">Foundation Models & MLOps</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => handleComponentClick('aiml_sagemaker')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">SageMaker</div>
                <div className="text-[9px] text-slate-500">LLM + ML Models</div>
                <div className="text-[8px] font-mono text-purple-700 mt-0.5">ETA Prediction</div>
              </button>

              <button
                onClick={() => handleComponentClick('aiml_vector_db')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Vector Database</div>
                <div className="text-[9px] text-slate-500">Aurora / OpenSearch</div>
                <div className="text-[8px] font-mono text-purple-700 mt-0.5">Semantic RAG</div>
              </button>

              <button
                onClick={() => handleComponentClick('aiml_glue')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Data Processing</div>
                <div className="text-[9px] text-slate-500">AWS Glue / EMR</div>
                <div className="text-[8px] font-mono text-purple-700 mt-0.5">Batch Spark ETL</div>
              </button>

              <button
                onClick={() => handleComponentClick('aiml_pipelines')}
                className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <div className="font-bold text-slate-900 text-[11px]">Training Pipeline</div>
                <div className="text-[9px] text-slate-500">SageMaker Pipelines</div>
                <div className="text-[8px] font-mono text-purple-700 mt-0.5">Automated MLOps</div>
              </button>

              <button
                onClick={() => handleComponentClick('aiml_bedrock')}
                className="col-span-2 p-2 rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left cursor-pointer"
              >
                <div className="font-bold text-purple-950 text-[11px]">Bedrock (Foundation Models)</div>
                <div className="text-[10px] text-purple-700">Route Reasoning · Natural Language · Voice Processing</div>
                <div className="text-[9px] font-mono text-purple-800 font-bold mt-0.5">Claude 3.5 Sonnet / Llama 3</div>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 3 (Right 3.5 Cols): 7, 6, 8 REAL-TIME SOURCES & INTEGRATIONS */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-3">
          {/* 7. REAL-TIME DATA SOURCES */}
          <div className="bg-white border-2 border-emerald-600 rounded-md p-3 shadow-2xs space-y-1.5">
            <div className="bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded">
              7. REAL-TIME DATA SOURCES
            </div>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => handleComponentClick('source_gps')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">GPS / Location</div>
                  <div className="text-[9px] text-slate-500">(Device + Satellites)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('source_traffic_feeds')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Traffic Feeds</div>
                  <div className="text-[9px] text-slate-500">(Weather, Incidents)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('source_transit_schedules')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Public Transit</div>
                  <div className="text-[9px] text-slate-500">(Real-time Schedules)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('source_poi_db')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">POI Database</div>
                  <div className="text-[9px] text-slate-500">(Restaurants, Hotels, etc.)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('source_ugc')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">User Generated Data</div>
                  <div className="text-[9px] text-slate-500">(Reports, Reviews)</div>
                </div>
              </button>
            </div>
          </div>

          {/* 6. EXTERNAL INTEGRATIONS */}
          <div className="bg-white border-2 border-rose-500 rounded-md p-3 shadow-2xs space-y-1.5">
            <div className="bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              6. EXTERNAL INTEGRATIONS
            </div>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => handleComponentClick('ext_maps')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Maps & Location</div>
                  <div className="text-[9px] text-slate-500">(Google Maps / HERE)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('ext_traffic')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Car className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Traffic & Transit</div>
                  <div className="text-[9px] text-slate-500">(Real-time APIs)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('ext_weather')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <CloudRain className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Weather</div>
                  <div className="text-[9px] text-slate-500">(OpenWeather / AccuWeather)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('ext_mobility')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Car className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Ride-Hailing / Mobility</div>
                  <div className="text-[9px] text-slate-500">(Uber / Lyft / Transit)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('ext_payments')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Payment Gateway</div>
                  <div className="text-[9px] text-slate-500">(Stripe / Adyen)</div>
                </div>
              </button>
            </div>
          </div>

          {/* 8. MONITORING & ANALYTICS */}
          <div className="bg-white border-2 border-cyan-600 rounded-md p-3 shadow-2xs space-y-1.5">
            <div className="bg-cyan-700 text-white text-xs font-bold px-2 py-0.5 rounded">
              8. MONITORING & ANALYTICS
            </div>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => handleComponentClick('mon_observability')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Observability</div>
                  <div className="text-[9px] text-slate-500">(CloudWatch / Datadog)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('mon_metrics')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Metrics</div>
                  <div className="text-[9px] text-slate-500">(Prometheus / Grafana)</div>
                </div>
              </button>

              <button
                onClick={() => handleComponentClick('mon_logs')}
                className="w-full flex items-center space-x-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">Logs</div>
                  <div className="text-[9px] text-slate-500">(ELK / OpenSearch)</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 9. DEVOPS & SECURITY (Full Width Bottom Box) */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-slate-700 rounded-md p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded">
            9. DEVOPS & SECURITY
          </span>
          <span className="text-[10px] font-mono text-slate-400">Continuous Delivery & Zero Trust</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* CI/CD Pipeline */}
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CI/CD Pipeline
            </span>
            <div className="font-semibold text-slate-900 text-[11px]">
              Code (GitHub) ➔ Build & Test (CodeBuild) ➔ Deploy (EKS) ➔ Monitor
            </div>
            <div className="text-[9px] text-slate-500">Automated zero-downtime canary rollouts</div>
          </div>

          {/* Infrastructure as Code */}
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Infrastructure as Code
            </span>
            <div className="font-semibold text-slate-900 text-[11px]">
              Terraform 1.9 (Provisioning)
            </div>
            <div className="text-[9px] text-slate-500">VPC, EKS, RDS, ElastiCache, S3 backend</div>
          </div>

          {/* Security */}
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Security Framework
            </span>
            <div className="font-semibold text-slate-900 text-[11px]">
              IAM · Secrets Manager · WAF · KMS
            </div>
            <div className="text-[9px] text-slate-500">Envelope encryption at rest & mTLS transit</div>
          </div>

          {/* Disaster Recovery */}
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Disaster Recovery
            </span>
            <div className="font-semibold text-slate-900 text-[11px]">
              Multi-AZ (HA) · Cross-Region Backup
            </div>
            <div className="text-[9px] text-slate-500">RTO &lt; 30s · RPO &lt; 1s failover target</div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BOTTOM SPECIFICATION & CAPACITY FOOTER BAR */}
      {/* ============================================================== */}
      <div className="bg-slate-950 text-white rounded-md p-4 border border-slate-800 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tech Stack Summary
            </div>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Frontend:</strong> React Native / React / PWA<br />
              <strong>Backend:</strong> Spring Boot / FastAPI / Node.js<br />
              <strong>Databases:</strong> PostgreSQL, PostGIS, Redis, TimescaleDB<br />
              <strong>AI/ML:</strong> SageMaker, Bedrock, OpenSearch
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Key Architectural Principles
            </div>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              • Microservices & containerized (EKS)<br />
              • Event-driven & real-time telemetry<br />
              • Scalable, resilient, multi-AZ deployment<br />
              • AI-powered personalization & decision making
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Deployment Overview
            </div>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Cloud Provider:</strong> AWS (us-east-1 + Multi-Region)<br />
              <strong>Kubernetes:</strong> EKS (Managed) + Fargate<br />
              <strong>Storage:</strong> S3 / EBS / EFS<br />
              <strong>Database:</strong> RDS Aurora + ElastiCache
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Scale & Capacity (Target V1)
            </div>
            <div className="text-emerald-400 text-[11px] leading-relaxed font-bold">
              <strong>Users:</strong> 1M+ MAU (initial)<br />
              <strong>Requests:</strong> 10K RPS (peak)<br />
              <strong>Latency:</strong> &lt; 200ms (p95)<br />
              <strong>Availability:</strong> 99.9%
            </div>
          </div>
        </div>
      </div>

      {/* Component Detail Modal */}
      {selectedComponent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {selectedComponent.category.replace('_', ' ')}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedComponent.name}</h3>
                <p className="text-xs text-slate-500">{selectedComponent.technology}</p>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Architectural Role
                </span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                  {selectedComponent.role}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {selectedComponent.specs.protocol && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">Protocol</span>
                    <span className="font-bold text-slate-800">{selectedComponent.specs.protocol}</span>
                  </div>
                )}
                {selectedComponent.specs.latency && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">Latency</span>
                    <span className="font-bold text-emerald-600">{selectedComponent.specs.latency}</span>
                  </div>
                )}
                {selectedComponent.specs.throughput && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">Throughput</span>
                    <span className="font-bold text-slate-800">{selectedComponent.specs.throughput}</span>
                  </div>
                )}
                {selectedComponent.specs.redundancy && (
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 text-[9px] uppercase block">Redundancy</span>
                    <span className="font-bold text-slate-800">{selectedComponent.specs.redundancy}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Operational Specs & Notes
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {selectedComponent.specs.details}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[10px] text-emerald-600 font-mono font-semibold flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Health: Optimal (99.99% Uptime)</span>
              </span>

              {onSelectFlow && (
                <button
                  onClick={() => {
                    setSelectedComponent(null);
                    onSelectFlow('flow_route_planning');
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Execute Related Flow</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
