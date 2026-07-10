# skill-queue-doctor

`skill-queue-doctor` audits local agent-skill idea queues and drafts reviewable PRDs for replenishment. It is designed for OSS skill-factory agents that need queue hygiene without live writes.

## Quickstart

```sh
npm install -g skill-queue-doctor
skill-queue-doctor --help
skill-queue-doctor --version
skill-queue-doctor audit fixtures/queue --repos fixtures/repos.txt --format json
skill-queue-doctor draft fixtures/candidate.json --out tmp-drafts
```

For local development:

```sh
npm test
npm run smoke
node src/cli.js audit fixtures/queue --repos fixtures/repos.txt --format json
node src/cli.js draft fixtures/candidate.json --out tmp-drafts
```

## What it checks

- expected queue folders: `ready`, `in-progress`, and `built`
- markdown PRDs with missing or unknown `Status:` values
- duplicate idea names that already exist in a repo inventory
- ready-lane shortages

## Safety

The CLI reads local files and writes only explicit draft outputs. It does not call GitHub, move PRDs, create repos, or modify queue status files.

## Limitations

- Repo duplicates come from a supplied text inventory.
- PRD parsing is intentionally conservative and line-based.
- Generated drafts are starter PRDs that still require human or agent review.
