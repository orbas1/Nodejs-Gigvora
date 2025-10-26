import { jest } from '@jest/globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

beforeAll(() => {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
});

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveModule = (specifier) => {
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
    return specifier;
  }
  return path.resolve(__dirname, specifier);
};

const withDefaultExport = (factory) => () => {
  const exports = factory();
  return Object.prototype.hasOwnProperty.call(exports, 'default')
    ? exports
    : { default: exports, ...exports };
};

const AuthorizationError = class AuthorizationError extends Error {};
const NotFoundError = class NotFoundError extends Error {};
const ValidationError = class ValidationError extends Error {};

const mockErrorsModule = withDefaultExport(() => ({
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError: class ConflictError extends Error {},
}));

function createAgencyWalletModels() {
  const now = new Date('2024-02-20T10:00:00Z');

  const accountRecord = {
    id: 11,
    workspaceId: 77,
    status: 'active',
    currencyCode: 'USD',
    currentBalance: '125000.50',
    availableBalance: '98000.25',
    pendingHoldBalance: '27000.25',
    lastReconciledAt: new Date('2024-02-20T02:00:00Z'),
    toPublicObject: () => ({
      id: 11,
      workspaceId: 77,
      status: 'active',
      currencyCode: 'USD',
      currentBalance: 125000.5,
      availableBalance: 98000.25,
      pendingHoldBalance: 27000.25,
      displayName: 'Ops Treasury',
    }),
    profile: { id: 44, headline: 'Director of Operations', userId: 9 },
    user: { id: 9, firstName: 'Lara', lastName: 'Ops', email: 'lara.ops@gigvora.com' },
    workspace: { id: 77, name: 'Atlas Ops', slug: 'atlas-ops' },
  };

  const ledgerEntries = [
    {
      toPublicObject: () => ({
        id: 'ledger-1',
        walletAccountId: 11,
        entryType: 'credit',
        amount: '2950.75',
        currencyCode: 'USD',
        occurredAt: '2024-02-19T09:00:00.000Z',
        metadata: { origin: 'stripe' },
      }),
      walletAccount: accountRecord,
      initiatedBy: { id: 9, firstName: 'Lara', lastName: 'Ops', email: 'lara.ops@gigvora.com' },
    },
    {
      toPublicObject: () => ({
        id: 'ledger-2',
        walletAccountId: 11,
        entryType: 'debit',
        amount: '-1500.50',
        currencyCode: 'USD',
        occurredAt: '2024-02-18T14:30:00.000Z',
        metadata: { origin: 'vendor_disbursement' },
      }),
      walletAccount: accountRecord,
      initiatedBy: { id: 9, firstName: 'Lara', lastName: 'Ops', email: 'lara.ops@gigvora.com' },
    },
  ];

  const fundingSourceRecord = {
    toPublicObject: () => ({
      id: 501,
      workspaceId: 77,
      label: 'Ops Treasury Checking',
      type: 'bank_account',
      provider: 'stripe',
      accountNumberLast4: '1234',
      currencyCode: 'USD',
      status: 'active',
      isPrimary: true,
      metadata: { source: 'foundational-persona-seed' },
      createdAt: now,
      updatedAt: now,
    }),
    workspace: { id: 77, name: 'Atlas Ops', slug: 'atlas-ops' },
  };

  const payoutRequests = [
    {
      amount: 4200.75,
      currencyCode: 'USD',
      status: 'approved',
      notes: 'Weekly automation payout',
      metadata: {
        scheduledFor: '2024-02-21T10:00:00.000Z',
        destination: 'Ops Treasury Checking',
        channel: 'bank_transfer',
      },
      requestedAt: new Date('2024-02-18T12:00:00Z'),
      toPublicObject: () => ({
        id: 910,
        workspaceId: 77,
        walletAccountId: 11,
        fundingSourceId: 501,
        amount: 4200.75,
        currencyCode: 'USD',
        status: 'approved',
        requestedById: 9,
        reviewedById: 9,
        processedById: null,
        requestedAt: new Date('2024-02-18T12:00:00Z'),
        approvedAt: new Date('2024-02-19T10:00:00Z'),
        processedAt: null,
        notes: 'Weekly automation payout',
        metadata: {
          scheduledFor: '2024-02-21T10:00:00.000Z',
          destination: 'Ops Treasury Checking',
          channel: 'bank_transfer',
        },
        createdAt: now,
        updatedAt: now,
      }),
      walletAccount: accountRecord,
      fundingSource: fundingSourceRecord,
      workspace: { id: 77, name: 'Atlas Ops', slug: 'atlas-ops' },
    },
    {
      amount: 1850.5,
      currencyCode: 'USD',
      status: 'pending_review',
      notes: 'Mentor bonus disbursement',
      metadata: {
        scheduledFor: '2024-02-24T09:30:00.000Z',
        destination: 'Ops Treasury Checking',
        channel: 'bank_transfer',
      },
      requestedAt: new Date('2024-02-19T20:00:00Z'),
      toPublicObject: () => ({
        id: 911,
        workspaceId: 77,
        walletAccountId: 11,
        fundingSourceId: 501,
        amount: 1850.5,
        currencyCode: 'USD',
        status: 'pending_review',
        requestedById: 9,
        reviewedById: null,
        processedById: null,
        requestedAt: new Date('2024-02-19T20:00:00Z'),
        approvedAt: null,
        processedAt: null,
        notes: 'Mentor bonus disbursement',
        metadata: {
          scheduledFor: '2024-02-24T09:30:00.000Z',
          destination: 'Ops Treasury Checking',
          channel: 'bank_transfer',
        },
        createdAt: now,
        updatedAt: now,
      }),
      walletAccount: accountRecord,
      fundingSource: fundingSourceRecord,
      workspace: { id: 77, name: 'Atlas Ops', slug: 'atlas-ops' },
    },
  ];

  return {
    sequelize: { transaction: jest.fn() },
    WalletAccount: {
      findAll: jest.fn().mockResolvedValue([accountRecord]),
      findByPk: jest.fn(),
    },
    WalletLedgerEntry: {
      findAll: jest.fn().mockResolvedValue(ledgerEntries),
    },
    AgencyWalletFundingSource: {
      count: jest.fn().mockResolvedValue(1),
      findAll: jest.fn(),
    },
    AgencyWalletTransferRule: {
      count: jest.fn().mockResolvedValue(2),
    },
    WalletPayoutRequest: {
      findAll: jest.fn().mockResolvedValue(payoutRequests),
    },
    WalletOperationalSetting: {
      findOne: jest.fn().mockResolvedValue({
        toPublicObject: () => ({
          id: 810,
          workspaceId: 77,
          lowBalanceAlertThreshold: 25000,
          autoSweepEnabled: true,
          autoSweepThreshold: 15000,
          reconciliationCadence: 'weekly',
          dualControlEnabled: true,
          complianceContactEmail: 'treasury@atlas-ops.demo',
          payoutWindow: 'business_days',
          riskTier: 'standard',
          complianceNotes: 'Seeded automation guardrails',
          metadata: { source: 'foundational-persona-seed' },
          createdById: 9,
          updatedById: 9,
          createdAt: now,
          updatedAt: now,
        }),
      }),
    },
    ProviderWorkspace: {
      findByPk: jest.fn(),
    },
    WalletAccountTrustScore: {},
    WalletFundingSource: {},
    WalletTransferRule: {},
    WalletTransferRequest: {},
    User: {},
    Profile: {},
    __fixtures: {
      now,
      accountRecord,
      ledgerEntries,
      fundingSourceRecord,
      payoutRequests,
    },
  };
}

describe('agencyWalletService.getWalletOverview', () => {
  it('requires a permitted wallet role', async () => {
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule);
    const models = createAgencyWalletModels();
    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => models));

    const { getWalletOverview } = await import('../agencyWalletService.js');
    await expect(getWalletOverview({ workspaceId: 77 }, { roles: [] })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('builds a rich wallet overview snapshot', async () => {
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule);
    const models = createAgencyWalletModels();
    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => models));

    const { getWalletOverview } = await import('../agencyWalletService.js');
    const snapshot = await getWalletOverview({ workspaceId: 77 }, { roles: ['agency_admin'] });

    expect(snapshot.workspaceId).toBe(77);
    expect(snapshot.currency).toBe('USD');
    expect(snapshot.totals.totalBalance).toBeCloseTo(125000.5, 2);
    expect(snapshot.totals.pendingPayoutAmount).toBeCloseTo(6051.25, 2);
    expect(snapshot.pendingPayouts).toEqual({ count: 2, amount: 6051.25 });
    expect(snapshot.currencyBreakdown[0]).toEqual(
      expect.objectContaining({ currency: 'USD', totalBalance: 125000.5 }),
    );

    expect(snapshot.upcomingPayouts).toHaveLength(2);
    expect(snapshot.upcomingPayouts[0]).toEqual(
      expect.objectContaining({
        amount: 4200.75,
        scheduledFor: '2024-02-21T10:00:00.000Z',
        destination: 'Ops Treasury Checking',
      }),
    );

    expect(snapshot.recentTransfers).toHaveLength(2);
    expect(snapshot.recentTransfers[0]).toEqual(
      expect.objectContaining({ channel: 'bank_transfer', amount: 4200.75 }),
    );

    expect(snapshot.alerts).toEqual([
      expect.objectContaining({ id: 'payout-queue', severity: 'warning' }),
    ]);

    expect(snapshot.compliance).toEqual(
      expect.objectContaining({ dualControlEnabled: true, autoSweepEnabled: true, riskTier: 'standard' }),
    );

    expect(snapshot.netFlows).toEqual([-1500.5, 2950.75]);
    expect(Number.isNaN(new Date(snapshot.refreshedAt).getTime())).toBe(false);

    expect(models.WalletAccount.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 77 }),
      }),
    );
    expect(models.WalletPayoutRequest.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 77 }),
      }),
    );
  });

  it('raises guardrail alerts when funding sources are missing and balances dip below thresholds', async () => {
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule);
    const models = createAgencyWalletModels();
    const base = models.__fixtures.accountRecord;
    const lowBalanceAccount = {
      ...base,
      currentBalance: '6000.00',
      availableBalance: '5000.00',
      pendingHoldBalance: '1200.00',
      toPublicObject: () => ({
        ...base.toPublicObject(),
        currentBalance: 6000,
        availableBalance: 5000,
        pendingHoldBalance: 1200,
      }),
    };

    models.WalletAccount.findAll.mockResolvedValue([lowBalanceAccount]);
    models.WalletPayoutRequest.findAll.mockResolvedValue([]);
    models.WalletLedgerEntry.findAll.mockResolvedValue([]);
    models.AgencyWalletFundingSource.count.mockResolvedValue(0);
    models.AgencyWalletTransferRule.count.mockResolvedValue(0);
    models.WalletOperationalSetting.findOne.mockResolvedValue({
      toPublicObject: () => ({
        id: 810,
        workspaceId: 77,
        lowBalanceAlertThreshold: 10000,
        autoSweepEnabled: false,
        autoSweepThreshold: 25000,
        reconciliationCadence: 'weekly',
        dualControlEnabled: false,
        complianceContactEmail: 'treasury@atlas-ops.demo',
        payoutWindow: 'business_days',
        riskTier: 'heightened',
        metadata: { source: 'unit-test' },
        createdAt: models.__fixtures.now,
        updatedAt: models.__fixtures.now,
      }),
    });

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => models));

    const { getWalletOverview } = await import('../agencyWalletService.js');
    const snapshot = await getWalletOverview({ workspaceId: 77 }, { roles: ['finance'] });

    expect(snapshot.pendingPayouts).toEqual({ count: 0, amount: 0 });
    expect(snapshot.netFlows).toEqual([]);
    expect(snapshot.currencyBreakdown[0]).toEqual(
      expect.objectContaining({ currency: 'USD', availableBalance: 5000 }),
    );
    expect(snapshot.compliance).toEqual(
      expect.objectContaining({ dualControlEnabled: false, riskTier: 'heightened' }),
    );

    const alertIds = snapshot.alerts.map((alert) => alert.id);
    expect(alertIds).toEqual(
      expect.arrayContaining(['funding-source-missing', 'transfer-rules-missing', 'low-balance']),
    );
    const lowBalance = snapshot.alerts.find((alert) => alert.id === 'low-balance');
    expect(lowBalance.message).toContain('guardrail');
  });

  it('aggregates multi-currency accounts and selects the dominant currency bucket', async () => {
    jest.unstable_mockModule(resolveModule('../../utils/errors.js'), mockErrorsModule);
    const models = createAgencyWalletModels();
    const base = models.__fixtures.accountRecord;
    const usdAccount = {
      ...base,
      id: 21,
      workspaceId: 99,
      currencyCode: 'USD',
      currentBalance: '1200.00',
      availableBalance: '1100.00',
      pendingHoldBalance: '100.00',
      toPublicObject: () => ({
        ...base.toPublicObject(),
        id: 21,
        workspaceId: 99,
        currencyCode: 'USD',
        currentBalance: 1200,
        availableBalance: 1100,
        pendingHoldBalance: 100,
        displayName: 'North America Ops',
      }),
    };
    usdAccount.workspace = { id: 99, name: 'Global Ops', slug: 'global-ops' };

    const eurAccount = {
      ...base,
      id: 22,
      workspaceId: 99,
      currencyCode: 'EUR',
      currentBalance: '5200.00',
      availableBalance: '5000.00',
      pendingHoldBalance: '200.00',
      toPublicObject: () => ({
        ...base.toPublicObject(),
        id: 22,
        workspaceId: 99,
        currencyCode: 'EUR',
        currentBalance: 5200,
        availableBalance: 5000,
        pendingHoldBalance: 200,
        displayName: 'EU Treasury',
      }),
    };
    eurAccount.workspace = { id: 99, name: 'Global Ops', slug: 'global-ops' };

    models.WalletAccount.findAll.mockResolvedValue([usdAccount, eurAccount]);
    models.WalletPayoutRequest.findAll.mockResolvedValue([]);
    models.AgencyWalletFundingSource.count.mockResolvedValue(2);
    models.AgencyWalletTransferRule.count.mockResolvedValue(1);
    models.WalletOperationalSetting.findOne.mockResolvedValue(null);
    models.WalletLedgerEntry.findAll.mockResolvedValue([
      {
        toPublicObject: () => ({
          id: 'flow-1',
          walletAccountId: eurAccount.id,
          entryType: 'credit',
          amount: '1200.00',
          currencyCode: 'EUR',
          occurredAt: '2024-03-01T10:00:00.000Z',
          metadata: { origin: 'stripe' },
        }),
        walletAccount: eurAccount,
      },
    ]);

    jest.unstable_mockModule(resolveModule('../../models/index.js'), withDefaultExport(() => models));

    const { getWalletOverview } = await import('../agencyWalletService.js');
    const snapshot = await getWalletOverview({ workspaceId: 99 }, { roles: ['agency_admin'] });

    expect(snapshot.currency).toBe('EUR');
    expect(snapshot.currencyBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ currency: 'USD', totalBalance: 1200 }),
        expect.objectContaining({ currency: 'EUR', totalBalance: 5200 }),
      ]),
    );
    expect(snapshot.totals.totalBalance).toBeCloseTo(6400, 2);
    expect(snapshot.netFlows).toEqual([1200]);
    expect(snapshot.alerts).toEqual([]);
    expect(snapshot.compliance).toEqual(
      expect.objectContaining({ kycStatus: 'complete', autoSweepEnabled: false }),
    );
  });
});
