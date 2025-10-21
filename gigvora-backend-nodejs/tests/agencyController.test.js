import { jest, describe, beforeAll, beforeEach, it, expect } from '@jest/globals';
import { AuthorizationError, ValidationError } from '../src/utils/errors.js';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const schemaModuleUrl = new URL('../src/validation/schemas/agencySchemas.js', import.meta.url);
const dashboardModuleUrl = new URL('../src/services/agencyDashboardService.js', import.meta.url);
const overviewModuleUrl = new URL('../src/services/agencyOverviewService.js', import.meta.url);
const profileServiceModuleUrl = new URL('../src/services/agencyProfileService.js', import.meta.url);
const controllerModuleUrl = new URL('../src/controllers/agencyController.js', import.meta.url);

function createSchemaMock(parser) {
  return {
    safeParse(input = {}) {
      try {
        const data = parser(input);
        return { success: true, data };
      } catch (error) {
        if (error && typeof error === 'object' && Array.isArray(error.issues)) {
          return { success: false, error };
        }
        return { success: false, error: { issues: [{ path: [], message: error?.message ?? 'Invalid payload' }] } };
      }
    },
  };
}

function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const text = `${value}`.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(text)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(text)) {
    return false;
  }
  return undefined;
}

function parseNumber(value, { allowZero = true } = {}) {
  if (value == null || value === '') {
    return undefined;
  }
  const number = Number.parseInt(`${value}`, 10);
  if (!Number.isFinite(number)) {
    throw { issues: [{ path: [], message: 'Invalid number' }] };
  }
  if (!allowZero && number <= 0) {
    throw { issues: [{ path: [], message: 'Must be greater than zero' }] };
  }
  return number;
}

function parsePositiveId(value, label) {
  const number = parseNumber(value, { allowZero: false });
  if (!number || number <= 0) {
    throw { issues: [{ path: [label], message: 'Must be a positive integer' }] };
  }
  return number;
}

jest.unstable_mockModule(schemaModuleUrl.pathname, () => {
  const agencyProfileQuerySchema = createSchemaMock((input = {}) => ({
    includeFollowers: parseBoolean(input.includeFollowers),
    includeConnections: parseBoolean(input.includeConnections),
    followersLimit: parseNumber(input.followersLimit),
    followersOffset: parseNumber(input.followersOffset),
    userId: input.userId == null || input.userId === '' ? undefined : parsePositiveId(input.userId, 'userId'),
    fresh: parseBoolean(input.fresh),
  }));

  const updateAgencyProfileSchema = createSchemaMock((input = {}) => {
    const services = Array.isArray(input.services)
      ? input.services.map((value) => `${value ?? ''}`.trim()).filter((value) => value.length > 0)
      : undefined;
    const website = input.website == null || input.website === ''
      ? undefined
      : (() => {
          const trimmed = `${input.website}`.trim();
          return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        })();
    return {
      agencyName: input.agencyName == null ? undefined : `${input.agencyName}`.trim(),
      services,
      teamSize: parseNumber(input.teamSize, { allowZero: false }),
      website,
    };
  });

  const updateAgencyAvatarSchema = createSchemaMock((input = {}) => {
    const payload = {
      imageData: input.imageData == null || `${input.imageData}`.trim() === '' ? undefined : `${input.imageData}`.trim(),
      avatarUrl: input.avatarUrl == null || `${input.avatarUrl}`.trim() === '' ? undefined : `${input.avatarUrl}`.trim(),
      avatarSeed: input.avatarSeed == null || `${input.avatarSeed}`.trim() === '' ? undefined : `${input.avatarSeed}`.trim(),
      bannerUrl: input.bannerUrl == null || `${input.bannerUrl}`.trim() === '' ? undefined : `${input.bannerUrl}`.trim(),
      brandColor: input.brandColor == null || `${input.brandColor}`.trim() === '' ? undefined : `${input.brandColor}`.trim(),
    };
    if (!Object.values(payload).some((value) => value !== undefined)) {
      throw { issues: [{ path: [], message: 'At least one field must be provided.' }] };
    }
    return payload;
  });

  const listFollowersQuerySchema = createSchemaMock((input = {}) => ({
    limit: parseNumber(input.limit),
    offset: parseNumber(input.offset),
    userId: input.userId == null || input.userId === '' ? undefined : parsePositiveId(input.userId, 'userId'),
  }));

  const followerParamsSchema = createSchemaMock((input = {}) => ({
    followerId: parsePositiveId(input.followerId, 'followerId'),
  }));

  const updateFollowerBodySchema = createSchemaMock((input = {}) => ({
    status: input.status == null ? undefined : `${input.status}`.trim(),
    notificationsEnabled: parseBoolean(input.notificationsEnabled),
  }));

  const requestConnectionBodySchema = createSchemaMock((input = {}) => ({
    targetId: parsePositiveId(input.targetId, 'targetId'),
  }));

  const connectionParamsSchema = createSchemaMock((input = {}) => ({
    connectionId: parsePositiveId(input.connectionId, 'connectionId'),
  }));

  const respondConnectionBodySchema = createSchemaMock((input = {}) => {
    if (input.decision == null || `${input.decision}`.trim() === '') {
      throw { issues: [{ path: ['decision'], message: 'decision is required' }] };
    }
    return { decision: `${input.decision}`.trim().toLowerCase() };
  });

  const createAgencyProfileMediaSchema = createSchemaMock((input = {}) => {
    if (!input.url || `${input.url}`.trim() === '') {
      throw { issues: [{ path: ['url'], message: 'url is required' }] };
    }
    const url = `${input.url}`.trim();
    if (!url.startsWith('http')) {
      throw { issues: [{ path: ['url'], message: 'url must be absolute' }] };
    }
    return {
      type: input.type == null || `${input.type}`.trim() === '' ? 'image' : `${input.type}`.trim(),
      title: input.title == null || `${input.title}`.trim() === '' ? undefined : `${input.title}`.trim(),
      url,
      description: input.description == null || `${input.description}`.trim() === '' ? undefined : `${input.description}`.trim(),
    };
  });

  const updateAgencyProfileMediaSchema = createSchemaMock((input = {}) => ({
    type: input.type == null || `${input.type}`.trim() === '' ? undefined : `${input.type}`.trim(),
    title: input.title == null || `${input.title}`.trim() === '' ? undefined : `${input.title}`.trim(),
    url: input.url == null || `${input.url}`.trim() === '' ? undefined : `${input.url}`.trim(),
    description: input.description == null || `${input.description}`.trim() === '' ? undefined : `${input.description}`.trim(),
  }));

  const createAgencyProfileSkillSchema = createSchemaMock((input = {}) => ({
    name: `${input.name ?? ''}`.trim(),
    category: input.category == null || `${input.category}`.trim() === '' ? undefined : `${input.category}`.trim(),
    proficiency: parseNumber(input.proficiency),
    experienceYears: parseNumber(input.experienceYears),
    isFeatured: parseBoolean(input.isFeatured),
  }));

  const updateAgencyProfileSkillSchema = createSchemaMock((input = {}) => ({
    name: input.name == null || `${input.name}`.trim() === '' ? undefined : `${input.name}`.trim(),
    category: input.category == null || `${input.category}`.trim() === '' ? undefined : `${input.category}`.trim(),
    proficiency: parseNumber(input.proficiency),
    experienceYears: parseNumber(input.experienceYears),
    isFeatured: parseBoolean(input.isFeatured),
  }));

  const createAgencyProfileCredentialSchema = createSchemaMock((input = {}) => ({
    name: `${input.name ?? ''}`.trim(),
    issuer: input.issuer == null || `${input.issuer}`.trim() === '' ? undefined : `${input.issuer}`.trim(),
    issuedAt: input.issuedAt == null || `${input.issuedAt}`.trim() === '' ? undefined : `${input.issuedAt}`.trim(),
  }));

  const updateAgencyProfileCredentialSchema = createAgencyProfileCredentialSchema;

  const createAgencyProfileExperienceSchema = createSchemaMock((input = {}) => ({
    title: `${input.title ?? ''}`.trim(),
    organisation: input.organisation == null || `${input.organisation}`.trim() === '' ? undefined : `${input.organisation}`.trim(),
  }));

  const updateAgencyProfileExperienceSchema = createAgencyProfileExperienceSchema;

  const createAgencyProfileWorkforceSegmentSchema = createSchemaMock((input = {}) => ({
    name: `${input.name ?? ''}`.trim(),
    specialization: input.specialization == null || `${input.specialization}`.trim() === ''
      ? undefined
      : `${input.specialization}`.trim(),
  }));

  const updateAgencyProfileWorkforceSegmentSchema = createAgencyProfileWorkforceSegmentSchema;

  return {
    agencyProfileQuerySchema,
    updateAgencyProfileSchema,
    updateAgencyAvatarSchema,
    listFollowersQuerySchema,
    followerParamsSchema,
    updateFollowerBodySchema,
    requestConnectionBodySchema,
    connectionParamsSchema,
    respondConnectionBodySchema,
    createAgencyProfileMediaSchema,
    updateAgencyProfileMediaSchema,
    createAgencyProfileSkillSchema,
    updateAgencyProfileSkillSchema,
    createAgencyProfileCredentialSchema,
    updateAgencyProfileCredentialSchema,
    createAgencyProfileExperienceSchema,
    updateAgencyProfileExperienceSchema,
    createAgencyProfileWorkforceSegmentSchema,
    updateAgencyProfileWorkforceSegmentSchema,
  };
});

const getAgencyDashboard = jest.fn();
const getAgencyOverview = jest.fn();
const updateAgencyOverview = jest.fn();
const getAgencyProfileOverview = jest.fn();
const updateAgencyProfile = jest.fn();
const updateAgencyAvatar = jest.fn();
const getAgencyProfileManagement = jest.fn();
const listAgencyFollowers = jest.fn();
const updateAgencyFollower = jest.fn();
const removeAgencyFollower = jest.fn();
const listAgencyConnections = jest.fn();
const requestAgencyConnection = jest.fn();
const respondToAgencyConnection = jest.fn();
const removeAgencyConnection = jest.fn();
const createAgencyProfileMedia = jest.fn();
const updateAgencyProfileMedia = jest.fn();
const deleteAgencyProfileMedia = jest.fn();
const createAgencyProfileSkill = jest.fn();
const updateAgencyProfileSkill = jest.fn();
const deleteAgencyProfileSkill = jest.fn();
const createAgencyProfileCredential = jest.fn();
const updateAgencyProfileCredential = jest.fn();
const deleteAgencyProfileCredential = jest.fn();
const createAgencyProfileExperience = jest.fn();
const updateAgencyProfileExperience = jest.fn();
const deleteAgencyProfileExperience = jest.fn();
const createAgencyProfileWorkforceSegment = jest.fn();
const updateAgencyProfileWorkforceSegment = jest.fn();
const deleteAgencyProfileWorkforceSegment = jest.fn();

jest.unstable_mockModule(dashboardModuleUrl.pathname, () => ({
  getAgencyDashboard,
}));

jest.unstable_mockModule(overviewModuleUrl.pathname, () => ({
  getAgencyOverview,
  updateAgencyOverview,
}));

jest.unstable_mockModule(profileServiceModuleUrl.pathname, () => ({
  getAgencyProfileOverview,
  updateAgencyProfile,
  updateAgencyAvatar,
  getAgencyProfileManagement,
  listAgencyFollowers,
  updateAgencyFollower,
  removeAgencyFollower,
  listAgencyConnections,
  requestAgencyConnection,
  respondToAgencyConnection,
  removeAgencyConnection,
  createAgencyProfileMedia,
  updateAgencyProfileMedia,
  deleteAgencyProfileMedia,
  createAgencyProfileSkill,
  updateAgencyProfileSkill,
  deleteAgencyProfileSkill,
  createAgencyProfileCredential,
  updateAgencyProfileCredential,
  deleteAgencyProfileCredential,
  createAgencyProfileExperience,
  updateAgencyProfileExperience,
  deleteAgencyProfileExperience,
  createAgencyProfileWorkforceSegment,
  updateAgencyProfileWorkforceSegment,
  deleteAgencyProfileWorkforceSegment,
}));

let controller;

beforeAll(async () => {
  controller = await import(controllerModuleUrl.pathname);
});

beforeEach(() => {
  jest.clearAllMocks();
});

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('agencyController.dashboard', () => {
  it('forwards sanitised filters and actor context to the dashboard service', async () => {
    const req = {
      query: { workspaceId: '42', workspaceSlug: '  apex-labs  ', lookbackDays: '30' },
      user: { id: '11', type: 'agency_admin', roles: ['agency_admin'] },
    };
    const res = createResponse();
    const payload = { ok: true };
    getAgencyDashboard.mockResolvedValue(payload);

    await controller.dashboard(req, res);

    expect(getAgencyDashboard).toHaveBeenCalledWith(
      { workspaceId: 42, workspaceSlug: 'apex-labs', lookbackDays: 30 },
      { actorId: 11, actorRole: 'agency_admin', actorRoles: ['agency_admin'] },
    );
    expect(res.json).toHaveBeenCalledWith(payload);
  });
});

describe('agencyController.getProfile', () => {
  it('resolves the target user and forwards viewer context', async () => {
    const req = {
      query: {
        userId: 99,
        includeFollowers: false,
        includeConnections: true,
        followersLimit: 15,
        followersOffset: 5,
        fresh: true,
      },
      user: { id: 12, type: 'admin', roles: ['admin'] },
    };
    const res = createResponse();
    getAgencyProfileOverview.mockResolvedValue({ overview: {} });

    await controller.getProfile(req, res);

    expect(getAgencyProfileOverview).toHaveBeenCalledWith(99, {
      includeFollowers: false,
      includeConnections: true,
      followersLimit: 15,
      followersOffset: 5,
      bypassCache: true,
      viewerId: 12,
    });
    expect(res.json).toHaveBeenCalled();
  });

  it('rejects when a non-admin requests another user profile', async () => {
    const req = {
      query: { userId: 44 },
      user: { id: 33, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();

    await expect(controller.getProfile(req, res)).rejects.toThrow(AuthorizationError);
    expect(getAgencyProfileOverview).not.toHaveBeenCalled();
  });
});

describe('agencyController.updateProfile', () => {
  it('normalises payloads before delegating to the profile service', async () => {
    const req = {
      body: {
        agencyName: '  Horizon Studio  ',
        services: [' Design ', ''],
        teamSize: 25,
        website: 'horizon.test',
      },
      user: { id: 7, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();
    const overview = { overview: { agencyName: 'Horizon Studio' } };
    updateAgencyProfile.mockResolvedValue(overview);

    await controller.updateProfile(req, res);

    expect(updateAgencyProfile).toHaveBeenCalledWith(
      7,
      {
        agencyName: 'Horizon Studio',
        services: ['Design'],
        teamSize: 25,
        website: 'https://horizon.test',
      },
      { actorId: 7 },
    );
    expect(res.json).toHaveBeenCalledWith(overview);
  });
});

describe('agencyController.updateAvatar', () => {
  it('passes branding updates through to the service', async () => {
    const req = {
      body: { avatarSeed: 'orion', bannerUrl: 'https://cdn.test/banner.png' },
      user: { id: 55, type: 'agency_admin', roles: ['agency_admin'] },
    };
    const res = createResponse();
    updateAgencyAvatar.mockResolvedValue({ ok: true });

    await controller.updateAvatar(req, res);

    expect(updateAgencyAvatar).toHaveBeenCalledWith(
      55,
      {
        avatarSeed: 'orion',
        bannerUrl: 'https://cdn.test/banner.png',
      },
      { actorId: 55 },
    );
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('agencyController.profile management operations', () => {
  it('loads the management dashboard for the authenticated agency', async () => {
    const req = { user: { id: 5, type: 'agency', roles: ['agency'] } };
    const res = createResponse();
    const snapshot = { profile: { id: 5 } };
    getAgencyProfileManagement.mockResolvedValue(snapshot);

    await controller.profile(req, res);

    expect(getAgencyProfileManagement).toHaveBeenCalledWith({}, {
      actorId: 5,
      actorRole: 'agency',
      actorRoles: ['agency'],
    });
    expect(res.json).toHaveBeenCalledWith(snapshot);
  });

  it('creates media assets with validation', async () => {
    const req = {
      user: { id: 91, type: 'agency', roles: ['agency'] },
      body: {
        type: 'image',
        title: ' Case study ',
        url: 'https://cdn.test/case-study.png',
        description: ' Flagship engagement ',
      },
    };
    const res = createResponse();
    const media = { id: 1, title: 'Case study' };
    createAgencyProfileMedia.mockResolvedValue(media);

    await controller.createMedia(req, res);

    expect(createAgencyProfileMedia).toHaveBeenCalledWith(91, {
      type: 'image',
      title: 'Case study',
      url: 'https://cdn.test/case-study.png',
      description: 'Flagship engagement',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(media);
  });

  it('rejects media creation with invalid payloads', async () => {
    const req = {
      user: { id: 91, type: 'agency', roles: ['agency'] },
      body: { type: 'image' },
    };
    const res = createResponse();

    await expect(controller.createMedia(req, res)).rejects.toThrow(ValidationError);
    expect(createAgencyProfileMedia).not.toHaveBeenCalled();
  });
});

describe('agencyController.followers', () => {
  it('lists followers using pagination hints', async () => {
    const req = {
      query: { limit: 10, offset: 5 },
      user: { id: 71, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();
    listAgencyFollowers.mockResolvedValue({ items: [], pagination: { total: 0 } });

    await controller.listFollowers(req, res);

    expect(listAgencyFollowers).toHaveBeenCalledWith(71, { limit: 10, offset: 5 });
    expect(res.json).toHaveBeenCalled();
  });

  it('updates follower metadata', async () => {
    const req = {
      params: { followerId: '20' },
      body: { status: 'muted' },
      user: { id: 71, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();
    updateAgencyFollower.mockResolvedValue({ id: 20, status: 'muted' });

    await controller.updateFollower(req, res);

    expect(updateAgencyFollower).toHaveBeenCalledWith(71, 20, { status: 'muted' });
    expect(res.json).toHaveBeenCalledWith({ id: 20, status: 'muted' });
  });

  it('removes followers and returns 204', async () => {
    const req = {
      params: { followerId: '99' },
      user: { id: 71, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();

    await controller.removeFollower(req, res);

    expect(removeAgencyFollower).toHaveBeenCalledWith(71, 99);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});

describe('agencyController.connections', () => {
  it('creates outbound connection requests', async () => {
    const req = {
      body: { targetId: 64 },
      user: { id: 71, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();
    const connection = { id: 123, status: 'pending' };
    requestAgencyConnection.mockResolvedValue(connection);

    await controller.requestConnection(req, res);

    expect(requestAgencyConnection).toHaveBeenCalledWith(71, 64);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(connection);
  });

  it('responds to connection requests with normalised decision', async () => {
    const req = {
      params: { connectionId: '55' },
      body: { decision: 'ACCEPT' },
      user: { id: 71, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();
    respondToAgencyConnection.mockResolvedValue({ id: 55, status: 'accepted' });

    await controller.respondToConnection(req, res);

    expect(respondToAgencyConnection).toHaveBeenCalledWith(71, 55, 'accept');
    expect(res.json).toHaveBeenCalledWith({ id: 55, status: 'accepted' });
  });

  it('removes connections and returns 204', async () => {
    const req = {
      params: { connectionId: '55' },
      user: { id: 71, type: 'agency', roles: ['agency'] },
    };
    const res = createResponse();

    await controller.removeConnection(req, res);

    expect(removeAgencyConnection).toHaveBeenCalledWith(71, 55);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});

