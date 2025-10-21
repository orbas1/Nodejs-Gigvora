import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const serviceModuleUrl = new URL('../../src/services/freelancerCalendarService.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const serviceMock = {
  listFreelancerCalendarEvents: jest.fn(),
  createFreelancerCalendarEvent: jest.fn(),
  updateFreelancerCalendarEvent: jest.fn(),
  deleteFreelancerCalendarEvent: jest.fn(),
};

await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/freelancerCalendarController.js');
const { listCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = controllerModule;
const { AuthorizationError, ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('freelancerCalendarController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists calendar events with parsed filters', async () => {
    const req = {
      params: { freelancerId: '18' },
      query: { start: '2024-01-01', end: '2024-01-31', types: 'meeting', statuses: 'confirmed', limit: '25' },
    };
    const res = createResponse();
    const events = { items: [] };
    serviceMock.listFreelancerCalendarEvents.mockResolvedValueOnce(events);

    await listCalendarEvents(req, res);

    expect(serviceMock.listFreelancerCalendarEvents).toHaveBeenCalledWith(18, {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      types: 'meeting',
      statuses: 'confirmed',
      limit: '25',
      lookbackDays: undefined,
      lookaheadDays: undefined,
    });
    expect(res.json).toHaveBeenCalledWith(events);
  });

  it('requires authentication to create calendar events', async () => {
    const req = { params: { freelancerId: '18' }, body: { title: 'Sync' } };
    const res = createResponse();

    await expect(createCalendarEvent(req, res)).rejects.toThrow(AuthorizationError);
  });

  it('creates, updates, and deletes events with actor context', async () => {
    const reqCreate = { params: { freelancerId: '18' }, user: { id: 4 }, body: { title: 'Sync' } };
    const res = createResponse();
    const event = { id: 1 };
    serviceMock.createFreelancerCalendarEvent.mockResolvedValueOnce(event);

    await createCalendarEvent(reqCreate, res);
    expect(serviceMock.createFreelancerCalendarEvent).toHaveBeenCalledWith(18, { title: 'Sync' }, { actorId: 4 });
    expect(res.status).toHaveBeenCalledWith(201);

    const reqUpdate = { params: { freelancerId: '18', eventId: '5' }, user: { id: 4 }, body: { status: 'confirmed' } };
    serviceMock.updateFreelancerCalendarEvent.mockResolvedValueOnce({ id: 5, status: 'confirmed' });

    await updateCalendarEvent(reqUpdate, res);
    expect(serviceMock.updateFreelancerCalendarEvent).toHaveBeenCalledWith(5, { status: 'confirmed' }, { freelancerId: 18, actorId: 4 });

    const reqDelete = { params: { freelancerId: '18', eventId: '5' }, user: { id: 4 } };
    serviceMock.deleteFreelancerCalendarEvent.mockResolvedValueOnce(true);

    await deleteCalendarEvent(reqDelete, res);
    expect(serviceMock.deleteFreelancerCalendarEvent).toHaveBeenCalledWith(5, { freelancerId: 18, actorId: 4 });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('rejects invalid freelancer identifiers', async () => {
    const req = { params: { freelancerId: 'invalid' } };
    const res = createResponse();

    await expect(listCalendarEvents(req, res)).rejects.toThrow(ValidationError);
  });
});
