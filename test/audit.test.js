import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { auditQueue, parseRepoInventory, parseStatus } from '../src/audit.js';
import { formatJsonReport, formatMarkdownReport } from '../src/report.js';

test('parses status lines case-insensitively', () => {
  assert.equal(parseStatus('# Demo\n\nStatus: In-Progress\n'), 'in-progress');
});

test('ignores status examples inside fenced code blocks', () => {
  assert.equal(parseStatus('# Demo\n\n```text\nStatus: ready\n```\n'), null);
  assert.equal(parseStatus('# Demo\n\n~~~markdown\nSTATUS: built\n~~~\n'), null);
  assert.equal(
    parseStatus('# Demo\n\n```text\nStatus: built\n```\n\nStAtUs: ReAdY\n'),
    'ready',
  );
});

test('parses repo inventory comments and blanks', () => {
  assert.deepEqual(parseRepoInventory('# repos\n\nalpha\n beta \n'), ['alpha', 'beta']);
});

test('audits queue lanes and duplicate repo names', async () => {
  const report = await auditQueue('fixtures/queue', {
    repoNames: ['repo-to-content-skill']
  });

  assert.equal(report.lanes.ready.count, 1);
  assert.equal(report.lanes['in-progress'].count, 1);
  assert.equal(report.lanes.built.count, 1);
  assert.equal(report.readyShortage, 1);
  assert.deepEqual(report.missingFolders, []);
  assert.equal(report.duplicates[0].repo, 'repo-to-content-skill');
});

test('ignores non-file Markdown entries in queue lanes', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'skill-queue-doctor-entries-'));
  await Promise.all(['ready', 'in-progress', 'built'].map((lane) => mkdir(join(workspace, lane))));
  await writeFile(join(workspace, 'ready', 'valid.md'), '# Valid\n\nStatus: ready\n');
  await mkdir(join(workspace, 'ready', 'nested.md'));

  const report = await auditQueue(workspace, { repoNames: ['nested'] });

  assert.equal(report.lanes.ready.count, 1);
  assert.deepEqual(report.lanes.ready.files, [{ file: 'valid.md', slug: 'valid', status: 'ready' }]);
  assert.deepEqual(report.warnings, []);
  assert.deepEqual(report.duplicates, []);
});

test('does not count a fenced status example as queue inventory', async () => {
  const report = await auditQueue('fixtures/fenced-status');

  assert.equal(report.lanes.ready.count, 1);
  assert.equal(report.readyShortage, 1);
  assert.deepEqual(report.warnings, [
    {
      lane: 'ready',
      file: 'example-only.md',
      code: 'missing-status',
      message: 'Missing Status line',
    },
  ]);
});

test('rejects a missing or non-directory ideas root', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'skill-queue-doctor-root-'));
  const file = join(workspace, 'ideas.txt');
  await writeFile(file, 'not a directory');
  await assert.rejects(auditQueue(join(workspace, 'missing')), /Ideas root does not exist:/u);
  await assert.rejects(auditQueue(file), /Ideas root is not a directory:/u);
});

test('reports absent lane folders for an existing ideas root', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'skill-queue-doctor-lanes-'));
  const report = await auditQueue(workspace);
  assert.deepEqual(report.missingFolders, ['ready', 'in-progress', 'built']);
  assert.equal(report.readyShortage, 2);
});

test('rejects an unreadable ideas root', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'skill-queue-doctor-unreadable-'));
  await chmod(workspace, 0o000);
  try {
    await assert.rejects(auditQueue(workspace), /Ideas root is not readable:/u);
  } finally {
    await chmod(workspace, 0o700);
  }
});

test('excludes cross-lane statuses from counts and reports each mismatch', async () => {
  const report = await auditQueue('fixtures/misaligned-queue');

  assert.equal(report.lanes.ready.count, 1);
  assert.equal(report.lanes['in-progress'].count, 0);
  assert.equal(report.lanes.built.count, 0);
  assert.equal(report.readyShortage, 1);
  assert.deepEqual(
    report.warnings.map(({ lane, file, code, message }) => ({ lane, file, code, message })),
    [
      {
        lane: 'ready',
        file: 'built-in-ready.md',
        code: 'status-lane-mismatch',
        message: 'Status built does not match containing lane ready'
      },
      {
        lane: 'in-progress',
        file: 'ready-in-progress.md',
        code: 'status-lane-mismatch',
        message: 'Status ready does not match containing lane in-progress'
      },
      {
        lane: 'built',
        file: 'missing-status.md',
        code: 'missing-status',
        message: 'Missing Status line'
      },
      {
        lane: 'built',
        file: 'unknown-status.md',
        code: 'unknown-status',
        message: 'Unknown status: parked'
      }
    ]
  );

  const json = formatJsonReport(report);
  assert.match(json, /"code": "status-lane-mismatch"/u);
  assert.match(json, /"readyShortage": 1/u);

  const markdown = formatMarkdownReport(report);
  assert.match(markdown, /- ready: 1/u);
  assert.match(
    markdown,
    /- ready\/built-in-ready\.md: Status built does not match containing lane ready/u
  );
});
