'use strict';

const BUNDLES_TABLE = 'freelancer_catalog_bundles';
const METRICS_TABLE = 'freelancer_catalog_bundle_metrics';
const REPEAT_CLIENTS_TABLE = 'freelancer_repeat_clients';
const CROSS_SELL_TABLE = 'freelancer_cross_sell_opportunities';
const KEYWORDS_TABLE = 'freelancer_keyword_impressions';
const MARGIN_TABLE = 'freelancer_margin_snapshots';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        BUNDLES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          basePrice: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(BUNDLES_TABLE, ['freelancerId'], { transaction });

      await queryInterface.createTable(
        METRICS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          bundleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: BUNDLES_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          periodStart: { type: Sequelize.DATEONLY, allowNull: false },
          periodEnd: { type: Sequelize.DATEONLY, allowNull: false },
          impressions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          clicks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          conversions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          revenue: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          repeatClients: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          attachRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          upsellRevenue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        METRICS_TABLE,
        ['bundleId', 'periodStart', 'periodEnd'],
        { transaction, unique: true },
      );

      await queryInterface.createTable(
        REPEAT_CLIENTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          clientName: { type: Sequelize.STRING(255), allowNull: false },
          clientCompany: { type: Sequelize.STRING(255), allowNull: true },
          lastOrderAt: { type: Sequelize.DATE, allowNull: true },
          totalOrders: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          lifetimeValue: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          isRetainer: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          retainerStartDate: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        REPEAT_CLIENTS_TABLE,
        ['freelancerId', 'clientName', 'clientCompany'],
        { transaction, unique: true },
      );

      await queryInterface.createTable(
        CROSS_SELL_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          fromBundleId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: BUNDLES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
          },
          toBundleId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: BUNDLES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          signal: { type: Sequelize.TEXT, allowNull: false },
          recommendedAction: { type: Sequelize.TEXT, allowNull: false },
          expectedUpliftPercentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          expectedRevenue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          confidence: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          priority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 2 },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(CROSS_SELL_TABLE, ['freelancerId', 'priority'], { transaction });

      await queryInterface.createTable(
        KEYWORDS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          keyword: { type: Sequelize.STRING(255), allowNull: false },
          region: { type: Sequelize.STRING(120), allowNull: true },
          impressions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          clicks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          conversions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          trendPercentage: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          capturedAt: { type: Sequelize.DATE, allowNull: false },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(KEYWORDS_TABLE, ['freelancerId', 'keyword'], { transaction });
      await queryInterface.addIndex(
        KEYWORDS_TABLE,
        ['freelancerId', 'keyword', 'region', 'capturedAt'],
        { transaction, unique: true },
      );

      await queryInterface.createTable(
        MARGIN_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          month: { type: Sequelize.DATEONLY, allowNull: false },
          revenue: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          softwareCosts: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          subcontractorCosts: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          fulfillmentCosts: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        MARGIN_TABLE,
        ['freelancerId', 'month'],
        { transaction, unique: true },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(MARGIN_TABLE, { transaction });
      await queryInterface.dropTable(KEYWORDS_TABLE, { transaction });
      await queryInterface.dropTable(CROSS_SELL_TABLE, { transaction });
      await queryInterface.dropTable(REPEAT_CLIENTS_TABLE, { transaction });
      await queryInterface.dropTable(METRICS_TABLE, { transaction });
      await queryInterface.dropTable(BUNDLES_TABLE, { transaction });
    });
  },
};
