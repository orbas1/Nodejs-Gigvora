import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import fs from 'fs-extra';
import { compile } from 'json-schema-to-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const contractsRoot = path.resolve(projectRoot, '..', 'shared-contracts', 'domain');
const outputRoot = path.resolve(projectRoot, '..', 'shared-contracts', 'clients', 'typescript');
const manifestPath = path.resolve(projectRoot, '..', 'shared-contracts', 'contract-manifest.json');

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function readManifest() {
  if (!(await fs.pathExists(manifestPath))) {
    return {
      version: '1.0.0',
      lastGeneratedAt: null,
      pendingChanges: false,
      artifacts: {},
    };
  }

  const manifestRaw = await fs.readFile(manifestPath, 'utf8');
  try {
    return JSON.parse(manifestRaw);
  } catch (error) {
    throw new Error(`Unable to parse contract manifest at ${manifestPath}: ${error.message}`);
  }
}

async function writeManifest(manifest) {
  const serialised = `${JSON.stringify(manifest, null, 2)}\n`;
  await fs.writeFile(manifestPath, serialised, 'utf8');
}

async function writeFileIfChanged(filePath, content) {
  const nextHash = hashContent(content);
  const exists = await fs.pathExists(filePath);

  if (exists) {
    const current = await fs.readFile(filePath, 'utf8');
    if (current === content) {
      return { changed: false, hash: nextHash };
    }
  }

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
  return { changed: true, hash: nextHash };
}

async function discoverSchemaFiles(directory, relativePrefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    const entryRelative = path.join(relativePrefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await discoverSchemaFiles(entryPath, entryRelative)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push({ absolute: entryPath, relative: entryRelative });
    }
  }

  return files;
}

function buildTypeName(relativePath) {
  const baseName = path.basename(relativePath, '.json');
  const typeSegments = baseName
    .split(/[-_.]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1));
  return typeSegments.join('');
}

function resolveSchemaRoot(schemaJson) {
  const pointer = typeof schemaJson.$ref === 'string' ? schemaJson.$ref : null;
  if (!pointer || !pointer.startsWith('#/')) {
    return schemaJson;
  }

  const [, collection, key] = pointer.split('/', 3);
  if (!collection || !key) {
    return schemaJson;
  }

  const sourceCollection = collection === '$defs' ? schemaJson.$defs : schemaJson.definitions;
  const target = sourceCollection?.[key];
  if (!target) {
    return schemaJson;
  }

  const enriched = {
    ...target,
    definitions: schemaJson.definitions,
    $defs: schemaJson.$defs,
    $schema: schemaJson.$schema,
  };

  return enriched;
}

async function generateTypeDefinition(schemaFile) {
  const schemaJson = await fs.readJson(schemaFile.absolute);
  const isSchemaLike =
    typeof schemaJson?.type === 'string' ||
    typeof schemaJson?.$schema === 'string' ||
    typeof schemaJson?.properties === 'object' ||
    typeof schemaJson?.definitions === 'object' ||
    typeof schemaJson?.$defs === 'object';

  if (!isSchemaLike) {
    console.warn(`Skipping ${schemaFile.relative} because it does not appear to be a JSON Schema.`);
    return null;
  }

  const rootSchema = resolveSchemaRoot(schemaJson);
  const typeName = buildTypeName(schemaFile.relative);
  const tsDefinition = await compile(rootSchema, typeName, {
    bannerComment: '',
    cwd: contractsRoot,
    style: { semi: true },
  });

  const outputPath = path.join(outputRoot, schemaFile.relative.replace(/\.json$/, '.d.ts'));
  const { changed: typesChanged, hash: typesHash } = await writeFileIfChanged(outputPath, tsDefinition);

  const schemaContent = await fs.readFile(schemaFile.absolute, 'utf8');
  const schemaHash = hashContent(schemaContent);

  return {
    typeName,
    outputPath,
    metadata: {
      schemaHash,
      typesHash,
      typesChanged,
    },
  };
}

async function writeIndexFile(exportsMap) {
  if (exportsMap.length === 0) {
    return;
  }

  const indexPath = path.join(outputRoot, 'index.d.ts');
  const manualExports = [];

  if (await fs.pathExists(indexPath)) {
    const current = await fs.readFile(indexPath, 'utf8');
    for (const line of current.split('\n')) {
      const match = line.match(/export \* from '\.\/(.*)';/);
      if (!match) {
        continue;
      }

      const existingPath = match[1];
      if (!exportsMap.some((entry) => entry.path.replace(/\\/g, '/') === existingPath)) {
        manualExports.push({ path: existingPath });
      }
    }
  }

  const combined = [...exportsMap, ...manualExports].reduce((acc, entry) => {
    const normalised = entry.path.replace(/\\/g, '/');
    if (!acc.some((existing) => existing.path === normalised)) {
      acc.push({ path: normalised });
    }
    return acc;
  }, []);

  const lines = combined.sort((a, b) => a.path.localeCompare(b.path)).map((entry) => `export * from './${entry.path}';`);

  const { changed, hash } = await writeFileIfChanged(indexPath, `${lines.join('\n')}\n`);
  return { changed, hash };
}

async function run() {
  const exists = await fs.pathExists(contractsRoot);
  if (!exists) {
    throw new Error(`Unable to locate domain contracts at ${contractsRoot}`);
  }

  const schemaFiles = await discoverSchemaFiles(contractsRoot);
  if (schemaFiles.length === 0) {
    console.warn('No domain schema files discovered.');
    return;
  }

  const exportsMap = [];
  const manifest = await readManifest();
  const artifactMetadata = {};
  let hasArtifactChanges = false;
  const runTimestamp = new Date().toISOString();
  const manualArtifactKeys = [];

  for (const schemaFile of schemaFiles) {
    const expectedOutput = path.join(outputRoot, schemaFile.relative.replace(/\.json$/, '.d.ts'));
    const exportPath = path.relative(outputRoot, expectedOutput).replace(/\.d\.ts$/, '');
    const normalisedExportPath = exportPath.replace(/\\/g, '/');
    const result = await generateTypeDefinition(schemaFile);

    if (!result) {
      manualArtifactKeys.push(normalisedExportPath);
      continue;
    }

    const { outputPath, metadata } = result;
    exportsMap.push({ path: exportPath });

    const artifactKey = normalisedExportPath;
    const previousArtifact = manifest.artifacts?.[artifactKey];
    const artifactChanged =
      !previousArtifact ||
      previousArtifact.schemaHash !== metadata.schemaHash ||
      previousArtifact.typesHash !== metadata.typesHash;

    artifactMetadata[artifactKey] = {
      schemaHash: metadata.schemaHash,
      typesHash: metadata.typesHash,
      generatedAt: artifactChanged ? runTimestamp : previousArtifact?.generatedAt ?? runTimestamp,
    };

    if (artifactChanged) {
      hasArtifactChanges = true;
    }
  }

  const indexMetadata = await writeIndexFile(exportsMap);
  if (indexMetadata) {
    const indexEntry = {
      schemaHash: null,
      typesHash: indexMetadata.hash,
      generatedAt: runTimestamp,
    };

    if (indexMetadata.changed) {
      const previousIndex = manifest.artifacts?.index;
      if (!previousIndex || previousIndex.typesHash !== indexMetadata.hash) {
        hasArtifactChanges = true;
      }
      artifactMetadata.index = indexEntry;
    } else if (manifest.artifacts?.index) {
      artifactMetadata.index = {
        ...manifest.artifacts.index,
        generatedAt: manifest.artifacts.index.generatedAt ?? runTimestamp,
      };
    } else {
      artifactMetadata.index = indexEntry;
      hasArtifactChanges = true;
    }
  }

  const finalArtifacts = { ...artifactMetadata };
  for (const manualKey of manualArtifactKeys) {
    if (manifest.artifacts?.[manualKey]) {
      finalArtifacts[manualKey] = manifest.artifacts[manualKey];
    }
  }
  for (const previousKey of Object.keys(manifest.artifacts || {})) {
    if (!finalArtifacts[previousKey]) {
      hasArtifactChanges = true;
    }
  }

  const nextManifest = {
    ...manifest,
    lastGeneratedAt: hasArtifactChanges ? runTimestamp : manifest.lastGeneratedAt,
    pendingChanges: hasArtifactChanges ? true : manifest.pendingChanges,
    artifacts: finalArtifacts,
  };

  await writeManifest(nextManifest);
  const changeMessage = hasArtifactChanges ? 'updated' : 'validated';
  console.log(`Domain client generation ${changeMessage}. Output directory: ${outputRoot}`);
}

run().catch((error) => {
  console.error('Failed to generate domain clients', error);
  process.exitCode = 1;
});
