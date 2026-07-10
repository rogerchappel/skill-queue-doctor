import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

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
