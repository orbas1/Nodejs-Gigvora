'use strict';

const SITE_SETTINGS_KEY = 'site:global';

const DEFAULT_FRAGMENT = {
  heroHeadline: 'Freelancers, agencies, and companies build unstoppable momentum together.',
  heroSubheading:
    'Gigvora orchestrates hiring, payments, and trust so every initiative ships without friction.',
  heroKeywords: [
    'Launchpad demo streaming · Creation Studio',
    'Mentorship session going live · Design ops',
    'Product squad aligning roadmap · Remote',
    'Trust operations clearing escrow · Finance',
    'Agency pods sharing wins · Atlas Collective',
    'Volunteer mission kicking off · Impact hub',
  ],
  heroMedia: {
    imageUrl: 'https://cdn.gigvora.com/marketing/home/hero-still.jpg',
    posterUrl: 'https://cdn.gigvora.com/marketing/home/hero-poster.jpg',
    alt: 'Gigvora workspace with cross-functional collaborators reviewing milestones.',
    caption: 'Operations, finance, and delivery stay in lockstep with Gigvora.',
    autoPlay: true,
    muted: true,
    loop: true,
    controls: false,
    videoSources: [
      { src: 'https://cdn.gigvora.com/marketing/home/hero-preview.mp4', type: 'video/mp4' },
      { src: 'https://cdn.gigvora.com/marketing/home/hero-preview.webm', type: 'video/webm' },
    ],
  },
  communityStats: [
    { label: 'Global specialists', value: '12,400+' },
    { label: 'Average NPS', value: '68' },
    { label: 'Completion rate', value: '97%' },
  ],
  personaJourneys: [
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
  ],
  personaMetrics: [
    { persona: 'freelancer', label: 'Avg. satisfaction', value: '4.8/5' },
    { persona: 'freelancer', label: 'Opportunities matched', value: '22 per member' },
    { persona: 'agency', label: 'Pods launched last quarter', value: '320' },
    { persona: 'company', label: 'Time-to-invite', value: '48 hrs' },
    { persona: 'mentor', label: 'Office hours booked', value: '3.4k' },
    { persona: 'launchpad', label: 'Launch velocity lift', value: '+34%' },
    { persona: 'volunteer', label: 'Impact rating', value: '4.9/5' },
  ],
  operationsSummary: {
    escrowHealth: { label: 'Escrow health', value: '99.2% uptime', change: '+1.4%', trend: [74, 82, 88, 91, 95, 98, 99] },
    disputeVelocity: { label: 'Dispute velocity', value: '3.2 hrs median', change: '-22%', trend: [18, 16, 14, 12, 9, 7, 6] },
    evidencePipelines: { label: 'Evidence pipelines', value: '87% automated', change: '+9%', trend: [45, 48, 56, 62, 70, 78, 84] },
  },
  recentPosts: [
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
  ],
};

const safeString = (value, fallback = '') => {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const safeBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(lowered)) return true;
    if (['false', '0', 'no', 'n'].includes(lowered)) return false;
  }
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value !== 0;
    }
  }
  return fallback;
};

const safeNumberArray = (values, fallback = []) => {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const cleaned = values
    .map((value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    })
    .filter((value) => value !== null)
    .slice(0, 14);
  return cleaned.length ? cleaned : [...fallback];
};

const safeStringArray = (values, fallback = [], { limit = 12 } = {}) => {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const cleaned = values
    .map((value) => safeString(value))
    .filter((value) => value.length > 0)
    .slice(0, limit);
  return cleaned.length ? cleaned : [...fallback];
};

const normalizeKey = (value, fallback) => {
  const source = safeString(value, fallback || '');
  return source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
};

const sanitizeVideoSources = (sources, fallback = []) => {
  const list = Array.isArray(sources) ? sources : fallback;
  const cleaned = list
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const src = safeString(entry.src ?? entry.url, '');
      if (!src) {
        return null;
      }
      return {
        src,
        type: safeString(entry.type, 'video/mp4'),
      };
    })
    .filter(Boolean)
    .slice(0, 4);
  return cleaned.length ? cleaned : [...fallback];
};

const sanitizeHeroMedia = (media) => {
  const base = DEFAULT_FRAGMENT.heroMedia;
  const source = media && typeof media === 'object' ? media : {};
  const merged = {
    imageUrl: safeString(source.imageUrl, base.imageUrl),
    posterUrl: safeString(source.posterUrl, base.posterUrl),
    alt: safeString(source.alt, base.alt),
    caption: safeString(source.caption, base.caption),
    autoPlay: safeBoolean(source.autoPlay, base.autoPlay),
    muted: safeBoolean(source.muted, base.muted),
    loop: safeBoolean(source.loop, base.loop),
    controls: safeBoolean(source.controls, base.controls),
    videoSources: sanitizeVideoSources(source.videoSources, base.videoSources),
  };
  const primaryVideoUrl = safeString(source.videoUrl, base.videoUrl || '');
  if (primaryVideoUrl) {
    merged.videoUrl = primaryVideoUrl;
    merged.videoType = safeString(source.videoType, 'video/mp4');
  } else if (base.videoUrl) {
    merged.videoUrl = base.videoUrl;
    merged.videoType = safeString(base.videoType, 'video/mp4');
  }
  return merged;
};

const sanitizeCommunityStats = (stats) => {
  const source = Array.isArray(stats) ? stats : [];
  const cleaned = source
    .map((entry) => ({
      label: safeString(entry?.label ?? entry?.name, ''),
      value: safeString(entry?.value ?? entry?.metric, ''),
    }))
    .filter((entry) => entry.label && entry.value)
    .slice(0, DEFAULT_FRAGMENT.communityStats.length);
  return cleaned.length ? cleaned : DEFAULT_FRAGMENT.communityStats;
};

const sanitizePersonaSteps = (steps, fallback = []) => {
  const list = Array.isArray(steps) ? steps : fallback;
  return list
    .map((step, index) => {
      const base = fallback[index] ?? fallback[0] ?? {};
      const label = safeString(step?.label ?? step?.title ?? step?.name, base.label || '');
      if (!label) {
        return null;
      }
      return {
        label,
        icon: safeString(step?.icon ?? base.icon ?? 'SparklesIcon'),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
};

const sanitizePersonaMetrics = (metrics, fallback = []) => {
  if (!metrics) {
    return [...fallback];
  }
  const list = Array.isArray(metrics)
    ? metrics
    : Object.entries(metrics).flatMap(([key, value]) => {
        const entries = Array.isArray(value) ? value : [value];
        return entries.map((entry) => ({ ...entry, persona: entry?.persona ?? key }));
      });
  const cleaned = list
    .map((entry) => {
      const persona = normalizeKey(entry?.persona ?? entry?.key ?? entry?.id, '');
      const label = safeString(entry?.label ?? entry?.title ?? entry?.name, '');
      const value = safeString(entry?.value ?? entry?.metric ?? entry?.copy, '');
      const change = safeString(entry?.change ?? entry?.delta, '');
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
  return cleaned.length ? cleaned : [...fallback];
};

const sanitizePersonaJourneys = (journeys) => {
  const fallback = DEFAULT_FRAGMENT.personaJourneys;
  const map = new Map();
  fallback.forEach((entry) => {
    map.set(entry.key, { ...entry });
  });
  const list = Array.isArray(journeys) ? journeys : [];
  list.forEach((entry, index) => {
    const key = normalizeKey(entry?.key ?? entry?.id ?? entry?.persona ?? entry?.name, fallback[index]?.key);
    if (!key) {
      return;
    }
    const baseline = map.get(key) ?? fallback[index] ?? fallback[0];
    map.set(key, {
      key,
      title: safeString(entry?.title ?? entry?.name, baseline.title),
      description: safeString(entry?.description ?? entry?.copy, baseline.description),
      icon: safeString(entry?.icon ?? baseline.icon, 'SparklesIcon'),
      route: safeString(entry?.route ?? entry?.href ?? entry?.url, baseline.route),
      ctaLabel: safeString(entry?.ctaLabel ?? entry?.cta ?? entry?.ctaText, baseline.ctaLabel),
      tone: safeString(entry?.tone ?? entry?.theme, baseline.tone),
      steps: sanitizePersonaSteps(entry?.steps, baseline.steps),
      metrics: sanitizePersonaMetrics(entry?.metrics, baseline.metrics),
      source: safeString(entry?.source, baseline.source || 'settings'),
    });
  });
  return Array.from(map.values()).slice(0, fallback.length);
};

const sanitizeOperationsSummary = (summary) => {
  const fallback = DEFAULT_FRAGMENT.operationsSummary;
  const source = summary && typeof summary === 'object' ? summary : {};
  const sanitizeMetric = (metric, key) => {
    const base = fallback[key] ?? {};
    return {
      label: safeString(metric?.label ?? base.label, base.label),
      value: safeString(metric?.value ?? metric?.metric, base.value),
      change: safeString(metric?.change ?? metric?.delta, base.change),
      trend: safeNumberArray(metric?.trend, base.trend || []),
    };
  };
  return {
    escrowHealth: sanitizeMetric(source.escrowHealth, 'escrowHealth'),
    disputeVelocity: sanitizeMetric(source.disputeVelocity, 'disputeVelocity'),
    evidencePipelines: sanitizeMetric(source.evidencePipelines, 'evidencePipelines'),
  };
};

const sanitizeRecentPosts = (posts) => {
  const fallback = DEFAULT_FRAGMENT.recentPosts;
  const list = Array.isArray(posts) ? posts : [];
  const cleaned = list
    .map((entry, index) => {
      const base = fallback[index] ?? {};
      const title = safeString(entry?.title ?? entry?.headline, base.title || '');
      const summary = safeString(entry?.summary ?? entry?.content ?? entry?.body, base.summary || '');
      if (!title || !summary) {
        return null;
      }
      return {
        id: safeString(entry?.id, base.id || `post-${index + 1}`),
        title,
        summary,
        type: normalizeKey(entry?.type ?? entry?.category, base.type || 'update') || 'update',
        authorName: safeString(entry?.authorName ?? entry?.author?.name, base.authorName || 'Gigvora community'),
        authorHeadline: safeString(
          entry?.authorHeadline ?? entry?.author?.headline ?? entry?.author?.title,
          base.authorHeadline || 'Marketplace community update',
        ),
        avatarUrl: safeString(entry?.avatarUrl ?? entry?.author?.avatarUrl, base.avatarUrl || ''),
        avatarSeed: safeString(entry?.avatarSeed ?? entry?.author?.id, base.avatarSeed || base.id || `post-${index + 1}`),
        createdAt: safeString(entry?.createdAt ?? entry?.publishedAt, base.createdAt || ''),
      };
    })
    .filter(Boolean)
    .slice(0, fallback.length);
  return cleaned.length ? cleaned : fallback;
};

const mergeSettings = (current = {}) => {
  const merged = { ...current };
  merged.heroHeadline = safeString(current.heroHeadline, DEFAULT_FRAGMENT.heroHeadline);
  merged.heroSubheading = safeString(current.heroSubheading, DEFAULT_FRAGMENT.heroSubheading);
  merged.heroKeywords = safeStringArray(current.heroKeywords, DEFAULT_FRAGMENT.heroKeywords, { limit: 12 });
  merged.heroMedia = sanitizeHeroMedia(current.heroMedia);
  merged.communityStats = sanitizeCommunityStats(current.communityStats);
  merged.personaJourneys = sanitizePersonaJourneys(current.personaJourneys);
  merged.personaMetrics = sanitizePersonaMetrics(current.personaMetrics, DEFAULT_FRAGMENT.personaMetrics);
  merged.operationsSummary = sanitizeOperationsSummary(current.operationsSummary);
  merged.recentPosts = sanitizeRecentPosts(current.recentPosts);
  return merged;
};

const stripFragment = (current = {}) => {
  const clone = { ...current };
  delete clone.heroHeadline;
  delete clone.heroSubheading;
  delete clone.heroKeywords;
  delete clone.heroMedia;
  delete clone.communityStats;
  delete clone.personaJourneys;
  delete clone.personaMetrics;
  delete clone.operationsSummary;
  delete clone.recentPosts;
  return clone;
};

const parseSettings = (value) => {
  if (value == null) {
    return {};
  }
  if (typeof value === 'object') {
    return { ...value };
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const serializeSettings = (value) => JSON.stringify(value);

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [record] = await queryInterface.sequelize.query(
        'SELECT id, value FROM site_settings WHERE key = :key LIMIT 1',
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
          replacements: { key: SITE_SETTINGS_KEY },
        },
      );

      if (record) {
        const parsed = parseSettings(record.value);
        const merged = mergeSettings(parsed);
        await queryInterface.sequelize.query(
          'UPDATE site_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id',
          {
            transaction,
            replacements: { value: serializeSettings(merged), id: record.id },
          },
        );
      } else {
        const merged = mergeSettings({});
        await queryInterface.bulkInsert(
          'site_settings',
          [
            {
              key: SITE_SETTINGS_KEY,
              value: serializeSettings(merged),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [record] = await queryInterface.sequelize.query(
        'SELECT id, value FROM site_settings WHERE key = :key LIMIT 1',
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction,
          replacements: { key: SITE_SETTINGS_KEY },
        },
      );

      if (record) {
        const parsed = parseSettings(record.value);
        const stripped = stripFragment(parsed);
        await queryInterface.sequelize.query(
          'UPDATE site_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id',
          {
            transaction,
            replacements: { value: serializeSettings(stripped), id: record.id },
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
