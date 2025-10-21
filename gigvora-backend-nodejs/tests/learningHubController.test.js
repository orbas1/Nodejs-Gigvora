import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getFreelancerLearningHub = jest.fn();
const enrollInCourse = jest.fn();

const serviceModule = new URL('../src/services/learningHubService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({
  getFreelancerLearningHub,
  enrollInCourse,
  updateEnrollmentProgress: jest.fn(),
  scheduleMentoringSession: jest.fn(),
  recordSkillDiagnostic: jest.fn(),
  acknowledgeCertificationReminder: jest.fn(),
}));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/learningHubController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe('learningHubController.overview', () => {
  it('requires the actor to own the hub', async () => {
    await expect(controller.overview({ params: { freelancerId: '2' }, user: { id: 5 } }, {})).rejects.toThrow(
      AuthorizationError,
    );
    expect(getFreelancerLearningHub).not.toHaveBeenCalled();
  });
});

describe('learningHubController.createEnrollment', () => {
  it('sanitises identifiers', async () => {
    await expect(
      controller.createEnrollment({ params: { freelancerId: '1' }, body: { courseId: 'abc' }, user: { id: 1 } }, {}),
    ).rejects.toThrow(ValidationError);
    expect(enrollInCourse).not.toHaveBeenCalled();
  });
});
