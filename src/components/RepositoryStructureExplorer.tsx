import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Cpu, 
  Server, 
  Smartphone, 
  Globe, 
  Database, 
  ShieldCheck, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Check,
  Code2,
  Box,
  Share2,
  GitBranch,
  Play,
  FileJson,
  Package,
  Boxes,
  Zap,
  CheckSquare,
  Search,
  BookOpen
} from 'lucide-react';
import { DatabaseIndexingConsole } from './DatabaseIndexingConsole';

interface RepoItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  tech?: string;
  badge?: string;
  description: string;
  children?: RepoItem[];
  codePreview?: string;
  codeLang?: string;
}

const REPO_TREE: RepoItem[] = [
  {
    id: 'apps',
    name: 'apps/',
    type: 'folder',
    path: 'apps',
    description: 'Frontend client applications, mobile apps, and the core NestJS backend API service.',
    children: [
      {
        id: 'apps-api',
        name: 'api/',
        type: 'folder',
        path: 'apps/api',
        tech: 'NestJS 10 / TypeScript',
        badge: 'Core Backend',
        description: 'Core backend REST & WebSocket API orchestrating the 18 platform modules (Identity, Orders, Payments, Wholesalers, etc.).',
        children: [
          {
            id: 'apps-api-src',
            name: 'src/',
            type: 'folder',
            path: 'apps/api/src',
            description: 'NestJS application source code organized into modular domain controllers, services, and event handlers.',
            children: [
              {
                id: 'apps-api-modules',
                name: 'modules/',
                type: 'folder',
                path: 'apps/api/src/modules',
                badge: '18 Modules',
                description: 'Full domain modules implementing all 18 WAYNO backend capabilities.',
                children: [
                  { id: 'mod-identity', name: 'identity/', type: 'folder', path: 'apps/api/src/modules/identity', tech: 'JWT / RBAC', description: 'User authentication, phone SMS OTP, KYC tier verification, and role-based access control.' },
                  { id: 'mod-retailers', name: 'retailers/', type: 'folder', path: 'apps/api/src/modules/retailers', tech: 'TypeORM / Postgres', description: 'Duka profiles, geofence registration, trade history, and micro-credit eligibility.' },
                  { id: 'mod-shops', name: 'shops/', type: 'folder', path: 'apps/api/src/modules/shops', tech: 'PostGIS', description: 'Store branch locations, GPS anchors, operating hours, and active delivery corridor assignment.' },
                  { id: 'mod-wholesalers', name: 'wholesalers/', type: 'folder', path: 'apps/api/src/modules/wholesalers', tech: 'NestJS Service', description: 'Eastleigh & Industrial Area wholesale depot inventory, dispatch SLA timers, and reliability scores.' },
                  { id: 'mod-products', name: 'products/', type: 'folder', path: 'apps/api/src/modules/products', tech: 'Canonical SKUs', description: 'Master FMCG catalog decoupled from suppliers: barcodes, pack sizes, standard RRP, and categories.' },
                  { id: 'mod-catalogue', name: 'catalogue/', type: 'folder', path: 'apps/api/src/modules/catalogue', tech: 'Redis Caching', description: 'Multi-wholesaler price tiers, bulk discounts, real-time stock levels, and distributor feeds.' },
                  { id: 'mod-search', name: 'search/', type: 'folder', path: 'apps/api/src/modules/search', tech: 'BM25 / Proxy', description: 'Search routing to the dedicated sub-50ms search service with Sheng phonetic normalization.' },
                  { id: 'mod-cart', name: 'cart/', type: 'folder', path: 'apps/api/src/modules/cart', tech: 'Redis Session', description: 'Multi-depot cart orchestration, minimum order threshold validation, and depot split logic.' },
                  { id: 'mod-orders', name: 'orders/', type: 'folder', path: 'apps/api/src/modules/orders', tech: '10-State FSM', description: 'Deterministic state machine (PENDING → ACCEPTED → PREPARING → READY → IN_TRANSIT → DELIVERED).' },
                  { id: 'mod-payments', name: 'payments/', type: 'folder', path: 'apps/api/src/modules/payments', tech: 'Daraja M-Pesa', description: 'Safaricom Daraja STK push integration, idempotency keys, Paybill callbacks, and ledger records.' },
                  { id: 'mod-fulfillment', name: 'fulfillment/', type: 'folder', path: 'apps/api/src/modules/fulfillment', tech: 'WebSocket / Queue', description: 'Wholesaler pick-and-pack fulfillment boards, inventory reserve holds, and handover validation.' },
                  { id: 'mod-riders', name: 'riders/', type: 'folder', path: 'apps/api/src/modules/riders', tech: 'Geolocation / Redis', description: 'Boda-boda courier fleet management, shift status, vehicle capacity limits, and driver rating.' },
                  { id: 'mod-delivery', name: 'delivery/', type: 'folder', path: 'apps/api/src/modules/delivery', tech: 'Corridor Routing', description: 'Dynamic corridor fees (Zone 1 ≤3km KES 50, Zone 2 ≤6km KES 120), OTP handover, and geofence verification.' },
                  { id: 'mod-notifications', name: 'notifications/', type: 'folder', path: 'apps/api/src/modules/notifications', tech: 'SMS / WhatsApp', description: 'SMS dispatch via Africa\'s Talking, push notifications, and duka delivery ETA alerts.' },
                  { id: 'mod-pricing', name: 'pricing/', type: 'folder', path: 'apps/api/src/modules/pricing', tech: 'Dynamic Tiers', description: 'Duka gross profit margins, bulk volume discounts, and FMCG brand rebate calculations.' },
                  { id: 'mod-events', name: 'events/', type: 'folder', path: 'apps/api/src/modules/events', tech: 'Kafka / Redis PubSub', description: 'Immutable telemetry event bus streaming order mutations, search telemetry, and inventory changes.' },
                  { id: 'mod-analytics', name: 'analytics/', type: 'folder', path: 'apps/api/src/modules/analytics', tech: 'ClickHouse / OLAP', description: 'Unmet demand tracking, zero-result search telemetry, FMCG brand market share, and revenue analytics.' },
                  { id: 'mod-administration', name: 'administration/', type: 'folder', path: 'apps/api/src/modules/administration', tech: 'Admin Gateway', description: 'Admin operations API, SLA breach alerts, manual status override endpoints, and audit logs.' }
                ]
              },
              { id: 'apps-api-main', name: 'main.ts', type: 'file', path: 'apps/api/src/main.ts', tech: 'NestFactory', description: 'NestJS application bootstrap, Swagger OpenAPI docs generation, and CORS/validation configuration.' },
              { id: 'apps-api-module', name: 'app.module.ts', type: 'file', path: 'apps/api/src/app.module.ts', tech: 'Root Module', description: 'Root NestJS module wiring the 18 feature modules with PostgreSQL TypeORM and Redis clusters.' }
            ]
          },
          { id: 'apps-api-pkg', name: 'package.json', type: 'file', path: 'apps/api/package.json', tech: 'npm', description: 'Package manifest declaring dependencies on @nestjs/core, @wayno/types, @wayno/validation.' }
        ],
        codePreview: `// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis';

// 18 Core Backend Domain Modules
import { IdentityModule } from './modules/identity/identity.module';
import { RetailersModule } from './modules/retailers/retailers.module';
import { ShopsModule } from './modules/shops/shops.module';
import { WholesalersModule } from './modules/wholesalers/wholesalers.module';
import { ProductsModule } from './modules/products/products.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { SearchModule } from './modules/search/search.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { RidersModule } from './modules/riders/riders.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { EventsModule } from './modules/events/events.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdministrationModule } from './modules/administration/administration.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync(/* Postgres High-Availability */),
    RedisModule.forRootAsync(/* Low-latency cluster */),
    IdentityModule, RetailersModule, ShopsModule, WholesalersModule,
    ProductsModule, CatalogueModule, SearchModule, CartModule,
    OrdersModule, PaymentsModule, FulfillmentModule, RidersModule,
    DeliveryModule, NotificationsModule, PricingModule, EventsModule,
    AnalyticsModule, AdministrationModule
  ],
})
export class AppModule {}`
      },
      {
        id: 'apps-retailer',
        name: 'retailer/',
        type: 'folder',
        path: 'apps/retailer',
        tech: 'React Native / Expo',
        badge: 'Mobile App',
        description: 'Retailer mobile app for duka and kiosk merchants: sub-50ms catalog search, 1-tap M-Pesa STK push, and offline tracking.',
        children: [
          { id: 'retailer-catalog', name: 'CatalogScreen.tsx', type: 'file', path: 'apps/retailer/src/screens/CatalogScreen.tsx', tech: 'React Native', description: 'Product grid with recent searches, live price comparison, and Sheng vernacular typeahead.' },
          { id: 'retailer-checkout', name: 'CheckoutScreen.tsx', type: 'file', path: 'apps/retailer/src/screens/CheckoutScreen.tsx', tech: 'React Native', description: '1-tap M-Pesa STK push payment dialog with live polling and delivery corridor ETA.' },
          { id: 'retailer-orders', name: 'OrdersScreen.tsx', type: 'file', path: 'apps/retailer/src/screens/OrdersScreen.tsx', tech: 'React Native', description: 'Active and past procurement orders with live boda-boda courier tracking.' }
        ],
        codePreview: `// apps/retailer/src/screens/CatalogScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, FlatList } from 'react-native';
import { useWaynoClient } from '@wayno/api-client';
import { ProductCard } from '../components/ProductCard';

export const CatalogScreen = () => {
  const [query, setQuery] = useState('');
  const [recentQueries, setRecentQueries] = useState(['unga wa ugali', 'bluband', 'cooking oil']);
  const client = useWaynoClient();
  // Sub-50ms search query with multi-factor depot ranking
  const { data: results } = client.search.useQuery({ query, corridor: 'ZONE_1' });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Search Bar + Recent Search Pills + Product Cards */}
    </View>
  );
};`
      },
      {
        id: 'apps-rider',
        name: 'rider/',
        type: 'folder',
        path: 'apps/rider',
        tech: 'React Native / Expo',
        badge: 'Mobile App',
        description: 'Courier fleet app for boda-boda drivers: multi-stop turn navigation, warehouse QR handshake, proof of delivery.',
        children: [
          { id: 'rider-feed', name: 'JobFeedScreen.tsx', type: 'file', path: 'apps/rider/src/screens/JobFeedScreen.tsx', tech: 'React Native', description: 'Real-time order dispatch feed filtered by boda delivery corridor and payload weight.' },
          { id: 'rider-nav', name: 'NavigationScreen.tsx', type: 'file', path: 'apps/rider/src/screens/NavigationScreen.tsx', tech: 'Mapbox / GPS', description: 'Turn-by-turn routing from wholesale depot to destination duka with offline map support.' },
          { id: 'rider-handover', name: 'ProofOfDeliveryScreen.tsx', type: 'file', path: 'apps/rider/src/screens/ProofOfDeliveryScreen.tsx', tech: 'Camera / OTP', description: '4-digit SMS OTP verification and recipient signature capture to complete order.' }
        ],
        codePreview: `// apps/rider/package.json
{
  "name": "@wayno/rider",
  "version": "1.0.0",
  "dependencies": {
    "expo": "~51.0.0",
    "expo-location": "~17.0.1",
    "react-native": "0.74.1",
    "@wayno/api-client": "workspace:*",
    "@wayno/types": "workspace:*"
  }
}`
      },
      {
        id: 'apps-wholesaler',
        name: 'wholesaler/',
        type: 'folder',
        path: 'apps/wholesaler',
        tech: 'Next.js 14 / React',
        badge: 'Web App',
        description: 'Depot and warehouse operations portal: live fulfillment board, inventory price tiers, rider handover barcode scanner.',
        children: [
          { id: 'ws-fulfillment', name: 'page.tsx (Fulfillment)', type: 'file', path: 'apps/wholesaler/src/app/fulfillment/page.tsx', tech: 'Next.js App Router', description: 'Kanban pick-and-pack board with SLA countdown timers (12-18 min prep SLA).' },
          { id: 'ws-inventory', name: 'page.tsx (Inventory)', type: 'file', path: 'apps/wholesaler/src/app/inventory/page.tsx', tech: 'Next.js App Router', description: 'Wholesale inventory stock management, bulk bale quantity updates, and promotional deals.' }
        ],
        codePreview: `// apps/wholesaler/src/app/fulfillment/page.tsx
export default function FulfillmentBoard() {
  // Live WebSocket order stream for Somlink Eastleigh depot
  const { orders, markOrderReady } = useWholesalerOrders('wh_somlink_eastleigh');
  return (
    <div className="p-6">
      <h1>Depot Fulfillment Board</h1>
      {/* Pick-and-Pack Cards with SLA Countdown Timers */}
    </div>
  );
}`
      },
      {
        id: 'apps-admin',
        name: 'admin/',
        type: 'folder',
        path: 'apps/admin',
        tech: 'Next.js 14 / Tailwind',
        badge: 'Web App',
        description: 'Global administrator console: pipeline monitoring, search benchmarks, business rules engine & architecture flows.',
        children: [
          { id: 'admin-ops', name: 'page.tsx (Operations)', type: 'file', path: 'apps/admin/src/app/operations/page.tsx', tech: 'Next.js', description: 'Live order pipeline telemetry, manual status override modal, and Daraja payment tracker.' },
          { id: 'admin-benchmark', name: 'page.tsx (Benchmark)', type: 'file', path: 'apps/admin/src/app/benchmark/page.tsx', tech: 'Next.js', description: 'Search benchmarking suite testing 16 specs, sub-50ms latency, and typo-tolerance.' },
          { id: 'admin-rules', name: 'page.tsx (Business Rules)', type: 'file', path: 'apps/admin/src/app/rules/page.tsx', tech: 'Next.js', description: '14 executable business rules governing duka credit, MOQ, and corridor fees.' }
        ],
        codePreview: `// apps/admin/package.json
{
  "name": "@wayno/admin",
  "version": "1.0.0",
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "@wayno/types": "workspace:*",
    "@wayno/api-client": "workspace:*"
  }
}`
      }
    ]
  },
  {
    id: 'services',
    name: 'services/',
    type: 'folder',
    path: 'services',
    description: 'Autonomous microservices for specialized high-throughput tasks.',
    children: [
      {
        id: 'services-search',
        name: 'search/',
        type: 'folder',
        path: 'services/search',
        tech: 'Fastify / Inverted Index',
        badge: 'Sub-50ms',
        description: 'Sub-50ms FMCG search engine with Sheng & Swahili phonetic normalization and pack size disambiguation.',
        children: [
          { id: 'search-index', name: 'inverted_index.ts', type: 'file', path: 'services/search/src/inverted_index.ts', tech: 'BM25', description: 'In-memory inverted token postings index with probabilistic BM25 document scoring.' },
          { id: 'search-sheng', name: 'sheng_synonyms.ts', type: 'file', path: 'services/search/src/sheng_synonyms.ts', tech: 'NLP Graph', description: 'Bidirectional vernacular graph (unga ↔ maize meal, njugu ↔ peanuts, sabuni ↔ detergent).' },
          { id: 'search-fuzzy', name: 'damerau_levenshtein.ts', type: 'file', path: 'services/search/src/damerau_levenshtein.ts', tech: 'Typo Engine', description: 'Fast 2-edit distance transposition and deletion spell corrector for brand names.' }
        ],
        codePreview: `// services/search/src/inverted_index.ts
export class InvertedIndex {
  private postings = new Map<string, Array<{ docId: string; tf: number }>>();
  private docLengths = new Map<string, number>();

  scoreBM25(queryTokens: string[], docId: string): number {
    const k1 = 1.2;
    const b = 0.75;
    // Fast probabilistic scoring for sub-15ms typeahead
    return queryTokens.reduce((score, token) => score + this.calcWeight(token, docId, k1, b), 0);
  }
}`
      },
      {
        id: 'services-intelligence',
        name: 'intelligence/',
        type: 'folder',
        path: 'services/intelligence',
        tech: 'FastAPI / Python',
        badge: 'Predictive ML',
        description: 'Predictive restock recommendations, localized FMCG price elasticities, and depot stockout early warning.',
        children: [
          { id: 'intel-restock', name: 'restock_predictor.py', type: 'file', path: 'services/intelligence/models/restock_predictor.py', tech: 'LightGBM', description: 'Duka consumption velocity regression predicting restocking date within 18 hours.' },
          { id: 'intel-elasticity', name: 'price_elasticity.py', type: 'file', path: 'services/intelligence/models/price_elasticity.py', tech: 'Statsmodels', description: 'Wholesale price elasticity curve optimizing retailer gross profit margins.' }
        ],
        codePreview: `# services/intelligence/models/restock_predictor.py
import lightgbm as lgb
import numpy as np

class DukaRestockPredictor:
    def __init__(self, model_path: str):
        self.model = lgb.Booster(model_file=model_path)

    def predict_days_to_stockout(self, duka_history: dict) -> float:
        features = np.array([[
            duka_history['weekly_bale_velocity'],
            duka_history['days_since_last_order'],
            duka_history['zone_demand_index']
        ]])
        return float(self.model.predict(features)[0])`
      },
      {
        id: 'services-optimization',
        name: 'optimization/',
        type: 'folder',
        path: 'services/optimization',
        tech: 'Rust / Actix',
        badge: 'High Compute',
        description: 'Combinatorial vehicle routing problem (VRP) solver and multi-depot split order delivery fee minimizer.',
        children: [
          { id: 'opt-vrp', name: 'vrp_solver.rs', type: 'file', path: 'services/optimization/src/vrp_solver.rs', tech: 'Rust 2021', description: 'Sub-millisecond Boda-boda VRP with 40kg weight and 60L volume container constraints.' },
          { id: 'opt-split', name: 'split_order_optimizer.rs', type: 'file', path: 'services/optimization/src/split_order_optimizer.rs', tech: 'Rust 2021', description: 'Greedy set-cover algorithm choosing minimal depots to satisfy multi-item duka cart.' }
        ],
        codePreview: `// services/optimization/src/vrp_solver.rs
pub struct DeliveryStop {
    pub duka_id: String,
    pub lat: f64,
    pub lng: f64,
    pub weight_kg: f32,
    pub volume_liters: f32,
}

pub fn solve_boda_corridor(stops: &[DeliveryStop]) -> Vec<usize> {
    const MAX_WEIGHT_KG: f32 = 40.0;
    const MAX_VOLUME_L: f32 = 60.0;
    // 2-opt heuristic optimizing turn-by-turn route within 5 milliseconds
    two_opt_route(stops, MAX_WEIGHT_KG, MAX_VOLUME_L)
}`
      }
    ]
  },
  {
    id: 'packages',
    name: 'packages/',
    type: 'folder',
    path: 'packages',
    description: 'Shared, versioned monorepo libraries imported across apps and services.',
    children: [
      {
        id: 'packages-types',
        name: 'types/',
        type: 'folder',
        path: 'packages/types',
        tech: 'TypeScript',
        badge: 'Domain Types',
        description: 'Shared domain interfaces (Order, Product, WholesalerLocation, TelemetryEvent).',
        codePreview: `// packages/types/src/index.ts
export type OrderState = 
  | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' 
  | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  retailerId: string;
  wholesalerId: string;
  status: OrderState;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  totalAmount: number;
  deliveryCorridor: 'ZONE_1' | 'ZONE_2' | 'ZONE_3';
  createdAt: string;
}`
      },
      {
        id: 'packages-validation',
        name: 'validation/',
        type: 'folder',
        path: 'packages/validation',
        tech: 'Zod',
        badge: 'Contracts',
        description: 'Unified runtime schema validation enforcing pricing invariants, mobile phone formats, and geo bounds.',
        codePreview: `// packages/validation/src/order.schema.ts
import { z } from 'zod';

export const KenyaPhoneSchema = z.string().regex(/^(\\+254|0)[17]\\d{8}$/, "Invalid Kenyan mobile phone");

export const CreateOrderSchema = z.object({
  retailerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive().max(100)
  })).min(1),
  paymentMethod: z.enum(['MPESA_STK', 'CREDIT_WALLET'])
});`
      },
      {
        id: 'packages-api-client',
        name: 'api-client/',
        type: 'folder',
        path: 'packages/api-client',
        tech: 'TypeScript SDK',
        badge: 'Client SDK',
        description: 'Type-safe isomorphic HTTP and WebSocket client SDK with retry and auth handling.',
        codePreview: `// packages/api-client/src/index.ts
export class WaynoApiClient {
  constructor(private options: { baseUrl: string; apiKey?: string }) {}

  async createOrder(payload: CreateOrderInput): Promise<Order> {
    const res = await fetch(\`\${this.options.baseUrl}/api/v1/orders\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
}`
      },
      {
        id: 'packages-config',
        name: 'config/',
        type: 'folder',
        path: 'packages/config',
        tech: 'Config Presets',
        badge: 'Tooling',
        description: 'Shared base ESLint rules, TypeScript compiler presets, and design tokens.',
        codePreview: `// packages/config/package.json
{
  "name": "@wayno/config",
  "version": "1.0.0",
  "main": "index.js"
}`
      }
    ]
  },
  {
    id: 'algorithms',
    name: 'algorithms/',
    type: 'folder',
    path: 'algorithms',
    description: 'High-performance compute routines compiled to native binaries or WebAssembly.',
    children: [
      {
        id: 'algorithms-rust',
        name: 'rust/',
        type: 'folder',
        path: 'algorithms/rust',
        tech: 'Rust 2021',
        badge: 'Cargo Crate',
        description: 'Sub-millisecond VRP routing engine, 3D cargo knapsack parcel packing, and geohash spatial clusters.',
        children: [
          { id: 'rust-cargo', name: 'Cargo.toml', type: 'file', path: 'algorithms/rust/Cargo.toml', tech: 'Cargo', description: 'Crate manifest with rayon parallelization and geo spatial primitives.' },
          { id: 'rust-knapsack', name: 'knapsack_3d.rs', type: 'file', path: 'algorithms/rust/src/knapsack_3d.rs', tech: 'Rust', description: '3D bin packing packing maize flour bales and jerrycans into boda-boda courier boxes.' },
          { id: 'rust-geohash', name: 'geohash_corridor.rs', type: 'file', path: 'algorithms/rust/src/geohash_corridor.rs', tech: 'Rust', description: 'Ultra-fast geohash corridor boundary distance calculation (<0.1ms).' }
        ],
        codePreview: `# algorithms/rust/Cargo.toml
[package]
name = "wayno-algorithms"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
geo = "0.28"
rayon = "1.8"
geohash = "0.13"`
      }
    ]
  },
  {
    id: 'intelligence',
    name: 'intelligence/',
    type: 'folder',
    path: 'intelligence',
    description: 'Data science pipelines and machine learning training artifacts.',
    children: [
      {
        id: 'intelligence-python',
        name: 'python/',
        type: 'folder',
        path: 'intelligence/python',
        tech: 'Python 3.11 / Poetry',
        badge: 'ML Pipelines',
        description: 'LightGBM demand forecaster, alternative duka credit scoring, and dynamic inventory pricing API.',
        children: [
          { id: 'py-pyproject', name: 'pyproject.toml', type: 'file', path: 'intelligence/python/pyproject.toml', tech: 'Poetry', description: 'Python project dependencies: scikit-learn, lightgbm, fastapi, pandas.' },
          { id: 'py-train', name: 'train_demand_model.py', type: 'file', path: 'intelligence/python/train_demand_model.py', tech: 'Python', description: 'Batch model training pipeline ingesting historical duka transactions.' },
          { id: 'py-serving', name: 'serving_api.py', type: 'file', path: 'intelligence/python/serving_api.py', tech: 'FastAPI', description: 'Inference endpoint delivering predictive restock orders to apps/api.' }
        ],
        codePreview: `# intelligence/python/pyproject.toml
[tool.poetry]
name = "wayno-intelligence"
version = "0.1.0"
description = "Machine Learning pipelines for Nairobi duka retail supply chains"

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.110.0"
lightgbm = "^4.3.0"
scikit-learn = "^1.4.0"
pandas = "^2.2.0"`
      }
    ]
  },
  {
    id: 'data',
    name: 'data/',
    type: 'folder',
    path: 'data',
    tech: 'PostGIS / SQL',
    badge: 'Database Assets',
    description: 'Database migrations, time-based table partitioning, seed SKU catalogs, and GIS delivery boundaries.',
    children: [
      { 
        id: 'data-migrations', 
        name: 'migrations/', 
        type: 'folder', 
        path: 'data/migrations', 
        tech: 'PostGIS / SQL', 
        description: 'PostgreSQL relational schemas with B-tree composites, PostGIS spatial GiST, GIN trigram, and TimescaleDB hypertable indexing.',
        children: [
          {
            id: 'mig-001',
            name: '001_core_tables_and_pks.sql',
            type: 'file',
            path: 'data/migrations/001_core_tables_and_pks.sql',
            tech: 'PostGIS / DDL',
            description: 'Core tables (retailers, shops, wholesalers, products, orders) with UUID primary keys and foreign key constraints.',
            codePreview: `-- data/migrations/001_core_tables_and_pks.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS retailers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    shop_owner VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    service_zone_id VARCHAR(32) NOT NULL,
    credit_limit NUMERIC(10, 2) NOT NULL DEFAULT 50000.00
);

CREATE TABLE IF NOT EXISTS shops (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL
);`
          },
          {
            id: 'mig-002',
            name: '002_btree_composite_indexes.sql',
            type: 'file',
            path: 'data/migrations/002_btree_composite_indexes.sql',
            tech: 'B-Tree Indexes',
            description: 'Composite B-tree indexes for duka order history, wholesaler prep queues, and payment lookups.',
            codePreview: `-- data/migrations/002_btree_composite_indexes.sql
-- Optimizes high-throughput transactional queries
CREATE INDEX idx_orders_retailer_created_at_desc 
ON orders (retailer_id, created_at DESC);

CREATE INDEX idx_orders_wholesaler_created 
ON orders (wholesaler_id, created_at ASC);

CREATE INDEX idx_order_items_order_id 
ON order_items (order_id);

CREATE UNIQUE INDEX idx_wholesaler_inventory_composite 
ON wholesaler_inventory (wholesaler_id, product_id);`
          },
          {
            id: 'mig-003',
            name: '003_postgis_spatial_gist_indexes.sql',
            type: 'file',
            path: 'data/migrations/003_postgis_spatial_gist_indexes.sql',
            tech: 'PostGIS GiST',
            description: 'Spatial R-Tree GiST indexes for sub-5ms corridor geofencing and nearest available courier dispatch.',
            codePreview: `-- data/migrations/003_postgis_spatial_gist_indexes.sql
-- R-Tree Spatial GiST Indexes for sub-5ms corridor geofencing
CREATE INDEX idx_shops_location_geom_gist 
ON shops USING GIST (geom);

CREATE INDEX idx_wholesalers_geom_gist 
ON wholesalers USING GIST (geom);

CREATE INDEX idx_riders_last_known_location_gist 
ON riders USING GIST (last_known_location);

CREATE INDEX idx_corridors_boundary_gist 
ON delivery_corridors USING GIST (boundary_geom);`
          },
          {
            id: 'mig-004',
            name: '004_gin_trigram_search_indexes.sql',
            type: 'file',
            path: 'data/migrations/004_gin_trigram_search_indexes.sql',
            tech: 'GIN Trigram',
            description: 'Inverted GIN trigram and text array indexes for sub-10ms Sheng & Swahili phonetic matching.',
            codePreview: `-- data/migrations/004_gin_trigram_search_indexes.sql
-- Trigram GIN index for typo-tolerant product name searches
CREATE INDEX idx_products_name_trgm_gin 
ON products USING GIN (name gin_trgm_ops);

-- GIN array index for Swahili & Sheng vernacular search aliases
-- ("unga wa ngano", "chapo", "sabuni", "mafuta", "sukari")
CREATE INDEX idx_products_aliases_gin 
ON products USING GIN (aliases);`
          },
          {
            id: 'mig-005',
            name: '005_partial_and_filtered_indexes.sql',
            type: 'file',
            path: 'data/migrations/005_partial_and_filtered_indexes.sql',
            tech: 'Partial Indexes',
            description: 'Targeted partial indexes pruning >90% of index RAM footprint for active orders and low stock.',
            codePreview: `-- data/migrations/005_partial_and_filtered_indexes.sql
-- Active in-flight pipeline orders (filters out completed/failed orders)
CREATE INDEX idx_orders_active_pipeline_partial 
ON orders (delivery_corridor, status, created_at DESC) 
WHERE status NOT IN ('DELIVERED', 'CANCELLED', 'FAILED', 'REFUNDED');

-- Low-stock procurement alerts (<20 units remaining in depot)
CREATE INDEX idx_wholesaler_low_stock_partial 
ON wholesaler_inventory (wholesaler_id, available_stock) 
WHERE available_stock < 20;`
          },
          {
            id: 'mig-006',
            name: '006_timescaledb_hypertable_indexing.sql',
            type: 'file',
            path: 'data/migrations/006_timescaledb_hypertable_indexing.sql',
            tech: 'TimescaleDB',
            description: 'TimescaleDB hypertable time-bucketed composite partitioning and columnar compression for telemetry.',
            codePreview: `-- data/migrations/006_timescaledb_hypertable_indexing.sql
-- Convert telemetry_events table to hypertable partitioned by 24h chunks
SELECT create_hypertable('telemetry_events', 'timestamp', chunk_time_interval => INTERVAL '24 hours');

-- Composite hypertable index for real-time SLA and event streaming
CREATE INDEX idx_telemetry_time_bucket_event_type 
ON telemetry_events (timestamp DESC, event_type, order_id);`
          }
        ]
      },
      { id: 'data-seeds', name: 'seeds/', type: 'folder', path: 'data/seeds', tech: 'JSON', description: 'Canonical FMCG SKU catalogs, Nairobi wholesaler depots, and sample duka retail locations.' },
      { id: 'data-gis', name: 'gis/', type: 'folder', path: 'data/gis', tech: 'GeoJSON', description: 'Nairobi delivery corridor polygons: Zone 1 (Boda ≤3km), Zone 2 (Express ≤6km), Zone 3 (Extended).' }
    ],
    codePreview: `-- data/migrations/001_orders_schema.sql
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    retailer_id VARCHAR(64) NOT NULL,
    wholesaler_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    subtotal NUMERIC(12, 2) NOT NULL,
    delivery_fee NUMERIC(8, 2) NOT NULL,
    delivery_corridor VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_wholesaler ON orders(wholesaler_id, created_at DESC);`
  },
  {
    id: 'infrastructure',
    name: 'infrastructure/',
    type: 'folder',
    path: 'infrastructure',
    description: 'Infrastructure as code, container definitions, and deployment environments.',
    children: [
      {
        id: 'infra-terraform',
        name: 'terraform/',
        type: 'folder',
        path: 'infrastructure/terraform',
        tech: 'Terraform (HCL)',
        badge: 'Cloud IaC',
        description: 'Cloud SQL PostgreSQL High Availability, Redis cache cluster, and Cloud Run / ECS services.',
        codePreview: `# infrastructure/terraform/main.tf
resource "google_sql_database_instance" "wayno_postgres" {
  name             = "wayno-postgres-ha"
  database_version = "POSTGRES_16"
  region           = "europe-west2"
  settings {
    tier = "db-custom-4-16384"
    availability_type = "REGIONAL"
    backup_configuration { enabled = true }
  }
}`
      },
      {
        id: 'infra-docker',
        name: 'docker/',
        type: 'folder',
        path: 'infrastructure/docker',
        tech: 'Docker Compose',
        badge: 'Containers',
        description: 'Multi-container local stack orchestrating API, PostgreSQL, and Redis cache.',
        codePreview: `# infrastructure/docker/docker-compose.yml
version: '3.8'
services:
  api:
    build: { context: ../../, dockerfile: apps/api/Dockerfile }
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgres://wayno:secret@postgres:5432/wayno_db
  postgres:
    image: postgis/postgis:16-3.4-alpine
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]`
      },
      {
        id: 'infra-env',
        name: 'environments/',
        type: 'folder',
        path: 'infrastructure/environments',
        tech: 'Env Configs',
        badge: 'Environments',
        description: 'Staging and Production configuration templates and secret parameters.',
        codePreview: `# infrastructure/environments/production.env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_SSL=true
PORT=3000
KAFKA_BROKERS=kafka-1.prod.wayno.internal:9092
REDIS_HOST=redis-master.prod.wayno.internal
DARAJA_CONSUMER_KEY=\${PROD_DARAJA_KEY}
AFRICASTALKING_API_KEY=\${PROD_AT_KEY}`
      }
    ]
  },
  {
    id: 'docs',
    name: 'docs/',
    type: 'folder',
    path: 'docs',
    tech: 'Markdown / ADR',
    badge: 'Architecture',
    description: 'System specifications, API definitions, Architecture Decision Records (ADRs), and runbooks.',
    children: [
      { id: 'doc-arch', name: 'architecture_blueprint.md', type: 'file', path: 'docs/architecture_blueprint.md', tech: 'Markdown', description: 'Monorepo layout, C4 container model, and 10-state finite state machine.' },
      { id: 'doc-adr-vrp', name: 'ADR-001-rust-for-vrp.md', type: 'file', path: 'docs/adr/ADR-001-rust-for-vrp.md', tech: 'ADR', description: 'Decision record for compiling VRP combinatorial solvers in native Rust.' },
      { id: 'doc-runbook', name: 'daraja_outage_runbook.md', type: 'file', path: 'docs/runbooks/daraja_outage_runbook.md', tech: 'Runbook', description: 'Fallback protocol for Safaricom Daraja STK push timeouts and reconciliation.' }
    ],
    codePreview: `# docs/architecture_blueprint.md
# WAYNO Monorepo Architecture Blueprint
- **apps/**: NestJS core API + React Native clients + Next.js portals
- **services/**: Fastify search + Python ML + Rust optimization
- **packages/**: Shared TypeScript domain models & Zod schemas
- **algorithms/**: Compiled native Rust VRP solver
- **intelligence/**: Python LightGBM restock models
- **infrastructure/**: Terraform & Docker Compose environments`
  },
  {
    id: 'tests',
    name: 'tests/',
    type: 'folder',
    path: 'tests',
    tech: 'k6 / Jest / Playwright',
    badge: 'Quality & Load',
    description: 'End-to-end integration test suites, contract tests, and k6 load tests for sub-50ms search.',
    children: [
      { id: 'test-k6', name: 'k6_search_benchmark.js', type: 'file', path: 'tests/load/k6_search_benchmark.js', tech: 'k6', description: '2,000 RPS search benchmark verifying p95 latency stays under 50ms.' },
      { id: 'test-e2e', name: 'checkout_flow.spec.ts', type: 'file', path: 'tests/e2e/checkout_flow.spec.ts', tech: 'Playwright', description: 'Cross-app test verifying catalog search through M-Pesa payment and delivery.' }
    ],
    codePreview: `// tests/load/k6_search_benchmark.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '1m', target: 2000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<50'], // Must respond within 50ms at 2,000 RPS
    http_req_failed: ['rate<0.01']
  },
};

export default function () {
  const res = http.get('http://api:3000/api/v1/search?q=unga+wa+ugali');
  check(res, { 'status is 200': (r) => r.status === 200 });
}`
  }
];

export const RepositoryStructureExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tree' | 'modules' | 'dependency_graph' | 'cli' | 'indexing'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    apps: true,
    'apps-api': true,
    'apps-api-src': true,
    'apps-api-modules': false,
    services: true,
    packages: true,
    algorithms: true,
    intelligence: true,
    data: false,
    infrastructure: true,
    docs: false,
    tests: false
  });

  const [selectedItem, setSelectedItem] = useState<RepoItem>(REPO_TREE[0].children![0]);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    const traverse = (items: RepoItem[]) => {
      items.forEach(item => {
        if (item.children) {
          allExpanded[item.id] = true;
          traverse(item.children);
        }
      });
    };
    traverse(REPO_TREE);
    setExpandedNodes(allExpanded);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(selectedItem.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 18 Modules list for the domain mapping tab
  const eighteenModules = [
    { name: 'Identity', tech: 'JWT / SMS OTP', path: 'apps/api/src/modules/identity', desc: 'Phone-based auth, KYC tier verification, role-based access control (RBAC).' },
    { name: 'Retailers', tech: 'PostgreSQL', path: 'apps/api/src/modules/retailers', desc: 'Duka merchant profiles, credit scoring, transaction frequency history.' },
    { name: 'Shops', tech: 'PostGIS', path: 'apps/api/src/modules/shops', desc: 'Branch coordinates, geofences, operating schedules, zone corridor binding.' },
    { name: 'Wholesalers', tech: 'Depot SLA Engine', path: 'apps/api/src/modules/wholesalers', desc: 'Eastleigh & Industrial Area depot SLAs, prep countdowns, fulfillment scoring.' },
    { name: 'Products', tech: 'Canonical Catalogue', path: 'apps/api/src/modules/products', desc: 'Master FMCG SKUs, barcodes, RRP, manufacturer brand index.' },
    { name: 'Catalogue', tech: 'Redis Caching', path: 'apps/api/src/modules/catalogue', desc: 'Distributor price tiers, bulk discounts, real-time inventory quantity feeds.' },
    { name: 'Search', tech: 'Fastify / BM25', path: 'apps/api/src/modules/search', desc: 'Sub-50ms search with Sheng synonyms, Damerau-Levenshtein typo correction.' },
    { name: 'Cart', tech: 'Redis Session', path: 'apps/api/src/modules/cart', desc: 'Persistent multi-search basket, MOQ threshold enforcement, multi-depot split.' },
    { name: 'Orders', tech: '10-State FSM', path: 'apps/api/src/modules/orders', desc: 'Deterministic state machine orchestrator from PENDING to DELIVERED.' },
    { name: 'Payments', tech: 'Daraja M-Pesa', path: 'apps/api/src/modules/payments', desc: 'Safaricom Daraja STK push, idempotency keys, Paybill callback reconciliation.' },
    { name: 'Fulfillment', tech: 'WebSocket Queue', path: 'apps/api/src/modules/fulfillment', desc: 'Wholesaler pick-and-pack fulfillment boards, inventory reserve holds.' },
    { name: 'Riders', tech: 'Fleet Telemetry', path: 'apps/api/src/modules/riders', desc: 'Boda-boda courier roster, capacity constraints (40kg/60L), shift tracking.' },
    { name: 'Delivery', tech: 'Corridor Routing', path: 'apps/api/src/modules/delivery', desc: 'Dynamic corridor fees (Zone 1 ≤3km KES 50, Zone 2 ≤6km KES 120), OTP handshake.' },
    { name: 'Notifications', tech: 'Africa\'s Talking', path: 'apps/api/src/modules/notifications', desc: 'Automated SMS, WhatsApp order updates, and delivery ETA alerts.' },
    { name: 'Pricing', tech: 'Dynamic Margin Engine', path: 'apps/api/src/modules/pricing', desc: 'Duka gross profit margins, bulk volume discounts, brand rebate logic.' },
    { name: 'Events', tech: 'Kafka / Redis Bus', path: 'apps/api/src/modules/events', desc: 'Immutable audit telemetry streaming order mutations and inventory state.' },
    { name: 'Analytics', tech: 'OLAP / ClickHouse', path: 'apps/api/src/modules/analytics', desc: 'Unmet demand tracking, zero-result telemetry, FMCG brand market share.' },
    { name: 'Administration', tech: 'Admin Gateway', path: 'apps/api/src/modules/administration', desc: 'Admin Operations console, manual state overrides, audit trail logs.' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-md p-4 text-slate-900 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">
                  WAYNO Monorepo Architecture Blueprint
                </h2>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  Production Monorepo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-package monorepo unifying 5 client applications, 3 autonomous services, native Rust algorithms, Python ML pipelines, and infrastructure.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-700">
              Root: <strong className="text-slate-900 font-mono">wayno/</strong>
            </span>
          </div>
        </div>

        {/* Sub-Tabs: Interactive Tree, 18 Modules, Dependency Graph, CLI Terminal */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-100 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'tree'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Repository Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'modules'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>18 Core Backend Modules</span>
            <span className="text-[10px] bg-emerald-900 text-emerald-300 px-1.5 py-0.2 rounded font-mono">18</span>
          </button>

          <button
            onClick={() => setActiveTab('dependency_graph')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'dependency_graph'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Monorepo Dependency Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cli'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Turborepo & CLI Commands</span>
          </button>

          <button
            onClick={() => setActiveTab('indexing')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'indexing'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Database & PostGIS Indexing</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              activeTab === 'indexing' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
            }`}>
              22 Indexes
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive Repository Tree View */}
      {activeTab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Interactive Tree View */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Folder className="w-4 h-4 text-amber-500" />
                <span>wayno /</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAll}
                  className="text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
                >
                  Expand all
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={collapseAll}
                  className="text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
                >
                  Collapse all
                </button>
              </div>
            </div>

            <div className="space-y-1 font-mono text-xs select-none max-h-[600px] overflow-y-auto pr-1">
              {REPO_TREE.map((rootItem) => {
                const hasChildren = rootItem.children && rootItem.children.length > 0;
                const isExpanded = expandedNodes[rootItem.id];
                const isSelected = selectedItem.id === rootItem.id;

                return (
                  <div key={rootItem.id} className="space-y-0.5">
                    {/* Level 1: Root directory */}
                    <div
                      onClick={() => {
                        if (hasChildren) toggleNode(rootItem.id);
                        setSelectedItem(rootItem);
                      }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        {hasChildren ? (
                          isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )
                        ) : (
                          <span className="w-3.5" />
                        )}
                        <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-300' : 'text-amber-500'}`} />
                        <span className="truncate">{rootItem.name}</span>
                      </div>
                      {rootItem.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-semibold shrink-0 ${
                          isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {rootItem.badge}
                        </span>
                      )}
                    </div>

                    {/* Level 2: Child directories and files */}
                    {hasChildren && isExpanded && (
                      <div className="pl-4 border-l border-slate-200 ml-2 space-y-0.5 my-0.5">
                        {rootItem.children!.map((child) => {
                          const childHasChildren = child.children && child.children.length > 0;
                          const isChildExpanded = expandedNodes[child.id];
                          const isChildSelected = selectedItem.id === child.id;

                          return (
                            <div key={child.id} className="space-y-0.5">
                              <div
                                onClick={() => {
                                  if (childHasChildren) toggleNode(child.id);
                                  setSelectedItem(child);
                                }}
                                className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                  isChildSelected
                                    ? 'bg-slate-900 text-white font-bold'
                                    : 'hover:bg-slate-100 text-slate-600'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 truncate">
                                  {childHasChildren ? (
                                    isChildExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                    )
                                  ) : (
                                    <span className="w-3" />
                                  )}
                                  {child.type === 'folder' ? (
                                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isChildSelected ? 'text-amber-300' : 'text-amber-500'}`} />
                                  ) : (
                                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isChildSelected ? 'text-blue-300' : 'text-blue-500'}`} />
                                  )}
                                  <span className="truncate">{child.name}</span>
                                </div>
                                {child.tech && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-medium shrink-0 ${
                                    isChildSelected ? 'bg-slate-800 text-emerald-300 font-semibold' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {child.tech}
                                  </span>
                                )}
                              </div>

                              {/* Level 3: Deep nested elements (e.g. apps/api/src/modules) */}
                              {childHasChildren && isChildExpanded && (
                                <div className="pl-4 border-l border-slate-200 ml-2 space-y-0.5 my-0.5">
                                  {child.children!.map((grandChild) => {
                                    const grandChildHasChildren = grandChild.children && grandChild.children.length > 0;
                                    const isGrandChildExpanded = expandedNodes[grandChild.id];
                                    const isGrandChildSelected = selectedItem.id === grandChild.id;

                                    return (
                                      <div key={grandChild.id} className="space-y-0.5">
                                        <div
                                          onClick={() => {
                                            if (grandChildHasChildren) toggleNode(grandChild.id);
                                            setSelectedItem(grandChild);
                                          }}
                                          className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                                            isGrandChildSelected
                                              ? 'bg-slate-900 text-white font-bold'
                                              : 'hover:bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          <div className="flex items-center space-x-1.5 truncate">
                                            {grandChildHasChildren ? (
                                              isGrandChildExpanded ? (
                                                <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                              ) : (
                                                <ChevronRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                              )
                                            ) : (
                                              <span className="w-2.5" />
                                            )}
                                            {grandChild.type === 'folder' ? (
                                              <Folder className={`w-3 h-3 shrink-0 ${isGrandChildSelected ? 'text-amber-300' : 'text-amber-500'}`} />
                                            ) : (
                                              <FileCode className={`w-3 h-3 shrink-0 ${isGrandChildSelected ? 'text-blue-300' : 'text-blue-500'}`} />
                                            )}
                                            <span className="truncate">{grandChild.name}</span>
                                          </div>
                                          {grandChild.tech && (
                                            <span className={`text-[9px] px-1 py-0.2 rounded font-sans ${
                                              isGrandChildSelected ? 'bg-slate-800 text-emerald-300' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                              {grandChild.tech}
                                            </span>
                                          )}
                                        </div>

                                        {/* Level 4: 18 Modules leaf nodes */}
                                        {grandChildHasChildren && isGrandChildExpanded && (
                                          <div className="pl-3 border-l border-slate-200 ml-2 space-y-0.5 my-0.5">
                                            {grandChild.children!.map((leaf) => {
                                              const isLeafSelected = selectedItem.id === leaf.id;
                                              return (
                                                <div
                                                  key={leaf.id}
                                                  onClick={() => setSelectedItem(leaf)}
                                                  className={`flex items-center justify-between px-2 py-0.5 rounded cursor-pointer text-[11px] ${
                                                    isLeafSelected ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
                                                  }`}
                                                >
                                                  <div className="flex items-center space-x-1.5 truncate">
                                                    <Folder className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                                    <span className="truncate">{leaf.name}</span>
                                                  </div>
                                                  {leaf.tech && (
                                                    <span className="text-[9px] text-slate-400 font-sans">{leaf.tech}</span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Node Inspector & Code Manifest */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {selectedItem.path}
                    </span>
                    {selectedItem.tech && (
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        {selectedItem.tech}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedItem.description}
                  </p>
                </div>

                <button
                  onClick={handleCopyPath}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Path'}</span>
                </button>
              </div>

              {/* Code / Manifest Preview */}
              {selectedItem.codePreview ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-t border-t border-x border-slate-200">
                    <span>Source Code / Configuration Preview</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Production Ready</span>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-b text-xs font-mono overflow-x-auto leading-relaxed border-b border-x border-slate-900 max-h-96">
                    {selectedItem.codePreview}
                  </pre>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500 italic p-6 bg-slate-50 rounded border border-slate-200 text-center space-y-2">
                  <Package className="w-6 h-6 mx-auto text-slate-400" />
                  <p>Directory path: <strong>{selectedItem.path}</strong></p>
                  <p className="text-[11px] text-slate-400">Click on sub-files or packages in the tree to inspect their manifests and source implementations.</p>
                </div>
              )}
            </div>

            {/* Quick Monorepo Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded shadow-2xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>NestJS Core API</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Single backend orchestrating all 18 domain modules with PostgreSQL HA and Redis clusters.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded shadow-2xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>React Native & Next.js</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  React Native for Retailer & Rider mobile apps; Next.js for Wholesaler & Admin dashboards.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-3 rounded shadow-2xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  <span>Rust & Python ML</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sub-millisecond Rust VRP vehicle routing paired with Python LightGBM restock models.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 18 Backend Modules Domain Matrix */}
      {activeTab === 'modules' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                18 Core Backend Modules (apps/api/src/modules/)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each domain capability is implemented as a standalone NestJS module with dedicated controllers, services, entities, and event publishers.
              </p>
            </div>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-bold">
              18/18 Modules Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {eighteenModules.map((mod, idx) => (
              <div key={mod.name} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-xs transition-all bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{mod.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                    {mod.tech}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mb-1.5 truncate">
                  {mod.path}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Monorepo Dependency Graph */}
      {activeTab === 'dependency_graph' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monorepo Workspace Dependency Graph
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Internal pnpm workspace links (`workspace:*`) and inter-service RPC protocols.
              </p>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded font-bold">
              pnpm Workspaces + Turborepo
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
            <div className="text-slate-400 mb-2">// Inter-Package Dependency Flow</div>
            <pre>{`apps/retailer (React Native)  ───► @wayno/api-client ───► apps/api (NestJS)
apps/rider (React Native)     ───► @wayno/api-client ───► apps/api (NestJS)
apps/wholesaler (Next.js)     ───► @wayno/api-client ───► apps/api (NestJS)
apps/admin (Next.js)          ───► @wayno/api-client ───► apps/api (NestJS)

apps/api (NestJS)
  ├── Imports: @wayno/types, @wayno/validation, @wayno/config
  ├── RPC to: services/search (Fastify BM25 engine on :3001)
  ├── RPC to: services/intelligence (Python FastAPI LightGBM on :8000)
  └── FFI to: algorithms/rust (Native Rust VRP solver crate)`}</pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900">@wayno/types</span>
              <p className="text-[11px] text-slate-500 mt-1">Shared domain entities, TypeScript enums, order states.</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900">@wayno/validation</span>
              <p className="text-[11px] text-slate-500 mt-1">Zod runtime schemas for M-Pesa STK, phone formatting, orders.</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900">@wayno/api-client</span>
              <p className="text-[11px] text-slate-500 mt-1">Isomorphic client SDK used by mobile & web frontends.</p>
            </div>
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900">@wayno/config</span>
              <p className="text-[11px] text-slate-500 mt-1">Shared ESLint, Tailwind tokens, and TSConfig presets.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Turborepo & CLI Commands */}
      {activeTab === 'cli' && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monorepo Build & Development CLI Commands
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard Turborepo pipeline commands for local development, CI testing, and container deployment.
              </p>
            </div>
            <span className="text-xs font-mono bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded font-bold">
              Turborepo Pipeline
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Turbo dev */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>1. Start entire development stack</span>
                <span className="text-emerald-400 font-sans text-xs">Local Dev</span>
              </div>
              <div className="text-emerald-300 font-bold">$ pnpm turbo run dev</div>
              <p className="text-slate-400 font-sans text-[11px]">Boots NestJS API (:3000), Wholesaler (:3001), Admin (:3002), and Metro bundler.</p>
            </div>

            {/* Docker Compose */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>2. Boot PostgreSQL PostGIS, Redis & Kafka</span>
                <span className="text-blue-400 font-sans text-xs">Docker Infrastructure</span>
              </div>
              <div className="text-blue-300 font-bold">$ docker compose -f infrastructure/docker/docker-compose.yml up -d</div>
              <p className="text-slate-400 font-sans text-[11px]">Launches PostgreSQL with PostGIS extension on 5432, Redis on 6379, and Kafka brokers.</p>
            </div>

            {/* Rust algorithm tests */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>3. Test high-performance Rust VRP solver</span>
                <span className="text-amber-400 font-sans text-xs">Rust Algorithms</span>
              </div>
              <div className="text-amber-300 font-bold">$ cargo test --manifest-path algorithms/rust/Cargo.toml --release</div>
              <p className="text-slate-400 font-sans text-[11px]">Validates sub-millisecond Boda-boda corridor route optimization and 3D knapsack capacity.</p>
            </div>

            {/* Python ML training */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>4. Train LightGBM duka restock model</span>
                <span className="text-pink-400 font-sans text-xs">Python Intelligence</span>
              </div>
              <div className="text-pink-300 font-bold">$ poetry run python intelligence/python/train_demand_model.py</div>
              <p className="text-slate-400 font-sans text-[11px]">Ingests historical duka orders and outputs restock regression weights into models/.</p>
            </div>

            {/* k6 load test */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>5. Run 2,000 RPS Search Benchmark</span>
                <span className="text-cyan-400 font-sans text-xs">k6 Load Testing</span>
              </div>
              <div className="text-cyan-300 font-bold">$ k6 run tests/load/k6_search_benchmark.js</div>
              <p className="text-slate-400 font-sans text-[11px]">Asserts p95 latency under 50ms at 2,000 concurrent RPS with zero dropped requests.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Database & PostGIS Indexing Architecture */}
      {activeTab === 'indexing' && (
        <DatabaseIndexingConsole />
      )}
    </div>
  );
};

