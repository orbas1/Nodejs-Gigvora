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

    await queryInterface.createTable('creation_studio_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM(
          'project',
          'gig',
          'job',
          'launchpad_job',
          'launchpad_project',
          'volunteer_opportunity',
          'networking_session',
          'blog_post',
          'group',
          'page',
          'ad',
        ),
        allowNull: false,
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      headline: { type: Sequelize.STRING(255), allowNull: true },
      summary: { type: Sequelize.TEXT, allowNull: true },
      content: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      visibility: {
        type: Sequelize.ENUM('private', 'workspace', 'public'),
        allowNull: false,
        defaultValue: 'workspace',
      },
      category: { type: Sequelize.STRING(120), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      targetAudience: { type: Sequelize.STRING(255), allowNull: true },
      launchDate: { type: Sequelize.DATE, allowNull: true },
      publishAt: { type: Sequelize.DATE, allowNull: true },
      publishedAt: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      imageUrl: { type: Sequelize.STRING(500), allowNull: true },
      tags: { type: jsonType, allowNull: true },
      settings: { type: jsonType, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      budgetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      budgetCurrency: { type: Sequelize.STRING(6), allowNull: true },
      compensationMin: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      compensationMax: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      compensationCurrency: { type: Sequelize.STRING(6), allowNull: true },
      durationWeeks: { type: Sequelize.INTEGER, allowNull: true },
      commitmentHours: { type: Sequelize.INTEGER, allowNull: true },
      remoteEligible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
      deletedAt: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.addIndex('creation_studio_items', ['workspaceId', 'type']);
    await queryInterface.addIndex('creation_studio_items', ['type', 'status']);
    await queryInterface.addIndex('creation_studio_items', ['status']);
    await queryInterface.addIndex('creation_studio_items', ['launchDate']);
    await queryInterface.addIndex('creation_studio_items', ['publishAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('creation_studio_items');
    await dropEnum(queryInterface, 'enum_creation_studio_items_type');
    await dropEnum(queryInterface, 'enum_creation_studio_items_status');
    await dropEnum(queryInterface, 'enum_creation_studio_items_visibility');
  },
};
