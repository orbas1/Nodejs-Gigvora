'use strict';

const seededIds = {
  serviceLines: [1, 2, 3],
  courses: [1, 2, 3, 4],
  modules: [1, 2, 3, 4, 5, 6, 7],
  enrollments: [1, 2],
  mentoringSessions: [1, 2],
  diagnostics: [1, 2],
  certifications: [1, 2],
  recommendations: [1, 2, 3],
};

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await queryInterface.bulkInsert(
        'service_lines',
        [
          {
            id: seededIds.serviceLines[0],
            name: 'Brand Experience Design',
            slug: 'brand-experience-design',
            description: 'End-to-end design systems, campaign creative, and multi-channel brand activations.',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.serviceLines[1],
            name: 'Revenue Operations Automation',
            slug: 'revenue-operations-automation',
            description: 'Workflow engineering for CRM, marketing automation, and GTM analytics.',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.serviceLines[2],
            name: 'AI Product Strategy',
            slug: 'ai-product-strategy',
            description: 'Product discovery, responsible AI playbooks, and monetisation frameworks.',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'learning_courses',
        [
          {
            id: seededIds.courses[0],
            serviceLineId: seededIds.serviceLines[0],
            title: 'Designing Conversion-Ready Brand Systems',
            summary: 'Blueprint modular brand systems and creative ops workflows tailored for agile client squads.',
            difficulty: 'advanced',
            format: 'cohort + async labs',
            durationHours: 16,
            tags: ['storytelling', 'design-ops', 'brand-strategy'],
            metadata: { cohortSize: 25, includesMentor: true },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.courses[1],
            serviceLineId: seededIds.serviceLines[0],
            title: 'Motion Systems for Multi-Platform Campaigns',
            summary: 'Build reusable motion templates, sonic identities, and interactive launch kits.',
            difficulty: 'intermediate',
            format: 'self-paced',
            durationHours: 8,
            tags: ['after-effects', 'web', 'campaigns'],
            metadata: { includesTemplates: true },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.courses[2],
            serviceLineId: seededIds.serviceLines[1],
            title: 'Lifecycle Automation Architecture',
            summary: 'Architect RevOps journeys across HubSpot, Salesforce, and customer data platforms.',
            difficulty: 'advanced',
            format: 'mentor-led',
            durationHours: 12,
            tags: ['crm', 'scoring', 'playbooks'],
            metadata: { includesBlueprints: true },
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.courses[3],
            serviceLineId: seededIds.serviceLines[2],
            title: 'Responsible AI Discovery Sprints',
            summary: 'Facilitate AI readiness workshops, build ROI canvases, and map ethical guardrails.',
            difficulty: 'expert',
            format: 'live intensive',
            durationHours: 10,
            tags: ['ai', 'ethics', 'product-discovery'],
            metadata: { includesTemplates: true },
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'learning_course_modules',
        [
          {
            id: seededIds.modules[0],
            courseId: seededIds.courses[0],
            title: 'Voice of customer synthesis',
            moduleType: 'workshop',
            durationMinutes: 75,
            sequence: 1,
            resources: [{ type: 'worksheet', name: 'Interview Debrief Matrix' }],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.modules[1],
            courseId: seededIds.courses[0],
            title: 'Design tokens and theme libraries',
            moduleType: 'lab',
            durationMinutes: 110,
            sequence: 2,
            resources: [{ type: 'figma', name: 'Starter Tokens Library' }],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.modules[2],
            courseId: seededIds.courses[1],
            title: 'Motion narrative structures',
            moduleType: 'studio',
            durationMinutes: 90,
            sequence: 1,
            resources: [{ type: 'video', name: 'Storyboarding Sprint' }],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.modules[3],
            courseId: seededIds.courses[2],
            title: 'Revenue architecture mapping',
            moduleType: 'canvas',
            durationMinutes: 95,
            sequence: 1,
            resources: [{ type: 'template', name: 'Lifecycle Blueprint' }],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.modules[4],
            courseId: seededIds.courses[2],
            title: 'Scoring model calibration',
            moduleType: 'lab',
            durationMinutes: 80,
            sequence: 2,
            resources: [{ type: 'sheet', name: 'Lead Scoring Simulator' }],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.modules[5],
            courseId: seededIds.courses[3],
            title: 'AI opportunity framing',
            moduleType: 'workshop',
            durationMinutes: 70,
            sequence: 1,
            resources: [{ type: 'notion', name: 'AI Canvas' }],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.modules[6],
            courseId: seededIds.courses[3],
            title: 'Risk and compliance playbook',
            moduleType: 'playbook',
            durationMinutes: 65,
            sequence: 2,
            resources: [{ type: 'doc', name: 'Responsible AI Checklist' }],
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'learning_course_enrollments',
        [
          {
            id: seededIds.enrollments[0],
            userId: 2,
            courseId: seededIds.courses[0],
            status: 'in_progress',
            progress: 45,
            lastAccessedAt: now,
            startedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.enrollments[1],
            userId: 2,
            courseId: seededIds.courses[2],
            status: 'completed',
            progress: 100,
            lastAccessedAt: yesterday,
            startedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
            completedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'peer_mentoring_sessions',
        [
          {
            id: seededIds.mentoringSessions[0],
            serviceLineId: seededIds.serviceLines[0],
            mentorId: 1,
            menteeId: 2,
            topic: 'Campaign QA and Creative Ops',
            agenda: 'Review sprint rituals, asset QA workflows, and automation triggers.',
            scheduledAt: twoWeeksFromNow,
            durationMinutes: 60,
            status: 'scheduled',
            meetingUrl: 'https://meet.gigvora.com/brand-ops',
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.mentoringSessions[1],
            serviceLineId: seededIds.serviceLines[1],
            mentorId: 3,
            menteeId: 2,
            topic: 'Attribution dashboards for RevOps',
            agenda: 'Walk through multi-touch attribution and executive scorecards.',
            scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            durationMinutes: 55,
            status: 'completed',
            recordingUrl: 'https://library.gigvora.com/sessions/revops-attribution',
            notes: 'Delivered new retention dashboard template.',
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'skill_gap_diagnostics',
        [
          {
            id: seededIds.diagnostics[0],
            userId: 2,
            serviceLineId: seededIds.serviceLines[0],
            summary: 'Strength in systems thinking; needs deeper analytics instrumentation for design performance.',
            strengths: ['Narrative mapping', 'Executive facilitation'],
            gaps: ['Creative ops telemetry', 'Campaign ROI benchmarking'],
            recommendedActions: ['Complete lifecycle analytics practicum', 'Shadow RevOps engagement for Q4 launches'],
            completedAt: yesterday,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.diagnostics[1],
            userId: 2,
            serviceLineId: seededIds.serviceLines[2],
            summary: 'High proficiency with discovery sprints; opportunity to deepen governance frameworks.',
            strengths: ['AI discovery facilitation', 'Outcome modelling'],
            gaps: ['Governance policy libraries'],
            recommendedActions: ['Draft policy starter kit', 'Join responsible AI roundtable'],
            completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'freelancer_certifications',
        [
          {
            id: seededIds.certifications[0],
            userId: 2,
            serviceLineId: seededIds.serviceLines[1],
            name: 'HubSpot Solutions Partner',
            issuingOrganization: 'HubSpot Academy',
            credentialId: 'HSP-88421',
            credentialUrl: 'https://credentials.hubspot.com/hsp-88421',
            issueDate: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()),
            expirationDate: thirtyDaysFromNow,
            status: 'expiring_soon',
            reminderSentAt: null,
            attachments: [{ name: 'Partner Badge', url: 'https://cdn.gigvora.com/badges/hsp.png' }],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.certifications[1],
            userId: 2,
            serviceLineId: seededIds.serviceLines[2],
            name: 'Responsible AI Practitioner',
            issuingOrganization: 'Open Ethics Alliance',
            credentialId: 'RAI-2045',
            credentialUrl: 'https://openethics.example.com/credentials/rai-2045',
            issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
            expirationDate: sixtyDaysFromNow,
            status: 'active',
            reminderSentAt: null,
            attachments: [{ name: 'Certificate PDF', url: 'https://cdn.gigvora.com/certifications/rai.pdf' }],
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'ai_service_recommendations',
        [
          {
            id: seededIds.recommendations[0],
            userId: 2,
            serviceLineId: seededIds.serviceLines[0],
            title: 'Offer creative ops telemetry add-on',
            description: 'Bundle campaign analytics dashboards with your brand system engagements to capture recurring revenue.',
            confidenceScore: 82.5,
            sourceSignals: { marketplaceDemand: 'high', competitorListings: 14 },
            generatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.recommendations[1],
            userId: 2,
            serviceLineId: seededIds.serviceLines[1],
            title: 'Launch RevOps audit sprint',
            description: 'Promote a 10-day RevOps audit for seed to Series B SaaS founders with fast turnaround insights.',
            confidenceScore: 76.2,
            sourceSignals: { avgTicket: 5200, buyerPersona: 'Seed-SaaS' },
            generatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: seededIds.recommendations[2],
            userId: 2,
            serviceLineId: seededIds.serviceLines[2],
            title: 'Productise responsible AI readiness workshop',
            description: 'Convert your discovery sprint collateral into a fixed-fee readiness workshop with compliance templates.',
            confidenceScore: 88.4,
            sourceSignals: { regulations: ['EU AI Act'], betaWaitlist: 37 },
            generatedAt: now,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
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
      await queryInterface.bulkDelete('ai_service_recommendations', { id: seededIds.recommendations }, { transaction });
      await queryInterface.bulkDelete('freelancer_certifications', { id: seededIds.certifications }, { transaction });
      await queryInterface.bulkDelete('skill_gap_diagnostics', { id: seededIds.diagnostics }, { transaction });
      await queryInterface.bulkDelete('peer_mentoring_sessions', { id: seededIds.mentoringSessions }, { transaction });
      await queryInterface.bulkDelete('learning_course_enrollments', { id: seededIds.enrollments }, { transaction });
      await queryInterface.bulkDelete('learning_course_modules', { id: seededIds.modules }, { transaction });
      await queryInterface.bulkDelete('learning_courses', { id: seededIds.courses }, { transaction });
      await queryInterface.bulkDelete('service_lines', { id: seededIds.serviceLines }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
