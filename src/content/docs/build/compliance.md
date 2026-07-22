---
title: Compliance pack
description: Optional screening, flags, and alerts — an add-on stage over decoded rows, warn-and-skip.
order: 7
---

Some nests need more than raw rows: screen addresses against a list, flag rows that match a rule, raise
an alert when something crosses a threshold. The **compliance pack** is an optional stage over your
decoded tables — off by default, and, like every optional integration, it **warns and skips** when it
isn't configured rather than failing the nest.

> This is the liminal graceful-degradation pattern: an optional sink that isn't wired up logs a warning
> and carries on. A nest never fails because a stage you didn't ask for wasn't set up.

## The shape

```toml
[screening]
lists = ["lists/sanctioned.txt"]   # newline-delimited addresses, local files
columns = ["from", "to"]           # which address columns to screen

[[flags]]
name = "large_transfer"
table = "usdc__transfer"
when = "value_dec > 1000000000000"  # a SQL predicate over the row

[[alerts]]
on = "large_transfer"               # a flag name
webhook = "ops"                     # a named webhook (see Webhooks)
```

- **`[screening]`** — match address columns against local lists. Screened rows carry a derived flag; the
  lists are ordinary local files (no third-party data service, no phone-home).
- **`[[flags]]`** — a named SQL predicate over a table. Matching rows are tagged, queryable like any
  column, and described in the [semantic layer](/docs/build/semantic/).
- **`[[alerts]]`** — when a flag fires, notify. Alerts ride the [webhook](/docs/build/webhooks/) delivery
  path, so they inherit its at-least-once, past-finality delivery.

## Determinism holds

Screening and flags are deterministic derivations over decoded rows — a SQL predicate and a local-list
match, nothing that phones out mid-decode. They're re-executable: the same blocks always produce the same
flags. Effectful notification (the alert POST) happens **after** sealing, never in the decode path — the
same rule as webhooks and enrichers (see [Determinism](/docs/concepts/determinism/)).

## Local-first, no data dependency

Lists are local files you control. Nuthatch never reaches for a gated screening service — that would
break the [no-phone-home non-negotiable](/docs/concepts/determinism/). Bring your own list; update it
like any file.

## Next

- [Webhooks](/docs/build/webhooks/) — where alerts are delivered
- [The semantic layer](/docs/build/semantic/) — describe what a flag means
- [nuthatch.toml](/docs/build/config/) — where the stage is configured
