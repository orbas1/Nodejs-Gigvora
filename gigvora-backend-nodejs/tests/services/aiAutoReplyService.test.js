import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  getUserOpenAiSettings,
  updateUserOpenAiSettings,
  processAutoReplies,
} from '../../src/services/aiAutoReplyService.js';
import {
  Message,
  MessageParticipant,
  MessageThread,
  User,
} from '../../src/models/messagingModels.js';

describe('aiAutoReplyService', () => {
  let sender;
  let recipient;
  let thread;

  beforeEach(async () => {
    sender = await User.create({
      firstName: 'Alex',
      lastName: 'Sender',
      email: `alex.sender+${Date.now()}@example.com`,
      password: 'password',
      userType: 'user',
    });
    recipient = await User.create({
      firstName: 'Riley',
      lastName: 'Responder',
      email: `riley.responder+${Date.now()}@example.com`,
      password: 'password',
      userType: 'user',
    });

    thread = await MessageThread.create({
      subject: 'Status Update',
      channelType: 'direct',
      state: 'active',
      createdBy: sender.id,
    });

    await MessageParticipant.bulkCreate([
      { threadId: thread.id, userId: sender.id, role: 'owner' },
      { threadId: thread.id, userId: recipient.id, role: 'participant' },
    ]);
  });

  afterEach(async () => {
    await Message.destroy({ where: {} });
    await MessageParticipant.destroy({ where: {} });
    await MessageThread.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  it('persists AI settings and masks API keys', async () => {
    const initial = await updateUserOpenAiSettings(recipient.id, {
      apiKey: 'sk-test-1234567890',
      model: 'gpt-4.1-mini',
      autoReplies: {
        enabled: true,
        instructions: 'Keep responses short and friendly.',
        channels: ['direct', 'support', 'invalid-channel'],
        temperature: 0.4,
      },
    });

    expect(initial.provider).toBe('openai');
    expect(initial.model).toBe('gpt-4.1-mini');
    expect(initial.apiKey.configured).toBe(true);
    expect(initial.apiKey.fingerprint).toMatch(/\*+7890$/);
    expect(initial.autoReplies.enabled).toBe(true);
    expect(initial.autoReplies.channels).toEqual(['direct', 'support']);

    const fetched = await getUserOpenAiSettings(recipient.id);
    expect(fetched.apiKey.configured).toBe(true);
    expect(fetched.apiKey.fingerprint).toEqual(initial.apiKey.fingerprint);

    const cleared = await updateUserOpenAiSettings(recipient.id, {
      apiKey: null,
      autoReplies: { enabled: false },
    });
    expect(cleared.apiKey.configured).toBe(false);
    expect(cleared.autoReplies.enabled).toBe(false);
  });

  it('generates automated replies for configured users', async () => {
    await updateUserOpenAiSettings(recipient.id, {
      apiKey: 'sk-test-9876543210',
      autoReplies: {
        enabled: true,
        instructions: 'Respond with gratitude and ask a clarifying question.',
        channels: ['direct'],
      },
      model: 'gpt-4o-mini',
    });

    const message = await Message.create({
      threadId: thread.id,
      senderId: sender.id,
      messageType: 'text',
      body: 'Could you share the latest status update for the client project?',
      deliveredAt: new Date(),
    });

    await processAutoReplies({
      threadId: thread.id,
      messageId: message.id,
      senderId: sender.id,
    });

    const replies = await Message.findAll({
      where: { threadId: thread.id, senderId: recipient.id },
      order: [['createdAt', 'ASC']],
    });

    expect(replies).toHaveLength(1);
    const reply = replies[0];
    expect(reply.metadata?.autoReply?.provider).toBe('openai');
    expect(reply.metadata?.autoReply?.sourceMessageId).toBe(message.id);
    expect(reply.body).toContain('(auto-reply)');
  });
});
