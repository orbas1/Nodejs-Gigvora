import { describe, it, expect } from '@jest/globals';
import supportDeskService from '../src/services/supportDeskService.js';
import {
  SupportCase,
  SupportCasePlaybook,
  SupportPlaybook,
  SupportPlaybookStep,
  SupportCaseLink,
  SupportCaseSatisfaction,
  SupportKnowledgeArticle,
  EscrowAccount,
  EscrowTransaction,
  DisputeCase,
  DisputeEvent,
  MessageThread,
  MessageParticipant,
  Message,
} from '../src/models/index.js';
import { createUser } from './helpers/factories.js';

describe('supportDeskService', () => {
  it('builds a holistic support desk snapshot for a freelancer', async () => {
    const freelancer = await createUser({ email: 'freelancer@gigvora.test', userType: 'freelancer' });
    const client = await createUser({ email: 'client@gigvora.test', userType: 'user' });
    const agent = await createUser({ email: 'agent@gigvora.test', userType: 'admin' });

    const thread = await MessageThread.create({
      subject: 'Escalation on gig order',
      channelType: 'support',
      createdBy: client.id,
    });

    await MessageParticipant.bulkCreate([
      { threadId: thread.id, userId: freelancer.id, role: 'participant' },
      { threadId: thread.id, userId: client.id, role: 'owner' },
      { threadId: thread.id, userId: agent.id, role: 'support' },
    ]);

    await Message.create({
      threadId: thread.id,
      senderId: client.id,
      messageType: 'text',
      body: 'Client reports that deliverables were missing key assets.',
    });
    await Message.create({
      threadId: thread.id,
      senderId: freelancer.id,
      messageType: 'text',
      body: 'Acknowledged — reviewing shared folder and timeline now.',
    });

    const supportCase = await SupportCase.create({
      threadId: thread.id,
      status: 'in_progress',
      priority: 'high',
      reason: 'Client unhappy with milestone delivery scope.',
      metadata: { gigId: 77, orderReference: 'GIG-ORDER-2001' },
      escalatedBy: client.id,
      escalatedAt: new Date(Date.now() - 60 * 60 * 1000),
      assignedTo: agent.id,
      assignedBy: agent.id,
      assignedAt: new Date(Date.now() - 30 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    const playbook = await SupportPlaybook.create({
      slug: 'mediation-guide',
      title: 'Gig mediation guide',
      summary: 'Align with clients on delivery gaps, then plan escrow outcomes.',
      stage: 'investigation',
      persona: 'support_team',
      channel: 'platform',
      csatImpact: 'Lifts CSAT by 20% when applied within 24 hours.',
    });

    await SupportPlaybookStep.bulkCreate([
      { playbookId: playbook.id, stepNumber: 1, title: 'Collect evidence', instructions: 'Request annotated files and approvals.' },
      { playbookId: playbook.id, stepNumber: 2, title: 'Define resolution path', instructions: 'Confirm if revision, refund, or goodwill credit best fits.' },
    ]);

    await SupportCasePlaybook.create({
      supportCaseId: supportCase.id,
      playbookId: playbook.id,
      status: 'active',
      assignedAt: new Date(Date.now() - 20 * 60 * 1000),
      notes: 'Use mediation before escalating to arbitration.',
    });

    await SupportKnowledgeArticle.create({
      slug: 'evidence-basics',
      title: 'Evidence basics for gig disputes',
      summary: 'Checklist for gathering scope docs, approvals, and revision history.',
      body: 'Always collect annotated files, scope references, and client approvals before mediation.',
      category: 'workflow',
      audience: 'freelancer',
      tags: ['disputes', 'evidence'],
      resourceLinks: [{ label: 'Evidence template', url: 'https://docs.gigvora.test/templates/evidence' }],
      lastReviewedAt: new Date(),
    });

    const escrowAccount = await EscrowAccount.create({
      userId: freelancer.id,
      provider: 'stripe_sandbox',
      externalId: 'acct_123',
      status: 'active',
      currencyCode: 'USD',
    });

    const transaction = await EscrowTransaction.create({
      accountId: escrowAccount.id,
      reference: 'ESCROW-555',
      type: 'gig',
      status: 'disputed',
      amount: 950.5,
      currencyCode: 'USD',
      feeAmount: 25.5,
      netAmount: 925,
      initiatedById: freelancer.id,
      counterpartyId: client.id,
      gigId: 77,
      milestoneLabel: 'Brand workshop deliverable',
    });

    await SupportCaseLink.create({
      supportCaseId: supportCase.id,
      linkType: 'transaction',
      escrowTransactionId: transaction.id,
      reference: 'ESCROW-555',
      orderAmount: 950.5,
      currencyCode: 'USD',
      gigId: 77,
      gigTitle: 'Brand workshop sprint',
      clientName: 'Acme Corp',
    });

    const disputeCase = await DisputeCase.create({
      escrowTransactionId: transaction.id,
      openedById: freelancer.id,
      assignedToId: agent.id,
      stage: 'intake',
      status: 'open',
      priority: 'high',
      reasonCode: 'quality_issue',
      summary: 'Client requested escalation for missing design assets.',
      openedAt: new Date(Date.now() - 10 * 60 * 1000),
    });

    await DisputeEvent.create({
      disputeCaseId: disputeCase.id,
      actorId: client.id,
      actorType: 'customer',
      actionType: 'comment',
      notes: 'Need updated assets before campaign launch.',
      eventAt: new Date(),
    });

    await SupportCaseSatisfaction.create({
      supportCaseId: supportCase.id,
      score: 5,
      comment: 'Resolution was handled quickly and professionally.',
      submittedBy: client.id,
      submittedByType: 'client',
      capturedAt: new Date(),
    });

    const snapshot = await supportDeskService.getFreelancerSupportDesk(freelancer.id, { bypassCache: true });

    expect(snapshot.metrics.openSupportCases).toBe(1);
    expect(snapshot.metrics.openDisputes).toBe(1);
    expect(snapshot.metrics.csatScore).toBe(5);
    expect(snapshot.metrics.csatResponses).toBe(1);
    expect(snapshot.supportCases).toHaveLength(1);
    expect(snapshot.supportCases[0].transcript).toHaveLength(2);
    expect(snapshot.supportCases[0].linkedOrder).toMatchObject({ reference: 'ESCROW-555', amount: expect.any(Number) });
    expect(snapshot.disputes[0]).toMatchObject({ id: disputeCase.id, transaction: expect.objectContaining({ reference: 'ESCROW-555' }) });
    expect(snapshot.playbooks.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.knowledgeBase.length).toBeGreaterThanOrEqual(1);

    const cached = await supportDeskService.getFreelancerSupportDesk(freelancer.id);
    expect(cached).toEqual(snapshot);
  });
});
