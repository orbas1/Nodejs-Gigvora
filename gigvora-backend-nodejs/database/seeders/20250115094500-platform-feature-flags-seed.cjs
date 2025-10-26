'use strict';

const { QueryTypes } = require('sequelize');

const FLAGS = [
  {
    key: 'mobile-app-beta',
    name: 'Mobile Companion Beta',
    description:
      'Controls staged access to the Gigvora mobile companion experience across iOS and Android while operations monitors stability.',
    status: 'active',
    rolloutType: 'percentage',
    rolloutPercentage: 25,
    metadata: { productArea: 'mobile', rolloutOwner: 'mobile-ops' },
    assignments: [
      {
        audienceType: 'membership',
        audienceValue: 'founder',
        rolloutPercentage: 25,
      },
      {
        audienceType: 'domain',
        audienceValue: 'gigvora.com',
        rolloutPercentage: 100,
      },
    ],
  },
  {
    key: 'mobile-profiles-ai-insights',
    name: 'Mobile Profiles AI Insights',
    description:
      'Enables AI generated annotations within mobile profile dashboards once compliance reviews messaging and data usage.',
    status: 'disabled',
    rolloutType: 'cohort',
    rolloutPercentage: null,
    metadata: { productArea: 'mobile', rolloutOwner: 'ai-governance' },
    assignments: [
      {
        audienceType: 'membership',
        audienceValue: 'mentor',
        rolloutPercentage: 50,
      },
      {
        audienceType: 'user',
        audienceValue: '501',
        rolloutPercentage: 100,
      },
    ],
  },
];

async function upsertFlag(queryInterface, transaction, flag) {
  const now = new Date();
  const [existing] = await queryInterface.sequelize.query(
    'SELECT id FROM feature_flags WHERE key = :key LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { key: flag.key },
    },
  );

  let flagId = existing?.id ?? null;
  if (flagId) {
    await queryInterface.bulkUpdate(
      'feature_flags',
      {
        name: flag.name,
        description: flag.description,
        status: flag.status,
        rolloutType: flag.rolloutType,
        rolloutPercentage: flag.rolloutPercentage,
        metadata: flag.metadata,
        updatedAt: now,
      },
      { id: flagId },
      { transaction },
    );
  } else {
    await queryInterface.bulkInsert(
      'feature_flags',
      [
        {
          key: flag.key,
          name: flag.name,
          description: flag.description,
          status: flag.status,
          rolloutType: flag.rolloutType,
          rolloutPercentage: flag.rolloutPercentage,
          metadata: flag.metadata,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { transaction },
    );
    const [inserted] = await queryInterface.sequelize.query(
      'SELECT id FROM feature_flags WHERE key = :key LIMIT 1',
      {
        type: QueryTypes.SELECT,
        transaction,
        replacements: { key: flag.key },
      },
    );
    flagId = inserted?.id ?? null;
  }

  if (!flagId) {
    throw new Error(`Unable to resolve feature flag id for ${flag.key}`);
  }

  await queryInterface.bulkDelete('feature_flag_assignments', { flagId }, { transaction });

  if (Array.isArray(flag.assignments) && flag.assignments.length) {
    await queryInterface.bulkInsert(
      'feature_flag_assignments',
      flag.assignments.map((assignment) => ({
        flagId,
        audienceType: assignment.audienceType,
        audienceValue: assignment.audienceValue,
        rolloutPercentage: assignment.rolloutPercentage,
        conditions: assignment.conditions ?? null,
        expiresAt: assignment.expiresAt ?? null,
        createdAt: now,
        updatedAt: now,
      })),
      { transaction },
    );
  }
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const flag of FLAGS) {
        await upsertFlag(queryInterface, transaction, flag);
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const flag of FLAGS) {
        const [row] = await queryInterface.sequelize.query(
          'SELECT id FROM feature_flags WHERE key = :key LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { key: flag.key },
          },
        );
        if (row?.id) {
          await queryInterface.bulkDelete('feature_flag_assignments', { flagId: row.id }, { transaction });
          await queryInterface.bulkDelete('feature_flags', { id: row.id }, { transaction });
        }
      }
    });
  },
};
