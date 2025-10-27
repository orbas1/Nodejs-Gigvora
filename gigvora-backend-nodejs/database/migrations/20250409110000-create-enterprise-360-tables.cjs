'use strict';

const RELEASE_TABLE = 'enterprise_release_tracks';
const RELEASE_STATUS_ENUM = 'enum_enterprise_release_tracks_status';
const INITIATIVE_TABLE = 'executive_alignment_initiatives';
const INITIATIVE_STATUS_ENUM = 'enum_executive_alignment_initiatives_status';
const INITIATIVE_RISK_ENUM = 'enum_executive_alignment_initiatives_risk_level';

const RELEASE_STATUSES = ['stable', 'rolling', 'delayed', 'blocked'];
const INITIATIVE_STATUSES = ['planning', 'on_track', 'at_risk', 'blocked', 'complete'];
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
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      const releaseTable = await queryInterface.describeTable(RELEASE_TABLE).catch(() => null);
      if (!releaseTable) {
        await queryInterface.createTable(
          RELEASE_TABLE,
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            platform_key: { type: Sequelize.STRING(80), allowNull: false, unique: true },
            platform_name: { type: Sequelize.STRING(160), allowNull: false },
            channel: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'stable' },
            current_version: { type: Sequelize.STRING(64), allowNull: false },
            parity_score: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 100 },
            mobile_readiness: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            release_velocity_weeks: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            last_release_at: { type: Sequelize.DATE, allowNull: true },
            next_release_window: { type: Sequelize.DATE, allowNull: true },
            status: { type: Sequelize.ENUM(...RELEASE_STATUSES), allowNull: false, defaultValue: 'stable' },
            blockers: { type: jsonType, allowNull: false, defaultValue: [] },
            notes: { type: Sequelize.TEXT, allowNull: true },
            active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
          ensureIndex(queryInterface, RELEASE_TABLE, ['status'], { transaction, name: `${RELEASE_TABLE}_status_idx` }),
          ensureIndex(queryInterface, RELEASE_TABLE, ['active'], { transaction, name: `${RELEASE_TABLE}_active_idx` }),
          ensureIndex(queryInterface, RELEASE_TABLE, ['next_release_window'], {
            transaction,
            name: `${RELEASE_TABLE}_next_release_window_idx`,
          }),
        ]);
      } else if (isPostgres(queryInterface)) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "${RELEASE_STATUS_ENUM}" ADD VALUE IF NOT EXISTS 'rolling';`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE "${RELEASE_STATUS_ENUM}" ADD VALUE IF NOT EXISTS 'blocked';`,
          { transaction },
        );
      }

      const initiativeTable = await queryInterface.describeTable(INITIATIVE_TABLE).catch(() => null);
      if (!initiativeTable) {
        await queryInterface.createTable(
          INITIATIVE_TABLE,
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            initiative_key: { type: Sequelize.STRING(120), allowNull: false, unique: true },
            title: { type: Sequelize.STRING(255), allowNull: false },
            executive_owner: { type: Sequelize.STRING(160), allowNull: false },
            sponsor_team: { type: Sequelize.STRING(160), allowNull: true },
            status: {
              type: Sequelize.ENUM(...INITIATIVE_STATUSES),
              allowNull: false,
              defaultValue: 'planning',
            },
            progress_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
            risk_level: {
              type: Sequelize.ENUM(...RISK_LEVELS),
              allowNull: false,
              defaultValue: 'medium',
            },
            next_milestone_at: { type: Sequelize.DATE, allowNull: true },
            last_review_at: { type: Sequelize.DATE, allowNull: true },
            governance_cadence: { type: Sequelize.STRING(120), allowNull: true },
            outcome_metric: { type: Sequelize.STRING(160), allowNull: true },
            narrative: { type: Sequelize.TEXT, allowNull: true },
            notes: { type: Sequelize.TEXT, allowNull: true },
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
          ensureIndex(queryInterface, INITIATIVE_TABLE, ['status'], { transaction, name: `${INITIATIVE_TABLE}_status_idx` }),
          ensureIndex(queryInterface, INITIATIVE_TABLE, ['risk_level'], {
            transaction,
            name: `${INITIATIVE_TABLE}_risk_level_idx`,
          }),
          ensureIndex(queryInterface, INITIATIVE_TABLE, ['next_milestone_at'], {
            transaction,
            name: `${INITIATIVE_TABLE}_next_milestone_at_idx`,
          }),
        ]);
      } else if (isPostgres(queryInterface)) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "${INITIATIVE_STATUS_ENUM}" ADD VALUE IF NOT EXISTS 'at_risk';`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE "${INITIATIVE_STATUS_ENUM}" ADD VALUE IF NOT EXISTS 'blocked';`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE "${INITIATIVE_RISK_ENUM}" ADD VALUE IF NOT EXISTS 'medium';`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE "${INITIATIVE_RISK_ENUM}" ADD VALUE IF NOT EXISTS 'high';`,
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
      await queryInterface.dropTable(INITIATIVE_TABLE, { transaction }).catch(() => null);
      await queryInterface.dropTable(RELEASE_TABLE, { transaction }).catch(() => null);

      if (isPostgres(queryInterface)) {
        await Promise.all([
          queryInterface.sequelize
            .query(`DROP TYPE IF EXISTS "${RELEASE_STATUS_ENUM}";`, { transaction })
            .catch(() => null),
          queryInterface.sequelize
            .query(`DROP TYPE IF EXISTS "${INITIATIVE_STATUS_ENUM}";`, { transaction })
            .catch(() => null),
          queryInterface.sequelize
            .query(`DROP TYPE IF EXISTS "${INITIATIVE_RISK_ENUM}";`, { transaction })
            .catch(() => null),
        ]);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
