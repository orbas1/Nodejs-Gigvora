import path from 'node:path';
import fs from 'fs-extra';
import { compile } from 'json-schema-to-typescript';
import {
  schemaPaths,
  hashContent,
  writeFileIfChanged,
  discoverSchemaFiles,
  readContractManifest,
  writeContractManifest,
  normaliseExportPath,
} from './lib/schemaArtifacts.js';

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
    cwd: schemaPaths.domainContractsRoot,
    style: { semi: true },
  });

  const outputPath = path.join(
    schemaPaths.clientsTypescriptRoot,
    schemaFile.relative.replace(/\.json$/, '.d.ts'),
  );
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

  const indexPath = path.join(schemaPaths.clientsTypescriptRoot, 'index.d.ts');
  const manualExports = new Set();

  if (await fs.pathExists(indexPath)) {
    const current = await fs.readFile(indexPath, 'utf8');
    for (const line of current.split('\n')) {
      const match = line.match(/export \* from '\.\/(.*)';/);
      if (!match) {
        continue;
      }

      const existingPath = match[1];
      if (!exportsMap.some((entry) => entry.path.replace(/\\/g, '/') === existingPath)) {
        manualExports.add(existingPath);
      }
    }
  }

  const combined = [...exportsMap, ...manualExports].reduce((acc, entry) => {
    const normalised = (typeof entry === 'string' ? entry : entry.path).replace(/\\/g, '/');
    if (!acc.some((existing) => existing.path === normalised)) {
      acc.push({ path: normalised });
    }
    return acc;
  }, []);

  const lines = combined.sort((a, b) => a.path.localeCompare(b.path)).map((entry) => `export * from './${entry.path}';`);

  const { changed, hash } = await writeFileIfChanged(indexPath, `${lines.join('\n')}\n`);
  return { changed, hash, manualExports: Array.from(manualExports) };
}

async function run() {
  const contractsRoot = schemaPaths.domainContractsRoot;
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
  const manifest = await readContractManifest();
  const artifactMetadata = {};
  let hasArtifactChanges = false;
  const runTimestamp = new Date().toISOString();
  const manualArtifactKeys = new Set();

  for (const schemaFile of schemaFiles) {
    const expectedOutput = path.join(
      schemaPaths.clientsTypescriptRoot,
      schemaFile.relative.replace(/\.json$/, '.d.ts'),
    );
    const exportPath = normaliseExportPath(schemaPaths.clientsTypescriptRoot, expectedOutput).replace(
      /\.d\.ts$/,
      '',
    );
    const normalisedExportPath = exportPath;
    const result = await generateTypeDefinition(schemaFile);

    if (!result) {
      manualArtifactKeys.add(normalisedExportPath);
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

    for (const manualKey of indexMetadata.manualExports ?? []) {
      manualArtifactKeys.add(manualKey);
    }

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

  const finalArtifacts = {};
  const existingKeys = Object.keys(manifest.artifacts || {});

  for (const key of existingKeys) {
    if (artifactMetadata[key]) {
      finalArtifacts[key] = artifactMetadata[key];
      continue;
    }

    if (manualArtifactKeys.has(key) && manifest.artifacts?.[key]) {
      finalArtifacts[key] = manifest.artifacts[key];
      continue;
    }

    hasArtifactChanges = true;
  }

  for (const [key, metadata] of Object.entries(artifactMetadata)) {
    if (!finalArtifacts[key]) {
      finalArtifacts[key] = metadata;
    }
  }

  for (const manualKey of manualArtifactKeys) {
    if (!finalArtifacts[manualKey] && manifest.artifacts?.[manualKey]) {
      finalArtifacts[manualKey] = manifest.artifacts[manualKey];
    }
  }

  const nextManifest = {
    ...manifest,
    lastGeneratedAt: hasArtifactChanges ? runTimestamp : manifest.lastGeneratedAt,
    pendingChanges: hasArtifactChanges ? true : manifest.pendingChanges,
    artifacts: finalArtifacts,
  };

  await writeContractManifest(nextManifest);
  const changeMessage = hasArtifactChanges ? 'updated' : 'validated';
  console.log(
    `Domain client generation ${changeMessage}. Output directory: ${schemaPaths.clientsTypescriptRoot}`,
  );
}

run().catch((error) => {
  console.error('Failed to generate domain clients', error);
  process.exitCode = 1;
});
