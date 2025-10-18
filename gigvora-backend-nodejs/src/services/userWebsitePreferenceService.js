import { randomUUID } from 'crypto';
import { User, UserWebsitePreference } from '../models/index.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt', 'it', 'nl'];
const BACKGROUND_STYLES = ['light', 'dark', 'gradient'];
const BUTTON_SHAPES = ['rounded', 'pill', 'square'];
const MEDIA_TYPES = ['image', 'video', 'none'];

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
