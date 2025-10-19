import { describe, it, expect } from '@jest/globals';
import {
  listChannelsForActor,
  canAccessChannel,
  resolveChannelFeatureFlags,
  listVoiceRoomsForActor,
} from '../../src/realtime/channelRegistry.js';

describe('channelRegistry', () => {
  it('returns community channels aligned to role permissions', () => {
    const channels = listChannelsForActor({ roles: ['user'], permissions: [] });
    const slugs = channels.map((channel) => channel.slug);
    expect(slugs).toContain('global-lobby');
    expect(slugs).not.toContain('moderation-hq');
  });

  it('grants moderators access to privileged channels', () => {
    const channels = listChannelsForActor({ roles: ['admin'], permissions: ['community:moderate'] });
    const slugs = channels.map((channel) => channel.slug);
    expect(slugs).toContain('moderation-hq');
  });

  it('validates channel access using roles and permissions', () => {
    expect(canAccessChannel('project-ops', { roles: ['company'], permissions: [] })).toBe(true);
    expect(canAccessChannel('project-ops', { roles: ['freelancer'], permissions: [] })).toBe(false);
  });

  it('exposes feature flags for configured channels', () => {
    expect(resolveChannelFeatureFlags('global-lobby')).toEqual({ attachments: true, reactions: true, voice: true });
    expect(resolveChannelFeatureFlags('unknown')).toEqual({ attachments: false, reactions: false, voice: false });
  });

  it('filters voice rooms based on actor context', () => {
    const rooms = listVoiceRoomsForActor({ roles: ['mentor'], permissions: [] });
    const slugs = rooms.map((room) => room.slug);
    expect(slugs).toContain('mentorship-lounge');
    expect(slugs).not.toContain('daily-standup');
  });
});
