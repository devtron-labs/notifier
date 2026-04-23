# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Notifier is Devtron's multi-channel notification service. It receives CI/CD pipeline events (via NATS JetStream or HTTP) and dispatches notifications to Slack, email (SES/SMTP), and webhooks. Built with TypeScript, Express, TypeORM (PostgreSQL), and NATS.

## Build & Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Dev server with nodemon (auto-reload)
npm run dev:debug        # Dev server with --inspect debugger
npm run build-ts         # Compile TypeScript to dist/
npm run serve            # Run compiled JS from dist/
npm test <file>          # Run a single test file, e.g.: npm test src/tests/notificationService.test.ts
```

Requires Node.js >= 20. TypeScript strict mode is enabled but `noImplicitAny` and `strictNullChecks` are off.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_USER | user | PostgreSQL username |
| DB_PWD | password | PostgreSQL password |
| DB | orchestrator | Database name |
| PORT | 3000 | HTTP server port |
| NATS_URL | (none) | NATS server URL; NATS disabled if unset |
| BASE_URL | (none) | Base URL for links embedded in notifications |

## Architecture

### Entry Point & Startup

`src/server.ts` → connects to PostgreSQL (TypeORM), initializes all services via `src/services/serviceInitializer.ts` (manual DI), connects to NATS, starts Express on PORT.

### Notification Flow

```
Event Source (NATS JetStream or POST /notify/v2)
  → NotificationService.sendNotificationV2()
    → Loads notification_settings + templates from DB
    → json-rules-engine evaluates filter conditions
    → Dispatches to matching Handler implementations:
        SlackService   → Slack webhook API (via notifme-sdk)
        SESService     → AWS SES (via notifme-sdk)
        SMTPService    → SMTP server (via notifme-sdk)
        WebhookService → HTTP POST to user-configured URLs (via axios)
    → Logs results to notifier_event_logs table
```

### Handler Interface

All destination handlers implement `Handler` (defined in `src/notification/service/notificationService.ts`) with:
- `handle(event, templates, setting, configsMap, destinationMap)` — orchestrates a single notification send
- `sendNotification(event, sdk, template)` — performs the actual send

### Template System

Mustache templates live in `src/templates/{slack,ses,smtp}/{CI,CD,BASE}/`. Files are named by `EVENT_TYPE` enum value (e.g., `1.mustache` for Trigger). `TemplateLoader` reads them at startup. `MustacheHelper` parses raw events into typed objects with boolean flags for conditional template rendering.

### Event Types (`src/common/types.ts`)

1=Trigger, 2=Success, 3=Fail, 4=Approval, 5=ConfigApproval, 6=Blocked, 7=ImagePromotion, 8=ImageScan, 9=ScoopNotification, 10=DeploymentApproved, 11=ConfigApproved, 12=PromotionApproved, 13=DeploymentCancelled, 14=ConfigCancelled, 15=PromotionCancelled

### Key Directories

- `src/notification/service/` — core NotificationService orchestration
- `src/destination/destinationHandlers/` — channel-specific handlers (Slack, SES, SMTP, Webhook)
- `src/entities/` — TypeORM entity models (notification_settings, slack_config, smtp_config, ses_config, webhook_config, events, users, notifier_event_logs)
- `src/repository/` — data access layer wrapping TypeORM
- `src/common/` — shared types, MustacheHelper (event parsing), EventLogBuilder, Prometheus metrics
- `src/templates/` — Mustache templates organized by channel and pipeline type
- `src/config/` — database, NATS, and logger configuration
- `src/pubSub/` — NATS JetStream client

### Dependency Injection

Manual constructor injection in `src/services/serviceInitializer.ts`. No DI framework — all repositories, helpers, and handlers are instantiated explicitly and wired together.

## Testing

Tests use Mocha + Chai (BDD style) in `src/tests/`. The custom test runner (`test.ts`) accepts a single file path:

```bash
npm test src/tests/notificationService.test.ts
npm test src/tests/approvalTemplateTest.ts
```

Tests are standalone files — no shared setup/teardown infrastructure.
