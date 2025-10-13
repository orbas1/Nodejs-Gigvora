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
  gigPackages: [1, 2, 3],
  gigAddons: [1, 2, 3],
  gigMediaAssets: [1, 2, 3],
  gigCallToActions: [1, 2, 3],
  gigPreviewLayouts: [1, 2, 3],
  gigPerformanceSnapshots: [1],
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
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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
            ownerId: seededIds.users[1],
            slug: 'conversion-focused-brand-sprint',
            title: 'Landing Page Revamp',
            description: 'Refresh marketing site with conversion experiments and WCAG 2.1 AA compliance.',
            budget: '$4500',
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
            createdAt: twoDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction }
      );

      await queryInterface.bulkInsert(
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
