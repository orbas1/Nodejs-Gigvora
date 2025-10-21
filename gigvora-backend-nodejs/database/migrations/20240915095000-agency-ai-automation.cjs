'use strict';

const { resolveJsonType, safeRemoveIndex } = require('../utils/migrationHelpers.cjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable('agency_ai_configurations', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        workspaceId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'provider_workspaces', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        provider: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'openai' },
        defaultModel: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'gpt-4o-mini' },
        autoReplyEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        autoReplyInstructions: { type: Sequelize.TEXT, allowNull: true },
        autoReplyChannels: { type: jsonType, allowNull: true },
        autoReplyTemperature: { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 0.35 },
        autoReplyResponseTimeGoal: { type: Sequelize.INTEGER, allowNull: true },
        autoBidEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        autoBidStrategy: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'balanced' },
        autoBidMinBudget: { type: Sequelize.INTEGER, allowNull: true },
        autoBidMaxBudget: { type: Sequelize.INTEGER, allowNull: true },
        autoBidMarkup: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        autoBidAutoSubmit: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        autoBidGuardrails: { type: jsonType, allowNull: true },
        apiKeyCiphertext: { type: Sequelize.TEXT, allowNull: true },
        apiKeyDigest: { type: Sequelize.STRING(128), allowNull: true },
        apiKeyFingerprint: { type: Sequelize.STRING(120), allowNull: true },
        apiKeyUpdatedAt: { type: Sequelize.DATE, allowNull: true },
        analyticsSnapshot: { type: jsonType, allowNull: true },
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
      }, { transaction });

      await queryInterface.addIndex('agency_ai_configurations', ['workspaceId'], {
        unique: true,
        transaction,
        name: 'agency_ai_configurations_workspace_unique',
      });

      await queryInterface.createTable('agency_auto_bid_templates', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        workspaceId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'provider_workspaces', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        name: { type: Sequelize.STRING(160), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
        responseSlaHours: { type: Sequelize.INTEGER, allowNull: true },
        deliveryWindowDays: { type: Sequelize.INTEGER, allowNull: true },
        bidCeiling: { type: Sequelize.INTEGER, allowNull: true },
        markupPercent: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        targetRoles: { type: jsonType, allowNull: true },
        scopeKeywords: { type: jsonType, allowNull: true },
        guardrails: { type: jsonType, allowNull: true },
        attachments: { type: jsonType, allowNull: true },
        createdBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'SET NULL',
          onDelete: 'SET NULL',
        },
        updatedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'SET NULL',
          onDelete: 'SET NULL',
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
      }, { transaction });

      await queryInterface.addIndex('agency_auto_bid_templates', ['workspaceId'], {
        transaction,
        name: 'agency_auto_bid_templates_workspace_idx',
      });
      await queryInterface.addIndex('agency_auto_bid_templates', ['workspaceId', 'status'], {
        transaction,
        name: 'agency_auto_bid_templates_workspace_status_idx',
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await safeRemoveIndex(
        queryInterface,
        'agency_auto_bid_templates',
        'agency_auto_bid_templates_workspace_status_idx',
        { transaction },
      );
      await safeRemoveIndex(
        queryInterface,
        'agency_auto_bid_templates',
        'agency_auto_bid_templates_workspace_idx',
        { transaction },
      );
      await queryInterface.dropTable('agency_auto_bid_templates', { transaction });

      await safeRemoveIndex(
        queryInterface,
        'agency_ai_configurations',
        'agency_ai_configurations_workspace_unique',
        { transaction },
      );
      await queryInterface.dropTable('agency_ai_configurations', { transaction });
    });
  },
};
