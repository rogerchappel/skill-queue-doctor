# Security

`skill-queue-doctor` is a local-first CLI. It reads queue folders, repo inventories, and candidate JSON files supplied by the operator.

## Reporting

Please report security issues through GitHub private vulnerability reporting when available, or open a minimal issue that avoids sensitive details.

## Boundaries

- Do not include private queue contents, credentials, or unreleased repo details in public issues.
- The CLI should not require network access or secrets.
- Treat generated drafts as review artifacts, not automatically approved work.
