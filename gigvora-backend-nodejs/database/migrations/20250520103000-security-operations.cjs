'use strict';

const POSTURE_TABLE = 'security_posture_snapshots';
const ALERTS_TABLE = 'security_alerts';
const INCIDENTS_TABLE = 'security_incidents';
const PLAYBOOKS_TABLE = 'security_playbooks';
const PLAYBOOK_RUNS_TABLE = 'security_playbook_runs';
const THREAT_SWEEPS_TABLE = 'security_threat_sweeps';

const ALERT_SEVERITY_ENUM = 'enum_security_alerts_severity';
const ALERT_STATUS_ENUM = 'enum_security_alerts_status';
const INCIDENT_SEVERITY_ENUM = 'enum_security_incidents_severity';
const INCIDENT_STATUS_ENUM = 'enum_security_incidents_status';
const PLAYBOOK_STATUS_ENUM = 'enum_security_playbooks_status';
const THREAT_STATUS_ENUM = 'enum_security_threat_sweeps_status';

const ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low'];
const ALERT_STATUSES = ['open', 'investigating', 'acknowledged', 'suppressed', 'resolved', 'closed'];
const INCIDENT_STATUSES = ['open', 'investigating', 'mitigated', 'contained', 'resolved', 'monitoring'];
const PLAYBOOK_STATUSES = ['draft', 'active', 'retired'];
const THREAT_STATUSES = ['queued', 'running', 'completed', 'failed'];

function isPostgres(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();
  return dialect === 'postgres' || dialect === 'postgresql';
}

async function dropEnum(queryInterface, enumName) {
  if (!isPostgres(queryInterface)) {
    return;
  }
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
}

async function ensureIndex(queryInterface, table, fields, options = {}) {
  try {
    await queryInterface.addIndex(table, fields, options);
  } catch (error) {
    if (!options.name || !error || !error.message || !error.message.includes('already exists')) {
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
        POSTURE_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          captured_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          attack_surface_score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          attack_surface_delta: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          signals: { type: jsonType, allowNull: true },
          blocked_intrusions: { type: Sequelize.INTEGER, allowNull: true },
          quarantined_assets: { type: Sequelize.INTEGER, allowNull: true },
          high_risk_vulnerabilities: { type: Sequelize.INTEGER, allowNull: true },
          mean_time_to_respond_minutes: { type: Sequelize.INTEGER, allowNull: true },
          patch_backlog: { type: Sequelize.INTEGER, allowNull: true },
          patch_backlog_delta: { type: Sequelize.INTEGER, allowNull: true },
          next_patch_window: { type: Sequelize.DATE, allowNull: true },
          notes: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        ALERTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          alert_key: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          severity: { type: Sequelize.ENUM(...ALERT_SEVERITIES), allowNull: false, defaultValue: 'medium' },
          category: { type: Sequelize.STRING(160), allowNull: false },
          source: { type: Sequelize.STRING(160), allowNull: false },
          asset: { type: Sequelize.STRING(160), allowNull: true },
          location: { type: Sequelize.STRING(160), allowNull: true },
          recommended_action: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.ENUM(...ALERT_STATUSES), allowNull: false, defaultValue: 'open' },
          detected_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          resolved_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await Promise.all([
        ensureIndex(queryInterface, ALERTS_TABLE, ['severity'], { transaction, name: `${ALERTS_TABLE}_severity_idx` }),
        ensureIndex(queryInterface, ALERTS_TABLE, ['status'], { transaction, name: `${ALERTS_TABLE}_status_idx` }),
        ensureIndex(queryInterface, ALERTS_TABLE, ['detected_at'], { transaction, name: `${ALERTS_TABLE}_detected_at_idx` }),
      ]);

      await queryInterface.createTable(
        INCIDENTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          incident_key: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          title: { type: Sequelize.STRING(255), allowNull: false },
          severity: { type: Sequelize.ENUM(...ALERT_SEVERITIES), allowNull: false, defaultValue: 'medium' },
          status: { type: Sequelize.ENUM(...INCIDENT_STATUSES), allowNull: false, defaultValue: 'open' },
          owner: { type: Sequelize.STRING(160), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          opened_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          resolved_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await Promise.all([
        ensureIndex(queryInterface, INCIDENTS_TABLE, ['severity'], { transaction, name: `${INCIDENTS_TABLE}_severity_idx` }),
        ensureIndex(queryInterface, INCIDENTS_TABLE, ['status'], { transaction, name: `${INCIDENTS_TABLE}_status_idx` }),
        ensureIndex(queryInterface, INCIDENTS_TABLE, ['opened_at'], { transaction, name: `${INCIDENTS_TABLE}_opened_at_idx` }),
      ]);

      await queryInterface.createTable(
        PLAYBOOKS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(255), allowNull: false },
          owner: { type: Sequelize.STRING(160), allowNull: true },
          category: { type: Sequelize.STRING(160), allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.ENUM(...PLAYBOOK_STATUSES), allowNull: false, defaultValue: 'active' },
          last_run_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await Promise.all([
        ensureIndex(queryInterface, PLAYBOOKS_TABLE, ['status'], { transaction, name: `${PLAYBOOKS_TABLE}_status_idx` }),
        ensureIndex(queryInterface, PLAYBOOKS_TABLE, ['category'], { transaction, name: `${PLAYBOOKS_TABLE}_category_idx` }),
      ]);

      await queryInterface.createTable(
        PLAYBOOK_RUNS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          playbook_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: PLAYBOOKS_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          executed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          executor: { type: Sequelize.STRING(160), allowNull: true },
          result: { type: Sequelize.STRING(160), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await Promise.all([
        ensureIndex(queryInterface, PLAYBOOK_RUNS_TABLE, ['playbook_id'], {
          transaction,
          name: `${PLAYBOOK_RUNS_TABLE}_playbook_id_idx`,
        }),
        ensureIndex(queryInterface, PLAYBOOK_RUNS_TABLE, ['executed_at'], {
          transaction,
          name: `${PLAYBOOK_RUNS_TABLE}_executed_at_idx`,
        }),
      ]);

      await queryInterface.createTable(
        THREAT_SWEEPS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          requested_by: { type: Sequelize.INTEGER, allowNull: true },
          sweep_type: { type: Sequelize.STRING(160), allowNull: true },
          status: { type: Sequelize.ENUM(...THREAT_STATUSES), allowNull: false, defaultValue: 'queued' },
          payload: { type: jsonType, allowNull: true },
          result: { type: jsonType, allowNull: true },
          started_at: { type: Sequelize.DATE, allowNull: true },
          completed_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await ensureIndex(queryInterface, THREAT_SWEEPS_TABLE, ['status'], {
        transaction,
        name: `${THREAT_SWEEPS_TABLE}_status_idx`,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable(THREAT_SWEEPS_TABLE, { transaction });
      await queryInterface.dropTable(PLAYBOOK_RUNS_TABLE, { transaction });
      await queryInterface.dropTable(PLAYBOOKS_TABLE, { transaction });
      await queryInterface.dropTable(INCIDENTS_TABLE, { transaction });
      await queryInterface.dropTable(ALERTS_TABLE, { transaction });
      await queryInterface.dropTable(POSTURE_TABLE, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (isPostgres(queryInterface)) {
      await dropEnum(queryInterface, ALERT_SEVERITY_ENUM);
      await dropEnum(queryInterface, ALERT_STATUS_ENUM);
      await dropEnum(queryInterface, INCIDENT_SEVERITY_ENUM);
      await dropEnum(queryInterface, INCIDENT_STATUS_ENUM);
      await dropEnum(queryInterface, PLAYBOOK_STATUS_ENUM);
      await dropEnum(queryInterface, THREAT_STATUS_ENUM);
    }
  },
};
