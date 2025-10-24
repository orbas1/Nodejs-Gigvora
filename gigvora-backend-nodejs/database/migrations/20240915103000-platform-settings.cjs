'use strict';

const { resolveJsonType, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('platform_settings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      key: { type: Sequelize.STRING(160), allowNull: false },
      environmentScope: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'global',
      },
      category: {
        type: Sequelize.STRING(60),
        allowNull: false,
        defaultValue: 'general',
      },
      description: { type: Sequelize.STRING(500), allowNull: true },
      valueType: {
        type: Sequelize.ENUM('json', 'string', 'number', 'boolean'),
        allowNull: false,
        defaultValue: 'json',
      },
      value: { type: jsonType, allowNull: false, defaultValue: {} },
      isEditable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      isSensitive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      tags: { type: jsonType, allowNull: false, defaultValue: [] },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      updatedBy: { type: Sequelize.STRING(120), allowNull: true },
      version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      lockedAt: { type: Sequelize.DATE, allowNull: true },
      lockedBy: { type: Sequelize.STRING(120), allowNull: true },
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

    await queryInterface.addIndex('platform_settings', ['key', 'environmentScope'], {
      unique: true,
      name: 'platform_settings_key_env_unique',
    });

    await queryInterface.addIndex('platform_settings', ['category'], {
      name: 'platform_settings_category_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(queryInterface, 'platform_settings', 'platform_settings_category_idx', { transaction });
      await safeRemoveIndex(queryInterface, 'platform_settings', 'platform_settings_key_env_unique', { transaction });
      await queryInterface.dropTable('platform_settings', { transaction });
    });

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_platform_settings_valueType";');
    }
  },
};
