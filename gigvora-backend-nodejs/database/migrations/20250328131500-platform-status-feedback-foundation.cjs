'use strict';

const STATUS_TABLE = 'platform_status_reports';
const INCIDENT_TABLE = 'platform_status_incidents';
const MAINTENANCE_TABLE = 'platform_status_maintenances';
const PROMPTS_TABLE = 'platform_feedback_prompts';
const RESPONSES_TABLE = 'platform_feedback_responses';
const STATES_TABLE = 'platform_feedback_prompt_states';

const STATUS_SEVERITY_ENUM = 'enum_platform_status_reports_severity';
const INCIDENT_SEVERITY_ENUM = 'enum_platform_status_incidents_severity';
const MAINTENANCE_IMPACT_ENUM = 'enum_platform_status_maintenances_impact';
const PROMPT_STATUS_ENUM = 'enum_platform_feedback_prompts_status';
const PROMPT_CHANNEL_ENUM = 'enum_platform_feedback_prompts_channel';

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

      await queryInterface.createTable(
        STATUS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          severity: {
            type: Sequelize.ENUM('operational', 'maintenance', 'degraded', 'partial_outage', 'outage'),
            allowNull: false,
            defaultValue: 'operational',
          },
          headline: { type: Sequelize.STRING(255), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: false },
          status_page_url: { type: Sequelize.STRING(512), allowNull: true },
          source: { type: Sequelize.STRING(128), allowNull: true },
          occurred_at: {
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

      await ensureIndex(
        queryInterface,
        STATUS_TABLE,
        ['occurred_at'],
        { name: `${STATUS_TABLE}_occurred_at_idx`, transaction },
      );
      await ensureIndex(
        queryInterface,
        STATUS_TABLE,
        ['severity'],
        { name: `${STATUS_TABLE}_severity_idx`, transaction },
      );

      await queryInterface.createTable(
        INCIDENT_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          report_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: STATUS_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          external_id: { type: Sequelize.STRING(128), allowNull: true },
          title: { type: Sequelize.STRING(255), allowNull: false },
          status: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'investigating' },
          severity: {
            type: Sequelize.ENUM('operational', 'maintenance', 'degraded', 'partial_outage', 'outage'),
            allowNull: false,
            defaultValue: 'degraded',
          },
          impact_summary: { type: Sequelize.TEXT, allowNull: true },
          services: { type: jsonType, allowNull: false, defaultValue: [] },
          started_at: { type: Sequelize.DATE, allowNull: true },
          resolved_at: { type: Sequelize.DATE, allowNull: true },
          last_notified_at: { type: Sequelize.DATE, allowNull: true },
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

      await ensureIndex(
        queryInterface,
        INCIDENT_TABLE,
        ['report_id'],
        { name: `${INCIDENT_TABLE}_report_id_idx`, transaction },
      );
      await ensureIndex(
        queryInterface,
        INCIDENT_TABLE,
        ['severity'],
        { name: `${INCIDENT_TABLE}_severity_idx`, transaction },
      );
      await ensureIndex(
        queryInterface,
        INCIDENT_TABLE,
        ['status'],
        { name: `${INCIDENT_TABLE}_status_idx`, transaction },
      );

      await queryInterface.createTable(
        MAINTENANCE_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          report_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: STATUS_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          external_id: { type: Sequelize.STRING(128), allowNull: true },
          title: { type: Sequelize.STRING(255), allowNull: false },
          status: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'scheduled' },
          impact: {
            type: Sequelize.ENUM('informational', 'minor', 'major'),
            allowNull: false,
            defaultValue: 'minor',
          },
          services: { type: jsonType, allowNull: false, defaultValue: [] },
          starts_at: { type: Sequelize.DATE, allowNull: true },
          ends_at: { type: Sequelize.DATE, allowNull: true },
          impact_summary: { type: Sequelize.TEXT, allowNull: true },
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

      await ensureIndex(
        queryInterface,
        MAINTENANCE_TABLE,
        ['report_id'],
        { name: `${MAINTENANCE_TABLE}_report_id_idx`, transaction },
      );
      await ensureIndex(
        queryInterface,
        MAINTENANCE_TABLE,
        ['status'],
        { name: `${MAINTENANCE_TABLE}_status_idx`, transaction },
      );
      await ensureIndex(
        queryInterface,
        MAINTENANCE_TABLE,
        ['starts_at'],
        { name: `${MAINTENANCE_TABLE}_starts_at_idx`, transaction },
      );

      await queryInterface.createTable(
        PROMPTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(128), allowNull: false, unique: true },
          question: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'active', 'paused', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          channel: {
            type: Sequelize.ENUM('web', 'mobile', 'email', 'omni'),
            allowNull: false,
            defaultValue: 'web',
          },
          audiences: { type: jsonType, allowNull: false, defaultValue: [] },
          response_options: { type: jsonType, allowNull: false, defaultValue: [] },
          cooldown_hours: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 168 },
          snooze_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 240 },
          auto_open_delay_seconds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 8 },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          active_from: { type: Sequelize.DATE, allowNull: true },
          active_until: { type: Sequelize.DATE, allowNull: true },
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

      await ensureIndex(queryInterface, PROMPTS_TABLE, ['status'], { name: `${PROMPTS_TABLE}_status_idx`, transaction });
      await ensureIndex(queryInterface, PROMPTS_TABLE, ['channel'], { name: `${PROMPTS_TABLE}_channel_idx`, transaction });

      await queryInterface.createTable(
        RESPONSES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          prompt_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: PROMPTS_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          session_fingerprint: { type: Sequelize.STRING(128), allowNull: true },
          rating: { type: Sequelize.STRING(32), allowNull: false },
          comment: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          submitted_at: {
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

      await ensureIndex(
        queryInterface,
        RESPONSES_TABLE,
        ['prompt_id'],
        { name: `${RESPONSES_TABLE}_prompt_id_idx`, transaction },
      );
      await ensureIndex(queryInterface, RESPONSES_TABLE, ['user_id'], { name: `${RESPONSES_TABLE}_user_id_idx`, transaction });
      await ensureIndex(
        queryInterface,
        RESPONSES_TABLE,
        ['session_fingerprint'],
        { name: `${RESPONSES_TABLE}_fingerprint_idx`, transaction },
      );
      await ensureIndex(
        queryInterface,
        RESPONSES_TABLE,
        ['submitted_at'],
        { name: `${RESPONSES_TABLE}_submitted_at_idx`, transaction },
      );

      await queryInterface.createTable(
        STATES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          prompt_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: PROMPTS_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          session_fingerprint: { type: Sequelize.STRING(128), allowNull: true },
          snoozed_until: { type: Sequelize.DATE, allowNull: true },
          responded_at: { type: Sequelize.DATE, allowNull: true },
          total_responses: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          last_rating: { type: Sequelize.STRING(32), allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

      await ensureIndex(
        queryInterface,
        STATES_TABLE,
        ['prompt_id', 'user_id'],
        { name: `${STATES_TABLE}_prompt_user_unique`, transaction, unique: true },
      );
      await ensureIndex(
        queryInterface,
        STATES_TABLE,
        ['prompt_id', 'session_fingerprint'],
        { name: `${STATES_TABLE}_prompt_fingerprint_unique`, transaction, unique: true },
      );
      await ensureIndex(
        queryInterface,
        STATES_TABLE,
        ['snoozed_until'],
        { name: `${STATES_TABLE}_snoozed_until_idx`, transaction },
      );
      await ensureIndex(
        queryInterface,
        STATES_TABLE,
        ['responded_at'],
        { name: `${STATES_TABLE}_responded_at_idx`, transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable(STATES_TABLE, { transaction });
      await queryInterface.dropTable(RESPONSES_TABLE, { transaction });
      await queryInterface.dropTable(PROMPTS_TABLE, { transaction });
      await queryInterface.dropTable(MAINTENANCE_TABLE, { transaction });
      await queryInterface.dropTable(INCIDENT_TABLE, { transaction });
      await queryInterface.dropTable(STATUS_TABLE, { transaction });

      if (isPostgres(queryInterface)) {
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${PROMPT_CHANNEL_ENUM}"`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${PROMPT_STATUS_ENUM}"`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${MAINTENANCE_IMPACT_ENUM}"`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${INCIDENT_SEVERITY_ENUM}"`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${STATUS_SEVERITY_ENUM}"`,
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
