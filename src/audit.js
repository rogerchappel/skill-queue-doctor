import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const LANES = ['ready', 'in-progress', 'built'];
const KNOWN_STATUSES = new Set(['ready', 'in-progress', 'built', 'ship', 'incubate', 'kill/merge']);

export async function auditQueue(ideasDir, options = {}) {
  const repoNames = new Set(options.repoNames ?? []);
  const lanes = {};
  const missingFolders = [];
  const warnings = [];
  const duplicates = [];

  for (const lane of LANES) {
    const laneDir = path.join(ideasDir, lane);
    if (!(await existsDirectory(laneDir))) {
      missingFolders.push(lane);
      lanes[lane] = { count: 0, files: [] };
      continue;
    }

    const files = (await readdir(laneDir))
      .filter((file) => file.endsWith('.md') && file !== 'README.md')
      .sort();

    const parsed = [];
    for (const file of files) {
      const fullPath = path.join(laneDir, file);
      const text = await readFile(fullPath, 'utf8');
      const status = parseStatus(text);
      const slug = file.replace(/\.md$/u, '');

      if (!status) {
        warnings.push({ lane, file, code: 'missing-status', message: 'Missing Status line' });
      } else if (!KNOWN_STATUSES.has(status)) {
        warnings.push({ lane, file, code: 'unknown-status', message: `Unknown status: ${status}` });
      } else if (status !== lane) {
        warnings.push({
          lane,
          file,
          code: 'status-lane-mismatch',
          message: `Status ${status} does not match containing lane ${lane}`
        });
      }

      if (repoNames.has(slug)) {
        duplicates.push({ lane, file, repo: slug });
      }

      parsed.push({ file, slug, status });
    }

    lanes[lane] = {
      count: parsed.filter(({ status }) => status === lane).length,
      files: parsed
    };
  }

  return {
    ideasDir,
    lanes,
    missingFolders,
    warnings,
    duplicates,
    readyShortage: Math.max(0, 2 - lanes.ready.count)
  };
}

export function parseRepoInventory(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

export function parseStatus(markdown) {
  const match = markdown.match(/^Status:\s*(.+)$/imu);
  return match?.[1]?.trim().toLowerCase() ?? null;
}

async function existsDirectory(target) {
  try {
    const result = await stat(target);
    return result.isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}
