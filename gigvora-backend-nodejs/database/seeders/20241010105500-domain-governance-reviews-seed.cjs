'use strict';

const REVIEWS = [
  {
    contextName: 'auth',
    ownerTeam: 'Identity & Access Engineering',
    dataSteward: 'Security & Compliance',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-09-30T10:00:00Z'),
    nextReviewDueAt: new Date('2025-03-31T10:00:00Z'),
    scorecard: {
      privacyImpactScore: 'A-',
      remediationItems: 1,
      automationCoverage: 0.92,
    },
    notes:
      'MFA enforcement and duplicate account reconciliation verified. Pending action: automate Portuguese localisation for downtime prompts.',
  },
  {
    contextName: 'marketplace',
    ownerTeam: 'Marketplace Delivery',
    dataSteward: 'Programme Management Office',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-09-18T14:30:00Z'),
    nextReviewDueAt: new Date('2025-02-15T14:30:00Z'),
    scorecard: {
      privacyImpactScore: 'B+',
      remediationItems: 2,
      automationCoverage: 0.81,
    },
    notes:
      'Autosave retention reduced to 45 days. Follow up on workspace export S3 lifecycle policy to satisfy client contractual clauses.',
  },
  {
    contextName: 'finance',
    ownerTeam: 'Financial Operations',
    dataSteward: 'Controller Group',
    reviewStatus: 'remediation_required',
    reviewedAt: new Date('2024-10-01T09:00:00Z'),
    nextReviewDueAt: new Date('2024-11-15T09:00:00Z'),
    scorecard: {
      privacyImpactScore: 'B',
      remediationItems: 3,
      automationCoverage: 0.74,
    },
    notes:
      'Stripe TIN tokenisation rolled out, but escrow release audit trail still missing encrypted counterparty addresses. Remediation workstream tracked in FIN-271.',
  },
  {
    contextName: 'communications',
    ownerTeam: 'Engagement Platform',
    dataSteward: 'Trust & Safety',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-08-22T16:00:00Z'),
    nextReviewDueAt: new Date('2025-01-20T16:00:00Z'),
    scorecard: {
      privacyImpactScore: 'A',
      remediationItems: 0,
      automationCoverage: 0.95,
    },
    notes: 'Abuse classifier precision and retention limits meet policy. Follow-up scheduled for EU AI Act transparency annotations.',
  },
  {
    contextName: 'governance',
    ownerTeam: 'Risk & Compliance',
    dataSteward: 'Legal Operations',
    reviewStatus: 'in_progress',
    reviewedAt: null,
    nextReviewDueAt: new Date('2024-12-05T12:00:00Z'),
    scorecard: {
      privacyImpactScore: 'Pending',
      remediationItems: 4,
      automationCoverage: 0.68,
    },
    notes:
      'Converging on ISO 27001 update. Awaiting executive approval on leadership ritual retention and anonymisation workflow for policy exports.',
  },
  {
    contextName: 'platform',
    ownerTeam: 'Platform Core',
    dataSteward: 'Site Reliability Engineering',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-09-05T08:15:00Z'),
    nextReviewDueAt: new Date('2025-01-05T08:15:00Z'),
    scorecard: {
      privacyImpactScore: 'A',
      remediationItems: 0,
      automationCoverage: 0.88,
    },
    notes: 'Feature flag audit trail now writes to metrics exporter; no open remediation items.',
  },
  {
    contextName: 'talent',
    ownerTeam: 'Talent Experience',
    dataSteward: 'Marketplace Operations',
    reviewStatus: 'approved',
    reviewedAt: new Date('2024-09-12T11:45:00Z'),
    nextReviewDueAt: new Date('2025-02-28T11:45:00Z'),
    scorecard: {
      privacyImpactScore: 'A-',
      remediationItems: 1,
      automationCoverage: 0.83,
    },
    notes:
      'Portfolio moderation automation validated. Outstanding task: finalise DSAR playbook for peer mentoring transcripts.',
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'domain_governance_reviews',
      REVIEWS.map((review) => ({
        ...review,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('domain_governance_reviews', null, {});
  },
};
