import { MessageThread, MessageParticipant, Message, sequelize } from '../models/messagingModels.js';
import { getChannelDefinition } from '../realtime/channelRegistry.js';
import { ApplicationError, AuthorizationError } from '../utils/errors.js';

const MAX_MESSAGE_LENGTH = 5_000;

function normaliseMessageBody(body) {
  if (typeof body !== 'string') {
    return '';
  }
  return body.trim();
}

async function ensureThread(channelSlug, { transaction } = {}) {
  const definition = getChannelDefinition(channelSlug);
  if (!definition) {
    throw new ApplicationError(`Community channel ${channelSlug} is not registered.`);
  }
  const subject = `community:${definition.slug}`;
  const [thread] = await MessageThread.findOrCreate({
    where: { subject },
    defaults: {
      subject,
      channelType: 'group',
      state: 'active',
      createdBy: 0,
      metadata: {
        channelSlug: definition.slug,
        channelName: definition.name,
        retentionDays: definition.retentionDays,
      },
    },
    transaction,
  });
  return thread;
}

async function ensureParticipant({ channelSlug, userId, transaction }) {
  const thread = await ensureThread(channelSlug, { transaction });
  const [participant] = await MessageParticipant.findOrCreate({
    where: { threadId: thread.id, userId },
    defaults: {
      threadId: thread.id,
      userId,
      role: 'member',
      notificationsEnabled: true,
    },
    transaction,
  });
  return { thread, participant };
}

export async function joinCommunityChannel({ channelSlug, userId }) {
  return sequelize.transaction(async (transaction) => {
    const { thread, participant } = await ensureParticipant({ channelSlug, userId, transaction });
    const recentMessages = await Message.findAll({
      where: { threadId: thread.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
      transaction,
    });
    if (!participant.lastReadAt) {
      await participant.update({ lastReadAt: new Date() }, { transaction });
    }
    return {
      thread: thread.toPublicObject ? thread.toPublicObject() : thread.get({ plain: true }),
      participant: participant.get({ plain: true }),
      messages: recentMessages.map((message) => message.toPublicObject?.() ?? message.get({ plain: true })),
    };
  });
}

export async function leaveCommunityChannel({ channelSlug, userId }) {
  const thread = await ensureThread(channelSlug);
  await MessageParticipant.destroy({ where: { threadId: thread.id, userId } });
}

export async function fetchRecentMessages({ channelSlug, limit = 50 }) {
  const thread = await ensureThread(channelSlug);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 200);
  const messages = await Message.findAll({
    where: { threadId: thread.id },
    order: [['createdAt', 'DESC']],
    limit: safeLimit,
  });
  return messages.map((message) => message.toPublicObject?.() ?? message.get({ plain: true }));
}

export async function publishMessage({ channelSlug, userId, body, messageType = 'text', metadata = {} }) {
  const normalisedBody = normaliseMessageBody(body);
  if (normalisedBody.length === 0 && messageType === 'text') {
    throw new ApplicationError('Message content cannot be empty.');
  }
  if (normalisedBody.length > MAX_MESSAGE_LENGTH) {
    throw new ApplicationError('Message is too long. Please shorten your content and try again.');
  }

  return sequelize.transaction(async (transaction) => {
    const { thread, participant } = await ensureParticipant({ channelSlug, userId, transaction });
    if (participant.mutedUntil && new Date(participant.mutedUntil) > new Date()) {
      throw new AuthorizationError('You are temporarily muted in this channel.');
    }

    const message = await Message.create(
      {
        threadId: thread.id,
        senderId: userId,
        messageType,
        body: messageType === 'text' ? normalisedBody : null,
        metadata: {
          ...(metadata ?? {}),
          channelSlug,
        },
        deliveredAt: new Date(),
      },
      { transaction },
    );

    const preview = normalisedBody ? normalisedBody.slice(0, 200) : messageType;
    await MessageThread.update(
      { lastMessageAt: new Date(), lastMessagePreview: preview },
      { where: { id: thread.id }, transaction },
    );

    return message.toPublicObject ? message.toPublicObject() : message.get({ plain: true });
  });
}

export async function acknowledgeMessages({ channelSlug, userId }) {
  const thread = await ensureThread(channelSlug);
  await MessageParticipant.update(
    { lastReadAt: new Date() },
    {
      where: {
        threadId: thread.id,
        userId,
      },
      individualHooks: false,
    },
  );
}

export async function muteParticipant({ channelSlug, userId, mutedBy, mutedUntil }) {
  const untilDate = mutedUntil ? new Date(mutedUntil) : null;
  if (untilDate && Number.isNaN(untilDate.getTime())) {
    throw new ApplicationError('Muted until must be a valid date string.');
  }
  const { thread, participant } = await ensureParticipant({ channelSlug, userId });
  const update = {
    mutedUntil: untilDate,
    metadata: {
      ...(participant.metadata ?? {}),
      moderation: {
        ...(participant.metadata?.moderation ?? {}),
        mutedBy,
        mutedUntil: untilDate ? untilDate.toISOString() : null,
        mutedAt: new Date().toISOString(),
      },
    },
  };
  await participant.update(update);
  return { threadId: thread.id, mutedUntil: update.mutedUntil };
}

export async function removeMessage({ channelSlug, messageId, moderatorId, reason }) {
  const thread = await ensureThread(channelSlug);
  const message = await Message.findOne({ where: { id: messageId, threadId: thread.id } });
  if (!message) {
    throw new ApplicationError('Message not found.');
  }
  await message.update({
    messageType: 'system',
    body: null,
    metadata: {
      ...(message.metadata ?? {}),
      moderation: {
        removedBy: moderatorId,
        removedAt: new Date().toISOString(),
        reason: reason ?? 'Removed by moderator',
      },
    },
  });
  return message.toPublicObject ? message.toPublicObject() : message.get({ plain: true });
}

export async function describeChannelState(channelSlug) {
  const thread = await ensureThread(channelSlug);
  const participantCount = await MessageParticipant.count({ where: { threadId: thread.id } });
  const messageCount = await Message.count({ where: { threadId: thread.id } });
  return {
    threadId: thread.id,
    participants: participantCount,
    messages: messageCount,
  };
}

export default {
  joinCommunityChannel,
  leaveCommunityChannel,
  fetchRecentMessages,
  publishMessage,
  acknowledgeMessages,
  muteParticipant,
  removeMessage,
  describeChannelState,
};
