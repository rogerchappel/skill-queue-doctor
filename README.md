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

Invalid commands, unknown options, extra arguments, missing option values, and unsupported
`--format` values print actionable usage text and exit with status `2`. Operational failures,
such as unreadable inputs, exit with status `1`; successful commands exit with status `0`.

Draft candidate JSON must be an object whose `name`, `summary`, and `problem` values are
non-empty strings (`name` must also be a lowercase slug). The `users`, `mvp`, `safety`, and
`verification` values must each be a non-empty array containing only non-empty strings.
Invalid values report the failing field (and array index when applicable), exit with status
`1`, and do not create a draft.

## What it checks

- expected queue folders: `ready`, `in-progress`, and `built`
- markdown PRDs with missing or unknown `Status:` values, or a known status that
  does not match the containing lane
- duplicate idea names that already exist in a repo inventory
- ready-lane shortages

Lane counts include only PRDs whose normalized `Status:` matches their
`ready`, `in-progress`, or `built` folder. Files with missing, unknown, or
misplaced statuses remain listed in report details and produce warnings, but
do not satisfy lane inventory. Consequently, the ready shortage is calculated
only from PRDs with `Status: ready` inside the `ready` folder.

## Safety

The CLI reads local files and writes only explicit draft outputs. It does not call GitHub, move PRDs, create repos, or modify queue status files.

## Limitations

- Repo duplicates come from a supplied text inventory.
- PRD parsing is intentionally conservative and line-based.
- Generated drafts are starter PRDs that still require human or agent review.
