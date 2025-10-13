import { Op, fn, col } from 'sequelize';
import {
  Group,
  GroupMembership,
  User,
  sequelize,
} from '../models/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors.js';

const DEFAULT_ALLOWED_USER_TYPES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];
const DEFAULT_JOIN_POLICY = 'moderated';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
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

export async function listGroups({
  actorId,
  limit = 12,
  offset = 0,
  focus,
  query,
  includeEmpty = false,
} = {}) {
  const numericLimit = Math.max(1, Math.min(50, toNumber(limit, 12)));
  const numericOffset = Math.max(0, toNumber(offset, 0));

  const normalizedActorId = toNumber(actorId, null);
  if (!normalizedActorId) {
    throw new AuthorizationError('Authentication is required to access community groups.');
  }
  await assertActor(normalizedActorId);

  await sequelize.transaction(async (transaction) => ensureBlueprintGroups(transaction));

  const where = {};
  if (query) {
    const pattern = `%${query.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike ?? Op.like]: pattern } },
      { description: { [Op.iLike ?? Op.like]: pattern } },
    ];
  }

  const groups = await Group.findAll({
    where,
    order: [['name', 'ASC']],
    offset: numericOffset,
    limit: numericLimit,
  });

  const groupIds = groups.map((group) => group.id);
  const [memberCounts, actorMemberships] = await Promise.all([
    fetchMemberCounts(groupIds),
    fetchActorMemberships(normalizedActorId, groupIds),
  ]);

  const enriched = groups
    .map((group) => {
      const blueprint = resolveBlueprint(group);
      const membership = actorMemberships.get(group.id);
      const memberCount = memberCounts.get(group.id);
      return mapGroupRecord(group, { memberCount, membership, blueprint });
    })
    .filter((item) => includeEmpty || item.stats.memberCount > 0 || item.membership.status === 'member');

  const filtered = enriched.filter((item) => {
    if (!focus) {
      return true;
    }
    const normalized = `${focus}`.toLowerCase();
    return item.focusAreas.some((area) => area.toLowerCase().includes(normalized));
  });

  const refined = filtered.filter((item) => {
    if (!query) {
      return true;
    }
    const haystack = [item.name, item.summary, ...(item.focusAreas || [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const total = await Group.count({ where });

  return {
    items: refined,
    pagination: {
      total,
      limit: numericLimit,
      offset: numericOffset,
    },
    metadata: {
      featured: refined.slice(0, 3).map((item) => item.slug),
      generatedAt: new Date().toISOString(),
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

export default {
  listGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
};
