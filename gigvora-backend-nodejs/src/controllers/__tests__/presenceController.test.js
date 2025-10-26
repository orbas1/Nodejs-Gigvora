import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const presenceServiceModuleUrl = new URL('../../services/presenceService.js', import.meta.url);

const getPresenceSnapshotMock = jest.fn();
const getPresenceBatchMock = jest.fn();
const updatePresenceStatusMock = jest.fn();
const startFocusSessionMock = jest.fn();
const endFocusSessionMock = jest.fn();
const scheduleAvailabilityWindowMock = jest.fn();
const refreshCalendarSyncMock = jest.fn();

jest.unstable_mockModule(presenceServiceModuleUrl.pathname, () => ({
  getPresenceSnapshot: getPresenceSnapshotMock,
  getPresenceBatch: getPresenceBatchMock,
  updatePresenceStatus: updatePresenceStatusMock,
  startFocusSession: startFocusSessionMock,
  endFocusSession: endFocusSessionMock,
  scheduleAvailabilityWindow: scheduleAvailabilityWindowMock,
  refreshCalendarSync: refreshCalendarSyncMock,
}));

const controller = await import('../presenceController.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('presenceController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows presence snapshots with parsed boolean flags', async () => {
    getPresenceSnapshotMock.mockResolvedValue({ user: { id: 42 } });
    const req = {
      params: { userId: '42' },
      query: { includeCalendar: 'false', includeTimeline: '1', includeFocus: 'no' },
    };
    const res = createResponse();

    await controller.show(req, res);

    expect(getPresenceSnapshotMock).toHaveBeenCalledWith('42', {
      includeCalendar: false,
      includeTimeline: true,
      includeFocus: false,
    });
    expect(res.json).toHaveBeenCalledWith({ user: { id: 42 } });
  });

  it('lists batch presence snapshots using parsed member ids', async () => {
    getPresenceBatchMock.mockResolvedValue(['snapshot']);
    const req = {
      query: {
        memberIds: '1, 2,3 , 1',
        includeCalendar: 'true',
        includeTimeline: 'true',
        includeFocus: 'false',
      },
    };
    const res = createResponse();

    await controller.index(req, res);

    expect(getPresenceBatchMock).toHaveBeenCalledWith({
      memberIds: ['1', '2', '3', '1'],
      includeCalendar: true,
      includeTimeline: true,
      includeFocus: false,
    });
    expect(res.json).toHaveBeenCalledWith({ items: ['snapshot'] });
  });

  it('updates presence status and returns the payload', async () => {
    updatePresenceStatusMock.mockResolvedValue({ availability: 'focus' });
    const req = { params: { userId: '11' }, body: { availability: 'focus' } };
    const res = createResponse();

    await controller.updateStatus(req, res);

    expect(updatePresenceStatusMock).toHaveBeenCalledWith('11', { availability: 'focus' });
    expect(res.json).toHaveBeenCalledWith({ availability: 'focus' });
  });

  it('starts focus sessions and returns created payloads', async () => {
    startFocusSessionMock.mockResolvedValue({ id: 99 });
    const req = { params: { userId: '22' }, body: { durationMinutes: 45 } };
    const res = createResponse();

    await controller.startFocus(req, res);

    expect(startFocusSessionMock).toHaveBeenCalledWith('22', { durationMinutes: 45 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 99 });
  });

  it('ends focus sessions', async () => {
    endFocusSessionMock.mockResolvedValue({ id: 77 });
    const req = { params: { userId: '22' } };
    const res = createResponse();

    await controller.endFocus(req, res);

    expect(endFocusSessionMock).toHaveBeenCalledWith('22');
    expect(res.json).toHaveBeenCalledWith({ id: 77 });
  });

  it('schedules availability windows', async () => {
    scheduleAvailabilityWindowMock.mockResolvedValue({ id: 'window-1' });
    const req = { params: { userId: '33' }, body: { startAt: '2024-05-20T10:00:00Z' } };
    const res = createResponse();

    await controller.scheduleAvailability(req, res);

    expect(scheduleAvailabilityWindowMock).toHaveBeenCalledWith('33', { startAt: '2024-05-20T10:00:00Z' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'window-1' });
  });

  it('refreshes calendar sync and responds with async status', async () => {
    refreshCalendarSyncMock.mockResolvedValue({ id: 'job-22' });
    const req = { params: { userId: '55' }, user: { id: 901 } };
    const res = createResponse();

    await controller.refreshCalendar(req, res);

    expect(refreshCalendarSyncMock).toHaveBeenCalledWith('55', { actorId: 901 });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ id: 'job-22' });
  });
});
