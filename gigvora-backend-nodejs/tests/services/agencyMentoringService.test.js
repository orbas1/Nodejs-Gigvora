import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');

const ProviderWorkspace = { findOne: jest.fn() };
const ProviderWorkspaceMember = { findOne: jest.fn(), count: jest.fn() };
const AgencyMentoringSession = { findAll: jest.fn(), create: jest.fn(), findOne: jest.fn() };
const AgencyMentoringPurchase = { findAll: jest.fn(), create: jest.fn(), findOne: jest.fn() };
const AgencyMentorPreference = { findAll: jest.fn(), create: jest.fn(), findOne: jest.fn() };
const User = { findAll: jest.fn() };

await jest.unstable_mockModule(modelsModulePath, () => ({
  ProviderWorkspace,
  ProviderWorkspaceMember,
  AgencyMentoringSession,
  AgencyMentoringPurchase,
  AgencyMentorPreference,
  User,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agencyMentoringService.js');

const {
  getMentoringOverview,
  createMentoringSession,
  updateMentoringSession,
  deleteMentoringSession,
  createMentoringPurchase,
  updateMentoringPurchase,
  createMentorPreference,
  updateMentorPreference,
} = await import(serviceModulePath);

const { ValidationError } = await import('../../src/utils/errors.js');

const baseWorkspace = {
  id: 101,
  name: 'Atlas Agency',
  slug: 'atlas-agency',
  type: 'agency',
  ownerId: 7,
  defaultCurrency: 'USD',
};

function createRow(plain) {
  return {
    ...plain,
    get: jest.fn(({ plain: usePlain } = {}) => (usePlain ? { ...plain } : { ...plain })),
  };
}

function createMutableRecord(initialPlain) {
  const state = { ...initialPlain };
  const record = {
    update: jest.fn(async (updates = {}) => {
      Object.assign(state, updates);
    }),
    destroy: jest.fn(async () => {
      state.__destroyed = true;
    }),
    reload: jest.fn(async () => createRow(state)),
    get: jest.fn(({ plain } = {}) => (plain ? { ...state } : { ...state })),
  };

  return record;
}

function resetMocks() {
  ProviderWorkspace.findOne.mockReset().mockResolvedValue(baseWorkspace);
  ProviderWorkspaceMember.findOne.mockReset();
  ProviderWorkspaceMember.count.mockReset().mockResolvedValue(1);
  AgencyMentoringSession.findAll.mockReset();
  AgencyMentoringSession.create.mockReset();
  AgencyMentoringSession.findOne.mockReset();
  AgencyMentoringPurchase.findAll.mockReset();
  AgencyMentoringPurchase.create.mockReset();
  AgencyMentoringPurchase.findOne.mockReset();
  AgencyMentorPreference.findAll.mockReset();
  AgencyMentorPreference.create.mockReset();
  AgencyMentorPreference.findOne.mockReset();
  User.findAll.mockReset();
}

describe('agencyMentoringService', () => {
  const actor = { actorId: baseWorkspace.ownerId, actorRoles: ['admin'] };

  beforeEach(() => {
    resetMocks();
  });

  it('returns a rich mentoring overview with metrics and mentor suggestions', async () => {
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const sessionRows = [
      createRow({
        id: 11,
        workspaceId: baseWorkspace.id,
        purchaseId: 201,
        mentorId: 301,
        mentorName: 'Jordan Mentor',
        mentorEmail: 'jordan@mentor.test',
        clientName: 'Client One',
        clientEmail: 'client@company.test',
        clientCompany: 'Client Co',
        focusArea: 'Pitch practice',
        agenda: 'Improve investor story',
        scheduledAt,
        durationMinutes: 45,
        status: 'scheduled',
        meetingUrl: 'https://meet.gigvora.test/session/11',
        recordingUrl: null,
        followUpActions: null,
        sessionNotes: 'Bring deck',
        sessionTags: ['pitch'],
        costAmount: 220,
        currency: 'USD',
        createdBy: baseWorkspace.ownerId,
        mentor: { id: 301, firstName: 'Jordan', lastName: 'Mentor', email: 'jordan@mentor.test' },
        createdByUser: { id: baseWorkspace.ownerId, firstName: 'Avery', lastName: 'Admin', email: 'admin@agency.test' },
        purchase: {
          id: 201,
          packageName: 'Pitch Clinic',
          sessionsIncluded: 3,
          sessionsUsed: 1,
          status: 'active',
        },
        metadata: { preparation: 'deck review' },
        createdAt: '2024-04-01T12:00:00.000Z',
        updatedAt: '2024-04-01T12:00:00.000Z',
      }),
    ];

    const purchaseRows = [
      createRow({
        id: 201,
        workspaceId: baseWorkspace.id,
        mentorId: 301,
        mentorName: 'Jordan Mentor',
        mentorEmail: 'jordan@mentor.test',
        packageName: 'Pitch Clinic',
        description: 'Three focused sessions',
        sessionsIncluded: 3,
        sessionsUsed: 1,
        amount: 600,
        currency: 'USD',
        purchasedAt: '2024-03-01T00:00:00.000Z',
        validFrom: '2024-03-01T00:00:00.000Z',
        validUntil: '2024-06-01T00:00:00.000Z',
        status: 'active',
        invoiceUrl: 'https://billing.test/invoices/201',
        referenceCode: 'INV-201',
        notes: null,
        mentor: { id: 301, firstName: 'Jordan', lastName: 'Mentor', email: 'jordan@mentor.test' },
        createdByUser: { id: baseWorkspace.ownerId, firstName: 'Avery', lastName: 'Admin', email: 'admin@agency.test' },
        metadata: { region: 'NA' },
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z',
      }),
    ];

    const preferenceRows = [
      createRow({
        id: 1001,
        workspaceId: baseWorkspace.id,
        mentorId: 302,
        mentorName: 'Jamie Expert',
        mentorEmail: 'jamie@example.com',
        preferenceLevel: 'strategic',
        favourite: true,
        introductionNotes: 'Ideal for executive leadership coaching',
        tags: ['leadership'],
        lastEngagedAt: '2024-03-15T10:00:00.000Z',
        mentor: { id: 302, firstName: 'Jamie', lastName: 'Expert', email: 'jamie@example.com', title: 'Executive Coach' },
        createdByUser: { id: baseWorkspace.ownerId, firstName: 'Avery', lastName: 'Admin', email: 'admin@agency.test' },
        metadata: { timezone: 'UTC' },
        createdAt: '2024-03-10T00:00:00.000Z',
        updatedAt: '2024-03-10T00:00:00.000Z',
      }),
    ];

    AgencyMentoringSession.findAll.mockResolvedValue(sessionRows);
    AgencyMentoringPurchase.findAll.mockResolvedValue(purchaseRows);
    AgencyMentorPreference.findAll.mockResolvedValue(preferenceRows);
    User.findAll
      .mockResolvedValueOnce([
        {
          get: jest.fn(() => ({
            id: 301,
            firstName: 'Jordan',
            lastName: 'Mentor',
            email: 'jordan@mentor.test',
            title: 'Pitch Coach',
            location: 'New York',
          })),
        },
      ])
      .mockResolvedValueOnce([
        {
          get: jest.fn(() => ({
            id: 305,
            firstName: 'Morgan',
            lastName: 'Advisor',
            email: 'morgan@mentor.test',
            title: 'Growth Advisor',
            location: 'Remote',
          })),
        },
      ]);

    const overview = await getMentoringOverview({ workspaceId: baseWorkspace.id }, actor);

    expect(overview.workspace.id).toBe(baseWorkspace.id);
    expect(overview.metrics).toMatchObject({ booked: 1, finished: 0, purchased: 3, spend: 220 });
    expect(overview.upcomingSessions).toHaveLength(1);
    expect(overview.favouriteMentors[0]).toMatchObject({ mentorId: 302, favourite: true });
    expect(overview.suggestedMentors).toHaveLength(2);
    expect(overview.suggestedMentors[0]).toMatchObject({
      mentorId: 301,
      highlight: 'Emerging favourite',
      engagementCount: 2,
    });
    expect(overview.recentPurchases[0]).toMatchObject({ packageName: 'Pitch Clinic', sessionsIncluded: 3 });
  });

  it('creates, updates, and deletes mentoring sessions with validation', async () => {
    const createdPlain = {
      id: 55,
      workspaceId: baseWorkspace.id,
      mentorId: 301,
      mentorName: 'Jordan Mentor',
      mentorEmail: 'jordan@mentor.test',
      clientName: 'Acme Robotics',
      clientEmail: 'ops@acme.test',
      clientCompany: 'Acme Robotics',
      focusArea: 'Growth strategy',
      agenda: 'Discuss go-to-market plan',
      scheduledAt: '2024-05-01T10:00:00.000Z',
      durationMinutes: 60,
      status: 'scheduled',
      meetingUrl: 'https://meet.gigvora.test/sessions/55',
      recordingUrl: null,
      followUpActions: null,
      sessionNotes: null,
      sessionTags: ['growth'],
      costAmount: 200,
      currency: 'USD',
      createdBy: actor.actorId,
      metadata: { agenda: 'expansion' },
      mentor: { id: 301, firstName: 'Jordan', lastName: 'Mentor', email: 'jordan@mentor.test' },
      createdByUser: { id: actor.actorId, firstName: 'Avery', lastName: 'Admin', email: 'admin@agency.test' },
      purchase: null,
      createdAt: '2024-04-01T00:00:00.000Z',
      updatedAt: '2024-04-01T00:00:00.000Z',
    };

    AgencyMentoringSession.create.mockImplementation(async (payload) => {
      expect(payload.workspaceId).toBe(baseWorkspace.id);
      expect(payload.status).toBe('scheduled');
      expect(payload.currency).toBe('USD');
      return createMutableRecord(createdPlain);
    });

    const created = await createMentoringSession(
      {
        workspaceId: baseWorkspace.id,
        mentorId: 301,
        clientName: 'Acme Robotics',
        clientEmail: 'ops@acme.test',
        focusArea: 'Growth strategy',
        scheduledAt: '2024-05-01T10:00:00.000Z',
        durationMinutes: 60,
        sessionTags: ['growth'],
        costAmount: 200,
        metadata: { agenda: 'expansion' },
      },
      actor,
    );

    expect(created).toMatchObject({ mentorId: 301, clientName: 'Acme Robotics', sessionTags: ['growth'] });

    const sessionRecord = createMutableRecord({ ...createdPlain, status: 'scheduled' });
    AgencyMentoringSession.findOne.mockResolvedValue(sessionRecord);

    const updated = await updateMentoringSession(
      created.id,
      { status: 'completed', sessionNotes: 'Shared follow up actions' },
      { ...actor, workspaceId: baseWorkspace.id },
    );

    expect(sessionRecord.update).toHaveBeenCalledWith({ status: 'completed', sessionNotes: 'Shared follow up actions' });
    expect(updated.status).toBe('completed');

    AgencyMentoringSession.findOne.mockResolvedValueOnce(sessionRecord);

    const deletion = await deleteMentoringSession(created.id, { workspaceId: baseWorkspace.id }, actor);
    expect(sessionRecord.destroy).toHaveBeenCalled();
    expect(deletion).toEqual({ success: true });
  });

  it('enforces mentoring purchase limits and sanitation on updates', async () => {
    const purchaseState = {
      id: 801,
      workspaceId: baseWorkspace.id,
      mentorId: 301,
      mentorName: 'Jordan Mentor',
      mentorEmail: 'jordan@mentor.test',
      packageName: 'Executive Package',
      sessionsIncluded: 4,
      sessionsUsed: 1,
      amount: 1200,
      currency: 'USD',
      purchasedAt: '2024-01-10T00:00:00.000Z',
      validFrom: '2024-01-10T00:00:00.000Z',
      validUntil: '2024-04-10T00:00:00.000Z',
      status: 'active',
      invoiceUrl: null,
      referenceCode: 'INV-801',
      notes: null,
      metadata: { source: 'finance' },
      mentor: { id: 301, firstName: 'Jordan', lastName: 'Mentor', email: 'jordan@mentor.test', title: 'Coach' },
      createdByUser: { id: actor.actorId, firstName: 'Avery', lastName: 'Admin', email: 'admin@agency.test' },
      createdAt: '2024-01-10T00:00:00.000Z',
      updatedAt: '2024-01-10T00:00:00.000Z',
    };

    const purchaseRecord = createMutableRecord(purchaseState);
    AgencyMentoringPurchase.findOne.mockResolvedValue(purchaseRecord);

    const updated = await updateMentoringPurchase(
      purchaseState.id,
      { sessionsUsed: 3, notes: 'Two sessions completed with great feedback.' },
      { ...actor, workspaceId: baseWorkspace.id },
    );

    expect(purchaseRecord.update).toHaveBeenCalledWith({ sessionsUsed: 3, notes: 'Two sessions completed with great feedback.' });
    expect(updated.sessionsUsed).toBe(3);

    await expect(
      updateMentoringPurchase(
        purchaseState.id,
        { sessionsUsed: 8, sessionsIncluded: 4 },
        { ...actor, workspaceId: baseWorkspace.id },
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('validates mentor preference creation and updates contact data safely', async () => {
    await expect(createMentorPreference({ workspaceId: baseWorkspace.id }, actor)).rejects.toBeInstanceOf(ValidationError);

    const preferencePlain = {
      id: 901,
      workspaceId: baseWorkspace.id,
      mentorId: 450,
      mentorName: 'Morgan Advisor',
      mentorEmail: 'morgan@mentor.test',
      preferenceLevel: 'preferred',
      favourite: true,
      introductionNotes: 'Works well with revenue leaders',
      tags: ['revenue'],
      lastEngagedAt: '2024-02-01T00:00:00.000Z',
      metadata: { timezone: 'Europe/London' },
      mentor: { id: 450, firstName: 'Morgan', lastName: 'Advisor', email: 'morgan@mentor.test' },
      createdByUser: { id: actor.actorId, firstName: 'Avery', lastName: 'Admin', email: 'admin@agency.test' },
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2024-02-01T00:00:00.000Z',
    };

    AgencyMentorPreference.create.mockResolvedValue(createMutableRecord(preferencePlain));

    const createdPreference = await createMentorPreference(
      {
        workspaceId: baseWorkspace.id,
        mentorName: 'Morgan Advisor',
        mentorEmail: 'morgan@mentor.test',
        tags: ['revenue'],
      },
      actor,
    );

    expect(createdPreference.mentorName).toBe('Morgan Advisor');
    expect(createdPreference.favourite).toBe(true);

    const preferenceRecord = createMutableRecord(preferencePlain);
    AgencyMentorPreference.findOne.mockResolvedValue(preferenceRecord);

    const updatedPreference = await updateMentorPreference(
      preferencePlain.id,
      { favourite: false, tags: ['revenue', 'enterprise'] },
      { ...actor, workspaceId: baseWorkspace.id },
    );

    expect(preferenceRecord.update).toHaveBeenCalledWith({ favourite: false, tags: ['revenue', 'enterprise'] });
    expect(updatedPreference.tags).toContain('enterprise');
  });
});

