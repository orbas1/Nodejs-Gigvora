import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');
const r2ClientModulePath = path.resolve(__dirname, '../../src/utils/r2Client.js');
const engagementModulePath = path.resolve(
  __dirname,
  '../../src/services/profileEngagementService.js',
);
const profileServiceModulePath = path.resolve(__dirname, '../../src/services/profileService.js');

const transactionMock = { LOCK: { UPDATE: Symbol('update') } };
const sequelize = { transaction: jest.fn() };
const AgencyProfile = { create: jest.fn() };
const ProfileFollower = { findAndCountAll: jest.fn(), findOne: jest.fn() };
const Connection = { findAll: jest.fn() };
const User = { findByPk: jest.fn(), findAll: jest.fn() };
const AGENCY_PROFILE_MEDIA_ALLOWED_TYPES = ['image', 'banner'];
const AGENCY_PROFILE_CREDENTIAL_TYPES = ['certificate', 'qualification'];
const ANALYTICS_ACTOR_TYPES = [];
const PROFILE_AVAILABILITY_STATUSES = ['available'];
const PROFILE_VISIBILITY_OPTIONS = ['public'];
const PROFILE_NETWORK_VISIBILITY_OPTIONS = ['connections'];
const PROFILE_FOLLOWERS_VISIBILITY_OPTIONS = ['followers'];
const CORPORATE_VERIFICATION_STATUSES = ['pending'];
const CORPORATE_VERIFICATION_REJECTION_REASONS = ['missing_documents'];
const ESCROW_INTEGRATION_PROVIDERS = ['stripe'];
const ID_VERIFICATION_STATUSES = ['pending'];
const QUALIFICATION_CREDENTIAL_STATUSES = ['pending'];
const WALLET_ACCOUNT_TYPES = ['operational'];
const WALLET_LEDGER_ENTRY_TYPES = ['credit'];

function createModelMock() {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    bulkCreate: jest.fn(),
    max: jest.fn(),
    min: jest.fn(),
  };
}

const baseModels = {
  sequelize,
  AgencyProfile,
  ProfileFollower,
  Connection,
  User,
  CompanyProfile: createModelMock(),
  FreelancerProfile: createModelMock(),
  Profile: createModelMock(),
  AgencyProfileMedia: createModelMock(),
  AgencyProfileSkill: createModelMock(),
  AgencyProfileCredential: createModelMock(),
  AgencyProfileExperience: createModelMock(),
  AgencyProfileWorkforceSegment: createModelMock(),
  ProfileReference: createModelMock(),
  AnalyticsDailyRollup: createModelMock(),
  AnalyticsEvent: createModelMock(),
  CorporateVerification: createModelMock(),
  EscrowAccount: createModelMock(),
  IdentityVerification: createModelMock(),
  QualificationCredential: createModelMock(),
  WalletAccount: createModelMock(),
  WalletLedgerEntry: createModelMock(),
  AGENCY_PROFILE_MEDIA_ALLOWED_TYPES,
  AGENCY_PROFILE_CREDENTIAL_TYPES,
  ANALYTICS_ACTOR_TYPES,
  PROFILE_AVAILABILITY_STATUSES,
  PROFILE_VISIBILITY_OPTIONS,
  PROFILE_NETWORK_VISIBILITY_OPTIONS,
  PROFILE_FOLLOWERS_VISIBILITY_OPTIONS,
  CORPORATE_VERIFICATION_STATUSES,
  CORPORATE_VERIFICATION_REJECTION_REASONS,
  ESCROW_INTEGRATION_PROVIDERS,
  ID_VERIFICATION_STATUSES,
  QUALIFICATION_CREDENTIAL_STATUSES,
  WALLET_ACCOUNT_TYPES,
  WALLET_LEDGER_ENTRY_TYPES,
};

const modelsProxy = new Proxy(baseModels, {
  get(target, prop) {
    if (prop in target) {
      return target[prop];
    }
    const mock = createModelMock();
    target[prop] = mock;
    return mock;
  },
});

const uploadEvidence = jest.fn();
const queueProfileEngagementRecalculation = jest.fn();
const shouldRefreshEngagementMetrics = jest.fn().mockResolvedValue(false);
const profileServiceMock = {
  getProfileOverview: jest.fn(),
};

await jest.unstable_mockModule(modelsModulePath, () => modelsProxy);

await jest.unstable_mockModule(r2ClientModulePath, () => ({
  uploadEvidence,
  default: {
    uploadEvidence,
  },
}));

await jest.unstable_mockModule(engagementModulePath, () => ({
  queueProfileEngagementRecalculation,
  shouldRefreshEngagementMetrics,
}));

await jest.unstable_mockModule(profileServiceModulePath, () => ({
  default: profileServiceMock,
  getProfileOverview: profileServiceMock.getProfileOverview,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agencyProfileService.js');
const serviceModule = await import(serviceModulePath);

const { listAgencyFollowers } = serviceModule;

const { ValidationError } = await import('../../src/utils/errors.js');

function createUserContext(overrides = {}) {
  const profile = overrides.profile ?? {
    id: 77,
    location: null,
    geoLocation: null,
    avatarSeed: 'agency-seed',
    update: jest.fn().mockResolvedValue(undefined),
  };
  const agencyProfile = overrides.agencyProfile ?? overrides.profile?.AgencyProfile ?? null;
  return {
    id: overrides.id ?? 42,
    firstName: overrides.firstName ?? 'Ada',
    lastName: overrides.lastName ?? 'Lovelace',
    email: overrides.email ?? 'ada@example.com',
    userType: overrides.userType ?? 'agency',
    Profile: profile,
    AgencyProfile: agencyProfile,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  sequelize.transaction.mockImplementation(async (callback) => callback(transactionMock));
  AgencyProfile.create.mockResolvedValue({ id: 91 });
  User.findByPk.mockImplementation(async () => createUserContext());
  profileServiceMock.getProfileOverview.mockReset().mockResolvedValue({ id: 999, headline: 'Overview' });
  shouldRefreshEngagementMetrics.mockResolvedValue(false);
});

describe('updateAgencyAvatar', () => {
  it('stores uploaded avatar and updates profile metadata', async () => {
    const overviewPayload = { id: 42 };
    profileServiceMock.getProfileOverview.mockResolvedValueOnce(overviewPayload);

    const base64 = Buffer.from('avatar-bytes').toString('base64');
    uploadEvidence.mockResolvedValue({ stored: true, key: 'avatars/agency-42.png', url: 'https://cdn/avatar.png' });

    const result = await serviceModule.updateAgencyAvatar(
      42,
      {
        imageData: `data:image/png;base64,${base64}`,
        brandColor: '#12abef',
        avatarSeed: 'Team Atlas',
      },
      { actorId: 42 },
    );

    expect(uploadEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'agency-avatars',
        fileName: 'agency-42.png',
        contentType: 'image/png',
        metadata: { owner: 'agency:42' },
      }),
    );
    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    const profileRecord = await User.findByPk.mock.results[0].value;
    expect(profileRecord.Profile.update).toHaveBeenCalledTimes(1);
    expect(profileRecord.Profile.update.mock.calls[0][0]).toEqual({ avatarSeed: 'Team Atlas' });
    expect(AgencyProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        avatarUrl: 'https://cdn/avatar.png',
        avatarStorageKey: 'avatars/agency-42.png',
        brandColor: '#12ABEF',
      }),
      expect.any(Object),
    );
    expect(profileServiceMock.getProfileOverview).toHaveBeenCalledWith(42, { bypassCache: true });
    expect(result).toMatchObject({
      overview: overviewPayload,
      followers: null,
      connections: null,
    });
    expect(result.preferences).toMatchObject({
      autoAcceptFollowers: expect.any(Boolean),
      followerPolicy: expect.any(String),
      connectionPolicy: expect.any(String),
    });
  });

  it('requires valid image payload when storage is unavailable', async () => {
    uploadEvidence.mockResolvedValue({ stored: false });

    await expect(
      serviceModule.updateAgencyAvatar(7, { imageData: Buffer.from('x').toString('base64') }, { actorId: 7 }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('listAgencyFollowers', () => {
  it('returns formatted follower payload with pagination', async () => {
    const profileRecord = createUserContext().Profile;
    User.findByPk.mockResolvedValueOnce(createUserContext({ Profile: profileRecord }));

    ProfileFollower.findAndCountAll.mockResolvedValue({
      rows: [
        {
          id: 301,
          followerId: 55,
          profileId: profileRecord.id,
          status: 'active',
          notificationsEnabled: true,
          followedAt: new Date('2024-02-01T12:34:56.000Z'),
          metadata: { tags: ['vip'] },
          follower: {
            id: 55,
            firstName: 'Jess',
            lastName: 'Harper',
            email: 'jess@example.com',
            userType: 'agency',
            Profile: { headline: 'Operations Lead', location: 'Berlin', avatarSeed: 'jess-h' },
            AgencyProfile: { agencyName: 'Harper Agency', avatarUrl: 'https://cdn.example.com/jess.png' },
          },
        },
      ],
      count: 1,
    });

    const result = await listAgencyFollowers(42);

    expect(ProfileFollower.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { profileId: profileRecord.id },
        limit: 25,
        offset: 0,
      }),
    );
    expect(result).toEqual({
      items: [
        {
          id: 301,
          followerId: 55,
          profileId: profileRecord.id,
          status: 'active',
          notificationsEnabled: true,
          followedAt: '2024-02-01T12:34:56.000Z',
          metadata: { tags: ['vip'] },
          user: {
            id: 55,
            name: 'Jess Harper',
            email: 'jess@example.com',
            userType: 'agency',
            headline: 'Operations Lead',
            location: 'Berlin',
            avatarSeed: 'jess-h',
            avatarUrl: 'https://cdn.example.com/jess.png',
          },
        },
      ],
      pagination: {
        total: 1,
        limit: 25,
        offset: 0,
      },
    });
  });
});
