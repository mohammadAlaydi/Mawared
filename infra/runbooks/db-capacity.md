# Postgres at capacity runbook

## Symptoms

- API p95 latency spikes; `/readyz` flaps.
- Connection pool errors in logs: `PrismaClientKnownRequestError: Connection refused`.
- pg_stat_activity shows hundreds of `idle in transaction`.
- Disk usage > 80 % on the managed Postgres.

## Diagnose

1. Railway / RDS metrics: CPU, IOPS, connections, disk.
2. Connection count via direct psql (use `DIRECT_DATABASE_URL`, not PgBouncer):
   ```sql
   SELECT state, COUNT(*) FROM pg_stat_activity GROUP BY 1;
   ```
3. Slow queries (requires pg_stat_statements enabled):
   ```sql
   SELECT query, calls, mean_exec_time, total_exec_time
   FROM pg_stat_statements
   ORDER BY total_exec_time DESC LIMIT 20;
   ```
4. Lock contention:
   ```sql
   SELECT pid, age(clock_timestamp(), query_start), state, query
   FROM pg_stat_activity
   WHERE state <> 'idle' AND query_start < now() - interval '30s'
   ORDER BY query_start;
   ```

## Mitigate

### Pool exhausted

- Confirm DATABASE_URL has `pgbouncer=true&connection_limit=1`.
- Restart the api + worker services to reset stuck Prisma clients.
- Pre-deploy migration races on multi-replica deploys: see Railway pre-deploy command — ensure it uses `DIRECT_DATABASE_URL`.

### Long-running transaction

- Identify the PID from the lock query above.
- If safe: `SELECT pg_cancel_backend(<pid>);` (graceful) or `pg_terminate_backend(<pid>);` (forceful).
- Common offender: a forgotten `BEGIN` in a psql session. Avoid running ad-hoc migrations through long-lived sessions.

### Disk full

- Check the largest tables:
  ```sql
  SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) FROM pg_class
  WHERE relkind = 'r' ORDER BY pg_total_relation_size(oid) DESC LIMIT 20;
  ```
- Usual suspects: `AuditLog`, `StripeEvent`, `OtpAttempt`. Truncate older-than-90-days rows in a maintenance window.
- Provision more disk on Railway / RDS.

### Pathological query

- Identify from pg_stat_statements. Run `EXPLAIN ANALYZE` against staging.
- Common cause: missing index. Confirm `99_post_init_constraints/migration.sql` ran.
- Mitigation: temporarily disable the offending feature flag while we ship an index migration.

## Prevention

- Sentry alert rule: p95 db-query time > 200ms for 5 minutes.
- Nightly pg_stat_statements snapshot stored in `monitoring` schema for trend analysis.
- Schema-add migrations must include their index in the same PR.
