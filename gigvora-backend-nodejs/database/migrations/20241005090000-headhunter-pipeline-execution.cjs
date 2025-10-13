'use strict';

const STAGE_TYPES = ['discovery', 'qualification', 'interview', 'offer', 'placement', 'archive'];
const ITEM_STATUSES = ['active', 'paused', 'won', 'lost', 'pass_on'];
const NOTE_VISIBILITIES = ['internal', 'client_ready', 'shared'];
const INTERVIEW_TYPES = ['intro', 'client_interview', 'prep', 'debrief'];
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled'];
const PASS_ON_TARGET_TYPES = ['agency', 'company', 'workspace', 'search'];
const PASS_ON_STATUSES = ['draft', 'shared', 'accepted', 'declined', 'withdrawn'];
const CONSENT_STATUSES = ['pending', 'granted', 'revoked'];

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;

      await queryInterface.createTable(
        'headhunter_pipeline_stages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          stageType: {
            type: Sequelize.ENUM(...STAGE_TYPES),
            allowNull: false,
            defaultValue: 'discovery',
          },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          winProbability: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          isDefault: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'headhunter_pipeline_stages',
        ['workspaceId', 'position'],
        { transaction, name: 'headhunter_pipeline_stages_workspace_position_idx' },
      );

      await queryInterface.createTable(
        'headhunter_pipeline_items',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          stageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'headhunter_pipeline_stages', key: 'id' },
            onDelete: 'CASCADE',
          },
          candidateId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'applications', key: 'id' },
            onDelete: 'SET NULL',
          },
          targetRole: { type: Sequelize.STRING(180), allowNull: true },
          targetCompany: { type: Sequelize.STRING(180), allowNull: true },
          estimatedValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          expectedCloseDate: { type: Sequelize.DATE, allowNull: true },
          score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          status: {
            type: Sequelize.ENUM(...ITEM_STATUSES),
            allowNull: false,
            defaultValue: 'active',
          },
          statusReason: { type: Sequelize.STRING(240), allowNull: true },
          nextStep: { type: Sequelize.STRING(240), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          lastTouchedAt: { type: Sequelize.DATE, allowNull: true },
          stageEnteredAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'headhunter_pipeline_items',
        ['workspaceId', 'stageId'],
        { transaction, name: 'headhunter_pipeline_items_workspace_stage_idx' },
      );
      await queryInterface.addIndex(
        'headhunter_pipeline_items',
        ['candidateId'],
        { transaction, name: 'headhunter_pipeline_items_candidate_idx' },
      );
      await queryInterface.addIndex(
        'headhunter_pipeline_items',
        ['status'],
        { transaction, name: 'headhunter_pipeline_items_status_idx' },
      );

      await queryInterface.createTable(
        'headhunter_pipeline_notes',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          pipelineItemId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'headhunter_pipeline_items', key: 'id' },
            onDelete: 'CASCADE',
          },
          authorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          note: { type: Sequelize.TEXT, allowNull: false },
          visibility: {
            type: Sequelize.ENUM(...NOTE_VISIBILITIES),
            allowNull: false,
            defaultValue: 'internal',
          },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'headhunter_pipeline_notes',
        ['pipelineItemId'],
        { transaction, name: 'headhunter_pipeline_notes_item_idx' },
      );
      await queryInterface.addIndex(
        'headhunter_pipeline_notes',
        ['authorId'],
        { transaction, name: 'headhunter_pipeline_notes_author_idx' },
      );

      await queryInterface.createTable(
        'headhunter_pipeline_attachments',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          pipelineItemId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'headhunter_pipeline_items', key: 'id' },
            onDelete: 'CASCADE',
          },
          uploadedById: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          fileName: { type: Sequelize.STRING(255), allowNull: false },
          fileUrl: { type: Sequelize.STRING(500), allowNull: false },
          fileType: { type: Sequelize.STRING(120), allowNull: true },
          fileSize: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'headhunter_pipeline_attachments',
        ['pipelineItemId'],
        { transaction, name: 'headhunter_pipeline_attachments_item_idx' },
      );

      await queryInterface.createTable(
        'headhunter_pipeline_interviews',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          pipelineItemId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'headhunter_pipeline_items', key: 'id' },
            onDelete: 'CASCADE',
          },
          interviewType: {
            type: Sequelize.ENUM(...INTERVIEW_TYPES),
            allowNull: false,
            defaultValue: 'intro',
          },
          status: {
            type: Sequelize.ENUM(...INTERVIEW_STATUSES),
            allowNull: false,
            defaultValue: 'scheduled',
          },
          scheduledAt: { type: Sequelize.DATE, allowNull: false },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          timezone: { type: Sequelize.STRING(80), allowNull: true },
          host: { type: Sequelize.STRING(160), allowNull: true },
          location: { type: Sequelize.STRING(160), allowNull: true },
          dialIn: { type: Sequelize.STRING(200), allowNull: true },
          prepMaterials: { type: jsonType, allowNull: true },
          scorecard: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'headhunter_pipeline_interviews',
        ['pipelineItemId', 'scheduledAt'],
        { transaction, name: 'headhunter_pipeline_interviews_item_schedule_idx' },
      );
      await queryInterface.addIndex(
        'headhunter_pipeline_interviews',
        ['status'],
        { transaction, name: 'headhunter_pipeline_interviews_status_idx' },
      );

      await queryInterface.createTable(
        'headhunter_pass_on_shares',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          pipelineItemId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'headhunter_pipeline_items', key: 'id' },
            onDelete: 'CASCADE',
          },
          targetWorkspaceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'SET NULL',
          },
          targetName: { type: Sequelize.STRING(180), allowNull: false },
          targetType: {
            type: Sequelize.ENUM(...PASS_ON_TARGET_TYPES),
            allowNull: false,
            defaultValue: 'agency',
          },
          shareStatus: {
            type: Sequelize.ENUM(...PASS_ON_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          consentStatus: {
            type: Sequelize.ENUM(...CONSENT_STATUSES),
            allowNull: false,
            defaultValue: 'pending',
          },
          revenueShareRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          revenueShareFlat: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          sharedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'headhunter_pass_on_shares',
        ['pipelineItemId'],
        { transaction, name: 'headhunter_pass_on_shares_item_idx' },
      );
      await queryInterface.addIndex(
        'headhunter_pass_on_shares',
        ['shareStatus'],
        { transaction, name: 'headhunter_pass_on_shares_status_idx' },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('headhunter_pass_on_shares', { transaction });
      await queryInterface.dropTable('headhunter_pipeline_interviews', { transaction });
      await queryInterface.dropTable('headhunter_pipeline_attachments', { transaction });
      await queryInterface.dropTable('headhunter_pipeline_notes', { transaction });
      await queryInterface.dropTable('headhunter_pipeline_items', { transaction });
      await queryInterface.dropTable('headhunter_pipeline_stages', { transaction });
    });

    await dropEnum(queryInterface, 'enum_headhunter_pass_on_shares_consentStatus');
    await dropEnum(queryInterface, 'enum_headhunter_pass_on_shares_shareStatus');
    await dropEnum(queryInterface, 'enum_headhunter_pass_on_shares_targetType');
    await dropEnum(queryInterface, 'enum_headhunter_pipeline_interviews_status');
    await dropEnum(queryInterface, 'enum_headhunter_pipeline_interviews_interviewType');
    await dropEnum(queryInterface, 'enum_headhunter_pipeline_notes_visibility');
    await dropEnum(queryInterface, 'enum_headhunter_pipeline_items_status');
    await dropEnum(queryInterface, 'enum_headhunter_pipeline_stages_stageType');
  },
};
