'use strict';

const crypto = require('crypto');
const { Op } = require('sequelize');

const seedTag = 'version_1_50_seed';

const seededIds = {
  users: [1, 2, 3, 4],
  profiles: [1, 2],
  companyProfiles: [1],
  agencyProfiles: [1],
  freelancerProfiles: [1],
  feedPosts: [1, 2],
  jobs: [1, 2],
  gigs: [1],
  projects: [1],
  experienceLaunchpads: [1],
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
            createdAt: threeDaysAgo,
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
      await queryInterface.bulkDelete('profiles', { id: { [Op.in]: seededIds.profiles } }, { transaction });
      await queryInterface.bulkDelete('users', { id: { [Op.in]: seededIds.users } }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
