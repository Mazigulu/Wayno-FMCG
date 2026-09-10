import { NFRSpecification, LatencyBudgetSegment, DisasterRecoveryDrillStep } from '../types/nfr';

export const ALL_NFR_SPECIFICATIONS: NFRSpecification[] = [
  // 1. PERFORMANCE
  {
    id: 'performance',
    index: 1,
    title: 'Performance',
    subtitle: 'Latency Budgets, Mobile Cold-Start & Low-Bandwidth Network Optimization',
    category: 'system_qualities',
    tag: 'NFR-01',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'VERIFIED',
    summary: 'Guarantees sub-200ms P95 API responses, sub-1.8s mobile WebAPK cold starts, and minimal cellular data payloads across erratic Nairobi 2G/3G/4G cellular connections.',
    businessImpact: 'A 100ms latency degradation in duka order checkout increases cart abandonment by 7.4% during morning restock rush hours (06:00 - 08:30 EAT).',
    kenyanContext: 'Informal duka owners frequently operate on prepaid 10MB/50MB daily Safaricom data bundles with spotty EDGE/3G connectivity in densely built settlements like Eastleigh and Kibera.',
    targetMetrics: [
      {
        name: 'API Latency P50 (Read)',
        target: '< 60 ms',
        measured: '42 ms',
        tolerance: '75 ms',
        status: 'pass',
        unit: 'ms',
        description: 'Catalog query, product search, and shop inventory checks served via edge cache or read replica.'
      },
      {
        name: 'API Latency P95 (Write/Checkout)',
        target: '< 200 ms',
        measured: '168 ms',
        tolerance: '250 ms',
        status: 'pass',
        unit: 'ms',
        description: 'Order reservation, pricing validation, and M-Pesa STK push initiation dispatch.'
      },
      {
        name: 'API Latency P99 (Peak)',
        target: '< 450 ms',
        measured: '380 ms',
        tolerance: '500 ms',
        status: 'pass',
        unit: 'ms',
        description: 'Complex multi-wholesaler split order calculation under 5,000 concurrent active baskets.'
      },
      {
        name: 'WebAPK / PWA Initial Cold Start',
        target: '< 1.8 s',
        measured: '1.45 s',
        tolerance: '2.2 s',
        status: 'pass',
        unit: 's',
        description: 'Time to Interactive (TTI) on a low-end Tecno Spark (1GB RAM) over 3G network.'
      },
      {
        name: 'Initial Bundle Download (Gzipped)',
        target: '< 250 KB',
        measured: '184 KB',
        tolerance: '300 KB',
        status: 'pass',
        unit: 'KB',
        description: 'Critical path JS/CSS payload to minimize prepaid data consumption for retailers.'
      },
      {
        name: 'M-Pesa Webhook Ingestion Throughput',
        target: '> 1,200 RPS',
        measured: '1,850 RPS',
        tolerance: '1,000 RPS',
        status: 'pass',
        unit: 'RPS',
        description: 'Safaricom Daraja B2C/C2B confirmation burst absorption into Kafka broker without backpressure.'
      }
    ],
    architecturalControls: [
      {
        component: 'Nairobi Cloudflare Edge PoP (MBA/NBO)',
        mechanism: 'HTTP/3 + Brotli + Edge SSL Termination',
        description: 'Terminates TLS locally in Nairobi (IXP connected) to eliminate transatlantic TCP handshake round-trips.',
        configSnippet: 'ssl: tls1.3; btls: on; brotli: on; cache-control: public, max-age=300, stale-while-revalidate=60;'
      },
      {
        component: 'Multi-Tier Cache (Redis 7 + Local In-Memory LRU)',
        mechanism: 'Read-Through Redis Cluster with 100ms TTL on Price Locks',
        description: 'Caches active wholesaler inventory matrix and product catalog; 94.2% cache hit ratio.',
        configSnippet: 'redis.setex(`stock:${depotId}:${sku}`, 30, serializedStockPayload);'
      },
      {
        component: 'Client-Side Offline Engine',
        mechanism: 'IndexedDB + ServiceWorker CacheStorage',
        description: 'Stores full local FMCG barcode catalog (3,200 SKUs) in client IndexedDB; renders instant offline search in 4ms.',
        configSnippet: 'await idb.catalog.where("searchTokens").startsWithIgnoreCase(query).toArray();'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Safaricom 4G tower congestion during evening rush hour (17:00 - 19:30)',
        blastRadius: 'Retailer app connection drops or packet loss up to 18%',
        mitigationStrategy: 'Automatic client degradation to lightweight JSON differential sync with binary protobuf compression.',
        recoveryTime: '< 500 ms (transparent)'
      },
      {
        failureMode: 'Database query thread pool exhaustion during morning flash restock promo',
        blastRadius: 'Catalog browsing latency spikes to > 2.0s',
        mitigationStrategy: 'Automated circuit breaker sheds dynamic ranking calculations and serves pre-computed hot-SKU snapshot from edge cache.',
        recoveryTime: '< 3 seconds'
      }
    ],
    verificationMethods: [
      {
        type: 'Load Test',
        description: 'k6 distributed load test simulating 12,000 concurrent duka owners and 2,500 riders updating GPS.',
        tooling: 'k6 Cloud + Grafana k6 Operator on Kubernetes',
        frequency: 'Every release candidate in staging'
      },
      {
        type: 'Synthetic Probe',
        description: 'Continuous synthetic Lighthouse and API probe running from Safaricom mobile IP node in Nairobi.',
        tooling: 'Datadog Synthetic Tests (Nairobi vantage point)',
        frequency: 'Every 60 seconds 24/7'
      }
    ],
    complianceStandards: ['Google Web Vitals Gold Tier', 'ISO/IEC 25010 Efficiency Benchmark'],
    operationalChecklist: [
      'Gzip and Brotli compression verified on all API responses > 1KB',
      'Database connection pool (PgBouncer) scaled to 250 active pool size with 1,000 max clients',
      'Image CDN automatically generates WebP/AVIF thumbnails capped at 40KB for catalog cards'
    ]
  },

  // 2. AVAILABILITY / SLA
  {
    id: 'availability_sla',
    index: 2,
    title: 'Availability & SLA',
    subtitle: 'High Uptime, Fault-Tolerant Microservices & Payment Ingestion SLA',
    category: 'operational_resilience',
    tag: 'NFR-02',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'VERIFIED',
    summary: 'Enforces a 99.95% platform availability SLA (maximum 21.6 minutes unscheduled downtime per month) and 99.99% for M-Pesa payment ingestion endpoints.',
    businessImpact: 'Unscheduled downtime during peak duka re-stock hours (06:00 - 10:00) costs KES 340,000 per hour in unfulfilled FMCG GMV.',
    kenyanContext: 'Retail dukas open at 06:00 AM and rely on instant delivery of fresh bread, milk, and flour. Downtime forces shopkeepers to walk to physical wholesalers.',
    targetMetrics: [
      {
        name: 'Overall Platform Availability',
        target: '>= 99.95 %',
        measured: '99.978 %',
        tolerance: '99.90 %',
        status: 'pass',
        unit: '%',
        description: 'Includes Retailer portal, Wholesaler console, and Rider mobile dispatch.'
      },
      {
        name: 'M-Pesa Webhook Ingestion SLA',
        target: '>= 99.99 %',
        measured: '99.995 %',
        tolerance: '99.95 %',
        status: 'pass',
        unit: '%',
        description: 'Dedicated payment callback receiver running on independent serverless cluster.'
      },
      {
        name: 'Maximum Unscheduled Downtime / Month',
        target: '< 21.6 min',
        measured: '9.4 min',
        tolerance: '43.2 min',
        status: 'pass',
        unit: 'min',
        description: 'Calculated over 30 rolling days (43,200 total operating minutes).'
      },
      {
        name: 'Scheduled Maintenance Window',
        target: '02:00 - 04:00 EAT',
        measured: '02:15 - 03:00 EAT',
        tolerance: 'Max 2h',
        status: 'pass',
        unit: 'time',
        description: 'Low-traffic window on Tuesdays with zero-downtime rolling canary deployments.'
      }
    ],
    architecturalControls: [
      {
        component: 'Multi-AZ Kubernetes Cluster (EKS)',
        mechanism: '3-Availability Zone Spread with TopologySpreadConstraints',
        description: 'All core microservices maintain minimum 3 replicas distributed across 3 physically isolated data centers.',
        configSnippet: 'topologySpreadConstraints:\n  - maxSkew: 1\n    topologyKey: topology.kubernetes.io/zone\n    whenUnsatisfiable: DoNotSchedule'
      },
      {
        component: 'Decoupled Serverless Webhook Buffer',
        mechanism: 'AWS Lambda + SQS FIFO Queue for Daraja Callbacks',
        description: 'Isolates Safaricom payment confirmations from core backend disruptions; stores callbacks durably with 14-day retention.',
        configSnippet: 'SQS::Queue -> ReceiveMessageWaitTimeSeconds: 20 -> DeadLetterTargetArn'
      },
      {
        component: 'Graceful Degradation Mode (Offline-First)',
        mechanism: 'Client Optimistic Queue with Sync Engine',
        description: 'If core order dispatch is unreachable, retailer cart is saved locally and auto-submitted upon reconnect.',
        configSnippet: 'queueOfflineOrder({ payload, timestamp, clientNonce });'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Primary AWS AZ hardware network failure in Cape Town (af-south-1a)',
        blastRadius: '1/3 of microservice pods severed',
        mitigationStrategy: 'Kubernetes node auto-drain + Route 53 health-checked target groups re-route traffic to AZ-1b and AZ-1c in < 15 seconds.',
        recoveryTime: '< 15 seconds'
      },
      {
        failureMode: 'Safaricom Daraja API planned gateway upgrade',
        blastRadius: 'Instant STK push requests fail with HTTP 503',
        mitigationStrategy: 'Platform switches to Paybill manual prompt mode: displays shortcode 892400 and duka account number with automated background polling.',
        recoveryTime: '< 2 seconds (auto-fallback)'
      }
    ],
    verificationMethods: [
      {
        type: 'Synthetic Probe',
        description: 'Pingdom and Datadog multi-location synthetic checks hitting /api/health and /api/v1/catalog every 30 seconds.',
        tooling: 'Datadog Synthetic Uptime + Statuspage integration',
        frequency: 'Every 30 seconds'
      },
      {
        type: 'Chaos Drill',
        description: 'Chaos Mesh pod-kill tests terminating random pods and nodes during simulated traffic.',
        tooling: 'Chaos Mesh on staging cluster',
        frequency: 'Bi-weekly automated schedule'
      }
    ],
    complianceStandards: ['SLA Contract Schedule A (Wholesale Partners)', 'ISO/IEC 20000 Service Management'],
    operationalChecklist: [
      'Multi-AZ PostgreSQL Aurora cluster with sub-second replica promotion',
      'Automated PagerDuty escalation policies for any 5xx error rate > 0.5% over 2 minutes',
      'Public status page hosted on independent infrastructure (status.wayno.ke)'
    ]
  },

  // 3. SCALABILITY
  {
    id: 'scalability',
    index: 3,
    title: 'Scalability',
    subtitle: 'Elastic Autoscaling, Concurrent Duka Sessions & High Throughput',
    category: 'system_qualities',
    tag: 'NFR-03',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    status: 'VERIFIED',
    summary: 'Horizontally scales from 10 to 120 pods to support 10,000 concurrent duka sessions and 50,000 fulfilled FMCG deliveries per day without degraded throughput.',
    businessImpact: 'Prevents platform crashes during month-end duka restocking cycles when transaction volume surges 350% above baseline.',
    kenyanContext: 'Retail restocking heavily spikes on Friday afternoons and the 1st/15th of each month after civil servant and teacher payroll disbursements.',
    targetMetrics: [
      {
        name: 'Peak Concurrent Duka Sessions',
        target: '>= 10,000',
        measured: '14,200',
        tolerance: '8,000',
        status: 'pass',
        unit: 'sessions',
        description: 'Simultaneous active WebSocket/HTTP connections browsing catalogs and calculating prices.'
      },
      {
        name: 'Daily Fulfilled Order Capacity',
        target: '>= 50,000',
        measured: '62,400',
        tolerance: '40,000',
        status: 'pass',
        unit: 'orders/day',
        description: 'End-to-end multi-party orders dispatched, verified by OTP, and settled via M-Pesa.'
      },
      {
        name: 'Autoscaling Pod Spin-Up Time',
        target: '< 45 s',
        measured: '28 s',
        tolerance: '60 s',
        status: 'pass',
        unit: 's',
        description: 'Horizontal Pod Autoscaler (HPA) triggers and cold container receives traffic.'
      },
      {
        name: 'Database Read Replica Scalability',
        target: 'Up to 5 Replicas',
        measured: '3 active + 2 standby',
        tolerance: 'Min 2',
        status: 'pass',
        unit: 'instances',
        description: 'Read-only connection pool serving search, dashboard analytics, and catalog views.'
      }
    ],
    architecturalControls: [
      {
        component: 'Kubernetes HPA with Custom Prometheus Metrics',
        mechanism: 'Scales on both CPU (> 65%) and HTTP Request Rate (> 250 RPS/pod)',
        description: 'Reacts proactively to traffic spikes before CPU saturation occurs.',
        configSnippet: 'metrics:\n  - type: Pods\n    pods:\n      metric:\n        name: http_requests_per_second\n      target:\n        type: AverageValue\n        averageValue: 250'
      },
      {
        component: 'Database Connection Multiplexing (PgBouncer)',
        mechanism: 'Transaction-Level Pooling',
        description: 'Supports up to 10,000 concurrent client connections over 50 real PostgreSQL database connections.',
        configSnippet: 'pool_mode = transaction\nmax_client_conn = 10000\ndefault_pool_size = 50'
      },
      {
        component: 'Asynchronous Event Pipeline',
        mechanism: 'Apache Kafka Event Streams (3 Broker Cluster)',
        description: 'Decouples order creation, invoice generation, SMS notifications, and rider assignment.',
        configSnippet: 'topic: orders.created -> partitions: 12 -> replication: 3'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Sudden 10x traffic spike during End-of-Month wholesale sugar discount announcement',
        blastRadius: 'Catalog pods experience queue delay',
        mitigationStrategy: 'Edge Rate Limiter caps abusive bots; fast-path static pricing snapshot activated for top 100 FMCG SKUs.',
        recoveryTime: '< 10 seconds'
      }
    ],
    verificationMethods: [
      {
        type: 'Load Test',
        description: 'Stress testing with Locust stepping from 1,000 to 15,000 simulated users over 30 minutes.',
        tooling: 'Locust distributed load generator',
        frequency: 'Monthly baseline benchmark'
      }
    ],
    complianceStandards: ['12-Factor App Scalability Factor', 'Cloud Native Computing Foundation (CNCF) Guidelines'],
    operationalChecklist: [
      'HPA minReplicas=6, maxReplicas=60 configured across all customer-facing microservices',
      'Database storage auto-grow enabled with 1TB max allocation and proactive alerts at 75% capacity'
    ]
  },

  // 4. SECURITY
  {
    id: 'security',
    index: 4,
    title: 'Security & Integrity',
    subtitle: 'Zero-Trust Architecture, Cryptographic OTPs & M-Pesa Security',
    category: 'security_trust',
    tag: 'NFR-04',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'VERIFIED',
    summary: 'Enforces Zero-Trust isolation, TLS 1.3, AES-256 at rest, envelope KMS encryption, cryptographic 6-digit OTP delivery handshakes, and OWASP Top 10 defenses.',
    businessImpact: 'Prevents fraudulent order rerouting, rider identity spoofing, and intercepted M-Pesa payment confirmations.',
    kenyanContext: 'Informal retail logistics faces physical collusion risks where fake riders intercept high-value cooking oil crates or bogus M-Pesa SMS messages are presented.',
    targetMetrics: [
      {
        name: 'Transport Encryption',
        target: 'TLS 1.3 Only',
        measured: 'TLS 1.3 (ChaCha20-Poly1305)',
        tolerance: 'TLS 1.2 min',
        status: 'pass',
        unit: 'protocol',
        description: 'Enforces modern forward secrecy ciphers; deprecated SSL/TLS 1.0/1.1 rejected.'
      },
      {
        name: 'Data at Rest Encryption',
        target: 'AES-256 GCM',
        measured: 'AES-256 via AWS KMS',
        tolerance: 'AES-256',
        status: 'pass',
        unit: 'cipher',
        description: 'All RDS databases, S3 receipt archives, and Redis caches encrypted with customer-managed keys (CMK).'
      },
      {
        name: 'Authentication Token Lifespan',
        target: '<= 15 min',
        measured: '15 min (JWT with RS256)',
        tolerance: '30 min',
        status: 'pass',
        unit: 'min',
        description: 'Short-lived access tokens paired with rotating secure HTTP-only refresh tokens.'
      },
      {
        name: 'Delivery Handshake Cryptographic OTP',
        target: 'SHA-256 HMAC 6-Digit',
        measured: '6-digit time-bound OTP',
        tolerance: '6 digits',
        status: 'pass',
        unit: 'code',
        description: 'Single-use cryptographic handover OTP verifiable offline by rider app.'
      },
      {
        name: 'OWASP Top 10 Vulnerabilities',
        target: '0 Critical / 0 High',
        measured: '0 Critical / 0 High',
        tolerance: '0 Critical',
        status: 'pass',
        unit: 'findings',
        description: 'Automated SAST/DAST static analysis and third-party penetration testing.'
      }
    ],
    architecturalControls: [
      {
        component: 'API Gateway Zero-Trust Authentication',
        mechanism: 'JWT RS256 Validation + OIDC Provider (Keycloak/Cognito)',
        description: 'Validates cryptographic signatures at the edge proxy before routing requests to internal VPC microservices.',
        configSnippet: 'authorization: Bearer <jwt> -> verify(token, publicKey, { algorithms: ["RS256"] })'
      },
      {
        component: 'Safaricom Daraja IP Whitelisting & HMAC Validation',
        mechanism: 'Safaricom Gateway IP Inspection + Signature Check',
        description: 'Payment callbacks accepted only from verified Safaricom IP subnets with valid cryptographic signatures.',
        configSnippet: 'const validIPs = ["196.201.214.0/24", "196.201.213.0/24"];\nassert(validIPs.includes(req.ip));'
      },
      {
        component: 'Service-to-Service mTLS (Istio Service Mesh)',
        mechanism: 'Mutual TLS with Spiffe/Spire X.509 Certificates',
        description: 'Every internal microservice communication is encrypted and authenticated with automated 24-hour cert rotation.',
        configSnippet: 'peerAuthentication:\n  mtls:\n    mode: STRICT'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Stolen rider phone or cloned SIM card',
        blastRadius: 'Potential impersonation to steal cargo',
        mitigationStrategy: 'Device fingerprinting binds rider account to physical IMEI/Android ID; biometric or PIN verification required for delivery OTP generation.',
        recoveryTime: '< 1 minute (account lock)'
      },
      {
        failureMode: 'Distributed Denial of Service (DDoS) attack on retailer checkout API',
        blastRadius: 'Potential slow-down of customer requests',
        mitigationStrategy: 'Cloudflare Magic Transit & WAF automatically triggers Under-Attack Mode, challenges malicious ASN traffic, and protects origin IPs.',
        recoveryTime: '< 10 seconds'
      }
    ],
    verificationMethods: [
      {
        type: 'Automated Test',
        description: 'Semgrep and Snyk vulnerability scanning in GitHub Actions CI pipeline on every pull request.',
        tooling: 'Semgrep + Snyk SAST/DAST',
        frequency: 'Every commit / PR'
      },
      {
        type: 'Audit',
        description: 'Independent third-party penetration testing by CREST-accredited security consultancy.',
        tooling: 'Manual penetration testing + Burp Suite Pro',
        frequency: 'Annually + after major architecture shifts'
      }
    ],
    complianceStandards: ['OWASP ASVS Level 2', 'ISO/IEC 27001 Annex A.9 & A.10', 'PCI-DSS v4.0 Scope Reduction'],
    operationalChecklist: [
      'Content Security Policy (CSP) headers strictly configured with zero inline script execution',
      'Secrets stored exclusively in HashiCorp Vault / AWS Secrets Manager with automated 90-day rotation',
      'Rate limiting enforced at 60 requests/minute per IP for sensitive endpoints (login, OTP, checkout)'
    ]
  },

  // 5. PRIVACY
  {
    id: 'privacy',
    index: 5,
    title: 'Privacy & Data Protection',
    subtitle: 'Kenya Data Protection Act 2019, ODPC Compliance & Phone Masking',
    category: 'security_trust',
    tag: 'NFR-05',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'COMPLIANT',
    summary: 'Ensures strict alignment with the Kenya Data Protection Act 2019 (ODPC) and GDPR standards, featuring phone number masking, PII tokenization, and consent controls.',
    businessImpact: 'Non-compliance with Kenya ODPC risks regulatory fines up to KES 5,000,000 or 1% of annual turnover, plus loss of merchant trust.',
    kenyanContext: 'Informal shopkeepers value anonymity and privacy; exposing personal phone numbers to riders leads to unsolicited sales calls and harassment.',
    targetMetrics: [
      {
        name: 'Rider-to-Retailer Phone Masking',
        target: '100 % Masked',
        measured: '100 % (Virtual Twilio/AT Proxy)',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Calls routed through virtual proxy numbers (+254 709 xxx xxx); raw MSISDN never shared.'
      },
      {
        name: 'Personal Identifiable Information (PII) Tokenization',
        target: '100 % Tokenized',
        measured: '100 % Encrypted at column level',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'National ID, duka owner real name, and M-Pesa account number tokenized in database.'
      },
      {
        name: 'Right to Be Forgotten (Data Deletion SLA)',
        target: '< 72 hours',
        measured: '4 hours (automated pipeline)',
        tolerance: '7 days',
        status: 'pass',
        unit: 'hours',
        description: 'Cryptographic erasure of non-financial merchant personal data upon verified request.'
      },
      {
        name: 'Cross-Border Data Transfer Restrictions',
        target: 'ODPC Compliant (Local + Sec 48)',
        measured: 'Local DB replica + Cape Town primary',
        tolerance: 'Mandatory',
        status: 'pass',
        unit: 'status',
        description: 'Data transfers meet Section 48 of the Kenya Data Protection Act.'
      }
    ],
    architecturalControls: [
      {
        component: 'Telephony Masking Gateway',
        mechanism: 'Africa’s Talking / Twilio Voice Proxy Integration',
        description: 'Generates temporary 1-hour paired proxy session connecting rider and duka owner without revealing real numbers.',
        configSnippet: 'session = await voiceProxy.createSession({ riderId, shopId, expiryMinutes: 60 });'
      },
      {
        component: 'PostgreSQL Column-Level Crypto Engine (pgcrypto)',
        mechanism: 'AES-256 Symmetric Field Encryption',
        description: 'Sensitive columns (owner_phone, national_id) encrypted with KMS key separated from application DB user.',
        configSnippet: 'pgp_sym_encrypt(raw_phone, current_setting("app.kms_secret"))'
      },
      {
        component: 'Auditable Data Access Ledger',
        mechanism: 'Immutable Access Logs on Elasticsearch',
        description: 'Every internal staff view of a shopkeeper profile generates an audit log record with user ID, timestamp, and justification.',
        configSnippet: 'auditLogger.info({ event: "PII_ACCESSED", operatorId, merchantId, reason });'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Telephony proxy API downtime prevents rider from contacting shopkeeper',
        blastRadius: 'Delivery coordination hindered',
        mitigationStrategy: 'In-app end-to-end encrypted messaging with pre-set template buttons ("I have arrived", "Need directions").',
        recoveryTime: 'Instant (in-app fallback)'
      }
    ],
    verificationMethods: [
      {
        type: 'Audit',
        description: 'Annual Data Protection Impact Assessment (DPIA) filed with the Office of the Data Protection Commissioner (ODPC) Kenya.',
        tooling: 'Internal Legal Compliance + External Privacy Counsel',
        frequency: 'Annually'
      }
    ],
    complianceStandards: ['Kenya Data Protection Act 2019 (Sections 25-48)', 'GDPR Articles 17 & 25', 'ODPC Registration Cert: ODPC/REG/2024/09841'],
    operationalChecklist: [
      'Explicit opt-in consent captured during duka onboarding for marketing and order SMS',
      'Data Protection Officer (DPO) appointed and contact details published in app settings',
      'Automated crypto-shredding script deletes expired user session credentials after 90 days of dormancy'
    ]
  },

  // 6. RELIABILITY
  {
    id: 'reliability',
    index: 6,
    title: 'Reliability & Fault Tolerance',
    subtitle: 'Circuit Breakers, Idempotent Mutations & Resilient Queues',
    category: 'system_qualities',
    tag: 'NFR-06',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    status: 'VERIFIED',
    summary: 'Guarantees zero duplicate M-Pesa deductions, automated retry with exponential backoff and jitter, dead-letter queues, and circuit breakers for external services.',
    businessImpact: 'Double billing or lost order state destroys trust in digital B2B commerce among cash-constrained shopkeepers.',
    kenyanContext: 'Safaricom Daraja API intermittently experiences network timeouts and duplicate callback deliveries during high-traffic holidays.',
    targetMetrics: [
      {
        name: 'Payment Idempotency Integrity',
        target: '100.000 %',
        measured: '100.000 % (0 duplicate charges in 1.2M tx)',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Enforced via client UUID idempotency keys and database unique constraints.'
      },
      {
        name: 'Safaricom Daraja Circuit Breaker Trip Time',
        target: '< 2.5 s',
        measured: '1.8 s',
        tolerance: '3.0 s',
        status: 'pass',
        unit: 's',
        description: 'Fails open to alternate payment mode if Daraja error rate exceeds 15% over 20 requests.'
      },
      {
        name: 'Message Delivery Guarantee',
        target: 'At-Least-Once with Deduplication',
        measured: 'At-Least-Once + Idempotent Consumer',
        tolerance: 'Mandatory',
        status: 'pass',
        unit: 'semantic',
        description: 'Kafka + RabbitMQ DLQ architecture guarantees zero dropped order notifications.'
      },
      {
        name: 'Mean Time Between Failures (MTBF)',
        target: '> 720 hours',
        measured: '840 hours',
        tolerance: '500 hours',
        status: 'pass',
        unit: 'hours',
        description: 'Continuous uninterrupted operation of core dispatch and inventory reservation services.'
      }
    ],
    architecturalControls: [
      {
        component: 'Resilience4j / Cockatiel Circuit Breaker',
        mechanism: 'Sliding Window Circuit Breaker on Third-Party APIs',
        description: 'Wraps all external calls (M-Pesa, SMS gateways, Google Maps Geocoding); falls back gracefully on failure.',
        configSnippet: 'circuitBreaker.execute(() => callDarajaApi(payload), fallback: () => queuePaymentRetry());'
      },
      {
        component: 'Database Idempotency Ledger',
        mechanism: 'Unique Compound Index on (merchant_id, idempotency_key)',
        description: 'Rejects duplicate checkout submissions within 24-hour window, returning cached original order payload.',
        configSnippet: 'CREATE UNIQUE INDEX idx_orders_idempotency ON orders(merchant_id, idempotency_key);'
      },
      {
        component: 'Exponential Backoff with Full Jitter',
        mechanism: 'Decorrelated Jittered Retries',
        description: 'Avoids thundering herd problem when querying wholesaler inventory after network recovery.',
        configSnippet: 'sleepMs = Math.min(cap, Math.random() * (base * Math.pow(2, attempt)));'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Safaricom M-Pesa sends duplicate C2B callback 30 seconds apart',
        blastRadius: 'Potential duplicate fulfillment or double ledger entry',
        mitigationStrategy: 'Unique constraint on mpesa_receipt_number in database rolls back duplicate transaction automatically.',
        recoveryTime: '< 5 ms'
      },
      {
        failureMode: 'Primary Redis cache cluster crashes unexpectedly',
        blastRadius: 'Elevated latency on catalog reads',
        mitigationStrategy: 'Sentinel automatically promotes read replica to master in < 3s; microservices bypass cache and query DB read replicas directly.',
        recoveryTime: '< 3 seconds'
      }
    ],
    verificationMethods: [
      {
        type: 'Chaos Drill',
        description: 'Simulated 50% packet drop and 2,000ms artificial latency injected into external gateway connections.',
        tooling: 'Toxiproxy + Chaos Mesh',
        frequency: 'Sprint release validation'
      }
    ],
    complianceStandards: ['IEEE Standard for Software Reliability', 'Enterprise Integration Patterns (EIP) Idempotent Receiver'],
    operationalChecklist: [
      'Dead Letter Queues configured for all asynchronous Kafka topics with 7-day retention',
      'Automated replay tooling available for operations team to reprocess failed DLQ messages',
      'Zero unhandled promise rejections allowed in production Node.js services'
    ]
  },

  // 7. DISASTER RECOVERY
  {
    id: 'disaster_recovery',
    index: 7,
    title: 'Disaster Recovery (DR)',
    subtitle: 'Cross-Region Replication, RPO < 60s & RTO < 15min',
    category: 'operational_resilience',
    tag: 'NFR-07',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'VERIFIED',
    summary: 'Ensures business continuity with Recovery Point Objective (RPO) < 60 seconds and Recovery Time Objective (RTO) < 15 minutes via automated cross-region database replication.',
    businessImpact: 'A catastrophic cloud region failure without DR would halt retail operations for 15,000 dukas and leave millions of shillings in pending orders untraceable.',
    kenyanContext: 'Undersea fiber cable cuts (e.g. SEACOM / EASSy in the Red Sea) periodically impact African cloud routing, necessitating multi-region geographic redundancy.',
    targetMetrics: [
      {
        name: 'Recovery Point Objective (RPO)',
        target: '< 60 seconds',
        measured: '18 seconds',
        tolerance: '120 seconds',
        status: 'pass',
        unit: 'seconds',
        description: 'Maximum tolerable data loss interval during catastrophic primary region failure.'
      },
      {
        name: 'Recovery Time Objective (RTO)',
        target: '< 15 minutes',
        measured: '8 minutes 42 seconds',
        tolerance: '30 minutes',
        status: 'pass',
        unit: 'minutes',
        description: 'Elapsed duration from disaster declaration to full platform operational recovery in secondary region.'
      },
      {
        name: 'Cross-Region Replication Lag',
        target: '< 5 seconds',
        measured: '1.2 seconds',
        tolerance: '10 seconds',
        status: 'pass',
        unit: 'seconds',
        description: 'Continuous asynchronous WAL streaming from Cape Town (af-south-1) to Frankfurt (eu-central-1).'
      },
      {
        name: 'Automated Daily Snapshot Integrity',
        target: '100 % Verified',
        measured: '100 % (Automated restore test)',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Encrypted S3 snapshots restored and verified in sandbox environment every 24 hours.'
      }
    ],
    architecturalControls: [
      {
        component: 'Multi-Region Active-Passive Database (Aurora Global Database)',
        mechanism: 'Storage-Level Physical Storage Replication',
        description: 'Replicates transactions across regions with latency under 1 second without impacting primary database write performance.',
        configSnippet: 'auroraGlobalCluster: primary: af-south-1, secondary: eu-central-1, auto-failover: enabled'
      },
      {
        component: 'Route 53 DNS Latency & Health-Check Failover',
        mechanism: 'Automated Route 53 Health Checks',
        description: 'Monitors primary API health; triggers automated DNS swing to secondary region if 3 consecutive checks fail over 90 seconds.',
        configSnippet: 'FailoverRoutingPolicy: Primary: af-south-1.wayno.ke, Secondary: eu-central-1.wayno.ke'
      },
      {
        component: 'Infrastructure as Code (Terraform) Standby Template',
        mechanism: 'Version-Controlled GitOps IaC',
        description: 'Pre-warmed secondary Kubernetes cluster ready to scale worker nodes from baseline 3 to 40 nodes on demand.',
        configSnippet: 'terraform apply -var="target_region=eu-central-1" -var="cluster_mode=dr_active"'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Complete AWS Cape Town datacenter network severance (subsea fiber cut)',
        blastRadius: 'Primary region completely unreachable',
        mitigationStrategy: 'Automated Route 53 DNS failover diverts traffic to Frankfurt secondary cluster; Aurora promotes read replica to standalone primary.',
        recoveryTime: '8.7 minutes (tested)'
      }
    ],
    verificationMethods: [
      {
        type: 'Chaos Drill',
        description: 'Unannounced quarterly Disaster Recovery game-day: primary database severed in staging, testing automated failover and data integrity.',
        tooling: 'AWS Fault Injection Simulator (FIS) + Custom Runbook',
        frequency: 'Quarterly'
      }
    ],
    complianceStandards: ['ISO 22301 Business Continuity Standard', 'NIST SP 800-34 Contingency Planning'],
    operationalChecklist: [
      'Secondary region KMS keys pre-configured and shared with automated cross-region replication',
      'Runbook DR-001 updated and rehearsed by all primary on-call Site Reliability Engineers (SREs)',
      'Cross-region S3 bucket replication enabled with Object Lock (WORM) for all historical financial invoices'
    ]
  },

  // 8. DATA RETENTION
  {
    id: 'data_retention',
    index: 8,
    title: 'Data Retention & Archival',
    subtitle: 'KRA 7-Year Tax Compliance, Immutable Financial Logs & GPS Purging',
    category: 'operational_resilience',
    tag: 'NFR-08',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'COMPLIANT',
    summary: 'Maintains 7-year immutable fiscal transaction logs for Kenya Revenue Authority (KRA) audit compliance while automatically purging ephemeral rider GPS coordinates after 30 days.',
    businessImpact: 'Ensures full legal compliance with KRA eTIMS tax audit requirements while controlling cloud storage costs and minimizing privacy liability.',
    kenyanContext: 'KRA Section 23 of the Tax Procedures Act mandates 7-year record retention. Conversely, storing permanent rider tracking violates privacy norms.',
    targetMetrics: [
      {
        name: 'Financial Audit Records Retention',
        target: '>= 7 Years (Mandatory)',
        measured: '7 Years (S3 Glacier WORM)',
        tolerance: '7 Years min',
        status: 'pass',
        unit: 'years',
        description: 'All invoices, tax receipts, M-Pesa settlement statements, and wholesaler payout records.'
      },
      {
        name: 'Ephemeral GPS Telemetry Retention',
        target: '<= 30 Days',
        measured: '30 Days then aggregated',
        tolerance: '45 Days max',
        status: 'pass',
        unit: 'days',
        description: 'Raw high-frequency rider breadcrumbs (lat/lng/timestamp) purged and transformed into route speed heatmaps.'
      },
      {
        name: 'Customer Support Chat Transcripts',
        target: '90 Days',
        measured: '90 Days',
        tolerance: '120 Days',
        status: 'pass',
        unit: 'days',
        description: 'In-app chat between dispatch and retailer archived and encrypted, then permanently deleted.'
      },
      {
        name: 'Immutable WORM Compliance',
        target: '100 % Write-Once-Read-Many',
        measured: 'AWS S3 Object Lock Compliance Mode',
        tolerance: 'Mandatory',
        status: 'pass',
        unit: 'status',
        description: 'Financial records cannot be modified or deleted by any user or administrator for 7 years.'
      }
    ],
    architecturalControls: [
      {
        component: 'AWS S3 Lifecycle Rule & Object Lock',
        mechanism: 'Compliance Mode Object Lock with Retention Period = 2,555 Days (7 Years)',
        description: 'Protects fiscal invoices against tampering, deletion, or premature cleanup even in the event of root credential compromise.',
        configSnippet: 'ObjectLockConfiguration:\n  ObjectLockEnabled: Enabled\n  Rule:\n    DefaultRetention:\n      Mode: COMPLIANCE\n      Days: 2555'
      },
      {
        component: 'Automated GPS Telemetry Lifecycle Cron',
        mechanism: 'PostgreSQL Partitioning with pg_partman',
        description: 'Daily partitions for rider_telemetry; drops partitions older than 30 days after generating aggregated route speed indexes.',
        configSnippet: 'SELECT drop_partition_time("rider_telemetry", interval "30 days");'
      },
      {
        component: 'Cold Tier Tiering (Glacier Deep Archive)',
        mechanism: 'Transition after 90 days from S3 Standard to Deep Archive',
        description: 'Reduces long-term cloud storage costs by 95% while keeping records retrievable within 12 hours for KRA tax audits.',
        configSnippet: 'Transition:\n  Days: 90\n  StorageClass: GLACIER_DEEP_ARCHIVE'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Accidental script tries to delete historical financial ledger rows',
        blastRadius: 'Potential data loss of tax invoices',
        mitigationStrategy: 'PostgreSQL database trigger strictly blocks DELETE or UPDATE on ledger_entries table; S3 Object Lock prevents cloud file deletion.',
        recoveryTime: 'Instant (operation rejected)'
      }
    ],
    verificationMethods: [
      {
        type: 'Audit',
        description: 'Quarterly automated retention audit script checking partition drop timestamps and S3 Object Lock retention tags.',
        tooling: 'AWS Config Rules + Custom Audit Lambda',
        frequency: 'Quarterly'
      }
    ],
    complianceStandards: ['Kenya Tax Procedures Act 2015 Section 23', 'Central Bank of Kenya National Payment System Guidelines'],
    operationalChecklist: [
      'Immutable cryptographic hash (SHA-256) stored alongside every eTIMS fiscal invoice',
      'Automated daily deletion verification report generated and signed by DPO and Chief Architect'
    ]
  },

  // 9. OBSERVABILITY
  {
    id: 'observability',
    index: 9,
    title: 'Observability & Telemetry',
    subtitle: 'OpenTelemetry, Distributed Tracing, RED Metrics & Synthetic Probes',
    category: 'operational_resilience',
    tag: 'NFR-09',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    status: 'VERIFIED',
    summary: 'End-to-end distributed tracing via OpenTelemetry, Prometheus RED metrics (Rate, Errors, Duration), structured JSON logging with correlation IDs, and synthetic probes.',
    businessImpact: 'Reduces Mean Time to Detect (MTTD) to < 2 minutes and Mean Time to Resolve (MTTR) to < 15 minutes across complex multi-party orders.',
    kenyanContext: 'Diagnosing whether an order delay is caused by Safaricom SMS delivery, rider GPS stall, depot packing queue, or network failure requires unified tracing.',
    targetMetrics: [
      {
        name: 'Distributed Trace Sampling Rate',
        target: '100 % Errors / 10 % Normal',
        measured: '100 % Errors / 15 % Normal',
        tolerance: '100 % Errors min',
        status: 'pass',
        unit: 'ratio',
        description: 'All failed transactions and slow requests (> 300ms) captured with complete execution spans.'
      },
      {
        name: 'Mean Time to Detect (MTTD)',
        target: '< 2.0 min',
        measured: '1.2 min',
        tolerance: '5.0 min',
        status: 'pass',
        unit: 'min',
        description: 'Time elapsed between system anomaly occurrence and automated PagerDuty alarm trigger.'
      },
      {
        name: 'Mean Time to Resolve (MTTR)',
        target: '< 15.0 min',
        measured: '9.4 min',
        tolerance: '30.0 min',
        status: 'pass',
        unit: 'min',
        description: 'Average resolution time for priority P1/P2 production operational incidents.'
      },
      {
        name: 'Log Ingestion Latency',
        target: '< 5 seconds',
        measured: '2.1 seconds',
        tolerance: '10 seconds',
        status: 'pass',
        unit: 'seconds',
        description: 'From log emission inside microservice container to availability in Grafana Loki search.'
      }
    ],
    architecturalControls: [
      {
        component: 'OpenTelemetry SDK + W3C TraceContext',
        mechanism: 'Distributed Trace Propagation via traceparent Header',
        description: 'Propagates unique trace_id across Mobile App -> Cloudflare -> API Gateway -> Order Service -> M-Pesa Gateway.',
        configSnippet: 'tracer.startActiveSpan("checkout.processOrder", { attributes: { "shop.id": shopId, "order.id": orderId } });'
      },
      {
        component: 'Prometheus RED Metrics Collector',
        mechanism: 'Rate, Errors, and Duration Scraped every 15s',
        description: 'Standardized Prometheus client metrics exposed on /metrics endpoint for all microservice pods.',
        configSnippet: 'http_request_duration_seconds_bucket{route="/api/checkout", status="200", le="0.2"}'
      },
      {
        component: 'Correlation ID Middleware',
        mechanism: 'x-correlation-id Header Generation & Structured JSON Logging',
        description: 'Injects unique correlation ID into every log entry for cross-system debugging.',
        configSnippet: 'logger.info("Order payment authorized", { correlationId: req.headers["x-correlation-id"], orderId });'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Observability pipeline experiences traffic burst (e.g. log storm during network glitch)',
        blastRadius: 'Potential logging buffer memory saturation',
        mitigationStrategy: 'FluentBit agent uses backpressure buffer disk spillover and drops non-critical debug logs automatically.',
        recoveryTime: '< 1 second'
      }
    ],
    verificationMethods: [
      {
        type: 'Synthetic Probe',
        description: 'Synthetic end-to-end checkout transactions executed every 5 minutes verifying trace capture.',
        tooling: 'Datadog Synthetics + OpenTelemetry Collector',
        frequency: 'Every 5 minutes'
      }
    ],
    complianceStandards: ['OpenTelemetry Specification v1.30', 'Google SRE Site Reliability Engineering Framework'],
    operationalChecklist: [
      'Four Golden Signals dashboards (Latency, Traffic, Errors, Saturation) displayed on main ops NOC screens',
      'Automated SLO alert rules monitoring 30-day rolling error budgets in Prometheus Alertmanager'
    ]
  },

  // 10. ACCESSIBILITY
  {
    id: 'accessibility',
    index: 10,
    title: 'Accessibility & Field Usability',
    subtitle: 'WCAG 2.1 AA, High Sunlight Contrast & Swahili/English Audio Cues',
    category: 'portability_experience',
    tag: 'NFR-10',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    status: 'VERIFIED',
    summary: 'Adheres to WCAG 2.1 Level AA standards with high-contrast outdoor visibility for equatorial sunlight, oversized touch targets (>= 48px) for gloved riders, and bilingual audio cues.',
    businessImpact: 'Directly empowers riders operating motorcycles in bright equatorial sunlight and shopkeepers in dimly lit kiosk storefronts.',
    kenyanContext: 'Boda boda couriers wear protective leather/fabric gloves and mount phones on handlebars under direct 12:00 PM equatorial sun. Dukas operate under low fluorescent or battery lighting.',
    targetMetrics: [
      {
        name: 'Visual Contrast Ratio (Normal Text)',
        target: '>= 4.5:1 (WCAG AA)',
        measured: '7.8:1 (Slate-900 on White)',
        tolerance: '4.5:1 min',
        status: 'pass',
        unit: 'ratio',
        description: 'Exceeds standard contrast to maintain readability under bright Nairobi sunlight.'
      },
      {
        name: 'Visual Contrast Ratio (Large Text / Buttons)',
        target: '>= 3.0:1 (WCAG AA)',
        measured: '9.2:1 (White on Slate-900)',
        tolerance: '3.0:1 min',
        status: 'pass',
        unit: 'ratio',
        description: 'Primary action buttons and price callouts readable through tinted motorcycle visors.'
      },
      {
        name: 'Minimum Interactive Touch Target Size',
        target: '>= 48 x 48 px',
        measured: '52 x 50 px',
        tolerance: '44 x 44 px min',
        status: 'pass',
        unit: 'px',
        description: 'Oversized hit areas for delivery acceptance and OTP entry when wearing gloves.'
      },
      {
        name: 'Screen Reader ARIA Compatibility',
        target: '100 % Pass (axe-core)',
        measured: '100 % (0 Critical/Serious)',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Full semantic HTML with aria-labels for TalkBack on Android.'
      },
      {
        name: 'Bilingual Audio Cues (Voice Alerts)',
        target: 'Swahili + English',
        measured: 'Kiswahili & English Audio',
        tolerance: 'Mandatory',
        status: 'pass',
        unit: 'languages',
        description: 'Spoken notifications ("Agizo jipya la KES 4,500 limepokelewa") for busy duka owners.'
      }
    ],
    architecturalControls: [
      {
        component: 'High-Contrast Outdoor Theme Palette',
        mechanism: 'Deep Monochromatic Slate/Emerald with Anti-Glare Calibration',
        description: 'Avoids washed-out pastels; utilizes deep slate-900 text on clean off-white backgrounds.',
        configSnippet: 'colors: { textPrimary: "#0f172a", bgSurface: "#ffffff", accentHighContrast: "#059669" }'
      },
      {
        component: 'Web Audio API / TTS Local Synthesizer',
        mechanism: 'Cached Audio Chimes & Native SpeechSynthesis (sw-KE / en-KE)',
        description: 'Delivers clear acoustic confirmation upon order acceptance and payment receipt without requiring screen glances.',
        configSnippet: 'speechSynthesis.speak(new SpeechSynthesisUtterance("Malipo ya KES " + amount + " yamethibitishwa"));'
      },
      {
        component: 'Dynamic Font Scaling & Viewport Zoom Support',
        mechanism: 'Rem-Based Typography with User Zoom Allowed',
        description: 'Supports Android system font magnification up to 200% without clipping or layout breakage.',
        configSnippet: 'meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5"'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Noisy roadside kiosk environment drowns out standard phone notification chime',
        blastRadius: 'Shopkeeper misses urgent 4-minute order acceptance deadline',
        mitigationStrategy: 'Dual-frequency audio chime paired with haptic vibration pattern (2 long pulses + 3 short pulses).',
        recoveryTime: 'Instant'
      }
    ],
    verificationMethods: [
      {
        type: 'Automated Test',
        description: 'Automated axe-core accessibility audit running in Cypress E2E test suite.',
        tooling: 'cypress-axe + Lighthouse Accessibility Score (100/100)',
        frequency: 'Every release build'
      }
    ],
    complianceStandards: ['W3C WCAG 2.1 Level AA', 'Section 508 Accessibility Standards'],
    operationalChecklist: [
      'All meaningful images and icons provide clear text alternatives and ARIA descriptions',
      'Keyboard/D-pad navigation fully functional for all primary flows without mouse dependence'
    ]
  },

  // 11. MAINTAINABILITY
  {
    id: 'maintainability',
    index: 11,
    title: 'Maintainability & Code Quality',
    subtitle: 'Clean Hexagonal Architecture, Strict TypeScript & Automated CI/CD',
    category: 'portability_experience',
    tag: 'NFR-11',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    status: 'VERIFIED',
    summary: 'Maintains 100% strict TypeScript types, Hexagonal/Clean Architecture boundaries, automated CI/CD pipeline builds (< 6 minutes), and zero-downtime database migrations.',
    businessImpact: 'Enables rapid 2-week sprint feature releases and bug fixes without regressions or developer velocity drag.',
    kenyanContext: 'Frequent shifts in FMCG tax laws (e.g. VAT exemptions on flour) and M-Pesa API updates require modular business logic that can be updated in hours.',
    targetMetrics: [
      {
        name: 'TypeScript Strict Type Safety',
        target: '100.00 % (noImplicitAny)',
        measured: '100.00 % (0 any types)',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Compiler options: strict: true, noUnusedLocals: true, exactOptionalPropertyTypes: true.'
      },
      {
        name: 'Automated Test Coverage',
        target: '>= 85.0 %',
        measured: '88.4 %',
        tolerance: '80.0 %',
        status: 'pass',
        unit: '%',
        description: 'Unit tests for domain business rules, pricing formulas, and integration test suites.'
      },
      {
        name: 'CI/CD Pipeline Execution Duration',
        target: '< 6.0 min',
        measured: '4.2 min',
        tolerance: '8.0 min',
        status: 'pass',
        unit: 'min',
        description: 'From git push to automated linting, test suite execution, Docker build, and staging deployment.'
      },
      {
        name: 'Database Migration Downtime',
        target: '0 Seconds (Zero-Downtime)',
        measured: '0 Seconds (Expand/Contract)',
        tolerance: '0 seconds',
        status: 'pass',
        unit: 'seconds',
        description: 'Enforces backward-compatible database schema migrations via expand/contract pattern.'
      }
    ],
    architecturalControls: [
      {
        component: 'Hexagonal / Ports-and-Adapters Architecture',
        mechanism: 'Decoupled Core Domain from Infrastructure Adapters',
        description: 'Pure domain business rules (pricing, allocation, substitutions) have zero dependencies on Express, React, or PostgreSQL.',
        configSnippet: 'domain/rules/supplierSelection.ts -> ports/inbound/orderService.ts -> adapters/outbound/darajaClient.ts'
      },
      {
        component: 'Expand-and-Contract Database Schema Evolution',
        mechanism: 'Flyway / Prisma Non-Destructive Migrations',
        description: 'New columns added with default values; old columns deprecated over two deployment cycles before deletion.',
        configSnippet: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_pin VARCHAR(6) DEFAULT "000000";'
      },
      {
        component: 'Hermetic Containerized Builds',
        mechanism: 'Multi-Stage Dockerfile with Distroless Base Images',
        description: 'Produces tiny, secure production container images (42MB) containing zero compilers or build tools.',
        configSnippet: 'FROM gcr.io/distroless/nodejs20-debian12:nonroot\nCOPY --from=builder /app/dist ./dist'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'A broken pull request introduces a breaking change to cart price calculation',
        blastRadius: 'Potential incorrect billing',
        mitigationStrategy: 'Automated CI test gate strictly blocks merging; mutation testing verifies test suite caught the flaw.',
        recoveryTime: 'Immediate (merge blocked)'
      }
    ],
    verificationMethods: [
      {
        type: 'Automated Test',
        description: 'GitHub Actions running ESLint, TypeScript tsc --noEmit, Jest unit tests, and SonarQube code quality scan.',
        tooling: 'GitHub Actions + SonarCloud (A rating)',
        frequency: 'Every pull request'
      }
    ],
    complianceStandards: ['Maintainability Index Rating A (> 85)', 'ISO/IEC 25010 Maintainability Standard'],
    operationalChecklist: [
      'Comprehensive OpenAPI 3.1 schema auto-generated from domain TypeScript interfaces',
      'Architecture Decision Records (ADRs) maintained in markdown for all significant architectural changes'
    ]
  },

  // 12. PORTABILITY
  {
    id: 'portability',
    index: 12,
    title: 'Portability & Cloud-Agnostic Design',
    subtitle: 'OCI Container Compliance, Helm Charts & Cloud-Neutral Infrastructure',
    category: 'portability_experience',
    tag: 'NFR-12',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    status: 'VERIFIED',
    summary: 'Guarantees 100% OCI container compliance, portable Kubernetes Helm charts, cloud-neutral Terraform infrastructure, and zero proprietary lock-in.',
    businessImpact: 'Protects the enterprise against cloud vendor price hikes and allows migration between AWS, Google Cloud, or local Kenyan data centers (e.g. iColo / Safaricom Cloud).',
    kenyanContext: 'Future regulatory mandates may require data sovereignty hosting exclusively within sovereign Kenyan physical data centers (such as Konza Technopolis or iColo Nairobi).',
    targetMetrics: [
      {
        name: 'OCI Container Standard Compliance',
        target: '100 % OCI Compliant',
        measured: '100 % (Docker / containerd)',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Runs identically on AWS EKS, GCP GKE, Azure AKS, or vanilla on-premise Kubernetes.'
      },
      {
        name: 'Cloud-Agnostic Infrastructure Definition',
        target: '100 % Terraform / OpenTofu',
        measured: '100 % Declarative HCL',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Zero proprietary cloud configuration; all network VPCs, DNS, and compute defined in Terraform.'
      },
      {
        name: 'Database Engine Portability',
        target: 'Standard PostgreSQL 16',
        measured: 'Pure ANSI SQL / Postgres 16',
        tolerance: 'Standard SQL',
        status: 'pass',
        unit: 'engine',
        description: 'Zero vendor-proprietary SQL extensions; runs on Amazon Aurora, Google Cloud SQL, or raw self-hosted Postgres.'
      },
      {
        name: 'Client App Cross-Platform Portability',
        target: 'PWA / WebAPK / Standard Web',
        measured: 'PWA + Capacitor Android/iOS',
        tolerance: 'Mandatory',
        status: 'pass',
        unit: 'formats',
        description: 'Single codebase packages into standalone WebAPK, iOS WebKit wrapper, or responsive browser.'
      }
    ],
    architecturalControls: [
      {
        component: 'Standard Kubernetes Helm Charts',
        mechanism: 'Parameterized Helm v3 Templates',
        description: 'Enables complete cluster deployment into any cloud provider with simple values.yaml environment overrides.',
        configSnippet: 'helm upgrade --install wayno-core ./charts/wayno-core -f values-prod-local-icolo.yaml'
      },
      {
        component: 'S3-Compatible Object Storage Abstraction',
        mechanism: 'Standard S3 API Client Interface',
        description: 'Works transparently with AWS S3, MinIO on-premise, Cloudflare R2, or Google Cloud Storage.',
        configSnippet: 'const storage = new S3Client({ endpoint: process.env.STORAGE_ENDPOINT });'
      },
      {
        component: 'Standard Redis / Key-Value Abstraction',
        mechanism: 'RESP3 Protocol Compliance',
        description: 'Compatible with standard open-source Redis, Valkey, or AWS ElastiCache.',
        configSnippet: 'const cache = new Redis(process.env.REDIS_URL);'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Cloud provider policy change or unexpected regional cost escalation',
        blastRadius: 'Infrastructure operational margin squeezed',
        mitigationStrategy: 'Terraform modules pre-tested for deployment into secondary provider within 72 hours.',
        recoveryTime: '< 72 hours'
      }
    ],
    verificationMethods: [
      {
        type: 'Automated Test',
        description: 'Automated deployment validation running against local KinD (Kubernetes in Docker) during test cycles.',
        tooling: 'KinD + Helm test suite',
        frequency: 'Bi-weekly release checks'
      }
    ],
    complianceStandards: ['Open Container Initiative (OCI) v1.0', 'Cloud Native Computing Foundation (CNCF) Certified'],
    operationalChecklist: [
      'No proprietary cloud SDK dependencies inside core domain business logic modules',
      'All environment configurations passed strictly via standard POSIX environment variables'
    ]
  },

  // 13. COMPATIBILITY
  {
    id: 'compatibility',
    index: 13,
    title: 'Compatibility & Device Matrix',
    subtitle: 'Low-End Android Go (1GB RAM), Tecno/Infinix & USSD Fallback',
    category: 'portability_experience',
    tag: 'NFR-13',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    status: 'VERIFIED',
    summary: 'Engineered specifically for low-end Android 8.0+ / Android Go devices with 1GB RAM (Tecno, Infinix, itel), modern mobile browsers, and emergency USSD/SMS fallback.',
    businessImpact: 'Prevents out-of-memory crashes on the exact devices owned by 72% of informal retail shopkeepers and boda boda riders in Kenya.',
    kenyanContext: 'Transsion devices (Tecno, Infinix, itel) dominate Kenyan retail; they feature aggressive background app killers and limited RAM (1GB-2GB).',
    targetMetrics: [
      {
        name: 'Minimum Supported Android OS',
        target: 'Android 8.0 (API 26) + Android Go',
        measured: 'Android 8.0+ Verified',
        tolerance: 'Android 8.0 min',
        status: 'pass',
        unit: 'OS',
        description: 'Covers 98.6% of active smartphones in urban Kenyan informal settlements.'
      },
      {
        name: 'Device RAM Consumption Ceiling',
        target: '< 65 MB Active RAM',
        measured: '48 MB Average Heap',
        tolerance: '80 MB',
        status: 'pass',
        unit: 'MB',
        description: 'Guarantees the app is not terminated by Android Go LowMemoryKiller (LMK) during background GPS tracking.'
      },
      {
        name: 'Mobile Browser Matrix Support',
        target: 'Chrome 90+, Safari 14+, Firefox 90+',
        measured: 'Chrome, Safari, Edge, Opera Mini',
        tolerance: 'Modern Browsers',
        status: 'pass',
        unit: 'browsers',
        description: 'Tested on both Chromium engine and WebKit across mobile viewports (320px to 480px).'
      },
      {
        name: 'USSD / SMS Feature Phone Fallback',
        target: '*384*WAYNO# Integration',
        measured: 'Live USSD Gateway (Africa’s Talking)',
        tolerance: 'Mandatory fallback',
        status: 'pass',
        unit: 'gateway',
        description: 'Allows basic re-stock order placement and status checks on basic feature phones (Kabambe).'
      },
      {
        name: 'Responsive Viewport Range',
        target: '320px to 2560px',
        measured: '320px (itel A16) to 4K',
        tolerance: '320px min',
        status: 'pass',
        unit: 'px',
        description: 'Fluid adaptive layouts with 0 horizontal overflow or clipped buttons.'
      }
    ],
    architecturalControls: [
      {
        component: 'Low-Memory V8 Engine Optimizations',
        mechanism: 'Virtual DOM Recycling & Memory Leak Guards',
        description: 'Explicit garbage collection friendly patterns; unmounts off-screen catalog cards using IntersectionObserver virtual lists.',
        configSnippet: 'virtualScroller: itemHeight: 88px, overscan: 3, memoryReclaimOnIdle: true'
      },
      {
        component: 'Service Worker Background Sync',
        mechanism: 'Workbox BackgroundSync Plugin',
        description: 'Queues failed checkout attempts and syncs automatically when network returns without user intervention.',
        configSnippet: 'workbox.routing.registerRoute(/\\/api\\/orders/, new workbox.strategies.NetworkOnly({ plugins: [bgSync] }))'
      },
      {
        component: 'Africa’s Talking USSD Micro-Gateway',
        mechanism: 'Stateless USSD Session State Engine',
        description: 'Renders ASCII menu for basic phones: "1. Agiza Unga, 2. Angalia Oda, 3. Malipo".',
        configSnippet: 'response = `CON Karibu WAYNO FMCG\\n1. Agiza Jogoo 2kg\\n2. Angalia Oda\\n3. Malipo M-Pesa`;'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'Rider phone battery saver forcefully kills background GPS thread',
        blastRadius: 'Loss of real-time location tracking',
        mitigationStrategy: 'Uses Android Foreground Service with sticky persistent notification icon and wake-lock heartbeat.',
        recoveryTime: 'Persistent'
      }
    ],
    verificationMethods: [
      {
        type: 'Automated Test',
        description: 'Automated cross-browser and real-device testing on BrowserStack real-device farm using itel A18 and Tecno Spark 7.',
        tooling: 'BrowserStack Real Device Cloud',
        frequency: 'Every release cycle'
      }
    ],
    complianceStandards: ['Google Android Go Performance Guidelines', 'W3C Progressive Web App Compliance'],
    operationalChecklist: [
      'Touch targets validated on physical low-cost resistive and capacitive touchscreens',
      'Zero large external fonts; uses system font stack (-apple-system, Roboto, Ubuntu, sans-serif) to save 120KB download'
    ]
  },

  // 14. COMPLIANCE
  {
    id: 'compliance',
    index: 14,
    title: 'Compliance & Regulatory Alignment',
    subtitle: 'CBK National Payment Systems, KRA eTIMS & KEBS Quality Standards',
    category: 'security_trust',
    tag: 'NFR-14',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    status: 'COMPLIANT',
    summary: 'Complies fully with Central Bank of Kenya (CBK) National Payment Systems regulations, Kenya Revenue Authority (KRA) eTIMS electronic invoicing, and Kenya Bureau of Standards (KEBS).',
    businessImpact: 'Guarantees uninterrupted operational licensing, legal merchant standing, and frictionless enterprise partnership with top FMCG conglomerates (Unilever, BIDCO, Kapa).',
    kenyanContext: 'Operating an electronic B2B payment escrow and logistics network in Kenya requires strict compliance with Central Bank NPS rules and KRA tax stamping.',
    targetMetrics: [
      {
        name: 'CBK National Payment Systems (NPS) License Alignment',
        target: '100 % Compliant',
        measured: 'Compliant (Partnership Model)',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Operates as licensed Payment Service Provider (PSP) partner with escrow account in Tier 1 Kenyan bank.'
      },
      {
        name: 'KRA eTIMS Fiscal Invoice Generation',
        target: '100 % of B2B Orders',
        measured: '100 % with KRA QR Code & Control Code',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Electronic tax invoice generated and signed within 3 seconds of M-Pesa payment confirmation.'
      },
      {
        name: 'Anti-Money Laundering (AML) / CFT Screening',
        target: '100 % Transaction Monitoring',
        measured: '100 % Automated PEP/Sanctions Check',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Automated AML threshold checks flagging daily merchant volumes exceeding KES 1,000,000.'
      },
      {
        name: 'KEBS Standardization Mark Verification',
        target: '100 % Catalog SKUs Verified',
        measured: '100 % Valid Diamond Mark of Quality',
        tolerance: '100 %',
        status: 'pass',
        unit: '%',
        description: 'Only products bearing valid KEBS standardization or import permits are permitted in wholesale catalogs.'
      },
      {
        name: 'ISO 27001 & SOC 2 Type II Audit Readiness',
        target: 'Audit Ready',
        measured: 'Controls Documented & Active',
        tolerance: 'Mandatory',
        status: 'pass',
        unit: 'readiness',
        description: 'Complete security control mapping across access management, incident response, and vendor management.'
      }
    ],
    architecturalControls: [
      {
        component: 'KRA eTIMS Real-Time Integration Gateway',
        mechanism: 'Cryptographic Fiscal Transmission over Mutual TLS',
        description: 'Sends B2B buyer PIN, seller PIN, VAT breakdown, and item descriptions directly to KRA OSCU API server.',
        configSnippet: 'const etimsReceipt = await kraClient.signInvoice({ buyerPin, sellerPin, vatAmount, items });'
      },
      {
        component: 'Bank Escrow Settlement Engine',
        mechanism: 'Automated End-of-Day Settlement Splitting',
        description: 'Diverts platform commission (3.5%), rider delivery fee, and wholesaler net payout into distinct segregated trust accounts.',
        configSnippet: 'await bankClient.splitSettlement({ orderId, wholesalerShare, riderShare, platformFee });'
      },
      {
        component: 'KEBS Barcode Registry Validator',
        mechanism: 'GS1 Kenya Barcode Prefix & KEBS Database Check',
        description: 'Validates 13-digit EAN-13 barcodes against KEBS certified manufacturer registry before SKU listing approval.',
        configSnippet: 'assert(kebsRegistry.isCertified(sku.barcode), "Counterfeit or unverified product rejected");'
      }
    ],
    failureModesAndMitigations: [
      {
        failureMode: 'KRA eTIMS government server times out during evening billing peak',
        blastRadius: 'Potential delay in receipt issuance',
        mitigationStrategy: 'Offline fiscal queue signs invoice locally with registered virtual OSCU crypto dongle; transmits asynchronously within 24h as permitted by KRA rules.',
        recoveryTime: '< 100 ms (local signing)'
      }
    ],
    verificationMethods: [
      {
        type: 'Audit',
        description: 'External regulatory audit conducted annually by certified Kenyan financial audit firm.',
        tooling: 'KPMG / PwC Kenya Regulatory Review',
        frequency: 'Annually'
      }
    ],
    complianceStandards: [
      'Central Bank of Kenya National Payment System Act (Cap 491B)',
      'Kenya Revenue Authority Tax Procedures (eTIMS) Regulations 2023',
      'Kenya Bureau of Standards Standards Act (Cap 496)',
      'ISO/IEC 27001:2022 Security Controls'
    ],
    operationalChecklist: [
      'Segregated escrow accounts audited and reconciled daily against M-Pesa Daraja statement',
      'Wholesaler KYC files (CR12 company registration, tax compliance certificate, director national IDs) verified annually'
    ]
  }
];

// Interactive Latency Budget breakdown
export const DEFAULT_LATENCY_BUDGET: LatencyBudgetSegment[] = [
  {
    name: 'Safaricom 4G / 3G Radio Uplink (Nairobi)',
    allocatedMs: 70,
    simulatedMs: 58,
    description: 'Cellular tower transmission and wireless packet latency to Safaricom core network.',
    networkLayer: 'Layer 1/2 Radio'
  },
  {
    name: 'Cloudflare Edge PoP TLS Termination (NBO)',
    allocatedMs: 25,
    simulatedMs: 14,
    description: 'Nairobi IXP edge proxy terminating TLS 1.3 and inspecting WAF rules.',
    networkLayer: 'Layer 7 Edge'
  },
  {
    name: 'AWS API Gateway & JWT Auth Validation',
    allocatedMs: 30,
    simulatedMs: 22,
    description: 'RS256 signature verification and rate-limit token bucket validation.',
    networkLayer: 'Microservice Ingress'
  },
  {
    name: 'PostgreSQL Read Replica / Redis Cache Query',
    allocatedMs: 35,
    simulatedMs: 18,
    description: 'Indexed catalog scan or hot inventory lock check in Redis cluster.',
    networkLayer: 'Storage / Cache Tier'
  },
  {
    name: 'Application Business Logic (Supplier Matrix)',
    allocatedMs: 40,
    simulatedMs: 26,
    description: 'Multi-factor supplier selection algorithm and volume discount tier calculation.',
    networkLayer: 'Core Domain Engine'
  }
];

// Interactive Disaster Recovery Drill Steps
export const DISASTER_RECOVERY_STEPS: DisasterRecoveryDrillStep[] = [
  {
    id: 'dr_step_1',
    name: 'Automated Regional Failure Detection',
    phase: 'Detection',
    expectedDurationSec: 45,
    action: 'Synthetic probes fail 3 consecutive checks across Cape Town (af-south-1). Datadog triggers critical P1 alert.',
    automatedCheck: 'Health status check returned HTTP 500 across 3 external vantage points.',
    status: 'passed'
  },
  {
    id: 'dr_step_2',
    name: 'Disaster Recovery Automated Triage Trigger',
    phase: 'Triage',
    expectedDurationSec: 60,
    action: 'Automated Lambda declares regional outage; notifies SRE on-call and begins standby cluster spin-up.',
    automatedCheck: 'AWS FIS regional fault injection verified.',
    status: 'passed'
  },
  {
    id: 'dr_step_3',
    name: 'Aurora Global Database Secondary Promotion',
    phase: 'Failover',
    expectedDurationSec: 180,
    action: 'Promotes Frankfurt (eu-central-1) read replica to standalone write primary. WAL synchronization verified.',
    automatedCheck: 'Replica lag = 0.8s. Write permissions activated.',
    status: 'passed'
  },
  {
    id: 'dr_step_4',
    name: 'Route 53 Global DNS Traffic Swing',
    phase: 'Traffic Swing',
    expectedDurationSec: 90,
    action: 'Swings api.wayno.ke DNS CNAME to secondary ingress load balancer with TTL = 30s.',
    automatedCheck: 'Global DNS propagation confirmed across 12 worldwide resolvers.',
    status: 'passed'
  },
  {
    id: 'dr_step_5',
    name: 'End-to-End M-Pesa Webhook & Checkout Verification',
    phase: 'Verification',
    expectedDurationSec: 120,
    action: 'Runs automated synthetic test basket checkout and M-Pesa sandbox callback confirmation.',
    automatedCheck: 'Order ORD-DR-VERIFY created and confirmed in 142ms.',
    status: 'passed'
  }
];
