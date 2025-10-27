'use strict';

const { Op } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'maintenance_feedback_snapshots',
      [
        {
          capturedAt: now,
          experienceScore: 4.6,
          trendDelta: 0.2,
          queueDepth: 9,
          queueTarget: 6,
          medianResponseMinutes: 3,
          totalResponses: 427,
          sentimentNarrative:
            'Sentiment remains above target; monitor APAC queue spikes and social chatter to keep delighters high.',
          reviewUrl: 'https://gigvora.com/ops/feedback',
          segments: [
            { id: 'enterprise', label: 'Enterprise', score: 4.8, delta: 0.3, sampleSize: 126 },
            { id: 'smb', label: 'SMB', score: 4.4, delta: 0.1, sampleSize: 212 },
            { id: 'partners', label: 'Partners', score: 4.5, delta: -0.1, sampleSize: 63 },
          ],
          highlights: [
            {
              id: 'highlight-enterprise',
              persona: 'Enterprise PM',
              sentiment: 'Positive',
              quote: 'The maintenance comms are clear and timed perfectly for our teams.',
              recordedAt: new Date(now.getTime() - 45 * 60 * 1000),
            },
            {
              id: 'highlight-support',
              persona: 'Customer Support Lead',
              sentiment: 'Watchlist',
              quote: 'We need more notice for APAC teams—queue volume spikes post-maintenance.',
              recordedAt: new Date(now.getTime() - 90 * 60 * 1000),
            },
          ],
          alerts: [
            { id: 'alert-apac', severity: 'caution', message: 'APAC queue depth 35% over target after last window.' },
            { id: 'alert-social', severity: 'positive', message: 'Community sentiment up 12% after proactive comms.' },
          ],
          responseBreakdown: [
            { id: 'web', label: 'Web', percentage: 48 },
            { id: 'mobile', label: 'Mobile', percentage: 32 },
            { id: 'email', label: 'Email', percentage: 20 },
          ],
          topDrivers: [
            'Real-time roadmap updates reassure enterprise stakeholders.',
            'Regional Slack huddles reduce inbound support tickets by 18%.',
            'Localized status copy improved transparency scores.',
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
    );

    const [feedbackRows] = await queryInterface.sequelize.query(
      "SELECT id FROM maintenance_feedback_snapshots WHERE reviewUrl = 'https://gigvora.com/ops/feedback' ORDER BY capturedAt DESC LIMIT 1",
    );
    const feedbackId = Array.isArray(feedbackRows) && feedbackRows.length ? feedbackRows[0].id : null;

    await queryInterface.bulkInsert('maintenance_operational_snapshots', [
      {
        slug: 'operations-all-systems-operational',
        title: 'All systems operational',
        summary: 'Gigvora is live with no customer-impacting incidents reported.',
        severity: 'operational',
        impactSurface: 'Platform & APIs',
        capturedAt: now,
        nextUpdateAt: new Date(now.getTime() + 30 * 60 * 1000),
        acknowledgedAt: null,
        acknowledgedBy: null,
        incidentRoomUrl: 'https://gigvora.slack.com/archives/gigvora-ops',
        runbookUrl: 'https://gigvora.notion.site/maintenance-runbook',
        metrics: {
          uptime: 99.982,
          latencyP95: 184,
          errorRate: 0.002,
          activeIncidents: 0,
        },
        incidents: [
          {
            id: 'incident-maintenance-readiness',
            title: 'Maintenance rehearsal complete',
            status: 'Resolved',
            startedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
            summary: 'Last scheduled rehearsal validated the rollback plan and incident playbook.',
            link: 'https://status.gigvora.com/incidents/maintenance-readiness',
          },
        ],
        channels: [
          { id: 'status-page', label: 'Status page' },
          { id: 'trust-centre', label: 'Trust centre' },
          { id: 'slack', label: '#gigvora-ops' },
        ],
        warnings: [
          {
            id: 'warning-notify-apac',
            message: 'Notify APAC success teams before toggling maintenance — late alerts caused churn last quarter.',
            actionLabel: 'Share playbook',
            actionLink: 'https://gigvora.notion.site/maintenance-playbook',
          },
          {
            id: 'warning-sla',
            message: 'Pager duty escalation nearing 12m response SLA. Confirm command rotation availability.',
          },
        ],
        impacts: [
          {
            id: 'impact-feed',
            label: 'Member feed',
            audience: 'Global members',
            severity: 'notice',
            description: 'Stories may refresh slower in EMEA cohorts while cache warming completes.',
            degradation: 0.08,
          },
          {
            id: 'impact-api',
            label: 'Partner API',
            audience: 'Strategic partners',
            severity: 'operational',
            description: 'Monitoring gateway metrics — no impact expected.',
            degradation: 0,
          },
        ],
        escalations: [
          {
            id: 'escalation-postmortem',
            label: 'Draft postmortem template',
            owner: 'Reliability PM',
            dueAt: new Date(now.getTime() + 120 * 60 * 1000),
            link: 'https://gigvora.notion.site/postmortem-template',
          },
          {
            id: 'escalation-sla',
            label: 'Validate vendor failover SLA',
            owner: 'Vendor ops',
            dueAt: new Date(now.getTime() + 240 * 60 * 1000),
          },
        ],
        maintenanceWindow: {
          id: 'window-20240512',
          label: 'Database maintenance window',
          phase: 'scheduled',
          startAt: new Date(now.getTime() + 45 * 60 * 1000),
          endAt: new Date(now.getTime() + 165 * 60 * 1000),
          timezone: 'UTC',
          nextUpdateAt: new Date(now.getTime() + 75 * 60 * 1000),
        },
        feedbackSnapshotId: feedbackId,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert('maintenance_windows', [
      {
        title: 'PostgreSQL minor upgrade',
        owner: 'SRE',
        impact: 'Database cluster',
        startAt: new Date('2024-05-12T22:00:00Z'),
        endAt: new Date('2024-05-12T23:30:00Z'),
        channels: ['status-page', 'email', 'slack'],
        notificationLeadMinutes: 90,
        rollbackPlan: 'Revert to snapshot, failback to standby cluster, notify stakeholders.',
        createdBy: 'ops.bot@gigvora.com',
        updatedBy: 'ops.bot@gigvora.com',
        createdAt: now,
        updatedAt: now,
      },
      {
        title: 'API gateway patch',
        owner: 'Platform Engineering',
        impact: 'Public API',
        startAt: new Date('2024-05-18T06:00:00Z'),
        endAt: new Date('2024-05-18T07:00:00Z'),
        channels: ['status-page', 'in-app'],
        notificationLeadMinutes: 120,
        rollbackPlan: 'Redeploy previous stable build and flush caches.',
        createdBy: 'ops.bot@gigvora.com',
        updatedBy: 'ops.bot@gigvora.com',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('maintenance_broadcast_logs', {
      dispatchedBy: { [Op.like]: '%ops.bot@gigvora.com%' },
    });

    await queryInterface.bulkDelete('maintenance_windows', {
      title: { [Op.in]: ['PostgreSQL minor upgrade', 'API gateway patch'] },
    });

    await queryInterface.bulkDelete('maintenance_operational_snapshots', {
      slug: 'operations-all-systems-operational',
    });

    await queryInterface.bulkDelete('maintenance_feedback_snapshots', {
      reviewUrl: 'https://gigvora.com/ops/feedback',
    });
  },
};
