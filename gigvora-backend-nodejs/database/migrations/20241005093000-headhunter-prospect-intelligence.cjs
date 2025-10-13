'use strict';

const PROFILES_TABLE = 'prospect_intelligence_profiles';
const SIGNALS_TABLE = 'prospect_intelligence_signals';
const SEARCHES_TABLE = 'prospect_search_definitions';
const ALERTS_TABLE = 'prospect_search_alerts';
const CAMPAIGNS_TABLE = 'prospect_campaigns';
const CAMPAIGN_STEPS_TABLE = 'prospect_campaign_steps';
const NOTES_TABLE = 'prospect_research_notes';
const TASKS_TABLE = 'prospect_research_tasks';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        PROFILES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          candidateId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          aggregatedAt: { type: Sequelize.DATE, allowNull: true },
          primaryDiscipline: { type: Sequelize.STRING(255), allowNull: true },
          seniorityLevel: { type: Sequelize.STRING(120), allowNull: true },
          headline: { type: Sequelize.STRING(255), allowNull: true },
          motivators: { type: jsonType, allowNull: true },
          inflectionPoints: { type: jsonType, allowNull: true },
          aiHighlights: { type: jsonType, allowNull: true },
          socialGraph: { type: jsonType, allowNull: true },
          patents: { type: jsonType, allowNull: true },
          publications: { type: jsonType, allowNull: true },
          compensationTargetMin: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          compensationTargetMax: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          compensationCurrency: { type: Sequelize.STRING(3), allowNull: true, defaultValue: 'USD' },
          relocationReadiness: {
            type: Sequelize.ENUM('remote', 'open_to_relocate', 'hybrid', 'not_open'),
            allowNull: true,
          },
          exclusivityConflict: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          exclusivityNotes: { type: Sequelize.TEXT, allowNull: true },
          availabilityStatus: { type: Sequelize.STRING(120), allowNull: true },
          signalsSummary: { type: jsonType, allowNull: true },
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

      await queryInterface.addIndex(PROFILES_TABLE, ['workspaceId'], { transaction });
      await queryInterface.addIndex(PROFILES_TABLE, ['candidateId'], { transaction });
      await queryInterface.addIndex(PROFILES_TABLE, ['seniorityLevel'], { transaction });
      await queryInterface.addIndex(PROFILES_TABLE, ['relocationReadiness'], { transaction });

      await queryInterface.createTable(
        SIGNALS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: PROFILES_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          signalType: { type: Sequelize.STRING(255), allowNull: false },
          intentLevel: {
            type: Sequelize.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium',
          },
          summary: { type: Sequelize.STRING(500), allowNull: false },
          source: { type: Sequelize.STRING(255), allowNull: true },
          occurredAt: { type: Sequelize.DATE, allowNull: false },
          payload: { type: jsonType, allowNull: true },
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

      await queryInterface.addIndex(SIGNALS_TABLE, ['workspaceId', 'occurredAt'], { transaction });
      await queryInterface.addIndex(SIGNALS_TABLE, ['profileId'], { transaction });
      await queryInterface.addIndex(SIGNALS_TABLE, ['intentLevel'], { transaction });

      await queryInterface.createTable(
        SEARCHES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          filters: { type: jsonType, allowNull: true },
          skills: { type: jsonType, allowNull: true },
          seniorityRange: { type: Sequelize.STRING(120), allowNull: true },
          diversityFocus: { type: jsonType, allowNull: true },
          cultureDrivers: { type: jsonType, allowNull: true },
          industryTargets: { type: jsonType, allowNull: true },
          isAlertEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          alertCadence: {
            type: Sequelize.ENUM('real_time', 'daily', 'weekly'),
            allowNull: true,
          },
          lastRunAt: { type: Sequelize.DATE, allowNull: true },
          resultsCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
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

      await queryInterface.addIndex(SEARCHES_TABLE, ['workspaceId'], { transaction });
      await queryInterface.addIndex(SEARCHES_TABLE, ['workspaceId', 'isAlertEnabled'], { transaction });
      await queryInterface.addIndex(SEARCHES_TABLE, ['createdById'], { transaction });

      await queryInterface.createTable(
        ALERTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          searchId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: SEARCHES_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          channel: {
            type: Sequelize.ENUM('email', 'slack', 'sms', 'webhook'),
            allowNull: false,
            defaultValue: 'email',
          },
          status: {
            type: Sequelize.ENUM('active', 'paused', 'snoozed'),
            allowNull: false,
            defaultValue: 'active',
          },
          target: { type: Sequelize.STRING(255), allowNull: true },
          lastTriggeredAt: { type: Sequelize.DATE, allowNull: true },
          nextRunAt: { type: Sequelize.DATE, allowNull: true },
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

      await queryInterface.addIndex(ALERTS_TABLE, ['searchId'], { transaction });
      await queryInterface.addIndex(ALERTS_TABLE, ['status'], { transaction });

      await queryInterface.createTable(
        CAMPAIGNS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(255), allowNull: false },
          persona: { type: Sequelize.STRING(255), allowNull: true },
          goal: { type: Sequelize.STRING(255), allowNull: true },
          aiBrief: { type: Sequelize.TEXT, allowNull: true },
          channelMix: { type: jsonType, allowNull: true },
          launchDate: { type: Sequelize.DATE, allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'active', 'paused', 'completed'),
            allowNull: false,
            defaultValue: 'draft',
          },
          responseRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          meetingsBooked: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          conversionRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
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

      await queryInterface.addIndex(CAMPAIGNS_TABLE, ['workspaceId'], { transaction });
      await queryInterface.addIndex(CAMPAIGNS_TABLE, ['workspaceId', 'status'], { transaction });
      await queryInterface.addIndex(CAMPAIGNS_TABLE, ['launchDate'], { transaction });

      await queryInterface.createTable(
        CAMPAIGN_STEPS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          campaignId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: CAMPAIGNS_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          stepOrder: { type: Sequelize.INTEGER, allowNull: false },
          channel: { type: Sequelize.STRING(120), allowNull: false },
          templateSubject: { type: Sequelize.STRING(255), allowNull: true },
          templateBody: { type: Sequelize.TEXT, allowNull: true },
          sendOffsetHours: { type: Sequelize.INTEGER, allowNull: true },
          waitForReplyHours: { type: Sequelize.INTEGER, allowNull: true },
          aiVariant: { type: Sequelize.STRING(120), allowNull: true },
          abTestGroup: {
            type: Sequelize.ENUM('control', 'variant_a', 'variant_b'),
            allowNull: true,
          },
          performance: { type: jsonType, allowNull: true },
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

      await queryInterface.addIndex(CAMPAIGN_STEPS_TABLE, ['campaignId'], { transaction });
      await queryInterface.addIndex(CAMPAIGN_STEPS_TABLE, ['campaignId', 'abTestGroup'], { transaction });

      await queryInterface.createTable(
        NOTES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: PROFILES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
          },
          authorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          body: { type: Sequelize.TEXT, allowNull: false },
          visibility: {
            type: Sequelize.ENUM('workspace', 'client_shared', 'restricted'),
            allowNull: false,
            defaultValue: 'workspace',
          },
          isComplianceEvent: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
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

      await queryInterface.addIndex(NOTES_TABLE, ['workspaceId'], { transaction });
      await queryInterface.addIndex(NOTES_TABLE, ['profileId'], { transaction });
      await queryInterface.addIndex(NOTES_TABLE, ['authorId'], { transaction });
      await queryInterface.addIndex(NOTES_TABLE, ['visibility'], { transaction });

      await queryInterface.createTable(
        TASKS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: PROFILES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(255), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          status: {
            type: Sequelize.ENUM('open', 'in_progress', 'blocked', 'completed'),
            allowNull: false,
            defaultValue: 'open',
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
            allowNull: false,
            defaultValue: 'medium',
          },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          assigneeId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
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

      await queryInterface.addIndex(TASKS_TABLE, ['workspaceId'], { transaction });
      await queryInterface.addIndex(TASKS_TABLE, ['workspaceId', 'status'], { transaction });
      await queryInterface.addIndex(TASKS_TABLE, ['assigneeId'], { transaction });
      await queryInterface.addIndex(TASKS_TABLE, ['priority'], { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TASKS_TABLE, { transaction });
      await queryInterface.dropTable(NOTES_TABLE, { transaction });
      await queryInterface.dropTable(CAMPAIGN_STEPS_TABLE, { transaction });
      await queryInterface.dropTable(CAMPAIGNS_TABLE, { transaction });
      await queryInterface.dropTable(ALERTS_TABLE, { transaction });
      await queryInterface.dropTable(SEARCHES_TABLE, { transaction });
      await queryInterface.dropTable(SIGNALS_TABLE, { transaction });
      await queryInterface.dropTable(PROFILES_TABLE, { transaction });

      if (['postgres', 'postgresql'].includes(dialect)) {
        const enumNames = [
          'enum_prospect_intelligence_profiles_relocationReadiness',
          'enum_prospect_intelligence_signals_intentLevel',
          'enum_prospect_search_definitions_alertCadence',
          'enum_prospect_search_alerts_channel',
          'enum_prospect_search_alerts_status',
          'enum_prospect_campaigns_status',
          'enum_prospect_campaign_steps_abTestGroup',
          'enum_prospect_research_notes_visibility',
          'enum_prospect_research_tasks_status',
          'enum_prospect_research_tasks_priority',
        ];

        for (const enumName of enumNames) {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}"`, { transaction });
        }
      }
    });
  },
};
