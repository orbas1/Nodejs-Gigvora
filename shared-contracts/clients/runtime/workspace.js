/**
 * Utility helpers for interpreting workspace health metrics shared across Gigvora clients.
 * The helpers here strive for an executive-ready tone so downstream experiences feel polished
 * across web, mobile, and admin environments.
 * @module shared-contracts/runtime/workspace
 */

/**
 * @typedef {import('../typescript/marketplace/workspace').Workspace} Workspace
 */

const SCORE_BANDS = [
  { threshold: 90, label: 'excellent' },
  { threshold: 75, label: 'healthy' },
  { threshold: 60, label: 'watch' },
  { threshold: 40, label: 'at-risk' },
  { threshold: 0, label: 'critical' },
];

const RANKING_TIERS = [
  { threshold: 90, tier: 'signature' },
  { threshold: 75, tier: 'premium' },
  { threshold: 55, tier: 'core' },
  { threshold: 0, tier: 'emerging' },
];

const FRESHNESS_STATES = [
  { maxDays: 3, status: 'vibrant' },
  { maxDays: 14, status: 'active' },
  { maxDays: 30, status: 'cooling' },
  { maxDays: Infinity, status: 'dormant' },
];

const VALID_RANKING_TIERS = new Set(RANKING_TIERS.map((entry) => entry.tier));
const VALID_FRESHNESS_STATUSES = new Set(FRESHNESS_STATES.map((entry) => entry.status));

const COVERAGE_BANDS = [
  { threshold: 75, label: 'high' },
  { threshold: 40, label: 'moderate' },
  { threshold: 10, label: 'low' },
  { threshold: 0, label: 'none' },
];

function normaliseNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

function formatScore(value) {
  const number = normaliseNumber(value);
  if (number === null) {
    return '—';
  }
  return `${Math.round(number)}%`;
}

function gradeScore(value) {
  const number = normaliseNumber(value);
  if (number === null) {
    return 'unknown';
  }
  const band = SCORE_BANDS.find((entry) => number >= entry.threshold);
  return band ? band.label : 'unknown';
}

function normaliseDate(value) {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp).toISOString();
}

function deriveCoverageLabel(value) {
  const number = normaliseNumber(value);
  if (number === null) {
    return 'none';
  }
  const band = COVERAGE_BANDS.find((entry) => number >= entry.threshold);
  return band ? band.label : 'none';
}

function computeRankingTier(score) {
  const number = normaliseNumber(score);
  if (number === null) {
    return 'emerging';
  }
  const band = RANKING_TIERS.find((entry) => number >= entry.threshold);
  return band ? band.tier : 'emerging';
}

function normaliseStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((item) => typeof item === 'string' && item.trim().length > 0))];
}

function normaliseNumberArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [...new Set(value.filter((item) => Number.isInteger(item) && item > 0))];
}

function computeFreshnessStatus(freshness) {
  if (!freshness) {
    return 'dormant';
  }

  if (typeof freshness.status === 'string' && VALID_FRESHNESS_STATUSES.has(freshness.status)) {
    return freshness.status;
  }

  const days = normaliseNumber(freshness.daysSinceInteraction);
  if (days === null) {
    return 'dormant';
  }

  const band = FRESHNESS_STATES.find((entry) => days <= entry.maxDays);
  return band ? band.status : 'dormant';
}

function normaliseSearchFilters(filters) {
  const ranking = filters && typeof filters === 'object' ? filters.ranking : null;
  const freshness = filters && typeof filters === 'object' ? filters.freshness : null;

  const rankingScore = ranking ? normaliseNumber(ranking.score) : null;
  const evaluatedAt = ranking && ranking.lastEvaluatedAt ? normaliseDate(ranking.lastEvaluatedAt) : null;

  const derivedTier = computeRankingTier(rankingScore ?? null);
  const tier =
    ranking && typeof ranking.tier === 'string' && VALID_RANKING_TIERS.has(ranking.tier)
      ? ranking.tier
      : derivedTier;

  const status = computeFreshnessStatus(freshness);

  return {
    ranking: {
      score: rankingScore,
      tier,
      lastEvaluatedAt: evaluatedAt,
      algorithmVersion: ranking && typeof ranking.algorithmVersion === 'string' ? ranking.algorithmVersion : null,
      signals: ranking ? normaliseStringArray(ranking.signals) : [],
    },
    freshness: {
      status,
      updatedAt: freshness && freshness.updatedAt ? normaliseDate(freshness.updatedAt) : null,
      daysSinceInteraction:
        freshness && freshness.daysSinceInteraction != null
          ? normaliseNumber(freshness.daysSinceInteraction)
          : null,
      decayRate:
        freshness && freshness.decayRate != null ? normaliseNumber(freshness.decayRate) : null,
      signals: freshness ? normaliseStringArray(freshness.signals) : [],
    },
    audienceTags: normaliseStringArray(filters && filters.audienceTags),
    highlightedMentors: normaliseNumberArray(filters && filters.highlightedMentors),
    featuredGroups: normaliseStringArray(filters && filters.featuredGroups),
  };
}

function buildScorePayload(value) {
  return {
    value: normaliseNumber(value),
    grade: gradeScore(value),
    display: formatScore(value),
  };
}

/**
 * Normalise a workspace record into a structure suited for UI rendering.
 *
 * @param {Workspace} workspace - Workspace payload from the shared contracts package.
 * @returns {{
 *   id: number;
 *   projectId: number;
 *  status: Workspace['status'];
 *   riskLevel: Workspace['riskLevel'];
 *   scores: {
 *     health: ReturnType<typeof buildScorePayload>;
 *     velocity: ReturnType<typeof buildScorePayload>;
 *     progress: ReturnType<typeof buildScorePayload>;
 *     automation: ReturnType<typeof buildScorePayload> & { coverageLabel: string };
 *   };
 *   clientSatisfaction: ReturnType<typeof buildScorePayload>;
 *   billingStatus: string | null;
 *   nextMilestone: {
 *     label: string | null;
 *     dueAt: string | null;
 *   };
 *   lastActivityAt: string | null;
 * }}
 */
export function normaliseWorkspaceHealth(workspace) {
  if (!workspace || typeof workspace !== 'object') {
    throw new TypeError('A workspace object is required to normalise health metrics.');
  }

  const automationScore = buildScorePayload(workspace.automationCoverage);
  return {
    id: workspace.id,
    projectId: workspace.projectId,
    status: workspace.status,
    riskLevel: workspace.riskLevel,
    scores: {
      health: buildScorePayload(workspace.healthScore),
      velocity: buildScorePayload(workspace.velocityScore),
      progress: buildScorePayload(workspace.progressPercent),
      automation: {
        ...automationScore,
        coverageLabel: deriveCoverageLabel(workspace.automationCoverage),
      },
    },
    clientSatisfaction: buildScorePayload(
      typeof workspace.clientSatisfaction === 'number'
        ? workspace.clientSatisfaction * 20
        : workspace.clientSatisfaction,
    ),
    billingStatus: workspace.billingStatus ?? null,
    nextMilestone: {
      label: workspace.nextMilestone ?? null,
      dueAt: normaliseDate(workspace.nextMilestoneDueAt),
    },
    lastActivityAt: normaliseDate(workspace.lastActivityAt),
    searchFilters: normaliseSearchFilters(workspace.searchFilters ?? {}),
  };
}

/**
 * Translate an automation coverage percentage into a friendly label without requiring
 * consumers to reproduce banding logic.
 *
 * @param {number | null | undefined} coverage - Percentage (0-100) describing automated task coverage.
 * @returns {'high' | 'moderate' | 'low' | 'none'}
 */
export function computeAutomationCoverageLabel(coverage) {
  return deriveCoverageLabel(coverage);
}

export const __private__ = {
  normaliseNumber,
  gradeScore,
  deriveCoverageLabel,
  buildScorePayload,
  normaliseDate,
  computeRankingTier,
  computeFreshnessStatus,
  normaliseSearchFilters,
  normaliseStringArray,
  normaliseNumberArray,
};

export { computeRankingTier, computeFreshnessStatus };
