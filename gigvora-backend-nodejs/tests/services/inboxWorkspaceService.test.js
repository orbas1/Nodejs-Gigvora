import '../setupTestEnv.js';
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  sequelize,
  User,
  MessageThread,
  MessageParticipant,
  Message,
  SupportCase,
} from '../../src/models/messagingModels.js';
import {
  getInboxWorkspace,
  updateInboxPreferences,
  createSavedReply,
  updateSavedReply,
  deleteSavedReply,
  createRoutingRule,
  updateRoutingRule,
} from '../../src/services/inboxWorkspaceService.js';

async function createUser(overrides = {}) {
  return User.create({
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    email: overrides.email ?? `user${Math.random().toString(16).slice(2)}@example.com`,
    password: overrides.password ?? 'secret',
    userType: overrides.userType ?? 'freelancer',
  });
}

describe('inboxWorkspaceService', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('returns default workspace data for a new user', async () => {
    const user = await createUser();
    const workspace = await getInboxWorkspace(user.id);
    expect(workspace.userId).toBe(user.id);
    expect(workspace.preferences).toBeDefined();
    expect(workspace.preferences.userId).toBe(user.id);
    expect(workspace.savedReplies).toHaveLength(0);
    expect(workspace.routingRules).toHaveLength(0);
    expect(workspace.activeThreads).toHaveLength(0);
    expect(workspace.summary.unreadThreads).toBe(0);
  });

  it('allows preferences to be updated and persisted', async () => {
    const user = await createUser();
    await updateInboxPreferences(user.id, {
      timezone: 'Europe/London',
      notificationsEmail: false,
      workingHours: {
        timezone: 'Europe/London',
        availability: {
          monday: { active: true, start: '08:00', end: '16:00' },
        },
      },
    });

    const workspace = await getInboxWorkspace(user.id, { forceRefresh: true });
    expect(workspace.preferences.timezone).toBe('Europe/London');
    expect(workspace.preferences.notificationsEmail).toBe(false);
    expect(workspace.preferences.workingHours.availability.monday.start).toBe('08:00');
  });

  it('supports saved reply lifecycle and default selection', async () => {
    const user = await createUser();
    const replyOne = await createSavedReply(user.id, {
      title: 'Intro',
      body: 'Hello from Gigvora',
      isDefault: true,
      shortcut: 'intro',
    });
    expect(replyOne.isDefault).toBe(true);

    const replyTwo = await createSavedReply(user.id, {
      title: 'Follow up',
      body: 'Thanks for the update',
      shortcut: 'follow',
    });
    expect(replyTwo.isDefault).toBe(false);

    const updated = await updateSavedReply(user.id, replyTwo.id, { isDefault: true });
    expect(updated.isDefault).toBe(true);

    await deleteSavedReply(user.id, replyOne.id);
    const workspace = await getInboxWorkspace(user.id, { forceRefresh: true });
    expect(workspace.savedReplies).toHaveLength(1);
    expect(workspace.preferences.defaultSavedReplyId).toBe(replyTwo.id);
  });

  it('creates and updates routing rules', async () => {
    const user = await createUser();
    const rule = await createRoutingRule(user.id, {
      name: 'Urgent keywords',
      matchType: 'keyword',
      criteria: { keywords: ['urgent', 'asap'] },
      action: { escalate: true },
      priority: 1,
    });
    expect(rule.enabled).toBe(true);

    const updated = await updateRoutingRule(user.id, rule.id, { enabled: false, priority: 5 });
    expect(updated.enabled).toBe(false);
    expect(updated.priority).toBe(5);

    const workspace = await getInboxWorkspace(user.id, { forceRefresh: true });
    expect(workspace.routingRules).toHaveLength(1);
    expect(workspace.routingRules[0].priority).toBe(5);
  });

  it('surfaces active threads, participants, and support metrics', async () => {
    const owner = await createUser({ email: 'owner@example.com' });
    const collaborator = await createUser({ email: 'collab@example.com' });

    const thread = await MessageThread.create({
      subject: 'Client Project',
      channelType: 'project',
      state: 'active',
      createdBy: owner.id,
      lastMessageAt: new Date(),
      lastMessagePreview: 'Initial brief',
    });

    await MessageParticipant.create({
      threadId: thread.id,
      userId: owner.id,
      role: 'owner',
      lastReadAt: new Date(Date.now() - 1000 * 60 * 60),
    });

    await MessageParticipant.create({
      threadId: thread.id,
      userId: collaborator.id,
      role: 'participant',
      lastReadAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    });

    const message = await Message.create({
      threadId: thread.id,
      senderId: collaborator.id,
      messageType: 'text',
      body: 'Can we review the proposal?',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await thread.update({
      lastMessageAt: message.createdAt,
      lastMessagePreview: message.body,
    });

    await SupportCase.create({
      threadId: thread.id,
      status: 'triage',
      priority: 'high',
      reason: 'Contract clarification',
      escalatedBy: owner.id,
    });

    const workspace = await getInboxWorkspace(owner.id, { forceRefresh: true });

    expect(workspace.activeThreads).toHaveLength(1);
    expect(workspace.activeThreads[0].participants).toHaveLength(2);
    expect(workspace.summary.unreadThreads).toBeGreaterThanOrEqual(1);
    expect(workspace.supportCases).toHaveLength(1);
    expect(workspace.participantDirectory.find((entry) => entry.id === collaborator.id)).toBeDefined();
    expect(workspace.summary.openSupportCases).toBe(1);
  });
});
