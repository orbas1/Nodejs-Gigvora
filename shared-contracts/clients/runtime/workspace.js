/**
 * Utility helpers for interpreting workspace health metrics shared across Gigvora clients.
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
};
