function normalise(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function toRoleSet(values = []) {
  return new Set(values.map(normalise).filter(Boolean));
}

function toPermissionSet(values = []) {
  return new Set(values.map(normalise).filter(Boolean));
}

function setDifference(a, b) {
  const difference = new Set();
  const lookup = new Set(b);
  a.forEach((value) => {
    if (!lookup.has(value)) {
      difference.add(value);
    }
  });
  return difference;
}

function setIntersection(a, b) {
  const intersection = new Set();
  const lookup = new Set(b);
  a.forEach((value) => {
    if (lookup.has(value)) {
      intersection.add(value);
    }
  });
  return intersection;
}

const COMMUNITY_CHANNELS = [
  {
    slug: 'global-lobby',
    name: 'Global Lobby',
    description:
      'Cross-role community hub for major announcements, platform-wide updates, and casual networking across every persona.',
    allowedRoles: ['user', 'freelancer', 'agency', 'company', 'mentor', 'volunteer', 'admin'],
    requiredPermissions: [],
    retentionDays: 14,
    features: { attachments: true, reactions: true, voice: true },
  },
  {
    slug: 'talent-opportunities',
    name: 'Talent Opportunities',
    description:
      'Realtime gig drops, proposal clinics, and curated leads for freelancers, agencies, and vetted talent partners.',
    allowedRoles: ['freelancer', 'agency', 'mentor', 'admin'],
    requiredPermissions: [],
    retentionDays: 30,
    features: { attachments: true, reactions: true, voice: false },
  },
  {
    slug: 'project-ops',
    name: 'Project Operations War Room',
    description:
      'Delivery leadership align on escalations, SLO breaches, and cross-functional runbooks for in-flight engagements.',
    allowedRoles: ['company', 'agency', 'admin', 'provider_admin'],
    requiredPermissions: [],
    retentionDays: 30,
    features: { attachments: true, reactions: true, voice: true },
  },
  {
    slug: 'mentorship-circle',
    name: 'Mentorship Circle',
    description:
      'Mentors coordinate office hours, volunteer sessions, and personalised growth plans for mentees.',
    allowedRoles: ['mentor', 'volunteer', 'admin'],
    requiredPermissions: [],
    retentionDays: 60,
    features: { attachments: true, reactions: true, voice: true },
  },
  {
    slug: 'provider-support',
    name: 'Provider Support HQ',
    description:
      'Provider workspace owners triage incidents, manage rosters, and trigger live service maintenance windows.',
    allowedRoles: ['provider_admin', 'provider_manager', 'admin'],
    requiredPermissions: ['providers:operate'],
    retentionDays: 45,
    features: { attachments: true, reactions: false, voice: true },
  },
  {
    slug: 'moderation-hq',
    name: 'Moderation HQ',
    description:
      'Community safety squad processes escalations, manages mute lists, and synchronises enforcement activity.',
    allowedRoles: ['admin', 'moderator', 'community_manager'],
    requiredPermissions: ['community:moderate'],
    retentionDays: 90,
    features: { attachments: false, reactions: false, voice: false },
    privileged: true,
  },
];

const VOICE_ROOMS = [
  {
    slug: 'town-hall',
    name: 'Town Hall Auditorium',
    description: 'All-hands live audio stream for roadmap briefings, AMA sessions, and policy updates.',
    linkedChannel: 'global-lobby',
    allowedRoles: ['user', 'freelancer', 'agency', 'company', 'mentor', 'volunteer', 'admin'],
    requiredPermissions: [],
    maxParticipants: 500,
    recordSessions: true,
  },
  {
    slug: 'daily-standup',
    name: 'Project Stand-up Room',
    description: 'Short-form delivery syncs with shared agenda notes and blocker escalation flow.',
    linkedChannel: 'project-ops',
    allowedRoles: ['company', 'agency', 'admin', 'provider_admin'],
    requiredPermissions: ['projects:operate'],
    maxParticipants: 50,
    recordSessions: false,
  },
  {
    slug: 'mentorship-lounge',
    name: 'Mentorship Lounge',
    description: 'Drop-in voice coaching space for mentors and mentees to collaborate in real-time.',
    linkedChannel: 'mentorship-circle',
    allowedRoles: ['mentor', 'volunteer', 'admin'],
    requiredPermissions: [],
    maxParticipants: 80,
    recordSessions: false,
  },
];

const EVENT_STREAMS = [
  {
    slug: 'product-launches',
    name: 'Product Launch Broadcasts',
    description: 'High-signal launch events that require RSVP tracking, backstage chat, and media streaming.',
    allowedRoles: ['user', 'company', 'agency', 'freelancer', 'admin'],
    requiredPermissions: [],
  },
  {
    slug: 'community-training',
    name: 'Community Enablement Workshops',
    description: 'Live enablement and onboarding programming with attendance reporting and content assets.',
    allowedRoles: ['mentor', 'volunteer', 'company', 'agency', 'admin'],
    requiredPermissions: [],
  },
];

function hasRequiredPermission(channel, permissions) {
  if (!channel.requiredPermissions?.length) {
    return true;
  }
  const permissionSet = toPermissionSet(permissions);
  return channel.requiredPermissions.some((permission) => permissionSet.has(normalise(permission)));
}

function hasAllowedRole(channel, roles) {
  if (!channel.allowedRoles?.length) {
    return true;
  }
  if (channel.allowedRoles.includes('*')) {
    return true;
  }
  const allowed = toRoleSet(channel.allowedRoles);
  const active = toRoleSet(roles);
  return Array.from(active).some((role) => allowed.has(role));
}

export function canAccessChannel(channelSlug, { roles = [], permissions = [] } = {}) {
  const channel = COMMUNITY_CHANNELS.find((entry) => normalise(entry.slug) === normalise(channelSlug));
  if (!channel) {
    return false;
  }
  return hasAllowedRole(channel, roles) && hasRequiredPermission(channel, permissions);
}

export function listChannelsForActor({ roles = [], permissions = [] } = {}) {
  return COMMUNITY_CHANNELS.filter((channel) => hasAllowedRole(channel, roles) && hasRequiredPermission(channel, permissions)).map(
    (channel) => ({
      slug: channel.slug,
      name: channel.name,
      description: channel.description,
      retentionDays: channel.retentionDays,
      features: channel.features,
      privileged: Boolean(channel.privileged),
    }),
  );
}

export function getChannelDefinition(channelSlug) {
  return COMMUNITY_CHANNELS.find((channel) => normalise(channel.slug) === normalise(channelSlug)) || null;
}

export function listVoiceRoomsForActor({ roles = [], permissions = [] } = {}) {
  return VOICE_ROOMS.filter((room) => hasAllowedRole(room, roles) && hasRequiredPermission(room, permissions)).map((room) => ({
    slug: room.slug,
    name: room.name,
    description: room.description,
    linkedChannel: room.linkedChannel,
    maxParticipants: room.maxParticipants,
    recordSessions: room.recordSessions,
  }));
}

export function getVoiceRoom(roomSlug) {
  return VOICE_ROOMS.find((room) => normalise(room.slug) === normalise(roomSlug)) || null;
}

export function listEventStreamsForActor({ roles = [], permissions = [] } = {}) {
  return EVENT_STREAMS.filter((event) => hasAllowedRole(event, roles) && hasRequiredPermission(event, permissions)).map(
    (event) => ({
      slug: event.slug,
      name: event.name,
      description: event.description,
    }),
  );
}

export function resolveChannelFeatureFlags(channelSlug) {
  const channel = getChannelDefinition(channelSlug);
  if (!channel) {
    return { attachments: false, reactions: false, voice: false };
  }
  return {
    attachments: Boolean(channel.features?.attachments),
    reactions: Boolean(channel.features?.reactions),
    voice: Boolean(channel.features?.voice),
  };
}

export function differenceBetweenAllowedRoles(channelSlug, roles = []) {
  const channel = getChannelDefinition(channelSlug);
  if (!channel) {
    return roles;
  }
  const allowed = toRoleSet(channel.allowedRoles);
  const current = toRoleSet(roles);
  return Array.from(setDifference(current, allowed));
}

export function overlappingRoles(channelSlug, roles = []) {
  const channel = getChannelDefinition(channelSlug);
  if (!channel) {
    return [];
  }
  return Array.from(setIntersection(toRoleSet(channel.allowedRoles), toRoleSet(roles)));
}

export default {
  COMMUNITY_CHANNELS,
  VOICE_ROOMS,
  EVENT_STREAMS,
  listChannelsForActor,
  getChannelDefinition,
  canAccessChannel,
  resolveChannelFeatureFlags,
  listVoiceRoomsForActor,
  getVoiceRoom,
  listEventStreamsForActor,
  differenceBetweenAllowedRoles,
  overlappingRoles,
};
