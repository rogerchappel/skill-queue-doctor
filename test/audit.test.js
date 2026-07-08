import test from 'node:test';
import assert from 'node:assert/strict';
import { auditQueue, parseRepoInventory, parseStatus } from '../src/audit.js';

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
