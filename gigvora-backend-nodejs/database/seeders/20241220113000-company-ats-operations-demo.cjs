'use strict';

const { QueryTypes } = require('sequelize');

const WORKSPACE_SLUG = 'lumen-analytics-ats';
const WORKSPACE_SEED_KEY = 'company-ats-operations-demo';
const JOB_TITLE = '[demo] Enterprise ATS workflow pilot';
const HASHED_PASSWORD = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';

const candidateUsers = [
  {
    ref: 'casey',
    email: 'casey.talent@gigvora.test',
    firstName: 'Casey',
    lastName: 'Talbot',
  },
  {
    ref: 'dylan',
    email: 'dylan.talent@gigvora.test',
    firstName: 'Dylan',
    lastName: 'Rivera',
  },
  {
    ref: 'jordan',
    email: 'jordan.talent@gigvora.test',
    firstName: 'Jordan',
    lastName: 'Okafor',
  },
];

const stageDefinitions = [
  {
    name: 'Application Review',
    orderIndex: 1,
    slaHours: 24,
    averageDurationHours: 40,
    metadata: {
      seedKey: WORKSPACE_SEED_KEY,
      stageKey: 'screen',
      automations: ['resume_scoring', 'auto_acknowledge'],
      guardrails: ['bias_checklist'],
    },
  },
  {
    name: 'Team Interview',
    orderIndex: 2,
    slaHours: 72,
    averageDurationHours: 65,
    metadata: {
      seedKey: WORKSPACE_SEED_KEY,
      stageKey: 'interview',
      interviewKit: 'growth-panel',
    },
  },
];

const approvalSeeds = [
  {
    approverRole: 'Finance partner',
    status: 'pending',
    dueAt: '2024-08-05T15:00:00Z',
    metadata: { seedKey: WORKSPACE_SEED_KEY, checklist: ['budget', 'comp_bands'] },
  },
  {
    approverRole: 'Hiring executive',
    status: 'approved',
    dueAt: '2024-08-03T18:00:00Z',
    completedAt: '2024-08-02T19:30:00Z',
    metadata: { seedKey: WORKSPACE_SEED_KEY, checklist: ['headcount', 'position_summary'] },
  },
];

const applicationSeeds = [
  {
    key: 'ats-demo-app-1',
    applicantRef: 'casey',
    status: 'hired',
    sourceChannel: 'web',
    submittedAt: '2024-08-01T12:00:00Z',
    decisionAt: '2024-08-10T15:30:00Z',
    genderIdentity: 'Female',
    ethnicity: 'Hispanic or Latino',
    veteranStatus: 'non_veteran',
    disabilityStatus: 'not_disclosed',
    department: { id: 'strategic-ops', label: 'Strategic Operations' },
    recruiter: { id: 'riley-recruiter', name: 'Riley Recruiter' },
    survey: {
      score: 8,
      npsRating: 9,
      sentiment: 'positive',
      followUpScheduledAt: '2024-08-18T14:00:00Z',
      notes: 'Great interview coaching and prep portal assets.',
      responseAt: '2024-08-11T10:00:00Z',
    },
  },
  {
    key: 'ats-demo-app-2',
    applicantRef: 'dylan',
    status: 'hired',
    sourceChannel: 'referral',
    submittedAt: '2024-08-02T13:20:00Z',
    decisionAt: '2024-08-12T16:45:00Z',
    genderIdentity: 'Male',
    ethnicity: 'Black or African American',
    veteranStatus: 'veteran',
    disabilityStatus: 'not_disclosed',
    department: { id: 'revenue-ops', label: 'Revenue Operations' },
    recruiter: { id: 'sasha-talent', name: 'Sasha Talent Partner' },
    survey: {
      score: 7,
      npsRating: 8,
      sentiment: 'positive',
      followUpScheduledAt: null,
      notes: 'Would love a bit more role clarity in the panel.',
      responseAt: '2024-08-13T09:30:00Z',
    },
  },
  {
    key: 'ats-demo-app-3',
    applicantRef: 'casey',
    status: 'hired',
    sourceChannel: 'web',
    submittedAt: '2024-08-03T09:00:00Z',
    decisionAt: '2024-08-15T18:10:00Z',
    genderIdentity: 'Female',
    ethnicity: 'Asian',
    veteranStatus: 'non_veteran',
    disabilityStatus: 'not_disclosed',
    department: { id: 'strategic-ops', label: 'Strategic Operations' },
    recruiter: { id: 'riley-recruiter', name: 'Riley Recruiter' },
    survey: {
      score: 9,
      npsRating: 10,
      sentiment: 'positive',
      followUpScheduledAt: null,
      notes: 'Loved the structured rubric and timely updates.',
      responseAt: '2024-08-16T11:20:00Z',
    },
  },
  {
    key: 'ats-demo-app-4',
    applicantRef: 'jordan',
    status: 'rejected',
    sourceChannel: 'web',
    submittedAt: '2024-08-04T15:15:00Z',
    decisionAt: '2024-08-09T10:25:00Z',
    genderIdentity: 'Female',
    ethnicity: 'White',
    veteranStatus: 'non_veteran',
    disabilityStatus: 'not_disclosed',
    department: { id: 'strategic-ops', label: 'Strategic Operations' },
    recruiter: { id: 'riley-recruiter', name: 'Riley Recruiter' },
  },
  {
    key: 'ats-demo-app-5',
    applicantRef: 'dylan',
    status: 'interview',
    sourceChannel: 'agency',
    submittedAt: '2024-08-05T17:45:00Z',
    decisionAt: null,
    genderIdentity: 'Male',
    ethnicity: 'White',
    veteranStatus: 'non_veteran',
    disabilityStatus: 'not_disclosed',
    department: { id: 'revenue-ops', label: 'Revenue Operations' },
    recruiter: { id: 'sasha-talent', name: 'Sasha Talent Partner' },
  },
  {
    key: 'ats-demo-app-6',
    applicantRef: 'jordan',
    status: 'offered',
    sourceChannel: 'web',
    submittedAt: '2024-08-06T12:50:00Z',
    decisionAt: null,
    genderIdentity: 'Male',
    ethnicity: 'Hispanic or Latino',
    veteranStatus: 'non_veteran',
    disabilityStatus: 'self_identified',
    department: { id: 'revenue-ops', label: 'Revenue Operations' },
    recruiter: { id: 'sasha-talent', name: 'Sasha Talent Partner' },
  },
];

function buildApplicationMetadata(workspaceId, seed) {
  const recruiterDescriptor = {
    id: seed.recruiter.id,
    name: seed.recruiter.name,
  };
  return {
    seedKey: WORKSPACE_SEED_KEY,
    companyWorkspaceId: workspaceId,
    workspaceId,
    departmentId: seed.department.id,
    departmentName: seed.department.label,
    departmentLabel: seed.department.label,
    assignedRecruiterId: recruiterDescriptor.id,
    assignedRecruiterName: recruiterDescriptor.name,
    recruiter: recruiterDescriptor,
    team: seed.department.label,
  };
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const seedJoinedAt = new Date('2024-08-01T00:00:00Z');

      const [owner] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { email: 'mia@gigvora.com' },
        },
      );

      const [recruiter] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { email: 'riley@gigvora.com' },
        },
      );

      if (!owner?.id || !recruiter?.id) {
        throw new Error('Required seed users mia@gigvora.com or riley@gigvora.com are missing.');
      }

      const userIdsByRef = new Map();

      for (const candidate of candidateUsers) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM users WHERE email = :email LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { email: candidate.email },
          },
        );

        if (existing?.id) {
          userIdsByRef.set(candidate.ref, existing.id);
          continue;
        }

        await queryInterface.bulkInsert(
          'users',
          [
            {
              firstName: candidate.firstName,
              lastName: candidate.lastName,
              email: candidate.email,
              password: HASHED_PASSWORD,
              address: 'Remote',
              age: 29,
              userType: 'user',
              status: 'active',
              metadata: { seedKey: WORKSPACE_SEED_KEY },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        const [inserted] = await queryInterface.sequelize.query(
          'SELECT id FROM users WHERE email = :email LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { email: candidate.email },
          },
        );
        if (!inserted?.id) {
          throw new Error(`Failed to insert candidate user ${candidate.email}`);
        }
        userIdsByRef.set(candidate.ref, inserted.id);
      }

      const [workspaceRow] = await queryInterface.sequelize.query(
        'SELECT id, settings FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: WORKSPACE_SLUG },
        },
      );

      let workspaceId = workspaceRow?.id;

      if (!workspaceId) {
        await queryInterface.bulkInsert(
          'provider_workspaces',
          [
            {
              ownerId: owner.id,
              name: 'Lumen Analytics Talent',
              slug: WORKSPACE_SLUG,
              type: 'company',
              timezone: 'America/New_York',
              defaultCurrency: 'USD',
              intakeEmail: 'talent@lumen-analytics.test',
              isActive: true,
              settings: {
                seedKey: WORKSPACE_SEED_KEY,
                ats: { fairnessMonitoring: true, segmentation: 'live' },
              },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        const [insertedWorkspace] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { slug: WORKSPACE_SLUG },
          },
        );
        workspaceId = insertedWorkspace?.id;
      }

      if (!workspaceId) {
        throw new Error('Failed to resolve company workspace for ATS demo seed.');
      }

      const membersToEnsure = [
        { userId: owner.id, role: 'owner' },
        { userId: recruiter.id, role: 'manager' },
      ];

      for (const member of membersToEnsure) {
        const [existingMember] = await queryInterface.sequelize.query(
          'SELECT id FROM provider_workspace_members WHERE workspaceId = :workspaceId AND userId = :userId LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, userId: member.userId },
          },
        );

        if (existingMember?.id) {
          continue;
        }

        await queryInterface.bulkInsert(
          'provider_workspace_members',
          [
            {
              workspaceId,
              userId: member.userId,
              role: member.role,
              status: 'active',
              invitedById: owner.id,
              joinedAt: seedJoinedAt,
              lastActiveAt: seedJoinedAt,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [jobRow] = await queryInterface.sequelize.query(
        'SELECT id FROM jobs WHERE title = :title LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { title: JOB_TITLE },
        },
      );

      let jobId = jobRow?.id;

      if (!jobId) {
        await queryInterface.bulkInsert(
          'jobs',
          [
            {
              title: JOB_TITLE,
              description:
                'Operate our talent acquisition automation program, monitor fairness analytics, and drive SLA adherence across every stage.',
              location: 'Remote · North America',
              employmentType: 'Full-time',
              geoLocation: null,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        const [insertedJob] = await queryInterface.sequelize.query(
          'SELECT id FROM jobs WHERE title = :title LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { title: JOB_TITLE },
          },
        );
        jobId = insertedJob?.id;
      }

      if (!jobId) {
        throw new Error('Failed to resolve job id for ATS workflow pilot.');
      }

      for (const stage of stageDefinitions) {
        const [existingStage] = await queryInterface.sequelize.query(
          'SELECT id FROM job_stages WHERE workspaceId = :workspaceId AND jobId = :jobId AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, jobId, name: stage.name },
          },
        );

        if (existingStage?.id) {
          continue;
        }

        await queryInterface.bulkInsert(
          'job_stages',
          [
            {
              workspaceId,
              jobId,
              name: stage.name,
              orderIndex: stage.orderIndex,
              slaHours: stage.slaHours,
              averageDurationHours: stage.averageDurationHours,
              guideUrl: null,
              metadata: stage.metadata,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      for (const approval of approvalSeeds) {
        const [existingApproval] = await queryInterface.sequelize.query(
          'SELECT id FROM job_approval_workflows WHERE workspaceId = :workspaceId AND approverRole = :approverRole AND dueAt = :dueAt LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { workspaceId, approverRole: approval.approverRole, dueAt: approval.dueAt },
          },
        );

        if (existingApproval?.id) {
          continue;
        }

        await queryInterface.bulkInsert(
          'job_approval_workflows',
          [
            {
              workspaceId,
              jobId,
              approverRole: approval.approverRole,
              status: approval.status,
              dueAt: approval.dueAt,
              completedAt: approval.completedAt ?? null,
              metadata: approval.metadata,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const applicationSubmittedAt = applicationSeeds.map((seed) => seed.submittedAt);

      const applicationsToInsert = [];
      for (const seed of applicationSeeds) {
        const applicantId = userIdsByRef.get(seed.applicantRef);
        if (!applicantId) {
          throw new Error(`Missing applicant mapping for ref ${seed.applicantRef}`);
        }

        const [existingApplication] = await queryInterface.sequelize.query(
          'SELECT id FROM applications WHERE targetType = :targetType AND targetId = :targetId AND submittedAt = :submittedAt LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: {
              targetType: 'job',
              targetId: jobId,
              submittedAt: seed.submittedAt,
            },
          },
        );

        if (existingApplication?.id) {
          continue;
        }

        applicationsToInsert.push({
          applicantId,
          targetType: 'job',
          targetId: jobId,
          status: seed.status,
          sourceChannel: seed.sourceChannel,
          coverLetter: null,
          attachments: null,
          rateExpectation: null,
          currencyCode: 'USD',
          availabilityDate: null,
          isArchived: false,
          submittedAt: seed.submittedAt,
          decisionAt: seed.decisionAt,
          metadata: buildApplicationMetadata(workspaceId, seed),
          createdAt: now,
          updatedAt: now,
        });
      }

      if (applicationsToInsert.length) {
        await queryInterface.bulkInsert('applications', applicationsToInsert, { transaction });
      }

      const applicationRows = await queryInterface.sequelize.query(
        'SELECT id, submittedAt FROM applications WHERE targetType = :targetType AND targetId = :targetId AND submittedAt IN (:submittedAt)',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: {
            targetType: 'job',
            targetId: jobId,
            submittedAt: applicationSubmittedAt,
          },
        },
      );

      const applicationIdByKey = new Map();
      for (const seed of applicationSeeds) {
        const row = applicationRows.find(
          (item) => new Date(item.submittedAt).getTime() === new Date(seed.submittedAt).getTime(),
        );
        if (row?.id) {
          applicationIdByKey.set(seed.key, row.id);
        }
      }

      for (const seed of applicationSeeds) {
        const applicationId = applicationIdByKey.get(seed.key);
        if (!applicationId) {
          continue;
        }

        await queryInterface.bulkInsert(
          'candidate_demographic_snapshots',
          [
            {
              workspaceId,
              applicationId,
              genderIdentity: seed.genderIdentity,
              ethnicity: seed.ethnicity,
              veteranStatus: seed.veteranStatus,
              disabilityStatus: seed.disabilityStatus,
              seniorityLevel: 'senior',
              locationRegion: 'North America',
              capturedAt: seed.submittedAt,
              metadata: { seedKey: WORKSPACE_SEED_KEY },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        if (seed.survey) {
          await queryInterface.bulkInsert(
            'candidate_satisfaction_surveys',
            [
              {
                workspaceId,
                applicationId,
                stage: seed.status,
                score: seed.survey.score,
                npsRating: seed.survey.npsRating,
                sentiment: seed.survey.sentiment,
                followUpScheduledAt: seed.survey.followUpScheduledAt,
                responseAt: seed.survey.responseAt,
                notes: seed.survey.notes,
                metadata: { seedKey: WORKSPACE_SEED_KEY },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const reviewPayloads = [];
      const screenDecisions = [
        { key: 'ats-demo-app-1', decision: 'advance', score: 4 },
        { key: 'ats-demo-app-2', decision: 'advance', score: 3 },
        { key: 'ats-demo-app-3', decision: 'reject', score: 2 },
        { key: 'ats-demo-app-4', decision: 'reject', score: 1 },
        { key: 'ats-demo-app-5', decision: 'hold', score: 3 },
        { key: 'ats-demo-app-6', decision: 'reject', score: 2 },
      ];

      for (const entry of screenDecisions) {
        const applicationId = applicationIdByKey.get(entry.key);
        if (!applicationId) {
          continue;
        }
        reviewPayloads.push({
          applicationId,
          reviewerId: recruiter.id,
          stage: 'screen',
          decision: entry.decision,
          score: entry.score,
          notes: null,
          decidedAt: entry.decision === 'pending' ? null : new Date('2024-08-08T12:00:00Z'),
          createdAt: now,
          updatedAt: now,
        });
      }

      const interviewDecisions = [
        { key: 'ats-demo-app-1', decision: 'advance', score: 4 },
        { key: 'ats-demo-app-2', decision: 'reject', score: 2 },
        { key: 'ats-demo-app-6', decision: 'advance', score: 3 },
      ];

      for (const entry of interviewDecisions) {
        const applicationId = applicationIdByKey.get(entry.key);
        if (!applicationId) {
          continue;
        }
        reviewPayloads.push({
          applicationId,
          reviewerId: recruiter.id,
          stage: 'interview',
          decision: entry.decision,
          score: entry.score,
          notes: null,
          decidedAt: new Date('2024-08-14T16:00:00Z'),
          createdAt: now,
          updatedAt: now,
        });
      }

      if (reviewPayloads.length) {
        await queryInterface.bulkInsert('application_reviews', reviewPayloads, { transaction });
      }

      const interviewSchedules = [
        {
          key: 'ats-demo-app-1',
          scheduledAt: '2024-08-09T17:00:00Z',
          completedAt: '2024-08-09T18:00:00Z',
          durationMinutes: 60,
          rescheduleCount: 0,
          interviewerRoster: [
            { name: 'Riley Recruiter', email: 'recruiter@gigvora.com', timezone: 'America/New_York' },
            { name: 'Sam Hiring Manager', email: 'sam@gigvora.com', timezone: 'America/Chicago' },
          ],
        },
        {
          key: 'ats-demo-app-2',
          scheduledAt: '2024-08-10T15:30:00Z',
          completedAt: '2024-08-10T16:15:00Z',
          durationMinutes: 45,
          rescheduleCount: 1,
          interviewerRoster: [
            { name: 'Sasha Talent Partner', email: 'sasha@gigvora.com', timezone: 'America/Denver' },
          ],
        },
        {
          key: 'ats-demo-app-6',
          scheduledAt: '2024-08-12T14:00:00Z',
          completedAt: null,
          durationMinutes: 50,
          rescheduleCount: 0,
          interviewerRoster: [
            { name: 'Alex Ops Lead', email: 'alex@gigvora.com', timezone: 'America/New_York' },
          ],
        },
      ];

      for (const schedule of interviewSchedules) {
        const applicationId = applicationIdByKey.get(schedule.key);
        if (!applicationId) {
          continue;
        }

        await queryInterface.bulkInsert(
          'interview_schedules',
          [
            {
              workspaceId,
              applicationId,
              interviewStage: 'panel',
              scheduledAt: schedule.scheduledAt,
              completedAt: schedule.completedAt,
              durationMinutes: schedule.durationMinutes,
              rescheduleCount: schedule.rescheduleCount,
              interviewerRoster: schedule.interviewerRoster,
              metadata: { seedKey: WORKSPACE_SEED_KEY },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [workspace] = await queryInterface.sequelize.query(
        'SELECT id, settings FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { slug: WORKSPACE_SLUG },
        },
      );

      const workspaceId = workspace?.id;

      const [job] = await queryInterface.sequelize.query(
        'SELECT id FROM jobs WHERE title = :title LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { title: JOB_TITLE },
        },
      );

      const jobId = job?.id;

      const submittedAtDates = applicationSeeds.map((seed) => seed.submittedAt);

      const applicationRows = workspaceId
        ? await queryInterface.sequelize.query(
            'SELECT id FROM applications WHERE targetType = :targetType AND targetId = :targetId AND submittedAt IN (:submittedAt)',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: {
                targetType: 'job',
                targetId: jobId ?? 0,
                submittedAt: submittedAtDates,
              },
            },
          )
        : [];

      const applicationIds = applicationRows.map((row) => row.id);

      if (applicationIds.length) {
        await queryInterface.bulkDelete(
          'candidate_satisfaction_surveys',
          {
            workspaceId,
            applicationId: applicationIds,
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'interview_schedules',
          {
            workspaceId,
            applicationId: applicationIds,
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'application_reviews',
          {
            applicationId: applicationIds,
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'candidate_demographic_snapshots',
          {
            workspaceId,
            applicationId: applicationIds,
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'applications',
          {
            id: applicationIds,
          },
          { transaction },
        );
      }

      if (workspaceId && jobId) {
        await queryInterface.bulkDelete(
          'job_approval_workflows',
          {
            workspaceId,
            jobId,
            approverRole: approvalSeeds.map((seed) => seed.approverRole),
          },
          { transaction },
        );

        await queryInterface.bulkDelete(
          'job_stages',
          {
            workspaceId,
            jobId,
            name: stageDefinitions.map((stage) => stage.name),
          },
          { transaction },
        );
      }

      if (jobId) {
        const [applicationCount] = await queryInterface.sequelize.query(
          'SELECT COUNT(*) AS count FROM applications WHERE targetType = :targetType AND targetId = :targetId',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { targetType: 'job', targetId: jobId },
          },
        );

        if (Number(applicationCount?.count ?? 0) === 0) {
          await queryInterface.bulkDelete('jobs', { id: jobId }, { transaction });
        }
      }

      if (workspaceId) {
        const seedJoinedAt = new Date('2024-08-01T00:00:00Z');
        await queryInterface.bulkDelete(
          'provider_workspace_members',
          {
            workspaceId,
            joinedAt: seedJoinedAt,
          },
          { transaction },
        );
      }

      for (const candidate of candidateUsers) {
        const [user] = await queryInterface.sequelize.query(
          'SELECT id, metadata FROM users WHERE email = :email LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { email: candidate.email },
          },
        );

        let metadata = user?.metadata ?? null;
        if (metadata && typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (error) {
            metadata = null;
          }
        }

        if (metadata && metadata.seedKey === WORKSPACE_SEED_KEY) {
          await queryInterface.bulkDelete(
            'users',
            {
              id: user.id,
            },
            { transaction },
          );
        }
      }

      if (workspace && workspace.settings && workspace.settings.seedKey === WORKSPACE_SEED_KEY) {
        await queryInterface.bulkDelete(
          'provider_workspaces',
          {
            id: workspace.id,
          },
          { transaction },
        );
      }
    });
  },
};
