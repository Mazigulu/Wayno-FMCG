import { 
  PipelineStageInfo, 
  WholesalePriceDispersion, 
  ZoneLiquidityMetric, 
  BrandMarketShare, 
  FMCGBasketIndexPoint, 
  MarketAnomalyAlert,
  MarketEvent 
} from '../types/marketIntelligence';

// ---------------------------------------------------------------------------
// 1. PIPELINE STAGE SPECIFICATIONS & ARCHITECTURE TOPOLOGY
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES_SPEC: PipelineStageInfo[] = [
  {
    id: 'STREAM_INGESTION',
    name: 'Real-Time Telemetry Ingestion',
    stepNumber: 1,
    description: 'High-throughput edge collectors ingesting live duka search queries, checkout order transactions, wholesaler depot inventory syncs, spot price pings, and boda rider telemetry.',
    status: 'HEALTHY',
    throughputPerSec: 1480,
    latencyMs: 8,
    queueDepth: 142,
    processed24h: 3845000,
    activeWorkers: 12,
    errorRatePercent: 0.02,
    techStack: 'Redpanda / Kafka + Rust Tokio Ingest Gateway',
    keyFunctions: [
      'Duka Search Query Event Listener (Swahili & Sheng text streams)',
      'Checkout Transaction & Basket Velocity Logger',
      'Wholesaler Depot Stock Delta Webhooks',
      'M-Pesa STK Push Settlement Telemetry',
      'Rider Geo-Transit Corridor Ping Collector'
    ]
  },
  {
    id: 'CLEANSING_ETL',
    name: 'Normalization & Geo-Clustering ETL',
    stepNumber: 2,
    description: 'Resolves raw informal duka inputs into standardized FMCG master taxonomy, deduplicates concurrent signals, maps informal neighborhood locations to micro-zones, and anonymizes merchant PII.',
    status: 'HEALTHY',
    throughputPerSec: 1420,
    latencyMs: 14,
    queueDepth: 88,
    processed24h: 3790000,
    activeWorkers: 16,
    errorRatePercent: 0.04,
    techStack: 'NestJS Workers + Arrow / DuckDB In-Memory Cleansing',
    keyFunctions: [
      'Sheng & Colloquial Phrasing Resolver (e.g., "chwani" -> 50 KES pack)',
      'Master FMCG Catalog Barcode & Brand Aliasing',
      'Geofenced Micro-Zone Snapping (e.g. Eastleigh Section 3 -> Nairobi East)',
      'Zero-Result & Suppressed Query Isolation',
      'Merchant Privacy & Transaction Hash Anonymization'
    ]
  },
  {
    id: 'AGGREGATION_ROLLUP',
    name: 'Multi-Dimensional Window Rollups',
    stepNumber: 3,
    description: 'Computes continuous rolling sliding-window aggregates across geographic zones, FMCG categories, brand market shares, depot wholesale price spreads, and unmet demand indexes.',
    status: 'HEALTHY',
    throughputPerSec: 1280,
    latencyMs: 22,
    queueDepth: 64,
    processed24h: 3680000,
    activeWorkers: 8,
    errorRatePercent: 0.01,
    techStack: 'Apache Flink / TimescaleDB Rolling Materialized Views',
    keyFunctions: [
      'Zone Liquidity & Realized vs. Unmet Demand Matrix',
      'Cross-Depot Wholesale Price Dispersion & Arbitrage Spread Tracker',
      'Brand Volume & Penetration Share by Urban Zone',
      'FMCG Duka Essential Basket Inflation Index (MoM & WoW)',
      'SKU Consumption Velocity & Buffer Hours to Exhaustion'
    ]
  },
  {
    id: 'ML_INFERENCE',
    name: 'Predictive & Algorithmic Synthesis',
    stepNumber: 4,
    description: 'Python & Rust ML inference engines running demand forecasting, price elasticity modeling, supply deficit early warning, and artificial price-spike anomaly detection.',
    status: 'HEALTHY',
    throughputPerSec: 960,
    latencyMs: 35,
    queueDepth: 42,
    processed24h: 2450000,
    activeWorkers: 6,
    errorRatePercent: 0.05,
    techStack: 'Python 3.11 / LightGBM + FastAPI + PyTorch ONNX Runtime',
    keyFunctions: [
      'Next 24h & 7-Day Regional SKU Demand Forecaster',
      'Stockout Early Warning System (Buffer < 24h triggers)',
      'Cross-Category Basket Co-Occurrence & Substitution Matrix',
      'Isolation Forest Wholesale Price Anomaly & Collusion Detector',
      'Manufacturer Trade Rebate & Promo Optimization Advisor'
    ]
  },
  {
    id: 'SYNDICATION_ACTION',
    name: 'Syndication & Automated Action Dispatcher',
    stepNumber: 5,
    description: 'Dispatches synthesized intelligence to downstream operational actors: auto-calibrates search ranking weights, alerts wholesaler procurement teams, and publishes enterprise data feeds.',
    status: 'HEALTHY',
    throughputPerSec: 840,
    latencyMs: 12,
    queueDepth: 25,
    processed24h: 2120000,
    activeWorkers: 4,
    errorRatePercent: 0.01,
    techStack: 'RabbitMQ Event Bus + WebSub Push Notifications + OpenAPI Webhooks',
    keyFunctions: [
      'Search Ranking Calibration (boost substitutes when primary SKU low)',
      'Wholesaler Portal Automated Restock Replenishment Pushes',
      'Manufacturer Brand Analytics & Market Share Export Feeds',
      'Real-Time Market Anomaly Mitigation Dispatches',
      'Enterprise JSON & CSV Market Intelligence Syndication API'
    ]
  }
];

// ---------------------------------------------------------------------------
// 2. WHOLESALE PRICE DISPERSION ACROSS NAIROBI DEPOTS
// ---------------------------------------------------------------------------

export const WHOLESALE_PRICE_DISPERSIONS: WholesalePriceDispersion[] = [
  {
    skuId: 'prod_jogoo',
    skuName: 'Jogoo Maize Meal Flour (12x2kg Bale)',
    category: 'Grains & Flours',
    packSize: '12 x 2kg Packets Bale',
    manufacturerRRP: 2400,
    avgWholesalePrice: 2075,
    minWholesalePrice: 2020,
    maxWholesalePrice: 2150,
    spreadKES: 130,
    spreadPercent: 6.4,
    priceElasticity: 'HIGH',
    arbitrageRisk: 'MODERATE',
    recommendedFloorKES: 2010,
    recommendedCeilingKES: 2120,
    depotPrices: [
      {
        depotId: 'depot_01',
        depotName: 'Eastleigh Mega Depot',
        zone: 'Nairobi East / Eastleigh',
        price: 2020,
        stockStatus: 'IN_STOCK',
        lastUpdated: '18 mins ago',
        minOrderQty: 2
      },
      {
        depotId: 'depot_02',
        depotName: 'Industrial Area Central Hub',
        zone: 'Industrial Area Corridor',
        price: 2050,
        stockStatus: 'IN_STOCK',
        lastUpdated: '5 mins ago',
        minOrderQty: 5
      },
      {
        depotId: 'depot_03',
        depotName: 'Westlands Wholesale Supplies',
        zone: 'Nairobi West / Westlands',
        price: 2150,
        stockStatus: 'IN_STOCK',
        lastUpdated: '42 mins ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_04',
        depotName: 'Kawangware Express Depot',
        zone: 'Kawangware / Riruta',
        price: 2080,
        stockStatus: 'LOW_STOCK',
        lastUpdated: '12 mins ago',
        minOrderQty: 1
      }
    ]
  },
  {
    skuId: 'prod_freshfri',
    skuName: 'Fresh Fri Cooking Oil (4x5L Jerrycans)',
    category: 'Oils & Fats',
    packSize: '4 x 5L Jerrycans Carton',
    manufacturerRRP: 4300,
    avgWholesalePrice: 3865,
    minWholesalePrice: 3820,
    maxWholesalePrice: 3950,
    spreadKES: 130,
    spreadPercent: 3.4,
    priceElasticity: 'MODERATE',
    arbitrageRisk: 'LOW',
    recommendedFloorKES: 3800,
    recommendedCeilingKES: 3920,
    depotPrices: [
      {
        depotId: 'depot_01',
        depotName: 'Eastleigh Mega Depot',
        zone: 'Nairobi East / Eastleigh',
        price: 3820,
        stockStatus: 'IN_STOCK',
        lastUpdated: '22 mins ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_02',
        depotName: 'Industrial Area Central Hub',
        zone: 'Industrial Area Corridor',
        price: 3840,
        stockStatus: 'IN_STOCK',
        lastUpdated: '10 mins ago',
        minOrderQty: 3
      },
      {
        depotId: 'depot_03',
        depotName: 'Westlands Wholesale Supplies',
        zone: 'Nairobi West / Westlands',
        price: 3950,
        stockStatus: 'IN_STOCK',
        lastUpdated: '1 hour ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_04',
        depotName: 'Kawangware Express Depot',
        zone: 'Kawangware / Riruta',
        price: 3850,
        stockStatus: 'IN_STOCK',
        lastUpdated: '30 mins ago',
        minOrderQty: 1
      }
    ]
  },
  {
    skuId: 'prod_pembe',
    skuName: 'Pembe Home Baking Flour (12x2kg Bale)',
    category: 'Grains & Flours',
    packSize: '12 x 2kg Packets Bale',
    manufacturerRRP: 2150,
    avgWholesalePrice: 1910,
    minWholesalePrice: 1860,
    maxWholesalePrice: 1980,
    spreadKES: 120,
    spreadPercent: 6.5,
    priceElasticity: 'HIGH',
    arbitrageRisk: 'HIGH',
    recommendedFloorKES: 1850,
    recommendedCeilingKES: 1940,
    depotPrices: [
      {
        depotId: 'depot_01',
        depotName: 'Eastleigh Mega Depot',
        zone: 'Nairobi East / Eastleigh',
        price: 1860,
        stockStatus: 'IN_STOCK',
        lastUpdated: '14 mins ago',
        minOrderQty: 2
      },
      {
        depotId: 'depot_02',
        depotName: 'Industrial Area Central Hub',
        zone: 'Industrial Area Corridor',
        price: 1890,
        stockStatus: 'IN_STOCK',
        lastUpdated: '8 mins ago',
        minOrderQty: 5
      },
      {
        depotId: 'depot_03',
        depotName: 'Westlands Wholesale Supplies',
        zone: 'Nairobi West / Westlands',
        price: 1980,
        stockStatus: 'LOW_STOCK',
        lastUpdated: '50 mins ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_04',
        depotName: 'Kawangware Express Depot',
        zone: 'Kawangware / Riruta',
        price: 1910,
        stockStatus: 'IN_STOCK',
        lastUpdated: '25 mins ago',
        minOrderQty: 1
      }
    ]
  },
  {
    skuId: 'prod_omo',
    skuName: 'Omo Hand Washing Powder (24x500g Carton)',
    category: 'Laundry & Household',
    packSize: '24 x 500g Pouches Carton',
    manufacturerRRP: 3100,
    avgWholesalePrice: 2680,
    minWholesalePrice: 2610,
    maxWholesalePrice: 2750,
    spreadKES: 140,
    spreadPercent: 5.4,
    priceElasticity: 'MODERATE',
    arbitrageRisk: 'MODERATE',
    recommendedFloorKES: 2600,
    recommendedCeilingKES: 2720,
    depotPrices: [
      {
        depotId: 'depot_01',
        depotName: 'Eastleigh Mega Depot',
        zone: 'Nairobi East / Eastleigh',
        price: 2610,
        stockStatus: 'IN_STOCK',
        lastUpdated: '20 mins ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_02',
        depotName: 'Industrial Area Central Hub',
        zone: 'Industrial Area Corridor',
        price: 2650,
        stockStatus: 'IN_STOCK',
        lastUpdated: '15 mins ago',
        minOrderQty: 3
      },
      {
        depotId: 'depot_03',
        depotName: 'Westlands Wholesale Supplies',
        zone: 'Nairobi West / Westlands',
        price: 2750,
        stockStatus: 'IN_STOCK',
        lastUpdated: '35 mins ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_04',
        depotName: 'Kawangware Express Depot',
        zone: 'Kawangware / Riruta',
        price: 2710,
        stockStatus: 'LOW_STOCK',
        lastUpdated: '8 mins ago',
        minOrderQty: 1
      }
    ]
  },
  {
    skuId: 'prod_mumias',
    skuName: 'Mumias Pure Cane Sugar (20x1kg Bale)',
    category: 'Sugar & Sweeteners',
    packSize: '20 x 1kg Packets Bale',
    manufacturerRRP: 3200,
    avgWholesalePrice: 2795,
    minWholesalePrice: 2720,
    maxWholesalePrice: 2890,
    spreadKES: 170,
    spreadPercent: 6.2,
    priceElasticity: 'INELASTIC',
    arbitrageRisk: 'HIGH',
    recommendedFloorKES: 2700,
    recommendedCeilingKES: 2840,
    depotPrices: [
      {
        depotId: 'depot_01',
        depotName: 'Eastleigh Mega Depot',
        zone: 'Nairobi East / Eastleigh',
        price: 2720,
        stockStatus: 'IN_STOCK',
        lastUpdated: '10 mins ago',
        minOrderQty: 2
      },
      {
        depotId: 'depot_02',
        depotName: 'Industrial Area Central Hub',
        zone: 'Industrial Area Corridor',
        price: 2760,
        stockStatus: 'IN_STOCK',
        lastUpdated: '6 mins ago',
        minOrderQty: 4
      },
      {
        depotId: 'depot_03',
        depotName: 'Westlands Wholesale Supplies',
        zone: 'Nairobi West / Westlands',
        price: 2890,
        stockStatus: 'OUT_OF_STOCK',
        lastUpdated: '2 hours ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_04',
        depotName: 'Kawangware Express Depot',
        zone: 'Kawangware / Riruta',
        price: 2810,
        stockStatus: 'LOW_STOCK',
        lastUpdated: '19 mins ago',
        minOrderQty: 1
      }
    ]
  },
  {
    skuId: 'prod_blueband',
    skuName: 'Blue Band Margarine Spread (12x500g Crate)',
    category: 'Spreads & Breakfast',
    packSize: '12 x 500g Tubs Crate',
    manufacturerRRP: 2850,
    avgWholesalePrice: 2470,
    minWholesalePrice: 2420,
    maxWholesalePrice: 2540,
    spreadKES: 120,
    spreadPercent: 5.0,
    priceElasticity: 'MODERATE',
    arbitrageRisk: 'LOW',
    recommendedFloorKES: 2400,
    recommendedCeilingKES: 2520,
    depotPrices: [
      {
        depotId: 'depot_01',
        depotName: 'Eastleigh Mega Depot',
        zone: 'Nairobi East / Eastleigh',
        price: 2420,
        stockStatus: 'IN_STOCK',
        lastUpdated: '32 mins ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_02',
        depotName: 'Industrial Area Central Hub',
        zone: 'Industrial Area Corridor',
        price: 2450,
        stockStatus: 'IN_STOCK',
        lastUpdated: '12 mins ago',
        minOrderQty: 2
      },
      {
        depotId: 'depot_03',
        depotName: 'Westlands Wholesale Supplies',
        zone: 'Nairobi West / Westlands',
        price: 2540,
        stockStatus: 'IN_STOCK',
        lastUpdated: '45 mins ago',
        minOrderQty: 1
      },
      {
        depotId: 'depot_04',
        depotName: 'Kawangware Express Depot',
        zone: 'Kawangware / Riruta',
        price: 2470,
        stockStatus: 'IN_STOCK',
        lastUpdated: '28 mins ago',
        minOrderQty: 1
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// 3. ZONE LIQUIDITY & SUPPLY-DEMAND MATRIX
// ---------------------------------------------------------------------------

export const ZONE_LIQUIDITY_METRICS: ZoneLiquidityMetric[] = [
  {
    zoneId: 'zone_eastleigh',
    zoneName: 'Nairobi East / Eastleigh Commercial Sector',
    primaryDepots: ['Eastleigh Mega Depot', 'Gikomba Supply Terminal'],
    activeDukas: 340,
    dailyGMVKES: 8450000,
    orderCount24h: 420,
    avgBasketKES: 20120,
    fulfillmentRate: 94.8,
    supplyBufferHours: 38.4,
    liquidityStatus: 'SURPLUS',
    dominantCategory: 'Grains & Flours',
    unmetDemandKES: 440000,
    topMovingSKU: 'Pembe Maize Meal 12x2kg'
  },
  {
    zoneId: 'zone_industrial',
    zoneName: 'Industrial Area / Enterprise Road Corridor',
    primaryDepots: ['Industrial Area Central Hub', 'Mombasa Road Depot'],
    activeDukas: 290,
    dailyGMVKES: 7120000,
    orderCount24h: 345,
    avgBasketKES: 20640,
    fulfillmentRate: 96.5,
    supplyBufferHours: 44.0,
    liquidityStatus: 'SURPLUS',
    dominantCategory: 'Oils & Fats',
    unmetDemandKES: 250000,
    topMovingSKU: 'Fresh Fri Cooking Oil 4x5L'
  },
  {
    zoneId: 'zone_kawangware',
    zoneName: 'Kawangware / Riruta High-Density Retail',
    primaryDepots: ['Kawangware Express Depot', 'Dagoretti Wholesale Corner'],
    activeDukas: 260,
    dailyGMVKES: 4890000,
    orderCount24h: 310,
    avgBasketKES: 15770,
    fulfillmentRate: 84.2,
    supplyBufferHours: 9.8,
    liquidityStatus: 'TIGHT',
    dominantCategory: 'Grains & Flours',
    unmetDemandKES: 920000,
    topMovingSKU: 'Jogoo Maize Meal 12x2kg'
  },
  {
    zoneId: 'zone_gikomba',
    zoneName: 'Gikomba / Kamukunji Open Trade Sector',
    primaryDepots: ['Gikomba Supply Terminal', 'Eastleigh Mega Depot'],
    activeDukas: 215,
    dailyGMVKES: 5120000,
    orderCount24h: 275,
    avgBasketKES: 18620,
    fulfillmentRate: 89.1,
    supplyBufferHours: 21.6,
    liquidityStatus: 'BALANCED',
    dominantCategory: 'Sugar & Sweeteners',
    unmetDemandKES: 560000,
    topMovingSKU: 'Mumias Pure Sugar 20x1kg'
  },
  {
    zoneId: 'zone_dandora',
    zoneName: 'Dandora / Kayole / Embakasi Corridor',
    primaryDepots: ['Outering Wholesale Depot', 'Eastleigh Mega Depot'],
    activeDukas: 195,
    dailyGMVKES: 3680000,
    orderCount24h: 240,
    avgBasketKES: 15330,
    fulfillmentRate: 81.5,
    supplyBufferHours: 7.2,
    liquidityStatus: 'DEFICIT',
    dominantCategory: 'Laundry & Household',
    unmetDemandKES: 830000,
    topMovingSKU: 'Sunlight Washing Powder 10x1kg'
  },
  {
    zoneId: 'zone_kibera',
    zoneName: 'Kibera / Langata Informal Settlement Retail',
    primaryDepots: ['Langata Wholesale Mart', 'Kawangware Express Depot'],
    activeDukas: 180,
    dailyGMVKES: 3250000,
    orderCount24h: 215,
    avgBasketKES: 15110,
    fulfillmentRate: 79.4,
    supplyBufferHours: 5.5,
    liquidityStatus: 'DEFICIT',
    dominantCategory: 'Grains & Flours',
    unmetDemandKES: 845000,
    topMovingSKU: 'Soko Maize Meal 12x2kg'
  }
];

// ---------------------------------------------------------------------------
// 4. BRAND MARKET SHARE & COMPETITIVE INTELLIGENCE
// ---------------------------------------------------------------------------

export const BRAND_MARKET_SHARES: BrandMarketShare[] = [
  {
    category: 'Maize Meal & Grain Flours',
    totalCategoryMonthlyGMVKES: 32800000,
    dominantBrand: 'Jogoo',
    competitiveTensionIndex: 82,
    brands: [
      {
        brandName: 'Jogoo',
        manufacturer: 'Unga Group Ltd',
        sharePercent: 39.5,
        monthlyGMVKES: 12956000,
        changeWoW: 2.1,
        penetrationDukasPercent: 88.4,
        rebateActive: true
      },
      {
        brandName: 'Pembe',
        manufacturer: 'Pembe Flour Mills Ltd',
        sharePercent: 31.8,
        monthlyGMVKES: 10430400,
        changeWoW: -1.2,
        penetrationDukasPercent: 79.2,
        rebateActive: false
      },
      {
        brandName: 'Soko',
        manufacturer: 'Capwell Industries',
        sharePercent: 21.5,
        monthlyGMVKES: 7052000,
        changeWoW: 0.8,
        penetrationDukasPercent: 64.5,
        rebateActive: false
      },
      {
        brandName: 'Taifa',
        manufacturer: 'Mombasa Maize Millers',
        sharePercent: 7.2,
        monthlyGMVKES: 2361600,
        changeWoW: -1.7,
        penetrationDukasPercent: 32.0,
        rebateActive: false
      }
    ]
  },
  {
    category: 'Edible Cooking Oils',
    totalCategoryMonthlyGMVKES: 26400000,
    dominantBrand: 'Fresh Fri',
    competitiveTensionIndex: 78,
    brands: [
      {
        brandName: 'Fresh Fri',
        manufacturer: 'Pwani Oil Products',
        sharePercent: 46.2,
        monthlyGMVKES: 12196800,
        changeWoW: 3.4,
        penetrationDukasPercent: 91.2,
        rebateActive: true
      },
      {
        brandName: 'Rina',
        manufacturer: 'Kapa Oil Refineries',
        sharePercent: 36.8,
        monthlyGMVKES: 9715200,
        changeWoW: -1.8,
        penetrationDukasPercent: 82.5,
        rebateActive: false
      },
      {
        brandName: 'Salit',
        manufacturer: 'Kapa Oil Refineries',
        sharePercent: 11.5,
        monthlyGMVKES: 3036000,
        changeWoW: -0.9,
        penetrationDukasPercent: 44.0,
        rebateActive: false
      },
      {
        brandName: 'Avena',
        manufacturer: 'Bidco Africa Ltd',
        sharePercent: 5.5,
        monthlyGMVKES: 1452000,
        changeWoW: -0.7,
        penetrationDukasPercent: 28.0,
        rebateActive: false
      }
    ]
  },
  {
    category: 'Laundry & Household Cleaning',
    totalCategoryMonthlyGMVKES: 19800000,
    dominantBrand: 'Omo',
    competitiveTensionIndex: 88,
    brands: [
      {
        brandName: 'Omo',
        manufacturer: 'Unilever Kenya',
        sharePercent: 42.4,
        monthlyGMVKES: 8395200,
        changeWoW: 4.2,
        penetrationDukasPercent: 86.0,
        rebateActive: true
      },
      {
        brandName: 'Sunlight',
        manufacturer: 'Unilever Kenya',
        sharePercent: 28.5,
        monthlyGMVKES: 5643000,
        changeWoW: -0.5,
        penetrationDukasPercent: 72.4,
        rebateActive: false
      },
      {
        brandName: 'Menengai Bar Soap',
        manufacturer: 'Menengai Oil Refineries',
        sharePercent: 18.2,
        monthlyGMVKES: 3603600,
        changeWoW: -2.3,
        penetrationDukasPercent: 68.0,
        rebateActive: false
      },
      {
        brandName: 'Geisha Bathing Soap',
        manufacturer: 'Unilever Kenya',
        sharePercent: 10.9,
        monthlyGMVKES: 2158200,
        changeWoW: -1.4,
        penetrationDukasPercent: 54.0,
        rebateActive: false
      }
    ]
  },
  {
    category: 'Spreads & Margarines',
    totalCategoryMonthlyGMVKES: 14200000,
    dominantBrand: 'Blue Band',
    competitiveTensionIndex: 32, // near monopoly
    brands: [
      {
        brandName: 'Blue Band',
        manufacturer: 'Upfield Kenya',
        sharePercent: 86.4,
        monthlyGMVKES: 12268800,
        changeWoW: 0.6,
        penetrationDukasPercent: 96.8,
        rebateActive: true
      },
      {
        brandName: 'Prestige',
        manufacturer: 'Kapa Oil Refineries',
        sharePercent: 9.8,
        monthlyGMVKES: 1391600,
        changeWoW: -0.2,
        penetrationDukasPercent: 31.0,
        rebateActive: false
      },
      {
        brandName: 'Gold Band',
        manufacturer: 'Bidco Africa Ltd',
        sharePercent: 3.8,
        monthlyGMVKES: 539600,
        changeWoW: -0.4,
        penetrationDukasPercent: 16.5,
        rebateActive: false
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// 5. FMCG ESSENTIAL DUKA BASKET INFLATION INDEX (6-MONTH TIMELINE)
// ---------------------------------------------------------------------------

export const FMCG_BASKET_INDEX_HISTORY: FMCGBasketIndexPoint[] = [
  {
    month: 'Apr 2026',
    timestamp: '2026-04-30',
    basketCostKES: 16420,
    inflationMoMPercent: 0.8,
    foodPressureRating: 'STABLE',
    itemsBreakdown: [
      { name: 'Jogoo Maize Meal', unit: '12x2kg Bale', weightPercent: 25, currentPriceKES: 1980, lastMonthPriceKES: 1960, priceChangePercent: 1.0 },
      { name: 'Fresh Fri Cooking Oil', unit: '4x5L Carton', weightPercent: 28, currentPriceKES: 3740, lastMonthPriceKES: 3710, priceChangePercent: 0.8 },
      { name: 'Mumias Cane Sugar', unit: '20x1kg Bale', weightPercent: 18, currentPriceKES: 2650, lastMonthPriceKES: 2630, priceChangePercent: 0.7 },
      { name: 'Pembe Wheat Flour', unit: '12x2kg Bale', weightPercent: 14, currentPriceKES: 1820, lastMonthPriceKES: 1810, priceChangePercent: 0.5 },
      { name: 'Omo Washing Powder', unit: '24x500g Carton', weightPercent: 15, currentPriceKES: 2580, lastMonthPriceKES: 2560, priceChangePercent: 0.8 }
    ]
  },
  {
    month: 'May 2026',
    timestamp: '2026-05-31',
    basketCostKES: 16650,
    inflationMoMPercent: 1.4,
    foodPressureRating: 'STABLE',
    itemsBreakdown: [
      { name: 'Jogoo Maize Meal', unit: '12x2kg Bale', weightPercent: 25, currentPriceKES: 2010, lastMonthPriceKES: 1980, priceChangePercent: 1.5 },
      { name: 'Fresh Fri Cooking Oil', unit: '4x5L Carton', weightPercent: 28, currentPriceKES: 3790, lastMonthPriceKES: 3740, priceChangePercent: 1.3 },
      { name: 'Mumias Cane Sugar', unit: '20x1kg Bale', weightPercent: 18, currentPriceKES: 2690, lastMonthPriceKES: 2650, priceChangePercent: 1.5 },
      { name: 'Pembe Wheat Flour', unit: '12x2kg Bale', weightPercent: 14, currentPriceKES: 1840, lastMonthPriceKES: 1820, priceChangePercent: 1.1 },
      { name: 'Omo Washing Powder', unit: '24x500g Carton', weightPercent: 15, currentPriceKES: 2600, lastMonthPriceKES: 2580, priceChangePercent: 0.8 }
    ]
  },
  {
    month: 'Jun 2026',
    timestamp: '2026-06-30',
    basketCostKES: 17020,
    inflationMoMPercent: 2.2,
    foodPressureRating: 'MODERATE',
    itemsBreakdown: [
      { name: 'Jogoo Maize Meal', unit: '12x2kg Bale', weightPercent: 25, currentPriceKES: 2050, lastMonthPriceKES: 2010, priceChangePercent: 2.0 },
      { name: 'Fresh Fri Cooking Oil', unit: '4x5L Carton', weightPercent: 28, currentPriceKES: 3860, lastMonthPriceKES: 3790, priceChangePercent: 1.8 },
      { name: 'Mumias Cane Sugar', unit: '20x1kg Bale', weightPercent: 18, currentPriceKES: 2750, lastMonthPriceKES: 2690, priceChangePercent: 2.2 },
      { name: 'Pembe Wheat Flour', unit: '12x2kg Bale', weightPercent: 14, currentPriceKES: 1880, lastMonthPriceKES: 1840, priceChangePercent: 2.2 },
      { name: 'Omo Washing Powder', unit: '24x500g Carton', weightPercent: 15, currentPriceKES: 2640, lastMonthPriceKES: 2600, priceChangePercent: 1.5 }
    ]
  },
  {
    month: 'Jul 2026',
    timestamp: '2026-07-31',
    basketCostKES: 17290,
    inflationMoMPercent: 1.6,
    foodPressureRating: 'MODERATE',
    itemsBreakdown: [
      { name: 'Jogoo Maize Meal', unit: '12x2kg Bale', weightPercent: 25, currentPriceKES: 2080, lastMonthPriceKES: 2050, priceChangePercent: 1.5 },
      { name: 'Fresh Fri Cooking Oil', unit: '4x5L Carton', weightPercent: 28, currentPriceKES: 3910, lastMonthPriceKES: 3860, priceChangePercent: 1.3 },
      { name: 'Mumias Cane Sugar', unit: '20x1kg Bale', weightPercent: 18, currentPriceKES: 2790, lastMonthPriceKES: 2750, priceChangePercent: 1.5 },
      { name: 'Pembe Wheat Flour', unit: '12x2kg Bale', weightPercent: 14, currentPriceKES: 1910, lastMonthPriceKES: 1880, priceChangePercent: 1.6 },
      { name: 'Omo Washing Powder', unit: '24x500g Carton', weightPercent: 15, currentPriceKES: 2660, lastMonthPriceKES: 2640, priceChangePercent: 0.8 }
    ]
  },
  {
    month: 'Aug 2026',
    timestamp: '2026-08-31',
    basketCostKES: 17480,
    inflationMoMPercent: 1.1,
    foodPressureRating: 'MODERATE',
    itemsBreakdown: [
      { name: 'Jogoo Maize Meal', unit: '12x2kg Bale', weightPercent: 25, currentPriceKES: 2090, lastMonthPriceKES: 2080, priceChangePercent: 0.5 },
      { name: 'Fresh Fri Cooking Oil', unit: '4x5L Carton', weightPercent: 28, currentPriceKES: 3940, lastMonthPriceKES: 3910, priceChangePercent: 0.8 },
      { name: 'Mumias Cane Sugar', unit: '20x1kg Bale', weightPercent: 18, currentPriceKES: 2820, lastMonthPriceKES: 2790, priceChangePercent: 1.1 },
      { name: 'Pembe Wheat Flour', unit: '12x2kg Bale', weightPercent: 14, currentPriceKES: 1920, lastMonthPriceKES: 1910, priceChangePercent: 0.5 },
      { name: 'Omo Washing Powder', unit: '24x500g Carton', weightPercent: 15, currentPriceKES: 2680, lastMonthPriceKES: 2660, priceChangePercent: 0.8 }
    ]
  },
  {
    month: 'Sep 2026 (Current)',
    timestamp: '2026-09-09',
    basketCostKES: 17625,
    inflationMoMPercent: 0.8,
    foodPressureRating: 'STABLE',
    itemsBreakdown: [
      { name: 'Jogoo Maize Meal', unit: '12x2kg Bale', weightPercent: 25, currentPriceKES: 2075, lastMonthPriceKES: 2090, priceChangePercent: -0.7 },
      { name: 'Fresh Fri Cooking Oil', unit: '4x5L Carton', weightPercent: 28, currentPriceKES: 3865, lastMonthPriceKES: 3940, priceChangePercent: -1.9 },
      { name: 'Mumias Cane Sugar', unit: '20x1kg Bale', weightPercent: 18, currentPriceKES: 2795, lastMonthPriceKES: 2820, priceChangePercent: -0.9 },
      { name: 'Pembe Wheat Flour', unit: '12x2kg Bale', weightPercent: 14, currentPriceKES: 1910, lastMonthPriceKES: 1920, priceChangePercent: -0.5 },
      { name: 'Omo Washing Powder', unit: '24x500g Carton', weightPercent: 15, currentPriceKES: 2680, lastMonthPriceKES: 2680, priceChangePercent: 0.0 }
    ]
  }
];

// ---------------------------------------------------------------------------
// 6. MARKET ANOMALY & DISRUPTION ALERTS
// ---------------------------------------------------------------------------

export const INITIAL_MARKET_ANOMALIES: MarketAnomalyAlert[] = [
  {
    id: 'anom_01',
    timestamp: '14 mins ago',
    severity: 'CRITICAL',
    title: 'Severe Stockout Risk: Sugar Deficit in Westlands & Kawangware',
    description: 'Mumias Sugar inventory has completely depleted at Westlands Wholesale Supplies, and Kawangware buffer is below 4.2 hours. Spot price spiked +KES 130 above manufacturer ceiling.',
    affectedSKU: 'Mumias Pure Cane Sugar (20x1kg Bale)',
    affectedZone: 'Kawangware & Westlands',
    metricDeviation: 'Buffer: 4.2 hrs (vs 36h SLA) · Price: +KES 130',
    status: 'ACTIVE',
    automatedAction: {
      actionId: 'act_reallocate_sugar',
      label: 'Trigger Emergency Depot Reallocation',
      targetService: 'DEPOT_REALLOCATION',
      description: 'Automatically route 120 bales from Eastleigh Mega Depot buffer to Kawangware Express Depot via WAYNO cargo truck.'
    }
  },
  {
    id: 'anom_02',
    timestamp: '38 mins ago',
    severity: 'WARNING',
    title: 'Arbitrage Alert: Pembe Wheat Flour Price Spread Across Corridors',
    description: 'Eastleigh Mega Depot is clearing Pembe Flour at KES 1,860/bale while Westlands charges KES 1,980 (6.5% spread). 4 duka traders have placed bulk cross-corridor re-orders.',
    affectedSKU: 'Pembe Home Baking Flour (12x2kg Bale)',
    affectedZone: 'Eastleigh vs. Westlands',
    metricDeviation: 'Price Dispersion: KES 120 (Max tolerance KES 80)',
    status: 'ACTIVE',
    automatedAction: {
      actionId: 'act_calibrate_elasticity',
      label: 'Calibrate Dynamic Search Pricing & Quotas',
      targetService: 'SEARCH_BOOST',
      description: 'Enforce per-duka maximum purchase limits (10 bales) and dynamically normalize wholesale search ranking scores.'
    }
  },
  {
    id: 'anom_03',
    timestamp: '1 hour ago',
    severity: 'WARNING',
    title: 'Competitive Erosion: Unilever Omo Losing Share to Menengai in Dandora',
    description: 'Menengai Bar Soap gained +4.8% duka penetration in Dandora/Kayole over the last 72 hours due to KES 65 lower price point. Omo search volume down 14%.',
    affectedSKU: 'Omo Hand Washing Powder (24x500g)',
    affectedZone: 'Dandora / Kayole Corridor',
    metricDeviation: 'Duka Share: -4.8% WoW · Search: -14%',
    status: 'ACTIVE',
    automatedAction: {
      actionId: 'act_trigger_promo_push',
      label: 'Deploy Manufacturer Targeted Trade Rebate',
      targetService: 'PROMOTIONAL_REBATE',
      description: 'Inject automated Unilever Kenya KES 75 instant trade rebate for all Dandora retail dukas ordering 2+ cartons.'
    }
  }
];

// ---------------------------------------------------------------------------
// 7. REAL-TIME EVENT STREAM SAMPLES (FOR SIMULATOR & TELEMETRY FEED)
// ---------------------------------------------------------------------------

export const SAMPLE_MARKET_STREAM_EVENTS: Omit<MarketEvent, 'id' | 'timestamp' | 'latencyMs'>[] = [
  {
    type: 'DUKA_SEARCH_QUERY',
    source: 'Shop #104 (Amani Provision Duka)',
    zone: 'Nairobi East / Eastleigh',
    pipelineStage: 'STREAM_INGESTION',
    payload: {
      query: 'unga wa ugali soko 2kg',
      normalizedSKU: 'prod_soko',
      dialect: 'Swahili',
      resultsCount: 4,
      zeroResult: false
    }
  },
  {
    type: 'CHECKOUT_ORDER',
    source: 'Baraka Mini Mart (Shop #02)',
    zone: 'Industrial Area Corridor',
    pipelineStage: 'CLEANSING_ETL',
    payload: {
      orderId: 'ord_live_891',
      totalKES: 18450,
      itemCount: 8,
      primarySKU: 'prod_freshfri',
      paymentMethod: 'M-Pesa STK'
    }
  },
  {
    type: 'DEPOT_STOCK_SYNC',
    source: 'Eastleigh Mega Depot',
    zone: 'Nairobi East / Eastleigh',
    pipelineStage: 'AGGREGATION_ROLLUP',
    payload: {
      skuId: 'prod_jogoo',
      currentStockQty: 340,
      delta: -15,
      bufferHoursRemaining: 38.4,
      depotStatus: 'OPTIMAL'
    }
  },
  {
    type: 'SPOT_PRICE_PING',
    source: 'Westlands Wholesale Supplies',
    zone: 'Nairobi West / Westlands',
    pipelineStage: 'ML_INFERENCE',
    payload: {
      skuId: 'prod_mumias',
      spotPriceKES: 2890,
      rrpKES: 3200,
      varianceKES: 95,
      anomalyFlag: true
    }
  },
  {
    type: 'RIDER_CORRIDOR_METRIC',
    source: 'WAYNO Cargo Fleet (Rider Kiprono)',
    zone: 'Kawangware / Riruta',
    pipelineStage: 'SYNDICATION_ACTION',
    payload: {
      route: 'Dagoretti -> Kawangware Centre',
      transitMins: 14,
      cargoWeightKg: 38,
      rainSurchargeKES: 0,
      dropoffStatus: 'COMPLETED'
    }
  }
];
