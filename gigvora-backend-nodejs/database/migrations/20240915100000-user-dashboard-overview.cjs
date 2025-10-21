'use strict';

const { resolveJsonType, dropEnum, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableName = 'user_dashboard_overviews';

      await queryInterface.createTable(
        tableName,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          greetingName: { type: Sequelize.STRING(120), allowNull: true },
          headline: { type: Sequelize.STRING(180), allowNull: true },
          overview: { type: Sequelize.TEXT, allowNull: true },
          followersCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          followersGoal: { type: Sequelize.INTEGER, allowNull: true },
          avatarUrl: { type: Sequelize.STRING(2048), allowNull: true },
          bannerImageUrl: { type: Sequelize.STRING(2048), allowNull: true },
          trustScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          trustScoreLabel: { type: Sequelize.STRING(120), allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          ratingCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          weatherLocation: { type: Sequelize.STRING(180), allowNull: true },
          weatherLatitude: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          weatherLongitude: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          weatherUnits: {
            type: Sequelize.ENUM('metric', 'imperial'),
            allowNull: false,
            defaultValue: 'metric',
          },
          weatherSnapshot: { type: resolveJsonType(queryInterface, Sequelize), allowNull: true },
          weatherUpdatedAt: { type: Sequelize.DATE, allowNull: true },
          meta: { type: resolveJsonType(queryInterface, Sequelize), allowNull: true },
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

      await queryInterface.addIndex(tableName, ['userId'], { unique: true, transaction });
      await queryInterface.addIndex(tableName, ['weatherLocation'], { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableName = 'user_dashboard_overviews';

      await safeRemoveIndex(queryInterface, tableName, ['weatherLocation'], { transaction });
      await safeRemoveIndex(queryInterface, tableName, ['userId'], { transaction });
      await queryInterface.dropTable(tableName, { transaction });

      await dropEnum(queryInterface, 'enum_user_dashboard_overviews_weatherUnits', transaction);
    });
  },
};
