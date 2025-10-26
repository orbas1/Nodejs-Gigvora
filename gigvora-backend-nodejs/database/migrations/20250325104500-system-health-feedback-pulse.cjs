'use strict';

const INCIDENT_TABLE = 'system_status_incidents';
const SERVICE_TABLE = 'system_status_services';
const SNAPSHOT_TABLE = 'feedback_pulse_snapshots';
const THEME_TABLE = 'feedback_pulse_themes';
const HIGHLIGHT_TABLE = 'feedback_pulse_highlights';

const SYSTEM_STATUS_LEVELS = ['operational', 'degraded', 'outage', 'maintenance'];
const SYSTEM_STATUS_SERVICE_STATES = [
  'operational',
  'degraded',
  'outage',
  'maintenance',
  'investigating',
  'recovering',
];
const FEEDBACK_HIGHLIGHT_SENTIMENTS = ['positive', 'neutral', 'negative'];

const addIndexSafely = (queryInterface, table, fields, options = {}) =>
  queryInterface.addIndex(table, fields, options).catch((error) => {
    if (!/already exists/i.test(error.message)) {
      throw error;
    }
  });

const dropEnumSafely = async (queryInterface, enumName, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (!['postgres', 'postgresql'].includes(dialect)) {
    return;
  }
  await queryInterface.sequelize
    .query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction })
    .catch(() => {});
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        INCIDENT_TABLE,
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          reference: { type: Sequelize.STRING(80), allowNull: true, unique: true },
          status: { type: Sequelize.ENUM(...SYSTEM_STATUS_LEVELS), allowNull: false, defaultValue: 'operational' },
          headline: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          maintenanceSummary: { type: Sequelize.STRING(200), allowNull: true },
          maintenanceStartsAt: { type: Sequelize.DATE, allowNull: true },
          maintenanceEndsAt: { type: Sequelize.DATE, allowNull: true },
          maintenanceTimezone: { type: Sequelize.STRING(64), allowNull: true },
          statusPageUrl: { type: Sequelize.STRING(500), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await addIndexSafely(queryInterface, INCIDENT_TABLE, ['status'], { name: 'system_status_incidents_status_idx', transaction });
      await addIndexSafely(queryInterface, INCIDENT_TABLE, ['updatedAt'], { name: 'system_status_incidents_updated_idx', transaction });

      await queryInterface.createTable(
        SERVICE_TABLE,
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          incidentId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: INCIDENT_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          status: {
            type: Sequelize.ENUM(...SYSTEM_STATUS_SERVICE_STATES),
            allowNull: false,
            defaultValue: 'investigating',
          },
          impact: { type: Sequelize.TEXT, allowNull: true },
          eta: { type: Sequelize.DATE, allowNull: true },
          confidence: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await addIndexSafely(queryInterface, SERVICE_TABLE, ['incidentId', 'sortOrder'], {
        name: 'system_status_services_incident_sort_idx',
        transaction,
      });

      await queryInterface.createTable(
        SNAPSHOT_TABLE,
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          reference: { type: Sequelize.STRING(80), allowNull: true, unique: true },
          timeframe: { type: Sequelize.STRING(16), allowNull: false },
          overallScore: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          scoreChange: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          responseRate: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          responseDelta: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          sampleSize: { type: Sequelize.INTEGER, allowNull: true },
          lastUpdated: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          alertsUnresolved: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          alertsCritical: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          alertsAcknowledged: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          systemStatusIncidentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: INCIDENT_TABLE, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await addIndexSafely(queryInterface, SNAPSHOT_TABLE, ['timeframe'], {
        name: 'feedback_pulse_snapshots_timeframe_idx',
        transaction,
      });
      await addIndexSafely(queryInterface, SNAPSHOT_TABLE, ['lastUpdated'], {
        name: 'feedback_pulse_snapshots_last_updated_idx',
        transaction,
      });

      await queryInterface.createTable(
        THEME_TABLE,
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          snapshotId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: SNAPSHOT_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          score: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          change: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await addIndexSafely(queryInterface, THEME_TABLE, ['snapshotId', 'position'], {
        name: 'feedback_pulse_themes_snapshot_position_idx',
        transaction,
      });

      await queryInterface.createTable(
        HIGHLIGHT_TABLE,
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          snapshotId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: SNAPSHOT_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          quote: { type: Sequelize.TEXT, allowNull: false },
          persona: { type: Sequelize.STRING(160), allowNull: true },
          team: { type: Sequelize.STRING(160), allowNull: true },
          channel: { type: Sequelize.STRING(120), allowNull: true },
          sentiment: {
            type: Sequelize.ENUM(...FEEDBACK_HIGHLIGHT_SENTIMENTS),
            allowNull: false,
            defaultValue: 'neutral',
          },
          driver: { type: Sequelize.STRING(160), allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await addIndexSafely(queryInterface, HIGHLIGHT_TABLE, ['snapshotId', 'submittedAt'], {
        name: 'feedback_pulse_highlights_snapshot_submitted_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(HIGHLIGHT_TABLE, { transaction }).catch(() => {});
      await queryInterface.dropTable(THEME_TABLE, { transaction }).catch(() => {});
      await queryInterface.dropTable(SNAPSHOT_TABLE, { transaction }).catch(() => {});
      await queryInterface.dropTable(SERVICE_TABLE, { transaction }).catch(() => {});
      await queryInterface.dropTable(INCIDENT_TABLE, { transaction }).catch(() => {});

      await dropEnumSafely(queryInterface, 'enum_feedback_pulse_highlights_sentiment', transaction);
      await dropEnumSafely(queryInterface, 'enum_system_status_services_status', transaction);
      await dropEnumSafely(queryInterface, 'enum_system_status_incidents_status', transaction);
    });
  },
};
