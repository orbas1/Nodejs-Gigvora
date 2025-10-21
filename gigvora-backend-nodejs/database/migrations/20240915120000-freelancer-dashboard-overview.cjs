'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'freelancer_dashboard_overviews',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          headline: { type: Sequelize.STRING(255), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          avatarUrl: { type: Sequelize.STRING(2048), allowNull: true },
          followerCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          followerGoal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          trustScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          trustScoreChange: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          ratingCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          workstreams: { type: jsonType, allowNull: false, defaultValue: [] },
          relationshipHealth: { type: jsonType, allowNull: true },
          upcomingSchedule: { type: jsonType, allowNull: false, defaultValue: [] },
          weatherLocation: { type: Sequelize.STRING(255), allowNull: true },
          weatherLatitude: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          weatherLongitude: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          weatherUnits: { type: Sequelize.ENUM('metric', 'imperial'), allowNull: false, defaultValue: 'metric' },
          weatherLastCheckedAt: { type: Sequelize.DATE, allowNull: true },
          weatherSnapshot: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addConstraint('freelancer_dashboard_overviews', {
        type: 'unique',
        fields: ['freelancerId'],
        name: 'freelancer_dashboard_overviews_freelancerId_unique',
        transaction,
      });

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

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('freelancer_dashboard_overviews', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_freelancer_dashboard_overviews_weatherUnits";',
          { transaction },
        );
      }
    });
  },
};
