# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Requirements

- Node.js `>=20.0.0` (production runs Node 24 per Dockerfile)

## Commands

```bash
# Development
npm run dev          # Start with nodemon (watch mode)
npm run dev:debug    # Start with nodemon + Node inspector
npm start            # Run via ts-node directly

# Build
npm run build-ts     # Compile TypeScript to dist/
npm run serve        # Run compiled output from dist/

# Tests
npm test             # Run test suite via ts-node test.ts
```

## Architecture

This is a **notification microservice** for the Devtron CD platform. It receives CI/CD pipeline events and routes them to notification channels (Slack, Email via SMTP/SES, Webhooks).

### Request Flow

1. Events arrive either via HTTP (`POST /notify/v2`) or NATS JetStream subscription
2. `NotificationService` (`src/notification/service/`) routes events to per-channel handlers
3. Handlers use Mustache templates (`config/slack-template.yaml`, `config/email-template.yaml`) to render messages
4. `NotifierEventLog` entries are written to PostgreSQL for audit

### Key Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Entry point | `src/server.ts` | DB connect, NATS connect, Express startup |
| DI/init | `src/services/serviceInitializer.ts` | Wires repositories and handlers together |
| Core service | `src/notification/service/notificationService.ts` | Orchestrates event → handler routing |
| Handlers | `src/destination/destinationHandlers/` | SlackService, SMTPService, SESService, WebhookService |
| Data access | `src/repository/` | TypeORM repositories for all entities |
| Entities | `src/entities/` | TypeORM models (NotificationSettings, configs, logs) |
| PubSub | `src/pubSub/` | NATS JetStream consumer |
| Common | `src/common/` | MustacheHelper, metrics, EventLogBuilder |

### HTTP Endpoints

- `GET /health` — health check
- `GET /metrics` — Prometheus metrics
- `POST /notify/v2` — primary notification API (request body: `{ event, notificationSettings }`)
- `POST /notify` — deprecated legacy endpoint

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | user | PostgreSQL user |
| `DB_PWD` | password | PostgreSQL password |
| `DB` | orchestrator | Database name |
| `PORT` | 3000 | HTTP listen port |
| `NATS_URL` | — | NATS server URL (optional; NATS is skipped if unset) |

### Database

TypeORM connects to PostgreSQL database `orchestrator`. ORM config is in `ormconfig.json`.

### Notification Channels

Each channel has a config entity, a TypeORM repository, and a handler service:
- **Slack** — webhook-based via `notifme-sdk`
- **SMTP** — direct email via `notifme-sdk`
- **SES** — AWS SES email via `notifme-sdk`
- **Webhook** — arbitrary HTTP POST via `axios`

### Event Types

`EventTypeId` enum: Trigger (1), Success (2), Fail (3), Approval (4), ConfigApproval (5), Blocked (6), ImagePromotion (7), ImageScan (8), ScoopNotification (9)
