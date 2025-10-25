import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const manifestPath = path.resolve(projectRoot, '..', 'shared-contracts', 'contract-manifest.json');
const changelogPath = path.resolve(projectRoot, '..', 'shared-contracts', 'CONTRACT_CHANGELOG.md');

const LEVELS = new Set(['major', 'minor', 'patch']);

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (const arg of args) {
    const [key, value] = arg.split('=');
    if (key === '--level') {
      parsed.level = value;
    } else if (key === '--summary') {
      parsed.summary = value;
    } else if (key === '--date') {
      parsed.date = value;
    }
  }

  return parsed;
}

function incrementVersion(version, level) {
  const [major, minor, patch] = version.split('.').map((segment) => Number.parseInt(segment, 10) || 0);

  switch (level) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function ensureSummary(summary) {
  if (!summary || summary.trim().length === 0) {
    throw new Error('A non-empty --summary="..." argument is required to describe the contract change.');
  }
  return summary.trim();
}

async function readManifest() {
  if (!(await fs.pathExists(manifestPath))) {
    throw new Error('Contract manifest does not exist. Generate clients before bumping the version.');
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  return JSON.parse(manifestRaw);
}

async function writeManifest(manifest) {
  const serialised = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(manifestPath, serialised, 'utf8');
}

async function prependChangelogEntry(version, summary, releaseDate) {
  const header = '# Shared Contract Changelog';
  const entry = [`## ${version} - ${releaseDate}`, `- ${summary}`].join('\n');

  let existing = '';
  if (await fs.pathExists(changelogPath)) {
    existing = await fs.readFile(changelogPath, 'utf8');
  }

  const normalised = existing.trim();
  if (!normalised) {
    const content = `${header}\n\n${entry}\n`;
    await fs.writeFile(changelogPath, `${content}\n`, 'utf8');
    return;
  }

  const withoutHeader = normalised.startsWith(header)
    ? normalised.slice(header.length).trim()
    : normalised;

  const body = withoutHeader ? `${entry}\n\n${withoutHeader}` : entry;
  const content = `${header}\n\n${body}\n`;
  await fs.writeFile(changelogPath, `${content}\n`, 'utf8');
}

async function run() {
  const args = parseArgs();
  const level = LEVELS.has(args.level) ? args.level : 'patch';
  const summary = ensureSummary(args.summary);
  const manifest = await readManifest();

  if (!manifest.pendingChanges) {
    throw new Error('No pending contract changes detected. Run the generator before bumping the version.');
  }

  const currentVersion = manifest.version || '1.0.0';
  const nextVersion = incrementVersion(currentVersion, level);
  const releaseDate = args.date || new Date().toISOString().slice(0, 10);

  await prependChangelogEntry(nextVersion, summary, releaseDate);

  const releaseHistory = manifest.releaseHistory ? [...manifest.releaseHistory] : [];
  releaseHistory.unshift({
    version: nextVersion,
    summary,
    releasedAt: releaseDate,
  });

  const updatedManifest = {
    ...manifest,
    version: nextVersion,
    lastReleasedAt: releaseDate,
    pendingChanges: false,
    releaseHistory,
  };

  await writeManifest(updatedManifest);
  console.log(`Contracts bumped to ${nextVersion} and changelog updated.`);
}

run().catch((error) => {
  console.error('Failed to bump shared contract version', error);
  process.exitCode = 1;
});

