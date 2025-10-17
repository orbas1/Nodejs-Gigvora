'use strict';

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('pgm_projects', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      owner_id: { type: Sequelize.INTEGER, allowNull: false },
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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_projects', ['owner_id']);
    await queryInterface.addIndex('pgm_projects', ['status']);

    await queryInterface.createTable('pgm_project_workspaces', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_projects', key: 'id' },
        onDelete: 'CASCADE',
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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('pgm_project_workspaces', {
      type: 'unique',
      fields: ['project_id'],
      name: 'pgm_project_workspaces_project_unique',
    });

    await queryInterface.createTable('pgm_project_milestones', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_projects', key: 'id' },
        onDelete: 'CASCADE',
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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_project_milestones', ['project_id']);
    await queryInterface.addIndex('pgm_project_milestones', ['status']);

    await queryInterface.createTable('pgm_project_collaborators', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_projects', key: 'id' },
        onDelete: 'CASCADE',
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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_project_collaborators', ['project_id']);

    await queryInterface.createTable('pgm_project_integrations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      provider: { type: Sequelize.STRING(80), allowNull: false },
      status: {
        type: Sequelize.ENUM('connected', 'disconnected', 'error'),
        allowNull: false,
        defaultValue: 'connected',
      },
      connected_at: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_project_integrations', ['project_id']);

    await queryInterface.createTable('pgm_project_retrospectives', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_projects', key: 'id' },
        onDelete: 'CASCADE',
      },
      milestone_title: { type: Sequelize.STRING(180), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: false },
      sentiment: { type: Sequelize.STRING(40), allowNull: true },
      generated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      highlights: { type: jsonType, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_project_retrospectives', ['project_id']);

    await queryInterface.createTable('pgm_project_assets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_projects', key: 'id' },
        onDelete: 'CASCADE',
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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_project_assets', ['project_id']);

    await queryInterface.createTable('pgm_project_templates', {
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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('pgm_story_blocks', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      owner_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(180), allowNull: false },
      outcome: { type: Sequelize.TEXT, allowNull: false },
      impact: { type: Sequelize.STRING(180), allowNull: true },
      metrics: { type: jsonType, allowNull: true },
      last_used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_story_blocks', ['owner_id']);

    await queryInterface.createTable('pgm_brand_assets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      owner_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(180), allowNull: false },
      asset_type: { type: Sequelize.STRING(60), allowNull: false },
      visibility: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'private' },
      media_url: { type: Sequelize.STRING(255), allowNull: false },
      watermark_enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      metadata: { type: jsonType, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_brand_assets', ['owner_id']);

    await queryInterface.createTable('pgm_gig_orders', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      owner_id: { type: Sequelize.INTEGER, allowNull: false },
      order_number: { type: Sequelize.STRING(32), allowNull: false, unique: true },
      vendor_name: { type: Sequelize.STRING(180), allowNull: false },
      service_name: { type: Sequelize.STRING(180), allowNull: false },
      status: {
        type: Sequelize.ENUM('requirements', 'in_delivery', 'in_revision', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'requirements',
      },
      progress_percent: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
      kickoff_at: { type: Sequelize.DATE, allowNull: true },
      due_at: { type: Sequelize.DATE, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_gig_orders', ['owner_id']);
    await queryInterface.addIndex('pgm_gig_orders', ['status']);
    await queryInterface.addIndex('pgm_gig_orders', ['due_at']);

    await queryInterface.createTable('pgm_gig_order_requirements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'received', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
      },
      due_at: { type: Sequelize.DATE, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_gig_order_requirements', ['order_id']);

    await queryInterface.createTable('pgm_gig_order_revisions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      round_number: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: {
        type: Sequelize.ENUM('requested', 'in_progress', 'submitted', 'approved'),
        allowNull: false,
        defaultValue: 'requested',
      },
      requested_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      due_at: { type: Sequelize.DATE, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_gig_order_revisions', ['order_id']);

    await queryInterface.createTable('pgm_vendor_scorecards', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'pgm_gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      quality_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      communication_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      reliability_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      overall_score: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('pgm_gig_timeline_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      event_type: {
        type: Sequelize.ENUM(
          'kickoff',
          'milestone',
          'check_in',
          'scope_change',
          'handoff',
          'qa',
          'client_feedback',
          'blocker'
        ),
        allowNull: false,
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: true },
      created_by_id: { type: Sequelize.INTEGER, allowNull: true },
      visibility: {
        type: Sequelize.ENUM('internal', 'client', 'vendor'),
        allowNull: false,
        defaultValue: 'internal',
      },
      occurred_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      metadata: { type: jsonType, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_gig_timeline_events', ['order_id']);
    await queryInterface.addIndex('pgm_gig_timeline_events', ['occurred_at']);

    await queryInterface.createTable('pgm_gig_submissions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'submitted',
      },
      asset_url: { type: Sequelize.STRING(255), allowNull: true },
      asset_type: { type: Sequelize.STRING(80), allowNull: true },
      attachments: { type: jsonType, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      approved_at: { type: Sequelize.DATE, allowNull: true },
      submitted_by_id: { type: Sequelize.INTEGER, allowNull: true },
      reviewed_by_id: { type: Sequelize.INTEGER, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_gig_submissions', ['order_id']);
    await queryInterface.addIndex('pgm_gig_submissions', ['status']);

    await queryInterface.createTable('pgm_gig_chat_messages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pgm_gig_orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      sender_id: { type: Sequelize.INTEGER, allowNull: true },
      sender_role: { type: Sequelize.STRING(80), allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: false },
      attachments: { type: jsonType, allowNull: true },
      visibility: {
        type: Sequelize.ENUM('internal', 'client', 'vendor'),
        allowNull: false,
        defaultValue: 'internal',
      },
      sent_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      acknowledged_at: { type: Sequelize.DATE, allowNull: true },
      acknowledged_by_id: { type: Sequelize.INTEGER, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pgm_gig_chat_messages', ['order_id']);
    await queryInterface.addIndex('pgm_gig_chat_messages', ['sent_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pgm_gig_chat_messages');
    await queryInterface.dropTable('pgm_gig_submissions');
    await queryInterface.dropTable('pgm_gig_timeline_events');
    await queryInterface.dropTable('pgm_vendor_scorecards');
    await queryInterface.dropTable('pgm_gig_order_revisions');
    await queryInterface.dropTable('pgm_gig_order_requirements');
    await queryInterface.dropTable('pgm_gig_orders');
    await queryInterface.dropTable('pgm_brand_assets');
    await queryInterface.dropTable('pgm_story_blocks');
    await queryInterface.dropTable('pgm_project_templates');
    await queryInterface.dropTable('pgm_project_assets');
    await queryInterface.dropTable('pgm_project_retrospectives');
    await queryInterface.dropTable('pgm_project_integrations');
    await queryInterface.dropTable('pgm_project_collaborators');
    await queryInterface.dropTable('pgm_project_milestones');
    await queryInterface.dropTable('pgm_project_workspaces');
    await queryInterface.dropTable('pgm_projects');

    await dropEnum(queryInterface, 'enum_pgm_projects_status');
    await dropEnum(queryInterface, 'enum_pgm_project_workspaces_status');
    await dropEnum(queryInterface, 'enum_pgm_project_workspaces_risk_level');
    await dropEnum(queryInterface, 'enum_pgm_project_milestones_status');
    await dropEnum(queryInterface, 'enum_pgm_project_collaborators_status');
    await dropEnum(queryInterface, 'enum_pgm_project_integrations_status');
    await dropEnum(queryInterface, 'enum_pgm_gig_orders_status');
    await dropEnum(queryInterface, 'enum_pgm_gig_order_requirements_status');
    await dropEnum(queryInterface, 'enum_pgm_gig_order_revisions_status');
    await dropEnum(queryInterface, 'enum_pgm_gig_timeline_events_event_type');
    await dropEnum(queryInterface, 'enum_pgm_gig_timeline_events_visibility');
    await dropEnum(queryInterface, 'enum_pgm_gig_submissions_status');
    await dropEnum(queryInterface, 'enum_pgm_gig_chat_messages_visibility');
  },
};
