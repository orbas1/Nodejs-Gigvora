import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(__dirname, '..', 'data', 'release-rollouts.json');

const datasetCache = {
  value: null,
  loadedAt: null,
};

const loadDatasetFromDisk = async () => {
  const raw = await readFile(datasetPath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.rollouts) ? parsed.rollouts : [];
};

const calculateCohortHealth = (cohort) => {
  const progressRatio = cohort.targetPercentage ? cohort.currentPercentage / cohort.targetPercentage : 0;
  const saturation = Math.min(1, Math.max(0, progressRatio));
  const budget = typeof cohort.errorBudgetRemaining === 'number' ? cohort.errorBudgetRemaining : 1;
  const budgetStatus = budget >= 0.95 ? 'healthy' : budget >= 0.85 ? 'watch' : 'breach';
  const adoptionStatus = saturation >= 0.95 ? 'complete' : saturation >= 0.65 ? 'progressing' : 'early';

  return {
    progressRatio,
    saturation,
    budgetStatus,
    adoptionStatus,
  };
};

const deriveProgress = (cohorts) => {
  if (!cohorts.length) {
    return {
      adoption: 0,
      target: 0,
      completionRatio: 0,
    };
  }
  const target = Math.max(...cohorts.map((cohort) => cohort.targetPercentage ?? 0));
  const adoption = Math.max(...cohorts.map((cohort) => cohort.currentPercentage ?? 0));
  const completionRatio = target ? Math.min(1, adoption / target) : 0;
  return {
    adoption,
    target,
    completionRatio,
  };
};

const deriveGuardrailAlerts = (rollout) => {
  const alerts = [];
  if (rollout.telemetry?.errorBudgetRemaining !== undefined && rollout.telemetry.errorBudgetRemaining < 0.85) {
    alerts.push({
      type: 'errorBudget',
      severity: 'high',
      message: `Error budget at ${Math.round(rollout.telemetry.errorBudgetRemaining * 100)}%`,
    });
  }
  if (rollout.telemetry?.p0Incidents) {
    alerts.push({
      type: 'incident',
      severity: 'critical',
      message: `${rollout.telemetry.p0Incidents} P0 incidents recorded during rollout`,
    });
  }
  if (rollout.status === 'blocked') {
    alerts.push({
      type: 'status',
      severity: 'critical',
      message: 'Rollout is currently blocked pending guardrail recovery.',
    });
  }
  return alerts;
};

const enrichRollout = (rollout) => {
  const cohorts = (rollout.cohorts ?? []).map((cohort) => ({
    ...cohort,
    analytics: calculateCohortHealth(cohort),
  }));

  const progress = deriveProgress(cohorts);
  const alerts = deriveGuardrailAlerts(rollout);

  return {
    ...rollout,
    cohorts,
    progress,
    alerts,
  };
};

export const refreshRolloutDataset = () => {
  datasetCache.value = null;
  datasetCache.loadedAt = null;
};

export const loadRollouts = async () => {
  if (!datasetCache.value) {
    const rollouts = await loadDatasetFromDisk();
    datasetCache.value = rollouts.map(enrichRollout);
    datasetCache.loadedAt = new Date();
  }
  return datasetCache.value;
};

export const getRolloutByVersion = async (version) => {
  const rollouts = await loadRollouts();
  return rollouts.find((rollout) => rollout.version === version) ?? null;
};

export const getActiveRollouts = async () => {
  const rollouts = await loadRollouts();
  return rollouts.filter((rollout) => rollout.status === 'monitoring' || rollout.status === 'hold');
};

export const summariseRollout = (rollout) => {
  if (!rollout) {
    return null;
  }
  return {
    version: rollout.version,
    status: rollout.status,
    completionRatio: rollout.progress.completionRatio,
    alerts: rollout.alerts,
    nextMilestone: rollout.cohorts.find((cohort) => cohort.analytics.adoptionStatus !== 'complete')?.name ?? null,
  };
};

export const getRolloutDashboard = async () => {
  const rollouts = await loadRollouts();
  return rollouts.map((rollout) => ({
    version: rollout.version,
    status: rollout.status,
    progress: rollout.progress,
    telemetry: rollout.telemetry,
    alerts: rollout.alerts,
    qualityStatus: rollout.quality?.status ?? 'unknown',
  }));
};
