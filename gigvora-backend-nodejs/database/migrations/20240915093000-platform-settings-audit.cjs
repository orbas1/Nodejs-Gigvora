'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('platform_setting_audits', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      settingKey: { type: Sequelize.STRING(160), allowNull: false },
      actorId: { type: Sequelize.INTEGER, allowNull: true },
      actorType: { type: Sequelize.STRING(120), allowNull: true },
      changeType: {
        type: Sequelize.ENUM('create', 'update', 'delete'),
        allowNull: false,
        defaultValue: 'update',
      },
      summary: { type: Sequelize.STRING(255), allowNull: true },
      diff: { type: jsonType, allowNull: false, defaultValue: [] },
      beforeSnapshot: { type: jsonType, allowNull: false, defaultValue: {} },
      afterSnapshot: { type: jsonType, allowNull: false, defaultValue: {} },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
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

    await queryInterface.addIndex('platform_setting_audits', ['settingKey']);
    await queryInterface.addIndex('platform_setting_audits', ['actorId']);
    await queryInterface.addIndex('platform_setting_audits', ['changeType']);
    await queryInterface.addIndex('platform_setting_audits', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('platform_setting_audits', ['createdAt']).catch(() => {});
    await queryInterface.removeIndex('platform_setting_audits', ['changeType']).catch(() => {});
    await queryInterface.removeIndex('platform_setting_audits', ['actorId']).catch(() => {});
    await queryInterface.removeIndex('platform_setting_audits', ['settingKey']).catch(() => {});
    await queryInterface.dropTable('platform_setting_audits');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_platform_setting_audits_changeType";');
    }
  },
};
