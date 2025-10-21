import { describe, it, beforeEach, expect } from '@jest/globals';
import { MessageThread, MessageParticipant, Message, User } from '../src/models/messagingModels.js';
import {
  joinCommunityChannel,
  leaveCommunityChannel,
  fetchRecentMessages,
  publishMessage,
  acknowledgeMessages,
  muteParticipant,
  removeMessage,
  describeChannelState,
} from '../src/services/communityChatService.js';
import { ModerationEvent } from '../src/models/moderationModels.js';

const CHANNEL_SLUG = 'global-lobby';
const USER_ID = 101;

describe('communityChatService', () => {
  beforeEach(async () => {
    await ModerationEvent.destroy({ truncate: true, cascade: true, restartIdentity: true });
    await User.create({
      id: USER_ID,
      firstName: 'Community',
      lastName: 'Tester',
      email: 'community.tester@gigvora.test',
      password: 'hashed-password',
      userType: 'user',
      twoFactorEnabled: false,
      twoFactorMethod: 'email',
    });
  });

  it('joins a channel and primes membership with a welcome transcript', async () => {
    const result = await joinCommunityChannel({ channelSlug: CHANNEL_SLUG, userId: USER_ID });

    expect(result.thread).toMatchObject({ subject: `community:${CHANNEL_SLUG}` });
    expect(result.participant).toMatchObject({ userId: USER_ID });
    expect(Array.isArray(result.messages)).toBe(true);

    const participant = await MessageParticipant.findOne({ where: { threadId: result.thread.id, userId: USER_ID } });
    expect(participant.lastReadAt).toBeInstanceOf(Date);
  });

  it('publishes a moderated message with sanitised content and evaluation metadata', async () => {
    await joinCommunityChannel({ channelSlug: CHANNEL_SLUG, userId: USER_ID });

    const message = await publishMessage({
      channelSlug: CHANNEL_SLUG,
      userId: USER_ID,
      body: 'Hello world   ',
      metadata: { client: 'web' },
    });

    expect(message.body).toBe('Hello world');
    expect(message.metadata).toMatchObject({
      channelSlug: CHANNEL_SLUG,
      moderation: expect.objectContaining({ decision: 'allow', status: 'approved' }),
      evaluation: { client: 'web' },
      client: 'web',
    });

    const persisted = await Message.findByPk(message.id);
    expect(persisted.metadata.moderation.status).toBe('approved');
    expect(persisted.metadata.evaluation).toEqual({ client: 'web' });
  });

  it('blocks disallowed content and records moderation activity', async () => {
    await joinCommunityChannel({ channelSlug: CHANNEL_SLUG, userId: USER_ID });

    await expect(
      publishMessage({ channelSlug: CHANNEL_SLUG, userId: USER_ID, body: 'Visit https://bit.ly/blocked' }),
    ).rejects.toThrow('Your message violated community policies and was blocked');

    const state = await describeChannelState(CHANNEL_SLUG);
    expect(state.messages).toBe(0);

    const moderationEvents = await ModerationEvent.findAll({ where: { channelSlug: CHANNEL_SLUG } });
    expect(moderationEvents).not.toHaveLength(0);
    expect(moderationEvents[0].action).toBe('message_blocked');
    expect(moderationEvents[0].metadata.decision).toBe('block');
  });

  it('acknowledges messages, fetches history, and supports leave behaviour', async () => {
    await joinCommunityChannel({ channelSlug: CHANNEL_SLUG, userId: USER_ID });
    await publishMessage({ channelSlug: CHANNEL_SLUG, userId: USER_ID, body: 'A friendly note' });

    await acknowledgeMessages({ channelSlug: CHANNEL_SLUG, userId: USER_ID });
    const participant = await MessageParticipant.findOne({ where: { userId: USER_ID } });
    expect(participant.lastReadAt).toBeInstanceOf(Date);

    const messages = await fetchRecentMessages({ channelSlug: CHANNEL_SLUG, limit: 1 });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ body: 'A friendly note', messageType: 'text' });

    await leaveCommunityChannel({ channelSlug: CHANNEL_SLUG, userId: USER_ID });
    const membership = await MessageParticipant.findOne({ where: { userId: USER_ID } });
    expect(membership).toBeNull();
  });

  it('mutes and removes messages with auditable metadata', async () => {
    const joinResult = await joinCommunityChannel({ channelSlug: CHANNEL_SLUG, userId: USER_ID });
    const message = await publishMessage({ channelSlug: CHANNEL_SLUG, userId: USER_ID, body: 'Sharing updates' });

    const muteUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const muteResult = await muteParticipant({
      channelSlug: CHANNEL_SLUG,
      userId: USER_ID,
      mutedBy: 9001,
      mutedUntil: muteUntil,
    });

    expect(muteResult).toEqual({ threadId: joinResult.thread.id, mutedUntil: new Date(muteUntil) });
    const updatedParticipant = await MessageParticipant.findOne({ where: { userId: USER_ID } });
    expect(updatedParticipant.metadata.moderation.mutedBy).toBe(9001);

    const removal = await removeMessage({
      channelSlug: CHANNEL_SLUG,
      messageId: message.id,
      moderatorId: 9001,
      reason: 'Policy violation',
    });

    expect(removal.metadata.moderation.reason).toBe('Policy violation');
    expect(removal.body).toBeNull();
    const updatedMessage = await Message.findByPk(message.id);
    expect(updatedMessage.messageType).toBe('system');

    const actionEvents = await ModerationEvent.findAll({ where: { action: 'message_removed' } });
    expect(actionEvents.length).toBeGreaterThan(0);
  });
});

