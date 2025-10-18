'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'memberships', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('users', 'primaryDashboard', {
      type: Sequelize.STRING(60),
      allowNull: true,
    });

    await queryInterface.createTable('profile_admin_notes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      profileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'profiles', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      visibility: {
        type: Sequelize.ENUM('internal', 'shared'),
        allowNull: false,
        defaultValue: 'internal',
      },
      pinned: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      metadata: { type: Sequelize.JSON, allowNull: true },
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

    await queryInterface.addIndex('profile_admin_notes', ['profileId']);
    await queryInterface.addIndex('profile_admin_notes', ['authorId']);
    await queryInterface.addIndex('profile_admin_notes', ['profileId', 'pinned']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('profile_admin_notes', ['profileId', 'pinned']);
    await queryInterface.removeIndex('profile_admin_notes', ['authorId']);
    await queryInterface.removeIndex('profile_admin_notes', ['profileId']);
    await queryInterface.dropTable('profile_admin_notes');
    await queryInterface.removeColumn('users', 'primaryDashboard');
    await queryInterface.removeColumn('users', 'memberships');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_profile_admin_notes_visibility";');
  },
};
