# v0.4.6 — migration crash fix

- Fix PostgreSQL syntax error in trial Roll Over usage backfill.
- The `COALESCE(..., 0)` closing parenthesis is now outside the `SELECT COUNT(DISTINCT ...)` subquery.
- Safe to deploy over the failed v0.4.5 migration; all schema changes use idempotent `IF NOT EXISTS` / update statements.
- Trial hard limits remain: max 2 successful Step 1 and max 2 Step 2 for trial organizations.
