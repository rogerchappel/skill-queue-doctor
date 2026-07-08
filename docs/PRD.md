# Product Requirements

## Goal

Give agent builders a local-first way to diagnose empty or stale skill-factory idea queues and draft replenishment candidates.

## Non-goals

- No GitHub API access.
- No automatic movement between idea lanes.
- No automated repository creation.

## MVP requirements

1. Audit an `ideas/` directory and summarize queue lane health.
2. Detect missing expected folders.
3. Parse markdown PRDs for `Status:` values.
4. Flag ideas whose slug appears in a repo inventory.
5. Render candidate JSON into a markdown PRD.
6. Provide JSON and markdown CLI output.

## Success criteria

- Tests cover healthy and unhealthy queue fixtures.
- Smoke command produces a readable markdown report.
- Draft command refuses to overwrite files unless forced.
