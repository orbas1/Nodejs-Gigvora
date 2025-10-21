import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getFreelancerProfileHub = jest.fn();
const updateFreelancerProfileHub = jest.fn();
const updateFreelancerExpertiseAreas = jest.fn();
const updateFreelancerSuccessMetrics = jest.fn();
const updateFreelancerTestimonials = jest.fn();
const updateFreelancerHeroBanners = jest.fn();

const serviceModule = new URL('../src/services/freelancerProfileHubService.js', import.meta.url);

const serviceExports = {
  getFreelancerProfileHub,
  updateFreelancerProfileHub,
  updateFreelancerExpertiseAreas,
  updateFreelancerSuccessMetrics,
  updateFreelancerTestimonials,
  updateFreelancerHeroBanners,
};

jest.unstable_mockModule(serviceModule.pathname, () => ({ ...serviceExports, default: serviceExports }));

let controller;
let ValidationError;
let AuthorizationError;

beforeAll(async () => {
  controller = await import('../src/controllers/freelancerProfileController.js');
  ({ ValidationError, AuthorizationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  getFreelancerProfileHub.mockReset();
  updateFreelancerProfileHub.mockReset();
  updateFreelancerExpertiseAreas.mockReset();
  updateFreelancerSuccessMetrics.mockReset();
  updateFreelancerTestimonials.mockReset();
  updateFreelancerHeroBanners.mockReset();
});

function createResponse() {
  return {
    json: jest.fn(),
  };
}

describe('freelancerProfileController.getProfileHub', () => {
  it('requires access before returning the hub', async () => {
    getFreelancerProfileHub.mockResolvedValue({ sections: [] });
    const req = {
      params: { userId: '11' },
      query: { fresh: 'true' },
      user: { id: '11' },
    };
    const res = createResponse();

    await controller.getProfileHub(req, res);

    expect(getFreelancerProfileHub).toHaveBeenCalledWith(11, { bypassCache: true });
    expect(res.json).toHaveBeenCalledWith({ sections: [] });
  });

  it('rejects unauthenticated requests', async () => {
    const req = { params: { userId: '11' }, query: {}, user: null };
    await expect(controller.getProfileHub(req, createResponse())).rejects.toThrow(AuthorizationError);
  });
});

describe('freelancerProfileController.updateProfileHub', () => {
  it('rejects empty payloads', async () => {
    const req = { params: { userId: '11' }, body: {}, user: { id: '11' } };
    await expect(controller.updateProfileHub(req, createResponse())).rejects.toThrow(ValidationError);
    expect(updateFreelancerProfileHub).not.toHaveBeenCalled();
  });

  it('persists sanitized payloads', async () => {
    updateFreelancerProfileHub.mockResolvedValue({ headline: 'Updated' });
    const req = {
      params: { userId: '11' },
      body: { headline: 'Updated', summary: 'Bio' },
      user: { id: '11' },
    };
    const res = createResponse();

    await controller.updateProfileHub(req, res);

    expect(updateFreelancerProfileHub).toHaveBeenCalledWith(11, { headline: 'Updated', summary: 'Bio' });
    expect(res.json).toHaveBeenCalledWith({ headline: 'Updated' });
  });
});

describe('freelancerProfileController.updateExpertiseAreas', () => {
  it('validates the array payload', async () => {
    updateFreelancerExpertiseAreas.mockResolvedValue({ items: [] });
    const req = { params: { userId: '11' }, body: { items: ['node'] }, user: { id: '11' } };
    const res = createResponse();

    await controller.updateExpertiseAreas(req, res);

    expect(updateFreelancerExpertiseAreas).toHaveBeenCalledWith(11, ['node']);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it('rejects non-array payloads', async () => {
    const req = { params: { userId: '11' }, body: { items: 'node' }, user: { id: '11' } };

    await expect(controller.updateExpertiseAreas(req, createResponse())).rejects.toThrow(ValidationError);
    expect(updateFreelancerExpertiseAreas).not.toHaveBeenCalled();
  });
});

describe('freelancerProfileController.updateHeroBanners', () => {
  it('sanitizes complex objects in arrays', async () => {
    updateFreelancerHeroBanners.mockResolvedValue({ items: [] });
    const req = {
      params: { userId: '11' },
      body: { items: [{ title: 'Banner', cta: { text: 'Click' } }] },
      user: { id: '11' },
    };
    const res = createResponse();

    await controller.updateHeroBanners(req, res);

    expect(updateFreelancerHeroBanners).toHaveBeenCalledWith(11, [{ title: 'Banner', cta: { text: 'Click' } }]);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });
});
