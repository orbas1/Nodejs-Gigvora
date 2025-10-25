'use strict';

const FLAGS_TABLE = 'feature_flags';
const ASSIGNMENTS_TABLE = 'feature_flag_assignments';
const STATUS_ENUM = 'enum_feature_flags_status';
const ROLLOUT_ENUM = 'enum_feature_flags_rolloutType';
const AUDIENCE_ENUM = 'enum_feature_flag_assignments_audienceType';

const STATUS_VALUES = ['draft', 'active', 'disabled'];
const ROLLOUT_VALUES = ['global', 'percentage', 'cohort'];
const AUDIENCE_VALUES = ['user', 'workspace', 'membership', 'domain'];

async function dropEnum(queryInterface, enumName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}"`, { transaction });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        FLAGS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.ENUM(...STATUS_VALUES), allowNull: false, defaultValue: 'draft' },
          rolloutType: { type: Sequelize.ENUM(...ROLLOUT_VALUES), allowNull: false, defaultValue: 'global' },
          rolloutPercentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex(FLAGS_TABLE, ['key'], {
          unique: true,
          name: 'feature_flags_key_unique',
          transaction,
        }),
        queryInterface.addIndex(FLAGS_TABLE, ['status'], {
          name: 'feature_flags_status_idx',
          transaction,
        }),
        queryInterface.addIndex(FLAGS_TABLE, ['rolloutType'], {
          name: 'feature_flags_rollout_type_idx',
          transaction,
        }),
      ]);

      await queryInterface.createTable(
        ASSIGNMENTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          flagId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: FLAGS_TABLE, key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          audienceType: { type: Sequelize.ENUM(...AUDIENCE_VALUES), allowNull: false, defaultValue: 'user' },
          audienceValue: { type: Sequelize.STRING(255), allowNull: false },
          rolloutPercentage: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          conditions: { type: jsonType, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex(ASSIGNMENTS_TABLE, ['flagId'], {
          name: 'feature_flag_assignments_flag_idx',
          transaction,
        }),
        queryInterface.addIndex(ASSIGNMENTS_TABLE, ['audienceType'], {
          name: 'feature_flag_assignments_audience_type_idx',
          transaction,
        }),
        queryInterface.addIndex(ASSIGNMENTS_TABLE, ['audienceValue'], {
          name: 'feature_flag_assignments_audience_value_idx',
          transaction,
        }),
        queryInterface.addIndex(ASSIGNMENTS_TABLE, ['expiresAt'], {
          name: 'feature_flag_assignments_expires_idx',
          transaction,
        }),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable(ASSIGNMENTS_TABLE, { transaction });
      await queryInterface.dropTable(FLAGS_TABLE, { transaction });
      await dropEnum(queryInterface, AUDIENCE_ENUM, transaction);
      await dropEnum(queryInterface, ROLLOUT_ENUM, transaction);
      await dropEnum(queryInterface, STATUS_ENUM, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
