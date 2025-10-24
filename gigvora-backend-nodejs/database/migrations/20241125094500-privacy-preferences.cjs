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

    await queryInterface.createTable('user_security_preferences', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        unique: true,
      },
      sessionTimeoutMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      biometricApprovalsEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      deviceApprovalsEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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

    await queryInterface.addIndex('user_security_preferences', ['userId'], {
      unique: true,
      name: 'user_security_preferences_user_id_unique',
    });

    await queryInterface.createTable('data_export_requests', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('queued', 'processing', 'ready', 'failed', 'expired'),
        allowNull: false,
        defaultValue: 'queued',
      },
      format: {
        type: Sequelize.ENUM('zip', 'json', 'csv', 'pdf'),
        allowNull: false,
        defaultValue: 'zip',
      },
      type: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'account_archive' },
      requestedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      completedAt: { type: Sequelize.DATE, allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      downloadUrl: { type: Sequelize.STRING(2048), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
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

    await queryInterface.addIndex('data_export_requests', ['userId']);
    await queryInterface.addIndex('data_export_requests', ['status']);
    await queryInterface.addIndex('data_export_requests', ['requestedAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('data_export_requests', ['requestedAt']).catch(() => {});
    await queryInterface.removeIndex('data_export_requests', ['status']).catch(() => {});
    await queryInterface.removeIndex('data_export_requests', ['userId']).catch(() => {});
    await queryInterface.dropTable('data_export_requests');
    await dropEnum(queryInterface, 'enum_data_export_requests_status');
    await dropEnum(queryInterface, 'enum_data_export_requests_format');

    await queryInterface.removeIndex('user_security_preferences', 'user_security_preferences_user_id_unique').catch(() => {});
    await queryInterface.dropTable('user_security_preferences');
  },
};
