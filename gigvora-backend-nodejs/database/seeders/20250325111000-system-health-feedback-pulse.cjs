'use strict';

const INCIDENT_TABLE = 'system_status_incidents';
const SERVICE_TABLE = 'system_status_services';
const SNAPSHOT_TABLE = 'feedback_pulse_snapshots';
const THEME_TABLE = 'feedback_pulse_themes';
const HIGHLIGHT_TABLE = 'feedback_pulse_highlights';

const INCIDENT_REFERENCE = 'demo-analytics-latency';
const SNAPSHOT_REFERENCE = 'feedback-pulse-q1-demo';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { QueryTypes } = Sequelize;

    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date('2025-03-15T15:30:00Z');
      const updatedAt = new Date('2025-03-15T15:10:00Z');
      const maintenanceStart = new Date('2025-03-16T01:00:00Z');
      const maintenanceEnd = new Date('2025-03-16T02:30:00Z');

      await queryInterface.bulkInsert(
        INCIDENT_TABLE,
        [
          {
            reference: INCIDENT_REFERENCE,
            status: 'degraded',
            headline: 'Realtime analytics latency',
            description:
              'Our realtime analytics pipeline is processing events behind schedule while we rebalance stream partitions.',
            maintenanceSummary: 'Latency tuning window',
            maintenanceStartsAt: maintenanceStart,
            maintenanceEndsAt: maintenanceEnd,
            maintenanceTimezone: 'UTC',
            statusPageUrl: 'https://status.gigvora.test/incidents/realtime-analytics',
            metadata: { owner: 'observability-team', escalationContact: 'oncall-analytics@gigvora.test' },
            createdAt: updatedAt,
            updatedAt,
          },
        ],
        { transaction },
      );

      const [incidentRow] = await queryInterface.sequelize.query(
        `SELECT id FROM ${INCIDENT_TABLE} WHERE reference = :reference LIMIT 1`,
        { type: QueryTypes.SELECT, transaction, replacements: { reference: INCIDENT_REFERENCE } },
      );

      if (!incidentRow?.id) {
        throw new Error('Failed to seed system status incident');
      }

      const incidentId = incidentRow.id;

      await queryInterface.bulkInsert(
        SERVICE_TABLE,
        [
          {
            incidentId,
            name: 'Realtime analytics API',
            status: 'degraded',
            impact: 'Live dashboards are refreshing every 8 minutes instead of sub-minute.',
            eta: new Date('2025-03-15T17:00:00Z'),
            confidence: 0.6,
            sortOrder: 0,
            createdAt: updatedAt,
            updatedAt,
          },
          {
            incidentId,
            name: 'Engagement scoring jobs',
            status: 'investigating',
            impact: 'Nightly scoring runs may miss the latest session signals.',
            eta: null,
            confidence: 0.45,
            sortOrder: 1,
            createdAt: updatedAt,
            updatedAt,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        SNAPSHOT_TABLE,
        [
          {
            reference: SNAPSHOT_REFERENCE,
            timeframe: '7d',
            overallScore: 84.6,
            scoreChange: 2.4,
            responseRate: 63.2,
            responseDelta: 4.1,
            sampleSize: 186,
            lastUpdated: updatedAt,
            alertsUnresolved: 3,
            alertsCritical: 1,
            alertsAcknowledged: 5,
            systemStatusIncidentId: incidentId,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const [snapshotRow] = await queryInterface.sequelize.query(
        `SELECT id FROM ${SNAPSHOT_TABLE} WHERE reference = :reference LIMIT 1`,
        { type: QueryTypes.SELECT, transaction, replacements: { reference: SNAPSHOT_REFERENCE } },
      );

      if (!snapshotRow?.id) {
        throw new Error('Failed to seed feedback pulse snapshot');
      }

      const snapshotId = snapshotRow.id;

      await queryInterface.bulkInsert(
        THEME_TABLE,
        [
          {
            snapshotId,
            name: 'Onboarding clarity',
            score: 88.4,
            change: 3.1,
            position: 0,
            createdAt: now,
            updatedAt: now,
          },
          {
            snapshotId,
            name: 'Support responsiveness',
            score: 79.2,
            change: 1.4,
            position: 1,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        HIGHLIGHT_TABLE,
        [
          {
            snapshotId,
            quote:
              'The concierge onboarding calls helped our leadership team see value inside the first week. Keep the async recap notes coming!',
            persona: 'COO · Atlas Marketplaces',
            team: 'Executive cohort',
            channel: 'Feedback pulse survey',
            sentiment: 'positive',
            driver: 'Onboarding',
            submittedAt: new Date('2025-03-14T20:45:00Z'),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete(SNAPSHOT_TABLE, { reference: SNAPSHOT_REFERENCE }, { transaction });
      await queryInterface.bulkDelete(INCIDENT_TABLE, { reference: INCIDENT_REFERENCE }, { transaction });
    });
  },
};
