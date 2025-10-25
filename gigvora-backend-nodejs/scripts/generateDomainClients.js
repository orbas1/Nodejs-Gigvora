import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { compileFromFile } from 'json-schema-to-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const contractsRoot = path.resolve(projectRoot, '..', 'shared-contracts', 'domain');
const outputRoot = path.resolve(projectRoot, '..', 'shared-contracts', 'clients', 'typescript');

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

async function generateTypeDefinition(schemaFile, options) {
  const tsDefinition = await compileFromFile(schemaFile.absolute, {
    bannerComment: '',
    cwd: contractsRoot,
    style: { semi: true },
  });

  const typeName = buildTypeName(schemaFile.relative);
  const enrichedDefinition = tsDefinition.includes(`export interface ${typeName}`)
    ? tsDefinition
    : tsDefinition.replace('export interface', `export interface ${typeName}`);

  const outputPath = path.join(outputRoot, schemaFile.relative.replace(/\.json$/, '.d.ts'));
  await fs.ensureDir(path.dirname(outputPath));
  const finalContent = enrichedDefinition.endsWith('\n') ? enrichedDefinition : `${enrichedDefinition}\n`;

  if (options.check) {
    const existing = await fs.readFile(outputPath, 'utf8');
    if (existing !== finalContent) {
      const displayPath = path.relative(path.resolve(__dirname, '..'), outputPath);
      throw new Error(`Type definition drift detected for ${displayPath}. Regenerate domain clients.`);
    }
  } else {
    await fs.writeFile(outputPath, finalContent, 'utf8');
  }

  return { typeName, outputPath };
}

async function writeIndexFile(exportsMap, options) {
  if (exportsMap.length === 0) {
    return;
  }

  const lines = exportsMap
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => `export * from './${entry.path.replace(/\\/g, '/')}';`);

  const indexPath = path.join(outputRoot, 'index.d.ts');
  await fs.ensureDir(outputRoot);
  const content = `${lines.join('\n')}\n`;

  if (options.check) {
    const existing = await fs.readFile(indexPath, 'utf8');
    if (existing !== content) {
      throw new Error('Type index drift detected. Regenerate domain clients.');
    }
  } else {
    await fs.writeFile(indexPath, content, 'utf8');
  }
}

async function run() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
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
  for (const schemaFile of schemaFiles) {
    const { outputPath } = await generateTypeDefinition(schemaFile, { check });
    const relativePath = path.relative(outputRoot, outputPath).replace(/\.d\.ts$/, '');
    exportsMap.push({ path: relativePath });
  }

  await writeIndexFile(exportsMap, { check });
  if (!check) {
    console.log(`Generated ${exportsMap.length} TypeScript definitions in ${outputRoot}`);
  }
}

run().catch((error) => {
  console.error('Failed to generate domain clients', error);
  process.exitCode = 1;
});
