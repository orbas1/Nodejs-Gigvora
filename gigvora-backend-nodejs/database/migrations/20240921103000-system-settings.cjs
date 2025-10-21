'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'system_settings',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          category: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'global' },
          value: { type: jsonType, allowNull: false },
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
        'system_settings',
        ['key'],
        {
          unique: true,
          name: 'system_settings_key_unique',
          transaction,
        },
      );

      await queryInterface.addIndex('system_settings', ['category'], {
        name: 'system_settings_category_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface
        .removeIndex('system_settings', 'system_settings_key_unique', { transaction })
        .catch(() => {});
      await queryInterface.removeIndex('system_settings', ['category'], { transaction }).catch(() => {});

      await queryInterface.dropTable('system_settings', { transaction });
    });
  },
};
