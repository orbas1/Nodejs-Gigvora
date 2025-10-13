'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');

const seedTag = 'version_1_50_seed';

const seededIds = {
  users: [1, 2, 3, 4],
  profiles: [1, 2],
  profileReferences: [1, 2, 3],
  companyProfiles: [1],
  agencyProfiles: [1],
  freelancerProfiles: [1],
  feedPosts: [1, 2],
  jobs: [1, 2],
  gigs: [1],
  catalogBundles: [1, 2, 3],
  catalogBundleMetrics: [1, 2, 3, 4, 5, 6],
  repeatClients: [1, 2, 3, 4, 5],
  crossSellOpportunities: [1, 2, 3],
  keywordImpressions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  marginSnapshots: [1, 2, 3, 4],
  projects: [1],
  experienceLaunchpads: [1],
  experienceLaunchpadApplications: [1, 2],
  experienceLaunchpadEmployerRequests: [1],
  experienceLaunchpadPlacements: [1],
  experienceLaunchpadOpportunityLinks: [1, 2],
  volunteeringRoles: [1],
  groups: [1],
  groupMemberships: [1, 2],
  connections: [1],
  applications: [1, 2],
  applicationReviews: [1, 2],
  messageThreads: [1],
  messageParticipants: [1, 2],
  messages: [1, 2, 3],
  messageAttachments: [1],
  notifications: [1, 2],
  notificationPreferences: [1, 2, 3, 4],
  analyticsEvents: [1, 2],
  analyticsDailyRollups: [1, 2],
  providerWorkspaces: [1],
  providerWorkspaceMembers: [1, 2],
  providerWorkspaceInvites: [1],
  providerContactNotes: [1],
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const dayMs = 24 * 60 * 60 * 1000;
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * dayMs);
      const twoDaysAgo = new Date(now.getTime() - 2 * dayMs);
      const yesterday = new Date(now.getTime() - 1 * dayMs);
      const sevenDaysAgo = new Date(now.getTime() - 7 * dayMs);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * dayMs);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * dayMs);
      const fortyFiveDaysAgo = new Date(now.getTime() - 45 * dayMs);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * dayMs);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * dayMs);

      const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const previousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const twoMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
      const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
      const leoFreelancerId = seededIds.users[1];

      await queryInterface.bulkInsert(
        'users',
        [
          {
            id: seededIds.users[0],
            firstName: 'Ava',
            lastName: 'Founder',
            email: 'ava@gigvora.com',
            password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
            address: '123 Innovation Way, Remote City',
            age: 32,
            userType: 'admin',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[1],
            firstName: 'Leo',
            lastName: 'Freelancer',
            email: 'leo@gigvora.com',
            password: '$2b$10$n6MPrXwN6kPymBi/GsMBCecal.lOEWTWmr25RR80Gn3mtiq3IztUG',
            address: '456 Remote Ave, Digital Nomad',
            age: 27,
            userType: 'freelancer',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[2],
            firstName: 'Mia',
            lastName: 'Operations',
            email: 'mia@gigvora.com',
            password: '$2b$10$16DRKd2uYS0frdHpDq.5gOQWKmrW.OqYk8ytxzPm/w76dRvrxH6zi',
            address: '789 Strategy Blvd, Growth City',
            age: 35,
            userType: 'company',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[3],
            firstName: 'Noah',
            lastName: 'Agency',
            email: 'noah@gigvora.com',
            password: '$2b$10$2Fz95ZCARlX/2Pw1zQfztOC8XC7VW9wrXxlih/FYO1QPwI7EVP3p.',
            address: '25 Collaboration Square, Agency City',
            age: 38,
            userType: 'agency',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'profiles',
        [
          {
            id: seededIds.profiles[0],
            userId: seededIds.users[1],
            headline: 'Principal Full Stack Developer',
            bio: 'Freelancer specialising in high-growth marketplace platforms with emphasis on reliability and instrumentation.',
            skills: 'Node.js, React, PostgreSQL, AWS, Terraform',
            experience: '7 years delivering venture-backed SaaS platforms with cross-functional leadership.',
            education: 'BSc Computer Science, Remote Tech University',
            location: 'Remote • Berlin, Germany',
            timezone: 'Europe/Berlin',
            missionStatement:
              'Pairing high-trust product engineering with inclusive hiring programmes so every cohort ships with confidence.',
            areasOfFocus: ['Marketplace reliability', 'Analytics instrumentation', 'Mentorship'],
            availabilityStatus: 'available',
            availableHoursPerWeek: 28,
            openToRemote: true,
            availabilityNotes: 'Accepting remote-first pods with a two-week onboarding window.',
            availabilityUpdatedAt: yesterday,
            trustScore: 4.82,
            likesCount: 96,
            followersCount: 1280,
            qualifications: [
              {
                title: 'AWS Certified Solutions Architect – Associate',
                authority: 'Amazon Web Services',
                year: 2022,
                credentialUrl: 'https://credentials.example.com/aws-saa-leo',
              },
              {
                title: 'Certified Scrum Professional',
                authority: 'Scrum Alliance',
                year: 2021,
              },
            ],
            experienceEntries: [
              {
                organization: 'Nova Agency',
                role: 'Lead Engineer (Contract)',
                startDate: '2023-01-15',
                endDate: null,
                description:
                  'Scaling multi-tenant gig marketplace infrastructure, observability, and escrow integrations for venture clients.',
                highlights: [
                  'Raised p95 project workspace uptime to 99.97% across three regions.',
                  'Launched fairness scoring and analytics instrumentation for auto-assign.',
                ],
              },
              {
                organization: 'Atlas Labs',
                role: 'Senior Full Stack Developer',
                startDate: '2020-03-01',
                endDate: '2022-12-01',
                description:
                  'Led growth experiments, refactored the React design system, and bootstrapped the remote mentorship guild.',
                highlights: [
                  'Delivered five launchpad cohorts with end-to-end analytics funnels.',
                  'Mentored 40+ engineers through marketplace readiness sprints.',
                ],
              },
            ],
            statusFlags: ['launchpad_alumni', 'mentor', 'auto_assign_opt_in'],
            launchpadEligibility: {
              status: 'eligible',
              score: 92.5,
              cohorts: ['Emerging Leaders Fellowship'],
              track: 'Product Engineering',
              lastEvaluatedAt: yesterday,
            },
            volunteerBadges: ['community_mentor', 'open_source_contributor'],
            portfolioLinks: [
              { label: 'Portfolio', url: 'https://portfolio.leo.example.com' },
              {
                label: 'Launchpad automation case study',
                url: 'https://portfolio.leo.example.com/launchpad-automation',
              },
            ],
            preferredEngagements: ['Launch readiness pods', 'Mentorship', 'Discovery sprints'],
            collaborationRoster: [
              { name: 'Noor Designer', role: 'Product Design', avatarSeed: 'Noor Designer' },
              { name: 'Atlas Agency', role: 'Brand Strategy', avatarSeed: 'Atlas Agency' },
              { name: 'Mia Ops', role: 'Operations Partner', avatarSeed: 'Mia Ops' },
            ],
            impactHighlights: [
              {
                title: 'Auto-assign streak',
                value: '5 wins',
                description: 'Accepted five priority matches with 96% satisfaction.',
              },
              {
                title: 'NPS from founders',
                value: '9.4',
                description: 'Average review from marketplace founders over the last 90 days.',
              },
              {
                title: 'Availability',
                value: '28 hrs/wk',
                description: 'Optimised for multi-pod engagements across EU & Americas time zones.',
              },
            ],
            pipelineInsights: [
              {
                project: 'Marketplace instrumentation',
                payout: '$1,500',
                countdown: '02:45:00',
                status: 'Awaiting confirmation',
                seed: 'Marketplace instrumentation',
              },
              {
                project: 'Compliance dashboard refactor',
                payout: '$3,200',
                countdown: '14:10:00',
                status: 'Queued - next up',
                seed: 'Compliance dashboard',
              },
            ],
            profileCompletion: 92.5,
            avatarSeed: 'Leo Freelancer',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.profiles[1],
            userId: seededIds.users[0],
            headline: 'Chief Product Officer',
            bio: 'Oversees Gigvora experience strategy, compliance reviews, and launch governance.',
            skills: 'Product Strategy, Compliance, Analytics Ops',
            experience: '10 years leading multi-sided marketplace rollouts and regulated launches.',
            education: 'MBA, Innovation School of Business',
            location: 'London, United Kingdom',
            timezone: 'Europe/London',
            missionStatement:
              'Delivering trustworthy launches that balance regulatory confidence with joyful product experiences.',
            areasOfFocus: ['Compliance leadership', 'Growth strategy', 'Volunteer programmes'],
            availabilityStatus: 'limited',
            availableHoursPerWeek: 12,
            openToRemote: true,
            availabilityNotes: 'Focused on programme governance and launch approvals.',
            availabilityUpdatedAt: twoDaysAgo,
            trustScore: 4.65,
            likesCount: 54,
            followersCount: 640,
            qualifications: [
              {
                title: 'MBA – Innovation School of Business',
                authority: 'Innovation School of Business',
                year: 2016,
              },
              {
                title: 'FCA Regulatory Compliance Certification',
                authority: 'UK Financial Conduct Authority',
                year: 2020,
              },
            ],
            experienceEntries: [
              {
                organization: 'Gigvora',
                role: 'Chief Product Officer',
                startDate: '2019-05-01',
                endDate: null,
                description:
                  'Owns Gigvora experience strategy, compliance reviews, and launch governance across squads.',
                highlights: [
                  'Launched escrow and dispute programme with FCA alignment.',
                  'Built volunteer hub and launchpad roadmap with 30% adoption uplift.',
                ],
              },
              {
                organization: 'FutureWork Collective',
                role: 'Director of Product',
                startDate: '2015-03-01',
                endDate: '2019-04-01',
                description: 'Scaled product operations across three marketplace launches and two acquisitions.',
                highlights: ['Expanded compliance coverage to 12 geographies.', 'Shipped analytics KPIs used in IPO filings.'],
              },
            ],
            statusFlags: ['executive', 'programme_owner'],
            launchpadEligibility: {
              status: 'reviewer',
              score: null,
              cohorts: ['Launch Council'],
              track: 'Governance',
              lastEvaluatedAt: twoDaysAgo,
            },
            volunteerBadges: ['community_advocate'],
            portfolioLinks: [
              { label: 'Executive briefing deck', url: 'https://gigvora.com/resources/executive-briefing.pdf' },
            ],
            preferredEngagements: ['Compliance reviews', 'Executive alignment'],
            collaborationRoster: [
              { name: 'Leo Freelancer', role: 'Product Engineering', avatarSeed: 'Leo Freelancer' },
              { name: 'Mia Operations', role: 'Operations Lead', avatarSeed: 'Mia Operations' },
            ],
            impactHighlights: [
              {
                title: 'Launch readiness score',
                value: '98%',
                description: 'Milestone quality gates passed across the last three releases.',
              },
              {
                title: 'Volunteer hub adoption',
                value: '+34%',
                description: 'Increase in invite acceptance since governance refresh.',
              },
            ],
            pipelineInsights: [],
            profileCompletion: 86.4,
            avatarSeed: 'Ava Founder',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'profile_references',
        [
          {
            id: seededIds.profileReferences[0],
            profileId: seededIds.profiles[0],
            referenceName: 'Mia Operations',
            relationship: 'Operations Lead',
            company: 'Gigvora Studios',
            email: 'mia@gigvora.com',
            phone: null,
            endorsement:
              'Leo shipped instrumentation across four squads with impeccable documentation and on-call maturity.',
            isVerified: true,
            weight: 0.9,
            lastInteractedAt: yesterday,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.profileReferences[1],
            profileId: seededIds.profiles[0],
            referenceName: 'Noor Designer',
            relationship: 'Design Partner',
            company: 'Nova Agency',
            email: 'noor@gigvora.com',
            phone: null,
            endorsement:
              'Co-led three go-to-market launches with Leo, each shipping accessibility AA coverage and telemetry dashboards.',
            isVerified: true,
            weight: 0.78,
            lastInteractedAt: threeDaysAgo,
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.profileReferences[2],
            profileId: seededIds.profiles[1],
            referenceName: 'Noah Agency',
            relationship: 'Agency Partner',
            company: 'Catalyst Talent Agency',
            email: 'noah@gigvora.com',
            phone: null,
            endorsement:
              'Ava guided compliance readiness for the provider workspace rollout, unlocking agency onboarding in record time.',
            isVerified: true,
            weight: 0.82,
            lastInteractedAt: yesterday,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'company_profiles',
        [
          {
            id: seededIds.companyProfiles[0],
            userId: seededIds.users[2],
            companyName: 'Gigvora Studios',
            description: 'Product operations and talent success team curating opportunities and vetting providers.',
            website: 'https://gigvora.com',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'agency_profiles',
        [
          {
            id: seededIds.agencyProfiles[0],
            userId: seededIds.users[3],
            agencyName: 'Catalyst Talent Agency',
            focusArea: 'Product engineering pods and launch support',
            website: 'https://catalyst-talent.example.com',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_profiles',
        [
          {
            id: seededIds.freelancerProfiles[0],
            userId: seededIds.users[1],
            title: 'Lead Marketplace Engineer',
            hourlyRate: 115,
            availability: '30 hrs/week',
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'feed_posts',
        [
          {
            id: seededIds.feedPosts[0],
            userId: seededIds.users[1],
            content:
              'Excited to collaborate with agencies on scaling omnichannel messaging and analytics at Gigvora.',
            visibility: 'public',
            createdAt: twoDaysAgo,
            updatedAt: twoDaysAgo,
          },
          {
            id: seededIds.feedPosts[1],
            userId: seededIds.users[3],
            content: 'Catalyst Talent onboarding first cohort to the Gigvora provider workspace beta this week.',
            visibility: 'connections',
            createdAt: yesterday,
            updatedAt: yesterday,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'jobs',
        [
          {
            id: seededIds.jobs[0],
            title: 'Product Designer',
            description: 'Craft intuitive experiences for Gigvora marketplace teams with analytics instrumentation.',
            location: 'Remote - North America',
            employmentType: 'Full-time',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.jobs[1],
            title: 'Data Reliability Engineer',
            description: 'Owns analytics pipelines, ingestion integrity, and proactive anomaly detection across squads.',
            location: 'Hybrid - London',
            employmentType: 'Contract-to-hire',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'gigs',
        [
          {
            id: seededIds.gigs[0],
            title: 'Landing Page Revamp',
            description: 'Refresh marketing site with conversion experiments and WCAG 2.1 AA compliance.',
            budget: '$4500',
            duration: '5 weeks',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_catalog_bundles',
        [
          {
            id: seededIds.catalogBundles[0],
            freelancerId: leoFreelancerId,
            name: 'Brand sprint + Web UX refresh',
            description:
              'Two-week strategy intensive paired with UX polish across high-converting funnels and product surfaces.',
            basePrice: 4200,
            currencyCode: 'USD',
            isActive: true,
            metadata: {
              deliveryWindow: '3-4 weeks',
              includedAssets: ['brand audit', 'design system tune-up', 'funnel UX review'],
            },
            createdAt: sixtyDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.catalogBundles[1],
            freelancerId: leoFreelancerId,
            name: 'Product launch assets (Design + Video)',
            description:
              'Launch campaign kit with motion explainers, landing pages, paid social variants, and conversion copy.',
            basePrice: 6800,
            currencyCode: 'USD',
            isActive: true,
            metadata: {
              deliveryWindow: '5 weeks',
              includedAssets: ['launch landing page', 'motion teaser', 'sales enablement deck'],
            },
            createdAt: sixtyDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.catalogBundles[2],
            freelancerId: leoFreelancerId,
            name: 'Fractional creative director retainer',
            description:
              'Ongoing creative leadership with campaign QA, asset reviews, and experimentation roadmaps.',
            basePrice: 5200,
            currencyCode: 'USD',
            isActive: true,
            metadata: {
              cadence: 'Monthly',
              meetingsPerMonth: 4,
              focus: ['creative QA', 'performance insights', 'team coaching'],
            },
            createdAt: ninetyDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_catalog_bundle_metrics',
        [
          {
            id: seededIds.catalogBundleMetrics[0],
            bundleId: seededIds.catalogBundles[0],
            periodStart: sixtyDaysAgo,
            periodEnd: fortyFiveDaysAgo,
            impressions: 920,
            clicks: 228,
            conversions: 46,
            revenue: 11800,
            repeatClients: 3,
            attachRate: 34.2,
            upsellRevenue: 3200,
            createdAt: fortyFiveDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.catalogBundleMetrics[1],
            bundleId: seededIds.catalogBundles[0],
            periodStart: fourteenDaysAgo,
            periodEnd: sevenDaysAgo,
            impressions: 880,
            clicks: 214,
            conversions: 52,
            revenue: 12400,
            repeatClients: 4,
            attachRate: 36.8,
            upsellRevenue: 3800,
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.catalogBundleMetrics[2],
            bundleId: seededIds.catalogBundles[1],
            periodStart: sixtyDaysAgo,
            periodEnd: fortyFiveDaysAgo,
            impressions: 760,
            clicks: 182,
            conversions: 39,
            revenue: 9800,
            repeatClients: 2,
            attachRate: 41.5,
            upsellRevenue: 4100,
            createdAt: fortyFiveDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.catalogBundleMetrics[3],
            bundleId: seededIds.catalogBundles[1],
            periodStart: fourteenDaysAgo,
            periodEnd: yesterday,
            impressions: 810,
            clicks: 196,
            conversions: 44,
            revenue: 10500,
            repeatClients: 3,
            attachRate: 43.1,
            upsellRevenue: 4620,
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.catalogBundleMetrics[4],
            bundleId: seededIds.catalogBundles[2],
            periodStart: sixtyDaysAgo,
            periodEnd: thirtyDaysAgo,
            impressions: 540,
            clicks: 146,
            conversions: 28,
            revenue: 15600,
            repeatClients: 5,
            attachRate: 27.9,
            upsellRevenue: 5200,
            createdAt: thirtyDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.catalogBundleMetrics[5],
            bundleId: seededIds.catalogBundles[2],
            periodStart: fourteenDaysAgo,
            periodEnd: yesterday,
            impressions: 580,
            clicks: 152,
            conversions: 31,
            revenue: 16200,
            repeatClients: 5,
            attachRate: 29.4,
            upsellRevenue: 5480,
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_repeat_clients',
        [
          {
            id: seededIds.repeatClients[0],
            freelancerId: leoFreelancerId,
            clientName: 'Northwind Labs',
            clientCompany: 'Northwind Labs',
            lastOrderAt: sevenDaysAgo,
            totalOrders: 5,
            lifetimeValue: 15600,
            isRetainer: true,
            retainerStartDate: thirtyDaysAgo,
            notes: 'Design system governance and conversion experiments.',
            createdAt: ninetyDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.repeatClients[1],
            freelancerId: leoFreelancerId,
            clientName: 'SaaS Collective',
            clientCompany: 'SaaS Collective',
            lastOrderAt: twoDaysAgo,
            totalOrders: 3,
            lifetimeValue: 9800,
            isRetainer: true,
            retainerStartDate: fourteenDaysAgo,
            notes: 'Weekly CRO experiments with launch bundles.',
            createdAt: sixtyDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.repeatClients[2],
            freelancerId: leoFreelancerId,
            clientName: 'Atlas Ventures',
            clientCompany: 'Atlas Ventures',
            lastOrderAt: thirtyDaysAgo,
            totalOrders: 2,
            lifetimeValue: 7200,
            isRetainer: false,
            retainerStartDate: null,
            notes: 'Launch storytelling assets on a project basis.',
            createdAt: sixtyDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.repeatClients[3],
            freelancerId: leoFreelancerId,
            clientName: 'Nova Agency',
            clientCompany: 'Nova Agency',
            lastOrderAt: fortyFiveDaysAgo,
            totalOrders: 4,
            lifetimeValue: 11200,
            isRetainer: true,
            retainerStartDate: sixtyDaysAgo,
            notes: 'Creative QA partner across retainer pods.',
            createdAt: ninetyDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.repeatClients[4],
            freelancerId: leoFreelancerId,
            clientName: 'Blue Horizon Studios',
            clientCompany: 'Blue Horizon Studios',
            lastOrderAt: fourteenDaysAgo,
            totalOrders: 1,
            lifetimeValue: 3500,
            isRetainer: false,
            retainerStartDate: null,
            notes: 'Motion teaser for pilot campaign with follow-up pending.',
            createdAt: thirtyDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_cross_sell_opportunities',
        [
          {
            id: seededIds.crossSellOpportunities[0],
            freelancerId: leoFreelancerId,
            fromBundleId: seededIds.catalogBundles[0],
            toBundleId: seededIds.catalogBundles[1],
            title: 'Launch nurture bundle for recent strategy wins',
            signal: 'Checkout notes flag request for campaign collateral after UX refresh engagements.',
            recommendedAction: 'Bundle launch assets to six active SaaS Collective accounts this month.',
            expectedUpliftPercentage: 18.5,
            expectedRevenue: 5400,
            confidence: 82.5,
            priority: 1,
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.crossSellOpportunities[1],
            freelancerId: leoFreelancerId,
            fromBundleId: seededIds.catalogBundles[0],
            toBundleId: seededIds.catalogBundles[2],
            title: 'Retainer pitch for recurring brand partners',
            signal: 'Repeat brand sprint clients requesting quarterly reviews.',
            recommendedAction: 'Offer fractional creative director retainer to Northwind Labs and Nova Agency.',
            expectedUpliftPercentage: 12.2,
            expectedRevenue: 7200,
            confidence: 76.4,
            priority: 2,
            createdAt: fourteenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.crossSellOpportunities[2],
            freelancerId: leoFreelancerId,
            fromBundleId: seededIds.catalogBundles[1],
            toBundleId: seededIds.catalogBundles[2],
            title: 'Analytics optimisation upsell',
            signal: 'Video launch campaigns show ongoing optimisation requests in support threads.',
            recommendedAction: 'Attach 3-month optimisation retainer to upcoming launch asset renewals.',
            expectedUpliftPercentage: 9.4,
            expectedRevenue: 4600,
            confidence: 71.3,
            priority: 2,
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_keyword_impressions',
        [
          {
            id: seededIds.keywordImpressions[0],
            freelancerId: leoFreelancerId,
            keyword: 'brand strategy workshop',
            region: 'US',
            impressions: 820,
            clicks: 210,
            conversions: 24,
            trendPercentage: 18.2,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'marketplace_search' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[1],
            freelancerId: leoFreelancerId,
            keyword: 'brand strategy workshop',
            region: 'UK',
            impressions: 310,
            clicks: 74,
            conversions: 8,
            trendPercentage: 11.4,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'marketplace_search' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[2],
            freelancerId: leoFreelancerId,
            keyword: 'ux audit for saas',
            region: 'US',
            impressions: 640,
            clicks: 188,
            conversions: 21,
            trendPercentage: 12.7,
            capturedAt: fourteenDaysAgo,
            metadata: { channel: 'marketplace_search' },
            createdAt: fourteenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[3],
            freelancerId: leoFreelancerId,
            keyword: 'ux audit for saas',
            region: 'DE',
            impressions: 220,
            clicks: 62,
            conversions: 7,
            trendPercentage: 9.1,
            capturedAt: fourteenDaysAgo,
            metadata: { channel: 'marketplace_search' },
            createdAt: fourteenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[4],
            freelancerId: leoFreelancerId,
            keyword: 'product launch designer',
            region: 'US',
            impressions: 570,
            clicks: 142,
            conversions: 17,
            trendPercentage: 9.8,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'recommendations' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[5],
            freelancerId: leoFreelancerId,
            keyword: 'webflow redesign expert',
            region: 'CA',
            impressions: 310,
            clicks: 88,
            conversions: 10,
            trendPercentage: 6.4,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'marketplace_search' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[6],
            freelancerId: leoFreelancerId,
            keyword: 'webflow redesign expert',
            region: 'US',
            impressions: 480,
            clicks: 130,
            conversions: 12,
            trendPercentage: 7.1,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'marketplace_search' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[7],
            freelancerId: leoFreelancerId,
            keyword: 'fractional creative director',
            region: 'US',
            impressions: 360,
            clicks: 104,
            conversions: 11,
            trendPercentage: 10.9,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'referrals' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[8],
            freelancerId: leoFreelancerId,
            keyword: 'fractional creative director',
            region: 'AU',
            impressions: 180,
            clicks: 48,
            conversions: 5,
            trendPercentage: 8.6,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'referrals' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.keywordImpressions[9],
            freelancerId: leoFreelancerId,
            keyword: 'b2b landing page refresh',
            region: 'US',
            impressions: 440,
            clicks: 120,
            conversions: 14,
            trendPercentage: 7.4,
            capturedAt: sevenDaysAgo,
            metadata: { channel: 'marketplace_search' },
            createdAt: sevenDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_margin_snapshots',
        [
          {
            id: seededIds.marginSnapshots[0],
            freelancerId: leoFreelancerId,
            month: threeMonthsAgo,
            revenue: 18250,
            softwareCosts: 1650,
            subcontractorCosts: 4200,
            fulfillmentCosts: 1100,
            notes: 'Post-launch support tapering after spring campaign.',
            createdAt: threeMonthsAgo,
            updatedAt: now,
          },
          {
            id: seededIds.marginSnapshots[1],
            freelancerId: leoFreelancerId,
            month: twoMonthsAgo,
            revenue: 19480,
            softwareCosts: 1720,
            subcontractorCosts: 4380,
            fulfillmentCosts: 1260,
            notes: 'Added part-time video contractor for launch kit backlog.',
            createdAt: twoMonthsAgo,
            updatedAt: now,
          },
          {
            id: seededIds.marginSnapshots[2],
            freelancerId: leoFreelancerId,
            month: previousMonth,
            revenue: 20560,
            softwareCosts: 1835,
            subcontractorCosts: 4520,
            fulfillmentCosts: 1380,
            notes: 'Scaled analytics QA support and upgraded motion tooling.',
            createdAt: previousMonth,
            updatedAt: now,
          },
          {
            id: seededIds.marginSnapshots[3],
            freelancerId: leoFreelancerId,
            month: currentMonth,
            revenue: 21420,
            softwareCosts: 1860,
            subcontractorCosts: 4680,
            fulfillmentCosts: 1420,
            notes: 'Healthy retainer mix with two new SaaS accounts onboarded.',
            createdAt: currentMonth,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'projects',
        [
          {
            id: seededIds.projects[0],
            title: 'Community Growth Initiative',
            description: 'Launch groups to connect freelancers across industries with analytics instrumentation.',
            status: 'Planning',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'experience_launchpads',
        [
          {
            id: seededIds.experienceLaunchpads[0],
            title: 'Emerging Leaders Fellowship',
            description: 'Mentorship-driven leadership journey for rising professionals with async curriculum.',
            track: 'Leadership',
            location: 'Hybrid - London',
            programType: 'cohort',
            status: 'active',
            applicationUrl: 'https://gigvora.com/launchpad/apply/emerging-leaders',
            mentorLead: 'Ava Founder',
            startDate: twoDaysAgo,
            endDate: new Date(now.getTime() + 6 * 7 * 24 * 60 * 60 * 1000),
            capacity: 24,
            eligibilityCriteria: {
              minimumExperience: 2,
              requiredSkills: ['Product strategy', 'Analytics storytelling', 'Mentorship'],
              requiresPortfolio: true,
              autoAdvanceScore: 78,
              autoAcceptScore: 88,
            },
            employerSponsorship: {
              headlineSponsor: 'Gigvora Studios',
              stipendCurrency: 'GBP',
              stipendAmount: 1200,
              partnerAgencies: ['Catalyst Talent Agency'],
            },
            publishedAt: threeDaysAgo,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'volunteering_roles',
        [
          {
            id: seededIds.volunteeringRoles[0],
            title: 'Open Source Mentor',
            organization: 'Gigvora Foundation',
            description: 'Support early career devs contributing to compliance and tooling projects.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'groups',
        [
          {
            id: seededIds.groups[0],
            name: 'Gigvora Product Council',
            description: 'Cross-functional forum reviewing roadmap increments, risk, and go-to-market readiness.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'group_memberships',
        [
          {
            id: seededIds.groupMemberships[0],
            userId: seededIds.users[0],
            groupId: seededIds.groups[0],
            role: 'chair',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.groupMemberships[1],
            userId: seededIds.users[1],
            groupId: seededIds.groups[0],
            role: 'member',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'connections',
        [
          {
            id: seededIds.connections[0],
            requesterId: seededIds.users[1],
            addresseeId: seededIds.users[3],
            status: 'accepted',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'applications',
        [
          {
            id: seededIds.applications[0],
            applicantId: seededIds.users[1],
            targetType: 'job',
            targetId: seededIds.jobs[0],
            status: 'under_review',
            sourceChannel: 'web',
            coverLetter:
              'I bring seven years scaling product marketplaces with embedded analytics, ready to ship dashboards on day one.',
            attachments: [
              {
                fileName: 'leo-freelancer-cv.pdf',
                storageKey: 'applications/1/leo-freelancer-cv.pdf',
                mimeType: 'application/pdf',
              },
            ],
            rateExpectation: 130.0,
            currencyCode: 'USD',
            availabilityDate: now,
            isArchived: false,
            submittedAt: twoDaysAgo,
            decisionAt: null,
            metadata: {
              seedTag,
              referralCode: 'COHORT-ALPHA',
              resumeChecksum: crypto
                .createHash('sha256')
                .update('leo-freelancer-cv.pdf')
                .digest('hex'),
            },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.applications[1],
            applicantId: seededIds.users[1],
            targetType: 'gig',
            targetId: seededIds.gigs[0],
            status: 'withdrawn',
            sourceChannel: 'mobile',
            coverLetter:
              'Following up on the landing page revamp to align conversion tracking with updated analytics goals.',
            attachments: [],
            rateExpectation: 95.0,
            currencyCode: 'USD',
            availabilityDate: twoDaysAgo,
            isArchived: true,
            submittedAt: threeDaysAgo,
            decisionAt: yesterday,
            metadata: {
              seedTag,
              withdrawReason: 'Client accelerated in-house build',
            },
            createdAt: threeDaysAgo,
            updatedAt: yesterday,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'application_reviews',
        [
          {
            id: seededIds.applicationReviews[0],
            applicationId: seededIds.applications[0],
            reviewerId: seededIds.users[2],
            stage: 'screen',
            decision: 'advance',
            score: 4,
            notes:
              'Strong experience with analytics instrumentation. Schedule architecture deep dive.',
            decidedAt: yesterday,
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.applicationReviews[1],
            applicationId: seededIds.applications[1],
            reviewerId: seededIds.users[2],
            stage: 'final',
            decision: 'withdrawn',
            score: null,
            notes: 'Candidate withdrew after aligning timeline with updated roadmap priorities.',
            decidedAt: yesterday,
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'experience_launchpad_applications',
        [
          {
            id: seededIds.experienceLaunchpadApplications[0],
            launchpadId: seededIds.experienceLaunchpads[0],
            applicantId: seededIds.users[1],
            applicationId: seededIds.applications[0],
            status: 'interview',
            qualificationScore: 88.5,
            yearsExperience: 6.0,
            skills: ['Node.js', 'React', 'Product strategy', 'Analytics storytelling'],
            motivations: 'Excited to co-create launch playbooks and mentor new fellows joining the programme.',
            portfolioUrl: 'https://portfolio.leo.example.com',
            availabilityDate: twoDaysAgo,
            eligibilitySnapshot: {
              meetsExperience: true,
              matchedSkills: ['Node.js', 'Product strategy', 'Analytics storytelling'],
              missingSkills: [],
              requiresPortfolio: true,
              autoStatus: 'interview',
            },
            assignedMentor: 'Ava Founder',
            interviewScheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
            decisionNotes: 'Line up panel to confirm placement readiness and leadership appetite.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.experienceLaunchpadApplications[1],
            launchpadId: seededIds.experienceLaunchpads[0],
            applicantId: seededIds.users[3],
            applicationId: null,
            status: 'waitlisted',
            qualificationScore: 64.25,
            yearsExperience: 1.5,
            skills: ['Growth marketing', 'Community management'],
            motivations: 'Looking to transition from agency delivery into product leadership via Launchpad rotations.',
            portfolioUrl: null,
            availabilityDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            eligibilitySnapshot: {
              meetsExperience: false,
              experienceGap: 0.5,
              missingSkills: ['Analytics storytelling'],
              requiresPortfolio: true,
              autoStatus: 'waitlisted',
            },
            assignedMentor: null,
            interviewScheduledAt: null,
            decisionNotes: 'Request analytics case study and portfolio link before advancing.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'experience_launchpad_employer_requests',
        [
          {
            id: seededIds.experienceLaunchpadEmployerRequests[0],
            launchpadId: seededIds.experienceLaunchpads[0],
            organizationName: 'Northwind Labs',
            contactName: 'Jules Carter',
            contactEmail: 'talent@northwindlabs.io',
            headcount: 3,
            engagementTypes: ['contract-to-hire', 'fractional'],
            targetStartDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
            idealCandidateProfile:
              'Generalist product leaders comfortable with analytics instrumentation and async squads.',
            hiringNotes:
              'Needs coverage across UK/EU timezones and preference for fellows with mentorship exposure.',
            status: 'approved',
            slaCommitmentDays: 7,
            createdById: seededIds.users[2],
            metadata: {
              seedTag,
              intakeChannel: 'launchpad_workflow',
              budgetRange: '£65k-£80k',
            },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'experience_launchpad_placements',
        [
          {
            id: seededIds.experienceLaunchpadPlacements[0],
            launchpadId: seededIds.experienceLaunchpads[0],
            candidateId: seededIds.experienceLaunchpadApplications[0],
            employerRequestId: seededIds.experienceLaunchpadEmployerRequests[0],
            targetType: 'project',
            targetId: seededIds.projects[0],
            status: 'in_progress',
            placementDate: yesterday,
            endDate: new Date(now.getTime() + 8 * 7 * 24 * 60 * 60 * 1000),
            compensation: {
              type: 'stipend',
              amount: 1500,
              currency: 'GBP',
              cadence: 'monthly',
            },
            feedbackScore: 4.5,
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'experience_launchpad_opportunity_links',
        [
          {
            id: seededIds.experienceLaunchpadOpportunityLinks[0],
            launchpadId: seededIds.experienceLaunchpads[0],
            targetType: 'job',
            targetId: seededIds.jobs[0],
            source: 'manual',
            createdById: seededIds.users[2],
            notes:
              'Launchpad fast-track for analytics lead role with expectation of mentorship rotations.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.experienceLaunchpadOpportunityLinks[1],
            launchpadId: seededIds.experienceLaunchpads[0],
            targetType: 'project',
            targetId: seededIds.projects[0],
            source: 'placement',
            createdById: seededIds.users[2],
            notes: 'Linked automatically after placement scheduling for reporting dashboards.',
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'message_threads',
        [
          {
            id: seededIds.messageThreads[0],
            subject: 'Application follow-up: Product Designer',
            channelType: 'project',
            state: 'active',
            createdBy: seededIds.users[2],
            lastMessageAt: now,
            metadata: { seedTag, relatedApplicationId: seededIds.applications[0] },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'message_participants',
        [
          {
            id: seededIds.messageParticipants[0],
            threadId: seededIds.messageThreads[0],
            userId: seededIds.users[2],
            role: 'owner',
            notificationsEnabled: true,
            mutedUntil: null,
            lastReadAt: now,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.messageParticipants[1],
            threadId: seededIds.messageThreads[0],
            userId: seededIds.users[1],
            role: 'participant',
            notificationsEnabled: true,
            mutedUntil: null,
            lastReadAt: yesterday,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'messages',
        [
          {
            id: seededIds.messages[0],
            threadId: seededIds.messageThreads[0],
            senderId: seededIds.users[2],
            messageType: 'text',
            body: 'Thanks for applying, Leo. Sharing interview availability for next week.',
            metadata: { seedTag },
            isEdited: false,
            editedAt: null,
            deletedAt: null,
            deliveredAt: twoDaysAgo,
            createdAt: twoDaysAgo,
            updatedAt: twoDaysAgo,
          },
          {
            id: seededIds.messages[1],
            threadId: seededIds.messageThreads[0],
            senderId: seededIds.users[1],
            messageType: 'file',
            body: 'Attached whiteboard summary from analytics scaling project.',
            metadata: { seedTag },
            isEdited: false,
            editedAt: null,
            deletedAt: null,
            deliveredAt: yesterday,
            createdAt: yesterday,
            updatedAt: yesterday,
          },
          {
            id: seededIds.messages[2],
            threadId: seededIds.messageThreads[0],
            senderId: seededIds.users[1],
            messageType: 'event',
            body: 'Candidate withdrew application',
            metadata: { seedTag, event: 'application_withdrawn' },
            isEdited: false,
            editedAt: null,
            deletedAt: yesterday,
            deliveredAt: yesterday,
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'message_attachments',
        [
          {
            id: seededIds.messageAttachments[0],
            messageId: seededIds.messages[1],
            storageKey: 'threads/1/analytics-summary.pdf',
            fileName: 'analytics-summary.pdf',
            mimeType: 'application/pdf',
            fileSize: 582144,
            checksum: crypto.createHash('sha256').update('analytics-summary.pdf').digest('hex'),
            createdAt: yesterday,
            updatedAt: yesterday,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'notifications',
        [
          {
            id: seededIds.notifications[0],
            userId: seededIds.users[1],
            category: 'project',
            type: 'application_stage_update',
            title: 'Interview availability requested',
            body: 'Mia from Gigvora Studios requested your availability to discuss the Product Designer role.',
            payload: { seedTag, applicationId: seededIds.applications[0], stage: 'interview' },
            priority: 'normal',
            status: 'delivered',
            deliveredAt: yesterday,
            readAt: now,
            expiresAt: null,
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.notifications[1],
            userId: seededIds.users[2],
            category: 'system',
            type: 'candidate_withdrawal',
            title: 'Candidate withdrew from landing page revamp gig',
            body: 'Leo withdrew from the landing page revamp opportunity via the mobile app.',
            payload: { seedTag, applicationId: seededIds.applications[1] },
            priority: 'high',
            status: 'read',
            deliveredAt: yesterday,
            readAt: yesterday,
            expiresAt: null,
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'notification_preferences',
        [
          {
            id: seededIds.notificationPreferences[0],
            userId: seededIds.users[0],
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            inAppEnabled: true,
            digestFrequency: 'daily',
            quietHoursStart: '22:00:00',
            quietHoursEnd: '06:00:00',
            metadata: { seedTag, timezone: 'UTC' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.notificationPreferences[1],
            userId: seededIds.users[1],
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: true,
            inAppEnabled: true,
            digestFrequency: 'immediate',
            quietHoursStart: null,
            quietHoursEnd: null,
            metadata: { seedTag, timezone: 'America/New_York' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.notificationPreferences[2],
            userId: seededIds.users[2],
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            inAppEnabled: true,
            digestFrequency: 'daily',
            quietHoursStart: '20:00:00',
            quietHoursEnd: '05:30:00',
            metadata: { seedTag, timezone: 'Europe/London' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.notificationPreferences[3],
            userId: seededIds.users[3],
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            inAppEnabled: true,
            digestFrequency: 'weekly',
            quietHoursStart: '21:00:00',
            quietHoursEnd: '07:00:00',
            metadata: { seedTag, timezone: 'Europe/Berlin' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      const interviewDimensions = {
        metric: 'applications.interviews.requested',
        channel: 'web',
        region: 'global',
        seedTag,
      };
      const interviewDimensionHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(interviewDimensions))
        .digest('hex');

      const withdrawalDimensions = {
        metric: 'applications.withdrawals',
        channel: 'mobile',
        region: 'global',
        seedTag,
      };
      const withdrawalDimensionHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(withdrawalDimensions))
        .digest('hex');

      await queryInterface.bulkInsert(
        'analytics_events',
        [
          {
            id: seededIds.analyticsEvents[0],
            eventName: 'application_stage_requested',
            userId: seededIds.users[2],
            actorType: 'user',
            entityType: 'application',
            entityId: seededIds.applications[0],
            source: 'talent_ops_dashboard',
            context: {
              seedTag,
              requestedStage: 'interview',
              performedBy: 'Mia Operations',
            },
            occurredAt: yesterday,
            ingestedAt: yesterday,
          },
          {
            id: seededIds.analyticsEvents[1],
            eventName: 'application_withdrawn',
            userId: seededIds.users[1],
            actorType: 'user',
            entityType: 'application',
            entityId: seededIds.applications[1],
            source: 'mobile_app',
            context: {
              seedTag,
              reason: 'timeline_shift',
            },
            occurredAt: yesterday,
            ingestedAt: yesterday,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'analytics_daily_rollups',
        [
          {
            id: seededIds.analyticsDailyRollups[0],
            metricKey: interviewDimensions.metric,
            dimensionHash: interviewDimensionHash,
            dimensions: interviewDimensions,
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            value: 3.0,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.analyticsDailyRollups[1],
            metricKey: withdrawalDimensions.metric,
            dimensionHash: withdrawalDimensionHash,
            dimensions: withdrawalDimensions,
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            value: 1.0,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'provider_workspaces',
        [
          {
            id: seededIds.providerWorkspaces[0],
            ownerId: seededIds.users[3],
            name: 'Catalyst Talent HQ',
            slug: 'catalyst-talent-hq',
            type: 'agency',
            timezone: 'Europe/Berlin',
            defaultCurrency: 'EUR',
            intakeEmail: 'intake@catalyst-talent.example.com',
            isActive: true,
            settings: {
              seedTag,
              approvalPolicy: 'dual_review',
              autoArchiveAfterDays: 45,
            },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'provider_workspace_members',
        [
          {
            id: seededIds.providerWorkspaceMembers[0],
            workspaceId: seededIds.providerWorkspaces[0],
            userId: seededIds.users[3],
            role: 'owner',
            status: 'active',
            invitedById: seededIds.users[3],
            joinedAt: twoDaysAgo,
            lastActiveAt: now,
            removedAt: null,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.providerWorkspaceMembers[1],
            workspaceId: seededIds.providerWorkspaces[0],
            userId: seededIds.users[2],
            role: 'manager',
            status: 'active',
            invitedById: seededIds.users[3],
            joinedAt: yesterday,
            lastActiveAt: now,
            removedAt: null,
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'provider_workspace_invites',
        [
          {
            id: seededIds.providerWorkspaceInvites[0],
            workspaceId: seededIds.providerWorkspaces[0],
            email: 'compliance.manager@gigvora.com',
            role: 'viewer',
            status: 'pending',
            inviteToken: 'CATALYST-COMPLIANCE-2024',
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            invitedById: seededIds.users[3],
            acceptedAt: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'provider_contact_notes',
        [
          {
            id: seededIds.providerContactNotes[0],
            workspaceId: seededIds.providerWorkspaces[0],
            subjectUserId: seededIds.users[1],
            authorId: seededIds.users[2],
            note: 'Documented Leo\'s security questionnaire responses and preferred escalation channel for analytics incidents.',
            visibility: 'internal',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

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
        'freelancer_margin_snapshots',
        { id: { [Op.in]: seededIds.marginSnapshots } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'freelancer_keyword_impressions',
        { id: { [Op.in]: seededIds.keywordImpressions } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'freelancer_cross_sell_opportunities',
        { id: { [Op.in]: seededIds.crossSellOpportunities } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'freelancer_repeat_clients',
        { id: { [Op.in]: seededIds.repeatClients } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'freelancer_catalog_bundle_metrics',
        { id: { [Op.in]: seededIds.catalogBundleMetrics } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'freelancer_catalog_bundles',
        { id: { [Op.in]: seededIds.catalogBundles } },
        { transaction },
      );
      await queryInterface.bulkDelete('provider_contact_notes', { id: { [Op.in]: seededIds.providerContactNotes } }, { transaction });
      await queryInterface.bulkDelete(
        'provider_workspace_invites',
        { id: { [Op.in]: seededIds.providerWorkspaceInvites } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'provider_workspace_members',
        { id: { [Op.in]: seededIds.providerWorkspaceMembers } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'provider_workspaces',
        { id: { [Op.in]: seededIds.providerWorkspaces } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'analytics_daily_rollups',
        { id: { [Op.in]: seededIds.analyticsDailyRollups } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'analytics_events',
        { id: { [Op.in]: seededIds.analyticsEvents } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'notification_preferences',
        { id: { [Op.in]: seededIds.notificationPreferences } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'notifications',
        { id: { [Op.in]: seededIds.notifications } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'message_attachments',
        { id: { [Op.in]: seededIds.messageAttachments } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'messages',
        { id: { [Op.in]: seededIds.messages } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'message_participants',
        { id: { [Op.in]: seededIds.messageParticipants } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'message_threads',
        { id: { [Op.in]: seededIds.messageThreads } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'application_reviews',
        { id: { [Op.in]: seededIds.applicationReviews } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'applications',
        { id: { [Op.in]: seededIds.applications } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'experience_launchpad_opportunity_links',
        { id: { [Op.in]: seededIds.experienceLaunchpadOpportunityLinks } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'experience_launchpad_placements',
        { id: { [Op.in]: seededIds.experienceLaunchpadPlacements } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'experience_launchpad_employer_requests',
        { id: { [Op.in]: seededIds.experienceLaunchpadEmployerRequests } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'experience_launchpad_applications',
        { id: { [Op.in]: seededIds.experienceLaunchpadApplications } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'connections',
        { id: { [Op.in]: seededIds.connections } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'group_memberships',
        { id: { [Op.in]: seededIds.groupMemberships } },
        { transaction }
      );
      await queryInterface.bulkDelete('groups', { id: { [Op.in]: seededIds.groups } }, { transaction });
      await queryInterface.bulkDelete(
        'volunteering_roles',
        { id: { [Op.in]: seededIds.volunteeringRoles } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'experience_launchpads',
        { id: { [Op.in]: seededIds.experienceLaunchpads } },
        { transaction }
      );
      await queryInterface.bulkDelete('projects', { id: { [Op.in]: seededIds.projects } }, { transaction });
      await queryInterface.bulkDelete('gigs', { id: { [Op.in]: seededIds.gigs } }, { transaction });
      await queryInterface.bulkDelete('jobs', { id: { [Op.in]: seededIds.jobs } }, { transaction });
      await queryInterface.bulkDelete('feed_posts', { id: { [Op.in]: seededIds.feedPosts } }, { transaction });
      await queryInterface.bulkDelete(
        'freelancer_profiles',
        { id: { [Op.in]: seededIds.freelancerProfiles } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'agency_profiles',
        { id: { [Op.in]: seededIds.agencyProfiles } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'company_profiles',
        { id: { [Op.in]: seededIds.companyProfiles } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'profile_references',
        { id: { [Op.in]: seededIds.profileReferences } },
        { transaction }
      );
      await queryInterface.bulkDelete('profiles', { id: { [Op.in]: seededIds.profiles } }, { transaction });
      await queryInterface.bulkDelete('users', { id: { [Op.in]: seededIds.users } }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
