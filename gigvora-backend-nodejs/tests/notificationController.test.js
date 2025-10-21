import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';

process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
process.env.LOG_LEVEL = 'silent';

const notificationService = {
  queueNotification: jest.fn(),
  listNotifications: jest.fn(),
  getStats: jest.fn(),
  getPreferences: jest.fn(),
};

jest.unstable_mockModule('../src/services/notificationService.js', () => ({
  __esModule: true,
  default: notificationService,
  ...notificationService,
}));

let controller;
let AuthorizationError;
let ValidationError;

beforeAll(async () => {
  controller = await import('../src/controllers/notificationController.js');
  ({ AuthorizationError, ValidationError } = await import('../src/utils/errors.js'));
});

beforeEach(() => {
  jest.resetAllMocks();
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('notificationController.createUserNotification', () => {
  it('rejects mismatched actors', async () => {
    const req = { params: { id: '4' }, body: { title: 'Hi', message: 'Welcome' }, user: { id: 7 } };
    await expect(controller.createUserNotification(req, createResponse())).rejects.toThrow(AuthorizationError);
    expect(notificationService.queueNotification).not.toHaveBeenCalled();
  });

  it('sanitises payloads before queueing', async () => {
    notificationService.queueNotification.mockResolvedValue({ id: 1 });
    notificationService.getStats.mockResolvedValue({ unread: 0 });
    const res = createResponse();

    await controller.createUserNotification(
      {
        params: { id: '5' },
        body: { title: '  Alert ', message: 'Check', sendDuringQuietHours: true },
        user: { id: 5, roles: ['admin'] },
      },
      res,
    );

    expect(notificationService.queueNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Alert', userId: 5 }),
      { bypassQuietHours: true },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ notification: { id: 1 }, stats: { unread: 0 } });
  });
});

describe('notificationController.listUserNotifications', () => {
  it('validates pagination', async () => {
    const req = { params: { id: '3' }, query: { page: '0' }, user: { id: 3 } };
    await expect(controller.listUserNotifications(req, createResponse())).rejects.toThrow(ValidationError);
  });
});
