'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('email_smtp_configs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      label: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'Primary SMTP' },
      host: { type: Sequelize.STRING(255), allowNull: false },
      port: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 587 },
      secure: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      username: { type: Sequelize.STRING(255), allowNull: true },
      password: { type: Sequelize.STRING(255), allowNull: true },
      fromName: { type: Sequelize.STRING(120), allowNull: true },
      fromAddress: { type: Sequelize.STRING(255), allowNull: false },
      replyToAddress: { type: Sequelize.STRING(255), allowNull: true },
      bccAuditRecipients: { type: Sequelize.STRING(500), allowNull: true },
      rateLimitPerMinute: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 120 },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      lastVerifiedAt: { type: Sequelize.DATE, allowNull: true },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
    });

    await queryInterface.addIndex('email_smtp_configs', ['active'], {
      name: 'email_smtp_configs_active_idx',
    });

    await queryInterface.createTable('email_templates', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(80), allowNull: true },
      subject: { type: Sequelize.STRING(255), allowNull: false },
      preheader: { type: Sequelize.STRING(255), allowNull: true },
      fromName: { type: Sequelize.STRING(120), allowNull: true },
      fromAddress: { type: Sequelize.STRING(255), allowNull: true },
      replyToAddress: { type: Sequelize.STRING(255), allowNull: true },
      heroImageUrl: { type: Sequelize.STRING(500), allowNull: true },
      htmlBody: { type: Sequelize.TEXT('long'), allowNull: false },
      textBody: { type: Sequelize.TEXT('long'), allowNull: true },
      layout: { type: Sequelize.STRING(120), allowNull: true },
      tags: { type: jsonType, allowNull: false, defaultValue: [] },
      variables: { type: jsonType, allowNull: false, defaultValue: [] },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      createdBy: { type: Sequelize.STRING(120), allowNull: true },
      updatedBy: { type: Sequelize.STRING(120), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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
    });

    await queryInterface.addIndex('email_templates', ['slug'], {
      unique: true,
      name: 'email_templates_slug_unique',
    });
    await queryInterface.addIndex('email_templates', ['category'], {
      name: 'email_templates_category_idx',
    });
    await queryInterface.addIndex('email_templates', ['enabled'], {
      name: 'email_templates_enabled_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('email_templates');
    await queryInterface.dropTable('email_smtp_configs');
  },
};
