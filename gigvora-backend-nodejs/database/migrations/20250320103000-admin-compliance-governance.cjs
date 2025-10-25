'use strict';

const FRAMEWORK_STATUS_ENUM = 'enum_admin_compliance_frameworks_status';
const FRAMEWORK_TYPE_ENUM = 'enum_admin_compliance_frameworks_type';
const AUDIT_STATUS_ENUM = 'enum_admin_compliance_audits_status';
const OBLIGATION_STATUS_ENUM = 'enum_admin_compliance_obligations_status';
const OBLIGATION_RISK_ENUM = 'enum_admin_compliance_obligations_riskRating';

function isPostgres(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();
  return dialect === 'postgres' || dialect === 'postgresql';
}

async function dropEnum(queryInterface, enumName, transaction) {
  if (!isPostgres(queryInterface)) {
    return;
  }
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
}

async function ensureIndex(queryInterface, table, fields, options = {}) {
  const indexName = options.name;
  if (!indexName) {
    return queryInterface.addIndex(table, fields, { ...options });
  }
  try {
    await queryInterface.addIndex(table, fields, { ...options });
  } catch (error) {
    if (!error || !error.message || !error.message.includes('already exists')) {
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

      const frameworkTable = await queryInterface.describeTable('admin_compliance_frameworks').catch(() => null);
      if (!frameworkTable) {
        await queryInterface.createTable(
          'admin_compliance_frameworks',
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            slug: { type: Sequelize.STRING(120), allowNull: true, unique: true },
            name: { type: Sequelize.STRING(180), allowNull: false },
            owner: { type: Sequelize.STRING(180), allowNull: false },
            region: { type: Sequelize.STRING(120), allowNull: true },
            status: {
              type: Sequelize.ENUM('planning', 'active', 'draft', 'retired'),
              allowNull: false,
              defaultValue: 'planning',
            },
            type: {
              type: Sequelize.ENUM('certification', 'attestation', 'regulation', 'policy'),
              allowNull: false,
              defaultValue: 'attestation',
            },
            automation_coverage: {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 0,
            },
            renewal_cadence_months: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 12 },
            controls: { type: jsonType, allowNull: false, defaultValue: [] },
            metadata: { type: jsonType, allowNull: true },
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
          ensureIndex(queryInterface, 'admin_compliance_frameworks', ['status'], {
            transaction,
            name: 'admin_compliance_frameworks_status_idx',
          }),
          ensureIndex(queryInterface, 'admin_compliance_frameworks', ['owner'], {
            transaction,
            name: 'admin_compliance_frameworks_owner_idx',
          }),
        ]);
      }

      const auditTable = await queryInterface.describeTable('admin_compliance_audits').catch(() => null);
      if (!auditTable) {
        await queryInterface.createTable(
          'admin_compliance_audits',
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            framework_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'admin_compliance_frameworks', key: 'id' },
              onDelete: 'CASCADE',
            },
            name: { type: Sequelize.STRING(180), allowNull: false },
            audit_firm: { type: Sequelize.STRING(180), allowNull: true },
            status: {
              type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
              allowNull: false,
              defaultValue: 'scheduled',
            },
            start_date: { type: Sequelize.DATE, allowNull: true },
            end_date: { type: Sequelize.DATE, allowNull: true },
            scope: { type: Sequelize.TEXT, allowNull: true },
            deliverables: { type: jsonType, allowNull: false, defaultValue: [] },
            metadata: { type: jsonType, allowNull: true },
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
          ensureIndex(queryInterface, 'admin_compliance_audits', ['framework_id'], {
            transaction,
            name: 'admin_compliance_audits_framework_idx',
          }),
          ensureIndex(queryInterface, 'admin_compliance_audits', ['status'], {
            transaction,
            name: 'admin_compliance_audits_status_idx',
          }),
          ensureIndex(queryInterface, 'admin_compliance_audits', ['start_date'], {
            transaction,
            name: 'admin_compliance_audits_start_idx',
          }),
        ]);
      }

      const obligationTable = await queryInterface.describeTable('admin_compliance_obligations').catch(() => null);
      if (!obligationTable) {
        await queryInterface.createTable(
          'admin_compliance_obligations',
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            title: { type: Sequelize.STRING(200), allowNull: false },
            owner: { type: Sequelize.STRING(180), allowNull: false },
            status: {
              type: Sequelize.ENUM('backlog', 'in_progress', 'awaiting_evidence', 'complete', 'cancelled'),
              allowNull: false,
              defaultValue: 'backlog',
            },
            risk_rating: {
              type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
              allowNull: false,
              defaultValue: 'medium',
            },
            due_date: { type: Sequelize.DATE, allowNull: true },
            framework_ids: { type: jsonType, allowNull: false, defaultValue: [] },
            notes: { type: Sequelize.TEXT, allowNull: true },
            evidence_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
            metadata: { type: jsonType, allowNull: true },
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
          ensureIndex(queryInterface, 'admin_compliance_obligations', ['status'], {
            transaction,
            name: 'admin_compliance_obligations_status_idx',
          }),
          ensureIndex(queryInterface, 'admin_compliance_obligations', ['risk_rating'], {
            transaction,
            name: 'admin_compliance_obligations_risk_idx',
          }),
          ensureIndex(queryInterface, 'admin_compliance_obligations', ['due_date'], {
            transaction,
            name: 'admin_compliance_obligations_due_idx',
          }),
        ]);
      }

      const evidenceTable = await queryInterface.describeTable('admin_compliance_evidence').catch(() => null);
      if (!evidenceTable) {
        await queryInterface.createTable(
          'admin_compliance_evidence',
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            obligation_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'admin_compliance_obligations', key: 'id' },
              onDelete: 'CASCADE',
            },
            submitted_by_id: { type: Sequelize.INTEGER, allowNull: true },
            submitted_by_name: { type: Sequelize.STRING(180), allowNull: true },
            source: { type: Sequelize.STRING(120), allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            file_url: { type: Sequelize.STRING(255), allowNull: true },
            metadata: { type: jsonType, allowNull: true },
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

        await ensureIndex(queryInterface, 'admin_compliance_evidence', ['obligation_id', 'submitted_at'], {
          transaction,
          name: 'admin_compliance_evidence_obligation_idx',
        });
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
      await queryInterface.dropTable('admin_compliance_evidence', { transaction });
      await queryInterface.dropTable('admin_compliance_obligations', { transaction });
      await queryInterface.dropTable('admin_compliance_audits', { transaction });
      await queryInterface.dropTable('admin_compliance_frameworks', { transaction });

      await dropEnum(queryInterface, OBLIGATION_RISK_ENUM, transaction);
      await dropEnum(queryInterface, OBLIGATION_STATUS_ENUM, transaction);
      await dropEnum(queryInterface, AUDIT_STATUS_ENUM, transaction);
      await dropEnum(queryInterface, FRAMEWORK_TYPE_ENUM, transaction);
      await dropEnum(queryInterface, FRAMEWORK_STATUS_ENUM, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
