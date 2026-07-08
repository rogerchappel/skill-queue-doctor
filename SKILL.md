# skill-queue-doctor

Use this skill when an agent needs to inspect or replenish a local OSS agent-skill idea queue before building repositories.

## Use when

- `ideas/ready` is empty or short.
- A cron lane needs a queue hygiene summary.
- Candidate PRDs should be drafted from structured notes.
- Duplicate repo names must be checked against a local inventory.

## Required inputs

- Path to the local `ideas/` directory.
- Optional newline-delimited repo inventory.
- Optional candidate JSON for draft generation.

## Side-effect boundaries

- Audit mode is read-only.
- Draft mode writes only to the requested output directory.
- The skill does not push git commits, create repos, call APIs, or move PRDs between lanes.

## Approval requirements

Ask for explicit approval before using outputs to create public repositories, change live queue state, or overwrite existing draft files.

## Validation workflow

```sh
npm test
npm run check
npm run smoke
```

Review generated PRDs before promoting them into an active queue.
