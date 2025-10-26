'use strict';

const { Op } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const announcements = [
      {
        slug: 'ops-api-upgrade',
        title: 'Planned API gateway upgrade',
        message:
          'We are upgrading the global API gateway cluster to improve routing latency. Requests may experience brief retries. '
          + 'Real-time updates remain available.',
        severity: 'maintenance',
        status: 'active',
        audiences: ['operations', 'provider', 'company'],
        channels: ['api', 'web'],
        dismissible: false,
        startsAt: new Date('2024-11-02T01:00:00Z'),
        endsAt: new Date('2024-11-02T03:00:00Z'),
        createdBy: 'ops.bot@gigvora.com',
        updatedBy: 'ops.bot@gigvora.com',
        metadata: {
          impact: 'API requests will automatically retry with exponential backoff.',
          contact: 'operations@gigvora.com',
        },
        publishedAt: new Date('2024-11-01T23:30:00Z'),
        lastBroadcastAt: new Date('2024-11-01T23:45:00Z'),
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: 'ops-database-replica-maintenance',
        title: 'Database replica maintenance window',
        message:
          'Site Reliability is refreshing read replicas backing analytics exports. Dashboards will remain available with '
          + 'stale data until sync completes.',
        severity: 'info',
        status: 'scheduled',
        audiences: ['operations', 'admin'],
        channels: ['web', 'email'],
        dismissible: true,
        startsAt: new Date('2024-11-05T02:00:00Z'),
        endsAt: new Date('2024-11-05T04:30:00Z'),
        createdBy: 'ava.lopez@gigvora.com',
        updatedBy: 'ava.lopez@gigvora.com',
        metadata: {
          impact: 'Dashboards refresh every 30 minutes during the window.',
          contact: 'analytics-support@gigvora.com',
        },
        publishedAt: new Date('2024-11-04T18:00:00Z'),
        createdAt: now,
        updatedAt: now,
      },
      {
        slug: 'ops-incident-report-20241028',
        title: 'Incident resolved: realtime presence delays',
        message:
          'Realtime presence updates were delayed for 14 minutes on 28 Oct 2024. The issue has been resolved and metrics are '
          + 'back within SLO. No action is required.',
        severity: 'incident',
        status: 'resolved',
        audiences: ['operations', 'admin', 'provider'],
        channels: ['web', 'mobile', 'api'],
        dismissible: true,
        startsAt: new Date('2024-10-28T07:10:00Z'),
        endsAt: new Date('2024-10-28T07:24:00Z'),
        createdBy: 'incident.commander@gigvora.com',
        updatedBy: 'incident.commander@gigvora.com',
        metadata: {
          impact: 'Realtime presence events queued but were delivered.',
          resolution: 'Scaled websocket shards and purged backlog.',
        },
        publishedAt: new Date('2024-10-28T07:30:00Z'),
        resolvedAt: new Date('2024-10-28T07:45:00Z'),
        lastBroadcastAt: new Date('2024-10-28T08:00:00Z'),
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('runtime_announcements', announcements);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('runtime_announcements', {
      slug: {
        [Op.in]: [
          'ops-api-upgrade',
          'ops-database-replica-maintenance',
          'ops-incident-report-20241028',
        ],
      },
    });
  },
};
