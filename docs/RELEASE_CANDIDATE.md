# Release Candidate Notes

## Classification

ship

## Verification plan

- `npm test` - pass
- `npm run check` - pass
- `npm run smoke` - pass, reports ready shortage and duplicate fixtures
- `npm run package:smoke` - pass; installs the repository package into a disposable prefix and runs the documented first-use commands

## Dry-run guarantees

- Audit mode reads queue markdown and optional repo inventory only.
- Draft mode writes generated PRDs only to the requested output folder.
- No network, git, package publishing, or repository mutation behavior is implemented.

## Known limitations

- Status extraction expects a simple `Status:` line.
- Duplicate detection depends on caller-supplied repo inventory.
- Candidate JSON schema is intentionally small for reviewability.
