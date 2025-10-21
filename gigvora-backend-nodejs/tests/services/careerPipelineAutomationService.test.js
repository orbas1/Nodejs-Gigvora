import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

describe('careerPipelineAutomationService', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsModulePath = pathToFileURL(path.resolve(__dirname, '../../src/models/index.js')).pathname;
  const cacheModulePath = pathToFileURL(path.resolve(__dirname, '../../src/utils/cache.js')).pathname;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns a skeleton automation payload when the user has no board', async () => {
    const boardFindAll = jest.fn().mockResolvedValue([]);

    await jest.unstable_mockModule(modelsModulePath, () => ({
      CareerPipelineBoard: { findAll: boardFindAll },
      CareerPipelineStage: { findAll: jest.fn() },
      CareerOpportunity: { findAll: jest.fn() },
      CareerOpportunityCollaborator: { findAll: jest.fn() },
      CareerOpportunityNudge: { findAll: jest.fn() },
      CareerCandidateBrief: { findAll: jest.fn().mockResolvedValue([]) },
      CareerInterviewWorkspace: { findAll: jest.fn().mockResolvedValue([]) },
      CareerInterviewTask: { findAll: jest.fn().mockResolvedValue([]) },
      CareerInterviewScorecard: { findAll: jest.fn().mockResolvedValue([]) },
      CareerOfferPackage: { findAll: jest.fn().mockResolvedValue([]) },
      CareerOfferScenario: { findAll: jest.fn().mockResolvedValue([]) },
      CareerOfferDocument: { findAll: jest.fn().mockResolvedValue([]) },
      CareerAutoApplyRule: { findAll: jest.fn().mockResolvedValue([]) },
      CareerAutoApplyTestRun: { findAll: jest.fn().mockResolvedValue([]) },
      CareerAutoApplyAnalytics: { findAll: jest.fn().mockResolvedValue([]) },
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: {
        remember: (_key, _ttl, loader) => loader(),
      },
      buildCacheKey: (_namespace, parts) => `cache:${parts.userId}`,
    }));

    const { getCareerPipelineAutomation } = await import('../../src/services/careerPipelineAutomationService.js');

    const result = await getCareerPipelineAutomation(42);

    expect(result.board).toBeNull();
    expect(result.autoApply.rules).toEqual([]);
    expect(result.bulkOperations.reminders).toEqual([]);
    expect(result.kanban.metrics.totalOpportunities).toBe(0);
    expect(boardFindAll).toHaveBeenCalledWith({
      where: { userId: 42 },
      order: expect.any(Array),
      limit: 1,
    });
  });

  it('enriches the automation payload with stage metrics, reminders, and guardrails', async () => {
    const now = new Date('2024-01-01T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    const makeRecord = (payload) => ({
      toPublicObject: () => ({ ...payload }),
    });

    const stages = [
      makeRecord({ id: 1, key: 'applied', name: 'Applied', stageType: 'application', slaHours: 24 }),
      makeRecord({ id: 2, key: 'interview', name: 'Interview', stageType: 'interview', slaHours: 72 }),
    ];

    const opportunities = [
      makeRecord({
        id: 100,
        title: 'Senior Engineer',
        companyName: 'Acme',
        location: 'Remote',
        salary: '120k',
        stageId: 1,
        stageEnteredAt: new Date(now.getTime() - 60 * 60 * 1000 * 30).toISOString(),
        followUpStatus: 'overdue',
        nextActionDueAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        lastActivityAt: new Date(now.getTime() - 60 * 60 * 1000 * 3).toISOString(),
        stageType: 'application',
        researchSummary: 'Focus on new infra.',
        researchLinks: ['https://acme.example/job'],
        attachments: [],
        collaboratorNotes: 'Call the hiring manager',
        complianceStatus: 'flagged',
        equalOpportunityReport: {
          submittedAt: new Date(now.getTime() - 60 * 60 * 1000 * 10).toISOString(),
          metrics: { diversityScore: 87 },
        },
      }),
      makeRecord({
        id: 101,
        title: 'Product Lead',
        companyName: 'Globex',
        location: 'Berlin',
        salary: '140k',
        stageId: 2,
        stageEnteredAt: new Date(now.getTime() - 60 * 60 * 1000 * 5).toISOString(),
        followUpStatus: 'on_track',
        nextActionDueAt: new Date(now.getTime() + 60 * 60 * 1000 * 12).toISOString(),
        lastActivityAt: new Date(now.getTime() - 60 * 60 * 1000 * 2).toISOString(),
        stageType: 'interview',
        complianceStatus: 'complete',
        equalOpportunityReport: {
          submittedAt: new Date(now.getTime() - 60 * 60 * 1000 * 20).toISOString(),
          metrics: { diversityScore: 91 },
        },
      }),
    ];

    const collaboratorForOpportunity = makeRecord({
      id: 10,
      opportunityId: 100,
      name: 'Recruiter Jane',
      email: 'jane@example.com',
    });

    const nudgeForOpportunity = makeRecord({
      id: 20,
      opportunityId: 100,
      triggeredAt: now.toISOString(),
      message: 'Ping the hiring manager',
    });

    const brief = makeRecord({
      id: 30,
      opportunityId: 100,
      shareCode: 'share-123',
      summary: 'Key deliverables',
    });

    const workspace = makeRecord({
      id: 40,
      userId: 42,
      status: 'scheduled',
      prepChecklist: [{ label: 'Review JD', completed: true }],
      aiPrompts: ['How can I impress the panel?'],
    });

    const workspaceTask = makeRecord({
      id: 41,
      workspaceId: 40,
      dueAt: new Date(now.getTime() + 60 * 60 * 1000 * 6).toISOString(),
      title: 'Draft thank-you note',
      status: 'pending',
    });

    const workspaceScorecard = makeRecord({
      id: 42,
      workspaceId: 40,
      overallScore: 4.5,
      recommendation: 'hire',
    });

    const offerPackage = makeRecord({
      id: 50,
      userId: 42,
      status: 'accepted',
      totalCompValue: 160000,
    });

    const offerScenario = makeRecord({
      id: 51,
      packageId: 50,
      scenarioType: 'base',
    });

    const offerDocument = makeRecord({
      id: 52,
      packageId: 50,
      documentType: 'offer_letter',
    });

    const autoApplyRule = makeRecord({
      id: 60,
      requiresManualReview: true,
      premiumRoleGuardrail: true,
    });

    const autoApplyRun = makeRecord({
      id: 61,
      ruleId: 60,
      executedAt: now.toISOString(),
    });

    const autoApplyAnalytics = makeRecord({
      id: 62,
      ruleId: 60,
      windowEnd: now.toISOString(),
      totalMatches: 3,
    });

    const rememberSpy = jest.fn((_key, _ttl, loader) => loader());

    await jest.unstable_mockModule(modelsModulePath, () => ({
      CareerPipelineBoard: {
        findAll: jest.fn().mockResolvedValue([
          {
            id: 1,
            userId: 42,
            toPublicObject: () => ({ id: 1, name: 'Primary', userId: 42 }),
          },
        ]),
      },
      CareerPipelineStage: { findAll: jest.fn().mockResolvedValue(stages) },
      CareerOpportunity: { findAll: jest.fn().mockResolvedValue(opportunities) },
      CareerOpportunityCollaborator: { findAll: jest.fn().mockResolvedValue([collaboratorForOpportunity]) },
      CareerOpportunityNudge: { findAll: jest.fn().mockResolvedValue([nudgeForOpportunity]) },
      CareerCandidateBrief: { findAll: jest.fn().mockResolvedValue([brief]) },
      CareerInterviewWorkspace: { findAll: jest.fn().mockResolvedValue([workspace]) },
      CareerInterviewTask: { findAll: jest.fn().mockResolvedValue([workspaceTask]) },
      CareerInterviewScorecard: { findAll: jest.fn().mockResolvedValue([workspaceScorecard]) },
      CareerOfferPackage: { findAll: jest.fn().mockResolvedValue([offerPackage]) },
      CareerOfferScenario: { findAll: jest.fn().mockResolvedValue([offerScenario]) },
      CareerOfferDocument: { findAll: jest.fn().mockResolvedValue([offerDocument]) },
      CareerAutoApplyRule: { findAll: jest.fn().mockResolvedValue([autoApplyRule]) },
      CareerAutoApplyTestRun: { findAll: jest.fn().mockResolvedValue([autoApplyRun]) },
      CareerAutoApplyAnalytics: { findAll: jest.fn().mockResolvedValue([autoApplyAnalytics]) },
    }));

    await jest.unstable_mockModule(cacheModulePath, () => ({
      appCache: { remember: rememberSpy },
      buildCacheKey: (_namespace, parts) => `pipeline:${parts.userId}`,
    }));

    const { getCareerPipelineAutomation } = await import('../../src/services/careerPipelineAutomationService.js');

    const result = await getCareerPipelineAutomation(42);

    expect(rememberSpy).toHaveBeenCalledWith('pipeline:42', 60, expect.any(Function));
    expect(result.kanban.metrics.totalOpportunities).toBe(2);
    expect(result.kanban.metrics.overdueOpportunities).toBe(1);
    expect(result.bulkOperations.reminders[0]).toMatchObject({
      opportunityId: 100,
      severity: 'critical',
    });
    expect(result.interviewCommandCenter.readiness).toEqual({ totalItems: 1, completedItems: 1 });
    expect(result.offerVault.metrics).toMatchObject({ acceptedOffers: 1, activeOffers: 0, declinedOffers: 0 });
    expect(result.autoApply.guardrails).toEqual({ manualReviewRequired: 1, premiumProtected: 1 });
    expect(result.autoApply.rules[0].analytics).toHaveLength(1);
    expect(result.candidateBriefs[0].shareUrl).toContain('share-123');

    jest.useRealTimers();
  });
});
