import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const LANES = ['ready', 'in-progress', 'built'];
const KNOWN_STATUSES = new Set(['ready', 'in-progress', 'built', 'ship', 'incubate', 'kill/merge']);

export async function auditQueue(ideasDir, options = {}) {
  await validateIdeasDirectory(ideasDir);

  const repoNames = new Map();
  for (const repoName of options.repoNames ?? []) {
    const normalized = normalizeRepoName(repoName);
    if (!repoNames.has(normalized)) repoNames.set(normalized, repoName);
  }
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

    const files = (await readdir(laneDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
      .map((entry) => entry.name)
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

      const matchingRepo = repoNames.get(normalizeRepoName(slug));
      if (matchingRepo !== undefined) {
        duplicates.push({ lane, file, repo: matchingRepo });
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

function normalizeRepoName(value) {
  return value.toLowerCase();
}

async function validateIdeasDirectory(ideasDir) {
  let result;
  try {
    result = await stat(ideasDir);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Ideas root does not exist: ${ideasDir}`);
    if (error.code === 'EACCES' || error.code === 'EPERM') throw new Error(`Ideas root is not readable: ${ideasDir}`);
    throw error;
  }
  if (!result.isDirectory()) throw new Error(`Ideas root is not a directory: ${ideasDir}`);
  try {
    await readdir(ideasDir);
  } catch (error) {
    if (error.code === 'EACCES' || error.code === 'EPERM') throw new Error(`Ideas root is not readable: ${ideasDir}`);
    throw error;
  }
}

export function parseRepoInventory(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

export function parseStatus(markdown) {
  let fence = null;

  for (const line of markdown.split(/\r?\n/u)) {
    const fenceLine = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/u);
    if (fenceLine) {
      const [, marker, suffix] = fenceLine;
      if (!fence) {
        fence = { character: marker[0], length: marker.length };
      } else if (
        marker[0] === fence.character
        && marker.length >= fence.length
        && suffix.trim() === ''
      ) {
        fence = null;
      }
      continue;
    }

    if (!fence) {
      const match = line.match(/^Status:\s*(.+)$/iu);
      if (match) return match[1].trim().toLowerCase();
    }
  }

  return null;
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
