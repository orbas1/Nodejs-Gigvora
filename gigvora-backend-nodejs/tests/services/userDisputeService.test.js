import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { describe, it, expect } from '@jest/globals';
import userDisputeService from '../../src/services/userDisputeService.js';
import trustService from '../../src/services/trustService.js';
import { sequelize, User } from '../../src/models/index.js';

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

async function createCoreUser(overrides = {}) {
  const hashedPassword = await bcrypt.hash(overrides.password ?? 'Password123!', 10);
  try {
    return await User.create({
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
      email: overrides.email ?? `user-${crypto.randomUUID()}@gigvora.test`,
      password: hashedPassword,
      userType: overrides.userType ?? 'user',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create core user', error);
    throw error;
  }
}

describe('userDisputeService', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('lists disputes, summaries, and eligible transactions for a user', async () => {
    const client = await createCoreUser({ userType: 'user' });
    const provider = await createCoreUser({ userType: 'freelancer' });

    const account = await trustService.ensureEscrowAccount({
      userId: client.id,
      provider: 'stripe',
      currencyCode: 'USD',
    });

    const transaction = await trustService.initiateEscrowTransaction({
      accountId: account.id,
      reference: 'ESCROW-3001',
      amount: 420,
      feeAmount: 12,
      type: 'project',
      initiatedById: client.id,
      counterpartyId: provider.id,
      scheduledReleaseAt: tomorrow(),
      metadata: { title: 'Brand design sprint' },
    });

    await trustService.createDisputeCase({
      escrowTransactionId: transaction.id,
      openedById: client.id,
      priority: 'high',
      reasonCode: 'quality_issue',
      summary: 'Deliverables were incomplete and below expectations.',
    });

    const payload = await userDisputeService.listUserDisputes(client.id);

    expect(payload.summary.openCount).toBeGreaterThanOrEqual(1);
    expect(payload.disputes).toHaveLength(1);
    expect(payload.disputes[0]).toMatchObject({
      transaction: expect.objectContaining({ reference: 'ESCROW-3001' }),
      permissions: expect.objectContaining({ canAddEvidence: true }),
    });
    expect(payload.eligibleTransactions.some((item) => item.id === transaction.id)).toBe(true);
    expect(payload.metadata.reasonCodes.length).toBeGreaterThan(0);
  });

  it('creates disputes and allows users to append updates', async () => {
    const client = await createCoreUser({ userType: 'user' });
    const provider = await createCoreUser({ userType: 'freelancer' });

    const account = await trustService.ensureEscrowAccount({
      userId: client.id,
      provider: 'stripe',
      currencyCode: 'GBP',
    });

    const transaction = await trustService.initiateEscrowTransaction({
      accountId: account.id,
      reference: 'ESCROW-3002',
      amount: 250,
      feeAmount: 8,
      type: 'milestone',
      initiatedById: client.id,
      counterpartyId: provider.id,
      scheduledReleaseAt: tomorrow(),
      metadata: { projectName: 'Website refresh' },
    });

    const created = await userDisputeService.createUserDispute(client.id, {
      escrowTransactionId: transaction.id,
      reasonCode: 'scope_disagreement',
      priority: 'medium',
      summary: 'Provider delivered out-of-scope assets without approval.',
      customerDeadlineAt: tomorrow(),
    });

    expect(created).toMatchObject({
      status: 'open',
      stage: 'intake',
      transaction: expect.objectContaining({ id: transaction.id }),
    });
    expect(created.events.length).toBeGreaterThanOrEqual(1);

    const updated = await userDisputeService.appendUserDisputeEvent(client.id, created.id, {
      notes: 'Uploaded annotated design review and requested mediation.',
      actionType: 'comment',
      stage: 'mediation',
      status: 'under_review',
    });

    expect(updated.stage).toBe('mediation');
    expect(updated.status).toBe('under_review');
    expect(updated.events.length).toBeGreaterThan(created.events.length);
  });
});
