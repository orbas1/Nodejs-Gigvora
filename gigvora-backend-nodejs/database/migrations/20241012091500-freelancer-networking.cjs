'use strict';

const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded'];
const CONNECTION_STATUSES = ['new', 'follow_up', 'connected', 'archived'];
const CONNECTION_TYPES = ['follow', 'connect', 'collaboration'];

const dropEnum = async (queryInterface, enumName, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
  }
};

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

const addIndexSafely = (queryInterface, table, fields, options = {}) =>
  queryInterface.addIndex(table, fields, options).catch((error) => {
    if (!/already exists/i.test(error.message)) {
      throw error;
    }
  });

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'networking_session_signups',
        'purchaseCents',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          validate: { min: 0 },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'networking_session_signups',
        'purchaseCurrency',
        {
          type: Sequelize.STRING(3),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'networking_session_signups',
        'paymentStatus',
        {
          type: Sequelize.ENUM(...PAYMENT_STATUSES),
          allowNull: false,
          defaultValue: 'unpaid',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'networking_session_signups',
        'bookedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'networking_session_signups',
        'cancelledAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await addIndexSafely(queryInterface, 'networking_session_signups', ['paymentStatus'], {
        name: 'networking_session_signups_payment_status_idx',
        transaction,
      });

      await queryInterface.createTable(
        'networking_connections',
        {
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
          counterpartName: { type: Sequelize.STRING(255), allowNull: true },
          counterpartEmail: { type: Sequelize.STRING(255), allowNull: true },
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
          notes: { type: Sequelize.TEXT, allowNull: true },
          firstInteractedAt: { type: Sequelize.DATE, allowNull: true },
          followUpAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
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
        },
        { transaction },
      );

      await addIndexSafely(queryInterface, 'networking_connections', ['sessionId'], {
        name: 'networking_connections_session_idx',
        transaction,
      });
      await addIndexSafely(queryInterface, 'networking_connections', ['sourceParticipantId'], {
        name: 'networking_connections_source_participant_idx',
        transaction,
      });
      await addIndexSafely(queryInterface, 'networking_connections', ['targetParticipantId'], {
        name: 'networking_connections_target_participant_idx',
        transaction,
      });
      await addIndexSafely(queryInterface, 'networking_connections', ['status'], {
        name: 'networking_connections_status_idx',
        transaction,
      });
      await queryInterface.addConstraint('networking_connections', {
        type: 'unique',
        fields: ['sessionId', 'sourceSignupId', 'targetSignupId', 'connectionType'],
        name: 'networking_connections_unique_pairing',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('networking_connections', { transaction });

      await queryInterface.removeColumn('networking_session_signups', 'cancelledAt', { transaction });
      await queryInterface.removeColumn('networking_session_signups', 'bookedAt', { transaction });
      await queryInterface.removeColumn('networking_session_signups', 'paymentStatus', { transaction });
      await queryInterface.removeColumn('networking_session_signups', 'purchaseCurrency', { transaction });
      await queryInterface.removeColumn('networking_session_signups', 'purchaseCents', { transaction });

      await dropEnum(queryInterface, 'enum_networking_session_signups_paymentStatus', transaction);
      await dropEnum(queryInterface, 'enum_networking_connections_connectionType', transaction);
      await dropEnum(queryInterface, 'enum_networking_connections_status', transaction);
    });
  },
};
