export interface BusinessRuleSpec {
  id: string;
  ruleNumber: number;
  category: 'PRICING_FEES' | 'FULFILLMENT_OPERATIONS' | 'ORDER_LIFECYCLE' | 'LOGISTICS_ROUTING';
  title: string;
  summary: string;
  businessObjective: string;
  keyFormulasOrParameters: {
    label: string;
    value: string;
    notes?: string;
  }[];
  stepByStepProtocol: string[];
  edgeCasesAndExceptions: {
    scenario: string;
    resolution: string;
  }[];
  kenyanMarketContext: string;
  slaOrThresholds: {
    metric: string;
    target: string;
    penaltyOrAction: string;
  }[];
  interactiveType?: 'DELIVERY_CALCULATOR' | 'SUPPLIER_SELECTION' | 'TIMEOUT_SIMULATOR' | 'SUBSTITUTION_PARTIAL' | 'REFUND_CANCELLATION' | 'SERVICE_ZONE' | 'GENERIC';
}

export interface DeliveryFeeCalculationParams {
  distanceKm: number;
  weightKg: number;
  isRushHourSurge: boolean;
  isHeavyRainSurge: boolean;
  isExpressUrgent: boolean;
  isMultiDrop: boolean;
  zoneId: string;
  basketSubtotalKES: number;
}

export interface DeliveryFeeCalculationResult {
  baseFee: number;
  distanceFee: number;
  weightSurcharge: number;
  vehicleTypeRequired: 'Boda Boda (Motorbike)' | 'Tuk-Tuk Cargo' | 'Light Pickup Truck';
  surgeMultiplier: number;
  surgeAmount: number;
  expressSurcharge: number;
  multiDropDiscount: number;
  freeDeliveryDiscount: number;
  finalDeliveryFee: number;
  estimatedTransitMins: number;
  explanation: string;
}

export interface SupplierSelectionCandidate {
  wholesalerId: string;
  wholesalerName: string;
  depotLocation: string;
  distanceKm: number;
  wholesalePriceKES: number;
  stockQty: number;
  historicalReliabilityPct: number;
  avgPrepMins: number;
  compositeScore?: number;
  scoreBreakdown?: {
    distanceScore: number;
    priceScore: number;
    stockScore: number;
    reliabilityScore: number;
    prepSpeedScore: number;
  };
}

export interface SupplierSelectionResult {
  selectedWholesalerId: string;
  selectedWholesalerName: string;
  winningScore: number;
  rankedCandidates: SupplierSelectionCandidate[];
  rationale: string;
}

export interface TimeoutSimulationState {
  orderId: string;
  elapsedSeconds: number;
  maxTimeoutSeconds: number;
  currentPhase: 'NOTIFICATION_SENT' | 'CHIME_WARNING' | 'IVR_CALL' | 'TIMEOUT_TRIGGERED' | 'REROUTED' | 'REFUNDED';
  supplierStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  actionTaken: string;
}

export interface SubstitutionProposal {
  originalItem: {
    name: string;
    packSize: string;
    price: number;
  };
  proposedSubstitute: {
    name: string;
    packSize: string;
    price: number;
    priceDiffPct: number;
  };
  policyOutcome: 'AUTO_APPROVED' | 'REQUIRES_RETAILER_CONFIRMATION' | 'REJECTED_OUT_OF_TOLERANCE';
  priceAdjustment: {
    type: 'REFUND_DIFFERENCE' | 'WAYNO_SUBSIDY' | 'EXACT_MATCH';
    amountKES: number;
  };
}
