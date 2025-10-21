process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import { jest } from '@jest/globals';

const loggerModuleUrl = new URL('../src/utils/logger.js', import.meta.url);

const loggerMock = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnValue({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
};

jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
  default: loggerMock,
}));

const financeServiceUrl = new URL('../src/services/adminFinanceService.js', import.meta.url);
const identityServiceUrl = new URL('../src/services/adminIdentityVerificationService.js', import.meta.url);
const jobApplicationServiceUrl = new URL('../src/services/adminJobApplicationService.js', import.meta.url);
const jobPostServiceUrl = new URL('../src/services/adminJobPostService.js', import.meta.url);
const mentoringServiceUrl = new URL('../src/services/adminMentoringService.js', import.meta.url);
const messagingServiceUrl = new URL('../src/services/adminMessagingService.js', import.meta.url);
const moderationServiceUrl = new URL('../src/services/communityModerationService.js', import.meta.url);
const profileServiceUrl = new URL('../src/services/adminProfileService.js', import.meta.url);
const projectServiceUrl = new URL('../src/services/adminProjectManagementService.js', import.meta.url);
const runtimeServiceUrl = new URL('../src/services/runtimeMaintenanceService.js', import.meta.url);
const siteServiceUrl = new URL('../src/services/siteManagementService.js', import.meta.url);
const speedNetworkingServiceUrl = new URL('../src/services/adminSpeedNetworkingService.js', import.meta.url);
const storageServiceUrl = new URL('../src/services/storageManagementService.js', import.meta.url);
const timelineServiceUrl = new URL('../src/services/adminTimelineService.js', import.meta.url);

const financeMocks = {
  createPayoutSchedule: jest.fn().mockResolvedValue({ id: 5 }),
  updatePayoutSchedule: jest.fn(),
  deletePayoutSchedule: jest.fn(),
  createFeeRule: jest.fn().mockResolvedValue({ id: 9 }),
  getAdminFinanceDashboard: jest.fn(),
  upsertTreasuryPolicy: jest.fn(),
  updateFeeRule: jest.fn(),
  deleteFeeRule: jest.fn(),
  createEscrowAdjustment: jest.fn(),
  updateEscrowAdjustment: jest.fn(),
  deleteEscrowAdjustment: jest.fn(),
};

jest.unstable_mockModule(financeServiceUrl.pathname, () => financeMocks);

const identityMocks = {
  getIdentityVerificationById: jest.fn(),
  createIdentityVerification: jest.fn(),
  updateIdentityVerification: jest.fn().mockResolvedValue({ id: 44 }),
  createIdentityVerificationEvent: jest.fn(),
  getIdentityVerificationSettings: jest.fn(),
  updateIdentityVerificationSettings: jest.fn(),
};

jest.unstable_mockModule(identityServiceUrl.pathname, () => identityMocks);

const jobApplicationMocks = {
  createJobApplication: jest.fn().mockResolvedValue({ id: 77 }),
  updateJobApplication: jest.fn(),
  deleteJobApplication: jest.fn(),
  createJobApplicationNote: jest.fn(),
  deleteJobApplicationNote: jest.fn(),
};

jest.unstable_mockModule(jobApplicationServiceUrl.pathname, () => jobApplicationMocks);

const jobPostMocks = {
  deleteJobPost: jest.fn().mockResolvedValue({ id: 81 }),
  listJobPosts: jest.fn(),
  getJobPost: jest.fn(),
  createJobPost: jest.fn(),
  updateJobPost: jest.fn(),
  publishJobPost: jest.fn(),
  archiveJobPost: jest.fn(),
};

jest.unstable_mockModule(jobPostServiceUrl.pathname, () => jobPostMocks);

const mentoringMocks = {
  createActionItem: jest.fn().mockResolvedValue({ id: 10 }),
};

jest.unstable_mockModule(mentoringServiceUrl.pathname, () => ({
  fetchMentoringCatalog: jest.fn(),
  listMentoringSessions: jest.fn(),
  getMentoringSession: jest.fn(),
  createMentoringSession: jest.fn(),
  updateMentoringSession: jest.fn(),
  createSessionNote: jest.fn(),
  updateSessionNote: jest.fn(),
  deleteSessionNote: jest.fn(),
  ...mentoringMocks,
  updateActionItem: jest.fn(),
  deleteActionItem: jest.fn(),
}));

const messagingMocks = {
  createAdminThread: jest.fn().mockResolvedValue({ id: 120 }),
  sendAdminMessage: jest.fn(),
  updateAdminThreadState: jest.fn(),
  escalateAdminThread: jest.fn(),
  assignAdminSupportAgent: jest.fn(),
  updateAdminSupportStatus: jest.fn(),
  setThreadLabels: jest.fn(),
  listAdminThreads: jest.fn(),
  getAdminThread: jest.fn(),
  listAdminThreadMessages: jest.fn(),
  listMessageLabels: jest.fn(),
  createMessageLabel: jest.fn(),
  updateMessageLabel: jest.fn(),
  deleteMessageLabel: jest.fn(),
  listSupportAgents: jest.fn(),
};

jest.unstable_mockModule(messagingServiceUrl.pathname, () => messagingMocks);

const moderationMocks = {
  resolveModerationEvent: jest.fn().mockResolvedValue({ id: 3 }),
  getModerationOverview: jest.fn(),
  listModerationQueue: jest.fn(),
  listModerationEvents: jest.fn(),
};

jest.unstable_mockModule(moderationServiceUrl.pathname, () => moderationMocks);

const profileMocks = {
  deleteNote: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  createReference: jest.fn(),
  updateReference: jest.fn(),
  deleteReference: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  listProfiles: jest.fn(),
  getProfile: jest.fn(),
};

jest.unstable_mockModule(profileServiceUrl.pathname, () => profileMocks);

const projectMocks = {
  createProjectMilestone: jest.fn().mockResolvedValue({ id: 15 }),
};

jest.unstable_mockModule(projectServiceUrl.pathname, () => ({
  getProjectPortfolioSnapshot: jest.fn(),
  getProjectPortfolioSummary: jest.fn(),
  getProjectDetail: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  updateProjectWorkspace: jest.fn(),
  updateProjectMilestone: jest.fn(),
  deleteProjectMilestone: jest.fn(),
  createProjectCollaborator: jest.fn(),
  updateProjectCollaborator: jest.fn(),
  deleteProjectCollaborator: jest.fn(),
  createProjectIntegration: jest.fn(),
  updateProjectIntegration: jest.fn(),
  deleteProjectIntegration: jest.fn(),
  createProjectAsset: jest.fn(),
  deleteProjectAsset: jest.fn(),
  createProjectRetrospective: jest.fn(),
  ...projectMocks,
}));

const runtimeMocks = {
  updateAnnouncementStatus: jest.fn().mockResolvedValue({ id: 88, status: 'active' }),
  listAnnouncements: jest.fn(),
  createAnnouncement: jest.fn(),
  updateAnnouncement: jest.fn(),
  getAnnouncement: jest.fn(),
};

jest.unstable_mockModule(runtimeServiceUrl.pathname, () => runtimeMocks);

const siteMocks = {
  saveSiteSettings: jest.fn().mockResolvedValue({ ok: true }),
  createSitePage: jest.fn().mockResolvedValue({ id: 111 }),
  updateSitePageById: jest.fn(),
  deleteSitePageById: jest.fn(),
  createNavigation: jest.fn(),
  updateNavigation: jest.fn(),
  deleteNavigation: jest.fn(),
  getSiteManagementOverview: jest.fn(),
};

jest.unstable_mockModule(siteServiceUrl.pathname, () => siteMocks);

const speedNetworkingMocks = {
  createSpeedNetworkingSession: jest.fn().mockResolvedValue({ id: 222 }),
  updateSpeedNetworkingSession: jest.fn(),
  deleteSpeedNetworkingSession: jest.fn(),
  createSpeedNetworkingParticipant: jest.fn().mockResolvedValue({ id: 333 }),
  updateSpeedNetworkingParticipant: jest.fn(),
  deleteSpeedNetworkingParticipant: jest.fn(),
  fetchSpeedNetworkingCatalog: jest.fn(),
  listSpeedNetworkingSessions: jest.fn(),
  getSpeedNetworkingSession: jest.fn(),
};

jest.unstable_mockModule(speedNetworkingServiceUrl.pathname, () => speedNetworkingMocks);

const storageMocks = {
  createStorageLocation: jest.fn().mockResolvedValue({ id: 12 }),
  updateStorageLocation: jest.fn(),
  deleteStorageLocation: jest.fn(),
  createLifecycleRule: jest.fn().mockResolvedValue({ id: 13 }),
  updateLifecycleRule: jest.fn(),
  deleteLifecycleRule: jest.fn(),
  createUploadPreset: jest.fn().mockResolvedValue({ id: 14 }),
  updateUploadPreset: jest.fn(),
  deleteUploadPreset: jest.fn(),
  getStorageOverview: jest.fn(),
};

jest.unstable_mockModule(storageServiceUrl.pathname, () => storageMocks);

const timelineMocks = {
  createTimelineEvent: jest.fn().mockResolvedValue({ id: 901 }),
  updateTimelineEvent: jest.fn(),
  reorderTimelineEvents: jest.fn().mockResolvedValue({ id: 1 }),
  deleteTimelineEvent: jest.fn(),
  createTimeline: jest.fn().mockResolvedValue({ id: 444 }),
  updateTimeline: jest.fn(),
  deleteTimeline: jest.fn(),
  listTimelines: jest.fn(),
  getTimeline: jest.fn(),
};

jest.unstable_mockModule(timelineServiceUrl.pathname, () => ({
  default: timelineMocks,
  ...timelineMocks,
}));

const {
  createPayoutScheduleController,
} = await import('../src/controllers/adminFinanceController.js');
const identityController = await import('../src/controllers/adminIdentityVerificationController.js');
const jobApplicationController = await import('../src/controllers/adminJobApplicationController.js');
const jobPostController = await import('../src/controllers/adminJobPostController.js');
const mentoringController = await import('../src/controllers/adminMentoringController.js');
const messagingController = await import('../src/controllers/adminMessagingController.js');
const moderationController = await import('../src/controllers/adminModerationController.js');
const profileController = await import('../src/controllers/adminProfileController.js');
const projectController = await import('../src/controllers/adminProjectManagementController.js');
const runtimeController = await import('../src/controllers/adminRuntimeController.js');
const siteController = await import('../src/controllers/adminSiteManagementController.js');
const speedNetworkingController = await import('../src/controllers/adminSpeedNetworkingController.js');
const storageController = await import('../src/controllers/adminStorageController.js');
const timelineController = await import('../src/controllers/adminTimelineController.js');

function createMockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('admin operational controllers extensions', () => {
  it('creates payout schedule with actor context', async () => {
    const req = { user: { id: 9, email: 'ops@example.com' }, body: { name: 'Quarterly' } };
    const res = createMockResponse();

    await createPayoutScheduleController(req, res);

    expect(financeMocks.createPayoutSchedule).toHaveBeenCalledTimes(1);
    const [payload, actorId] = financeMocks.createPayoutSchedule.mock.calls[0];
    expect(typeof payload.createdBy).toBe('string');
    expect(payload.createdBy.length).toBeGreaterThan(0);
    expect(actorId).toBe(9);
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.stringContaining('ops@example.com') }),
      'Admin finance payout schedule created',
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updates identity verification with service actor context', async () => {
    const req = { user: { id: 12, roles: ['ADMIN'] }, params: { verificationId: '42' }, body: { status: 'approved' } };
    const res = createMockResponse();

    await identityController.update(req, res);

    expect(identityMocks.updateIdentityVerification).toHaveBeenCalledWith(42, { status: 'approved' }, {
      actorId: 12,
      actorRole: 'admin',
    });
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.stringContaining('admin:12'), verificationId: 42 }),
      'Admin identity verification updated',
    );
  });

  it('creates job application forwarding actor metadata', async () => {
    const req = { user: { id: 21, email: 'lead@gigvora.test' }, body: { candidateName: 'Jane', candidateEmail: 'jane@test.dev', jobTitle: 'Engineer' } };
    const res = createMockResponse();

    await jobApplicationController.createJobApplication(req, res);

    expect(jobApplicationMocks.createJobApplication).toHaveBeenCalledWith(
      expect.objectContaining({ candidateName: 'Jane' }),
      { id: 21, name: expect.stringContaining('lead') },
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.any(String), applicationId: 77 }),
      'Admin job application created',
    );
  });

  it('soft deletes job post with actor audit log', async () => {
    jobPostMocks.deleteJobPost.mockResolvedValueOnce({ id: 55 });
    const req = { user: { id: 31, email: 'owner@gigvora.test' }, params: { postId: 'abc-slug' }, query: {} };
    const res = createMockResponse();

    await jobPostController.destroy(req, res);

    expect(jobPostMocks.deleteJobPost).toHaveBeenCalledWith('abc-slug', { hardDelete: false });
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.stringContaining('owner'), jobPostId: 'abc-slug' }),
      'Admin job post soft deleted',
    );
  });

  it('creates mentoring action with actor defaulting createdById', async () => {
    const req = { user: { id: 17 }, params: { sessionId: '9' }, body: { title: 'Follow up' } };
    const res = createMockResponse();

    await mentoringController.storeAction(req, res);

    expect(mentoringMocks.createActionItem).toHaveBeenCalledWith(9, { title: 'Follow up', createdById: 17 });
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.any(String), sessionId: 9 }),
      'Admin mentoring action created',
    );
  });

  it('creates messaging thread enforcing actor id', async () => {
    const req = { user: { id: 99, email: 'support@gigvora.test' }, body: { subject: 'Help' } };
    const res = createMockResponse();

    await messagingController.createThread(req, res);

    expect(messagingMocks.createAdminThread).toHaveBeenCalledWith({ subject: 'Help', createdBy: 99 });
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.any(String), threadId: 120 }),
      'Admin messaging thread created',
    );
  });

  it('resolves moderation event with parsed identifiers', async () => {
    const req = { user: { id: 7 }, params: { eventId: '45' }, body: { status: 'resolved', notes: 'done' } };
    const res = createMockResponse();

    await moderationController.resolve(req, res);

    expect(moderationMocks.resolveModerationEvent).toHaveBeenCalledWith(45, {
      status: 'resolved',
      resolvedBy: 7,
      resolutionNotes: 'done',
    });
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.any(String), eventId: 45, status: 'resolved' }),
      'Admin moderation event resolved',
    );
  });

  it('deletes profile note and returns 204', async () => {
    const req = { user: { id: 5 }, params: { profileId: '33', noteId: '9' } };
    const res = createMockResponse();

    await profileController.deleteNote(req, res);

    expect(profileMocks.deleteNote).toHaveBeenCalledWith(33, 9);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: 33, noteId: 9 }),
      'Admin profile note deleted',
    );
  });

  it('creates project milestone stamping actor metadata', async () => {
    const req = { user: { id: 8 }, params: { projectId: '42' }, body: { title: 'Kickoff' } };
    const res = createMockResponse();

    await projectController.storeMilestone(req, res);

    expect(projectMocks.createProjectMilestone).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        title: 'Kickoff',
        createdBy: expect.any(String),
        updatedBy: expect.any(String),
      }),
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 42, milestoneId: 15 }),
      'Admin project milestone created',
    );
  });

  it('changes runtime maintenance status with actor envelope', async () => {
    const req = { user: { id: 4, email: 'runtime@gigvora.test' }, params: { announcementId: '66' }, body: { status: 'resolved' } };
    const res = createMockResponse();

    await runtimeController.changeMaintenanceStatus(req, res);

    expect(runtimeMocks.updateAnnouncementStatus).toHaveBeenCalledWith(66, 'resolved', {
      actor: expect.objectContaining({ id: 4, email: 'runtime@gigvora.test' }),
    });
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ announcementId: 66, status: 'resolved' }),
      'Runtime maintenance status changed',
    );
  });

  it('creates site page with audit stamping', async () => {
    const req = { user: { id: 3 }, body: { title: 'About' } };
    const res = createMockResponse();

    await siteController.createPage(req, res);

    expect(siteMocks.createSitePage).toHaveBeenCalledWith(expect.objectContaining({ createdBy: expect.any(String) }));
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 111 }),
      'Site management page created',
    );
  });

  it('creates speed networking session with actor id', async () => {
    const req = { user: { id: 16 }, body: { topic: 'Design sync' } };
    const res = createMockResponse();

    await speedNetworkingController.create(req, res);

    expect(speedNetworkingMocks.createSpeedNetworkingSession).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'Design sync' }),
      { id: 16 },
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.any(String), sessionId: 222 }),
      'Speed networking session created',
    );
  });

  it('creates storage location with actor metadata', async () => {
    const req = { user: { id: 11, email: 'storage@gigvora.test' }, body: { name: 'primary' } };
    const res = createMockResponse();

    await storageController.createLocation(req, res);

    expect(storageMocks.createStorageLocation).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: expect.any(String), updatedBy: expect.any(String) }),
      { actor: expect.objectContaining({ id: 11 }) },
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ actor: expect.any(String), locationId: 12 }),
      'Storage location created',
    );
  });

  it('creates timeline event with actor stamps', async () => {
    const req = { user: { id: 2 }, params: { timelineId: '5' }, body: { title: 'Deployed' } };
    const res = createMockResponse();

    await timelineController.storeEvent(req, res);

    expect(timelineMocks.createTimelineEvent).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ title: 'Deployed', updatedBy: expect.any(String) }),
    );
    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({ timelineId: 5, eventId: 901 }),
      'Admin timeline event created',
    );
  });
});
