import { describe, expect, it, beforeAll, afterEach, jest } from '@jest/globals';

import { ValidationError } from '../../utils/errors.js';

const modelsIndexModule = new URL('../../models/index.js', import.meta.url).pathname;
const headhunterExtrasModule = new URL('../../models/headhunterExtras.js', import.meta.url).pathname;
const messagingModelsModule = new URL('../../models/messagingModels.js', import.meta.url).pathname;
const telemetryModelsModule = new URL('../../models/liveServiceTelemetryModels.js', import.meta.url).pathname;
const pageSettingModule = new URL('../../models/pageSetting.js', import.meta.url).pathname;
const legalConstantsModule = new URL('../../models/constants/index.js', import.meta.url).pathname;

const createModelProxy = () =>
  new Proxy(
    {},
    {
      get(target, prop) {
        if (!(prop in target)) {
          target[prop] = jest.fn();
        }
        return target[prop];
      },
    },
  );

const sequelizeStub = {
  define: jest.fn(() => createModelProxy()),
  sync: jest.fn(),
  transaction: async (handler) => handler({}),
  literal: () => null,
  close: jest.fn(),
  getDialect: () => 'postgres',
};

jest.unstable_mockModule(modelsIndexModule, () => {
  const base = {
    sequelize: sequelizeStub,
    Gig: createModelProxy(),
    GigPackage: createModelProxy(),
    GigAddOn: createModelProxy(),
    GigAvailabilitySlot: createModelProxy(),
    Group: createModelProxy(),
    GroupMembership: createModelProxy(),
    GroupInvite: createModelProxy(),
    GroupPost: createModelProxy(),
    User: createModelProxy(),
    ProviderWorkspace: createModelProxy(),
    ProviderWorkspaceMember: createModelProxy(),
    ProviderContactNote: createModelProxy(),
    SupportKnowledgeArticle: createModelProxy(),
    Application: createModelProxy(),
    MessageThread: createModelProxy(),
    Message: createModelProxy(),
    Profile: createModelProxy(),
    ExperienceLaunchpad: createModelProxy(),
    ExperienceLaunchpadApplication: createModelProxy(),
    ExperienceLaunchpadEmployerRequest: createModelProxy(),
    ExperienceLaunchpadPlacement: createModelProxy(),
    ExperienceLaunchpadOpportunityLink: createModelProxy(),
    Job: createModelProxy(),
    ApplicationReview: createModelProxy(),
    JobApplicationFavourite: createModelProxy(),
    JobApplicationInterview: createModelProxy(),
    JobApplicationResponse: createModelProxy(),
    Project: createModelProxy(),
    ProjectWorkspace: createModelProxy(),
    ProjectWorkspaceMember: createModelProxy(),
    ProjectWorkspaceObject: createModelProxy(),
    ProjectWorkspaceView: createModelProxy(),
    ServiceLine: createModelProxy(),
    LearningCourse: createModelProxy(),
    LearningCourseModule: createModelProxy(),
    LearningCourseEnrollment: createModelProxy(),
    PeerMentoringSession: createModelProxy(),
    SkillGapDiagnostic: createModelProxy(),
    FreelancerCertification: createModelProxy(),
    AiServiceRecommendation: createModelProxy(),
    LegalDocument: createModelProxy(),
    LegalDocumentVersion: createModelProxy(),
    LegalDocumentAuditEvent: createModelProxy(),
    Notification: createModelProxy(),
    NotificationPreference: createModelProxy(),
    Page: createModelProxy(),
    PageMembership: createModelProxy(),
    PageInvite: createModelProxy(),
    PagePost: createModelProxy(),
    NetworkingSession: createModelProxy(),
    NetworkingSessionRotation: createModelProxy(),
    NetworkingSessionSignup: createModelProxy(),
    NetworkingBusinessCard: createModelProxy(),
    FeedPost: createModelProxy(),
    GIG_STATUSES: ['draft', 'published', 'archived'],
    GIG_VISIBILITY_OPTIONS: ['public', 'private'],
    GROUP_VISIBILITIES: ['public', 'private'],
    GROUP_MEMBER_POLICIES: ['open', 'moderated', 'invite_only'],
    GROUP_MEMBERSHIP_STATUSES: ['pending', 'active', 'suspended'],
    GROUP_MEMBERSHIP_ROLES: ['member', 'moderator', 'owner'],
    COMMUNITY_INVITE_STATUSES: ['pending', 'accepted', 'declined'],
    GROUP_POST_STATUSES: ['draft', 'published'],
    GROUP_POST_VISIBILITIES: ['members', 'public'],
    JOB_APPLICATION_FAVOURITE_PRIORITIES: ['watching', 'high'],
    JOB_APPLICATION_RESPONSE_CHANNELS: ['email', 'sms'],
    JOB_APPLICATION_RESPONSE_DIRECTIONS: ['incoming', 'outgoing'],
    JOB_APPLICATION_RESPONSE_STATUSES: ['pending', 'sent'],
    JOB_INTERVIEW_STATUSES: ['scheduled', 'completed'],
    JOB_INTERVIEW_TYPES: ['phone', 'onsite'],
    APPLICATION_STATUSES: ['submitted', 'withdrawn', 'rejected', 'hired', 'offer'],
    LAUNCHPAD_APPLICATION_STATUSES: ['screening', 'interview', 'accepted', 'waitlisted'],
    LAUNCHPAD_PLACEMENT_STATUSES: ['active', 'completed'],
    LAUNCHPAD_TARGET_TYPES: ['job', 'project', 'volunteering'],
    LAUNCHPAD_OPPORTUNITY_SOURCES: ['internal', 'partner'],
    LEARNING_ENROLLMENT_STATUSES: ['not_started', 'in_progress', 'completed'],
    NOTIFICATION_CATEGORIES: ['system', 'marketing'],
    NOTIFICATION_PRIORITIES: ['low', 'normal', 'high'],
    NOTIFICATION_STATUSES: ['pending', 'delivered', 'dismissed', 'read'],
    DIGEST_FREQUENCIES: ['immediate', 'daily'],
    PAGE_VISIBILITIES: ['public', 'private'],
    PAGE_MEMBER_ROLES: ['member', 'editor', 'admin', 'owner'],
    PAGE_MEMBER_STATUSES: ['pending', 'active', 'suspended', 'invited'],
    PAGE_POST_STATUSES: ['draft', 'scheduled', 'published'],
    PAGE_POST_VISIBILITIES: ['public', 'followers'],
    NETWORKING_SESSION_STATUSES: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
    NETWORKING_SESSION_ACCESS_TYPES: ['public', 'invite_only', 'workspace'],
    NETWORKING_SESSION_VISIBILITIES: ['public', 'community', 'workspace'],
    NETWORKING_SESSION_SIGNUP_STATUSES: ['pending', 'confirmed', 'waitlisted', 'cancelled'],
    NETWORKING_SESSION_SIGNUP_SOURCES: ['self_service', 'admin'],
    NETWORKING_BUSINESS_CARD_STATUSES: ['active', 'archived'],
    NETWORKING_ROTATION_STATUSES: ['scheduled', 'in_progress', 'completed'],
  };

  return new Proxy(base, {
    get(target, prop) {
      if (!(prop in target)) {
        target[prop] = createModelProxy();
      }
      return target[prop];
    },
  });
});

jest.unstable_mockModule(headhunterExtrasModule, () => ({
  ProviderAvailabilityWindow: createModelProxy(),
  ProviderWellbeingLog: createModelProxy(),
}));

jest.unstable_mockModule(messagingModelsModule, () => ({
  sequelize: { getDialect: () => 'postgres' },
  MessageThread: createModelProxy(),
  MessageParticipant: createModelProxy(),
  Message: createModelProxy(),
  SupportCase: createModelProxy(),
  User: createModelProxy(),
  SavedReply: createModelProxy(),
  InboxPreference: createModelProxy(),
  InboxRoutingRule: createModelProxy(),
}));

jest.unstable_mockModule(telemetryModelsModule, () => ({
  SupportPlaybook: createModelProxy(),
  SupportPlaybookStep: createModelProxy(),
  FreelancerTimelinePost: createModelProxy(),
  CompanyTimelinePost: createModelProxy(),
  AdminTimelineEvent: createModelProxy(),
  AnalyticsEvent: createModelProxy(),
  UserEvent: createModelProxy(),
  UserEventGuest: createModelProxy(),
  UserEventTask: createModelProxy(),
}));

jest.unstable_mockModule(pageSettingModule, () => ({
  PageSetting: createModelProxy(),
  PAGE_LAYOUT_VARIANTS: ['spotlight', 'story'],
  PAGE_SETTING_STATUSES: ['draft', 'published'],
  PAGE_SETTING_VISIBILITIES: ['public', 'private'],
}));

jest.unstable_mockModule(legalConstantsModule, () => ({
  LEGAL_DOCUMENT_CATEGORIES: ['terms', 'privacy'],
  LEGAL_DOCUMENT_STATUSES: ['draft', 'active', 'archived'],
  LEGAL_DOCUMENT_VERSION_STATUSES: ['draft', 'published', 'archived'],
}));

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';

let gigHelpers;
let groupHelpers;
let headhunterHelpers;
let inboxHelpers;
let jobAppHelpers;
let launchpadHelpers;
let learningHelpers;
let legalHelpers;
let telemetryHelpers;
let mentorshipHelpers;
let networkingHelpers;
let newsHelpers;
let notificationHelpers;
let pageHelpers;
let pageSettingsHelpers;

beforeAll(async () => {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
  process.env.ADMIN_MANAGEMENT_MINIMAL_BOOTSTRAP = 'true';

  ({ __testing: gigHelpers } = await import('../gigService.js'));
  ({ __testing: groupHelpers } = await import('../groupService.js'));
  ({ __testing: headhunterHelpers } = await import('../headhunterService.js'));
  ({ __testing: inboxHelpers } = await import('../inboxWorkspaceService.js'));
  ({ __testing: jobAppHelpers } = await import('../jobApplicationService.js'));
  ({ __testing: launchpadHelpers } = await import('../launchpadService.js'));
  ({ __testing: learningHelpers } = await import('../learningHubService.js'));
  ({ __testing: legalHelpers } = await import('../legalPolicyService.js'));
  ({ __testing: telemetryHelpers } = await import('../liveServiceTelemetryService.js'));
  ({ __testing: mentorshipHelpers } = await import('../mentorshipService.js'));
  ({ __testing: networkingHelpers } = await import('../networkingService.js'));
  ({ __testing: newsHelpers } = await import('../newsAggregationService.js'));
  ({ __testing: notificationHelpers } = await import('../notificationService.js'));
  ({ __testing: pageHelpers } = await import('../pageService.js'));
  ({ __testing: pageSettingsHelpers } = await import('../pageSettingsService.js'));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('gigService helpers', () => {
  it('normalizes gig payloads with packages and availability', () => {
    const payload = {
      ownerId: 7,
      title: 'Senior AI Strategist',
      description: 'Architects trusted AI delivery.',
      packages: [
        {
          name: 'Discovery Sprint',
          priceAmount: '2400',
          priceCurrency: 'usd',
          deliveryDays: '14',
          revisionLimit: '2',
          highlights: ['Workshop', 'Stakeholder interviews'],
        },
      ],
      addOns: [
        {
          name: 'Executive Briefing',
          priceAmount: '850',
        },
      ],
      availability: {
        timezone: 'Europe/London',
        slots: [
          { date: '2024-07-01', startTime: '09:00', endTime: '10:00', capacity: 3 },
        ],
      },
      heroAccent: '#123abc',
    };

    const normalized = gigHelpers.normalizeGigPayload(payload, { actorId: 7 });
    expect(normalized.gig.ownerId).toBe(7);
    expect(normalized.gig.heroAccent).toBe('#123abc');
    expect(normalized.packages[0]).toMatchObject({ name: 'Discovery Sprint', priceCurrency: 'USD' });
    expect(normalized.availability.slots[0]).toMatchObject({ slotDate: '2024-07-01', startTime: '09:00' });
  });

  it('rejects invalid highlight payloads', () => {
    expect(() => gigHelpers.sanitizeHighlights(123)).toThrow(ValidationError);
  });
});

describe('groupService helpers', () => {
  it('computes engagement score using blueprint defaults', () => {
    const group = { id: 4, name: 'Mentor Guild', description: 'Peer mentoring.' };
    const blueprint = groupHelpers.resolveBlueprint(group);
    const mapped = groupHelpers.mapGroupRecord(group, {
      memberCount: 80,
      membership: null,
      blueprint,
    });
    expect(mapped.slug).toContain('mentor-guild');
    expect(mapped.stats.engagementScore).toBeGreaterThan(0.4);
  });

  it('ensures minutesFromNow returns ISO strings', () => {
    const result = groupHelpers.minutesFromNow(30);
    expect(typeof result).toBe('string');
    expect(() => new Date(result)).not.toThrow();
  });
});

describe('headhunterService helpers', () => {
  it('summarises pipeline activity and decision velocity', () => {
    const applications = [
      { status: 'interview', submittedAt: '2024-01-01', decisionAt: '2024-01-05' },
      { status: 'offer', submittedAt: '2024-01-02', decisionAt: '2024-01-06' },
      { status: 'hired', submittedAt: '2024-01-03', decisionAt: '2024-01-04' },
    ];
    const summary = headhunterHelpers.buildPipelineSummary(applications, null);
    expect(summary.totals.applications).toBe(3);
    expect(summary.totals.hires).toBe(1);
    expect(summary.interviewVelocityDays).toBeCloseTo(3.0, 1);
  });

  it('builds candidate spotlight with recent touchpoints', () => {
    const profileMap = new Map([[1, { name: 'Avi Mentor', availabilityStatus: 'interviewing' }]]);
    const spotlight = headhunterHelpers.buildCandidateSpotlight(
      [
        {
          id: 1,
          applicantId: 1,
          status: 'interview',
          metadata: { lastTouchpointAt: '2024-01-09T12:00:00Z', notes: ['Ready'] },
          updatedAt: '2024-01-08T00:00:00Z',
        },
      ],
      profileMap,
    );
    expect(spotlight[0].activeApplication.stage).toBe('interviewing');
    expect(spotlight[0].activeApplication.notes).toEqual(['Ready']);
  });
});

describe('inboxWorkspaceService helpers', () => {
  it('normalizes working hours while preserving defaults', () => {
    const workingHours = inboxHelpers.normalizeWorkingHours({
      timezone: 'America/New_York',
      availability: { monday: { active: false } },
    });
    expect(workingHours.timezone).toBe('America/New_York');
    expect(workingHours.availability.monday.start).toBe('09:00');
    expect(workingHours.availability.monday.active).toBe(false);
  });

  it('returns default preferences when missing', () => {
    const prefs = inboxHelpers.sanitizePreferences(null);
    expect(prefs.autoResponderEnabled).toBe(false);
    expect(prefs.workingHours.timezone).toBeDefined();
  });
});

describe('jobApplicationService helpers', () => {
  it('prevents unsupported statuses', () => {
    expect(() => jobAppHelpers.ensureStatus('invalid')).toThrow(ValidationError);
    expect(jobAppHelpers.ensureStatus('submitted')).toBe('submitted');
  });

  it('extracts application detail with derived metadata', () => {
    const application = {
      toPublicObject: () => ({
        id: 2,
        applicantId: 9,
        status: 'submitted',
        submittedAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        coverLetter: null,
        sourceChannel: 'referral',
        isArchived: false,
        metadata: { salary: { min: 90000, max: 120000, currency: 'USD' } },
      }),
      get: () => null,
    };
    const detail = jobAppHelpers.extractApplicationDetail(application);
    expect(detail.metadata.salary.min).toBe(90000);
    expect(detail.target).toBeNull();
  });
});

describe('launchpadService helpers', () => {
  it('normalises skills from comma separated strings', () => {
    expect(launchpadHelpers.normaliseSkills('Design, Product , Design')).toEqual(['Design', 'Product']);
  });

  it('evaluates candidate readiness with portfolio weighting', () => {
    const launchpad = { eligibilityCriteria: { minimumExperience: 2, requiredSkills: ['Strategy'], requiresPortfolio: true } };
    const readiness = launchpadHelpers.evaluateCandidateReadiness(launchpad, {
      yearsExperience: 3,
      skills: ['Strategy', 'Leadership'],
      targetSkills: ['AI'],
      portfolioUrl: 'https://portfolio.example.com',
      motivations: 'Eager to mentor peers.',
    });
    expect(readiness.score).toBeGreaterThan(60);
    expect(readiness.flags).toBeDefined();
  });
});

describe('learningHubService helpers', () => {
  it('sanitizes courses and sorts modules by sequence', () => {
    const course = {
      get: () => ({
        id: 1,
        serviceLineId: 3,
        title: 'Navigator',
        summary: 'Guide',
        difficulty: 'intermediate',
        format: 'cohort',
        durationHours: 5,
        tags: ['Growth'],
        modules: [
          { id: 2, title: 'Second', moduleType: 'video', durationMinutes: 20, sequence: 2 },
          { id: 1, title: 'First', moduleType: 'video', durationMinutes: 10, sequence: 1 },
        ],
        enrollments: [
          { id: 9, userId: 8, courseId: 1, status: 'in_progress', progress: 30 },
        ],
      }),
    };
    const sanitized = learningHelpers.sanitizeCourse(course, 8);
    expect(sanitized.modules[0].title).toBe('First');
    expect(sanitized.enrollment?.progress).toBe(30);
  });

  it('computes renewal insights for upcoming certifications', () => {
    const now = new Date();
    const upcoming = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString();
    const certifications = learningHelpers.computeRenewalInsights([
      { id: 1, expirationDate: upcoming },
      { id: 2, expirationDate: null },
    ]);
    expect(certifications.upcomingRenewals[0].daysUntilExpiration).toBeLessThanOrEqual(20);
  });
});

describe('legalPolicyService helpers', () => {
  it('normalizes keyword arrays and removes duplicates', () => {
    const keywords = legalHelpers.normalizeStringArray(['Data', 'data', '   privacy   ']);
    expect(keywords).toEqual(['Data', 'privacy']);
  });

  it('resolves document status based on versions', () => {
    const status = legalHelpers.resolveDocumentStatus(
      { status: 'draft' },
      { hasActiveVersion: true, pendingChanges: false },
    );
    expect(status).toBe('active');
  });
});

describe('liveServiceTelemetryService helpers', () => {
  it('coerces window minutes within bounds', () => {
    expect(telemetryHelpers.coerceWindowMinutes(2)).toBe(5);
    expect(telemetryHelpers.coerceWindowMinutes(5000)).toBeLessThanOrEqual(24 * 60);
  });

  it('builds incident signals with severity escalation', () => {
    const signals = telemetryHelpers.buildIncidentSignals({
      chat: { flaggedRatio: 0.2, moderationBacklog: 12 },
      inbox: { breachedSlaCases: 1, awaitingFirstResponse: 0 },
      analytics: { ingestionLagSeconds: 500 },
    });
    expect(signals.severity).toBe('critical');
    expect(signals.notes.length).toBeGreaterThanOrEqual(1);
  });
});

describe('mentorshipService helpers', () => {
  it('validates availability slots and enforces overlap rules', () => {
    const slots = [
      { day: 'Monday', start: '2024-06-10T09:00:00Z', end: '2024-06-10T10:00:00Z' },
      { day: 'Monday', start: '2024-06-10T10:15:00Z', end: '2024-06-10T11:00:00Z' },
    ];
    const validated = mentorshipHelpers.validateAvailability(slots);
    expect(validated).toHaveLength(2);
  });

  it('parses package price and enforces upper limits', () => {
    expect(() => mentorshipHelpers.parsePackagePrice(0, 0)).toThrow(ValidationError);
    expect(mentorshipHelpers.parsePackagePrice('199.995', 0)).toBe(200);
  });
});

describe('networkingService helpers', () => {
  it('creates stable slugs with fallback', () => {
    const slug = networkingHelpers.slugify('', 'session');
    expect(slug.startsWith('session-')).toBe(true);
  });

  it('infers session length from start and end time', () => {
    const minutes = networkingHelpers.normaliseSessionLengthMinutes({
      startTime: '2024-06-10T09:00:00Z',
      endTime: '2024-06-10T09:45:00Z',
      sessionLengthMinutes: null,
    });
    expect(minutes).toBe(45);
  });
});

describe('newsAggregationService helpers', () => {
  it('strips html and decodes entities', () => {
    expect(newsHelpers.stripHtml('<p>Hello &amp; welcome</p>')).toBe('Hello & welcome');
  });

  it('normalises Guardian articles to internal schema', () => {
    const article = newsHelpers.normaliseGuardianArticle({
      id: 'world/2024/jun/10/example',
      webTitle: 'Example story',
      webUrl: 'https://example.com/story',
      webPublicationDate: '2024-06-10T12:00:00Z',
      fields: { shortUrl: 'https://sh.rt/story', trailText: '<b>Summary</b>', thumbnail: 'https://img' },
    });
    expect(article.summary).toBe('Summary');
    expect(article.source).toBe('The Guardian');
  });
});

describe('notificationService helpers', () => {
  it('detects quiet hours based on timezone awareness', () => {
    const preference = {
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
      metadata: { timezone: 'UTC' },
    };

    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
      format: () => '23:30',
    }));

    expect(notificationHelpers.isWithinQuietHours(preference)).toBe(true);
  });

  it('computes delivery channels with safe defaults', () => {
    expect(notificationHelpers.computeDeliveryChannels({ pushEnabled: false })).toEqual({
      email: true,
      push: false,
      sms: false,
      inApp: true,
    });
  });
});

describe('pageService helpers', () => {
  it('normalizes post visibility and rejects invalid entries', () => {
    expect(pageHelpers.normalisePostVisibility('public')).toBe('public');
    expect(() => pageHelpers.normalisePostVisibility('invalid')).toThrow(ValidationError);
  });

  it('summarises page metadata and membership stats', () => {
    const page = {
      get: () => ({
        id: 1,
        name: 'Global Ventures',
        slug: 'global-ventures',
        description: 'Innovation hub',
        visibility: 'public',
        memberships: [
          { status: 'active' },
          { status: 'pending' },
          { status: 'active' },
        ],
        createdBy: { id: 7, firstName: 'A', lastName: 'B', email: 'a@gigvora.com', userType: 'admin' },
        updatedBy: null,
      }),
    };
    const sanitized = pageHelpers.sanitizePage(page, { includeMemberships: false });
    expect(sanitized.stats.active).toBe(2);
    expect(sanitized.createdBy.email).toBe('a@gigvora.com');
  });
});

describe('pageSettingsService helpers', () => {
  it('sanitises sections and removes invalid entries', () => {
    const sections = pageSettingsHelpers.sanitiseSections([
      { title: 'Valid', type: 'hero', summary: 'Test', order: 2 },
      { title: '', type: 'hero' },
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('section-1');
  });

  it('builds payload merging defaults', () => {
    const payload = pageSettingsHelpers.buildPayload(
      { id: 'home', layoutVariant: 'spotlight', sections: [{ title: 'Hero', type: 'hero' }] },
      { id: 'home', slug: 'home', settings: { navigation: [] } },
    );
    expect(payload.slug).toBe('home');
    expect(payload.sections).toHaveLength(1);
  });
});
