'use strict';

const TABLE_NAME = 'user_risk_assessments';

function computeRiskSignal(user, index) {
  const factors = [];
  let score = 25;
  let level = 'low';

  const status = (user.status || '').toLowerCase();
  if (status === 'suspended' || status === 'archived') {
    level = 'high';
    score += 45;
    factors.push({ code: 'account_status', weight: 40, description: 'Account currently suspended or archived' });
  } else if (status === 'invited') {
    level = 'medium';
    score += 20;
    factors.push({ code: 'awaiting_activation', weight: 20, description: 'User invitation pending activation' });
  }

  const lastSeen = user.lastSeenAt || user.lastLoginAt || user.updatedAt || user.createdAt;
  if (!lastSeen) {
    level = level === 'high' ? 'high' : 'medium';
    score += 15;
    factors.push({ code: 'no_activity', weight: 15, description: 'No recent activity recorded for this account' });
  } else {
    const lastSeenDate = new Date(lastSeen);
    const diffDays = Number.isNaN(lastSeenDate.getTime())
      ? 0
      : Math.floor((Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 120) {
      level = 'high';
      score += 35;
      factors.push({ code: 'inactive_120_days', weight: 30, description: 'No login within the past 120 days' });
    } else if (diffDays > 60) {
      if (level !== 'high') {
        level = 'medium';
      }
      score += 20;
      factors.push({ code: 'inactive_60_days', weight: 20, description: 'No login within the past 60 days' });
    }
  }

  if (user.twoFactorEnabled === false) {
    if (level === 'low') {
      level = 'medium';
    }
    score += 20;
    factors.push({ code: 'two_factor_disabled', weight: 20, description: 'Two-factor authentication disabled' });
  }

  if (level === 'low' && index % 7 === 0) {
    level = 'medium';
    score += 10;
    factors.push({ code: 'random_sampling', weight: 10, description: 'Spot check triggered by rolling sampling cadence' });
  }

  score = Math.min(95, Math.max(5, score));

  const summaryParts = [
    `Risk level set to ${level.toUpperCase()} based on account telemetry`,
    `Score calibrated at ${score.toFixed(1)} to inform admin escalation queues`,
  ];
  if (factors.length) {
    summaryParts.push(
      `Signals: ${factors
        .slice(0, 3)
        .map((factor) => factor.code.replace(/_/g, ' '))
        .join(', ')}`,
    );
  }

  return {
    level,
    score: Number(score.toFixed(1)),
    factors,
    summary: summaryParts.join('. '),
  };
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [users] = await queryInterface.sequelize.query(
        `SELECT id, status, "lastLoginAt" AS "lastLoginAt", "lastSeenAt" AS "lastSeenAt", "updatedAt" AS "updatedAt", "createdAt" AS "createdAt", "twoFactorEnabled" AS "twoFactorEnabled"
         FROM users
         ORDER BY id
         LIMIT 250`,
        { transaction },
      );

      if (!Array.isArray(users) || users.length === 0) {
        await transaction.commit();
        return;
      }

      const [existing] = await queryInterface.sequelize.query(
        `SELECT user_id FROM ${TABLE_NAME}`,
        { transaction },
      );
      const existingIds = new Set((existing || []).map((row) => Number(row.user_id)));

      const now = new Date();
      const rows = users
        .filter((user) => !existingIds.has(Number(user.id)))
        .map((user, index) => {
          const signal = computeRiskSignal(user, index);
          return {
            user_id: user.id,
            risk_level: signal.level,
            risk_score: signal.score,
            risk_summary: signal.summary,
            risk_factors: signal.factors,
            assessed_at: now,
            created_at: now,
            updated_at: now,
          };
        });

      if (rows.length) {
        await queryInterface.bulkInsert(TABLE_NAME, rows, { transaction });
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
      await queryInterface.bulkDelete(TABLE_NAME, null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
