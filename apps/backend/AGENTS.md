# Agent instructions — `apps/backend/`

**Before writing any code in this folder, read [`docs/backend/07-IMPLEMENTATION_GUIDE.md`](../../docs/backend/07-IMPLEMENTATION_GUIDE.md)** then `01-PRD.md`, `02-ARCHITECTURE.md`, and `06-STATE_MACHINE.md`. They are the AI-handoff briefing.

## Hard rules

- **Validation**: Zod schemas + `nestjs-zod`. Never `class-validator`.
- **Money**: `BigInt` minor units + `Char(3)` currency. Never `Decimal` or float. Use `src/shared/money/money.ts`.
- **Soft delete**: explicit `deletedAt` filters in services. No Prisma middleware.
- **Pagination**: cursor only. Never offset.
- **State transitions**: pure `nextStatus()` function (`order.entity.ts`). Side effects belong in `OrdersService`.
- **Idempotency**: every POST that creates a resource takes `Idempotency-Key`. 24h TTL.
- **Errors**: throw `HttpException` (or domain errors mapped by `AllExceptionsFilter`) with a `code` from `@mawared/shared-types`. Output is RFC 7807 problem+json.
- **Logging**: Pino JSON. Don't add raw `console.log`. Don't log secrets — extend the redact paths in `logger.module.ts` if you add new sensitive fields.

## Workflow

1. Pick the next task from `docs/backend/04-ROADMAP.md`.
2. Read the relevant ADR in `05-DECISIONS.md` if your change touches an architectural choice.
3. Write code + unit tests first. Add integration tests for anything touching Prisma or queues.
4. Run `pnpm lint && pnpm typecheck && pnpm test:unit` before opening a PR.
5. Regenerate the OpenAPI spec with `pnpm openapi:generate` and commit `openapi.json` if your API surface changed.

## Adding a new module

Mirror the layout of `src/modules/orders/`:

```
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts        # ONLY for aggregates (Order, Worker)
├── <feature>.entity.ts            # ONLY for aggregates with invariants
├── dto/
│   ├── <input>.dto.ts             # Zod schema + `createZodDto`
│   └── <response>.dto.ts
└── *.spec.ts
```

Simple modules (catalog, branches, lookups) skip the repository / entity layers — call `PrismaService` directly from the service.

## What NOT to do

- Don't add a generic `BaseService<T>` or `BaseRepository<T>` abstraction.
- Don't add a service mesh, microservice, Kafka, or service-discovery layer.
- Don't reach for Redis-based distributed locks. Use Postgres advisory locks for reservations.
- Don't migrate inside `main.ts` — pre-deploy hook only (`infra/railway.toml`).
- Don't process Stripe webhooks synchronously — persist + ACK + enqueue.

## Where to ask

If the docs don't answer the question, propose an ADR in `docs/backend/05-DECISIONS.md` as part of your PR.
