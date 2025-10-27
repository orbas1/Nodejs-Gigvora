'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('maintenance_feedback_snapshots', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      capturedAt: { type: Sequelize.DATE, allowNull: false },
      experienceScore: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      trendDelta: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      queueDepth: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      queueTarget: { type: Sequelize.INTEGER, allowNull: true },
      medianResponseMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      sentimentNarrative: { type: Sequelize.TEXT, allowNull: true },
      reviewUrl: { type: Sequelize.STRING(500), allowNull: true },
      segments: { type: jsonType, allowNull: false, defaultValue: [] },
      highlights: { type: jsonType, allowNull: false, defaultValue: [] },
      alerts: { type: jsonType, allowNull: false, defaultValue: [] },
      responseBreakdown: { type: jsonType, allowNull: false, defaultValue: [] },
      topDrivers: { type: jsonType, allowNull: false, defaultValue: [] },
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

    await queryInterface.addIndex('maintenance_feedback_snapshots', ['capturedAt'], {
      name: 'maintenance_feedback_snapshots_captured_idx',
    });

    await queryInterface.createTable('maintenance_operational_snapshots', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(240), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: false },
      severity: { type: Sequelize.STRING(32), allowNull: false },
      impactSurface: { type: Sequelize.STRING(160), allowNull: false },
      capturedAt: { type: Sequelize.DATE, allowNull: false },
      acknowledgedAt: { type: Sequelize.DATE, allowNull: true },
      acknowledgedBy: { type: Sequelize.STRING(160), allowNull: true },
      incidentRoomUrl: { type: Sequelize.STRING(500), allowNull: true },
      runbookUrl: { type: Sequelize.STRING(500), allowNull: true },
      metrics: { type: jsonType, allowNull: false, defaultValue: {} },
      incidents: { type: jsonType, allowNull: false, defaultValue: [] },
      channels: { type: jsonType, allowNull: false, defaultValue: [] },
      warnings: { type: jsonType, allowNull: false, defaultValue: [] },
      escalations: { type: jsonType, allowNull: false, defaultValue: [] },
      maintenanceWindow: { type: jsonType, allowNull: true },
      feedbackSnapshotId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'maintenance_feedback_snapshots', key: 'id' },
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
    });

    await queryInterface.addIndex('maintenance_operational_snapshots', ['slug'], {
      name: 'maintenance_operational_snapshots_slug_key',
      unique: true,
    });

    await queryInterface.addIndex('maintenance_operational_snapshots', ['capturedAt'], {
      name: 'maintenance_operational_snapshots_captured_idx',
    });

    await queryInterface.createTable('maintenance_windows', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING(240), allowNull: false },
      owner: { type: Sequelize.STRING(160), allowNull: true },
      impact: { type: Sequelize.STRING(160), allowNull: true },
      startAt: { type: Sequelize.DATE, allowNull: false },
      endAt: { type: Sequelize.DATE, allowNull: true },
      channels: { type: jsonType, allowNull: false, defaultValue: [] },
      notificationLeadMinutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
      rollbackPlan: { type: Sequelize.TEXT, allowNull: true },
      createdBy: { type: Sequelize.STRING(160), allowNull: true },
      updatedBy: { type: Sequelize.STRING(160), allowNull: true },
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

    await queryInterface.addIndex('maintenance_windows', ['startAt'], {
      name: 'maintenance_windows_start_idx',
    });

    await queryInterface.createTable('maintenance_broadcast_logs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      subject: { type: Sequelize.STRING(280), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      channels: { type: jsonType, allowNull: false, defaultValue: [] },
      audience: { type: Sequelize.STRING(160), allowNull: false },
      includeTimeline: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      includeStatusPage: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      dispatchedAt: { type: Sequelize.DATE, allowNull: false },
      dispatchedBy: { type: Sequelize.STRING(160), allowNull: true },
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

    await queryInterface.addIndex('maintenance_broadcast_logs', ['dispatchedAt'], {
      name: 'maintenance_broadcast_logs_dispatched_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('maintenance_broadcast_logs', 'maintenance_broadcast_logs_dispatched_idx');
    await queryInterface.dropTable('maintenance_broadcast_logs');

    await queryInterface.removeIndex('maintenance_windows', 'maintenance_windows_start_idx');
    await queryInterface.dropTable('maintenance_windows');

    await queryInterface.removeIndex('maintenance_operational_snapshots', 'maintenance_operational_snapshots_captured_idx');
    await queryInterface.removeIndex('maintenance_operational_snapshots', 'maintenance_operational_snapshots_slug_key');
    await queryInterface.dropTable('maintenance_operational_snapshots');

    await queryInterface.removeIndex('maintenance_feedback_snapshots', 'maintenance_feedback_snapshots_captured_idx');
    await queryInterface.dropTable('maintenance_feedback_snapshots');
  },
};
