import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getMentorDashboard = jest.fn();
const updateMentorAvailability = jest.fn();

const serviceModule = new URL('../src/services/mentorshipService.js', import.meta.url);

jest.unstable_mockModule(serviceModule.pathname, () => ({
  getMentorDashboard,
  updateMentorAvailability,
  updateMentorPackages: jest.fn(),
  submitMentorProfile: jest.fn(),
  createMentorBooking: jest.fn(),
  updateMentorBooking: jest.fn(),
  deleteMentorBooking: jest.fn(),
  createMentorClient: jest.fn(),
  updateMentorClient: jest.fn(),
  deleteMentorClient: jest.fn(),
  createMentorEvent: jest.fn(),
  updateMentorEvent: jest.fn(),
  deleteMentorEvent: jest.fn(),
  createMentorSupportTicket: jest.fn(),
  updateMentorSupportTicket: jest.fn(),
  deleteMentorSupportTicket: jest.fn(),
  createMentorMessage: jest.fn(),
  updateMentorMessage: jest.fn(),
  deleteMentorMessage: jest.fn(),
  updateMentorVerificationStatus: jest.fn(),
  createMentorVerificationDocument: jest.fn(),
  updateMentorVerificationDocument: jest.fn(),
  deleteMentorVerificationDocument: jest.fn(),
  createMentorWalletTransaction: jest.fn(),
  updateMentorWalletTransaction: jest.fn(),
  deleteMentorWalletTransaction: jest.fn(),
  createMentorInvoice: jest.fn(),
  updateMentorInvoice: jest.fn(),
  deleteMentorInvoice: jest.fn(),
  createMentorPayout: jest.fn(),
  updateMentorPayout: jest.fn(),
  deleteMentorPayout: jest.fn(),
}));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/mentorshipController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe('mentorshipController.dashboard', () => {
  it('requires mentor roles or admin', () => {
    expect(() => controller.dashboard({ params: { mentorId: '2' }, user: { id: 2, roles: ['viewer'] } }, {})).toThrow(
      AuthorizationError,
    );
  });

  it('returns dashboard for mentors', () => {
    getMentorDashboard.mockReturnValue({ ok: true });
    const res = { json: jest.fn() };
    controller.dashboard({ params: { mentorId: '4' }, user: { id: 4, roles: ['mentor'] } }, res);
    expect(getMentorDashboard).toHaveBeenCalledWith(4, { lookbackDays: null });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('mentorshipController.saveAvailability', () => {
  it('validates slot payloads', () => {
    expect(() =>
      controller.saveAvailability({ params: { mentorId: '3' }, body: { slots: 'bad' }, user: { id: 3, roles: ['mentor'] } }, {}),
    ).toThrow(ValidationError);
    expect(updateMentorAvailability).not.toHaveBeenCalled();
  });
});
