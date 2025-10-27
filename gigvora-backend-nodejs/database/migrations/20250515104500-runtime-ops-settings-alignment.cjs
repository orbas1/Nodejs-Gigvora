'use strict';

const { resolveJsonType, dropEnum, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

const SYSTEM_TABLE = 'system_settings';
const SITE_TABLE = 'site_settings';
const SYSTEM_VALUE_TYPE_ENUM = 'enum_system_settings_valueType';

async function describeTable(queryInterface, tableName, transaction) {
  try {
    return await queryInterface.describeTable(tableName, { transaction });
  } catch (error) {
    if (error?.message && /does not exist/i.test(error.message)) {
      return null;
    }
    throw error;
  }
}

function hasColumn(definition, column) {
  return Boolean(definition && Object.prototype.hasOwnProperty.call(definition, column));
}

async function ensureColumn(queryInterface, tableName, definition, column, spec, transaction) {
  if (!definition) {
    return;
  }
  if (!hasColumn(definition, column)) {
    await queryInterface.addColumn(tableName, column, spec, { transaction });
  }
}

async function ensureIndex(queryInterface, tableName, indexName, columns, options = {}) {
  const { transaction } = options;
  const existing = await queryInterface
    .showIndex(tableName, { transaction })
    .catch(() => []);
  if (!existing.some((index) => index.name === indexName)) {
    await queryInterface.addIndex(tableName, columns, { ...options, name: indexName });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      const systemDefinition = await describeTable(queryInterface, SYSTEM_TABLE, transaction);
      if (systemDefinition) {
        await ensureColumn(queryInterface, SYSTEM_TABLE, systemDefinition, 'description', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, transaction);

        await ensureColumn(queryInterface, SYSTEM_TABLE, systemDefinition, 'environmentScope', {
          type: Sequelize.STRING(80),
          allowNull: false,
          defaultValue: 'global',
        }, transaction);

        await ensureColumn(queryInterface, SYSTEM_TABLE, systemDefinition, 'valueType', {
          type: Sequelize.ENUM('json', 'string', 'number', 'boolean'),
          allowNull: false,
          defaultValue: 'json',
        }, transaction);

        await ensureColumn(queryInterface, SYSTEM_TABLE, systemDefinition, 'isSensitive', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        }, transaction);

        await ensureColumn(queryInterface, SYSTEM_TABLE, systemDefinition, 'metadata', {
          type: jsonType,
          allowNull: false,
          defaultValue: {},
        }, transaction);

        await ensureColumn(queryInterface, SYSTEM_TABLE, systemDefinition, 'updatedBy', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, transaction);

        await ensureColumn(queryInterface, SYSTEM_TABLE, systemDefinition, 'version', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        }, transaction);

        if (!hasColumn(systemDefinition, 'environmentScope')) {
          // environmentScope column added above; ensure indexes reflect new uniqueness
          await safeRemoveIndex(queryInterface, SYSTEM_TABLE, 'system_settings_key_unique', { transaction });
        } else {
          // Column existed but ensure old single-key index is removed to avoid duplicates
          await safeRemoveIndex(queryInterface, SYSTEM_TABLE, 'system_settings_key_unique', { transaction });
        }

        await ensureIndex(queryInterface, SYSTEM_TABLE, 'system_settings_key_env_unique', ['key', 'environmentScope'], {
          unique: true,
          transaction,
        });
        await ensureIndex(queryInterface, SYSTEM_TABLE, 'system_settings_environment_idx', ['environmentScope'], {
          transaction,
        });
      }

      const siteDefinition = await describeTable(queryInterface, SITE_TABLE, transaction);
      if (siteDefinition) {
        await ensureColumn(queryInterface, SITE_TABLE, siteDefinition, 'category', {
          type: Sequelize.STRING(120),
          allowNull: false,
          defaultValue: 'content',
        }, transaction);

        await ensureColumn(queryInterface, SITE_TABLE, siteDefinition, 'description', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, transaction);

        await ensureColumn(queryInterface, SITE_TABLE, siteDefinition, 'isSensitive', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        }, transaction);

        await ensureColumn(queryInterface, SITE_TABLE, siteDefinition, 'metadata', {
          type: jsonType,
          allowNull: false,
          defaultValue: {},
        }, transaction);

        await ensureColumn(queryInterface, SITE_TABLE, siteDefinition, 'updatedBy', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, transaction);

        await ensureColumn(queryInterface, SITE_TABLE, siteDefinition, 'version', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        }, transaction);

        await ensureIndex(queryInterface, SITE_TABLE, 'site_settings_category_idx', ['category'], { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const systemDefinition = await describeTable(queryInterface, SYSTEM_TABLE, transaction);
      if (systemDefinition) {
        const removableSystemColumns = [
          'description',
          'environmentScope',
          'valueType',
          'isSensitive',
          'metadata',
          'updatedBy',
          'version',
        ];
        for (const column of removableSystemColumns) {
          if (hasColumn(systemDefinition, column)) {
            await queryInterface.removeColumn(SYSTEM_TABLE, column, { transaction });
          }
        }
        await safeRemoveIndex(queryInterface, SYSTEM_TABLE, 'system_settings_key_env_unique', { transaction });
        await safeRemoveIndex(queryInterface, SYSTEM_TABLE, 'system_settings_environment_idx', { transaction });
        await queryInterface.addIndex(SYSTEM_TABLE, ['key'], {
          unique: true,
          name: 'system_settings_key_unique',
          transaction,
        });
        await dropEnum(queryInterface, SYSTEM_VALUE_TYPE_ENUM, transaction);
      }

      const siteDefinition = await describeTable(queryInterface, SITE_TABLE, transaction);
      if (siteDefinition) {
        const removableSiteColumns = ['category', 'description', 'isSensitive', 'metadata', 'updatedBy', 'version'];
        for (const column of removableSiteColumns) {
          if (hasColumn(siteDefinition, column)) {
            await queryInterface.removeColumn(SITE_TABLE, column, { transaction });
          }
        }
        await safeRemoveIndex(queryInterface, SITE_TABLE, 'site_settings_category_idx', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
