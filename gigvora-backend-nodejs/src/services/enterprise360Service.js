import { Op } from 'sequelize';

import {
  EnterpriseReleaseTrack,
  ExecutiveAlignmentInitiative,
} from '../models/enterprise360Models.js';
import { appCache, buildCacheKey } from '../utils/cache.js';

const CACHE_TTL_SECONDS = 60;

const defaultDependencies = {
  models: {
    EnterpriseReleaseTrack,
    ExecutiveAlignmentInitiative,
  },
  cache: appCache,
};

const state = {
  models: { ...defaultDependencies.models },
  cache: defaultDependencies.cache,
};

export function __setDependencies({ models, cache } = {}) {
  if (models) {
    state.models = {
      EnterpriseReleaseTrack: models.EnterpriseReleaseTrack ?? state.models.EnterpriseReleaseTrack,
      ExecutiveAlignmentInitiative:
        models.ExecutiveAlignmentInitiative ?? state.models.ExecutiveAlignmentInitiative,
    };
  }
  if (cache) {
    state.cache = cache;
  }
}

export function __resetDependencies() {
  state.models = { ...defaultDependencies.models };
  state.cache = defaultDependencies.cache;
}

function toNumber(value, precision = 1) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number.parseFloat(numeric.toFixed(precision));
}

function normaliseBlockers(blockers) {
  if (!Array.isArray(blockers)) {
    return [];
  }
  return blockers
    .filter(Boolean)
    .map((blocker) => ({
      code: blocker.code ?? blocker.id ?? blocker.title ?? 'issue',
      severity: `${blocker.severity ?? 'medium'}`.toLowerCase(),
      summary: blocker.summary ?? blocker.description ?? null,
      owner: blocker.owner ?? blocker.team ?? null,
      detectedAt: blocker.detectedAt ?? blocker.detected_at ?? null,
    }));
}

function normaliseTrack(track) {
  if (!track) {
    return null;
  }
  const json = typeof track.toJSON === 'function' ? track.toJSON() : track;
  return {
    platformKey: json.platformKey ?? json.platform_key ?? null,
    platformName: json.platformName ?? json.platform_name ?? null,
    channel: json.channel ?? 'stable',
    currentVersion: json.currentVersion ?? json.current_version ?? null,
    parityScore: toNumber(json.parityScore ?? json.parity_score ?? 0, 1),
    mobileReadiness: json.mobileReadiness != null ? toNumber(json.mobileReadiness, 1) : null,
    releaseVelocityWeeks:
      json.releaseVelocityWeeks != null ? toNumber(json.releaseVelocityWeeks, 1) : null,
    lastReleaseAt: json.lastReleaseAt ?? json.last_release_at ?? null,
    nextReleaseWindow: json.nextReleaseWindow ?? json.next_release_window ?? null,
    status: `${json.status ?? 'stable'}`.toLowerCase(),
    blockers: normaliseBlockers(json.blockers ?? []),
    notes: json.notes ?? null,
    active: Boolean(json.active ?? true),
  };
}

function isMobileTrack(track) {
  if (!track) {
    return false;
  }
  const key = `${track.platformKey ?? ''}`.toLowerCase();
  const name = `${track.platformName ?? ''}`.toLowerCase();
  return (
    key.includes('ios') ||
    key.includes('android') ||
    key.includes('mobile') ||
    key.includes('tablet') ||
    name.includes('ios') ||
    name.includes('android') ||
    name.includes('mobile') ||
    name.includes('tablet')
  );
}

function classifyContinuityRisk(tracks = []) {
  if (tracks.some((track) => track.status === 'blocked')) {
    return 'critical';
  }
  if (tracks.some((track) => track.status === 'delayed')) {
    return 'elevated';
  }
  return 'steady';
}

function normaliseInitiative(initiative) {
  if (!initiative) {
    return null;
  }
  const json = typeof initiative.toJSON === 'function' ? initiative.toJSON() : initiative;
  return {
    initiativeKey: json.initiativeKey ?? json.initiative_key ?? null,
    title: json.title ?? null,
    executiveOwner: json.executiveOwner ?? json.executive_owner ?? null,
    sponsorTeam: json.sponsorTeam ?? json.sponsor_team ?? null,
    status: `${json.status ?? 'planning'}`.toLowerCase(),
    progressPercent: toNumber(json.progressPercent ?? json.progress_percent ?? 0, 1),
    riskLevel: `${json.riskLevel ?? json.risk_level ?? 'medium'}`.toLowerCase(),
    nextMilestoneAt: json.nextMilestoneAt ?? json.next_milestone_at ?? null,
    lastReviewAt: json.lastReviewAt ?? json.last_review_at ?? null,
    governanceCadence: json.governanceCadence ?? json.governance_cadence ?? null,
    outcomeMetric: json.outcomeMetric ?? json.outcome_metric ?? null,
    narrative: json.narrative ?? null,
    notes: json.notes ?? null,
  };
}

function computeSummary(tracks, initiatives) {
  const activeTracks = tracks.filter((track) => track.active !== false);
  const parityScores = activeTracks.map((track) => track.parityScore).filter(Number.isFinite);
  const parityScore = parityScores.length
    ? toNumber(parityScores.reduce((sum, score) => sum + score, 0) / parityScores.length, 1)
    : 0;

  const mobileTracks = activeTracks.filter(isMobileTrack);
  const mobileReadinessValues = mobileTracks
    .map((track) => track.mobileReadiness)
    .filter((value) => Number.isFinite(Number(value)));
  const mobileReadinessScore = mobileReadinessValues.length
    ? toNumber(
        mobileReadinessValues.reduce((sum, score) => sum + score, 0) / mobileReadinessValues.length,
        1,
      )
    : null;

  const velocityValues = activeTracks
    .map((track) => track.releaseVelocityWeeks)
    .filter((value) => Number.isFinite(Number(value)));
  const releaseVelocityWeeks = velocityValues.length
    ? toNumber(velocityValues.reduce((sum, value) => sum + value, 0) / velocityValues.length, 1)
    : null;

  const nextReleaseWindow = activeTracks
    .map((track) => (track.nextReleaseWindow ? new Date(track.nextReleaseWindow) : null))
    .filter((date) => date && Number.isFinite(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const blockers = activeTracks.flatMap((track) => track.blockers ?? []);
  const atRiskInitiatives = initiatives.filter((item) =>
    ['at_risk', 'blocked'].includes(item.status ?? ''),
  );

  return {
    parityScore,
    mobileReadinessScore,
    releaseVelocityWeeks,
    nextReleaseWindow: nextReleaseWindow ? nextReleaseWindow.toISOString() : null,
    activeBlockers: blockers.length,
    platformCount: activeTracks.length,
    mobileContinuityRisk: classifyContinuityRisk(mobileTracks),
    atRiskInitiativeCount: atRiskInitiatives.length,
  };
}

function buildContinuitySnapshot(tracks) {
  const mobileTracks = tracks.filter(isMobileTrack);
  const riskLevel = classifyContinuityRisk(mobileTracks);
  const parityScores = mobileTracks.map((track) => track.parityScore).filter(Number.isFinite);
  const readinessScores = mobileTracks
    .map((track) => track.mobileReadiness)
    .filter((value) => Number.isFinite(Number(value)));

  return {
    riskLevel,
    averageParity: parityScores.length
      ? toNumber(parityScores.reduce((sum, score) => sum + score, 0) / parityScores.length, 1)
      : null,
    averageReadiness: readinessScores.length
      ? toNumber(
          readinessScores.reduce((sum, score) => sum + score, 0) / readinessScores.length,
          1,
        )
      : null,
    platforms: mobileTracks.map((track) => ({
      platformKey: track.platformKey,
      platformName: track.platformName,
      parityScore: track.parityScore,
      mobileReadiness: track.mobileReadiness,
      nextReleaseWindow: track.nextReleaseWindow,
      status: track.status,
      blockers: track.blockers,
    })),
  };
}

function buildGovernanceSnapshot(initiatives) {
  const atRisk = initiatives.filter((item) => ['at_risk', 'blocked'].includes(item.status));
  const owners = Array.from(
    new Set(
      initiatives
        .map((item) => (item.executiveOwner ? item.executiveOwner.trim() : null))
        .filter(Boolean),
    ),
  );
  const nextSteering = initiatives
    .map((item) => (item.nextMilestoneAt ? new Date(item.nextMilestoneAt) : null))
    .filter((date) => date && Number.isFinite(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const lastReview = initiatives
    .map((item) => (item.lastReviewAt ? new Date(item.lastReviewAt) : null))
    .filter((date) => date && Number.isFinite(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const cadenceCounts = initiatives.reduce((accumulator, initiative) => {
    if (!initiative.governanceCadence) {
      return accumulator;
    }
    const cadence = initiative.governanceCadence.trim();
    accumulator[cadence] = (accumulator[cadence] ?? 0) + 1;
    return accumulator;
  }, {});

  const cadence = Object.entries(cadenceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label)[0];

  return {
    atRiskCount: atRisk.length,
    executiveOwners: owners,
    nextSteeringDate: nextSteering ? nextSteering.toISOString() : null,
    lastReviewedAt: lastReview ? lastReview.toISOString() : null,
    cadence,
  };
}

export async function getEnterprise360Snapshot({ includeInactive = false } = {}) {
  const cacheKey = buildCacheKey('enterprise:360', { includeInactive: Boolean(includeInactive) });
  return state.cache.remember(cacheKey, CACHE_TTL_SECONDS, async () => {
    const whereClause = includeInactive
      ? {}
      : {
          [Op.or]: [{ active: true }, { active: { [Op.is]: null } }],
        };

    const [tracksRaw, initiativesRaw] = await Promise.all([
      state.models.EnterpriseReleaseTrack.findAll({
        where: whereClause,
        order: [
          ['status', 'ASC'],
          ['parityScore', 'DESC'],
        ],
      }),
      state.models.ExecutiveAlignmentInitiative.findAll({
        order: [
          ['status', 'ASC'],
          ['nextMilestoneAt', 'ASC'],
        ],
      }),
    ]);

    const tracks = tracksRaw.map(normaliseTrack).filter(Boolean);
    const initiatives = initiativesRaw.map(normaliseInitiative).filter(Boolean);

    const summary = computeSummary(tracks, initiatives);
    const continuity = buildContinuitySnapshot(tracks);
    const governance = buildGovernanceSnapshot(initiatives);

    return {
      summary,
      continuity,
      tracks,
      initiatives,
      governance,
      generatedAt: new Date().toISOString(),
    };
  });
}

export default {
  getEnterprise360Snapshot,
  __setDependencies,
  __resetDependencies,
};
