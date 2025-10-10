'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feed_posts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      content: Sequelize.TEXT,
      visibility: { type: Sequelize.ENUM('public', 'connections'), defaultValue: 'public' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('jobs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: Sequelize.STRING,
      description: Sequelize.TEXT,
      location: Sequelize.STRING,
      employmentType: Sequelize.STRING,
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('gigs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: Sequelize.STRING,
      description: Sequelize.TEXT,
      budget: Sequelize.STRING,
      duration: Sequelize.STRING,
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('projects', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: Sequelize.STRING,
      description: Sequelize.TEXT,
      status: Sequelize.STRING,
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('experience_launchpads', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: Sequelize.STRING,
      description: Sequelize.TEXT,
      track: Sequelize.STRING,
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('volunteering_roles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: Sequelize.STRING,
      organization: Sequelize.STRING,
      description: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('groups', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: Sequelize.STRING,
      description: Sequelize.TEXT,
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('group_memberships', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      groupId: {
        type: Sequelize.INTEGER,
        references: { model: 'groups', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: Sequelize.STRING,
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('connections', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      requesterId: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      addresseeId: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: { type: Sequelize.ENUM('pending', 'accepted', 'rejected'), defaultValue: 'pending' },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('connections');
    await queryInterface.dropTable('group_memberships');
    await queryInterface.dropTable('groups');
    await queryInterface.dropTable('volunteering_roles');
    await queryInterface.dropTable('experience_launchpads');
    await queryInterface.dropTable('projects');
    await queryInterface.dropTable('gigs');
    await queryInterface.dropTable('jobs');
    await queryInterface.dropTable('feed_posts');
  },
};
