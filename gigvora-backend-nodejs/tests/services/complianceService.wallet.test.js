import { randomUUID } from 'crypto';
import { describe, expect, it, beforeEach } from '@jest/globals';
import {
  User,
  Profile,
  WalletAccount,
  WalletLedgerEntry,
  sequelize,
} from '../../src/models/index.js';
import { recordWalletLedgerEntry } from '../../src/services/complianceService.js';
import { ValidationError, ServiceUnavailableError } from '../../src/utils/errors.js';
import {
  markDependencyHealthy,
  markDependencyUnavailable,
} from '../../src/lifecycle/runtimeHealth.js';

let user;
let profile;
let walletAccount;

beforeEach(async () => {
  await sequelize.sync({ force: true });

  user = await User.create({
    firstName: 'Ledger',
    lastName: 'Tester',
    email: `ledger-${randomUUID()}@example.com`,
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

  markDependencyHealthy('database', { vendor: 'sqlite', configured: true });
  markDependencyHealthy('paymentsCore', { provider: 'stripe', configured: true });
  markDependencyHealthy('complianceProviders', { custodyProvider: 'stripe', escrowEnabled: true });
});

describe('recordWalletLedgerEntry compliance guards', () => {
  it('records closed-loop credits with sanitised rounding and metadata', async () => {
    const entry = await recordWalletLedgerEntry(walletAccount.id, {
      entryType: 'credit',
      amount: 100.123456,
      description: 'Service marketplace payout',
    });

    await walletAccount.reload();

    expect(entry.amount).toBeCloseTo(100.1235, 4);
    expect(entry.metadata).toMatchObject({
      regulatoryClassification: 'closed_loop_non_cash',
      iosIapCompliant: true,
      fcaSupervisionRequired: false,
    });
    expect(walletAccount.currentBalance).toBeCloseTo(100.1235, 4);
    expect(walletAccount.availableBalance).toBeCloseTo(100.1235, 4);

    const storedEntry = await WalletLedgerEntry.findByPk(entry.id);
    expect(storedEntry.metadata.complianceSummary).toContain('Closed-loop wallet credit');
  });

  it('rejects ledger metadata that requires FCA regulation', async () => {
    await expect(
      recordWalletLedgerEntry(walletAccount.id, {
        entryType: 'credit',
        amount: 25,
        metadata: { regulatoryClassification: 'e_money' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects ledger metadata that signals Apple IAP non-compliance', async () => {
    await expect(
      recordWalletLedgerEntry(walletAccount.id, {
        entryType: 'credit',
        amount: 25,
        metadata: { iosIapCompliant: false },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('halts ledger recordings when a critical dependency is unavailable', async () => {
    markDependencyUnavailable('paymentsCore', new Error('Stripe outage'));

    await expect(
      recordWalletLedgerEntry(walletAccount.id, {
        entryType: 'credit',
        amount: 10,
        description: 'Test credit',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});
