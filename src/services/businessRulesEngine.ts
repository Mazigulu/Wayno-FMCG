import {
  DeliveryFeeCalculationParams,
  DeliveryFeeCalculationResult,
  SupplierSelectionCandidate,
  SupplierSelectionResult,
  TimeoutSimulationState,
  SubstitutionProposal,
} from '../types/businessRules';
import { OrderState } from '../types/wayno';

/**
 * Rule 3: Precise Delivery-Fee Calculation
 */
export function calculateDeliveryFee(
  params: DeliveryFeeCalculationParams
): DeliveryFeeCalculationResult {
  const BASE_FEE = 150;
  const BASE_DISTANCE_KM = 3.0;
  const PER_KM_RATE = 35;
  const BASE_WEIGHT_KG = 30;
  const HEAVY_WEIGHT_RATE = 5; // per kg between 30 and 60 kg

  // 1. Distance Calculation
  const extraDistance = Math.max(0, params.distanceKm - BASE_DISTANCE_KM);
  const distanceFee = Math.round(extraDistance * PER_KM_RATE);

  // 2. Weight and Vehicle Classification
  let weightSurcharge = 0;
  let vehicleTypeRequired: 'Boda Boda (Motorbike)' | 'Tuk-Tuk Cargo' | 'Light Pickup Truck' =
    'Boda Boda (Motorbike)';

  if (params.weightKg > 60) {
    vehicleTypeRequired = 'Tuk-Tuk Cargo';
    weightSurcharge = 250; // flat upgrade to Tuk-Tuk cargo
  } else if (params.weightKg > 150) {
    vehicleTypeRequired = 'Light Pickup Truck';
    weightSurcharge = 600;
  } else if (params.weightKg > BASE_WEIGHT_KG) {
    vehicleTypeRequired = 'Boda Boda (Motorbike)';
    weightSurcharge = Math.round((params.weightKg - BASE_WEIGHT_KG) * HEAVY_WEIGHT_RATE);
  }

  // 3. Subtotal before surge
  const rawSubtotal = BASE_FEE + distanceFee + weightSurcharge;

  // 4. Surge Multiplier
  let surgeMultiplier = 1.0;
  if (params.isHeavyRainSurge && params.isRushHourSurge) {
    surgeMultiplier = 1.35;
  } else if (params.isHeavyRainSurge) {
    surgeMultiplier = 1.25;
  } else if (params.isRushHourSurge) {
    surgeMultiplier = 1.15;
  }

  const surgeAmount = Math.round(rawSubtotal * (surgeMultiplier - 1.0));

  // 5. Express / Urgent
  const expressSurcharge = params.isExpressUrgent ? 100 : 0;

  // 6. Multi-Drop Discount
  const multiDropDiscount = params.isMultiDrop ? Math.round(rawSubtotal * 0.2) : 0;

  // 7. Free Delivery Subsidy (orders >= KES 25,000 within 5km)
  let freeDeliveryDiscount = 0;
  if (params.basketSubtotalKES >= 25000 && params.distanceKm <= 5.0) {
    freeDeliveryDiscount = rawSubtotal + surgeAmount + expressSurcharge - multiDropDiscount;
  }

  // 8. Final Delivery Fee
  const finalDeliveryFee = Math.max(
    0,
    rawSubtotal + surgeAmount + expressSurcharge - multiDropDiscount - freeDeliveryDiscount
  );

  // 9. Estimated transit minutes (assuming average urban speed ~22 km/h + 8 min buffer)
  const estimatedTransitMins = Math.round(8 + (params.distanceKm / 22) * 60);

  let explanation = `Base KES ${BASE_FEE} (first 3km, ≤30kg)`;
  if (distanceFee > 0) explanation += ` + Distance KES ${distanceFee} (${params.distanceKm.toFixed(1)}km)`;
  if (weightSurcharge > 0) explanation += ` + Cargo surcharge KES ${weightSurcharge} (${params.weightKg}kg)`;
  if (surgeAmount > 0) explanation += ` + Weather/Peak Surge KES ${surgeAmount} (${surgeMultiplier}x)`;
  if (expressSurcharge > 0) explanation += ` + Express Dispatch KES ${expressSurcharge}`;
  if (multiDropDiscount > 0) explanation += ` - Multi-Drop Discount KES ${multiDropDiscount}`;
  if (freeDeliveryDiscount > 0) explanation += ` - Free Delivery Subsidy KES ${freeDeliveryDiscount}`;

  return {
    baseFee: BASE_FEE,
    distanceFee,
    weightSurcharge,
    vehicleTypeRequired,
    surgeMultiplier,
    surgeAmount,
    expressSurcharge,
    multiDropDiscount,
    freeDeliveryDiscount,
    finalDeliveryFee,
    estimatedTransitMins,
    explanation,
  };
}

/**
 * Rule 1: Multi-Factor Supplier Selection Engine
 */
export function evaluateSupplierSelection(
  candidates: SupplierSelectionCandidate[],
  hasBasketConsolidation: Record<string, boolean> = {}
): SupplierSelectionResult {
  if (candidates.length === 0) {
    return {
      selectedWholesalerId: '',
      selectedWholesalerName: 'None Available',
      winningScore: 0,
      rankedCandidates: [],
      rationale: 'No eligible suppliers found in zone with positive inventory.',
    };
  }

  // Find min and max for normalization
  const minPrice = Math.min(...candidates.map((c) => c.wholesalePriceKES));
  const maxPrice = Math.max(...candidates.map((c) => c.wholesalePriceKES));
  const minDistance = Math.min(...candidates.map((c) => c.distanceKm));
  const maxDistance = Math.max(...candidates.map((c) => c.distanceKm));

  const rankedCandidates = candidates.map((candidate) => {
    // 1. Distance score (closer is better, 0-100)
    let distanceScore = 100;
    if (maxDistance > minDistance) {
      distanceScore = Math.round(100 - ((candidate.distanceKm - minDistance) / (maxDistance - minDistance)) * 60);
    } else {
      distanceScore = candidate.distanceKm <= 3 ? 100 : candidate.distanceKm <= 6 ? 85 : 70;
    }

    // 2. Price score (cheaper is better, 0-100)
    let priceScore = 100;
    if (maxPrice > minPrice) {
      priceScore = Math.round(100 - ((candidate.wholesalePriceKES - minPrice) / (maxPrice - minPrice)) * 50);
    }

    // 3. Stock certainty (score based on stock count)
    const stockScore = candidate.stockQty >= 20 ? 100 : candidate.stockQty >= 10 ? 85 : candidate.stockQty >= 5 ? 70 : 40;

    // 4. Historical reliability score (0-100)
    const reliabilityScore = Math.round(candidate.historicalReliabilityPct);

    // 5. Prep speed score (shorter is better)
    const prepSpeedScore = candidate.avgPrepMins <= 10 ? 100 : candidate.avgPrepMins <= 15 ? 85 : candidate.avgPrepMins <= 20 ? 70 : 50;

    // Base Composite:
    // Distance (30%) + Price (25%) + Stock (20%) + Reliability (15%) + Prep (10%)
    let compositeScore = Math.round(
      distanceScore * 0.30 +
      priceScore * 0.25 +
      stockScore * 0.20 +
      reliabilityScore * 0.15 +
      prepSpeedScore * 0.10
    );

    // Basket consolidation bonus (+15 points)
    if (hasBasketConsolidation[candidate.wholesalerId]) {
      compositeScore += 15;
    }

    return {
      ...candidate,
      compositeScore,
      scoreBreakdown: {
        distanceScore,
        priceScore,
        stockScore,
        reliabilityScore,
        prepSpeedScore,
      },
    };
  });

  // Sort descending by composite score
  rankedCandidates.sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

  const winner = rankedCandidates[0];
  const rationale = `Selected ${winner.wholesalerName} with score ${winner.compositeScore}/100 based on ${winner.distanceKm}km proximity, KES ${winner.wholesalePriceKES.toLocaleString()} price point, and ${winner.historicalReliabilityPct}% historical fill rate.`;

  return {
    selectedWholesalerId: winner.wholesalerId,
    selectedWholesalerName: winner.wholesalerName,
    winningScore: winner.compositeScore || 0,
    rankedCandidates,
    rationale,
  };
}

/**
 * Rule 5: Supplier Acceptance Timeout Simulation
 */
export function simulateSupplierAcceptanceTimeout(
  elapsedSeconds: number,
  maxTimeoutSeconds = 240
): TimeoutSimulationState {
  if (elapsedSeconds < 120) {
    return {
      orderId: 'ORD-TIMEOUT-DEMO',
      elapsedSeconds,
      maxTimeoutSeconds,
      currentPhase: 'NOTIFICATION_SENT',
      supplierStatus: 'PENDING',
      actionTaken: 'Push notification & SMS dispatched to depot manager tablet. Normal response window active.',
    };
  } else if (elapsedSeconds < 200) {
    return {
      orderId: 'ORD-TIMEOUT-DEMO',
      elapsedSeconds,
      maxTimeoutSeconds,
      currentPhase: 'CHIME_WARNING',
      supplierStatus: 'PENDING',
      actionTaken: 'High-priority audio chime sounding at depot station. Automated WhatsApp reminder pinged.',
    };
  } else if (elapsedSeconds < 240) {
    return {
      orderId: 'ORD-TIMEOUT-DEMO',
      elapsedSeconds,
      maxTimeoutSeconds,
      currentPhase: 'IVR_CALL',
      supplierStatus: 'PENDING',
      actionTaken: 'Automated Safaricom IVR phone call dialing depot operations manager. 40 seconds remaining before SLA breach.',
    };
  } else {
    return {
      orderId: 'ORD-TIMEOUT-DEMO',
      elapsedSeconds,
      maxTimeoutSeconds,
      currentPhase: 'TIMEOUT_TRIGGERED',
      supplierStatus: 'EXPIRED',
      actionTaken: 'HARD TIMEOUT TRIGGERED: Wholesaler penalized (-1.5 reliability score). Automated failover rerouted order to secondary depot within zone.',
    };
  }
}

/**
 * Rule 6: Substitution Evaluation
 */
export function evaluateSubstitution(
  originalItem: { name: string; packSize: string; price: number },
  proposedSubstitute: { name: string; packSize: string; price: number },
  retailerPreference: 'AUTO_SUBSTITUTE' | 'CONFIRM_REQUIRED' | 'NEVER_SUBSTITUTE'
): SubstitutionProposal {
  const priceDiff = proposedSubstitute.price - originalItem.price;
  const priceDiffPct = Math.round((priceDiff / originalItem.price) * 1000) / 10;

  // Policy rule: price variance must be within -15% to +3%
  const isWithinTolerance = priceDiffPct >= -15.0 && priceDiffPct <= 3.0;

  let policyOutcome: 'AUTO_APPROVED' | 'REQUIRES_RETAILER_CONFIRMATION' | 'REJECTED_OUT_OF_TOLERANCE';
  if (!isWithinTolerance) {
    policyOutcome = 'REJECTED_OUT_OF_TOLERANCE';
  } else if (retailerPreference === 'NEVER_SUBSTITUTE') {
    policyOutcome = 'REJECTED_OUT_OF_TOLERANCE';
  } else if (retailerPreference === 'AUTO_SUBSTITUTE') {
    policyOutcome = 'AUTO_APPROVED';
  } else {
    policyOutcome = 'REQUIRES_RETAILER_CONFIRMATION';
  }

  let priceAdjustment: { type: 'REFUND_DIFFERENCE' | 'WAYNO_SUBSIDY' | 'EXACT_MATCH'; amountKES: number };
  if (priceDiff < 0) {
    priceAdjustment = {
      type: 'REFUND_DIFFERENCE',
      amountKES: Math.abs(priceDiff),
    };
  } else if (priceDiff > 0) {
    priceAdjustment = {
      type: 'WAYNO_SUBSIDY',
      amountKES: priceDiff,
    };
  } else {
    priceAdjustment = {
      type: 'EXACT_MATCH',
      amountKES: 0,
    };
  }

  return {
    originalItem,
    proposedSubstitute: {
      ...proposedSubstitute,
      priceDiffPct,
    },
    policyOutcome,
    priceAdjustment,
  };
}

/**
 * Rule 8 & 9: Cancellation & Refund Ledger Calculator
 */
export function evaluateCancellationRefund(
  orderState: OrderState,
  subtotalKES: number,
  deliveryFeeKES: number,
  cancelledBy: 'RETAILER' | 'WHOLESALER' | 'SYSTEM'
): {
  allowed: boolean;
  refundSubtotalKES: number;
  refundDeliveryFeeKES: number;
  restockingFeeKES: number;
  riderDispatchFeeKES: number;
  totalRefundKES: number;
  explanation: string;
} {
  // If system or wholesaler cancels, customer gets 100% full refund in all cases
  if (cancelledBy === 'WHOLESALER' || cancelledBy === 'SYSTEM') {
    return {
      allowed: true,
      refundSubtotalKES: subtotalKES,
      refundDeliveryFeeKES: deliveryFeeKES,
      restockingFeeKES: 0,
      riderDispatchFeeKES: 0,
      totalRefundKES: subtotalKES + deliveryFeeKES,
      explanation: 'Full 100% refund (Subtotal + Delivery Fee) issued immediately via M-Pesa. Customer receives KES 150 goodwill voucher.',
    };
  }

  switch (orderState) {
    case 'CREATED':
    case 'PAYMENT_PENDING':
      return {
        allowed: true,
        refundSubtotalKES: 0,
        refundDeliveryFeeKES: 0,
        restockingFeeKES: 0,
        riderDispatchFeeKES: 0,
        totalRefundKES: 0,
        explanation: 'Payment was not yet completed; 0 charge and 0 fee.',
      };

    case 'PAID':
    case 'FULFILLMENT_PENDING':
      return {
        allowed: true,
        refundSubtotalKES: subtotalKES,
        refundDeliveryFeeKES: deliveryFeeKES,
        restockingFeeKES: 0,
        riderDispatchFeeKES: 0,
        totalRefundKES: subtotalKES + deliveryFeeKES,
        explanation: 'Cancelled before depot packing commenced. 100% refund of Subtotal and Delivery Fee.',
      };

    case 'SUPPLIER_CONFIRMED':
      return {
        allowed: true,
        refundSubtotalKES: subtotalKES - 100,
        refundDeliveryFeeKES: deliveryFeeKES,
        restockingFeeKES: 100,
        riderDispatchFeeKES: 0,
        totalRefundKES: subtotalKES - 100 + deliveryFeeKES,
        explanation: 'Goods staged on loading dock; KES 100 warehouse restocking fee deducted, balance refunded.',
      };

    case 'READY_FOR_PICKUP':
    case 'RIDER_ASSIGNED':
      return {
        allowed: true,
        refundSubtotalKES: subtotalKES - 100,
        refundDeliveryFeeKES: 0,
        restockingFeeKES: 100,
        riderDispatchFeeKES: deliveryFeeKES,
        totalRefundKES: Math.max(0, subtotalKES - 100),
        explanation: 'Rider was already dispatched to depot. Delivery fee is retained and transferred to rider as dispatch compensation.',
      };

    case 'PICKED_UP':
    case 'OUT_FOR_DELIVERY':
    case 'DELIVERED':
    default:
      return {
        allowed: false,
        refundSubtotalKES: 0,
        refundDeliveryFeeKES: 0,
        restockingFeeKES: 0,
        riderDispatchFeeKES: 0,
        totalRefundKES: 0,
        explanation: 'Order is in transit or delivered. In-app cancellation blocked; must follow Failed Delivery / Return Protocol.',
      };
  }
}

/**
 * Rule 14: Service Zone Boundary Evaluation
 */
export function evaluateServiceZoneEligibility(
  shopZoneId: string,
  wholesalerZoneId: string,
  roadDistanceKm: number
): {
  isEligible: boolean;
  transitType: 'INTRA_ZONE' | 'INTER_ZONE' | 'OUT_OF_BOUNDS';
  interZoneSurchargeKES: number;
  estimatedSlaMinutes: string;
  notes: string;
} {
  if (roadDistanceKm > 10.0) {
    return {
      isEligible: false,
      transitType: 'OUT_OF_BOUNDS',
      interZoneSurchargeKES: 0,
      estimatedSlaMinutes: 'N/A',
      notes: 'Exceeds maximum allowable boda boda cargo radius (10.0 km). Checkout blocked by service zone policy.',
    };
  }

  if (shopZoneId === wholesalerZoneId) {
    return {
      isEligible: true,
      transitType: 'INTRA_ZONE',
      interZoneSurchargeKES: 0,
      estimatedSlaMinutes: '15 - 30 minutes',
      notes: 'Standard intra-zone delivery. Baseline delivery fee applies.',
    };
  }

  // Cross-zone (e.g. Central to East or South to Central)
  return {
    isEligible: true,
    transitType: 'INTER_ZONE',
    interZoneSurchargeKES: 60,
    estimatedSlaMinutes: '35 - 50 minutes',
    notes: 'Inter-zone transit bridge (+KES 60 surcharge applies). Extended delivery SLA due to cross-city traffic.',
  };
}
