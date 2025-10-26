import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const calendarServiceModuleUrl = new URL('../../services/calendarService.js', import.meta.url);
const calendarSyncServiceModuleUrl = new URL('../../services/calendarSyncService.js', import.meta.url);

const calendarServiceMock = {
  getOverview: jest.fn(),
  listEvents: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  exportEventAsICalendar: jest.fn(),
  exportEventsAsICalendar: jest.fn(),
  listFocusSessions: jest.fn(),
  createFocusSession: jest.fn(),
  updateFocusSession: jest.fn(),
  deleteFocusSession: jest.fn(),
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
};

const getCalendarSyncStatusMock = jest.fn();
const triggerCalendarSyncMock = jest.fn();

jest.unstable_mockModule(calendarServiceModuleUrl.pathname, () => ({
  default: calendarServiceMock,
}));

jest.unstable_mockModule(calendarSyncServiceModuleUrl.pathname, () => ({
  getCalendarSyncStatus: getCalendarSyncStatusMock,
  triggerCalendarSync: triggerCalendarSyncMock,
}));

const controller = await import('../calendarController.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn();
  res.send = jest.fn();
  return res;
}

describe('calendarController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns calendar sync status for a user', async () => {
    getCalendarSyncStatusMock.mockResolvedValue({ state: { state: 'synced', inProgress: false } });
    const req = { params: { id: '42' } };
    const res = createResponse();

    await controller.getSyncStatus(req, res);

    expect(getCalendarSyncStatusMock).toHaveBeenCalledWith('42');
    expect(res.json).toHaveBeenCalledWith({ state: { state: 'synced', inProgress: false } });
  });

  it('triggers manual calendar syncs with actor id context', async () => {
    triggerCalendarSyncMock.mockResolvedValue({ id: 10, status: 'queued' });
    const req = { params: { id: '42' }, user: { id: 9 } };
    const res = createResponse();

    await controller.triggerSync(req, res);

    expect(triggerCalendarSyncMock).toHaveBeenCalledWith('42', { actorId: 9 });
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ id: 10, status: 'queued' });
  });
});
