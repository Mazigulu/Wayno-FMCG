import { ArchitectureComponent, ArchitectureFlow } from '../types/architecture';

export const ARCHITECTURE_COMPONENTS: Record<string, ArchitectureComponent> = {
  // 1. Clients & Edge
  'client_mobile': {
    id: 'client_mobile',
    name: 'Mobile App (iOS / Android)',
    category: 'clients_edge',
    technology: 'React Native / Swift / Kotlin',
    role: 'Native client for turn-by-turn navigation, sensors, and GPS feeds',
    status: 'healthy',
    specs: { protocol: 'HTTPS / WSS', latency: '4ms', details: 'Offline vector map tiles, background geofencing' }
  },
  'client_web': {
    id: 'client_web',
    name: 'Web App (PWA)',
    category: 'clients_edge',
    technology: 'React 19 / TypeScript / Vite',
    role: 'Responsive progressive web app for desktop & mobile browsers',
    status: 'healthy',
    specs: { protocol: 'HTTPS / WSS', latency: '6ms', details: 'Service worker offline caching, WebGL vector maps' }
  },
  'client_voice': {
    id: 'client_voice',
    name: 'Voice Assistant (Voice + Audio)',
    category: 'clients_edge',
    technology: 'Web Audio API / SpeechRecognition',
    role: 'Hands-free voice prompt transcription and spoken route turn guidance',
    status: 'healthy',
    specs: { protocol: 'WebSocket stream', latency: '12ms', details: 'Full duplex audio, wake-word detection' }
  },
  'client_wearable': {
    id: 'client_wearable',
    name: 'Wearables (Smartwatch / AR)',
    category: 'clients_edge',
    technology: 'WatchOS / WearOS / AR HUD',
    role: 'Glanceable haptic turn cues, heart rate, wrist-based ETA display',
    status: 'healthy',
    specs: { protocol: 'BLE / HTTPS', latency: '8ms', details: 'Low-power ambient display mode' }
  },
  'edge_cdn': {
    id: 'edge_cdn',
    name: 'CDN (CloudFront / Cloudflare)',
    category: 'clients_edge',
    technology: 'AWS CloudFront + Cloudflare Edge',
    role: 'Global edge caching for vector map tiles, static assets, and SSL termination',
    status: 'healthy',
    specs: { protocol: 'TLS 1.3 / HTTP/3', throughput: '45 Gbps', latency: '<10ms at Edge', details: '450+ Points of Presence globally' }
  },
  'edge_shield': {
    id: 'edge_shield',
    name: 'DDoS Protection (AWS Shield)',
    category: 'clients_edge',
    technology: 'AWS Shield Advanced + WAF',
    role: 'Layer 3/4/7 volumetric attack mitigation and malicious IP reputation filtering',
    status: 'healthy',
    specs: { protocol: 'Hardware inline inspection', redundancy: 'Global anycast', details: 'Zero latency degradation inline packet filter' }
  },
  'edge_route53': {
    id: 'edge_route53',
    name: 'Global Load Balancer (Geo-DNS)',
    category: 'clients_edge',
    technology: 'AWS Route 53 Latency Routing',
    role: 'Geo-proximity DNS steering requests to lowest-latency AWS Region',
    status: 'healthy',
    specs: { protocol: 'DNS over HTTPS', latency: '< 5ms', details: 'Health-check failover to standby region' }
  },

  // 2. Cloud Infrastructure
  'infra_vpc': {
    id: 'infra_vpc',
    name: 'VPC (Multi-AZ)',
    category: 'cloud_infra',
    technology: 'AWS VPC / 3 Availability Zones',
    role: 'Isolated cloud network spanning us-east-1a, us-east-1b, us-east-1c',
    status: 'healthy',
    specs: { redundancy: '3 AZs', details: 'Public, private, and database subnet tiers' }
  },
  'infra_alb': {
    id: 'infra_alb',
    name: 'Application Load Balancer (ALB)',
    category: 'cloud_infra',
    technology: 'AWS ALB Layer 7',
    role: 'TLS offload, WebSocket sticky routing, path-based dispatch to EKS ingress',
    status: 'healthy',
    specs: { throughput: '10K RPS peak', latency: '2ms', redundancy: 'Multi-AZ', details: 'Automated target health evaluation' }
  },
  'infra_asg': {
    id: 'infra_asg',
    name: 'Auto Scaling Group',
    category: 'cloud_infra',
    technology: 'AWS EC2 Auto Scaling + Fargate',
    role: 'Dynamic compute scaling based on CPU, network I/O, and queue depth',
    status: 'healthy',
    specs: { throughput: 'Min 4, Max 50 nodes', details: 'Mixed On-Demand and Spot instances with 60s cooldown' }
  },

  // 3. Application Layer (Kubernetes)
  'app_gateway': {
    id: 'app_gateway',
    name: 'API Gateway (Kong / AWS)',
    category: 'application_layer',
    technology: 'Kong Gateway Enterprise / AWS API GW',
    role: 'REST & GraphQL ingress, JWT auth validation, 10K RPS rate limiting',
    status: 'healthy',
    specs: { protocol: 'REST / GraphQL', throughput: '10,000 req/s', latency: '4ms', details: 'HMAC signed tokens, OpenAPI 3.1 specification' }
  },
  'app_user_service': {
    id: 'app_user_service',
    name: 'User Service',
    category: 'application_layer',
    technology: 'Java 21 / Spring Boot 3.3',
    role: 'User profiles, auth token exchange, saved places, and privacy permissions',
    status: 'healthy',
    specs: { protocol: 'gRPC / REST', latency: '15ms', redundancy: '3 Pods', details: 'OAuth2 / OIDC token issuer with MFA support' }
  },
  'app_nav_service': {
    id: 'app_nav_service',
    name: 'Navigation Service',
    category: 'application_layer',
    technology: 'Python 3.12 / FastAPI / C++ Routing Engine',
    role: 'Multi-modal route planning, Contraction Hierarchies, dynamic graph routing',
    status: 'healthy',
    specs: { protocol: 'gRPC internal', latency: '35ms', redundancy: '6 Pods', details: 'Calculates multi-modal graph: drive, transit, walk, bike' }
  },
  'app_realtime_service': {
    id: 'app_realtime_service',
    name: 'Realtime Service',
    category: 'application_layer',
    technology: 'Node.js 22 / TypeScript / Socket.io',
    role: 'Live GPS location broadcasting, WebSocket session multiplexing, geofence triggers',
    status: 'healthy',
    specs: { protocol: 'WebSocket (wss://)', throughput: '50K concurrent sockets', latency: '8ms', details: 'Redis pub/sub cluster message distribution' }
  },
  'app_recom_service': {
    id: 'app_recom_service',
    name: 'Recommendation Service',
    category: 'application_layer',
    technology: 'Python 3.12 / Scikit-learn / XGBoost',
    role: 'Personalized departure times, habitual commute predictions, EV charging stops',
    status: 'healthy',
    specs: { protocol: 'gRPC', latency: '22ms', redundancy: '3 Pods', details: 'Collaborative filtering + time-of-day behavioral tensors' }
  },
  'app_notif_service': {
    id: 'app_notif_service',
    name: 'Notification Service',
    category: 'application_layer',
    technology: 'Node.js / BullMQ / APNS / FCM',
    role: 'High-priority push notifications, traffic alerts, and emergency reroute warnings',
    status: 'healthy',
    specs: { protocol: 'APNS / FCM / Twilio SMS', throughput: '2,500 msg/s', latency: '40ms', details: 'Deduplicated alert delivery with user quiet hours' }
  },
  'app_admin_service': {
    id: 'app_admin_service',
    name: 'Admin Service (Operations)',
    category: 'application_layer',
    technology: 'Spring Boot / React Admin',
    role: 'System operations, geofence management, fleet oversight, and telemetry audits',
    status: 'healthy',
    specs: { protocol: 'REST / GraphQL', latency: '18ms', details: 'Role-based access control (RBAC) with audit logging' }
  },
  'app_service_mesh': {
    id: 'app_service_mesh',
    name: 'Service Mesh (Istio)',
    category: 'application_layer',
    technology: 'Istio 1.23 + Envoy Proxy',
    role: 'Zero-trust mTLS encryption, canary traffic splitting, Jaeger distributed tracing',
    status: 'healthy',
    specs: { protocol: 'Envoy Sidecars (mTLS)', latency: '<1ms overhead', details: 'Automatic circuit breaking and mutual TLS 1.3' }
  },

  // 4. Data Layer
  'data_postgres': {
    id: 'data_postgres',
    name: 'PostgreSQL (Primary DB)',
    category: 'data_layer',
    technology: 'AWS Aurora PostgreSQL 16',
    role: 'Primary ACID database for users, payment ledgers, rides, and settings',
    status: 'healthy',
    specs: { redundancy: 'Multi-AZ + 2 Read Replicas', throughput: '8,500 IOPS', latency: '4ms', details: 'Automated 1-second continuous point-in-time backup' }
  },
  'data_postgis': {
    id: 'data_postgis',
    name: 'PostGIS (Spatial Extensions)',
    category: 'data_layer',
    technology: 'PostgreSQL + PostGIS 3.4 Extension',
    role: 'Geospatial vector calculations, ST_DWithin road graph, topology queries',
    status: 'healthy',
    specs: { protocol: 'Spatial SQL', latency: '12ms', details: 'R-tree spatial index (GIST), multi-polygon polygon clipping' }
  },
  'data_redis': {
    id: 'data_redis',
    name: 'Redis (Session, Cache, Geo)',
    category: 'data_layer',
    technology: 'AWS ElastiCache Redis Cluster',
    role: 'Low-latency session storage, GEOADD / GEORADIUS active vehicle positioning',
    status: 'healthy',
    specs: { redundancy: '6-Node Sharded Cluster', latency: '< 1ms', throughput: '120K ops/s', details: '5-second TTL on live vehicle coordinates' }
  },
  'data_timescaledb': {
    id: 'data_timescaledb',
    name: 'TimescaleDB (Tracking, Events)',
    category: 'data_layer',
    technology: 'TimescaleDB Hypertables',
    role: 'High-throughput time-series GPS breadcrumbs, speed telemetry, and route tracking',
    status: 'healthy',
    specs: { throughput: '45,000 writes/s', latency: '3ms', details: 'Continuous compression saving 92% storage footprint' }
  },
  'data_s3': {
    id: 'data_s3',
    name: 'S3 Data Lake (Raw & Processed)',
    category: 'data_layer',
    technology: 'AWS S3 Glacier Instant Retrieval',
    role: 'Parquet columnar storage for analytical queries, model training datasets, and telemetry',
    status: 'healthy',
    specs: { redundancy: '99.999999999% (11 9s)', details: 'Automated 90-day lifecycle transition to Glacier' }
  },
  'data_opensearch': {
    id: 'data_opensearch',
    name: 'OpenSearch (Location & Content)',
    category: 'data_layer',
    technology: 'AWS OpenSearch 2.15 Cluster',
    role: 'Geographic and content search, fuzzy address geocoding, POI indexing',
    status: 'healthy',
    specs: { redundancy: '3 Master, 6 Data Nodes', latency: '14ms', details: 'BM25 text ranking combined with geo-distance boosting' }
  },

  // 5. AI/ML Layer
  'aiml_sagemaker': {
    id: 'aiml_sagemaker',
    name: 'SageMaker (LLM + ML Models)',
    category: 'ai_ml_layer',
    technology: 'AWS SageMaker Real-Time Inference',
    role: 'ETA prediction models, dynamic traffic congestion prediction, route personalization',
    status: 'healthy',
    specs: { latency: '28ms inference', throughput: '3,000 inf/s', details: 'GPU accelerated G5 instances with auto-scaling' }
  },
  'aiml_vector_db': {
    id: 'aiml_vector_db',
    name: 'Vector Database (Aurora / OpenSearch)',
    category: 'ai_ml_layer',
    technology: 'pgvector + OpenSearch k-NN',
    role: '1536-dimensional embeddings for semantic destination search and RAG retrieval',
    status: 'healthy',
    specs: { latency: '16ms', throughput: 'HNSW cosine similarity', details: 'Indexed 2.5M places, POIs, and contextual travel notes' }
  },
  'aiml_glue': {
    id: 'aiml_glue',
    name: 'Data Processing (AWS Glue / EMR)',
    category: 'ai_ml_layer',
    technology: 'AWS Glue 4.0 Serverless Spark',
    role: 'Daily batch ETL/ELT, traffic speed profiles aggregation, map topology validation',
    status: 'healthy',
    specs: { throughput: '12 TB processed / night', details: 'PySpark pipelines outputting compressed Parquet to S3' }
  },
  'aiml_pipelines': {
    id: 'aiml_pipelines',
    name: 'Training Pipeline (SageMaker Pipelines)',
    category: 'ai_ml_layer',
    technology: 'AWS SageMaker Pipelines MLOps',
    role: 'Automated weekly model training, evaluation against baseline ground truth, deployment',
    status: 'healthy',
    specs: { details: 'Automatic rollback if MAPE error exceeds 4.5%' }
  },
  'aiml_bedrock': {
    id: 'aiml_bedrock',
    name: 'LLM Integration (Bedrock)',
    category: 'ai_ml_layer',
    technology: 'AWS Bedrock (Claude 3.5 Sonnet / Llama 3)',
    role: 'Natural language route reasoning, conversational voice assistant, personalized advice',
    status: 'healthy',
    specs: { protocol: 'AWS Bedrock SDK', latency: '180ms streaming TTFT', details: 'Synthesizes weather, traffic, and multi-modal tradeoffs into crisp guidance' }
  },

  // 6. External Integrations
  'ext_maps': {
    id: 'ext_maps',
    name: 'Maps & Location (Google / HERE)',
    category: 'external_integrations',
    technology: 'Google Maps Platform / HERE Vector API',
    role: 'Satellite imagery tiles, street view, reverse geocoding fallback',
    status: 'healthy',
    specs: { protocol: 'HTTPS REST', latency: '45ms', details: 'Fallback layer when local OpenSearch cache misses' }
  },
  'ext_traffic': {
    id: 'ext_traffic',
    name: 'Traffic & Transit (Real-time APIs)',
    category: 'external_integrations',
    technology: 'TomTom Live Traffic / GTFS-RT',
    role: 'Real-time traffic flow vectors, road incident reports, and public transit schedules',
    status: 'healthy',
    specs: { protocol: 'Protobuf streaming / REST', latency: '60ms', details: 'Ingested every 30 seconds across major corridors' }
  },
  'ext_weather': {
    id: 'ext_weather',
    name: 'Weather (OpenWeather / AccuWeather)',
    category: 'external_integrations',
    technology: 'OpenWeather One Call 3.0 API',
    role: 'Localized precipitation radar, wind speeds, visibility, storm warnings',
    status: 'healthy',
    specs: { protocol: 'HTTPS REST', latency: '50ms', details: 'Influences ETA calculation: +15% driving time during heavy rainfall' }
  },
  'ext_mobility': {
    id: 'ext_mobility',
    name: 'Ride-Hailing / Mobility (Uber / Lyft)',
    category: 'external_integrations',
    technology: 'Uber Rides SDK / Lyft Transit API',
    role: 'Live ride fare estimation, driver dispatch, and multi-modal comparisons',
    status: 'healthy',
    specs: { protocol: 'OAuth 2.0 / REST', latency: '75ms', details: 'Real-time price surge comparison and deep-linking' }
  },
  'ext_payments': {
    id: 'ext_payments',
    name: 'Payment Gateway (Stripe / Adyen)',
    category: 'external_integrations',
    technology: 'Stripe API / Adyen Transit Engine',
    role: 'Secure fare payment processing for transit tickets, ride-hailing, parking, and tolls',
    status: 'healthy',
    specs: { protocol: 'PCI-DSS Level 1 / TLS 1.3', latency: '120ms', details: 'Apple Pay, Google Pay, M-Pesa STK, credit card authorization' }
  },
  'ext_thirdparty': {
    id: 'ext_thirdparty',
    name: '3rd Party Services (Events, POIs)',
    category: 'external_integrations',
    technology: 'Yelp Fusion / Eventbrite / TripAdvisor',
    role: 'Dynamic point of interest enrichment, stadium event traffic surge alerts',
    status: 'healthy',
    specs: { protocol: 'REST APIs', latency: '65ms', details: 'Identifies game-day traffic spikes around major venues' }
  },

  // 7. Real-Time Data Sources
  'source_gps': {
    id: 'source_gps',
    name: 'GPS / Location (Device + Satellites)',
    category: 'realtime_sources',
    technology: 'Multi-constellation GNSS (GPS, GLONASS, Galileo)',
    role: 'Raw device positioning with dual-frequency satellite tracking and Kalman filtering',
    status: 'healthy',
    specs: { accuracy: '1.2 meters outdoors', updateRate: '1 Hz update stream', details: 'Hardware fused with accelerometer & gyroscope' }
  },
  'source_traffic_feeds': {
    id: 'source_traffic_feeds',
    name: 'Traffic Feeds (Incidents, Speeds)',
    category: 'realtime_sources',
    technology: 'Highway Sensor Loop Detectors + Floating Car Data',
    role: 'Live road speeds, lane closures, construction zones, and accident spots',
    status: 'healthy',
    specs: { updateRate: '30s refresh', details: 'Fused with crowdsourced incident reports' }
  },
  'source_transit_schedules': {
    id: 'source_transit_schedules',
    name: 'Public Transit (Real-time Schedules)',
    category: 'realtime_sources',
    technology: 'GTFS-Realtime Vehicle Positions + Trip Updates',
    role: 'Live subway train arrivals, bus GPS tracking, platform changes, and delays',
    status: 'healthy',
    specs: { updateRate: '15s streaming buffer', details: 'Automated headway and delay recalculation' }
  },
  'source_poi_db': {
    id: 'source_poi_db',
    name: 'POI Database (Live Status)',
    category: 'realtime_sources',
    technology: 'DynamoDB + OpenSearch POI Store',
    role: 'Operating hours, live EV charger availability, hotel vacancy, fuel prices',
    status: 'healthy',
    specs: { volume: '18M POIs globally', details: 'Real-time EV plug occupancy state' }
  },
  'source_ugc': {
    id: 'source_ugc',
    name: 'User Generated Data (Reports, Reviews)',
    category: 'realtime_sources',
    technology: 'WAYNO Community Ingestion Pipeline',
    role: 'Crowdsourced reports for speed cameras, police traps, potholes, road hazards',
    status: 'healthy',
    specs: { throughput: '800 reports/min', details: 'Automated reputation score validation' }
  },

  // 8. Monitoring & Analytics
  'mon_observability': {
    id: 'mon_observability',
    name: 'Observability (CloudWatch / Datadog)',
    category: 'monitoring_analytics',
    technology: 'AWS CloudWatch + Datadog APM',
    role: 'End-to-end distributed tracing, APM service map, and automated alerting',
    status: 'healthy',
    specs: { retention: '15 months', details: 'P95 latency alert threshold configured at 200ms' }
  },
  'mon_logs': {
    id: 'mon_logs',
    name: 'Logs (ELK / OpenSearch)',
    category: 'monitoring_analytics',
    technology: 'Elasticsearch / Logstash / Kibana + OpenSearch',
    role: 'Centralized structured JSON log indexing with correlation trace IDs',
    status: 'healthy',
    specs: { volume: '2.4 TB/day', latency: '< 2s ingestion lag', details: 'Masks all PII and sensitive location coordinates' }
  },
  'mon_metrics': {
    id: 'mon_metrics',
    name: 'Metrics (Prometheus / Grafana)',
    category: 'monitoring_analytics',
    technology: 'Prometheus Operator + Grafana 11.2',
    role: 'Real-time cluster telemetry, pod CPU/RAM, RPS counters, and error rate dashboards',
    status: 'healthy',
    specs: { scrapeInterval: '10 seconds', details: 'Monitors 10,000 peak RPS target' }
  },
  'mon_quicksight': {
    id: 'mon_quicksight',
    name: 'Business Analytics (QuickSight)',
    category: 'monitoring_analytics',
    technology: 'AWS QuickSight Serverless BI',
    role: 'Executive KPI dashboards: GMV, commuter time saved, carbon footprint reduction',
    status: 'healthy',
    specs: { refresh: 'Hourly SPICE engine', details: 'Calculated 14.2M commuter minutes saved to date' }
  },
  'mon_mixpanel': {
    id: 'mon_mixpanel',
    name: 'User Analytics (Mixpanel / Amplitude)',
    category: 'monitoring_analytics',
    technology: 'Mixpanel SDK + Segment CDP',
    role: 'User journey funnels: Search -> Route Comparison -> Navigation Started -> Trip Completed',
    status: 'healthy',
    specs: { conversionRate: '88.4% start-to-completion', details: 'Cohort retention and persona behavior segmentation' }
  },

  // 9. DevOps & Security
  'devops_cicd': {
    id: 'devops_cicd',
    name: 'CI/CD Pipeline (CodePipeline)',
    category: 'devops_security',
    technology: 'GitHub Actions + AWS CodeBuild + CodeDeploy',
    role: 'Automated test suite, linting, Docker image build, canary deployment to EKS',
    status: 'healthy',
    specs: { buildTime: '4m 18s', testCoverage: '91.2%', details: 'Zero-downtime rolling update with automated rollback' }
  },
  'devops_terraform': {
    id: 'devops_terraform',
    name: 'Infrastructure as Code (Terraform)',
    category: 'devops_security',
    technology: 'HashiCorp Terraform 1.9 + AWS Provider',
    role: 'Declarative infrastructure definitions for VPCs, EKS clusters, and RDS multi-AZ',
    status: 'healthy',
    specs: { stateLocking: 'DynamoDB + S3 Backend', details: 'Automated drift detection running every 6 hours' }
  },
  'devops_security': {
    id: 'devops_security',
    name: 'Security (IAM, KMS, WAF, Secrets)',
    category: 'devops_security',
    technology: 'AWS IAM + KMS + Secrets Manager + WAF',
    role: 'Least-privilege role boundaries, envelope encryption at rest, automatic 30-day key rotation',
    status: 'healthy',
    specs: { compliance: 'SOC2 Type II, ISO 27001, GDPR', details: 'All network transit encrypted via TLS 1.3' }
  },
  'devops_dr': {
    id: 'devops_dr',
    name: 'Disaster Recovery (Multi-AZ & Cross-Region)',
    category: 'devops_security',
    technology: 'Multi-AZ Aurora + S3 Cross-Region Replication',
    role: 'Automated failover in < 30 seconds (RTO) with zero data loss (RPO < 1s)',
    status: 'healthy',
    specs: { rto: '< 30 seconds', rpo: '< 1 second', details: 'Automated bi-monthly failover drill testing' }
  }
};

export const MASTER_ARCHITECTURE_FLOWS: ArchitectureFlow[] = [
  {
    id: 'flow_route_planning',
    title: 'Flow 1: AI Multi-Modal Route Planning & Bedrock Reasoning',
    subtitle: 'From Client tap to Bedrock LLM synthesis & PostGIS calculation',
    description: 'When a commuter or driver searches for a destination, requests transit options, and asks Bedrock LLM to reason through traffic, weather, and price tradeoffs.',
    category: 'Routing',
    estimatedP95Ms: 168,
    steps: [
      {
        stepNumber: 1,
        sourceComponentId: 'client_mobile',
        targetComponentId: 'edge_cdn',
        action: 'Client initiates route search',
        protocol: 'HTTPS / TLS 1.3',
        payloadDescription: 'POST /v1/routes/plan { origin: [-1.286389, 36.817223], dest: [-1.2297, 36.8833], mode: "multi_modal", userPersona: "commuter" }',
        codeSnippet: `const res = await api.post('/v1/routes/plan', {
  origin: { lat: -1.286389, lng: 36.817223, label: 'Nairobi CBD' },
  destination: { lat: -1.2297, lng: 36.8833, label: 'Garden City Mall' },
  preferences: { avoidTolls: false, prioritizeCO2: true },
  persona: 'commuter'
});`,
        durationMs: 14,
        status: 'completed',
        layerName: '1. Clients & Edge'
      },
      {
        stepNumber: 2,
        sourceComponentId: 'edge_cdn',
        targetComponentId: 'infra_alb',
        action: 'DDoS inspection and ALB ingress',
        protocol: 'HTTP/2 (Encrypted)',
        payloadDescription: 'AWS Shield verified TLS 1.3 handshake. Route53 routed to us-east-1 ALB target group with zero packet drops.',
        codeSnippet: `// AWS WAF Rule Evaluation
WAF_RULE_EVALUATION: ALLOW (Score: 0.00 / Bot Risk: Normal)
TLS_CIPHER: TLS_AES_128_GCM_SHA256
TARGET_GROUP: k8s-ingress-wayno-prod`,
        durationMs: 6,
        status: 'completed',
        layerName: '2. Cloud Infrastructure'
      },
      {
        stepNumber: 3,
        sourceComponentId: 'infra_alb',
        targetComponentId: 'app_gateway',
        action: 'Kong API Gateway validation & rate limit check',
        protocol: 'mTLS via Istio',
        payloadDescription: 'Kong validates JWT authorization token, decodes user tenant ID, and applies 10K RPS token-bucket rate limiter.',
        codeSnippet: `// Kong Gateway Ingress Filter
jwt_claims = decode_jwt(req.headers['Authorization'])
rate_limiter.consume(key=user_id, cost=1) // Remaining quota: 9,984
istio.forward(to="navigation-service.prod.svc.cluster.local:50051")`,
        durationMs: 8,
        status: 'completed',
        layerName: '3. Application Layer'
      },
      {
        stepNumber: 4,
        sourceComponentId: 'app_gateway',
        targetComponentId: 'app_nav_service',
        action: 'Navigation Service resolves multi-modal graphs',
        protocol: 'gRPC',
        payloadDescription: 'FastAPI microservice queries PostGIS for spatial road topology and Redis for cached live road speeds.',
        codeSnippet: `// Python Navigation Service (FastAPI + C++ Graph Engine)
async def compute_multimodal_route(origin, destination, preferences):
    cached_graph = await redis_cluster.get(f"route:{origin}:{destination}")
    if cached_graph: return cached_graph
    # Invoke PostGIS topological contraction hierarchy
    raw_paths = await db.query(ROAD_NETWORK_CH_QUERY)`,
        durationMs: 32,
        status: 'completed',
        layerName: '3. Application Layer'
      },
      {
        stepNumber: 5,
        sourceComponentId: 'app_nav_service',
        targetComponentId: 'data_postgis',
        action: 'PostGIS spatial topological calculation',
        protocol: 'PostgreSQL Wire Protocol',
        payloadDescription: 'Runs ST_DWithin and Contraction Hierarchies across 480,000 road segments and transit lines.',
        codeSnippet: `SELECT route_id, ST_AsGeoJSON(ST_MakeLine(geom)) as geom_geojson,
       SUM(cost * congestion_factor) as total_duration_seconds
FROM pgr_dijkstra('SELECT id, source, target, cost FROM nairobi_roads', 
                  origin_node, dest_node, directed := true)
JOIN nairobi_roads ON edge = id;`,
        durationMs: 24,
        status: 'completed',
        layerName: '4. Data Layer'
      },
      {
        stepNumber: 6,
        sourceComponentId: 'app_nav_service',
        targetComponentId: 'aiml_bedrock',
        action: 'Bedrock LLM generates real-time route reasoning',
        protocol: 'AWS Bedrock InvokeModel',
        payloadDescription: 'Claude 3.5 Sonnet foundation model synthesizes weather, traffic incidents, and cost into concise natural language reasoning.',
        codeSnippet: `// Bedrock Foundation Model Request
const prompt = \`Compare these 3 routes for a commuter:
Route A (Thika Superhighway): 24 mins, heavy jam near Survey, free
Route B (Uhuru Highway bypass): 18 mins, smooth, toll KES 150
Route C (Metro Bus Line 4): 31 mins, KES 80, zero emissions
Give a 2-sentence rationale for the best pick.\`;

const response = await bedrock.invokeModel({
  modelId: "anthropic.claude-3-5-sonnet",
  body: JSON.stringify({ prompt, max_tokens: 150 })
});`,
        durationMs: 65,
        status: 'completed',
        layerName: '5. AI/ML Layer'
      },
      {
        stepNumber: 7,
        sourceComponentId: 'app_nav_service',
        targetComponentId: 'data_redis',
        action: 'Store computed route in Redis geospatial cache',
        protocol: 'RESP3 (TCP)',
        payloadDescription: 'Caches route segments with a 60-second TTL to accelerate repeated commuter queries across identical corridors.',
        codeSnippet: `redis.setex(
  "route:geo:-1.2863:36.8172:-1.2297:36.8833", 
  60, 
  JSON.stringify({ routes, aiRationale, computedAt: Date.now() })
);`,
        durationMs: 3,
        status: 'completed',
        layerName: '4. Data Layer'
      },
      {
        stepNumber: 8,
        sourceComponentId: 'app_nav_service',
        targetComponentId: 'client_mobile',
        action: 'Return multi-modal options and AI reasoning to Client',
        protocol: 'HTTPS / JSON',
        payloadDescription: 'Delivered in 168ms total (p95 SLA: < 200ms). Client renders dynamic vector route, elevation profile, and voice summary.',
        codeSnippet: `HTTP/2 200 OK
Content-Type: application/json
X-WAYNO-Latency: 168ms
X-Bedrock-Model: anthropic.claude-3-5-sonnet
{
  "routes": 3,
  "recommendedId": "route_b",
  "aiRationale": "Taking the bypass saves 6 mins despite the toll, avoiding the gridlock near Survey.",
  "durationMins": 18,
  "distanceKm": 12.4
}`,
        durationMs: 16,
        status: 'completed',
        layerName: '1. Clients & Edge'
      }
    ]
  },
  {
    id: 'flow_realtime_tracking',
    title: 'Flow 2: Real-Time GPS Tracking & Breadcrumb Ingestion',
    subtitle: '1 Hz device positioning, TimescaleDB hypertable write & WebSocket broadcast',
    description: 'When an active driver or rider moves through the city, sending GPS coordinates every second to update ETA, detect lane maneuvers, and broadcast position.',
    category: 'Telemetry',
    estimatedP95Ms: 42,
    steps: [
      {
        stepNumber: 1,
        sourceComponentId: 'source_gps',
        targetComponentId: 'client_mobile',
        action: 'Device GNSS sensor acquires satellite lock',
        protocol: 'Hardware NMEA / CoreLocation',
        payloadDescription: 'Dual-frequency GPS lock with 12 satellites. Kalman filter eliminates multipath reflection noise.',
        codeSnippet: `// Native Sensor Pipeline (iOS / Android)
const position = {
  coords: { latitude: -1.2612, longitude: 36.8224, accuracy: 1.2, speed: 52.4, heading: 42.1 },
  timestamp: 1725801200420
};`,
        durationMs: 4,
        status: 'completed',
        layerName: '7. Real-Time Data Sources'
      },
      {
        stepNumber: 2,
        sourceComponentId: 'client_mobile',
        targetComponentId: 'app_realtime_service',
        action: 'Transmit high-frequency telemetry via WebSocket',
        protocol: 'WSS (WebSocket over TLS 1.3)',
        payloadDescription: 'Compact binary Protobuf packet containing timestamp, user_id, trip_id, lat/lng, speed, and heading.',
        codeSnippet: `// WebSocket Client Streaming
socket.emit('telemetry:ping', {
  tripId: 'trp_nbo_8921',
  loc: [-1.2612, 36.8224],
  speedKmh: 52.4,
  bearingDeg: 42.1,
  seq: 1482
});`,
        durationMs: 12,
        status: 'completed',
        layerName: '3. Application Layer'
      },
      {
        stepNumber: 3,
        sourceComponentId: 'app_realtime_service',
        targetComponentId: 'data_timescaledb',
        action: 'Ingest into TimescaleDB time-series hypertable',
        protocol: 'PostgreSQL Wire',
        payloadDescription: 'Appends to trip_breadcrumbs hypertable partitioned by chunk interval. Automatic 92% compression enabled.',
        codeSnippet: `INSERT INTO trip_breadcrumbs (time, trip_id, user_id, location, speed, heading)
VALUES (NOW(), 'trp_nbo_8921', 'usr_sarah', ST_SetSRID(ST_Point(36.8224, -1.2612), 4326), 52.4, 42.1);`,
        durationMs: 8,
        status: 'completed',
        layerName: '4. Data Layer'
      },
      {
        stepNumber: 4,
        sourceComponentId: 'app_realtime_service',
        targetComponentId: 'data_redis',
        action: 'Update Redis Cluster GEO spatial index',
        protocol: 'RESP3',
        payloadDescription: 'GEOADD active vehicle coordinate in driver:geo:nairobi with a 10-second TTL for live proximity queries.',
        codeSnippet: `redis.geoadd("driver:geo:nairobi", 36.8224, -1.2612, "trp_nbo_8921");
redis.setex("driver:state:trp_nbo_8921", 10, JSON.stringify({ speed: 52.4, nextTurn: "Right on Ring Road" }));`,
        durationMs: 3,
        status: 'completed',
        layerName: '4. Data Layer'
      },
      {
        stepNumber: 5,
        sourceComponentId: 'app_realtime_service',
        targetComponentId: 'client_wearable',
        action: 'Broadcast updated turn & ETA to Smartwatch / AR HUD',
        protocol: 'WebSocket push',
        payloadDescription: 'Rider receives haptic pulse and visual turn arrow: "In 350m, Turn Right onto Enterprise Rd".',
        codeSnippet: `wearable.receiveHapticEvent({
  vibrationPattern: [100, 50, 100],
  maneuver: 'TURN_RIGHT',
  distanceText: '350 m',
  etaText: '14:32'
});`,
        durationMs: 15,
        status: 'completed',
        layerName: '1. Clients & Edge'
      }
    ]
  },
  {
    id: 'flow_dynamic_reroute',
    title: 'Flow 3: Dynamic Weather & Traffic Incident Auto-Reroute',
    subtitle: 'OpenWeather + TomTom event ingestion, SageMaker ML trigger & push alert',
    description: 'When sudden flash flooding or an accident is detected ahead on the user’s active route, initiating a sub-second detour calculation and notification.',
    category: 'Incident',
    estimatedP95Ms: 185,
    steps: [
      {
        stepNumber: 1,
        sourceComponentId: 'ext_traffic',
        targetComponentId: 'aiml_glue',
        action: 'Traffic API detects major accident on Uhuru Highway',
        protocol: 'GTFS-RT / Webhook',
        payloadDescription: 'TomTom Live Traffic reports 2-lane closure at Nyayo Stadium roundabout. Average speed drops from 55 km/h to 6 km/h.',
        codeSnippet: `// External Traffic Incident Ingestion
{
  "incidentId": "inc_tomtom_9810",
  "road": "Uhuru Highway",
  "coordinates": [-1.2991, 36.8231],
  "severity": "CRITICAL",
  "delaySeconds": 1420
}`,
        durationMs: 45,
        status: 'completed',
        layerName: '6. External Integrations'
      },
      {
        stepNumber: 2,
        sourceComponentId: 'ext_weather',
        targetComponentId: 'aiml_glue',
        action: 'OpenWeather radar confirms heavy rainfall & poor visibility',
        protocol: 'REST API',
        payloadDescription: 'OpenWeather OneCall reports 18mm/hr precipitation and slick road advisory along Southern Corridor.',
        codeSnippet: `// OpenWeather Radar Data
{
  "zone": "nairobi_south",
  "precipitation_mm": 18.4,
  "visibility_meters": 1200,
  "hazard_level": "SLIPPERY_ROAD"
}`,
        durationMs: 38,
        status: 'completed',
        layerName: '6. External Integrations'
      },
      {
        stepNumber: 3,
        sourceComponentId: 'aiml_glue',
        targetComponentId: 'aiml_sagemaker',
        action: 'SageMaker model recalculates ETA & detects SLA breach',
        protocol: 'AWS SageMaker RealTime',
        payloadDescription: 'ML model evaluates active routes passing Nyayo Stadium. Forecasts +24 mins delay unless rerouted via Aerodrome Rd.',
        codeSnippet: `// SageMaker XGBoost Inference
predictions = sagemaker_runtime.invoke_endpoint(
    EndpointName="wayno-eta-model-prod",
    ContentType="application/json",
    Body=json.dumps({"incident_factor": 4.8, "rain_mm": 18.4, "current_segment": "uhuru_hw_s2"})
)
# Result: delay_minutes = 24.2, reroute_recommended = True`,
        durationMs: 28,
        status: 'completed',
        layerName: '5. AI/ML Layer'
      },
      {
        stepNumber: 4,
        sourceComponentId: 'aiml_sagemaker',
        targetComponentId: 'app_notif_service',
        action: 'Notification Service dispatches emergency reroute prompt',
        protocol: 'APNS / FCM High Priority',
        payloadDescription: 'Dispatches in-app proactive prompt: "Heavy accident + rain ahead. Reroute via Aerodrome Rd saves 19 mins. Accept?"',
        codeSnippet: `// In-App Notification Push
await notificationService.sendPriorityAlert({
  tripId: 'trp_nbo_8921',
  title: 'Traffic & Weather Alert',
  message: 'Accident ahead (+24 mins). Reroute via Aerodrome Rd to save 19 mins.',
  actionType: 'ACCEPT_REROUTE',
  newRouteId: 'rt_alt_aerodrome_44'
});`,
        durationMs: 34,
        status: 'completed',
        layerName: '3. Application Layer'
      },
      {
        stepNumber: 5,
        sourceComponentId: 'app_notif_service',
        targetComponentId: 'client_mobile',
        action: 'Mobile App switches active navigation path seamlessly',
        protocol: 'UI Render',
        payloadDescription: 'One-tap voice or screen acceptance recalculates turn guidance without stopping vehicle playback.',
        codeSnippet: `navigationEngine.applyReroute('rt_alt_aerodrome_44');
audioAssistant.speak("Rerouting onto Aerodrome Road. You will arrive 19 minutes earlier.");`,
        durationMs: 40,
        status: 'completed',
        layerName: '1. Clients & Edge'
      }
    ]
  },
  {
    id: 'flow_semantic_poi',
    title: 'Flow 4: Semantic Vector POI & RAG Search',
    subtitle: 'Natural language voice query -> OpenSearch k-NN -> Bedrock synthesis',
    description: 'When a traveler asks in plain English: "Find an open rooftop coffee spot with fast WiFi and parking along my route to Westlands".',
    category: 'SemanticSearch',
    estimatedP95Ms: 145,
    steps: [
      {
        stepNumber: 1,
        sourceComponentId: 'client_voice',
        targetComponentId: 'app_gateway',
        action: 'Spoken query transcribed and sent to API Gateway',
        protocol: 'WebSocket / Audio chunk',
        payloadDescription: '"Find an open rooftop coffee spot with fast WiFi and parking along my route to Westlands"',
        codeSnippet: `// Spoken Input
POST /v1/places/semantic-search
{
  "query": "rooftop coffee spot with fast wifi and parking along my route",
  "routeCorridor": "corridor_cbd_westlands",
  "maxDetourMinutes": 8
}`,
        durationMs: 18,
        status: 'completed',
        layerName: '1. Clients & Edge'
      },
      {
        stepNumber: 2,
        sourceComponentId: 'app_gateway',
        targetComponentId: 'app_recom_service',
        action: 'Recommendation Service transforms query into 1536-dim vector',
        protocol: 'gRPC',
        payloadDescription: 'Calls Amazon Titan Text Embeddings to produce dense semantic embedding vector.',
        codeSnippet: `// Vector Embedding Generation
const vector = await bedrock.invokeModel({
  modelId: "amazon.titan-embed-text-v1",
  body: JSON.stringify({ inputText: req.query })
}); // Output: Float32Array[1536]`,
        durationMs: 36,
        status: 'completed',
        layerName: '3. Application Layer'
      },
      {
        stepNumber: 3,
        sourceComponentId: 'app_recom_service',
        targetComponentId: 'aiml_vector_db',
        action: 'OpenSearch k-NN vector search with spatial bounding filter',
        protocol: 'OpenSearch REST Protocol',
        payloadDescription: 'Performs HNSW cosine similarity across POI catalog with geo_distance < 800m from active route polyline.',
        codeSnippet: `GET /places_vector_index/_search
{
  "query": {
    "bool": {
      "must": [
        { "knn": { "embedding": { "vector": vector, "k": 5 } } }
      ],
      "filter": [
        { "geo_distance": { "distance": "800m", "pin.location": { "lat": -1.268, "lon": 36.809 } } },
        { "term": { "is_open_now": true } }
      ]
    }
  }
}`,
        durationMs: 28,
        status: 'completed',
        layerName: '5. AI/ML Layer'
      },
      {
        stepNumber: 4,
        sourceComponentId: 'aiml_vector_db',
        targetComponentId: 'aiml_bedrock',
        action: 'Bedrock synthesizes top match with detour time',
        protocol: 'Claude 3.5 Sonnet RAG',
        payloadDescription: 'Identifies "Java House Rooftop Barista" (4.8 stars, 3 mins detour, fiber internet, underground parking).',
        codeSnippet: `// Bedrock RAG Prompt
const summary = await bedrock.generateSummary({
  topCandidates: searchResults,
  userConstraints: "fast wifi + rooftop + low detour"
});
// "Java House Rooftop on Mpaka Road is a 3-minute detour with dedicated parking and 150 Mbps WiFi."`,
        durationMs: 48,
        status: 'completed',
        layerName: '5. AI/ML Layer'
      },
      {
        stepNumber: 5,
        sourceComponentId: 'aiml_bedrock',
        targetComponentId: 'client_voice',
        action: 'Voice Assistant announces result and adds waypoint',
        protocol: 'Audio Synthesizer',
        payloadDescription: 'Audio response plays over vehicle speakers, offering one-word "Add stop" voice confirmation.',
        codeSnippet: `voiceEngine.speak("I found Java House Rooftop on Mpaka Road, 3 minutes off your path with fast WiFi and parking. Would you like to add it as a waypoint?");`,
        durationMs: 15,
        status: 'completed',
        layerName: '1. Clients & Edge'
      }
    ]
  },
  {
    id: 'flow_ride_hail_payment',
    title: 'Flow 5: Ride-Hailing Booking & Stripe Payment Settlement',
    subtitle: 'Uber/Lyft dispatch, Stripe 3D-Secure auth & PostgreSQL ACID ledger',
    description: 'When a commuter chooses a multi-modal ride-hailing leg, validating pricing, booking the driver, authorizing payment, and logging to S3 Data Lake.',
    category: 'Payment',
    estimatedP95Ms: 192,
    steps: [
      {
        stepNumber: 1,
        sourceComponentId: 'client_mobile',
        targetComponentId: 'app_gateway',
        action: 'User commits to ride booking option',
        protocol: 'HTTPS POST /v1/rides/book',
        payloadDescription: '{ provider: "WAYNO_GREEN", pickup: "Nairobi CBD", dropoff: "Gigiri", estimatedFare: 840, currency: "KES" }',
        codeSnippet: `const booking = await api.post('/v1/rides/book', {
  provider: 'WAYNO_GREEN',
  rideOptionId: 'opt_ev_eco_01',
  fareKes: 840,
  paymentMethodId: 'pm_card_9981'
});`,
        durationMs: 14,
        status: 'completed',
        layerName: '1. Clients & Edge'
      },
      {
        stepNumber: 2,
        sourceComponentId: 'app_gateway',
        targetComponentId: 'ext_mobility',
        action: 'Dispatch driver via Mobility Integration API',
        protocol: 'OAuth 2.0 / REST',
        payloadDescription: 'Contacts partner fleet dispatch. Driver Evans (Toyota bZ4X EV, Plate KDF 412X) assigned with 3 min ETA.',
        codeSnippet: `// Fleet Dispatch Integration
const driverMatch = await mobilityPartner.dispatch({
  pickupCoord: [-1.286389, 36.817223],
  vehicleClass: 'ELECTRIC_VEHICLE',
  passengerName: 'Sarah W.'
});`,
        durationMs: 58,
        status: 'completed',
        layerName: '6. External Integrations'
      },
      {
        stepNumber: 3,
        sourceComponentId: 'app_gateway',
        targetComponentId: 'ext_payments',
        action: 'Stripe Payment Gateway authorizes fare hold',
        protocol: 'PCI-DSS Level 1 / TLS 1.3',
        payloadDescription: 'Stripe PaymentIntent created with authorized capture hold of KES 840. Anti-fraud radar score: 99/100 (Safe).',
        codeSnippet: `// Stripe Payment Intent Authorization
const paymentIntent = await stripe.paymentIntents.create({
  amount: 84000, // in cents
  currency: 'kes',
  customer: 'cus_sarah_918',
  capture_method: 'manual',
  metadata: { tripId: 'trp_nbo_8921', provider: 'WAYNO_GREEN' }
});`,
        durationMs: 72,
        status: 'completed',
        layerName: '6. External Integrations'
      },
      {
        stepNumber: 4,
        sourceComponentId: 'app_gateway',
        targetComponentId: 'data_postgres',
        action: 'PostgreSQL commits ACID transaction ledger',
        protocol: 'SQL Multi-AZ',
        payloadDescription: 'Inserts trip record, driver assignment, and escrow payment status inside atomic transaction block.',
        codeSnippet: `BEGIN TRANSACTION;
INSERT INTO trips (id, user_id, driver_id, fare_amount, status) VALUES ('trp_8921', 'usr_sarah', 'drv_evans', 840, 'CONFIRMED');
INSERT INTO payment_ledger (trip_id, stripe_intent, status) VALUES ('trp_8921', 'pi_3M2qL...', 'AUTHORIZED');
COMMIT;`,
        durationMs: 18,
        status: 'completed',
        layerName: '4. Data Layer'
      },
      {
        stepNumber: 5,
        sourceComponentId: 'data_postgres',
        targetComponentId: 'data_s3',
        action: 'Stream audit event to S3 Parquet Data Lake',
        protocol: 'AWS Kinesis Firehose',
        payloadDescription: 'Appends to s3://wayno-data-lake-prod/events/year=2026/month=09/day=08/payments.parquet for analytics and compliance.',
        codeSnippet: `// Kinesis Firehose Delivery Stream
firehose.putRecord({
  DeliveryStreamName: 'wayno-payment-events-parquet',
  Record: { Data: Buffer.from(JSON.stringify(paymentAuditPayload)) }
});`,
        durationMs: 30,
        status: 'completed',
        layerName: '4. Data Layer'
      }
    ]
  },
  {
    id: 'flow_devops_failover',
    title: 'Flow 6: DevOps CI/CD Canary Deployment & Multi-AZ Failover',
    subtitle: 'GitHub Commit -> CodeBuild -> EKS Canary -> Auto-Scaling & Multi-AZ RDS',
    description: 'Demonstrating how the infrastructure achieves 99.9% availability, zero-downtime microservice deployments, and automated failover across 3 AWS Availability Zones.',
    category: 'DevOps',
    estimatedP95Ms: 120,
    steps: [
      {
        stepNumber: 1,
        sourceComponentId: 'devops_cicd',
        targetComponentId: 'app_service_mesh',
        action: 'GitHub PR merged -> AWS CodeBuild generates container image',
        protocol: 'Git Webhook + Docker Build',
        payloadDescription: 'Builds dist/server.cjs and Docker image tagged v1.4.2. Runs unit tests, OWASP vulnerability scan, and push to ECR.',
        codeSnippet: `// CodeBuild pipeline step
docker build -t 887471711556.dkr.ecr.us-east-1.amazonaws.com/wayno-nav:v1.4.2 .
docker push 887471711556.dkr.ecr.us-east-1.amazonaws.com/wayno-nav:v1.4.2`,
        durationMs: 25,
        status: 'completed',
        layerName: '9. DevOps & Security'
      },
      {
        stepNumber: 2,
        sourceComponentId: 'app_service_mesh',
        targetComponentId: 'app_nav_service',
        action: 'Istio Service Mesh shifts 10% traffic to Canary pod',
        protocol: 'Istio VirtualService',
        payloadDescription: 'Envoy proxy routes 10% of active route planning requests to v1.4.2 while 90% stays on v1.4.1.',
        codeSnippet: `apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
spec:
  http:
  - route:
    - destination: { host: nav-service, subset: v1-4-1 }, weight: 90
    - destination: { host: nav-service, subset: v1-4-2 }, weight: 10`,
        durationMs: 15,
        status: 'completed',
        layerName: '3. Application Layer'
      },
      {
        stepNumber: 3,
        sourceComponentId: 'mon_metrics',
        targetComponentId: 'infra_asg',
        action: 'Prometheus evaluates Canary health & error rate',
        protocol: 'PromQL Alerting Rule',
        payloadDescription: 'Canary error rate: 0.00%, latency p95: 142ms. Auto-promotes canary to 100% traffic across all EKS pods.',
        codeSnippet: `// Prometheus Health Verification
sum(rate(http_requests_total{status=~"5.."}[2m])) / sum(rate(http_requests_total[2m])) < 0.001
Result: HEALTHY (Error rate: 0.012% - Target < 0.1%)
Action: Helm upgrade full rollout promoted`,
        durationMs: 22,
        status: 'completed',
        layerName: '8. Monitoring & Analytics'
      },
      {
        stepNumber: 4,
        sourceComponentId: 'infra_asg',
        targetComponentId: 'infra_vpc',
        action: 'Simulate AZ-1a outage & verify Multi-AZ resilience',
        protocol: 'AWS Health Check & Heartbeat',
        payloadDescription: 'Simulated network split on us-east-1a. ALB redirects 100% of traffic to us-east-1b and us-east-1c in 1.4 seconds.',
        codeSnippet: `// ALB Target Health Failure Detection
ALB Target Health Alert: az-1a unreachable
Target Group rerouted to healthy targets in az-1b (12 pods) & az-1c (12 pods)
Zero dropped HTTP requests. RTO: 1.4s (Target: < 30s)`,
        durationMs: 35,
        status: 'completed',
        layerName: '2. Cloud Infrastructure'
      },
      {
        stepNumber: 5,
        sourceComponentId: 'data_postgres',
        targetComponentId: 'devops_dr',
        action: 'Aurora PostgreSQL Multi-AZ automatic standby promotion',
        protocol: 'Aurora Storage Replication',
        payloadDescription: 'Storage layer replicates across 6 storage nodes in 3 AZs. Standby replica in us-east-1b promoted to writer in 18s.',
        codeSnippet: `// Aurora Multi-AZ Failover Log
[INFO] Primary instance us-east-1a stopped responding.
[INFO] Promoting standby replica us-east-1b to primary writer.
[INFO] DNS CNAME endpoint updated. Total failover time: 18.2 seconds.`,
        durationMs: 23,
        status: 'completed',
        layerName: '9. DevOps & Security'
      }
    ]
  }
];
