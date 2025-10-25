'use strict';

const { QueryTypes, Op } = require('sequelize');

const HASHED_PASSWORD = '$2b$10$URrfHgz0s1xu1vByrRl/h.STE7Z0O.STDnpCiMTGy66idi2EDmzJm';
const PROJECT_TITLE = '[demo] Workspace instrumentation rollout';
const AUTO_ASSIGN_SETTINGS = {
  limit: 3,
  expiresInMinutes: 180,
  fairness: { ensureNewcomer: true, maxAssignments: 2, maxAssignmentsForPriority: 2 },
  weights: { recency: 0.25, rating: 0.2, completionRecency: 0.15, completionQuality: 0.2, earningsBalance: 0.1, inclusion: 0.1 },
};

const ADDITIONAL_FREELANCERS = [
  {
    firstName: 'Sasha',
    lastName: 'Strategist',
    email: 'sasha.freelancer@gigvora.com',
  },
  {
    firstName: 'Imani',
    lastName: 'Producer',
    email: 'imani.freelancer@gigvora.com',
  },
];

async function ensureFreelancers(queryInterface, transaction) {
  const now = new Date();
  const emails = ADDITIONAL_FREELANCERS.map((freelancer) => freelancer.email);
  const existing = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );
  const existingByEmail = new Map(existing.map((row) => [row.email, row.id]));
  const toCreate = ADDITIONAL_FREELANCERS.filter((freelancer) => !existingByEmail.has(freelancer.email)).map((freelancer) => ({
    firstName: freelancer.firstName,
    lastName: freelancer.lastName,
    email: freelancer.email,
    password: HASHED_PASSWORD,
    address: 'Remote contributor',
    status: 'active',
    userType: 'freelancer',
    twoFactorEnabled: true,
    twoFactorMethod: 'email',
    createdAt: now,
    updatedAt: now,
  }));

  if (toCreate.length) {
    await queryInterface.bulkInsert('users', toCreate, { transaction });
  }

  const freelancers = await queryInterface.sequelize.query(
    'SELECT id, email FROM users WHERE email IN (:emails)',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { emails },
    },
  );

  return new Map(freelancers.map((row) => [row.email, row.id]));
}

async function resolveUserIdByEmail(queryInterface, transaction, email) {
  const [user] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );
  return user ? user.id : null;
}

async function resolveProjectId(queryInterface, transaction) {
  const [project] = await queryInterface.sequelize.query(
    'SELECT id FROM projects WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: PROJECT_TITLE },
    },
  );

  if (project) {
    return project.id;
  }

  const now = new Date();
  const [created] = await queryInterface.bulkInsert(
    'projects',
    [
      {
        title: PROJECT_TITLE,
        description: 'Auto-match demo project instrumentation.',
        status: 'in_progress',
        visibility: 'workspace',
        createdAt: now,
        updatedAt: now,
      },
    ],
    { transaction, returning: ['id'] },
  );

  if (created && created.id) {
    return created.id;
  }

  const [fallback] = await queryInterface.sequelize.query(
    'SELECT id FROM projects WHERE title = :title LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { title: PROJECT_TITLE },
    },
  );

  return fallback ? fallback.id : null;
}

async function fetchQueueEntryIds(queryInterface, transaction, projectId) {
  if (!projectId) return [];
  const rows = await queryInterface.sequelize.query(
    'SELECT id FROM auto_assign_queue_entries WHERE "targetType" = :targetType AND "targetId" = :projectId',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { targetType: 'project', projectId },
    },
  );
  return rows.map((row) => row.id);
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const previousFailureAt = new Date(now.getTime() - 45 * 60 * 1000);

      const freelancerMap = await ensureFreelancers(queryInterface, transaction);
      const leoId = await resolveUserIdByEmail(queryInterface, transaction, 'leo@gigvora.com');
      const sashaId = freelancerMap.get('sasha.freelancer@gigvora.com');
      const imaniId = freelancerMap.get('imani.freelancer@gigvora.com');
      const actorId = await resolveUserIdByEmail(queryInterface, transaction, 'mia@gigvora.com');
      const projectId = await resolveProjectId(queryInterface, transaction);

      if (!projectId || !leoId || !sashaId || !imaniId || !actorId) {
        throw new Error('Unable to seed auto-assign demo data: missing project or user records.');
      }

      const existingEntries = await fetchQueueEntryIds(queryInterface, transaction, projectId);
      if (existingEntries.length) {
        await queryInterface.bulkDelete(
          'auto_assign_responses',
          { queueEntryId: { [Op.in]: existingEntries } },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'auto_assign_queue_entries',
          { id: { [Op.in]: existingEntries } },
          { transaction },
        );
      }

      await queryInterface.bulkDelete(
        'project_assignment_events',
        {
          projectId,
          eventType: {
            [Op.in]: [
              'auto_assign_queue_generated',
              'auto_assign_queue_regenerated',
              'auto_assign_queue_exhausted',
              'auto_assign_queue_failed',
            ],
          },
        },
        { transaction },
      );

      const metadataBase = {
        projectName: PROJECT_TITLE,
        generatedAt: now.toISOString(),
        generatedBy: actorId,
        version: '2024.12.command-center',
        fairness: {
          ensuredNewcomer: true,
          newcomerFreelancerId: leoId,
          maxAssignments: AUTO_ASSIGN_SETTINGS.fairness.maxAssignments,
          maxAssignmentsForPriority: AUTO_ASSIGN_SETTINGS.fairness.maxAssignmentsForPriority,
        },
        weights: AUTO_ASSIGN_SETTINGS.weights,
      };

      const queueEntries = [
        {
          targetType: 'project',
          targetId: projectId,
          freelancerId: leoId,
          score: 0.9187,
          priorityBucket: 1,
          status: 'notified',
          notifiedAt: now,
          expiresAt,
          projectValue: 8200,
          metadata: {
            ...metadataBase,
            breakdown: { totalAssigned: 6, totalCompleted: 5 },
          },
          responseMetadata: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          targetType: 'project',
          targetId: projectId,
          freelancerId: sashaId,
          score: 0.8821,
          priorityBucket: 2,
          status: 'pending',
          notifiedAt: null,
          expiresAt,
          projectValue: 8200,
          metadata: {
            ...metadataBase,
            breakdown: { totalAssigned: 3, totalCompleted: 2 },
          },
          responseMetadata: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          targetType: 'project',
          targetId: projectId,
          freelancerId: imaniId,
          score: 0.8614,
          priorityBucket: 3,
          status: 'accepted',
          notifiedAt: new Date(now.getTime() - 90 * 60 * 1000),
          resolvedAt: new Date(now.getTime() - 35 * 60 * 1000),
          expiresAt,
          projectValue: 8200,
          metadata: {
            ...metadataBase,
            breakdown: { totalAssigned: 8, totalCompleted: 7 },
            resolvedBy: actorId,
            resolvedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
            resolution: {
              status: 'accepted',
              rating: 4.8,
              completionValue: 5200,
              reasonCode: null,
              reasonLabel: 'Offer accepted',
              responseNotes: 'Confirmed kickoff for Monday.',
            },
          },
          responseMetadata: {
            responseTimeSeconds: 3300,
            rating: 4.8,
            completionValue: 5200,
            updatedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
            actorId,
          },
          createdAt: new Date(now.getTime() - 95 * 60 * 1000),
          updatedAt: now,
        },
      ];

      await queryInterface.bulkInsert('auto_assign_queue_entries', queueEntries, { transaction });

      const insertedEntries = await queryInterface.sequelize.query(
        'SELECT id, "freelancerId", status FROM auto_assign_queue_entries WHERE "targetType" = :targetType AND "targetId" = :projectId',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { targetType: 'project', projectId },
        },
      );

      const entryByFreelancer = new Map(insertedEntries.map((row) => [row.freelancerId, row]));
      const acceptedEntry = entryByFreelancer.get(imaniId);

      if (acceptedEntry) {
        await queryInterface.bulkInsert(
          'auto_assign_responses',
          [
            {
              queueEntryId: acceptedEntry.id,
              freelancerId: imaniId,
              status: 'accepted',
              respondedBy: actorId,
              respondedAt: new Date(now.getTime() - 35 * 60 * 1000),
              reasonCode: null,
              reasonLabel: 'Committed to project',
              responseNotes: 'Ready to join the instrumentation squad.',
              metadata: {
                responseTimeSeconds: 3300,
                rating: 4.8,
                completionValue: 5200,
                followUpScheduledAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
              },
              createdAt: new Date(now.getTime() - 35 * 60 * 1000),
              updatedAt: new Date(now.getTime() - 35 * 60 * 1000),
            },
          ],
          { transaction },
        );
      }

      await queryInterface.bulkInsert(
        'project_assignment_events',
        [
          {
            projectId,
            actorId,
            eventType: 'auto_assign_queue_failed',
            payload: {
              message: 'Auto-match regeneration blocked by fairness constraints.',
              reason: 'No eligible freelancers met newcomer guarantees.',
              settings: AUTO_ASSIGN_SETTINGS,
            },
            createdAt: previousFailureAt,
            updatedAt: previousFailureAt,
          },
          {
            projectId,
            actorId,
            eventType: 'auto_assign_queue_generated',
            payload: {
              queueSize: 2,
              settings: AUTO_ASSIGN_SETTINGS,
            },
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkUpdate(
        'projects',
        {
          autoAssignEnabled: true,
          autoAssignStatus: 'queue_active',
          autoAssignSettings: AUTO_ASSIGN_SETTINGS,
          autoAssignLastRunAt: now,
          autoAssignLastQueueSize: 2,
        },
        { id: projectId },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const freelancerEmails = ADDITIONAL_FREELANCERS.map((freelancer) => freelancer.email);
      const projectIds = await queryInterface.sequelize.query(
        'SELECT id FROM projects WHERE title = :title',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { title: PROJECT_TITLE },
        },
      );

      for (const project of projectIds) {
        const entryIds = await fetchQueueEntryIds(queryInterface, transaction, project.id);
        if (entryIds.length) {
          await queryInterface.bulkDelete(
            'auto_assign_responses',
            { queueEntryId: { [Op.in]: entryIds } },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'auto_assign_queue_entries',
            { id: { [Op.in]: entryIds } },
            { transaction },
          );
        }

        await queryInterface.bulkDelete(
          'project_assignment_events',
          {
            projectId: project.id,
            eventType: {
              [Op.in]: [
                'auto_assign_queue_generated',
                'auto_assign_queue_regenerated',
                'auto_assign_queue_exhausted',
                'auto_assign_queue_failed',
              ],
            },
          },
          { transaction },
        );

        await queryInterface.bulkUpdate(
          'projects',
          {
            autoAssignEnabled: false,
            autoAssignStatus: 'inactive',
            autoAssignSettings: null,
            autoAssignLastRunAt: null,
            autoAssignLastQueueSize: 0,
          },
          { id: project.id },
          { transaction },
        );
      }

      if (freelancerEmails.length) {
        await queryInterface.bulkDelete('users', { email: { [Op.in]: freelancerEmails } }, { transaction });
      }
    });
  },
};
