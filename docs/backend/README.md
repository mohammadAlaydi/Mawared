# Mawared Backend — Documentation Index

This folder is the single source of truth for the Mawared International backend. Read in order if you're new; jump straight to what you need if you're not.

| # | Document | What it covers | Audience |
|---|----------|----------------|----------|
| 01 | [PRD.md](./01-PRD.md) | Vision, users, scope, non-goals, KPIs, user stories, feature breakdown | Founders, PMs, all engineers |
| 02 | [ARCHITECTURE.md](./02-ARCHITECTURE.md) | System diagram, monorepo layout, module boundaries, auth, payments, storage, real-time, observability, testing, CI/CD, AWS migration | Backend engineers |
| 03 | [SCHEMA.prisma](./03-SCHEMA.prisma) | First-pass Prisma schema with full DDL, enums, indexes, money handling, soft-delete | Backend engineers, DBAs |
| 04 | [ROADMAP.md](./04-ROADMAP.md) | Phased milestones (M0 → M5), dependencies, rough estimates, definition-of-done per phase | Founders, all engineers |
| 05 | [DECISIONS.md](./05-DECISIONS.md) | Architecture Decision Records — every locked-in choice with rationale | Anyone joining the team |

## Locked-in stack (don't re-debate without an ADR)

- **Backend**: NestJS 10 (TypeScript 5, Node 20 LTS)
- **Database**: PostgreSQL 16 + Prisma 5
- **Cache / queues**: Redis 7 (BullMQ for jobs)
- **API contract**: REST + OpenAPI 3.1 (code-first via `@nestjs/swagger`)
- **Auth**: Custom phone-OTP (Twilio) + JWT (RS256 access, opaque rotated refresh)
- **Payments**: Stripe (single provider for v1, abstracted)
- **Storage**: Cloudflare R2 via AWS S3 SDK v3 (S3-compatible)
- **Push**: Firebase Cloud Messaging
- **Observability**: Pino (JSON logs) + Sentry + UptimeRobot
- **Deployment**: Railway → AWS (ECS Fargate + RDS + ElastiCache + CloudFront)
- **Monorepo**: pnpm + Turborepo

## How to use this doc set in practice

- New backend engineer onboarding → read **01-PRD** then **02-ARCHITECTURE**, skim **03-SCHEMA**, glance at **05-DECISIONS**.
- Adding a new feature → check it fits in the PRD scope, then design against existing module boundaries in **02-ARCHITECTURE**.
- Making a load-bearing technical choice (new lib, new infra, new pattern) → add an entry to **05-DECISIONS** in the same PR.
- Estimating work → **04-ROADMAP** is the source of truth for sequencing.

---
**Owner**: Backend tech lead · **Last reviewed**: 2026-05-13 · **Status**: v1 — pre-implementation
