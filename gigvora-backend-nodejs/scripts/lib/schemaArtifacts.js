import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const contractsRoot = path.resolve(projectRoot, '..', 'shared-contracts');
const domainContractsRoot = path.join(contractsRoot, 'domain');
const clientsTypescriptRoot = path.join(contractsRoot, 'clients', 'typescript');
const manifestPath = path.join(contractsRoot, 'contract-manifest.json');

export const schemaPaths = {
  projectRoot,
  contractsRoot,
  domainContractsRoot,
  clientsTypescriptRoot,
  manifestPath,
};

export function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function ensureParentDirectory(filePath) {
  await fs.ensureDir(path.dirname(filePath));
}

export async function writeJsonArtifact(targetPath, payload) {
  await ensureParentDirectory(targetPath);
  await fs.writeJson(targetPath, payload, { spaces: 2 });
}

export async function writeTextArtifact(targetPath, content) {
  await ensureParentDirectory(targetPath);
  await fs.writeFile(targetPath, content, 'utf8');
}

export async function writeFileIfChanged(filePath, content) {
  const nextHash = hashContent(content);
  const exists = await fs.pathExists(filePath);

  if (exists) {
    const current = await fs.readFile(filePath, 'utf8');
    if (current === content) {
      return { changed: false, hash: nextHash };
    }
  }

  await writeTextArtifact(filePath, content);
  return { changed: true, hash: nextHash };
}

export async function readJsonFile(filePath, fallback = null) {
  try {
    const json = await fs.readJson(filePath);
    return json;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }
    throw new Error(`Unable to read JSON file at ${filePath}: ${error.message}`);
  }
}

export async function readContractManifest() {
  const defaultManifest = {
    version: '1.0.0',
    lastGeneratedAt: null,
    pendingChanges: false,
    artifacts: {},
  };
  return readJsonFile(manifestPath, defaultManifest);
}

export async function writeContractManifest(manifest) {
  const serialised = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeTextArtifact(manifestPath, serialised);
}

export async function discoverSchemaFiles(directory, relativePrefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    const entryRelative = path.join(relativePrefix, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await discoverSchemaFiles(entryPath, entryRelative)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push({ absolute: entryPath, relative: entryRelative });
    }
  }

  return files;
}

export function normaliseExportPath(rootDirectory, filePath) {
  const relativePath = path.relative(rootDirectory, filePath);
  return relativePath.replace(/\\/g, '/');
}

