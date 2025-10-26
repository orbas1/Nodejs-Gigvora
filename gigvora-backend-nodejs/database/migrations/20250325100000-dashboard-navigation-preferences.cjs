'use strict';

const TABLE_NAME = 'user_dashboard_navigation_preferences';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function describeTableSafe(queryInterface, tableName, options) {
  try {
    return await queryInterface.describeTable(tableName, options);
  } catch (error) {
    if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('does not exist')) {
      return null;
    }
    throw error;
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const definition = await describeTableSafe(queryInterface, TABLE_NAME, { transaction });

      if (!definition) {
        await queryInterface.createTable(
          TABLE_NAME,
          {
            id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
            userId: {
              allowNull: false,
              type: Sequelize.INTEGER,
              references: { model: 'users', key: 'id' },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
            },
            dashboardKey: { allowNull: false, type: Sequelize.STRING(80), defaultValue: 'global' },
            collapsed: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: false },
            order: { allowNull: false, type: jsonType, defaultValue: [] },
            hidden: { allowNull: false, type: jsonType, defaultValue: [] },
            pinned: { allowNull: false, type: jsonType, defaultValue: [] },
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

        await queryInterface.addIndex(TABLE_NAME, ['userId', 'dashboardKey'], {
          transaction,
          name: 'user_dashboard_navigation_preferences_user_dashboard_key',
          unique: true,
        });
        return;
      }

      const hasDashboardKey = Object.prototype.hasOwnProperty.call(definition, 'dashboardKey');
      if (!hasDashboardKey) {
        await queryInterface.addColumn(
          TABLE_NAME,
          'dashboardKey',
          { allowNull: false, type: Sequelize.STRING(80), defaultValue: 'global' },
          { transaction },
        );
      }

      const hasCollapsed = Object.prototype.hasOwnProperty.call(definition, 'collapsed');
      if (!hasCollapsed) {
        await queryInterface.addColumn(
          TABLE_NAME,
          'collapsed',
          { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: false },
          { transaction },
        );
      }

      const hasOrder = Object.prototype.hasOwnProperty.call(definition, 'order');
      if (!hasOrder) {
        await queryInterface.addColumn(
          TABLE_NAME,
          'order',
          { allowNull: false, type: jsonType, defaultValue: [] },
          { transaction },
        );
      }

      const hasHidden = Object.prototype.hasOwnProperty.call(definition, 'hidden');
      if (!hasHidden) {
        await queryInterface.addColumn(
          TABLE_NAME,
          'hidden',
          { allowNull: false, type: jsonType, defaultValue: [] },
          { transaction },
        );
      }

      const hasPinned = Object.prototype.hasOwnProperty.call(definition, 'pinned');
      if (!hasPinned) {
        await queryInterface.addColumn(
          TABLE_NAME,
          'pinned',
          { allowNull: false, type: jsonType, defaultValue: [] },
          { transaction },
        );
      }

      const indexes = await queryInterface.showIndex(TABLE_NAME, { transaction });
      const hasUniqueIndex = Array.isArray(indexes)
        ? indexes.some((index) => Array.isArray(index.fields)
            && index.fields.length === 2
            && index.fields[0].attribute === 'userId'
            && index.fields[1].attribute === 'dashboardKey')
        : false;

      if (!hasUniqueIndex) {
        await queryInterface.addIndex(TABLE_NAME, ['userId', 'dashboardKey'], {
          transaction,
          name: 'user_dashboard_navigation_preferences_user_dashboard_key',
          unique: true,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const indexes = await queryInterface.showIndex(TABLE_NAME, { transaction }).catch(() => []);
      const hasIndex = Array.isArray(indexes)
        ? indexes.some((index) => index.name === 'user_dashboard_navigation_preferences_user_dashboard_key')
        : false;

      if (hasIndex) {
        await queryInterface.removeIndex(TABLE_NAME, 'user_dashboard_navigation_preferences_user_dashboard_key', {
          transaction,
        });
      }

      await queryInterface.dropTable(TABLE_NAME, { transaction }).catch(() => undefined);
    });
  },
};
