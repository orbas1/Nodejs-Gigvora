'use strict';

const { resolveJsonType, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

const SEARCH_METADATA_VERSION = '2024.11.workspace-search.v1';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toNumber(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toScore(value) {
  const numeric = toNumber(value);
  if (numeric == null) {
    return null;
  }
  return Math.max(0, Math.min(100, Number(numeric.toFixed(1))));
}

function computeRankingScore(row) {
  const weights = [];
  const health = toScore(row.healthScore);
  if (health != null) {
    weights.push({ weight: 0.35, value: health });
  }
  const velocity = toScore(row.velocityScore);
  if (velocity != null) {
    weights.push({ weight: 0.25, value: velocity });
  }
  const progress = toScore(row.progressPercent);
  if (progress != null) {
    weights.push({ weight: 0.2, value: progress });
  }
  const automation = toScore(row.automationCoverage);
  if (automation != null) {
    weights.push({ weight: 0.1, value: automation });
  }
  const satisfactionRaw = toNumber(row.clientSatisfaction);
  if (satisfactionRaw != null) {
    const satisfaction = satisfactionRaw <= 5 ? satisfactionRaw * 20 : satisfactionRaw;
    weights.push({ weight: 0.1, value: Math.max(0, Math.min(100, satisfaction)) });
  }
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) {
    return 40;
  }
  const weighted =
    weights.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
  return Math.max(0, Math.min(100, Number(weighted.toFixed(1))));
}

function computeTier(score) {
  if (score >= 90) return 'signature';
  if (score >= 75) return 'premium';
  if (score >= 55) return 'core';
  return 'emerging';
}

function computeFreshness(row, now = new Date()) {
  const lastActivity = row.lastActivityAt ? new Date(row.lastActivityAt) : null;
  const timestamp = lastActivity && !Number.isNaN(lastActivity.getTime()) ? lastActivity : null;
  const daysSince = timestamp ? Math.max(0, Math.floor((now - timestamp) / MS_PER_DAY)) : null;
  let status = 'dormant';
  if (daysSince != null) {
    if (daysSince <= 3) {
      status = 'vibrant';
    } else if (daysSince <= 14) {
      status = 'active';
    } else if (daysSince <= 30) {
      status = 'cooling';
    }
  }
  const decayRate = daysSince == null ? null : Number(Math.min(daysSince / 30, 1).toFixed(2));
  return {
    status,
    updatedAt: timestamp ? timestamp.toISOString() : null,
    daysSinceInteraction: daysSince,
    decayRate,
    signals:
      status === 'dormant'
        ? ['reengage_campaign']
        : daysSince != null && daysSince <= 2
          ? ['recent_activity']
          : ['steady_engagement'],
  };
}

function buildRankingSignals(row, score) {
  const signals = new Set();
  const health = toScore(row.healthScore);
  if (health != null && health >= 85) {
    signals.add('health_elite');
  }
  const velocity = toScore(row.velocityScore);
  if (velocity != null && velocity >= 80) {
    signals.add('velocity_prime');
  }
  if (score >= 70) {
    signals.add('momentum_on_track');
  }
  const automation = toScore(row.automationCoverage);
  if (automation != null && automation >= 65) {
    signals.add('automation_scaled');
  }
  const satisfactionRaw = toNumber(row.clientSatisfaction);
  if (satisfactionRaw != null && satisfactionRaw >= 4.5) {
    signals.add('client_delight');
  }
  return Array.from(signals);
}

function buildAudienceTags(row) {
  const tags = new Set();
  const status = (row.status ?? '').toLowerCase();
  if (status === 'active' || status === 'briefing') {
    tags.add('active-engagement');
  }
  const risk = (row.riskLevel ?? '').toLowerCase();
  if (risk === 'low') {
    tags.add('low-risk');
  } else if (risk === 'high') {
    tags.add('critical-support');
  }
  const automation = toScore(row.automationCoverage);
  if (automation != null && automation >= 70) {
    tags.add('automation-led');
  }
  const billing = (row.billingStatus ?? '').toLowerCase();
  if (billing === 'retainer' || billing === 'active') {
    tags.add('enterprise-ready');
  }
  return Array.from(tags);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.addColumn(
        'project_workspaces',
        'searchMetadata',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchMetadataVersion',
        { type: Sequelize.STRING(32), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchRankingScore',
        { type: Sequelize.DECIMAL(5, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchRankingTier',
        { type: Sequelize.STRING(32), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchRankingSignals',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchFreshnessStatus',
        { type: Sequelize.STRING(32), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchFreshnessUpdatedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchFreshnessSignals',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchAudienceTags',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchHighlightedMentorIds',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'project_workspaces',
        'searchFeaturedGroupSlugs',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex(
        'project_workspaces',
        ['searchRankingTier'],
        {
          name: 'project_workspaces_search_ranking_tier_idx',
          transaction,
        },
      );
      await queryInterface.addIndex(
        'project_workspaces',
        ['searchFreshnessStatus'],
        {
          name: 'project_workspaces_search_freshness_status_idx',
          transaction,
        },
      );

      const [workspaces] = await queryInterface.sequelize.query(
        `SELECT id, status, healthScore, velocityScore, progressPercent, clientSatisfaction, automationCoverage, riskLevel, billingStatus, lastActivityAt
         FROM project_workspaces`,
        { transaction },
      );

      const now = new Date();
      for (const workspace of workspaces) {
        const rankingScore = computeRankingScore(workspace);
        const tier = computeTier(rankingScore);
        const rankingSignals = buildRankingSignals(workspace, rankingScore);
        const freshness = computeFreshness(workspace, now);
        const audienceTags = buildAudienceTags(workspace);

        const metadata = {
          ranking: {
            score: rankingScore,
            tier,
            lastEvaluatedAt: now.toISOString(),
            algorithmVersion: SEARCH_METADATA_VERSION,
            signals: rankingSignals,
          },
          freshness,
          audienceTags,
          highlightedMentors: [],
          featuredGroups: [],
        };

        await queryInterface.bulkUpdate(
          'project_workspaces',
          {
            searchMetadata: metadata,
            searchMetadataVersion: SEARCH_METADATA_VERSION,
            searchRankingScore: rankingScore,
            searchRankingTier: tier,
            searchRankingSignals: rankingSignals,
            searchFreshnessStatus: freshness.status,
            searchFreshnessUpdatedAt: freshness.updatedAt ? new Date(freshness.updatedAt) : null,
            searchFreshnessSignals: freshness.signals,
            searchAudienceTags: audienceTags,
            searchHighlightedMentorIds: [],
            searchFeaturedGroupSlugs: [],
          },
          { id: workspace.id },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await safeRemoveIndex(
        queryInterface,
        'project_workspaces',
        'project_workspaces_search_ranking_tier_idx',
        { transaction },
      );
      await safeRemoveIndex(
        queryInterface,
        'project_workspaces',
        'project_workspaces_search_freshness_status_idx',
        { transaction },
      );

      await queryInterface.removeColumn('project_workspaces', 'searchFeaturedGroupSlugs', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchHighlightedMentorIds', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchAudienceTags', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchFreshnessSignals', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchFreshnessUpdatedAt', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchFreshnessStatus', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchRankingSignals', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchRankingTier', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchRankingScore', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchMetadataVersion', { transaction });
      await queryInterface.removeColumn('project_workspaces', 'searchMetadata', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
