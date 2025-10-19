import {
  evaluateCommunityMessage,
  recordMessageModeration,
  listModerationQueue,
  resolveModerationEvent,
} from '../../src/services/communityModerationService.js';
import { ModerationEvent } from '../../src/models/moderationModels.js';

function buildLinks(count) {
  return Array.from({ length: count })
    .map((_, index) => `https://spam${index}.example.com/promo`)
    .join(' ');
}

describe('communityModerationService', () => {
  it('approves compliant community messages', async () => {
    const evaluation = await evaluateCommunityMessage({
      thread: { id: 1 },
      participant: { userId: 10 },
      body: 'Looking forward to the mentorship session later today!',
    });

    expect(evaluation.decision).toBe('allow');
    expect(evaluation.signals).toHaveLength(0);
    expect(evaluation.score).toBe(0);
  });

  it('blocks messages containing profanity', async () => {
    const evaluation = await evaluateCommunityMessage({
      thread: { id: 2 },
      participant: { userId: 99 },
      body: 'This pitch is absolute bullshit – stop wasting my time.',
    });

    expect(evaluation.decision).toBe('block');
    expect(evaluation.severity).toBe('critical');
    expect(evaluation.signals.some((signal) => signal.code === 'profanity')).toBe(true);
  });

  it('records flagged messages in the moderation queue', async () => {
    const evaluation = await evaluateCommunityMessage({
      thread: { id: 3 },
      participant: { userId: 41 },
      body: `Please click all of these links ${buildLinks(4)}`,
    });

    expect(evaluation.decision).toBe('review');
    expect(evaluation.severity).toBe('high');

    const event = await recordMessageModeration({
      threadId: 3,
      messageId: 15,
      actorId: 41,
      channelSlug: 'global-lobby',
      decision: evaluation.decision,
      severity: evaluation.severity,
      signals: evaluation.signals,
      score: evaluation.score,
      metadata: { evaluationSource: 'test' },
    });

    expect(event.status).toBe('open');

    const queue = await listModerationQueue();
    expect(queue.items.length).toBeGreaterThan(0);
    expect(queue.items[0].status).toBe('open');
    expect(queue.items[0].channelSlug).toBe('global-lobby');
  });

  it('resolves moderation events with resolution notes', async () => {
    const created = await ModerationEvent.create({
      threadId: 99,
      messageId: 100,
      actorId: 200,
      channelSlug: 'global-lobby',
      action: 'message_flagged',
      severity: 'medium',
      status: 'open',
      reason: 'Manual review requested.',
      metadata: { signals: [] },
    });

    const resolved = await resolveModerationEvent(created.id, {
      status: 'resolved',
      resolvedBy: 500,
      resolutionNotes: 'Content verified and approved.',
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.metadata.resolutionNotes).toBe('Content verified and approved.');
    expect(resolved.resolvedBy).toBe(500);
  });
});
