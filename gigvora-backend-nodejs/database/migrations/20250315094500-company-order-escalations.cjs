'use strict';

const ESCALATION_STATUS_ENUM = 'enum_pgm_gig_order_escalations_status';
const ESCALATION_SEVERITY_ENUM = 'enum_pgm_gig_order_escalations_severity';

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

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
      let tableDescription;
      try {
        tableDescription = await queryInterface.describeTable('pgm_gig_order_escalations', { transaction });
      } catch (error) {
        if (error && error.message && error.message.toLowerCase().includes('does not exist')) {
          tableDescription = null;
        } else {
          throw error;
        }
      }

      if (!tableDescription) {
        await queryInterface.createTable(
          'pgm_gig_order_escalations',
          {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            owner_id: { type: Sequelize.INTEGER, allowNull: false },
            order_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'pgm_gig_orders', key: 'id' },
              onDelete: 'CASCADE',
            },
            status: {
              type: Sequelize.ENUM('queued', 'notified', 'resolved', 'dismissed'),
              allowNull: false,
              defaultValue: 'queued',
            },
            severity: {
              type: Sequelize.ENUM('warning', 'critical'),
              allowNull: false,
              defaultValue: 'warning',
            },
            message: { type: Sequelize.TEXT, allowNull: false },
            hours_overdue: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
            detected_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            escalated_at: { type: Sequelize.DATE, allowNull: true },
            resolved_at: { type: Sequelize.DATE, allowNull: true },
            support_case_id: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: 'support_cases', key: 'id' },
              onDelete: 'SET NULL',
            },
            support_thread_id: { type: Sequelize.INTEGER, allowNull: true },
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
          queryInterface.addIndex(
            'pgm_gig_order_escalations',
            ['order_id'],
            { transaction, name: 'pgm_gig_order_escalations_order_idx' },
          ),
          queryInterface.addIndex(
            'pgm_gig_order_escalations',
            ['owner_id', 'status'],
            { transaction, name: 'pgm_gig_order_escalations_owner_status_idx' },
          ),
          queryInterface.addIndex(
            'pgm_gig_order_escalations',
            ['support_case_id'],
            { transaction, name: 'pgm_gig_order_escalations_support_case_idx' },
          ),
        ]);
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
      await queryInterface.dropTable('pgm_gig_order_escalations', { transaction });
      await dropEnum(queryInterface, ESCALATION_STATUS_ENUM, transaction);
      await dropEnum(queryInterface, ESCALATION_SEVERITY_ENUM, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
