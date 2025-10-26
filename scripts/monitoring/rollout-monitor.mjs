#!/usr/bin/env node
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const rolloutStorePath = path.resolve(repoRoot, 'gigvora-backend-nodejs', 'src', 'data', 'release-rollouts.json');

const loadJson = async (targetPath, fallback = null) => {
  try {
    const raw = await readFile(targetPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== null && error.code === 'ENOENT') {
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

const ensureStoreDirectory = () => mkdir(path.dirname(rolloutStorePath), { recursive: true });

const loadPipelineReport = async (pipelineId) => {
  const reportPath = path.resolve(repoRoot, 'build', 'pipeline', `${pipelineId}-report.json`);
  try {
    await access(reportPath, fsConstants.F_OK);
    return loadJson(reportPath, { steps: [], status: 'unknown' });
  } catch (error) {
    return { id: pipelineId, status: 'unavailable', steps: [] };
  }
};

const loadQualityData = async () => {
  const highlightsPath = path.resolve(repoRoot, 'scripts', 'release', 'release-highlights.json');
  return loadJson(highlightsPath, { qualityGates: [], highlights: [] });
};

const deriveQualityStatus = (qualityGates, pipelineStatus) => {
  const gateStatus = qualityGates.every((gate) => gate.status === 'pass');
  if (pipelineStatus !== 'passed') {
    return 'blocked';
  }
  return gateStatus ? 'pass' : 'attention';
};

const normalisePipelineSummary = (pipeline) => ({
  id: pipeline.id,
  name: pipeline.name,
  status: pipeline.status,
  finishedAt: pipeline.finishedAt ?? null,
  durationMs: pipeline.durationMs ?? null,
  steps: (pipeline.steps ?? []).map((step) => ({
    id: step.id,
    name: step.name,
    status: step.status,
    durationMs: step.durationMs ?? null,
  })),
});

const deriveCohorts = (qualityStatus) => {
  const baseHealth = qualityStatus === 'pass' ? 'healthy' : qualityStatus === 'attention' ? 'watch' : 'blocked';
  const adoptionModifier = qualityStatus === 'pass' ? 1 : qualityStatus === 'attention' ? 0.6 : 0.2;
  return [
    {
      name: 'Internal champions',
      targetPercentage: 0.05,
      currentPercentage: 0.05 * adoptionModifier,
      errorBudgetRemaining: 0.99 * adoptionModifier,
      health: baseHealth,
      notes: ['Feature toggled for platform leads and reliability guild.'],
    },
    {
      name: 'Mentor beta',
      targetPercentage: 0.25,
      currentPercentage: 0.2 * adoptionModifier,
      errorBudgetRemaining: 0.97 * adoptionModifier,
      health: baseHealth,
      notes: ['Monitors mentorship activation funnels and release sentiment.'],
    },
    {
      name: 'Agency rollout',
      targetPercentage: 0.6,
      currentPercentage: 0.45 * adoptionModifier,
      errorBudgetRemaining: 0.94 * adoptionModifier,
      health: baseHealth,
      notes: ['Tracks high-volume recruiting agencies and partner workflows.'],
    },
    {
      name: 'Global enablement',
      targetPercentage: 1,
      currentPercentage: 0.6 * adoptionModifier,
      errorBudgetRemaining: 0.9 * adoptionModifier,
      health: baseHealth,
      notes: ['Held until telemetry clears guardrails for all personas.'],
    },
  ];
};

const deriveTelemetry = (qualityStatus) => {
  const baselineErrorBudget = qualityStatus === 'pass' ? 0.96 : qualityStatus === 'attention' ? 0.9 : 0.75;
  const latency = qualityStatus === 'pass' ? 140 : qualityStatus === 'attention' ? 165 : 210;
  return {
    errorBudgetRemaining: Number(baselineErrorBudget.toFixed(2)),
    p0Incidents: qualityStatus === 'pass' ? 0 : 1,
    latencyP99Ms: latency,
    regressionAlerts: qualityStatus === 'blocked' ? ['Pause rollout until availability stabilises.'] : [],
  };
};

const upsertRolloutRecord = (dataset, record) => {
  const existingIndex = dataset.rollouts.findIndex((item) => item.version === record.version);
  if (existingIndex >= 0) {
    dataset.rollouts[existingIndex] = record;
  } else {
    dataset.rollouts.push(record);
  }
  dataset.rollouts.sort((a, b) => (a.version > b.version ? 1 : -1));
  return dataset;
};

const main = async () => {
  const args = parseArgs(process.argv);
  const version = args.version ?? args._[0];
  const pipelineId = args.pipeline ?? 'web-release';

  if (!version) {
    throw new Error('Missing release version. Provide --version 2025.04.15');
  }

  await ensureStoreDirectory();
  const [dataset, pipeline, qualityData] = await Promise.all([
    loadJson(rolloutStorePath, { rollouts: [] }),
    loadPipelineReport(pipelineId),
    loadQualityData(),
  ]);

  const qualityStatus = deriveQualityStatus(qualityData.qualityGates ?? [], pipeline.status);
  const record = {
    version,
    status: qualityStatus === 'pass' ? 'monitoring' : qualityStatus === 'attention' ? 'hold' : 'blocked',
    generatedAt: new Date().toISOString(),
    pipeline: normalisePipelineSummary(pipeline),
    quality: {
      status: qualityStatus,
      gates: qualityData.qualityGates ?? [],
    },
    cohorts: deriveCohorts(qualityStatus),
    telemetry: deriveTelemetry(qualityStatus),
    releaseNotesPath: path.join('update_docs', 'release-notes', `${version}.md`),
  };

  const updatedDataset = upsertRolloutRecord(dataset, record);
  await writeFile(rolloutStorePath, `${JSON.stringify(updatedDataset, null, 2)}\n`, 'utf8');
  process.stdout.write(`Rollout data updated for version ${version}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
