# Contributing

Thanks for helping improve `skill-queue-doctor`.

## Development

```sh
npm test
npm run check
npm run smoke
npm run package:smoke
```

Keep changes local-first. The CLI should not call GitHub, move queue files, or mutate input folders unless a future command makes that behavior explicit and reviewable.

## Pull requests

- Include a short description of the readiness or behavior change.
- Add or update tests for parser, report, or CLI behavior changes.
- Update the README when command usage changes.
