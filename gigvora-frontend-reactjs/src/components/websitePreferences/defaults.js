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
    presetId: 'gigvora-classic',
    systemSync: true,
    lastSyncedAt: null,
    accentPalette: ['#0EA5E9', '#22D3EE', '#38BDF8', '#818CF8'],
    accessibilityPreset: 'standard',
    reduceMotion: false,
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
  subscriptions: {
    digestTime: 'monday-08:00',
    autoPersonalize: true,
    modules: [
      {
        id: 'community-highlights',
        title: 'Community highlights',
        description: 'Signature wins and inspiring stories from verified talent.',
        enabled: true,
        frequency: 'weekly',
        channels: ['site', 'email'],
        segments: ['prospects', 'clients'],
        sampleContent: [
          {
            id: 'story-1',
            title: 'How Gigvora studios launched 40 marketplaces',
            metric: '4.8k reads',
          },
          {
            id: 'story-2',
            title: 'Founder spotlight: Amina’s distributed design crew',
            metric: 'Top 3% engagement',
          },
        ],
      },
      {
        id: 'product-releases',
        title: 'Product releases',
        description: 'Feature drops, release notes, and roadmap previews.',
        enabled: true,
        frequency: 'biweekly',
        channels: ['site', 'email', 'rss'],
        segments: ['clients', 'partners'],
        sampleContent: [
          {
            id: 'release-1',
            title: 'Spaces 2.0: Multiplayer branding sessions',
            metric: 'Beta waitlist 1.2k',
          },
          {
            id: 'release-2',
            title: 'Automation recipes for talent onboarding',
            metric: '92% adoption',
          },
        ],
      },
      {
        id: 'learning-paths',
        title: 'Learning paths',
        description: 'Curated guides and certification journeys for your audience.',
        enabled: false,
        frequency: 'monthly',
        channels: ['site'],
        segments: ['prospects', 'community'],
        sampleContent: [
          {
            id: 'course-1',
            title: 'AI-assisted brand storytelling workshop',
            metric: '97% satisfaction',
          },
          {
            id: 'course-2',
            title: 'Funnel mastery for indie studios',
            metric: '642 completions',
          },
        ],
      },
    ],
  },
};

export const DEFAULT_SUBSCRIPTION_MODULES = DEFAULT_WEBSITE_PREFERENCES.subscriptions.modules;

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
