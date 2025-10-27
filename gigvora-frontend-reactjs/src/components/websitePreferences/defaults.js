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
    channel: 'in-app',
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
  personalization: {
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
      channels: {
        email: true,
        push: false,
        inApp: true,
        sms: false,
      },
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
  },
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item));
  }
  if (isPlainObject(value)) {
    return Object.entries(value).reduce((accumulator, [key, item]) => {
      accumulator[key] = cloneDeep(item);
      return accumulator;
    }, {});
  }
  return value;
}

export function deepMerge(base, override) {
  const baseObject = isPlainObject(base) ? base : {};
  const result = cloneDeep(baseObject);
  if (!isPlainObject(override)) {
    return result;
  }
  Object.entries(override).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      result[key] = value.map((item) => cloneDeep(item));
      return;
    }
    if (isPlainObject(value)) {
      result[key] = deepMerge(result[key] ?? {}, value);
      return;
    }
    if (value !== undefined) {
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
