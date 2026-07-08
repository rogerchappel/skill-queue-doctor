# Release Candidate Notes

## Classification

ship

## Verification plan

- `npm test`
- `npm run check`
- `npm run smoke`
- `node src/cli.js draft fixtures/candidate.json --out /tmp/skill-queue-doctor-drafts --force`

## Dry-run guarantees

- Audit mode reads queue markdown and optional repo inventory only.
- Draft mode writes generated PRDs only to the requested output folder.
- No network, git, package publishing, or repository mutation behavior is implemented.

## Known limitations

- Status extraction expects a simple `Status:` line.
- Duplicate detection depends on caller-supplied repo inventory.
- Candidate JSON schema is intentionally small for reviewability.
