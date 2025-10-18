'use strict';

const TABLES = {
  sessionOrders: 'networking_session_orders',
  connections: 'networking_connections',
};

const ENUMS = {
  sessionOrderStatus: 'enum_networking_session_orders_status',
  connectionFollowStatus: 'enum_networking_connections_followStatus',
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TABLES.sessionOrders,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          sessionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'networking_sessions', key: 'id' },
            onDelete: 'CASCADE',
          },
          purchaserId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          purchaserEmail: { type: Sequelize.STRING(255), allowNull: true },
          purchaserName: { type: Sequelize.STRING(255), allowNull: true },
          status: {
            type: Sequelize.ENUM('pending', 'paid', 'refunded', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
          },
          amountCents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          purchasedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          reference: { type: Sequelize.STRING(120), allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.sessionOrders, ['sessionId'], { transaction });
      await queryInterface.addIndex(TABLES.sessionOrders, ['purchaserId'], { transaction });
      await queryInterface.addIndex(TABLES.sessionOrders, ['status'], { transaction });
      await queryInterface.addIndex(TABLES.sessionOrders, ['purchasedAt'], { transaction });

      await queryInterface.createTable(
        TABLES.connections,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          connectionUserId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          sessionId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'networking_sessions', key: 'id' },
            onDelete: 'SET NULL',
          },
          connectionName: { type: Sequelize.STRING(255), allowNull: false },
          connectionEmail: { type: Sequelize.STRING(255), allowNull: true },
          connectionHeadline: { type: Sequelize.STRING(255), allowNull: true },
          connectionCompany: { type: Sequelize.STRING(255), allowNull: true },
          followStatus: {
            type: Sequelize.ENUM('saved', 'requested', 'following', 'connected', 'archived'),
            allowNull: false,
            defaultValue: 'saved',
          },
          connectedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          lastContactedAt: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          tags: { type: jsonType, allowNull: true },
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
        },
        { transaction },
      );

      await queryInterface.addIndex(TABLES.connections, ['ownerId'], { transaction });
      await queryInterface.addIndex(TABLES.connections, ['sessionId'], { transaction });
      await queryInterface.addIndex(TABLES.connections, ['followStatus'], { transaction });
      await queryInterface.addIndex(TABLES.connections, ['connectedAt'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLES.connections, { transaction });
      await queryInterface.dropTable(TABLES.sessionOrders, { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUMS.connectionFollowStatus}"`, { transaction });
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${ENUMS.sessionOrderStatus}"`, { transaction });
      }
    });
  },
};
