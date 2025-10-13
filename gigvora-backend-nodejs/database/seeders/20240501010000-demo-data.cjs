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
  gigs: [1, 2, 3, 4, 5, 6, 7],
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
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
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
            budget: '$4,500',
            duration: '5 weeks',
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
