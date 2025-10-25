'use strict';

const CURRENCY_SYMBOL_MAP = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₤': 'GBP',
  '₹': 'INR',
};

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

function parseBudgetRange(rawBudget) {
  if (!rawBudget) {
    return { currency: null, min: null, max: null };
  }

  const text = String(rawBudget).trim();
  if (!text) {
    return { currency: null, min: null, max: null };
  }

  let currency = null;
  const symbolMatch = text.match(/[€£¥₹$]/u);
  if (symbolMatch) {
    currency = CURRENCY_SYMBOL_MAP[symbolMatch[0]] ?? null;
  }

  const codeMatch = text.match(/\b[A-Z]{3}\b/);
  if (codeMatch) {
    currency = codeMatch[0];
  }

  const numberMatches = text
    .replace(/[,]/g, '')
    .match(/\d+(?:\.\d+)?/g);
  if (!numberMatches || !numberMatches.length) {
    return { currency, min: null, max: null };
  }

  const numbers = numberMatches.map((entry) => Number.parseFloat(entry)).filter((value) => Number.isFinite(value));
  if (!numbers.length) {
    return { currency, min: null, max: null };
  }

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return { currency, min, max };
}

function inferDeliveryWindow(durationText) {
  if (!durationText) {
    return { speed: null, windowDays: null };
  }

  const text = String(durationText).toLowerCase();
  if (/(48\s?hour|2\s?day|48h)/.test(text)) {
    return { speed: '48h', windowDays: 2 };
  }
  if (/(1\s?week|7\s?day)/.test(text)) {
    return { speed: '7d', windowDays: 7 };
  }
  if (/(2\s?week|14\s?day)/.test(text)) {
    return { speed: '14d', windowDays: 14 };
  }
  if (/(3\s?week|21\s?day)/.test(text)) {
    return { speed: '21d', windowDays: 21 };
  }
  if (/(month|30\s?day)/.test(text)) {
    return { speed: 'flex', windowDays: 30 };
  }
  return { speed: 'flex', windowDays: null };
}

async function ensureIndex(queryInterface, table, name, fields, options = {}) {
  const indexes = await queryInterface.showIndex(table, options);
  if (!Array.isArray(indexes) || !indexes.some((index) => index.name === name)) {
    await queryInterface.addIndex(table, fields, { name, ...options });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const definition = await queryInterface.describeTable('gigs', { transaction });
      const addColumnIfMissing = async (name, config) => {
        if (!Object.prototype.hasOwnProperty.call(definition, name)) {
          await queryInterface.addColumn('gigs', name, config, { transaction });
        }
      };

      await addColumnIfMissing('budgetCurrency', { type: Sequelize.STRING(6), allowNull: true });
      await addColumnIfMissing('budgetMinAmount', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
      await addColumnIfMissing('budgetMaxAmount', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
      await addColumnIfMissing('deliverySpeed', { type: Sequelize.STRING(32), allowNull: true });
      await addColumnIfMissing('deliveryWindowDays', { type: Sequelize.INTEGER, allowNull: true });
      await addColumnIfMissing('trustSignals', { type: jsonType, allowNull: true });

      await ensureIndex(
        queryInterface,
        'gigs',
        'gigs_budget_range_idx_v2',
        ['budgetMinAmount', 'budgetMaxAmount'],
        { transaction },
      );
      await ensureIndex(queryInterface, 'gigs', 'gigs_delivery_speed_idx', ['deliverySpeed'], { transaction });

      const [rows] = await queryInterface.sequelize.query(
        'SELECT id, budget, duration, trustSignals FROM gigs',
        { transaction },
      );

      for (const row of rows) {
        const { currency, min, max } = parseBudgetRange(row.budget);
        const delivery = inferDeliveryWindow(row.duration);
        const trustSignals = row.trustSignals && typeof row.trustSignals === 'object'
          ? row.trustSignals
          : {
              verifiedBuyer: true,
              escrowProtected: true,
              reviewCount: 0,
              repeatHireRate: null,
              satisfactionScore: null,
            };

        await queryInterface.bulkUpdate(
          'gigs',
          {
            budgetCurrency: currency ?? null,
            budgetMinAmount: min != null ? min : null,
            budgetMaxAmount: max != null ? max : null,
            deliverySpeed: delivery.speed,
            deliveryWindowDays: delivery.windowDays,
            trustSignals,
          },
          { id: row.id },
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropIndexIfExists = async (table, name) => {
        try {
          await queryInterface.removeIndex(table, name, { transaction });
        } catch (error) {
          if (!/does not exist/i.test(error.message)) {
            throw error;
          }
        }
      };

      await dropIndexIfExists('gigs', 'gigs_delivery_speed_idx');
      await dropIndexIfExists('gigs', 'gigs_budget_range_idx_v2');

      const definition = await queryInterface.describeTable('gigs', { transaction });
      const removeColumnIfPresent = async (name) => {
        if (Object.prototype.hasOwnProperty.call(definition, name)) {
          await queryInterface.removeColumn('gigs', name, { transaction });
        }
      };

      await removeColumnIfPresent('trustSignals');
      await removeColumnIfPresent('deliveryWindowDays');
      await removeColumnIfPresent('deliverySpeed');
      await removeColumnIfPresent('budgetMaxAmount');
      await removeColumnIfPresent('budgetMinAmount');
      await removeColumnIfPresent('budgetCurrency');
    });
  },
};
