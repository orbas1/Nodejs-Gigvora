import { describe, it, expect } from '@jest/globals';
import { sampleLiveServiceTelemetry } from '../../src/services/liveServiceTelemetryService.js';
import { MessageThread, Message, SupportCase } from '../../src/models/messagingModels.js';
import {
  SupportPlaybook,
  SupportPlaybookStep,
  FreelancerTimelinePost,
  CompanyTimelinePost,
  AdminTimelineEvent,
  AnalyticsEvent,
  UserEvent,
  UserEventGuest,
  UserEventTask,
} from '../../src/models/liveServiceTelemetryModels.js';
import { createUser } from '../helpers/factories.js';
import { ValidationError } from '../../src/utils/errors.js';

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60_000);
}

describe('liveServiceTelemetryService', () => {
  it('summarises telemetry across live services', async () => {
    const admin = await createUser({ email: 'admin@gigvora.test', userType: 'admin' });
    const member = await createUser({ email: 'member@gigvora.test', userType: 'user' });
    const mentor = await createUser({ email: 'mentor@gigvora.test', userType: 'mentor' });

    const communityThread = await MessageThread.create({
      subject: 'Community: global-lobby',
      channelType: 'group',
      createdBy: admin.id,
      metadata: { channelSlug: 'global-lobby', channelName: 'Global Lobby', retentionDays: 7 },
    });

    await Message.create({
      threadId: communityThread.id,
      senderId: admin.id,
      messageType: 'text',
      body: 'Welcome everyone – share your wins for the week!',
      metadata: { moderation: { status: 'approved', score: 0 } },
      createdAt: minutesFromNow(-15),
    });

    await Message.create({
      threadId: communityThread.id,
      senderId: member.id,
      messageType: 'text',
      body: 'Spotted a bug in the launch wizard – filing a ticket now.',
      metadata: { moderation: { status: 'pending_review', score: 0.42 } },
      createdAt: minutesFromNow(-10),
    });

    const supportThread = await MessageThread.create({
      subject: 'Support: Escrow release',
      channelType: 'support',
      createdBy: member.id,
      metadata: { channelSlug: 'support-escalations', channelName: 'Support Escalations', retentionDays: 30 },
    });

    await SupportCase.create({
      threadId: supportThread.id,
      status: 'in_progress',
      priority: 'high',
      reason: 'Escrow release stuck in pending state',
      createdAt: minutesFromNow(-240),
      metadata: {
        sla: {
          firstResponseBreachedAt: minutesFromNow(-120).toISOString(),
          resolutionBreachedAt: null,
          escalatedAt: minutesFromNow(-20).toISOString(),
        },
      },
    });

    const playbook = await SupportPlaybook.create({
      slug: 'runtime-incident',
      title: 'Runtime incident response',
      summary: 'Coordinate mitigation and stakeholder comms when telemetry degrades.',
      stage: 'triage',
      persona: 'support_team',
      channel: 'community',
      csatImpact: 'Improves MTTR by 35% when executed within 15 minutes.',
    });

    await SupportPlaybookStep.create({
      playbookId: playbook.id,
      stepNumber: 1,
      title: 'Acknowledge incident',
      instructions: 'Activate incident channel, assign scribe, and confirm scope.',
    });

    await FreelancerTimelinePost.create({
      freelancerId: member.id,
      title: 'Launched mentor concierge pilot',
      status: 'published',
      publishedAt: minutesFromNow(-30),
    });

    await FreelancerTimelinePost.create({
      freelancerId: member.id,
      title: 'Upcoming AMA',
      status: 'scheduled',
      scheduledAt: minutesFromNow(30),
    });

    await CompanyTimelinePost.create({
      workspaceId: 99,
      authorId: admin.id,
      title: 'SLA audit completed',
      status: 'published',
      publishedAt: minutesFromNow(-45),
    });

    await CompanyTimelinePost.create({
      workspaceId: 99,
      authorId: admin.id,
      title: 'Monthly roadmap review',
      status: 'scheduled',
      scheduledFor: minutesFromNow(20),
    });

    await AdminTimelineEvent.create({
      timelineId: 1,
      title: 'Live services drill',
      status: 'planned',
      startDate: minutesFromNow(25),
    });

    await AnalyticsEvent.create({
      eventName: 'timeline.post.viewed',
      occurredAt: new Date(),
      ingestedAt: new Date(),
      actorType: 'user',
    });

    await AnalyticsEvent.create({
      eventName: 'community.timeline.reaction',
      occurredAt: new Date(),
      ingestedAt: new Date(),
      actorType: 'user',
    });

    await UserEvent.create({
      ownerId: mentor.id,
      title: 'Live mentor AMA',
      status: 'in_progress',
      format: 'virtual',
      visibility: 'public',
      startAt: minutesFromNow(-10),
      endAt: minutesFromNow(40),
      capacity: 200,
    });

    const upcomingEvent = await UserEvent.create({
      ownerId: mentor.id,
      title: 'Incident response workshop',
      status: 'planned',
      format: 'virtual',
      visibility: 'invite_only',
      startAt: minutesFromNow(50),
      endAt: minutesFromNow(120),
      capacity: 100,
    });

    await UserEventGuest.bulkCreate([
      { eventId: upcomingEvent.id, fullName: 'Ops Analyst', seatsReserved: 1, status: 'confirmed' },
      { eventId: upcomingEvent.id, fullName: 'Trust Lead', seatsReserved: 1, status: 'checked_in' },
    ]);

    await UserEventTask.create({
      eventId: upcomingEvent.id,
      title: 'Confirm facilitators',
      status: 'blocked',
      priority: 'high',
      dueAt: minutesFromNow(90),
    });

    const telemetry = await sampleLiveServiceTelemetry({ windowMinutes: 180, forceRefresh: true });

    expect(telemetry.window.minutes).toBe(180);
    expect(telemetry.timeline.windowPublished).toBeGreaterThan(0);
    expect(telemetry.chat.totalMessages).toBeGreaterThanOrEqual(2);
    expect(telemetry.chat.flaggedMessages).toBeGreaterThanOrEqual(1);
    expect(telemetry.inbox.openCases).toBe(1);
    expect(telemetry.inbox.breachedSlaCases).toBeGreaterThanOrEqual(1);
    expect(telemetry.events.liveNow).toBeGreaterThanOrEqual(1);
    expect(telemetry.events.upcoming.length).toBeGreaterThan(0);
    expect(telemetry.analytics.topEvents.length).toBeGreaterThan(0);
    expect(telemetry.runbooks.length).toBeGreaterThan(0);
    expect(Array.isArray(telemetry.incidentSignals.notes)).toBe(true);
  });

  it('caps sampling to avoid heavy load while still reporting totals', async () => {
    const owner = await createUser({ email: 'owner@gigvora.test', userType: 'user' });
    const thread = await MessageThread.create({
      subject: 'Community: announcements',
      channelType: 'group',
      createdBy: owner.id,
      metadata: { channelSlug: 'announcements', channelName: 'Announcements' },
    });

    const now = new Date();
    const windowMillis = 30 * 60_000;
    const cadenceMillis = Math.floor(windowMillis / 2500);
    const messages = [];
    for (let index = 0; index < 2500; index += 1) {
      messages.push({
        threadId: thread.id,
        senderId: owner.id,
        messageType: 'text',
        body: `Message ${index}`,
        metadata: { moderation: { status: index % 17 === 0 ? 'pending_review' : 'approved', score: index % 17 === 0 ? 0.65 : 0 } },
        createdAt: new Date(now.getTime() - index * cadenceMillis),
      });
    }

    await Message.bulkCreate(messages);

    const telemetry = await sampleLiveServiceTelemetry({ windowMinutes: 30, forceRefresh: true });

    expect(telemetry.chat.totalMessages).toBe(2500);
    expect(telemetry.chat.sampleSize).toBe(2000);
    expect(telemetry.chat.flaggedMessages).toBeGreaterThan(0);
    expect(telemetry.chat.flaggedRatio).toBeGreaterThan(0);
  });

  it('validates non-numeric window values', async () => {
    await expect(sampleLiveServiceTelemetry({ windowMinutes: 'abc' })).rejects.toThrow(ValidationError);
    await expect(sampleLiveServiceTelemetry({ windowMinutes: 0 })).rejects.toThrow(ValidationError);
  });
});
