import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const modelsModuleUrl = new URL('../../src/models/index.js', import.meta.url);
const spotlightModuleUrl = new URL('../../src/services/communitySpotlightService.js', import.meta.url);
const pipelineModuleUrl = new URL('../../src/services/freelancerOrderPipelineService.js', import.meta.url);
const purchasedGigModuleUrl = new URL('../../src/services/freelancerPurchasedGigService.js', import.meta.url);
const freelancerServiceUrl = new URL('../../src/services/freelancerService.js', import.meta.url);
const gigServiceUrl = new URL('../../src/services/gigService.js', import.meta.url);

await jest.unstable_mockModule(modelsModuleUrl.pathname, () => ({ __esModule: true, default: {} }));

const spotlightMock = { getFreelancerSpotlight: jest.fn() };
const pipelineMock = {
  getFreelancerOrderPipeline: jest.fn(),
  createFreelancerOrder: jest.fn(),
  updateFreelancerOrder: jest.fn(),
  createRequirementForm: jest.fn(),
  updateRequirementForm: jest.fn(),
  createRevision: jest.fn(),
  updateRevision: jest.fn(),
  createEscrowCheckpoint: jest.fn(),
  updateEscrowCheckpoint: jest.fn(),
};
const purchasedGigMock = { getFreelancerPurchasedGigDashboard: jest.fn() };
const freelancerServiceMock = { getFreelancerDashboard: jest.fn() };
const gigServiceMock = {
  createGigBlueprint: jest.fn(),
  updateGigBlueprint: jest.fn(),
  publishGig: jest.fn(),
  getGigDetail: jest.fn(),
};

await jest.unstable_mockModule(spotlightModuleUrl.pathname, () => ({ __esModule: true, ...spotlightMock }));
await jest.unstable_mockModule(pipelineModuleUrl.pathname, () => ({ __esModule: true, ...pipelineMock }));
await jest.unstable_mockModule(purchasedGigModuleUrl.pathname, () => ({ __esModule: true, default: purchasedGigMock }));
await jest.unstable_mockModule(freelancerServiceUrl.pathname, () => ({ __esModule: true, getFreelancerDashboard: freelancerServiceMock.getFreelancerDashboard }));
await jest.unstable_mockModule(gigServiceUrl.pathname, () => ({ __esModule: true, ...gigServiceMock }));

const controllerModule = await import('../../src/controllers/freelancerController.js');
const {
  dashboard,
  createOrder,
  updateOrder,
  createOrderRequirement,
  updateOrderRequirement,
  createOrderRevision,
  updateOrderRevision,
  createOrderEscrowCheckpoint,
  updateOrderEscrowCheckpoint,
  createGig,
  updateGig,
  publish,
  show,
  getPurchasedGigWorkspace,
} = controllerModule;
const { ValidationError } = await import('../../src/utils/errors.js');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('freelancerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the freelancer dashboard with parsed identifiers', async () => {
    const req = { query: { freelancerId: '15', limit: '5' } };
    const res = createResponse();
    const payload = { gigs: [] };
    freelancerServiceMock.getFreelancerDashboard.mockResolvedValueOnce(payload);

    await dashboard(req, res);

    expect(freelancerServiceMock.getFreelancerDashboard).toHaveBeenCalledWith({
      freelancerId: 15,
      limitGigs: 5,
    });
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  it('creates orders with validated freelancer identifiers', async () => {
    const req = { body: { freelancerId: '4', notes: 'New order' } };
    const res = createResponse();
    const order = { id: 1 };
    pipelineMock.createFreelancerOrder.mockResolvedValueOnce(order);

    await createOrder(req, res);

    expect(pipelineMock.createFreelancerOrder).toHaveBeenCalledWith({ freelancerId: 4, notes: 'New order' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(order);
  });

  it('throws when order identifiers are invalid', async () => {
    const req = { params: { orderId: 'abc' }, body: {} };
    const res = createResponse();

    await expect(updateOrder(req, res)).rejects.toThrow(ValidationError);
    expect(pipelineMock.updateFreelancerOrder).not.toHaveBeenCalled();
  });

  it('routes order artefact updates to the pipeline service', async () => {
    const res = createResponse();
    pipelineMock.createRequirementForm.mockResolvedValueOnce({ id: 10 });
    await createOrderRequirement({ params: { orderId: '8' }, body: { answers: [] } }, res);
    expect(pipelineMock.createRequirementForm).toHaveBeenCalledWith(8, { answers: [] });

    pipelineMock.updateRequirementForm.mockResolvedValueOnce({ id: 3 });
    await updateOrderRequirement({ params: { formId: '3' }, body: { answers: [] } }, res);
    expect(pipelineMock.updateRequirementForm).toHaveBeenCalledWith(3, { answers: [] });

    pipelineMock.createRevision.mockResolvedValueOnce({ id: 5 });
    await createOrderRevision({ params: { orderId: '9' }, body: { notes: 'Fix' } }, res);
    expect(pipelineMock.createRevision).toHaveBeenCalledWith(9, { notes: 'Fix' });

    pipelineMock.updateRevision.mockResolvedValueOnce({ id: 6 });
    await updateOrderRevision({ params: { revisionId: '6' }, body: { notes: 'Done' } }, res);
    expect(pipelineMock.updateRevision).toHaveBeenCalledWith(6, { notes: 'Done' });

    pipelineMock.createEscrowCheckpoint.mockResolvedValueOnce({ id: 11 });
    await createOrderEscrowCheckpoint({ params: { orderId: '7' }, body: { amount: 100 } }, res);
    expect(pipelineMock.createEscrowCheckpoint).toHaveBeenCalledWith(7, { amount: 100 });

    pipelineMock.updateEscrowCheckpoint.mockResolvedValueOnce({ id: 12 });
    await updateOrderEscrowCheckpoint({ params: { checkpointId: '12' }, body: { amount: 150 } }, res);
    expect(pipelineMock.updateEscrowCheckpoint).toHaveBeenCalledWith(12, { amount: 150 });
  });

  it('enforces actor identifiers when managing gigs', async () => {
    const res = createResponse();
    gigServiceMock.createGigBlueprint.mockResolvedValueOnce({ id: 'gig-1' });

    await createGig({ body: { actorId: '9', title: 'New gig' } }, res);
    expect(gigServiceMock.createGigBlueprint).toHaveBeenCalledWith({ actorId: '9', title: 'New gig' }, { actorId: 9 });
    expect(res.status).toHaveBeenCalledWith(201);

    gigServiceMock.updateGigBlueprint.mockResolvedValueOnce({ id: 'gig-2' });
    await updateGig({ params: { gigId: '5' }, body: { actorId: '9' } }, res);
    expect(gigServiceMock.updateGigBlueprint).toHaveBeenCalledWith(5, { actorId: '9' }, { actorId: 9 });

    gigServiceMock.publishGig.mockResolvedValueOnce({ id: 'gig-5', status: 'published' });
    await publish({ params: { gigId: '5' }, body: { actorId: '9', visibility: 'public' } }, res);
    expect(gigServiceMock.publishGig).toHaveBeenCalledWith(5, { actorId: 9, visibility: 'public' });
  });

  it('throws when gig actor context is missing', async () => {
    const res = createResponse();

    await expect(createGig({ body: {} }, res)).rejects.toThrow(ValidationError);
  });

  it('shows gig details and handles workspace lookups', async () => {
    const res = createResponse();
    const gig = { id: 4 };
    gigServiceMock.getGigDetail.mockResolvedValueOnce(gig);

    await show({ params: { gigId: '4' } }, res);
    expect(gigServiceMock.getGigDetail).toHaveBeenCalledWith(4);
    expect(res.json).toHaveBeenCalledWith(gig);

    purchasedGigMock.getFreelancerPurchasedGigDashboard.mockResolvedValueOnce({ freelancer: null });
    const resWorkspace = createResponse();
    await getPurchasedGigWorkspace({ params: { id: '3' }, query: {} }, resWorkspace);
    expect(resWorkspace.status).toHaveBeenCalledWith(404);
    expect(resWorkspace.json).toHaveBeenCalledWith({ message: 'Freelancer not found' });
  });
});
