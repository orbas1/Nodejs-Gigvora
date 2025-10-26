'use strict';

const { QueryTypes, Op } = require('sequelize');

function now() {
  return new Date();
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const authorRows = await queryInterface.sequelize.query(
        'SELECT id, email FROM users WHERE email = :email LIMIT 1',
        { replacements: { email: 'ava@gigvora.com' }, type: QueryTypes.SELECT, transaction },
      );

      const author = authorRows[0];

      if (!author || !author.id) {
        throw new Error('Seed author ava@gigvora.com is required for blog seed data.');
      }

      const categories = [
        {
          name: 'Platform strategy',
          slug: 'platform-strategy',
          description:
            'Executive playbooks, monetisation frameworks, and governance rituals that keep platform growth on-track.',
          accentColor: '#312E81',
          heroImageUrl: 'https://assets.gigvora.test/blog/platform-strategy-hero.jpg',
          metadata: { priority: 'core' },
        },
        {
          name: 'Trust & Safety',
          slug: 'trust-and-safety',
          description:
            'Compliance, reputation, and protection systems designed for global talent and marketplace ecosystems.',
          accentColor: '#0F172A',
          heroImageUrl: 'https://assets.gigvora.test/blog/trust-safety-hero.jpg',
          metadata: { priority: 'spotlight' },
        },
        {
          name: 'Growth Experiments',
          slug: 'growth-experiments',
          description: 'Signals, measurement loops, and experiment rituals powering sustainable activation and retention.',
          accentColor: '#1D4ED8',
          heroImageUrl: 'https://assets.gigvora.test/blog/growth-experiments-hero.jpg',
          metadata: { priority: 'rotating' },
        },
      ];

      const categorySlugs = categories.map((item) => item.slug);
      const existingCategories = await queryInterface.sequelize.query(
        'SELECT id, slug FROM blog_categories WHERE slug IN (:slugs)',
        { replacements: { slugs: categorySlugs }, type: QueryTypes.SELECT, transaction },
      );
      const existingCategorySlugs = new Set(existingCategories.map((item) => item.slug));
      const timestamp = now();

      if (existingCategorySlugs.size !== categories.length) {
        const toInsert = categories
          .filter((category) => !existingCategorySlugs.has(category.slug))
          .map((category) => ({ ...category, createdAt: timestamp, updatedAt: timestamp }));
        if (toInsert.length > 0) {
          await queryInterface.bulkInsert('blog_categories', toInsert, { transaction });
        }
      }

      const categoryRecords = await queryInterface.sequelize.query(
        'SELECT id, slug FROM blog_categories WHERE slug IN (:slugs)',
        { replacements: { slugs: categorySlugs }, type: QueryTypes.SELECT, transaction },
      );
      const categoryIdBySlug = Object.fromEntries(categoryRecords.map((item) => [item.slug, item.id]));

      const tags = [
        {
          name: 'Product leadership',
          slug: 'product-leadership',
          description: 'Rituals and stakeholder frameworks for leading complex product organisations.',
        },
        {
          name: 'Compliance operations',
          slug: 'compliance-operations',
          description: 'Scalable systems for policy, trust, and compliance across distributed workforces.',
        },
        {
          name: 'Growth loops',
          slug: 'growth-loops',
          description: 'Experiments, telemetry, and measurement that compound activation and retention.',
        },
        {
          name: 'Operator spotlight',
          slug: 'operator-spotlight',
          description: 'Insights from experienced platform operators and advisors.',
        },
      ];

      const tagSlugs = tags.map((item) => item.slug);
      const existingTags = await queryInterface.sequelize.query(
        'SELECT id, slug FROM blog_tags WHERE slug IN (:slugs)',
        { replacements: { slugs: tagSlugs }, type: QueryTypes.SELECT, transaction },
      );
      const existingTagSlugs = new Set(existingTags.map((item) => item.slug));
      if (existingTagSlugs.size !== tags.length) {
        const toInsert = tags
          .filter((tag) => !existingTagSlugs.has(tag.slug))
          .map((tag) => ({ ...tag, createdAt: timestamp, updatedAt: timestamp }));
        if (toInsert.length > 0) {
          await queryInterface.bulkInsert('blog_tags', toInsert, { transaction });
        }
      }

      const tagRecords = await queryInterface.sequelize.query(
        'SELECT id, slug FROM blog_tags WHERE slug IN (:slugs)',
        { replacements: { slugs: tagSlugs }, type: QueryTypes.SELECT, transaction },
      );
      const tagIdBySlug = Object.fromEntries(tagRecords.map((item) => [item.slug, item.id]));

      const mediaSeeds = [
        {
          url: 'https://assets.gigvora.test/blog/trust-operating-system.jpg',
          type: 'image',
          altText: 'Operator reviewing a unified trust dashboard',
          caption: 'Trust operating system playbook overview',
          metadata: { theme: 'indigo' },
        },
        {
          url: 'https://assets.gigvora.test/blog/activation-sprint.jpg',
          type: 'image',
          altText: 'Team running activation experiment review',
          caption: 'Weekly activation stand-up in action',
          metadata: { theme: 'blue' },
        },
        {
          url: 'https://assets.gigvora.test/blog/expert-network.jpg',
          type: 'image',
          altText: 'Gigvora operator network session',
          caption: 'Expert network AMA session',
          metadata: { theme: 'violet' },
        },
        {
          url: 'https://assets.gigvora.test/blog/metrics-dashboard.jpg',
          type: 'image',
          altText: 'Analytics dashboard showing core blog metrics',
          caption: 'Blog analytics instrumentation',
          metadata: { theme: 'slate' },
        },
      ];

      const mediaUrls = mediaSeeds.map((item) => item.url);
      const existingMedia = await queryInterface.sequelize.query(
        'SELECT id, url FROM blog_media WHERE url IN (:urls)',
        { replacements: { urls: mediaUrls }, type: QueryTypes.SELECT, transaction },
      );
      const existingMediaUrls = new Set(existingMedia.map((item) => item.url));
      if (existingMediaUrls.size !== mediaSeeds.length) {
        const toInsert = mediaSeeds
          .filter((media) => !existingMediaUrls.has(media.url))
          .map((media) => ({ ...media, createdAt: timestamp, updatedAt: timestamp }));
        if (toInsert.length > 0) {
          await queryInterface.bulkInsert('blog_media', toInsert, { transaction });
        }
      }

      const mediaRecords = await queryInterface.sequelize.query(
        'SELECT id, url FROM blog_media WHERE url IN (:urls)',
        { replacements: { urls: mediaUrls }, type: QueryTypes.SELECT, transaction },
      );
      const mediaIdByUrl = Object.fromEntries(mediaRecords.map((item) => [item.url, item.id]));

      const posts = [
        {
          title: 'Building a trust operating system for marketplace leaders',
          slug: 'trust-operating-system-for-marketplace-leaders',
          excerpt:
            'Translate policy, verification, and telemetry into a single operating rhythm that keeps your marketplace credible at scale.',
          category: 'trust-and-safety',
          coverImage: 'https://assets.gigvora.test/blog/trust-operating-system.jpg',
          readingTimeMinutes: 9,
          featured: true,
          content:
            '<p>Operators ask how to keep velocity high while protecting the brand. The answer is an intentional trust operating system with shared rituals and measurable guardrails.</p>' +
            '<h2>Anchor on a joint risk register</h2>' +
            '<p>Co-create a living risk register with policy, operations, and engineering. Map threat scenarios, attach telemetry, and agree response owners before an incident lands.</p>' +
            '<h2>Instrument every workflow</h2>' +
            '<p>Pair qualitative reviews with quantitative dashboards. Measure verification latency, false-positive rates, and enforcement resolution times so teams have shared context.</p>' +
            '<h3>Design feedback loops</h3>' +
            '<p>Feed insights from trust reviews into product and compliance roadmaps. The loop ensures experiments stay aligned with regulatory expectations.</p>' +
            '<h2>Upskill through the network</h2>' +
            '<p>Schedule quarterly AMAs with peers tackling similar surfaces. Use real stories to evolve playbooks, not abstract policy memos.</p>',
          meta: {
            hero: {
              eyebrow: 'Trust & Safety',
              cta: { label: 'Book a trust diagnostic', href: 'https://cal.com/gigvora/trust-diagnostic' },
            },
            signals: ['Verification latency under 8 minutes', 'Policy adherence score above 92%'],
          },
          tags: ['compliance-operations', 'product-leadership', 'operator-spotlight'],
          metrics: {
            totalViews: 18432,
            uniqueVisitors: 14201,
            averageReadTimeSeconds: 512,
            readCompletionRate: 68.4,
            clickThroughRate: 7.6,
            bounceRate: 24.3,
            shareCount: 389,
            likeCount: 812,
            subscriberConversions: 147,
          },
          comments: [
            {
              authorName: 'Cara Reynolds',
              authorEmail: 'cara.reynolds@example.com',
              body:
                'We implemented the shared risk register last quarter and saw alignment improve overnight. Highly recommend replicating the cadence notes.',
              status: 'approved',
              publishedAt: new Date(),
            },
          ],
          media: [
            {
              url: 'https://assets.gigvora.test/blog/metrics-dashboard.jpg',
              position: 0,
              role: 'inline-insight',
              caption: 'Trust telemetry mapped to policy response owners.',
            },
          ],
        },
        {
          title: 'Activation sprints: orchestrating 30-day conversion wins',
          slug: 'activation-sprints-30-day-conversion-wins',
          excerpt:
            'Design a four-week activation sprint that ties instrumentation, onboarding, and success rituals into measurable lift.',
          category: 'growth-experiments',
          coverImage: 'https://assets.gigvora.test/blog/activation-sprint.jpg',
          readingTimeMinutes: 7,
          featured: false,
          content:
            '<p>High-performing teams move activation metrics with disciplined sprints. Each week focuses on a different lever to maintain momentum.</p>' +
            '<h2>Week 1: instrumentation and baselines</h2>' +
            '<p>Audit funnels, confirm event integrity, and define the single activation metric you will protect.</p>' +
            '<h2>Week 2: onboarding narrative</h2>' +
            '<p>Test a guided walkthrough, short-form video, and human concierge to understand which combinations drive completion.</p>' +
            '<h3>Week 3: nudges & enablement</h3>' +
            '<p>Pair lifecycle messaging with in-product prompts. Sequence them against behaviour, not time-based blasts.</p>' +
            '<h2>Week 4: review & social proof</h2>' +
            '<p>Close the sprint with a high-signal retrospective. Capture wins, document misses, and decide what becomes a standing ritual.</p>',
          meta: {
            hero: {
              eyebrow: 'Growth Experiments',
              cta: { label: 'Download activation template', href: 'https://assets.gigvora.test/templates/activation-kit.pdf' },
            },
            checklist: ['Activation metric defined', 'Lifecycle flow QA complete', 'Experiment brief signed-off'],
          },
          tags: ['growth-loops', 'product-leadership'],
          metrics: {
            totalViews: 12678,
            uniqueVisitors: 10334,
            averageReadTimeSeconds: 398,
            readCompletionRate: 61.9,
            clickThroughRate: 5.4,
            bounceRate: 28.1,
            shareCount: 211,
            likeCount: 532,
            subscriberConversions: 89,
          },
          comments: [],
          media: [
            {
              url: 'https://assets.gigvora.test/blog/expert-network.jpg',
              position: 1,
              role: 'pull-quote',
              caption: 'Operator roundtable dissecting activation experiments.',
            },
          ],
        },
        {
          title: 'Inside the operator network: playbook roundtables every founder should join',
          slug: 'operator-network-playbook-roundtables',
          excerpt:
            'A behind-the-scenes look at how Gigvora curates operator roundtables to de-risk product, trust, and revenue bets.',
          category: 'platform-strategy',
          coverImage: 'https://assets.gigvora.test/blog/expert-network.jpg',
          readingTimeMinutes: 6,
          featured: false,
          content:
            '<p>The operator network blends vetted experts, actionable briefs, and outcomes-focused facilitation.</p>' +
            '<h2>Curated cohorts with common missions</h2>' +
            '<p>Each roundtable is limited to eight operators tackling a shared objective, ensuring relevance from the first minute.</p>' +
            '<h2>Briefs that start with the desired outcome</h2>' +
            '<p>We distribute briefs that outline desired outcomes, constraints, and critical metrics so the session skips surface-level chatter.</p>' +
            '<h3>Moderated insights library</h3>' +
            '<p>Sessions are synthesised into anonymised briefs, letting teams operationalise insights without exposing sensitive data.</p>' +
            '<h2>Instrumented follow-through</h2>' +
            '<p>Growth advisors stay close for 30 days after the session to help translate insight into shipped work.</p>',
          meta: {
            hero: {
              eyebrow: 'Platform Strategy',
              cta: { label: 'Request a seat', href: 'https://cal.com/gigvora/operator-roundtable' },
            },
            stats: ['82% of members ship outcomes within 30 days', 'Net promoter score 74'],
          },
          tags: ['operator-spotlight', 'product-leadership'],
          metrics: {
            totalViews: 9876,
            uniqueVisitors: 8011,
            averageReadTimeSeconds: 355,
            readCompletionRate: 59.4,
            clickThroughRate: 6.1,
            bounceRate: 22.5,
            shareCount: 167,
            likeCount: 421,
            subscriberConversions: 72,
          },
          comments: [],
          media: [
            {
              url: 'https://assets.gigvora.test/blog/activation-sprint.jpg',
              position: 0,
              role: 'gallery',
              caption: 'Roundtable breakout board from a recent session.',
            },
          ],
        },
      ];

      const postSlugs = posts.map((item) => item.slug);
      const existingPosts = await queryInterface.sequelize.query(
        'SELECT id, slug FROM blog_posts WHERE slug IN (:slugs)',
        { replacements: { slugs: postSlugs }, type: QueryTypes.SELECT, transaction },
      );
      const existingPostSlugs = new Set(existingPosts.map((item) => item.slug));

      const postsToInsert = posts
        .filter((post) => !existingPostSlugs.has(post.slug))
        .map((post) => ({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          status: 'published',
          publishedAt: timestamp,
          readingTimeMinutes: post.readingTimeMinutes,
          featured: post.featured,
          authorId: author.id,
          categoryId: categoryIdBySlug[post.category] ?? null,
          coverImageId: mediaIdByUrl[post.coverImage] ?? null,
          meta: post.meta,
          createdAt: timestamp,
          updatedAt: timestamp,
        }));

      if (postsToInsert.length > 0) {
        await queryInterface.bulkInsert('blog_posts', postsToInsert, { transaction });
      }

      const postRecords = await queryInterface.sequelize.query(
        'SELECT id, slug FROM blog_posts WHERE slug IN (:slugs)',
        { replacements: { slugs: postSlugs }, type: QueryTypes.SELECT, transaction },
      );
      const postIdBySlug = Object.fromEntries(postRecords.map((item) => [item.slug, item.id]));

      const tagJoinRows = posts.flatMap((post) => {
        const postId = postIdBySlug[post.slug];
        if (!postId) {
          return [];
        }
        return post.tags
          .map((tagSlug) => tagIdBySlug[tagSlug])
          .filter(Boolean)
          .map((tagId) => ({
            postId,
            tagId,
            createdAt: timestamp,
            updatedAt: timestamp,
          }));
      });

      if (tagJoinRows.length > 0) {
        const existingPostTags = await queryInterface.sequelize.query(
          'SELECT postId, tagId FROM blog_post_tags WHERE postId IN (:postIds)',
          {
            replacements: { postIds: postRecords.map((item) => item.id) },
            type: QueryTypes.SELECT,
            transaction,
          },
        );
        const existingPairs = new Set(existingPostTags.map((row) => `${row.postId}:${row.tagId}`));
        const filtered = tagJoinRows.filter((row) => !existingPairs.has(`${row.postId}:${row.tagId}`));
        if (filtered.length > 0) {
          await queryInterface.bulkInsert('blog_post_tags', filtered, { transaction });
        }
      }

      const metricsRows = posts.flatMap((post) => {
        const postId = postIdBySlug[post.slug];
        if (!postId) {
          return [];
        }
        return [
          {
            postId,
            totalViews: post.metrics.totalViews,
            uniqueVisitors: post.metrics.uniqueVisitors,
            averageReadTimeSeconds: post.metrics.averageReadTimeSeconds,
            readCompletionRate: post.metrics.readCompletionRate,
            clickThroughRate: post.metrics.clickThroughRate,
            bounceRate: post.metrics.bounceRate,
            shareCount: post.metrics.shareCount,
            likeCount: post.metrics.likeCount,
            subscriberConversions: post.metrics.subscriberConversions,
            commentCount: post.comments.length,
            lastSyncedAt: timestamp,
            metadata: { seeded: true },
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ];
      });

      if (metricsRows.length > 0) {
        const existingMetrics = await queryInterface.sequelize.query(
          'SELECT postId FROM blog_post_metrics WHERE postId IN (:postIds)',
          {
            replacements: { postIds: postRecords.map((item) => item.id) },
            type: QueryTypes.SELECT,
            transaction,
          },
        );
        const existingMetricPostIds = new Set(existingMetrics.map((row) => row.postId));
        const filtered = metricsRows.filter((row) => !existingMetricPostIds.has(row.postId));
        if (filtered.length > 0) {
          await queryInterface.bulkInsert('blog_post_metrics', filtered, { transaction });
        }
      }

      const mediaLinkRows = posts.flatMap((post) => {
        const postId = postIdBySlug[post.slug];
        if (!postId) {
          return [];
        }
        return post.media
          .map((item) => ({
            postId,
            mediaId: mediaIdByUrl[item.url] ?? null,
            position: item.position ?? 0,
            role: item.role ?? null,
            caption: item.caption ?? null,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))
          .filter((row) => row.mediaId);
      });

      if (mediaLinkRows.length > 0) {
        const existingMediaLinks = await queryInterface.sequelize.query(
          'SELECT postId, mediaId FROM blog_post_media WHERE postId IN (:postIds)',
          {
            replacements: { postIds: postRecords.map((item) => item.id) },
            type: QueryTypes.SELECT,
            transaction,
          },
        );
        const existingMediaPairs = new Set(existingMediaLinks.map((row) => `${row.postId}:${row.mediaId}`));
        const filtered = mediaLinkRows.filter((row) => !existingMediaPairs.has(`${row.postId}:${row.mediaId}`));
        if (filtered.length > 0) {
          await queryInterface.bulkInsert('blog_post_media', filtered, { transaction });
        }
      }

      const commentRows = posts.flatMap((post) => {
        const postId = postIdBySlug[post.slug];
        if (!postId || post.comments.length === 0) {
          return [];
        }
        return post.comments.map((comment) => ({
          postId,
          parentId: null,
          authorId: null,
          authorName: comment.authorName,
          authorEmail: comment.authorEmail,
          body: comment.body,
          status: comment.status,
          isPinned: false,
          likeCount: 0,
          flagCount: 0,
          metadata: { seeded: true },
          publishedAt: comment.publishedAt,
          editedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        }));
      });

      if (commentRows.length > 0) {
        await queryInterface.bulkInsert('blog_post_comments', commentRows, { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const postSlugs = [
        'trust-operating-system-for-marketplace-leaders',
        'activation-sprints-30-day-conversion-wins',
        'operator-network-playbook-roundtables',
      ];
      const posts = await queryInterface.sequelize.query(
        'SELECT id FROM blog_posts WHERE slug IN (:slugs)',
        { replacements: { slugs: postSlugs }, type: QueryTypes.SELECT, transaction },
      );
      const postIds = posts.map((item) => item.id);

      if (postIds.length > 0) {
        await queryInterface.bulkDelete('blog_post_comments', { postId: { [Op.in]: postIds } }, { transaction });
        await queryInterface.bulkDelete('blog_post_media', { postId: { [Op.in]: postIds } }, { transaction });
        await queryInterface.bulkDelete('blog_post_tags', { postId: { [Op.in]: postIds } }, { transaction });
        await queryInterface.bulkDelete('blog_post_metrics', { postId: { [Op.in]: postIds } }, { transaction });
        await queryInterface.bulkDelete('blog_posts', { id: { [Op.in]: postIds } }, { transaction });
      }

      const mediaUrls = [
        'https://assets.gigvora.test/blog/trust-operating-system.jpg',
        'https://assets.gigvora.test/blog/activation-sprint.jpg',
        'https://assets.gigvora.test/blog/expert-network.jpg',
        'https://assets.gigvora.test/blog/metrics-dashboard.jpg',
      ];
      await queryInterface.bulkDelete('blog_media', { url: { [Op.in]: mediaUrls } }, { transaction });

      const tagSlugs = [
        'product-leadership',
        'compliance-operations',
        'growth-loops',
        'operator-spotlight',
      ];
      await queryInterface.bulkDelete('blog_tags', { slug: { [Op.in]: tagSlugs } }, { transaction });

      const categorySlugs = ['platform-strategy', 'trust-and-safety', 'growth-experiments'];
      await queryInterface.bulkDelete('blog_categories', { slug: { [Op.in]: categorySlugs } }, { transaction });
    });
  },
};
