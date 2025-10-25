'use strict';

const { Op } = require('sequelize');

const FRAMEWORKS = [
  {
    slug: 'soc2-type-ii',
    name: 'SOC 2 Type II',
    owner: 'Trust & Compliance',
    region: 'US & UK',
    status: 'active',
    type: 'attestation',
    automationCoverage: 78,
    renewalCadenceMonths: 12,
    controls: [
      'Quarterly access reviews',
      'Immutable audit log retention',
      'Change management approvals with rollback automation',
    ],
    metadata: {
      lastUpdatedBy: 'Alana Singh',
      lastUpdatedById: 901,
      lastUpdatedAt: new Date().toISOString(),
    },
  },
  {
    slug: 'iso-27001',
    name: 'ISO 27001',
    owner: 'Security Engineering',
    region: 'Global',
    status: 'active',
    type: 'certification',
    automationCoverage: 84,
    renewalCadenceMonths: 12,
    controls: [
      'Automated asset inventory',
      'Continuous vulnerability scanning',
      'Disaster recovery testing',
    ],
    metadata: {
      lastUpdatedBy: 'Ibrahim Patel',
      lastUpdatedById: 904,
      lastUpdatedAt: new Date().toISOString(),
    },
  },
  {
    slug: 'gdpr',
    name: 'GDPR',
    owner: 'Privacy Operations',
    region: 'EU',
    status: 'planning',
    type: 'regulation',
    automationCoverage: 66,
    renewalCadenceMonths: 6,
    controls: [
      'DPIA automation templates',
      'Subject access response tracker',
      'Vendor risk scoring',
    ],
    metadata: {
      lastUpdatedBy: 'Leah Gomez',
      lastUpdatedById: 917,
      lastUpdatedAt: new Date().toISOString(),
    },
  },
];

const AUDITS = [
  {
    frameworkSlug: 'soc2-type-ii',
    name: 'SOC 2 FY2025 Examination',
    auditFirm: 'KPMG',
    status: 'scheduled',
    startDate: new Date(new Date().getFullYear(), 6, 8),
    endDate: new Date(new Date().getFullYear(), 7, 2),
    scope: 'Production infrastructure, vendor management, support operations',
    deliverables: ['SOC 2 report', 'Management letter', 'Exception remediation log'],
    metadata: { engagementManager: 'Jasmine Cole' },
  },
  {
    frameworkSlug: 'iso-27001',
    name: 'ISO Surveillance Audit',
    auditFirm: 'BSI',
    status: 'in_progress',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 3),
    scope: 'Annex A controls, business continuity, supplier risk',
    deliverables: ['Surveillance statement', 'Improvement actions'],
    metadata: { engagementManager: 'Nisha Ahmed' },
  },
];

const OBLIGATIONS = [
  {
    title: 'AI-assisted matching DPIA refresh',
    owner: 'Privacy Operations',
    status: 'in_progress',
    riskRating: 'high',
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 12),
    frameworkSlugs: ['gdpr'],
    notes: 'Update DPIA for new recommendation engine rollout and align mitigations with privacy champions.',
    evidenceRequired: true,
    metadata: { jiraKey: 'COMP-214' },
  },
  {
    title: 'Vendor risk review – SendGrid',
    owner: 'Vendor Management',
    status: 'awaiting_evidence',
    riskRating: 'medium',
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5),
    frameworkSlugs: ['soc2-type-ii', 'iso-27001'],
    notes: 'Collect updated subprocessor attestations and penetration test report.',
    evidenceRequired: true,
    metadata: { jiraKey: 'COMP-198' },
  },
  {
    title: 'Annual incident response tabletop',
    owner: 'Trust & Safety',
    status: 'backlog',
    riskRating: 'medium',
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10),
    frameworkSlugs: ['soc2-type-ii', 'iso-27001'],
    notes: 'Coordinate joint exercise across engineering, success, and exec teams with executive summary output.',
    evidenceRequired: false,
    metadata: { playbook: 'ir-runbook-v3' },
  },
];

const EVIDENCE = [
  {
    obligationTitle: 'Vendor risk review – SendGrid',
    description: 'SendGrid SOC 2 report uploaded to compliance locker.',
    submittedById: 1044,
    submittedByName: 'Dana Wright',
    source: 'compliance-locker',
    fileUrl: 's3://compliance-locker/sendgrid/soc2-2024.pdf',
    metadata: { storageBucket: 'compliance-locker', checksum: '5e9c3d1b' },
  },
];

async function findFrameworkId(queryInterface, transaction, slug) {
  return queryInterface.rawSelect(
    'admin_compliance_frameworks',
    { where: { slug }, transaction },
    ['id'],
  );
}

async function upsertFramework(queryInterface, transaction, payload) {
  const existingId = await findFrameworkId(queryInterface, transaction, payload.slug);
  const now = new Date();
  const record = {
    slug: payload.slug,
    name: payload.name,
    owner: payload.owner,
    region: payload.region,
    status: payload.status,
    type: payload.type,
    automation_coverage: payload.automationCoverage,
    renewal_cadence_months: payload.renewalCadenceMonths,
    controls: payload.controls,
    metadata: payload.metadata,
    updated_at: now,
  };
  if (existingId) {
    await queryInterface.bulkUpdate('admin_compliance_frameworks', record, { id: existingId }, { transaction });
    return existingId;
  }
  await queryInterface.bulkInsert(
    'admin_compliance_frameworks',
    [
      {
        ...record,
        created_at: now,
      },
    ],
    { transaction },
  );
  return findFrameworkId(queryInterface, transaction, payload.slug);
}

async function ensureAudit(queryInterface, transaction, payload, frameworkId) {
  const where = { framework_id: frameworkId, name: payload.name };
  const existingId = await queryInterface.rawSelect('admin_compliance_audits', { where, transaction }, ['id']);
  const record = {
    framework_id: frameworkId,
    name: payload.name,
    audit_firm: payload.auditFirm,
    status: payload.status,
    start_date: payload.startDate,
    end_date: payload.endDate,
    scope: payload.scope,
    deliverables: payload.deliverables,
    metadata: payload.metadata ?? {},
    updated_at: new Date(),
  };
  if (existingId) {
    await queryInterface.bulkUpdate('admin_compliance_audits', record, { id: existingId }, { transaction });
    return existingId;
  }
  await queryInterface.bulkInsert(
    'admin_compliance_audits',
    [
      {
        ...record,
        created_at: new Date(),
      },
    ],
    { transaction },
  );
  return queryInterface.rawSelect('admin_compliance_audits', { where, transaction }, ['id']);
}

async function ensureObligation(queryInterface, transaction, payload, frameworkIds) {
  const where = { title: payload.title };
  const existingId = await queryInterface.rawSelect('admin_compliance_obligations', { where, transaction }, ['id']);
  const now = new Date();
  const record = {
    title: payload.title,
    owner: payload.owner,
    status: payload.status,
    risk_rating: payload.riskRating,
    due_date: payload.dueDate,
    framework_ids: frameworkIds,
    notes: payload.notes,
    evidence_required: payload.evidenceRequired,
    metadata: payload.metadata ?? {},
    updated_at: now,
  };
  if (existingId) {
    await queryInterface.bulkUpdate('admin_compliance_obligations', record, { id: existingId }, { transaction });
    return existingId;
  }
  await queryInterface.bulkInsert(
    'admin_compliance_obligations',
    [
      {
        ...record,
        created_at: now,
      },
    ],
    { transaction },
  );
  return queryInterface.rawSelect('admin_compliance_obligations', { where, transaction }, ['id']);
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const frameworkIds = {};
      for (const framework of FRAMEWORKS) {
        const id = await upsertFramework(queryInterface, transaction, framework);
        frameworkIds[framework.slug] = id;
      }

      for (const audit of AUDITS) {
        const frameworkId = frameworkIds[audit.frameworkSlug];
        if (frameworkId) {
          await ensureAudit(queryInterface, transaction, audit, frameworkId);
        }
      }

      const obligationIds = {};
      for (const obligation of OBLIGATIONS) {
        const ids = obligation.frameworkSlugs.map((slug) => frameworkIds[slug]).filter(Boolean);
        const obligationId = await ensureObligation(queryInterface, transaction, obligation, ids);
        obligationIds[obligation.title] = obligationId;
      }

      for (const evidence of EVIDENCE) {
        const obligationId = obligationIds[evidence.obligationTitle];
        if (!obligationId) {
          continue;
        }
        const where = { obligation_id: obligationId, description: evidence.description };
        const existingId = await queryInterface.rawSelect('admin_compliance_evidence', { where, transaction }, ['id']);
        const now = new Date();
        const record = {
          obligation_id: obligationId,
          submitted_by_id: evidence.submittedById,
          submitted_by_name: evidence.submittedByName,
          source: evidence.source,
          description: evidence.description,
          file_url: evidence.fileUrl,
          metadata: evidence.metadata ?? {},
          submitted_at: now,
          created_at: now,
          updated_at: now,
        };
        if (existingId) {
          await queryInterface.bulkUpdate('admin_compliance_evidence', record, { id: existingId }, { transaction });
        } else {
          await queryInterface.bulkInsert('admin_compliance_evidence', [record], { transaction });
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
      const frameworkSlugs = FRAMEWORKS.map((framework) => framework.slug);
      const obligationTitles = OBLIGATIONS.map((obligation) => obligation.title);

      await queryInterface.bulkDelete(
        'admin_compliance_evidence',
        { description: { [Op.in]: EVIDENCE.map((item) => item.description) } },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'admin_compliance_obligations',
        { title: obligationTitles },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'admin_compliance_audits',
        { name: AUDITS.map((audit) => audit.name) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        'admin_compliance_frameworks',
        { slug: frameworkSlugs },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
