'use strict';

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
      ? Sequelize.JSONB
      : Sequelize.JSON;

    await queryInterface.createTable('speed_networking_sessions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(180), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'in_progress', 'completed', 'cancelled', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      accessLevel: {
        type: Sequelize.ENUM('public', 'invite_only', 'restricted'),
        allowNull: false,
        defaultValue: 'invite_only',
      },
      visibility: {
        type: Sequelize.ENUM('internal', 'network', 'external'),
        allowNull: false,
        defaultValue: 'internal',
      },
      hostId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      adminOwnerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'SET NULL',
      },
      capacity: { type: Sequelize.INTEGER, allowNull: true },
      roundDurationSeconds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 300 },
      totalRounds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 4 },
      bufferSeconds: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
      scheduledStart: { type: Sequelize.DATE, allowNull: true },
      scheduledEnd: { type: Sequelize.DATE, allowNull: true },
      timezone: { type: Sequelize.STRING(80), allowNull: true },
      registrationCloseAt: { type: Sequelize.DATE, allowNull: true },
      meetingProvider: { type: Sequelize.STRING(120), allowNull: true },
      meetingUrl: { type: Sequelize.STRING(255), allowNull: true },
      lobbyUrl: { type: Sequelize.STRING(255), allowNull: true },
      instructions: { type: Sequelize.TEXT, allowNull: true },
      matchingStrategy: {
        type: Sequelize.ENUM('round_robin', 'interest_based', 'randomised', 'mentor_focus'),
        allowNull: false,
        defaultValue: 'round_robin',
      },
      tags: { type: jsonType, allowNull: true },
      settings: { type: jsonType, allowNull: true },
      assets: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('speed_networking_sessions', ['status']);
    await queryInterface.addIndex('speed_networking_sessions', ['hostId']);
    await queryInterface.addIndex('speed_networking_sessions', ['adminOwnerId']);
    await queryInterface.addIndex('speed_networking_sessions', ['workspaceId']);
    await queryInterface.addIndex('speed_networking_sessions', ['scheduledStart']);

    await queryInterface.createTable('speed_networking_rooms', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'speed_networking_sessions', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      topic: { type: Sequelize.STRING(255), allowNull: true },
      capacity: { type: Sequelize.INTEGER, allowNull: true },
      isLocked: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      meetingUrl: { type: Sequelize.STRING(255), allowNull: true },
      facilitatorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      rotationIntervalSeconds: { type: Sequelize.INTEGER, allowNull: true },
      instructions: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('speed_networking_rooms', ['sessionId']);
    await queryInterface.addIndex('speed_networking_rooms', ['facilitatorId']);

    await queryInterface.createTable('speed_networking_participants', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'speed_networking_sessions', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      email: { type: Sequelize.STRING(255), allowNull: true },
      fullName: { type: Sequelize.STRING(180), allowNull: true },
      role: {
        type: Sequelize.ENUM('attendee', 'mentor', 'moderator', 'sponsor', 'observer'),
        allowNull: false,
        defaultValue: 'attendee',
      },
      status: {
        type: Sequelize.ENUM('invited', 'confirmed', 'checked_in', 'active', 'completed', 'no_show', 'removed'),
        allowNull: false,
        defaultValue: 'invited',
      },
      assignedRoomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'speed_networking_rooms', key: 'id' },
        onDelete: 'SET NULL',
      },
      checkInAt: { type: Sequelize.DATE, allowNull: true },
      lastMatchedAt: { type: Sequelize.DATE, allowNull: true },
      interests: { type: jsonType, allowNull: true },
      goals: { type: Sequelize.TEXT, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
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
    });

    await queryInterface.addIndex('speed_networking_participants', ['sessionId']);
    await queryInterface.addIndex('speed_networking_participants', ['userId']);
    await queryInterface.addIndex('speed_networking_participants', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('speed_networking_participants');
    await queryInterface.dropTable('speed_networking_rooms');
    await queryInterface.dropTable('speed_networking_sessions');

    await dropEnum(queryInterface, 'enum_speed_networking_sessions_status');
    await dropEnum(queryInterface, 'enum_speed_networking_sessions_accessLevel');
    await dropEnum(queryInterface, 'enum_speed_networking_sessions_visibility');
    await dropEnum(queryInterface, 'enum_speed_networking_sessions_matchingStrategy');
    await dropEnum(queryInterface, 'enum_speed_networking_participants_role');
    await dropEnum(queryInterface, 'enum_speed_networking_participants_status');
  },
};
