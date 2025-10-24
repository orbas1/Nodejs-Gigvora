'use strict';

const OWNER_TYPES = ['freelancer', 'agency', 'company'];
const BOARD_GROUPINGS = ['industry', 'retainer_size', 'probability'];
const STAGE_CATEGORIES = ['open', 'won', 'lost'];
const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'];
const DEAL_STATUSES = ['open', 'won', 'lost', 'on_hold'];
const FOLLOW_UP_STATUSES = ['scheduled', 'completed', 'cancelled'];
const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'declined'];

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
        'pipeline_boards',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          ownerId: { type: Sequelize.INTEGER, allowNull: false },
          ownerType: {
            type: Sequelize.ENUM(...OWNER_TYPES),
            allowNull: false,
            defaultValue: 'freelancer',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          grouping: {
            type: Sequelize.ENUM(...BOARD_GROUPINGS),
            allowNull: false,
            defaultValue: 'industry',
          },
          filters: { type: jsonType, allowNull: true },
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
        'pipeline_boards',
        ['ownerId', 'ownerType'],
        { transaction, name: 'pipeline_boards_owner_idx' },
      );

      await queryInterface.createTable(
        'pipeline_stages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          boardId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pipeline_boards', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          winProbability: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          statusCategory: {
            type: Sequelize.ENUM(...STAGE_CATEGORIES),
            allowNull: false,
            defaultValue: 'open',
          },
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
        'pipeline_stages',
        ['boardId', 'position'],
        { transaction, name: 'pipeline_stages_board_position_idx' },
      );

      await queryInterface.createTable(
        'pipeline_campaigns',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          ownerId: { type: Sequelize.INTEGER, allowNull: false },
          ownerType: {
            type: Sequelize.ENUM(...OWNER_TYPES),
            allowNull: false,
            defaultValue: 'freelancer',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          targetService: { type: Sequelize.STRING(160), allowNull: true },
          status: {
            type: Sequelize.ENUM(...CAMPAIGN_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          playbook: { type: jsonType, allowNull: true },
          metrics: { type: jsonType, allowNull: true },
          launchDate: { type: Sequelize.DATE, allowNull: true },
          endDate: { type: Sequelize.DATE, allowNull: true },
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
        'pipeline_campaigns',
        ['ownerId', 'ownerType'],
        { transaction, name: 'pipeline_campaigns_owner_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_campaigns',
        ['status'],
        { transaction, name: 'pipeline_campaigns_status_idx' },
      );

      await queryInterface.createTable(
        'pipeline_deals',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          boardId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pipeline_boards', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          stageId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pipeline_stages', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          campaignId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'pipeline_campaigns', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          ownerId: { type: Sequelize.INTEGER, allowNull: false },
          ownerType: {
            type: Sequelize.ENUM(...OWNER_TYPES),
            allowNull: false,
            defaultValue: 'freelancer',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          clientName: { type: Sequelize.STRING(180), allowNull: false },
          industry: { type: Sequelize.STRING(160), allowNull: true },
          retainerSize: { type: Sequelize.STRING(80), allowNull: true },
          pipelineValue: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          winProbability: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          status: {
            type: Sequelize.ENUM(...DEAL_STATUSES),
            allowNull: false,
            defaultValue: 'open',
          },
          source: { type: Sequelize.STRING(160), allowNull: true },
          lastContactAt: { type: Sequelize.DATE, allowNull: true },
          nextFollowUpAt: { type: Sequelize.DATE, allowNull: true },
          expectedCloseDate: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          tags: { type: jsonType, allowNull: true },
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
        'pipeline_deals',
        ['boardId', 'stageId'],
        { transaction, name: 'pipeline_deals_board_stage_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_deals',
        ['ownerId', 'ownerType'],
        { transaction, name: 'pipeline_deals_owner_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_deals',
        ['status'],
        { transaction, name: 'pipeline_deals_status_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_deals',
        ['industry'],
        { transaction, name: 'pipeline_deals_industry_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_deals',
        ['retainerSize'],
        { transaction, name: 'pipeline_deals_retainer_idx' },
      );

      await queryInterface.createTable(
        'pipeline_proposal_templates',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          ownerId: { type: Sequelize.INTEGER, allowNull: false },
          ownerType: {
            type: Sequelize.ENUM(...OWNER_TYPES),
            allowNull: false,
            defaultValue: 'freelancer',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          caseStudies: { type: jsonType, allowNull: true },
          roiCalculator: { type: jsonType, allowNull: true },
          pricingModel: { type: jsonType, allowNull: true },
          isArchived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          lastUsedAt: { type: Sequelize.DATE, allowNull: true },
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
        'pipeline_proposal_templates',
        ['ownerId', 'ownerType'],
        { transaction, name: 'pipeline_proposal_templates_owner_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_proposal_templates',
        ['isArchived'],
        { transaction, name: 'pipeline_proposal_templates_archived_idx' },
      );

      await queryInterface.createTable(
        'pipeline_proposals',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          dealId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pipeline_deals', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          templateId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'pipeline_proposal_templates', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM(...PROPOSAL_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          version: { type: Sequelize.STRING(30), allowNull: true },
          pricing: { type: jsonType, allowNull: true },
          roiModel: { type: jsonType, allowNull: true },
          caseStudies: { type: jsonType, allowNull: true },
          sentAt: { type: Sequelize.DATE, allowNull: true },
          acceptedAt: { type: Sequelize.DATE, allowNull: true },
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
        'pipeline_proposals',
        ['dealId'],
        { transaction, name: 'pipeline_proposals_deal_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_proposals',
        ['status'],
        { transaction, name: 'pipeline_proposals_status_idx' },
      );

      await queryInterface.createTable(
        'pipeline_follow_ups',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          dealId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'pipeline_deals', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          ownerId: { type: Sequelize.INTEGER, allowNull: false },
          ownerType: {
            type: Sequelize.ENUM(...OWNER_TYPES),
            allowNull: false,
            defaultValue: 'freelancer',
          },
          dueAt: { type: Sequelize.DATE, allowNull: false },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          channel: { type: Sequelize.STRING(80), allowNull: true },
          note: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM(...FOLLOW_UP_STATUSES),
            allowNull: false,
            defaultValue: 'scheduled',
          },
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
        'pipeline_follow_ups',
        ['ownerId', 'ownerType'],
        { transaction, name: 'pipeline_follow_ups_owner_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_follow_ups',
        ['dealId', 'status'],
        { transaction, name: 'pipeline_follow_ups_deal_status_idx' },
      );
      await queryInterface.addIndex(
        'pipeline_follow_ups',
        ['dueAt'],
        { transaction, name: 'pipeline_follow_ups_due_idx' },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('pipeline_follow_ups', { transaction });
      await queryInterface.dropTable('pipeline_proposals', { transaction });
      await queryInterface.dropTable('pipeline_proposal_templates', { transaction });
      await queryInterface.dropTable('pipeline_deals', { transaction });
      await queryInterface.dropTable('pipeline_campaigns', { transaction });
      await queryInterface.dropTable('pipeline_stages', { transaction });
      await queryInterface.dropTable('pipeline_boards', { transaction });
    });

    await dropEnum(queryInterface, 'enum_pipeline_follow_ups_ownerType');
    await dropEnum(queryInterface, 'enum_pipeline_follow_ups_status');
    await dropEnum(queryInterface, 'enum_pipeline_proposals_status');
    await dropEnum(queryInterface, 'enum_pipeline_proposal_templates_ownerType');
    await dropEnum(queryInterface, 'enum_pipeline_deals_ownerType');
    await dropEnum(queryInterface, 'enum_pipeline_deals_status');
    await dropEnum(queryInterface, 'enum_pipeline_campaigns_ownerType');
    await dropEnum(queryInterface, 'enum_pipeline_campaigns_status');
    await dropEnum(queryInterface, 'enum_pipeline_stages_statusCategory');
    await dropEnum(queryInterface, 'enum_pipeline_boards_ownerType');
    await dropEnum(queryInterface, 'enum_pipeline_boards_grouping');
  },
};
