import { jest } from '@jest/globals';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const integrationModelsPath = path.resolve(
  __dirname,
  '../../src/models/apiIntegrationModels.js',
);

const ApiProvider = { findAll: jest.fn(), findByPk: jest.fn() };
const ApiClient = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
};
const ApiClientKey = { create: jest.fn(), findOne: jest.fn() };
const ApiClientAuditEvent = { create: jest.fn() };
const ApiClientUsageMetric = {
  findOrCreate: jest.fn(),
  findByPk: jest.fn(),
};

await jest.unstable_mockModule(integrationModelsPath, () => ({
  ApiProvider,
  ApiClient,
  ApiClientKey,
  ApiClientAuditEvent,
  ApiClientUsageMetric,
}));

const modelsPath = path.resolve(__dirname, '../../src/models/index.js');
const WalletAccount = { findAll: jest.fn(), findByPk: jest.fn() };
const User = {};
const Profile = {};
await jest.unstable_mockModule(modelsPath, () => ({ WalletAccount, User, Profile }));

const sequelizeClientPath = path.resolve(__dirname, '../../src/models/sequelizeClient.js');
const transactionMock = jest.fn(async () => ({
  commit: jest.fn(),
  rollback: jest.fn(),
  LOCK: { UPDATE: Symbol('LOCK_UPDATE') },
}));
const sequelizeClient = { transaction: transactionMock };
await jest.unstable_mockModule(sequelizeClientPath, () => ({
  default: sequelizeClient,
}));

const complianceServicePath = path.resolve(__dirname, '../../src/services/complianceService.js');
const recordWalletLedgerEntry = jest.fn(async () => ({ id: 'ledger-1' }));
await jest.unstable_mockModule(complianceServicePath, () => ({ recordWalletLedgerEntry }));

const bcryptHash = jest.fn(async (value) => `hashed:${value}`);
await jest.unstable_mockModule('bcrypt', () => ({
  default: { hash: bcryptHash },
  hash: bcryptHash,
}));

const loggerPath = path.resolve(__dirname, '../../src/utils/logger.js');
await jest.unstable_mockModule(loggerPath, () => ({
  default: { child: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) },
}));

const serviceModulePath = path.resolve(__dirname, '../../src/services/apiManagementService.js');

const {
  getApiRegistry,
  createApiClient,
  recordClientUsage,
} = await import(serviceModulePath);

const { ValidationError, NotFoundError } = await import('../../src/utils/errors.js');

describe('apiManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    transactionMock.mockImplementation(async () => ({
      commit: jest.fn(),
      rollback: jest.fn(),
      LOCK: { UPDATE: Symbol('LOCK_UPDATE') },
    }));
  });

  describe('getApiRegistry', () => {
    it('aggregates provider usage and enriches wallet accounts', async () => {
      const providerRecord = {
        toPublicObject: jest.fn(() => ({
          id: 1,
          name: 'Core API',
          callPriceCents: 5,
          clients: [
            {
              id: 10,
              name: 'Acme',
              status: 'active',
              walletAccountId: 50,
              callPriceCents: 7,
              usageMetrics: [
                {
                  requestCount: 100,
                  errorCount: 4,
                  avgLatencyMs: 200,
                  peakLatencyMs: 400,
                  billableRequestCount: 80,
                  billedAmountCents: 560,
                  lastRequestAt: '2024-06-01T12:00:00Z',
                },
              ],
            },
            {
              id: 11,
              name: 'Beta',
              status: 'suspended',
              usageMetrics: [],
            },
          ],
        })),
      };
      ApiProvider.findAll.mockResolvedValue([providerRecord]);

      const walletAccount = {
        id: 50,
        get: jest.fn(() => ({
          id: 50,
          accountType: 'operating',
          currencyCode: 'USD',
          availableBalance: 750,
          user: { firstName: 'Tessa', lastName: 'Lane' },
          profile: { headline: 'Finance Lead' },
        })),
      };
      WalletAccount.findAll.mockResolvedValue([walletAccount]);

      const result = await getApiRegistry({ usageWindowDays: 7 });

      expect(ApiProvider.findAll).toHaveBeenCalled();
      expect(providerRecord.toPublicObject).toHaveBeenCalled();
      expect(WalletAccount.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: [50] } }),
      );
      expect(result.summary.providerCount).toBe(1);
      expect(result.summary.activeClientCount).toBe(1);
      expect(result.summary.suspendedClientCount).toBe(1);
      expect(result.providers[0].clients[0].billing.walletAccount).toEqual(
        expect.objectContaining({ id: 50, label: expect.stringContaining('Acct 50') }),
      );
    });
  });

  describe('createApiClient', () => {
    beforeEach(() => {
      ApiProvider.findByPk.mockResolvedValue({ id: 2 });
      ApiClient.findOne.mockResolvedValue(null);
      WalletAccount.findByPk.mockResolvedValue({ id: 55 });
      const clientRecord = {
        id: 31,
        name: 'Atlas Client',
        reload: jest.fn(async () => clientRecord),
        toPublicObject: jest.fn(() => ({ id: 31, name: 'Atlas Client', keys: [] })),
      };
      ApiClient.create.mockResolvedValue(clientRecord);
      ApiClientKey.create.mockResolvedValue({});
    });

    it('creates a client with secrets and audit trail', async () => {
      const randomBytesSpy = jest
        .spyOn(crypto, 'randomBytes')
        .mockReturnValueOnce(Buffer.from('a'.repeat(32)))
        .mockReturnValueOnce(Buffer.from('b'.repeat(24)));
      const uuidSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('abcde123-uuid');

      const response = await createApiClient(
        {
          providerId: 2,
          name: 'Atlas Client',
          walletAccountId: 55,
          contactEmail: 'team@example.com',
          scopes: ['read', 'write'],
        },
        'system',
      );

      expect(ApiClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: 2,
          walletAccountId: 55,
          contactEmail: 'team@example.com',
          scopes: ['read', 'write'],
        }),
        expect.any(Object),
      );
      expect(ApiClientKey.create).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 31, secretHash: expect.stringContaining('hashed:') }),
        expect.any(Object),
      );
      expect(ApiClientAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 31, eventType: 'client_created' }),
      );
      expect(response.credentials.apiKey).toEqual(expect.any(String));
      expect(response.credentials.webhookSecret).toEqual(expect.stringMatching(/^wh_/));

      randomBytesSpy.mockRestore();
      uuidSpy.mockRestore();
    });

    it('validates duplicate slugs before creating the client', async () => {
      ApiClient.findOne.mockResolvedValueOnce({ id: 999 });
      await expect(createApiClient({ providerId: 2, name: 'Dup Client' })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('recordClientUsage', () => {
    const usageRecord = {
      id: 401,
      requestCount: 10,
      errorCount: 1,
      billableRequestCount: 6,
      billedAmountCents: 300,
      lastRequestAt: null,
      update: jest.fn(async function update(values) {
        Object.assign(this, values);
        return this;
      }),
      toPublicObject: jest.fn(function toPublicObject() {
        return {
          id: this.id,
          requestCount: this.requestCount,
          billableRequestCount: this.billableRequestCount,
          billedAmountCents: this.billedAmountCents,
        };
      }),
    };

    beforeEach(() => {
      ApiClientUsageMetric.findOrCreate.mockResolvedValue([usageRecord, false]);
      ApiClientUsageMetric.findByPk.mockResolvedValue({
        toPublicObject: jest.fn(() => ({ id: 401, requestCount: 14 })),
      });
      ApiClient.findByPk.mockResolvedValue({
        id: 301,
        name: 'Atlas Client',
        providerId: 2,
        walletAccountId: 55,
        callPriceCents: 50,
        lastUsedAt: null,
        provider: { callPriceCents: 40 },
        update: jest.fn(async function update(values) {
          Object.assign(this, values);
          return this;
        }),
      });
    });

    it('records usage, bills wallet, and writes audit events', async () => {
      const transaction = await sequelizeClient.transaction();
      transactionMock.mockResolvedValue(transaction);
      const randomUUIDSpy = jest.spyOn(crypto, 'randomUUID').mockReturnValue('usage-uuid-1234');

      const result = await recordClientUsage(
        301,
        {
          requestCount: 4,
          errorCount: 0,
          metricDate: '2024-06-01',
          lastRequestAt: '2024-06-01T12:00:00Z',
        },
        'admin',
      );

      expect(ApiClientUsageMetric.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: 301, metricDate: '2024-06-01' } }),
      );
      expect(recordWalletLedgerEntry).toHaveBeenCalledWith(
        55,
        expect.objectContaining({ entryType: 'debit', amount: expect.any(Number) }),
        expect.any(Object),
      );
      expect(ApiClientAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'usage_recorded', clientId: 301 }),
      );
      expect(result.billedAmountCents).toBeGreaterThan(0);
      expect(result.ledgerEntryId).toBe('ledger-1');

      randomUUIDSpy.mockRestore();
    });

    it('validates client existence before recording usage', async () => {
      ApiClient.findByPk.mockResolvedValueOnce(null);
      await expect(recordClientUsage(999, {})).rejects.toThrow(NotFoundError);
    });
  });
});
