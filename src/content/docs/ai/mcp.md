---
title: "Agent-grade MCP"
description: "Drive nuthatch from an agent — fully offline against the local instance."
order: 1
---

A nest isn't just queryable by you — it's queryable by your agent, with the same two-minute setup.
The MCP server is built into the binary, talks only to your local instance, and sends nothing
anywhere: no keys, no telemetry, no third-party data API in the loop.

## Wire it up in one step

With a nest running (`nuthatch dev`):

```sh
nuthatch mcp --print-config
```

This prints a ready-to-paste Claude Code `.mcp.json` and the equivalent `claude mcp add` one-liner.
Any MCP client works the same way: the server speaks stdio and bridges to the running instance.
Then ask questions:

> "What were the ten largest transfers this week, and were any of the senders flagged?"

## Built agent-grade, not agent-tolerant

The difference between an MCP that demos well and one an agent can *work* with is a set of
deliberate choices (RFC-0016):

- **Meaning travels with the schema.** The `schema` tool composes the decode registry with the
  authored [semantic layer](/docs/build/semantic/) — what each table *means*, its grain, and its
  footguns — so the agent doesn't guess what `value` is or rediscover that `from` needs quoting.
- **Errors are prompts.** A failed query returns a fix hint computed from the real schema: the
  nearest table name, the quoting rule, the `_dec` column to use. The agent's next attempt is
  usually right.
- **Check before you spend.** `explain` validates a query — binds every table, column, and type —
  without executing it, so an agent iterates on shape cheaply and runs `sql` once.
- **Results are shaped for context windows.** The bridge caps rows (default 200) and returns
  compact tables, not JSON walls.
- **Answers carry provenance.** Every result is stamped with the block range and content-addressed
  segments it came from — an agent can cite a figure, and `verify-a-number` (a built-in prompt)
  re-derives one from scratch.

The tool-by-tool surface — plus the resources and the built-in prompts — is in the
[MCP reference](/docs/reference/mcp/). The quality bar is held by an eval harness that scores real
agent sessions against the surface, so regressions in agent experience fail like any other test.

For the authoring side — an agent *building* nests rather than querying one — see
[The builder skill](/docs/ai/builder-skill/).
