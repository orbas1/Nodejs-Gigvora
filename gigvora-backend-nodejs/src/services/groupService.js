import { Op, fn, col } from 'sequelize';
import {
  Group,
  GroupMembership,
  GroupInvite,
  GroupPost,
  User,
  sequelize,
  GROUP_VISIBILITIES,
  GROUP_MEMBER_POLICIES,
  GROUP_MEMBERSHIP_STATUSES,
  GROUP_MEMBERSHIP_ROLES,
  COMMUNITY_INVITE_STATUSES,
  GROUP_POST_STATUSES,
  GROUP_POST_VISIBILITIES,
} from '../models/index.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
} from '../utils/errors.js';

const DEFAULT_ALLOWED_USER_TYPES = ['user', 'freelancer', 'agency', 'company', 'mentor', 'headhunter', 'admin'];
const DEFAULT_JOIN_POLICY = 'moderated';
const DEFAULT_INVITE_EXPIRY_DAYS = 14;
const ALLOWED_INVITE_STATUSES = new Set(COMMUNITY_INVITE_STATUSES);
const ALLOWED_GROUP_POST_STATUSES = new Set(GROUP_POST_STATUSES);
const ALLOWED_GROUP_POST_VISIBILITIES = new Set(GROUP_POST_VISIBILITIES);

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

function normalizeJoinPolicy(...candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = `${candidate}`.toLowerCase();
    if (['open', 'public'].includes(value)) {
      return 'open';
    }
    if (['request', 'moderated', 'approval', 'review'].includes(value)) {
      return 'moderated';
    }
    if (['invite', 'invite_only', 'invitation', 'restricted'].includes(value)) {
      return 'invite_only';
    }
  }
  return 'moderated';
}

function mapJoinPolicyToMemberPolicy(joinPolicy) {
  const normalized = normalizeJoinPolicy(joinPolicy);
  if (normalized === 'open') {
    return 'open';
  }
  if (normalized === 'invite_only') {
    return 'invite';
  }
  return 'request';
}

function mergeUniqueBy(primary = [], secondary = [], keyFn = (item) => item?.id ?? item) {
  const map = new Map();
  const result = [];
  const add = (item) => {
    if (!item) return;
    const key = keyFn(item);
    if (key == null || !map.has(key)) {
      map.set(key, item);
      result.push(item);
    }
  };
  primary.forEach(add);
  secondary.forEach(add);
  return result;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toIsoString(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
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
    discussionBoard: {
      stats: { activeContributors: 182, unresolvedCount: 6, newThreads: 14 },
      tags: ['Announcements', 'Product ops', 'Marketplace design', 'AI'],
      pinned: [
        {
          id: 'fowc-manifesto',
          title: 'Community manifesto refresh',
          category: 'Announcement',
          excerpt: 'We are revisiting our collaboration principles ahead of the upcoming cohort expansion.',
          author: { name: 'Leila Odum' },
          replies: 42,
          participants: 31,
          upvotes: 88,
          tags: ['Announcement', 'Governance'],
          lastActivityAt: () => minutesFromNow(-6 * 60),
          isAnswered: true,
          url: 'https://community.gigvora.com/future-of-work-collective/manifesto',
        },
        {
          id: 'fowc-trend-report',
          title: 'Signal digest · Week 42',
          category: 'Digest',
          excerpt: 'Highlights on compensation systems and async onboarding pilots shared by members.',
          author: { name: 'Mateo Ruiz' },
          replies: 27,
          participants: 24,
          upvotes: 65,
          tags: ['Insights', 'Playbook'],
          lastActivityAt: () => minutesFromNow(-12 * 60),
          isAnswered: true,
          url: 'https://signals.gigvora.com/fowc-weekly',
        },
      ],
      threads: [
        {
          id: 'fowc-ai-sprints',
          title: 'Deploying AI copilots inside enterprise sprints',
          category: 'Case study',
          excerpt: 'Which guardrails are you putting in place before letting copilots draft deliverables for clients?',
          author: { name: 'Mateo Ruiz' },
          replies: 18,
          participants: 16,
          upvotes: 64,
          tags: ['AI', 'Delivery ops'],
          lastActivityAt: () => minutesFromNow(-90),
          lastReplyAt: () => minutesFromNow(-40),
          isUnresolved: true,
          unread: true,
          url: 'https://community.gigvora.com/future-of-work-collective/ai-copilots',
        },
        {
          id: 'fowc-governance-models',
          title: 'Governance models for distributed pods',
          category: 'Framework',
          excerpt: 'Sharing the decision matrix we use to allocate product pods across three timezones.',
          author: { name: 'Sophie Mayer' },
          replies: 23,
          participants: 19,
          upvotes: 53,
          tags: ['Governance', 'Marketplace design'],
          lastActivityAt: () => minutesFromNow(-4 * 60),
          lastReplyAt: () => minutesFromNow(-2 * 60),
          isAnswered: true,
          url: 'https://community.gigvora.com/future-of-work-collective/governance-models',
        },
        {
          id: 'fowc-talent-cadence',
          title: 'Talent acquisition cadence for remote-first teams',
          category: 'People ops',
          excerpt: 'Looking for benchmarks on how you structure async interviews and onboarding scorecards.',
          author: { name: 'Dario Fernández' },
          replies: 11,
          participants: 14,
          upvotes: 36,
          tags: ['People ops', 'Hiring'],
          lastActivityAt: () => minutesFromNow(-8 * 60),
          lastReplyAt: () => minutesFromNow(-6 * 60),
          isUnresolved: false,
          url: 'https://community.gigvora.com/future-of-work-collective/talent-cadence',
        },
      ],
      moderators: [
        { name: 'Leila Odum', title: 'Community Chair · Northwind Ventures', focus: 'Governance & rituals' },
        { name: 'Mateo Ruiz', title: 'Program Curator · Aurora Labs', focus: 'Product & delivery' },
      ],
      health: { responseTime: '3h', participation: '74%' },
    },
    resourceLibrary: {
      stats: { totalItems: 36, downloads24h: 124, savedCount: 892 },
      filters: {
        tags: ['Marketplace design', 'AI', 'People ops', 'Governance'],
        formats: ['Playbook', 'Template', 'Recording', 'Digest'],
      },
      featured: [
        {
          id: 'fowc-masterclass',
          title: 'Masterclass: Designing partner pods',
          summary: 'Recording and frameworks from the latest salon on orchestrating partner pods across markets.',
          type: 'Recording',
          format: 'Recording',
          tags: ['Marketplace design', 'Operations'],
          url: 'https://community.gigvora.com/fowc/masterclass-partner-pods',
          updatedAt: () => minutesFromNow(-11 * 60),
          duration: '32 min watch',
          metrics: { saves: 312, downloads24h: 58, durationMinutes: 32 },
        },
      ],
      items: [
        {
          id: 'fowc-playbook',
          title: 'Distributed Team Activation Playbook',
          summary: 'Step-by-step frameworks for spinning up distributed pods with accountability rituals.',
          type: 'Playbook',
          format: 'Playbook',
          tags: ['Operations', 'Playbook'],
          url: 'https://guides.gigvora.com/future-of-work-playbook',
          updatedAt: () => minutesFromNow(-3 * 24 * 60),
          readingTime: '18 min read',
          metrics: { saves: 204, downloads24h: 32, durationMinutes: 18 },
        },
        {
          id: 'fowc-signal-digest',
          title: 'Signal digest · Week 42',
          summary: 'Weekly trend rundown curated by moderators with actionable prompts for the community.',
          type: 'Digest',
          format: 'Digest',
          tags: ['Insights', 'Signals'],
          url: 'https://signals.gigvora.com/fowc-weekly',
          updatedAt: () => minutesFromNow(-7 * 24 * 60),
          readingTime: '6 min read',
          metrics: { saves: 168, downloads24h: 21, durationMinutes: 6 },
        },
        {
          id: 'fowc-template',
          title: 'Async Stand-up Template (Notion)',
          summary: 'Customisable async stand-up template used by the collective for cross-timezone pods.',
          type: 'Template',
          format: 'Template',
          tags: ['Template', 'Async'],
          url: 'https://templates.gigvora.com/fowc-async-standup',
          updatedAt: () => minutesFromNow(-5 * 24 * 60),
          readingTime: '5 min setup',
          metrics: { saves: 221, downloads24h: 39, durationMinutes: 5 },
        },
        {
          id: 'fowc-ops-kit',
          title: 'Marketplace Ops Metrics Toolkit',
          summary: 'Live dashboards and spreadsheet templates for tracking marketplace liquidity and retention.',
          type: 'Toolkit',
          format: 'Toolkit',
          tags: ['Marketplace design', 'Analytics'],
          url: 'https://guides.gigvora.com/fowc-ops-metrics',
          updatedAt: () => minutesFromNow(-2 * 24 * 60 - 120),
          readingTime: '20 min implementation',
          metrics: { saves: 189, downloads24h: 28, durationMinutes: 20 },
        },
      ],
    },
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
    discussionBoard: {
      stats: { activeContributors: 128, unresolvedCount: 4, newThreads: 9 },
      tags: ['Mentorship', 'Growth loops', 'Referrals', 'Playbooks'],
      pinned: [
        {
          id: 'launchpad-mastermind',
          title: 'Mastermind replay + action plan',
          category: 'Replay',
          excerpt: 'Catch the highlights from our monetisation mastermind and download the companion worksheets.',
          author: { name: 'Ava Chen' },
          replies: 19,
          participants: 17,
          upvotes: 48,
          tags: ['Monetisation', 'Replay'],
          lastActivityAt: () => minutesFromNow(-5 * 60),
          isAnswered: true,
          url: 'https://community.gigvora.com/launchpad/mastermind-replay',
        },
      ],
      threads: [
        {
          id: 'launchpad-referrals',
          title: 'Structuring partner referral loops post-cohort',
          category: 'Growth',
          excerpt: 'Looking for templates to keep referral loops alive after the programme wraps.',
          author: { name: 'Nikhil Shah' },
          replies: 15,
          participants: 12,
          upvotes: 41,
          tags: ['Referrals', 'Growth loops'],
          lastActivityAt: () => minutesFromNow(-7 * 60),
          lastReplyAt: () => minutesFromNow(-3 * 60),
          isUnresolved: true,
          unread: true,
          url: 'https://community.gigvora.com/launchpad/referral-loops',
        },
        {
          id: 'launchpad-coaching',
          title: 'Mentor office hours expectations',
          category: 'Mentorship',
          excerpt: 'How do you prepare founders for the first office hour so sessions stay actionable?',
          author: { name: 'Ava Chen' },
          replies: 9,
          participants: 10,
          upvotes: 28,
          tags: ['Mentorship', 'Office hours'],
          lastActivityAt: () => minutesFromNow(-180),
          lastReplyAt: () => minutesFromNow(-140),
          isAnswered: true,
          url: 'https://community.gigvora.com/launchpad/mentor-office-hours',
        },
      ],
      moderators: [
        { name: 'Ava Chen', title: 'Product Marketing Lead · Nova Labs', focus: 'Monetisation & positioning' },
        { name: 'Nikhil Shah', title: 'Director of Ecosystem · Atlas Studio', focus: 'Partnerships & growth' },
      ],
      health: { responseTime: '5h', participation: '68%' },
    },
    resourceLibrary: {
      stats: { totalItems: 24, downloads24h: 76, savedCount: 604 },
      filters: {
        tags: ['Mentorship', 'Referrals', 'Product marketing', 'Templates'],
        formats: ['Checklist', 'Tracker', 'Recording', 'Worksheet'],
      },
      featured: [
        {
          id: 'launchpad-monetisation',
          title: 'Monetisation sprint retro pack',
          summary: 'Slides, templates, and scoring models from the monetisation masterclass.',
          type: 'Worksheet',
          format: 'Worksheet',
          tags: ['Monetisation', 'Templates'],
          url: 'https://guides.gigvora.com/launchpad-monetisation-retro',
          updatedAt: () => minutesFromNow(-18 * 60),
          duration: '45 min workshop',
          metrics: { saves: 174, downloads24h: 34, durationMinutes: 45 },
        },
      ],
      items: [
        {
          id: 'launchpad-checklist',
          title: 'Post-cohort transition checklist',
          summary: 'Ensure alumni graduate with clarity on monetisation, partner handovers, and goal setting.',
          type: 'Checklist',
          format: 'Checklist',
          tags: ['Operations', 'Alumni'],
          url: 'https://guides.gigvora.com/launchpad-transition',
          updatedAt: () => minutesFromNow(-9 * 24 * 60),
          readingTime: '10 min read',
          metrics: { saves: 142, downloads24h: 18, durationMinutes: 10 },
        },
        {
          id: 'launchpad-intros',
          title: 'Partner intro tracker',
          summary: 'Shared tracker for logging partner intros, feedback loops, and follow-up cadences.',
          type: 'Tracker',
          format: 'Tracker',
          tags: ['Referrals', 'Operations'],
          url: 'https://workspace.gigvora.com/launchpad-intros',
          updatedAt: () => minutesFromNow(-4 * 24 * 60),
          readingTime: '7 min setup',
          metrics: { saves: 133, downloads24h: 22, durationMinutes: 7 },
        },
        {
          id: 'launchpad-office-hours',
          title: 'Mentor office hour agenda template',
          summary: 'Agenda and prep checklist mentors use to keep sessions focused and accountable.',
          type: 'Template',
          format: 'Template',
          tags: ['Mentorship', 'Templates'],
          url: 'https://templates.gigvora.com/launchpad-office-hours',
          updatedAt: () => minutesFromNow(-6 * 24 * 60),
          readingTime: '5 min setup',
          metrics: { saves: 116, downloads24h: 17, durationMinutes: 5 },
        },
      ],
    },
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
    discussionBoard: {
      stats: { activeContributors: 94, unresolvedCount: 5, newThreads: 11 },
      tags: ['Volunteer ops', 'Impact measurement', 'Field updates', 'Partnerships'],
      pinned: [
        {
          id: 'purpose-briefing',
          title: 'Circular retail pilots briefing pack',
          category: 'Briefing',
          excerpt: 'Download the partner briefing, asset checklist, and safety protocols before the next sprint.',
          author: { name: 'Gigvora Impact Office' },
          replies: 14,
          participants: 21,
          upvotes: 39,
          tags: ['Briefing', 'Safety'],
          lastActivityAt: () => minutesFromNow(-3 * 60),
          isAnswered: true,
          url: 'https://impact.gigvora.com/sprint-kit',
        },
      ],
      threads: [
        {
          id: 'purpose-safety',
          title: 'On-site safety escalation flow',
          category: 'Operations',
          excerpt: 'Clarifying who to contact for rapid escalation during field deployments.',
          author: { name: 'Leila Odum' },
          replies: 12,
          participants: 15,
          upvotes: 33,
          tags: ['Safety', 'Volunteer ops'],
          lastActivityAt: () => minutesFromNow(-160),
          lastReplyAt: () => minutesFromNow(-120),
          isUnresolved: false,
          url: 'https://community.gigvora.com/purpose-lab/safety-escalation',
        },
        {
          id: 'purpose-impact-metrics',
          title: 'Capturing impact metrics in low-connectivity areas',
          category: 'Impact measurement',
          excerpt: 'Seeking lightweight data capture ideas when teams operate offline.',
          author: { name: 'Impact Programmes Team' },
          replies: 17,
          participants: 14,
          upvotes: 41,
          tags: ['Impact measurement', 'Field ops'],
          lastActivityAt: () => minutesFromNow(-9 * 60),
          lastReplyAt: () => minutesFromNow(-4 * 60),
          isUnresolved: true,
          unread: true,
          url: 'https://community.gigvora.com/purpose-lab/impact-metrics',
        },
      ],
      moderators: [
        { name: 'Gigvora Impact Office', title: 'Programme Managers', focus: 'Volunteer enablement' },
      ],
      health: { responseTime: '6h', participation: '61%' },
    },
    resourceLibrary: {
      stats: { totalItems: 28, downloads24h: 54, savedCount: 478 },
      filters: {
        tags: ['Sustainability', 'Volunteer ops', 'Safety', 'Impact measurement'],
        formats: ['Kit', 'Intelligence', 'Checklist', 'Report'],
      },
      featured: [
        {
          id: 'purpose-impact-dashboard',
          title: 'Impact measurement dashboard walkthrough',
          summary: 'Video walkthrough and template pack for the upcoming impact measurement release.',
          type: 'Recording',
          format: 'Recording',
          tags: ['Impact measurement', 'Analytics'],
          url: 'https://impact.gigvora.com/measurement-dashboard',
          updatedAt: () => minutesFromNow(-15 * 60),
          duration: '24 min watch',
          metrics: { saves: 142, downloads24h: 19, durationMinutes: 24 },
        },
      ],
      items: [
        {
          id: 'purpose-sprint-kit',
          title: 'Impact sprint facilitation kit',
          summary: 'End-to-end facilitation guidance, agendas, and templates for impact sprints.',
          type: 'Kit',
          format: 'Kit',
          tags: ['Volunteer ops', 'Templates'],
          url: 'https://impact.gigvora.com/sprint-kit',
          updatedAt: () => minutesFromNow(-8 * 24 * 60),
          readingTime: '30 min workshop',
          metrics: { saves: 168, downloads24h: 23, durationMinutes: 30 },
        },
        {
          id: 'purpose-insights',
          title: 'Climate venture partner map',
          summary: 'Interactive map of climate-positive ventures and contact notes sourced by volunteers.',
          type: 'Intelligence',
          format: 'Report',
          tags: ['Partnerships', 'Insights'],
          url: 'https://impact.gigvora.com/partner-map',
          updatedAt: () => minutesFromNow(-6 * 24 * 60),
          readingTime: '12 min read',
          metrics: { saves: 137, downloads24h: 16, durationMinutes: 12 },
        },
        {
          id: 'purpose-safety-checklist',
          title: 'Field safety escalation checklist',
          summary: 'Step-by-step escalation plan, emergency contacts, and response templates.',
          type: 'Checklist',
          format: 'Checklist',
          tags: ['Safety', 'Volunteer ops'],
          url: 'https://impact.gigvora.com/safety-checklist',
          updatedAt: () => minutesFromNow(-3 * 24 * 60),
          readingTime: '8 min read',
          metrics: { saves: 122, downloads24h: 15, durationMinutes: 8 },
        },
      ],
    },
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
    const normalizedJoinPolicy = normalizeJoinPolicy(blueprint.joinPolicy, blueprint.memberPolicy);
    const memberPolicy = mapJoinPolicyToMemberPolicy(normalizedJoinPolicy);
    const normalizedBoard = normalizeDiscussionBoard(blueprint.discussionBoard ?? {});
    const normalizedLibrary = normalizeResourceLibrary(blueprint.resourceLibrary ?? {}, blueprint.resources ?? []);
    const normalizedEvents = (blueprint.upcomingEvents ?? []).map((event) => ({
      ...event,
      startAt: normalizeTemporalValue(event.startAt),
    }));
    const normalizedTimeline = (blueprint.timeline ?? []).map((entry) => ({
      ...entry,
      occursAt: normalizeTemporalValue(entry.occursAt),
    }));

    const [record] = await Group.findOrCreate({
      where: { name: blueprint.name },
      defaults: {
        description: blueprint.summary,
        memberPolicy,
        avatarColor: blueprint.accentColor ?? '#2563eb',
        visibility: 'public',
        settings: {
          allowedUserTypes: blueprint.allowedUserTypes ?? DEFAULT_ALLOWED_USER_TYPES,
          joinPolicy: normalizedJoinPolicy,
        },
        metadata: {
          summary: blueprint.summary,
          focusAreas: blueprint.focusAreas ?? [],
          accentColor: blueprint.accentColor ?? '#2563EB',
          metrics: blueprint.metrics ?? {},
          insights: blueprint.insights ?? {},
          baselineMembers: blueprint.baselineMembers ?? 0,
          upcomingEvents: normalizedEvents,
          leadership: blueprint.leadership ?? [],
          guidelines: blueprint.guidelines ?? [],
          timeline: normalizedTimeline,
          resources: blueprint.resources ?? [],
          discussionBoard: normalizedBoard,
          resourceLibrary: normalizedLibrary,
        },
      },
      transaction,
    });

    let changed = false;

    if (!record.description) {
      record.description = blueprint.summary;
      changed = true;
    }

    const nextSettings = {
      ...(record.settings || {}),
      allowedUserTypes:
        (record.settings?.allowedUserTypes && record.settings.allowedUserTypes.length)
          ? record.settings.allowedUserTypes
          : blueprint.allowedUserTypes ?? DEFAULT_ALLOWED_USER_TYPES,
      joinPolicy: record.settings?.joinPolicy ?? normalizedJoinPolicy,
    };

    const existingMetadata = isPlainObject(record.metadata) ? record.metadata : {};
    const nextMetadata = {
      ...existingMetadata,
      summary: existingMetadata.summary ?? blueprint.summary,
      focusAreas: unique([...(existingMetadata.focusAreas ?? []), ...(blueprint.focusAreas ?? [])]),
      accentColor: existingMetadata.accentColor ?? blueprint.accentColor ?? '#2563EB',
      metrics: { ...(blueprint.metrics ?? {}), ...(existingMetadata.metrics ?? {}) },
      insights: { ...(blueprint.insights ?? {}), ...(existingMetadata.insights ?? {}) },
      baselineMembers: existingMetadata.baselineMembers ?? blueprint.baselineMembers ?? 0,
      upcomingEvents:
        Array.isArray(existingMetadata.upcomingEvents) && existingMetadata.upcomingEvents.length
          ? existingMetadata.upcomingEvents
          : normalizedEvents,
      leadership:
        Array.isArray(existingMetadata.leadership) && existingMetadata.leadership.length
          ? existingMetadata.leadership
          : blueprint.leadership ?? [],
      guidelines:
        Array.isArray(existingMetadata.guidelines) && existingMetadata.guidelines.length
          ? existingMetadata.guidelines
          : blueprint.guidelines ?? [],
      timeline:
        Array.isArray(existingMetadata.timeline) && existingMetadata.timeline.length
          ? existingMetadata.timeline
          : normalizedTimeline,
      resources:
        Array.isArray(existingMetadata.resources) && existingMetadata.resources.length
          ? existingMetadata.resources
          : blueprint.resources ?? [],
      discussionBoard:
        existingMetadata.discussionBoard &&
        (existingMetadata.discussionBoard.threads?.length || existingMetadata.discussionBoard.pinned?.length)
          ? existingMetadata.discussionBoard
          : normalizedBoard,
      resourceLibrary:
        existingMetadata.resourceLibrary &&
        ((existingMetadata.resourceLibrary.items && existingMetadata.resourceLibrary.items.length) ||
          (existingMetadata.resourceLibrary.featured && existingMetadata.resourceLibrary.featured.length))
          ? existingMetadata.resourceLibrary
          : normalizedLibrary,
      blueprintKey: blueprint.key,
    };

    if (record.memberPolicy !== memberPolicy) {
      record.memberPolicy = memberPolicy;
      changed = true;
    }

    if (!record.avatarColor || record.avatarColor === '#2563eb') {
      record.avatarColor = blueprint.accentColor ?? record.avatarColor;
      changed = true;
    }

    if (JSON.stringify(record.settings ?? {}) !== JSON.stringify(nextSettings)) {
      record.settings = nextSettings;
      changed = true;
    }

    if (JSON.stringify(existingMetadata) !== JSON.stringify(nextMetadata)) {
      record.metadata = nextMetadata;
      changed = true;
    }

    if (changed) {
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
      status: row.status ?? 'pending',
      joinedAt: row.joinedAt ? new Date(row.joinedAt).toISOString() : row.createdAt ? new Date(row.createdAt).toISOString() : null,
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
  const rawStatus = membership.status ?? 'active';
  const isMember = rawStatus === 'active';
  return {
    status: isMember ? 'member' : rawStatus,
    state: rawStatus,
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

function normalizeTemporalValue(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'function') {
    return value();
  }
  return value;
}

function normalizeThread(thread, index) {
  if (!thread) {
    return null;
  }
  const normalized = {
    id: thread.id ?? `thread-${index}`,
    title: thread.title ?? 'Community thread',
    excerpt: thread.excerpt ?? '',
    category: thread.category ?? thread.type ?? 'Discussion',
    author: thread.author ?? null,
    replies: toNumber(thread.replies, 0),
    participants: toNumber(thread.participants, 0),
    upvotes: toNumber(thread.upvotes, 0),
    tags: Array.isArray(thread.tags) ? thread.tags : [],
    lastActivityAt: normalizeTemporalValue(thread.lastActivityAt ?? thread.lastReplyAt),
    lastReplyAt: normalizeTemporalValue(thread.lastReplyAt),
    publishedAt: normalizeTemporalValue(thread.publishedAt),
    isAnswered: Boolean(thread.isAnswered),
    isUnresolved: thread.isUnresolved ?? !thread.isAnswered,
    unread: Boolean(thread.unread),
    pinned: Boolean(thread.pinned),
    url: thread.url ?? null,
  };
  return normalized;
}

function normalizeDiscussionBoard(blueprint = {}) {
  const pinned = (blueprint.pinned ?? [])
    .map((thread, index) => normalizeThread({ ...thread, pinned: true }, index))
    .filter(Boolean);
  const threads = (blueprint.threads ?? [])
    .map((thread, index) => normalizeThread(thread, index))
    .filter(Boolean);

  const tags = Array.from(
    new Set(
      (blueprint.tags ?? [])
        .concat(blueprint.trendingTags ?? [])
        .map((value) => (value ? value.toString().trim() : null))
        .filter(Boolean),
    ),
  );

  return {
    stats: {
      activeContributors: toNumber(blueprint.stats?.activeContributors, 0),
      unresolvedCount: toNumber(blueprint.stats?.unresolvedCount, 0),
      newThreads: toNumber(blueprint.stats?.newThreads, 0),
    },
    moderators: Array.isArray(blueprint.moderators) ? blueprint.moderators : [],
    tags,
    trendingTags: Array.isArray(blueprint.trendingTags) && blueprint.trendingTags.length ? blueprint.trendingTags : tags,
    pinned,
    threads,
    health: {
      responseTime: blueprint.health?.responseTime ?? '4h',
      participation: blueprint.health?.participation ?? '65%',
    },
  };
}

function normalizeResource(resource, index) {
  if (!resource) {
    return null;
  }
  return {
    id: resource.id ?? `resource-${index}`,
    title: resource.title ?? 'Untitled resource',
    summary: resource.summary ?? resource.description ?? '',
    description: resource.description ?? '',
    type: resource.type ?? resource.format ?? 'Resource',
    format: resource.format ?? resource.type ?? 'Guide',
    tags: Array.isArray(resource.tags) ? resource.tags : [],
    url: resource.url ?? null,
    duration: resource.duration ?? resource.readingTime ?? null,
    readingTime: resource.readingTime ?? resource.duration ?? null,
    updatedAt: normalizeTemporalValue(resource.updatedAt ?? resource.publishedAt),
    publishedAt: normalizeTemporalValue(resource.publishedAt),
    metrics: resource.metrics ?? {},
  };
}

function normalizeResourceLibrary(blueprint = {}, fallbackItems = []) {
  const normalizedItems = (blueprint.items ?? fallbackItems)
    .map((item, index) => normalizeResource(item, index))
    .filter(Boolean);
  const normalizedFeatured = (blueprint.featured ?? [])
    .map((item, index) => normalizeResource(item, index))
    .filter(Boolean);

  const items = normalizedItems;
  const featured = normalizedFeatured.length ? normalizedFeatured : items.slice(0, 2);

  const tags = Array.from(
    new Set(
      (blueprint.filters?.tags ?? [])
        .concat(items.flatMap((item) => item.tags ?? []))
        .map((value) => (value ? value.toString().trim() : null))
        .filter(Boolean),
    ),
  );
  const formats = Array.from(
    new Set(
      (blueprint.filters?.formats ?? [])
        .concat(items.map((item) => item.format ?? item.type))
        .map((value) => (value ? value.toString().trim() : null))
        .filter(Boolean),
    ),
  );

  const savedCount = blueprint.stats?.savedCount ?? items.reduce((total, item) => total + toNumber(item.metrics?.saves, 0), 0);
  const downloads24h =
    blueprint.stats?.downloads24h ?? items.reduce((total, item) => total + toNumber(item.metrics?.downloads24h, 0), 0);

  return {
    items,
    featured,
    stats: {
      totalItems: blueprint.stats?.totalItems ?? items.length,
      savedCount,
      downloads24h,
    },
    filters: {
      tags,
      formats,
    },
  };
}

function mapGroupRecord(group, { memberCount, membership, blueprint }) {
  const settings = group.settings ?? {};
  const metadata = isPlainObject(group.metadata) ? group.metadata : {};

  const summary =
    metadata.summary || blueprint.summary || group.description || 'A Gigvora community group.';
  const joinPolicy = normalizeJoinPolicy(
    metadata.joinPolicy,
    settings.joinPolicy,
    blueprint.joinPolicy,
    group.memberPolicy,
  );
  const focusAreas = unique([...(metadata.focusAreas ?? []), ...(blueprint.focusAreas ?? [])]);
  const metrics = { ...(blueprint.metrics ?? {}), ...(metadata.metrics ?? {}) };
  const insights = { ...(blueprint.insights ?? {}), ...(metadata.insights ?? {}) };
  const events = mergeUniqueBy(
    (metadata.upcomingEvents ?? []).map((event) => ({
      ...event,
      startAt: normalizeTemporalValue(event.startAt),
    })),
    (blueprint.upcomingEvents ?? []).map((event) => ({
      ...event,
      startAt: normalizeTemporalValue(event.startAt),
    })),
    (event) => event?.id ?? `${event?.title}-${event?.startAt}`,
  );
  const timeline = mergeUniqueBy(
    (metadata.timeline ?? []).map((entry) => ({
      ...entry,
      occursAt: normalizeTemporalValue(entry.occursAt),
    })),
    (blueprint.timeline ?? []).map((entry) => ({
      ...entry,
      occursAt: normalizeTemporalValue(entry.occursAt),
    })),
    (entry) => entry?.id ?? `${entry?.label}-${entry?.occursAt}`,
  );
  const leadership = mergeUniqueBy(metadata.leadership ?? [], blueprint.leadership ?? [], (leader) => leader?.name ?? leader?.title);
  const guidelines = unique([...(metadata.guidelines ?? []), ...(blueprint.guidelines ?? [])]);
  const allowedUserTypesSource = [
    ...(Array.isArray(metadata.allowedUserTypes) ? metadata.allowedUserTypes : []),
    ...(Array.isArray(settings.allowedUserTypes) ? settings.allowedUserTypes : []),
    ...(Array.isArray(blueprint.allowedUserTypes) ? blueprint.allowedUserTypes : []),
  ];
  const allowedUserTypes =
    allowedUserTypesSource.length > 0 ? unique(allowedUserTypesSource) : [...DEFAULT_ALLOWED_USER_TYPES];

  const resourceSources = mergeUniqueBy(
    metadata.resources ?? [],
    blueprint.resources ?? [],
    (resource) => resource?.id ?? resource?.url ?? resource?.title,
  );
  const discussionBoardSource = metadata.discussionBoard ?? blueprint.discussionBoard ?? {};
  const resourceLibrarySource = metadata.resourceLibrary ?? blueprint.resourceLibrary ?? {};
  const discussionBoard = normalizeDiscussionBoard(discussionBoardSource);
  const resourceLibrary = normalizeResourceLibrary(resourceLibrarySource, resourceSources);

  const legacyResources = resourceLibrary.items.length
    ? resourceLibrary.items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type ?? item.format,
        url: item.url,
      }))
    : resourceSources;

  const baselineMembers = metadata.baselineMembers ?? blueprint.baselineMembers ?? 0;
  const effectiveMemberCount = memberCount ?? baselineMembers;
  const engagementScore = computeEngagementScore({
    memberCount: effectiveMemberCount,
    metrics,
  });

  return {
    id: group.id,
    slug: blueprint.key || group.slug || slugify(group.name || `group-${group.id}`),
    name: group.name,
    summary,
    description: group.description || summary,
    accentColor: metadata.accentColor || blueprint.accentColor || group.avatarColor || '#2563EB',
    focusAreas,
    joinPolicy,
    allowedUserTypes,
    membership: buildMembershipState({ membership, joinPolicy }),
    stats: {
      memberCount: effectiveMemberCount,
      weeklyActiveMembers: toNumber(
        metrics.weeklyActiveMembers,
        Math.round(effectiveMemberCount * 0.25),
      ),
      opportunitiesSharedThisWeek: toNumber(metrics.opportunitiesSharedThisWeek, 0),
      retentionRate: Number(toNumber(metrics.retentionRate, 0.9).toFixed(2)),
      engagementScore,
    },
    insights: {
      signalStrength: insights.signalStrength || 'steady',
      trendingTopics: insights.trendingTopics || [],
    },
    upcomingEvents: events,
    leadership,
    resources: legacyResources,
    guidelines,
    timeline,
    metadata: {
      baselineMembers,
    },
    discussionBoard,
    resourceLibrary,
  };
}

function formatResponseDuration(minutes, fallback = '4h') {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  if (value < 90) {
    return `${Math.max(1, Math.round(value))}m`;
  }
  if (value < 60 * 24) {
    return `${Math.max(1, Math.round(value / 60))}h`;
  }
  return `${Math.max(1, Math.round(value / (60 * 24)))}d`;
}

function mapPostToThread(post, slug, metrics) {
  if (!post) {
    return null;
  }
  const plain = post.get ? post.get({ plain: true }) : post;
  const metadata = isPlainObject(plain.metadata) ? plain.metadata : {};
  const author = sanitizeUser(post.createdBy ?? plain.createdBy);
  const title = plain.title ?? 'Community thread';
  const excerptSource = plain.summary || (typeof plain.content === 'string' ? plain.content : '');
  const excerpt = excerptSource
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags
    : Array.isArray(metadata.topics)
    ? metadata.topics
    : [];
  const participantIds = Array.isArray(metadata.participantIds)
    ? metadata.participantIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    : [];
  const replies = toNumber(metadata.replyCount ?? metadata.commentCount, 0);
  const participantCount = toNumber(
    metadata.participantCount,
    participantIds.length || toNumber(metadata.participants?.length, 0),
  );
  const upvotes = toNumber(metadata.appreciations ?? metadata.upvotes ?? metadata.likes, 0);
  const lastActivityAt =
    toIsoString(metadata.lastActivityAt) ||
    toIsoString(plain.updatedAt) ||
    toIsoString(plain.publishedAt) ||
    toIsoString(plain.createdAt);
  const lastReplyAt = toIsoString(metadata.lastReplyAt);
  const publishedAt = toIsoString(plain.publishedAt) || toIsoString(plain.createdAt);
  const responseMinutes = toNumber(
    metadata.medianReplyMinutes ?? metadata.firstResponseMinutes,
    Number.NaN,
  );
  const isAnswered = Boolean(metadata.isAnswered ?? metadata.resolution === 'answered');
  const isUnresolved = metadata.isUnresolved ?? (!isAnswered && metadata.status !== 'resolved');

  if (metrics) {
    const now = Date.now();
    const lastActivityTime = lastActivityAt ? Date.parse(lastActivityAt) : Number.NaN;
    if (Number.isFinite(lastActivityTime)) {
      const seventyTwoHoursAgo = now - 72 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      if (lastActivityTime >= seventyTwoHoursAgo) {
        if (plain.createdById) {
          metrics.activeContributors.add(Number(plain.createdById));
        }
        participantIds.forEach((id) => metrics.activeContributors.add(id));
      }
      if (lastActivityTime >= sevenDaysAgo) {
        metrics.newThreads += 1;
      }
    }
    if (!isAnswered && isUnresolved !== false) {
      metrics.unresolved += 1;
    }
    if (Number.isFinite(responseMinutes) && responseMinutes > 0) {
      metrics.responseMinutes.push(responseMinutes);
    }
    tags.forEach((tag) => metrics.tags.add(tag));
  }

  const authorName =
    (author?.name && author.name.trim()) ||
    [author?.firstName, author?.lastName].filter(Boolean).join(' ').trim() ||
    null;

  return {
    id: plain.id,
    title,
    excerpt,
    category: metadata.category ?? metadata.type ?? 'Discussion',
    author: authorName ? { name: authorName } : null,
    replies,
    participants: participantCount,
    upvotes,
    tags,
    lastActivityAt,
    lastReplyAt,
    publishedAt,
    isAnswered,
    isUnresolved,
    unread: Boolean(metadata.unread),
    pinned: Boolean(metadata.pinned),
    url: metadata.url ?? `/groups/${slug}/posts/${plain.slug}`,
  };
}

async function composeDiscussionBoard({ group, record, baseBoard }) {
  if (!group?.id) {
    return baseBoard;
  }

  const posts = await GroupPost.findAll({
    where: { groupId: group.id, status: 'published' },
    order: [
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: 60,
    include: [
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'title'],
      },
    ],
  });

  if (!posts.length) {
    return baseBoard;
  }

  const metrics = {
    activeContributors: new Set(),
    unresolved: 0,
    newThreads: 0,
    responseMinutes: [],
    tags: new Set(baseBoard.tags ?? []),
  };

  const dbThreads = posts
    .map((post) => mapPostToThread(post, record.slug, metrics))
    .filter(Boolean);

  if (!dbThreads.length) {
    return baseBoard;
  }

  const pinnedFromDb = dbThreads.filter((thread) => thread.pinned);
  const regularThreads = dbThreads.filter((thread) => !thread.pinned);

  const mergedPinned = mergeUniqueBy(pinnedFromDb, baseBoard.pinned ?? [], (thread) => thread.id);
  const mergedThreads = mergeUniqueBy(regularThreads, baseBoard.threads ?? [], (thread) => thread.id);

  const activeCount = Math.max(baseBoard.stats?.activeContributors ?? 0, metrics.activeContributors.size);
  const unresolvedCount = Math.max(baseBoard.stats?.unresolvedCount ?? 0, metrics.unresolved);
  const newThreads = Math.max(baseBoard.stats?.newThreads ?? 0, metrics.newThreads);
  const averageResponseMinutes = metrics.responseMinutes.length
    ? metrics.responseMinutes.reduce((total, value) => total + value, 0) / metrics.responseMinutes.length
    : null;

  const participationRatio = record.stats?.memberCount
    ? Math.min(1, activeCount / Math.max(record.stats.memberCount, 1))
    : null;

  const tags = unique([
    ...metrics.tags,
    ...(baseBoard.tags ?? []),
    ...dbThreads.flatMap((thread) => thread.tags ?? []),
  ]);

  const trendingTags = unique([
    ...(baseBoard.trendingTags ?? []),
    ...tags,
  ]);

  return {
    ...baseBoard,
    stats: {
      activeContributors: activeCount,
      unresolvedCount,
      newThreads,
    },
    tags,
    trendingTags,
    pinned: mergedPinned,
    threads: mergedThreads,
    health: {
      responseTime: formatResponseDuration(averageResponseMinutes, baseBoard.health?.responseTime ?? '4h'),
      participation:
        participationRatio != null
          ? `${Math.max(1, Math.round(participationRatio * 100))}%`
          : baseBoard.health?.participation ?? '65%',
    },
  };
}

function composeResourceLibrary({ group, baseLibrary }) {
  const metadata = isPlainObject(group.metadata) ? group.metadata : {};
  const metadataLibrary = normalizeResourceLibrary(metadata.resourceLibrary ?? {}, metadata.resources ?? []);

  const items = mergeUniqueBy(
    metadataLibrary.items ?? [],
    baseLibrary?.items ?? [],
    (item) => item?.id ?? item?.url ?? item?.title,
  );

  const featured = mergeUniqueBy(
    metadataLibrary.featured ?? [],
    baseLibrary?.featured ?? [],
    (item) => item?.id ?? item?.url ?? item?.title,
  );

  const finalFeatured = featured.length ? featured : items.slice(0, 2);
  const savedCount = items.reduce((total, item) => total + toNumber(item.metrics?.saves, 0), 0);
  const downloads24h = items.reduce((total, item) => total + toNumber(item.metrics?.downloads24h, 0), 0);

  const tags = unique([
    ...(baseLibrary?.filters?.tags ?? []),
    ...(metadataLibrary.filters?.tags ?? []),
    ...items.flatMap((item) => item.tags ?? []),
    ...finalFeatured.flatMap((item) => item.tags ?? []),
  ]);

  const formats = unique([
    ...(baseLibrary?.filters?.formats ?? []),
    ...(metadataLibrary.filters?.formats ?? []),
    ...items.map((item) => item.format ?? item.type).filter(Boolean),
  ]);

  return {
    items,
    featured: finalFeatured,
    stats: {
      totalItems: items.length,
      savedCount: Math.max(savedCount, baseLibrary?.stats?.savedCount ?? 0, metadataLibrary.stats?.savedCount ?? 0),
      downloads24h: Math.max(
        downloads24h,
        baseLibrary?.stats?.downloads24h ?? 0,
        metadataLibrary.stats?.downloads24h ?? 0,
      ),
    },
    filters: {
      tags,
      formats,
    },
  };
}

async function hydrateGroupProfile(record, group, { blueprint }) {
  const baseBoard = record.discussionBoard ?? normalizeDiscussionBoard(blueprint.discussionBoard ?? {});
  const baseLibrary =
    record.resourceLibrary ?? normalizeResourceLibrary(blueprint.resourceLibrary ?? {}, blueprint.resources ?? []);

  const discussionBoard = await composeDiscussionBoard({ group, record, baseBoard });
  const resourceLibrary = composeResourceLibrary({ group, baseLibrary });

  return {
    ...record,
    discussionBoard,
    resourceLibrary,
    resources: resourceLibrary.items.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type ?? item.format,
      url: item.url,
    })),
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

  return hydrateGroupProfile(record, group, { blueprint });
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

  const [membershipRecord, membershipCreated] = await GroupMembership.findOrCreate({
    where: { groupId: group.id, userId: user.id },
    defaults: {
      role,
      status: 'active',
      joinedAt: new Date(),
      metadata: {
        notifications: { digest: true, newThread: true, upcomingEvent: true },
      },
    },
  });

  if (!membershipCreated) {
    let changed = false;
    if (membershipRecord.role !== role) {
      membershipRecord.role = role;
      changed = true;
    }
    if (membershipRecord.status !== 'active') {
      membershipRecord.status = 'active';
      changed = true;
    }
    if (!membershipRecord.joinedAt) {
      membershipRecord.joinedAt = new Date();
      changed = true;
    }
    const metadata = isPlainObject(membershipRecord.metadata) ? membershipRecord.metadata : {};
    if (!metadata.notifications) {
      membershipRecord.metadata = {
        ...metadata,
        notifications: { digest: true, newThread: true, upcomingEvent: true },
      };
      changed = true;
    }
    if (changed) {
      await membershipRecord.save();
    }
  }

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
const GROUP_MANAGER_MEMBERSHIP_ROLES = new Set(['owner', 'moderator']);

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

async function assertGroupManagerAccess(groupId, actorId, { transaction } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  const actor = await assertActor(actorId);
  const membership = await GroupMembership.findOne({
    where: { groupId, userId: actor.id, status: 'active' },
    transaction,
  });
  if (!membership || !GROUP_MANAGER_MEMBERSHIP_ROLES.has(membership.role)) {
    throw new AuthorizationError('You do not have permission to manage this group.');
  }
  return { actor, membership };
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

function normalizeEmail(value, label = 'email') {
  if (!value) {
    throw new ValidationError(`A valid ${label} is required.`);
  }
  const email = value.toString().trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ValidationError(`The ${label} provided is not a valid email address.`);
  }
  return email;
}

function normaliseInviteStatus(status) {
  if (!status) {
    return 'pending';
  }
  const normalized = status.toString().toLowerCase();
  if (!ALLOWED_INVITE_STATUSES.has(normalized)) {
    throw new ValidationError('Unsupported invite status.');
  }
  return normalized;
}

function normalisePostStatus(status) {
  if (!status) {
    return 'draft';
  }
  const normalized = status.toString().toLowerCase();
  if (!ALLOWED_GROUP_POST_STATUSES.has(normalized)) {
    throw new ValidationError('Unsupported post status.');
  }
  return normalized;
}

function normalisePostVisibility(visibility) {
  if (!visibility) {
    return 'members';
  }
  const normalized = visibility.toString().toLowerCase();
  if (!ALLOWED_GROUP_POST_VISIBILITIES.has(normalized)) {
    throw new ValidationError('Unsupported post visibility option.');
  }
  return normalized;
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

function sanitizeInvite(invite) {
  if (!invite) {
    return null;
  }
  const plain = invite.get ? invite.get({ plain: true }) : invite;
  return {
    id: plain.id,
    groupId: plain.groupId,
    email: plain.email,
    role: plain.role,
    status: plain.status,
    token: plain.token,
    message: plain.message ?? null,
    expiresAt: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
    invitedById: plain.invitedById ?? null,
    invitedBy: sanitizeUser(plain.invitedBy ?? plain.InvitedBy),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
  };
}

function sanitizeGroupPost(post) {
  if (!post) {
    return null;
  }
  const plain = post.get ? post.get({ plain: true }) : post;
  return {
    id: plain.id,
    groupId: plain.groupId,
    title: plain.title,
    slug: plain.slug,
    summary: plain.summary ?? null,
    content: plain.content ?? '',
    status: plain.status,
    visibility: plain.visibility,
    attachments: plain.attachments ?? [],
    scheduledAt: plain.scheduledAt ? new Date(plain.scheduledAt).toISOString() : null,
    publishedAt: plain.publishedAt ? new Date(plain.publishedAt).toISOString() : null,
    createdById: plain.createdById ?? null,
    updatedById: plain.updatedById ?? null,
    createdBy: sanitizeUser(plain.createdBy ?? plain.CreatedBy),
    updatedBy: sanitizeUser(plain.updatedBy ?? plain.UpdatedBy),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
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

function normaliseMembershipStatuses(statuses) {
  if (statuses == null) {
    return ['active'];
  }

  const rawArray = Array.isArray(statuses) ? statuses : [statuses];
  const uniqueStatuses = unique(
    rawArray
      .map((status) => status?.toString().trim().toLowerCase())
      .filter((status) => status && status.length > 0),
  );

  if (!uniqueStatuses.length) {
    return null;
  }

  return uniqueStatuses.map((status) => {
    if (!GROUP_MEMBERSHIP_STATUSES.includes(status)) {
      throw new ValidationError(`Unsupported membership status filter: ${status}`);
    }
    return status;
  });
}

function buildMembershipStatusWhere(statuses) {
  if (!statuses || !statuses.length) {
    return undefined;
  }
  if (statuses.length === 1) {
    return statuses[0];
  }
  return { [Op.in]: statuses };
}

export async function listMemberGroups({
  actorId,
  statuses,
  search,
  includeMembers = false,
  page = 1,
  pageSize = 20,
  sort = 'recent',
} = {}) {
  if (!actorId) {
    throw new AuthorizationError('Authentication required to list member groups.');
  }

  const normalisedStatuses = normaliseMembershipStatuses(statuses);
  const parsedPageSize = Math.min(50, Math.max(1, Number.parseInt(pageSize, 10) || 20));
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const offset = (parsedPage - 1) * parsedPageSize;
  const trimmedSearch = search?.toString().trim();

  const membershipWhere = { userId: actorId };
  const membershipStatusWhere = buildMembershipStatusWhere(normalisedStatuses);
  if (membershipStatusWhere) {
    membershipWhere.status = membershipStatusWhere;
  }

  const groupWhere = {};
  if (trimmedSearch) {
    const like = `%${trimmedSearch}%`;
    groupWhere[Op.or] = [
      { name: { [Op.iLike ?? Op.like]: like } },
      { description: { [Op.iLike ?? Op.like]: like } },
      { slug: { [Op.iLike ?? Op.like]: like } },
    ];
  }

  const groupMembershipInclude = {
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
  };

  const groupInclude = [
    groupMembershipInclude,
    { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
  ];

  const orderClauses = [];
  const normalisedSort = sort?.toString().trim().toLowerCase();
  if (normalisedSort === 'alpha') {
    orderClauses.push([{ model: Group, as: 'group' }, 'name', 'ASC']);
  } else if (normalisedSort === 'activity') {
    orderClauses.push([{ model: Group, as: 'group' }, 'updatedAt', 'DESC']);
  } else {
    orderClauses.push(['joinedAt', 'DESC']);
  }

  const [membershipsResult, statusBreakdown] = await Promise.all([
    GroupMembership.findAndCountAll({
      where: membershipWhere,
      include: [
        { model: Group, as: 'group', required: true, where: groupWhere, include: groupInclude },
        { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      ],
      distinct: true,
      order: orderClauses,
      limit: parsedPageSize,
      offset,
    }),
    GroupMembership.findAll({
      attributes: ['status', [fn('COUNT', col('status')), 'count']],
      where: { userId: actorId },
      group: ['status'],
    }),
  ]);

  const statusTotals = GROUP_MEMBERSHIP_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  for (const row of statusBreakdown) {
    const plain = row.get ? row.get({ plain: true }) : row;
    if (plain.status && typeof plain.count !== 'undefined') {
      statusTotals[plain.status] = Number(plain.count) || 0;
    }
  }

  const total = typeof membershipsResult.count === 'number' ? membershipsResult.count : membershipsResult.count.length;
  const totalPages = Math.max(1, Math.ceil(total / parsedPageSize));

  const data = membershipsResult.rows.map((membership) => ({
    membership: sanitizeMembership(membership),
    group: sanitizeGroup(membership.group, { includeMembers }),
    joinedAt: membership.joinedAt ? new Date(membership.joinedAt).toISOString() : null,
    lastActivityAt: membership.group?.updatedAt ? new Date(membership.group.updatedAt).toISOString() : null,
  }));

  return {
    data,
    meta: {
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
      totalPages,
      sort: normalisedSort === 'alpha' || normalisedSort === 'activity' ? normalisedSort : 'recent',
    },
    filters: {
      statuses: normalisedStatuses ?? null,
      search: trimmedSearch || null,
    },
    breakdown: {
      statuses: statusTotals,
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

export async function createUserGroup(payload = {}, { actorId } = {}) {
  const actor = await assertActor(actorId);
  const name = payload?.name?.toString().trim();
  if (!name) {
    throw new ValidationError('Group name is required.');
  }

  return sequelize.transaction(async (transaction) => {
    const slug = await resolveUniqueSlug(payload?.slug || name, { transaction });
    const visibility = normalizeEnum(payload?.visibility || 'public', GROUP_VISIBILITIES, 'visibility');
    const memberPolicy = normalizeEnum(payload?.memberPolicy || 'request', GROUP_MEMBER_POLICIES, 'member policy');
    const avatarColor = normalizeColour(payload?.avatarColor);
    const description = payload?.description?.toString().trim() || null;
    const bannerImageUrl = payload?.bannerImageUrl?.toString().trim() || null;
    const settings = payload?.settings ?? null;
    const metadata = payload?.metadata ?? null;

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
        createdById: actor.id,
        updatedById: actor.id,
      },
      { transaction },
    );

    await GroupMembership.create(
      {
        groupId: group.id,
        userId: actor.id,
        role: GROUP_MEMBERSHIP_ROLES.includes(payload?.ownerRole) ? payload.ownerRole : 'owner',
        status: 'active',
        invitedById: actor.id,
        joinedAt: new Date(),
      },
      { transaction },
    );

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

export async function updateUserGroup(groupId, payload = {}, { actorId } = {}) {
  await assertGroupManagerAccess(groupId, actorId);
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

    if (Object.keys(updates).length === 0) {
      return sanitizeGroup(group);
    }

    await group.update(updates, { transaction });
    const reloaded = await loadGroup(groupId, { includeMembers: true, transaction });
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

export async function listGroupInvites(groupId, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const invites = await GroupInvite.findAll({
    where: { groupId },
    include: [{ model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
    order: [['createdAt', 'DESC']],
  });
  return invites.map((invite) => sanitizeInvite(invite));
}

export async function createGroupInvite(groupId, payload = {}, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  const { actor } = await assertGroupManagerAccess(groupId, actorId);

  return sequelize.transaction(async (transaction) => {
    const email = normalizeEmail(payload.email);
    const role = payload.role ? normalizeEnum(payload.role, GROUP_MEMBERSHIP_ROLES, 'invite role') : 'member';
    const status = payload.status ? normaliseInviteStatus(payload.status) : 'pending';
    const message = payload.message?.toString().trim() || null;
    const expiresAt = payload.expiresAt
      ? new Date(payload.expiresAt)
      : new Date(Date.now() + DEFAULT_INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new ValidationError('Invalid invite expiry date.');
    }

    const existingMembership = await GroupMembership.findOne({
      where: { groupId },
      include: [
        {
          model: User,
          as: 'member',
          where: { email },
          required: true,
          attributes: ['id'],
        },
      ],
      transaction,
    });

    if (existingMembership) {
      throw new ConflictError('This user is already a member of the group.');
    }

    const existingInvite = await GroupInvite.findOne({ where: { groupId, email }, transaction });

    let invite;
    if (existingInvite) {
      existingInvite.role = role;
      existingInvite.status = status;
      existingInvite.message = message;
      existingInvite.invitedById = actor.id;
      existingInvite.expiresAt = expiresAt;
      existingInvite.metadata = {
        ...(existingInvite.metadata ?? {}),
        ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
      };
      await existingInvite.save({ transaction });
      invite = existingInvite;
    } else {
      invite = await GroupInvite.create(
        {
          groupId,
          email,
          role,
          status,
          message,
          invitedById: actor.id,
          expiresAt,
          metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null,
        },
        { transaction },
      );
    }

    await invite.reload({
      include: [{ model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] }],
      transaction,
    });

    return sanitizeInvite(invite);
  });
}

export async function cancelGroupInvite(groupId, inviteId, { actorId } = {}) {
  if (!groupId || !inviteId) {
    throw new ValidationError('groupId and inviteId are required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const invite = await GroupInvite.findOne({ where: { id: inviteId, groupId } });
  if (!invite) {
    throw new NotFoundError('Group invite not found.');
  }
  await invite.destroy();
  return { success: true };
}

export async function listGroupPosts(groupId, { actorId, limit = 25, status } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const query = { groupId };
  if (status) {
    query.status = normalisePostStatus(status);
  }
  const records = await GroupPost.findAll({
    where: query,
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 1, 1), 100),
  });
  return records.map((record) => sanitizeGroupPost(record));
}

export async function createGroupPost(groupId, payload = {}, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  const { actor } = await assertGroupManagerAccess(groupId, actorId);
  const title = payload.title?.toString().trim();
  if (!title) {
    throw new ValidationError('A title is required to create a post.');
  }
  const content = payload.content?.toString() ?? '';
  if (!content.trim()) {
    throw new ValidationError('Post content cannot be empty.');
  }

  const status = normalisePostStatus(payload.status);
  const visibility = normalisePostVisibility(payload.visibility);
  const summary = payload.summary?.toString().trim() || null;
  const scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    throw new ValidationError('Invalid scheduledAt value.');
  }
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : null;
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : null;

  const post = await GroupPost.create(
    {
      groupId,
      title,
      content,
      summary,
      status,
      visibility,
      scheduledAt,
      attachments,
      metadata,
      createdById: actor.id,
      updatedById: actor.id,
    },
    { returning: true },
  );

  await post.reload({
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  return sanitizeGroupPost(post);
}

export async function updateGroupPost(groupId, postId, payload = {}, { actorId } = {}) {
  if (!groupId || !postId) {
    throw new ValidationError('groupId and postId are required.');
  }
  const { actor } = await assertGroupManagerAccess(groupId, actorId);

  const post = await GroupPost.findOne({
    where: { id: postId, groupId },
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  if (!post) {
    throw new NotFoundError('Group post not found.');
  }

  if (payload.title !== undefined) {
    const title = payload.title?.toString().trim();
    if (!title) {
      throw new ValidationError('Title cannot be empty.');
    }
    post.title = title;
  }
  if (payload.content !== undefined) {
    const content = payload.content?.toString() ?? '';
    if (!content.trim()) {
      throw new ValidationError('Post content cannot be empty.');
    }
    post.content = content;
  }
  if (payload.summary !== undefined) {
    post.summary = payload.summary?.toString().trim() || null;
  }
  if (payload.status !== undefined) {
    post.status = normalisePostStatus(payload.status);
  }
  if (payload.visibility !== undefined) {
    post.visibility = normalisePostVisibility(payload.visibility);
  }
  if (payload.scheduledAt !== undefined) {
    if (!payload.scheduledAt) {
      post.scheduledAt = null;
    } else {
      const scheduledAt = new Date(payload.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new ValidationError('Invalid scheduledAt value.');
      }
      post.scheduledAt = scheduledAt;
    }
  }
  if (payload.attachments !== undefined) {
    post.attachments = Array.isArray(payload.attachments) ? payload.attachments : null;
  }
  if (payload.metadata !== undefined && typeof payload.metadata === 'object') {
    post.metadata = payload.metadata;
  }

  post.updatedById = actor.id;
  await post.save();
  await post.reload({
    include: [
      { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'updatedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });

  return sanitizeGroupPost(post);
}

export async function deleteGroupPost(groupId, postId, { actorId } = {}) {
  if (!groupId || !postId) {
    throw new ValidationError('groupId and postId are required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const post = await GroupPost.findOne({ where: { id: postId, groupId } });
  if (!post) {
    throw new NotFoundError('Group post not found.');
  }
  await post.destroy();
  return { success: true };
}

export async function listGroupMemberships(groupId, { actorId } = {}) {
  if (!groupId) {
    throw new ValidationError('groupId is required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const memberships = await GroupMembership.findAll({
    where: { groupId },
    include: [
      { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  return memberships.map((membership) => sanitizeMembership(membership));
}

export async function updateGroupMembership(groupId, membershipId, payload = {}, { actorId } = {}) {
  if (!groupId || !membershipId) {
    throw new ValidationError('groupId and membershipId are required.');
  }
  await assertGroupManagerAccess(groupId, actorId);
  const membership = await GroupMembership.findOne({
    where: { id: membershipId, groupId },
    include: [
      { model: User, as: 'member', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
      { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'email', 'userType'] },
    ],
  });
  if (!membership) {
    throw new NotFoundError('Group membership not found.');
  }

  if (payload.role !== undefined) {
    if (!GROUP_MEMBERSHIP_ROLES.includes(payload.role)) {
      throw new ValidationError('Unsupported group role.');
    }
    membership.role = payload.role;
  }

  if (payload.status !== undefined) {
    const status = payload.status?.toString().trim();
    if (!GROUP_MEMBERSHIP_STATUSES.includes(status)) {
      throw new ValidationError('Unsupported membership status.');
    }
    membership.status = status;
    if (status === 'active' && !membership.joinedAt) {
      membership.joinedAt = new Date();
    }
  }

  if (payload.notes !== undefined) {
    membership.notes = payload.notes?.toString().trim() || null;
  }

  if (payload.metadata !== undefined && typeof payload.metadata === 'object') {
    membership.metadata = payload.metadata;
  }

  await membership.save();
  return sanitizeMembership(membership);
}

export const __testing = {
  slugify,
  unique,
  toNumber,
  asBoolean,
  minutesFromNow,
  resolveBlueprint,
  buildMembershipState,
  computeEngagementScore,
  mapGroupRecord,
  GROUP_BLUEPRINTS,
};

export default {
  listMemberGroups,
  listGroups,
  getGroupProfile,
  joinGroup,
  leaveGroup,
  updateMembershipSettings,
  discoverGroups,
  getGroup,
  createGroup,
  createUserGroup,
  updateGroup,
  updateUserGroup,
  addMember,
  updateMember,
  removeMember,
  requestMembership,
  listGroupInvites,
  createGroupInvite,
  cancelGroupInvite,
  listGroupPosts,
  createGroupPost,
  updateGroupPost,
  deleteGroupPost,
  listGroupMemberships,
  updateGroupMembership,
};
