import test from 'node:test';
import assert from 'node:assert/strict';
import { auditQueue, parseRepoInventory, parseStatus } from '../src/audit.js';
import { formatJsonReport, formatMarkdownReport } from '../src/report.js';

test('parses status lines case-insensitively', () => {
  assert.equal(parseStatus('# Demo\n\nStatus: In-Progress\n'), 'in-progress');
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
