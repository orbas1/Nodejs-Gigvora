'use strict';

const TIMELINE_EVENT_TYPE_ENUM = 'enum_pgm_gig_timeline_events_event_type';
const TIMELINE_STATUS_ENUM = 'enum_pgm_gig_timeline_events_status';
const SUBMISSION_STATUS_ENUM = 'enum_pgm_gig_submissions_status';
const GIG_CHAT_VISIBILITY_ENUM = 'enum_pgm_gig_chat_messages_visibility';
const GIG_ESCROW_STATUS_ENUM = 'enum_pgm_gig_order_escrows_status';
const GIG_ACTIVITY_TYPE_ENUM = 'enum_pgm_gig_order_activities_activity_type';
const GIG_ORDER_MESSAGE_VISIBILITY_ENUM = 'enum_pgm_gig_order_messages_visibility';
const AUTO_MATCH_STATUS_ENUM = 'enum_pgm_auto_match_candidates_status';
const PROJECT_BID_STATUS_ENUM = 'enum_pgm_project_bids_status';
const PROJECT_INVITE_STATUS_ENUM = 'enum_pgm_project_invitations_status';
const REVIEW_SUBJECT_TYPE_ENUM = 'enum_pgm_project_reviews_subject_type';
const CLIENT_ACCOUNT_TIER_ENUM = 'enum_pgm_client_accounts_tier';
const CLIENT_ACCOUNT_STATUS_ENUM = 'enum_pgm_client_accounts_status';
const CLIENT_ACCOUNT_HEALTH_ENUM = 'enum_pgm_client_accounts_healthStatus';
const CLIENT_CARD_PRIORITY_ENUM = 'enum_pgm_client_kanban_cards_priority';
const CLIENT_CARD_RISK_ENUM = 'enum_pgm_client_kanban_cards_riskLevel';
const WORKSPACE_BUDGET_STATUS_ENUM = 'enum_pgm_project_workspace_budget_lines_status';
const WORKSPACE_TASK_STATUS_ENUM = 'enum_pgm_project_workspace_tasks_status';
const WORKSPACE_TASK_PRIORITY_ENUM = 'enum_pgm_project_workspace_tasks_priority';
const WORKSPACE_MEETING_STATUS_ENUM = 'enum_pgm_project_workspace_meetings_status';
const WORKSPACE_INVITE_STATUS_ENUM = 'enum_pgm_project_workspace_invites_status';
const WORKSPACE_ROLE_STATUS_ENUM = 'enum_pgm_project_workspace_role_assignments_status';
const WORKSPACE_SUBMISSION_STATUS_ENUM = 'enum_pgm_project_workspace_submissions_status';
const WORKSPACE_HR_STATUS_ENUM = 'enum_pgm_project_workspace_hr_records_status';
const WORKSPACE_TIME_ENTRY_STATUS_ENUM = 'enum_pgm_project_workspace_time_entries_status';
const WORKSPACE_OBJECT_TYPE_ENUM = 'enum_pgm_project_workspace_objects_objectType';

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

const TIMELINE_EVENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

const SUBMISSION_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'needs_changes'];

const GIG_ESCROW_STATUSES = ['pending', 'funded', 'released', 'refunded', 'cancelled'];

const GIG_ACTIVITY_TYPES = ['system', 'client', 'vendor', 'internal', 'communication'];

const GIG_ORDER_MESSAGE_VISIBILITIES = ['private', 'shared'];

const AUTO_MATCH_STATUSES = ['suggested', 'contacted', 'engaged', 'dismissed'];

const PROJECT_BID_STATUSES = ['draft', 'submitted', 'shortlisted', 'awarded', 'declined', 'expired'];

const PROJECT_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired', 'revoked'];

const REVIEW_SUBJECT_TYPES = ['vendor', 'freelancer', 'mentor', 'project'];

const CLIENT_ACCOUNT_TIERS = ['strategic', 'growth', 'core', 'incubating'];
const CLIENT_ACCOUNT_STATUSES = ['active', 'onboarding', 'paused', 'closed'];
const CLIENT_ACCOUNT_HEALTH = ['healthy', 'monitor', 'at_risk'];

const CLIENT_CARD_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const CLIENT_CARD_RISK_LEVELS = ['low', 'medium', 'high'];

const WORKSPACE_BUDGET_STATUSES = ['planned', 'approved', 'in_progress', 'completed', 'overbudget'];
const WORKSPACE_TASK_STATUSES = ['planned', 'in_progress', 'blocked', 'completed', 'cancelled'];
const WORKSPACE_TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const WORKSPACE_MEETING_STATUSES = ['scheduled', 'completed', 'cancelled'];
const WORKSPACE_INVITE_STATUSES = ['pending', 'accepted', 'declined', 'expired'];
const WORKSPACE_ROLE_STATUSES = ['draft', 'active', 'backfill', 'closed'];
const WORKSPACE_SUBMISSION_STATUSES = ['pending', 'in_review', 'approved', 'changes_requested'];
const WORKSPACE_HR_STATUSES = ['planned', 'active', 'on_leave', 'completed'];
const WORKSPACE_TIME_ENTRY_STATUSES = ['draft', 'submitted', 'approved', 'rejected'];
const WORKSPACE_OBJECT_TYPES = ['asset', 'deliverable', 'dependency', 'risk', 'note'];

function isPostgres(queryInterface) {
  const dialect = queryInterface.sequelize.getDialect();
  return dialect === 'postgres' || dialect === 'postgresql';
}

async function describeTable(queryInterface, tableName, transaction) {
  try {
    return await queryInterface.describeTable(tableName, { transaction });
  } catch (error) {
    if (error && error.message && error.message.toLowerCase().includes('does not exist')) {
      return null;
    }
    if (error && error.original && error.original.toString().toLowerCase().includes('does not exist')) {
      return null;
    }
    throw error;
  }
}

async function ensureColumn(queryInterface, tableName, columnName, definition, transaction) {
  const table = await describeTable(queryInterface, tableName, transaction);
  if (!table || table[columnName]) {
    return;
  }
  await queryInterface.addColumn(tableName, columnName, definition, { transaction });
}

async function ensureEnumValues(queryInterface, enumName, values, transaction) {
  if (!isPostgres(queryInterface)) {
    return;
  }

  for (const value of values) {
    await queryInterface.sequelize.query(
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = :enumName AND e.enumlabel = :enumValue
        ) THEN
          ALTER TYPE "${enumName}" ADD VALUE :enumValue;
        END IF;
      END $$;`,
      {
        transaction,
        replacements: { enumName, enumValue: value },
      },
    );
  }
}

async function createTableIfMissing(queryInterface, tableName, columnsFactory, indexes = [], transaction) {
  const exists = await describeTable(queryInterface, tableName, transaction);
  if (exists) {
    return;
  }

  const dialect = queryInterface.sequelize.getDialect();
  const jsonType = ['postgres', 'postgresql'].includes(dialect)
    ? queryInterface.sequelize.constructor.JSONB
    : queryInterface.sequelize.constructor.JSON;
  const { INTEGER, STRING, TEXT, DECIMAL, DATE, DATEONLY, BOOLEAN, ENUM } = queryInterface.sequelize.constructor;
  const columns = columnsFactory({ INTEGER, STRING, TEXT, DECIMAL, DATE, DATEONLY, BOOLEAN, ENUM, JSON: jsonType, JSONB: jsonType });
  await queryInterface.createTable(tableName, columns, { transaction });

  for (const index of indexes) {
    await queryInterface.addIndex(tableName, index, { transaction });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await createTableIfMissing(
        queryInterface,
        'pgm_gig_order_escrows',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, BOOLEAN, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
          },
          label: { type: STRING(120), allowNull: false },
          amount: { type: DECIMAL(12, 2), allowNull: false },
          currency: { type: STRING(6), allowNull: false, defaultValue: 'USD' },
          status: { type: ENUM(...GIG_ESCROW_STATUSES), allowNull: false, defaultValue: 'pending' },
          approval_requirement: { type: STRING(160), allowNull: true },
          csat_threshold: { type: DECIMAL(3, 2), allowNull: true },
          released_at: { type: DATE, allowNull: true },
          released_by_id: { type: INTEGER, allowNull: true },
          payout_reference: { type: STRING(160), allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['order_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_gig_order_activities',
        ({ INTEGER, STRING, TEXT, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
          },
          freelancer_id: { type: INTEGER, allowNull: true },
          actor_id: { type: INTEGER, allowNull: true },
          activity_type: { type: ENUM(...GIG_ACTIVITY_TYPES), allowNull: false, defaultValue: 'system' },
          title: { type: STRING(180), allowNull: false },
          description: { type: TEXT, allowNull: true },
          occurred_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['order_id'] },
          { fields: ['activity_type'] },
          { fields: ['occurred_at'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_gig_order_messages',
        ({ INTEGER, STRING, TEXT, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          order_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'CASCADE',
          },
          author_id: { type: INTEGER, allowNull: false },
          author_name: { type: STRING(180), allowNull: false },
          role_label: { type: STRING(120), allowNull: true },
          body: { type: TEXT, allowNull: false },
          attachments: { type: JSON, allowNull: true },
          visibility: { type: ENUM(...GIG_ORDER_MESSAGE_VISIBILITIES), allowNull: false, defaultValue: 'private' },
          posted_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['order_id'] },
          { fields: ['posted_at'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_bids',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false },
          project_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: STRING(200), allowNull: false },
          vendor_name: { type: STRING(160), allowNull: false },
          vendor_email: { type: STRING(180), allowNull: true },
          amount: { type: DECIMAL(12, 2), allowNull: true },
          currency: { type: STRING(6), allowNull: false, defaultValue: 'USD' },
          status: { type: ENUM(...PROJECT_BID_STATUSES), allowNull: false, defaultValue: 'draft' },
          submitted_at: { type: DATE, allowNull: true },
          valid_until: { type: DATE, allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_invitations',
        ({ INTEGER, STRING, TEXT, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false },
          project_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          freelancer_name: { type: STRING(160), allowNull: false },
          freelancer_email: { type: STRING(180), allowNull: true },
          role: { type: STRING(120), allowNull: true },
          message: { type: TEXT, allowNull: true },
          status: { type: ENUM(...PROJECT_INVITE_STATUSES), allowNull: false, defaultValue: 'pending' },
          invite_sent_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          responded_at: { type: DATE, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_auto_match_settings',
        ({ INTEGER, STRING, DECIMAL, BOOLEAN, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false, unique: true },
          enabled: { type: BOOLEAN, allowNull: false, defaultValue: false },
          matching_window_days: { type: INTEGER, allowNull: false, defaultValue: 14 },
          budget_min: { type: DECIMAL(12, 2), allowNull: true },
          budget_max: { type: DECIMAL(12, 2), allowNull: true },
          target_roles: { type: JSON, allowNull: true },
          focus_skills: { type: JSON, allowNull: true },
          geo_preferences: { type: JSON, allowNull: true },
          seniority: { type: STRING(80), allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_auto_match_candidates',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false },
          project_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          freelancer_name: { type: STRING(160), allowNull: false },
          freelancer_email: { type: STRING(180), allowNull: true },
          match_score: { type: DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          status: { type: ENUM(...AUTO_MATCH_STATUSES), allowNull: false, defaultValue: 'suggested' },
          matched_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          channel: { type: STRING(60), allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_reviews',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, BOOLEAN, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false },
          order_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_gig_orders', key: 'id' },
            onDelete: 'SET NULL',
          },
          project_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_projects', key: 'id' },
            onDelete: 'SET NULL',
          },
          subject_type: { type: ENUM(...REVIEW_SUBJECT_TYPES), allowNull: false, defaultValue: 'vendor' },
          subject_name: { type: STRING(160), allowNull: false },
          rating_overall: { type: DECIMAL(3, 2), allowNull: false },
          rating_quality: { type: DECIMAL(3, 2), allowNull: true },
          rating_communication: { type: DECIMAL(3, 2), allowNull: true },
          rating_professionalism: { type: DECIMAL(3, 2), allowNull: true },
          would_recommend: { type: BOOLEAN, allowNull: true },
          comments: { type: TEXT, allowNull: true },
          submitted_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
          { fields: ['subject_type'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_escrow_accounts',
        ({ INTEGER, STRING, DECIMAL, DATE, INTEGER: INT, JSON, BOOLEAN }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false, unique: true },
          currency: { type: STRING(6), allowNull: false, defaultValue: 'USD' },
          balance: { type: DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
          auto_release_days: { type: INT, allowNull: true },
          last_audit_at: { type: DATE, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_escrow_transactions',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          account_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_escrow_accounts', key: 'id' },
            onDelete: 'CASCADE',
          },
          reference: { type: STRING(64), allowNull: false },
          type: { type: ENUM('deposit', 'release', 'refund', 'fee', 'adjustment'), allowNull: false },
          status: { type: ENUM('pending', 'completed', 'failed'), allowNull: false, defaultValue: 'pending' },
          amount: { type: DECIMAL(12, 2), allowNull: false },
          currency: { type: STRING(6), allowNull: false, defaultValue: 'USD' },
          occurred_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          description: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['account_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_client_accounts',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false },
          workspace_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          name: { type: STRING(180), allowNull: false },
          slug: { type: STRING(180), allowNull: true },
          website_url: { type: STRING(255), allowNull: true },
          logo_url: { type: STRING(255), allowNull: true },
          industry: { type: STRING(120), allowNull: true },
          tier: { type: ENUM(...CLIENT_ACCOUNT_TIERS), allowNull: false, defaultValue: 'growth' },
          status: { type: ENUM(...CLIENT_ACCOUNT_STATUSES), allowNull: false, defaultValue: 'active' },
          health_status: { type: ENUM(...CLIENT_ACCOUNT_HEALTH), allowNull: false, defaultValue: 'healthy' },
          annual_contract_value: { type: DECIMAL(12, 2), allowNull: true },
          timezone: { type: STRING(60), allowNull: true },
          primary_contact_name: { type: STRING(180), allowNull: true },
          primary_contact_email: { type: STRING(180), allowNull: true },
          primary_contact_phone: { type: STRING(60), allowNull: true },
          account_manager_name: { type: STRING(180), allowNull: true },
          account_manager_email: { type: STRING(180), allowNull: true },
          last_interaction_at: { type: DATE, allowNull: true },
          next_review_at: { type: DATE, allowNull: true },
          tags: { type: JSON, allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_client_kanban_columns',
        ({ INTEGER, STRING, INTEGER: INT, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false },
          workspace_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          name: { type: STRING(120), allowNull: false },
          slug: { type: STRING(160), allowNull: true },
          wip_limit: { type: INT, allowNull: true },
          sort_order: { type: INT, allowNull: false, defaultValue: 0 },
          color: { type: STRING(30), allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['owner_id'] },
          { fields: ['sort_order'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_client_kanban_cards',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          owner_id: { type: INTEGER, allowNull: false },
          client_id: {
            type: INTEGER,
            allowNull: true,
            references: { model: 'pgm_client_accounts', key: 'id' },
            onDelete: 'SET NULL',
          },
          column_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_client_kanban_columns', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: STRING(200), allowNull: false },
          summary: { type: TEXT, allowNull: true },
          priority: { type: ENUM(...CLIENT_CARD_PRIORITIES), allowNull: false, defaultValue: 'medium' },
          risk_level: { type: ENUM(...CLIENT_CARD_RISK_LEVELS), allowNull: true },
          value: { type: DECIMAL(12, 2), allowNull: true },
          renewal_date: { type: DATE, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['column_id'] },
          { fields: ['priority'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_client_kanban_checklist_items',
        ({ INTEGER, STRING, BOOLEAN, DATE, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          card_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_client_kanban_cards', key: 'id' },
            onDelete: 'CASCADE',
          },
          label: { type: STRING(200), allowNull: false },
          completed: { type: BOOLEAN, allowNull: false, defaultValue: false },
          completed_at: { type: DATE, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['card_id'] },
          { fields: ['completed'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_budget_lines',
        ({ INTEGER, STRING, TEXT, DECIMAL, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          category: { type: STRING(120), allowNull: false },
          label: { type: STRING(180), allowNull: false },
          description: { type: TEXT, allowNull: true },
          planned_amount: { type: DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          actual_amount: { type: DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          currency: { type: STRING(6), allowNull: false, defaultValue: 'USD' },
          status: { type: ENUM(...WORKSPACE_BUDGET_STATUSES), allowNull: false, defaultValue: 'planned' },
          owner_name: { type: STRING(120), allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_objectives',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, INTEGER: INT, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: STRING(200), allowNull: false },
          description: { type: TEXT, allowNull: true },
          owner_name: { type: STRING(120), allowNull: true },
          metric: { type: STRING(120), allowNull: true },
          target_value: { type: DECIMAL(12, 2), allowNull: true },
          current_value: { type: DECIMAL(12, 2), allowNull: true },
          status: { type: STRING(60), allowNull: false, defaultValue: 'on_track' },
          due_date: { type: DATE, allowNull: true },
          weight: { type: INT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_tasks',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: STRING(200), allowNull: false },
          description: { type: TEXT, allowNull: true },
          status: { type: ENUM(...WORKSPACE_TASK_STATUSES), allowNull: false, defaultValue: 'planned' },
          priority: { type: ENUM(...WORKSPACE_TASK_PRIORITIES), allowNull: false, defaultValue: 'medium' },
          lane: { type: STRING(120), allowNull: true },
          assignee_name: { type: STRING(120), allowNull: true },
          assignee_email: { type: STRING(180), allowNull: true },
          start_date: { type: DATE, allowNull: true },
          due_date: { type: DATE, allowNull: true },
          estimated_hours: { type: DECIMAL(8, 2), allowNull: true },
          logged_hours: { type: DECIMAL(8, 2), allowNull: true },
          progress_percent: { type: DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          dependencies: { type: JSON, allowNull: true },
          tags: { type: JSON, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['status'] },
          { fields: ['priority'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_meetings',
        ({ INTEGER, STRING, TEXT, DATE, ENUM, JSON, INTEGER: INT }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: STRING(200), allowNull: false },
          agenda: { type: TEXT, allowNull: true },
          status: { type: ENUM(...WORKSPACE_MEETING_STATUSES), allowNull: false, defaultValue: 'scheduled' },
          scheduled_at: { type: DATE, allowNull: false },
          duration_minutes: { type: INT, allowNull: false, defaultValue: 60 },
          location: { type: STRING(180), allowNull: true },
          meeting_link: { type: STRING(255), allowNull: true },
          organizer_name: { type: STRING(120), allowNull: true },
          notes: { type: TEXT, allowNull: true },
          follow_up_items: { type: JSON, allowNull: true },
          recurrence_rule: { type: STRING(180), allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['scheduled_at'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_calendar_events',
        ({ INTEGER, STRING, TEXT, DATE, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: STRING(200), allowNull: false },
          event_type: { type: STRING(80), allowNull: false, defaultValue: 'milestone' },
          start_at: { type: DATE, allowNull: false },
          end_at: { type: DATE, allowNull: true },
          visibility: { type: STRING(40), allowNull: false, defaultValue: 'team' },
          location: { type: STRING(180), allowNull: true },
          description: { type: TEXT, allowNull: true },
          attendees: { type: JSON, allowNull: true },
          reminder_minutes_before: { type: INTEGER, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['start_at'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_role_assignments',
        ({ INTEGER, STRING, TEXT, DECIMAL, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          role_name: { type: STRING(140), allowNull: false },
          description: { type: TEXT, allowNull: true },
          member_name: { type: STRING(120), allowNull: true },
          member_email: { type: STRING(180), allowNull: true },
          status: { type: ENUM(...WORKSPACE_ROLE_STATUSES), allowNull: false, defaultValue: 'draft' },
          allocation_percent: { type: DECIMAL(5, 2), allowNull: true },
          permissions: { type: JSON, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_submissions',
        ({ INTEGER, STRING, TEXT, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: STRING(200), allowNull: false },
          submission_type: { type: STRING(80), allowNull: false, defaultValue: 'deliverable' },
          status: { type: ENUM(...WORKSPACE_SUBMISSION_STATUSES), allowNull: false, defaultValue: 'pending' },
          due_at: { type: DATE, allowNull: true },
          submitted_at: { type: DATE, allowNull: true },
          submitted_by_name: { type: STRING(120), allowNull: true },
          submitted_by_email: { type: STRING(180), allowNull: true },
          asset_url: { type: STRING(255), allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_invites',
        ({ INTEGER, STRING, TEXT, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          email: { type: STRING(180), allowNull: false },
          role: { type: STRING(120), allowNull: false },
          status: { type: ENUM(...WORKSPACE_INVITE_STATUSES), allowNull: false, defaultValue: 'pending' },
          invited_by_name: { type: STRING(120), allowNull: true },
          invited_by_email: { type: STRING(180), allowNull: true },
          message: { type: TEXT, allowNull: true },
          invited_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          responded_at: { type: DATE, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_hr_records',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATE, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          member_name: { type: STRING(120), allowNull: false },
          role_title: { type: STRING(140), allowNull: true },
          employment_type: { type: STRING(80), allowNull: false, defaultValue: 'contract' },
          status: { type: ENUM(...WORKSPACE_HR_STATUSES), allowNull: false, defaultValue: 'planned' },
          start_date: { type: DATE, allowNull: true },
          end_date: { type: DATE, allowNull: true },
          hourly_rate: { type: DECIMAL(10, 2), allowNull: true },
          weekly_capacity_hours: { type: DECIMAL(6, 2), allowNull: true },
          allocation_percent: { type: DECIMAL(5, 2), allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['status'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_time_entries',
        ({ INTEGER, STRING, TEXT, DECIMAL, DATEONLY, BOOLEAN, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          member_name: { type: STRING(120), allowNull: false },
          entry_date: { type: DATEONLY, allowNull: false },
          hours: { type: DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
          billable: { type: BOOLEAN, allowNull: false, defaultValue: true },
          status: { type: ENUM(...WORKSPACE_TIME_ENTRY_STATUSES), allowNull: false, defaultValue: 'submitted' },
          notes: { type: TEXT, allowNull: true },
          approved_by_name: { type: STRING(120), allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['entry_date'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_objects',
        ({ INTEGER, STRING, TEXT, INTEGER: INT, ENUM, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          object_type: { type: ENUM(...WORKSPACE_OBJECT_TYPES), allowNull: false, defaultValue: 'asset' },
          label: { type: STRING(200), allowNull: false },
          description: { type: TEXT, allowNull: true },
          owner_name: { type: STRING(120), allowNull: true },
          quantity: { type: INT, allowNull: true },
          unit: { type: STRING(40), allowNull: true },
          status: { type: STRING(60), allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['object_type'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_documents',
        ({ INTEGER, STRING, TEXT, INTEGER: INT, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: STRING(200), allowNull: false },
          category: { type: STRING(120), allowNull: false, defaultValue: 'general' },
          storage_url: { type: STRING(255), allowNull: false },
          thumbnail_url: { type: STRING(255), allowNull: true },
          size_bytes: { type: INT, allowNull: true },
          visibility: { type: STRING(40), allowNull: false, defaultValue: 'team' },
          owner_name: { type: STRING(120), allowNull: true },
          version: { type: STRING(40), allowNull: true },
          notes: { type: TEXT, allowNull: true },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
        ],
        transaction,
      );

      await createTableIfMissing(
        queryInterface,
        'pgm_project_workspace_chat_messages',
        ({ INTEGER, STRING, TEXT, DATE, BOOLEAN, JSON }) => ({
          id: { type: INTEGER, autoIncrement: true, primaryKey: true },
          workspace_id: {
            type: INTEGER,
            allowNull: false,
            references: { model: 'pgm_project_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          channel: { type: STRING(120), allowNull: false, defaultValue: 'general' },
          author_name: { type: STRING(120), allowNull: false },
          author_role: { type: STRING(80), allowNull: true },
          body: { type: TEXT, allowNull: false },
          posted_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          pinned: { type: BOOLEAN, allowNull: false, defaultValue: false },
          metadata: { type: JSON, allowNull: true },
          created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }),
        [
          { fields: ['workspace_id'] },
          { fields: ['posted_at'] },
        ],
        transaction,
      );

      await ensureEnumValues(queryInterface, TIMELINE_EVENT_TYPE_ENUM, TIMELINE_EVENT_TYPES, transaction);
      await ensureColumn(queryInterface, 'pgm_gig_timeline_events', 'status', {
        type: Sequelize.ENUM(...TIMELINE_EVENT_STATUSES),
        allowNull: false,
        defaultValue: 'scheduled',
      }, transaction);
      await ensureColumn(queryInterface, 'pgm_gig_timeline_events', 'scheduled_at', { type: Sequelize.DATE, allowNull: true }, transaction);
      await ensureColumn(queryInterface, 'pgm_gig_timeline_events', 'completed_at', { type: Sequelize.DATE, allowNull: true }, transaction);

      await ensureEnumValues(queryInterface, SUBMISSION_STATUS_ENUM, SUBMISSION_STATUSES, transaction);
      await ensureColumn(queryInterface, 'pgm_gig_submissions', 'notes', { type: Sequelize.TEXT, allowNull: true }, transaction);
      await ensureColumn(queryInterface, 'pgm_gig_submissions', 'review_notes', { type: Sequelize.TEXT, allowNull: true }, transaction);
      await ensureColumn(queryInterface, 'pgm_gig_submissions', 'submitted_by', { type: Sequelize.STRING(160), allowNull: true }, transaction);
      await ensureColumn(queryInterface, 'pgm_gig_submissions', 'submitted_by_email', { type: Sequelize.STRING(180), allowNull: true }, transaction);

      const chatTable = await describeTable(queryInterface, 'pgm_gig_chat_messages', transaction);
      if (chatTable) {
        await ensureColumn(queryInterface, 'pgm_gig_chat_messages', 'author_name', {
          type: Sequelize.STRING(180),
          allowNull: false,
          defaultValue: 'Workspace operator',
        }, transaction);
        await ensureColumn(queryInterface, 'pgm_gig_chat_messages', 'pinned', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        }, transaction);
      }

      await ensureEnumValues(queryInterface, GIG_ACTIVITY_TYPE_ENUM, GIG_ACTIVITY_TYPES, transaction);
      await ensureEnumValues(queryInterface, GIG_ESCROW_STATUS_ENUM, GIG_ESCROW_STATUSES, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dropTables = [
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
        'pgm_client_kanban_checklist_items',
        'pgm_client_kanban_cards',
        'pgm_client_kanban_columns',
        'pgm_client_accounts',
        'pgm_escrow_transactions',
        'pgm_escrow_accounts',
        'pgm_project_reviews',
        'pgm_auto_match_candidates',
        'pgm_auto_match_settings',
        'pgm_project_invitations',
        'pgm_project_bids',
        'pgm_gig_order_messages',
        'pgm_gig_order_activities',
        'pgm_gig_order_escrows',
      ];

      for (const table of dropTables) {
        await queryInterface.dropTable(table, { transaction }).catch(() => {});
      }

      const enumsToDrop = [
        WORKSPACE_OBJECT_TYPE_ENUM,
        WORKSPACE_TIME_ENTRY_STATUS_ENUM,
        WORKSPACE_HR_STATUS_ENUM,
        WORKSPACE_SUBMISSION_STATUS_ENUM,
        WORKSPACE_ROLE_STATUS_ENUM,
        WORKSPACE_INVITE_STATUS_ENUM,
        WORKSPACE_MEETING_STATUS_ENUM,
        WORKSPACE_TASK_PRIORITY_ENUM,
        WORKSPACE_TASK_STATUS_ENUM,
        WORKSPACE_BUDGET_STATUS_ENUM,
        CLIENT_CARD_RISK_ENUM,
        CLIENT_CARD_PRIORITY_ENUM,
        CLIENT_ACCOUNT_HEALTH_ENUM,
        CLIENT_ACCOUNT_STATUS_ENUM,
        CLIENT_ACCOUNT_TIER_ENUM,
        REVIEW_SUBJECT_TYPE_ENUM,
        AUTO_MATCH_STATUS_ENUM,
        PROJECT_INVITE_STATUS_ENUM,
        PROJECT_BID_STATUS_ENUM,
        GIG_ORDER_MESSAGE_VISIBILITY_ENUM,
        GIG_ACTIVITY_TYPE_ENUM,
        GIG_ESCROW_STATUS_ENUM,
        SUBMISSION_STATUS_ENUM,
        TIMELINE_STATUS_ENUM,
      ];

      if (isPostgres(queryInterface)) {
        for (const enumName of enumsToDrop) {
          await queryInterface.sequelize
            .query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction })
            .catch(() => {});
        }
      }

      await queryInterface.removeColumn('pgm_gig_timeline_events', 'completed_at', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_timeline_events', 'scheduled_at', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_timeline_events', 'status', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_submissions', 'submitted_by_email', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_submissions', 'submitted_by', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_submissions', 'review_notes', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_submissions', 'notes', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_chat_messages', 'pinned', { transaction }).catch(() => {});
      await queryInterface.removeColumn('pgm_gig_chat_messages', 'author_name', { transaction }).catch(() => {});

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
