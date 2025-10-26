'use strict';

const { QueryTypes } = require('sequelize');

const SEO_KEY = 'global';

const META_TEMPLATES = [
  {
    slug: 'executive-overview',
    label: 'Executive overview',
    description: 'Balanced metadata for company and platform landing surfaces.',
    persona: 'Marketing',
    isDefault: true,
    fields: {
      title: 'Gigvora — Operating system for modern operators',
      description:
        'Gigvora unifies dealflow, mentorship, compliance, and go-to-market execution for founders, recruiters, and operators.',
      canonicalUrl: 'https://gigvora.com/',
      robots: 'index,follow',
      focusKeyword: 'professional operating system',
      ogTitle: 'Gigvora · Growth, mentorship & opportunity network',
      ogDescription:
        'A trusted network for founders, freelancers, and hiring teams to collaborate, upskill, and scale responsibly.',
      ogImageUrl: 'https://cdn.gigvora.com/og/marketing-default.png',
      twitterCard: 'summary_large_image',
      keywords: [
        'professional network',
        'mentorship platform',
        'opportunity marketplace',
      ],
    },
    recommendedUseCases: ['Homepage', 'Company overview', 'Press releases'],
  },
  {
    slug: 'product-launch',
    label: 'Launchpad product release',
    description: 'Optimised for new feature and product announcements with social virality baked in.',
    persona: 'Product marketing',
    isDefault: false,
    fields: {
      title: 'Launchpad by Gigvora — AI scouting for elite teams',
      description:
        'Launchpad surfaces investor-ready founders, vetted freelancers, and operators with AI-matched insights and diligence trails.',
      canonicalUrl: 'https://gigvora.com/launchpad',
      robots: 'index,follow',
      focusKeyword: 'AI talent scouting platform',
      ogTitle: 'Launchpad · AI scouting by Gigvora',
      ogDescription:
        'Precision-matched founders, mentors, and dealflow for venture studios, accelerators, and enterprise talent teams.',
      ogImageUrl: 'https://cdn.gigvora.com/og/launchpad.png',
      twitterCard: 'summary_large_image',
      keywords: ['AI scouting', 'talent intelligence', 'venture dealflow'],
    },
    recommendedUseCases: ['Product launch', 'Investor updates', 'Lifecycle campaigns'],
  },
  {
    slug: 'thought-leadership',
    label: 'Thought leadership spotlight',
    description: 'Editorial metadata tuned for high dwell-time, story-driven surfaces.',
    persona: 'Editorial',
    isDefault: false,
    fields: {
      title: 'Mentorship operating system redefining modern work',
      description:
        'Discover how Gigvora pairs mentorship intelligence with curated dealflow so ambitious talent compounds outcomes.',
      canonicalUrl: 'https://gigvora.com/stories/mentorship-operating-system',
      robots: 'index,follow',
      focusKeyword: 'mentorship operating system',
      ogTitle: 'Gigvora Stories · Mentorship operating system',
      ogDescription:
        'A premium look at the mentorship models powering today’s top operators, founders, and venture-backed teams.',
      ogImageUrl: 'https://cdn.gigvora.com/og/story-mentorship.png',
      twitterCard: 'summary_large_image',
      keywords: ['mentorship', 'professional growth', 'gigvora stories'],
    },
    recommendedUseCases: ['Stories', 'Case studies', 'Editorial hubs'],
  },
];

const SCHEMA_TEMPLATES = [
  {
    slug: 'schema-organization',
    label: 'Organization profile',
    description: 'JSON-LD blueprint for the Gigvora organisation entity.',
    schemaType: 'Organization',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Gigvora',
      url: 'https://gigvora.com/',
      logo: 'https://cdn.gigvora.com/brand/logo.png',
      sameAs: [
        'https://www.linkedin.com/company/gigvora',
        'https://twitter.com/gigvora',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'support',
        email: 'support@gigvora.com',
        areaServed: 'Global',
      },
    },
    recommendedFields: ['name', 'url', 'logo', 'sameAs', 'contactPoint'],
    documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/organization',
    lastReviewedAt: new Date('2024-11-10T00:00:00Z'),
  },
  {
    slug: 'schema-article',
    label: 'Article or thought leadership',
    description: 'Structured data for Gigvora Stories and long-form editorial content.',
    schemaType: 'Article',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Mentorship operating system redefining modern work',
      description:
        'How Gigvora combines mentorship intelligence, curated dealflow, and accountable execution pods to accelerate outcomes.',
      author: {
        '@type': 'Person',
        name: 'Avery Mentor',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Gigvora',
        logo: {
          '@type': 'ImageObject',
          url: 'https://cdn.gigvora.com/brand/logo.png',
        },
      },
      datePublished: '2024-02-15',
      dateModified: '2024-02-20',
      mainEntityOfPage: 'https://gigvora.com/stories/mentorship-operating-system',
      image: 'https://cdn.gigvora.com/og/story-mentorship.png',
    },
    recommendedFields: ['headline', 'author', 'image', 'datePublished'],
    documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/article',
    lastReviewedAt: new Date('2024-11-10T00:00:00Z'),
  },
  {
    slug: 'schema-product',
    label: 'Product or feature module',
    description: 'Structured data for Launchpad and other SaaS feature rollouts.',
    schemaType: 'Product',
    jsonTemplate: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Launchpad by Gigvora',
      description:
        'AI-powered scouting that surfaces investor-ready founders, curated freelancers, and operators with diligence notes.',
      brand: {
        '@type': 'Brand',
        name: 'Gigvora',
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/PreOrder',
        price: '0',
        priceCurrency: 'USD',
        url: 'https://gigvora.com/launchpad',
      },
      image: 'https://cdn.gigvora.com/og/launchpad.png',
    },
    recommendedFields: ['name', 'description', 'brand', 'offers'],
    documentationUrl: 'https://developers.google.com/search/docs/appearance/structured-data/product',
    lastReviewedAt: new Date('2024-11-10T00:00:00Z'),
  },
];

const PAGE_OVERRIDES = [
  {
    path: '/',
    title: 'Gigvora — Operating system for modern operators',
    description:
      'Gigvora unifies dealflow, mentorship, compliance, and go-to-market execution for founders, recruiters, and operators.',
    keywords: ['professional network', 'mentorship platform', 'opportunity marketplace'],
    focusKeyword: 'professional operating system',
    canonicalUrl: 'https://gigvora.com/',
    robots: 'index,follow',
    social: {
      ogTitle: 'Gigvora · Growth, mentorship & opportunity network',
      ogDescription:
        'A trusted network for founders, freelancers, and hiring teams to collaborate, upskill, and scale responsibly.',
      ogImageUrl: 'https://cdn.gigvora.com/og/marketing-default.png',
    },
    twitter: {
      title: 'Gigvora · Growth, mentorship & opportunity network',
      description:
        'A trusted network for founders, freelancers, and hiring teams to collaborate, upskill, and scale responsibly.',
      cardType: 'summary_large_image',
      imageUrl: 'https://cdn.gigvora.com/og/marketing-default.png',
    },
    noindex: false,
  },
  {
    path: '/launchpad',
    title: 'Launchpad by Gigvora — AI scouting for elite teams',
    description:
      'Launchpad surfaces vetted founders, creators, and operators with AI scoring, diligence trails, and warm intro orchestration.',
    keywords: ['AI scouting', 'talent intelligence', 'venture dealflow'],
    focusKeyword: 'AI talent scouting platform',
    canonicalUrl: 'https://gigvora.com/launchpad',
    robots: 'index,follow',
    social: {
      ogTitle: 'Launchpad · AI scouting by Gigvora',
      ogDescription:
        'Precision-matched founders, mentors, and dealflow for venture studios, accelerators, and enterprise talent teams.',
      ogImageUrl: 'https://cdn.gigvora.com/og/launchpad.png',
    },
    twitter: {
      title: 'Launchpad · AI scouting by Gigvora',
      description:
        'Precision-matched founders, mentors, and dealflow for venture studios, accelerators, and enterprise talent teams.',
      cardType: 'summary_large_image',
      imageUrl: 'https://cdn.gigvora.com/og/launchpad.png',
    },
    noindex: false,
  },
  {
    path: '/stories/mentorship-operating-system',
    title: 'Mentorship operating system redefining modern work',
    description:
      'Discover how Gigvora pairs mentorship intelligence with curated dealflow so ambitious talent compounds outcomes.',
    keywords: ['mentorship', 'professional growth', 'gigvora stories'],
    focusKeyword: 'mentorship operating system',
    canonicalUrl: 'https://gigvora.com/stories/mentorship-operating-system',
    robots: 'index,follow',
    social: {
      ogTitle: 'Gigvora Stories · Mentorship operating system',
      ogDescription:
        'A premium look at the mentorship models powering today’s top operators, founders, and venture-backed teams.',
      ogImageUrl: 'https://cdn.gigvora.com/og/story-mentorship.png',
    },
    twitter: {
      title: 'Gigvora Stories · Mentorship operating system',
      description:
        'A premium look at the mentorship models powering today’s top operators, founders, and venture-backed teams.',
      cardType: 'summary_large_image',
      imageUrl: 'https://cdn.gigvora.com/og/story-mentorship.png',
    },
    noindex: false,
  },
];

const SAMPLE_SITEMAP_XML =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' +
  '<url><loc>https://gigvora.com/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>' +
  '<url><loc>https://gigvora.com/launchpad</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>' +
  '<url><loc>https://gigvora.com/stories/mentorship-operating-system</loc><priority>0.7</priority><changefreq>weekly</changefreq></url>' +
  '</urlset>';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const [existingSetting] = await queryInterface.sequelize.query(
        'SELECT id FROM seo_settings WHERE key = :key LIMIT 1',
        {
          replacements: { key: SEO_KEY },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const settingPayload = {
        key: SEO_KEY,
        siteName: 'Gigvora',
        defaultTitle: 'Gigvora — Operating system for modern operators',
        defaultDescription:
          'Gigvora unifies dealflow, mentorship, compliance, and go-to-market execution so ambitious teams ship faster.',
        defaultKeywords: JSON.stringify(['professional network', 'mentorship platform', 'growth operations']),
        canonicalBaseUrl: 'https://gigvora.com',
        sitemapUrl: 'https://gigvora.com/sitemap.xml',
        allowIndexing: true,
        robotsPolicy: 'User-agent: *\nDisallow:',
        noindexPaths: JSON.stringify(['/internal', '/admin']),
        verificationCodes: JSON.stringify({ google: 'google-site-verification-123' }),
        socialDefaults: JSON.stringify({
          ogTitle: 'Gigvora · Growth, mentorship & opportunity network',
          ogDescription:
            'A trusted network for founders, freelancers, and hiring teams to collaborate, upskill, and scale responsibly.',
          ogImageUrl: 'https://cdn.gigvora.com/og/marketing-default.png',
        }),
        structuredData: JSON.stringify({
          organization: {
            name: 'Gigvora',
            url: 'https://gigvora.com/',
            logoUrl: 'https://cdn.gigvora.com/brand/logo.png',
            contactEmail: 'support@gigvora.com',
            sameAs: ['https://www.linkedin.com/company/gigvora', 'https://twitter.com/gigvora'],
          },
        }),
        updatedAt: now,
      };

      let settingId;
      if (existingSetting) {
        settingId = existingSetting.id;
        await queryInterface.bulkUpdate('seo_settings', settingPayload, { id: settingId }, { transaction });
      } else {
        await queryInterface.bulkInsert('seo_settings', [{ ...settingPayload, createdAt: now }], { transaction });
        const [insertedSetting] = await queryInterface.sequelize.query(
          'SELECT id FROM seo_settings WHERE key = :key LIMIT 1',
          {
            replacements: { key: SEO_KEY },
            type: QueryTypes.SELECT,
            transaction,
          },
        );
        settingId = insertedSetting.id;
      }

      const overrides = PAGE_OVERRIDES.map((override, index) => ({
        seoSettingId: settingId,
        path: override.path,
        title: override.title,
        description: override.description,
        keywords: JSON.stringify(override.keywords),
        focusKeyword: override.focusKeyword,
        canonicalUrl: override.canonicalUrl,
        robots: override.robots,
        social: JSON.stringify(override.social),
        twitter: JSON.stringify(override.twitter),
        structuredData: JSON.stringify({}),
        metaTags: JSON.stringify([]),
        noindex: override.noindex,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkDelete(
        'seo_page_overrides',
        { seoSettingId: settingId, path: overrides.map((item) => item.path) },
        { transaction },
      );
      await queryInterface.bulkInsert('seo_page_overrides', overrides, { transaction });

      const metaRows = META_TEMPLATES.map((template) => ({
        slug: template.slug,
        label: template.label,
        description: template.description,
        persona: template.persona,
        fields: JSON.stringify(template.fields),
        recommendedUseCases: JSON.stringify(template.recommendedUseCases),
        isDefault: template.isDefault,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkDelete(
        'seo_meta_templates',
        { slug: META_TEMPLATES.map((template) => template.slug) },
        { transaction },
      );
      await queryInterface.bulkInsert('seo_meta_templates', metaRows, { transaction });

      const schemaRows = SCHEMA_TEMPLATES.map((template) => ({
        slug: template.slug,
        label: template.label,
        description: template.description,
        schemaType: template.schemaType,
        jsonTemplate: JSON.stringify(template.jsonTemplate),
        sampleData: JSON.stringify(template.sampleData ?? null),
        recommendedFields: JSON.stringify(template.recommendedFields ?? null),
        richResultPreview: JSON.stringify(template.richResultPreview ?? null),
        documentationUrl: template.documentationUrl,
        isActive: true,
        lastReviewedAt: template.lastReviewedAt,
        createdAt: now,
        updatedAt: now,
      }));

      await queryInterface.bulkDelete(
        'seo_schema_templates',
        { slug: SCHEMA_TEMPLATES.map((template) => template.slug) },
        { transaction },
      );
      await queryInterface.bulkInsert('seo_schema_templates', schemaRows, { transaction });

      await queryInterface.bulkInsert(
        'seo_sitemap_jobs',
        [
          {
            seoSettingId: settingId,
            baseUrl: 'https://gigvora.com',
            includeImages: false,
            includeLastModified: false,
            totalUrls: 3,
            indexedUrls: 3,
            warnings: JSON.stringify([]),
            xml: SAMPLE_SITEMAP_XML,
            status: 'generated',
            message: 'Seeded baseline sitemap job',
            triggeredBy: JSON.stringify({ actorEmail: 'seed@gigvora.com', actorName: 'Seeder', actorId: null }),
            generatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [setting] = await queryInterface.sequelize.query(
        'SELECT id FROM seo_settings WHERE key = :key LIMIT 1',
        {
          replacements: { key: SEO_KEY },
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const settingId = setting?.id;

      await queryInterface.bulkDelete(
        'seo_sitemap_jobs',
        { message: 'Seeded baseline sitemap job' },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'seo_schema_templates',
        { slug: SCHEMA_TEMPLATES.map((template) => template.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'seo_meta_templates',
        { slug: META_TEMPLATES.map((template) => template.slug) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'seo_page_overrides',
        settingId
          ? { seoSettingId: settingId, path: PAGE_OVERRIDES.map((override) => override.path) }
          : { path: PAGE_OVERRIDES.map((override) => override.path) },
        { transaction },
      );
    });
  },
};
