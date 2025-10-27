process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'false';
process.env.LOG_LEVEL = 'silent';
process.env.JWT_SECRET = 'test-secret';

import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import '../setupTestEnv.js';

const serviceModuleUrl = new URL('../../src/services/adminGovernanceService.js', import.meta.url);

const getGovernanceOverviewMock = jest.fn();

let app;

function buildAdminToken(roles = ['admin']) {
  return jwt.sign(
    {
      id: 99,
      type: 'admin',
      roles,
      email: 'governance@gigvora.com',
    },
    process.env.JWT_SECRET,
  );
}

beforeAll(async () => {
  jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({
    __esModule: true,
    getGovernanceOverview: getGovernanceOverviewMock,
  }));

  const expressModule = await import('express');
  const { default: correlationId } = await import('../../src/middleware/correlationId.js');
  const { default: errorHandler } = await import('../../src/middleware/errorHandler.js');
  const { adminRoutes } = await import('../../src/routes/adminRoutes.js');

  const express = expressModule.default;
  app = express();
  app.use(express.json());
  app.use(correlationId());
  app.use('/api/admin', adminRoutes);
  app.use(errorHandler);
});

beforeEach(() => {
  getGovernanceOverviewMock.mockReset();
});

describe('GET /api/admin/governance/overview', () => {
  it('returns governance overview payload', async () => {
    const mockPayload = {
      generatedAt: new Date('2025-10-10T09:45:00Z').toISOString(),
      lookbackDays: 14,
      contentQueue: {
        summary: { total: 5, awaitingReview: 3, highSeverity: 2, urgent: 1 },
        topSubmissions: [],
      },
      legalPolicies: {
        totals: { totalDocuments: 4, activeDocuments: 3, draftDocuments: 1, archivedDocuments: 0 },
        versionTotals: { drafts: 1, inReview: 1, approved: 0, published: 3, archived: 0 },
        upcomingEffective: [],
        recentPublications: [],
        auditTrail: [],
      },
      activity: [],
    };

    getGovernanceOverviewMock.mockResolvedValue(mockPayload);

    const response = await request(app)
      .get('/api/admin/governance/overview')
      .query({ lookbackDays: 14, queueLimit: 6, timelineLimit: 8 })
      .set('Authorization', `Bearer ${buildAdminToken(['admin', 'compliance'])}`)
      .set('x-roles', 'admin,compliance');

    expect(response.status).toBe(200);
    expect(getGovernanceOverviewMock).toHaveBeenCalledWith({
      lookbackDays: 14,
      queueLimit: 6,
      publicationLimit: undefined,
      timelineLimit: 8,
    });
    expect(response.body.lookbackDays).toBe(14);
    expect(response.body.contentQueue.summary.total).toBe(5);
  });

  it('rejects invalid lookback queries', async () => {
    const response = await request(app)
      .get('/api/admin/governance/overview')
      .query({ lookbackDays: 400 })
      .set('Authorization', `Bearer ${buildAdminToken()}`)
      .set('x-roles', 'admin');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(getGovernanceOverviewMock).not.toHaveBeenCalled();
  });
});
