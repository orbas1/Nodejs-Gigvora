'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('admin_timelines', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(200), allowNull: false },
      slug: { type: Sequelize.STRING(220), allowNull: false },
      summary: { type: Sequelize.STRING(400), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      timelineType: { type: Sequelize.STRING(80), allowNull: true },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'draft' },
      visibility: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'internal' },
      startDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      heroImageUrl: { type: Sequelize.STRING(500), allowNull: true },
      thumbnailUrl: { type: Sequelize.STRING(500), allowNull: true },
      tags: { type: jsonType, allowNull: false, defaultValue: [] },
      settings: { type: jsonType, allowNull: false, defaultValue: {} },
      createdBy: { type: Sequelize.INTEGER, allowNull: true },
      updatedBy: { type: Sequelize.INTEGER, allowNull: true },
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

    await queryInterface.addIndex('admin_timelines', ['slug'], { unique: true, name: 'admin_timelines_slug_unique' });
    await queryInterface.addIndex('admin_timelines', ['status']);
    await queryInterface.addIndex('admin_timelines', ['visibility']);
    await queryInterface.addIndex('admin_timelines', ['timelineType']);

    await queryInterface.createTable('admin_timeline_events', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      timelineId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'admin_timelines', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      summary: { type: Sequelize.STRING(500), allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      eventType: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'milestone' },
      status: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'planned' },
      startDate: { type: Sequelize.DATE, allowNull: true },
      dueDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      ownerId: { type: Sequelize.INTEGER, allowNull: true },
      ownerName: { type: Sequelize.STRING(160), allowNull: true },
      ownerEmail: { type: Sequelize.STRING(160), allowNull: true },
      location: { type: Sequelize.STRING(160), allowNull: true },
      ctaLabel: { type: Sequelize.STRING(80), allowNull: true },
      ctaUrl: { type: Sequelize.STRING(500), allowNull: true },
      tags: { type: jsonType, allowNull: false, defaultValue: [] },
      attachments: { type: jsonType, allowNull: false, defaultValue: [] },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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

    await queryInterface.addIndex('admin_timeline_events', ['timelineId']);
    await queryInterface.addIndex('admin_timeline_events', ['timelineId', 'orderIndex'], {
      name: 'admin_timeline_events_timeline_order_idx',
    });
    await queryInterface.addIndex('admin_timeline_events', ['status']);
    await queryInterface.addIndex('admin_timeline_events', ['eventType']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('admin_timeline_events');
    await queryInterface.dropTable('admin_timelines');
  },
};
