import { describe, it, expect } from '@jest/globals';
import {
  createThread,
  appendMessage,
  listMessages,
  getThread,
  updateThreadState,
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
});
