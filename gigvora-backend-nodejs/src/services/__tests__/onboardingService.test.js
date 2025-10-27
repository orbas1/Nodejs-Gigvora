process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import { jest } from '@jest/globals';
import { Sequelize, DataTypes } from 'sequelize';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import baseSequelize from '../../models/sequelizeClient.js';

const testSequelize = new Sequelize('sqlite::memory:', { logging: false });

if (!baseSequelize.models?.User) {
  baseSequelize.define(
    'User',
    {
      email: { type: DataTypes.STRING(255), allowNull: false },
    },
    { tableName: 'users', underscored: true },
  );
}

const jsonType = DataTypes.JSON;

const OnboardingPersona = testSequelize.define(
  'OnboardingPersona',
  {
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    subtitle: { type: DataTypes.STRING(255), allowNull: false },
    headline: { type: DataTypes.STRING(255), allowNull: true },
    benefits: { type: jsonType, allowNull: false, defaultValue: [] },
    metrics: { type: jsonType, allowNull: false, defaultValue: [] },
    signatureMoments: { type: jsonType, allowNull: false, defaultValue: [] },
    recommendedModules: { type: jsonType, allowNull: false, defaultValue: [] },
    heroMedia: { type: jsonType, allowNull: false, defaultValue: {} },
    status: { type: DataTypes.ENUM('draft', 'active', 'deprecated'), allowNull: false, defaultValue: 'active' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'onboarding_personas', underscored: true },
);

const OnboardingJourney = testSequelize.define(
  'OnboardingJourney',
  {
    personaId: { type: DataTypes.INTEGER, allowNull: false },
    personaKey: { type: DataTypes.STRING(120), allowNull: false },
    personaTitle: { type: DataTypes.STRING(180), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'launching', 'active', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'launching',
    },
    profileCompanyName: { type: DataTypes.STRING(180), allowNull: false },
    profileRole: { type: DataTypes.STRING(120), allowNull: false },
    profileTimezone: { type: DataTypes.STRING(80), allowNull: false },
    profileHeadline: { type: DataTypes.STRING(255), allowNull: true },
    profileNorthStar: { type: DataTypes.TEXT, allowNull: true },
    preferencesDigestCadence: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'weekly' },
    preferencesUpdatesEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    preferencesEnableAiDrafts: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    preferencesFocusSignals: { type: jsonType, allowNull: false, defaultValue: [] },
    preferencesStoryThemes: { type: jsonType, allowNull: false, defaultValue: [] },
    invitedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
    launchedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'onboarding_journeys', underscored: true },
);

const OnboardingJourneyInvite = testSequelize.define(
  'OnboardingJourneyInvite',
  {
    journeyId: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(120), allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined', 'bounced', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    invitedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    respondedAt: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: jsonType, allowNull: false, defaultValue: {} },
  },
  { tableName: 'onboarding_journey_invites', underscored: true },
);

OnboardingPersona.hasMany(OnboardingJourney, { foreignKey: 'personaId', as: 'journeys' });
OnboardingJourney.belongsTo(OnboardingPersona, { foreignKey: 'personaId', as: 'persona' });
OnboardingJourney.hasMany(OnboardingJourneyInvite, { foreignKey: 'journeyId', as: 'invites' });
OnboardingJourneyInvite.belongsTo(OnboardingJourney, { foreignKey: 'journeyId', as: 'journey' });

const serviceModule = await import('../onboardingService.js');
const { listPersonas, startJourney, __setDependencies, __resetDependencies } = serviceModule;

describe('onboardingService', () => {
  const logger = {
    info: jest.fn(),
    child: () => logger,
  };

  beforeAll(async () => {
    await testSequelize.sync({ force: true });
    __setDependencies({
      models: { OnboardingPersona, OnboardingJourney, OnboardingJourneyInvite },
      sequelize: testSequelize,
      logger,
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await OnboardingJourneyInvite.destroy({ where: {} });
    await OnboardingJourney.destroy({ where: {} });
    await OnboardingPersona.destroy({ where: {} });
  });

  afterAll(async () => {
    __resetDependencies();
    await testSequelize.close();
  });

  it('lists active personas ordered by sort order and title', async () => {
    await OnboardingPersona.bulkCreate([
      {
        slug: 'alpha-founder',
        title: 'Alpha Founder',
        subtitle: 'Lead hiring narrative.',
        benefits: ['Benefit A'],
        metrics: [{ label: 'North Star', value: '120%' }],
        status: 'active',
        sortOrder: 2,
      },
      {
        slug: 'beta-talent',
        title: 'Beta Talent',
        subtitle: 'Talent powerhouse.',
        benefits: ['Benefit B'],
        metrics: [{ label: 'Speed', value: '2x' }],
        status: 'active',
        sortOrder: 1,
      },
      {
        slug: 'deprecated-persona',
        title: 'Deprecated Persona',
        subtitle: 'Retired.',
        status: 'deprecated',
      },
    ]);

    const personas = await listPersonas();

    expect(personas).toHaveLength(2);
    expect(personas[0]).toMatchObject({ id: 'beta-talent', title: 'Beta Talent' });
    expect(personas[1]).toMatchObject({ id: 'alpha-founder', title: 'Alpha Founder' });
    expect(personas[0].metrics).toEqual([{ label: 'Speed', value: '2x' }]);
  });

  it('persists a new journey, archives existing ones, and sanitises invites', async () => {
    const persona = await OnboardingPersona.create({
      slug: 'launch-leader',
      title: 'Launch Leader',
      subtitle: 'Launch elite.',
      benefits: ['Momentum'],
      metrics: [{ label: 'Readiness', value: '5 min' }],
      status: 'active',
      sortOrder: 0,
    });

    const staleJourney = await OnboardingJourney.create({
      personaId: persona.id,
      personaKey: persona.slug,
      personaTitle: persona.title,
      userId: 99,
      status: 'launching',
      profileCompanyName: 'Legacy Co',
      profileRole: 'Founder',
      profileTimezone: 'UTC',
      preferencesDigestCadence: 'weekly',
      preferencesUpdatesEnabled: true,
      preferencesEnableAiDrafts: true,
      preferencesFocusSignals: [],
      preferencesStoryThemes: [],
      invitedCount: 1,
      metadata: {},
    });

    const result = await startJourney({
      actor: { id: 99 },
      payload: {
        personaKey: 'launch-leader',
        profile: {
          companyName: 'Gigvora Labs',
          role: 'Head of Talent',
          timezone: 'Europe/London',
          headline: 'Where hiring magic happens',
          northStar: 'Launch 3 new markets',
        },
        preferences: {
          updates: false,
          digestCadence: 'daily',
          focusSignals: ['Hiring velocity', 'Community engagement'],
          storyThemes: ['Culture'],
          enableAiDrafts: false,
        },
        invites: [
          { email: 'ally@example.com', role: 'Collaborator' },
          { email: 'ALLY@example.com', role: 'Executive' },
        ],
      },
    });

    expect(result).toMatchObject({
      persona: { id: 'launch-leader', title: 'Launch Leader' },
      profile: {
        companyName: 'Gigvora Labs',
        role: 'Head of Talent',
        timezone: 'Europe/London',
        headline: 'Where hiring magic happens',
        northStar: 'Launch 3 new markets',
      },
      preferences: {
        updates: false,
        digestCadence: 'daily',
        focusSignals: ['Hiring velocity', 'Community engagement'],
        storyThemes: ['Culture'],
        enableAiDrafts: false,
      },
    });
    expect(result.invites).toHaveLength(1);
    expect(result.invites[0]).toMatchObject({ email: 'ally@example.com', role: 'Collaborator', status: 'pending' });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'onboarding.journey.started', userId: 99, invitedCount: 1 }),
      'Onboarding journey started',
    );

    const archived = await OnboardingJourney.findByPk(staleJourney.id);
    expect(archived.status).toBe('archived');

    const storedJourney = await OnboardingJourney.findOne({ where: { userId: 99, status: 'launching' } });
    expect(storedJourney.invitedCount).toBe(1);
  });

  it('enforces persona availability and invite validation', async () => {
    const persona = await OnboardingPersona.create({
      slug: 'collab-lead',
      title: 'Collaboration Lead',
      subtitle: 'Lead collaboration.',
      benefits: [],
      metrics: [],
      status: 'active',
      sortOrder: 0,
    });

    await expect(
      startJourney({
        actor: { id: 77 },
        payload: {
          personaKey: 'missing',
          profile: { companyName: 'Test', role: 'Lead', timezone: 'UTC' },
          invites: [{ email: 'ally@example.com' }],
        },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      startJourney({
        actor: { id: 77 },
        payload: {
          personaKey: persona.slug,
          profile: { companyName: 'Test', role: 'Lead', timezone: 'UTC' },
          invites: [],
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      startJourney({
        actor: { id: 77 },
        payload: {
          personaKey: persona.slug,
          profile: { companyName: 'Test', role: 'Lead', timezone: 'UTC' },
          invites: [{ email: 'not-an-email' }],
        },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
