'use strict';

const { QueryTypes, Op } = require('sequelize');

const reviewContexts = ['auth-demo', 'marketplace-demo', 'governance-demo'];

function buildReview(seed) {
  return {
    contextName: seed.contextName,
    ownerTeam: seed.ownerTeam,
    dataSteward: seed.dataSteward,
    reviewStatus: seed.reviewStatus,
    reviewedAt: seed.reviewedAt,
    nextReviewDueAt: seed.nextReviewDueAt,
    scorecard: seed.scorecard,
    notes: seed.notes,
  };
}

const reviewSeeds = [
  buildReview({
    contextName: reviewContexts[0],
    ownerTeam: 'Identity & Access Engineering',
    dataSteward: 'Security & Compliance',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-09-30T10:00:00Z'),
    nextReviewDueAt: new Date('2025-03-31T10:00:00Z'),
    scorecard: { privacyImpactScore: 'A-', remediationItems: 1, automationCoverage: 0.92 },
    notes:
      'MFA enforcement and duplicate account reconciliation verified. Pending action: automate localisation for downtime prompts (demo).',
  }),
  buildReview({
    contextName: reviewContexts[1],
    ownerTeam: 'Marketplace Delivery',
    dataSteward: 'Programme Management Office',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-09-18T14:30:00Z'),
    nextReviewDueAt: new Date('2025-02-15T14:30:00Z'),
    scorecard: { privacyImpactScore: 'B+', remediationItems: 2, automationCoverage: 0.81 },
    notes: 'Autosave retention reduced to 45 days. Follow up on workspace export lifecycle policy (demo).',
  }),
  buildReview({
    contextName: reviewContexts[2],
    ownerTeam: 'Risk & Compliance',
    dataSteward: 'Legal Operations',
    reviewStatus: 'in_progress',
    reviewedAt: null,
    nextReviewDueAt: new Date('2024-12-05T12:00:00Z'),
    scorecard: { privacyImpactScore: 'Pending', remediationItems: 4, automationCoverage: 0.68 },
    notes:
      'Converging on ISO 27001 update. Awaiting executive approval on anonymisation workflow for policy exports (demo).',
  }),
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      for (const review of reviewSeeds) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM domain_governance_reviews WHERE contextName = :contextName LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { contextName: review.contextName },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'domain_governance_reviews',
          [
            {
              ...review,
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
    await queryInterface.bulkDelete('domain_governance_reviews', { contextName: { [Op.in]: reviewContexts } }, {});
  },
};
