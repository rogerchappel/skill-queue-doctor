import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const consumer = mkdtempSync(join(tmpdir(), 'skill-queue-doctor-package-'));

try {
  const installPrefix = join(consumer, 'run');
  execFileSync('npm', ['install', '--ignore-scripts', '--prefix', installPrefix, root], {
    cwd: root,
    stdio: 'ignore',
  });
  const bin = join(installPrefix, 'node_modules', '.bin', 'skill-queue-doctor');
  execFileSync(bin, ['--help'], { cwd: consumer, stdio: 'ignore' });
  execFileSync(bin, ['--version'], { cwd: consumer, stdio: 'ignore' });
  execFileSync(bin, ['audit', join(root, 'fixtures', 'queue'), '--format', 'json'], {
    cwd: consumer,
    stdio: 'ignore',
  });
  const drafts = join(consumer, 'drafts');
  execFileSync(bin, ['draft', join(root, 'fixtures', 'candidate.json'), '--out', drafts], {
    cwd: consumer,
    stdio: 'ignore',
  });
  if (!existsSync(join(drafts, 'skill-doc-refresh-skill.md'))) {
    throw new Error('installed CLI did not create the documented draft');
  }
  try {
    execFileSync(bin, ['audit', join(root, 'fixtures', 'queue'), '--format', 'xml'], {
      cwd: consumer,
      stdio: 'pipe',
    });
    throw new Error('installed CLI accepted an unsupported format');
  } catch (error) {
    if (error.status !== 2) throw error;
  }
  process.stdout.write('installed package smoke passed\n');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
