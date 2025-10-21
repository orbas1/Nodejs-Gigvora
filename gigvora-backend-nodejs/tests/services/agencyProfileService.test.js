import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsModulePath = path.resolve(__dirname, '../../src/models/index.js');

const baseAgencyProfile = { id: 11, userId: 42, agencyName: 'Atlas Collective' };
const baseProfile = {
  id: 77,
  userId: 42,
  headline: 'Trailblazing team',
  location: 'Remote',
  update: jest.fn(),
};

const AgencyProfile = {
  create: jest.fn(),
  findOne: jest.fn(),
};
const Profile = { findByPk: jest.fn() };
const AGENCY_PROFILE_MEDIA_ALLOWED_TYPES = ['image', 'video'];
const AGENCY_PROFILE_CREDENTIAL_TYPES = ['certificate', 'qualification'];

const AgencyProfileMedia = {
  findAll: jest.fn(),
  create: jest.fn(),
};
const AgencyProfileSkill = { findAll: jest.fn() };
const AgencyProfileCredential = { findAll: jest.fn() };
const AgencyProfileExperience = { findAll: jest.fn() };
const AgencyProfileWorkforceSegment = { findAll: jest.fn() };
const ProfileFollower = { findAndCountAll: jest.fn(), findOne: jest.fn() };
const Connection = { findAll: jest.fn() };
const User = { findByPk: jest.fn(), findAll: jest.fn() };

const sequelize = {
  transaction: jest.fn(async (handler) => handler({ LOCK: { UPDATE: Symbol('update') } })),
};

await jest.unstable_mockModule(modelsModulePath, () => ({
  sequelize,
  AgencyProfile,
  AgencyProfileMedia,
  AgencyProfileSkill,
  AgencyProfileCredential,
  AgencyProfileExperience,
  AgencyProfileWorkforceSegment,
  Profile,
  ProfileFollower,
  Connection,
  User,
  AGENCY_PROFILE_MEDIA_ALLOWED_TYPES,
  AGENCY_PROFILE_CREDENTIAL_TYPES,
}));

const profileServiceModulePath = path.resolve(__dirname, '../../src/services/profileService.js');
const mockGetProfileOverview = jest.fn();
await jest.unstable_mockModule(profileServiceModulePath, () => ({
  default: { getProfileOverview: mockGetProfileOverview },
  getProfileOverview: mockGetProfileOverview,
}));

const connectionServiceModulePath = path.resolve(__dirname, '../../src/services/connectionService.js');
const mockRequestConnection = jest.fn();
const mockRespondToConnection = jest.fn();
await jest.unstable_mockModule(connectionServiceModulePath, () => ({
  default: {
    requestConnection: mockRequestConnection,
    respondToConnection: mockRespondToConnection,
  },
  requestConnection: mockRequestConnection,
  respondToConnection: mockRespondToConnection,
}));

const engagementModulePath = path.resolve(__dirname, '../../src/services/profileEngagementService.js');
const queueProfileEngagementRecalculation = jest.fn();
await jest.unstable_mockModule(engagementModulePath, () => ({
  queueProfileEngagementRecalculation,
}));

const locationModulePath = path.resolve(__dirname, '../../src/utils/location.js');
const normalizeLocationPayload = jest.fn();
await jest.unstable_mockModule(locationModulePath, () => ({
  normalizeLocationPayload,
}));

const r2ClientModulePath = path.resolve(__dirname, '../../src/utils/r2Client.js');
const uploadEvidence = jest.fn();
await jest.unstable_mockModule(r2ClientModulePath, () => ({
  default: { uploadEvidence },
  uploadEvidence,
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/agencyProfileService.js');

const {
  listAgencyFollowers,
  getAgencyProfileOverview,
  updateAgencyProfile,
  updateAgencyAvatar,
  updateAgencyFollower,
  removeAgencyFollower,
  listAgencyConnections,
} = await import(serviceModulePath);

const { AuthorizationError, NotFoundError, ValidationError } = await import('../../src/utils/errors.js');

function createMutableRecord(plain) {
  const state = { ...plain };
  const core = {
    get: jest.fn(({ plain: toPlain } = {}) => (toPlain ? { ...state } : { ...state })),
    update: jest.fn(async (updates = {}) => Object.assign(state, updates)),
    save: jest.fn(async () => state),
    reload: jest.fn(async () => ({ get: () => ({ ...state }) })),
    destroy: jest.fn(async () => { state.destroyed = true; }),
  };
  return new Proxy(core, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return state[prop];
    },
    set(target, prop, value) {
      if (!['get', 'update', 'save', 'reload', 'destroy'].includes(prop)) {
        state[prop] = value;
      }
      target[prop] = value;
      return true;
    },
    ownKeys() {
      return Reflect.ownKeys(state);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop in target) {
        return Object.getOwnPropertyDescriptor(target, prop);
      }
      return { configurable: true, enumerable: true, value: state[prop] };
    },
  });
}

function followerRow(overrides = {}) {
  const follower = {
    id: overrides.followerId ?? 99,
    get: jest.fn(() => ({
      id: overrides.followerId ?? 99,
      firstName: 'Ruth',
      lastName: 'Miles',
      email: 'ruth@example.com',
      Profile: { headline: 'Connector', location: 'NYC', avatarSeed: 'seed' },
      AgencyProfile: { agencyName: 'Ruth & Co', avatarUrl: 'https://cdn.example/avatar.png' },
    })),
  };
  const plain = {
    id: overrides.id ?? 501,
    profileId: baseProfile.id,
    followerId: overrides.followerId ?? 99,
    status: overrides.status ?? 'active',
    notificationsEnabled: overrides.notificationsEnabled ?? true,
    followedAt: overrides.followedAt ?? new Date('2023-06-01T00:00:00Z'),
    metadata: overrides.metadata ?? { level: 'gold' },
  };
  return {
    ...plain,
    follower,
    get: jest.fn(() => ({ ...plain })),
  };
}

function connectionRow({ id = 8001, requesterId = 42, addresseeId = 99, status = 'accepted', createdAt, updatedAt } = {}) {
  return {
    id,
    requesterId,
    addresseeId,
    status,
    createdAt: createdAt ?? new Date('2023-08-02T12:00:00Z'),
    updatedAt: updatedAt ?? new Date('2023-08-03T10:00:00Z'),
    get: jest.fn(() => ({ id, requesterId, addresseeId, status })),
  };
}

function agencyUser(overrides = {}) {
  const profileRecord = createMutableRecord({ ...baseProfile, ...overrides.profile });
  const agencyRecord = createMutableRecord({ ...baseAgencyProfile, ...overrides.agency });
  return {
    id: 42,
    email: 'atlas@gigvora.test',
    firstName: 'Atlas',
    lastName: 'Collective',
    userType: overrides.userType ?? 'agency',
    Profile: profileRecord,
    AgencyProfile: overrides.includeAgency === false ? null : agencyRecord,
  };
}

function resetMocks() {
  const user = agencyUser({ includeAgency: true });
  User.findByPk.mockReset().mockResolvedValue(user);
  User.findAll.mockReset().mockResolvedValue([]);
  AgencyProfile.create.mockReset().mockImplementation(async (payload) => createMutableRecord(payload));
  AgencyProfile.findOne.mockReset().mockResolvedValue(null);
  baseProfile.update.mockReset();
  ProfileFollower.findAndCountAll.mockReset().mockResolvedValue({ rows: [followerRow({ followerId: 99 })], count: 1 });
  ProfileFollower.findOne.mockReset().mockResolvedValue(createMutableRecord({
    id: 701,
    profileId: baseProfile.id,
    followerId: 99,
    status: 'active',
    notificationsEnabled: true,
  }));
  Connection.findAll.mockReset().mockResolvedValue([]);
  sequelize.transaction.mockClear().mockImplementation(async (handler) => handler({ LOCK: { UPDATE: Symbol('update') } }));
  mockGetProfileOverview.mockReset().mockResolvedValue({
    summary: { headline: 'Trailblazers' },
    metrics: { views: 120 },
  });
  mockRequestConnection.mockReset().mockResolvedValue({
    id: 401,
    status: 'pending',
    requester: { id: 42 },
    addressee: { id: 99 },
    createdAt: new Date('2023-01-01T00:00:00Z'),
  });
  mockRespondToConnection.mockReset().mockResolvedValue({
    id: 501,
    status: 'accepted',
    requesterId: 42,
    addresseeId: 99,
    addressee: { id: 99 },
    requester: { id: 42 },
    updatedAt: new Date('2023-01-02T00:00:00Z'),
  });
  queueProfileEngagementRecalculation.mockReset().mockResolvedValue(undefined);
  normalizeLocationPayload.mockReset().mockReturnValue({
    location: 'Austin, TX',
    geoLocation: { lat: 30.2672, lng: -97.7431 },
  });
  uploadEvidence.mockReset().mockResolvedValue({ stored: true, key: 'agency-avatars/42.png', url: 'https://cdn.test/42.png' });
}

describe('agencyProfileService', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('returns followers with pagination metadata', async () => {
    const result = await listAgencyFollowers(42, { limit: 5, offset: 0 });

    expect(User.findByPk).toHaveBeenCalledWith(42, expect.any(Object));
    expect(ProfileFollower.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5, offset: 0 }));
    expect(result).toMatchObject({
      pagination: { total: 1, limit: 5, offset: 0 },
      items: [
        expect.objectContaining({
          followerId: 99,
          status: 'active',
          user: expect.objectContaining({ name: 'Ruth Miles', email: 'ruth@example.com' }),
        }),
      ],
    });
  });

  it('hydrates overview with preferences, followers, and connections', async () => {
    Connection.findAll.mockImplementation(async ({ where }) => {
      if (where.status === 'accepted') {
        return [connectionRow({ status: 'accepted', requesterId: 42, addresseeId: 99 })];
      }
      return [connectionRow({ status: 'pending', requesterId: 42, addresseeId: 55 })];
    });
    User.findAll.mockResolvedValue([
      {
        id: 99,
        get: () => ({ id: 99, firstName: 'Ruth', lastName: 'Miles', email: 'ruth@example.com', Profile: {}, AgencyProfile: {} }),
      },
      {
        id: 55,
        get: () => ({ id: 55, firstName: 'Leo', lastName: 'Chen', email: 'leo@example.com', Profile: {}, AgencyProfile: {} }),
      },
    ]);

    const overview = await getAgencyProfileOverview(42, { includeConnections: true, includeFollowers: true });

    expect(overview.overview).toEqual({ summary: { headline: 'Trailblazers' }, metrics: { views: 120 } });
    expect(overview.preferences).toMatchObject({ followerPolicy: expect.any(String), connectionPolicy: expect.any(String) });
    expect(overview.followers.items).toHaveLength(1);
    expect(overview.connections.summary).toMatchObject({ accepted: 1, pendingIncoming: 0, pendingOutgoing: 1 });
  });

  it('updates agency profile with sanitised inputs inside a transaction', async () => {
    const contextAgency = agencyUser({ includeAgency: true });
    User.findByPk.mockResolvedValue(contextAgency);
    normalizeLocationPayload.mockReturnValue({ location: 'Austin, TX', geoLocation: { lat: 30.26, lng: -97.74 } });

    const result = await updateAgencyProfile(42, {
      headline: 'New headline',
      agencyName: 'Atlas Group',
      website: 'atlas.example',
      services: ['Strategy', 'Design'],
      location: 'Austin',
    });

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(contextAgency.Profile.update).toHaveBeenCalledWith(expect.objectContaining({ headline: 'New headline' }), expect.any(Object));
    expect(contextAgency.AgencyProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      agencyName: 'Atlas Group',
      website: 'https://atlas.example/',
    }), expect.any(Object));
    expect(result.preferences.agencyName).toBeUndefined();
    expect(mockGetProfileOverview).toHaveBeenCalled();
  });

  it('stores uploaded avatar assets and refreshes overview', async () => {
    const contextAgency = agencyUser({ includeAgency: false });
    User.findByPk.mockResolvedValue(contextAgency);

    const overview = await updateAgencyAvatar(42, {
      brandColor: '#F60',
      imageData: Buffer.from('image').toString('base64'),
    });

    expect(uploadEvidence).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'agency-avatars' }));
    expect(sequelize.transaction).toHaveBeenCalled();
    expect(mockGetProfileOverview).toHaveBeenCalled();
    expect(overview.preferences).toBeDefined();
  });

  it('updates follower state and queues engagement recalculation', async () => {
    const followerUser = {
      id: 99,
      get: () => ({
        id: 99,
        firstName: 'Ruth',
        lastName: 'Miles',
        email: 'ruth@example.com',
        Profile: {},
        AgencyProfile: {},
      }),
    };
    User.findByPk.mockImplementation(async (id) => (id === 42 ? agencyUser({ includeAgency: true }) : followerUser));

    const result = await updateAgencyFollower(42, 99, { status: 'muted', notificationsEnabled: false });

    expect(ProfileFollower.findOne).toHaveBeenCalled();
    const record = await ProfileFollower.findOne.mock.results[0].value;
    expect(record.save).toHaveBeenCalledWith(expect.any(Object));
    expect(queueProfileEngagementRecalculation).toHaveBeenCalledWith(baseProfile.id, expect.objectContaining({ reason: 'profile_follower_updated' }));
    expect(result.status).toBe('muted');
  });

  it('removes followers and recalculates engagement', async () => {
    await removeAgencyFollower(42, 99);

    expect(ProfileFollower.findOne).toHaveBeenCalled();
    const record = await ProfileFollower.findOne.mock.results[0].value;
    expect(record.destroy).toHaveBeenCalled();
    expect(queueProfileEngagementRecalculation).toHaveBeenCalledWith(baseProfile.id, expect.objectContaining({ reason: 'profile_follower_removed' }));
  });

  it('summarises connections grouped by status', async () => {
    Connection.findAll.mockImplementation(async ({ where }) => {
      if (where.status === 'accepted') {
        return [connectionRow({ status: 'accepted', requesterId: 99, addresseeId: 42 })];
      }
      return [
        connectionRow({ status: 'pending', requesterId: 55, addresseeId: 42 }),
        connectionRow({ status: 'pending', requesterId: 42, addresseeId: 88 }),
      ];
    });
    User.findAll.mockResolvedValue([
      { id: 99, get: () => ({ id: 99, firstName: 'Ruth', lastName: 'Miles', email: 'ruth@example.com', Profile: {}, AgencyProfile: {} }) },
      { id: 55, get: () => ({ id: 55, firstName: 'Leo', lastName: 'Chen', email: 'leo@example.com', Profile: {}, AgencyProfile: {} }) },
      { id: 88, get: () => ({ id: 88, firstName: 'Quinn', lastName: 'Jones', email: 'quinn@example.com', Profile: {}, AgencyProfile: {} }) },
    ]);

    const connections = await listAgencyConnections(42);

    expect(connections.summary).toEqual({ accepted: 1, pendingIncoming: 1, pendingOutgoing: 1 });
    expect(connections.accepted[0]).toMatchObject({ counterpart: expect.objectContaining({ id: 99 }) });
    expect(connections.pendingIncoming[0]).toMatchObject({ requester: expect.objectContaining({ id: 55 }) });
    expect(connections.pendingOutgoing[0]).toMatchObject({ target: expect.objectContaining({ id: 88 }) });
  });

  it('guards updates when actor is not permitted', async () => {
    const adminContext = agencyUser({ userType: 'freelancer' });
    User.findByPk.mockResolvedValueOnce(adminContext);

    await expect(updateAgencyProfile(42, {}, { actorId: 7 })).rejects.toBeInstanceOf(ValidationError);
  });

  it('validates follower identifier', async () => {
    await expect(listAgencyFollowers('invalid')).rejects.toBeInstanceOf(ValidationError);
  });

  it('throws when removing unknown follower', async () => {
    ProfileFollower.findOne.mockResolvedValueOnce(null);
    await expect(removeAgencyFollower(42, 404)).rejects.toBeInstanceOf(NotFoundError);
  });
});

