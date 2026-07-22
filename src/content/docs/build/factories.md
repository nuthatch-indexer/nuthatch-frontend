---
title: Factories
description: Index children a contract spawns at runtime — Uniswap pools, Safe proxies, any factory.
order: 5
---

Many protocols deploy contracts at runtime: Uniswap's factory spins up a pool per pair, a Safe factory
deploys a proxy per wallet. You can't list those addresses at `init` — they don't exist yet. A
**factory** tells nuthatch to discover them as they're created and index each child automatically.

## The shape

A factory is a **template** (the child's ABI + events) plus a **factory** rule (which event on the
parent announces a new child, and which field holds its address):

```toml
[[templates]]
name = "pool"
abi = "abis/uniswap-v3-pool.json"
events = ["Swap", "Mint", "Burn"]

[[factories]]
# When the factory contract emits PoolCreated, the `pool` field is a new child to index as a `pool`.
parent = "factory"
event = "PoolCreated"
address_field = "pool"
template = "pool"
start = "creation"        # index the child from its creation block
```

When the parent emits `PoolCreated`, nuthatch registers the address in that event's `pool` field as a new
`pool` child and starts decoding its `Swap`/`Mint`/`Burn` events from the creation block onward.

## One table, many children

All children of a template share one set of tables — `pool__swap`, `pool__mint`, `pool__burn` — no matter
how many pools exist. The [implicit `address` column](/docs/build/tables/) tells you which child each row
came from:

```sql
SELECT address AS pool, COUNT(*) AS swaps
FROM pool__swap
GROUP BY 1 ORDER BY swaps DESC;
```

## Discovery is deterministic

Child discovery is part of the deterministic decode path: the same blocks always discover the same
children in the same order, keyed off the parent's events. A reorg that un-emits a `PoolCreated` retracts
that child and its rows along with everything else — factories inherit the same reorg safety as any table
(see [Reorgs](/docs/concepts/reorgs/)).

## Runaway factories are bounded

A factory that discovers a vast number of children is exactly the kind of thing that could blow the
[≤2 GB per-cursor budget](/docs/concepts/roosts/). Discovery is bounded and observable per nest, and in a
[roost](/docs/operate/roosts/) one nest's runaway factory is isolated to its own cursor — it can't starve
a co-tenant.

## Next

- [ABIs, events &amp; tables](/docs/build/tables/) — the `address` column that distinguishes children
- [Reorgs](/docs/concepts/reorgs/) — how discovered children roll back
- [Recipes](/docs/build/recipes/) — e.g. `reserves` across all discovered pools
