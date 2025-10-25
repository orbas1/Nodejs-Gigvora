process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';

import request from 'supertest';
import { app } from '../../src/app.js';
import '../setupTestEnv.js';
import { DomainGovernanceReview } from '../../src/models/index.js';

describe('domain governance routes', () => {
  const seededReview = {
    contextName: 'auth',
    ownerTeam: 'Identity & Access Engineering',
    dataSteward: 'Security & Compliance',
    reviewStatus: 'remediation_required',
    reviewedAt: new Date('2024-03-15T09:00:00Z'),
    nextReviewDueAt: new Date('2024-07-15T09:00:00Z'),
    scorecard: { automationCoverage: 0.82, remediationItems: 2 },
    notes: 'Fixture to assert HTTP governance responses.',
  };

  beforeEach(async () => {
    await DomainGovernanceReview.sync();
    await DomainGovernanceReview.destroy({ where: {} });
  });

  it('returns governance summaries merged with review metadata', async () => {
    await DomainGovernanceReview.create(seededReview);

    const response = await request(app).get('/api/domains/governance');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.contexts)).toBe(true);

    const authSummary = response.body.contexts.find(
      (context) => context.contextName === 'auth',
    );

    expect(authSummary).toBeDefined();
    expect(authSummary).toMatchObject({
      contextName: 'auth',
      ownerTeam: 'Identity & Access Engineering',
      dataSteward: 'Security & Compliance',
      reviewStatus: 'remediation_required',
      remediationItems: 2,
    });
    expect(authSummary.generatedAt).toBeUndefined();
    expect(typeof response.body.generatedAt).toBe('string');
  });

  it('returns governance detail with merged metadata and review record', async () => {
    await DomainGovernanceReview.create(seededReview);

    const response = await request(app).get('/api/domains/auth/governance');

    expect(response.status).toBe(200);
    expect(response.body.context).toMatchObject({
      name: 'auth',
      displayName: expect.any(String),
    });
    expect(response.body.review).toMatchObject({
      reviewStatus: 'remediation_required',
      ownerTeam: 'Identity & Access Engineering',
      dataSteward: 'Security & Compliance',
    });
    expect(Array.isArray(response.body.models)).toBe(true);
    expect(response.body.models.length).toBeGreaterThan(0);
    expect(response.body.piiFieldCount).toBeGreaterThan(0);
  });

  it('returns 404 when requesting a governance detail for an unknown context', async () => {
    const response = await request(app).get('/api/domains/unknown/governance');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      message: expect.stringContaining('No domain context registered as'),
      requestId: expect.any(String),
    });
  });
});
