---
title: Webhooks
description: POST sealed rows to a URL — an optional delivery stage, past finality, at-least-once.
order: 8
---

A webhook pushes rows out to a URL as they're indexed — feed a downstream service, a queue, a Slack
channel. It's an optional stage: configure one and rows flow; configure none and the nest is a plain
indexer. Unconfigured, it **warns and skips** rather than failing.

## The shape

```toml
[[webhooks]]
name = "ops"
url = "https://your-service/hooks/usdc"
table = "usdc__transfer"     # rows from this table
when = "value_dec > 0"        # optional SQL predicate — only matching rows
```

Repeat `[[webhooks]]` for each destination. A webhook can carry a `when` predicate so you deliver only the
rows you care about, and it's referenced by `name` from [compliance alerts](/docs/build/compliance/).

## Delivered past finality

Webhooks fire on **sealed** rows — past finality, when history is immutable. That's deliberate: a row
delivered before finality could be un-emitted by a reorg, forcing you to chase it with a retraction on the
consumer side. By firing only past finality, nuthatch delivers rows that will never roll back.

> The tradeoff is latency: a webhook trails the tip by the chain's finality distance. If you need
> tip-latency reads, query the [live HTTP surface](/docs/operate/serving/) or subscribe over the
> [MCP](/docs/ai/mcp/) instead — those see the hot store; webhooks are for durable downstream delivery.

## At-least-once, host-owned

Delivery is at-least-once with host-managed retries and backoff — the host owns orchestration and state,
the same contract as every effectful stage. Make your consumer **idempotent**: key on `(tx_hash,
log_index)` (or `_seq`) and a redelivery is a no-op. On restart, delivery resumes from the last
acknowledged seal, so a crash mid-batch doesn't drop rows.

## Not in the decode path

The POST is an effect, so it lives **after** sealing, never inside decode or entity derivation. A slow or
failing endpoint can't stall or corrupt indexing — it only backs up its own delivery queue. This is the
same purity rule that governs enrichers and alerts (see [Determinism](/docs/concepts/determinism/)).

## Next

- [Compliance pack](/docs/build/compliance/) — alerts ride this delivery path
- [Serving](/docs/operate/serving/) — the tip-latency alternative
- [Determinism](/docs/concepts/determinism/) — why effects sit outside the core
