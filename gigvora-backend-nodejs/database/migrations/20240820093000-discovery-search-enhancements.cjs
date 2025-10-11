'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    const addGeoColumns = async (tableName, { includeLocationColumn = false } = {}) => {
      if (includeLocationColumn) {
        const columns = await queryInterface.describeTable(tableName);
        if (!columns.location) {
          await queryInterface.addColumn(tableName, 'location', {
            type: Sequelize.STRING(255),
            allowNull: true,
          });
        }
      }

      const columns = await queryInterface.describeTable(tableName);
      if (!columns.geoLocation) {
        await queryInterface.addColumn(tableName, 'geoLocation', {
          type: jsonType,
          allowNull: true,
        });
      }
    };

    await addGeoColumns('jobs');
    await addGeoColumns('gigs', { includeLocationColumn: true });
    await addGeoColumns('projects', { includeLocationColumn: true });
    await addGeoColumns('experience_launchpads', { includeLocationColumn: true });
    await addGeoColumns('volunteering_roles', { includeLocationColumn: true });

    await queryInterface.createTable('search_subscriptions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      category: {
        type: Sequelize.ENUM('job', 'gig', 'project', 'launchpad', 'volunteering', 'people', 'mixed'),
        allowNull: false,
        defaultValue: 'job',
      },
      query: { type: Sequelize.STRING(500), allowNull: true },
      filters: { type: jsonType, allowNull: true },
      sort: { type: Sequelize.STRING(120), allowNull: true },
      frequency: {
        type: Sequelize.ENUM('immediate', 'daily', 'weekly'),
        allowNull: false,
        defaultValue: 'daily',
      },
      notifyByEmail: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notifyInApp: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      lastTriggeredAt: { type: Sequelize.DATE, allowNull: true },
      nextRunAt: { type: Sequelize.DATE, allowNull: true },
      mapViewport: { type: jsonType, allowNull: true },
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
    });

    await queryInterface.addIndex('search_subscriptions', ['userId', 'category']);
    await queryInterface.addIndex('search_subscriptions', ['frequency']);
    await queryInterface.addIndex('search_subscriptions', ['nextRunAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('search_subscriptions', ['userId', 'category']).catch(() => {});
    await queryInterface.removeIndex('search_subscriptions', ['frequency']).catch(() => {});
    await queryInterface.removeIndex('search_subscriptions', ['nextRunAt']).catch(() => {});
    await queryInterface.dropTable('search_subscriptions');

    const dropGeoColumns = async (tableName, dropLocation = false) => {
      const columns = await queryInterface.describeTable(tableName);
      if (columns.geoLocation) {
        await queryInterface.removeColumn(tableName, 'geoLocation');
      }
      if (dropLocation && columns.location) {
        await queryInterface.removeColumn(tableName, 'location');
      }
    };

    await dropGeoColumns('jobs');
    await dropGeoColumns('gigs', true);
    await dropGeoColumns('projects', true);
    await dropGeoColumns('experience_launchpads', true);
    await dropGeoColumns('volunteering_roles', true);

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_search_subscriptions_category";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_search_subscriptions_frequency";');
    }
  },
};
