export interface DatabaseIndexDefinition {
  id: string;
  table: string;
  name: string;
  type: 'B_TREE' | 'GIST_SPATIAL' | 'GIN_TRIGRAM' | 'PARTIAL_FILTERED' | 'UNIQUE_HASH' | 'HYPERTABLE';
  category: 'ORDERS' | 'RETAILERS' | 'WHOLESALERS' | 'PRODUCTS' | 'PAYMENTS' | 'DELIVERIES' | 'SEARCH_TELEMETRY';
  columns: string[];
  definitionSql: string;
  purpose: string;
  queryPattern: string;
  expectedSpeedup: string;
  seqScanLatencyMs: number;
  indexScanLatencyMs: number;
  bufferHitRate: string;
}

export interface ExplainAnalyzeScenario {
  id: string;
  title: string;
  category: string;
  sqlQuery: string;
  indexUsed: string;
  planningTimeMs: number;
  executionTimeMs: number;
  seqScanTimeMs: number;
  speedupMultiplier: string;
  queryPlanNodes: Array<{
    nodeType: string;
    relation?: string;
    indexName?: string;
    cost: string;
    rows: number;
    actualTime: string;
    buffers: string;
  }>;
}

export const DATABASE_INDEXES_MANIFEST: DatabaseIndexDefinition[] = [
  // ==========================================
  // ORDERS & ORDER ITEMS
  // ==========================================
  {
    id: 'idx_orders_retailer_created',
    table: 'orders',
    name: 'idx_orders_retailer_created_at_desc',
    type: 'B_TREE',
    category: 'ORDERS',
    columns: ['retailer_id', 'created_at DESC'],
    definitionSql: 'CREATE INDEX idx_orders_retailer_created_at_desc ON orders (retailer_id, created_at DESC);',
    purpose: 'Powers instantaneous pagination of order history in the duka merchant mobile app.',
    queryPattern: 'SELECT * FROM orders WHERE retailer_id = $1 ORDER BY created_at DESC LIMIT 20;',
    expectedSpeedup: '98.5% reduction in disk I/O',
    seqScanLatencyMs: 142.4,
    indexScanLatencyMs: 1.2,
    bufferHitRate: '99.9%'
  },
  {
    id: 'idx_orders_wholesaler_status',
    table: 'orders',
    name: 'idx_orders_wholesaler_status_prep',
    type: 'PARTIAL_FILTERED',
    category: 'ORDERS',
    columns: ['wholesaler_id', 'status', 'created_at'],
    definitionSql: 'CREATE INDEX idx_orders_wholesaler_status_prep ON orders (wholesaler_id, status, created_at) WHERE status IN (\'ACCEPTED\', \'PREPARING\', \'READY_FOR_PICKUP\');',
    purpose: 'Drives the real-time pick-and-pack fulfillment Kanban board for wholesale depots.',
    queryPattern: 'SELECT * FROM orders WHERE wholesaler_id = $1 AND status = \'PREPARING\' ORDER BY created_at ASC;',
    expectedSpeedup: 'Eliminates 99% of dead row scanning',
    seqScanLatencyMs: 88.6,
    indexScanLatencyMs: 0.9,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_orders_active_pipeline',
    table: 'orders',
    name: 'idx_orders_active_pipeline_partial',
    type: 'PARTIAL_FILTERED',
    category: 'ORDERS',
    columns: ['id', 'status', 'delivery_corridor', 'created_at'],
    definitionSql: 'CREATE INDEX idx_orders_active_pipeline_partial ON orders (delivery_corridor, status, created_at DESC) WHERE status NOT IN (\'DELIVERED\', \'CANCELLED\', \'FAILED\', \'REFUNDED\');',
    purpose: 'Accelerates the Admin Operations Console and Live Dispatch Radar by indexing only active in-flight missions.',
    queryPattern: 'SELECT id, status, rider_id FROM orders WHERE status NOT IN (\'DELIVERED\', \'CANCELLED\');',
    expectedSpeedup: 'Keeps active order index small (<500KB in RAM)',
    seqScanLatencyMs: 65.0,
    indexScanLatencyMs: 0.6,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_order_items_order_fk',
    table: 'order_items',
    name: 'idx_order_items_order_id',
    type: 'B_TREE',
    category: 'ORDERS',
    columns: ['order_id'],
    definitionSql: 'CREATE INDEX idx_order_items_order_id ON order_items (order_id);',
    purpose: 'Ensures foreign key joins from orders to line items execute in sub-millisecond nested loops.',
    queryPattern: 'SELECT * FROM order_items WHERE order_id = $1;',
    expectedSpeedup: 'Sub-millisecond nested loop join',
    seqScanLatencyMs: 110.2,
    indexScanLatencyMs: 0.8,
    bufferHitRate: '99.8%'
  },
  {
    id: 'idx_order_items_product_fk',
    table: 'order_items',
    name: 'idx_order_items_product_id',
    type: 'B_TREE',
    category: 'ORDERS',
    columns: ['product_id', 'quantity'],
    definitionSql: 'CREATE INDEX idx_order_items_product_id ON order_items (product_id, quantity);',
    purpose: 'Aggregates FMCG consumption velocity and restocking forecasting models.',
    queryPattern: 'SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id;',
    expectedSpeedup: 'Enables index-only scans for demand aggregation',
    seqScanLatencyMs: 195.0,
    indexScanLatencyMs: 4.1,
    bufferHitRate: '98.7%'
  },

  // ==========================================
  // SECTION 12: RETAILER ACCOUNTS & SHOPS (POSTGIS SPATIAL)
  // ==========================================
  {
    id: 'idx_shops_retailer_id',
    table: 'shops',
    name: 'idx_shops_retailer_id',
    type: 'B_TREE',
    category: 'RETAILERS',
    columns: ['retailer_id'],
    definitionSql: 'CREATE INDEX idx_shops_retailer_id ON shops (retailer_id);',
    purpose: 'Section 12: Associates retailer account with physical shops, enabling instantaneous parent-to-shop resolution.',
    queryPattern: 'SELECT * FROM shops WHERE retailer_id = $1;',
    expectedSpeedup: '96% reduction in lookup time',
    seqScanLatencyMs: 45.2,
    indexScanLatencyMs: 0.8,
    bufferHitRate: '99.8%'
  },
  {
    id: 'idx_shops_geom_gist',
    table: 'shops',
    name: 'idx_shops_location_geom_gist',
    type: 'GIST_SPATIAL',
    category: 'RETAILERS',
    columns: ['geom (Point, 4326)'],
    definitionSql: 'CREATE INDEX idx_shops_location_geom_gist ON shops USING GIST (geom);',
    purpose: 'Section 12: PostGIS stores the geographical position. Enables sub-5ms ST_DWithin corridor queries across Nairobi.',
    queryPattern: 'SELECT id, name FROM shops WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 3000);',
    expectedSpeedup: '120x faster than polygon bounding box table scan',
    seqScanLatencyMs: 230.5,
    indexScanLatencyMs: 1.9,
    bufferHitRate: '99.5%'
  },
  {
    id: 'idx_retailers_phone_unique',
    table: 'retailers',
    name: 'idx_retailers_phone_unique',
    type: 'UNIQUE_HASH',
    category: 'RETAILERS',
    columns: ['phone (UNIQUE)'],
    definitionSql: 'CREATE UNIQUE INDEX idx_retailers_phone_unique ON retailers (phone);',
    purpose: 'Enforces unique merchant Kenyan mobile numbers (MSISDN) with zero-cost authentication lookup.',
    queryPattern: 'SELECT * FROM retailers WHERE phone = \'+254712345678\';',
    expectedSpeedup: 'Single-row btree exact match',
    seqScanLatencyMs: 35.0,
    indexScanLatencyMs: 0.3,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_retailers_service_zone',
    table: 'retailers',
    name: 'idx_retailers_service_zone_status',
    type: 'B_TREE',
    category: 'RETAILERS',
    columns: ['service_zone_id', 'operating_status'],
    definitionSql: 'CREATE INDEX idx_retailers_service_zone_status ON retailers (service_zone_id, operating_status);',
    purpose: 'Filters active open retail dukas by Nairobi administrative trade corridor (Embakasi, Eastleigh, Westlands).',
    queryPattern: 'SELECT * FROM retailers WHERE service_zone_id = $1 AND operating_status = \'OPEN\';',
    expectedSpeedup: 'Fast zone-partitioned dispatch routing',
    seqScanLatencyMs: 42.0,
    indexScanLatencyMs: 0.7,
    bufferHitRate: '99.9%'
  },

  // ==========================================
  // WHOLESALERS & DEPOT INVENTORY
  // ==========================================
  {
    id: 'idx_wholesaler_inv_lookup',
    table: 'supplier_products',
    name: 'idx_supplier_products_composite',
    type: 'B_TREE',
    category: 'WHOLESALERS',
    columns: ['wholesaler_id', 'product_id', 'available_stock'],
    definitionSql: 'CREATE UNIQUE INDEX idx_supplier_products_composite ON supplier_products (wholesaler_id, product_id);',
    purpose: 'Guarantees sub-millisecond multi-depot price comparison and stock checks during checkout.',
    queryPattern: 'SELECT wholesale_price, available_stock FROM supplier_products WHERE wholesaler_id = $1 AND product_id = $2;',
    expectedSpeedup: 'Direct index-only scan avoiding table heap reads',
    seqScanLatencyMs: 78.0,
    indexScanLatencyMs: 0.5,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_supplier_products_pricing_route',
    table: 'supplier_products',
    name: 'idx_supplier_products_product_price',
    type: 'B_TREE',
    category: 'PRODUCTS',
    columns: ['product_id', 'wholesale_price', 'available_stock'],
    definitionSql: 'CREATE INDEX idx_supplier_products_product_price ON supplier_products (product_id, wholesale_price ASC) WHERE is_available = TRUE AND available_stock > 0;',
    purpose: 'Core 1:N Separation: Dynamically routes canonical Product Identity to the cheapest in-stock supplier without mutating master catalog.',
    queryPattern: 'SELECT wholesaler_id, wholesale_price, available_stock FROM supplier_products WHERE product_id = $1 AND is_available = TRUE ORDER BY wholesale_price ASC LIMIT 1;',
    expectedSpeedup: 'Instant cheapest-supplier routing in 0.4ms',
    seqScanLatencyMs: 95.0,
    indexScanLatencyMs: 0.4,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_wholesaler_low_stock',
    table: 'supplier_products',
    name: 'idx_wholesaler_low_stock_partial',
    type: 'PARTIAL_FILTERED',
    category: 'WHOLESALERS',
    columns: ['wholesaler_id', 'product_id', 'available_stock'],
    definitionSql: 'CREATE INDEX idx_wholesaler_low_stock_partial ON supplier_products (wholesaler_id, available_stock) WHERE available_stock < 20;',
    purpose: 'Powers proactive stockout alerts to procurement officers before depot inventory is exhausted.',
    queryPattern: 'SELECT * FROM supplier_products WHERE available_stock < 20;',
    expectedSpeedup: 'Scans only the low-inventory rows',
    seqScanLatencyMs: 64.0,
    indexScanLatencyMs: 0.4,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_wholesaler_locations_geom_gist',
    table: 'wholesaler_locations',
    name: 'idx_wholesaler_locations_geom_gist',
    type: 'GIST_SPATIAL',
    category: 'WHOLESALERS',
    columns: ['geom (Point, 4326)'],
    definitionSql: 'CREATE INDEX idx_wholesaler_locations_geom_gist ON wholesaler_locations USING GIST (geom);',
    purpose: 'Section 14: Allows WAYNO to work geographically by indexing physical wholesale depot locations for sub-5ms proximity radius queries.',
    queryPattern: 'SELECT id, name, address FROM wholesaler_locations WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 5000);',
    expectedSpeedup: '90x faster depot proximity lookup',
    seqScanLatencyMs: 145.0,
    indexScanLatencyMs: 1.2,
    bufferHitRate: '99.8%'
  },
  {
    id: 'idx_wholesaler_locations_wholesaler_fk',
    table: 'wholesaler_locations',
    name: 'idx_wholesaler_locations_wholesaler_id',
    type: 'B_TREE',
    category: 'WHOLESALERS',
    columns: ['wholesaler_id', 'service_zone_id'],
    definitionSql: 'CREATE INDEX idx_wholesaler_locations_wholesaler_id ON wholesaler_locations (wholesaler_id, service_zone_id);',
    purpose: 'Section 14: Supports multi-location enterprises (1 Wholesaler -> N Locations) and zone filtering.',
    queryPattern: 'SELECT * FROM wholesaler_locations WHERE wholesaler_id = $1;',
    expectedSpeedup: 'Sub-millisecond multi-depot resolution',
    seqScanLatencyMs: 40.0,
    indexScanLatencyMs: 0.3,
    bufferHitRate: '100.0%'
  },

  // ==========================================
  // PRODUCTS & MASTER FMCG CATALOG (TRIGRAM & GIN)
  // ==========================================
  {
    id: 'idx_products_barcode_unique',
    table: 'products',
    name: 'idx_products_barcode_unique',
    type: 'UNIQUE_HASH',
    category: 'PRODUCTS',
    columns: ['barcode (GS1 EAN-13)'],
    definitionSql: 'CREATE UNIQUE INDEX idx_products_barcode_unique ON products (barcode);',
    purpose: 'Enforces GS1-compliant EAN/UPC uniqueness and provides 0.2ms barcode scanner lookups.',
    queryPattern: 'SELECT * FROM products WHERE barcode = \'6161100001014\';',
    expectedSpeedup: 'O(1) B-tree pinpoint retrieval',
    seqScanLatencyMs: 55.0,
    indexScanLatencyMs: 0.2,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_products_name_trgm_gin',
    table: 'products',
    name: 'idx_products_name_trgm_gin',
    type: 'GIN_TRIGRAM',
    category: 'PRODUCTS',
    columns: ['name gin_trgm_ops'],
    definitionSql: 'CREATE INDEX idx_products_name_trgm_gin ON products USING GIN (name gin_trgm_ops);',
    purpose: 'Enables instant typo-tolerant ILIKE and %wildcard% searches with pg_trgm before hitting cache.',
    queryPattern: 'SELECT * FROM products WHERE name ILIKE \'%pembe%\' OR similarity(name, \'pembe\') > 0.4;',
    expectedSpeedup: '50x faster than full table regex scan',
    seqScanLatencyMs: 180.0,
    indexScanLatencyMs: 3.2,
    bufferHitRate: '98.9%'
  },
  {
    id: 'idx_products_aliases_gin',
    table: 'products',
    name: 'idx_products_aliases_gin',
    type: 'GIN_TRIGRAM',
    category: 'PRODUCTS',
    columns: ['aliases (text[] array)'],
    definitionSql: 'CREATE INDEX idx_products_aliases_gin ON products USING GIN (aliases);',
    purpose: 'Indexes Swahili and Sheng vernacular terms (e.g. "unga wa ngano", "chapo", "sabuni", "mafuta").',
    queryPattern: 'SELECT * FROM products WHERE aliases && ARRAY[\'chapo\', \'unga\'];',
    expectedSpeedup: 'Sub-5ms array intersection match',
    seqScanLatencyMs: 165.0,
    indexScanLatencyMs: 2.8,
    bufferHitRate: '99.1%'
  },

  // ==========================================
  // PAYMENTS & FINANCIAL LEDGER
  // ==========================================
  {
    id: 'idx_payments_idempotency_key',
    table: 'payments',
    name: 'idx_payments_idempotency_key_unique',
    type: 'UNIQUE_HASH',
    category: 'PAYMENTS',
    columns: ['idempotency_key (UUID)'],
    definitionSql: 'CREATE UNIQUE INDEX idx_payments_idempotency_key_unique ON payments (idempotency_key);',
    purpose: 'Guarantees Safaricom Daraja STK push and webhook callback deduplication against network replay attacks.',
    queryPattern: 'SELECT * FROM payments WHERE idempotency_key = $1;',
    expectedSpeedup: 'Prevents double-charging in 0.3ms',
    seqScanLatencyMs: 48.0,
    indexScanLatencyMs: 0.3,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_payments_mpesa_receipt',
    table: 'payments',
    name: 'idx_payments_mpesa_receipt_unique',
    type: 'UNIQUE_HASH',
    category: 'PAYMENTS',
    columns: ['mpesa_receipt_number'],
    definitionSql: 'CREATE UNIQUE INDEX idx_payments_mpesa_receipt_unique ON payments (mpesa_receipt_number);',
    purpose: 'Provides 0.2ms lookup for Safaricom Paybill confirmation codes (e.g. QKJ882190).',
    queryPattern: 'SELECT * FROM payments WHERE mpesa_receipt_number = $1;',
    expectedSpeedup: 'Instant bank statement reconciliation',
    seqScanLatencyMs: 52.0,
    indexScanLatencyMs: 0.2,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_payments_order_status',
    table: 'payments',
    name: 'idx_payments_order_id_status',
    type: 'B_TREE',
    category: 'PAYMENTS',
    columns: ['order_id', 'status', 'created_at DESC'],
    definitionSql: 'CREATE INDEX idx_payments_order_id_status ON payments (order_id, status, created_at DESC);',
    purpose: 'Matches incoming Daraja asynchronous webhook notifications directly to the parent order record.',
    queryPattern: 'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1;',
    expectedSpeedup: 'Under 1ms webhook completion',
    seqScanLatencyMs: 70.0,
    indexScanLatencyMs: 0.6,
    bufferHitRate: '100.0%'
  },

  // ==========================================
  // DELIVERIES & FLEET (POSTGIS & OTP)
  // ==========================================
  {
    id: 'idx_deliveries_order_id',
    table: 'deliveries',
    name: 'idx_deliveries_order_id_unique',
    type: 'UNIQUE_HASH',
    category: 'DELIVERIES',
    columns: ['order_id (UNIQUE)'],
    definitionSql: 'CREATE UNIQUE INDEX idx_deliveries_order_id_unique ON deliveries (order_id);',
    purpose: 'Enforces 1-to-1 mapping between order and dispatch mission.',
    queryPattern: 'SELECT * FROM deliveries WHERE order_id = $1;',
    expectedSpeedup: 'O(1) B-tree lookup',
    seqScanLatencyMs: 38.0,
    indexScanLatencyMs: 0.2,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_deliveries_rider_status',
    table: 'deliveries',
    name: 'idx_deliveries_rider_status_created',
    type: 'B_TREE',
    category: 'DELIVERIES',
    columns: ['rider_id', 'status', 'assigned_at DESC'],
    definitionSql: 'CREATE INDEX idx_deliveries_rider_status_created ON deliveries (rider_id, status, assigned_at DESC);',
    purpose: 'Powers active delivery roster and courier route tracking in the boda-boda mobile app.',
    queryPattern: 'SELECT * FROM deliveries WHERE rider_id = $1 AND status IN (\'ASSIGNED\', \'PICKED_UP\');',
    expectedSpeedup: 'Fast courier payload queries',
    seqScanLatencyMs: 62.0,
    indexScanLatencyMs: 0.5,
    bufferHitRate: '100.0%'
  },
  {
    id: 'idx_riders_geom_gist',
    table: 'riders',
    name: 'idx_riders_last_known_location_gist',
    type: 'GIST_SPATIAL',
    category: 'DELIVERIES',
    columns: ['last_known_location (Point, 4326)'],
    definitionSql: 'CREATE INDEX idx_riders_last_known_location_gist ON riders USING GIST (last_known_location);',
    purpose: 'PostGIS KNN (K-Nearest Neighbors) spatial index to find the 3 nearest available couriers to a depot within 500ms.',
    queryPattern: 'SELECT id, name, last_known_location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326) AS dist FROM riders WHERE status = \'AVAILABLE\' ORDER BY dist LIMIT 3;',
    expectedSpeedup: '80x faster than distance calculation loops',
    seqScanLatencyMs: 210.0,
    indexScanLatencyMs: 2.4,
    bufferHitRate: '99.4%'
  },

  // ==========================================
  // SEARCH & TELEMETRY (TIMESCALE PARTITIONING)
  // ==========================================
  {
    id: 'idx_telemetry_events_hypertable',
    table: 'telemetry_events',
    name: 'idx_telemetry_time_bucket_event_type',
    type: 'HYPERTABLE',
    category: 'SEARCH_TELEMETRY',
    columns: ['timestamp DESC', 'event_type', 'order_id'],
    definitionSql: 'CREATE INDEX idx_telemetry_time_bucket_event_type ON telemetry_events (timestamp DESC, event_type, order_id);',
    purpose: 'TimescaleDB hypertable composite index partitioning time-series events into 24-hour chunks for streaming data lake pipelines.',
    queryPattern: 'SELECT * FROM telemetry_events WHERE timestamp >= NOW() - INTERVAL \'24 hours\' AND event_type = $1;',
    expectedSpeedup: 'Prunes 95% of past time chunks from query memory',
    seqScanLatencyMs: 450.0,
    indexScanLatencyMs: 3.8,
    bufferHitRate: '98.5%'
  },
  {
    id: 'idx_search_queries_zero_results',
    table: 'search_queries',
    name: 'idx_search_zero_results_partial',
    type: 'PARTIAL_FILTERED',
    category: 'SEARCH_TELEMETRY',
    columns: ['query_normalized', 'created_at DESC'],
    definitionSql: 'CREATE INDEX idx_search_zero_results_partial ON search_queries (query_normalized, created_at DESC) WHERE results_count = 0;',
    purpose: 'Instantly surfaces unmet duka customer demand and stockout clusters for procurement sourcing.',
    queryPattern: 'SELECT query_normalized, COUNT(*) FROM search_queries WHERE results_count = 0 GROUP BY query_normalized ORDER BY count DESC LIMIT 10;',
    expectedSpeedup: 'Indexes only zero-result queries (<2% of total search traffic)',
    seqScanLatencyMs: 310.0,
    indexScanLatencyMs: 1.5,
    bufferHitRate: '99.8%'
  }
];

export const EXPLAIN_ANALYZE_SCENARIOS: ExplainAnalyzeScenario[] = [
  {
    id: 'scenario_retailer_history',
    title: 'Retailer Order History with Pagination (Duka App)',
    category: 'ORDERS',
    sqlQuery: 'EXPLAIN (ANALYZE, BUFFERS) SELECT id, status, total_amount, created_at FROM orders WHERE retailer_id = \'ret_embakasi_01\' ORDER BY created_at DESC LIMIT 20;',
    indexUsed: 'idx_orders_retailer_created_at_desc (B-tree)',
    planningTimeMs: 0.12,
    executionTimeMs: 0.84,
    seqScanTimeMs: 142.4,
    speedupMultiplier: '169x',
    queryPlanNodes: [
      {
        nodeType: 'Limit',
        cost: '0.42..18.24',
        rows: 20,
        actualTime: '0.042..0.821',
        buffers: 'shared hit=24'
      },
      {
        nodeType: 'Index Scan using idx_orders_retailer_created_at_desc',
        relation: 'orders',
        indexName: 'idx_orders_retailer_created_at_desc',
        cost: '0.42..98.15',
        rows: 20,
        actualTime: '0.040..0.804',
        buffers: 'shared hit=24 read=0'
      }
    ]
  },
  {
    id: 'scenario_postgis_geofence',
    title: 'PostGIS KNN 3-Nearest Available Boda Couriers',
    category: 'DELIVERIES',
    sqlQuery: 'EXPLAIN (ANALYZE, BUFFERS) SELECT id, name, vehicle_plate, last_known_location <-> ST_SetSRID(ST_MakePoint(36.8219, -1.2921), 4326) AS dist FROM riders WHERE status = \'AVAILABLE\' ORDER BY dist LIMIT 3;',
    indexUsed: 'idx_riders_last_known_location_gist (GiST R-Tree)',
    planningTimeMs: 0.28,
    executionTimeMs: 2.15,
    seqScanTimeMs: 210.0,
    speedupMultiplier: '97x',
    queryPlanNodes: [
      {
        nodeType: 'Limit',
        cost: '0.28..12.50',
        rows: 3,
        actualTime: '0.110..2.120',
        buffers: 'shared hit=38'
      },
      {
        nodeType: 'Index Scan using idx_riders_last_known_location_gist',
        relation: 'riders',
        indexName: 'idx_riders_last_known_location_gist',
        cost: '0.28..45.80',
        rows: 3,
        actualTime: '0.108..2.105',
        buffers: 'shared hit=38 read=0'
      }
    ]
  },
  {
    id: 'scenario_sheng_vernacular',
    title: 'Swahili / Sheng Phonetic GIN Trigram Search ("unga wa ugali")',
    category: 'PRODUCTS',
    sqlQuery: 'EXPLAIN (ANALYZE, BUFFERS) SELECT id, name, recommended_retail_price FROM products WHERE name ILIKE \'%unga%\' OR aliases && ARRAY[\'unga wa ugali\'] LIMIT 10;',
    indexUsed: 'idx_products_name_trgm_gin & idx_products_aliases_gin (GIN Bitmap)',
    planningTimeMs: 0.35,
    executionTimeMs: 3.12,
    seqScanTimeMs: 180.0,
    speedupMultiplier: '57x',
    queryPlanNodes: [
      {
        nodeType: 'Bitmap Heap Scan',
        relation: 'products',
        cost: '12.40..85.20',
        rows: 10,
        actualTime: '0.850..3.080',
        buffers: 'shared hit=18'
      },
      {
        nodeType: 'BitmapOr',
        cost: '12.40..12.40',
        rows: 15,
        actualTime: '0.820..0.820',
        buffers: 'shared hit=12'
      },
      {
        nodeType: 'Bitmap Index Scan using idx_products_name_trgm_gin',
        indexName: 'idx_products_name_trgm_gin',
        cost: '4.20..4.20',
        rows: 10,
        actualTime: '0.340..0.340',
        buffers: 'shared hit=6'
      },
      {
        nodeType: 'Bitmap Index Scan using idx_products_aliases_gin',
        indexName: 'idx_products_aliases_gin',
        cost: '8.20..8.20',
        rows: 5,
        actualTime: '0.480..0.480',
        buffers: 'shared hit=6'
      }
    ]
  },
  {
    id: 'scenario_daraja_idempotency',
    title: 'M-Pesa Webhook Idempotency Check (Deduplication)',
    category: 'PAYMENTS',
    sqlQuery: 'EXPLAIN (ANALYZE, BUFFERS) SELECT id, status, mpesa_receipt_number FROM payments WHERE idempotency_key = \'mpesa-callback-982103-882\' LIMIT 1;',
    indexUsed: 'idx_payments_idempotency_key_unique (B-tree Unique)',
    planningTimeMs: 0.08,
    executionTimeMs: 0.28,
    seqScanTimeMs: 48.0,
    speedupMultiplier: '171x',
    queryPlanNodes: [
      {
        nodeType: 'Index Scan using idx_payments_idempotency_key_unique',
        relation: 'payments',
        indexName: 'idx_payments_idempotency_key_unique',
        cost: '0.28..4.30',
        rows: 1,
        actualTime: '0.035..0.270',
        buffers: 'shared hit=4 read=0'
      }
    ]
  },
  {
    id: 'scenario_active_orders',
    title: 'Active Pipeline Query (Partial Filtered Index)',
    category: 'ORDERS',
    sqlQuery: 'EXPLAIN (ANALYZE, BUFFERS) SELECT id, retailer_id, wholesaler_id, status FROM orders WHERE status NOT IN (\'DELIVERED\', \'CANCELLED\', \'FAILED\', \'REFUNDED\') AND delivery_corridor = \'ZONE_1\';',
    indexUsed: 'idx_orders_active_pipeline_partial (B-tree Partial)',
    planningTimeMs: 0.15,
    executionTimeMs: 0.62,
    seqScanTimeMs: 65.0,
    speedupMultiplier: '104x',
    queryPlanNodes: [
      {
        nodeType: 'Index Scan using idx_orders_active_pipeline_partial',
        relation: 'orders',
        indexName: 'idx_orders_active_pipeline_partial',
        cost: '0.15..12.40',
        rows: 8,
        actualTime: '0.040..0.590',
        buffers: 'shared hit=8 read=0'
      }
    ]
  },
  {
    id: 'scenario_identity_vs_availability_join',
    title: 'Product Identity 1:N Supplier Availability Join (Dynamic Depot Routing)',
    category: 'PRODUCTS',
    sqlQuery: 'EXPLAIN (ANALYZE, BUFFERS) SELECT p.id, p.name, p.pack_size, sp.wholesaler_id, sp.wholesale_price, sp.available_stock FROM products p JOIN supplier_products sp ON p.id = sp.product_id WHERE p.id = \'prod_jogoo\' AND sp.is_available = TRUE AND sp.available_stock > 0 ORDER BY sp.wholesale_price ASC LIMIT 1;',
    indexUsed: 'products_pkey & idx_supplier_products_product_price (Index-Only Scan)',
    planningTimeMs: 0.18,
    executionTimeMs: 0.42,
    seqScanTimeMs: 115.0,
    speedupMultiplier: '273x',
    queryPlanNodes: [
      {
        nodeType: 'Limit',
        cost: '0.28..4.15',
        rows: 1,
        actualTime: '0.040..0.410',
        buffers: 'shared hit=6'
      },
      {
        nodeType: 'Nested Loop (Decoupled 1:N Resolution)',
        cost: '0.28..12.45',
        rows: 3,
        actualTime: '0.038..0.395',
        buffers: 'shared hit=6'
      },
      {
        nodeType: 'Index Scan using products_pkey (Product Identity Single-Row)',
        relation: 'products',
        indexName: 'products_pkey',
        cost: '0.14..2.15',
        rows: 1,
        actualTime: '0.015..0.018',
        buffers: 'shared hit=2 read=0'
      },
      {
        nodeType: 'Index Scan using idx_supplier_products_product_price (Supplier Availability 1:N)',
        relation: 'supplier_products',
        indexName: 'idx_supplier_products_product_price',
        cost: '0.14..10.20',
        rows: 3,
        actualTime: '0.020..0.360',
        buffers: 'shared hit=4 read=0'
      }
    ]
  }
];
