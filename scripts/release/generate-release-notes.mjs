#!/usr/bin/env node
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const backendRoot = path.resolve(repoRoot, 'gigvora-backend-nodejs');
const serviceModuleUrl = pathToFileURL(path.resolve(backendRoot, 'src', 'services', 'releaseMonitoringService.js')).href;
const sequelizeModuleUrl = pathToFileURL(path.resolve(backendRoot, 'src', 'models', 'sequelizeClient.js')).href;

const loadJson = async (filePath, fallback = null) => {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
};

const parseArgs = (argv) => {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[i + 1];
      const isFlag = !next || next.startsWith('--');
      args[key] = isFlag ? true : next;
      if (!isFlag) {
        i += 1;
      }
    } else {
      args._.push(value);
    }
  }
  return args;
};

const loadPipelineReport = async (pipelineId) => {
  const defaultPath = path.resolve(repoRoot, 'build', 'pipeline', `${pipelineId}-report.json`);
  try {
    await access(defaultPath, fsConstants.F_OK);
    return loadJson(defaultPath, { steps: [], status: 'unknown' });
  } catch (error) {
    return { id: pipelineId, status: 'unavailable', steps: [] };
  }
};

const formatStepTable = (steps) => {
  if (!steps.length) {
    return '_No recorded steps yet._';
  }
  const header = '| Step | Status | Duration (s) | Commands |\n| --- | --- | --- | --- |';
  const rows = steps.map((step) => {
    const durationSeconds = (step.durationMs ?? 0) / 1000;
    const status = step.status === 'passed' ? '✅ Pass' : step.status === 'failed' ? '❌ Fail' : '⚠️ Unknown';
    const commands = step.commands
      .map((command) => `\`${command.command}\``)
      .join('<br />');
    return `| ${step.name} | ${status} | ${durationSeconds.toFixed(2)} | ${commands} |`;
  });
  return [header, ...rows].join('\n');
};

const formatHighlights = (highlights) => {
  if (!highlights.length) {
    return '_No highlights captured for this release._';
  }
  return highlights
    .map((highlight) => {
      const ownerText = highlight.owners?.length ? ` — Owners: ${highlight.owners.join(', ')}` : '';
      const metricText = highlight.metrics
        ? `\n    - Metrics: ${Object.entries(highlight.metrics)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}`
        : '';
      return `- **${highlight.title}.** ${highlight.summary}${ownerText}${metricText}`;
    })
    .join('\n');
};

const formatBreakingChanges = (breakingChanges) => {
  if (!breakingChanges.length) {
    return '_No breaking changes in this release._';
  }
  return breakingChanges
    .map(
      (change) =>
        `- **${change.title}.** ${change.summary}\n  - Action: ${change.actionRequired}\n  - Owners: ${change.owners.join(', ')}\n  - Due: ${change.due}`,
    )
    .join('\n');
};

const formatQualityGates = (qualityGates) => {
  if (!qualityGates.length) {
    return '_No recorded quality gates._';
  }
  const header = '| Gate | Status | Evidence |\n| --- | --- | --- |';
  const rows = qualityGates.map((gate) => {
    const status = gate.status === 'pass' ? '✅ Pass' : gate.status === 'fail' ? '❌ Fail' : '⚠️ Pending';
    return `| ${gate.name} | ${status} | ${gate.evidence} |`;
  });
  return [header, ...rows].join('\n');
};

const buildReleaseNotes = ({
  version,
  pipeline,
  highlights,
  breakingChanges,
  qualityGates,
}) => `# Gigvora Release ${version}\n\n` +
  `## Pipeline Overview\n${formatStepTable(pipeline.steps ?? [])}\n\n` +
  `## Highlights\n${formatHighlights(highlights)}\n\n` +
  `## Breaking Changes & Actions\n${formatBreakingChanges(breakingChanges)}\n\n` +
  `## Quality Gates\n${formatQualityGates(qualityGates)}\n`;

const ensureDirectory = (targetPath) => mkdir(path.dirname(targetPath), { recursive: true });

const loadRolloutFromDatabase = async (version) => {
  let sequelizeInstance;
  try {
    const [serviceModule, sequelizeModule] = await Promise.all([
      import(serviceModuleUrl),
      import(sequelizeModuleUrl),
    ]);
    sequelizeInstance = sequelizeModule.default;
    const rollout = await serviceModule.getRolloutByVersion(version);
    return rollout ?? null;
  } catch (error) {
    if (process.env.DEBUG_RELEASE_NOTES === 'true') {
      console.warn('[release-notes] Unable to load rollout from database', error);
    }
    return null;
  } finally {
    if (sequelizeInstance) {
      await sequelizeInstance.close().catch(() => {});
    }
  }
};

const main = async () => {
  const args = parseArgs(process.argv);
  const version = args.version ?? args._[0];
  const pipelineId = args.pipeline ?? 'web-release';

  if (!version) {
    throw new Error('Missing release version. Pass --version 2025.04.15');
  }

  const pipeline = await loadPipelineReport(pipelineId);
  const highlightsPath = path.resolve(__dirname, 'release-highlights.json');
  const releaseData = await loadJson(highlightsPath, {
    highlights: [],
    breakingChanges: [],
    qualityGates: [],
  });

  const rolloutFromDb = await loadRolloutFromDatabase(version);
  const pipelineSource = rolloutFromDb?.pipeline ?? pipeline;
  const qualityGates = rolloutFromDb?.quality?.gates?.length
    ? rolloutFromDb.quality.gates
    : releaseData.qualityGates ?? [];

  const releaseNotesContent = buildReleaseNotes({
    version,
    pipeline: pipelineSource,
    highlights: releaseData.highlights ?? [],
    breakingChanges: releaseData.breakingChanges ?? [],
    qualityGates,
  });

  const outputPath = path.resolve(repoRoot, 'update_docs', 'release-notes', `${version}.md`);
  await ensureDirectory(outputPath);
  await writeFile(outputPath, `${releaseNotesContent}\n`, 'utf8');
  process.stdout.write(`Release notes generated at ${path.relative(repoRoot, outputPath)}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
