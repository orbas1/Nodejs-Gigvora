import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const huddleServiceModuleUrl = new URL('../../services/huddleService.js', import.meta.url);

const getHuddleContextMock = jest.fn();
const listRecommendedParticipantsMock = jest.fn();
const createHuddleMock = jest.fn();
const scheduleHuddleMock = jest.fn();
const requestInstantHuddleMock = jest.fn();

jest.unstable_mockModule(huddleServiceModuleUrl.pathname, () => ({
  getHuddleContext: getHuddleContextMock,
  listRecommendedParticipants: listRecommendedParticipantsMock,
  createHuddle: createHuddleMock,
  scheduleHuddle: scheduleHuddleMock,
  requestInstantHuddle: requestInstantHuddleMock,
}));

const controller = await import('../huddleController.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('huddleController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns huddle context for provided filters', async () => {
    getHuddleContextMock.mockResolvedValue({ upcoming: [] });
    const req = { query: { workspaceId: '10', projectId: '5' } };
    const res = createResponse();

    await controller.context(req, res);

    expect(getHuddleContextMock).toHaveBeenCalledWith({ workspaceId: '10', projectId: '5' });
    expect(res.json).toHaveBeenCalledWith({ upcoming: [] });
  });

  it('lists recommended participants using parsed limit', async () => {
    listRecommendedParticipantsMock.mockResolvedValue(['participant']);
    const req = { query: { workspaceId: '12', limit: '8' } };
    const res = createResponse();

    await controller.recommended(req, res);

    expect(listRecommendedParticipantsMock).toHaveBeenCalledWith({ workspaceId: '12', projectId: undefined, limit: 8 });
    expect(res.json).toHaveBeenCalledWith({ items: ['participant'] });
  });

  it('creates huddles with actor context', async () => {
    createHuddleMock.mockResolvedValue({ id: 33 });
    const req = { body: { title: 'Weekly sync' }, user: { id: 9 } };
    const res = createResponse();

    await controller.store(req, res);

    expect(createHuddleMock).toHaveBeenCalledWith({ title: 'Weekly sync' }, { actorId: 9 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 33 });
  });

  it('schedules huddles with parameters and actor id', async () => {
    scheduleHuddleMock.mockResolvedValue({ id: 44 });
    const req = { params: { huddleId: '44' }, body: { startsAt: '2024-05-21T10:00:00Z' }, user: { id: 7 } };
    const res = createResponse();

    await controller.schedule(req, res);

    expect(scheduleHuddleMock).toHaveBeenCalledWith('44', { startsAt: '2024-05-21T10:00:00Z' }, { actorId: 7 });
    expect(res.json).toHaveBeenCalledWith({ id: 44 });
  });

  it('launches instant huddles', async () => {
    requestInstantHuddleMock.mockResolvedValue({ id: 99 });
    const req = { body: { title: 'Instant standup' }, user: { id: 5 } };
    const res = createResponse();

    await controller.launch(req, res);

    expect(requestInstantHuddleMock).toHaveBeenCalledWith({ title: 'Instant standup' }, { actorId: 5 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 99 });
  });
});
