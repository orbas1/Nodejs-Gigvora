'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agency_ai_configurations', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      workspaceId: { type: Sequelize.INTEGER, allowNull: false },
      provider: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'openai' },
      defaultModel: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'gpt-4o-mini' },
      autoReplyEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      autoReplyInstructions: { type: Sequelize.TEXT, allowNull: true },
      autoReplyChannels: { type: Sequelize.JSONB, allowNull: true },
      autoReplyTemperature: { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 0.35 },
      autoReplyResponseTimeGoal: { type: Sequelize.INTEGER, allowNull: true },
      autoBidEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      autoBidStrategy: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'balanced' },
      autoBidMinBudget: { type: Sequelize.INTEGER, allowNull: true },
      autoBidMaxBudget: { type: Sequelize.INTEGER, allowNull: true },
      autoBidMarkup: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      autoBidAutoSubmit: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      autoBidGuardrails: { type: Sequelize.JSONB, allowNull: true },
      apiKeyCiphertext: { type: Sequelize.TEXT, allowNull: true },
      apiKeyDigest: { type: Sequelize.STRING(128), allowNull: true },
      apiKeyFingerprint: { type: Sequelize.STRING(120), allowNull: true },
      apiKeyUpdatedAt: { type: Sequelize.DATE, allowNull: true },
      analyticsSnapshot: { type: Sequelize.JSONB, allowNull: true },
      metadata: { type: Sequelize.JSONB, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('agency_ai_configurations', ['workspaceId'], { unique: true });

    await queryInterface.createTable('agency_auto_bid_templates', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      workspaceId: { type: Sequelize.INTEGER, allowNull: false },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'active' },
      responseSlaHours: { type: Sequelize.INTEGER, allowNull: true },
      deliveryWindowDays: { type: Sequelize.INTEGER, allowNull: true },
      bidCeiling: { type: Sequelize.INTEGER, allowNull: true },
      markupPercent: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      targetRoles: { type: Sequelize.JSONB, allowNull: true },
      scopeKeywords: { type: Sequelize.JSONB, allowNull: true },
      guardrails: { type: Sequelize.JSONB, allowNull: true },
      attachments: { type: Sequelize.JSONB, allowNull: true },
      createdBy: { type: Sequelize.INTEGER, allowNull: true },
      updatedBy: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('agency_auto_bid_templates', ['workspaceId']);
    await queryInterface.addIndex('agency_auto_bid_templates', ['workspaceId', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('agency_auto_bid_templates', ['workspaceId', 'status']);
    await queryInterface.removeIndex('agency_auto_bid_templates', ['workspaceId']);
    await queryInterface.dropTable('agency_auto_bid_templates');
    await queryInterface.removeIndex('agency_ai_configurations', ['workspaceId']);
    await queryInterface.dropTable('agency_ai_configurations');
  },
};
