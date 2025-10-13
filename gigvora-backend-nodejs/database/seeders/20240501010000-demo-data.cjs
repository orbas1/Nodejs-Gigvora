'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');

const seedTag = 'version_1_50_seed';

const seededIds = {
  users: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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
  gigPackages: [1, 2, 3],
  gigAddons: [1, 2, 3],
  gigMediaAssets: [1, 2, 3],
  gigCallToActions: [1, 2, 3],
  gigPreviewLayouts: [1, 2, 3],
  gigPerformanceSnapshots: [1],
  gigs: [1, 2, 3, 4, 5, 6, 7],
  projects: [1],
  clientPortals: [1],
  clientPortalTimelineEvents: [1, 2, 3, 4],
  clientPortalScopeItems: [1, 2, 3, 4],
  clientPortalDecisionLogs: [1, 2, 3],
  clientPortalInsightWidgets: [1, 2, 3],
  projectBlueprints: [1],
  projectBlueprintSprints: [1, 2, 3, 4],
  projectBlueprintDependencies: [1, 2, 3, 4],
  projectBlueprintRisks: [1, 2, 3],
  projectBillingCheckpoints: [1, 2, 3, 4],
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
  communitySpotlights: [1],
  communitySpotlightHighlights: [1, 2, 3],
  communitySpotlightAssets: [1, 2, 3, 4],
  communitySpotlightNewsletterFeatures: [1, 2],
  reputationTestimonials: [1, 2, 3],
  reputationSuccessStories: [1, 2],
  reputationMetrics: [1, 2, 3, 4],
  reputationBadges: [1, 2, 3],
  reputationReviewWidgets: [1, 2],
  freelancerFinanceMetrics: [1, 2, 3, 4],
  freelancerRevenueMonthlies: [1, 2, 3, 4, 5],
  freelancerRevenueStreams: [1, 2, 3, 4],
  freelancerPayouts: [1, 2, 3, 4, 5],
  freelancerTaxEstimates: [1],
  freelancerTaxFilings: [1, 2, 3],
  freelancerDeductionSummaries: [1],
  freelancerProfitabilityMetrics: [1, 2, 3],
  freelancerCostBreakdowns: [1, 2, 3, 4],
  freelancerSavingsGoals: [1, 2],
  freelancerFinanceControls: [1, 2, 3, 4],
  gigOrders: [1, 2, 3, 4, 5, 6],
  gigOrderRequirements: [1, 2, 3, 4, 5, 6],
  gigOrderRevisions: [1, 2],
  gigOrderPayouts: [1, 2, 3, 4],
  gigOrderActivities: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  gigMilestones: [1, 2, 3, 4, 5, 6],
  gigBundles: [1, 2, 3],
  gigBundleItems: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  gigUpsells: [1, 2, 3],
  gigCatalogItems: [1, 2, 3, 4],
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
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const financeFreelancerId = seededIds.users[1];
      const monthStartIso = (offset) => {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
        return date.toISOString().slice(0, 10);
      };
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
      const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const threeWeeksLater = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
      const sixWeeksLater = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000);
      const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const inTenDays = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

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
          {
            id: seededIds.users[4],
            firstName: 'Nina',
            lastName: 'Product',
            email: 'nina@lumenanalytics.com',
            password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
            address: '12 Market Street, Austin',
            age: 34,
            userType: 'company',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[5],
            firstName: 'Atlas',
            lastName: 'Labs',
            email: 'ops@atlaslabs.io',
            password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
            address: '88 Innovation Way, San Francisco',
            age: 29,
            userType: 'company',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[6],
            firstName: 'Jordan',
            lastName: 'Orbit',
            email: 'product@orbitmedia.co',
            password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
            address: '740 Creative Blvd, Chicago',
            age: 31,
            userType: 'company',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[7],
            firstName: 'Nova',
            lastName: 'Health',
            email: 'team@novahealth.systems',
            password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
            address: '560 Care Drive, Boston',
            age: 45,
            userType: 'company',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[8],
            firstName: 'Brightside',
            lastName: 'Finance',
            email: 'billing@brightsidefinance.com',
            password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
            address: '920 Market Square, New York',
            age: 39,
            userType: 'company',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.users[9],
            firstName: 'Evergreen',
            lastName: 'Ventures',
            email: 'ops@evergreenventures.vc',
            password: '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm',
            address: '18 Summit Road, Denver',
            age: 48,
            userType: 'company',
            createdAt: twoDaysAgo,
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
        'community_spotlights',
        [
          {
            id: seededIds.communitySpotlights[0],
            profileId: seededIds.profiles[0],
            status: 'published',
            heroTitle: 'Community spotlight studio',
            tagline: 'Campaign-ready recognition for top 1% freelancers.',
            summary:
              'Gigvora marketing collaborates with Riley Morgan to amplify community contributions, speaking tours, and open-source launches across email, social, and press placements.',
            campaignName: 'Gigvora Creator Series · September 2024',
            bannerImageUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/hero-banner.png',
            brandColor: '#1D4ED8',
            primaryCtaLabel: 'Launch spotlight campaign',
            primaryCtaUrl: 'https://gigvora.com/creators/riley-morgan/campaigns',
            secondaryCtaLabel: 'Download social kit',
            secondaryCtaUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/social-kit.zip',
            shareKitUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/press-kit.zip',
            metricsSnapshot: {
              reach: {
                value: 48500,
                label: 'Spotlight reach',
                unit: 'impressions',
                change: 0.18,
                trendLabel: 'vs prior campaign',
              },
              newsletterCtr: {
                value: 0.42,
                label: 'Newsletter CTR',
                format: 'percentage',
                percentile: 0.95,
                trendLabel: 'Top 5% performer cohort',
              },
              assetDownloads: {
                value: 86,
                label: 'Asset downloads',
                unit: 'kits',
                updatedAt: yesterday.toISOString(),
                trendLabel: 'Updated weekly by marketing',
              },
              socialShareRate: {
                value: 0.67,
                label: 'Social share rate',
                format: 'percentage',
                change: 0.12,
                trendLabel: 'LinkedIn + X cross-posts',
              },
            },
            newsletterFeatureEnabled: true,
            newsletterAutomationConfig: {
              cadence: 'weekly',
              sendDay: 'monday',
              segments: ['top_clients', 'high_intent_subscribers'],
              distributionChannels: ['email', 'in_app'],
              lastSyncedAt: yesterday.toISOString(),
            },
            publishedAt: lastWeek,
            featuredUntil: inThreeDays,
            createdAt: lastWeek,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'community_spotlight_highlights',
        [
          {
            id: seededIds.communitySpotlightHighlights[0],
            spotlightId: seededIds.communitySpotlights[0],
            category: 'open_source',
            title: 'Design Ops Playbook (v3)',
            description:
              'Released the latest version of the Design Ops Playbook with cross-functional rituals and async facilitation guides.',
            impactStatement: 'GitHub stars grew by 340 in the first seven days after launch with Gigvora co-marketing.',
            occurredOn: lastMonth,
            ctaLabel: 'View on GitHub',
            ctaUrl: 'https://github.com/gigvora/design-ops-playbook',
            mediaUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/design-ops-cover.png',
            ordinal: 0,
            metadata: { githubStars: 340, contributors: 28 },
            createdAt: lastWeek,
            updatedAt: now,
          },
          {
            id: seededIds.communitySpotlightHighlights[1],
            spotlightId: seededIds.communitySpotlights[0],
            category: 'speaking',
            title: 'Women in Product Summit keynote',
            description:
              'Headline keynote covering inclusive product rituals and community-led discovery programmes.',
            impactStatement: '12.6k live attendees and on-demand replay bundled in the speaker press kit.',
            occurredOn: new Date('2024-09-12T16:00:00Z'),
            ctaLabel: 'Watch replay',
            ctaUrl: 'https://gigvora.com/events/women-in-product-summit/keynote',
            mediaUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/wip-stage.jpg',
            ordinal: 1,
            metadata: { attendees: 12600, satisfactionScore: 4.9 },
            createdAt: lastWeek,
            updatedAt: now,
          },
          {
            id: seededIds.communitySpotlightHighlights[2],
            spotlightId: seededIds.communitySpotlights[0],
            category: 'contribution',
            title: 'Inclusive UI Patterns audit',
            description:
              'Led a recurring accessibility audit for early-stage startups with practical remediation templates.',
            impactStatement: 'Featured in the Gigvora Creator Newsletter and shared with enterprise clients.',
            occurredOn: yesterday,
            ctaLabel: 'Download findings',
            ctaUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/inclusive-ui-audit.pdf',
            mediaUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/a11y-report.png',
            ordinal: 2,
            metadata: { subscribers: 5400, auditCount: 18 },
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'community_spotlight_assets',
        [
          {
            id: seededIds.communitySpotlightAssets[0],
            spotlightId: seededIds.communitySpotlights[0],
            assetType: 'social',
            channel: 'linkedin',
            name: 'LinkedIn carousel kit',
            description:
              'Optimised Figma slides sized for LinkedIn with prompts for headline, proof point, and CTA.',
            format: 'FIG',
            aspectRatio: '1080x1080',
            downloadUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/linkedin-carousel.fig',
            previewUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/linkedin-carousel-preview.png',
            readyForUse: true,
            metadata: { frames: 8, theme: 'Electric Blue' },
            createdAt: lastWeek,
            updatedAt: now,
          },
          {
            id: seededIds.communitySpotlightAssets[1],
            spotlightId: seededIds.communitySpotlights[0],
            assetType: 'social',
            channel: 'instagram',
            name: 'Short-form video script pack',
            description: '30, 45, and 60-second scripts aligned to the Gigvora brand tone for Reels & Shorts.',
            format: 'DOCX',
            aspectRatio: '9:16',
            downloadUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/short-video-scripts.docx',
            previewUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/short-video-preview.png',
            readyForUse: true,
            metadata: { durations: [30, 45, 60] },
            createdAt: lastWeek,
            updatedAt: now,
          },
          {
            id: seededIds.communitySpotlightAssets[2],
            spotlightId: seededIds.communitySpotlights[0],
            assetType: 'newsletter',
            channel: 'email',
            name: 'Newsletter hero banners',
            description: 'Editable PSD + PNG bundle for monthly Gigvora spotlight campaigns.',
            format: 'PSD · PNG',
            aspectRatio: '1200x600',
            downloadUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/newsletter-hero.zip',
            previewUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/newsletter-hero-preview.png',
            readyForUse: true,
            metadata: { variants: ['Midnight', 'Dawn'] },
            createdAt: lastWeek,
            updatedAt: now,
          },
          {
            id: seededIds.communitySpotlightAssets[3],
            spotlightId: seededIds.communitySpotlights[0],
            assetType: 'press',
            channel: 'press',
            name: 'Speaker press kit',
            description: 'One-sheet with biography, talk abstracts, and booking links for upcoming appearances.',
            format: 'PDF',
            aspectRatio: 'Letter',
            downloadUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/speaker-press-kit.pdf',
            previewUrl: 'https://cdn.gigvora.com/spotlights/riley-morgan/speaker-kit-preview.png',
            readyForUse: true,
            metadata: { includesBio: true, bookingLink: 'https://gigvora.com/creators/riley-morgan/book' },
            createdAt: lastWeek,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'community_spotlight_newsletter_features',
        [
          {
            id: seededIds.communitySpotlightNewsletterFeatures[0],
            spotlightId: seededIds.communitySpotlights[0],
            status: 'sent',
            editionDate: lastWeek,
            editionName: 'Creator Pulse · September 16',
            subjectLine: 'Riley Morgan’s inclusive design audit just dropped',
            heroTitle: 'Top-performing freelancer: Riley Morgan',
            heroSubtitle: 'Inclusive product rituals and open-source leadership',
            audienceSegment: 'top_clients',
            performanceMetrics: { openRate: 0.58, clickRate: 0.42, shareRate: 0.16 },
            utmParameters: { utm_source: 'newsletter', utm_campaign: 'creator_pulse_sep16' },
            shareUrl: 'https://gigvora.com/newsletters/creator-pulse-sep16',
            callToActionLabel: 'Book a discovery session',
            callToActionUrl: 'https://gigvora.com/creators/riley-morgan/book',
            createdAt: lastWeek,
            updatedAt: now,
          },
          {
            id: seededIds.communitySpotlightNewsletterFeatures[1],
            spotlightId: seededIds.communitySpotlights[0],
            status: 'scheduled',
            editionDate: inThreeDays,
            editionName: 'Creator Pulse · September 30',
            subjectLine: 'See how Riley Morgan’s carousel kit boosts conversions',
            heroTitle: 'Spotlight automation ready for Monday send',
            heroSubtitle: 'Fresh assets for LinkedIn, X, and Instagram',
            audienceSegment: 'high_intent_subscribers',
            performanceMetrics: { projectedOpenRate: 0.6, projectedClickRate: 0.45 },
            utmParameters: { utm_source: 'newsletter', utm_campaign: 'creator_pulse_sep30' },
            shareUrl: 'https://gigvora.com/newsletters/creator-pulse-sep30',
            callToActionLabel: 'Preview share kit',
            callToActionUrl: 'https://gigvora.com/creators/riley-morgan/assets',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
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
        'reputation_testimonials',
        [
          {
            id: seededIds.reputationTestimonials[0],
            freelancerId: seededIds.users[1],
            clientName: 'Sophia Patel',
            clientRole: 'Head of Product',
            company: 'Lumen Analytics',
            projectName: 'Marketplace reliability sprint',
            rating: 4.9,
            comment:
              'Leo rebuilt our delivery pipeline with observability baked in. We shipped 2x faster while holding uptime above 99.97%.',
            capturedAt: yesterday,
            deliveredAt: twoDaysAgo,
            source: 'portal',
            status: 'approved',
            isFeatured: true,
            shareUrl: 'https://proof.gigvora.com/leo/testimonials/lumen-analytics',
            media: { format: 'text', sentiment: 'promoter' },
            metadata: { responseTimeMinutes: 42, reviewRequestId: 'rr_123' },
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.reputationTestimonials[1],
            freelancerId: seededIds.users[1],
            clientName: 'Marcel Nguyen',
            clientRole: 'Agency Director',
            company: 'Catalyst Talent Agency',
            projectName: 'Provider workspace launch',
            rating: 5,
            comment:
              'Our launchpad went live with automated scorecards and spotless CSAT tracking. Leo orchestrated every integration flawlessly.',
            capturedAt: now,
            deliveredAt: yesterday,
            source: 'video',
            status: 'approved',
            isFeatured: false,
            shareUrl: 'https://proof.gigvora.com/leo/testimonials/catalyst-video',
            media: { format: 'video', durationSeconds: 92, transcriptionAvailable: true },
            metadata: { language: 'en', consentVersion: '2024-08-01' },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.reputationTestimonials[2],
            freelancerId: seededIds.users[1],
            clientName: 'Ivy Chen',
            clientRole: 'Program Manager',
            company: 'Nova Accelerator',
            projectName: 'Launchpad automation',
            rating: 4.8,
            comment:
              'Weekly automation syncs kept our mentors and fellows aligned. The review workflows freed 10+ hours per cohort.',
            capturedAt: yesterday,
            deliveredAt: threeDaysAgo,
            source: 'manual',
            status: 'approved',
            isFeatured: false,
            shareUrl: null,
            media: { format: 'audio', transcriptionAvailable: true },
            metadata: { responseChannel: 'slack' },
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'reputation_success_stories',
        [
          {
            id: seededIds.reputationSuccessStories[0],
            freelancerId: seededIds.users[1],
            title: 'How Lumen Analytics doubled release velocity',
            slug: 'lumen-analytics-release-velocity',
            summary:
              'Instrumented the Gigvora workspace for Lumen Analytics with automated QA and deploy guardrails, achieving a 52% faster release cadence.',
            content:
              'Partnered with Lumen to rebuild delivery pipelines, adding CI observability and value stream analytics. This enabled the team to catch regressions earlier and build trust with enterprise clients.',
            heroImageUrl: 'https://cdn.gigvora.com/stories/lumen-analytics.jpg',
            status: 'published',
            publishedAt: yesterday,
            featured: true,
            impactMetrics: {
              uptime: '99.97%',
              deploymentFrequency: '2.1x',
              csatLift: '+0.4',
            },
            ctaUrl: 'https://portfolio.leo.example.com/lumen-analytics',
            metadata: { tags: ['engineering', 'observability'] },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.reputationSuccessStories[1],
            freelancerId: seededIds.users[1],
            title: 'Catalyst Talent automates provider onboarding',
            slug: 'catalyst-talent-provider-onboarding',
            summary:
              'Delivered a provider workspace rollout with badge automation and CSAT verification, reducing manual onboarding time by 68%.',
            content:
              'Configured badge issuance, testimonial capture, and compliance audits. Integrated Slack and CRM triggers so Catalyst teams could monitor activation health in real time.',
            heroImageUrl: 'https://cdn.gigvora.com/stories/catalyst-talent.jpg',
            status: 'published',
            publishedAt: now,
            featured: false,
            impactMetrics: {
              onboardingTimeReduction: '68%',
              testimonialsCollected: 42,
              referralPipelineGrowth: '3.2x',
            },
            ctaUrl: 'https://portfolio.leo.example.com/catalyst-provider-workspace',
            metadata: { tags: ['operations', 'automation'] },
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'reputation_metrics',
        [
          {
            id: seededIds.reputationMetrics[0],
            freelancerId: seededIds.users[1],
            metricType: 'on_time_delivery_rate',
            label: 'On-time delivery rate',
            value: 98.4,
            unit: 'percentage',
            period: 'rolling_12_months',
            source: 'project_workspace',
            trendDirection: 'up',
            trendValue: 2.1,
            verifiedBy: 'Mia Operations',
            verifiedAt: yesterday,
            metadata: { sampleSize: 124 },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.reputationMetrics[1],
            freelancerId: seededIds.users[1],
            metricType: 'average_csat',
            label: 'Average CSAT',
            value: 4.92,
            unit: 'csat',
            period: 'rolling_12_months',
            source: 'post_project_surveys',
            trendDirection: 'up',
            trendValue: 0.3,
            verifiedBy: 'Gigvora QA',
            verifiedAt: yesterday,
            metadata: { responseRate: 0.78 },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.reputationMetrics[2],
            freelancerId: seededIds.users[1],
            metricType: 'referral_ready_clients',
            label: 'Referral-ready clients',
            value: 36,
            unit: 'count',
            period: 'rolling_6_months',
            source: 'crm',
            trendDirection: 'up',
            trendValue: 6,
            verifiedBy: 'Ava Founder',
            verifiedAt: now,
            metadata: { promoters: 36, passives: 4 },
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.reputationMetrics[3],
            freelancerId: seededIds.users[1],
            metricType: 'case_studies_published',
            label: 'Case studies published',
            value: 12,
            unit: 'count',
            period: 'rolling_12_months',
            source: 'content_hub',
            trendDirection: 'up',
            trendValue: 4,
            verifiedBy: 'Content Ops',
            verifiedAt: now,
            metadata: { distributionChannels: ['Gigvora', 'LinkedIn', 'Medium'] },
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'reputation_badges',
        [
          {
            id: seededIds.reputationBadges[0],
            freelancerId: seededIds.users[1],
            name: 'Gigvora Elite',
            slug: 'gigvora-elite',
            description: 'Awarded for sustained 95%+ CSAT across enterprise programs.',
            issuedBy: 'Gigvora Trust Council',
            issuedAt: twoDaysAgo,
            expiresAt: null,
            badgeType: 'program',
            level: 'elite',
            assetUrl: 'https://cdn.gigvora.com/badges/gigvora-elite.svg',
            isPromoted: true,
            metadata: { cohort: '2024Q3' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.reputationBadges[1],
            freelancerId: seededIds.users[1],
            name: 'On-time Delivery Champion',
            slug: 'on-time-delivery-champion',
            description: 'Recognises 12 consecutive months without a missed milestone.',
            issuedBy: 'Gigvora Delivery Ops',
            issuedAt: yesterday,
            expiresAt: null,
            badgeType: 'achievement',
            level: 'gold',
            assetUrl: 'https://cdn.gigvora.com/badges/on-time-champion.svg',
            isPromoted: true,
            metadata: { streakMonths: 12 },
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.reputationBadges[2],
            freelancerId: seededIds.users[1],
            name: 'Community Mentor',
            slug: 'community-mentor',
            description: 'Celebrates contributions to Gigvora launchpad mentorship cohorts.',
            issuedBy: 'Launchpad Guild',
            issuedAt: threeDaysAgo,
            expiresAt: null,
            badgeType: 'community',
            level: 'mentor',
            assetUrl: 'https://cdn.gigvora.com/badges/community-mentor.svg',
            isPromoted: false,
            metadata: { mentees: 14 },
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'reputation_review_widgets',
        [
          {
            id: seededIds.reputationReviewWidgets[0],
            freelancerId: seededIds.users[1],
            name: 'Portfolio testimonial carousel',
            slug: 'testimonial-carousel',
            widgetType: 'carousel',
            status: 'active',
            embedScript: '<script src="https://widgets.gigvora.com/carousel.js" data-widget="leo-testimonials"></script>',
            config: { theme: 'midnight', autoRotateSeconds: 8 },
            impressions: 1824,
            ctaClicks: 164,
            lastSyncedAt: now,
            metadata: { placement: 'portfolio' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.reputationReviewWidgets[1],
            freelancerId: seededIds.users[1],
            name: 'Deal room success badge',
            slug: 'deal-room-badge',
            widgetType: 'badge',
            status: 'active',
            embedScript: '<script src="https://widgets.gigvora.com/badge.js" data-widget="leo-deal-badge"></script>',
            config: { layout: 'compact', accentColor: '#0ea5e9' },
            impressions: 642,
            ctaClicks: 58,
            lastSyncedAt: yesterday,
            metadata: { placement: 'crm' },
            createdAt: yesterday,
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
            ownerId: seededIds.users[1],
            slug: 'conversion-focused-brand-sprint',
            title: 'Landing Page Revamp',
            description: 'Refresh marketing site with conversion experiments and WCAG 2.1 AA compliance.',
            budget: '$4,500',
            duration: '5 weeks',
            location: 'Remote • Global',
            geoLocation: { lat: 52.52, lng: 13.405 },
            summary:
              'Brand sprint and launch collateral kit tailored for SaaS teams shipping high-impact campaigns with analytics baked in.',
            status: 'published',
            heroTitle: 'Ship conversion-ready launch campaigns in 10 days',
            heroSubtitle:
              'Tiered brand systems, social launch assets, and analytics dashboards packaged for scale-ups and venture studios.',
            heroMediaUrl: 'https://cdn.gigvora.com/media/gigs/brand-sprint/hero-video.mp4',
            heroTheme: 'midnight-gradient',
            heroBadge: 'Featured',
            sellingPoints: [
              'Conversion copy engineered with 50+ experiments worth of learnings.',
              'Async approvals with live preview mode for desktop, tablet, and mobile.',
              'Data-backed add-ons and nurture sequences that plug into existing CRMs.',
            ],
            requirements: [
              {
                label: 'Kickoff questionnaire',
                description: '10-minute intake covering positioning, ICP, and product launch timelines.',
              },
              {
                label: 'Brand files',
                description: 'Existing logo marks, brand guardrails, or inspiration boards if available.',
              },
              {
                label: 'Success metrics',
                description: 'Access to baseline conversion data or high-level growth targets.',
              },
            ],
            faqs: [
              {
                question: 'How quickly can we launch?',
                answer:
                  'Most teams ship the core landing page, CTA banners, and nurture sequence within 10 business days following kickoff.',
              },
              {
                question: 'Do you support white-label delivery?',
                answer:
                  'Yes — agencies and venture studios can co-brand deliverables and integrate internal PM tools for seamless collaboration.',
              },
            ],
            conversionCopy: {
              hook: 'Launch days without the scramble — every asset aligned to revenue goals.',
              valuePillars: [
                'Conversion design system with analytics instrumentation and QA baked in.',
                'Tiered pricing mapped to experiment velocity and stakeholder complexity.',
                'Automations for testimonial capture, referral nudges, and nurture follow-ups.',
              ],
              proof: '148 completed gigs, 37% average uplift in landing page conversions.',
              guarantee:
                'Strategy not resonating after kickoff? Receive a reworked direction within 24 hours or the next milestone is free.',
            },
            analyticsSettings: {
              baseline: {
                conversionRate: 9.3,
                averageOrderValue: 860,
                upsellTakeRate: 21.4,
              },
            },
            location: 'Remote',
            freelancerId: seededIds.users[1],
            status: 'in_delivery',
            pipelineStage: 'production',
            contractValueCents: 450000,
            previousPipelineValueCents: 420000,
            currency: 'USD',
            upsellEligibleValueCents: 95000,
            expectedDeliveryDate: inFiveDays,
            clientName: 'Brightside Labs',
            csatScore: 4.8,
            csatPreviousScore: 4.6,
            csatResponseCount: 18,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[1],
            title: 'SaaS Onboarding Redesign',
            description: 'End-to-end onboarding flow redesign with analytics instrumentation and billing funnel experiments.',
            budget: '$6,200',
            duration: '4 weeks',
            location: 'Remote - North America',
            freelancerId: seededIds.users[1],
            status: 'active',
            pipelineStage: 'review',
            contractValueCents: 620000,
            previousPipelineValueCents: 540000,
            currency: 'USD',
            upsellEligibleValueCents: 125000,
            expectedDeliveryDate: inTwoDays,
            clientName: 'Arcadia Systems',
            csatScore: 4.9,
            csatPreviousScore: 4.7,
            csatResponseCount: 22,
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[2],
            title: 'Brand Identity Reboot',
            description: 'Comprehensive rebrand with messaging architecture, identity system, and collateral refresh.',
            budget: '$5,800',
            duration: '6 weeks',
            location: 'Hybrid - London',
            freelancerId: seededIds.users[1],
            status: 'active',
            pipelineStage: 'kickoff',
            contractValueCents: 580000,
            previousPipelineValueCents: 0,
            currency: 'USD',
            upsellEligibleValueCents: 88000,
            expectedDeliveryDate: inTenDays,
            clientName: 'Nova Ventures',
            csatScore: 4.7,
            csatPreviousScore: 4.5,
            csatResponseCount: 12,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[3],
            title: 'Growth Landing Page Sprint',
            description: 'Rapid experimentation sprint with CRO roadmap, variant production, and QA automation.',
            budget: '$3,900',
            duration: '3 weeks',
            location: 'Remote - EMEA',
            freelancerId: seededIds.users[1],
            status: 'active',
            pipelineStage: 'ready_to_close',
            contractValueCents: 390000,
            previousPipelineValueCents: 350000,
            currency: 'USD',
            upsellEligibleValueCents: 64000,
            expectedDeliveryDate: tomorrow,
            clientName: 'Helix Studios',
            csatScore: 4.6,
            csatPreviousScore: 4.4,
            csatResponseCount: 16,
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
        'gig_packages',
        [
          {
            id: seededIds.gigPackages[0],
            gigId: seededIds.gigs[0],
            tierName: 'Brand Spark',
            tagline: 'Founders validating a new product',
            description: 'Moodboard, copy calibration, and two hero concepts with async approvals.',
            priceAmount: 395,
            priceCurrency: 'USD',
            deliveryDays: 4,
            revisionCount: 1,
            features: ['Moodboard + font pairings', 'Two logo lockups', '1x round of revisions'],
            isBestValue: false,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigPackages[1],
            gigId: seededIds.gigs[0],
            tierName: 'Growth Accelerator',
            tagline: 'Teams scaling paid campaigns',
            description: 'Full visual system, social launch kit, and CTA banner experiments.',
            priceAmount: 1150,
            priceCurrency: 'USD',
            deliveryDays: 7,
            revisionCount: 2,
            features: ['Full visual system', 'Social launch kit', 'Two CTA banner concepts'],
            isBestValue: true,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigPackages[2],
            gigId: seededIds.gigs[0],
            tierName: 'Experience Suite',
            tagline: 'Flagship launch for funded teams',
            description: 'Brand playbook, interactive walkthrough video, and optimization sprint.',
            priceAmount: 2450,
            priceCurrency: 'USD',
            deliveryDays: 12,
            revisionCount: 3,
            features: [
              'Brand playbook (20+ pages)',
              'Interactive gig walkthrough video',
              'Post-launch optimization sprint',
            ],
            isBestValue: false,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'gig_addons',
        [
          {
            id: seededIds.gigAddons[0],
            gigId: seededIds.gigs[0],
            name: 'Rush delivery',
            description: '48-hour turnaround with weekend availability and priority revisions.',
            priceAmount: 180,
            priceCurrency: 'USD',
            deliveryDays: 2,
            isPopular: true,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigAddons[1],
            gigId: seededIds.gigs[0],
            name: 'Additional CTA banners',
            description: 'Three extra headline + CTA variations wired into analytics events.',
            priceAmount: 95,
            priceCurrency: 'USD',
            deliveryDays: 1,
            isPopular: false,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigAddons[2],
            gigId: seededIds.gigs[0],
            name: 'Sales enablement deck',
            description: 'Ten-slide pitch deck aligned to gig narrative and core benefits.',
            priceAmount: 220,
            priceCurrency: 'USD',
            deliveryDays: 3,
            isPopular: true,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'gig_media_assets',
        [
          {
            id: seededIds.gigMediaAssets[0],
            gigId: seededIds.gigs[0],
            assetType: 'video',
            url: 'https://cdn.gigvora.com/media/gigs/brand-sprint/showreel.mp4',
            thumbnailUrl: 'https://cdn.gigvora.com/media/gigs/brand-sprint/showreel-thumb.jpg',
            caption: 'Interactive walkthrough of the launch-ready workspace.',
            displayOrder: 0,
            processingStatus: 'ready',
            metadata: { durationSeconds: 92, format: 'mp4' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigMediaAssets[1],
            gigId: seededIds.gigs[0],
            assetType: 'image',
            url: 'https://cdn.gigvora.com/media/gigs/brand-sprint/carousel-1.png',
            thumbnailUrl: 'https://cdn.gigvora.com/media/gigs/brand-sprint/carousel-1-thumb.png',
            caption: 'Carousel preview of responsive tier cards.',
            displayOrder: 1,
            processingStatus: 'ready',
            metadata: { dimensions: '1600x900' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigMediaAssets[2],
            gigId: seededIds.gigs[0],
            assetType: 'document',
            url: 'https://cdn.gigvora.com/media/gigs/brand-sprint/testimonial-pack.pdf',
            thumbnailUrl: 'https://cdn.gigvora.com/media/gigs/brand-sprint/testimonial-pack-thumb.png',
            caption: 'Testimonial excerpts ready for landing pages and sales decks.',
            displayOrder: 2,
            processingStatus: 'processing',
            metadata: { pages: 6 },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'gig_call_to_actions',
        [
          {
            id: seededIds.gigCallToActions[0],
            gigId: seededIds.gigs[0],
            headline: 'Launch with confidence',
            subheadline: 'First-time founders get a launch-ready brand system in 10 days.',
            buttonLabel: 'Book concept sprint',
            buttonUrl: 'https://gigvora.com/checkout/brand-sprint',
            stylePreset: 'bold-gradient',
            audienceSegment: 'first_time_founders',
            badge: 'Most booked',
            expectedLift: 22.4,
            metadata: { variant: 'A', tone: 'Aspirational' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigCallToActions[1],
            gigId: seededIds.gigs[0],
            headline: 'Show stakeholders the plan',
            subheadline: 'CMO buyers unlock a full launch roadmap and ROI calculator.',
            buttonLabel: 'Download launch roadmap',
            buttonUrl: 'https://gigvora.com/gigs/brand-sprint/roadmap',
            stylePreset: 'data-led',
            audienceSegment: 'cmo_buyers',
            badge: 'Enterprise',
            expectedLift: 15.1,
            metadata: { variant: 'B', tone: 'Data-led' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigCallToActions[2],
            gigId: seededIds.gigs[0],
            headline: 'Co-deliver with Riley',
            subheadline: 'Agency partners access white-label scope and shared delivery playbooks.',
            buttonLabel: 'Review white-label scope',
            buttonUrl: 'https://gigvora.com/partners/brand-sprint',
            stylePreset: 'collaborative',
            audienceSegment: 'agencies',
            badge: 'Partner favorite',
            expectedLift: 18.0,
            metadata: { variant: 'C', tone: 'Collaborative' },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'gig_preview_layouts',
        [
          {
            id: seededIds.gigPreviewLayouts[0],
            gigId: seededIds.gigs[0],
            deviceType: 'desktop',
            headline: 'Hero headline, testimonial slider, and sticky pricing panel above the fold.',
            supportingCopy: 'Optimized for 1440px canvases with persistent checkout CTA.',
            previewUrl: 'https://cdn.gigvora.com/previews/brand-sprint/desktop.png',
            layoutSettings: { stickyPricing: true, testimonialCount: 3 },
            conversionRate: 12.4,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigPreviewLayouts[1],
            gigId: seededIds.gigs[0],
            deviceType: 'tablet',
            headline: 'Tier cards collapse into swipeable deck with persistent CTA banner.',
            supportingCopy: 'Optimized for 1024px portrait experiences.',
            previewUrl: 'https://cdn.gigvora.com/previews/brand-sprint/tablet.png',
            layoutSettings: { swipeableDeck: true, bannerVariant: 'B' },
            conversionRate: 9.8,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigPreviewLayouts[2],
            gigId: seededIds.gigs[0],
            deviceType: 'mobile',
            headline: 'Smart accordions reveal deliverables and add-ons.',
            supportingCopy: 'Optimized for 375px viewports with sticky booking button.',
            previewUrl: 'https://cdn.gigvora.com/previews/brand-sprint/mobile.png',
            layoutSettings: { accordions: true, stickyCta: true },
            conversionRate: 7.6,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'gig_performance_snapshots',
        [
          {
            id: seededIds.gigPerformanceSnapshots[0],
            gigId: seededIds.gigs[0],
            snapshotDate: yesterday,
            periodLabel: 'Last 30 days',
            conversionRate: 12.4,
            averageOrderValue: 1082,
            completionRate: 97.2,
            upsellTakeRate: 27.3,
            reviewScore: 4.9,
            bookingsLast30Days: 18,
            experimentNotes: {
              promoBannerLift: 9.0,
              highlightedVariant: 'bold-gradient',
            },
            createdAt: yesterday,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'projects',
        'gig_milestones',
        [
          {
            id: seededIds.gigMilestones[0],
            gigId: seededIds.gigs[0],
            title: 'Wireframe approval',
            description: 'Review Figma wireframes with core stakeholders and capture sign-off notes.',
            dueDate: tomorrow,
            status: 'in_progress',
            ownerName: 'Lena Martinez',
            sequenceIndex: 1,
            progressPercent: 65,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigMilestones[1],
            gigId: seededIds.gigs[0],
            title: 'Conversion copy polish',
            description: 'Apply CRO copy edits and capture final QA checklist results.',
            dueDate: inTwoDays,
            status: 'waiting_on_client',
            ownerName: 'Noah Franklin',
            sequenceIndex: 2,
            progressPercent: 40,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigMilestones[2],
            gigId: seededIds.gigs[1],
            title: 'Prototype handoff',
            description: 'Deliver interactive onboarding prototype with instrumentation notes.',
            dueDate: inTwoDays,
            status: 'in_progress',
            ownerName: 'Lena Martinez',
            sequenceIndex: 3,
            progressPercent: 55,
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigMilestones[3],
            gigId: seededIds.gigs[1],
            title: 'Analytics QA sign-off',
            description: 'Validate funnel events and billing integration dashboards.',
            dueDate: inFiveDays,
            status: 'at_risk',
            ownerName: 'Maya Monroe',
            sequenceIndex: 4,
            progressPercent: 30,
            createdAt: threeDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigMilestones[4],
            gigId: seededIds.gigs[2],
            title: 'Brand discovery workshop',
            description: 'Facilitate positioning, voice, and audience workshops with client leadership.',
            dueDate: inSevenDays,
            status: 'in_progress',
            ownerName: 'Noah Franklin',
            sequenceIndex: 1,
            progressPercent: 20,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigMilestones[5],
            gigId: seededIds.gigs[3],
            title: 'Final QA & launch prep',
            description: 'QA automation, pixel QA, and analytics dashboards ahead of launch.',
            dueDate: tomorrow,
            status: 'at_risk',
            ownerName: 'Lena Martinez',
            sequenceIndex: 3,
            progressPercent: 45,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'gig_bundles',
        [
          {
            id: seededIds.gigBundles[0],
            freelancerId: seededIds.users[1],
            name: 'Product launch sprint',
            description: 'Strategy intensive, UX flows, and launch assets packaged for high-velocity releases.',
            priceCents: 480000,
            currency: 'USD',
            status: 'live',
            attachRate: 68.0,
            attachRateChange: 6.0,
            isFeatured: true,
            conversionWindowDays: 30,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigBundles[1],
            freelancerId: seededIds.users[1],
            name: 'Brand accelerator',
            description: 'Logo refresh, messaging pack, and social toolkit with collaborative workshops.',
            priceCents: 320000,
            currency: 'USD',
            status: 'testing',
            attachRate: 41.0,
            attachRateChange: 3.0,
            isFeatured: false,
            conversionWindowDays: 21,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigBundles[2],
            freelancerId: seededIds.users[1],
            name: 'Retention uplift kit',
            description: 'Lifecycle email journey, onboarding audits, and experiment roadmap for retention teams.',
            priceCents: 275000,
            currency: 'USD',
            status: 'draft',
            attachRate: 24.0,
            attachRateChange: -2.0,
            isFeatured: false,
            conversionWindowDays: 28,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'gig_bundle_items',
        [
          { id: seededIds.gigBundleItems[0], bundleId: seededIds.gigBundles[0], label: 'Strategy workshop', orderIndex: 0, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[1], bundleId: seededIds.gigBundles[0], label: 'UX flow maps', orderIndex: 1, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[2], bundleId: seededIds.gigBundles[0], label: 'Launch landing page', orderIndex: 2, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[3], bundleId: seededIds.gigBundles[1], label: 'Logo refresh', orderIndex: 0, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[4], bundleId: seededIds.gigBundles[1], label: 'Messaging pack', orderIndex: 1, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[5], bundleId: seededIds.gigBundles[1], label: 'Social toolkit', orderIndex: 2, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[6], bundleId: seededIds.gigBundles[2], label: 'Lifecycle audit', orderIndex: 0, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[7], bundleId: seededIds.gigBundles[2], label: 'Experiment backlog', orderIndex: 1, createdAt: twoDaysAgo, updatedAt: now },
          { id: seededIds.gigBundleItems[8], bundleId: seededIds.gigBundles[2], label: 'CRM automation setup', orderIndex: 2, createdAt: twoDaysAgo, updatedAt: now },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'gig_upsells',
        [
          {
            id: seededIds.gigUpsells[0],
            freelancerId: seededIds.users[1],
            name: 'Conversion copy add-on',
            triggerEvent: 'Trigger after milestone 2 completes',
            deliveryAction: 'Auto email + CRM task',
            status: 'running',
            automationChannel: 'email',
            estimatedValueCents: 65000,
            currency: 'USD',
            conversionRate: 31.0,
            conversionChange: 4.0,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigUpsells[1],
            freelancerId: seededIds.users[1],
            name: 'Retainer upgrade',
            triggerEvent: 'Trigger on 3+ delivered gigs',
            deliveryAction: 'Schedule strategy call',
            status: 'pilot',
            automationChannel: 'calendar',
            estimatedValueCents: 240000,
            currency: 'USD',
            conversionRate: 18.0,
            conversionChange: 2.0,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigUpsells[2],
            freelancerId: seededIds.users[1],
            name: 'Motion teaser package',
            triggerEvent: 'Trigger on design gigs entering review',
            deliveryAction: 'Offer during review stage',
            status: 'paused',
            automationChannel: 'in_app',
            estimatedValueCents: 90000,
            currency: 'USD',
            conversionRate: 12.0,
            conversionChange: -1.0,
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'gig_catalog_items',
        [
          {
            id: seededIds.gigCatalogItems[0],
            freelancerId: seededIds.users[1],
            code: 'UX-103',
            title: 'Product onboarding teardown',
            tier: 'Pro',
            durationDays: 5,
            rating: 4.9,
            ratingCount: 86,
            priceCents: 125000,
            currency: 'USD',
            status: 'published',
            shortDescription: 'Audit conversion funnels, identify drop-offs, and prioritize experiments.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigCatalogItems[1],
            freelancerId: seededIds.users[1],
            code: 'BR-208',
            title: 'Brand identity reboot',
            tier: 'Premium',
            durationDays: 21,
            rating: 5.0,
            ratingCount: 54,
            priceCents: 380000,
            currency: 'USD',
            status: 'published',
            shortDescription: 'Complete rebrand with voice strategy, identity system, and collateral rollout.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigCatalogItems[2],
            freelancerId: seededIds.users[1],
            code: 'GR-118',
            title: 'Growth landing page sprint',
            tier: 'Pro',
            durationDays: 7,
            rating: 4.8,
            ratingCount: 73,
            priceCents: 210000,
            currency: 'USD',
            status: 'published',
            shortDescription: 'Rapid CRO experimentation, design iterations, and analytics automation.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigCatalogItems[3],
            freelancerId: seededIds.users[1],
            code: 'CS-404',
            title: 'Customer retention accelerator',
            tier: 'Growth',
            durationDays: 28,
            rating: 4.7,
            ratingCount: 38,
            priceCents: 295000,
            currency: 'USD',
            status: 'draft',
            shortDescription: 'Lifecycle journey mapping, churn analysis, and automated retention playbooks.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[1],
            title: 'UX audit & redesign sprint',
            description: 'Comprehensive experience assessment with actionable redesign recommendations.',
            budget: '$3200',
            duration: '3 weeks',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[2],
            title: 'Product marketing launch kit',
            description: 'Messaging, collateral, and GTM orchestration for product releases.',
            budget: '$4800',
            duration: '4 weeks',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[3],
            title: 'Growth experiment playbook',
            description: 'Rapid experimentation framework with experiment backlog and analytics.',
            budget: '$2800',
            duration: '2 weeks',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[4],
            title: 'Patient onboarding revamp',
            description: 'Healthcare onboarding journey redesign with compliance-ready assets.',
            budget: '$5600',
            duration: '6 weeks',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[5],
            title: 'Fintech onboarding illustrations',
            description: 'Illustration system for fintech onboarding experiences with accessibility focus.',
            budget: '$3900',
            duration: '3 weeks',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.gigs[6],
            title: 'B2B positioning workshop',
            description: 'Executive workshop and deliverables to sharpen B2B positioning and messaging.',
            budget: '$4200',
            duration: '1 week',
            createdAt: twoDaysAgo,
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
        'client_portals',
        [
          {
            id: seededIds.clientPortals[0],
            projectId: seededIds.projects[0],
            ownerId: seededIds.users[1],
            slug: 'brand-retainer-collaboration-hub',
            title: 'Brand Retainer Collaboration Hub',
            summary:
              'Shared client portal for Rize Analytics to review milestones, scope agreements, and weekly decision logs.',
            status: 'active',
            brandColor: '#2563EB',
            accentColor: '#F97316',
            preferences: {
              digest: {
                frequency: 'weekly',
                recipients: ['ops@rizeanalytics.com', 'finance@rizeanalytics.com'],
              },
              theme: { brand: '#2563EB', accent: '#F97316' },
              insights: { showRevenue: true, riskTolerance: 'medium' },
            },
            stakeholders: [
              {
                name: 'Mia Operations',
                role: 'COO',
                email: 'mia@gigvora.com',
                organization: 'Rize Analytics',
                preferredChannel: 'email',
                notify: true,
              },
              {
                name: 'Leo Freelancer',
                role: 'Account Lead',
                email: 'leo@gigvora.com',
                organization: 'Gigvora Collective',
                preferredChannel: 'slack',
                notify: true,
              },
              {
                name: 'Sasha Patel',
                role: 'Product Owner',
                email: 'sasha@rizeanalytics.com',
                organization: 'Rize Analytics',
                preferredChannel: 'email',
                notify: true,
              },
            ],
        'project_blueprints',
        [
          {
            id: seededIds.projectBlueprints[0],
            projectId: seededIds.projects[0],
            summary:
              'Program blueprint translating discovery, design, build, and launch into accountable sprints with financial guardrails.',
            methodology: 'dual-track agile',
            governanceModel: 'weekly_governance_forum',
            sprintCadence: 'bi-weekly',
            programManager: 'Mia Operations',
            healthStatus: 'at_risk',
            startDate: twoDaysAgo,
            endDate: sixWeeksLater,
            lastReviewedAt: yesterday,
            metadata: {
              billingCadence: 'milestone',
              riskAppetite: 'moderate',
              stakeholderGroups: ['Product', 'Marketing', 'Compliance'],
            },
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'client_portal_timeline_events',
        [
          {
            id: seededIds.clientPortalTimelineEvents[0],
            portalId: seededIds.clientPortals[0],
            ownerId: seededIds.users[1],
            title: 'Kickoff alignment workshop',
            description: 'Ran working session with marketing, product, and ops stakeholders to align KPIs.',
            eventType: 'workshop',
            status: 'completed',
            startDate: threeDaysAgo,
            dueDate: twoDaysAgo,
            metadata: {
              recordingsUrl: 'https://meetings.gigvora.com/kickoff-recording',
              decisionSnapshot: 'Workshop outcomes documented in portal decision log #1.',
            },
            createdAt: threeDaysAgo,
            updatedAt: twoDaysAgo,
          },
          {
            id: seededIds.clientPortalTimelineEvents[1],
            portalId: seededIds.clientPortals[0],
            ownerId: seededIds.users[1],
            title: 'Journey mapping sprints',
            description: 'Assemble product discovery research into two prioritized customer journeys.',
            eventType: 'milestone',
            status: 'in_progress',
            startDate: yesterday,
            dueDate: tomorrow,
            metadata: {
              deliverables: ['Persona briefs', 'Service blueprint'],
              blockers: [],
            },
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.clientPortalTimelineEvents[2],
            portalId: seededIds.clientPortals[0],
            ownerId: seededIds.users[2],
            title: 'Visual identity preview',
            description: 'Present color directions and typography lockups for stakeholder review.',
            eventType: 'review',
            status: 'at_risk',
            startDate: yesterday,
            dueDate: nextWeek,
            metadata: {
              riskNotes: 'Awaiting photography approvals from legal; may delay feedback session.',
            },
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.clientPortalTimelineEvents[3],
            portalId: seededIds.clientPortals[0],
            ownerId: seededIds.users[1],
            title: 'Analytics instrumentation go-live',
            description: 'Enable event streams, dashboards, and alerting for the new brand experience.',
            eventType: 'launch',
            status: 'planned',
            startDate: nextWeek,
            dueDate: fifteenDaysFromNow,
            metadata: {
              dependencies: ['Finalize dashboard schema', 'QA tracking plan'],
            },
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'client_portal_scope_items',
        [
          {
            id: seededIds.clientPortalScopeItems[0],
            portalId: seededIds.clientPortals[0],
            title: 'Brand messaging playbook',
            description: 'Core messaging architecture with tone, proof points, and channel guardrails.',
            category: 'Brand strategy',
            status: 'delivered',
            effortHours: 18,
            valueCurrency: 'USD',
            valueAmount: 6200,
            lastDecisionAt: twoDaysAgo,
            metadata: {
              approvals: ['Rize leadership'],
              files: ['https://cdn.gigvora.com/brand-playbook-v1.pdf'],
            },
        { transaction }
      );

      await queryInterface.bulkInsert(
        'project_blueprint_sprints',
        [
          {
            id: seededIds.projectBlueprintSprints[0],
            blueprintId: seededIds.projectBlueprints[0],
            sequence: 1,
            name: 'Sprint 0 – Discovery Kickoff',
            objective: 'Align stakeholders, confirm backlog, and baseline success metrics.',
            startDate: twoDaysAgo,
            endDate: yesterday,
            status: 'completed',
            owner: 'Mia Operations',
            velocityCommitment: 0,
            progress: 100,
            deliverables: [
              'Kickoff workshop summary',
              'Stakeholder alignment map',
              'Prioritized backlog with acceptance criteria',
            ],
            acceptanceCriteria: 'Stakeholders sign off on backlog scope and baseline KPIs.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBlueprintSprints[1],
            blueprintId: seededIds.projectBlueprints[0],
            sequence: 2,
            name: 'Sprint 1 – Research & Strategy',
            objective: 'Synthesize interviews, moodboards, and analytics to inform design.',
            startDate: yesterday,
            endDate: nextWeek,
            status: 'in_progress',
            owner: 'Leo Freelancer',
            velocityCommitment: 18,
            progress: 55,
            deliverables: [
              'Interview synthesis report',
              'Experience architecture deck',
              'Dependency sign-off log',
            ],
            acceptanceCriteria: 'Research insights documented and approved by creative lead.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBlueprintSprints[2],
            blueprintId: seededIds.projectBlueprints[0],
            sequence: 3,
            name: 'Sprint 2 – Build & Proof',
            objective: 'Produce high-fidelity assets and interactive prototypes for testing.',
            startDate: nextWeek,
            endDate: twoWeeksLater,
            status: 'planned',
            owner: 'Noor Designer',
            velocityCommitment: 20,
            progress: 0,
            deliverables: ['High-fidelity design system', 'Prototype test results', 'Engineering handoff package'],
            acceptanceCriteria: 'Prototype meets usability thresholds with signed QA checklist.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBlueprintSprints[3],
            blueprintId: seededIds.projectBlueprints[0],
            sequence: 4,
            name: 'Sprint 3 – Launch & Optimise',
            objective: 'Oversee implementation, launch readiness, and post-launch optimisations.',
            startDate: twoWeeksLater,
            endDate: threeWeeksLater,
            status: 'planned',
            owner: 'Ava Founder',
            velocityCommitment: 16,
            progress: 0,
            deliverables: ['Launch runbook', 'Go-live QA summary', 'Optimisation backlog'],
            acceptanceCriteria: 'Launch retrospective logged with next-iteration backlog prioritised.',
            createdAt: twoDaysAgo,
        'gig_orders',
        [
          {
            id: seededIds.gigOrders[0],
            orderNumber: 'GV-2483',
            gigId: seededIds.gigs[1],
            clientId: seededIds.users[4],
            freelancerId: seededIds.users[1],
            clientCompanyName: 'Lumen Analytics',
            clientContactName: 'Mia Chen',
            clientContactEmail: 'mia.chen@lumenanalytics.com',
            clientContactPhone: '+1-512-555-0193',
            status: 'awaiting_requirements',
            currencyCode: 'USD',
            amount: 3200,
            progressPercent: 10,
            submittedAt: new Date('2024-04-03T14:20:00Z'),
            kickoffDueAt: new Date('2024-04-05T16:00:00Z'),
            dueAt: new Date('2024-04-18T23:59:00Z'),
            metadata: { acquisitionChannel: 'marketplace', onboardingFormId: 'REQ-2483' },
            createdAt: new Date('2024-04-03T14:20:00Z'),
            updatedAt: now,
          },
          {
            id: seededIds.gigOrders[1],
            orderNumber: 'GV-2478',
            gigId: seededIds.gigs[2],
            clientId: seededIds.users[5],
            freelancerId: seededIds.users[1],
            clientCompanyName: 'Atlas Labs',
            clientContactName: 'Devon Ortiz',
            clientContactEmail: 'devon@atlaslabs.io',
            clientContactPhone: '+1-415-555-0192',
            status: 'in_progress',
            currencyCode: 'USD',
            amount: 4800,
            progressPercent: 65,
            submittedAt: new Date('2024-03-28T09:45:00Z'),
            kickoffDueAt: new Date('2024-03-30T16:00:00Z'),
            dueAt: new Date('2024-04-12T23:59:00Z'),
            metadata: { deliveryWorkspaceUrl: 'https://workspace.gigvora.test/gv-2478' },
            createdAt: new Date('2024-03-28T09:45:00Z'),
            updatedAt: now,
          },
          {
            id: seededIds.gigOrders[2],
            orderNumber: 'GV-2473',
            gigId: seededIds.gigs[3],
            clientId: seededIds.users[6],
            freelancerId: seededIds.users[1],
            clientCompanyName: 'Orbit Media',
            clientContactName: 'Leo Gardner',
            clientContactEmail: 'leo@orbitmedia.co',
            clientContactPhone: '+1-773-555-0178',
            status: 'in_progress',
            currencyCode: 'USD',
            amount: 2800,
            progressPercent: 45,
            submittedAt: new Date('2024-03-26T15:15:00Z'),
            kickoffDueAt: new Date('2024-03-28T17:00:00Z'),
            dueAt: new Date('2024-04-09T20:00:00Z'),
            metadata: { experimentCadence: 'bi-weekly' },
            createdAt: new Date('2024-03-26T15:15:00Z'),
            updatedAt: now,
          },
          {
            id: seededIds.gigOrders[3],
            orderNumber: 'GV-2469',
            gigId: seededIds.gigs[4],
            clientId: seededIds.users[7],
            freelancerId: seededIds.users[1],
            clientCompanyName: 'Nova Health Systems',
            clientContactName: 'Jules Park',
            clientContactEmail: 'jules@novahealth.systems',
            clientContactPhone: '+1-617-555-0145',
            status: 'revision_requested',
            currencyCode: 'USD',
            amount: 5600,
            progressPercent: 78,
            submittedAt: new Date('2024-03-21T12:30:00Z'),
            kickoffDueAt: new Date('2024-03-23T18:00:00Z'),
            dueAt: new Date('2024-04-06T22:00:00Z'),
            metadata: { complianceTier: 'HIPAA' },
            createdAt: new Date('2024-03-21T12:30:00Z'),
            updatedAt: now,
          },
          {
            id: seededIds.gigOrders[4],
            orderNumber: 'GV-2460',
            gigId: seededIds.gigs[5],
            clientId: seededIds.users[8],
            freelancerId: seededIds.users[1],
            clientCompanyName: 'Brightside Finance',
            clientContactName: 'Harper Singh',
            clientContactEmail: 'harper@brightsidefinance.com',
            clientContactPhone: '+1-212-555-0133',
            status: 'ready_for_payout',
            currencyCode: 'USD',
            amount: 3900,
            progressPercent: 100,
            submittedAt: new Date('2024-03-14T11:00:00Z'),
            kickoffDueAt: new Date('2024-03-16T17:30:00Z'),
            dueAt: new Date('2024-03-31T23:59:00Z'),
            completedAt: new Date('2024-03-30T18:20:00Z'),
            metadata: { illustrationStyle: 'neo-brutalism' },
            createdAt: new Date('2024-03-14T11:00:00Z'),
            updatedAt: now,
          },
          {
            id: seededIds.gigOrders[5],
            orderNumber: 'GV-2455',
            gigId: seededIds.gigs[6],
            clientId: seededIds.users[9],
            freelancerId: seededIds.users[1],
            clientCompanyName: 'Evergreen Ventures',
            clientContactName: 'Priya Rao',
            clientContactEmail: 'priya@evergreenventures.vc',
            clientContactPhone: '+1-303-555-0124',
            status: 'completed',
            currencyCode: 'USD',
            amount: 4200,
            progressPercent: 100,
            submittedAt: new Date('2024-03-08T10:05:00Z'),
            kickoffDueAt: new Date('2024-03-10T15:00:00Z'),
            dueAt: new Date('2024-03-25T18:00:00Z'),
            completedAt: new Date('2024-03-27T16:30:00Z'),
            metadata: { workshopMode: 'virtual' },
            createdAt: new Date('2024-03-08T10:05:00Z'),
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'project_blueprint_dependencies',
        [
          {
            id: seededIds.projectBlueprintDependencies[0],
            blueprintId: seededIds.projectBlueprints[0],
            impactedSprintId: seededIds.projectBlueprintSprints[1],
            name: 'Stakeholder interview scheduling',
            description: 'Secure executive availability to inform positioning and tone of voice.',
            dependencyType: 'client',
            owner: 'Mia Operations',
            status: 'in_progress',
            dueDate: nextWeek,
            riskLevel: 'medium',
            impact: 'Delays insight synthesis if interviews slip.',
            notes: 'Marketing ops confirmed 80% availability; legal still pending.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.clientPortalScopeItems[1],
            portalId: seededIds.clientPortals[0],
            title: 'Marketing site redesign sprint',
            description: 'Responsive redesign of the hero, product, and testimonial sections with analytics goals.',
            category: 'Experience design',
            status: 'in_delivery',
            effortHours: 32,
            valueCurrency: 'USD',
            valueAmount: 10400,
            lastDecisionAt: yesterday,
            metadata: {
              sprint: 'Sprint 3',
              lead: 'Leo Freelancer',
            },
            createdAt: yesterday,
            updatedAt: now,
          },
          {
            id: seededIds.clientPortalScopeItems[2],
            portalId: seededIds.clientPortals[0],
            title: 'Weekly growth analytics dashboard',
            description: 'Self-serve dashboards for trials, signups, and retention with automated alerts.',
            category: 'Analytics',
            status: 'committed',
            effortHours: 24,
            valueCurrency: 'USD',
            valueAmount: 8400,
            metadata: {
              dependencies: ['Data engineering availability'],
            },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.clientPortalScopeItems[3],
            portalId: seededIds.clientPortals[0],
            title: 'Localization expansion toolkit',
            description: 'Optional add-on for translations, QA workflows, and regional design assets.',
            category: 'Optional add-ons',
            status: 'proposed',
            effortHours: 16,
            valueCurrency: 'USD',
            valueAmount: 5800,
            metadata: {
              proposalId: 'PROP-4821',
            },
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'client_portal_decision_logs',
        [
          {
            id: seededIds.clientPortalDecisionLogs[0],
            portalId: seededIds.clientPortals[0],
            decidedById: seededIds.users[2],
            summary: 'Scope change approval for analytics dashboards',
            decision:
              'Approved the expanded dashboard scope with additional product metrics contingent on engineering support.',
            decidedAt: yesterday,
            category: 'scope',
            impactSummary: 'Adds 8 hours of analytics implementation and extends timeline by two business days.',
            followUpDate: nextWeek,
            visibility: 'client',
            attachments: [
              {
                label: 'Revised dashboard brief',
                url: 'https://cdn.gigvora.com/dashboards/revised-brief.pdf',
              },
            ],
            createdAt: yesterday,
            updatedAt: yesterday,
          },
          {
            id: seededIds.clientPortalDecisionLogs[1],
            portalId: seededIds.clientPortals[0],
            decidedById: seededIds.users[1],
            summary: 'Design direction sign-off',
            decision:
              'Confirmed direction B for the refreshed visual identity with updated typography and iconography.',
            decidedAt: twoDaysAgo,
            category: 'design',
            impactSummary: 'Unblocks final layout production and signals marketing site production readiness.',
            followUpDate: tenDaysFromNow,
            visibility: 'client',
            attachments: [],
            createdAt: twoDaysAgo,
            updatedAt: twoDaysAgo,
          },
          {
            id: seededIds.clientPortalDecisionLogs[2],
            portalId: seededIds.clientPortals[0],
            decidedById: seededIds.users[1],
            summary: 'Budget reallocation for localization toolkit',
            decision: 'Deferred localization add-on to Q4 and reallocated budget to analytics automation.',
            decidedAt: now,
            category: 'budget',
            impactSummary: 'Keeps retainer within budget ceiling while prioritising instrumentation wins.',
            followUpDate: fifteenDaysFromNow,
            visibility: 'internal',
            attachments: [
              {
                label: 'Budget tracker',
                url: 'https://sheets.gigvora.com/budget-tracker',
              },
            ],
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'client_portal_insight_widgets',
        [
          {
            id: seededIds.clientPortalInsightWidgets[0],
            portalId: seededIds.clientPortals[0],
            widgetType: 'health',
            title: 'Delivery confidence',
            description: 'Composite score factoring milestone velocity, approvals, and stakeholder sentiment.',
            data: { score: 82, trend: 'up', delta: 6 },
            visibility: 'shared',
            orderIndex: 1,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.clientPortalInsightWidgets[1],
            portalId: seededIds.clientPortals[0],
            widgetType: 'finance',
            title: 'Budget utilisation',
            description: 'Tracks retainer burn against approved scope and pending change requests.',
            data: { allocated: 32000, consumed: 21800, currency: 'USD' },
            visibility: 'shared',
            orderIndex: 2,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.clientPortalInsightWidgets[2],
            portalId: seededIds.clientPortals[0],
            widgetType: 'engagement',
            title: 'Stakeholder touchpoints',
            description: 'Shows who has viewed the latest updates and who needs nudges.',
            data: {
              viewed: ['Mia Operations', 'Sasha Patel'],
              pending: ['Finance Controller'],
              lastDigestSentAt: yesterday,
            },
            visibility: 'shared',
            orderIndex: 3,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
            id: seededIds.projectBlueprintDependencies[1],
            blueprintId: seededIds.projectBlueprints[0],
            impactedSprintId: seededIds.projectBlueprintSprints[2],
            name: 'Brand system sign-off',
            description: 'Formal approval on refreshed brand tokens and accessibility palette.',
            dependencyType: 'client',
            owner: 'Ava Founder',
            status: 'pending',
            dueDate: nextWeek,
            riskLevel: 'high',
            impact: 'Blocks high-fidelity design production and QA.',
            notes: 'Escalate to governance council if no response by end of week.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBlueprintDependencies[2],
            blueprintId: seededIds.projectBlueprints[0],
            impactedSprintId: seededIds.projectBlueprintSprints[2],
            name: 'Content inventory & redirects',
            description: 'Audit existing community resources and define redirect matrix.',
            dependencyType: 'internal',
            owner: 'Operations Guild',
            status: 'blocked',
            dueDate: tomorrow,
            riskLevel: 'high',
            impact: 'Blocks migration plan and SEO readiness.',
            notes: 'Awaiting CSV export from legacy CMS partner.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBlueprintDependencies[3],
            blueprintId: seededIds.projectBlueprints[0],
            impactedSprintId: seededIds.projectBlueprintSprints[3],
            name: 'Analytics instrumentation mapping',
            description: 'Confirm event taxonomy and consent model across new community journeys.',
            dependencyType: 'third_party',
            owner: 'Data Partner Collective',
            status: 'pending',
            dueDate: twoWeeksLater,
            riskLevel: 'medium',
            impact: 'Delays KPI dashboard availability if not finalised pre-launch.',
            notes: 'Partner requested schema sample; follow-up scheduled tomorrow.',
            createdAt: twoDaysAgo,
            updatedAt: now,
        'gig_order_requirements',
        [
          {
            id: seededIds.gigOrderRequirements[0],
            orderId: seededIds.gigOrders[0],
            title: 'Product usage analytics export',
            status: 'pending',
            priority: 'high',
            requestedAt: new Date('2024-04-03T14:30:00Z'),
            dueAt: new Date('2024-04-05T16:00:00Z'),
            notes: 'Need baseline engagement metrics before kickoff.',
            items: [
              { label: '12-month dashboard export', status: 'pending' },
              { label: 'Feature adoption cohort breakdown', status: 'pending' },
            ],
            metadata: { requestId: 'REQ-2483-1' },
            createdAt: new Date('2024-04-03T14:30:00Z'),
            updatedAt: new Date('2024-04-03T14:30:00Z'),
          },
          {
            id: seededIds.gigOrderRequirements[1],
            orderId: seededIds.gigOrders[0],
            title: 'Voice & tone guardrails',
            status: 'pending',
            priority: 'high',
            requestedAt: new Date('2024-04-03T14:32:00Z'),
            dueAt: new Date('2024-04-05T16:00:00Z'),
            notes: 'Ensures redesign respects brand language.',
            items: [
              { label: 'Brand book extract', status: 'pending' },
              { label: 'Regulatory phrases list', status: 'pending' },
            ],
            metadata: { requestId: 'REQ-2483-2' },
            createdAt: new Date('2024-04-03T14:32:00Z'),
            updatedAt: new Date('2024-04-03T14:32:00Z'),
          },
          {
            id: seededIds.gigOrderRequirements[2],
            orderId: seededIds.gigOrders[2],
            title: 'Latest growth KPI snapshot',
            status: 'received',
            priority: 'medium',
            requestedAt: new Date('2024-03-26T16:00:00Z'),
            dueAt: new Date('2024-04-04T18:00:00Z'),
            receivedAt: new Date('2024-04-02T09:10:00Z'),
            notes: 'Provides baseline for experimentation backlog.',
            items: [
              { label: 'North star metric trend', status: 'received' },
              { label: 'Cohort retention summary', status: 'received' },
            ],
            metadata: { requestId: 'REQ-2473-1' },
            createdAt: new Date('2024-03-26T16:00:00Z'),
            updatedAt: new Date('2024-04-02T09:10:00Z'),
          },
          {
            id: seededIds.gigOrderRequirements[3],
            orderId: seededIds.gigOrders[2],
            title: 'Customer research repository access',
            status: 'pending',
            priority: 'medium',
            requestedAt: new Date('2024-03-26T16:05:00Z'),
            dueAt: new Date('2024-04-04T18:00:00Z'),
            notes: 'Needed to synthesize qualitative insights for experiments.',
            items: [
              { label: 'User interview transcripts', status: 'pending' },
              { label: 'Usability session recordings', status: 'pending' },
            ],
            metadata: { requestId: 'REQ-2473-2' },
            createdAt: new Date('2024-03-26T16:05:00Z'),
            updatedAt: new Date('2024-03-26T16:05:00Z'),
          },
          {
            id: seededIds.gigOrderRequirements[4],
            orderId: seededIds.gigOrders[1],
            title: 'Brand asset package',
            status: 'received',
            priority: 'medium',
            requestedAt: new Date('2024-03-28T10:00:00Z'),
            dueAt: new Date('2024-03-30T16:00:00Z'),
            receivedAt: new Date('2024-03-29T08:15:00Z'),
            notes: 'Logo lockups and product screenshots for collateral.',
            items: [
              { label: 'Logo kit', status: 'received' },
              { label: 'Product UI capture', status: 'received' },
            ],
            metadata: { requestId: 'REQ-2478-1' },
            createdAt: new Date('2024-03-28T10:00:00Z'),
            updatedAt: new Date('2024-03-29T08:15:00Z'),
          },
          {
            id: seededIds.gigOrderRequirements[5],
            orderId: seededIds.gigOrders[3],
            title: 'Compliance approval notes',
            status: 'received',
            priority: 'high',
            requestedAt: new Date('2024-03-21T13:10:00Z'),
            dueAt: new Date('2024-03-25T20:00:00Z'),
            receivedAt: new Date('2024-03-24T09:45:00Z'),
            notes: 'Legal reviewer comments from Nova compliance.',
            items: [
              { label: 'HIPAA copy checklist', status: 'received' },
              { label: 'Accessibility QA log', status: 'received' },
            ],
            metadata: { requestId: 'REQ-2469-1' },
            createdAt: new Date('2024-03-21T13:10:00Z'),
            updatedAt: new Date('2024-03-24T09:45:00Z'),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'project_blueprint_risks',
        [
          {
            id: seededIds.projectBlueprintRisks[0],
            blueprintId: seededIds.projectBlueprints[0],
            title: 'Scope expansion from marketing stakeholders',
            description: 'Marketing wants additional campaign landing pages within current budget and timeline.',
            probability: 45,
            impact: 70,
            severityScore: 31.5,
            status: 'open',
            owner: 'Mia Operations',
            mitigationPlan: 'Hold change-control workshop and evaluate trade-offs next governance sync.',
            contingencyPlan: 'Apply change order with budget uplift or phase backlog items.',
            nextReviewAt: nextWeek,
            tags: ['scope', 'budget'],
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBlueprintRisks[1],
            blueprintId: seededIds.projectBlueprints[0],
            title: 'Compliance review turnaround',
            description: 'Legal/compliance review requires 5 business days; overlaps with sprint 2 asset approvals.',
            probability: 35,
            impact: 80,
            severityScore: 28,
            status: 'monitoring',
            owner: 'Compliance Pod',
            mitigationPlan: 'Submit assets in rolling batches and pre-book compliance office hours.',
            contingencyPlan: 'Shift go-live by two days with proactive client communication.',
            nextReviewAt: nextWeek,
            tags: ['compliance', 'schedule'],
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBlueprintRisks[2],
            blueprintId: seededIds.projectBlueprints[0],
            title: 'Third-party integration slippage',
            description: 'Community analytics vendor is upgrading APIs, risking launch-day instrumentation.',
            probability: 50,
            impact: 80,
            severityScore: 40,
            status: 'mitigated',
            owner: 'Data Partner Collective',
            mitigationPlan: 'Parallelise fallback tracking plan and lock freeze date with vendor.',
            contingencyPlan: 'Deploy manual reporting for first week post-launch.',
            nextReviewAt: twoWeeksLater,
            tags: ['data', 'launch'],
            createdAt: twoDaysAgo,
            updatedAt: now,
        'gig_order_revisions',
        [
          {
            id: seededIds.gigOrderRevisions[0],
            orderId: seededIds.gigOrders[3],
            roundNumber: 2,
            status: 'in_progress',
            severity: 'high',
            focusAreas: [
              'Update onboarding email copy to satisfy compliance wording.',
              'Increase mobile hero contrast for accessibility checks.',
            ],
            summary: 'Compliance requested copy adjustments and accessibility refinements.',
            requestedAt: new Date('2024-04-03T21:30:00Z'),
            dueAt: new Date('2024-04-06T20:00:00Z'),
            metadata: { reviewer: 'Nova compliance team' },
            createdAt: new Date('2024-04-03T21:30:00Z'),
            updatedAt: new Date('2024-04-03T21:30:00Z'),
          },
          {
            id: seededIds.gigOrderRevisions[1],
            orderId: seededIds.gigOrders[4],
            roundNumber: 1,
            status: 'submitted',
            severity: 'medium',
            focusAreas: ['Adjust card art to include savings badge placement.'],
            summary: 'Refined hero illustration with updated savings badge placement.',
            requestedAt: new Date('2024-04-01T14:10:00Z'),
            dueAt: new Date('2024-04-04T17:30:00Z'),
            submittedAt: new Date('2024-04-02T19:40:00Z'),
            metadata: { reviewer: 'Brightside creative director' },
            createdAt: new Date('2024-04-01T14:10:00Z'),
            updatedAt: new Date('2024-04-02T19:40:00Z'),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'gig_order_payouts',
        [
          {
            id: seededIds.gigOrderPayouts[0],
            orderId: seededIds.gigOrders[4],
            milestoneLabel: 'Final delivery approval',
            amount: 3900,
            currencyCode: 'USD',
            status: 'pending',
            expectedAt: new Date('2024-04-05T16:00:00Z'),
            metadata: { payoutReference: 'PO-9913' },
            createdAt: new Date('2024-03-30T18:20:00Z'),
            updatedAt: new Date('2024-03-30T18:20:00Z'),
          },
          {
            id: seededIds.gigOrderPayouts[1],
            orderId: seededIds.gigOrders[1],
            milestoneLabel: 'Milestone 2 — Collateral package',
            amount: 1600,
            currencyCode: 'USD',
            status: 'pending',
            expectedAt: new Date('2024-04-08T18:00:00Z'),
            metadata: { payoutReference: 'PO-9882' },
            createdAt: new Date('2024-03-29T17:00:00Z'),
            updatedAt: new Date('2024-03-29T17:00:00Z'),
          },
          {
            id: seededIds.gigOrderPayouts[2],
            orderId: seededIds.gigOrders[5],
            milestoneLabel: 'Workshop completion',
            amount: 4200,
            currencyCode: 'USD',
            status: 'released',
            releasedAt: new Date('2024-03-29T12:00:00Z'),
            metadata: { payoutReference: 'PO-9870' },
            createdAt: new Date('2024-03-25T18:00:00Z'),
            updatedAt: new Date('2024-03-29T12:00:00Z'),
          },
          {
            id: seededIds.gigOrderPayouts[3],
            orderId: seededIds.gigOrders[2],
            milestoneLabel: 'Milestone 1 — Strategy outline',
            amount: 1200,
            currencyCode: 'USD',
            status: 'at_risk',
            expectedAt: new Date('2024-04-10T15:00:00Z'),
            riskNote: 'Client requested clarification on experiment cadence.',
            metadata: { payoutReference: 'PO-9844' },
            createdAt: new Date('2024-03-28T12:00:00Z'),
            updatedAt: new Date('2024-04-03T10:00:00Z'),
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'project_billing_checkpoints',
        [
          {
            id: seededIds.projectBillingCheckpoints[0],
            blueprintId: seededIds.projectBlueprints[0],
            relatedSprintId: seededIds.projectBlueprintSprints[0],
            name: 'Kickoff deposit',
            description: 'Initial deposit covering onboarding and discovery readiness.',
            billingType: 'milestone',
            amount: 2500,
            currency: 'USD',
            dueDate: twoDaysAgo,
            status: 'paid',
            approvalRequired: false,
            invoiceUrl: 'https://billing.gigvora.com/invoices/CGI-001',
            notes: 'Paid via ACH reference 9821.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBillingCheckpoints[1],
            blueprintId: seededIds.projectBlueprints[0],
            relatedSprintId: seededIds.projectBlueprintSprints[1],
            name: 'Discovery sign-off invoice',
            description: 'Billable on acceptance of research synthesis and alignment artefacts.',
            billingType: 'milestone',
            amount: 4000,
            currency: 'USD',
            dueDate: nextWeek,
            status: 'invoiced',
            approvalRequired: true,
            invoiceUrl: 'https://billing.gigvora.com/invoices/CGI-002',
            notes: 'Client finance requested PO alignment; due within 10 days.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBillingCheckpoints[2],
            blueprintId: seededIds.projectBlueprints[0],
            relatedSprintId: seededIds.projectBlueprintSprints[2],
            name: 'Build completion milestone',
            description: 'Triggered once high-fidelity assets and QA sign-off are delivered.',
            billingType: 'milestone',
            amount: 6500,
            currency: 'USD',
            dueDate: twoWeeksLater,
            status: 'upcoming',
            approvalRequired: true,
            notes: 'Requires compliance approval snapshot before invoicing.',
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
          {
            id: seededIds.projectBillingCheckpoints[3],
            blueprintId: seededIds.projectBlueprints[0],
            relatedSprintId: seededIds.projectBlueprintSprints[3],
            name: 'Launch & optimisation retainer',
            description: 'Covers launch support, retrospectives, and first-month optimisation.',
            billingType: 'retainer',
            amount: 3000,
            currency: 'USD',
            dueDate: threeWeeksLater,
            status: 'upcoming',
            approvalRequired: true,
            notes: 'Bundle upcoming analytics add-ons for upsell opportunity.',
            createdAt: twoDaysAgo,
            updatedAt: now,
        'gig_order_activities',
        [
          {
            id: seededIds.gigOrderActivities[0],
            orderId: seededIds.gigOrders[0],
            freelancerId: seededIds.users[1],
            actorId: seededIds.users[4],
            activityType: 'order',
            title: 'New order purchased',
            description: 'Kickoff survey sent and analytics export requested from client.',
            occurredAt: new Date('2024-04-03T14:20:00Z'),
            metadata: { orderNumber: 'GV-2483' },
            createdAt: new Date('2024-04-03T14:20:00Z'),
            updatedAt: new Date('2024-04-03T14:20:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[1],
            orderId: seededIds.gigOrders[2],
            freelancerId: seededIds.users[1],
            actorId: seededIds.users[6],
            activityType: 'requirement',
            title: 'Client uploaded KPI dashboard',
            description: 'Orbit Media shared the latest growth metrics for experimentation.',
            occurredAt: new Date('2024-04-02T09:10:00Z'),
            metadata: { requestId: 'REQ-2473-1' },
            createdAt: new Date('2024-04-02T09:10:00Z'),
            updatedAt: new Date('2024-04-02T09:10:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[2],
            orderId: seededIds.gigOrders[3],
            freelancerId: seededIds.users[1],
            actorId: seededIds.users[7],
            activityType: 'revision',
            title: 'Revision round 2 opened',
            description: 'Nova Health requested compliance copy updates.',
            occurredAt: new Date('2024-04-03T21:30:00Z'),
            metadata: { revisionRound: 2 },
            createdAt: new Date('2024-04-03T21:30:00Z'),
            updatedAt: new Date('2024-04-03T21:30:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[3],
            orderId: seededIds.gigOrders[5],
            freelancerId: seededIds.users[1],
            actorId: null,
            activityType: 'payout',
            title: 'Payout released',
            description: 'Evergreen Ventures workshop payout released to wallet.',
            occurredAt: new Date('2024-03-29T12:00:00Z'),
            metadata: { payoutReference: 'PO-9870' },
            createdAt: new Date('2024-03-29T12:00:00Z'),
            updatedAt: new Date('2024-03-29T12:00:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[4],
            orderId: seededIds.gigOrders[1],
            freelancerId: seededIds.users[1],
            actorId: seededIds.users[1],
            activityType: 'communication',
            title: 'Kickoff call notes captured',
            description: 'Documented launch messaging themes and product differentiators.',
            occurredAt: new Date('2024-03-29T17:15:00Z'),
            metadata: { meetingRecordingUrl: 'https://meet.gigvora.test/gv-2478' },
            createdAt: new Date('2024-03-29T17:15:00Z'),
            updatedAt: new Date('2024-03-29T17:15:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[5],
            orderId: seededIds.gigOrders[4],
            freelancerId: seededIds.users[1],
            actorId: seededIds.users[1],
            activityType: 'revision',
            title: 'Submitted illustration revisions',
            description: 'Uploaded revised hero graphics with savings badge placement.',
            occurredAt: new Date('2024-04-02T19:40:00Z'),
            metadata: { revisionRound: 1 },
            createdAt: new Date('2024-04-02T19:40:00Z'),
            updatedAt: new Date('2024-04-02T19:40:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[6],
            orderId: seededIds.gigOrders[1],
            freelancerId: seededIds.users[1],
            actorId: null,
            activityType: 'order',
            title: 'Milestone 2 scheduled',
            description: 'Collateral delivery milestone scheduled with Atlas Labs marketing.',
            occurredAt: new Date('2024-04-01T11:00:00Z'),
            metadata: { milestone: 'Milestone 2 — Collateral package' },
            createdAt: new Date('2024-04-01T11:00:00Z'),
            updatedAt: new Date('2024-04-01T11:00:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[7],
            orderId: seededIds.gigOrders[2],
            freelancerId: seededIds.users[1],
            actorId: seededIds.users[6],
            activityType: 'communication',
            title: 'Experiment cadence clarification requested',
            description: 'Orbit Media asked for weekly summary template before approving milestone payout.',
            occurredAt: new Date('2024-04-04T13:05:00Z'),
            metadata: { payoutReference: 'PO-9844' },
            createdAt: new Date('2024-04-04T13:05:00Z'),
            updatedAt: new Date('2024-04-04T13:05:00Z'),
          },
          {
            id: seededIds.gigOrderActivities[8],
            orderId: seededIds.gigOrders[3],
            freelancerId: seededIds.users[1],
            actorId: seededIds.users[7],
            activityType: 'communication',
            title: 'Compliance comments logged',
            description: 'Nova legal added inline comments to onboarding flow prototype.',
            occurredAt: new Date('2024-04-04T22:15:00Z'),
            metadata: { threadUrl: 'https://workspace.gigvora.test/gv-2469/comments' },
            createdAt: new Date('2024-04-04T22:15:00Z'),
            updatedAt: new Date('2024-04-04T22:15:00Z'),
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

      await queryInterface.bulkInsert(
        'freelancer_finance_metrics',
        [
          {
            id: seededIds.freelancerFinanceMetrics[0],
            freelancerId: financeFreelancerId,
            metricKey: 'month_to_date_revenue',
            label: 'Month-to-date revenue',
            value: 18400,
            valueUnit: 'currency',
            currencyCode: 'USD',
            changeValue: 12.4,
            changeUnit: 'percentage',
            trend: 'up',
            caption: 'Projected to close $24.9k by month end across retainers and sprints.',
            effectiveAt: now,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerFinanceMetrics[1],
            freelancerId: financeFreelancerId,
            metricKey: 'cash_available_for_payout',
            label: 'Cash available for payout',
            value: 9700,
            valueUnit: 'currency',
            currencyCode: 'USD',
            changeValue: 1200,
            changeUnit: 'currency',
            trend: 'neutral',
            caption: 'Includes approved releases scheduled over the next 48 hours.',
            effectiveAt: now,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerFinanceMetrics[2],
            freelancerId: financeFreelancerId,
            metricKey: 'outstanding_invoices',
            label: 'Outstanding invoices',
            value: 3100,
            valueUnit: 'currency',
            currencyCode: 'USD',
            changeValue: -6.1,
            changeUnit: 'percentage',
            trend: 'down',
            caption: 'Two invoices awaiting client approvals; auto-reminders enabled.',
            effectiveAt: now,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerFinanceMetrics[3],
            freelancerId: financeFreelancerId,
            metricKey: 'net_margin',
            label: 'Net margin',
            value: 41,
            valueUnit: 'percentage',
            changeValue: 3.4,
            changeUnit: 'percentage_points',
            trend: 'up',
            caption: 'After accounting for subcontractors, software, and taxes-to-date.',
            effectiveAt: now,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_revenue_monthlies',
        [
          {
            id: seededIds.freelancerRevenueMonthlies[0],
            freelancerId: financeFreelancerId,
            month: monthStartIso(4),
            bookedAmount: 15800,
            realizedAmount: 14200,
            currencyCode: 'USD',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerRevenueMonthlies[1],
            freelancerId: financeFreelancerId,
            month: monthStartIso(3),
            bookedAmount: 17650,
            realizedAmount: 16200,
            currencyCode: 'USD',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerRevenueMonthlies[2],
            freelancerId: financeFreelancerId,
            month: monthStartIso(2),
            bookedAmount: 18900,
            realizedAmount: 17400,
            currencyCode: 'USD',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerRevenueMonthlies[3],
            freelancerId: financeFreelancerId,
            month: monthStartIso(1),
            bookedAmount: 17100,
            realizedAmount: 16850,
            currencyCode: 'USD',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerRevenueMonthlies[4],
            freelancerId: financeFreelancerId,
            month: monthStartIso(0),
            bookedAmount: 20150,
            realizedAmount: 18420,
            currencyCode: 'USD',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_revenue_streams',
        [
          {
            id: seededIds.freelancerRevenueStreams[0],
            freelancerId: financeFreelancerId,
            name: 'Brand identity retainers',
            sharePercent: 38,
            monthlyRecurringRevenue: 7200,
            currencyCode: 'USD',
            yoyChangePercent: 18,
            notes: '3 active retainers with quarterly renewals locked.',
            metadata: { renewalCadence: 'quarterly' },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerRevenueStreams[1],
            freelancerId: financeFreelancerId,
            name: 'Product design sprints',
            sharePercent: 27,
            monthlyRecurringRevenue: 5100,
            currencyCode: 'USD',
            yoyChangePercent: 9,
            notes: 'Average delivery time 15 days · CSAT 4.95/5.',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerRevenueStreams[2],
            freelancerId: financeFreelancerId,
            name: 'UX audits & playbooks',
            sharePercent: 22,
            monthlyRecurringRevenue: 3900,
            currencyCode: 'USD',
            yoyChangePercent: 14,
            notes: 'Bundled with CRO workshops for upsell opportunities.',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerRevenueStreams[3],
            freelancerId: financeFreelancerId,
            name: 'Community workshops',
            sharePercent: 13,
            monthlyRecurringRevenue: 2450,
            currencyCode: 'USD',
            yoyChangePercent: 4,
            notes: 'Live cohorts plus digital asset sales.',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_payouts',
        [
          {
            id: seededIds.freelancerPayouts[0],
            freelancerId: financeFreelancerId,
            payoutDate: '2024-03-14',
            clientName: 'Aster Ventures',
            gigTitle: 'Product design sprint',
            amount: 2800,
            currencyCode: 'USD',
            status: 'released',
            reference: 'PO-20240314-AV',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerPayouts[1],
            freelancerId: financeFreelancerId,
            payoutDate: '2024-03-12',
            clientName: 'Northwind Labs',
            gigTitle: 'Brand identity retainer',
            amount: 3600,
            currencyCode: 'USD',
            status: 'scheduled',
            reference: 'INV-20240301-NL',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerPayouts[2],
            freelancerId: financeFreelancerId,
            payoutDate: '2024-03-08',
            clientName: 'Orbit Health',
            gigTitle: 'UX audit & playbook',
            amount: 1450,
            currencyCode: 'USD',
            status: 'released',
            reference: 'PO-20240305-OH',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerPayouts[3],
            freelancerId: financeFreelancerId,
            payoutDate: '2024-03-03',
            clientName: 'Lumen Devices',
            gigTitle: 'Product design sprint',
            amount: 2250,
            currencyCode: 'USD',
            status: 'in_escrow',
            reference: 'ESCROW-20240303-LD',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerPayouts[4],
            freelancerId: financeFreelancerId,
            payoutDate: '2024-02-27',
            clientName: 'Skyreach Media',
            gigTitle: 'Community workshop bundle',
            amount: 1120,
            currencyCode: 'USD',
            status: 'released',
            reference: 'PO-20240227-SM',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_tax_estimates',
        [
          {
            id: seededIds.freelancerTaxEstimates[0],
            freelancerId: financeFreelancerId,
            dueDate: '2024-04-15',
            amount: 4860,
            currencyCode: 'USD',
            status: 'on_track',
            notes: 'Quarterly estimate auto-calculated from year-to-date profitability.',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_tax_filings',
        [
          {
            id: seededIds.freelancerTaxFilings[0],
            freelancerId: financeFreelancerId,
            name: '1099 contractor summary',
            jurisdiction: 'US Federal',
            dueDate: '2024-03-20',
            status: 'submitted',
            submittedAt: twoDaysAgo,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerTaxFilings[1],
            freelancerId: financeFreelancerId,
            name: 'Sales tax (NY)',
            jurisdiction: 'New York',
            dueDate: '2024-03-30',
            status: 'in_progress',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerTaxFilings[2],
            freelancerId: financeFreelancerId,
            name: 'VAT reverse charge (EU)',
            jurisdiction: 'EU',
            dueDate: '2024-04-05',
            status: 'not_started',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_deduction_summaries',
        [
          {
            id: seededIds.freelancerDeductionSummaries[0],
            freelancerId: financeFreelancerId,
            taxYear: now.getUTCFullYear(),
            amount: 12430,
            currencyCode: 'USD',
            changePercentage: -8.2,
            notes: 'Software subscriptions reconciled weekly.',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_profitability_metrics',
        [
          {
            id: seededIds.freelancerProfitabilityMetrics[0],
            freelancerId: financeFreelancerId,
            metricKey: 'gross_margin',
            label: 'Gross margin',
            value: 68,
            valueUnit: 'percentage',
            changeValue: 2.1,
            changeUnit: 'percentage_points',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerProfitabilityMetrics[1],
            freelancerId: financeFreelancerId,
            metricKey: 'average_order_value',
            label: 'Average order value',
            value: 1920,
            valueUnit: 'currency',
            currencyCode: 'USD',
            changeValue: 11.3,
            changeUnit: 'percentage',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerProfitabilityMetrics[2],
            freelancerId: financeFreelancerId,
            metricKey: 'billable_utilization',
            label: 'Billable utilization',
            value: 82,
            valueUnit: 'percentage',
            changeValue: 5.4,
            changeUnit: 'percentage_points',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_cost_breakdowns',
        [
          {
            id: seededIds.freelancerCostBreakdowns[0],
            freelancerId: financeFreelancerId,
            label: 'Labor costs',
            percentage: 38,
            caption: 'Subcontractors & collaborators',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerCostBreakdowns[1],
            freelancerId: financeFreelancerId,
            label: 'Software & tooling',
            percentage: 14,
            caption: 'Design, automation, hosting',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerCostBreakdowns[2],
            freelancerId: financeFreelancerId,
            label: 'Operations',
            percentage: 7,
            caption: 'Compliance, accounting, legal',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerCostBreakdowns[3],
            freelancerId: financeFreelancerId,
            label: 'Savings & benefits',
            percentage: 6,
            caption: 'Health, downtime reserve',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_savings_goals',
        [
          {
            id: seededIds.freelancerSavingsGoals[0],
            freelancerId: financeFreelancerId,
            name: 'Benefits reserve',
            targetAmount: 12000,
            currencyCode: 'USD',
            progress: 0.58,
            cadence: 'Automatic transfers every Friday',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerSavingsGoals[1],
            freelancerId: financeFreelancerId,
            name: 'Equipment refresh',
            targetAmount: 4500,
            currencyCode: 'USD',
            progress: 0.32,
            cadence: 'Funded by 5% skim on sprint payouts',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
        'freelancer_finance_controls',
        [
          {
            id: seededIds.freelancerFinanceControls[0],
            freelancerId: financeFreelancerId,
            name: 'Finance control tower',
            description: 'Revenue breakdowns, tax-ready exports, expense tracking, and smart savings goals for benefits or downtime.',
            bullets: [
              'Split payouts between teammates or subcontractors instantly.',
              'Predictive forecasts for retainers vs. one-off gigs.',
            ],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerFinanceControls[1],
            freelancerId: financeFreelancerId,
            name: 'Contract & compliance locker',
            description: 'Store MSAs, NDAs, intellectual property agreements, and compliance attestations with e-sign audit logs.',
            bullets: [
              'Automated reminders for renewals and insurance certificates.',
              'Localization for GDPR, SOC2, and freelancer classifications.',
            ],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerFinanceControls[2],
            freelancerId: financeFreelancerId,
            name: 'Reputation engine',
            description: 'Capture testimonials, publish success stories, and display verified metrics such as on-time delivery and CSAT.',
            bullets: [
              'Custom badges and banners for featured freelancer programs.',
              'Shareable review widgets for external websites.',
            ],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.freelancerFinanceControls[3],
            freelancerId: financeFreelancerId,
            name: 'Support & dispute desk',
            description: 'Resolve client concerns, manage escalations, and collaborate with Gigvora support for smooth resolutions.',
            bullets: [
              'Conversation transcripts linked back to gig orders.',
              'Resolution playbooks to keep satisfaction high.',
            ],
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
        'freelancer_finance_controls',
        { id: { [Op.in]: seededIds.freelancerFinanceControls } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_savings_goals',
        { id: { [Op.in]: seededIds.freelancerSavingsGoals } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_cost_breakdowns',
        { id: { [Op.in]: seededIds.freelancerCostBreakdowns } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_profitability_metrics',
        { id: { [Op.in]: seededIds.freelancerProfitabilityMetrics } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_deduction_summaries',
        { id: { [Op.in]: seededIds.freelancerDeductionSummaries } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_tax_filings',
        { id: { [Op.in]: seededIds.freelancerTaxFilings } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_tax_estimates',
        { id: { [Op.in]: seededIds.freelancerTaxEstimates } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_payouts',
        { id: { [Op.in]: seededIds.freelancerPayouts } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_revenue_streams',
        { id: { [Op.in]: seededIds.freelancerRevenueStreams } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_revenue_monthlies',
        { id: { [Op.in]: seededIds.freelancerRevenueMonthlies } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'freelancer_finance_metrics',
        { id: { [Op.in]: seededIds.freelancerFinanceMetrics } },
        { transaction }
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
      await queryInterface.bulkDelete(
        'gig_performance_snapshots',
        { gigId: { [Op.in]: seededIds.gigs } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'gig_preview_layouts',
        { gigId: { [Op.in]: seededIds.gigs } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'gig_call_to_actions',
        { gigId: { [Op.in]: seededIds.gigs } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'gig_media_assets',
        { gigId: { [Op.in]: seededIds.gigs } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'gig_addons',
        { gigId: { [Op.in]: seededIds.gigs } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'gig_packages',
        { gigId: { [Op.in]: seededIds.gigs } },
        { transaction },
        'client_portal_insight_widgets',
        { id: { [Op.in]: seededIds.clientPortalInsightWidgets } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'client_portal_decision_logs',
        { id: { [Op.in]: seededIds.clientPortalDecisionLogs } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'client_portal_scope_items',
        { id: { [Op.in]: seededIds.clientPortalScopeItems } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'client_portal_timeline_events',
        { id: { [Op.in]: seededIds.clientPortalTimelineEvents } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'client_portals',
        { id: { [Op.in]: seededIds.clientPortals } },
        { transaction },
        'project_billing_checkpoints',
        { id: { [Op.in]: seededIds.projectBillingCheckpoints } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'project_blueprint_risks',
        { id: { [Op.in]: seededIds.projectBlueprintRisks } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'project_blueprint_dependencies',
        { id: { [Op.in]: seededIds.projectBlueprintDependencies } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'project_blueprint_sprints',
        { id: { [Op.in]: seededIds.projectBlueprintSprints } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'project_blueprints',
        { id: { [Op.in]: seededIds.projectBlueprints } },
        'gig_order_activities',
        { id: { [Op.in]: seededIds.gigOrderActivities } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_order_payouts',
        { id: { [Op.in]: seededIds.gigOrderPayouts } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_order_revisions',
        { id: { [Op.in]: seededIds.gigOrderRevisions } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_order_requirements',
        { id: { [Op.in]: seededIds.gigOrderRequirements } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_orders',
        { id: { [Op.in]: seededIds.gigOrders } },
        'gig_catalog_items',
        { id: { [Op.in]: seededIds.gigCatalogItems } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_upsells',
        { id: { [Op.in]: seededIds.gigUpsells } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_bundle_items',
        { id: { [Op.in]: seededIds.gigBundleItems } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_bundles',
        { id: { [Op.in]: seededIds.gigBundles } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'gig_milestones',
        { id: { [Op.in]: seededIds.gigMilestones } },
        { transaction }
      );
      await queryInterface.bulkDelete('projects', { id: { [Op.in]: seededIds.projects } }, { transaction });
      await queryInterface.bulkDelete('gigs', { id: { [Op.in]: seededIds.gigs } }, { transaction });
      await queryInterface.bulkDelete('jobs', { id: { [Op.in]: seededIds.jobs } }, { transaction });
      await queryInterface.bulkDelete(
        'reputation_review_widgets',
        { id: { [Op.in]: seededIds.reputationReviewWidgets } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_badges',
        { id: { [Op.in]: seededIds.reputationBadges } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_metrics',
        { id: { [Op.in]: seededIds.reputationMetrics } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_success_stories',
        { id: { [Op.in]: seededIds.reputationSuccessStories } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'reputation_testimonials',
        { id: { [Op.in]: seededIds.reputationTestimonials } },
        { transaction },
      );
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
        'community_spotlight_newsletter_features',
        { id: { [Op.in]: seededIds.communitySpotlightNewsletterFeatures } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'community_spotlight_assets',
        { id: { [Op.in]: seededIds.communitySpotlightAssets } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'community_spotlight_highlights',
        { id: { [Op.in]: seededIds.communitySpotlightHighlights } },
        { transaction }
      );
      await queryInterface.bulkDelete(
        'community_spotlights',
        { id: { [Op.in]: seededIds.communitySpotlights } },
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
