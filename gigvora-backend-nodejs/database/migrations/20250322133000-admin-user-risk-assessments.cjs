'use strict';

const TABLE_NAME = 'user_risk_assessments';
const RISK_LEVEL_ENUM = 'enum_user_risk_assessments_risk_level';
const RISK_LEVELS = ['low', 'medium', 'high'];

function isPostgres(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();
  return dialect === 'postgres' || dialect === 'postgresql';
}

async function ensureIndex(queryInterface, table, fields, options = {}) {
  const indexName = options.name;
  try {
    await queryInterface.addIndex(table, fields, options);
  } catch (error) {
    if (!error || !error.message) {
      throw error;
    }
    if (!indexName || !error.message.includes('already exists')) {
      throw error;
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const table = await queryInterface.describeTable(TABLE_NAME).catch(() => null);
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      if (!table) {
        await queryInterface.createTable(
          TABLE_NAME,
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            user_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'users', key: 'id' },
              onDelete: 'CASCADE',
            },
            risk_level: {
              type: Sequelize.ENUM(...RISK_LEVELS),
              allowNull: false,
              defaultValue: 'low',
            },
            risk_score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            risk_summary: { type: Sequelize.TEXT, allowNull: true },
            risk_factors: { type: jsonType, allowNull: false, defaultValue: [] },
            assessed_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            created_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
          },
          { transaction },
        );

        await Promise.all([
          ensureIndex(queryInterface, TABLE_NAME, ['user_id'], {
            transaction,
            unique: true,
            name: `${TABLE_NAME}_user_id_idx`,
          }),
          ensureIndex(queryInterface, TABLE_NAME, ['risk_level'], {
            transaction,
            name: `${TABLE_NAME}_risk_level_idx`,
          }),
          ensureIndex(queryInterface, TABLE_NAME, ['assessed_at'], {
            transaction,
            name: `${TABLE_NAME}_assessed_at_idx`,
          }),
        ]);
      }

      if (table && table.risk_level && table.risk_level.type !== RISK_LEVEL_ENUM && isPostgres(queryInterface)) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "${RISK_LEVEL_ENUM}" ADD VALUE IF NOT EXISTS 'medium';`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE "${RISK_LEVEL_ENUM}" ADD VALUE IF NOT EXISTS 'high';`,
          { transaction },
        );
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
      await queryInterface.dropTable(TABLE_NAME, { transaction });
      if (isPostgres(queryInterface)) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${RISK_LEVEL_ENUM}";`, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
