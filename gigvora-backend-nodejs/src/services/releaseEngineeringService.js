import releaseEngineeringDataset from '../data/releaseEngineeringDataset.js';

const STATUS_ORDER = ['passing', 'attention', 'failing'];
const STAGE_ORDER = ['pilot', 'staged-rollout', 'ga-ready'];

function normalisePipeline(pipeline) {
  const coverage = typeof pipeline.coverage === 'number' ? pipeline.coverage : 0;
  const durationMs = typeof pipeline.durationMs === 'number' ? pipeline.durationMs : 0;
  const lastRunAt = pipeline.lastRun ? new Date(pipeline.lastRun) : null;
  const blockers = Array.isArray(pipeline.blockers) ? pipeline.blockers : [];

  return {
    ...pipeline,
    coverage,
    durationMs,
    lastRunAt,
    blockers,
    status: pipeline.status || 'attention',
    success: (pipeline.status || 'attention') === 'passing' && blockers.length === 0,
    attention: blockers.length > 0 || (pipeline.status && pipeline.status !== 'passing'),
  };
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  return sum / values.length;
}

function calculateOverallStatus(pipelines) {
  const ranking = pipelines.map((pipeline) => STATUS_ORDER.indexOf(pipeline.status));
  if (ranking.length === 0) {
    return 'passing';
  }
  const worstIndex = Math.max(...ranking.filter((index) => index >= 0));
  return STATUS_ORDER[worstIndex] ?? 'passing';
}

function normaliseReleaseNote(note) {
  const highlights = Array.isArray(note.highlights) ? note.highlights : [];
  const qaApprovals = Array.isArray(note.qaApprovals) ? note.qaApprovals : [];
  const riskRegister = Array.isArray(note.riskRegister) ? note.riskRegister : [];
  const releasedAt = note.releasedAt ? new Date(note.releasedAt) : null;

  const worstRisk = riskRegister.reduce((worst, entry) => {
    if (!entry?.severity) {
      return worst;
    }
    if (!worst) {
      return entry.severity;
    }
    if (entry.severity === 'high') {
      return 'high';
    }
    if (entry.severity === 'medium' && worst !== 'high') {
      return 'medium';
    }
    return worst;
  }, null);

  return {
    ...note,
    highlights,
    qaApprovals,
    riskRegister,
    releasedAt,
    highlightCount: highlights.length,
    approvalCount: qaApprovals.length,
    riskLevel: worstRisk ?? (riskRegister.length ? 'low' : 'none'),
  };
}

function normaliseCohort(cohort) {
  const adoptionRate = typeof cohort.adoptionRate === 'number' ? cohort.adoptionRate : 0;
  const healthScore = typeof cohort.healthScore === 'number' ? cohort.healthScore : 0;
  const blockers = Array.isArray(cohort.blockers) ? cohort.blockers : [];

  return {
    ...cohort,
    adoptionRate,
    healthScore,
    blockers,
    rolloutStartAt: cohort.rolloutStart ? new Date(cohort.rolloutStart) : null,
    targetDecisionAt: cohort.targetDecision ? new Date(cohort.targetDecision) : null,
    nextCheckpointAt: cohort.nextCheckpoint ? new Date(cohort.nextCheckpoint) : null,
    riskLevel: blockers.length ? 'attention' : healthScore >= 0.85 ? 'strong' : 'watch',
    stageRank: STAGE_ORDER.indexOf(cohort.stage ?? 'pilot'),
  };
}

export class ReleaseEngineeringService {
  constructor(dataset = releaseEngineeringDataset) {
    this.dataset = dataset;
  }

  getPipelineSummary() {
    const pipelines = (this.dataset.pipelines ?? []).map(normalisePipeline);
    const total = pipelines.length;
    const passing = pipelines.filter((pipeline) => pipeline.status === 'passing').length;
    const attention = pipelines.filter((pipeline) => pipeline.status !== 'passing').length;
    const blockers = pipelines.flatMap((pipeline) => pipeline.blockers);
    const averageCoverage = average(pipelines.map((pipeline) => pipeline.coverage));
    const averageDurationMs = average(pipelines.map((pipeline) => pipeline.durationMs));
    const lastRunAt = pipelines.reduce((latest, pipeline) => {
      if (!pipeline.lastRunAt) {
        return latest;
      }
      if (!latest || pipeline.lastRunAt > latest) {
        return pipeline.lastRunAt;
      }
      return latest;
    }, null);

    return {
      pipelines,
      stats: {
        total,
        passing,
        attention,
        blockers,
        averageCoverage,
        averageDurationMs,
        lastRunAt,
        overallStatus: calculateOverallStatus(pipelines),
      },
      tooling: this.dataset.tooling ?? {},
    };
  }

  getReleaseNotes() {
    const notes = (this.dataset.releaseNotes ?? [])
      .map(normaliseReleaseNote)
      .sort((a, b) => (b.releasedAt?.getTime() ?? 0) - (a.releasedAt?.getTime() ?? 0));

    const latest = notes[0] ?? null;
    const approvalDelta = latest ? latest.approvalCount : 0;

    return {
      notes,
      latest,
      stats: {
        total: notes.length,
        latestVersion: latest?.version ?? null,
        approvalDelta,
        averageHighlightCount: average(notes.map((note) => note.highlightCount)),
      },
    };
  }

  getUpgradeRollouts() {
    const cohorts = (this.dataset.upgradeCohorts ?? [])
      .map(normaliseCohort)
      .sort((a, b) => {
        if (a.stageRank !== b.stageRank) {
          return (a.stageRank ?? 0) - (b.stageRank ?? 0);
        }
        return (b.adoptionRate ?? 0) - (a.adoptionRate ?? 0);
      });

    const stats = {
      total: cohorts.length,
      gaReady: cohorts.filter((cohort) => cohort.stage === 'ga-ready').length,
      pilots: cohorts.filter((cohort) => cohort.stage === 'pilot').length,
      averageAdoption: average(cohorts.map((cohort) => cohort.adoptionRate)),
      blockers: cohorts.flatMap((cohort) => cohort.blockers),
    };

    return { cohorts, stats };
  }

  getOperationsSuite() {
    const pipelineSummary = this.getPipelineSummary();
    const releaseNotes = this.getReleaseNotes();
    const upgradeRollouts = this.getUpgradeRollouts();
    const generatedAt = new Date();

    return {
      generatedAt,
      pipelines: pipelineSummary,
      releases: releaseNotes,
      rollouts: upgradeRollouts,
      health: {
        pipelines: pipelineSummary.stats.overallStatus,
        releaseCurrency: releaseNotes.latest?.releasedAt ?? null,
        blockers: [
          ...pipelineSummary.stats.blockers,
          ...upgradeRollouts.stats.blockers,
        ],
      },
    };
  }
}

const releaseEngineeringService = new ReleaseEngineeringService();

export default releaseEngineeringService;
