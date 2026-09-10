# Wayno Platform Architecture

## Monorepo Layout
```
wayno/
│
├── apps/
│   ├── api/          # Core NestJS REST & Event API
│   ├── retailer/     # React Native Duka Order App
│   ├── rider/        # React Native Courier Fleet App
│   ├── wholesaler/   # Next.js Depot Fulfillment Portal
│   └── admin/        # Next.js Operations & Architecture Hub
│
├── services/
│   ├── search/       # Sub-50ms multilingual FMCG search
│   ├── intelligence/ # Demand forecasting & dynamic pricing
│   └── optimization/ # VRP routing & split order minimizer
│
├── packages/
│   ├── types/        # Shared TypeScript domain models
│   ├── validation/   # Shared Zod validation schemas
│   ├── api-client/   # Typed isomorphic client SDK
│   └── config/       # Shared tooling configs
│
├── algorithms/
│   └── rust/         # High-speed routing & 3D knapsack packing
│
├── intelligence/
│   └── python/       # LightGBM & PyTorch demand models
│
├── data/             # Schemas, GIS bounds, seed catalogs
│
├── infrastructure/
│   ├── terraform/    # GCP/AWS Cloud resources
│   ├── docker/       # Multi-container local environments
│   └── environments/ # Staging and production configs
│
├── docs/             # Specs, ADRs, runbooks
│
└── tests/            # E2E integration & k6 load testing
```
