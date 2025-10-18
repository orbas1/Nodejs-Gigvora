'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'freelancer_dashboard_overviews',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: { type: Sequelize.INTEGER, allowNull: false },
          headline: { type: Sequelize.STRING(255), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          avatarUrl: { type: Sequelize.STRING(2048), allowNull: true },
          followerCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          followerGoal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          trustScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          trustScoreChange: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          ratingCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          workstreams: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: false, defaultValue: [] },
          relationshipHealth: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          upcomingSchedule: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: false, defaultValue: [] },
          weatherLocation: { type: Sequelize.STRING(255), allowNull: true },
          weatherLatitude: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          weatherLongitude: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          weatherUnits: { type: Sequelize.ENUM('metric', 'imperial'), allowNull: false, defaultValue: 'metric' },
          weatherLastCheckedAt: { type: Sequelize.DATE, allowNull: true },
          weatherSnapshot: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          metadata: { type: Sequelize.JSONB ?? Sequelize.JSON, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addConstraint(
        'freelancer_dashboard_overviews',
        {
          type: 'unique',
          fields: ['freelancerId'],
          name: 'freelancer_dashboard_overviews_freelancerId_unique',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'freelancer_dashboard_overviews',
        ['freelancerId'],
        {
          name: 'freelancer_dashboard_overviews_freelancerId_idx',
          unique: false,
          transaction,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('freelancer_dashboard_overviews', { transaction });

      if (queryInterface.sequelize.getDialect() === 'postgres') {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_freelancer_dashboard_overviews_weatherUnits";',
          { transaction },
        );
      }
    });
  },
};
