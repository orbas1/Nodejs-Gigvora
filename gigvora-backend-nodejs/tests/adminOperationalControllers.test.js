process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

import { jest } from '@jest/globals';

const loggerModuleUrl = new URL('../src/utils/logger.js', import.meta.url);
const adminCalendarServiceUrl = new URL('../src/services/adminCalendarService.js', import.meta.url);
const adminCompanyManagementServiceUrl = new URL(
  '../src/services/adminCompanyManagementService.js',
  import.meta.url,
);
const databaseSettingsServiceUrl = new URL('../src/services/databaseSettingsService.js', import.meta.url);
const emailManagementServiceUrl = new URL('../src/services/emailManagementService.js', import.meta.url);
const adminEscrowServiceUrl = new URL('../src/services/adminEscrowService.js', import.meta.url);

const loggerMock = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnValue({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }),
};

jest.unstable_mockModule(loggerModuleUrl.pathname, () => ({
  default: loggerMock,
}));

const calendarMocks = {
  getAdminCalendarConsole: jest.fn().mockResolvedValue({}),
  createAdminCalendarAccount: jest.fn().mockResolvedValue({ id: 11 }),
  updateAdminCalendarAccount: jest.fn().mockResolvedValue({ id: 11, updated: true }),
  deleteAdminCalendarAccount: jest.fn().mockResolvedValue({ success: true }),
  upsertAdminCalendarAvailability: jest.fn().mockResolvedValue({ ok: true }),
  createAdminCalendarTemplate: jest.fn().mockResolvedValue({ id: 101, name: 'Template' }),
  updateAdminCalendarTemplate: jest.fn().mockResolvedValue({ id: 101, name: 'Template Updated' }),
  deleteAdminCalendarTemplate: jest.fn().mockResolvedValue({ success: true }),
  createAdminCalendarEvent: jest.fn().mockResolvedValue({ id: 401, title: 'Event' }),
  updateAdminCalendarEvent: jest.fn().mockResolvedValue({ id: 401, title: 'Updated' }),
  deleteAdminCalendarEvent: jest.fn().mockResolvedValue({ success: true }),
};

jest.unstable_mockModule(adminCalendarServiceUrl.pathname, () => calendarMocks);

const companyMocks = {
  listCompanies: jest.fn().mockResolvedValue({ items: [] }),
  getCompany: jest.fn().mockResolvedValue({ id: 7 }),
  createCompany: jest.fn().mockResolvedValue({ id: 7 }),
  updateCompany: jest.fn().mockResolvedValue({ id: 7, updated: true }),
  archiveCompany: jest.fn().mockResolvedValue({ id: 7, archived: true }),
};

jest.unstable_mockModule(adminCompanyManagementServiceUrl.pathname, () => companyMocks);

const databaseMocks = {
  listDatabaseConnections: jest.fn().mockResolvedValue({ items: [] }),
  getDatabaseConnection: jest.fn().mockResolvedValue({ id: 3 }),
  createDatabaseConnection: jest.fn().mockResolvedValue({ id: 3 }),
  updateDatabaseConnection: jest.fn().mockResolvedValue({ id: 3, status: 'healthy' }),
  deleteDatabaseConnection: jest.fn().mockResolvedValue(undefined),
  testDatabaseConnection: jest.fn().mockResolvedValue({ ok: true }),
};

jest.unstable_mockModule(databaseSettingsServiceUrl.pathname, () => databaseMocks);

const emailMocks = {
  getEmailManagementOverview: jest.fn().mockResolvedValue({ smtp: {} }),
  upsertSmtpConfig: jest.fn().mockResolvedValue({ id: 1 }),
  sendTestEmail: jest.fn().mockResolvedValue({ delivered: true }),
  listEmailTemplates: jest.fn().mockResolvedValue([{ id: 1 }]),
  createEmailTemplate: jest.fn().mockResolvedValue({ id: 5, slug: 'welcome' }),
  updateEmailTemplate: jest.fn().mockResolvedValue({ id: 5, slug: 'welcome', version: 2 }),
  deleteEmailTemplate: jest.fn().mockResolvedValue({ success: true }),
};

jest.unstable_mockModule(emailManagementServiceUrl.pathname, () => emailMocks);

const escrowMocks = {
  getEscrowOverview: jest.fn().mockResolvedValue({ metrics: {} }),
  listEscrowAccounts: jest.fn().mockResolvedValue({ items: [] }),
  createEscrowAccountForUser: jest.fn().mockResolvedValue({ id: 9 }),
  updateEscrowAccount: jest.fn().mockResolvedValue({ id: 9, status: 'active' }),
  listEscrowTransactions: jest.fn().mockResolvedValue({ items: [] }),
  updateEscrowTransactionRecord: jest.fn().mockResolvedValue({ id: 77 }),
  releaseEscrow: jest.fn().mockResolvedValue({ id: 77, status: 'released' }),
  refundEscrow: jest.fn().mockResolvedValue({ id: 77, status: 'refunded' }),
  updateProviderSettings: jest.fn().mockResolvedValue({ provider: 'stripe' }),
  createEscrowFeeTier: jest.fn().mockResolvedValue({ id: 201 }),
  listEscrowFeeTiers: jest.fn().mockResolvedValue([{ id: 201 }]),
  updateEscrowFeeTier: jest.fn().mockResolvedValue({ id: 201, status: 'inactive' }),
  deleteEscrowFeeTier: jest.fn().mockResolvedValue(undefined),
  createEscrowReleasePolicy: jest.fn().mockResolvedValue({ id: 301 }),
  listEscrowReleasePolicies: jest.fn().mockResolvedValue([{ id: 301 }]),
  updateEscrowReleasePolicy: jest.fn().mockResolvedValue({ id: 301, status: 'inactive' }),
  deleteEscrowReleasePolicy: jest.fn().mockResolvedValue(undefined),
};

jest.unstable_mockModule(adminEscrowServiceUrl.pathname, () => escrowMocks);

let adminCalendarController;
let adminCompanyManagementController;
let adminDatabaseController;
let adminEmailController;
let adminEscrowController;

beforeAll(async () => {
  adminCalendarController = await import('../src/controllers/adminCalendarController.js');
  adminCompanyManagementController = await import('../src/controllers/adminCompanyManagementController.js');
  adminDatabaseController = await import('../src/controllers/adminDatabaseController.js');
  adminEmailController = await import('../src/controllers/adminEmailController.js');
  adminEscrowController = await import('../src/controllers/adminEscrowController.js');
});

beforeEach(() => {
  jest.clearAllMocks();
});

function createResponseStub() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe('adminCalendarController', () => {
  test('createTemplate stamps audit metadata', async () => {
    const req = {
      body: { name: 'Weekly Sync' },
      user: { id: 42, email: 'ADMIN@example.com', firstName: 'Ada', lastName: 'Admin' },
      headers: { 'x-forwarded-for': '203.0.113.7' },
    };
    const res = createResponseStub();

    await adminCalendarController.createTemplate(req, res);

    expect(calendarMocks.createAdminCalendarTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Weekly Sync',
        createdBy: 'Ada Admin',
        updatedBy: 'Ada Admin',
        metadata: expect.objectContaining({
          lastModifiedBy: expect.objectContaining({
            id: 42,
            email: 'admin@example.com',
            name: 'Ada Admin',
            ip: '203.0.113.7',
          }),
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 101, name: 'Template' });
  });

  test('updateEvent enriches payload with actor descriptor', async () => {
    const req = {
      params: { eventId: 401 },
      body: { status: 'cancelled' },
      user: { id: '84', email: 'moderator@EXAMPLE.com' },
    };
    const res = createResponseStub();

    await adminCalendarController.updateEvent(req, res);

    expect(calendarMocks.updateAdminCalendarEvent).toHaveBeenCalledWith(401, {
      status: 'cancelled',
      updatedBy: 'moderator@example.com',
    });
    expect(res.json).toHaveBeenCalledWith({ id: 401, title: 'Updated' });
  });
});

describe('adminCompanyManagementController', () => {
  test('store forwards actorId for auditing', async () => {
    const req = { body: { companyName: 'Gigvora' }, user: { id: '55' } };
    const res = createResponseStub();

    await adminCompanyManagementController.store(req, res);

    expect(companyMocks.createCompany).toHaveBeenCalledWith({ companyName: 'Gigvora' }, { actorId: 55 });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('show coerces route parameter to number', async () => {
    const req = { params: { companyId: '73' } };
    const res = createResponseStub();

    await adminCompanyManagementController.show(req, res);

    expect(companyMocks.getCompany).toHaveBeenCalledWith(73);
  });
});

describe('adminDatabaseController', () => {
  test('store passes formatted actor reference', async () => {
    const req = { body: { name: 'Analytics' }, user: { id: 8, email: 'dbadmin@example.com' } };
    const res = createResponseStub();

    await adminDatabaseController.store(req, res);

    expect(databaseMocks.createDatabaseConnection).toHaveBeenCalledWith(
      { name: 'Analytics' },
      { actor: 'admin:8 <dbadmin@example.com>' },
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('test executes with actor reference', async () => {
    const req = { body: { host: 'db.local' }, user: { id: 8 } };
    const res = createResponseStub();

    await adminDatabaseController.test(req, res);

    expect(databaseMocks.testDatabaseConnection).toHaveBeenCalledWith(
      { host: 'db.local' },
      { actor: 'admin:8' },
    );
  });
});

describe('adminEmailController', () => {
  test('updateTemplate coerces identifier and supplies actor context', async () => {
    const req = { params: { templateId: '15' }, body: { subject: 'Updated' }, user: { id: 2, email: 'owner@example.com' } };
    const res = createResponseStub();

    await adminEmailController.updateTemplate(req, res);

    expect(emailMocks.updateEmailTemplate).toHaveBeenCalledWith(15, { subject: 'Updated' }, {
      actor: expect.objectContaining({
        id: 2,
        email: 'owner@example.com',
        name: 'owner@example.com',
      }),
    });
    expect(res.json).toHaveBeenCalledWith({ id: 5, slug: 'welcome', version: 2 });
  });

  test('removeTemplate sends 204 after deletion', async () => {
    const req = { params: { templateId: '15' }, user: { id: 2 } };
    const res = createResponseStub();

    await adminEmailController.removeTemplate(req, res);

    expect(emailMocks.deleteEmailTemplate).toHaveBeenCalledWith(15);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});

describe('adminEscrowController', () => {
  test('releaseTransaction enriches metadata with actor details', async () => {
    const req = {
      params: { transactionId: '99' },
      body: { notes: 'Manual release' },
      user: { id: 33, email: 'finance@example.com', firstName: 'Fin', lastName: 'Ops' },
    };
    const res = createResponseStub();

    await adminEscrowController.releaseTransaction(req, res);

    expect(escrowMocks.releaseEscrow).toHaveBeenCalledWith('99', expect.objectContaining({
      notes: 'Manual release',
      actorId: 33,
      metadata: expect.objectContaining({
        actor: expect.objectContaining({
          id: 33,
          email: 'finance@example.com',
          name: 'Fin Ops',
          action: 'release',
        }),
      }),
    }));
    expect(res.json).toHaveBeenCalledWith({ id: 77, status: 'released' });
  });

  test('updateTransaction adds actorId for audit trail', async () => {
    const req = { params: { transactionId: '77' }, body: { status: 'on_hold' }, user: { id: 10 } };
    const res = createResponseStub();

    await adminEscrowController.updateTransaction(req, res);

    expect(escrowMocks.updateEscrowTransactionRecord).toHaveBeenCalledWith('77', {
      status: 'on_hold',
      actorId: 10,
    });
  });
});
