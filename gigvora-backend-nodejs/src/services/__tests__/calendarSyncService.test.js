import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

process.env.LIGHTWEIGHT_SERVICE_TESTS = 'true';
process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';

const modelsModuleSpecifier = '../../../tests/stubs/modelsIndexStub.js';

const {
  __setModelStubs,
  sequelize: modelSequelize,
  CalendarIntegration,
  CalendarSyncJob,
  UserPresenceStatus,
} = await import(modelsModuleSpecifier);

const {
  getCalendarSyncStatus,
  triggerCalendarSync,
  markCalendarSyncComplete,
} = await import('../calendarSyncService.js');

describe('calendarSyncService', () => {
  let calendarIntegrationStub;
  let calendarSyncJobStub;
  let presenceStatusStub;
  let transaction;

  beforeEach(() => {
    transaction = { LOCK: { UPDATE: 'UPDATE' } };
    modelSequelize.transaction = jest.fn(async (handler) => handler(transaction));

    calendarIntegrationStub = { findAll: jest.fn(), update: jest.fn() };
    calendarSyncJobStub = { findOne: jest.fn(), create: jest.fn() };
    presenceStatusStub = { update: jest.fn() };

    __setModelStubs({
      CalendarIntegration: calendarIntegrationStub,
      CalendarSyncJob: calendarSyncJobStub,
      UserPresenceStatus: presenceStatusStub,
    });

    CalendarIntegration.findAll = calendarIntegrationStub.findAll.bind(calendarIntegrationStub);
    CalendarIntegration.update = calendarIntegrationStub.update.bind(calendarIntegrationStub);
    CalendarSyncJob.findOne = calendarSyncJobStub.findOne.bind(calendarSyncJobStub);
    CalendarSyncJob.create = calendarSyncJobStub.create.bind(calendarSyncJobStub);
    UserPresenceStatus.update = presenceStatusStub.update.bind(presenceStatusStub);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('summarises integration state, providers, and errors', async () => {
    calendarIntegrationStub.findAll.mockResolvedValue([
      { provider: 'google', status: 'connected', lastSyncedAt: '2024-05-18T10:00:00.000Z' },
      { provider: 'outlook', status: 'error', syncError: 'Token expired', lastSyncedAt: null },
    ]);
    calendarSyncJobStub.findOne.mockResolvedValue({
      status: 'failed',
      errorMessage: 'Timeout',
      errorCode: 'SYNC_TIMEOUT',
      lastSyncedAt: '2024-05-18T09:45:00.000Z',
      nextSyncAt: '2024-05-18T13:00:00.000Z',
      triggeredById: 7,
      id: 22,
    });

    const status = await getCalendarSyncStatus(44);

    expect(status.state).toBe('error');
    expect(status.inProgress).toBe(false);
    expect(status.providers).toEqual(['google', 'outlook']);
    expect(status.connectedProviders).toEqual(['google', 'outlook']);
    expect(status.errors).toEqual([
      { source: 'outlook', message: 'Token expired' },
      { source: 'sync_job', message: 'Timeout', code: 'SYNC_TIMEOUT' },
    ]);
    expect(status.lastSyncedAt).toBeInstanceOf(Date);
    expect(status.nextSyncAt).toEqual('2024-05-18T13:00:00.000Z');
    expect(status.triggeredById).toBe(7);
    expect(status.jobId).toBe(22);
  });

  it('queues manual calendar syncs and marks integrations syncing', async () => {
    const integrations = [
      { userId: 55, provider: 'google', status: 'connected', lastSyncedAt: '2024-05-18T08:45:00.000Z' },
      { userId: 55, provider: 'notion', status: 'connected', lastSyncedAt: null },
    ];
    calendarIntegrationStub.findAll.mockResolvedValue(integrations);
    calendarIntegrationStub.update.mockResolvedValue([2]);
    const createdJob = {
      id: 'job-1',
      status: 'queued',
      toPublicObject: () => ({ id: 'job-1', status: 'queued' }),
    };
    calendarSyncJobStub.create.mockResolvedValue(createdJob);
    presenceStatusStub.update.mockResolvedValue([1]);

    const result = await triggerCalendarSync(55, { actorId: 11 });

    expect(modelSequelize.transaction).toHaveBeenCalled();
    expect(calendarIntegrationStub.update).toHaveBeenCalledWith(
      { status: 'syncing', syncError: null },
      { where: { userId: 55 }, transaction },
    );
    expect(calendarSyncJobStub.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 55,
        triggeredById: 11,
        status: 'queued',
      }),
      { transaction },
    );
    expect(presenceStatusStub.update).toHaveBeenCalledWith(
      expect.objectContaining({ calendarLastSyncedAt: expect.any(Number) }),
      { where: { userId: 55 }, transaction },
    );
    expect(result).toEqual({ id: 'job-1', status: 'queued' });
  });

  it('prevents manual syncs when no providers are linked', async () => {
    calendarIntegrationStub.findAll.mockResolvedValue([]);

    await expect(triggerCalendarSync(77)).rejects.toThrow('Connect a calendar provider');
    expect(modelSequelize.transaction).toHaveBeenCalled();
    expect(calendarSyncJobStub.create).not.toHaveBeenCalled();
  });

  it('marks jobs complete and reconciles provider status', async () => {
    const jobRecord = {
      id: 303,
      userId: 91,
      update: jest.fn(),
      toPublicObject: () => ({ id: 303, status: 'success' }),
    };
    calendarSyncJobStub.findOne.mockResolvedValue(jobRecord);

    const result = await markCalendarSyncComplete(303, {
      status: 'success',
      lastSyncedAt: '2024-05-18T12:00:00.000Z',
    });

    expect(jobRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', finishedAt: expect.any(Date) }),
    );
    expect(calendarIntegrationStub.update).toHaveBeenCalledWith(
      { status: 'connected', lastSyncedAt: '2024-05-18T12:00:00.000Z' },
      { where: { userId: 91 } },
    );
    expect(result).toEqual({ id: 303, status: 'success' });
  });

  it('records provider errors when sync jobs fail', async () => {
    const jobRecord = {
      id: 404,
      userId: 66,
      update: jest.fn(),
      toPublicObject: () => ({ id: 404, status: 'failed', errorMessage: 'Auth failed' }),
    };
    calendarSyncJobStub.findOne.mockResolvedValue(jobRecord);

    const result = await markCalendarSyncComplete(404, {
      status: 'failed',
      errorMessage: 'Auth failed',
      errorCode: 'AUTH',
    });

    expect(jobRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', errorMessage: 'Auth failed', errorCode: 'AUTH' }),
    );
    expect(calendarIntegrationStub.update).toHaveBeenCalledWith(
      { status: 'error', syncError: 'Auth failed' },
      { where: { userId: 66 } },
    );
    expect(result).toEqual({ id: 404, status: 'failed', errorMessage: 'Auth failed' });
  });
});
