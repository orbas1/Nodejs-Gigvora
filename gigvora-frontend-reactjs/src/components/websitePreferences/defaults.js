export const DEFAULT_WEBSITE_PREFERENCES = {
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function deepMerge(base, override) {
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

export function withDefaults(preferences) {
  return deepMerge(DEFAULT_WEBSITE_PREFERENCES, preferences ?? {});
}

export function clonePreferences(preferences) {
  if (typeof structuredClone === 'function') {
    return structuredClone(preferences);
  }
  return JSON.parse(JSON.stringify(preferences));
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function ensureObject(value, fallback = {}) {
  return isPlainObject(value) ? value : fallback;
}
