export type NFRCategory = 
  | 'system_qualities'        // Performance, Scalability, Reliability
  | 'security_trust'          // Security, Privacy, Compliance
  | 'operational_resilience'  // Availability/SLA, Disaster Recovery, Observability, Data Retention
  | 'portability_experience'; // Accessibility, Maintainability, Portability, Compatibility

export type NFRId = 
  | 'performance'
  | 'availability_sla'
  | 'scalability'
  | 'security'
  | 'privacy'
  | 'reliability'
  | 'disaster_recovery'
  | 'data_retention'
  | 'observability'
  | 'accessibility'
  | 'maintainability'
  | 'portability'
  | 'compatibility'
  | 'compliance';

export interface NFRMetric {
  name: string;
  target: string;
  measured: string;
  tolerance: string;
  status: 'pass' | 'warning' | 'critical';
  unit: string;
  description: string;
}

export interface NFRArchitecturalControl {
  component: string;
  mechanism: string;
  description: string;
  configSnippet?: string;
}

export interface NFRFailureMode {
  failureMode: string;
  blastRadius: string;
  mitigationStrategy: string;
  recoveryTime: string;
}

export interface NFRVerificationMethod {
  type: 'Automated Test' | 'Synthetic Probe' | 'Load Test' | 'Audit' | 'Chaos Drill';
  description: string;
  tooling: string;
  frequency: string;
}

export interface NFRSpecification {
  id: NFRId;
  index: number;
  title: string;
  subtitle: string;
  category: NFRCategory;
  tag: string;
  badgeColor: string;
  status: 'VERIFIED' | 'COMPLIANT' | 'ACTIVE_AUDIT' | 'BENCHMARKED';
  summary: string;
  businessImpact: string;
  kenyanContext: string;
  targetMetrics: NFRMetric[];
  architecturalControls: NFRArchitecturalControl[];
  failureModesAndMitigations: NFRFailureMode[];
  verificationMethods: NFRVerificationMethod[];
  complianceStandards: string[];
  operationalChecklist: string[];
}

export interface LatencyBudgetSegment {
  name: string;
  allocatedMs: number;
  simulatedMs: number;
  description: string;
  networkLayer: string;
}

export interface SLACalculatorState {
  targetUptimePercent: number; // e.g., 99.95
  periodDays: number;          // e.g., 30 (monthly) or 365 (annual)
  currentOutageMinutes: number;
}

export interface DisasterRecoveryDrillStep {
  id: string;
  name: string;
  phase: 'Detection' | 'Triage' | 'Failover' | 'Verification' | 'Traffic Swing';
  expectedDurationSec: number;
  action: string;
  automatedCheck: string;
  status: 'pending' | 'executing' | 'passed';
}
