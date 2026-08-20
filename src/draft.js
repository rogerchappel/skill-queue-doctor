import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function renderPrd(candidate) {
  validateCandidate(candidate);
  const bullets = (items) => items.map((item) => `- ${item}`).join('\n');

  return `# ${candidate.name}

Status: ready

## Summary

${candidate.summary}

## Problem

${candidate.problem}

## Users

${bullets(candidate.users)}

## MVP

${bullets(candidate.mvp)}

## Safety

${bullets(candidate.safety)}

## Verification

${bullets(candidate.verification)}
`;
}

export async function writeDraft(candidate, outputDir, options = {}) {
  validateCandidate(candidate);
  await mkdir(outputDir, { recursive: true });
  const target = path.join(outputDir, `${candidate.name}.md`);
  const flag = options.force ? 'w' : 'wx';
  await writeFile(target, renderPrd(candidate), { encoding: 'utf8', flag });
  return target;
}

export function validateCandidate(candidate) {
  const requiredStrings = ['name', 'summary', 'problem'];
  for (const key of requiredStrings) {
    if (typeof candidate?.[key] !== 'string' || candidate[key].trim().length === 0) {
      throw new Error(`candidate.${key} must be a non-empty string`);
    }
  }

  const requiredLists = ['users', 'mvp', 'safety', 'verification'];
  for (const key of requiredLists) {
    if (!Array.isArray(candidate[key]) || candidate[key].length === 0) {
      throw new Error(`candidate.${key} must be a non-empty array`);
    }
    for (const [index, item] of candidate[key].entries()) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new Error(`candidate.${key}[${index}] must be a non-empty string`);
      }
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(candidate.name)) {
    throw new Error('candidate.name must be a lowercase slug');
  }
}
