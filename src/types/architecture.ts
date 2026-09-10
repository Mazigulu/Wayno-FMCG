export type ArchitecturalSectionId = 
  | 'clients_edge'
  | 'cloud_infra'
  | 'application_layer'
  | 'data_layer'
  | 'ai_ml_layer'
  | 'external_integrations'
  | 'realtime_sources'
  | 'monitoring_analytics'
  | 'devops_security';

export interface ArchitectureComponent {
  id: string;
  name: string;
  category: ArchitecturalSectionId;
  technology: string;
  role: string;
  status: 'healthy' | 'warning' | 'standby';
  specs: {
    protocol?: string;
    throughput?: string;
    latency?: string;
    redundancy?: string;
    details: string;
    [key: string]: string | undefined;
  };
}

export interface FlowStep {
  stepNumber: number;
  sourceComponentId: string;
  targetComponentId: string;
  action: string;
  protocol: string;
  payloadDescription: string;
  codeSnippet: string;
  durationMs: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  layerName: string;
}

export interface ArchitectureFlow {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'Routing' | 'Telemetry' | 'Incident' | 'SemanticSearch' | 'Payment' | 'DevOps';
  estimatedP95Ms: number;
  steps: FlowStep[];
}
