process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import '../setupTestEnv.js';
import platformStatusRoutes from '../../src/routes/platformStatusRoutes.js';
import platformFeedbackRoutes from '../../src/routes/platformFeedbackRoutes.js';

import {
  PlatformStatusReport,
  PlatformStatusIncident,
  PlatformStatusMaintenance,
  PlatformFeedbackPrompt,
  PlatformFeedbackPromptState,
  PlatformFeedbackResponse,
} from '../../src/models/platformStatusModels.js';

function createTimestamp(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60 * 1000);
}

const app = express();
app.use(express.json());
app.use('/api/platform/status', platformStatusRoutes);
app.use('/api/platform/feedback', platformFeedbackRoutes);

describe('Platform status and feedback routes', () => {
  it('returns operational summary when no reports exist', async () => {
    const response = await request(app).get('/api/platform/status/summary');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      severity: 'operational',
      incidents: [],
      maintenances: [],
    });
  });

  it('surfaces latest report with incidents and maintenance', async () => {
    const report = await PlatformStatusReport.create({
      severity: 'degraded',
      headline: 'Workspace analytics delays',
      summary: 'Investigating elevated latency on analytics refresh.',
      statusPageUrl: 'https://status.test/incidents/analytics',
      source: 'test-suite',
      occurredAt: createTimestamp(-5),
    });

    await PlatformStatusIncident.create({
      reportId: report.id,
      externalId: 'analytics-lag',
      title: 'Analytics ingestion lag',
      status: 'investigating',
      severity: 'degraded',
      impactSummary: 'Executive dashboards may reflect stale numbers for up to 20 minutes.',
      services: ['Analytics API', 'Executive dashboard'],
      startedAt: createTimestamp(-15),
    });

    await PlatformStatusMaintenance.create({
      reportId: report.id,
      externalId: 'billing-window',
      title: 'Billing ledger reconciliation',
      status: 'scheduled',
      impact: 'minor',
      services: ['Billing'],
      startsAt: createTimestamp(60),
      endsAt: createTimestamp(120),
      impactSummary: 'Brief pause in payout statement generation while ledgers reconcile.',
    });

    const response = await request(app).get('/api/platform/status/summary');
    expect(response.status).toBe(200);
    expect(response.body.severity).toBe('degraded');
    expect(response.body.headline).toContain('Workspace analytics delays');
    expect(Array.isArray(response.body.incidents)).toBe(true);
    expect(response.body.incidents[0]).toMatchObject({
      title: 'Analytics ingestion lag',
      severity: 'degraded',
    });
    expect(Array.isArray(response.body.maintenances)).toBe(true);
    expect(response.body.maintenances[0]).toMatchObject({
      title: 'Billing ledger reconciliation',
      status: 'scheduled',
    });
  });

  it('provides feedback pulse eligibility for active prompt', async () => {
    await PlatformFeedbackPrompt.create({
      slug: 'global-platform-health',
      question: 'How is your Gigvora experience going right now?',
      status: 'active',
      channel: 'web',
      responseOptions: [
        { value: 'delighted', label: 'Delighted' },
        { value: 'happy', label: 'Happy' },
      ],
      cooldownHours: 24,
      snoozeMinutes: 120,
      activeFrom: createTimestamp(-10),
    });

    const response = await request(app).get('/api/platform/feedback/pulse/eligibility');
    expect(response.status).toBe(200);
    expect(response.body.eligible).toBe(true);
    expect(response.body.prompt).toBeTruthy();
    expect(response.body.prompt.slug).toBe('global-platform-health');
  });

  it('records feedback pulse submissions and respects cooldowns', async () => {
    const prompt = await PlatformFeedbackPrompt.create({
      slug: 'ops-experience',
      question: 'How confident do you feel about Gigvora today?',
      status: 'active',
      channel: 'web',
      responseOptions: [
        { value: 'delighted', label: 'Delighted' },
        { value: 'neutral', label: 'Neutral' },
      ],
      cooldownHours: 48,
      snoozeMinutes: 240,
      activeFrom: createTimestamp(-5),
    });

    const submitResponse = await request(app)
      .post('/api/platform/feedback/pulse')
      .send({ promptId: prompt.slug, rating: 'delighted', comment: 'Loving the pace of improvements.' });

    expect(submitResponse.status).toBe(201);
    expect(submitResponse.body.response).toMatchObject({ rating: 'delighted' });

    const state = await PlatformFeedbackPromptState.findOne({ where: { promptId: prompt.id } });
    expect(state).toBeTruthy();
    expect(state.lastRating).toBe('delighted');

    const secondAttempt = await request(app)
      .get(`/api/platform/feedback/pulse/eligibility?promptId=${prompt.slug}`);
    expect(secondAttempt.status).toBe(200);
    expect(secondAttempt.body.eligible).toBe(false);
    expect(secondAttempt.body.reason).toBe('snoozed');

    const storedResponse = await PlatformFeedbackResponse.findOne({ where: { promptId: prompt.id } });
    expect(storedResponse).toBeTruthy();
    expect(storedResponse.rating).toBe('delighted');
  });
});
