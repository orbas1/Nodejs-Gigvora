'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('runtime_announcements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(140), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(240), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      severity: { type: Sequelize.STRING(32), allowNull: false },
      status: { type: Sequelize.STRING(32), allowNull: false },
      audiences: { type: jsonType, allowNull: false, defaultValue: [] },
      channels: { type: jsonType, allowNull: false, defaultValue: [] },
      dismissible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      startsAt: { type: Sequelize.DATE, allowNull: true },
      endsAt: { type: Sequelize.DATE, allowNull: true },
      createdBy: { type: Sequelize.STRING(120), allowNull: true },
      updatedBy: { type: Sequelize.STRING(120), allowNull: true },
      metadata: { type: jsonType, allowNull: false, defaultValue: {} },
      publishedAt: { type: Sequelize.DATE, allowNull: true },
      resolvedAt: { type: Sequelize.DATE, allowNull: true },
      lastBroadcastAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('runtime_announcements', ['status'], {
      name: 'runtime_announcements_status_idx',
    });

    await queryInterface.addIndex('runtime_announcements', ['startsAt'], {
      name: 'runtime_announcements_starts_idx',
    });

    await queryInterface.addIndex('runtime_announcements', ['endsAt'], {
      name: 'runtime_announcements_ends_idx',
    });

    await queryInterface.addIndex('runtime_announcements', ['slug'], {
      name: 'runtime_announcements_slug_key',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('runtime_announcements');
  },
};
