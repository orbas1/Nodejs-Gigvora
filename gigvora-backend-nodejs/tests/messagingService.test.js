import { describe, it, expect } from '@jest/globals';
import {
  createThread,
  appendMessage,
  listMessages,
  getThread,
  updateThreadState,
  markThreadRead,
  listThreadsForUser,
  escalateThreadToSupport,
  assignSupportAgent,
  updateSupportCaseStatus,
} from '../src/services/messagingService.js';
import { createUser } from './helpers/factories.js';
import { AuthorizationError } from '../src/utils/errors.js';

describe('messagingService', () => {
  it('creates threads, appends messages, and enforces state transitions', async () => {
    const owner = await createUser({ email: 'owner@gigvora.test', userType: 'user' });
    const participant = await createUser({ email: 'participant@gigvora.test', userType: 'user' });

    const thread = await createThread({
      subject: 'Project kickoff',
      createdBy: owner.id,
      participantIds: [participant.id],
      metadata: {
        projectId: 404,
        _internalRoute: 'hidden',
      },
    });

    expect(thread).toMatchObject({
      subject: 'Project kickoff',
      participants: expect.arrayContaining([
        expect.objectContaining({ userId: owner.id, role: 'owner' }),
        expect.objectContaining({ userId: participant.id, role: 'participant' }),
      ]),
    });
    expect(thread.metadata).toEqual(expect.objectContaining({ projectId: 404 }));
    expect(thread.metadata).not.toHaveProperty('_internalRoute');

    const message = await appendMessage(thread.id, owner.id, {
      messageType: 'text',
      body: 'Welcome aboard – sharing the discovery brief.',
      attachments: [
        {
          fileName: 'discovery-brief.pdf',
          storageKey: 'workspace/briefs/discovery-brief.pdf',
          mimeType: 'application/pdf',
          fileSize: 24576,
        },
      ],
      metadata: {
        deliveryContext: 'kickoff',
      },
    });

    expect(message).toMatchObject({
      messageType: 'text',
      sender: expect.objectContaining({ id: owner.id }),
      attachments: [
        expect.objectContaining({
          fileName: 'discovery-brief.pdf',
          storageKey: 'workspace/briefs/discovery-brief.pdf',
        }),
      ],
    });

    const messagePage = await listMessages(thread.id, { pageSize: 10 });
    expect(messagePage.data).toHaveLength(1);
    expect(messagePage.pagination).toMatchObject({ total: 1, totalPages: 1 });

    const lockedThread = await updateThreadState(thread.id, 'locked');
    expect(lockedThread.state).toBe('locked');

    await expect(
      appendMessage(thread.id, owner.id, {
        messageType: 'text',
        body: 'This should fail while thread is locked',
      }),
    ).rejects.toBeInstanceOf(AuthorizationError);

    const reloaded = await getThread(thread.id, { withParticipants: true });
    expect(reloaded.state).toBe('locked');
    expect(reloaded.participants?.length).toBe(2);
  });

  it('produces inbox rollups with support escalation lifecycle data', async () => {
    const requester = await createUser({ email: 'requester@gigvora.test', userType: 'user' });
    const collaborator = await createUser({ email: 'collaborator@gigvora.test', userType: 'user' });
    const supportAgent = await createUser({ email: 'support@gigvora.test', userType: 'admin' });

    const thread = await createThread({
      subject: 'Payment issue',
      createdBy: requester.id,
      participantIds: [collaborator.id],
      metadata: { projectId: 501, origin: 'web_inbox' },
    });

    await appendMessage(thread.id, requester.id, {
      messageType: 'text',
      body: 'Hi there, could you confirm the escrow status?',
    });

    const collaboratorInbox = await listThreadsForUser(collaborator.id, { includeParticipants: true }, { pageSize: 5 });
    expect(collaboratorInbox.data[0]).toMatchObject({ id: thread.id, unreadCount: 1 });

    const supportCase = await escalateThreadToSupport(thread.id, collaborator.id, {
      reason: 'Escrow payout failed to release',
      priority: 'urgent',
      metadata: { escalationChannel: 'inbox', severity: 'p1' },
    });
    expect(supportCase).toMatchObject({ status: 'triage', priority: 'urgent', escalatedBy: collaborator.id });

    const assignment = await assignSupportAgent(thread.id, supportAgent.id, { assignedBy: requester.id });
    expect(assignment).toMatchObject({ status: 'in_progress', assignedTo: supportAgent.id });

    const resolved = await updateSupportCaseStatus(thread.id, 'resolved', {
      actorId: supportAgent.id,
      resolutionSummary: 'Escrow ledger reconciled and payout released.',
    });
    expect(resolved).toMatchObject({ status: 'resolved', resolutionSummary: 'Escrow ledger reconciled and payout released.' });

    await markThreadRead(thread.id, requester.id);

    const hydratedThread = await getThread(thread.id, { withParticipants: true });
    const requesterParticipant = hydratedThread.participants?.find((participant) => participant.userId === requester.id);
    expect(requesterParticipant?.lastReadAt).not.toBeNull();

    const requesterInbox = await listThreadsForUser(
      requester.id,
      { includeParticipants: true, includeSupport: true },
      { pageSize: 5 },
    );

    expect(requesterInbox.data[0]).toMatchObject({
      id: thread.id,
      unreadCount: 0,
      supportCase: expect.objectContaining({
        status: 'resolved',
        priority: 'urgent',
        assignedTo: supportAgent.id,
      }),
    });
    expect(requesterInbox.data[0].viewerState).toMatchObject({
      participantId: expect.any(Number),
      notificationsEnabled: true,
    });

    const unreadOnly = await listThreadsForUser(requester.id, { unreadOnly: true }, { pageSize: 5 });
    expect(unreadOnly.data).toHaveLength(0);
  });
});
