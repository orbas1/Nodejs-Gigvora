import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const serviceModuleUrl = new URL('../../src/services/companyOrdersService.js', import.meta.url);
const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);

const serviceMock = {
  getCompanyOrdersDashboard: jest.fn(),
  createCompanyOrder: jest.fn(),
  updateCompanyOrder: jest.fn(),
  deleteCompanyOrder: jest.fn(),
  getCompanyOrderDetail: jest.fn(),
  createCompanyOrderTimeline: jest.fn(),
  updateCompanyOrderTimeline: jest.fn(),
  deleteCompanyOrderTimeline: jest.fn(),
  postCompanyOrderMessage: jest.fn(),
  createCompanyOrderEscrow: jest.fn(),
  updateCompanyOrderEscrow: jest.fn(),
  submitCompanyOrderReview: jest.fn(),
};

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true }));
await jest.unstable_mockModule(serviceModuleUrl.pathname, () => ({ __esModule: true, ...serviceMock }));

const controllerModule = await import('../../src/controllers/companyOrdersController.js');
const {
  dashboard,
  create,
  update,
  remove,
  detail,
  addTimelineEvent,
  updateTimelineEvent,
  removeTimelineEvent,
  postMessage,
  createEscrowCheckpoint,
  updateEscrowCheckpoint,
  submitReview,
} = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('companyOrdersController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when an owner context cannot be resolved', async () => {
    const req = { query: {} };
    const res = createResponse();

    await expect(dashboard(req, res)).rejects.toThrow(ValidationError);
    expect(serviceMock.getCompanyOrdersDashboard).not.toHaveBeenCalled();
  });

  it('returns dashboard data for the authenticated owner', async () => {
    const req = { user: { id: 55 }, query: { status: 'active' } };
    const res = createResponse();
    const payload = { summary: { orders: 3 } };
    serviceMock.getCompanyOrdersDashboard.mockResolvedValueOnce(payload);

    await dashboard(req, res);

    expect(serviceMock.getCompanyOrdersDashboard).toHaveBeenCalledWith({
      ownerId: 55,
      status: 'active',
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('creates an order for the owner resolved from auth metadata', async () => {
    const req = { auth: { userId: 77 }, body: { vendorName: 'Atlas Advisory' } };
    const res = createResponse();
    const order = { id: 12, vendorName: 'Atlas Advisory' };
    serviceMock.createCompanyOrder.mockResolvedValueOnce(order);

    await create(req, res);

    expect(serviceMock.createCompanyOrder).toHaveBeenCalledWith({
      ownerId: 77,
      payload: { vendorName: 'Atlas Advisory' },
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it('updates an order with parsed identifier and payload', async () => {
    const req = { user: { id: 92 }, params: { orderId: '15' }, body: { status: 'completed' } };
    const res = createResponse();
    const order = { id: 15, status: 'completed' };
    serviceMock.updateCompanyOrder.mockResolvedValueOnce(order);

    await update(req, res);

    expect(serviceMock.updateCompanyOrder).toHaveBeenCalledWith({
      ownerId: 92,
      orderId: 15,
      payload: { status: 'completed' },
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it('removes an order and returns 204', async () => {
    const req = { user: { id: 61 }, params: { orderId: '22' } };
    const res = createResponse();
    serviceMock.deleteCompanyOrder.mockResolvedValueOnce(undefined);

    await remove(req, res);

    expect(serviceMock.deleteCompanyOrder).toHaveBeenCalledWith({
      ownerId: 61,
      orderId: 22,
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('retrieves order detail with sanitised identifiers', async () => {
    const req = { auth: { userId: 45 }, params: { orderId: '33' } };
    const res = createResponse();
    const detailPayload = { id: 33 };
    serviceMock.getCompanyOrderDetail.mockResolvedValueOnce(detailPayload);

    await detail(req, res);

    expect(serviceMock.getCompanyOrderDetail).toHaveBeenCalledWith({
      ownerId: 45,
      orderId: 33,
      accessContext: expect.objectContaining({ canView: true, permissions: [] }),
    });
    expect(res.json).toHaveBeenCalledWith(detailPayload);
  });

  it('creates and updates timeline events with parsed ids', async () => {
    const res = createResponse();
    serviceMock.createCompanyOrderTimeline.mockResolvedValueOnce({ id: 1 });
    serviceMock.updateCompanyOrderTimeline.mockResolvedValueOnce({ id: 2 });

    await addTimelineEvent({ user: { id: 70, permissions: [] }, params: { orderId: '9' }, body: { title: 'Kick-off' } }, res);
    expect(serviceMock.createCompanyOrderTimeline).toHaveBeenCalledWith({
      ownerId: 70,
      orderId: 9,
      payload: { title: 'Kick-off' },
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(res.status).toHaveBeenCalledWith(201);

    jest.clearAllMocks();
    const updateRes = createResponse();
    serviceMock.updateCompanyOrderTimeline.mockResolvedValueOnce({ id: 2 });

    await updateTimelineEvent(
      { user: { id: 70, permissions: [] }, params: { orderId: '9', eventId: '4' }, body: { title: 'Revised kick-off' } },
      updateRes,
    );

    expect(serviceMock.updateCompanyOrderTimeline).toHaveBeenCalledWith({
      ownerId: 70,
      orderId: 9,
      eventId: 4,
      payload: { title: 'Revised kick-off' },
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(updateRes.json).toHaveBeenCalledWith({ id: 2 });
  });

  it('removes a timeline event with validated ids', async () => {
    const req = { user: { id: 52, permissions: [] }, params: { orderId: '14', eventId: '3' } };
    const res = createResponse();
    serviceMock.deleteCompanyOrderTimeline.mockResolvedValueOnce(undefined);

    await removeTimelineEvent(req, res);

    expect(serviceMock.deleteCompanyOrderTimeline).toHaveBeenCalledWith({
      ownerId: 52,
      orderId: 14,
      eventId: 3,
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('posts a message using the authenticated actor context', async () => {
    const req = {
      user: { id: 81, email: 'ops@gigvora.test', permissions: [] },
      params: { orderId: '8' },
      body: { body: 'Update' },
    };
    const res = createResponse();
    const message = { id: 5 };
    serviceMock.postCompanyOrderMessage.mockResolvedValueOnce(message);

    await postMessage(req, res);

    expect(serviceMock.postCompanyOrderMessage).toHaveBeenCalledWith({
      ownerId: 81,
      orderId: 8,
      payload: { body: 'Update' },
      actor: { id: 81, name: 'ops@gigvora.test' },
      accessContext: expect.objectContaining({ permissions: [] }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(message);
  });

  it('falls back to ownerId for actor id when user is absent', async () => {
    const req = { auth: { userId: 64 }, params: { orderId: '4' }, body: { body: 'Owner update' } };
    const res = createResponse();
    const message = { id: 6 };
    serviceMock.postCompanyOrderMessage.mockResolvedValueOnce(message);

    await postMessage(req, res);

    expect(serviceMock.postCompanyOrderMessage).toHaveBeenCalledWith({
      ownerId: 64,
      orderId: 4,
      payload: { body: 'Owner update' },
      actor: { id: 64, name: 'Company operator' },
      accessContext: expect.objectContaining({ permissions: [] }),
    });
  });

  it('handles escrow checkpoints lifecycle', async () => {
    const createRes = createResponse();
    const updateRes = createResponse();
    serviceMock.createCompanyOrderEscrow.mockResolvedValueOnce({ id: 1 });
    serviceMock.updateCompanyOrderEscrow.mockResolvedValueOnce({ id: 2 });

    await createEscrowCheckpoint({ auth: { userId: 90 }, params: { orderId: '10' }, body: { label: 'Kick-off' } }, createRes);
    expect(serviceMock.createCompanyOrderEscrow).toHaveBeenCalledWith({
      ownerId: 90,
      orderId: 10,
      payload: { label: 'Kick-off' },
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(createRes.status).toHaveBeenCalledWith(201);

    await updateEscrowCheckpoint({ user: { id: 90, permissions: [] }, params: { checkpointId: '5' }, body: { status: 'released' } }, updateRes);
    expect(serviceMock.updateCompanyOrderEscrow).toHaveBeenCalledWith({
      ownerId: 90,
      checkpointId: 5,
      payload: { status: 'released' },
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(updateRes.json).toHaveBeenCalledWith({ id: 2 });
  });

  it('submits a review for the resolved owner', async () => {
    const req = { user: { id: 41 }, params: { orderId: '17' }, body: { scorecard: { overallScore: 4 } } };
    const res = createResponse();
    const order = { id: 17 };
    serviceMock.submitCompanyOrderReview.mockResolvedValueOnce(order);

    await submitReview(req, res);

    expect(serviceMock.submitCompanyOrderReview).toHaveBeenCalledWith({
      ownerId: 41,
      orderId: 17,
      payload: { scorecard: { overallScore: 4 } },
      accessContext: expect.objectContaining({ canManage: true, permissions: [] }),
    });
    expect(res.json).toHaveBeenCalledWith(order);
  });
});
