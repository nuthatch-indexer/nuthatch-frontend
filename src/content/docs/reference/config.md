---
title: "Configuration"
description: "nuthatch.toml and roost.toml, field by field."
order: 2
---

Three files, all TOML. `nuthatch.toml` is written by `init` and yours to edit; `semantic.toml` is
covered in [The semantic layer](/docs/build/semantic/); `roost.toml` mounts many nests. A nest
declaring a `schema_version` newer than the binary understands is rejected on load — the guard that
makes `init --from` and `nest load` safe.

## `nuthatch.toml`

```toml
[nest]
name = "usdc"                 # nest name (also the roost mount name)
chain = "mainnet"             # mainnet | arbitrum-one | base
chain_id = 1
rpc_urls = ["https://…"]      # tried in order, with failover
schema_version = 1            # managed by nuthatch

[[contracts]]                 # one or more
alias = "usdc"                # table prefix → usdc__transfer, usdc__approval, …
address = "0xA0b8…eB48"
start_block = 6082465         # optional; deployment block (init detects it)
abi = "abis/usdc.json"        # vendored ABI path, relative to the nest dir
events = ["Transfer"]         # optional allowlist; omit to decode every ABI event
```

The per-contract `events` allowlist is how a nest indexing e.g. GraphToken keeps only `Transfer`
instead of millions of irrelevant rows. A name the ABI doesn't define is a config error, caught at
registry build.

### Factories (RFC-0009)

```toml
[[templates]]
name = "pool"                 # shared table prefix for all discovered children
abi = "abis/pool.json"
filter = "topic0"             # optional: force the topic0-only backfill strategy

[[factories]]
watch = "factory"             # the *alias* of the watched contract (or a template, for nesting)
event = "PoolCreated"         # the announcing event
child_param = "pool"          # the event param holding the child's address
template = "pool"             # which [[templates]] the child uses
start = 12369621              # optional: ignore discoveries before this block
```

All children of one template share tables (`{template}__{event}`), distinguished by the implicit
`address` column. `filter = "topic0"` is a strategy override for templates known to have many
children; omit it for the automatic address-list → topic0 flip (around ~500 children). See
[Factories](/docs/build/factories/).

### Screening, flags, alerts (RFC-0008)

```toml
[screening]
lists = ["<list-hash>"]           # snapshot hashes from `nuthatch lists fetch`

[flags]                           # amounts are token BASE UNITS as decimal strings (i128)
threshold = "1000000000000"       # flag any single transfer ≥ this
velocity_amount = "5000000000000" # flag an address whose windowed outbound volume ≥ this
velocity_window = 7200            # window in BLOCKS (default 7200 ≈ 24h of 12s mainnet blocks)

[[alerts]]                        # route annotations to webhook sinks
kinds = ["sanction_hit", "threshold_flag"]
url = "https://…"
```

All three are opt-in: absent means no screening, no flags, no alerts, zero cost. Alert delivery is
at-least-once via a durable outbox; a stalled sink never blocks indexing. Note `velocity_window` is
a **block count**, not wall-clock — an honest approximation, since the chain has no clock.

### Webhooks (RFC-0010)

```toml
[[webhooks]]
name = "large-transfers"
table = "usdc__transfer"
where = "value_dec > 1000000"     # optional SQL predicate (note the key is `where`)
url = "https://…"
batch_max = 100                   # optional rows-per-POST cap
finality = "sealed"               # "sealed" (default — never lies) | "tip" (fast, may retract)
since = "registration"            # "registration" (default) | "genesis" | a block number
secret = "…"                      # optional; adds X-Nuthatch-Signature: sha256=<hex> (HMAC)
```

`since = "registration"` means a `--seal-direct` backfill won't fire history at your endpoint. See
[Webhooks](/docs/build/webhooks/).

## `roost.toml`

```toml
[roost]
name = "my-roost"
chain = "mainnet"
chain_id = 1
rpc_urls = ["https://…"]
nests = ["usdc", "weth"]      # subdirectories under nests/ to mount
max_rss_mb = 2048             # optional per-cursor RAM ceiling (default 2048)
```

See [Run a roost](/docs/operate/roosts/) for the multichain `[[chains]]` shape (RFC-0021).

## A note on `nest.star`

An earlier Starlark front-end (`nest.star`, RFC-0018 §2) could *compute* a nest's config. It is
**retired**: author nests in plain `nuthatch.toml`. The loader still evaluates a legacy `nest.star`
hermetically for backward compatibility, but don't write new ones.
