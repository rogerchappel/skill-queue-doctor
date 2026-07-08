# Orchestration

## Inputs

- `ideas/` directory with `ready`, `in-progress`, and `built` lanes.
- Optional newline-delimited repo inventory.
- Optional candidate JSON for PRD draft rendering.

## Flow

1. Run `skill-queue-doctor audit <ideas-dir>`.
2. Review lane counts, missing folders, status warnings, and duplicate findings.
3. If replenishment is needed, prepare a candidate JSON file.
4. Run `skill-queue-doctor draft <candidate.json> --out <dir>`.
5. Review the generated PRD before moving it into the live queue.

## Side effects

The audit command has no writes. The draft command writes a new markdown file only under the requested output directory.
