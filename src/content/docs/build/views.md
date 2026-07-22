---
title: Authored SQL views
description: First-class authored logic — CREATE VIEWs over the tip ∪ sealed surface.
order: 3
---

A nest's **logic layer** is authored SQL: `CREATE VIEW` statements over your decoded tables, kept in the
nest's `views/` directory. This is where a nest computes derived answers — the difference between "a
table of raw events" and "a nest that answers a question."

## Where they live

`init` scaffolds a `views/` directory with a commented starter. Drop `*.sql` files in it; each is a
`CREATE VIEW` over your nest's tables. Views run against the **live tip ∪ sealed** DuckDB surface, so
they span all of history — hot and cold — seamlessly.

```sql
-- views/active_traders.sql
CREATE VIEW usdc_active_traders AS
SELECT lower("from") AS trader, COUNT(*) AS transfers, MAX(block_number) AS last_seen
FROM "usdc__transfer"
GROUP BY 1
ORDER BY transfers DESC;
```

Query it like any table: `nuthatch sql "SELECT * FROM usdc_active_traders LIMIT 20"`.

## Validated and drift-gated

Authored views aren't just dropped in and hoped over. They're a first-class layer:

- **Validated** — each view binds against the schema at load, so a column that moves out from under it
  is a loud `nuthatch check` failure, not a silent wrong number.
- **Described** — a view's meaning lives beside it in [`semantic.toml`](/docs/build/semantic/), surfaced
  through `/schema` and the MCP so an agent knows what it computes.
- **Drift-gated** — CI catches a view that no longer matches the schema.
- **Taught** — the builder skill teaches an agent to author them with real syntax, not hallucinated SQL.

## Not a core change

Views are read-only `CREATE VIEW`s over already-sealed segments and the hot snapshot. Nothing about them
touches the deterministic ingest → decode → seal path — they're a *query-time* layer. That's why they're
safe to add, edit, and iterate freely.

## Recipes are views

The [recipes](/docs/build/recipes/) library (`total_supply`, `balances`, `reserves`, …) is just a set of
first-party authored views. `nuthatch recipe add <name>` drops one into `views/` — read it, edit it,
extend it; it's ordinary SQL.

## Next

- [Recipes](/docs/build/recipes/) — derive contract reads with no eth_call
- [The semantic layer](/docs/build/semantic/) — describe what a view means
- [The SQL surface](/docs/reference/sql/) — the query engine underneath
