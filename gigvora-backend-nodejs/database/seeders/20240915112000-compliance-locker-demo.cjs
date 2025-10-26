'use strict';

const { QueryTypes, Op } = require('sequelize');

const ownerEmail = 'leo@gigvora.com';
const complianceEmail = 'mentor@gigvora.com';
const policyCode = 'executive_platform_terms';
const policyVersion = 2025;
const consentSource = 'locker_seed';
const seedActor = 'seed:compliance-locker-demo';
const legalSlug = 'gigvora-platform-terms';
const legalVersionNumber = 3;
const documentTitle = 'Atlas Labs Master Services Agreement';
const documentStoragePath = 'locker/atlas/msa-v2.pdf';
const reminderTypes = ['renewal', 'insurance_verification'];
const obligationClauses = ['4.2', '7.1'];
const DAY = 24 * 60 * 60 * 1000;

async function findUserId(queryInterface, transaction, email) {
  const [row] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      type: QueryTypes.SELECT,
      transaction,
      replacements: { email },
    },
  );
  return row?.id ?? null;
}

async function ensureLocalization(queryInterface, transaction, payload) {
  const where = { framework: payload.framework, region: payload.region };
  const existingId = await queryInterface.rawSelect('compliance_localizations', { where, transaction }, ['id']);
  const record = {
    framework: payload.framework,
    region: payload.region,
    requirement: payload.requirement,
    guidance: payload.guidance,
    recommendedDocumentTypes: payload.recommendedDocumentTypes,
    questionnaireUrl: payload.questionnaireUrl,
    metadata: payload.metadata,
    updatedAt: payload.timestamp,
  };
  if (existingId) {
    await queryInterface.bulkUpdate('compliance_localizations', record, { id: existingId }, { transaction });
    return existingId;
  }
  await queryInterface.bulkInsert(
    'compliance_localizations',
    [
      {
        ...record,
        createdAt: payload.timestamp,
      },
    ],
    { transaction },
  );
  return queryInterface.rawSelect('compliance_localizations', { where, transaction }, ['id']);
}

async function ensureConsentPolicy(queryInterface, transaction, now) {
  const where = { code: policyCode };
  const existingId = await queryInterface.rawSelect('consent_policies', { where, transaction }, ['id']);
  const record = {
    code: policyCode,
    title: 'Executive Platform Terms Acknowledgement',
    description: 'Agreement covering data residency, confidentiality, and compliance locker duties for executive founders.',
    audience: 'freelancer',
    region: 'global',
    legalBasis: 'contract',
    required: true,
    revocable: false,
    retentionPeriodDays: 730,
    metadata: { seed: seedActor, owner: 'Compliance Office' },
    createdBy: seedActor,
    updatedBy: seedActor,
    updatedAt: now,
  };
  if (existingId) {
    await queryInterface.bulkUpdate('consent_policies', record, { id: existingId }, { transaction });
    return existingId;
  }
  await queryInterface.bulkInsert(
    'consent_policies',
    [
      {
        ...record,
        createdAt: now,
      },
    ],
    { transaction },
  );
  return queryInterface.rawSelect('consent_policies', { where, transaction }, ['id']);
}

async function ensureConsentPolicyVersion(queryInterface, transaction, policyId, now) {
  const where = { policyId, version: policyVersion };
  const existingId = await queryInterface.rawSelect('consent_policy_versions', { where, transaction }, ['id']);
  const record = {
    policyId,
    version: policyVersion,
    documentUrl: 'https://legal.gigvora.com/platform-terms/v3',
    summary: 'FY25 refresh adding compliance locker responsibilities and EU data residency coverage.',
    effectiveAt: new Date(now.getTime() - 45 * DAY),
    supersededAt: null,
    createdBy: seedActor,
    metadata: { seed: seedActor, revision: 'FY25' },
    updatedAt: now,
  };
  if (existingId) {
    await queryInterface.bulkUpdate('consent_policy_versions', record, { id: existingId }, { transaction });
    return existingId;
  }
  await queryInterface.bulkInsert(
    'consent_policy_versions',
    [
      {
        ...record,
        createdAt: now,
      },
    ],
    { transaction },
  );
  return queryInterface.rawSelect('consent_policy_versions', { where, transaction }, ['id']);
}

async function ensureUserConsent(queryInterface, transaction, policyId, policyVersionId, userId, now) {
  const where = { userId, policyId };
  const existingId = await queryInterface.rawSelect('user_consents', { where, transaction }, ['id']);
  const record = {
    userId,
    policyId,
    policyVersionId,
    status: 'granted',
    grantedAt: new Date(now.getTime() - 30 * DAY),
    withdrawnAt: null,
    source: consentSource,
    metadata: { seed: seedActor },
    updatedAt: now,
  };
  if (existingId) {
    await queryInterface.bulkUpdate('user_consents', record, { id: existingId }, { transaction });
    return existingId;
  }
  await queryInterface.bulkInsert(
    'user_consents',
    [
      {
        ...record,
        createdAt: now,
      },
    ],
    { transaction },
  );
  return queryInterface.rawSelect('user_consents', { where, transaction }, ['id']);
}

async function ensureComplianceDocument(queryInterface, transaction, ownerId, workspaceId, uploadedById, now) {
  const where = { ownerId, storagePath: documentStoragePath };
  const existingId = await queryInterface.rawSelect('compliance_documents', { where, transaction }, ['id']);
  const record = {
    ownerId,
    workspaceId,
    title: documentTitle,
    documentType: 'msa',
    status: 'active',
    storageProvider: 'r2',
    storagePath: documentStoragePath,
    storageRegion: 'eu-west-1',
    counterpartyName: 'Atlas Labs',
    counterpartyEmail: 'legal@atlaslabs.example',
    counterpartyCompany: 'Atlas Labs Ltd',
    jurisdiction: 'EU',
    governingLaw: 'UK',
    effectiveDate: new Date(now.getTime() - 120 * DAY),
    expiryDate: new Date(now.getTime() + 210 * DAY),
    renewalTerms: 'Auto-renews annually with 90-day termination notice.',
    tags: ['enterprise', 'priority', 'atlas-labs'],
    metadata: { seed: seedActor, frameworks: ['gdpr', 'soc2'] },
    obligationSummary: 'Renew DPIA, insurance certificates, and vendor questionnaires ahead of FY25 renewal.',
    updatedAt: now,
  };
  let documentId = existingId;
  if (existingId) {
    await queryInterface.bulkUpdate('compliance_documents', record, { id: existingId }, { transaction });
  } else {
    await queryInterface.bulkInsert(
      'compliance_documents',
      [
        {
          ...record,
          createdAt: now,
        },
      ],
      { transaction },
    );
    documentId = await queryInterface.rawSelect('compliance_documents', { where, transaction }, ['id']);
  }

  const versionWhere = { documentId, versionNumber: 2 };
  const existingVersionId = await queryInterface.rawSelect('compliance_document_versions', { where: versionWhere, transaction }, ['id']);
  const versionRecord = {
    documentId,
    versionNumber: 2,
    fileKey: documentStoragePath,
    fileName: 'atlas-msa-v2.pdf',
    mimeType: 'application/pdf',
    fileSize: 524288,
    sha256: '9c0e1c041c3f8af0b3cb285785c8d9186cf7b0dcb84546e3e349e7d8346a2cb1',
    uploadedById,
    signedAt: new Date(now.getTime() - 115 * DAY),
    signedByName: 'Jordan Client',
    signedByEmail: 'legal@atlaslabs.example',
    auditTrail: {
      envelopeId: 'atlas-msa-fy25',
      signedIp: '203.0.113.17',
    },
    changeSummary: 'Renewed for FY25 with EU data residency annex.',
    metadata: { seed: seedActor },
    updatedAt: now,
  };
  let versionId = existingVersionId;
  if (existingVersionId) {
    await queryInterface.bulkUpdate('compliance_document_versions', versionRecord, { id: existingVersionId }, { transaction });
  } else {
    await queryInterface.bulkInsert(
      'compliance_document_versions',
      [
        {
          ...versionRecord,
          createdAt: now,
        },
      ],
      { transaction },
    );
    versionId = await queryInterface.rawSelect('compliance_document_versions', { where: versionWhere, transaction }, ['id']);
  }

  await queryInterface.bulkUpdate('compliance_documents', { latestVersionId: versionId, updatedAt: now }, { id: documentId }, { transaction });

  const obligations = [
    {
      clauseReference: '4.2',
      description: 'Maintain professional indemnity insurance coverage of $2M and submit renewed certificate.',
      status: 'open',
      dueAt: new Date(now.getTime() + 14 * DAY),
      assigneeId: ownerId,
      priority: 'high',
    },
    {
      clauseReference: '7.1',
      description: 'Complete GDPR DPIA refresh for Atlas Labs engagement.',
      status: 'in_progress',
      dueAt: new Date(now.getTime() - 3 * DAY),
      assigneeId: null,
      priority: 'medium',
    },
  ];

  for (const obligation of obligations) {
    const obligationWhere = { documentId, clauseReference: obligation.clauseReference };
    const existingObligationId = await queryInterface.rawSelect('compliance_obligations', { where: obligationWhere, transaction }, ['id']);
    const obligationRecord = {
      documentId,
      clauseReference: obligation.clauseReference,
      description: obligation.description,
      status: obligation.status,
      dueAt: obligation.dueAt,
      completedAt: null,
      assigneeId: obligation.assigneeId,
      priority: obligation.priority,
      escalations: null,
      metadata: { seed: seedActor },
      updatedAt: now,
    };
    if (existingObligationId) {
      await queryInterface.bulkUpdate('compliance_obligations', obligationRecord, { id: existingObligationId }, { transaction });
    } else {
      await queryInterface.bulkInsert(
        'compliance_obligations',
        [
          {
            ...obligationRecord,
            createdAt: now,
          },
        ],
        { transaction },
      );
    }
  }

  const indemnityId = await queryInterface.rawSelect(
    'compliance_obligations',
    { where: { documentId, clauseReference: '4.2' }, transaction },
    ['id'],
  );

  const reminders = [
    {
      reminderType: 'renewal',
      dueAt: new Date(now.getTime() + 60 * DAY),
      status: 'scheduled',
      obligationId: null,
    },
    {
      reminderType: 'insurance_verification',
      dueAt: new Date(now.getTime() + 7 * DAY),
      status: 'scheduled',
      obligationId: indemnityId,
    },
  ];

  for (const reminder of reminders) {
    const reminderWhere = { documentId, reminderType: reminder.reminderType };
    const existingReminderId = await queryInterface.rawSelect('compliance_reminders', { where: reminderWhere, transaction }, ['id']);
    const reminderRecord = {
      documentId,
      obligationId: reminder.obligationId,
      reminderType: reminder.reminderType,
      dueAt: reminder.dueAt,
      status: reminder.status,
      channel: 'email',
      createdById: uploadedById,
      sentAt: null,
      acknowledgedAt: null,
      metadata: { seed: seedActor },
      updatedAt: now,
    };
    if (existingReminderId) {
      await queryInterface.bulkUpdate('compliance_reminders', reminderRecord, { id: existingReminderId }, { transaction });
    } else {
      await queryInterface.bulkInsert(
        'compliance_reminders',
        [
          {
            ...reminderRecord,
            createdAt: now,
          },
        ],
        { transaction },
      );
    }
  }

  return documentId;
}

async function ensureLegalDocument(queryInterface, transaction, now) {
  const where = { slug: legalSlug };
  const existingId = await queryInterface.rawSelect('legal_documents', { where, transaction }, ['id']);
  const record = {
    slug: legalSlug,
    title: 'Gigvora Platform Terms',
    category: 'terms',
    status: 'active',
    region: 'global',
    defaultLocale: 'en',
    audienceRoles: ['freelancer', 'mentor'],
    editorRoles: ['legal', 'compliance'],
    tags: ['terms', 'compliance'],
    summary: 'Binding platform terms that govern compliance locker usage, payment schedules, and dispute handling.',
    metadata: { seed: seedActor, contact: 'legal@gigvora.com' },
    publishedAt: new Date(now.getTime() - 200 * DAY),
    retiredAt: null,
    updatedAt: now,
  };
  let legalDocumentId = existingId;
  if (existingId) {
    await queryInterface.bulkUpdate('legal_documents', record, { id: existingId }, { transaction });
  } else {
    await queryInterface.bulkInsert(
      'legal_documents',
      [
        {
          ...record,
          createdAt: now,
        },
      ],
      { transaction },
    );
    legalDocumentId = await queryInterface.rawSelect('legal_documents', { where, transaction }, ['id']);
  }

  const versionWhere = { documentId: legalDocumentId, version: legalVersionNumber };
  const existingVersionId = await queryInterface.rawSelect('legal_document_versions', { where: versionWhere, transaction }, ['id']);
  const versionRecord = {
    documentId: legalDocumentId,
    version: legalVersionNumber,
    locale: 'en',
    status: 'published',
    effectiveAt: new Date(now.getTime() - 200 * DAY),
    publishedAt: new Date(now.getTime() - 200 * DAY),
    supersededAt: null,
    summary: 'FY25 platform terms refresh covering compliance locker rollout and privacy guardrails.',
    changeSummary: 'Adds compliance locker policies, vendor diligence appendix, and dispute escalation windows.',
    externalUrl: 'https://legal.gigvora.com/platform-terms/v3',
    metadata: { seed: seedActor, revision: 'FY25' },
    updatedAt: now,
  };
  let versionId = existingVersionId;
  if (existingVersionId) {
    await queryInterface.bulkUpdate('legal_document_versions', versionRecord, { id: existingVersionId }, { transaction });
  } else {
    await queryInterface.bulkInsert(
      'legal_document_versions',
      [
        {
          ...versionRecord,
          createdAt: now,
        },
      ],
      { transaction },
    );
    versionId = await queryInterface.rawSelect('legal_document_versions', { where: versionWhere, transaction }, ['id']);
  }

  await queryInterface.bulkUpdate('legal_documents', { activeVersionId: versionId, updatedAt: now }, { id: legalDocumentId }, { transaction });

  const auditWhere = { documentId: legalDocumentId, versionId, action: 'published', actorId: complianceEmail };
  const existingAuditId = await queryInterface.rawSelect('legal_document_audit_events', { where: auditWhere, transaction }, ['id']);
  if (existingAuditId) {
    await queryInterface.bulkUpdate(
      'legal_document_audit_events',
      {
        documentId: legalDocumentId,
        versionId,
        action: 'published',
        actorId: complianceEmail,
        actorType: 'admin',
        metadata: { seed: seedActor, summary: 'Platform terms republished for FY25 compliance locker launch.' },
        updatedAt: now,
      },
      { id: existingAuditId },
      { transaction },
    );
  } else {
    await queryInterface.bulkInsert(
      'legal_document_audit_events',
      [
        {
          documentId: legalDocumentId,
          versionId,
          action: 'published',
          actorId: complianceEmail,
          actorType: 'admin',
          metadata: { seed: seedActor, summary: 'Platform terms republished for FY25 compliance locker launch.' },
          createdAt: now,
          updatedAt: now,
        },
      ],
      { transaction },
    );
  }

  return legalDocumentId;
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const ownerId = await findUserId(queryInterface, transaction, ownerEmail);
      const complianceManagerId = await findUserId(queryInterface, transaction, complianceEmail);

      if (!ownerId || !complianceManagerId) {
        throw new Error('Compliance locker demo seed requires base demo users to exist.');
      }

      const workspaceId = await queryInterface.rawSelect('provider_workspaces', { where: { ownerId }, transaction }, ['id']);

      await ensureLocalization(queryInterface, transaction, {
        framework: 'GDPR',
        region: 'EU',
        requirement: 'Maintain DPIA renewals, vendor risk assessments, and consent logs across EU engagements.',
        guidance: 'Privacy champions should review open obligations every quarter with compliance office sign-off.',
        recommendedDocumentTypes: ['msa', 'policy_acknowledgment'],
        questionnaireUrl: 'https://compliance.gigvora.demo/gdpr/dpia',
        metadata: { seed: seedActor },
        timestamp: now,
      });
      await ensureLocalization(queryInterface, transaction, {
        framework: 'SOC2',
        region: 'global',
        requirement: 'Track confidentiality clauses, change management approvals, and breach notifications for SOC 2 readiness.',
        guidance: 'Map renewal reminders to Trust Service Criteria and archive evidence snapshots quarterly.',
        recommendedDocumentTypes: ['msa', 'security_addendum', 'policy_acknowledgment'],
        questionnaireUrl: null,
        metadata: { seed: seedActor },
        timestamp: now,
      });

      const policyId = await ensureConsentPolicy(queryInterface, transaction, now);
      const policyVersionId = await ensureConsentPolicyVersion(queryInterface, transaction, policyId, now);
      await queryInterface.bulkUpdate('consent_policies', { activeVersionId: policyVersionId, updatedAt: now }, { id: policyId }, { transaction });
      await ensureUserConsent(queryInterface, transaction, policyId, policyVersionId, ownerId, now);

      await ensureComplianceDocument(queryInterface, transaction, ownerId, workspaceId, complianceManagerId, now);
      await ensureLegalDocument(queryInterface, transaction, now);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const ownerId = await findUserId(queryInterface, transaction, ownerEmail);

      if (ownerId) {
        const documentId = await queryInterface.rawSelect(
          'compliance_documents',
          { where: { ownerId, storagePath: documentStoragePath }, transaction },
          ['id'],
        );
        if (documentId) {
          await queryInterface.bulkDelete(
            'compliance_reminders',
            { documentId, reminderType: { [Op.in]: reminderTypes } },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'compliance_obligations',
            { documentId, clauseReference: { [Op.in]: obligationClauses } },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'compliance_document_versions',
            { documentId, versionNumber: 2, fileKey: documentStoragePath },
            { transaction },
          );
          await queryInterface.bulkDelete(
            'compliance_documents',
            { id: documentId, storagePath: documentStoragePath },
            { transaction },
          );
        }
      }

      await queryInterface.bulkDelete(
        'compliance_localizations',
        {
          [Op.or]: [
            { framework: 'GDPR', region: 'EU' },
            { framework: 'SOC2', region: 'global' },
          ],
        },
        { transaction },
      );

      const policyId = await queryInterface.rawSelect('consent_policies', { where: { code: policyCode }, transaction }, ['id']);
      if (policyId) {
        await queryInterface.bulkDelete('user_consents', { policyId, source: consentSource }, { transaction });
        await queryInterface.bulkDelete('consent_policy_versions', { policyId, version: policyVersion }, { transaction });
        const deletedPolicies = await queryInterface.bulkDelete(
          'consent_policies',
          { id: policyId, code: policyCode, createdBy: seedActor },
          { transaction },
        );
        if (!deletedPolicies) {
          await queryInterface.bulkUpdate('consent_policies', { activeVersionId: null, updatedAt: new Date() }, { id: policyId }, { transaction });
        }
      }

      const legalDocumentId = await queryInterface.rawSelect('legal_documents', { where: { slug: legalSlug }, transaction }, ['id']);
      if (legalDocumentId) {
        await queryInterface.bulkDelete(
          'legal_document_audit_events',
          { documentId: legalDocumentId, action: 'published', actorId: complianceEmail },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'legal_document_versions',
          { documentId: legalDocumentId, version: legalVersionNumber },
          { transaction },
        );
        await queryInterface.bulkDelete(
          'legal_documents',
          { id: legalDocumentId, slug: legalSlug },
          { transaction },
        );
      }
    });
  },
};
