import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function expectUsageError(args, message) {
  await assert.rejects(execFileAsync('node', ['src/cli.js', ...args]), (error) => {
    assert.equal(error.code, 2);
    assert.match(error.stderr, message);
    assert.match(error.stderr, /Usage: skill-queue-doctor/u);
    return true;
  });
}

test('prints CLI help', async () => {
  const { stdout } = await execFileAsync('node', ['src/cli.js', '--help']);

  assert.match(stdout, /skill-queue-doctor 0\.1\.0/u);
  assert.match(stdout, /skill-queue-doctor audit <ideas-dir>/u);
  assert.match(stdout, /--version/u);
});

test('prints CLI version', async () => {
  const { stdout } = await execFileAsync('node', ['src/cli.js', '--version']);

  assert.equal(stdout, '0.1.0\n');
});

test('accepts documented audit option forms', async () => {
  const { stdout } = await execFileAsync('node', [
    'src/cli.js', 'audit', 'fixtures/queue', '--repos', 'fixtures/repos.txt', '--format', 'json',
  ]);
  const report = JSON.parse(stdout);
  assert.equal(report.lanes.ready.count + report.lanes['in-progress'].count + report.lanes.built.count, 3);
});

test('accepts documented draft options including --force', async () => {
  const output = await mkdtemp(join(tmpdir(), 'skill-queue-doctor-cli-'));
  try {
    await execFileAsync('node', ['src/cli.js', 'draft', 'fixtures/candidate.json', '--out', output]);
    await execFileAsync('node', ['src/cli.js', 'draft', 'fixtures/candidate.json', '--out', output, '--force']);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('rejects malformed draft values without creating a draft', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'skill-queue-doctor-invalid-'));
  const input = join(workspace, 'candidate.json');
  const output = join(workspace, 'drafts');
  const malformed = {
    name: 'bad-draft', summary: 'Summary', problem: 'Problem', users: ['Maintainers'],
    mvp: ['Render markdown'], safety: [false], verification: ['Run tests'],
  };
  try {
    await writeFile(input, JSON.stringify(malformed));
    await assert.rejects(
      execFileAsync('node', ['src/cli.js', 'draft', input, '--out', output]),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /candidate\.safety\[0\] must be a non-empty string/u);
        return true;
      },
    );
    await assert.rejects(readFile(join(output, 'bad-draft.md')), /ENOENT/u);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('rejects unknown options', () => expectUsageError(
  ['audit', 'fixtures/queue', '--bogus'], /unknown option: --bogus/u,
));

test('rejects extra positional arguments', () => expectUsageError(
  ['audit', 'fixtures/queue', 'extra'], /unexpected argument: extra/u,
));

test('rejects missing option values', () => expectUsageError(
  ['draft', 'fixtures/candidate.json', '--out'], /option --out requires a value/u,
));

test('rejects unsupported output formats', () => expectUsageError(
  ['audit', 'fixtures/queue', '--format', 'xml'], /unsupported --format value: xml/u,
));

test('rejects missing required positionals and options', async () => {
  await expectUsageError(['audit'], /missing required argument for audit/u);
  await expectUsageError(['draft', 'fixtures/candidate.json'], /missing required option: --out/u);
});
