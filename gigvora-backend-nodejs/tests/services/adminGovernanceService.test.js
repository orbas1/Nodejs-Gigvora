import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const contentServiceModule = new URL('../../src/services/contentGovernanceService.js', import.meta.url);
const legalPolicyServiceModule = new URL('../../src/services/legalPolicyService.js', import.meta.url);
const contentModelsModule = new URL('../../src/models/contentGovernanceModels.js', import.meta.url);
const legalModelsModule = new URL('../../src/models/legalDocumentModels.js', import.meta.url);

const listContentSubmissionsMock = jest.fn();
const listLegalDocumentsMock = jest.fn();
const moderationFindAllMock = jest.fn();
const auditFindAllMock = jest.fn();

let getGovernanceOverview;

beforeAll(async () => {
  jest.unstable_mockModule(contentServiceModule.pathname, () => ({
    __esModule: true,
    listContentSubmissions: listContentSubmissionsMock,
  }));
  jest.unstable_mockModule(legalPolicyServiceModule.pathname, () => ({
    __esModule: true,
    listLegalDocuments: listLegalDocumentsMock,
  }));
  jest.unstable_mockModule(contentModelsModule.pathname, () => ({
    __esModule: true,
    GovernanceModerationAction: { findAll: moderationFindAllMock },
    GovernanceContentSubmission: class GovernanceContentSubmission {},
  }));
  jest.unstable_mockModule(legalModelsModule.pathname, () => ({
    __esModule: true,
    LegalDocument: class LegalDocument {},
    LegalDocumentVersion: class LegalDocumentVersion {},
    LegalDocumentAuditEvent: { findAll: auditFindAllMock },
  }));

  ({ getGovernanceOverview } = await import('../../src/services/adminGovernanceService.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('adminGovernanceService.getGovernanceOverview', () => {
  it('aggregates content queue, policy data, and activity timeline', async () => {
    listContentSubmissionsMock.mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Launch announcement review',
          summary: 'Confirm assets and disclosures.',
          referenceType: 'community_post',
          referenceId: 'post-42',
          status: 'pending',
          priority: 'urgent',
          severity: 'high',
          submittedAt: '2025-10-10T08:00:00Z',
          lastActivityAt: '2025-10-10T09:00:00Z',
          assignedTeam: 'Integrity Squad',
        },
        {
          id: 2,
          title: 'Profile update audit',
          referenceType: 'company_profile_update',
          referenceId: 'profile-204',
          status: 'in_review',
          priority: 'high',
          severity: 'medium',
          submittedAt: '2025-10-09T15:00:00Z',
          lastActivityAt: '2025-10-10T07:45:00Z',
          assignedTeam: 'Policy Desk',
        },
      ],
      summary: {
        total: 2,
        awaitingReview: 2,
        highSeverity: 1,
        urgent: 1,
      },
      pagination: { page: 1, pageSize: 6, totalItems: 2, totalPages: 1 },
    });

    moderationFindAllMock.mockResolvedValue([
      {
        id: 101,
        submissionId: 1,
        action: 'approve',
        severity: 'high',
        priority: 'urgent',
        status: 'approved',
        reason: 'Meets disclosure requirements.',
        resolutionSummary: null,
        actorId: '88',
        actorType: 'admin',
        createdAt: '2025-10-10T09:30:00Z',
        submission: {
          id: 1,
          title: 'Launch announcement review',
          referenceType: 'community_post',
          referenceId: 'post-42',
          status: 'pending',
          priority: 'urgent',
          severity: 'high',
          submittedAt: '2025-10-10T08:00:00Z',
          lastActivityAt: '2025-10-10T09:00:00Z',
        },
      },
    ]);

    listLegalDocumentsMock.mockResolvedValue([
      {
        id: 301,
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        status: 'active',
        versions: [
          {
            id: 501,
            documentId: 301,
            version: 4,
            locale: 'en',
            status: 'published',
            publishedAt: '2025-10-09T11:00:00Z',
            effectiveAt: '2025-10-15T00:00:00Z',
          },
          {
            id: 502,
            documentId: 301,
            version: 5,
            locale: 'en',
            status: 'in_review',
            effectiveAt: '2025-10-20T00:00:00Z',
          },
        ],
      },
      {
        id: 302,
        slug: 'cookie-policy',
        title: 'Cookie Policy',
        status: 'draft',
        versions: [
          {
            id: 601,
            documentId: 302,
            version: 2,
            locale: 'en',
            status: 'draft',
          },
        ],
      },
    ]);

    auditFindAllMock.mockResolvedValue([
      {
        id: 901,
        documentId: 301,
        action: 'version.published',
        actorId: '55',
        actorType: 'admin',
        createdAt: '2025-10-09T11:05:00Z',
        metadata: { summary: 'Published global privacy policy refresh.' },
        document: { title: 'Privacy Policy' },
        version: { version: 4, locale: 'en' },
      },
    ]);

    const overview = await getGovernanceOverview({
      lookbackDays: 7,
      queueLimit: 5,
      publicationLimit: 3,
      timelineLimit: 5,
    });

    expect(listContentSubmissionsMock).toHaveBeenCalledWith({ page: 1, pageSize: 5 });
    expect(overview.contentQueue.summary.total).toBe(2);
    expect(overview.contentQueue.topSubmissions).toHaveLength(2);
    expect(overview.legalPolicies.totals.totalDocuments).toBe(2);
    expect(overview.legalPolicies.totals.activeDocuments).toBe(1);
    expect(overview.legalPolicies.versionTotals.inReview).toBe(1);
    expect(overview.legalPolicies.versionTotals.drafts).toBe(1);
    expect(overview.legalPolicies.upcomingEffective[0]).toMatchObject({ documentId: 301, version: 4 });
    expect(overview.legalPolicies.recentPublications[0]).toMatchObject({ version: 4 });
    expect(overview.activity).toHaveLength(2);
    expect(overview.activity[0].type).toBe('content');
    expect(overview.activity[1].type).toBe('policy');
  });
});
