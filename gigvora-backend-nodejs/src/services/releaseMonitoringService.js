import sequelize from '../models/sequelizeClient.js';
import {
  ReleaseRollout,
  ReleaseRolloutCohort,
  ReleaseRolloutPipelineStep,
  ReleaseRolloutQualityGate,
} from '../models/releaseEngineeringModels.js';

const CACHE_TTL_MS = 15_000;

const datasetCache = {
  value: null,
  loadedAt: null,
};

const asNumber = (value, fallback = null) => {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const asDecimal = (value, fallback = 0, precision = 4) => {
  if (value == null) {
    return fallback;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Number.parseFloat(numeric.toFixed(precision));
};

const calculateCohortHealth = (cohort) => {
  const progressRatio = cohort.targetPercentage ? cohort.currentPercentage / cohort.targetPercentage : 0;
  const saturation = Math.min(1, Math.max(0, progressRatio));
  const budget = typeof cohort.errorBudgetRemaining === 'number' ? cohort.errorBudgetRemaining : 1;
  const budgetStatus = budget >= 0.95 ? 'healthy' : budget >= 0.85 ? 'watch' : 'breach';
  const adoptionStatus = cohort.health === 'blocked'
    ? 'halted'
    : saturation >= 0.95
    ? 'complete'
    : saturation >= 0.65
    ? 'progressing'
    : 'early';

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
  const errorBudget = rollout.telemetry?.errorBudgetRemaining;
  if (typeof errorBudget === 'number' && errorBudget < 0.85) {
    alerts.push({
      type: 'errorBudget',
      severity: errorBudget < 0.75 ? 'critical' : 'high',
      message: `Error budget at ${(errorBudget * 100).toFixed(0)}%`,
    });
  }
  if (rollout.telemetry?.p0Incidents) {
    alerts.push({
      type: 'incident',
      severity: 'critical',
      message: `${rollout.telemetry.p0Incidents} P0 incidents recorded during rollout`,
    });
  }
  if (typeof rollout.telemetry?.latencyP99Ms === 'number' && rollout.telemetry.latencyP99Ms > 180) {
    alerts.push({
      type: 'latency',
      severity: rollout.telemetry.latencyP99Ms > 220 ? 'critical' : 'high',
      message: `p99 latency at ${rollout.telemetry.latencyP99Ms}ms`,
    });
  }
  if (Array.isArray(rollout.telemetry?.regressionAlerts) && rollout.telemetry.regressionAlerts.length) {
    alerts.push({
      type: 'regression',
      severity: 'high',
      message: rollout.telemetry.regressionAlerts[0],
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

const loadRolloutEntities = async () =>
  ReleaseRollout.findAll({
    include: [
      { model: ReleaseRolloutPipelineStep, as: 'pipelineSteps' },
      { model: ReleaseRolloutQualityGate, as: 'qualityGates' },
      { model: ReleaseRolloutCohort, as: 'cohorts' },
    ],
    order: [
      ['generatedAt', 'DESC'],
      [{ model: ReleaseRolloutPipelineStep, as: 'pipelineSteps' }, 'sequence', 'ASC'],
      [{ model: ReleaseRolloutQualityGate, as: 'qualityGates' }, 'sequence', 'ASC'],
      [{ model: ReleaseRolloutCohort, as: 'cohorts' }, 'sequence', 'ASC'],
    ],
  });

export const refreshRolloutDataset = () => {
  datasetCache.value = null;
  datasetCache.loadedAt = null;
};

export const loadRollouts = async () => {
  const now = Date.now();
  if (datasetCache.value && datasetCache.loadedAt && now - datasetCache.loadedAt < CACHE_TTL_MS) {
    return datasetCache.value;
  }

  const rollouts = await loadRolloutEntities();
  const enriched = rollouts.map((entity) => enrichRollout(entity.toMonitoringPayload()));
  datasetCache.value = enriched;
  datasetCache.loadedAt = now;
  return enriched;
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
    qualityStatus: rollout.quality?.status ?? 'unknown',
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
    releaseNotesPath: rollout.releaseNotesPath ?? null,
  }));
};

const normaliseSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Invalid rollout snapshot payload.');
  }
  if (!snapshot.version) {
    throw new Error('Rollout snapshot must include a version.');
  }

  const generatedAt = snapshot.generatedAt ? new Date(snapshot.generatedAt) : new Date();
  if (Number.isNaN(generatedAt.getTime())) {
    throw new Error('Invalid generatedAt date provided in rollout snapshot.');
  }

  const pipelineFinishedAt = snapshot.pipeline?.finishedAt
    ? new Date(snapshot.pipeline.finishedAt)
    : null;

  if (pipelineFinishedAt && Number.isNaN(pipelineFinishedAt.getTime())) {
    throw new Error('Invalid pipeline finishedAt value provided in rollout snapshot.');
  }

  const quality = snapshot.quality ?? {};
  const telemetry = snapshot.telemetry ?? {};

  return {
    version: snapshot.version,
    status: snapshot.status ?? 'draft',
    generatedAt,
    releaseNotesPath: snapshot.releaseNotesPath ?? null,
    pipeline: {
      id: snapshot.pipeline?.id ?? null,
      name: snapshot.pipeline?.name ?? null,
      status: snapshot.pipeline?.status ?? 'unknown',
      finishedAt: pipelineFinishedAt,
      durationMs: asNumber(snapshot.pipeline?.durationMs, null),
      steps: Array.isArray(snapshot.pipeline?.steps) ? snapshot.pipeline.steps : [],
    },
    quality: {
      status: quality.status ?? 'unknown',
      gates: Array.isArray(quality.gates) ? quality.gates : [],
    },
    telemetry: {
      errorBudgetRemaining: asDecimal(telemetry.errorBudgetRemaining, null),
      p0Incidents: asNumber(telemetry.p0Incidents, 0),
      latencyP99Ms: asNumber(telemetry.latencyP99Ms, null),
      regressionAlerts: Array.isArray(telemetry.regressionAlerts) ? telemetry.regressionAlerts : [],
    },
    cohorts: Array.isArray(snapshot.cohorts) ? snapshot.cohorts : [],
  };
};

const persistAssociations = async (rolloutId, snapshot, transaction) => {
  await Promise.all([
    ReleaseRolloutPipelineStep.destroy({ where: { rolloutId }, transaction }),
    ReleaseRolloutQualityGate.destroy({ where: { rolloutId }, transaction }),
    ReleaseRolloutCohort.destroy({ where: { rolloutId }, transaction }),
  ]);

  if (snapshot.pipeline.steps.length) {
    await ReleaseRolloutPipelineStep.bulkCreate(
      snapshot.pipeline.steps.map((step, index) => ({
        rolloutId,
        sequence: index,
        stepId: step.id,
        name: step.name,
        status: step.status ?? 'pending',
        durationMs: asNumber(step.durationMs, null),
        commands: Array.isArray(step.commands)
          ? step.commands.map((command) => ({
              id: command.id ?? command.command ?? `command-${index}`,
              label: command.label ?? command.display ?? command.command ?? '',
              command: command.command ?? '',
              workingDirectory: command.workingDirectory ?? command.cwd ?? null,
              status: command.status ?? 'passed',
              durationMs: asNumber(command.durationMs, null),
            }))
          : [],
      })),
      { transaction },
    );
  }

  if (snapshot.quality.gates.length) {
    await ReleaseRolloutQualityGate.bulkCreate(
      snapshot.quality.gates.map((gate, index) => ({
        rolloutId,
        sequence: index,
        name: gate.name,
        status: gate.status ?? 'pending',
        evidence: gate.evidence ?? '',
      })),
      { transaction },
    );
  }

  if (snapshot.cohorts.length) {
    await ReleaseRolloutCohort.bulkCreate(
      snapshot.cohorts.map((cohort, index) => ({
        rolloutId,
        sequence: index,
        name: cohort.name,
        targetPercentage: asDecimal(cohort.targetPercentage, 0),
        currentPercentage: asDecimal(cohort.currentPercentage, 0),
        errorBudgetRemaining: asDecimal(cohort.errorBudgetRemaining, 1),
        health: cohort.health ?? 'healthy',
        notes: Array.isArray(cohort.notes) ? cohort.notes : [],
      })),
      { transaction },
    );
  }
};

export const persistRolloutSnapshot = async (inputSnapshot) => {
  const snapshot = normaliseSnapshot(inputSnapshot);

  const result = await sequelize.transaction(async (transaction) => {
    const [rollout] = await ReleaseRollout.findOrCreate({
      where: { version: snapshot.version },
      defaults: {
        status: snapshot.status,
        generatedAt: snapshot.generatedAt,
        releaseNotesPath: snapshot.releaseNotesPath,
        pipelineId: snapshot.pipeline.id,
        pipelineName: snapshot.pipeline.name,
        pipelineStatus: snapshot.pipeline.status,
        pipelineFinishedAt: snapshot.pipeline.finishedAt,
        pipelineDurationMs: snapshot.pipeline.durationMs,
        qualityStatus: snapshot.quality.status,
        telemetryErrorBudgetRemaining: snapshot.telemetry.errorBudgetRemaining,
        telemetryP0Incidents: snapshot.telemetry.p0Incidents,
        telemetryLatencyP99Ms: snapshot.telemetry.latencyP99Ms,
        telemetryRegressionAlerts: snapshot.telemetry.regressionAlerts,
      },
      transaction,
    });

    await rollout.update(
      {
        status: snapshot.status,
        generatedAt: snapshot.generatedAt,
        releaseNotesPath: snapshot.releaseNotesPath,
        pipelineId: snapshot.pipeline.id,
        pipelineName: snapshot.pipeline.name,
        pipelineStatus: snapshot.pipeline.status,
        pipelineFinishedAt: snapshot.pipeline.finishedAt,
        pipelineDurationMs: snapshot.pipeline.durationMs,
        qualityStatus: snapshot.quality.status,
        telemetryErrorBudgetRemaining: snapshot.telemetry.errorBudgetRemaining,
        telemetryP0Incidents: snapshot.telemetry.p0Incidents,
        telemetryLatencyP99Ms: snapshot.telemetry.latencyP99Ms,
        telemetryRegressionAlerts: snapshot.telemetry.regressionAlerts,
      },
      { transaction },
    );

    await persistAssociations(rollout.id, snapshot, transaction);

    await rollout.reload({
      include: [
        { model: ReleaseRolloutPipelineStep, as: 'pipelineSteps' },
        { model: ReleaseRolloutQualityGate, as: 'qualityGates' },
        { model: ReleaseRolloutCohort, as: 'cohorts' },
      ],
      transaction,
    });

    return rollout;
  });

  refreshRolloutDataset();
  return enrichRollout(result.toMonitoringPayload());
};
