'use strict';

const FLAGS_TABLE = 'feature_flags';
const ASSIGNMENTS_TABLE = 'feature_flag_assignments';

const FLAG_DEFINITIONS = [
  {
    key: 'ops-runtime-hardening',
    name: 'Ops runtime hardening',
    description: 'Gates incident tooling refreshes and elevated logging for runtime coordinators.',
    status: 'active',
    rolloutType: 'global',
    rolloutPercentage: null,
    metadata: { owner: 'platform-ops', playbook: 'operational-readiness' },
    assignments: [],
  },
  {
    key: 'workspace-ai-suggestions',
    name: 'Workspace AI suggestions',
    description: 'Enables AI-powered recommendations across project and mentoring workspaces.',
    status: 'active',
    rolloutType: 'percentage',
    rolloutPercentage: 35.0,
    metadata: { owner: 'product-insights', jiraEpic: 'AIPLATFORM-142' },
    assignments: [
      {
        audienceType: 'workspace',
        audienceValue: 'mentor_hub',
        rolloutPercentage: 50.0,
        conditions: { minimumMembershipTier: 'growth' },
        expiresAt: null,
      },
      {
        audienceType: 'workspace',
        audienceValue: 'project_mission_control',
        rolloutPercentage: null,
        conditions: { cohort: 'beta_2025_q1' },
        expiresAt: null,
      },
    ],
  },
  {
    key: 'domain-experiment-mentorship',
    name: 'Mentorship domain experiment',
    description: 'Rolls domain-specific mentorship experiments to selected partner organisations.',
    status: 'draft',
    rolloutType: 'cohort',
    rolloutPercentage: null,
    metadata: { owner: 'mentorship', experimentWindow: '2025-Q1' },
    assignments: [
      {
        audienceType: 'domain',
        audienceValue: 'mentorship',
        rolloutPercentage: null,
        conditions: { geography: ['emea', 'apac'] },
        expiresAt: new Date(Date.UTC(2025, 5, 30)),
      },
      {
        audienceType: 'membership',
        audienceValue: 'enterprise',
        rolloutPercentage: null,
        conditions: { minSeats: 50 },
        expiresAt: null,
      },
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const definition of FLAG_DEFINITIONS) {
        const existingId = await queryInterface.rawSelect(
          FLAGS_TABLE,
          { where: { key: definition.key }, transaction },
          ['id'],
        );

        const now = new Date();
        let flagId = existingId;

        const basePayload = {
          key: definition.key,
          name: definition.name,
          description: definition.description,
          status: definition.status,
          rolloutType: definition.rolloutType,
          rolloutPercentage: definition.rolloutPercentage,
          metadata: definition.metadata,
        };

        if (flagId) {
          await queryInterface.bulkUpdate(
            FLAGS_TABLE,
            { ...basePayload, updatedAt: now },
            { id: flagId },
            { transaction },
          );
        } else {
          await queryInterface.bulkInsert(
            FLAGS_TABLE,
            [{ ...basePayload, createdAt: now, updatedAt: now }],
            { transaction },
          );
          flagId = await queryInterface.rawSelect(
            FLAGS_TABLE,
            { where: { key: definition.key }, transaction },
            ['id'],
          );
        }

        await queryInterface.bulkDelete(ASSIGNMENTS_TABLE, { flagId }, { transaction });

        if (definition.assignments.length > 0) {
          const assignmentRows = definition.assignments.map((assignment) => ({
            flagId,
            audienceType: assignment.audienceType,
            audienceValue: assignment.audienceValue,
            rolloutPercentage: assignment.rolloutPercentage,
            conditions: assignment.conditions,
            expiresAt: assignment.expiresAt,
            createdAt: now,
            updatedAt: now,
          }));

          await queryInterface.bulkInsert(ASSIGNMENTS_TABLE, assignmentRows, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const definition of FLAG_DEFINITIONS) {
        const flagId = await queryInterface.rawSelect(
          FLAGS_TABLE,
          { where: { key: definition.key }, transaction },
          ['id'],
        );

        if (!flagId) {
          continue;
        }

        await queryInterface.bulkDelete(ASSIGNMENTS_TABLE, { flagId }, { transaction });
        await queryInterface.bulkDelete(FLAGS_TABLE, { id: flagId }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
