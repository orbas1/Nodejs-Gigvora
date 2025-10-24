'use strict';

const MEMBER_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'vendor'];
const MEMBER_STATUSES = ['active', 'on_leave', 'offboarded'];
const PAY_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'milestone'];
const PAY_STATUSES = ['scheduled', 'processing', 'sent', 'paused'];
const PROJECT_ASSIGNMENT_TYPES = ['project', 'retainer', 'internal'];
const PROJECT_STATUSES = ['planned', 'active', 'completed', 'on_hold'];
const GIG_STATUSES = ['briefing', 'in_delivery', 'review', 'completed', 'on_hold'];
const AVAILABILITY_STATUSES = ['available', 'partial', 'unavailable', 'on_leave'];

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function dropEnum(queryInterface, enumName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

      await queryInterface.createTable(
        'agency_workforce_members',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          full_name: { type: Sequelize.STRING(160), allowNull: false },
          title: { type: Sequelize.STRING(120), allowNull: true },
          email: { type: Sequelize.STRING(180), allowNull: true },
          phone: { type: Sequelize.STRING(60), allowNull: true },
          location: { type: Sequelize.STRING(160), allowNull: true },
          employment_type: {
            type: Sequelize.ENUM(...MEMBER_EMPLOYMENT_TYPES),
            allowNull: false,
            defaultValue: 'contract',
          },
          status: {
            type: Sequelize.ENUM(...MEMBER_STATUSES),
            allowNull: false,
            defaultValue: 'active',
          },
          start_date: { type: Sequelize.DATE, allowNull: true },
          end_date: { type: Sequelize.DATE, allowNull: true },
          hourly_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          billable_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          cost_center: { type: Sequelize.STRING(80), allowNull: true },
          capacity_hours_per_week: { type: Sequelize.DECIMAL(6, 2), allowNull: true, defaultValue: 0 },
          allocation_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
          bench_allocation_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
          skills: { type: jsonType, allowNull: true },
          avatar_url: { type: Sequelize.STRING(255), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_workforce_members', ['workspace_id'], {
        name: 'agency_workforce_members_workspace_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_workforce_members', ['status'], {
        name: 'agency_workforce_members_status_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_workforce_members', ['employment_type'], {
        name: 'agency_workforce_members_employment_type_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_workforce_members', ['full_name'], {
        name: 'agency_workforce_members_full_name_idx',
        transaction,
      });

      await queryInterface.createTable(
        'agency_pay_delegations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          member_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_workforce_members', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          frequency: {
            type: Sequelize.ENUM(...PAY_FREQUENCIES),
            allowNull: false,
            defaultValue: 'monthly',
          },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          status: {
            type: Sequelize.ENUM(...PAY_STATUSES),
            allowNull: false,
            defaultValue: 'scheduled',
          },
          next_pay_date: { type: Sequelize.DATE, allowNull: true },
          payout_method: { type: Sequelize.STRING(80), allowNull: true },
          approver_id: { type: Sequelize.INTEGER, allowNull: true },
          memo: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_pay_delegations', ['workspace_id'], {
        name: 'agency_pay_delegations_workspace_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_pay_delegations', ['member_id'], {
        name: 'agency_pay_delegations_member_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_pay_delegations', ['status'], {
        name: 'agency_pay_delegations_status_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_pay_delegations', ['next_pay_date'], {
        name: 'agency_pay_delegations_next_pay_date_idx',
        transaction,
      });

      await queryInterface.createTable(
        'agency_project_delegations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          member_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_workforce_members', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          project_id: { type: Sequelize.INTEGER, allowNull: true },
          project_name: { type: Sequelize.STRING(180), allowNull: false },
          client_name: { type: Sequelize.STRING(160), allowNull: true },
          assignment_type: {
            type: Sequelize.ENUM(...PROJECT_ASSIGNMENT_TYPES),
            allowNull: false,
            defaultValue: 'project',
          },
          status: {
            type: Sequelize.ENUM(...PROJECT_STATUSES),
            allowNull: false,
            defaultValue: 'planned',
          },
          start_date: { type: Sequelize.DATE, allowNull: true },
          end_date: { type: Sequelize.DATE, allowNull: true },
          allocation_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          billable_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_project_delegations', ['workspace_id'], {
        name: 'agency_project_delegations_workspace_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_project_delegations', ['member_id'], {
        name: 'agency_project_delegations_member_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_project_delegations', ['status'], {
        name: 'agency_project_delegations_status_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_project_delegations', ['start_date'], {
        name: 'agency_project_delegations_start_date_idx',
        transaction,
      });

      await queryInterface.createTable(
        'agency_gig_delegations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          member_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_workforce_members', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          gig_id: { type: Sequelize.INTEGER, allowNull: true },
          gig_name: { type: Sequelize.STRING(180), allowNull: false },
          status: {
            type: Sequelize.ENUM(...GIG_STATUSES),
            allowNull: false,
            defaultValue: 'briefing',
          },
          deliverables: { type: Sequelize.INTEGER, allowNull: true },
          start_date: { type: Sequelize.DATE, allowNull: true },
          due_date: { type: Sequelize.DATE, allowNull: true },
          allocation_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_gig_delegations', ['workspace_id'], {
        name: 'agency_gig_delegations_workspace_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_gig_delegations', ['member_id'], {
        name: 'agency_gig_delegations_member_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_gig_delegations', ['status'], {
        name: 'agency_gig_delegations_status_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_gig_delegations', ['start_date'], {
        name: 'agency_gig_delegations_start_date_idx',
        transaction,
      });

      await queryInterface.createTable(
        'agency_capacity_snapshots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          recorded_for: { type: Sequelize.DATEONLY, allowNull: false },
          total_headcount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          active_assignments: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          available_hours: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
          allocated_hours: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
          bench_hours: { type: Sequelize.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
          utilization_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_capacity_snapshots', ['workspace_id'], {
        name: 'agency_capacity_snapshots_workspace_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_capacity_snapshots', ['recorded_for'], {
        name: 'agency_capacity_snapshots_recorded_for_idx',
        transaction,
      });

      await queryInterface.createTable(
        'agency_availability_entries',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          member_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_workforce_members', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          date: { type: Sequelize.DATEONLY, allowNull: false },
          status: {
            type: Sequelize.ENUM(...AVAILABILITY_STATUSES),
            allowNull: false,
            defaultValue: 'available',
          },
          available_hours: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          reason: { type: Sequelize.STRING(255), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_availability_entries', ['workspace_id'], {
        name: 'agency_availability_entries_workspace_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_availability_entries', ['member_id'], {
        name: 'agency_availability_entries_member_id_idx',
        transaction,
      });
      await queryInterface.addIndex('agency_availability_entries', ['date'], {
        name: 'agency_availability_entries_date_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('agency_availability_entries', { transaction });
      await queryInterface.dropTable('agency_capacity_snapshots', { transaction });
      await queryInterface.dropTable('agency_gig_delegations', { transaction });
      await queryInterface.dropTable('agency_project_delegations', { transaction });
      await queryInterface.dropTable('agency_pay_delegations', { transaction });
      await queryInterface.dropTable('agency_workforce_members', { transaction });

      await dropEnum(queryInterface, 'enum_agency_availability_entries_status', transaction);
      await dropEnum(queryInterface, 'enum_agency_gig_delegations_status', transaction);
      await dropEnum(queryInterface, 'enum_agency_project_delegations_status', transaction);
      await dropEnum(queryInterface, 'enum_agency_project_delegations_assignment_type', transaction);
      await dropEnum(queryInterface, 'enum_agency_pay_delegations_status', transaction);
      await dropEnum(queryInterface, 'enum_agency_pay_delegations_frequency', transaction);
      await dropEnum(queryInterface, 'enum_agency_workforce_members_status', transaction);
      await dropEnum(queryInterface, 'enum_agency_workforce_members_employment_type', transaction);
    });
  },
};
