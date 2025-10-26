'use strict';

const { randomUUID } = require('node:crypto');
const { QueryTypes } = require('sequelize');

const SEED_ORIGIN = 'seed:system-messaging-foundation';

function now() {
  return new Date();
}

async function upsertStatusEvent(queryInterface, transaction, payload) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM system_status_events WHERE event_key = :eventKey LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { eventKey: payload.eventKey } },
  );

  const record = {
    id: existing?.id ?? randomUUID(),
    eventKey: payload.eventKey,
    status: payload.status,
    severity: payload.severity,
    title: payload.title,
    message: payload.message,
    impactedServices: JSON.stringify(payload.impactedServices ?? []),
    metadata: JSON.stringify(payload.metadata ?? []),
    nextSteps: JSON.stringify(payload.nextSteps ?? []),
    actions: JSON.stringify(payload.actions ?? []),
    acknowledgementRequired: payload.acknowledgementRequired ?? false,
    publishedAt: payload.publishedAt ?? now(),
    expiresAt: payload.expiresAt ?? null,
    resolvedAt: payload.resolvedAt ?? null,
    createdById: payload.createdById ?? null,
    updatedById: payload.updatedById ?? null,
    createdAt: payload.createdAt ?? now(),
    updatedAt: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate('system_status_events', record, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert('system_status_events', [record], { transaction });
  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM system_status_events WHERE event_key = :eventKey LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { eventKey: payload.eventKey } },
  );
  return inserted?.id;
}

async function upsertPulseSurvey(queryInterface, transaction, payload) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM feedback_pulse_surveys WHERE pulse_key = :pulseKey LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { pulseKey: payload.pulseKey } },
  );

  const record = {
    id: existing?.id ?? randomUUID(),
    pulseKey: payload.pulseKey,
    status: payload.status ?? 'active',
    question: payload.question,
    description: payload.description ?? null,
    tags: JSON.stringify(payload.tags ?? []),
    segments: JSON.stringify(payload.segments ?? []),
    insights: JSON.stringify(payload.insights ?? []),
    trendLabel: payload.trend?.label ?? 'Satisfaction score',
    trendValue: payload.trend?.value ?? null,
    trendDelta: payload.trend?.delta ?? null,
    trendSampleSize: payload.trend?.sampleSize ?? null,
    responseCount: payload.responseCount ?? 0,
    lastResponseAt: payload.lastResponseAt ?? null,
    metadata: JSON.stringify({ ...(payload.metadata ?? {}), origin: SEED_ORIGIN }),
    createdById: payload.createdById ?? null,
    updatedById: payload.updatedById ?? null,
    createdAt: payload.createdAt ?? now(),
    updatedAt: now(),
  };

  if (existing) {
    await queryInterface.bulkUpdate('feedback_pulse_surveys', record, { id: existing.id }, { transaction });
    return existing.id;
  }

  await queryInterface.bulkInsert('feedback_pulse_surveys', [record], { transaction });
  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM feedback_pulse_surveys WHERE pulse_key = :pulseKey LIMIT 1',
    { transaction, type: QueryTypes.SELECT, replacements: { pulseKey: payload.pulseKey } },
  );
  return inserted?.id;
}

async function insertPulseResponses(queryInterface, transaction, surveyId, responses) {
  if (!surveyId || !responses?.length) {
    return;
  }

  await queryInterface.bulkDelete('feedback_pulse_responses', { survey_id: surveyId }, { transaction });

  await queryInterface.bulkInsert(
    'feedback_pulse_responses',
    responses.map((response) => ({
      id: randomUUID(),
      surveyId,
      userId: response.userId ?? null,
      score: response.score,
      tags: JSON.stringify(response.tags ?? []),
      comment: response.comment ?? null,
      channel: response.channel ?? null,
      metadata: JSON.stringify({ ...(response.metadata ?? {}), origin: SEED_ORIGIN }),
      submittedAt: response.submittedAt ?? now(),
      createdAt: now(),
      updatedAt: now(),
    })),
    { transaction },
  );
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const statusEventId = await upsertStatusEvent(
        queryInterface,
        transaction,
        {
          eventKey: 'platform-observability-green',
          status: 'operational',
          severity: 'low',
          title: 'All systems operational',
          message:
            'Our observability dashboards report healthy response times across the API, realtime messaging, and data ingestion pipelines.',
          impactedServices: ['Realtime Messaging', 'Graph API', 'Analytics Pipelines'],
          nextSteps: [
            'Continue golden-signal sampling throughout the APAC load test.',
            'Share the confidence snapshot in the executive briefing channel.',
          ],
          metadata: [
            { label: 'Last incident', value: '36 days ago' },
            { label: 'Rolling uptime', value: '99.982%' },
            { label: 'Current SLO', value: 'Green' },
          ],
          actions: [
            {
              label: 'View live status dashboard',
              href: 'https://status.gigvora.test',
              variant: 'primary',
            },
            {
              label: 'Review on-call rota',
              href: 'https://ops.gigvora.test/on-call',
              variant: 'secondary',
            },
          ],
          acknowledgementRequired: false,
          publishedAt: now(),
          metadataOrigin: SEED_ORIGIN,
        },
      );

      const pulseSurveyId = await upsertPulseSurvey(
        queryInterface,
        transaction,
        {
          pulseKey: 'executive-product-health',
          status: 'active',
          question: 'How confident are you feeling about this month\'s product direction?',
          description:
            'Score the experience and tag the themes influencing your sentiment so leadership can close any gaps quickly.',
          tags: ['Roadmap clarity', 'Leadership visibility', 'Delivery confidence', 'Enablement support'],
          segments: [
            { id: 'founders', label: 'Founders', value: 82, delta: 3.2 },
            { id: 'mentors', label: 'Mentors', value: 78, delta: 1.4 },
            { id: 'enterprise', label: 'Enterprise customers', value: 71, delta: -2.3 },
          ],
          insights: [
            {
              id: 'ai-highlights',
              title: 'AI workflows exceeded expectations',
              description: 'Mentors cited the new AI pairing assistant as the biggest lift in session prep confidence.',
            },
            {
              id: 'enablement-follow-up',
              title: 'Enterprise enablement needs more depth',
              description: 'Buyers want deeper onboarding to unlock more of the analytics workspace within week one.',
            },
          ],
          trend: { label: 'Executive confidence', value: 83.2, delta: 1.8, sampleSize: 46 },
          responseCount: 0,
          metadata: { origin: SEED_ORIGIN },
        },
      );

      await insertPulseResponses(queryInterface, transaction, pulseSurveyId, [
        {
          userId: 11,
          score: 5,
          tags: ['Delivery confidence', 'Leadership visibility'],
          comment: 'Roadmap reviews feel crisp and the AI updates landed with customers.',
          channel: 'web',
        },
        {
          userId: 14,
          score: 4,
          tags: ['Roadmap clarity'],
          comment: 'Momentum is strong but enterprise onboarding still needs more playbooks.',
          channel: 'mobile',
        },
        {
          userId: 18,
          score: 3,
          tags: ['Enablement support'],
          comment: 'Enablement documentation is improving yet still sparse for customer success teams.',
          channel: 'web',
        },
      ]);

      await queryInterface.bulkUpdate(
        'feedback_pulse_surveys',
        {
          responseCount: 3,
          lastResponseAt: now(),
          trendValue: 4,
          trendSampleSize: 3,
          trendDelta: 0.8,
        },
        { id: pulseSurveyId },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('feedback_pulse_surveys', { pulse_key: 'executive-product-health' });
    await queryInterface.bulkDelete('system_status_events', { event_key: 'platform-observability-green' });
  },
};
