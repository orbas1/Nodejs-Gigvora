'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'agency_dashboard_overviews',
        {
          id: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          workspaceId: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            references: {
              model: 'provider_workspaces',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          greetingName: {
            type: Sequelize.STRING(150),
            allowNull: false,
            defaultValue: 'Agency team',
          },
          greetingHeadline: {
            type: Sequelize.STRING(200),
            allowNull: false,
            defaultValue: 'Keep every client and project on track.',
          },
          overviewSummary: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          avatarUrl: {
            type: Sequelize.STRING(2048),
            allowNull: true,
          },
          followerCount: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
          },
          trustScore: {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
          },
          rating: {
            type: Sequelize.DECIMAL(3, 2),
            allowNull: true,
          },
          highlights: {
            type: Sequelize.JSONB ?? Sequelize.JSON,
            allowNull: true,
          },
          weatherLocation: {
            type: Sequelize.STRING(180),
            allowNull: true,
          },
          weatherLatitude: {
            type: Sequelize.DECIMAL(10, 6),
            allowNull: true,
          },
          weatherLongitude: {
            type: Sequelize.DECIMAL(10, 6),
            allowNull: true,
          },
          weatherProvider: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          weatherSnapshot: {
            type: Sequelize.JSONB ?? Sequelize.JSON,
            allowNull: true,
          },
          weatherLastCheckedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          metadata: {
            type: Sequelize.JSONB ?? Sequelize.JSON,
            allowNull: true,
          },
          createdById: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          updatedById: {
            type: Sequelize.INTEGER.UNSIGNED,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'SET NULL',
            onDelete: 'SET NULL',
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'agency_dashboard_overviews',
        {
          unique: true,
          fields: ['workspaceId'],
          name: 'agency_dashboard_overviews_workspace_id_unique',
          transaction,
        },
      );

      await queryInterface.addIndex(
        'agency_dashboard_overviews',
        {
          fields: ['weatherLocation'],
          name: 'agency_dashboard_overviews_weather_location_idx',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'agency_dashboard_overviews',
        'agency_dashboard_overviews_weather_location_idx',
        { transaction },
      );

      await queryInterface.removeIndex(
        'agency_dashboard_overviews',
        'agency_dashboard_overviews_workspace_id_unique',
        { transaction },
      );

      await queryInterface.dropTable('agency_dashboard_overviews', { transaction });
    });
  },
};
