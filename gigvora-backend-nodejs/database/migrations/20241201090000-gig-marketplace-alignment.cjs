'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const schema = await queryInterface.describeTable('gigs', { transaction });

      const ensureColumn = async (column, definition) => {
        if (!Object.prototype.hasOwnProperty.call(schema, column)) {
          await queryInterface.addColumn('gigs', column, definition, { transaction });
        }
      };

      await ensureColumn('budgetAmount', { type: Sequelize.DECIMAL(12, 2), allowNull: true });
      await ensureColumn('budgetCurrency', { type: Sequelize.STRING(6), allowNull: true });
      await ensureColumn('deliverySpeedLabel', { type: Sequelize.STRING(120), allowNull: true });
      await ensureColumn('deliverySpeedCategory', { type: Sequelize.STRING(40), allowNull: true });
      await ensureColumn('deliveryLeadTimeDays', { type: Sequelize.INTEGER, allowNull: true });
      await ensureColumn('workModel', { type: Sequelize.STRING(120), allowNull: true });
      await ensureColumn('engagementModel', { type: Sequelize.STRING(120), allowNull: true });
      await ensureColumn('conversationId', { type: Sequelize.STRING(120), allowNull: true });
      await ensureColumn('ratingAverage', { type: Sequelize.DECIMAL(3, 2), allowNull: true });
      await ensureColumn('ratingCount', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
      await ensureColumn('completedOrderCount', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
      await ensureColumn('identityVerified', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
      await ensureColumn('escrowReady', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
      await ensureColumn('trustSignals', { type: jsonType, allowNull: true });
      await ensureColumn('metadata', { type: jsonType, allowNull: true });
      await ensureColumn('taxonomySlugs', { type: jsonType, allowNull: true });
      await ensureColumn('taxonomyLabels', { type: jsonType, allowNull: true });
      await ensureColumn('taxonomyTypes', { type: jsonType, allowNull: true });
      await ensureColumn('searchBoost', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
      await ensureColumn('savedCount', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });

      const ensureIndex = async (indexName, fields, options = {}) => {
        const indexes = await queryInterface.showIndex('gigs', { transaction });
        if (!indexes.some((index) => index.name === indexName)) {
          await queryInterface.addIndex('gigs', fields, { name: indexName, transaction, ...options });
        }
      };

      await ensureIndex('gigs_budget_amount_idx', ['budgetAmount']);
      await ensureIndex('gigs_delivery_speed_idx', ['deliverySpeedCategory']);
      await ensureIndex('gigs_identity_verified_idx', ['identityVerified']);
      await ensureIndex('gigs_escrow_ready_idx', ['escrowReady']);
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const schema = await queryInterface.describeTable('gigs', { transaction });

      const dropColumnIfExists = async (column) => {
        if (Object.prototype.hasOwnProperty.call(schema, column)) {
          await queryInterface.removeColumn('gigs', column, { transaction });
        }
      };

      await dropColumnIfExists('budgetAmount');
      await dropColumnIfExists('budgetCurrency');
      await dropColumnIfExists('deliverySpeedLabel');
      await dropColumnIfExists('deliverySpeedCategory');
      await dropColumnIfExists('deliveryLeadTimeDays');
      await dropColumnIfExists('workModel');
      await dropColumnIfExists('engagementModel');
      await dropColumnIfExists('conversationId');
      await dropColumnIfExists('ratingAverage');
      await dropColumnIfExists('ratingCount');
      await dropColumnIfExists('completedOrderCount');
      await dropColumnIfExists('identityVerified');
      await dropColumnIfExists('escrowReady');
      await dropColumnIfExists('trustSignals');
      await dropColumnIfExists('metadata');
      await dropColumnIfExists('taxonomySlugs');
      await dropColumnIfExists('taxonomyLabels');
      await dropColumnIfExists('taxonomyTypes');
      await dropColumnIfExists('searchBoost');
      await dropColumnIfExists('savedCount');

      const dropIndexIfExists = async (indexName) => {
        const indexes = await queryInterface.showIndex('gigs', { transaction });
        if (indexes.some((index) => index.name === indexName)) {
          await queryInterface.removeIndex('gigs', indexName, { transaction });
        }
      };

      await dropIndexIfExists('gigs_budget_amount_idx');
      await dropIndexIfExists('gigs_delivery_speed_idx');
      await dropIndexIfExists('gigs_identity_verified_idx');
      await dropIndexIfExists('gigs_escrow_ready_idx');
    });
  },
};
