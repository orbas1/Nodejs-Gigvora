'use strict';

const MENTOR_TABLE = 'mentor_profiles';

function buildSearchVector(mentor) {
  const tokens = [
    mentor.name,
    mentor.headline,
    mentor.bio,
    mentor.region,
    mentor.discipline,
    mentor.availabilityNotes,
    mentor.testimonialHighlight,
    mentor.testimonialHighlightAuthor,
  ];

  if (Array.isArray(mentor.expertise)) {
    tokens.push(...mentor.expertise);
  }

  if (Array.isArray(mentor.industries)) {
    tokens.push(...mentor.industries);
  }

  if (Array.isArray(mentor.languages)) {
    tokens.push(...mentor.languages);
  }

  if (Array.isArray(mentor.goalTags)) {
    tokens.push(...mentor.goalTags);
  }

  if (Array.isArray(mentor.packages)) {
    mentor.packages.forEach((pack) => {
      tokens.push(pack.name, pack.description);
    });
  }

  if (Array.isArray(mentor.testimonials)) {
    mentor.testimonials.forEach((testimonial) => {
      tokens.push(testimonial.quote, testimonial.author);
    });
  }

  return tokens
    .filter((value) => value != null && `${value}`.trim().length)
    .map((value) => `${value}`.trim().toLowerCase())
    .join(' | ');
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const mentors = [
        {
          slug: 'jordan-patel',
          name: 'Jordan Patel',
          headline: 'Product strategy mentor & former CPO',
          bio: 'Scaled two marketplaces from seed to Series C while mentoring leaders on storytelling and prioritisation.',
          region: 'London, United Kingdom',
          discipline: 'Product Leadership',
          expertise: [
            'Roadmapping',
            'Storytelling',
            'Product-market fit',
            'Executive communication',
          ],
          industries: ['Marketplaces', 'SaaS'],
          languages: ['English', 'French'],
          goalTags: ['Fundraising narrative', 'Executive storytelling', 'Scale product leadership'],
          sessionFeeAmount: 280,
          sessionFeeCurrency: 'GBP',
          priceTier: 'tier_growth',
          availabilityStatus: 'open',
          availabilityNotes: 'Tuesdays & Thursdays for deep dives, async Loom reviews on Fridays.',
          responseTimeHours: 6,
          reviewCount: 48,
          rating: 4.93,
          verificationBadge: 'Verified mentor',
          testimonialHighlight: 'Jordan helped our leadership team reframe our roadmap narrative in one sprint.',
          testimonialHighlightAuthor: 'Linh Tran, COO at Pathlight',
          testimonials: [
            {
              quote: 'Every session ended with actionable frameworks our PMs still use.',
              author: 'Maya Ahmed, Director of Product',
            },
            {
              quote: 'Unlocked our product-market fit inflection in six weeks.',
              author: 'Noah Garcia, Founder at RelayOps',
            },
          ],
          packages: [
            {
              name: 'Leadership Pod (6 weeks)',
              description: 'Weekly 60-minute calls with async reviews and stakeholder prep.',
              currency: 'GBP',
              price: 1800,
            },
            {
              name: 'Executive Storytelling Sprint',
              description: 'Three-session package focused on board narrative & capital raises.',
              currency: 'GBP',
              price: 950,
            },
          ],
          avatarUrl: 'https://assets.gigvora.com/mentors/jordan-patel.jpg',
          promoted: true,
          rankingScore: 96.5,
          lastActiveAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        },
        {
          slug: 'amira-chen',
          name: 'Amira Chen',
          headline: 'Revenue operations mentor & GTM operator',
          bio: 'Former VP Revenue Ops at two hyper-growth SaaS scale-ups. Coaches on pipeline diagnostics and rituals.',
          region: 'Singapore & Remote APAC',
          discipline: 'Revenue Operations',
          expertise: ['Revenue enablement', 'Forecasting', 'Deal reviews', 'Sales coaching'],
          industries: ['SaaS', 'Enterprise'],
          languages: ['English', 'Mandarin'],
          goalTags: ['Forecast accuracy', 'Pipeline diagnostics', 'RevOps rituals'],
          sessionFeeAmount: 160,
          sessionFeeCurrency: 'USD',
          priceTier: 'tier_entry',
          availabilityStatus: 'waitlist',
          availabilityNotes: 'Next cohort opens in three weeks. Async deal desk reviews available sooner.',
          responseTimeHours: 18,
          reviewCount: 37,
          rating: 4.87,
          verificationBadge: 'Operator verified',
          testimonialHighlight: 'Amira rebuilt our pipeline hygiene playbook and trained the entire GTM team.',
          testimonialHighlightAuthor: 'Gabriel Ortiz, CRO at Parallel',
          testimonials: [
            {
              quote: 'We now forecast within 3% accuracy thanks to her rituals.',
              author: 'Chloe Rivers, Head of RevOps',
            },
          ],
          packages: [
            {
              name: 'GTM Diagnostic Sprint',
              description: 'Four-week sprint with working sessions, dashboards, and revenue ritual playbooks.',
              currency: 'USD',
              price: 4200,
            },
            {
              name: 'Deal Desk On Demand',
              description: 'Async reviews of enterprise opportunities with recorded Loom feedback.',
              currency: 'USD',
              price: 1200,
            },
          ],
          avatarUrl: 'https://assets.gigvora.com/mentors/amira-chen.jpg',
          promoted: false,
          rankingScore: 91.2,
          lastActiveAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        },
        {
          slug: 'sofia-mensah',
          name: 'Sofia Mensah',
          headline: 'Design ops mentor for hybrid product teams',
          bio: 'Builds systems that blend craft quality with velocity. Ex-Head of Design Ops at three global platforms.',
          region: 'Amsterdam, Netherlands',
          discipline: 'Design Operations',
          expertise: ['Design systems', 'Ops rituals', 'Async collaboration', 'Hiring & leveling'],
          industries: ['Product design', 'Platforms'],
          languages: ['English', 'Dutch'],
          goalTags: ['Design system scale', 'Hybrid rituals', 'Team enablement'],
          sessionFeeAmount: 340,
          sessionFeeCurrency: 'EUR',
          priceTier: 'tier_scale',
          availabilityStatus: 'open',
          availabilityNotes: 'Limited 1:1 slots; prioritises teams booking ops accelerator packages.',
          responseTimeHours: 10,
          reviewCount: 29,
          rating: 4.95,
          verificationBadge: 'Explorer spotlight mentor',
          testimonialHighlight: 'Sofia operationalised our async rituals and lifted craft quality in one quarter.',
          testimonialHighlightAuthor: 'Priya Desai, VP Design at Orbit',
          testimonials: [
            {
              quote: 'We finally have a design system that keeps pace with product sprints.',
              author: 'Jonah Lee, Staff Designer',
            },
            {
              quote: 'Her coaching unlocked collaboration between design, research, and engineering.',
              author: 'Lucia Silva, Product Director',
            },
          ],
          packages: [
            {
              name: 'Design Ops Accelerator',
              description: 'Eight-week embedded mentorship with playbooks, rituals, and hiring support.',
              currency: 'EUR',
              price: 5400,
            },
            {
              name: 'Async Collaboration Audit',
              description: 'Deep dive with runbooks to streamline hybrid collaboration.',
              currency: 'EUR',
              price: 2200,
            },
          ],
          avatarUrl: 'https://assets.gigvora.com/mentors/sofia-mensah.jpg',
          promoted: true,
          rankingScore: 94.4,
          lastActiveAt: new Date(now.getTime() - 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        },
        {
          slug: 'marcus-adeoye',
          name: 'Marcus Adeoye',
          headline: 'Engineering leadership mentor for scaling squads',
          bio: 'Helps staff engineers and managers design resilient platforms and coaching frameworks.',
          region: 'Toronto, Canada',
          discipline: 'Engineering Leadership',
          expertise: ['Platform strategy', 'Coaching ICs', 'Incident response', 'Hiring architecture'],
          industries: ['Platform engineering', 'DevOps'],
          languages: ['English'],
          goalTags: ['Incident response', 'Manager coaching', 'Reliability playbooks'],
          sessionFeeAmount: 230,
          sessionFeeCurrency: 'CAD',
          priceTier: 'tier_growth',
          availabilityStatus: 'booked_out',
          availabilityNotes: 'Currently supporting three teams; join the waitlist for January start dates.',
          responseTimeHours: 24,
          reviewCount: 41,
          rating: 4.89,
          verificationBadge: 'Founding mentor',
          testimonialHighlight: 'Marcus elevated our engineering managers with clear rituals and metrics.',
          testimonialHighlightAuthor: 'Zara Kim, CTO at Northwind',
          testimonials: [
            {
              quote: 'Our incident response time dropped by 35% after his sessions.',
              author: 'Elijah Brooks, Head of Platform',
            },
          ],
          packages: [
            {
              name: 'Manager Coaching Circle',
              description: 'Bi-weekly group coaching with leadership scorecards and accountability loops.',
              currency: 'CAD',
              price: 3100,
            },
            {
              name: 'Incident Command Workshop',
              description: 'Two-week intensive to build muscle around incident response and retrospectives.',
              currency: 'CAD',
              price: 1800,
            },
          ],
          avatarUrl: 'https://assets.gigvora.com/mentors/marcus-adeoye.jpg',
          promoted: false,
          rankingScore: 89.1,
          lastActiveAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        },
      ];

      mentors.forEach((mentor) => {
        mentor.searchVector = buildSearchVector(mentor);
      });

      await queryInterface.bulkInsert(MENTOR_TABLE, mentors, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        MENTOR_TABLE,
        {
          slug: ['jordan-patel', 'amira-chen', 'sofia-mensah', 'marcus-adeoye'],
        },
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
