#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { auditQueue, parseRepoInventory } from './audit.js';
import { writeDraft } from './draft.js';
import { formatJsonReport, formatMarkdownReport } from './report.js';

async function main(argv) {
  const [command, first, ...rest] = argv;
  const flags = parseFlags(rest);

  if (command === 'audit') {
    if (!first) {
      throw new Error('usage: skill-queue-doctor audit <ideas-dir> [--repos repos.txt] [--format json|markdown]');
    }
    const repoNames = flags.repos ? parseRepoInventory(await readFile(flags.repos, 'utf8')) : [];
    const report = await auditQueue(first, { repoNames });
    const format = flags.format ?? 'markdown';
    process.stdout.write(format === 'json' ? formatJsonReport(report) : formatMarkdownReport(report));
    return;
  }

  if (command === 'draft') {
    if (!first || !flags.out) {
      throw new Error('usage: skill-queue-doctor draft <candidate.json> --out <dir> [--force]');
    }
    const candidate = JSON.parse(await readFile(first, 'utf8'));
    const target = await writeDraft(candidate, flags.out, { force: flags.force === true });
    process.stdout.write(`${target}\n`);
    return;
  }

  throw new Error('usage: skill-queue-doctor <audit|draft> ...');
}

function parseFlags(args) {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      continue;
    }
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
