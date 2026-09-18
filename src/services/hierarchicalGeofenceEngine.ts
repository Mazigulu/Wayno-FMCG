/**
 * WAYNO HIERARCHICAL GEOGRAPHIC SUPPLY NETWORK ENGINE
 * 
 * Implements a hierarchical geographic supply network where:
 * 1. 20 km wholesaler territory is the fundamental local supply node.
 * 2. Nodes form an explicit tree topology (Root -> Region -> 20 km Local Nodes).
 * 3. Procurement follows Local-First Hierarchical Search with Controlled Escalation:
 *    Local Node -> Found? -> Fulfill
 *               -> Not Found? -> Check Parent Node + Secondary Escape Path (Cross-Node Nearby Sourcing)
 *               -> If neither -> Escalate to Grandparent / Root
 * 4. Distinct 4-Engine Separation of Responsibilities:
 *    - Geo Engine: "Where?" (Shop coordinates, 20 km node containment, straight-line vs road distance)
 *    - Supply Engine: "Who has it?" (Local-first search, tree traversal, cross-node escape path)
 *    - Routing Engine: "How to deliver?" (Shortest path vs Vehicle Routing Problem multi-drop optimizer)
 *    - Optimization Engine: "Which combination produces feasible/economical fulfillment?" (20 km rider mandate & exception mechanisms)
 * 5. Relational PostGIS representation & Recursive CTE SQL queries.
 * 6. Procurement & Machine Learning intelligence layer.
 */

import {
  SupplyNode,
  SupplyNodeLevel,
  HierarchicalEscalationStep,
  HierarchicalProcurementResolution,
  VehicleRoutingStop,
  VehicleRoutingComparison,
  RiderMandateEvaluation,
} from '../types/wayno';

// ============================================================================
// 1. CANONICAL HIERARCHICAL SUPPLY NODES (TREE TOPOLOGY)
// ============================================================================

export const SUPPLY_NODES: SupplyNode[] = [
  // LEVEL 0: ROOT
  {
    id: 'root_kenya',
    parentZoneId: null,
    name: 'WAYNO Kenya National Supply Grid',
    code: 'ROOT-KE-01',
    level: 'ROOT',
    centerPoint: { lat: -1.286389, lng: 36.817223 }, // Nairobi Central
    radiusKm: 500,
    wholesalerId: 'ws_national_central',
    wholesalerName: 'National FMCG Buffer Terminal',
    shopsCount: 1420,
    status: 'ACTIVE',
    inventoryCoveragePct: 99.8,
  },

  // LEVEL 1: REGIONS
  {
    id: 'region_nairobi_metro',
    parentZoneId: 'root_kenya',
    name: 'Nairobi Metropolitan Supply Corridor',
    code: 'REG-NBI-01',
    level: 'REGION',
    centerPoint: { lat: -1.286389, lng: 36.817223 },
    radiusKm: 60,
    wholesalerId: 'ws_nairobi_consolidation',
    wholesalerName: 'Nairobi Metro Regional Distribution Hub',
    shopsCount: 445,
    status: 'ACTIVE',
    inventoryCoveragePct: 97.4,
  },
  {
    id: 'region_western_kenya',
    parentZoneId: 'root_kenya',
    name: 'Western Kenya FMCG Corridor',
    code: 'REG-WST-02',
    level: 'REGION',
    centerPoint: { lat: 0.2827, lng: 34.7519 }, // Kakamega/Kisumu
    radiusKm: 120,
    wholesalerId: 'ws_western_consolidation',
    wholesalerName: 'Lake Basin FMCG Distribution Depot',
    shopsCount: 280,
    status: 'ACTIVE',
    inventoryCoveragePct: 94.1,
  },

  // LEVEL 2: 20 KM LOCAL SUPPLY NODES (THE FUNDAMENTAL BUILDING BLOCKS)
  {
    id: 'node_eastleigh_20km',
    parentZoneId: 'region_nairobi_metro',
    name: 'Eastleigh Commercial Node (20 km)',
    code: 'NODE-NBI-01',
    level: 'LOCAL_NODE',
    centerPoint: { lat: -1.2750, lng: 36.8510 },
    radiusKm: 20,
    wholesalerId: 'ws_eastleigh',
    wholesalerName: 'Eastleigh Mega Wholesale Depot (Somlink Ltd)',
    shopsCount: 142,
    status: 'ACTIVE',
    inventoryCoveragePct: 96.5,
  },
  {
    id: 'node_industrial_area_20km',
    parentZoneId: 'region_nairobi_metro',
    name: 'Industrial Area Supply Node (20 km)',
    code: 'NODE-NBI-02',
    level: 'LOCAL_NODE',
    centerPoint: { lat: -1.3120, lng: 36.8480 },
    radiusKm: 20,
    wholesalerId: 'ws_industrial',
    wholesalerName: 'Industrial Area Direct Supply Hub (Kenya Fast-Move)',
    shopsCount: 188,
    status: 'ACTIVE',
    inventoryCoveragePct: 98.2,
  },
  {
    id: 'node_nairobi_west_20km',
    parentZoneId: 'region_nairobi_metro',
    name: 'Nairobi West & Dagoretti Node (20 km)',
    code: 'NODE-NBI-03',
    level: 'LOCAL_NODE',
    centerPoint: { lat: -1.3075, lng: 36.8180 },
    radiusKm: 20,
    wholesalerId: 'ws_westlands',
    wholesalerName: 'Nairobi West Wholesale Terminal (Highlands Co-op)',
    shopsCount: 115,
    status: 'ACTIVE',
    inventoryCoveragePct: 93.8,
  },
  {
    id: 'node_bungoma_04_20km',
    parentZoneId: 'region_western_kenya',
    name: 'Bungoma Central Node (20 km)',
    code: 'NODE-BGM-04',
    level: 'LOCAL_NODE',
    centerPoint: { lat: 0.5696, lng: 34.5584 },
    radiusKm: 20,
    wholesalerId: 'ws_bungoma_01',
    wholesalerName: 'Wholesaler X (Western Super Distributor Bungoma)',
    shopsCount: 78,
    status: 'ACTIVE',
    inventoryCoveragePct: 91.2,
  },
];

// ============================================================================
// ENGINE 1: GEO ENGINE ("WHERE?")
// ============================================================================

export const geoEngine = {
  getAllNodes(): SupplyNode[] {
    return SUPPLY_NODES;
  },

  getLocalNodes(): SupplyNode[] {
    return SUPPLY_NODES.filter((n) => n.level === 'LOCAL_NODE');
  },

  getNodeById(nodeId: string): SupplyNode | undefined {
    return SUPPLY_NODES.find((n) => n.id === nodeId);
  },

  /**
   * Calculates straight-line Haversine distance in kilometers.
   * Defines initial 20 km geographic node boundary eligibility.
   */
  calculateStraightLineRadiusKm(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  },

  /**
   * Estimates actual road distance and travel time.
   * Models Kenyan road network winding factors (e.g. 12 km straight line -> 19 km road network).
   */
  estimateRoadDistanceAndTravelTime(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number },
    windingFactor = 1.38
  ): { roadDistanceKm: number; estimatedTravelTimeMinutes: number } {
    const straightLine = this.calculateStraightLineRadiusKm(p1, p2);
    const roadDistanceKm = parseFloat((straightLine * windingFactor).toFixed(1));
    // Average urban/sub-urban boda speed: 25 km/h + 5 min dispatch overhead
    const estimatedTravelTimeMinutes = Math.round((roadDistanceKm / 25) * 60 + 5);
    return { roadDistanceKm, estimatedTravelTimeMinutes };
  },

  /**
   * Finds the local 20 km supply node a shop belongs to based on coordinates.
   */
  findLocalNodeForShop(coordinates: { lat: number; lng: number }): SupplyNode {
    const localNodes = this.getLocalNodes();
    let closestNode = localNodes[0];
    let minDistance = Infinity;

    for (const node of localNodes) {
      const dist = this.calculateStraightLineRadiusKm(coordinates, node.centerPoint);
      if (dist <= node.radiusKm && dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }

    // If outside exact 20km of all known nodes, attach to nearest local node
    if (minDistance === Infinity) {
      for (const node of localNodes) {
        const dist = this.calculateStraightLineRadiusKm(coordinates, node.centerPoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = node;
        }
      }
    }

    return closestNode;
  },

  /**
   * Traverses upward from local node through parent to ROOT.
   */
  getAncestorHierarchy(localNodeId: string): SupplyNode[] {
    const hierarchy: SupplyNode[] = [];
    let current = this.getNodeById(localNodeId);

    while (current) {
      hierarchy.push(current);
      if (!current.parentZoneId) break;
      current = this.getNodeById(current.parentZoneId);
    }

    return hierarchy;
  },
};

// ============================================================================
// ENGINE 2: SUPPLY ENGINE ("WHO HAS IT?")
// ============================================================================

export interface SearchEscalationOptions {
  shopId: string;
  shopName: string;
  shopCoordinates: { lat: number; lng: number };
  productId: string;
  productName: string;
  requestedQty: number;
  mockLocalStockAvailable?: boolean;
  mockParentStockAvailable?: boolean;
  mockNearbyEscapeStockAvailable?: boolean;
}

export const supplyEngine = {
  /**
   * Local-first hierarchical search with controlled upward escalation
   * and secondary cross-node escape path.
   */
  executeHierarchicalProcurement(options: SearchEscalationOptions): HierarchicalProcurementResolution {
    const {
      shopId,
      shopName,
      shopCoordinates,
      productId,
      productName,
      requestedQty,
      mockLocalStockAvailable = true,
      mockParentStockAvailable = true,
      mockNearbyEscapeStockAvailable = true,
    } = options;

    const assignedLocalNode = geoEngine.findLocalNodeForShop(shopCoordinates);
    const traversalSteps: HierarchicalEscalationStep[] = [];
    let stepCount = 1;

    // ------------------------------------------------------------------------
    // STEP 1: LOCAL NODE CHECK (Wholesaler Anchor within 20 km)
    // ------------------------------------------------------------------------
    const localRoad = geoEngine.estimateRoadDistanceAndTravelTime(shopCoordinates, assignedLocalNode.centerPoint);
    const localStep: HierarchicalEscalationStep = {
      stepNumber: stepCount++,
      nodeId: assignedLocalNode.id,
      nodeName: assignedLocalNode.name,
      level: assignedLocalNode.level,
      wholesalerId: assignedLocalNode.wholesalerId || 'ws_unknown',
      wholesalerName: assignedLocalNode.wholesalerName || 'Local Anchor',
      isAvailable: mockLocalStockAvailable,
      stockQuantity: mockLocalStockAvailable ? 45 : 0,
      wholesalePriceKES: 1720,
      sourceType: 'LOCAL_NODE',
      distanceKm: localRoad.roadDistanceKm,
      travelTimeMinutes: localRoad.estimatedTravelTimeMinutes,
      reason: mockLocalStockAvailable
        ? 'Full inventory available at primary local supply node anchor.'
        : 'Out of stock at local node. Initiating controlled hierarchical escalation.',
    };
    traversalSteps.push(localStep);

    if (mockLocalStockAvailable) {
      return {
        requestId: `PROC-${Date.now()}`,
        shopId,
        shopName,
        shopCoordinates,
        assignedLocalNode,
        productName,
        requestedQty,
        traversalSteps,
        resolvedStep: localStep,
        fulfillmentStatus: 'FULFILLED_LOCAL',
        totalCostKES: 1720 * requestedQty,
        leadTimeMinutes: localRoad.estimatedTravelTimeMinutes,
        transportSurchargeKES: 0,
        procurementIntelligenceNote: `Fulfilled directly from local anchor node (${assignedLocalNode.code}). Zero cross-node transfer overhead.`,
      };
    }

    // ------------------------------------------------------------------------
    // STEP 2: DUAL EVALUATION (Parent Node in Tree vs. Secondary Escape Path)
    // ------------------------------------------------------------------------
    const parentNode = assignedLocalNode.parentZoneId
      ? geoEngine.getNodeById(assignedLocalNode.parentZoneId)
      : null;

    // Check parent node in hierarchy
    let parentStep: HierarchicalEscalationStep | null = null;
    if (parentNode) {
      const parentRoad = geoEngine.estimateRoadDistanceAndTravelTime(shopCoordinates, parentNode.centerPoint, 1.45);
      parentStep = {
        stepNumber: stepCount++,
        nodeId: parentNode.id,
        nodeName: parentNode.name,
        level: parentNode.level,
        wholesalerId: parentNode.wholesalerId || 'ws_parent',
        wholesalerName: parentNode.wholesalerName || 'Regional Hub',
        isAvailable: mockParentStockAvailable,
        stockQuantity: mockParentStockAvailable ? 120 : 0,
        wholesalePriceKES: 1740,
        sourceType: 'PARENT_HIERARCHY',
        distanceKm: parentRoad.roadDistanceKm,
        travelTimeMinutes: parentRoad.estimatedTravelTimeMinutes,
        reason: mockParentStockAvailable
          ? 'Found at Parent Regional Hub. Available for inter-node dispatch.'
          : 'Stockout at Parent Hub. Escalating to National Root.',
      };
      traversalSteps.push(parentStep);
    }

    // Secondary Escape Path: Check if an adjacent node wholesaler is closer than Parent
    const otherNodes = geoEngine
      .getLocalNodes()
      .filter((n) => n.id !== assignedLocalNode.id);
    
    let closestAdjacentNode: SupplyNode | null = null;
    let closestAdjacentDist = Infinity;
    for (const node of otherNodes) {
      const dist = geoEngine.calculateStraightLineRadiusKm(shopCoordinates, node.centerPoint);
      if (dist < closestAdjacentDist) {
        closestAdjacentDist = dist;
        closestAdjacentNode = node;
      }
    }

    let escapeStep: HierarchicalEscalationStep | null = null;
    if (closestAdjacentNode && closestAdjacentDist <= 25) {
      const escapeRoad = geoEngine.estimateRoadDistanceAndTravelTime(shopCoordinates, closestAdjacentNode.centerPoint);
      escapeStep = {
        stepNumber: stepCount++,
        nodeId: closestAdjacentNode.id,
        nodeName: closestAdjacentNode.name,
        level: closestAdjacentNode.level,
        wholesalerId: closestAdjacentNode.wholesalerId || 'ws_escape',
        wholesalerName: closestAdjacentNode.wholesalerName || 'Adjacent Wholesaler',
        isAvailable: mockNearbyEscapeStockAvailable,
        stockQuantity: mockNearbyEscapeStockAvailable ? 60 : 0,
        wholesalePriceKES: 1735,
        sourceType: 'CROSS_NODE_ESCAPE',
        distanceKm: escapeRoad.roadDistanceKm,
        travelTimeMinutes: escapeRoad.estimatedTravelTimeMinutes,
        reason: mockNearbyEscapeStockAvailable
          ? `Cross-Node Proximity Override: Neighboring node (${closestAdjacentNode.code}) has stock only ${escapeRoad.roadDistanceKm}km away.`
          : 'Adjacent node checked but also out of stock.',
      };
      traversalSteps.push(escapeStep);
    }

    // Determine Best Feasible Source between Parent and Secondary Escape
    if (escapeStep && escapeStep.isAvailable && (!parentStep || !parentStep.isAvailable || escapeStep.distanceKm < parentStep.distanceKm)) {
      return {
        requestId: `PROC-${Date.now()}`,
        shopId,
        shopName,
        shopCoordinates,
        assignedLocalNode,
        productName,
        requestedQty,
        traversalSteps,
        resolvedStep: escapeStep,
        fulfillmentStatus: 'FULFILLED_CROSS_NODE',
        totalCostKES: escapeStep.wholesalePriceKES * requestedQty + 60,
        leadTimeMinutes: escapeStep.travelTimeMinutes,
        transportSurchargeKES: 60, // Cross-node bridge fee
        procurementIntelligenceNote: `Secondary escape path activated. Sourced from adjacent node (${escapeStep.nodeName}) saving ${parentStep ? Math.max(0, parentStep.distanceKm - escapeStep.distanceKm).toFixed(1) : '15'} km vs. parent hierarchy.`,
      };
    }

    if (parentStep && parentStep.isAvailable) {
      return {
        requestId: `PROC-${Date.now()}`,
        shopId,
        shopName,
        shopCoordinates,
        assignedLocalNode,
        productName,
        requestedQty,
        traversalSteps,
        resolvedStep: parentStep,
        fulfillmentStatus: 'FULFILLED_PARENT',
        totalCostKES: parentStep.wholesalePriceKES * requestedQty + 90,
        leadTimeMinutes: parentStep.travelTimeMinutes,
        transportSurchargeKES: 90,
        procurementIntelligenceNote: `Fulfilled via Parent Hierarchy (${parentStep.nodeName}). Inter-regional dispatch scheduled.`,
      };
    }

    // ------------------------------------------------------------------------
    // STEP 3: ROOT CONSOLIDATION FALLBACK
    // ------------------------------------------------------------------------
    const rootNode = geoEngine.getNodeById('root_kenya')!;
    const rootRoad = geoEngine.estimateRoadDistanceAndTravelTime(shopCoordinates, rootNode.centerPoint, 1.5);
    const rootStep: HierarchicalEscalationStep = {
      stepNumber: stepCount++,
      nodeId: rootNode.id,
      nodeName: rootNode.name,
      level: 'ROOT',
      wholesalerId: rootNode.wholesalerId || 'ws_root',
      wholesalerName: rootNode.wholesalerName || 'National Buffer',
      isAvailable: true,
      stockQuantity: 500,
      wholesalePriceKES: 1750,
      sourceType: 'GRANDPARENT_ROOT',
      distanceKm: rootRoad.roadDistanceKm,
      travelTimeMinutes: rootRoad.estimatedTravelTimeMinutes,
      reason: 'Local and regional nodes exhausted. Sourced from National Buffer Terminal.',
    };
    traversalSteps.push(rootStep);

    return {
      requestId: `PROC-${Date.now()}`,
      shopId,
      shopName,
      shopCoordinates,
      assignedLocalNode,
      productName,
      requestedQty,
      traversalSteps,
      resolvedStep: rootStep,
      fulfillmentStatus: 'STOCKOUT_ESCALATED_ROOT',
      totalCostKES: rootStep.wholesalePriceKES * requestedQty + 150,
      leadTimeMinutes: rootStep.travelTimeMinutes,
      transportSurchargeKES: 150,
      procurementIntelligenceNote: 'High escalation alert! Stockout at local node triggered full upward traversal to National Buffer. Flagged for local inventory replenishment.',
    };
  },
};

// ============================================================================
// ENGINE 3: ROUTING ENGINE ("HOW TO DELIVER?")
// ============================================================================

export const routingEngine = {
  /**
   * Distinguishes Shortest Path (point-to-point) from
   * Vehicle Routing Problem (VRP / TSP multi-drop sequence).
   * 
   * Compares naive sequence (A -> B -> C -> D -> E) vs
   * 2-Opt / Nearest-Neighbor optimized circuit (e.g. C -> A -> D -> B -> E).
   */
  optimizeMultiDropTour(
    depot: { name: string; lat: number; lng: number },
    stops: VehicleRoutingStop[]
  ): VehicleRoutingComparison {
    if (stops.length === 0) {
      return {
        depotName: depot.name,
        stopsCount: 0,
        naiveSequence: [],
        naiveDistanceKm: 0,
        naiveDurationMinutes: 0,
        optimizedSequence: [],
        optimizedDistanceKm: 0,
        optimizedDurationMinutes: 0,
        fuelSavingsPct: 0,
        timeSavedMinutes: 0,
        carbonReductionKg: 0,
      };
    }

    // 1. Naive Sequence: Exact order of arrival in dispatch queue
    const naiveSequence = [depot.name, ...stops.map((s) => s.shopName), `${depot.name} (Return)`];
    let naiveDist = 0;
    let currentPoint = { lat: depot.lat, lng: depot.lng };

    for (const stop of stops) {
      naiveDist += geoEngine.estimateRoadDistanceAndTravelTime(currentPoint, {
        lat: stop.latitude,
        lng: stop.longitude,
      }).roadDistanceKm;
      currentPoint = { lat: stop.latitude, lng: stop.longitude };
    }
    // Return to depot
    naiveDist += geoEngine.estimateRoadDistanceAndTravelTime(currentPoint, {
      lat: depot.lat,
      lng: depot.lng,
    }).roadDistanceKm;

    const naiveDurationMinutes = Math.round((naiveDist / 25) * 60 + stops.length * 6);

    // 2. Optimized Sequence using Nearest-Neighbor heuristic
    const remainingStops = [...stops];
    const optimizedStops: VehicleRoutingStop[] = [];
    currentPoint = { lat: depot.lat, lng: depot.lng };

    while (remainingStops.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remainingStops.length; i++) {
        const d = geoEngine.calculateStraightLineRadiusKm(currentPoint, {
          lat: remainingStops[i].latitude,
          lng: remainingStops[i].longitude,
        });
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const nextStop = remainingStops.splice(nearestIdx, 1)[0];
      optimizedStops.push(nextStop);
      currentPoint = { lat: nextStop.latitude, lng: nextStop.longitude };
    }

    // Calculate optimized road distance
    let optDist = 0;
    currentPoint = { lat: depot.lat, lng: depot.lng };
    for (const stop of optimizedStops) {
      optDist += geoEngine.estimateRoadDistanceAndTravelTime(currentPoint, {
        lat: stop.latitude,
        lng: stop.longitude,
      }).roadDistanceKm;
      currentPoint = { lat: stop.latitude, lng: stop.longitude };
    }
    // Return to depot
    optDist += geoEngine.estimateRoadDistanceAndTravelTime(currentPoint, {
      lat: depot.lat,
      lng: depot.lng,
    }).roadDistanceKm;

    const optimizedDurationMinutes = Math.round((optDist / 25) * 60 + stops.length * 6);
    const naiveDistanceKm = parseFloat(naiveDist.toFixed(1));
    const optimizedDistanceKm = parseFloat(optDist.toFixed(1));
    const distanceSavedKm = Math.max(0, naiveDistanceKm - optimizedDistanceKm);
    const fuelSavingsPct = parseFloat(((distanceSavedKm / naiveDistanceKm) * 100).toFixed(1));
    const timeSavedMinutes = Math.max(0, naiveDurationMinutes - optimizedDurationMinutes);
    const carbonReductionKg = parseFloat((distanceSavedKm * 0.078).toFixed(2)); // ~78g CO2/km motorcycle

    const optimizedSequence = [
      depot.name,
      ...optimizedStops.map((s) => s.shopName),
      `${depot.name} (Return)`,
    ];

    return {
      depotName: depot.name,
      stopsCount: stops.length,
      naiveSequence,
      naiveDistanceKm,
      naiveDurationMinutes,
      optimizedSequence,
      optimizedDistanceKm,
      optimizedDurationMinutes,
      fuelSavingsPct,
      timeSavedMinutes,
      carbonReductionKg,
    };
  },
};

// ============================================================================
// ENGINE 4: OPTIMIZATION & EXCEPTION ENGINE (20 KM MANDATE & OUT-OF-ZONE)
// ============================================================================

export const optimizationEngine = {
  /**
   * Evaluates rider against the 20 km normal operating mandate.
   * If outside the 20 km mandate (e.g. 28 km), triggers the exception engine:
   * 1. Route Extension (extra distance fee)
   * 2. Boundary Handoff (Rider A -> Boundary Hub -> Rider B)
   * 3. Dedicated Carrier (Cargo Tuk-Tuk or Pickup Van)
   */
  evaluateRiderMandate(
    roadDistanceKm: number,
    straightLineDistanceKm: number,
    cargoWeightKg = 24
  ): RiderMandateEvaluation {
    const NORMAL_MANDATE_KM = 20.0;
    const baseDeliveryFee = 150; // KES

    // Scenario A: Within Normal 20 km Mandate
    if (roadDistanceKm <= NORMAL_MANDATE_KM) {
      return {
        roadDistanceKm,
        straightLineDistanceKm,
        normalMandateRadiusKm: NORMAL_MANDATE_KM,
        isWithinMandate: true,
        exceptionType: 'IN_MANDATE',
        extraKm: 0,
        baseDeliveryFeeKES: baseDeliveryFee,
        extensionFeeKES: 0,
        totalDeliveryFeeKES: baseDeliveryFee,
        slaMinutes: `${Math.round((roadDistanceKm / 25) * 60 + 5)} - ${Math.round((roadDistanceKm / 25) * 60 + 15)} mins`,
        recommendedVehicle: 'Boda Boda (Single)',
        operationalProcedure: 'Standard in-mandate boda dispatch. Single rider handles pickup to doorstep delivery.',
      };
    }

    const extraKm = parseFloat((roadDistanceKm - NORMAL_MANDATE_KM).toFixed(1));

    // Scenario B: Route Extension (20.1 km - 27.9 km, light cargo)
    if (roadDistanceKm <= 28.0 && cargoWeightKg <= 45) {
      const extensionFee = Math.round(extraKm * 18); // KES 18 per extra km
      return {
        roadDistanceKm,
        straightLineDistanceKm,
        normalMandateRadiusKm: NORMAL_MANDATE_KM,
        isWithinMandate: false,
        exceptionType: 'ROUTE_EXTENSION',
        extraKm,
        baseDeliveryFeeKES: baseDeliveryFee,
        extensionFeeKES: extensionFee,
        totalDeliveryFeeKES: baseDeliveryFee + extensionFee,
        slaMinutes: '45 - 65 mins',
        recommendedVehicle: 'Boda Boda (Single)',
        operationalProcedure: `Route Extension Approved: Rider prompted to accept +${extraKm}km extended journey for an additional KES ${extensionFee} mileage compensation.`,
      };
    }

    // Scenario C: Boundary Handoff (28.1 km - 42.0 km)
    if (roadDistanceKm <= 42.0) {
      const extensionFee = Math.round(extraKm * 15);
      return {
        roadDistanceKm,
        straightLineDistanceKm,
        normalMandateRadiusKm: NORMAL_MANDATE_KM,
        isWithinMandate: false,
        exceptionType: 'BOUNDARY_HANDOFF',
        extraKm,
        baseDeliveryFeeKES: baseDeliveryFee,
        extensionFeeKES: extensionFee,
        totalDeliveryFeeKES: baseDeliveryFee + extensionFee + 50, // Hub transfer fee
        slaMinutes: '60 - 90 mins',
        handoffExchangeHub: {
          name: 'Roysambu / Outer Ring Perimeter Exchange Hub',
          latitude: -1.2185,
          longitude: 36.8865,
        },
        recommendedVehicle: 'Boda Relay (2 Riders)',
        operationalProcedure: 'Boundary Handoff Protocol: Rider 1 transports consignment to 20 km boundary hub. Rider 2 receives via OTP verification and completes final last-mile leg.',
      };
    }

    // Scenario D: Dedicated Carrier (> 42 km or heavy cargo)
    const heavyTransportFee = Math.round(roadDistanceKm * 25);
    return {
      roadDistanceKm,
      straightLineDistanceKm,
      normalMandateRadiusKm: NORMAL_MANDATE_KM,
      isWithinMandate: false,
      exceptionType: 'DEDICATED_CARRIER',
      extraKm,
      baseDeliveryFeeKES: 350,
      extensionFeeKES: heavyTransportFee,
      totalDeliveryFeeKES: 350 + heavyTransportFee,
      slaMinutes: '90 - 150 mins',
      recommendedVehicle: cargoWeightKg > 150 ? '1-Tonne Pickup Van' : 'Cargo Tuk-Tuk',
      operationalProcedure: 'Dedicated Carrier Dispatch: Consignment exceeds motorcycle operating boundary. Reassigned to 3-wheeler Tuk-Tuk or 1-tonne pickup van.',
    };
  },
};

// ============================================================================
// DATABASE / POSTGIS RECURSIVE SQL DEFINITION
// ============================================================================

export const POSTGIS_SERVICE_ZONE_SCHEMA = `
-- ============================================================================
-- WAYNO HIERARCHICAL SERVICE ZONES TABLE (POSTGIS DDL)
-- ============================================================================
CREATE TABLE service_zones (
    id VARCHAR(64) PRIMARY KEY,
    parent_zone_id VARCHAR(64) REFERENCES service_zones(id) ON DELETE SET NULL,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    level VARCHAR(16) NOT NULL CHECK (level IN ('ROOT', 'REGION', 'LOCAL_NODE')),
    radius_km NUMERIC(6, 2) NOT NULL DEFAULT 20.00,
    center_point GEOMETRY(POINT, 4326) NOT NULL,
    boundary_polygon GEOMETRY(POLYGON, 4326),
    wholesaler_id VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONGESTED', 'MAINTENANCE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial GiST Index for sub-millisecond point-in-polygon containment
CREATE INDEX idx_service_zones_center_gist ON service_zones USING GIST (center_point);
CREATE INDEX idx_service_zones_parent_zone_id ON service_zones(parent_zone_id);

-- ============================================================================
-- RECURSIVE HIERARCHICAL TREE TRAVERSAL QUERY (POSTGRES / POSTGIS)
-- Traverses upward from any 20km local node to Parent Region up to National ROOT
-- ============================================================================
WITH RECURSIVE supply_hierarchy AS (
    -- Anchor member: Target local node
    SELECT 
        id, 
        parent_zone_id, 
        name, 
        code, 
        level, 
        radius_km, 
        wholesaler_id, 
        1 AS tree_depth
    FROM service_zones
    WHERE id = :target_local_node_id

    UNION ALL

    -- Recursive member: Traverse upward to parent_zone_id
    SELECT 
        z.id, 
        z.parent_zone_id, 
        z.name, 
        z.code, 
        z.level, 
        z.radius_km, 
        z.wholesaler_id, 
        h.tree_depth + 1
    FROM service_zones z
    INNER JOIN supply_hierarchy h ON z.id = h.parent_zone_id
)
SELECT * FROM supply_hierarchy ORDER BY tree_depth ASC;
`;

// ============================================================================
// PROCUREMENT & ML INTELLIGENCE LAYER
// ============================================================================

export interface ProcurementTelemetryInsight {
  nodeId: string;
  nodeName: string;
  localFulfillmentRatePct: number;
  parentEscalationRatePct: number;
  crossNodeEscapeRatePct: number;
  topStockoutCategory: string;
  recommendedSafetyStockBufferCases: number;
  potentialTransportSavingsKES: number;
  healthStatus: 'HEALTHY' | 'WARNING_FREQUENT_ESCALATIONS' | 'CRITICAL_SPILLOVER';
}

export const procurementIntelligence = {
  getTelemetryInsights(): ProcurementTelemetryInsight[] {
    return [
      {
        nodeId: 'node_eastleigh_20km',
        nodeName: 'Eastleigh Commercial Node',
        localFulfillmentRatePct: 92.4,
        parentEscalationRatePct: 4.8,
        crossNodeEscapeRatePct: 2.8,
        topStockoutCategory: 'Cooking Oil (Fresh Fri 1L)',
        recommendedSafetyStockBufferCases: 35,
        potentialTransportSavingsKES: 42000,
        healthStatus: 'HEALTHY',
      },
      {
        nodeId: 'node_industrial_area_20km',
        nodeName: 'Industrial Area Supply Node',
        localFulfillmentRatePct: 95.8,
        parentEscalationRatePct: 2.9,
        crossNodeEscapeRatePct: 1.3,
        topStockoutCategory: 'Bar Soaps (Menengai 1kg)',
        recommendedSafetyStockBufferCases: 50,
        potentialTransportSavingsKES: 28500,
        healthStatus: 'HEALTHY',
      },
      {
        nodeId: 'node_nairobi_west_20km',
        nodeName: 'Nairobi West & Dagoretti Node',
        localFulfillmentRatePct: 76.1,
        parentEscalationRatePct: 15.4,
        crossNodeEscapeRatePct: 8.5,
        topStockoutCategory: 'Maize Meal (Jogoo 2kg Bale)',
        recommendedSafetyStockBufferCases: 80,
        potentialTransportSavingsKES: 98400,
        healthStatus: 'WARNING_FREQUENT_ESCALATIONS',
      },
      {
        nodeId: 'node_bungoma_04_20km',
        nodeName: 'Bungoma Central Node',
        localFulfillmentRatePct: 71.5,
        parentEscalationRatePct: 21.0,
        crossNodeEscapeRatePct: 7.5,
        topStockoutCategory: 'Wheat Flour & Sugar (Ndovu 2kg)',
        recommendedSafetyStockBufferCases: 65,
        potentialTransportSavingsKES: 114000,
        healthStatus: 'CRITICAL_SPILLOVER',
      },
    ];
  },
};
