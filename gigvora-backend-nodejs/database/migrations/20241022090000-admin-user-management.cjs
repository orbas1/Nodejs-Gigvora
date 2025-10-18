'use strict';

const STATUS_VALUES = ['invited', 'active', 'suspended', 'archived'];

async function dropEnumIfNeeded(queryInterface, column, table) {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect !== 'postgres' && dialect !== 'postgresql') {
    return;
  }
  const typeName = `enum_${table}_${column}`;
  await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${typeName}";`);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phoneNumber', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'jobTitle', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'avatarUrl', {
      type: Sequelize.STRING(2048),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM(...STATUS_VALUES),
      allowNull: false,
      defaultValue: 'active',
    });
    await queryInterface.addColumn('users', 'lastSeenAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['userType']);

    await queryInterface.createTable('user_roles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: { type: Sequelize.STRING(80), allowNull: false },
      assignedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      assignedAt: {
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
    await queryInterface.addIndex('user_roles', ['role']);
    await queryInterface.addConstraint('user_roles', {
      type: 'unique',
      fields: ['userId', 'role'],
      name: 'user_roles_user_role_unique',
    });

    await queryInterface.createTable('user_notes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      visibility: {
        type: Sequelize.ENUM('internal', 'restricted'),
        allowNull: false,
        defaultValue: 'internal',
      },
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
    await queryInterface.addIndex('user_notes', ['userId']);
    await queryInterface.addIndex('user_notes', ['authorId']);
    await queryInterface.addIndex('user_notes', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_notes');
    await dropEnumIfNeeded(queryInterface, 'visibility', 'user_notes');
    await queryInterface.dropTable('user_roles');

    await queryInterface.removeIndex('users', ['userType']);
    await queryInterface.removeIndex('users', ['status']);

    await queryInterface.removeColumn('users', 'lastSeenAt');
    await queryInterface.removeColumn('users', 'status');
    await dropEnumIfNeeded(queryInterface, 'status', 'users');
    await queryInterface.removeColumn('users', 'avatarUrl');
    await queryInterface.removeColumn('users', 'jobTitle');
    await queryInterface.removeColumn('users', 'phoneNumber');
  },
};

