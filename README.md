# WAYNO — B2B FMCG Procurement & Fulfillment Network

Wayno is a high-velocity B2B FMCG procurement and fulfillment network built for East African retail dukas, wholesale distributors, and motorbike delivery fleets.

---

## Monorepo Repository Structure

```
wayno/
│
├── apps/
│   │
│   ├── api/
│   │   └── NestJS
│   │
│   ├── retailer/
│   │   └── React Native
│   │
│   ├── rider/
│   │   └── React Native
│   │
│   ├── wholesaler/
│   │   └── Next.js
│   │
│   └── admin/
│       └── Next.js
│
├── services/
│   │
│   ├── search/
│   ├── intelligence/
│   └── optimization/
│
├── packages/
│   │
│   ├── types/
│   ├── validation/
│   ├── api-client/
│   └── config/
│
├── algorithms/
│   └── rust/
│
├── intelligence/
│   └── python/
│
├── data/
│
├── infrastructure/
│   ├── terraform/
│   ├── docker/
│   └── environments/
│
├── docs/
│
└── tests/
```

---

## Component Breakdown

### 1. `apps/`
- **`api/` (NestJS)**: Enterprise core API orchestrating order lifecycle, authentication, event publishing, and accounting ledger.
- **`retailer/` (React Native)**: Duka retail application with typo-tolerant catalog search, 1-tap M-Pesa STK push, and offline-first tracking.
- **`rider/` (React Native)**: Courier fleet mobile app with corridor sequencing, depot QR handshakes, and proof-of-delivery (POD).
- **`wholesaler/` (Next.js)**: Wholesale depot portal for inventory availability, tiered pricing, and consignment release scanning.
- **`admin/` (Next.js)**: Central admin console consolidating order pipelines, search benchmarks, business rules, NFR audits, and architecture flows.

### 2. `services/`
- **`search/`**: Sub-50ms FMCG search service with Kenyan Swahili/Sheng phonetic normalization and pack size disambiguation.
- **`intelligence/`**: Dynamic margin pricing, duka restock recommendations, and wholesaler SLA reliability scoring.
- **`optimization/`**: Combinatorial vehicle routing problem (VRP) solver and multi-depot split order delivery fee minimizer.

### 3. `packages/`
- **`types/`**: Shared TypeScript domain models (`Order`, `Product`, `Rider`, `TelemetryEvent`).
- **`validation/`**: Shared Zod schemas enforcing business constraints, pricing invariants, and geo bounds.
- **`api-client/`**: Isomorphic typed SDK with exponential backoff and WebSocket streaming.
- **`config/`**: Monorepo shared ESLint, TSConfig, Prettier, and Tailwind presets.

### 4. `algorithms/rust/`
- High-throughput Rust routines for sub-millisecond vehicle routing (VRP), 3D cargo knapsack parcel packing, and geohash spatial clustering.

### 5. `intelligence/python/`
- Machine learning models (LightGBM, PyTorch, FastAPI) for localized demand forecasting and duka credit underwriting.

### 6. `data/`
- PostgreSQL DDL schemas with time-based table partitioning, FMCG product seed catalogs, and GIS delivery zone bounds.

### 7. `infrastructure/`
- **`terraform/`**: Cloud SQL PostgreSQL HA, Redis Cache, and Cloud Run / ECS modules.
- **`docker/`**: Multi-container `docker-compose.yml` for local API, PostgreSQL, and Redis development.
- **`environments/`**: Staging and Production environment templates.

### 8. `docs/`
- Monorepo architecture specifications, OpenAPI REST definitions, and Architecture Decision Records (ADRs).

### 9. `tests/`
- End-to-end integration test suites, API contract tests, and k6 high-volume load test benchmarks.
