'use strict';

const { QueryTypes } = require('sequelize');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function determineDurationCategory(duration) {
  if (!duration || typeof duration !== 'string') {
    return null;
  }
  const text = duration.toLowerCase();
  if (/week|sprint/.test(text)) {
    return 'short_term';
  }
  if (/month|quarter/.test(text)) {
    return 'medium_term';
  }
  if (/year|long/.test(text)) {
    return 'long_term';
  }
  return null;
}

function parseBudgetAmount(value) {
  if (value == null) {
    return null;
  }
  const numeric = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function computeTrustScore(amount) {
  if (!Number.isFinite(amount)) {
    return 64;
  }
  if (amount >= 7500) {
    return 78;
  }
  if (amount >= 5000) {
    return 72;
  }
  if (amount >= 3000) {
    return 68;
  }
  return 64;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
      const definition = await queryInterface.describeTable('gigs', { transaction });

      const ensureColumn = async (column, spec) => {
        if (!Object.prototype.hasOwnProperty.call(definition, column)) {
          await queryInterface.addColumn('gigs', column, spec, { transaction });
        }
      };

      await ensureColumn('durationCategory', { type: Sequelize.STRING(60), allowNull: true });
      await ensureColumn('aiSignals', { type: jsonType, allowNull: true });

      const indexes = await queryInterface.showIndex('gigs', { transaction });
      const hasDurationIndex = indexes.some((index) => index.name === 'gigs_duration_category_idx');
      if (!hasDurationIndex) {
        await queryInterface.addIndex('gigs', ['durationCategory'], {
          name: 'gigs_duration_category_idx',
          transaction,
        });
      }

      const hasBudgetCurrencyIndex = indexes.some((index) => index.name === 'gigs_budget_currency_idx');
      if (!hasBudgetCurrencyIndex && Object.prototype.hasOwnProperty.call(definition, 'budgetCurrency')) {
        await queryInterface.addIndex('gigs', ['budgetCurrency'], {
          name: 'gigs_budget_currency_idx',
          transaction,
        });
      }

      const gigs = await queryInterface.sequelize.query(
        'SELECT id, duration, "durationCategory" as "durationCategory", budget, "budgetAmount" as "budgetAmount", "updatedAt" as "updatedAt", location FROM gigs',
        { type: QueryTypes.SELECT, transaction },
      );

      const now = Date.now();

      for (const gig of gigs) {
        const durationCategory = determineDurationCategory(gig.duration) || gig.durationCategory || null;
        const budgetAmount = parseBudgetAmount(gig.budgetAmount ?? gig.budget);
        const trustScore = computeTrustScore(budgetAmount);
        const updatedAt = gig.updatedAt ? new Date(gig.updatedAt).getTime() : now;
        const ageDays = Math.max(0, Math.min(90, (now - updatedAt) / MS_PER_DAY));
        const freshnessSeed = Number((1 - ageDays / 90).toFixed(4));
        const remotePreference =
          typeof gig.location === 'string' && gig.location.toLowerCase().includes('remote') ? 0.72 : 0.48;

        const updates = {
          aiSignals: {
            trustScore,
            freshnessSeed,
            taxonomyConfidence: 0.62,
            remotePreference,
          },
        };

        if (durationCategory) {
          updates.durationCategory = durationCategory;
        }

        await queryInterface.bulkUpdate('gigs', updates, { id: gig.id }, { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const indexes = await queryInterface.showIndex('gigs', { transaction });
      if (indexes.some((index) => index.name === 'gigs_duration_category_idx')) {
        await queryInterface.removeIndex('gigs', 'gigs_duration_category_idx', { transaction });
      }
      if (indexes.some((index) => index.name === 'gigs_budget_currency_idx')) {
        await queryInterface.removeIndex('gigs', 'gigs_budget_currency_idx', { transaction });
      }

      const definition = await queryInterface.describeTable('gigs', { transaction });
      const dropColumnIfExists = async (column) => {
        if (Object.prototype.hasOwnProperty.call(definition, column)) {
          await queryInterface.removeColumn('gigs', column, { transaction });
        }
      };

      await dropColumnIfExists('aiSignals');
      await dropColumnIfExists('durationCategory');
    });
  },
};
