'use strict';

const TABLE_NAME = 'user_event_workspace_settings';

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

    await queryInterface.createTable(TABLE_NAME, {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        unique: true,
      },
      includeArchivedByDefault: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      autoArchiveAfterDays: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 90 },
      defaultFormat: { type: Sequelize.ENUM('virtual', 'in_person', 'hybrid'), allowNull: false, defaultValue: 'virtual' },
      defaultVisibility: {
        type: Sequelize.ENUM('private', 'invite_only', 'public'),
        allowNull: false,
        defaultValue: 'invite_only',
      },
      defaultTimezone: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'UTC' },
      requireCheckInNotes: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      allowedRoles: { type: jsonType, allowNull: false, defaultValue: [] },
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

    await queryInterface.addIndex(TABLE_NAME, ['ownerId'], {
      unique: true,
      name: 'user_event_workspace_settings_owner_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE_NAME);
    await dropEnum(queryInterface, 'enum_user_event_workspace_settings_defaultFormat');
    await dropEnum(queryInterface, 'enum_user_event_workspace_settings_defaultVisibility');
  },
};
