'use strict';

const buildPersonalizationTheme = (timestampIso) => ({
  preset: 'obsidian',
  mode: 'dark',
  accent: 'violet',
  density: 'cozy',
  customAccent: '#7C3AED',
  customNeutral: '#0F172A',
  livePreview: true,
  analyticsOptIn: true,
  updatedAt: timestampIso,
});

const buildPersonalizationLayout = (timestampIso) => ({
  template: 'commerce',
  heroStyle: 'conversion',
  featuredCallout: 'Highlight proof, pricing, and booking in a single sweep.',
  analyticsEnabled: true,
  modules: [
    { id: 'hero', label: 'Hero spotlight', description: 'Immersive hero with background media.', enabled: true, pinned: true, span: 'full' },
    { id: 'services', label: 'Services grid', description: 'Flagship offers with CTAs.', enabled: true, pinned: false, span: 'half' },
    { id: 'testimonials', label: 'Social proof', description: 'Logos and testimonials.', enabled: true, pinned: false, span: 'half' },
    { id: 'contact', label: 'Contact & booking', description: 'Calendar link and contact details.', enabled: true, pinned: false, span: 'half' },
    { id: 'newsletter', label: 'Newsletter capture', description: 'Collect subscriber interest.', enabled: true, pinned: false, span: 'half' },
    { id: 'gallery', label: 'Gallery spotlight', description: 'Curated visuals.', enabled: false, pinned: false, span: 'third' },
    { id: 'blog', label: 'Content hub', description: 'Latest interviews and posts.', enabled: true, pinned: false, span: 'half' },
    { id: 'about', label: 'Story block', description: 'Mission and differentiators.', enabled: true, pinned: false, span: 'full' },
  ],
  updatedAt: timestampIso,
});

const buildPersonalizationSubscriptions = (timestampIso) => ({
  digestFrequency: 'weekly',
  timezone: 'America/New_York',
  channels: { email: true, push: true, inApp: true, sms: false },
  aiSummaries: true,
  previewEnabled: true,
  categories: [
    {
      id: 'dealflow',
      label: 'Deal flow insights',
      description: 'Opportunities and partner spotlights tuned for investors.',
      enabled: true,
      frequency: 'daily',
      channel: 'email',
    },
    {
      id: 'mentorship',
      label: 'Mentorship spotlights',
      description: 'New mentor matches and success stories each week.',
      enabled: true,
      frequency: 'weekly',
      channel: 'inApp',
    },
    {
      id: 'capital',
      label: 'Capital market watch',
      description: 'Raise-ready rounds and growth-stage activity curated for your sector.',
      enabled: true,
      frequency: 'weekly',
      channel: 'email',
    },
    {
      id: 'community-highlights',
      label: 'Community highlights',
      description: 'Member milestones, collaborations, and ecosystem wins.',
      enabled: true,
      frequency: 'monthly',
      channel: 'push',
    },
  ],
  updatedAt: timestampIso,
});

const buildPersonalizationAccessibility = (timestampIso) => ({
  altText: {
    enforcement: 'required',
    autoGenerate: true,
    requireForMedia: true,
  },
  media: {
    captionPolicy: 'preferred',
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
    languages: ['en', 'es'],
    defaultLanguage: 'en',
    signLanguage: 'none',
  },
  compliance: {
    contrast: true,
    focus: true,
    keyboard: true,
    owner: 'Experience Studio',
    lastReviewedAt: timestampIso,
  },
  updatedAt: timestampIso,
});

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [users] = await queryInterface.sequelize.query(
        'SELECT id FROM users ORDER BY id ASC LIMIT 5',
        { transaction },
      );

      if (!users.length) {
        return;
      }

      for (const user of users) {
        const timestampIso = new Date().toISOString();
        const theme = buildPersonalizationTheme(timestampIso);
        const layout = buildPersonalizationLayout(timestampIso);
        const subscriptions = buildPersonalizationSubscriptions(timestampIso);
        const accessibility = buildPersonalizationAccessibility(timestampIso);

        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM user_website_preferences WHERE userId = ?',
          { replacements: [user.id], transaction },
        );

        if (existing.length) {
          await queryInterface.bulkUpdate(
            'user_website_preferences',
            {
              personalization_theme: theme,
              personalization_layout: layout,
              personalization_subscriptions: subscriptions,
              personalization_accessibility: accessibility,
              updatedAt: timestampIso,
            },
            { userId: user.id },
            { transaction },
          );
        } else {
          await queryInterface.bulkInsert(
            'user_website_preferences',
            [
              {
                userId: user.id,
                settings: null,
                theme: null,
                hero: null,
                about: null,
                navigation: null,
                services: null,
                testimonials: null,
                gallery: null,
                contact: null,
                seo: null,
                social: null,
                personalization_theme: theme,
                personalization_layout: layout,
                personalization_subscriptions: subscriptions,
                personalization_accessibility: accessibility,
                createdAt: timestampIso,
                updatedAt: timestampIso,
              },
            ],
            { transaction },
          );
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [users] = await queryInterface.sequelize.query(
        'SELECT id FROM users ORDER BY id ASC LIMIT 5',
        { transaction },
      );

      if (!users.length) {
        return;
      }

      for (const user of users) {
        await queryInterface.bulkUpdate(
          'user_website_preferences',
          {
            personalization_theme: null,
            personalization_layout: null,
            personalization_subscriptions: null,
            personalization_accessibility: null,
          },
          { userId: user.id },
          { transaction },
        );
      }
    });
  },
};
