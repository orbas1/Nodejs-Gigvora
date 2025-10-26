import { describe, expect, it } from 'vitest';
import {
  resolvePresenceState,
  getPresenceLabel,
  getPresenceTone,
  buildPresenceSummary,
  deriveAvailableStatuses,
} from '../presence.js';

describe('presence utils', () => {
  it('resolves explicit state when provided', () => {
    expect(resolvePresenceState({ availability: 'focus' })).toBe('focus');
  });

  it('falls back to online status when no state is available', () => {
    expect(resolvePresenceState({ online: true })).toBe('available');
    expect(resolvePresenceState({ online: false })).toBe('offline');
  });

  it('provides readable labels and tone classes', () => {
    expect(getPresenceLabel('in_meeting')).toBe('In meeting');
    expect(getPresenceTone('available')).toContain('emerald');
  });

  it('builds presence summary with timeline and next event', () => {
    const snapshot = {
      availability: 'focus',
      message: 'Deep work',
      timeline: [
        { id: '1', type: 'status', startAt: '2024-01-01T10:00:00Z', title: 'Focus mode' },
        { id: '2', type: 'meeting', startAt: '2024-01-01T12:00:00Z', title: 'Product review' },
      ],
      calendar: {
        upcoming: [
          { id: 'evt-1', title: 'Mentor sync', startsAt: '2024-01-01T12:30:00Z' },
        ],
      },
    };

    const summary = buildPresenceSummary(snapshot);
    expect(summary.state).toBe('focus');
    expect(summary.timeline).toHaveLength(2);
    expect(summary.nextEvent?.title).toBe('Mentor sync');
    expect(summary.customMessage).toBe('Deep work');
  });

  it('derives available statuses with labels', () => {
    const options = deriveAvailableStatuses({ supportedStates: ['available', 'focus', 'away'] });
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveProperty('label');
  });
});
