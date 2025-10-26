'use strict';

const SNAPSHOT_ID = '1b3b6b4b-9d45-4c17-8f9f-18f26afef010';
const METRIC_IDS = {
  engagementRate: '2f5cdd20-1d0e-47f4-9a4d-6756cd792401',
  conversionRate: '0b51b1da-66c8-4cc0-a180-ef4b82f8e702',
};
const VIEW_ID = '7e2a4c0b-56b2-41ab-9c28-257630f6d203';
const ALERT_ID = '3c7dcd4f-6aaf-4f0c-8c4f-6bcba3f8d204';
const AUDIT_IDS = ['9f2a6c0d-88be-49c0-a2f9-73f033d4f501', '4b7f20a1-164d-44de-ac1a-6e62847ff502'];
const SUMMARY_ID = '5c9eac18-a5a0-4f9a-9447-1a792c4d7503';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();

      await queryInterface.bulkInsert(
        'monitoring_insight_snapshots',
        [
          {
            id: SNAPSHOT_ID,
            timeframe: '14d',
            captured_at: new Date('2024-06-01T12:00:00Z'),
            total_reach: 128903,
            total_reach_delta: 0.12,
            engagement_rate: 0.41,
            engagement_rate_delta: 0.08,
            conversion_lift: 0.27,
            conversion_lift_delta: 0.05,
            anomaly_coverage: 0.9,
            anomaly_coverage_delta: 0.15,
            timeline: JSON.stringify([
              { capturedAt: '2024-05-20', value: 0.2 },
              { capturedAt: '2024-05-25', value: 0.24 },
              { capturedAt: '2024-05-30', value: 0.3 },
            ]),
            personas: JSON.stringify([
              {
                key: 'creators',
                label: 'Creators',
                engagementRate: 0.56,
                conversionRate: 0.31,
                adoptionRate: 0.72,
                delta: { engagementRate: 0.12, conversionRate: 0.08 },
                headline: 'Creators are accelerating adoption',
                story: 'Creators responded to the latest spotlight with record uplift.',
              },
              {
                key: 'mentors',
                label: 'Mentors',
                engagementRate: 0.33,
                conversionRate: 0.21,
                adoptionRate: 0.58,
                delta: { engagementRate: 0.04, conversionRate: -0.03 },
                headline: 'Mentor cohorts need follow-up prompts',
                story: 'Mentors slowed outreach after the compliance policy update.',
              },
            ]),
            anomalies: JSON.stringify([
              {
                id: 'anomaly-1',
                title: 'Drop in mentorship completions',
                description: 'Mentorship cohorts dipped 12% week over week.',
                severity: 'high',
                timestamp: new Date('2024-05-31T08:00:00Z').toISOString(),
                metric: 'Mentorship completion',
                impact: 0.12,
                population: 'Mentorship cohort',
              },
            ]),
            roadmap: JSON.stringify([
              {
                id: 'roadmap-1',
                title: 'Launch mentor concierge',
                description: 'Pair mentors with curated prompts to reduce drop-off.',
                impactScore: 9.4,
                owner: 'Operations',
                targetDate: '2024-07-15',
              },
              {
                id: 'roadmap-2',
                title: 'Creator advocacy playbook',
                description: 'Blend narrative prompts with spotlight modules to sustain engagement.',
                impactScore: 8.7,
                owner: 'Growth',
                targetDate: '2024-07-30',
              },
            ]),
            narratives: JSON.stringify([
              {
                headline: 'Momentum is surging',
                body: 'Leadership sees a 3x uplift in campaign resonance following the story-driven rollouts.',
              },
              {
                headline: 'Ops pacing remains tight',
                body: 'Onboarding teams are resolving incidents within 35 minutes on average.',
              },
            ]),
            journeys: JSON.stringify([
              {
                stage: 'Awareness',
                conversionRate: 0.45,
                medianDuration: '3d',
                narrative: 'Ads and organic spotlights provide fast traction.',
              },
              {
                stage: 'Activation',
                conversionRate: 0.31,
                medianDuration: '4d',
                narrative: 'Mentor invites and nurture cadences must tighten to remove friction.',
              },
            ]),
            qa: JSON.stringify({ sourceCount: 12, trustScore: 0.98, notes: 'Validated with Mixpanel, CRM, and finance exports.' }),
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'monitoring_metrics',
        [
          {
            id: METRIC_IDS.engagementRate,
            metric_key: 'engagementRate',
            label: 'Engagement rate',
            value: 0.41,
            delta: 0.05,
            sample_size: 9302,
            narrative: 'High intent cohorts are engaging with story-led narratives.',
            sparkline: JSON.stringify([
              { capturedAt: '2024-05-20', value: 0.2 },
              { capturedAt: '2024-05-25', value: 0.24 },
              { capturedAt: '2024-05-30', value: 0.28 },
              { capturedAt: '2024-06-01', value: 0.41 },
            ]),
            tags: JSON.stringify(['storytelling', 'journey']),
            persona: 'creators',
            persona_label: 'Creators',
            channel: 'email',
            channel_label: 'Email',
            timeframe: '14d',
            compare_to: 'previous_period',
            include_benchmarks: true,
            created_at: now,
            updated_at: now,
          },
          {
            id: METRIC_IDS.conversionRate,
            metric_key: 'conversionRate',
            label: 'Conversion rate',
            value: 0.29,
            delta: -0.03,
            sample_size: 5582,
            narrative: 'Conversion lags due to missing nurture follow-ups.',
            sparkline: JSON.stringify([
              { capturedAt: '2024-05-20', value: 0.32 },
              { capturedAt: '2024-05-25', value: 0.31 },
              { capturedAt: '2024-05-30', value: 0.3 },
              { capturedAt: '2024-06-01', value: 0.29 },
            ]),
            tags: JSON.stringify(['nurture', 'conversion']),
            persona: 'creators',
            persona_label: 'Creators',
            channel: 'email',
            channel_label: 'Email',
            timeframe: '14d',
            compare_to: 'previous_period',
            include_benchmarks: true,
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'monitoring_metric_alerts',
        [
          {
            id: ALERT_ID,
            metric_key: 'conversionRate',
            title: 'Conversion threshold breached',
            description: 'Conversion dropped below the 30% guardrail.',
            status: 'at_risk',
            threshold: 0.3,
            value: 0.29,
            severity: 'high',
            timeframe: '14d',
            persona: 'creators',
            channel: 'email',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'monitoring_metric_views',
        [
          {
            id: VIEW_ID,
            name: 'Executive daily pulse',
            timeframe: '14d',
            query: JSON.stringify({
              timeframe: '14d',
              metric: 'engagementRate',
              persona: 'creators',
              channel: 'email',
              compareTo: 'previous_period',
              includeBenchmarks: true,
              search: '',
            }),
            created_by: 'ops.system',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'monitoring_audit_events',
        [
          {
            id: AUDIT_IDS[0],
            severity: 'high',
            action: 'policy.updated',
            summary: 'Updated consent document for EU markets',
            actor_name: 'Sonia Malik',
            actor_type: 'compliance_manager',
            resource_key: 'policy-12',
            resource_label: 'Consent policy',
            resource_type: 'policy',
            occurred_at: new Date('2024-06-01T10:00:00Z'),
            metadata: JSON.stringify({ version: 4, locale: 'en-GB', responseMinutes: 28 }),
            related_incidents: JSON.stringify([
              {
                id: 'incident-4',
                title: 'Consent review',
                status: 'resolved',
                openedAt: new Date('2024-05-28T10:00:00Z').toISOString(),
              },
            ]),
            created_at: now,
            updated_at: now,
          },
          {
            id: AUDIT_IDS[1],
            severity: 'medium',
            action: 'workflow.published',
            summary: 'Published new creator onboarding nurture sequence',
            actor_name: 'Marcel Ortiz',
            actor_type: 'operations_lead',
            resource_key: 'workflow-98',
            resource_label: 'Creator onboarding',
            resource_type: 'workflow',
            occurred_at: new Date('2024-05-30T09:00:00Z'),
            metadata: JSON.stringify({ version: 3, rollout: 'phase-two', responseMinutes: 36 }),
            related_incidents: JSON.stringify([]),
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'monitoring_audit_summaries',
        [
          {
            id: SUMMARY_ID,
            timeframe: '14d',
            total_events: 28,
            critical_events: 2,
            median_response_minutes: 32,
            compliance_posture: 'Compliance posture: excellent',
            residual_risk_narrative: 'Review webhook verification before next release.',
            created_at: now,
            updated_at: now,
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('monitoring_audit_summaries', { id: SUMMARY_ID }, { transaction });
      await queryInterface.bulkDelete('monitoring_audit_events', { id: AUDIT_IDS }, { transaction });
      await queryInterface.bulkDelete('monitoring_metric_views', { id: VIEW_ID }, { transaction });
      await queryInterface.bulkDelete('monitoring_metric_alerts', { id: ALERT_ID }, { transaction });
      await queryInterface.bulkDelete('monitoring_metrics', { id: [METRIC_IDS.engagementRate, METRIC_IDS.conversionRate] }, { transaction });
      await queryInterface.bulkDelete('monitoring_insight_snapshots', { id: SNAPSHOT_ID }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
