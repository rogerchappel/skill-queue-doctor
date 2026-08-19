import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renderPrd, validateCandidate, writeDraft } from '../src/draft.js';

const candidate = {
  name: 'sample-skill',
  summary: 'A useful sample skill.',
  problem: 'Samples need deterministic coverage.',
  users: ['Agent builders'],
  mvp: ['Render markdown'],
  safety: ['No live writes'],
  verification: ['Run tests']
};

test('renders a complete PRD', () => {
  const markdown = renderPrd(candidate);
  assert.match(markdown, /^# sample-skill/u);
  assert.match(markdown, /Status: ready/u);
  assert.match(markdown, /- Agent builders/u);
});

test('validates required arrays', () => {
  assert.throws(() => validateCandidate({ ...candidate, safety: [] }), /candidate.safety/u);
});

test('rejects blank scalar fields with field-specific errors', () => {
  for (const key of ['name', 'summary', 'problem']) {
    assert.throws(
      () => validateCandidate({ ...candidate, [key]: ' \t ' }),
      new RegExp(`candidate\\.${key} must be a non-empty string`, 'u'),
    );
  }
});

test('rejects malformed list elements with field and index', () => {
  const invalidValues = [{ role: 'maintainer' }, 42, true, null, '   '];
  for (const key of ['users', 'mvp', 'safety', 'verification']) {
    for (const value of invalidValues) {
      assert.throws(
        () => validateCandidate({ ...candidate, [key]: ['valid', value] }),
        new RegExp(`candidate\\.${key}\\[1\\] must be a non-empty string`, 'u'),
      );
    }
  }
});

test('writes a draft without overwriting by default', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'skill-queue-doctor-'));
  try {
    const target = await writeDraft(candidate, dir);
    assert.match(await readFile(target, 'utf8'), /# sample-skill/u);
    await assert.rejects(() => writeDraft(candidate, dir), /EEXIST/u);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
