#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { auditQueue, parseRepoInventory } from './audit.js';
import { writeDraft } from './draft.js';
import { formatJsonReport, formatMarkdownReport } from './report.js';

const VERSION = '0.1.0';

class UsageError extends Error {}

async function main(argv) {
  const [command, ...args] = argv;

  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(helpText());
    return;
  }

  if (command === '--version' || command === '-v') {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  if (command === 'audit') {
    const { positional: first, flags } = parseCommandArgs('audit', args, {
      values: ['repos', 'format'],
    });
    const repoNames = flags.repos ? parseRepoInventory(await readFile(flags.repos, 'utf8')) : [];
    const report = await auditQueue(first, { repoNames });
    const format = flags.format ?? 'markdown';
    process.stdout.write(format === 'json' ? formatJsonReport(report) : formatMarkdownReport(report));
    return;
  }

  if (command === 'draft') {
    const { positional: first, flags } = parseCommandArgs('draft', args, {
      values: ['out'],
      booleans: ['force'],
      required: ['out'],
    });
    const candidate = JSON.parse(await readFile(first, 'utf8'));
    const target = await writeDraft(candidate, flags.out, { force: flags.force === true });
    process.stdout.write(`${target}\n`);
    return;
  }

  throw usageError(`unknown command: ${command}`, 'skill-queue-doctor <audit|draft> ...');
}

function helpText() {
  return `skill-queue-doctor ${VERSION}

Usage:
  skill-queue-doctor audit <ideas-dir> [--repos repos.txt] [--format json|markdown]
  skill-queue-doctor draft <candidate.json> --out <dir> [--force]

Options:
  -h, --help       Show this help.
  -v, --version    Show the CLI version.

Usage errors exit with status 2. Runtime errors exit with status 1.
`;
}

function parseCommandArgs(command, args, schema) {
  const flags = {};
  let positional;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      if (positional) {
        throw usageError(`unexpected argument: ${arg}`, commandUsage(command));
      }
      positional = arg;
      continue;
    }
    const key = arg.slice(2);
    if (schema.booleans?.includes(key)) {
      flags[key] = true;
      continue;
    }
    if (!schema.values.includes(key)) {
      throw usageError(`unknown option: ${arg}`, commandUsage(command));
    }
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      throw usageError(`option ${arg} requires a value`, commandUsage(command));
    }
    flags[key] = next;
    index += 1;
  }
  if (!positional) {
    throw usageError(`missing required argument for ${command}`, commandUsage(command));
  }
  for (const key of schema.required ?? []) {
    if (!flags[key]) {
      throw usageError(`missing required option: --${key}`, commandUsage(command));
    }
  }
  if (command === 'audit' && flags.format && !['json', 'markdown'].includes(flags.format)) {
    throw usageError(`unsupported --format value: ${flags.format}`, commandUsage(command));
  }
  return { positional, flags };
}

function commandUsage(command) {
  return command === 'audit'
    ? 'skill-queue-doctor audit <ideas-dir> [--repos repos.txt] [--format json|markdown]'
    : 'skill-queue-doctor draft <candidate.json> --out <dir> [--force]';
}

function usageError(message, usage) {
  return new UsageError(`${message}\nUsage: ${usage}`);
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = error instanceof UsageError ? 2 : 1;
});
