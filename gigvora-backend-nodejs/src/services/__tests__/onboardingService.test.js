import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const modulePath = (relative) => new URL(relative, import.meta.url).pathname;

describe('onboardingService', () => {
  let listPersonas;
  let startJourney;
  let personaModel;
  let journeyModel;
  let inviteModel;
  let loggerMock;
  let sequelizeMock;
  let ValidationError;
  let NotFoundError;
  let transactionContext;

  beforeEach(async () => {
    jest.resetModules();

    personaModel = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    journeyModel = {
      update: jest.fn().mockResolvedValue([1]),
      create: jest.fn(),
    };

    inviteModel = {
      bulkCreate: jest.fn(),
    };

    transactionContext = { id: 'tx-journey' };
    sequelizeMock = {
      transaction: jest.fn(async (handler) => handler(transactionContext)),
    };

    loggerMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    jest.unstable_mockModule(modulePath('../../models/onboardingModels.js'), () => ({
      OnboardingPersona: personaModel,
      OnboardingJourney: journeyModel,
      OnboardingJourneyInvite: inviteModel,
      ONBOARDING_JOURNEY_STATUSES: ['draft', 'launching', 'active', 'completed', 'archived'],
    }));

    jest.unstable_mockModule(modulePath('../../models/sequelizeClient.js'), () => ({
      default: sequelizeMock,
      sequelize: sequelizeMock,
    }));

    jest.unstable_mockModule(modulePath('../../utils/logger.js'), () => ({
      default: loggerMock,
    }));

    ({ listPersonas, startJourney } = await import(modulePath('../onboardingService.js')));

    ({ ValidationError, NotFoundError } = await import(modulePath('../../utils/errors.js')));
  });

  afterEach(() => {
    jest.resetModules();
    jest.useRealTimers();
  });

  it('lists active personas in sort order with sanitised payloads', async () => {
    personaModel.findAll.mockResolvedValue([
      {
        slug: 'advisor',
        title: 'Advisor',
        subtitle: 'Guide emerging leaders',
        headline: null,
        benefits: ['Trusted playbooks'],
        metrics: ['NPS 78'],
        signatureMoments: ['Board prep'],
        recommendedModules: ['governance'],
        heroMedia: { poster: 'advisor.jpg' },
      },
      {
        slug: 'founder',
        title: 'Founder',
        subtitle: 'Build companies',
        headline: 'Scale faster',
        benefits: ['Capital intros'],
        metrics: null,
        signatureMoments: null,
        recommendedModules: null,
        heroMedia: null,
      },
    ]);

    const personas = await listPersonas();

    expect(personaModel.findAll).toHaveBeenCalledWith({
      where: { status: 'active' },
      order: [
        ['sortOrder', 'ASC'],
        ['title', 'ASC'],
      ],
    });

    expect(personas).toEqual([
      {
        id: 'advisor',
        title: 'Advisor',
        subtitle: 'Guide emerging leaders',
        headline: null,
        benefits: ['Trusted playbooks'],
        metrics: ['NPS 78'],
        signatureMoments: ['Board prep'],
        recommendedModules: ['governance'],
        heroMedia: { poster: 'advisor.jpg' },
      },
      {
        id: 'founder',
        title: 'Founder',
        subtitle: 'Build companies',
        headline: 'Scale faster',
        benefits: ['Capital intros'],
        metrics: [],
        signatureMoments: [],
        recommendedModules: [],
        heroMedia: {},
      },
    ]);
  });

  it('includes deprecated personas when requested', async () => {
    personaModel.findAll.mockResolvedValue([]);

    await listPersonas({ includeDeprecated: true });

    expect(personaModel.findAll).toHaveBeenCalledWith({
      where: {},
      order: [
        ['sortOrder', 'ASC'],
        ['title', 'ASC'],
      ],
    });
  });

  it('starts a journey with sanitised profile, preferences, and invites', async () => {
    const fixedNow = new Date('2025-01-02T03:04:05.000Z');
    jest.useFakeTimers().setSystemTime(fixedNow);

    personaModel.findOne.mockResolvedValue({
      id: 91,
      slug: 'founder',
      title: 'Founder',
      subtitle: 'Build unstoppable companies',
      headline: 'Scale faster',
      benefits: ['Concierge experts'],
      metrics: ['NPS 74'],
      signatureMoments: ['Investor briefings'],
      recommendedModules: ['fundraising'],
    });

    journeyModel.create.mockImplementation(async (payload) => ({
      ...payload,
      id: 'journey-123',
    }));

    inviteModel.bulkCreate.mockImplementation(async (records) =>
      records.map((record, index) => ({
        ...record,
        id: index + 1,
        invitedAt: fixedNow,
      })),
    );

    const result = await startJourney({
      actor: { id: 402 },
      payload: {
        personaKey: 'Founder ',
        profile: {
          companyName: ' Gigvora Labs ',
          role: ' Founder ',
          timezone: 'UTC',
          headline: '',
          northStar: 'Expand globally',
        },
        preferences: {
          digestCadence: ' daily ',
          updates: false,
          focusSignals: ['Revenue', 'Revenue'],
          storyThemes: ['Growth', 'Culture'],
          enableAiDrafts: false,
        },
        invites: [
          { email: 'CEO@example.com ', role: ' CEO ' },
          { email: 'ops@example.com' },
          { email: 'CEO@example.com', role: 'duplicate' },
        ],
      },
    });

    expect(sequelizeMock.transaction).toHaveBeenCalled();
    expect(journeyModel.update).toHaveBeenCalledWith(
      { status: 'archived' },
      expect.objectContaining({
        where: expect.objectContaining({ userId: 402 }),
        transaction: transactionContext,
      }),
    );

    expect(journeyModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        personaId: 91,
        personaKey: 'founder',
        personaTitle: 'Founder',
        invitedCount: 2,
        profileCompanyName: 'Gigvora Labs',
        profileRole: 'Founder',
        preferencesDigestCadence: 'daily',
        preferencesUpdatesEnabled: false,
        preferencesFocusSignals: ['Revenue'],
        preferencesStoryThemes: ['Growth', 'Culture'],
        metadata: expect.objectContaining({
          personaSnapshot: expect.objectContaining({
            subtitle: 'Build unstoppable companies',
            signatureMoments: ['Investor briefings'],
          }),
        }),
      }),
      expect.objectContaining({ transaction: transactionContext }),
    );

    expect(inviteModel.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({ email: 'ceo@example.com', role: 'CEO', status: 'pending' }),
        expect.objectContaining({ email: 'ops@example.com', role: null, status: 'pending' }),
      ],
      expect.objectContaining({ returning: true, transaction: transactionContext }),
    );

    expect(result).toEqual({
      id: 'journey-123',
      status: 'launching',
      persona: {
        id: 'founder',
        title: 'Founder',
        subtitle: 'Build unstoppable companies',
        headline: 'Scale faster',
        recommendedModules: ['fundraising'],
      },
      profile: {
        companyName: 'Gigvora Labs',
        role: 'Founder',
        timezone: 'UTC',
        headline: null,
        northStar: 'Expand globally',
      },
      preferences: {
        digestCadence: 'daily',
        updates: false,
        enableAiDrafts: false,
        focusSignals: ['Revenue'],
        storyThemes: ['Growth', 'Culture'],
      },
      invites: [
        expect.objectContaining({ email: 'ceo@example.com', invitedAt: fixedNow.toISOString(), status: 'pending' }),
        expect.objectContaining({ email: 'ops@example.com', invitedAt: fixedNow.toISOString(), status: 'pending' }),
      ],
      invitedCount: 2,
      launchedAt: fixedNow.toISOString(),
      completedAt: null,
    });

    expect(loggerMock.info).toHaveBeenCalledWith(
      {
        event: 'onboarding.journey.started',
        userId: 402,
        persona: 'founder',
        invitedCount: 2,
        digestCadence: 'daily',
      },
      'Onboarding journey started',
    );
  });

  it('throws when persona is missing', async () => {
    personaModel.findOne.mockResolvedValue(null);

    await expect(
      startJourney({
        actor: { id: 999 },
        payload: { personaKey: 'advisor', invites: [{ email: 'ally@example.com' }], profile: { companyName: 'Org', role: 'Ops', timezone: 'UTC' } },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('validates invite email addresses', async () => {
    personaModel.findOne.mockResolvedValue({
      id: 5,
      slug: 'advisor',
      title: 'Advisor',
      subtitle: 'Guide',
      headline: 'Lead',
      benefits: [],
      metrics: [],
      signatureMoments: [],
      recommendedModules: [],
    });

    await expect(
      startJourney({
        actor: { id: 7 },
        payload: {
          personaKey: 'advisor',
          profile: { companyName: 'Org', role: 'Ops', timezone: 'UTC' },
          invites: [{ email: 'not-an-email' }],
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
