import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const consumer = mkdtempSync(join(tmpdir(), 'skill-queue-doctor-package-'));

try {
  const packOutput = execFileSync('npm', ['pack', '--json', '--pack-destination', consumer], {
    cwd: root,
    encoding: 'utf8',
  });
  const [{ filename }] = JSON.parse(packOutput);
  execFileSync('npm', ['init', '-y'], { cwd: consumer, stdio: 'ignore' });
  execFileSync('npm', ['install', '--ignore-scripts', join(consumer, filename)], {
    cwd: consumer,
    stdio: 'ignore',
  });
  const bin = join(consumer, 'node_modules', '.bin', 'skill-queue-doctor');
  execFileSync(bin, ['--help'], { cwd: consumer, stdio: 'ignore' });
  execFileSync(bin, ['audit', join(root, 'fixtures', 'queue'), '--format', 'json'], {
    cwd: consumer,
    stdio: 'ignore',
  });
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
