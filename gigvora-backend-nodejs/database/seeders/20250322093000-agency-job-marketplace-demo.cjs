'use strict';

const { QueryTypes } = require('sequelize');

const SEED_TAG = 'agency-job-marketplace-demo-v1';
const DEFAULT_ACTOR_ID = 7001;

const JOB_SEEDS = [
  {
    workspace_id: 'alliance-studio-hq',
    slug: 'director-of-product-strategy',
    title: 'Director of Product Strategy',
    client_name: 'Nimbus Labs',
    location: 'Remote — North America',
    employment_type: 'full_time',
    seniority: 'director',
    remote_available: true,
    compensation_min: 145000,
    compensation_max: 195000,
    compensation_currency: 'USD',
    status: 'open',
    summary: 'Guide executive roadmaps while shaping AI-powered collaboration suites for enterprise clients.',
    responsibilities:
      'Own portfolio vision, orchestrate cross-discipline squads, and translate market signals into launch-ready initiatives.',
    requirements:
      '10+ years in product leadership, experience with B2B SaaS, proficiency with analytics storytelling, and executive stakeholder management.',
    benefits:
      'Executive coaching budget, founder equity participation, hybrid travel program, and comprehensive health coverage.',
    tags: ['product strategy', 'ai collaboration', 'executive leadership'],
    hiring_manager_name: 'Elena Soto',
    hiring_manager_email: 'elena.soto@nimbuslabs.com',
    created_by: DEFAULT_ACTOR_ID,
    updated_by: DEFAULT_ACTOR_ID,
    published_at: new Date('2025-03-01T14:00:00Z'),
    closes_at: new Date('2025-04-15T23:59:59Z'),
    metadata: {
      seedTag: SEED_TAG,
      metrics: {
        applicationCount: 2,
        favoriteCount: 1,
        lastInteractionAt: '2025-03-13T19:00:00.000Z',
      },
    },
    created_at: new Date('2025-03-01T14:00:00Z'),
    updated_at: new Date('2025-03-13T19:00:00Z'),
  },
  {
    workspace_id: 'alliance-studio-hq',
    slug: 'senior-growth-analytics-lead',
    title: 'Senior Growth Analytics Lead',
    client_name: 'Helios Ventures',
    location: 'Austin, USA (Hybrid)',
    employment_type: 'full_time',
    seniority: 'senior',
    remote_available: true,
    compensation_min: 118000,
    compensation_max: 152000,
    compensation_currency: 'USD',
    status: 'paused',
    summary:
      'Architect experiment design, marketing attribution, and LTV modelling to accelerate venture-backed portfolio growth.',
    responsibilities:
      'Partner with marketing, rev-ops, and product to surface insights, spin up dashboards, and brief executives on pipeline health.',
    requirements:
      'Expert SQL, experience across dbt/Looker, proven record scaling B2B funnels, and stakeholder storytelling credentials.',
    benefits: 'Annual learning stipend, founder mentorship pods, remote-first collaboration toolset.',
    tags: ['growth', 'analytics', 'experimentation'],
    hiring_manager_name: 'Marcus Green',
    hiring_manager_email: 'marcus.green@heliosventures.com',
    created_by: DEFAULT_ACTOR_ID,
    updated_by: DEFAULT_ACTOR_ID,
    published_at: new Date('2025-02-20T16:30:00Z'),
    closes_at: new Date('2025-04-30T23:59:59Z'),
    metadata: {
      seedTag: SEED_TAG,
      metrics: {
        applicationCount: 1,
        favoriteCount: 0,
        lastInteractionAt: '2025-03-11T13:20:00.000Z',
      },
    },
    created_at: new Date('2025-02-15T12:00:00Z'),
    updated_at: new Date('2025-03-11T13:20:00Z'),
  },
  {
    workspace_id: 'aurora-talent-cloud',
    slug: 'marketing-automation-specialist',
    title: 'Marketing Automation Specialist',
    client_name: 'Luna Collective',
    location: 'Toronto, Canada (Hybrid)',
    employment_type: 'contract',
    seniority: 'mid',
    remote_available: true,
    compensation_min: 78000,
    compensation_max: 96000,
    compensation_currency: 'CAD',
    status: 'open',
    summary: 'Launch multi-channel nurture programs and conversion experiments for a global community platform.',
    responsibilities:
      'Build lifecycle journeys, run deliverability reviews, and collaborate with design on immersive campaign content.',
    requirements:
      '5+ years in marketing ops, Marketo or HubSpot mastery, strong copy collaboration skills, and data privacy familiarity.',
    benefits: 'Remote toolkit, four-day summer workweeks, and personal growth stipend.',
    tags: ['marketing ops', 'automation', 'campaigns'],
    hiring_manager_name: 'Saanvi Patel',
    hiring_manager_email: 'saanvi.patel@lunacollective.ca',
    created_by: DEFAULT_ACTOR_ID,
    updated_by: DEFAULT_ACTOR_ID,
    published_at: new Date('2025-03-05T09:00:00Z'),
    closes_at: new Date('2025-05-10T23:59:59Z'),
    metadata: {
      seedTag: SEED_TAG,
      metrics: {
        applicationCount: 0,
        favoriteCount: 0,
        lastInteractionAt: null,
      },
    },
    created_at: new Date('2025-03-05T09:00:00Z'),
    updated_at: new Date('2025-03-05T09:00:00Z'),
  },
];

const APPLICATION_SEEDS = [
  {
    workspace_id: 'alliance-studio-hq',
    job_slug: 'director-of-product-strategy',
    candidate_name: 'Amelia Chen',
    candidate_email: 'amelia.chen@candidatehub.dev',
    candidate_phone: '+1-415-555-2212',
    source: 'referral',
    resume_url: 'https://cdn.gigvora.test/resumes/amelia-chen.pdf',
    portfolio_url: 'https://dribbble.com/amelia',
    status: 'screening',
    stage: 'panel prep',
    rating: 4.6,
    owner_id: 7201,
    applied_at: new Date('2025-03-10T15:00:00Z'),
    tags: ['executive'],
    notes: 'Referred by former client partner; requests async interview flow.',
    created_by: DEFAULT_ACTOR_ID,
    updated_by: DEFAULT_ACTOR_ID,
    metadata: { seedTag: SEED_TAG, timezone: 'America/Los_Angeles' },
    created_at: new Date('2025-03-10T15:00:00Z'),
    updated_at: new Date('2025-03-12T10:30:00Z'),
  },
  {
    workspace_id: 'alliance-studio-hq',
    job_slug: 'director-of-product-strategy',
    candidate_name: 'Jonah Ibrahim',
    candidate_email: 'jonah.ibrahim@candidatehub.dev',
    candidate_phone: '+1-646-555-4420',
    source: 'linkedin',
    resume_url: 'https://cdn.gigvora.test/resumes/jonah-ibrahim.pdf',
    status: 'interview',
    stage: 'executive briefing',
    rating: 4.2,
    owner_id: 7202,
    applied_at: new Date('2025-03-12T10:30:00Z'),
    tags: ['strategy', 'ai'],
    notes: 'Led product at Series C supply chain platform; strong OKR discipline.',
    created_by: DEFAULT_ACTOR_ID,
    updated_by: DEFAULT_ACTOR_ID,
    metadata: { seedTag: SEED_TAG, timezone: 'America/New_York' },
    created_at: new Date('2025-03-12T10:30:00Z'),
    updated_at: new Date('2025-03-13T16:45:00Z'),
  },
  {
    workspace_id: 'alliance-studio-hq',
    job_slug: 'senior-growth-analytics-lead',
    candidate_name: 'Imani Rowe',
    candidate_email: 'imani.rowe@candidatehub.dev',
    candidate_phone: '+1-737-555-9022',
    source: 'events',
    resume_url: 'https://cdn.gigvora.test/resumes/imani-rowe.pdf',
    status: 'new',
    stage: 'initial review',
    rating: 4.1,
    owner_id: 7203,
    applied_at: new Date('2025-03-11T13:20:00Z'),
    tags: ['growth analytics'],
    notes: 'Met during Helios Labs founder summit; strong B2B SaaS background.',
    created_by: DEFAULT_ACTOR_ID,
    updated_by: DEFAULT_ACTOR_ID,
    metadata: { seedTag: SEED_TAG, timezone: 'America/Chicago' },
    created_at: new Date('2025-03-11T13:20:00Z'),
    updated_at: new Date('2025-03-11T13:20:00Z'),
  },
];

const FAVORITE_SEEDS = [
  {
    workspace_id: 'alliance-studio-hq',
    job_slug: 'director-of-product-strategy',
    member_id: 5601,
    pinned_note: 'Executive council flagged this role as top priority for Q2 expansion.',
    created_by: 5601,
    created_at: new Date('2025-03-13T18:45:00Z'),
    updated_at: new Date('2025-03-13T18:45:00Z'),
  },
];

const INTERVIEW_SEEDS = [
  {
    workspace_id: 'alliance-studio-hq',
    job_slug: 'director-of-product-strategy',
    candidate_email: 'jonah.ibrahim@candidatehub.dev',
    scheduled_at: new Date('2025-03-14T17:00:00Z'),
    duration_minutes: 60,
    mode: 'virtual',
    stage: 'executive briefing',
    status: 'planned',
    interviewer_name: 'Nia Patterson',
    interviewer_email: 'nia.patterson@gigvora.com',
    meeting_url: 'https://meet.gigvora.test/nimbus-exec-briefing',
    agenda: 'Discuss 90-day roadmap priorities and alignment with AI investments.',
    feedback: null,
    recording_url: null,
    created_by: DEFAULT_ACTOR_ID,
    updated_by: DEFAULT_ACTOR_ID,
    metadata: { seedTag: SEED_TAG, panelSize: 3 },
    created_at: new Date('2025-03-13T16:45:00Z'),
    updated_at: new Date('2025-03-13T16:45:00Z'),
  },
];

const RESPONSE_SEEDS = [
  {
    workspace_id: 'alliance-studio-hq',
    job_slug: 'director-of-product-strategy',
    candidate_email: 'jonah.ibrahim@candidatehub.dev',
    author_id: 7202,
    response_type: 'note',
    visibility: 'internal',
    subject: 'Executive briefing prep',
    body: 'Jonah aligned on AI partner co-build strategy; preparing materials for founder review.',
    attachments: [
      { name: 'Briefing Agenda', url: 'https://cdn.gigvora.test/briefings/nimbus-exec.pdf' },
    ],
    created_by: 7202,
    created_at: new Date('2025-03-13T19:00:00Z'),
    updated_at: new Date('2025-03-13T19:00:00Z'),
  },
];

const jobKey = (workspaceId, slug) => `${workspaceId}::${slug}`;
const applicationKey = (workspaceId, candidateEmail) => `${workspaceId}::${candidateEmail}`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert('agency_jobs', JOB_SEEDS, { transaction });

      const jobRows = await queryInterface.sequelize.query(
        `SELECT id, workspace_id, slug FROM agency_jobs WHERE slug IN (:slugs)`,
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { slugs: JOB_SEEDS.map((job) => job.slug) },
        },
      );
      const jobIdByKey = new Map(jobRows.map((row) => [jobKey(row.workspace_id, row.slug), row.id]));

      const applicationRows = APPLICATION_SEEDS.map((application) => {
        const jobId = jobIdByKey.get(jobKey(application.workspace_id, application.job_slug));
        if (!jobId) {
          throw new Error(`Missing job id for ${application.job_slug} in workspace ${application.workspace_id}`);
        }
        return {
          workspace_id: application.workspace_id,
          job_id: jobId,
          candidate_name: application.candidate_name,
          candidate_email: application.candidate_email,
          candidate_phone: application.candidate_phone,
          source: application.source,
          resume_url: application.resume_url,
          portfolio_url: application.portfolio_url ?? null,
          status: application.status,
          stage: application.stage,
          rating: application.rating,
          owner_id: application.owner_id,
          applied_at: application.applied_at,
          tags: application.tags,
          notes: application.notes,
          created_by: application.created_by,
          updated_by: application.updated_by,
          metadata: application.metadata,
          created_at: application.created_at,
          updated_at: application.updated_at,
        };
      });

      await queryInterface.bulkInsert('agency_job_applications', applicationRows, { transaction });

      const applicationRowsInserted = await queryInterface.sequelize.query(
        `SELECT id, workspace_id, candidate_email FROM agency_job_applications WHERE candidate_email IN (:emails)`,
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { emails: APPLICATION_SEEDS.map((app) => app.candidate_email) },
        },
      );
      const applicationIdByKey = new Map(
        applicationRowsInserted.map((row) => [applicationKey(row.workspace_id, row.candidate_email), row.id]),
      );

      const favoriteRows = FAVORITE_SEEDS.map((favorite) => {
        const jobId = jobIdByKey.get(jobKey(favorite.workspace_id, favorite.job_slug));
        if (!jobId) {
          throw new Error(`Missing job id for favorite on ${favorite.job_slug}`);
        }
        return {
          workspace_id: favorite.workspace_id,
          job_id: jobId,
          member_id: favorite.member_id,
          pinned_note: favorite.pinned_note,
          created_by: favorite.created_by,
          created_at: favorite.created_at,
          updated_at: favorite.updated_at,
        };
      });

      if (favoriteRows.length) {
        await queryInterface.bulkInsert('agency_job_favorites', favoriteRows, { transaction });
      }

      const interviewRows = INTERVIEW_SEEDS.map((interview) => {
        const applicationId = applicationIdByKey.get(applicationKey(interview.workspace_id, interview.candidate_email));
        if (!applicationId) {
          throw new Error(`Missing application id for interview candidate ${interview.candidate_email}`);
        }
        return {
          workspace_id: interview.workspace_id,
          application_id: applicationId,
          scheduled_at: interview.scheduled_at,
          duration_minutes: interview.duration_minutes,
          mode: interview.mode,
          stage: interview.stage,
          status: interview.status,
          interviewer_name: interview.interviewer_name,
          interviewer_email: interview.interviewer_email,
          meeting_url: interview.meeting_url,
          location: interview.location ?? null,
          agenda: interview.agenda,
          feedback: interview.feedback,
          recording_url: interview.recording_url,
          created_by: interview.created_by,
          updated_by: interview.updated_by,
          metadata: interview.metadata,
          created_at: interview.created_at,
          updated_at: interview.updated_at,
        };
      });

      if (interviewRows.length) {
        await queryInterface.bulkInsert('agency_interviews', interviewRows, { transaction });
      }

      const responseRows = RESPONSE_SEEDS.map((response) => {
        const applicationId = applicationIdByKey.get(applicationKey(response.workspace_id, response.candidate_email));
        if (!applicationId) {
          throw new Error(`Missing application id for response candidate ${response.candidate_email}`);
        }
        return {
          workspace_id: response.workspace_id,
          application_id: applicationId,
          author_id: response.author_id,
          response_type: response.response_type,
          visibility: response.visibility,
          subject: response.subject,
          body: response.body,
          attachments: response.attachments,
          created_by: response.created_by,
          created_at: response.created_at,
          updated_at: response.updated_at,
        };
      });

      if (responseRows.length) {
        await queryInterface.bulkInsert('agency_application_responses', responseRows, { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jobSlugs = JOB_SEEDS.map((job) => job.slug);
      const applicationEmails = APPLICATION_SEEDS.map((application) => application.candidate_email);

      const jobRows = await queryInterface.sequelize.query(
        `SELECT id, slug FROM agency_jobs WHERE slug IN (:slugs)`,
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { slugs: jobSlugs },
        },
      );
      const jobIds = jobRows.map((row) => row.id);

      const applicationRows = await queryInterface.sequelize.query(
        `SELECT id FROM agency_job_applications WHERE candidate_email IN (:emails)`,
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { emails: applicationEmails },
        },
      );
      const applicationIds = applicationRows.map((row) => row.id);

      if (applicationIds.length) {
        await queryInterface.bulkDelete(
          'agency_application_responses',
          { application_id: applicationIds },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'agency_interviews',
          { application_id: applicationIds },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'agency_job_applications',
          { id: applicationIds },
          { transaction },
        );
      }

      if (jobIds.length) {
        await queryInterface.bulkDelete(
          'agency_job_favorites',
          { job_id: jobIds },
          { transaction },
        );

        await queryInterface.bulkDelete('agency_jobs', { id: jobIds }, { transaction });
      }
    });
  },
};
