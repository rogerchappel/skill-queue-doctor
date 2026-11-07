import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const consumer = mkdtempSync(join(tmpdir(), 'skill-queue-doctor-package-'));

try {
  const pack = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', consumer], {
    cwd: root,
    encoding: 'utf8',
  }))[0];
  const packagedFiles = new Set(pack.files.map(({ path }) => path));
  const requiredFiles = [
    'package.json',
    'src/cli.js',
    'src/audit.js',
    'src/draft.js',
    'src/index.js',
    'src/report.js',
    'SKILL.md',
  ];
  for (const path of requiredFiles) {
    if (!packagedFiles.has(path)) throw new Error(`package is missing required file: ${path}`);
  }
  const developmentOnlyFiles = [
    'scripts/package-smoke.js',
    'test/audit.test.js',
    'test/cli.test.js',
    'test/draft.test.js',
    '.github/workflows/ci.yml',
    'package-lock.json',
  ];
  for (const path of developmentOnlyFiles) {
    if (packagedFiles.has(path)) throw new Error(`package unexpectedly includes development file: ${path}`);
  }

  const installPrefix = join(consumer, 'run');
  execFileSync('npm', ['install', '--ignore-scripts', '--prefix', installPrefix, join(consumer, pack.filename)], {
    cwd: consumer,
    stdio: 'ignore',
  });
  const bin = join(installPrefix, 'node_modules', '.bin', 'skill-queue-doctor');
  execFileSync(bin, ['--help'], { cwd: consumer, stdio: 'ignore' });
  execFileSync(bin, ['--version'], { cwd: consumer, stdio: 'ignore' });
  const fixtureRoot = join(installPrefix, 'node_modules', 'skill-queue-doctor', 'fixtures');
  const fixtureRepos = readFileSync(join(fixtureRoot, 'repos.txt'), 'utf8');
  if (!fixtureRepos.trim()) throw new Error('installed fixture repository inventory is empty');
  execFileSync(bin, ['audit', join(fixtureRoot, 'queue'), '--format', 'json'], {
    cwd: consumer,
    stdio: 'ignore',
  });
  const drafts = join(consumer, 'drafts');
  execFileSync(bin, ['draft', join(fixtureRoot, 'candidate.json'), '--out', drafts], {
    cwd: consumer,
    stdio: 'ignore',
  });
  if (!existsSync(join(drafts, 'skill-doc-refresh-skill.md'))) {
    throw new Error('installed CLI did not create the documented draft');
  }
  try {
    execFileSync(bin, ['audit', join(fixtureRoot, 'queue'), '--format', 'xml'], {
      cwd: consumer,
      stdio: 'pipe',
    });
    throw new Error('installed CLI accepted an unsupported format');
  } catch (error) {
    if (error.status !== 2) throw error;
  }
  process.stdout.write('packed installation smoke passed\n');
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
