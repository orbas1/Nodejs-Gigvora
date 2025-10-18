'use strict';

const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded'];
const CONNECTION_STATUSES = ['new', 'follow_up', 'connected', 'archived'];
const CONNECTION_TYPES = ['follow', 'connect', 'collaboration'];

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

    await queryInterface.addColumn('networking_session_signups', 'purchaseCents', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('networking_session_signups', 'purchaseCurrency', {
      type: Sequelize.STRING(3),
      allowNull: true,
    });

    await queryInterface.addColumn('networking_session_signups', 'paymentStatus', {
      type: Sequelize.ENUM(...PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'unpaid',
    });

    await queryInterface.addColumn('networking_session_signups', 'bookedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('networking_session_signups', 'cancelledAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.createTable('networking_connections', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'networking_sessions', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      sourceSignupId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'networking_session_signups', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      targetSignupId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'networking_session_signups', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      sourceParticipantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      targetParticipantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      counterpartName: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      counterpartEmail: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      connectionType: {
        type: Sequelize.ENUM(...CONNECTION_TYPES),
        allowNull: false,
        defaultValue: 'follow',
      },
      status: {
        type: Sequelize.ENUM(...CONNECTION_STATUSES),
        allowNull: false,
        defaultValue: 'new',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      firstInteractedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      followUpAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      metadata: {
        type: jsonType,
        allowNull: true,
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

    await queryInterface.addIndex('networking_connections', ['sessionId']);
    await queryInterface.addIndex('networking_connections', ['sourceParticipantId']);
    await queryInterface.addIndex('networking_connections', ['targetParticipantId']);
    await queryInterface.addIndex('networking_connections', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('networking_session_signups', 'purchaseCents');
    await queryInterface.removeColumn('networking_session_signups', 'purchaseCurrency');
    await queryInterface.removeColumn('networking_session_signups', 'paymentStatus');
    await queryInterface.removeColumn('networking_session_signups', 'bookedAt');
    await queryInterface.removeColumn('networking_session_signups', 'cancelledAt');

    await queryInterface.dropTable('networking_connections');

    await dropEnum(queryInterface, 'enum_networking_session_signups_paymentStatus');
    await dropEnum(queryInterface, 'enum_networking_connections_connectionType');
    await dropEnum(queryInterface, 'enum_networking_connections_status');
  },
};
