'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableName = 'agency_calendar_events';

      await queryInterface.createTable(
        tableName,
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          workspaceId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: {
              model: 'provider_workspaces',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          createdById: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          title: {
            allowNull: false,
            type: Sequelize.STRING(255),
          },
          description: {
            allowNull: true,
            type: Sequelize.TEXT,
          },
          notes: {
            allowNull: true,
            type: Sequelize.TEXT,
          },
          eventType: {
            allowNull: false,
            type: Sequelize.ENUM('project', 'interview', 'gig', 'mentorship', 'volunteering'),
            defaultValue: 'project',
          },
          status: {
            allowNull: false,
            type: Sequelize.ENUM('planned', 'confirmed', 'completed', 'cancelled', 'tentative'),
            defaultValue: 'planned',
          },
          visibility: {
            allowNull: false,
            type: Sequelize.ENUM('internal', 'client', 'public'),
            defaultValue: 'internal',
          },
          relatedEntityType: {
            allowNull: true,
            type: Sequelize.STRING(120),
          },
          relatedEntityId: {
            allowNull: true,
            type: Sequelize.INTEGER,
          },
          location: {
            allowNull: true,
            type: Sequelize.STRING(255),
          },
          meetingUrl: {
            allowNull: true,
            type: Sequelize.STRING(500),
          },
          coverImageUrl: {
            allowNull: true,
            type: Sequelize.STRING(500),
          },
          attachments: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          guestEmails: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          reminderOffsets: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
          },
          isAllDay: {
            allowNull: false,
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          timezone: {
            allowNull: true,
            type: Sequelize.STRING(120),
          },
          startsAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          endsAt: {
            allowNull: true,
            type: Sequelize.DATE,
          },
          metadata: {
            allowNull: true,
            type: Sequelize.JSONB ?? Sequelize.JSON,
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

      await Promise.all([
        queryInterface.addIndex(tableName, ['workspaceId'], { transaction }),
        queryInterface.addIndex(tableName, ['eventType'], { transaction }),
        queryInterface.addIndex(tableName, ['status'], { transaction }),
        queryInterface.addIndex(tableName, ['startsAt'], { transaction }),
      ]);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableName = 'agency_calendar_events';

      await queryInterface.removeIndex(tableName, ['startsAt'], { transaction }).catch(() => {});
      await queryInterface.removeIndex(tableName, ['status'], { transaction }).catch(() => {});
      await queryInterface.removeIndex(tableName, ['eventType'], { transaction }).catch(() => {});
      await queryInterface.removeIndex(tableName, ['workspaceId'], { transaction }).catch(() => {});

      await queryInterface.dropTable(tableName, { transaction });

      const enumNames = [
        'enum_agency_calendar_events_eventType',
        'enum_agency_calendar_events_status',
        'enum_agency_calendar_events_visibility',
      ];

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await Promise.all(
          enumNames.map((enumName) =>
            queryInterface.sequelize
              .query(`DROP TYPE IF EXISTS "${enumName}"`, { transaction })
              .catch(() => {}),
          ),
        );
      }
    });
  },
};

