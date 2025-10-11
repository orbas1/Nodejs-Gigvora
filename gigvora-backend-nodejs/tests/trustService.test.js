import { describe, it, expect, jest } from '@jest/globals';
import trustService from '../src/services/trustService.js';
import { EscrowAccount, EscrowTransaction, DisputeCase } from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

describe('trustService', () => {
  it('creates escrow accounts, initiates transactions, and releases funds', async () => {
    const owner = await createUser({ email: 'owner@gigvora.test', userType: 'user' });
    const counterparty = await createUser({ email: 'counterparty@gigvora.test', userType: 'user' });

    const account = await trustService.ensureEscrowAccount({
      userId: owner.id,
      provider: 'stripe_sandbox',
      currencyCode: 'GBP',
    });

    expect(account).toMatchObject({ provider: 'stripe_sandbox', currencyCode: 'GBP', status: 'pending' });

    const transaction = await trustService.initiateEscrowTransaction({
      accountId: account.id,
      reference: 'ESCROW-1001',
      amount: 500.25,
      feeAmount: 10.25,
      type: 'project',
      initiatedById: owner.id,
      counterpartyId: counterparty.id,
      milestoneLabel: 'Discovery phase',
      scheduledReleaseAt: tomorrow(),
      metadata: { projectId: 884, invoiceNumber: 'INV-5521' },
    });

    expect(transaction).toMatchObject({
      reference: 'ESCROW-1001',
      status: 'in_escrow',
      amount: 500.25,
      netAmount: 490,
      counterpartyId: counterparty.id,
    });

    const persistedAccount = await EscrowAccount.findByPk(account.id);
    expect(Number.parseFloat(persistedAccount.currentBalance)).toBeCloseTo(500.25, 2);
    expect(Number.parseFloat(persistedAccount.pendingReleaseTotal)).toBeCloseTo(490, 2);
    expect(persistedAccount.status).toBe('active');

    await trustService.releaseEscrowTransaction(transaction.id, {
      actorId: owner.id,
      notes: 'Milestone accepted and delivered',
    });

    const settledAccount = await EscrowAccount.findByPk(account.id);
    expect(Number.parseFloat(settledAccount.currentBalance)).toBeCloseTo(0, 4);
    expect(Number.parseFloat(settledAccount.pendingReleaseTotal)).toBeCloseTo(0, 4);

    const settledTransaction = await EscrowTransaction.findByPk(transaction.id);
    expect(settledTransaction.status).toBe('released');
    expect(settledTransaction.releasedAt).not.toBeNull();
  });

  it('opens disputes, stores evidence in R2, and triggers financial resolutions', async () => {
    const payer = await createUser({ email: 'payer@gigvora.test', userType: 'user' });
    const payee = await createUser({ email: 'payee@gigvora.test', userType: 'freelancer' });

    const account = await trustService.ensureEscrowAccount({
      userId: payer.id,
      provider: 'stripe_sandbox',
      currencyCode: 'USD',
    });

    const transaction = await trustService.initiateEscrowTransaction({
      accountId: account.id,
      reference: 'ESCROW-2001',
      amount: 300,
      feeAmount: 9,
      type: 'milestone',
      initiatedById: payer.id,
      counterpartyId: payee.id,
      scheduledReleaseAt: tomorrow(),
      metadata: { projectId: 999, milestoneId: 45 },
    });

    const dispute = await trustService.createDisputeCase({
      escrowTransactionId: transaction.id,
      openedById: payee.id,
      priority: 'high',
      reasonCode: 'quality_issue',
      summary: 'Deliverable rejected by client for quality concerns.',
      metadata: { channel: 'in-app', initialMessageId: 1234 },
    });

    expect(dispute).toMatchObject({ status: 'open', stage: 'intake', priority: 'high' });
    const disputedTransaction = await EscrowTransaction.findByPk(transaction.id);
    expect(disputedTransaction.status).toBe('disputed');

    const uploader = { uploadEvidence: jest.fn().mockResolvedValue({ stored: true, key: 'disputes/1/evidence.txt', url: 'https://r2.example/evidence.txt' }) };

    const evidenceContent = Buffer.from('The delivered files do not compile.').toString('base64');

    const resolution = await trustService.appendDisputeEvent(
      dispute.id,
      {
        actorId: payer.id,
        actorType: 'customer',
        actionType: 'evidence_upload',
        notes: 'Attaching QA failure logs for review.',
        stage: 'mediation',
        status: 'settled',
        resolutionNotes: 'Refund issued to customer after mediation.',
        transactionResolution: 'refund',
        evidence: {
          content: evidenceContent,
          fileName: 'qa-report.txt',
          contentType: 'text/plain',
        },
      },
      { uploader },
    );

    expect(uploader.uploadEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: expect.stringContaining(`disputes/${dispute.id}`),
        fileName: 'qa-report.txt',
        contentType: 'text/plain',
      }),
    );

    expect(resolution.dispute).toMatchObject({
      status: 'settled',
      stage: 'mediation',
      resolutionNotes: 'Refund issued to customer after mediation.',
    });
    expect(resolution.event).toMatchObject({ actionType: 'evidence_upload', evidenceFileName: 'qa-report.txt' });

    const refundedTransaction = await EscrowTransaction.findByPk(transaction.id);
    expect(refundedTransaction.status).toBe('refunded');
    expect(refundedTransaction.refundedAt).not.toBeNull();

    const reconciledAccount = await EscrowAccount.findByPk(account.id);
    expect(Number.parseFloat(reconciledAccount.currentBalance)).toBeCloseTo(0, 4);
    expect(Number.parseFloat(reconciledAccount.pendingReleaseTotal)).toBeCloseTo(0, 4);

    const refreshedDispute = await DisputeCase.findByPk(dispute.id);
    expect(refreshedDispute.resolvedAt).not.toBeNull();
  });
});
