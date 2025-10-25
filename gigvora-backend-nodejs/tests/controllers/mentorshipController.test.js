import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const getMentorDashboard = jest.fn();
const updateMentorAvailability = jest.fn();
const createMentorSupportTicket = jest.fn();
const updateMentorSupportTicket = jest.fn();
const deleteMentorSupportTicket = jest.fn();
const createMentorMessage = jest.fn();
const updateMentorMessage = jest.fn();
const deleteMentorMessage = jest.fn();
const updateMentorVerificationStatus = jest.fn();
const createMentorVerificationDocument = jest.fn();
const updateMentorVerificationDocument = jest.fn();
const deleteMentorVerificationDocument = jest.fn();
const createMentorWalletTransaction = jest.fn();
const updateMentorWalletTransaction = jest.fn();
const deleteMentorWalletTransaction = jest.fn();
const createMentorInvoice = jest.fn();
const updateMentorInvoice = jest.fn();
const deleteMentorInvoice = jest.fn();
const createMentorPayout = jest.fn();
const updateMentorPayout = jest.fn();
const deleteMentorPayout = jest.fn();

const serviceModule = new URL('../../src/services/mentorshipService.js', import.meta.url);

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
  createMentorSupportTicket,
  updateMentorSupportTicket,
  deleteMentorSupportTicket,
  createMentorMessage,
  updateMentorMessage,
  deleteMentorMessage,
  updateMentorVerificationStatus,
  createMentorVerificationDocument,
  updateMentorVerificationDocument,
  deleteMentorVerificationDocument,
  createMentorWalletTransaction,
  updateMentorWalletTransaction,
  deleteMentorWalletTransaction,
  createMentorInvoice,
  updateMentorInvoice,
  deleteMentorInvoice,
  createMentorPayout,
  updateMentorPayout,
  deleteMentorPayout,
}));

const notificationModule = new URL('../../src/services/notificationService.js', import.meta.url);
const queueNotification = jest.fn();

jest.unstable_mockModule(notificationModule.pathname, () => ({
  default: {
    queueNotification,
  },
}));

const identityModule = new URL('../../src/services/identityDocumentStorageService.js', import.meta.url);
const storeIdentityDocument = jest.fn();

jest.unstable_mockModule(identityModule.pathname, () => ({
  storeIdentityDocument,
}));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../../src/controllers/mentorshipController.js');
  ({ AuthorizationError, ValidationError } = await import('../../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
  queueNotification.mockResolvedValue(undefined);
  storeIdentityDocument.mockReset();
});

describe('mentorshipController.dashboard', () => {
  it('requires mentor roles or admin', async () => {
    await expect(
      controller.dashboard({ params: { mentorId: '2' }, user: { id: 2, roles: ['viewer'] } }, {}),
    ).rejects.toThrow(AuthorizationError);
  });

  it('returns dashboard for mentors', async () => {
    getMentorDashboard.mockResolvedValue({ ok: true });
    const res = { json: jest.fn() };
    await controller.dashboard({ params: { mentorId: '4' }, user: { id: 4, roles: ['mentor'] } }, res);
    expect(getMentorDashboard).toHaveBeenCalledWith(4, { lookbackDays: null });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('mentorshipController.saveAvailability', () => {
  it('validates slot payloads', async () => {
    await expect(
      controller.saveAvailability({ params: { mentorId: '3' }, body: { slots: 'bad' }, user: { id: 3, roles: ['mentor'] } }, {}),
    ).rejects.toThrow(ValidationError);
    expect(updateMentorAvailability).not.toHaveBeenCalled();
  });
});

describe('mentorshipController integrations', () => {
  it('queues notifications when creating support tickets', async () => {
    const ticket = { id: 'ticket-1', subject: 'Need help', priority: 'High', status: 'Open' };
    createMentorSupportTicket.mockResolvedValue(ticket);
    getMentorDashboard.mockResolvedValue({ ok: true });

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createSupportTicket(
      { params: { mentorId: '7' }, user: { id: 7, roles: ['mentor'] }, body: { subject: 'Need help' } },
      res,
    );

    expect(createMentorSupportTicket).toHaveBeenCalledWith(7, expect.objectContaining({ subject: 'Need help' }));
    expect(queueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        type: 'mentorship.support.ticket.created',
        payload: expect.objectContaining({ ticketId: ticket.id, status: ticket.status }),
      }),
      { bypassQuietHours: false },
    );
    expect(getMentorDashboard).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ ticket, dashboard: { ok: true } });
  });

  it('persists verification evidence and queues alerts', async () => {
    const metadata = {
      key: 'identity/abc123',
      fileName: 'passport.pdf',
      contentType: 'application/pdf',
      size: 2048,
      storedAt: '2024-01-01T00:00:00.000Z',
    };
    storeIdentityDocument.mockResolvedValue(metadata);
    const document = {
      id: 'doc-1',
      type: 'Passport',
      status: 'In review',
      storageKey: metadata.key,
      fileName: metadata.fileName,
      contentType: metadata.contentType,
      fileSize: metadata.size,
      storedAt: metadata.storedAt,
    };
    createMentorVerificationDocument.mockResolvedValue(document);
    getMentorDashboard.mockResolvedValue({ ok: true });

    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await controller.createVerificationDocument(
      {
        params: { mentorId: '9' },
        user: { id: 9, roles: ['mentor'] },
        body: {
          type: 'Passport',
          file: { data: 'data:application/pdf;base64,AAA', fileName: 'passport.pdf', contentType: 'application/pdf' },
        },
      },
      res,
    );

    expect(storeIdentityDocument).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(String), fileName: 'passport.pdf', contentType: 'application/pdf' }),
    );
    expect(createMentorVerificationDocument).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        storageKey: metadata.key,
        fileName: metadata.fileName,
        contentType: metadata.contentType,
        fileSize: metadata.size,
        storedAt: metadata.storedAt,
      }),
    );
    expect(queueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 9,
        type: 'mentorship.verification.document.created',
        payload: expect.objectContaining({ documentId: document.id, storageKey: metadata.key }),
      }),
      { bypassQuietHours: true },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ document, dashboard: { ok: true } });
  });
});
