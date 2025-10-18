'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.createTable('message_labels', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(80), allowNull: false },
      slug: { type: Sequelize.STRING(120), allowNull: false },
      color: { type: Sequelize.STRING(20), allowNull: false, defaultValue: '#0f172a' },
      description: { type: Sequelize.STRING(255), allowNull: true },
      createdBy: {
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
    });

    await queryInterface.addIndex('message_labels', ['workspaceId']);
    await queryInterface.addIndex('message_labels', ['slug']);
    await queryInterface.addConstraint('message_labels', {
      type: 'unique',
      fields: ['workspaceId', 'slug'],
      name: 'message_labels_workspace_slug_unique',
    });

    await queryInterface.createTable('message_thread_labels', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      threadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'message_threads', key: 'id' },
        onDelete: 'CASCADE',
      },
      labelId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'message_labels', key: 'id' },
        onDelete: 'CASCADE',
      },
      appliedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      appliedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
    });

    await queryInterface.addIndex('message_thread_labels', ['threadId']);
    await queryInterface.addIndex('message_thread_labels', ['labelId']);
    await queryInterface.addConstraint('message_thread_labels', {
      type: 'unique',
      fields: ['threadId', 'labelId'],
      name: 'message_thread_labels_unique_pair',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('message_thread_labels');
    await queryInterface.dropTable('message_labels');
  },
};
