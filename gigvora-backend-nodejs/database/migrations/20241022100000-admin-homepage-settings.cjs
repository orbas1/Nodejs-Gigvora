'use strict';

const HOMEPAGE_DEFAULT = {
  announcementBar: {
    enabled: true,
    message: 'Gigvora deploys vetted product teams with finance, compliance, and delivery safeguards.',
    ctaLabel: 'Book a demo',
    ctaHref: '/contact/sales',
  },
  hero: {
    title: 'Build resilient product squads without the guesswork',
    subtitle:
      'Spin up verified designers, engineers, and operators with treasury, compliance, and delivery guardrails baked in.',
    primaryCtaLabel: 'Book enterprise demo',
    primaryCtaHref: '/contact/sales',
    secondaryCtaLabel: 'Explore marketplace',
    secondaryCtaHref: '/gigs',
    backgroundImageUrl: 'https://cdn.gigvora.com/assets/hero/command-center.jpg',
    backgroundImageAlt: 'Gigvora admin control tower dashboard',
    overlayOpacity: 0.55,
    stats: [
      { id: 'specialists', label: 'Verified specialists', value: 12800, suffix: '+' },
      { id: 'satisfaction', label: 'Client satisfaction', value: 97, suffix: '%' },
      { id: 'regions', label: 'Countries served', value: 32, suffix: '' },
      { id: 'sla', label: 'Matching SLA (hrs)', value: 48, suffix: '' },
    ],
  },
  valueProps: [
    {
      id: 'compliance',
      title: 'Compliance handled',
      description: 'NDAs, KYC, and region-specific controls live inside every engagement.',
      icon: 'ShieldCheckIcon',
      ctaLabel: 'Review trust center',
      ctaHref: '/trust-center',
    },
    {
      id: 'payments',
      title: 'Unified payouts',
      description: 'Escrow, subscriptions, and milestone releases flow through one treasury.',
      icon: 'CurrencyDollarIcon',
      ctaLabel: 'View payment options',
      ctaHref: '/finance',
    },
    {
      id: 'insights',
      title: 'Operational telemetry',
      description: 'Live scorecards keep delivery, spend, and sentiment transparent.',
      icon: 'ChartBarIcon',
      ctaLabel: 'See analytics',
      ctaHref: '/dashboard/company/analytics',
    },
  ],
  featureSections: [
    {
      id: 'project-launch',
      title: 'Launch projects without friction',
      description: 'Spin up scopes, approvals, and budgets with prebuilt compliance guardrails.',
      mediaType: 'image',
      mediaUrl: 'https://cdn.gigvora.com/assets/features/project-launch.png',
      mediaAlt: 'Gigvora project launch workflow',
      bullets: [
        { id: 'templates', text: 'Reusable scope templates with approval routing' },
        { id: 'governance', text: 'Automatic vendor risk and policy checks' },
      ],
    },
    {
      id: 'workspace',
      title: 'Collaborate in one workspace',
      description: 'Docs, deliverables, feedback, and finance sync across teams and partners.',
      mediaType: 'image',
      mediaUrl: 'https://cdn.gigvora.com/assets/features/workspace.png',
      mediaAlt: 'Cross-functional workspace collaboration',
      bullets: [
        { id: 'vault', text: 'Role-based deliverable vault with versioning' },
        { id: 'status', text: 'Automated status digests for stakeholders' },
      ],
    },
  ],
  testimonials: [
    {
      id: 'northwind',
      quote:
        'Gigvora unlocked a vetted product pod in 48 hours—finance, compliance, and delivery were already aligned.',
      authorName: 'Leah Patel',
      authorRole: 'VP Operations, Northwind Labs',
      avatarUrl: 'https://cdn.gigvora.com/assets/avatars/leah-patel.png',
      highlight: true,
    },
    {
      id: 'acme',
      quote: 'Compliance workflows and milestone escrow meant we focused on shipping, not paperwork.',
      authorName: 'Marcus Chen',
      authorRole: 'Head of Product, Acme Robotics',
      avatarUrl: 'https://cdn.gigvora.com/assets/avatars/marcus-chen.png',
      highlight: false,
    },
  ],
  faqs: [
    {
      id: 'getting-started',
      question: 'How quickly can teams onboard?',
      answer: 'Submit a brief and receive a vetted shortlist with compliance approval inside 48 hours.',
    },
    {
      id: 'pricing-models',
      question: 'What pricing models are supported?',
      answer: 'Choose milestone-based projects, subscription pods, or hourly retainers based on the workstream.',
    },
  ],
  quickLinks: [
    { id: 'demo', label: 'Book a live demo', href: '/contact/sales', target: '_self' },
    { id: 'login', label: 'Sign in to workspace', href: '/login', target: '_self' },
    { id: 'updates', label: 'Read product updates', href: '/blog', target: '_self' },
  ],
  seo: {
    title: 'Gigvora | Product-ready teams on demand',
    description:
      'Gigvora delivers vetted product talent with treasury, compliance, and delivery automation so teams can launch faster.',
    keywords: ['gigvora', 'product talent', 'freelancer marketplace', 'managed marketplace'],
    ogImageUrl: 'https://cdn.gigvora.com/assets/og/homepage.png',
  },
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const truncate = (value, limit) => value.slice(0, limit);

const sanitizeText = (value, fallback, limit = 280, { allowEmpty = false } = {}) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalised = truncate(value.trim().replace(/\s+/g, ' '), limit);
  if (!normalised && !allowEmpty) {
    return fallback;
  }

  return allowEmpty ? normalised : normalised || fallback;
};

const sanitizeBoolean = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

const sanitizeNumber = (value, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, round = false } = {}) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const clamped = Math.min(Math.max(numericValue, min), max);
  return round ? Math.round(clamped) : clamped;
};

const sanitizeIdentifier = (value, fallback, { upperCase = false } = {}) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const clean = value.trim().replace(/[^a-z0-9_\-]/gi, '');
  if (!clean) {
    return fallback;
  }

  const truncated = truncate(clean, 80);
  return upperCase ? truncated.toUpperCase() : truncated;
};

const normalizeId = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug ? truncate(slug, 60) : null;
};

const isSafeUrl = (value) => typeof value === 'string' && /^(https?:\/\/|\/|#)/i.test(value.trim());

const sanitizeUrl = (value, fallback) => {
  if (!isSafeUrl(value)) {
    return fallback;
  }
  return truncate(value.trim(), 300);
};

const sanitizeImageUrl = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!/^(https?:\/\/|\/)/i.test(trimmed)) {
    return fallback;
  }

  return truncate(trimmed, 400);
};

const sanitizeKeywords = (keywords, fallback) => {
  if (!Array.isArray(keywords)) {
    return fallback;
  }

  const cleaned = keywords
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .map((item) => truncate(item, 80));

  return cleaned.length ? Array.from(new Set(cleaned)).slice(0, 20) : fallback;
};

const sanitizeStatSuffix = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (!/^[A-Za-z0-9%+]{1,10}$/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
};

const sanitizeStats = (stats, defaults) => {
  const baseStats = deepClone(defaults);
  if (!Array.isArray(stats)) {
    return baseStats;
  }

  const sanitized = baseStats.map((defaultEntry) => {
    const override = stats.find((item) => normalizeId(item?.id) === defaultEntry.id) || {};
    return {
      id: defaultEntry.id,
      label: sanitizeText(override.label, defaultEntry.label, 80),
      value: sanitizeNumber(override.value, defaultEntry.value, { min: 0, max: 1_000_000, round: true }),
      suffix: sanitizeStatSuffix(override.suffix, defaultEntry.suffix),
    };
  });

  return sanitized;
};

const sanitizeBullets = (bullets, defaults) => {
  const baseBullets = deepClone(defaults);
  if (!Array.isArray(bullets)) {
    return baseBullets;
  }

  const seen = new Set();
  const sanitisedDefaults = baseBullets.map((defaultBullet) => {
    const override = bullets.find((item) => normalizeId(item?.id) === defaultBullet.id) || {};
    seen.add(defaultBullet.id);
    return {
      id: defaultBullet.id,
      text: sanitizeText(override.text, defaultBullet.text, 160),
    };
  });

  for (const bullet of bullets) {
    const bulletId = normalizeId(bullet?.id);
    if (!bulletId || seen.has(bulletId) || sanitisedDefaults.length >= 8) {
      continue;
    }
    const text = sanitizeText(bullet?.text, '', 160);
    if (!text) {
      continue;
    }
    sanitisedDefaults.push({ id: bulletId, text });
    seen.add(bulletId);
  }

  return sanitisedDefaults;
};

const sanitizeValueProps = (valueProps, defaults) => {
  const baseValueProps = deepClone(defaults);
  const incoming = Array.isArray(valueProps) ? valueProps : [];
  const seen = new Set();

  const sanitisedDefaults = baseValueProps.map((defaultEntry) => {
    const override = incoming.find((item) => normalizeId(item?.id) === defaultEntry.id) || {};
    seen.add(defaultEntry.id);
    return {
      id: defaultEntry.id,
      title: sanitizeText(override.title, defaultEntry.title, 80),
      description: sanitizeText(override.description, defaultEntry.description, 260),
      icon: sanitizeIdentifier(override.icon, defaultEntry.icon),
      ctaLabel: sanitizeText(override.ctaLabel, defaultEntry.ctaLabel, 60),
      ctaHref: sanitizeUrl(override.ctaHref, defaultEntry.ctaHref),
    };
  });

  for (const entry of incoming) {
    const entryId = normalizeId(entry?.id);
    if (!entryId || seen.has(entryId) || sanitisedDefaults.length >= 6) {
      continue;
    }

    const title = sanitizeText(entry?.title, '', 80);
    const description = sanitizeText(entry?.description, '', 260);
    if (!title || !description) {
      continue;
    }

    sanitisedDefaults.push({
      id: entryId,
      title,
      description,
      icon: sanitizeIdentifier(entry?.icon, 'SparklesIcon'),
      ctaLabel: sanitizeText(entry?.ctaLabel, 'Learn more', 60),
      ctaHref: sanitizeUrl(entry?.ctaHref, '/'),
    });
    seen.add(entryId);
  }

  return sanitisedDefaults;
};

const sanitizeFeatureSections = (sections, defaults) => {
  const baseSections = deepClone(defaults);
  const incoming = Array.isArray(sections) ? sections : [];
  const seen = new Set();

  const sanitisedDefaults = baseSections.map((defaultEntry) => {
    const override = incoming.find((item) => normalizeId(item?.id) === defaultEntry.id) || {};
    seen.add(defaultEntry.id);
    return {
      id: defaultEntry.id,
      title: sanitizeText(override.title, defaultEntry.title, 90),
      description: sanitizeText(override.description, defaultEntry.description, 280),
      mediaType: ['image', 'video'].includes((override.mediaType || '').toLowerCase())
        ? override.mediaType.toLowerCase()
        : defaultEntry.mediaType,
      mediaUrl: sanitizeImageUrl(override.mediaUrl, defaultEntry.mediaUrl),
      mediaAlt: sanitizeText(override.mediaAlt, defaultEntry.mediaAlt, 160),
      bullets: sanitizeBullets(override.bullets, defaultEntry.bullets),
    };
  });

  for (const entry of incoming) {
    const entryId = normalizeId(entry?.id);
    if (!entryId || seen.has(entryId) || sanitisedDefaults.length >= 5) {
      continue;
    }

    const title = sanitizeText(entry?.title, '', 90);
    const description = sanitizeText(entry?.description, '', 280);
    if (!title || !description) {
      continue;
    }

    const mediaType = ['image', 'video'].includes((entry?.mediaType || '').toLowerCase())
      ? entry.mediaType.toLowerCase()
      : 'image';

    sanitisedDefaults.push({
      id: entryId,
      title,
      description,
      mediaType,
      mediaUrl: sanitizeImageUrl(entry?.mediaUrl, '/assets/placeholder.png'),
      mediaAlt: sanitizeText(entry?.mediaAlt, title, 160),
      bullets: sanitizeBullets(entry?.bullets, []),
    });
    seen.add(entryId);
  }

  return sanitisedDefaults;
};

const sanitizeTestimonials = (testimonials, defaults) => {
  const baseTestimonials = deepClone(defaults);
  const incoming = Array.isArray(testimonials) ? testimonials : [];
  const seen = new Set();

  const sanitisedDefaults = baseTestimonials.map((defaultEntry) => {
    const override = incoming.find((item) => normalizeId(item?.id) === defaultEntry.id) || {};
    seen.add(defaultEntry.id);
    return {
      id: defaultEntry.id,
      quote: sanitizeText(override.quote, defaultEntry.quote, 360),
      authorName: sanitizeText(override.authorName, defaultEntry.authorName, 120),
      authorRole: sanitizeText(override.authorRole, defaultEntry.authorRole, 160),
      avatarUrl: sanitizeImageUrl(override.avatarUrl, defaultEntry.avatarUrl),
      highlight: sanitizeBoolean(override.highlight, defaultEntry.highlight),
    };
  });

  for (const entry of incoming) {
    const entryId = normalizeId(entry?.id);
    if (!entryId || seen.has(entryId) || sanitisedDefaults.length >= 6) {
      continue;
    }

    const quote = sanitizeText(entry?.quote, '', 360);
    const authorName = sanitizeText(entry?.authorName, '', 120);
    if (!quote || !authorName) {
      continue;
    }

    sanitisedDefaults.push({
      id: entryId,
      quote,
      authorName,
      authorRole: sanitizeText(entry?.authorRole, '', 160, { allowEmpty: true }),
      avatarUrl: sanitizeImageUrl(entry?.avatarUrl, '/assets/avatars/placeholder.png'),
      highlight: sanitizeBoolean(entry?.highlight, false),
    });
    seen.add(entryId);
  }

  return sanitisedDefaults;
};

const sanitizeFaqs = (faqs, defaults) => {
  const baseFaqs = deepClone(defaults);
  const incoming = Array.isArray(faqs) ? faqs : [];
  const seen = new Set();

  const sanitisedDefaults = baseFaqs.map((defaultEntry) => {
    const override = incoming.find((item) => normalizeId(item?.id) === defaultEntry.id) || {};
    seen.add(defaultEntry.id);
    return {
      id: defaultEntry.id,
      question: sanitizeText(override.question, defaultEntry.question, 160),
      answer: sanitizeText(override.answer, defaultEntry.answer, 360),
    };
  });

  for (const entry of incoming) {
    const entryId = normalizeId(entry?.id);
    if (!entryId || seen.has(entryId) || sanitisedDefaults.length >= 8) {
      continue;
    }

    const question = sanitizeText(entry?.question, '', 160);
    const answer = sanitizeText(entry?.answer, '', 360);
    if (!question || !answer) {
      continue;
    }

    sanitisedDefaults.push({ id: entryId, question, answer });
    seen.add(entryId);
  }

  return sanitisedDefaults;
};

const sanitizeQuickLinks = (links, defaults) => {
  const baseLinks = deepClone(defaults);
  const incoming = Array.isArray(links) ? links : [];
  const seen = new Set();
  const allowedTargets = new Set(['_self', '_blank']);

  const sanitisedDefaults = baseLinks.map((defaultEntry) => {
    const override = incoming.find((item) => normalizeId(item?.id) === defaultEntry.id) || {};
    seen.add(defaultEntry.id);
    return {
      id: defaultEntry.id,
      label: sanitizeText(override.label, defaultEntry.label, 60),
      href: sanitizeUrl(override.href, defaultEntry.href),
      target: allowedTargets.has(override.target) ? override.target : defaultEntry.target,
    };
  });

  for (const entry of incoming) {
    const entryId = normalizeId(entry?.id);
    if (!entryId || seen.has(entryId) || sanitisedDefaults.length >= 6) {
      continue;
    }

    const label = sanitizeText(entry?.label, '', 60);
    const href = sanitizeUrl(entry?.href, '');
    if (!label || !href) {
      continue;
    }

    sanitisedDefaults.push({
      id: entryId,
      label,
      href,
      target: allowedTargets.has(entry?.target) ? entry.target : '_self',
    });
    seen.add(entryId);
  }

  return sanitisedDefaults;
};

const sanitizeSeo = (seo, defaults) => {
  const fallbackSeo = deepClone(defaults);
  const source = isPlainObject(seo) ? seo : {};
  return {
    title: sanitizeText(source.title, fallbackSeo.title, 150),
    description: sanitizeText(source.description, fallbackSeo.description, 320),
    keywords: sanitizeKeywords(source.keywords, fallbackSeo.keywords),
    ogImageUrl: sanitizeImageUrl(source.ogImageUrl, fallbackSeo.ogImageUrl),
  };
};

const sanitizeHomepageConfig = (homepage) => {
  const defaults = deepClone(HOMEPAGE_DEFAULT);
  const source = isPlainObject(homepage) ? homepage : {};

  return {
    announcementBar: {
      enabled: sanitizeBoolean(source.announcementBar?.enabled, defaults.announcementBar.enabled),
      message: sanitizeText(source.announcementBar?.message, defaults.announcementBar.message, 200),
      ctaLabel: sanitizeText(source.announcementBar?.ctaLabel, defaults.announcementBar.ctaLabel, 60),
      ctaHref: sanitizeUrl(source.announcementBar?.ctaHref, defaults.announcementBar.ctaHref),
    },
    hero: {
      title: sanitizeText(source.hero?.title, defaults.hero.title, 120),
      subtitle: sanitizeText(source.hero?.subtitle, defaults.hero.subtitle, 320),
      primaryCtaLabel: sanitizeText(source.hero?.primaryCtaLabel, defaults.hero.primaryCtaLabel, 60),
      primaryCtaHref: sanitizeUrl(source.hero?.primaryCtaHref, defaults.hero.primaryCtaHref),
      secondaryCtaLabel: sanitizeText(
        source.hero?.secondaryCtaLabel,
        defaults.hero.secondaryCtaLabel,
        60,
      ),
      secondaryCtaHref: sanitizeUrl(source.hero?.secondaryCtaHref, defaults.hero.secondaryCtaHref),
      backgroundImageUrl: sanitizeImageUrl(source.hero?.backgroundImageUrl, defaults.hero.backgroundImageUrl),
      backgroundImageAlt: sanitizeText(source.hero?.backgroundImageAlt, defaults.hero.backgroundImageAlt, 160),
      overlayOpacity: sanitizeNumber(source.hero?.overlayOpacity, defaults.hero.overlayOpacity, {
        min: 0,
        max: 0.9,
      }),
      stats: sanitizeStats(source.hero?.stats, defaults.hero.stats),
    },
    valueProps: sanitizeValueProps(source.valueProps, defaults.valueProps),
    featureSections: sanitizeFeatureSections(source.featureSections, defaults.featureSections),
    testimonials: sanitizeTestimonials(source.testimonials, defaults.testimonials),
    faqs: sanitizeFaqs(source.faqs, defaults.faqs),
    quickLinks: sanitizeQuickLinks(source.quickLinks, defaults.quickLinks),
    seo: sanitizeSeo(source.seo, defaults.seo),
  };
};

const safeParsePayload = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return {};
    }
  }

  if (isPlainObject(value)) {
    return deepClone(value);
  }

  return {};
};

const serializePayload = (payload) => JSON.stringify(payload);

const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const [record] = await queryInterface.sequelize.query(
      "SELECT id, value FROM platform_settings WHERE key = 'platform' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT, transaction },
    );

    if (record) {
      const payload = safeParsePayload(record.value);
      const sanitizedHomepage = sanitizeHomepageConfig(payload.homepage);
      const shouldPersist =
        !isPlainObject(payload.homepage) ||
        JSON.stringify(payload.homepage) !== JSON.stringify(sanitizedHomepage);

      if (shouldPersist) {
        payload.homepage = sanitizedHomepage;
        await queryInterface.sequelize.query(
          "UPDATE platform_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id",
          {
            replacements: { value: serializePayload(payload), id: record.id },
            transaction,
          },
        );
      }
    } else {
      const sanitizedHomepage = sanitizeHomepageConfig();
      await queryInterface.bulkInsert(
        'platform_settings',
        [
          {
            key: 'platform',
            value: serializePayload({ homepage: sanitizedHomepage }),
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
};

const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const [record] = await queryInterface.sequelize.query(
      "SELECT id, value FROM platform_settings WHERE key = 'platform' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT, transaction },
    );

    if (record) {
      const payload = safeParsePayload(record.value);
      if (isPlainObject(payload.homepage)) {
        delete payload.homepage;
        await queryInterface.sequelize.query(
          "UPDATE platform_settings SET value = :value, updatedAt = CURRENT_TIMESTAMP WHERE id = :id",
          {
            replacements: { value: serializePayload(payload), id: record.id },
            transaction,
          },
        );
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  HOMEPAGE_DEFAULT,
  sanitizeHomepageConfig,
  up,
  down,
};
