'use strict';

const PROJECT_LIFECYCLE_STATES = ['open', 'closed'];
const TIMELINE_EVENT_TYPES = [
  'kickoff',
  'milestone',
  'check_in',
  'checkpoint',
  'scope_change',
  'handoff',
  'qa_review',
  'client_feedback',
  'retro',
  'note',
  'blocker',
];
const LEGACY_TIMELINE_EVENT_TYPES = [
  'kickoff',
  'milestone',
  'check_in',
  'scope_change',
  'handoff',
  'qa',
  'client_feedback',
  'blocker',
];
const TIMELINE_EVENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const AUTO_MATCH_STATUSES = ['suggested', 'contacted', 'engaged', 'dismissed'];
const PROJECT_BID_STATUSES = ['draft', 'submitted', 'shortlisted', 'awarded', 'declined', 'expired'];
const PROJECT_INVITATION_STATUSES = ['pending', 'accepted', 'declined', 'expired', 'revoked'];
const REVIEW_SUBJECT_TYPES = ['vendor', 'freelancer', 'mentor', 'project'];
const ESCROW_CHECKPOINT_STATUSES = ['pending', 'released', 'refunded', 'cancelled'];
const ESCROW_TRANSACTION_TYPES = ['deposit', 'release', 'refund', 'fee', 'adjustment'];
const ESCROW_TRANSACTION_STATUSES = ['pending', 'completed', 'failed'];

function getJsonType(Sequelize, dialect) {
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function replaceEnumType(queryInterface, Sequelize, transaction, options) {
  const { tableName, columnName, typeName, newValues, oldTypeName } = options;
  const dialect = queryInterface.sequelize.getDialect();

  if (dialect === 'postgres' || dialect === 'postgresql') {
    const tempTypeName = `${typeName}_old`;
    await queryInterface.sequelize.query(`ALTER TYPE "${typeName}" RENAME TO "${tempTypeName}";`, { transaction });
    await queryInterface.sequelize.query(
      `CREATE TYPE "${typeName}" AS ENUM (${newValues.map((value) => `'${value}'`).join(', ')});`,
      { transaction },
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE "${typeName}" USING "${columnName}"::text::"${typeName}";`,
      { transaction },
    );
    await queryInterface.sequelize.query(`DROP TYPE "${tempTypeName}";`, { transaction });
  } else {
    await queryInterface.changeColumn(
      tableName,
      columnName,
      {
        type: Sequelize.ENUM(...newValues),
        allowNull: false,
      },
      { transaction },
    );
  }

  if (oldTypeName && (dialect === 'postgres' || dialect === 'postgresql')) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${oldTypeName}";`, { transaction });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = getJsonType(Sequelize, dialect);

      await queryInterface.addColumn(
        'pgm_projects',
        'category',
        { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'General' },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'skills',
        { type: jsonType, allowNull: false, defaultValue: [] },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'duration_weeks',
        { type: Sequelize.INTEGER, allowNull: false, defaultValue: 4 },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'lifecycle_state',
        { type: Sequelize.ENUM(...PROJECT_LIFECYCLE_STATES), allowNull: false, defaultValue: 'open' },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_enabled',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_accept_enabled',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_reject_enabled',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_budget_min',
        { type: Sequelize.DECIMAL(12, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_budget_max',
        { type: Sequelize.DECIMAL(12, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_weekly_hours_min',
        { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_weekly_hours_max',
        { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_duration_weeks_min',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_duration_weeks_max',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_skills',
        { type: jsonType, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_notes',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_projects',
        'auto_match_updated_by',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await replaceEnumType(queryInterface, Sequelize, transaction, {
        tableName: 'pgm_gig_timeline_events',
        columnName: 'event_type',
        typeName: 'enum_pgm_gig_timeline_events_event_type',
        newValues: TIMELINE_EVENT_TYPES,
      });

      await queryInterface.addColumn(
        'pgm_gig_timeline_events',
        'status',
        { type: Sequelize.ENUM(...TIMELINE_EVENT_STATUSES), allowNull: false, defaultValue: 'scheduled' },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_timeline_events',
        'scheduled_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_timeline_events',
        'completed_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_timeline_events',
        'attachments',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'pgm_gig_submissions',
        'submitted_by',
        { type: Sequelize.STRING(160), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_submissions',
        'submitted_by_email',
        { type: Sequelize.STRING(180), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_submissions',
        'review_notes',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_gig_order_escrows',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
          },
          label: { type: Sequelize.STRING(120), allowNull: false },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          status: { type: Sequelize.ENUM(...ESCROW_CHECKPOINT_STATUSES), allowNull: false, defaultValue: 'pending' },
          approval_requirement: { type: Sequelize.STRING(160), allowNull: true },
          csat_threshold: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          released_at: { type: Sequelize.DATE, allowNull: true },
          released_by_id: { type: Sequelize.INTEGER, allowNull: true },
          payout_reference: { type: Sequelize.STRING(160), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_gig_order_escrows', ['order_id'], { transaction });
      await queryInterface.addIndex('pgm_gig_order_escrows', ['status'], { transaction });

      await queryInterface.createTable(
        'pgm_gig_order_activities',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
          },
          freelancer_id: { type: Sequelize.INTEGER, allowNull: true },
          actor_id: { type: Sequelize.INTEGER, allowNull: true },
          activity_type: { type: Sequelize.ENUM('system', 'client', 'vendor', 'internal'), allowNull: false, defaultValue: 'system' },
          title: { type: Sequelize.STRING(180), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          occurred_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_gig_order_activities', ['order_id'], { transaction });
      await queryInterface.addIndex('pgm_gig_order_activities', ['activity_type'], { transaction });

      await queryInterface.createTable(
        'pgm_gig_order_messages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
          },
          author_id: { type: Sequelize.INTEGER, allowNull: false },
          author_name: { type: Sequelize.STRING(180), allowNull: false },
          role_label: { type: Sequelize.STRING(120), allowNull: true },
          body: { type: Sequelize.TEXT, allowNull: false },
          attachments: { type: jsonType, allowNull: true },
          visibility: { type: Sequelize.ENUM('private', 'shared'), allowNull: false, defaultValue: 'private' },
          posted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_gig_order_messages', ['order_id'], { transaction });
      await queryInterface.addIndex('pgm_gig_order_messages', ['visibility'], { transaction });

      await queryInterface.createTable(
        'pgm_gig_submission_assets',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          submission_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_submissions', key: 'id' },
            onDelete: 'CASCADE',
          },
          label: { type: Sequelize.STRING(180), allowNull: false },
          url: { type: Sequelize.STRING(255), allowNull: false },
          preview_url: { type: Sequelize.STRING(255), allowNull: true },
          size_bytes: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_gig_submission_assets', ['submission_id'], { transaction });

      await queryInterface.createTable(
        'pgm_project_bids',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          vendor_name: { type: Sequelize.STRING(160), allowNull: false },
          vendor_email: { type: Sequelize.STRING(180), allowNull: true },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          status: { type: Sequelize.ENUM(...PROJECT_BID_STATUSES), allowNull: false, defaultValue: 'draft' },
          submitted_at: { type: Sequelize.DATE, allowNull: true },
          valid_until: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_project_bids', ['owner_id'], { transaction });
      await queryInterface.addIndex('pgm_project_bids', ['status'], { transaction });

      await queryInterface.createTable(
        'pgm_project_invitations',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          freelancer_name: { type: Sequelize.STRING(160), allowNull: false },
          freelancer_email: { type: Sequelize.STRING(180), allowNull: true },
          role: { type: Sequelize.STRING(120), allowNull: true },
          message: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.ENUM(...PROJECT_INVITATION_STATUSES), allowNull: false, defaultValue: 'pending' },
          invite_sent_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          responded_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_project_invitations', ['owner_id'], { transaction });
      await queryInterface.addIndex('pgm_project_invitations', ['status'], { transaction });

      await queryInterface.createTable(
        'pgm_auto_match_settings',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          matching_window_days: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 14 },
          budget_min: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          budget_max: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          target_roles: { type: jsonType, allowNull: true },
          focus_skills: { type: jsonType, allowNull: true },
          geo_preferences: { type: jsonType, allowNull: true },
          seniority: { type: Sequelize.STRING(80), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_auto_match_candidates',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          freelancer_name: { type: Sequelize.STRING(160), allowNull: false },
          freelancer_email: { type: Sequelize.STRING(180), allowNull: true },
          match_score: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          status: { type: Sequelize.ENUM(...AUTO_MATCH_STATUSES), allowNull: false, defaultValue: 'suggested' },
          matched_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          channel: { type: Sequelize.STRING(60), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_auto_match_candidates', ['owner_id'], { transaction });
      await queryInterface.addIndex('pgm_auto_match_candidates', ['status'], { transaction });

      await queryInterface.createTable(
        'pgm_project_reviews',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          order_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'SET NULL',
          },
          project_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          subject_type: { type: Sequelize.ENUM(...REVIEW_SUBJECT_TYPES), allowNull: false, defaultValue: 'vendor' },
          subject_name: { type: Sequelize.STRING(160), allowNull: false },
          rating_overall: { type: Sequelize.DECIMAL(3, 2), allowNull: false },
          rating_quality: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          rating_communication: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          rating_professionalism: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          would_recommend: { type: Sequelize.BOOLEAN, allowNull: true },
          comments: { type: Sequelize.TEXT, allowNull: true },
          submitted_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_project_reviews', ['owner_id'], { transaction });
      await queryInterface.addIndex('pgm_project_reviews', ['subject_type'], { transaction });

      await queryInterface.createTable(
        'pgm_escrow_accounts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          balance: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          auto_release_days: { type: Sequelize.INTEGER, allowNull: true },
          last_audit_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'pgm_escrow_transactions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          account_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pgm_escrow_accounts', key: 'id' },
            onDelete: 'CASCADE',
          },
          reference: { type: Sequelize.STRING(64), allowNull: false },
          type: { type: Sequelize.ENUM(...ESCROW_TRANSACTION_TYPES), allowNull: false },
          status: { type: Sequelize.ENUM(...ESCROW_TRANSACTION_STATUSES), allowNull: false, defaultValue: 'pending' },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          occurred_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          description: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );
      await queryInterface.addIndex('pgm_escrow_transactions', ['account_id'], { transaction });
      await queryInterface.addIndex('pgm_escrow_transactions', ['status'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('pgm_escrow_transactions', { transaction });
      await queryInterface.dropTable('pgm_escrow_accounts', { transaction });
      await queryInterface.dropTable('pgm_project_reviews', { transaction });
      await queryInterface.dropTable('pgm_auto_match_candidates', { transaction });
      await queryInterface.dropTable('pgm_auto_match_settings', { transaction });
      await queryInterface.dropTable('pgm_project_invitations', { transaction });
      await queryInterface.dropTable('pgm_project_bids', { transaction });
      await queryInterface.dropTable('pgm_gig_submission_assets', { transaction });
      await queryInterface.dropTable('pgm_gig_order_messages', { transaction });
      await queryInterface.dropTable('pgm_gig_order_activities', { transaction });
      await queryInterface.dropTable('pgm_gig_order_escrows', { transaction });

      await queryInterface.removeColumn('pgm_gig_submissions', 'review_notes', { transaction });
      await queryInterface.removeColumn('pgm_gig_submissions', 'submitted_by_email', { transaction });
      await queryInterface.removeColumn('pgm_gig_submissions', 'submitted_by', { transaction });

      await queryInterface.removeColumn('pgm_gig_timeline_events', 'attachments', { transaction });
      await queryInterface.removeColumn('pgm_gig_timeline_events', 'completed_at', { transaction });
      await queryInterface.removeColumn('pgm_gig_timeline_events', 'scheduled_at', { transaction });
      await queryInterface.removeColumn('pgm_gig_timeline_events', 'status', { transaction });

      await replaceEnumType(queryInterface, Sequelize, transaction, {
        tableName: 'pgm_gig_timeline_events',
        columnName: 'event_type',
        typeName: 'enum_pgm_gig_timeline_events_event_type',
        newValues: LEGACY_TIMELINE_EVENT_TYPES,
      });

      await queryInterface.removeColumn('pgm_projects', 'auto_match_updated_by', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_notes', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_skills', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_duration_weeks_max', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_duration_weeks_min', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_weekly_hours_max', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_weekly_hours_min', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_budget_max', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_budget_min', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_reject_enabled', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_accept_enabled', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'auto_match_enabled', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'lifecycle_state', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'duration_weeks', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'skills', { transaction });
      await queryInterface.removeColumn('pgm_projects', 'category', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_gig_order_escrows_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_gig_order_activities_activity_type";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_gig_order_messages_visibility";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_project_bids_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_project_invitations_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_auto_match_candidates_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_project_reviews_subject_type";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_escrow_transactions_type";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_escrow_transactions_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_gig_timeline_events_status";', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pgm_projects_lifecycle_state";', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
