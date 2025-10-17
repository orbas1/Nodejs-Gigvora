import { describe, beforeEach, it, expect } from '@jest/globals';
import { sequelize, User, Profile, WalletAccount, WalletTransferRule, WalletTransferRequest } from '../../src/models/index.js';
import walletManagementService from '../../src/services/walletManagementService.js';
import { markDependencyHealthy } from '../../src/lifecycle/runtimeHealth.js';

let user;
let profile;
let walletAccount;

beforeAll(() => {
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_wallet_management';
  process.env.STRIPE_SECRET_KEY = 'sk_test_wallet_management';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_wallet_management';
});

afterAll(() => {
  delete process.env.STRIPE_PUBLISHABLE_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
  markDependencyHealthy('database', { vendor: 'sqlite', configured: true });
  markDependencyHealthy('paymentsCore', { provider: 'stripe', configured: true });
  markDependencyHealthy('paymentsGateway', { provider: 'stripe', configured: true });
  markDependencyHealthy('complianceProviders', { custodyProvider: 'stripe', escrowEnabled: true });

  user = await User.create({
    firstName: 'Wallet',
    lastName: 'Owner',
    email: `wallet-owner-${Date.now()}@example.com`,
    password: 'hashed-password',
    userType: 'user',
  });

  profile = await Profile.create({ userId: user.id });

  walletAccount = await WalletAccount.create({
    userId: user.id,
    profileId: profile.id,
    accountType: 'user',
    custodyProvider: 'stripe',
    status: 'active',
    currencyCode: 'USD',
    currentBalance: 0,
    availableBalance: 0,
    pendingHoldBalance: 0,
  });
});

describe('walletManagementService', () => {
  it('returns a comprehensive overview with compliance metadata', async () => {
    const overview = await walletManagementService.getWalletOverview(user.id, { bypassCache: true });

    expect(overview.summary).toMatchObject({
      accountCount: 1,
      currency: 'USD',
      totalBalance: 0,
      availableBalance: 0,
      pendingHoldBalance: 0,
    });
    expect(Array.isArray(overview.accounts)).toBe(true);
    expect(overview.accounts[0]).toMatchObject({
      accountType: 'user',
      status: 'active',
      complianceStatus: expect.any(String),
    });
    expect(overview.fundingSources.items).toHaveLength(0);
  });

  it('creates and updates funding sources while managing primaries', async () => {
    const source = await walletManagementService.createFundingSource(
      user.id,
      {
        walletAccountId: walletAccount.id,
        type: 'bank_account',
        label: 'Main bank',
        status: 'verified',
        makePrimary: true,
      },
      { actorId: user.id, actorRoles: ['user'] },
    );

    expect(source.isPrimary).toBe(true);

    const updated = await walletManagementService.updateFundingSource(
      user.id,
      source.id,
      { label: 'Main bank account', makePrimary: true },
      { actorId: user.id, actorRoles: ['user'] },
    );

    expect(updated.label).toBe('Main bank account');
    expect(updated.isPrimary).toBe(true);

    const snapshot = await walletManagementService.getWalletOverview(user.id);
    expect(snapshot.fundingSources.items).toHaveLength(1);
    expect(snapshot.fundingSources.primaryId).toEqual(source.id);
  });

  it('manages transfer rules lifecycle', async () => {
    const rule = await walletManagementService.createTransferRule(
      user.id,
      {
        walletAccountId: walletAccount.id,
        name: 'Monthly sweep',
        cadence: 'monthly',
        thresholdAmount: 100,
        transferType: 'payout',
        executionDay: 15,
      },
      { actorId: user.id, actorRoles: ['user'] },
    );

    expect(rule.status).toBe('active');
    expect(rule.executionDay).toBe(15);

    const paused = await walletManagementService.updateTransferRule(
      user.id,
      rule.id,
      { status: 'paused', thresholdAmount: 250 },
      { actorId: user.id, actorRoles: ['user'] },
    );

    expect(paused.status).toBe('paused');
    expect(paused.thresholdAmount).toBeCloseTo(250);

    const archived = await walletManagementService.deleteTransferRule(user.id, rule.id, {
      actorId: user.id,
      actorRoles: ['user'],
    });
    expect(archived.status).toBe('archived');

    const stored = await WalletTransferRule.findByPk(rule.id);
    expect(stored.status).toBe('archived');
  });

  it('creates and updates transfer requests with balance validation', async () => {
    await walletAccount.update({ currentBalance: 500, availableBalance: 500 });

    const request = await walletManagementService.createTransferRequest(
      user.id,
      {
        walletAccountId: walletAccount.id,
        amount: 125,
        transferType: 'payout',
        notes: 'Weekly drawdown',
      },
      { actorId: user.id, actorRoles: ['user'] },
    );

    expect(request.status).toBe('pending');
    expect(request.amount).toBeCloseTo(125);

    const cancelled = await walletManagementService.updateTransferRequest(
      user.id,
      request.id,
      { status: 'cancelled', notes: 'Adjusting payout schedule' },
      { actorId: user.id, actorRoles: ['user'] },
    );

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.notes).toBe('Adjusting payout schedule');

    const stored = await WalletTransferRequest.findByPk(request.id);
    expect(stored.status).toBe('cancelled');
    expect(stored.metadata.cancelledAt).toBeDefined();
  });
});
