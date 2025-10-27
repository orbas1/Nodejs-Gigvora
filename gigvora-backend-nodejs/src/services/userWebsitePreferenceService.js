import { randomUUID } from 'crypto';
import { User, UserWebsitePreference } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt', 'it', 'nl'];
const BACKGROUND_STYLES = ['light', 'dark', 'gradient'];
const BUTTON_SHAPES = ['rounded', 'pill', 'square'];
const MEDIA_TYPES = ['image', 'video', 'none'];

const PERSONALIZATION_THEME_PRESETS = ['aurora', 'obsidian', 'daybreak', 'focus'];
const PERSONALIZATION_THEME_MODES = ['system', 'light', 'dark', 'high-contrast'];
const PERSONALIZATION_THEME_ACCENTS = ['azure', 'violet', 'emerald', 'amber', 'rose', 'custom'];
const PERSONALIZATION_THEME_DENSITIES = ['spacious', 'comfortable', 'cozy', 'compact'];

const DEFAULT_LAYOUT_MODULES = [
  {
    id: 'hero',
    label: 'Hero spotlight',
    description: 'Immersive hero with headline, CTA, and background media.',
    enabled: true,
    pinned: true,
    span: 'full',
  },
  {
    id: 'about',
    label: 'Story block',
    description: 'Founder story, mission, and differentiators.',
    enabled: true,
    pinned: false,
    span: 'full',
  },
  {
    id: 'services',
    label: 'Services grid',
    description: 'Showcase your flagship offers with pricing and CTA.',
    enabled: true,
    pinned: false,
    span: 'half',
  },
  {
    id: 'testimonials',
    label: 'Social proof',
    description: 'Testimonials, logos, and case-study highlights.',
    enabled: true,
    pinned: false,
    span: 'half',
  },
  {
    id: 'gallery',
    label: 'Gallery spotlight',
    description: 'Curated visuals, reels, or press imagery.',
    enabled: false,
    pinned: false,
    span: 'third',
  },
  {
    id: 'blog',
    label: 'Content hub',
    description: 'Latest posts, interviews, and resources.',
    enabled: false,
    pinned: false,
    span: 'half',
  },
  {
    id: 'contact',
    label: 'Contact & booking',
    description: 'Direct contact, booking calendar, or office hours.',
    enabled: true,
    pinned: false,
    span: 'half',
  },
  {
    id: 'newsletter',
    label: 'Newsletter capture',
    description: 'Collect subscribers for updates and announcements.',
    enabled: false,
    pinned: false,
    span: 'half',
  },
];

const LAYOUT_MODULE_REGISTRY = new Map(DEFAULT_LAYOUT_MODULES.map((module) => [module.id, module]));
const LAYOUT_SPAN_OPTIONS = ['full', 'half', 'third'];

const LAYOUT_TEMPLATE_CONFIG = {
  spotlight: {
    heroStyle: 'immersive',
    order: ['hero', 'services', 'testimonials', 'about', 'contact', 'gallery', 'blog', 'newsletter'],
  },
  publisher: {
    heroStyle: 'editorial',
    order: ['hero', 'about', 'blog', 'services', 'testimonials', 'gallery', 'newsletter', 'contact'],
  },
  commerce: {
    heroStyle: 'conversion',
    order: ['hero', 'services', 'contact', 'testimonials', 'about', 'gallery', 'newsletter', 'blog'],
  },
};

const DEFAULT_SUBSCRIPTION_CATEGORIES = [
  {
    id: 'dealflow',
    label: 'Deal flow insights',
    description: 'Curated opportunities, leads, and partner spotlights.',
    enabled: true,
    frequency: 'daily',
    channel: 'email',
  },
  {
    id: 'mentorship',
    label: 'Mentorship spotlights',
    description: 'New mentor matches, success stories, and coaching prompts.',
    enabled: true,
    frequency: 'weekly',
    channel: 'inApp',
  },
  {
    id: 'events',
    label: 'Events & experiences',
    description: 'Workshops, AMAs, and community meetups tailored to you.',
    enabled: true,
    frequency: 'weekly',
    channel: 'email',
  },
  {
    id: 'talent',
    label: 'Talent recommendations',
    description: 'Rising talent, shortlists, and introductions worth exploring.',
    enabled: false,
    frequency: 'weekly',
    channel: 'push',
  },
  {
    id: 'learning',
    label: 'Learning library updates',
    description: 'Fresh playbooks, templates, and on-demand courses.',
    enabled: false,
    frequency: 'monthly',
    channel: 'email',
  },
];

const SUBSCRIPTION_DIGEST_OPTIONS = ['daily', 'weekly', 'monthly'];
const SUBSCRIPTION_CHANNEL_KEYS = ['email', 'push', 'inApp', 'sms'];
const SUBSCRIPTION_CATEGORY_FREQUENCIES = ['real-time', 'daily', 'weekly', 'monthly'];
const SUBSCRIPTION_CATEGORY_REGISTRY = new Map(
  DEFAULT_SUBSCRIPTION_CATEGORIES.map((category) => [category.id, category]),
);

const ACCESSIBILITY_ALT_ENFORCEMENTS = ['required', 'recommended', 'optional'];
const ACCESSIBILITY_CAPTION_POLICIES = ['required', 'preferred', 'optional'];
const ACCESSIBILITY_AUDIO_DESCRIPTION = ['off', 'summary', 'full'];
const ACCESSIBILITY_READING_STYLES = ['inclusive', 'executive', 'technical'];
const ACCESSIBILITY_SIGN_LANGUAGES = ['none', 'bsl', 'asl'];

const normalizeChannelValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === 'in-app') {
    return 'inApp';
  }
  return trimmed;
};

const DEFAULT_PERSONALIZATION = {
  theme: {
    preset: 'aurora',
    mode: 'system',
    accent: 'azure',
    density: 'comfortable',
    customAccent: '#2563EB',
    customNeutral: '#0F172A',
    livePreview: true,
    analyticsOptIn: true,
    updatedAt: null,
  },
  layout: {
    template: 'spotlight',
    heroStyle: 'immersive',
    modules: DEFAULT_LAYOUT_MODULES,
    featuredCallout: 'Show visitors the value in under 30 seconds.',
    analyticsEnabled: true,
    updatedAt: null,
  },
  subscriptions: {
    digestFrequency: 'weekly',
    timezone: 'UTC',
    channels: { email: true, push: false, inApp: true, sms: false },
    aiSummaries: true,
    previewEnabled: false,
    categories: DEFAULT_SUBSCRIPTION_CATEGORIES,
    updatedAt: null,
  },
  accessibility: {
    altText: {
      enforcement: 'required',
      autoGenerate: true,
      requireForMedia: true,
    },
    media: {
      captionPolicy: 'required',
      transcripts: true,
      audioDescription: 'summary',
    },
    content: {
      readingStyle: 'inclusive',
      inclusiveLanguage: true,
      plainLanguage: true,
    },
    localisation: {
      autoTranslate: true,
      languages: ['en'],
      defaultLanguage: 'en',
      signLanguage: 'none',
    },
    compliance: {
      contrast: true,
      focus: true,
      keyboard: true,
      owner: '',
      lastReviewedAt: null,
    },
    updatedAt: null,
  },
};

const DEFAULT_PREFERENCES = {
  settings: {
    siteTitle: 'My site',
    tagline: '',
    siteSlug: 'my-site',
    published: false,
    language: 'en',
    customDomain: '',
  },
  theme: {
    primaryColor: '#2563EB',
    accentColor: '#0EA5E9',
    backgroundStyle: 'light',
    fontFamily: 'Inter',
    buttonShape: 'rounded',
    logoUrl: '',
    faviconUrl: '',
  },
  hero: {
    kicker: '',
    headline: 'Let’s work together.',
    subheadline: '',
    primaryCtaLabel: 'Book call',
    primaryCtaLink: '#contact',
    secondaryCtaLabel: '',
    secondaryCtaLink: '',
    backgroundImageUrl: '',
    media: { type: 'image', url: '', alt: '' },
  },
  about: {
    title: 'About',
    body: '',
    highlights: [],
  },
  navigation: {
    links: [],
  },
  services: {
    items: [],
  },
  testimonials: {
    items: [],
  },
  gallery: {
    items: [],
  },
  contact: {
    email: '',
    phone: '',
    location: '',
    formRecipient: '',
    showForm: true,
    availabilityNote: '',
    bookingLink: '',
  },
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywordsInput: '',
    ogImageUrl: '',
    twitterHandle: '',
  },
  social: {
    links: [],
  },
  personalization: DEFAULT_PERSONALIZATION,
};

function normalizeUserId(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new ValidationError('userId must be a positive integer.');
  }
  return numeric;
}

function makeId(prefix) {
  try {
    return randomUUID();
  } catch (error) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (!isPlainObject(base)) {
    return isPlainObject(override) ? { ...override } : {};
  }
  const result = { ...base };
  if (!isPlainObject(override)) {
    return result;
  }
  Object.entries(override).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      result[key] = [...value];
    } else if (isPlainObject(value)) {
      result[key] = deepMerge(base[key] ?? {}, value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

function withDefaults(payload) {
  return deepMerge(DEFAULT_PREFERENCES, payload ?? {});
}

function sanitizeString(value, { field, required = false, maxLength = 255, fallback = '' }) {
  if (value == null) {
    if (required) {
      throw new ValidationError(`${field} is required.`);
    }
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    if (required) {
      throw new ValidationError(`${field} is required.`);
    }
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeOptionalString(value, options) {
  if (value == null || value === '') {
    return '';
  }
  return sanitizeString(value, options);
}

function sanitizeBoolean(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return Boolean(value);
}

function sanitizeTimestamp(value, { allowNull = false } = {}) {
  if (!value) {
    return allowNull ? null : new Date().toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return allowNull ? null : new Date().toISOString();
  }
  return date.toISOString();
}

function sanitizeColor(value, field) {
  if (!value) {
    return field === 'theme.primaryColor' ? '#2563EB' : '#0EA5E9';
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a hex string.`);
  }
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/u.test(normalized)) {
    throw new ValidationError(`${field} must be a valid hex code.`);
  }
  return normalized.toUpperCase();
}

function sanitizeSlug(value) {
  const fallback = 'my-site';
  if (!value) {
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('settings.siteSlug must be a string.');
  }
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
  return normalized || fallback;
}

function sanitizeUrl(value, { field, allowEmpty = true, allowRelative = true } = {}) {
  if (!value) {
    return allowEmpty ? '' : null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return allowEmpty ? '' : null;
  }
  if (allowRelative && trimmed.startsWith('#')) {
    return trimmed.slice(0, 2048);
  }
  try {
    const url = new URL(trimmed, allowRelative ? 'https://example.com' : undefined);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol');
    }
    return trimmed.slice(0, 2048);
  } catch (error) {
    throw new ValidationError(`${field} must be a valid URL.`);
  }
}

function sanitizeEmail(value, { field, allowEmpty = true } = {}) {
  if (!value) {
    return allowEmpty ? '' : null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return allowEmpty ? '' : null;
  }
  const emailRegex = /^(?:[A-Za-z0-9_'^&+{}=-]+(?:\.[A-Za-z0-9_'^&+{}=-]+)*)@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/u;
  if (!emailRegex.test(trimmed)) {
    throw new ValidationError(`${field} must be a valid email address.`);
  }
  return trimmed.slice(0, 255);
}

function sanitizePhone(value, field) {
  if (!value) {
    return '';
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  const phoneRegex = /^[+]?([0-9()\[\]\s-]{5,25})$/u;
  if (!phoneRegex.test(trimmed)) {
    throw new ValidationError(`${field} must be a valid phone number.`);
  }
  return trimmed.slice(0, 40);
}

function sanitizeArray(value, limit, mapper) {
  const list = Array.isArray(value) ? value : [];
  const safe = [];
  for (const item of list.slice(0, limit)) {
    const mapped = mapper(item);
    if (mapped) {
      safe.push(mapped);
    }
  }
  return safe;
}

function sanitizeNavigation(links) {
  return sanitizeArray(links, 8, (link) => {
    if (!link) {
      return null;
    }
    const label = sanitizeString(link.label ?? link.title ?? 'Menu item', {
      field: 'navigation.links.label',
      required: true,
      maxLength: 40,
    });
    const url = sanitizeUrl(link.url ?? '#', { field: 'navigation.links.url', allowEmpty: false });
    return {
      id: link.id ?? makeId('nav'),
      label,
      url,
      openInNewTab: sanitizeBoolean(link.openInNewTab),
    };
  });
}

function sanitizeHighlights(highlights) {
  return sanitizeArray(highlights, 6, (highlight) => {
    if (!highlight) {
      return null;
    }
    if (typeof highlight === 'string') {
      return { id: makeId('highlight'), text: sanitizeOptionalString(highlight, { field: 'about.highlights', maxLength: 120 }) };
    }
    return {
      id: highlight.id ?? makeId('highlight'),
      text: sanitizeOptionalString(highlight.text ?? highlight.label ?? '', {
        field: 'about.highlights.text',
        maxLength: 120,
      }),
    };
  });
}

function sanitizeServices(items) {
  return sanitizeArray(items, 12, (item) => {
    if (!item) {
      return null;
    }
    const name = sanitizeString(item.name ?? 'Service', { field: 'services.items.name', required: true, maxLength: 80 });
    const summary = sanitizeOptionalString(item.summary ?? item.tagline ?? '', { field: 'services.items.summary', maxLength: 160 });
    const startingPrice = sanitizeOptionalString(item.startingPrice ?? '', {
      field: 'services.items.startingPrice',
      maxLength: 40,
    });
    const deliveryTimeframe = sanitizeOptionalString(item.deliveryTimeframe ?? '', {
      field: 'services.items.deliveryTimeframe',
      maxLength: 40,
    });
    const ctaLabel = sanitizeOptionalString(item.ctaLabel ?? '', { field: 'services.items.ctaLabel', maxLength: 30 });
    const ctaLink = sanitizeUrl(item.ctaLink ?? '', { field: 'services.items.ctaLink', allowEmpty: true });
    return {
      id: item.id ?? makeId('service'),
      name,
      summary,
      startingPrice,
      deliveryTimeframe,
      ctaLabel,
      ctaLink,
      featured: sanitizeBoolean(item.featured),
    };
  });
}

function sanitizeTestimonials(items) {
  return sanitizeArray(items, 12, (item) => {
    if (!item) {
      return null;
    }
    const name = sanitizeOptionalString(item.name ?? '', { field: 'testimonials.items.name', maxLength: 80 });
    const title = sanitizeOptionalString(item.title ?? item.role ?? '', { field: 'testimonials.items.title', maxLength: 80 });
    const company = sanitizeOptionalString(item.company ?? '', { field: 'testimonials.items.company', maxLength: 80 });
    const quote = sanitizeOptionalString(item.quote ?? '', { field: 'testimonials.items.quote', maxLength: 600 });
    const avatarUrl = sanitizeUrl(item.avatarUrl ?? '', { field: 'testimonials.items.avatarUrl' });
    return {
      id: item.id ?? makeId('testimonial'),
      name,
      title,
      company,
      quote,
      avatarUrl,
    };
  });
}

function sanitizeGallery(items) {
  return sanitizeArray(items, 12, (item) => {
    if (!item) {
      return null;
    }
    const title = sanitizeOptionalString(item.title ?? '', { field: 'gallery.items.title', maxLength: 80 });
    const caption = sanitizeOptionalString(item.caption ?? '', { field: 'gallery.items.caption', maxLength: 140 });
    const imageUrl = sanitizeUrl(item.imageUrl ?? '', { field: 'gallery.items.imageUrl' });
    return {
      id: item.id ?? makeId('gallery'),
      title,
      caption,
      imageUrl,
    };
  });
}

function sanitizeSocialLinks(links) {
  return sanitizeArray(links, 12, (link) => {
    if (!link) {
      return null;
    }
    const platform = sanitizeOptionalString(link.platform ?? 'LinkedIn', {
      field: 'social.links.platform',
      maxLength: 40,
    });
    const handle = sanitizeOptionalString(link.handle ?? '', { field: 'social.links.handle', maxLength: 80 });
    const url = sanitizeUrl(link.url ?? '', { field: 'social.links.url' });
    return {
      id: link.id ?? makeId('social'),
      platform,
      handle,
      url,
    };
  });
}

function sanitizeHero(hero) {
  const media = isPlainObject(hero.media) ? hero.media : {};
  const mediaType = MEDIA_TYPES.includes(media.type) ? media.type : 'image';
  return {
    kicker: sanitizeOptionalString(hero.kicker ?? '', { field: 'hero.kicker', maxLength: 80 }),
    headline: sanitizeString(hero.headline ?? DEFAULT_PREFERENCES.hero.headline, {
      field: 'hero.headline',
      required: true,
      maxLength: 120,
    }),
    subheadline: sanitizeOptionalString(hero.subheadline ?? '', { field: 'hero.subheadline', maxLength: 240 }),
    primaryCtaLabel: sanitizeOptionalString(hero.primaryCtaLabel ?? '', { field: 'hero.primaryCtaLabel', maxLength: 30 }),
    primaryCtaLink: sanitizeUrl(hero.primaryCtaLink ?? '', { field: 'hero.primaryCtaLink' }),
    secondaryCtaLabel: sanitizeOptionalString(hero.secondaryCtaLabel ?? '', { field: 'hero.secondaryCtaLabel', maxLength: 30 }),
    secondaryCtaLink: sanitizeUrl(hero.secondaryCtaLink ?? '', { field: 'hero.secondaryCtaLink' }),
    backgroundImageUrl: sanitizeUrl(hero.backgroundImageUrl ?? '', { field: 'hero.backgroundImageUrl' }),
    media: {
      type: mediaType,
      url: mediaType === 'none' ? '' : sanitizeUrl(media.url ?? '', { field: 'hero.media.url' }),
      alt: sanitizeOptionalString(media.alt ?? '', { field: 'hero.media.alt', maxLength: 120 }),
    },
  };
}

function sanitizePersonalizationTheme(theme) {
  const preset = PERSONALIZATION_THEME_PRESETS.includes(theme?.preset)
    ? theme.preset
    : DEFAULT_PERSONALIZATION.theme.preset;
  const mode = PERSONALIZATION_THEME_MODES.includes(theme?.mode)
    ? theme.mode
    : DEFAULT_PERSONALIZATION.theme.mode;
  const accent = PERSONALIZATION_THEME_ACCENTS.includes(theme?.accent)
    ? theme.accent
    : DEFAULT_PERSONALIZATION.theme.accent;
  const density = PERSONALIZATION_THEME_DENSITIES.includes(theme?.density)
    ? theme.density
    : DEFAULT_PERSONALIZATION.theme.density;

  const customAccentValue = theme?.customAccent ?? DEFAULT_PERSONALIZATION.theme.customAccent;
  const customNeutralValue = theme?.customNeutral ?? DEFAULT_PERSONALIZATION.theme.customNeutral;

  return {
    preset,
    mode,
    accent,
    density,
    customAccent: sanitizeColor(customAccentValue, 'personalization.theme.customAccent'),
    customNeutral: sanitizeColor(customNeutralValue, 'personalization.theme.customNeutral'),
    livePreview: sanitizeBoolean(theme?.livePreview ?? DEFAULT_PERSONALIZATION.theme.livePreview),
    analyticsOptIn: sanitizeBoolean(
      theme?.analyticsOptIn ?? DEFAULT_PERSONALIZATION.theme.analyticsOptIn,
    ),
    updatedAt: sanitizeTimestamp(theme?.updatedAt, { allowNull: true }),
  };
}

function sanitizeLayoutModules(modules) {
  const result = [];
  const seen = new Set();
  const appendModule = (moduleId, overrides = {}) => {
    if (!moduleId || seen.has(moduleId)) {
      return;
    }
    const base = LAYOUT_MODULE_REGISTRY.get(moduleId);
    if (!base) {
      return;
    }
    const requestedEnabled = overrides.enabled ?? base.enabled ?? false;
    const requestedSpan = overrides.span ?? base.span ?? 'full';

    result.push({
      id: base.id,
      label: base.label,
      description: base.description,
      pinned: Boolean(base.pinned),
      enabled: base.pinned ? true : sanitizeBoolean(requestedEnabled),
      span: LAYOUT_SPAN_OPTIONS.includes(requestedSpan) ? requestedSpan : base.span ?? 'full',
    });
    seen.add(moduleId);
  };

  const provided = Array.isArray(modules) ? modules : [];
  provided.forEach((module) => {
    if (!module || typeof module !== 'object') {
      return;
    }
    appendModule(module.id, module);
  });

  DEFAULT_LAYOUT_MODULES.forEach((module) => {
    appendModule(module.id, module);
  });

  return result;
}

function sanitizePersonalizationLayout(layout) {
  const templateId = Object.prototype.hasOwnProperty.call(LAYOUT_TEMPLATE_CONFIG, layout?.template)
    ? layout.template
    : DEFAULT_PERSONALIZATION.layout.template;
  const templateConfig = LAYOUT_TEMPLATE_CONFIG[templateId];

  const modules = sanitizeLayoutModules(layout?.modules);
  const moduleMap = new Map(modules.map((module) => [module.id, module]));
  const ordered = [];
  templateConfig.order.forEach((moduleId) => {
    if (moduleMap.has(moduleId)) {
      ordered.push(moduleMap.get(moduleId));
      moduleMap.delete(moduleId);
    }
  });
  moduleMap.forEach((module) => {
    ordered.push(module);
  });

  const heroStyle =
    sanitizeOptionalString(layout?.heroStyle ?? templateConfig.heroStyle, {
      field: 'personalization.layout.heroStyle',
      maxLength: 40,
    }) || templateConfig.heroStyle;

  return {
    template: templateId,
    heroStyle,
    modules: ordered,
    featuredCallout:
      sanitizeOptionalString(layout?.featuredCallout ?? DEFAULT_PERSONALIZATION.layout.featuredCallout, {
        field: 'personalization.layout.featuredCallout',
        maxLength: 160,
      }) || DEFAULT_PERSONALIZATION.layout.featuredCallout,
    analyticsEnabled: sanitizeBoolean(
      layout?.analyticsEnabled ?? DEFAULT_PERSONALIZATION.layout.analyticsEnabled,
    ),
    updatedAt: sanitizeTimestamp(layout?.updatedAt, { allowNull: true }),
  };
}

function sanitizeSubscriptionCategories(categories) {
  const sanitized = [];
  const seen = new Set();

  const appendCategory = (category) => {
    if (!category || typeof category !== 'object') {
      return;
    }
    const identifier = sanitizeString(String(category.id ?? ''), {
      field: 'personalization.subscriptions.categories.id',
      required: true,
      maxLength: 60,
    });
    if (seen.has(identifier)) {
      return;
    }
    const base = SUBSCRIPTION_CATEGORY_REGISTRY.get(identifier);
    const label =
      sanitizeOptionalString(category.label ?? base?.label ?? '', {
        field: 'personalization.subscriptions.categories.label',
        maxLength: 80,
      }) || base?.label || 'Collection';
    const description = sanitizeOptionalString(category.description ?? base?.description ?? '', {
      field: 'personalization.subscriptions.categories.description',
      maxLength: 240,
    });
    const frequencyCandidate = category.frequency ?? base?.frequency ?? 'weekly';
    const frequency = SUBSCRIPTION_CATEGORY_FREQUENCIES.includes(frequencyCandidate)
      ? frequencyCandidate
      : 'weekly';
    const channelCandidate = normalizeChannelValue(category.channel ?? base?.channel ?? 'email');
    const channel = SUBSCRIPTION_CHANNEL_KEYS.includes(channelCandidate)
      ? channelCandidate
      : 'email';

    sanitized.push({
      id: identifier,
      label,
      description,
      enabled: sanitizeBoolean(category.enabled ?? base?.enabled ?? false),
      frequency,
      channel,
    });
    seen.add(identifier);
  };

  const provided = Array.isArray(categories) ? categories : [];
  provided.forEach(appendCategory);

  DEFAULT_SUBSCRIPTION_CATEGORIES.forEach((category) => {
    if (!seen.has(category.id)) {
      appendCategory(category);
    }
  });

  return sanitized;
}

function sanitizePersonalizationSubscriptions(subscriptions) {
  const digestCandidate = subscriptions?.digestFrequency ?? DEFAULT_PERSONALIZATION.subscriptions.digestFrequency;
  const digestFrequency = SUBSCRIPTION_DIGEST_OPTIONS.includes(digestCandidate)
    ? digestCandidate
    : DEFAULT_PERSONALIZATION.subscriptions.digestFrequency;

  const timezone =
    sanitizeOptionalString(subscriptions?.timezone ?? DEFAULT_PERSONALIZATION.subscriptions.timezone, {
      field: 'personalization.subscriptions.timezone',
      maxLength: 64,
    }) || DEFAULT_PERSONALIZATION.subscriptions.timezone;

  const channels = {};
  SUBSCRIPTION_CHANNEL_KEYS.forEach((key) => {
    const source = subscriptions?.channels && Object.prototype.hasOwnProperty.call(subscriptions.channels, key)
      ? subscriptions.channels[key]
      : DEFAULT_PERSONALIZATION.subscriptions.channels[key];
    channels[key] = sanitizeBoolean(source);
  });

  return {
    digestFrequency,
    timezone,
    channels,
    aiSummaries: sanitizeBoolean(
      subscriptions?.aiSummaries ?? DEFAULT_PERSONALIZATION.subscriptions.aiSummaries,
    ),
    previewEnabled: sanitizeBoolean(
      subscriptions?.previewEnabled ?? DEFAULT_PERSONALIZATION.subscriptions.previewEnabled,
    ),
    categories: sanitizeSubscriptionCategories(subscriptions?.categories),
    updatedAt: sanitizeTimestamp(subscriptions?.updatedAt, { allowNull: true }),
  };
}

function sanitizeAccessibilityAltText(altText) {
  const enforcement = ACCESSIBILITY_ALT_ENFORCEMENTS.includes(altText?.enforcement)
    ? altText.enforcement
    : DEFAULT_PERSONALIZATION.accessibility.altText.enforcement;

  return {
    enforcement,
    autoGenerate: sanitizeBoolean(
      altText?.autoGenerate ?? DEFAULT_PERSONALIZATION.accessibility.altText.autoGenerate,
    ),
    requireForMedia: sanitizeBoolean(
      altText?.requireForMedia ?? DEFAULT_PERSONALIZATION.accessibility.altText.requireForMedia,
    ),
  };
}

function sanitizeAccessibilityMedia(media) {
  const captionPolicy = ACCESSIBILITY_CAPTION_POLICIES.includes(media?.captionPolicy)
    ? media.captionPolicy
    : DEFAULT_PERSONALIZATION.accessibility.media.captionPolicy;

  const audioDescription = ACCESSIBILITY_AUDIO_DESCRIPTION.includes(media?.audioDescription)
    ? media.audioDescription
    : DEFAULT_PERSONALIZATION.accessibility.media.audioDescription;

  return {
    captionPolicy,
    transcripts: sanitizeBoolean(
      media?.transcripts ?? DEFAULT_PERSONALIZATION.accessibility.media.transcripts,
    ),
    audioDescription,
  };
}

function sanitizeAccessibilityContent(content) {
  const readingStyle = ACCESSIBILITY_READING_STYLES.includes(content?.readingStyle)
    ? content.readingStyle
    : DEFAULT_PERSONALIZATION.accessibility.content.readingStyle;

  return {
    readingStyle,
    inclusiveLanguage: sanitizeBoolean(
      content?.inclusiveLanguage ?? DEFAULT_PERSONALIZATION.accessibility.content.inclusiveLanguage,
    ),
    plainLanguage: sanitizeBoolean(
      content?.plainLanguage ?? DEFAULT_PERSONALIZATION.accessibility.content.plainLanguage,
    ),
  };
}

function sanitizeAccessibilityLanguages(languages) {
  if (!Array.isArray(languages)) {
    return [...DEFAULT_PERSONALIZATION.accessibility.localisation.languages];
  }
  const unique = new Set();
  languages.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }
    const normalized = value.trim().toLowerCase();
    if (SUPPORTED_LANGUAGES.includes(normalized)) {
      unique.add(normalized);
    }
  });
  if (!unique.size) {
    return [...DEFAULT_PERSONALIZATION.accessibility.localisation.languages];
  }
  return Array.from(unique);
}

function sanitizeAccessibilityLocalisation(localisation) {
  const languages = sanitizeAccessibilityLanguages(localisation?.languages);
  const defaultLanguageCandidate = typeof localisation?.defaultLanguage === 'string'
    ? localisation.defaultLanguage.trim().toLowerCase()
    : null;
  const defaultLanguage = languages.includes(defaultLanguageCandidate)
    ? defaultLanguageCandidate
    : languages[0];

  const signLanguage = ACCESSIBILITY_SIGN_LANGUAGES.includes(localisation?.signLanguage)
    ? localisation.signLanguage
    : DEFAULT_PERSONALIZATION.accessibility.localisation.signLanguage;

  return {
    autoTranslate: sanitizeBoolean(
      localisation?.autoTranslate ?? DEFAULT_PERSONALIZATION.accessibility.localisation.autoTranslate,
    ),
    languages,
    defaultLanguage,
    signLanguage,
  };
}

function sanitizeAccessibilityCompliance(compliance) {
  const defaults = DEFAULT_PERSONALIZATION.accessibility.compliance;
  return {
    contrast: sanitizeBoolean(compliance?.contrast ?? defaults.contrast),
    focus: sanitizeBoolean(compliance?.focus ?? defaults.focus),
    keyboard: sanitizeBoolean(compliance?.keyboard ?? defaults.keyboard),
    owner: sanitizeOptionalString(compliance?.owner ?? defaults.owner, {
      field: 'personalization.accessibility.compliance.owner',
      maxLength: 80,
    }),
    lastReviewedAt: sanitizeTimestamp(compliance?.lastReviewedAt, { allowNull: true }),
  };
}

function sanitizePersonalizationAccessibility(accessibility) {
  return {
    altText: sanitizeAccessibilityAltText(accessibility?.altText ?? {}),
    media: sanitizeAccessibilityMedia(accessibility?.media ?? {}),
    content: sanitizeAccessibilityContent(accessibility?.content ?? {}),
    localisation: sanitizeAccessibilityLocalisation(accessibility?.localisation ?? {}),
    compliance: sanitizeAccessibilityCompliance(accessibility?.compliance ?? {}),
    updatedAt: sanitizeTimestamp(accessibility?.updatedAt, { allowNull: true }),
  };
}

function sanitizeAbout(about) {
  return {
    title: sanitizeOptionalString(about.title ?? '', { field: 'about.title', maxLength: 60 }),
    body: sanitizeOptionalString(about.body ?? '', { field: 'about.body', maxLength: 1200 }),
    highlights: sanitizeHighlights(about.highlights),
  };
}

function sanitizeContact(contact) {
  return {
    email: sanitizeEmail(contact.email ?? '', { field: 'contact.email' }),
    phone: sanitizePhone(contact.phone ?? '', 'contact.phone'),
    location: sanitizeOptionalString(contact.location ?? '', { field: 'contact.location', maxLength: 120 }),
    formRecipient: sanitizeEmail(contact.formRecipient ?? '', { field: 'contact.formRecipient' }),
    showForm: sanitizeBoolean(contact.showForm ?? true),
    availabilityNote: sanitizeOptionalString(contact.availabilityNote ?? '', {
      field: 'contact.availabilityNote',
      maxLength: 280,
    }),
    bookingLink: sanitizeUrl(contact.bookingLink ?? '', { field: 'contact.bookingLink' }),
  };
}

function sanitizeSeo(seo) {
  return {
    metaTitle: sanitizeOptionalString(seo.metaTitle ?? '', { field: 'seo.metaTitle', maxLength: 80 }),
    metaDescription: sanitizeOptionalString(seo.metaDescription ?? '', { field: 'seo.metaDescription', maxLength: 240 }),
    keywordsInput: sanitizeOptionalString(seo.keywordsInput ?? '', { field: 'seo.keywordsInput', maxLength: 240 }),
    ogImageUrl: sanitizeUrl(seo.ogImageUrl ?? '', { field: 'seo.ogImageUrl' }),
    twitterHandle: sanitizeOptionalString(seo.twitterHandle ?? '', { field: 'seo.twitterHandle', maxLength: 32 }),
  };
}

function sanitizeTheme(theme) {
  const backgroundStyle = BACKGROUND_STYLES.includes(theme.backgroundStyle) ? theme.backgroundStyle : 'light';
  const buttonShape = BUTTON_SHAPES.includes(theme.buttonShape) ? theme.buttonShape : 'rounded';
  return {
    primaryColor: sanitizeColor(theme.primaryColor ?? DEFAULT_PREFERENCES.theme.primaryColor, 'theme.primaryColor'),
    accentColor: sanitizeColor(theme.accentColor ?? DEFAULT_PREFERENCES.theme.accentColor, 'theme.accentColor'),
    backgroundStyle,
    fontFamily: sanitizeOptionalString(theme.fontFamily ?? 'Inter', { field: 'theme.fontFamily', maxLength: 60 }) || 'Inter',
    buttonShape,
    logoUrl: sanitizeUrl(theme.logoUrl ?? '', { field: 'theme.logoUrl' }),
    faviconUrl: sanitizeUrl(theme.faviconUrl ?? '', { field: 'theme.faviconUrl' }),
  };
}

function buildPayload(payload) {
  const merged = withDefaults(payload);
  const language = sanitizeOptionalString(merged.settings.language ?? 'en', {
    field: 'settings.language',
    maxLength: 5,
  });
  const normalizedLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
  const personalizationTheme = sanitizePersonalizationTheme(merged.personalization?.theme ?? {});
  const personalizationLayout = sanitizePersonalizationLayout(merged.personalization?.layout ?? {});
  const personalizationSubscriptions = sanitizePersonalizationSubscriptions(
    merged.personalization?.subscriptions ?? {},
  );
  const personalizationAccessibility = sanitizePersonalizationAccessibility(
    merged.personalization?.accessibility ?? {},
  );
  return {
    settings: {
      siteTitle: sanitizeString(merged.settings.siteTitle ?? DEFAULT_PREFERENCES.settings.siteTitle, {
        field: 'settings.siteTitle',
        required: true,
        maxLength: 80,
      }),
      tagline: sanitizeOptionalString(merged.settings.tagline ?? '', { field: 'settings.tagline', maxLength: 160 }),
      siteSlug: sanitizeSlug(merged.settings.siteSlug ?? merged.settings.siteTitle),
      published: sanitizeBoolean(merged.settings.published),
      language: normalizedLanguage,
      customDomain: sanitizeOptionalString(merged.settings.customDomain ?? '', {
        field: 'settings.customDomain',
        maxLength: 255,
      }),
    },
    theme: sanitizeTheme(merged.theme ?? {}),
    hero: sanitizeHero(merged.hero ?? {}),
    about: sanitizeAbout(merged.about ?? {}),
    navigation: { links: sanitizeNavigation(merged.navigation?.links) },
    services: { items: sanitizeServices(merged.services?.items) },
    testimonials: { items: sanitizeTestimonials(merged.testimonials?.items) },
    gallery: { items: sanitizeGallery(merged.gallery?.items) },
    contact: sanitizeContact(merged.contact ?? {}),
    seo: sanitizeSeo(merged.seo ?? {}),
    social: { links: sanitizeSocialLinks(merged.social?.links) },
    personalizationTheme,
    personalizationLayout,
    personalizationSubscriptions,
    personalizationAccessibility,
  };
}

function mergeWithDefaults(record) {
  if (!record) {
    return withDefaults(null);
  }
  return withDefaults(record);
}

export async function getUserWebsitePreferences(userId) {
  const normalizedUserId = normalizeUserId(userId);
  const record = await UserWebsitePreference.findOne({ where: { userId: normalizedUserId } });
  if (!record) {
    return mergeWithDefaults({ userId: normalizedUserId });
  }
  return mergeWithDefaults(record.toPublicObject());
}

export async function updateUserWebsitePreferences(userId, payload) {
  const normalizedUserId = normalizeUserId(userId);
  const user = await User.findByPk(normalizedUserId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  const sanitized = buildPayload(payload);
  const [record, created] = await UserWebsitePreference.findOrCreate({
    where: { userId: normalizedUserId },
    defaults: {
      userId: normalizedUserId,
      ...sanitized,
    },
  });

  if (!created) {
    record.set(sanitized);
    await record.save();
  }

  const reloaded = created ? record : await record.reload();
  return mergeWithDefaults(reloaded.toPublicObject());
}

export default {
  getUserWebsitePreferences,
  updateUserWebsitePreferences,
};
