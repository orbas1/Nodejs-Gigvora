import { Op, fn, col } from 'sequelize';
import {
  Group,
  GroupMembership,
  User,
  sequelize,
  GROUP_VISIBILITIES,
  GROUP_MEMBER_POLICIES,
  GROUP_MEMBERSHIP_STATUSES,
  GROUP_MEMBERSHIP_ROLES,
} from '../models/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors.js';

const DEFAULT_ALLOWED_USER_TYPES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];
const DEFAULT_JOIN_POLICY = 'moderated';

function slugify(value, fallback = 'group') {
  if (!value) {
    return fallback;
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .slice(0, 80) || fallback;
}

function unique(array = []) {
  return Array.from(new Set(array.filter(Boolean)));
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = `${value}`.toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) {
    return false;
  }
  return fallback;
}

const GROUP_BLUEPRINTS = [
  {
    key: 'future-of-work-collective',
    name: 'Future of Work Collective',
    summary:
      'Weekly salons on marketplaces, distributed teams, and community building with operators from 40+ countries.',
    focusAreas: ['Future of work', 'Product strategy', 'Marketplace design'],
    accentColor: '#2563EB',
    joinPolicy: 'moderated',
    allowedUserTypes: ['freelancer', 'agency', 'company', 'user'],
    baselineMembers: 2140,
    metrics: {
      weeklyActiveMembers: 427,
      opportunitiesSharedThisWeek: 38,
      retentionRate: 0.93,
      conversationVelocity: 0.82,
    },
    insights: {
      signalStrength: 'surging',
      trendingTopics: [
        'Compensation systems for global-first teams',
        'AI copilots for discovery sprints',
        'Community-to-commerce case studies',
      ],
    },
    upcomingEvents: [
      {
        id: 'fowc-ops-guild',
        title: 'Ops Guild: Autonomous pods in enterprise marketplaces',
        startAt: () => minutesFromNow(3 * 24 * 60),
        timezone: 'UTC',
        format: 'Roundtable',
        host: {
          name: 'Sophie Mayer',
          title: 'Chief Storyteller · Momentum Collective',
        },
        registrationRequired: true,
      },
      {
        id: 'fowc-office-hours',
        title: 'Office hours: Launching async-first onboarding',
        startAt: () => minutesFromNow(7 * 24 * 60 + 180),
        timezone: 'UTC',
        format: 'Office hours',
        host: {
          name: 'Dario Fernández',
          title: 'Head of Product · Signal Eight',
        },
        registrationRequired: false,
      },
    ],
    leadership: [
      {
        name: 'Leila Odum',
        title: 'Talent Partner · Northwind Ventures',
        role: 'Community Chair',
        avatarSeed: 'Leila Odum',
      },
      {
        name: 'Mateo Ruiz',
        title: 'Innovation Lead · Aurora Labs',
        role: 'Program Curator',
        avatarSeed: 'Mateo Ruiz',
      },
    ],
    resources: [
      {
        id: 'fowc-playbook',
        title: 'Distributed Team Activation Playbook',
        type: 'Playbook',
        url: 'https://guides.gigvora.com/future-of-work-playbook',
      },
      {
        id: 'fowc-signal-digest',
        title: 'Signal digest · Week 42',
        type: 'Digest',
        url: 'https://signals.gigvora.com/fowc-weekly',
      },
      {
        id: 'fowc-template',
        title: 'Async Stand-up Template (Notion)',
        type: 'Template',
        url: 'https://templates.gigvora.com/fowc-async-standup',
      },
    ],
    guidelines: [
      'Confidential pilots require consent before sharing outside the circle.',
      'Bring a case study or open question to every salon.',
      'Peer coaching happens in public threads before DMs.',
    ],
    timeline: [
      {
        label: 'Launch pilot cohorts',
        occursAt: () => minutesFromNow(-30 * 24 * 60),
        description: 'First cohort of 50 members shaped the governance model and cadence.',
      },
      {
        label: 'Marketplace benchmark release',
        occursAt: () => minutesFromNow(-12 * 24 * 60),
        description: 'Annual report shared with 18 partner companies and agencies.',
      },
      {
        label: 'Circle expansion vote',
        occursAt: () => minutesFromNow(14 * 24 * 60),
        description: 'Community vote on opening two sub-circles for talent leads and product ops.',
      },
    ],
  },
  {
    key: 'launchpad-alumni-guild',
    name: 'Launchpad Alumni Guild',
    summary:
      'Alumni-only working groups sharing frameworks, retros, and partner leads to accelerate Launchpad missions.',
    focusAreas: ['Experience launchpad', 'Community', 'Career acceleration'],
    accentColor: '#7C3AED',
    joinPolicy: 'invite_only',
    allowedUserTypes: ['freelancer', 'user', 'mentor'],
    baselineMembers: 860,
    metrics: {
      weeklyActiveMembers: 268,
      opportunitiesSharedThisWeek: 24,
      retentionRate: 0.97,
      conversationVelocity: 0.88,
    },
    insights: {
      signalStrength: 'steady',
      trendingTopics: [
        'Fellowship hiring pods',
        'Mentor sprint retrospectives',
        'Partner readiness scorecards',
      ],
    },
    upcomingEvents: [
      {
        id: 'launchpad-mastermind',
        title: 'Mastermind: Post-cohort monetisation systems',
        startAt: () => minutesFromNow(5 * 24 * 60 + 90),
        timezone: 'UTC',
        format: 'Workshop',
        host: {
          name: 'Ava Chen',
          title: 'Product Marketing Lead · Nova Labs',
        },
        registrationRequired: true,
      },
    ],
    leadership: [
      {
        name: 'Nikhil Shah',
        title: 'Director of Ecosystem · Atlas Studio',
        role: 'Guild Host',
        avatarSeed: 'Nikhil Shah',
      },
    ],
    resources: [
      {
        id: 'launchpad-checklist',
        title: 'Post-cohort transition checklist',
        type: 'Checklist',
        url: 'https://guides.gigvora.com/launchpad-transition',
      },
      {
        id: 'launchpad-intros',
        title: 'Partner intro tracker',
        type: 'Tracker',
        url: 'https://workspace.gigvora.com/launchpad-intros',
      },
    ],
    guidelines: [
      'Confidential partner data must stay inside guild workspaces.',
      'Celebrate wins weekly to unlock referral boosts.',
      'Mentor office hours are recorded and archived for 30 days.',
    ],
    timeline: [
      {
        label: 'Guild launch',
        occursAt: () => minutesFromNow(-45 * 24 * 60),
        description: 'Formed after the inaugural Launchpad cohort to keep mission velocity.',
      },
      {
        label: 'Mentor pairing programme',
        occursAt: () => minutesFromNow(-10 * 24 * 60),
        description: 'Rolled out structured mentor loops with 92% satisfaction.',
      },
    ],
  },
  {
    key: 'purpose-lab',
    name: 'Purpose Lab',
    summary:
      'Cross-functional volunteers mobilising for climate-positive missions with enterprise partners.',
    focusAreas: ['Sustainability', 'Volunteering', 'Social impact'],
    accentColor: '#10B981',
    joinPolicy: 'open',
    allowedUserTypes: ['user', 'freelancer', 'agency', 'company'],
    baselineMembers: 530,
    metrics: {
      weeklyActiveMembers: 189,
      opportunitiesSharedThisWeek: 17,
      retentionRate: 0.9,
      conversationVelocity: 0.71,
    },
    insights: {
      signalStrength: 'emerging',
      trendingTopics: [
        'Climate hackathons',
        'Pro-bono discovery sprints',
        'Impact measurement frameworks',
      ],
    },
    upcomingEvents: [
      {
        id: 'purpose-lab-briefing',
        title: 'Briefing: Circular retail pilots Q1',
        startAt: () => minutesFromNow(2 * 24 * 60 + 120),
        timezone: 'UTC',
        format: 'Briefing',
        host: {
          name: 'Leila Odum',
          title: 'Talent Partner · Northwind Ventures',
        },
        registrationRequired: true,
      },
      {
        id: 'purpose-lab-demo-day',
        title: 'Demo day: Impact sprint outcomes',
        startAt: () => minutesFromNow(12 * 24 * 60),
        timezone: 'UTC',
        format: 'Showcase',
        host: {
          name: 'Gigvora Impact Office',
          title: 'Impact Programmes Team',
        },
        registrationRequired: false,
      },
    ],
    leadership: [
      {
        name: 'Gigvora Impact Office',
        title: 'Programme Managers',
        role: 'Coordinators',
        avatarSeed: 'Purpose Lab',
      },
    ],
    resources: [
      {
        id: 'purpose-sprint-kit',
        title: 'Impact sprint facilitation kit',
        type: 'Kit',
        url: 'https://impact.gigvora.com/sprint-kit',
      },
      {
        id: 'purpose-insights',
        title: 'Climate venture partner map',
        type: 'Intelligence',
        url: 'https://impact.gigvora.com/partner-map',
      },
    ],
    guidelines: [
      'Volunteer commitments require weekly stand-ups during active sprints.',
      'Share field photos only with consent from on-site partners.',
      'Escalate safety concerns within 24 hours using the trust desk.',
    ],
    timeline: [
      {
        label: 'Enterprise cohort onboarding',
        occursAt: () => minutesFromNow(-20 * 24 * 60),
        description: 'Three enterprise partners onboarded with 120 volunteers activated.',
      },
      {
        label: 'Impact measurement release',
        occursAt: () => minutesFromNow(20 * 24 * 60),
        description: 'Publishing the first shared impact measurement dashboard.',
      },
    ],
  },
];

const BLUEPRINT_BY_NAME = new Map(GROUP_BLUEPRINTS.map((item) => [item.name, item]));
const BLUEPRINT_BY_KEY = new Map(GROUP_BLUEPRINTS.map((item) => [item.key, item]));

function minutesFromNow(minutes) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  return date.toISOString();
}

function resolveBlueprint(group) {
  if (!group) {
    return null;
  }
  const byName = BLUEPRINT_BY_NAME.get(group.name);
  if (byName) {
    return byName;
  }
  return {
    key: slugify(group.name || `group-${group.id}`),
    name: group.name,
    summary: group.description || 'A Gigvora community group.',
    focusAreas: [],
    accentColor: '#2563EB',
    joinPolicy: DEFAULT_JOIN_POLICY,
    allowedUserTypes: [...DEFAULT_ALLOWED_USER_TYPES],
    baselineMembers: 0,
    metrics: {
      weeklyActiveMembers: 0,
      opportunitiesSharedThisWeek: 0,
      retentionRate: 0.85,
      conversationVelocity: 0.5,
    },
    insights: { signalStrength: 'steady', trendingTopics: [] },
    upcomingEvents: [],
    leadership: [],
    resources: [],
    guidelines: [],
    timeline: [],
  };
}

async function ensureBlueprintGroups(transaction) {
  for (const blueprint of GROUP_BLUEPRINTS) {
    const [record, created] = await Group.findOrCreate({
      where: { name: blueprint.name },
      defaults: {
        description: blueprint.summary,
      },
      transaction,
    });
    if (!created && !record.description) {
      record.description = blueprint.summary;
      await record.save({ transaction });
    }
  }
}

async function fetchMemberCounts(groupIds) {
  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    return new Map();
  }
  const rows = await GroupMembership.findAll({
    attributes: ['groupId', [fn('COUNT', col('*')), 'count']],
    where: { groupId: groupIds },
    group: ['groupId'],
  });
  const map = new Map();
  rows.forEach((row) => {
    const groupId = Number(row.get('groupId'));
    const count = Number(row.get('count'));
    map.set(groupId, Number.isFinite(count) ? count : 0);
  });
  return map;
}

async function fetchActorMemberships(actorId, groupIds) {
  if (!actorId || !Array.isArray(groupIds) || groupIds.length === 0) {
    return new Map();
  }
  const rows = await GroupMembership.findAll({
    where: { groupId: groupIds, userId: actorId },
  });
  const map = new Map();
  rows.forEach((row) => {
    map.set(Number(row.groupId), {
      role: row.role,
      joinedAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
      metadata: row.metadata ?? {},
    });
  });
  return map;
}

async function assertActor(actorId) {
  const numericId = toNumber(actorId, null);
  if (!numericId) {
    throw new ValidationError('An authenticated actorId is required for this operation.');
  }
  const user = await User.findByPk(numericId, {
    attributes: ['id', 'userType'],
  });
  if (!user) {
    throw new NotFoundError('User not found for the requested action.');
  }
  const allowed = new Set(DEFAULT_ALLOWED_USER_TYPES);
  if (!allowed.has(user.userType)) {
    throw new AuthorizationError('Your account does not have access to community groups yet.');
  }
  return user;
}

function buildMembershipState({ membership, joinPolicy }) {
  if (!membership) {
    return {
      status: joinPolicy === 'invite_only' ? 'request_required' : 'not_member',
      role: null,
      joinedAt: null,
      preferences: {
        notifications: { digest: true, newThread: true, upcomingEvent: true },
      },
    };
  }
  const metadata = membership.metadata ?? {};
  const notifications = metadata.notifications ?? { digest: true, newThread: true, upcomingEvent: true };
  return {
    status: 'member',
    role: membership.role,
    joinedAt: membership.joinedAt,
    preferences: { notifications },
  };
}

function computeEngagementScore({ memberCount, metrics }) {
  const base = toNumber(metrics?.conversationVelocity, 0.5);
  const active = toNumber(metrics?.weeklyActiveMembers, 0);
  if (!memberCount) {
    return Number(base.toFixed(2));
  }
  const ratio = Math.min(1, active / memberCount);
  return Number(Math.max(base, ratio).toFixed(2));
}

function mapGroupRecord(group, { memberCount, membership, blueprint }) {
  const summary = blueprint.summary || group.description || 'A Gigvora community group.';
  const joinPolicy = blueprint.joinPolicy || DEFAULT_JOIN_POLICY;
  const focusAreas = unique(blueprint.focusAreas || []);
  const metrics = blueprint.metrics || {};
  const insights = blueprint.insights || {};
  const events = (blueprint.upcomingEvents || []).map((event) => ({
    ...event,
    startAt: typeof event.startAt === 'function' ? event.startAt() : event.startAt,
  }));
  const timeline = (blueprint.timeline || []).map((entry) => ({
    ...entry,
    occursAt: typeof entry.occursAt === 'function' ? entry.occursAt() : entry.occursAt,
  }));

  const effectiveMemberCount = memberCount ?? blueprint.baselineMembers ?? 0;
  const engagementScore = computeEngagementScore({
    memberCount: effectiveMemberCount,
    metrics,
  });

  return {
    id: group.id,
    slug: blueprint.key || slugify(group.name || `group-${group.id}`),
    name: group.name,
    summary,
    description: group.description || summary,
    accentColor: blueprint.accentColor || '#2563EB',
    focusAreas,
    joinPolicy,
    allowedUserTypes: unique(blueprint.allowedUserTypes || DEFAULT_ALLOWED_USER_TYPES),
    membership: buildMembershipState({ membership, joinPolicy }),
    stats: {
      memberCount: effectiveMemberCount,
      weeklyActiveMembers: toNumber(metrics.weeklyActiveMembers, Math.round(effectiveMemberCount * 0.25)),
      opportunitiesSharedThisWeek: toNumber(metrics.opportunitiesSharedThisWeek, 0),
      retentionRate: Number(toNumber(metrics.retentionRate, 0.9).toFixed(2)),
      engagementScore,
    },
    insights: {
      signalStrength: insights.signalStrength || 'steady',
      trendingTopics: insights.trendingTopics || [],
    },
    upcomingEvents: events,
    leadership: blueprint.leadership || [],
    resources: blueprint.resources || [],
    guidelines: blueprint.guidelines || [],
    timeline,
    metadata: {
      baselineMembers: blueprint.baselineMembers ?? 0,
    },
  };
}

export async function getGroupProfile(groupIdOrSlug, { actorId } = {}) {
  if (!groupIdOrSlug) {
    throw new ValidationError('A group identifier is required.');
  }
  const normalizedActorId = toNumber(actorId, null);
  if (!normalizedActorId) {
    throw new AuthorizationError('Authentication is required to view group profiles.');
  }
  const actor = await assertActor(normalizedActorId);

  await sequelize.transaction(async (transaction) => ensureBlueprintGroups(transaction));

  const numericId = toNumber(groupIdOrSlug, null);
  let group = null;
  if (numericId) {
    group = await Group.findByPk(numericId);
  }
  if (!group) {
    const slug = `${groupIdOrSlug}`.trim().toLowerCase();
    const blueprint = BLUEPRINT_BY_KEY.get(slug);
    if (blueprint) {
      group = await Group.findOne({ where: { name: blueprint.name } });
    }
  }
  if (!group) {
    group = await Group.findOne({
      where: { name: { [Op.iLike ?? Op.like]: `${groupIdOrSlug}`.replace(/-/g, ' ') } },
    });
  }
  if (!group) {
    throw new NotFoundError('Group not found.');
  }

  const blueprint = resolveBlueprint(group);
  const memberCountMap = await fetchMemberCounts([group.id]);
  const membershipMap = await fetchActorMemberships(normalizedActorId, [group.id]);

  const record = mapGroupRecord(group, {
    memberCount: memberCountMap.get(group.id),
    membership: membershipMap.get(group.id),
    blueprint,
  });

  const membershipBreakdown = await GroupMembership.findAll({
    where: { groupId: group.id },
    attributes: ['role', [fn('COUNT', col('*')), 'count']],
    group: ['role'],
  });

  record.membershipBreakdown = membershipBreakdown.map((row) => ({
    role: row.get('role'),
    count: Number(row.get('count')),
  }));

  record.access = {
    joinPolicy: record.joinPolicy,
    allowedUserTypes: record.allowedUserTypes,
    invitationRequired: record.joinPolicy === 'invite_only',
  };

  const allowed = new Set((record.allowedUserTypes || []).map((value) => value.toLowerCase()));
  if (allowed.size && !allowed.has(actor.userType.toLowerCase())) {
    throw new AuthorizationError('Your role does not have access to this group.');
  }

  return record;
}

export async function joinGroup(groupIdOrSlug, { actorId, role = 'member' } = {}) {
  const user = await assertActor(actorId);
  const profile = await getGroupProfile(groupIdOrSlug, { actorId: user.id });

  if (profile.joinPolicy === 'invite_only') {
    throw new AuthorizationError('This group requires an invite from the leadership team.');
  }

  if (profile.allowedUserTypes && profile.allowedUserTypes.length > 0) {
    const allowed = new Set(profile.allowedUserTypes.map((value) => value.toLowerCase()));
    if (!allowed.has(user.userType.toLowerCase())) {
      throw new AuthorizationError('Your current role does not meet the access policy for this group.');
    }
  }

  if (profile.membership?.status === 'member') {
    throw new ConflictError('You are already a member of this group.');
  }

  const group = await Group.findByPk(profile.id);
  if (!group) {
    throw new NotFoundError('Group not found.');
  }

  await GroupMembership.findOrCreate({
    where: { groupId: group.id, userId: user.id },
    defaults: { role },
  });

  return getGroupProfile(profile.slug, { actorId: user.id });
}

export async function leaveGroup(groupIdOrSlug, { actorId } = {}) {
  const user = await assertActor(actorId);
  const profile = await getGroupProfile(groupIdOrSlug, { actorId: user.id });

  if (profile.membership?.status !== 'member') {
    throw new ConflictError('You are not currently a member of this group.');
  }

  const protectedRoles = new Set(['chair', 'owner', 'host']);
  if (profile.membership?.role && protectedRoles.has(profile.membership.role)) {
    throw new AuthorizationError('Community leads must assign a successor before leaving.');
  }

  await GroupMembership.destroy({ where: { groupId: profile.id, userId: user.id } });

  return getGroupProfile(profile.slug, { actorId: user.id });
}

export async function updateMembershipSettings(groupIdOrSlug, { actorId, role, notifications } = {}) {
  const user = await assertActor(actorId);
  const profile = await getGroupProfile(groupIdOrSlug, { actorId: user.id });

  const membership = await GroupMembership.findOne({
    where: { groupId: profile.id, userId: user.id },
  });

  if (!membership) {
    throw new ConflictError('You must join the group before updating settings.');
  }

  if (role && role !== membership.role) {
    const allowedRoles = new Set(['member', 'moderator', 'chair', 'owner']);
    if (!allowedRoles.has(role)) {
      throw new ValidationError('Unsupported membership role.');
    }
    if (role === 'owner' && membership.role !== 'owner') {
      throw new AuthorizationError('Only existing owners can promote new owners.');
    }
    membership.role = role;
  }

  if (notifications && typeof notifications === 'object') {
    membership.metadata = {
      ...(membership.metadata || {}),
      notifications: {
        digest: asBoolean(notifications.digest, true),
        newThread: asBoolean(notifications.newThread, true),
        upcomingEvent: asBoolean(notifications.upcomingEvent, true),
      },
    };
  }

  await membership.save();

  return getGroupProfile(profile.slug, { actorId: user.id });
}

const GROUP_MANAGER_ROLES = new Set(['admin', 'agency']);

function normalizeColour(value) {
  if (!value) {
    return '#2563eb';
  }
  const candidate = value.toString().trim().toLowerCase();
  return /^#([0-9a-f]{6})$/.test(candidate) ? candidate : '#2563eb';
}

function ensureManager(actor) {
  if (!actor || !GROUP_MANAGER_ROLES.has(actor.userType)) {
    throw new AuthorizationError('You do not have permission to manage groups.');
  }
}

function normalizeEnum(value, allowed, label) {
  if (!value) {
    return allowed[0];
  }
  if (!allowed.includes(value)) {
    throw new ValidationError(`Invalid ${label} provided.`);
  }
  return value;
}

function computeMembershipMetrics(memberships = []) {
  let totalMembers = 0;
  let activeMembers = 0;
  let pendingMembers = 0;
  let invitedMembers = 0;
  let suspendedMembers = 0;
  let lastMemberJoinedAt = null;

  for (const membership of memberships) {
    totalMembers += 1;
    const status = membership.status ?? 'pending';
    if (status === 'active') {
      activeMembers += 1;
      if (membership.joinedAt) {
        const joinedAt = new Date(membership.joinedAt).getTime();
        if (!lastMemberJoinedAt || joinedAt > lastMemberJoinedAt) {
          lastMemberJoinedAt = joinedAt;
        }
      }
    } else if (status === 'pending') {
      pendingMembers += 1;
    } else if (status === 'invited') {
      invitedMembers += 1;
    } else if (status === 'suspended') {
      suspendedMembers += 1;
    }
  }

  return {
    totalMembers,
    activeMembers,
    pendingMembers,
    invitedMembers,
    suspendedMembers,
    acceptanceRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
    lastMemberJoinedAt: lastMemberJoinedAt ? new Date(lastMemberJoinedAt).toISOString() : null,
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const plain = user.get ? user.get({ plain: true }) : user;
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id,
    firstName: plain.firstName ?? null,
    lastName: plain.lastName ?? null,
    name: fullName || null,
    email: plain.email ?? null,
    userType: plain.userType ?? null,
  };
}

function sanitizeMembership(membership) {
  if (!membership) {
    return null;
  }
  const plain = membership.get ? membership.get({ plain: true }) : membership;
  return {
    id: plain.id,
    userId: plain.userId,
    role: plain.role,
    status: plain.status,
    joinedAt: plain.joinedAt ? new Date(plain.joinedAt).toISOString() : null,
    invitedById: plain.invitedById ?? null,
    notes: plain.notes ?? null,
    member: sanitizeUser(plain.member ?? plain.Member),
    invitedBy: sanitizeUser(plain.invitedBy ?? plain.InvitedBy),
  };
}

function sanitizeGroup(group, { includeMembers = false } = {}) {
  if (!group) {
    return null;
  }
  const plain = group.get ? group.get({ plain: true }) : group;
  const memberships = Array.isArray(plain.memberships ?? plain.GroupMemberships)
    ? plain.memberships ?? plain.GroupMemberships
    : [];
  const metrics = computeMembershipMetrics(memberships);

  const normalizedMembers = includeMembers
    ? memberships.map((membership) => sanitizeMembership(membership))
    : undefined;

  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description ?? null,
    visibility: plain.visibility ?? 'public',
    memberPolicy: plain.memberPolicy ?? 'request',
    avatarColor: plain.avatarColor ?? '#2563eb',
    bannerImageUrl: plain.bannerImageUrl ?? null,
    settings: plain.settings ?? {},
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    createdBy: sanitizeUser(plain.createdBy ?? plain.CreatedBy),
    updatedBy: sanitizeUser(plain.updatedBy ?? plain.UpdatedBy),
    metrics: {
      totalMembers: metrics.totalMembers,
      activeMembers: metrics.activeMembers,
      pendingMembers: metrics.pendingMembers + metrics.invitedMembers,
      suspendedMembers: metrics.suspendedMembers,
      acceptanceRate: metrics.acceptanceRate,
      lastMemberJoinedAt: metrics.lastMemberJoinedAt,
    },
    members: normalizedMembers,
  };
}

async function resolveUniqueSlug(baseSlug, { transaction, excludeGroupId } = {}) {
  const sanitizedBase = slugify(baseSlug);
  let attempt = 0;
  let candidate = sanitizedBase;
  // allow a generous number of attempts before bailing out
  while (attempt < 25) {
    const where = { slug: candidate };
    if (excludeGroupId) {
      where.id = { [Op.ne]: excludeGroupId };
    }
    const existing = await Group.findOne({ where, transaction });
    if (!existing) {
      return candidate;
    }
    attempt += 1;
    candidate = `${sanitizedBase}-${attempt + 1}`;
  }
  throw new ConflictError('Unable to allocate a unique URL slug for this group. Please try a different name.');
}

async function loadGroup(groupId, { includeMembers = false, transaction } = {}) {
  const include = [
    {
      model: GroupMembership,
      as: 'memberships',
      required: false,
      attributes: ['id', 'userId', 'role', 'status', 'joinedAt', 'invitedById', 'notes'],
      include: includeMembers
        ? [
            { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
            { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          ]
        : [],
    },
    { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
  ];

  const group = await Group.findByPk(groupId, { include, transaction });
  if (!group) {
    throw new NotFoundError('Group not found');
  }
  return group;
}

export async function getGroup(groupId, { includeMembers = false, actor } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  ensureManager(actor);
  const group = await loadGroup(groupId, { includeMembers, transaction: undefined });
  return sanitizeGroup(group, { includeMembers });
}

export async function listGroups({
  page = 1,
  pageSize = 20,
  search,
  visibility,
  includeMembers = false,
  actor,
} = {}) {
  ensureManager(actor);
  const parsedPageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (parsedPage - 1) * parsedPageSize;

  const where = {};
  if (visibility && GROUP_VISIBILITIES.includes(visibility)) {
    where.visibility = visibility;
  }

  const trimmedSearch = search?.toString().trim();
  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`;
    where[Op.or] = [
      { name: { [Op.iLike ?? Op.like]: like } },
      { description: { [Op.iLike ?? Op.like]: like } },
      { slug: { [Op.iLike ?? Op.like]: like } },
    ];
  }

  const include = [
    {
      model: GroupMembership,
      as: 'memberships',
      required: false,
      attributes: ['id', 'userId', 'role', 'status', 'joinedAt', 'invitedById', 'notes'],
      include: includeMembers
        ? [
            { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
            { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          ]
        : [],
    },
    { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
  ];

  const result = await Group.findAndCountAll({
    where,
    include,
    distinct: true,
    order: [['name', 'ASC']],
    limit: parsedPageSize,
    offset,
  });

  return {
    data: result.rows.map((group) => sanitizeGroup(group, { includeMembers })),
    pagination: {
      page: parsedPage,
      pageSize: parsedPageSize,
      total: result.count,
      totalPages: Math.ceil(result.count / parsedPageSize) || 0,
    },
  };
}

export async function discoverGroups({ limit = 12, search, actorId } = {}) {
  const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 12));
  const baseWhere = {
    visibility: { [Op.in]: ['public', 'private', 'secret'] },
  };

  const include = [
    {
      model: GroupMembership,
      as: 'memberships',
      required: false,
      attributes: ['id', 'userId', 'role', 'status', 'joinedAt'],
    },
  ];

  const groups = await Group.findAll({
    where: baseWhere,
    include,
    distinct: true,
    order: [['name', 'ASC']],
    limit: parsedLimit * 2,
  });

  const trimmedSearch = search?.toString().trim().toLowerCase();

  const filtered = groups
    .filter((group) => {
      const plain = group.get({ plain: true });
      if (plain.visibility === 'public') {
        return true;
      }
      if (!actorId) {
        return false;
      }
      return (plain.memberships ?? plain.GroupMemberships ?? []).some((membership) => membership.userId === actorId);
    })
    .filter((group) => {
      if (!trimmedSearch) {
        return true;
      }
      const plain = group.get({ plain: true });
      const haystack = `${plain.name ?? ''} ${plain.description ?? ''} ${plain.slug ?? ''}`.toLowerCase();
      return haystack.includes(trimmedSearch);
    })
    .slice(0, parsedLimit);

  const sanitized = filtered
    .map((group) => sanitizeGroup(group, { includeMembers: false }))
    .sort((a, b) => (b.metrics.activeMembers ?? 0) - (a.metrics.activeMembers ?? 0));

  return {
    data: sanitized,
    metadata: {
      total: sanitized.length,
      recommendedIds: sanitized.slice(0, Math.min(3, sanitized.length)).map((group) => group.id),
    },
  };
}

export async function createGroup(payload, { actor } = {}) {
  ensureManager(actor);
  const name = payload?.name?.toString().trim();
  if (!name) {
    throw new ValidationError('Group name is required.');
  }

  const description = payload?.description?.toString().trim() || null;
  const bannerImageUrl = payload?.bannerImageUrl?.toString().trim() || null;
  const settings = payload?.settings ?? null;
  const metadata = payload?.metadata ?? null;

  return sequelize.transaction(async (transaction) => {
    const slug = await resolveUniqueSlug(payload?.slug || name, { transaction });
    const visibility = normalizeEnum(payload?.visibility || 'public', GROUP_VISIBILITIES, 'visibility');
    const memberPolicy = normalizeEnum(payload?.memberPolicy || 'request', GROUP_MEMBER_POLICIES, 'member policy');
    const avatarColor = normalizeColour(payload?.avatarColor);

    const group = await Group.create(
      {
        name,
        description,
        slug,
        visibility,
        memberPolicy,
        avatarColor,
        bannerImageUrl,
        settings,
        metadata,
        createdById: actor?.id ?? null,
        updatedById: actor?.id ?? null,
      },
      { transaction },
    );

    if (actor?.id) {
      await GroupMembership.create(
        {
          groupId: group.id,
          userId: actor.id,
          role: GROUP_MEMBERSHIP_ROLES.includes(payload?.ownerRole)
            ? payload.ownerRole
            : 'owner',
          status: 'active',
          invitedById: actor.id,
          joinedAt: new Date(),
        },
        { transaction },
      );
    }

    const reloaded = await loadGroup(group.id, { includeMembers: true, transaction });
    return sanitizeGroup(reloaded, { includeMembers: true });
  });
}

export async function updateGroup(groupId, payload, { actor } = {}) {
  ensureManager(actor);
  const group = await loadGroup(groupId, { includeMembers: false });

  return sequelize.transaction(async (transaction) => {
    const updates = {};

    if (payload.name !== undefined) {
      const trimmed = payload.name?.toString().trim();
      if (!trimmed) {
        throw new ValidationError('Group name cannot be empty.');
      }
      updates.name = trimmed;
    }

    if (payload.description !== undefined) {
      updates.description = payload.description?.toString().trim() || null;
    }

    if (payload.slug !== undefined) {
      const candidate = payload.slug?.toString().trim();
      if (!candidate) {
        throw new ValidationError('Slug cannot be empty.');
      }
      updates.slug = await resolveUniqueSlug(candidate, {
        transaction,
        excludeGroupId: group.id,
      });
    }

    if (payload.visibility !== undefined) {
      updates.visibility = normalizeEnum(payload.visibility, GROUP_VISIBILITIES, 'visibility');
    }

    if (payload.memberPolicy !== undefined) {
      updates.memberPolicy = normalizeEnum(payload.memberPolicy, GROUP_MEMBER_POLICIES, 'member policy');
    }

    if (payload.avatarColor !== undefined) {
      updates.avatarColor = normalizeColour(payload.avatarColor);
    }

    if (payload.bannerImageUrl !== undefined) {
      updates.bannerImageUrl = payload.bannerImageUrl?.toString().trim() || null;
    }

    if (payload.settings !== undefined) {
      updates.settings = payload.settings ?? null;
    }

    if (payload.metadata !== undefined) {
      updates.metadata = payload.metadata ?? null;
    }

    updates.updatedById = actor?.id ?? group.updatedById ?? null;

    await group.update(updates, { transaction });
    const reloaded = await loadGroup(group.id, { includeMembers: true, transaction });
    return sanitizeGroup(reloaded, { includeMembers: true });
  });
}

export async function addMember({ groupId, userId, role, status, notes }, { actor } = {}) {
  ensureManager(actor);
  if (!groupId || !userId) {
    throw new ValidationError('Both groupId and userId are required.');
  }

  return sequelize.transaction(async (transaction) => {
    await loadGroup(groupId, { transaction });
    const member = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'userType'],
      transaction,
    });
    if (!member) {
      throw new ValidationError('User not found.');
    }

    const existing = await GroupMembership.findOne({
      where: { groupId, userId },
      transaction,
    });
    if (existing) {
      throw new ConflictError('User already belongs to this group.');
    }

    const membership = await GroupMembership.create(
      {
        groupId,
        userId,
        role: GROUP_MEMBERSHIP_ROLES.includes(role) ? role : 'member',
        status: GROUP_MEMBERSHIP_STATUSES.includes(status) ? status : 'invited',
        invitedById: actor?.id ?? null,
        joinedAt: status === 'active' ? new Date() : null,
        notes: notes ?? null,
      },
      { transaction },
    );

    await membership.reload({
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    return sanitizeMembership(membership);
  });
}

export async function updateMember(groupId, membershipId, payload, { actor } = {}) {
  ensureManager(actor);
  if (!groupId || !membershipId) {
    throw new ValidationError('groupId and membershipId are required.');
  }

  return sequelize.transaction(async (transaction) => {
    const membership = await GroupMembership.findOne({
      where: { id: membershipId, groupId },
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    if (!membership) {
      throw new NotFoundError('Group membership not found.');
    }

    if (payload.role !== undefined) {
      if (!GROUP_MEMBERSHIP_ROLES.includes(payload.role)) {
        throw new ValidationError('Invalid membership role.');
      }
      membership.role = payload.role;
    }

    if (payload.status !== undefined) {
      if (!GROUP_MEMBERSHIP_STATUSES.includes(payload.status)) {
        throw new ValidationError('Invalid membership status.');
      }
      membership.status = payload.status;
      if (payload.status === 'active' && !membership.joinedAt) {
        membership.joinedAt = new Date();
      }
    }

    if (payload.notes !== undefined) {
      membership.notes = payload.notes?.toString().trim() || null;
    }

    await membership.save({ transaction });
    await membership.reload({
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    return sanitizeMembership(membership);
  });
}

export async function removeMember(groupId, membershipId, { actor } = {}) {
  ensureManager(actor);
  if (!groupId || !membershipId) {
    throw new ValidationError('groupId and membershipId are required.');
  }

  return sequelize.transaction(async (transaction) => {
    const membership = await GroupMembership.findOne({
      where: { id: membershipId, groupId },
      transaction,
    });
    if (!membership) {
      throw new NotFoundError('Group membership not found.');
    }
    await membership.destroy({ transaction });
    return { success: true };
  });
}

export async function requestMembership(groupId, { actor, message } = {}) {
  if (!actor?.id) {
    throw new AuthorizationError('Authentication required to request membership.');
  }
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const group = await loadGroup(groupId, { includeMembers: true, transaction });
    const existing = await GroupMembership.findOne({
      where: { groupId, userId: actor.id },
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    const desiredStatus = group.memberPolicy === 'open' ? 'active' : 'pending';

    if (existing) {
      existing.status = desiredStatus;
      if (desiredStatus === 'active' && !existing.joinedAt) {
        existing.joinedAt = new Date();
      }
      if (message !== undefined) {
        existing.notes = message?.toString().trim() || null;
      }
      await existing.save({ transaction });
      await existing.reload({
        include: [
          { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
          { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        ],
        transaction,
      });
      return sanitizeMembership(existing);
    }

    const membership = await GroupMembership.create(
      {
        groupId,
        userId: actor.id,
        role: 'member',
        status: desiredStatus,
        invitedById: null,
        joinedAt: desiredStatus === 'active' ? new Date() : null,
        notes: message?.toString().trim() || null,
      },
      { transaction },
    );

    await membership.reload({
      include: [
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      transaction,
    });

    return sanitizeMembership(membership);
  });
}

export default {
  listGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
  discoverGroups,
  getGroup,
  createGroup,
  updateGroup,
  addMember,
  updateMember,
  removeMember,
  requestMembership,
};
