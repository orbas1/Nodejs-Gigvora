'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

function timestampColumns(Sequelize) {
  return {
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  };
}

async function dropEnum(queryInterface, enumName, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  if (['postgres', 'postgresql'].includes(dialect)) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, transaction ? { transaction } : undefined);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const timestamps = timestampColumns(Sequelize);

      await queryInterface.createTable(
        'pgm_projects',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          status: {
            type: Sequelize.ENUM('planning', 'in_progress', 'at_risk', 'completed', 'on_hold'),
            allowNull: false,
            defaultValue: 'planning',
          },
          start_date: { type: Sequelize.DATE, allowNull: true },
          due_date: { type: Sequelize.DATE, allowNull: true },
          budget_currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          budget_allocated: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          budget_spent: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          archived_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspaces',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('planning', 'in_progress', 'at_risk', 'completed', 'on_hold'),
            allowNull: false,
            defaultValue: 'planning',
          },
          progress_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          risk_level: {
            type: Sequelize.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'low',
          },
          next_milestone: { type: Sequelize.STRING(180), allowNull: true },
          next_milestone_due_at: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metrics: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_milestones',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          ordinal: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          due_date: { type: Sequelize.DATE, allowNull: true },
          completed_at: { type: Sequelize.DATE, allowNull: true },
          status: {
            type: Sequelize.ENUM('planned', 'in_progress', 'waiting_on_client', 'completed'),
            allowNull: false,
            defaultValue: 'planned',
          },
          budget: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          metrics: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_collaborators',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          full_name: { type: Sequelize.STRING(180), allowNull: false },
          email: { type: Sequelize.STRING(180), allowNull: true },
          role: { type: Sequelize.STRING(120), allowNull: false },
          status: {
            type: Sequelize.ENUM('invited', 'active', 'inactive'),
            allowNull: false,
            defaultValue: 'invited',
          },
          hourly_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          permissions: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_integrations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          provider: { type: Sequelize.STRING(80), allowNull: false },
          status: {
            type: Sequelize.ENUM('connected', 'disconnected', 'error'),
            allowNull: false,
            defaultValue: 'connected',
          },
          connected_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_retrospectives',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          milestone_title: { type: Sequelize.STRING(180), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: false },
          sentiment: { type: Sequelize.STRING(40), allowNull: true },
          generated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          highlights: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_assets',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          label: { type: Sequelize.STRING(180), allowNull: false },
          category: { type: Sequelize.STRING(80), allowNull: false },
          storage_url: { type: Sequelize.STRING(255), allowNull: false },
          thumbnail_url: { type: Sequelize.STRING(255), allowNull: true },
          size_bytes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          permission_level: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'internal' },
          watermark_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          checksum: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_templates',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          name: { type: Sequelize.STRING(180), allowNull: false },
          category: { type: Sequelize.STRING(80), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          duration_weeks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 4 },
          recommended_budget_min: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          recommended_budget_max: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          toolkit: { type: jsonType, allowNull: true },
          prompts: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_gig_orders',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          order_number: { type: Sequelize.STRING(32), allowNull: false, unique: true },
          vendor_name: { type: Sequelize.STRING(180), allowNull: false },
          service_name: { type: Sequelize.STRING(180), allowNull: false },
          status: {
            type: Sequelize.ENUM('requirements', 'in_delivery', 'in_revision', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'requirements',
          },
          progress_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          due_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_gig_order_requirements',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('pending', 'received', 'approved'),
            allowNull: false,
            defaultValue: 'pending',
          },
          due_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_gig_order_revisions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          round_number: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          status: {
            type: Sequelize.ENUM('requested', 'in_progress', 'submitted', 'approved'),
            allowNull: false,
            defaultValue: 'requested',
          },
          summary: { type: Sequelize.TEXT, allowNull: true },
          submitted_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_vendor_scorecards',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          overall_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          quality_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          communication_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          reliability_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_story_blocks',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          outcome: { type: Sequelize.TEXT, allowNull: false },
          impact: { type: Sequelize.STRING(180), allowNull: true },
          metrics: { type: jsonType, allowNull: true },
          last_used_at: { type: Sequelize.DATE, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_brand_assets',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          asset_type: { type: Sequelize.STRING(60), allowNull: false },
          visibility: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'private' },
          media_url: { type: Sequelize.STRING(255), allowNull: false },
          watermark_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_budget_lines',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          category: { type: Sequelize.STRING(120), allowNull: false },
          label: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          planned_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          actual_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          status: {
            type: Sequelize.ENUM('planned', 'approved', 'in_progress', 'completed', 'overbudget'),
            allowNull: false,
            defaultValue: 'planned',
          },
          owner_name: { type: Sequelize.STRING(120), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_objectives',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          owner_name: { type: Sequelize.STRING(120), allowNull: true },
          metric: { type: Sequelize.STRING(120), allowNull: true },
          target_value: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          current_value: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'on_track' },
          due_date: { type: Sequelize.DATE, allowNull: true },
          weight: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_tasks',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('planned', 'in_progress', 'blocked', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'planned',
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium',
          },
          lane: { type: Sequelize.STRING(120), allowNull: true },
          assignee_name: { type: Sequelize.STRING(120), allowNull: true },
          assignee_email: { type: Sequelize.STRING(180), allowNull: true },
          start_date: { type: Sequelize.DATE, allowNull: true },
          due_date: { type: Sequelize.DATE, allowNull: true },
          estimated_hours: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
          logged_hours: { type: Sequelize.DECIMAL(8, 2), allowNull: true },
          progress_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          dependencies: { type: jsonType, allowNull: true },
          tags: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_meetings',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          agenda: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'scheduled',
          },
          scheduled_at: { type: Sequelize.DATE, allowNull: false },
          duration_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
          location: { type: Sequelize.STRING(180), allowNull: true },
          meeting_link: { type: Sequelize.STRING(255), allowNull: true },
          organizer_name: { type: Sequelize.STRING(120), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          follow_up_items: { type: jsonType, allowNull: true },
          recurrence_rule: { type: Sequelize.STRING(180), allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_calendar_events',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          event_type: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'milestone' },
          start_at: { type: Sequelize.DATE, allowNull: false },
          end_at: { type: Sequelize.DATE, allowNull: true },
          visibility: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'team' },
          location: { type: Sequelize.STRING(180), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          attendees: { type: jsonType, allowNull: true },
          reminder_minutes_before: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_role_assignments',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          role_name: { type: Sequelize.STRING(140), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          member_name: { type: Sequelize.STRING(120), allowNull: true },
          member_email: { type: Sequelize.STRING(180), allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'active', 'backfill', 'closed'),
            allowNull: false,
            defaultValue: 'draft',
          },
          allocation_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          permissions: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_submissions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          submission_type: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'deliverable' },
          status: {
            type: Sequelize.ENUM('pending', 'in_review', 'approved', 'changes_requested'),
            allowNull: false,
            defaultValue: 'pending',
          },
          due_at: { type: Sequelize.DATE, allowNull: true },
          submitted_at: { type: Sequelize.DATE, allowNull: true },
          submitted_by_name: { type: Sequelize.STRING(120), allowNull: true },
          submitted_by_email: { type: Sequelize.STRING(180), allowNull: true },
          asset_url: { type: Sequelize.STRING(255), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_invites',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          email: { type: Sequelize.STRING(180), allowNull: false },
          role: { type: Sequelize.STRING(120), allowNull: false },
          status: {
            type: Sequelize.ENUM('pending', 'accepted', 'declined', 'expired'),
            allowNull: false,
            defaultValue: 'pending',
          },
          invited_by_name: { type: Sequelize.STRING(120), allowNull: true },
          invited_by_email: { type: Sequelize.STRING(180), allowNull: true },
          message: { type: Sequelize.TEXT, allowNull: true },
          invited_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          responded_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_hr_records',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          member_name: { type: Sequelize.STRING(120), allowNull: false },
          role_title: { type: Sequelize.STRING(140), allowNull: true },
          employment_type: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'contract' },
          status: {
            type: Sequelize.ENUM('planned', 'active', 'on_leave', 'completed'),
            allowNull: false,
            defaultValue: 'planned',
          },
          start_date: { type: Sequelize.DATE, allowNull: true },
          end_date: { type: Sequelize.DATE, allowNull: true },
          hourly_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          weekly_capacity_hours: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          allocation_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_time_entries',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          member_name: { type: Sequelize.STRING(120), allowNull: false },
          entry_date: { type: Sequelize.DATEONLY, allowNull: false },
          hours: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
          billable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          status: {
            type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'submitted',
          },
          notes: { type: Sequelize.TEXT, allowNull: true },
          approved_by_name: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_objects',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          object_type: {
            type: Sequelize.ENUM('asset', 'deliverable', 'dependency', 'risk', 'note'),
            allowNull: false,
            defaultValue: 'asset',
          },
          label: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          owner_name: { type: Sequelize.STRING(120), allowNull: true },
          quantity: { type: Sequelize.INTEGER, allowNull: true },
          unit: { type: Sequelize.STRING(40), allowNull: true },
          status: { type: Sequelize.STRING(60), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_documents',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(200), allowNull: false },
          category: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'general' },
          storage_url: { type: Sequelize.STRING(255), allowNull: false },
          thumbnail_url: { type: Sequelize.STRING(255), allowNull: true },
          size_bytes: { type: Sequelize.INTEGER, allowNull: true },
          visibility: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'team' },
          owner_name: { type: Sequelize.STRING(120), allowNull: true },
          version: { type: Sequelize.STRING(40), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_project_workspace_chat_messages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          channel: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'general' },
          author_name: { type: Sequelize.STRING(120), allowNull: false },
          author_role: { type: Sequelize.STRING(80), allowNull: true },
          body: { type: Sequelize.TEXT, allowNull: false },
          posted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          pinned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          metadata: { type: jsonType, allowNull: true },
          ...timestamps,
        },
        { transaction },
      );

      const indexDefinitions = [
        ['pgm_projects', ['owner_id'], 'pgm_projects_owner_idx'],
        ['pgm_projects', ['status'], 'pgm_projects_status_idx'],
        ['pgm_project_workspaces', ['project_id'], 'pgm_project_workspaces_project_idx'],
        ['pgm_project_workspaces', ['status'], 'pgm_project_workspaces_status_idx'],
        ['pgm_project_milestones', ['project_id'], 'pgm_project_milestones_project_idx'],
        ['pgm_project_milestones', ['status'], 'pgm_project_milestones_status_idx'],
        ['pgm_project_collaborators', ['project_id'], 'pgm_project_collaborators_project_idx'],
        ['pgm_project_collaborators', ['status'], 'pgm_project_collaborators_status_idx'],
        ['pgm_project_integrations', ['project_id'], 'pgm_project_integrations_project_idx'],
        ['pgm_project_integrations', ['status'], 'pgm_project_integrations_status_idx'],
        ['pgm_project_retrospectives', ['project_id'], 'pgm_project_retrospectives_project_idx'],
        ['pgm_project_assets', ['project_id'], 'pgm_project_assets_project_idx'],
        ['pgm_project_assets', ['category'], 'pgm_project_assets_category_idx'],
        ['pgm_project_templates', ['category'], 'pgm_project_templates_category_idx'],
        ['pgm_gig_orders', ['owner_id'], 'pgm_gig_orders_owner_idx'],
        ['pgm_gig_orders', ['status'], 'pgm_gig_orders_status_idx'],
        ['pgm_gig_order_requirements', ['order_id'], 'pgm_gig_order_requirements_order_idx'],
        ['pgm_gig_order_requirements', ['status'], 'pgm_gig_order_requirements_status_idx'],
        ['pgm_gig_order_revisions', ['order_id'], 'pgm_gig_order_revisions_order_idx'],
        ['pgm_gig_order_revisions', ['status'], 'pgm_gig_order_revisions_status_idx'],
        ['pgm_vendor_scorecards', ['order_id'], 'pgm_vendor_scorecards_order_idx'],
        ['pgm_story_blocks', ['owner_id'], 'pgm_story_blocks_owner_idx'],
        ['pgm_brand_assets', ['owner_id'], 'pgm_brand_assets_owner_idx'],
        ['pgm_brand_assets', ['visibility'], 'pgm_brand_assets_visibility_idx'],
        ['pgm_project_workspace_budget_lines', ['workspace_id'], 'pgm_workspace_budget_lines_workspace_idx'],
        ['pgm_project_workspace_budget_lines', ['status'], 'pgm_workspace_budget_lines_status_idx'],
        ['pgm_project_workspace_objectives', ['workspace_id'], 'pgm_workspace_objectives_workspace_idx'],
        ['pgm_project_workspace_objectives', ['status'], 'pgm_workspace_objectives_status_idx'],
        ['pgm_project_workspace_tasks', ['workspace_id'], 'pgm_workspace_tasks_workspace_idx'],
        ['pgm_project_workspace_tasks', ['status'], 'pgm_workspace_tasks_status_idx'],
        ['pgm_project_workspace_meetings', ['workspace_id'], 'pgm_workspace_meetings_workspace_idx'],
        ['pgm_project_workspace_meetings', ['status'], 'pgm_workspace_meetings_status_idx'],
        ['pgm_project_workspace_calendar_events', ['workspace_id'], 'pgm_workspace_calendar_workspace_idx'],
        ['pgm_project_workspace_calendar_events', ['event_type'], 'pgm_workspace_calendar_event_type_idx'],
        ['pgm_project_workspace_role_assignments', ['workspace_id'], 'pgm_workspace_roles_workspace_idx'],
        ['pgm_project_workspace_role_assignments', ['status'], 'pgm_workspace_roles_status_idx'],
        ['pgm_project_workspace_submissions', ['workspace_id'], 'pgm_workspace_submissions_workspace_idx'],
        ['pgm_project_workspace_submissions', ['status'], 'pgm_workspace_submissions_status_idx'],
        ['pgm_project_workspace_invites', ['workspace_id'], 'pgm_workspace_invites_workspace_idx'],
        ['pgm_project_workspace_invites', ['status'], 'pgm_workspace_invites_status_idx'],
        ['pgm_project_workspace_hr_records', ['workspace_id'], 'pgm_workspace_hr_workspace_idx'],
        ['pgm_project_workspace_hr_records', ['status'], 'pgm_workspace_hr_status_idx'],
        ['pgm_project_workspace_time_entries', ['workspace_id'], 'pgm_workspace_time_workspace_idx'],
        ['pgm_project_workspace_time_entries', ['status'], 'pgm_workspace_time_status_idx'],
        ['pgm_project_workspace_objects', ['workspace_id'], 'pgm_workspace_objects_workspace_idx'],
        ['pgm_project_workspace_objects', ['object_type'], 'pgm_workspace_objects_type_idx'],
        ['pgm_project_workspace_documents', ['workspace_id'], 'pgm_workspace_documents_workspace_idx'],
        ['pgm_project_workspace_documents', ['category'], 'pgm_workspace_documents_category_idx'],
        ['pgm_project_workspace_chat_messages', ['workspace_id'], 'pgm_workspace_chat_workspace_idx'],
        ['pgm_project_workspace_chat_messages', ['channel'], 'pgm_workspace_chat_channel_idx'],
      ];

      for (const [table, fields, name] of indexDefinitions) {
        await queryInterface.addIndex(table, fields, { transaction, name });
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tables = [
        'pgm_project_workspace_chat_messages',
        'pgm_project_workspace_documents',
        'pgm_project_workspace_objects',
        'pgm_project_workspace_time_entries',
        'pgm_project_workspace_hr_records',
        'pgm_project_workspace_invites',
        'pgm_project_workspace_submissions',
        'pgm_project_workspace_role_assignments',
        'pgm_project_workspace_calendar_events',
        'pgm_project_workspace_meetings',
        'pgm_project_workspace_tasks',
        'pgm_project_workspace_objectives',
        'pgm_project_workspace_budget_lines',
        'pgm_brand_assets',
        'pgm_story_blocks',
        'pgm_vendor_scorecards',
        'pgm_gig_order_revisions',
        'pgm_gig_order_requirements',
        'pgm_gig_orders',
        'pgm_project_templates',
        'pgm_project_assets',
        'pgm_project_retrospectives',
        'pgm_project_integrations',
        'pgm_project_collaborators',
        'pgm_project_milestones',
        'pgm_project_workspaces',
        'pgm_projects',
      ];

      for (const table of tables) {
        await queryInterface.dropTable(table, { transaction });
      }

      const enums = [
        'enum_pgm_projects_status',
        'enum_pgm_project_workspaces_status',
        'enum_pgm_project_workspaces_risk_level',
        'enum_pgm_project_milestones_status',
        'enum_pgm_project_collaborators_status',
        'enum_pgm_project_integrations_status',
        'enum_pgm_gig_orders_status',
        'enum_pgm_gig_order_requirements_status',
        'enum_pgm_gig_order_revisions_status',
        'enum_pgm_project_workspace_budget_lines_status',
        'enum_pgm_project_workspace_tasks_status',
        'enum_pgm_project_workspace_tasks_priority',
        'enum_pgm_project_workspace_meetings_status',
        'enum_pgm_project_workspace_role_assignments_status',
        'enum_pgm_project_workspace_submissions_status',
        'enum_pgm_project_workspace_invites_status',
        'enum_pgm_project_workspace_hr_records_status',
        'enum_pgm_project_workspace_time_entries_status',
        'enum_pgm_project_workspace_objects_object_type',
      ];

      for (const enumName of enums) {
        await dropEnum(queryInterface, enumName, transaction);
      }
    });
  },
};
