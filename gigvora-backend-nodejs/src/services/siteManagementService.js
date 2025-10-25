import { Op } from 'sequelize';

import {
  SiteSetting,
  SitePage,
  SiteNavigationLink,
  SITE_PAGE_STATUSES,
  sequelize,
} from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const SITE_SETTINGS_KEY = 'site:global';

const DEFAULT_HERO_KEYWORDS = [
  'Launchpad demo streaming · Creation Studio',
  'Mentorship session going live · Design ops',
  'Product squad aligning roadmap · Remote',
  'Trust operations clearing escrow · Finance',
  'Agency pods sharing wins · Atlas Collective',
  'Volunteer mission kicking off · Impact hub',
];

const DEFAULT_HERO_MEDIA = {
  imageUrl: 'https://cdn.gigvora.com/marketing/home/hero-still.jpg',
  posterUrl: 'https://cdn.gigvora.com/marketing/home/hero-poster.jpg',
  alt: 'Gigvora workspace with cross-functional collaborators reviewing milestones.',
  caption: 'Operations, finance, and delivery stay in lockstep with Gigvora.',
  autoPlay: true,
  muted: true,
  loop: true,
  videoSources: [
    {
      src: 'https://cdn.gigvora.com/marketing/home/hero-preview.mp4',
      type: 'video/mp4',
    },
    {
      src: 'https://cdn.gigvora.com/marketing/home/hero-preview.webm',
      type: 'video/webm',
    },
  ],
};

const DEFAULT_COMMUNITY_STATS = [
  { label: 'Global specialists', value: '12,400+' },
  { label: 'Average NPS', value: '68' },
  { label: 'Completion rate', value: '97%' },
];

const DEFAULT_PERSONA_JOURNEYS = [
  {
    key: 'freelancer',
    title: 'Freelancers',
    description: 'Package your skills, auto-match to gigs, and get paid without the chase.',
    icon: 'SparklesIcon',
    route: '/dashboard/freelancer',
    ctaLabel: 'Enter freelancer HQ',
    tone: 'daylight',
    steps: [
      { label: 'Glow up your portfolio', icon: 'SparklesIcon' },
      { label: 'Auto-match to gigs', icon: 'CursorArrowRaysIcon' },
      { label: 'Celebrate payouts fast', icon: 'BanknotesIcon' },
    ],
    metrics: [
      { label: 'Active missions', value: '1.8k' },
      { label: 'Avg. payout speed', value: '48 hrs' },
    ],
  },
  {
    key: 'agency',
    title: 'Agencies',
    description: 'Run squads like clockwork with pods, CRM views, and predictable cash flow.',
    icon: 'GlobeAltIcon',
    route: '/dashboard/agency',
    ctaLabel: 'Scale your agency ops',
    tone: 'midnight',
    steps: [
      { label: 'Publish your service pods', icon: 'Squares2X2Icon' },
      { label: 'Spin up collab rooms', icon: 'UserGroupIcon' },
      { label: 'Track revenue pulses', icon: 'ChartBarIcon' },
    ],
    metrics: [
      { label: 'Pods launched', value: '320' },
      { label: 'Avg. cycle time', value: '6.5 days' },
    ],
  },
  {
    key: 'company',
    title: 'Companies',
    description: 'Brief the network, assemble dream teams, and follow delivery from hello to handoff.',
    icon: 'BuildingOffice2Icon',
    route: '/dashboard/company',
    ctaLabel: 'Build your dream team',
    tone: 'daylight',
    steps: [
      { label: 'Publish a playful brief', icon: 'MegaphoneIcon' },
      { label: 'Auto-match experts', icon: 'BoltIcon' },
      { label: 'Track delivery signals', icon: 'ClipboardDocumentCheckIcon' },
    ],
    metrics: [
      { label: 'Teams assembled', value: '540' },
      { label: 'Launch success rate', value: '96%' },
    ],
  },
  {
    key: 'mentor',
    title: 'Mentors',
    description: 'Host office hours, drop feedback, and keep mentees levelling up.',
    icon: 'AcademicCapIcon',
    route: '/dashboard/mentor',
    ctaLabel: 'Host mentor magic',
    tone: 'daylight',
    steps: [
      { label: 'Set your office hours', icon: 'CalendarDaysIcon' },
      { label: 'Match with seekers', icon: 'LightBulbIcon' },
      { label: 'Share feedback loops', icon: 'ChatBubbleBottomCenterTextIcon' },
    ],
    metrics: [
      { label: 'Sessions hosted', value: '4.3k' },
      { label: 'Avg. rating', value: '4.8/5' },
    ],
  },
  {
    key: 'launchpad',
    title: 'Launchpad leads',
    description: 'Kickstart cohorts, rally builders, and keep every sprint energised.',
    icon: 'RocketLaunchIcon',
    route: '/dashboard/launchpad',
    ctaLabel: 'Launch a cohort',
    tone: 'daylight',
    steps: [
      { label: 'Craft your cohort space', icon: 'SparklesIcon' },
      { label: 'Invite your crew', icon: 'UserGroupIcon' },
      { label: 'Track momentum arcs', icon: 'ChartBarSquareIcon' },
    ],
    metrics: [
      { label: 'Cohorts active', value: '112' },
      { label: 'Avg. completion', value: '89%' },
    ],
  },
  {
    key: 'volunteer',
    title: 'Volunteers',
    description: 'Find causes, join missions, and leave every community brighter.',
    icon: 'HeartIcon',
    route: '/search?category=volunteering',
    ctaLabel: 'Find a mission',
    tone: 'daylight',
    steps: [
      { label: 'Spot causes you love', icon: 'HeartIcon' },
      { label: 'Join micro-sprints', icon: 'HandRaisedIcon' },
      { label: 'Share ripple stories', icon: 'SparklesIcon' },
    ],
    metrics: [
      { label: 'Missions joined', value: '780' },
      { label: 'Impact hours', value: '26k' },
    ],
  },
];

const DEFAULT_PERSONA_METRICS = [
  { persona: 'freelancer', label: 'Avg. satisfaction', value: '4.8/5' },
  { persona: 'freelancer', label: 'Opportunities matched', value: '22 per member' },
  { persona: 'agency', label: 'Pods launched last quarter', value: '320' },
  { persona: 'company', label: 'Time-to-invite', value: '48 hrs' },
  { persona: 'mentor', label: 'Office hours booked', value: '3.4k' },
  { persona: 'launchpad', label: 'Launch velocity lift', value: '+34%' },
  { persona: 'volunteer', label: 'Impact rating', value: '4.9/5' },
];

const DEFAULT_OPERATIONS_SUMMARY = {
  escrowHealth: {
    label: 'Escrow health',
    value: '99.2% uptime',
    change: '+1.4%',
    trend: [74, 82, 88, 91, 95, 98, 99],
  },
  disputeVelocity: {
    label: 'Dispute velocity',
    value: '3.2 hrs median',
    change: '-22%',
    trend: [18, 16, 14, 12, 9, 7, 6],
  },
  evidencePipelines: {
    label: 'Evidence pipelines',
    value: '87% automated',
    change: '+9%',
    trend: [45, 48, 56, 62, 70, 78, 84],
  },
};

const DEFAULT_RECENT_POSTS = [
  {
    id: 'ops-heartbeat',
    title: 'Ops heartbeat: escrow clear and launches tracking green',
    summary: 'Finance, trust, and delivery signals are trending up after this week’s velocity push.',
    type: 'update',
    authorName: 'Ops desk',
    authorHeadline: 'Operations control tower',
    createdAt: '2024-10-01T09:00:00.000Z',
  },
  {
    id: 'mentor-lounge',
    title: 'Mentor lounge: design ops AMA starting',
    summary: 'Join the live design ops session—slots are filling fast with agency partners and mentees.',
    type: 'launchpad',
    authorName: 'Mentor guild',
    authorHeadline: 'Community mentoring hub',
    createdAt: '2024-10-02T11:00:00.000Z',
  },
  {
    id: 'launchpad-demo',
    title: 'Launchpad demo: product squad forming for robotics rollout',
    summary: 'Case study cohort invites specialists in robotics, compliance, and data storytelling.',
    type: 'project',
    authorName: 'Launchpad studio',
    authorHeadline: 'Creation studio spotlight',
    createdAt: '2024-10-03T14:00:00.000Z',
  },
];

function coerceString(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  const text = `${value}`.trim();
  return text.length ? text : fallback;
}

function coerceBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'n'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
}

function coerceInteger(value, fallback = 0) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  return Number.isNaN(numeric) ? fallback : numeric;
}

function coerceOptionalString(value, fallback = '') {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }
  return fallback;
}

function normalizeSlug(value) {
  return coerceOptionalString(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function sanitizeStringArray(list, fallback = []) {
  if (!Array.isArray(list)) {
    return [...fallback];
  }
  const cleaned = list
    .map((item) => coerceOptionalString(item))
    .filter((item) => item.length > 0)
    .slice(0, 12);
  return cleaned.length ? cleaned : [...fallback];
}

function sanitizeHeroMedia(media = {}, fallback = {}) {
  const source = media && typeof media === 'object' ? media : {};
  const base = fallback && typeof fallback === 'object' ? fallback : {};
  const merged = {
    imageUrl: coerceOptionalString(source.imageUrl, base.imageUrl ?? ''),
    posterUrl: coerceOptionalString(source.posterUrl, base.posterUrl ?? ''),
    alt: coerceOptionalString(source.alt, base.alt ?? ''),
    caption: coerceOptionalString(source.caption, base.caption ?? ''),
    autoPlay: coerceBoolean(source.autoPlay, base.autoPlay ?? true),
    muted: coerceBoolean(source.muted, base.muted ?? true),
    loop: coerceBoolean(source.loop, base.loop ?? true),
    controls: coerceBoolean(source.controls, base.controls ?? false),
  };

  const primaryVideoUrl = coerceOptionalString(source.videoUrl, base.videoUrl ?? '');
  const primaryVideoType = coerceOptionalString(source.videoType, base.videoType ?? 'video/mp4');
  if (primaryVideoUrl) {
    merged.videoUrl = primaryVideoUrl;
    merged.videoType = primaryVideoType || 'video/mp4';
  }

  const sources = Array.isArray(source.videoSources) ? source.videoSources : Array.isArray(base.videoSources) ? base.videoSources : [];
  merged.videoSources = sources
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const src = coerceOptionalString(entry.src ?? entry.url);
      if (!src) {
        return null;
      }
      const type = coerceOptionalString(entry.type, 'video/mp4');
      return { src, type };
    })
    .filter(Boolean)
    .slice(0, 4);

  return merged;
}

function sanitizeCommunityStats(stats, fallback = []) {
  const baseline = Array.isArray(fallback) ? fallback : [];
  const incoming = Array.isArray(stats) ? stats : [];
  const cleaned = incoming
    .map((entry) => ({
      label: coerceOptionalString(entry?.label ?? entry?.name, ''),
      value: coerceOptionalString(entry?.value ?? entry?.metric, ''),
    }))
    .filter((entry) => entry.label && entry.value)
    .slice(0, 6);
  return cleaned.length ? cleaned : baseline;
}

function sanitizePersonaSteps(steps, fallback = []) {
  const base = Array.isArray(fallback) ? fallback : [];
  const source = Array.isArray(steps) ? steps : [];
  if (!source.length) {
    return base.map((step) => ({ label: step.label, icon: coerceOptionalString(step.icon) }));
  }
  return source
    .map((step, index) => {
      const fallbackStep = base[index] ?? base[0] ?? {};
      const label = coerceOptionalString(step?.label ?? step?.title ?? step?.name, fallbackStep.label ?? '');
      if (!label) {
        return null;
      }
      const icon = coerceOptionalString(step?.icon ?? fallbackStep.icon ?? 'SparklesIcon');
      return { label, icon };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function sanitizePersonaMetrics(metrics, fallback = []) {
  if (!metrics) {
    return Array.isArray(fallback) ? fallback : [];
  }

  const toArray = Array.isArray(metrics)
    ? metrics
    : Object.entries(metrics).flatMap(([key, value]) => {
        const list = Array.isArray(value) ? value : [value];
        return list.map((entry) => ({ ...entry, persona: entry?.persona ?? key }));
      });

  const cleaned = toArray
    .map((entry) => {
      const persona = normalizeSlug(entry?.persona ?? entry?.key ?? entry?.id);
      const label = coerceOptionalString(entry?.label ?? entry?.title ?? entry?.name, '');
      const value = coerceOptionalString(entry?.value ?? entry?.metric ?? entry?.copy, '');
      const change = coerceOptionalString(entry?.change ?? entry?.delta, '');
      if (!persona || !label || !value) {
        return null;
      }
      const metric = { persona, label, value };
      if (change) {
        metric.change = change;
      }
      return metric;
    })
    .filter(Boolean)
    .slice(0, 20);

  return cleaned.length ? cleaned : Array.isArray(fallback) ? fallback : [];
}

function sanitizePersonaJourneys(journeys, fallback = []) {
  const base = Array.isArray(fallback) ? fallback : [];
  const source = Array.isArray(journeys) ? journeys : base;

  const byKey = new Map();
  base.forEach((entry) => {
    const key = normalizeSlug(entry.key);
    if (key) {
      byKey.set(key, { ...entry });
    }
  });

  source.forEach((entry, index) => {
    const candidateKey = normalizeSlug(entry?.key ?? entry?.id ?? entry?.slug ?? entry?.persona ?? entry?.name);
    if (!candidateKey) {
      return;
    }
    const fallbackEntry = byKey.get(candidateKey) ?? base[index] ?? {};
    const resolved = {
      key: candidateKey,
      title: coerceOptionalString(entry?.title ?? entry?.name, fallbackEntry?.title ?? ''),
      description: coerceOptionalString(entry?.description ?? entry?.copy, fallbackEntry?.description ?? ''),
      icon: coerceOptionalString(entry?.icon ?? fallbackEntry?.icon ?? 'SparklesIcon'),
      route: coerceOptionalString(entry?.route ?? entry?.href ?? entry?.url, fallbackEntry?.route ?? `/dashboard/${candidateKey}`),
      ctaLabel: coerceOptionalString(entry?.ctaLabel ?? entry?.cta ?? entry?.ctaText, fallbackEntry?.ctaLabel ?? ''),
      tone: coerceOptionalString(entry?.tone ?? entry?.theme, fallbackEntry?.tone ?? 'daylight'),
      steps: sanitizePersonaSteps(entry?.steps, fallbackEntry?.steps ?? []),
      metrics: sanitizePersonaMetrics(entry?.metrics, fallbackEntry?.metrics ?? []),
      source: coerceOptionalString(entry?.source, fallbackEntry?.source ?? 'settings'),
    };
    byKey.set(candidateKey, resolved);
  });

  return Array.from(byKey.values()).slice(0, base.length || 6);
}

function sanitizeOperationsSummary(summary, fallback = {}) {
  const base = fallback && typeof fallback === 'object' ? fallback : {};
  const source = summary && typeof summary === 'object' ? summary : {};

  const sanitizeMetric = (metric, key) => {
    const defaultMetric = base[key] ?? {};
    const label = coerceOptionalString(metric?.label ?? defaultMetric.label, defaultMetric.label ?? '');
    const value = coerceOptionalString(metric?.value ?? metric?.metric, defaultMetric.value ?? '');
    const change = coerceOptionalString(metric?.change ?? metric?.delta, defaultMetric.change ?? '');
    const trendSource = Array.isArray(metric?.trend) ? metric.trend : defaultMetric.trend;
    const trend = Array.isArray(trendSource)
      ? trendSource
          .map((item) => {
            const numeric = Number(item);
            return Number.isFinite(numeric) ? numeric : null;
          })
          .filter((value) => value !== null)
          .slice(0, 14)
      : undefined;
    return {
      label,
      value,
      change,
      trend: trend && trend.length ? trend : defaultMetric.trend ?? [],
    };
  };

  return {
    escrowHealth: sanitizeMetric(source.escrowHealth, 'escrowHealth'),
    disputeVelocity: sanitizeMetric(source.disputeVelocity, 'disputeVelocity'),
    evidencePipelines: sanitizeMetric(source.evidencePipelines, 'evidencePipelines'),
  };
}

function sanitizeRecentPosts(posts, fallback = []) {
  const base = Array.isArray(fallback) ? fallback : [];
  const incoming = Array.isArray(posts) ? posts : [];
  const cleaned = incoming
    .map((post, index) => {
      const fallbackPost = base[index] ?? {};
      const id = coerceOptionalString(post?.id ?? fallbackPost.id ?? `post-${index + 1}`);
      const title = coerceOptionalString(post?.title ?? post?.headline, fallbackPost.title ?? '');
      const summary = coerceOptionalString(post?.summary ?? post?.content ?? post?.body, fallbackPost.summary ?? '');
      const type = normalizeSlug(post?.type ?? post?.category ?? fallbackPost.type ?? 'update') || 'update';
      const authorName = coerceOptionalString(post?.authorName ?? post?.author?.name, fallbackPost.authorName ?? '');
      const authorHeadline = coerceOptionalString(
        post?.authorHeadline ?? post?.author?.headline ?? post?.author?.title,
        fallbackPost.authorHeadline ?? '',
      );
      const createdAt = coerceOptionalString(post?.createdAt ?? post?.publishedAt ?? fallbackPost.createdAt ?? '');
      if (!title || !summary) {
        return null;
      }
      return {
        id,
        title,
        summary,
        type,
        authorName: authorName || 'Gigvora community',
        authorHeadline: authorHeadline || 'Marketplace community update',
        avatarUrl: coerceOptionalString(post?.avatarUrl ?? post?.author?.avatarUrl ?? fallbackPost.avatarUrl),
        avatarSeed: coerceOptionalString(post?.avatarSeed ?? post?.author?.id ?? fallbackPost.avatarSeed ?? id),
        createdAt: createdAt || fallbackPost.createdAt || null,
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return cleaned.length ? cleaned : base;
}

function normalizeRoles(value) {
  if (!value) {
    return [];
  }
  const source = Array.isArray(value) ? value : `${value}`.split(',');
  const unique = new Set();
  source.forEach((item) => {
    if (typeof item !== 'string') {
      return;
    }
    const trimmed = item.trim();
    if (!trimmed) {
      return;
    }
    unique.add(trimmed.toLowerCase());
  });
  return Array.from(unique);
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function slugify(value) {
  return coerceString(value, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 150);
}

function buildDefaultSiteSettings() {
  return {
    siteName: coerceString(process.env.SITE_NAME, 'Gigvora'),
    tagline: coerceString(process.env.SITE_TAGLINE, 'Where global operators build together'),
    domain: coerceString(process.env.SITE_DOMAIN, 'gigvora.com'),
    primaryColor: coerceString(process.env.SITE_PRIMARY_COLOR, '#2563eb'),
    accentColor: coerceString(process.env.SITE_ACCENT_COLOR, '#f97316'),
    supportEmail: coerceString(process.env.SITE_SUPPORT_EMAIL, 'support@gigvora.com'),
    supportPhone: coerceString(process.env.SITE_SUPPORT_PHONE),
    hero: {
      title: coerceString(process.env.SITE_HERO_TITLE, 'Launch high-trust squads in days'),
      subtitle: coerceString(
        process.env.SITE_HERO_SUBTITLE,
        'Gigvora orchestrates hiring, payments, and trust so your operators can ship outcomes.',
      ),
      backgroundImageUrl: coerceString(process.env.SITE_HERO_IMAGE_URL),
      backgroundImageAlt: coerceString(process.env.SITE_HERO_IMAGE_ALT),
      ctaLabel: coerceString(process.env.SITE_HERO_CTA_LABEL, 'Book a demo'),
      ctaUrl: coerceString(process.env.SITE_HERO_CTA_URL, 'https://gigvora.com/demo'),
    },
    assets: {
      logoUrl: coerceString(process.env.SITE_LOGO_URL),
      faviconUrl: coerceString(process.env.SITE_FAVICON_URL),
    },
    seo: {
      defaultTitle: coerceString(process.env.SITE_SEO_TITLE, 'Gigvora — Enterprise talent network'),
      defaultDescription: coerceString(
        process.env.SITE_SEO_DESCRIPTION,
        'Gigvora connects mission-aligned builders with ready-to-ship operators backed by trust infrastructure.',
      ),
      socialImageUrl: coerceString(process.env.SITE_SOCIAL_IMAGE_URL),
    },
    social: {
      twitter: coerceString(process.env.SITE_TWITTER_URL),
      linkedin: coerceString(process.env.SITE_LINKEDIN_URL),
      youtube: coerceString(process.env.SITE_YOUTUBE_URL),
      instagram: coerceString(process.env.SITE_INSTAGRAM_URL),
    },
    announcement: {
      enabled: coerceBoolean(process.env.SITE_ANNOUNCEMENT_ENABLED, false),
      message: coerceString(process.env.SITE_ANNOUNCEMENT_MESSAGE),
      linkLabel: coerceString(process.env.SITE_ANNOUNCEMENT_LINK_LABEL),
      linkUrl: coerceString(process.env.SITE_ANNOUNCEMENT_LINK_URL),
    },
    footer: {
      links: [],
      copyright: coerceString(process.env.SITE_FOOTER_COPYRIGHT, '© {year} Gigvora. All rights reserved.'),
    },
    heroHeadline: coerceString(
      process.env.SITE_HERO_HEADLINE,
      'Freelancers, agencies, and companies build unstoppable momentum together.',
    ),
    heroSubheading: coerceString(
      process.env.SITE_HERO_SUBHEADING,
      'Gigvora orchestrates hiring, payments, and trust so every initiative ships without friction.',
    ),
    heroKeywords: [...DEFAULT_HERO_KEYWORDS],
    heroMedia: { ...DEFAULT_HERO_MEDIA },
    communityStats: [...DEFAULT_COMMUNITY_STATS],
    personaJourneys: [...DEFAULT_PERSONA_JOURNEYS],
    personaMetrics: [...DEFAULT_PERSONA_METRICS],
    operationsSummary: { ...DEFAULT_OPERATIONS_SUMMARY },
    recentPosts: [...DEFAULT_RECENT_POSTS],
  };
}

function sanitizeFooterLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }
  const sanitized = [];
  links.forEach((link) => {
    const label = coerceString(link?.label);
    const url = coerceString(link?.url);
    if (!label || !url) {
      return;
    }
    sanitized.push({
      id: link?.id ?? null,
      label,
      url,
      description: coerceString(link?.description),
      icon: coerceString(link?.icon),
      orderIndex: coerceInteger(link?.orderIndex, sanitized.length),
    });
  });
  return sanitized;
}

function sanitizeSettingsCandidate(candidate = {}) {
  const baseline = buildDefaultSiteSettings();
  const settings = { ...baseline, ...candidate };
  settings.hero = { ...baseline.hero, ...(candidate.hero ?? {}) };
  settings.assets = { ...baseline.assets, ...(candidate.assets ?? {}) };
  settings.seo = { ...baseline.seo, ...(candidate.seo ?? {}) };
  settings.social = { ...baseline.social, ...(candidate.social ?? {}) };
  settings.announcement = { ...baseline.announcement, ...(candidate.announcement ?? {}) };
  settings.footer = { ...baseline.footer, ...(candidate.footer ?? {}) };
  settings.footer.links = sanitizeFooterLinks(settings.footer.links);
  settings.heroHeadline = coerceString(candidate.heroHeadline, baseline.heroHeadline);
  settings.heroSubheading = coerceString(candidate.heroSubheading, baseline.heroSubheading);
  settings.heroKeywords = sanitizeStringArray(candidate.heroKeywords ?? candidate.hero?.keywords, baseline.heroKeywords);
  settings.heroMedia = sanitizeHeroMedia(candidate.heroMedia ?? candidate.hero?.media, baseline.heroMedia);
  settings.communityStats = sanitizeCommunityStats(candidate.communityStats, baseline.communityStats);
  settings.personaJourneys = sanitizePersonaJourneys(candidate.personaJourneys, baseline.personaJourneys);
  settings.personaMetrics = sanitizePersonaMetrics(candidate.personaMetrics, baseline.personaMetrics);
  settings.operationsSummary = sanitizeOperationsSummary(candidate.operationsSummary, baseline.operationsSummary);
  settings.recentPosts = sanitizeRecentPosts(candidate.recentPosts, baseline.recentPosts);
  return settings;
}

async function ensureSiteSetting({ transaction } = {}) {
  const existing = await SiteSetting.findOne({ where: { key: SITE_SETTINGS_KEY }, transaction });
  if (existing) {
    return existing;
  }
  const defaults = buildDefaultSiteSettings();
  return SiteSetting.create(
    {
      key: SITE_SETTINGS_KEY,
      value: defaults,
    },
    { transaction },
  );
}

function normalizeNavigationPayload(payload = {}, { forUpdate = false } = {}) {
  const label = coerceString(payload.label);
  const url = coerceString(payload.url);
  if (!label) {
    throw new ValidationError('Navigation label is required.');
  }
  if (!url) {
    throw new ValidationError('Navigation URL is required.');
  }
  const menuKey = coerceString(payload.menuKey, 'primary').toLowerCase();
  const orderIndex = coerceInteger(payload.orderIndex, 0);
  const allowedRoles = normalizeRoles(payload.allowedRoles);
  return {
    ...(forUpdate ? {} : { menuKey }),
    menuKey,
    label,
    url,
    description: coerceString(payload.description),
    icon: coerceString(payload.icon),
    orderIndex,
    isExternal: coerceBoolean(payload.isExternal, false),
    openInNewTab: coerceBoolean(payload.openInNewTab, false),
    allowedRoles,
    parentId: payload.parentId ?? null,
  };
}

function normalizePagePayload(payload = {}) {
  const title = coerceString(payload.title);
  if (!title) {
    throw new ValidationError('Page title is required.');
  }
  const slug = slugify(payload.slug || title);
  if (!slug) {
    throw new ValidationError('A slug is required to publish the page.');
  }
  const status = coerceString(payload.status, 'draft');
  if (!SITE_PAGE_STATUSES.includes(status)) {
    throw new ValidationError(`Status must be one of ${SITE_PAGE_STATUSES.join(', ')}.`);
  }
  const featureHighlights = Array.isArray(payload.featureHighlights)
    ? payload.featureHighlights.map((item) => coerceString(item)).filter(Boolean)
    : [];
  const seoKeywords = Array.isArray(payload.seoKeywords)
    ? payload.seoKeywords.map((item) => coerceString(item)).filter(Boolean)
    : [];
  const lastReviewedAt = coerceDate(payload.lastReviewedAt);
  return {
    slug,
    title,
    summary: coerceString(payload.summary),
    heroTitle: coerceString(payload.heroTitle),
    heroSubtitle: coerceString(payload.heroSubtitle),
    heroEyebrow: coerceString(payload.heroEyebrow),
    heroMeta: coerceString(payload.heroMeta),
    heroImageUrl: coerceString(payload.heroImageUrl),
    heroImageAlt: coerceString(payload.heroImageAlt),
    ctaLabel: coerceString(payload.ctaLabel),
    ctaUrl: coerceString(payload.ctaUrl),
    layout: coerceString(payload.layout, 'standard'),
    body: payload.body ?? null,
    featureHighlights,
    seoTitle: coerceString(payload.seoTitle),
    seoDescription: coerceString(payload.seoDescription),
    seoKeywords,
    thumbnailUrl: coerceString(payload.thumbnailUrl),
    contactEmail: coerceString(payload.contactEmail),
    contactPhone: coerceString(payload.contactPhone),
    jurisdiction: coerceString(payload.jurisdiction),
    version: coerceString(payload.version),
    lastReviewedAt,
    status,
    allowedRoles: normalizeRoles(payload.allowedRoles),
  };
}

export async function getSiteManagementOverview() {
  const [settingsModel, navigationLinks, pages] = await Promise.all([
    ensureSiteSetting(),
    SiteNavigationLink.findAll({ order: [['menuKey', 'ASC'], ['orderIndex', 'ASC'], ['id', 'ASC']] }),
    SitePage.findAll({ order: [['updatedAt', 'DESC']] }),
  ]);

  const navigation = navigationLinks.reduce((acc, link) => {
    const bucket = link.menuKey ?? 'primary';
    if (!acc[bucket]) {
      acc[bucket] = [];
    }
    acc[bucket].push(link.toPublicObject());
    return acc;
  }, {});

  const pageObjects = pages.map((page) => page.toPublicObject());
  const stats = {
    published: pageObjects.filter((page) => page.status === 'published').length,
    draft: pageObjects.filter((page) => page.status !== 'published').length,
  };

  return {
    settings: settingsModel.value ?? buildDefaultSiteSettings(),
    navigation,
    pages: pageObjects,
    stats,
    updatedAt: new Date().toISOString(),
  };
}

export async function getSiteSettings() {
  const model = await ensureSiteSetting();
  return sanitizeSettingsCandidate(model.value ?? {});
}

export async function getSiteNavigation({ menuKey } = {}) {
  const where = {};
  if (menuKey) {
    where.menuKey = `${menuKey}`.trim();
  }

  const links = await SiteNavigationLink.findAll({
    where,
    order: [
      ['menuKey', 'ASC'],
      ['orderIndex', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return links.map((link) => link.toPublicObject());
}

export async function saveSiteSettings(patch = {}) {
  const sanitized = sanitizeSettingsCandidate(patch);
  const result = await sequelize.transaction(async (transaction) => {
    const setting = await ensureSiteSetting({ transaction });
    setting.value = sanitized;
    await setting.save({ transaction });
    return setting;
  });
  return { settings: result.toPublicObject().value, updatedAt: result.updatedAt };
}

export async function createNavigation(payload = {}) {
  const normalized = normalizeNavigationPayload(payload);
  const link = await SiteNavigationLink.create(normalized);
  return link.toPublicObject();
}

export async function updateNavigation(linkId, patch = {}) {
  const link = await SiteNavigationLink.findByPk(linkId);
  if (!link) {
    throw new NotFoundError('Navigation link not found.');
  }
  const normalized = normalizeNavigationPayload({ ...link.get({ plain: true }), ...patch }, { forUpdate: true });
  Object.assign(link, normalized);
  await link.save();
  return link.toPublicObject();
}

export async function deleteNavigation(linkId) {
  const deleted = await SiteNavigationLink.destroy({ where: { id: linkId } });
  if (!deleted) {
    throw new NotFoundError('Navigation link not found.');
  }
  return { success: true };
}

export async function createSitePage(payload = {}) {
  const normalized = normalizePagePayload(payload);
  const page = await sequelize.transaction(async (transaction) => {
    const existing = await SitePage.findOne({ where: { slug: normalized.slug }, transaction });
    if (existing) {
      throw new ValidationError('A page with this slug already exists.');
    }
    const created = await SitePage.create(
      {
        ...normalized,
        publishedAt: normalized.status === 'published' ? new Date() : null,
      },
      { transaction },
    );
    return created;
  });
  return page.toPublicObject();
}

export async function updateSitePageById(pageId, patch = {}) {
  if (!pageId) {
    throw new ValidationError('pageId is required.');
  }
  return sequelize.transaction(async (transaction) => {
    const page = await SitePage.findByPk(pageId, { transaction });
    if (!page) {
      throw new NotFoundError('Page not found.');
    }
    const mergedPayload = { ...page.toPublicObject(), ...patch };
    const normalized = normalizePagePayload(mergedPayload);
    if (normalized.slug !== page.slug) {
      const clash = await SitePage.findOne({
        where: { slug: normalized.slug, id: { [Op.ne]: pageId } },
        transaction,
      });
      if (clash) {
        throw new ValidationError('Another page already uses this slug.');
      }
    }
    const wasPublished = page.status === 'published';
    const willBePublished = normalized.status === 'published';
    Object.assign(page, normalized);
    if (willBePublished && !wasPublished) {
      page.publishedAt = new Date();
    }
    if (!willBePublished && wasPublished && normalized.status !== 'published') {
      page.publishedAt = page.publishedAt ?? null;
    }
    await page.save({ transaction });
    return page.toPublicObject();
  });
}

export async function deleteSitePageById(pageId) {
  if (!pageId) {
    throw new ValidationError('pageId is required.');
  }
  const deleted = await SitePage.destroy({ where: { id: pageId } });
  if (!deleted) {
    throw new NotFoundError('Page not found.');
  }
  return { success: true };
}

export async function listSitePages({
  status = 'published',
  includeDrafts = false,
  limit = 50,
  offset = 0,
  order = [['publishedAt', 'DESC'], ['updatedAt', 'DESC']],
} = {}) {
  const where = {};
  if (!includeDrafts) {
    const statuses = Array.isArray(status) ? status : [status];
    const sanitised = statuses.map((value) => coerceString(value)).filter((value) => value && value !== 'all');
    where.status = sanitised.length ? sanitised : ['published'];
  } else if (status && status !== 'all') {
    where.status = Array.isArray(status)
      ? status.map((value) => coerceString(value)).filter(Boolean)
      : [coerceString(status)].filter(Boolean);
  }

  const pages = await SitePage.findAll({
    where,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    offset: Number.isFinite(offset) && offset > 0 ? offset : undefined,
    order,
  });

  return pages.map((page) => page.toPublicObject());
}

export async function getPublishedSitePage(slug, { allowDraft = false } = {}) {
  const normalisedSlug = coerceString(slug);
  if (!normalisedSlug) {
    throw new ValidationError('A slug is required.');
  }

  const where = { slug: normalisedSlug };
  if (!allowDraft) {
    where.status = 'published';
  }

  const page = await SitePage.findOne({ where });
  if (!page) {
    throw new NotFoundError('Page not found.');
  }
  return page.toPublicObject();
}

