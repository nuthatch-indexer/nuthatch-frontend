---
title: "Upgrading a nest"
description: "nest diff + nest upgrade — the N-1 problem solved (RFC-0020)."
order: 5
---

The N-1 problem is the subgraph resync tax: version N is live, version N+1 needs days of backfill,
and consumers eat downtime or stale data during the flip. nuthatch solves it with two commands and
one classification.

## Classify first: `nest diff`

```sh
nuthatch nest diff ./current ./proposed
```

Compares two versions (nest directories or `schema.json` paths) and classifies the update:

- **Compatible** — additive only: new tables, new columns, new views. Nothing a current consumer
  reads changes shape. Safe to hot-swap on the same endpoint.
- **Breaking** — any consumer-observable change: a renamed or removed table/column, a changed type.
  Needs a new endpoint; the old one must live through a deprecation window.

## Compatible: the zero-downtime flip

```sh
nuthatch nest upgrade --to ./new-version
```

The old version keeps serving on its address while the new version indexes concurrently beside it.
When the new one catches up to the tip, the endpoint **atomically flips** to the new backing — the
served address never changes, and no request is dropped mid-flight. If the update's decode is
unchanged (views-only, semantics-only), the new version **mounts the old version's sealed
segments** instead of re-backfilling — the content addresses prove they're valid, so the "upgrade"
costs seconds, not days.

A breaking update is *refused* by this path. That's the guard working, not a bug.

## Breaking: two versions, one listener

For a breaking change, `nest upgrade` serves both:

- The **old** version stays at the root — unchanged, so current consumers keep working — but every
  response now carries `Deprecation: true` and a `Link: <…>; rel="successor-version"` header
  (RFC 8594, so tooling can see it coming).
- The **new** version is served under a prefix (`--new-endpoint`, default `/next`).

Both index concurrently; neither flips. Consumers migrate on their own clock, then you sunset the
old endpoint. The deprecation signal is standards-shaped precisely so downstream dashboards and
clients can automate the move.

## Where versions come from

Upgrades compose with [the registry](/docs/operate/registry/): `nest load name@version` prepares
the new version's directory, `nest diff` classifies it, `nest upgrade --to` performs it. Versions
are content-addressed, so what you diffed is exactly what you flipped to.
