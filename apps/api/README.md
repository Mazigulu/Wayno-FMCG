# Wayno Core API Service (NestJS)

Production-grade NestJS enterprise service handling the core B2B FMCG order lifecycle, authentication, event publishing, and ledger integration.

## Key Features
- **Order Lifecycle Orchestration**: Manages state transitions across `PENDING`, `CONFIRMED`, `PACKED`, `DISPATCHED`, and `DELIVERED`.
- **Event Bus Streaming**: Publishes domain events to Kafka / RabbitMQ event broker for downstream ingestion.
- **Role-Based Access Control**: Guarded endpoints for Retailers, Wholesalers, Riders, and Platform Admins.
- **Database**: PostgreSQL with connection pooling and Redis distributed cache.
