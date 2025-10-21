import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/eventManagementService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  getUserEventManagement: jest.fn(),
  getWorkspaceSettings: jest.fn(),
  updateWorkspaceSettings: jest.fn(),
  createEvent: jest.fn(),
  getEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  createGuest: jest.fn(),
  updateGuest: jest.fn(),
  deleteGuest: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, default: serviceMock, ...serviceMock }));

const controllerModule = await import('../../src/controllers/eventManagementController.js');
const { listEventManagement, getEvent, createTask, deleteGuest } = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe('eventManagementController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses identifiers and query options when listing events', async () => {
    const req = { params: { userId: '3' }, query: { includeArchived: 'true', limit: '15' } };
    const res = createResponse();
    const payload = { events: [] };
    serviceMock.getUserEventManagement.mockResolvedValueOnce(payload);

    await listEventManagement(req, res);

    expect(serviceMock.getUserEventManagement).toHaveBeenCalledWith(3, {
      includeArchived: true,
      limit: 15,
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('throws when user id is invalid', async () => {
    const req = { params: { userId: 'abc' } };
    const res = createResponse();

    await expect(listEventManagement(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.getUserEventManagement).not.toHaveBeenCalled();
  });

  it('retrieves event with parsed identifiers', async () => {
    const req = { params: { userId: '2', eventId: '5' } };
    const res = createResponse();
    const event = { id: 5 };
    serviceMock.getEvent.mockResolvedValueOnce(event);

    await getEvent(req, res);

    expect(serviceMock.getEvent).toHaveBeenCalledWith(2, 5);
    expect(res.json).toHaveBeenCalledWith(event);
  });

  it('creates tasks with numeric identifiers', async () => {
    const req = { params: { userId: '1', eventId: '9' }, body: { name: 'Task' } };
    const res = createResponse();
    const event = { id: 9 };
    serviceMock.createTask.mockResolvedValueOnce(event);

    await createTask(req, res);

    expect(serviceMock.createTask).toHaveBeenCalledWith(1, 9, { name: 'Task' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(event);
  });

  it('deletes guests with numeric identifiers', async () => {
    const req = { params: { userId: '6', eventId: '11', guestId: '4' } };
    const res = createResponse();
    const event = { id: 11 };
    serviceMock.deleteGuest.mockResolvedValueOnce(event);

    await deleteGuest(req, res);

    expect(serviceMock.deleteGuest).toHaveBeenCalledWith(6, 11, 4);
    expect(res.json).toHaveBeenCalledWith(event);
  });
});
