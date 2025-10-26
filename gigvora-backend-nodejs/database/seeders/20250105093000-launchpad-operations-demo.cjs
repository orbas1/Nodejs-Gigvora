'use strict';

const { QueryTypes, Op } = require('sequelize');

const hashedPassword = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';
const seedTag = 'launchpad-operations-demo';
const launchpadTitle = 'Experience Launchpad Mobility 2025';
const jobTitle = '[Launchpad Demo] Autonomous Robotics Analyst';
const gigSlug = 'launchpad-ops-demo-gig';
const projectTitle = '[Launchpad Demo] Robotics Pilot Squad';
const volunteeringTitle = '[Launchpad Demo] Robotics Nonprofit Mentor';

async function requireUser(queryInterface, transaction, { email, firstName, lastName, userType }) {
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );

  if (existing?.id) {
    return Number(existing.id);
  }

  if (!firstName || !lastName || !userType) {
    throw new Error(`Launchpad demo seed requires profile details for ${email}.`);
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'users',
    [
      {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        address: 'Seeded via launchpad demo',
        age: 29,
        userType,
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
      replacements: { email },
    },
  );

  if (!inserted?.id) {
    throw new Error(`Unable to create user for ${email}.`);
  }

  return Number(inserted.id);
}

async function ensureLaunchpad(queryInterface, transaction, { mentorLead }) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM experience_launchpads WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: launchpadTitle },
    },
  );

  const now = new Date();
  const startDate = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  if (row?.id) {
    await queryInterface.bulkUpdate(
      'experience_launchpads',
      {
        description:
          'Rotational mobility programme pairing automation engineers with robotics squads across employer partners.',
        track: 'Automation & Robotics',
        programType: 'cohort',
        status: 'active',
        applicationUrl: 'https://gigvora.example/launchpad/mobility-2025',
        mentorLead,
        startDate,
        endDate,
        capacity: 48,
        eligibilityCriteria: {
          seedTag,
          minimumExperience: 1,
          requiredSkills: ['Python', 'Robotics', 'Process automation'],
          requiresPortfolio: true,
          autoAdvanceScore: 72,
          autoAcceptScore: 88,
        },
        employerSponsorship: {
          partners: ['Axiom Robotics', 'Northwind Labs'],
          summary: 'Funding available for eight automation apprenticeships per quarter.',
        },
        publishedAt: startDate,
        updatedAt: now,
      },
      { id: Number(row.id) },
      { transaction },
    );
    return Number(row.id);
  }

  await queryInterface.bulkInsert(
    'experience_launchpads',
    [
      {
        title: launchpadTitle,
        description:
          'Rotational mobility programme pairing automation engineers with robotics squads across employer partners.',
        track: 'Automation & Robotics',
        programType: 'cohort',
        status: 'active',
        applicationUrl: 'https://gigvora.example/launchpad/mobility-2025',
        mentorLead,
        startDate,
        endDate,
        capacity: 48,
        eligibilityCriteria: {
          seedTag,
          minimumExperience: 1,
          requiredSkills: ['Python', 'Robotics', 'Process automation'],
          requiresPortfolio: true,
          autoAdvanceScore: 72,
          autoAcceptScore: 88,
        },
        employerSponsorship: {
          partners: ['Axiom Robotics', 'Northwind Labs'],
          summary: 'Funding available for eight automation apprenticeships per quarter.',
        },
        publishedAt: startDate,
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );

  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM experience_launchpads WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: launchpadTitle },
    },
  );

  if (!inserted?.id) {
    throw new Error('Unable to create Experience Launchpad for demo seed.');
  }

  return Number(inserted.id);
}

async function ensureJob(queryInterface, transaction) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM jobs WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: jobTitle },
    },
  );
  if (row?.id) {
    return Number(row.id);
  }
  const now = new Date();
  await queryInterface.bulkInsert(
    'jobs',
    [
      {
        title: jobTitle,
        description:
          'Design telemetry pipelines, automate QA rigs, and mentor junior operators rolling out autonomous robotics cells.',
        location: 'Remote - North America',
        employmentType: 'contract-to-hire',
        geoLocation: { lat: 40.7128, lng: -74.006 },
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM jobs WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: jobTitle },
    },
  );
  if (!inserted?.id) {
    throw new Error('Unable to seed launchpad job opportunity.');
  }
  return Number(inserted.id);
}

async function ensureGig(queryInterface, transaction, ownerId) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM gigs WHERE slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { slug: gigSlug },
    },
  );
  if (row?.id) {
    return Number(row.id);
  }
  const now = new Date();
  await queryInterface.bulkInsert(
    'gigs',
    [
      {
        ownerId,
        slug: gigSlug,
        title: 'Automation Sprint Turnaround',
        tagline: 'Stabilise robotics deployments in under four weeks.',
        description:
          'Four-week engagement installing telemetry dashboards, mentoring operators, and tuning automation cells.',
        category: 'Automation',
        niche: 'Robotics enablement',
        deliveryModel: 'sprint',
        outcomePromise: 'Ship stable robotics automation in 30 days with playbooks for internal teams.',
        budget: '$18k fixed',
        duration: '4 weeks',
        location: 'Remote',
        geoLocation: { lat: 37.7749, lng: -122.4194 },
        heroAccent: 'emerald',
        targetMetric: 95,
        status: 'published',
        visibility: 'public',
        bannerSettings: { seedTag },
        availabilityTimezone: 'America/Los_Angeles',
        availabilityLeadTimeDays: 5,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM gigs WHERE slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { slug: gigSlug },
    },
  );
  if (!inserted?.id) {
    throw new Error('Unable to seed launchpad gig opportunity.');
  }
  return Number(inserted.id);
}

async function ensureProject(queryInterface, transaction) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM projects WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: projectTitle },
    },
  );
  if (row?.id) {
    return Number(row.id);
  }
  const now = new Date();
  await queryInterface.bulkInsert(
    'projects',
    [
      {
        title: projectTitle,
        description:
          'Cross-functional robotics pilot delivering automation cells for manufacturing partner labs with embedded mentors.',
        status: 'planning',
        location: 'Hybrid - Boston',
        geoLocation: { lat: 42.3601, lng: -71.0589 },
        budgetAmount: 240000,
        budgetCurrency: 'USD',
        autoAssignEnabled: true,
        autoAssignStatus: 'active',
        autoAssignSettings: { seedTag, focusSkills: ['python', 'robotics'] },
        autoAssignLastRunAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        autoAssignLastQueueSize: 6,
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );
  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM projects WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: projectTitle },
    },
  );
  if (!inserted?.id) {
    throw new Error('Unable to seed launchpad project opportunity.');
  }
  return Number(inserted.id);
}

async function ensureVolunteeringRole(queryInterface, transaction) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM volunteering_roles WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: volunteeringTitle },
    },
  );
  if (row?.id) {
    return Number(row.id);
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'volunteering_roles',
    [
      {
        title: volunteeringTitle,
        organization: 'Robotics For Good Alliance',
        summary: 'Mentor nonprofit teams deploying robotics in community labs.',
        description:
          'Support nonprofit robotics labs with cohort-based mentoring, curriculum planning, and safeguards for volunteers.',
        location: 'Hybrid - North America',
        geoLocation: { lat: 41.8781, lng: -87.6298 },
        status: 'open',
        remoteType: 'hybrid',
        commitmentHours: 6,
        applicationUrl: 'https://gigvora.example/volunteering/robotics-mentor',
        applicationDeadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        spots: 5,
        skills: ['Mentorship', 'Robotics', 'Program design'],
        requirements: ['Background check clearance', 'Robotics coaching experience'],
        tags: ['volunteering', 'robotics'],
        imageUrl: null,
        programId: null,
        publishedAt: now,
        accessRoles: ['mentor', 'volunteer'],
        metadata: { seed: seedTag, focus: 'community robotics' },
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction },
  );

  const [inserted] = await queryInterface.sequelize.query(
    'SELECT id FROM volunteering_roles WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: volunteeringTitle },
    },
  );
  if (!inserted?.id) {
    throw new Error('Unable to seed volunteering role for launchpad demo.');
  }
  return Number(inserted.id);
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
      const upcomingInterview = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

      const mentorLeadId = await requireUser(queryInterface, transaction, {
        email: 'mentor.launchpad@gigvora.com',
        firstName: 'Avery',
        lastName: 'Mentor',
        userType: 'user',
      });
      const operatorId = await requireUser(queryInterface, transaction, {
        email: 'ops.launchpad@gigvora.com',
        firstName: 'Noah',
        lastName: 'Operator',
        userType: 'admin',
      });
      const employerLiaisonId = await requireUser(queryInterface, transaction, {
        email: 'employer.partners@gigvora.com',
        firstName: 'Riya',
        lastName: 'Partners',
        userType: 'company',
      });

      const applicantProfiles = await Promise.all([
        requireUser(queryInterface, transaction, {
          email: 'talent.ada@gigvora.com',
          firstName: 'Ada',
          lastName: 'Systems',
          userType: 'user',
        }),
        requireUser(queryInterface, transaction, {
          email: 'talent.li@gigvora.com',
          firstName: 'Li',
          lastName: 'Automation',
          userType: 'user',
        }),
        requireUser(queryInterface, transaction, {
          email: 'talent.iman@gigvora.com',
          firstName: 'Iman',
          lastName: 'Robotics',
          userType: 'user',
        }),
        requireUser(queryInterface, transaction, {
          email: 'talent.sol@gigvora.com',
          firstName: 'Sol',
          lastName: 'Integrator',
          userType: 'user',
        }),
      ]);

      const launchpadId = await ensureLaunchpad(queryInterface, transaction, { mentorLead: 'Avery Mentor' });
      const jobId = await ensureJob(queryInterface, transaction);
      const gigId = await ensureGig(queryInterface, transaction, mentorLeadId);
      const projectId = await ensureProject(queryInterface, transaction);
      const volunteeringRoleId = await ensureVolunteeringRole(queryInterface, transaction);

      const applicationRows = [
        {
          launchpadId,
          applicantId: applicantProfiles[0],
          status: 'screening',
          qualificationScore: 68.4,
          yearsExperience: 1.5,
          skills: ['Python', 'Selenium', 'PLC automation'],
          motivations:
            'I want to rotate from QA automation into robotics, focusing on sensor calibration and remote monitoring.',
          portfolioUrl: 'https://portfolios.gigvora.example/ada-systems',
          availabilityDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          eligibilitySnapshot: {
            seedTag,
            candidate: {
              targetSkills: ['Robotics', 'Telemetry dashboards'],
            },
            evaluation: {
              meetsExperience: true,
              matchedSkills: ['python'],
              missingSkills: ['robotics'],
              learningAlignedMissing: ['robotics'],
            },
            recommendation: {
              recommendedStatus: 'screening',
              generatedAt: thirtyDaysAgo,
            },
          },
          assignedMentor: 'Avery Mentor',
          interviewScheduledAt: null,
          decisionNotes: `Seed: ${seedTag} · awaiting mentor alignment`,
          createdAt: fortyFiveDaysAgo,
          updatedAt: thirtyDaysAgo,
        },
        {
          launchpadId,
          applicantId: applicantProfiles[1],
          status: 'interview',
          qualificationScore: 81.2,
          yearsExperience: 3.2,
          skills: ['Python', 'Robotics', 'Ansible'],
          motivations: 'Move from automation scripting into cohort leadership for robotics pilots.',
          portfolioUrl: 'https://portfolios.gigvora.example/li-automation',
          availabilityDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          eligibilitySnapshot: {
            seedTag,
            candidate: {
              targetSkills: ['Process automation', 'Mentorship'],
            },
            evaluation: {
              meetsExperience: true,
              matchedSkills: ['python', 'robotics'],
              missingSkills: ['process automation'],
              learningAlignedMissing: ['process automation'],
            },
            recommendation: {
              recommendedStatus: 'interview',
              generatedAt: thirtyDaysAgo,
            },
          },
          assignedMentor: 'Avery Mentor',
          interviewScheduledAt: upcomingInterview,
          decisionNotes: `Seed: ${seedTag} · interview confirmed`,
          createdAt: thirtyDaysAgo,
          updatedAt: now,
        },
        {
          launchpadId,
          applicantId: applicantProfiles[2],
          status: 'accepted',
          qualificationScore: 92.6,
          yearsExperience: 5.4,
          skills: ['Python', 'Robotics', 'Process automation', 'Kubernetes'],
          motivations:
            'Lead automation pods for robotics labs while mentoring junior operators transitioning from QA.',
          portfolioUrl: 'https://portfolios.gigvora.example/iman-robotics',
          availabilityDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          eligibilitySnapshot: {
            seedTag,
            candidate: {
              targetSkills: ['Mentorship', 'Systems architecture'],
            },
            evaluation: {
              meetsExperience: true,
              matchedSkills: ['python', 'robotics', 'process automation'],
              missingSkills: [],
              learningAlignedMissing: [],
            },
            recommendation: {
              recommendedStatus: 'accepted',
              generatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
            },
          },
          assignedMentor: 'Noah Operator',
          interviewScheduledAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
          decisionNotes: `Seed: ${seedTag} · ready for placement`,
          createdAt: fortyFiveDaysAgo,
          updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          launchpadId,
          applicantId: applicantProfiles[3],
          status: 'completed',
          qualificationScore: 95.1,
          yearsExperience: 6.7,
          skills: ['Python', 'Robotics', 'Process automation', 'Telemetry dashboards'],
          motivations: 'Continue delivering robotics launchpads while coaching new cohorts.',
          portfolioUrl: 'https://portfolios.gigvora.example/sol-integrator',
          availabilityDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
          eligibilitySnapshot: {
            seedTag,
            candidate: {
              targetSkills: ['Leadership', 'AI monitoring'],
            },
            evaluation: {
              meetsExperience: true,
              matchedSkills: ['python', 'robotics', 'process automation'],
              missingSkills: [],
              learningAlignedMissing: [],
            },
            recommendation: {
              recommendedStatus: 'completed',
              generatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          assignedMentor: 'Avery Mentor',
          interviewScheduledAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
          decisionNotes: `Seed: ${seedTag} · alumni mentor`,
          createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      await queryInterface.bulkDelete(
        'experience_launchpad_applications',
        { launchpadId, decisionNotes: { [Op.like]: `%${seedTag}%` } },
        { transaction },
      );
      await queryInterface.bulkInsert('experience_launchpad_applications', applicationRows, { transaction });

      const seededApplications = await queryInterface.sequelize.query(
        'SELECT id, status FROM experience_launchpad_applications WHERE launchpad_id = :launchpadId AND decision_notes LIKE :pattern',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { launchpadId, pattern: `%${seedTag}%` },
        },
      );

      const applicationsByStatus = seededApplications.reduce((acc, row) => {
        acc[row.status] = acc[row.status] ?? [];
        acc[row.status].push(Number(row.id));
        return acc;
      }, {});

      const existingEmployerRequests = await queryInterface.sequelize.query(
        "SELECT id FROM experience_launchpad_employer_requests WHERE launchpad_id = :launchpadId AND metadata->>'seed' = :seed",
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { launchpadId, seed: seedTag },
        },
      );
      if (existingEmployerRequests.length) {
        await queryInterface.bulkDelete(
          'experience_launchpad_employer_requests',
          { id: { [Op.in]: existingEmployerRequests.map((row) => Number(row.id)) } },
          { transaction },
        );
      }

      await queryInterface.bulkInsert(
        'experience_launchpad_employer_requests',
        [
          {
            launchpadId,
            organizationName: 'Axiom Robotics',
            contactName: 'Jordan Rivera',
            contactEmail: 'robotics.ops@axiom.example',
            headcount: 4,
            engagementTypes: ['contract-to-hire', 'mentorship sprint'],
            targetStartDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            idealCandidateProfile:
              'Automation engineer comfortable with Python, PLC tooling, and coaching junior operators.',
            hiringNotes: 'Needs first shortlist within 10 days; priority on AI monitoring experience.',
            status: 'needs_review',
            slaCommitmentDays: 10,
            createdById: employerLiaisonId,
            metadata: { seed: seedTag, focus: 'Robotics pods' },
            createdAt: now,
            updatedAt: now,
          },
          {
            launchpadId,
            organizationName: 'Northwind Labs',
            contactName: 'Priya Bose',
            contactEmail: 'talent@northwindlabs.example',
            headcount: 2,
            engagementTypes: ['full-time placement'],
            targetStartDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
            idealCandidateProfile: 'Automation lead to stabilise robotics pilot labs and mentor two apprentices.',
            hiringNotes: 'Approved for cohort immersion; wants hybrid availability in Boston.',
            status: 'approved',
            slaCommitmentDays: 21,
            createdById: employerLiaisonId,
            metadata: { seed: seedTag, focus: 'Boston hybrid' },
            createdAt: thirtyDaysAgo,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      const employerRequests = await queryInterface.sequelize.query(
        "SELECT id, organization_name FROM experience_launchpad_employer_requests WHERE launchpad_id = :launchpadId AND metadata->>'seed' = :seed",
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { launchpadId, seed: seedTag },
        },
      );

      const existingPlacementIds = await queryInterface.sequelize.query(
        "SELECT id FROM experience_launchpad_placements WHERE launchpad_id = :launchpadId AND compensation::text LIKE :pattern",
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { launchpadId, pattern: `%${seedTag}%` },
        },
      );
      if (existingPlacementIds.length) {
        await queryInterface.bulkDelete(
          'experience_launchpad_placements',
          { id: { [Op.in]: existingPlacementIds.map((row) => Number(row.id)) } },
          { transaction },
        );
      }

      const placementRows = [];
      if (applicationsByStatus.accepted?.length) {
        placementRows.push({
          launchpadId,
          candidateId: applicationsByStatus.accepted[0],
          employerRequestId: employerRequests.find((entry) => entry.organization_name === 'Axiom Robotics')?.id ?? null,
          targetType: 'project',
          targetId: projectId,
          status: 'in_progress',
          placementDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          endDate: null,
          compensation: { currency: 'USD', rate: 68, unit: 'hour', seedTag },
          feedbackScore: 4.8,
          createdAt: now,
          updatedAt: now,
        });
      }
      if (applicationsByStatus.completed?.length) {
        placementRows.push({
          launchpadId,
          candidateId: applicationsByStatus.completed[0],
          employerRequestId: employerRequests.find((entry) => entry.organization_name === 'Northwind Labs')?.id ?? null,
          targetType: 'gig',
          targetId: gigId,
          status: 'completed',
          placementDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
          endDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          compensation: { currency: 'USD', total: 24000, unit: 'fixed', seedTag },
          feedbackScore: 4.9,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (applicationsByStatus.interview?.length) {
        placementRows.push({
          launchpadId,
          candidateId: applicationsByStatus.interview[0],
          employerRequestId: null,
          targetType: 'volunteering',
          targetId: volunteeringRoleId,
          status: 'scheduled',
          placementDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          endDate: null,
          compensation: { stipendType: 'pro_bono', amount: 0, seedTag },
          feedbackScore: null,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (placementRows.length) {
        await queryInterface.bulkInsert('experience_launchpad_placements', placementRows, { transaction });
      }

      await queryInterface.bulkDelete(
        'experience_launchpad_opportunity_links',
        {
          launchpadId,
          notes: { [Op.like]: `%${seedTag}%` },
        },
        { transaction },
      );

      await queryInterface.bulkInsert(
        'experience_launchpad_opportunity_links',
        [
          {
            launchpadId,
            targetType: 'job',
            targetId: jobId,
            source: 'manual',
            createdById: operatorId,
            notes: `Seed: ${seedTag} · robotics analyst opportunity`,
            createdAt: now,
            updatedAt: now,
          },
          {
            launchpadId,
            targetType: 'gig',
            targetId: gigId,
            source: 'employer_request',
            createdById: employerLiaisonId,
            notes: `Seed: ${seedTag} · employer sprint request`,
            createdAt: now,
            updatedAt: now,
          },
          {
            launchpadId,
            targetType: 'project',
            targetId: projectId,
            source: 'placement',
            createdById: mentorLeadId,
            notes: `Seed: ${seedTag} · placement-backed project`,
            createdAt: now,
            updatedAt: now,
          },
          {
            launchpadId,
            targetType: 'volunteering',
            targetId: volunteeringRoleId,
            source: 'manual',
            createdById: mentorLeadId,
            notes: `Seed: ${seedTag} · volunteering rotation`,
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [launchpadRow] = await queryInterface.sequelize.query(
        'SELECT id FROM experience_launchpads WHERE title = :title LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { title: launchpadTitle },
        },
      );
      const launchpadId = launchpadRow?.id ? Number(launchpadRow.id) : null;

      if (launchpadId) {
        const applicationIds = await queryInterface.sequelize.query(
          'SELECT id FROM experience_launchpad_applications WHERE launchpad_id = :launchpadId AND decision_notes LIKE :pattern',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { launchpadId, pattern: `%${seedTag}%` },
          },
        );
        if (applicationIds.length) {
          await queryInterface.bulkDelete(
            'experience_launchpad_applications',
            { id: { [Op.in]: applicationIds.map((row) => Number(row.id)) } },
            { transaction },
          );
        }

        const placementIds = await queryInterface.sequelize.query(
          "SELECT id FROM experience_launchpad_placements WHERE launchpad_id = :launchpadId AND compensation::text LIKE :pattern",
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { launchpadId, pattern: `%${seedTag}%` },
          },
        );
        if (placementIds.length) {
          await queryInterface.bulkDelete(
            'experience_launchpad_placements',
            { id: { [Op.in]: placementIds.map((row) => Number(row.id)) } },
            { transaction },
          );
        }

        const employerRequestIds = await queryInterface.sequelize.query(
          "SELECT id FROM experience_launchpad_employer_requests WHERE launchpad_id = :launchpadId AND metadata->>'seed' = :seed",
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { launchpadId, seed: seedTag },
          },
        );
        if (employerRequestIds.length) {
          await queryInterface.bulkDelete(
            'experience_launchpad_employer_requests',
            { id: { [Op.in]: employerRequestIds.map((row) => Number(row.id)) } },
            { transaction },
          );
        }

        await queryInterface.bulkDelete(
          'experience_launchpad_opportunity_links',
          { launchpadId, notes: { [Op.like]: `%${seedTag}%` } },
          { transaction },
        );

        const [seededLaunchpad] = await queryInterface.sequelize.query(
          'SELECT id FROM experience_launchpads WHERE id = :launchpadId AND ("eligibilityCriteria"->>\'seedTag\') = :seedTag',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { launchpadId, seedTag },
          },
        );
        if (seededLaunchpad?.id) {
          await queryInterface.bulkDelete(
            'experience_launchpads',
            { id: launchpadId },
            { transaction },
          );
        }
      }

      await queryInterface.bulkDelete('jobs', { title: jobTitle }, { transaction });
      await queryInterface.bulkDelete('gigs', { slug: gigSlug }, { transaction });
      await queryInterface.bulkDelete('projects', { title: projectTitle }, { transaction });
      await queryInterface.bulkDelete('volunteering_roles', { title: volunteeringTitle }, { transaction });
    });
  },
};
