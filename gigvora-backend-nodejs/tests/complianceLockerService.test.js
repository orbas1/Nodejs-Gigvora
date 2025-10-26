import { describe, it, expect, beforeEach } from '@jest/globals';
import './setupTestEnv.js';
import {
  ComplianceReminder,
  ComplianceLocalization,
  ConsentPolicy,
  ConsentPolicyVersion,
  UserConsent,
  LegalDocument,
  LegalDocumentVersion,
  LegalDocumentAuditEvent,
} from '../src/models/index.js';
import {
  createComplianceDocument,
  getComplianceLockerOverview,
  addComplianceDocumentVersion,
  acknowledgeComplianceReminder,
} from '../src/services/complianceLockerService.js';
import { createUser } from './helpers/factories.js';

function daysFromNow(days) {
  const base = new Date();
  base.setDate(base.getDate() + days);
  return base;
}

describe('complianceLockerService', () => {
  let owner;
  let complianceManager;

  beforeEach(async () => {
    owner = await createUser({ userType: 'freelancer', email: 'owner@locker.test' });
    complianceManager = await createUser({ userType: 'admin', email: 'compliance@locker.test' });

    await ComplianceLocalization.bulkCreate([
      {
        framework: 'GDPR',
        region: 'EU',
        requirement: 'Maintain data processing agreements and DPIAs for EU resident data.',
        guidance: 'Ensure renewals happen every 12 months and log DPIA outputs.',
        recommendedDocumentTypes: ['msa', 'security_addendum'],
        questionnaireUrl: 'https://compliance.example/gdpr/dpia',
      },
      {
        framework: 'SOC2',
        region: 'global',
        requirement: 'Track confidentiality clauses and security incidents for SOC 2 readiness.',
        guidance: 'Map vendor obligations to trust service criteria with evidence attachments.',
        recommendedDocumentTypes: ['msa', 'nda'],
      },
    ]);

    const policy = await ConsentPolicy.create({
      code: 'privacy_notice',
      title: 'Privacy Notice',
      audience: 'freelancer',
      region: 'global',
      legalBasis: 'contract',
      required: true,
      revocable: false,
      retentionPeriodDays: 365,
    });
    const policyVersion = await ConsentPolicyVersion.create({
      policyId: policy.id,
      version: 1,
      documentUrl: 'https://policies.example/privacy',
      summary: 'Initial policy baseline',
      effectiveAt: daysFromNow(-180),
    });
    await policy.update({ activeVersionId: policyVersion.id });
    await UserConsent.create({
      userId: owner.id,
      policyId: policy.id,
      policyVersionId: policyVersion.id,
      status: 'granted',
      grantedAt: daysFromNow(-14),
      source: 'self_service',
    });

    const legalDocument = await LegalDocument.create({
      slug: 'terms-of-service',
      title: 'Terms of Service',
      category: 'terms',
      status: 'active',
      region: 'global',
      defaultLocale: 'en',
      audienceRoles: ['freelancer'],
      editorRoles: ['legal'],
      tags: ['compliance'],
      summary: 'Gigvora platform terms for all freelancers.',
    });
    const legalVersion = await LegalDocumentVersion.create({
      documentId: legalDocument.id,
      version: 1,
      locale: 'en',
      status: 'published',
      effectiveAt: daysFromNow(-200),
      publishedAt: daysFromNow(-200),
      summary: 'Initial release of platform terms.',
      changeSummary: 'Original publication.',
    });
    await legalDocument.update({ activeVersionId: legalVersion.id, publishedAt: daysFromNow(-200) });
    await LegalDocumentAuditEvent.create({
      documentId: legalDocument.id,
      versionId: legalVersion.id,
      action: 'published',
      actorId: 'mentor@gigvora.com',
      actorType: 'admin',
      metadata: { summary: 'Initial platform terms publication' },
    });
  });

  it('creates a compliance record with obligations and reminders and returns aggregated overview', async () => {
    const document = await createComplianceDocument(
      {
        ownerId: owner.id,
        title: 'Acme Corp Master Services Agreement',
        documentType: 'msa',
        status: 'active',
        storageProvider: 'r2',
        storagePath: 'vault/acme/msa-v1.pdf',
        jurisdiction: 'EU',
        governingLaw: 'UK',
        effectiveDate: daysFromNow(-60),
        expiryDate: daysFromNow(120),
        tags: ['enterprise', 'priority'],
        metadata: { retention: '7_years', insuranceRequired: true },
        version: {
          fileKey: 'vault/acme/msa-v1.pdf',
          fileName: 'msa.pdf',
          mimeType: 'application/pdf',
          fileSize: 245678,
          changeSummary: 'Initial signature',
          uploadedById: complianceManager.id,
          signedAt: daysFromNow(-58),
          signedByName: 'Jordan Client',
        },
        obligations: [
          {
            clauseReference: '4.2',
            description: 'Maintain professional indemnity coverage of $2M.',
            status: 'open',
            dueAt: daysFromNow(14),
            assigneeId: owner.id,
            priority: 'high',
          },
          {
            clauseReference: '7.1',
            description: 'Complete GDPR DPIA refresh.',
            status: 'in_progress',
            dueAt: daysFromNow(-3),
          },
        ],
        reminders: [
          {
            reminderType: 'renewal',
            dueAt: daysFromNow(30),
            status: 'scheduled',
          },
          {
            reminderType: 'insurance_verification',
            clauseReference: '4.2',
            dueAt: daysFromNow(7),
            status: 'scheduled',
            createdById: complianceManager.id,
          },
        ],
      },
      { actorId: complianceManager.id },
    );

    expect(document.ownerId).toBe(owner.id);
    expect(document.status).toBe('active');
    expect(document.versions).toHaveLength(1);
    expect(document.obligations).toHaveLength(2);
    expect(document.reminders).toHaveLength(1);
    const indemnity = document.obligations.find((item) => item.clauseReference === '4.2');
    expect(indemnity?.reminders).toHaveLength(1);

    const overview = await getComplianceLockerOverview(owner.id, { limit: 10, region: 'EU' });

    expect(overview.summary.totals.totalDocuments).toBe(1);
    expect(overview.summary.totals.activeDocuments).toBe(1);
    expect(overview.summary.typeCounts.msa).toBe(1);
    expect(overview.summary.renewals).toHaveLength(1);
    expect(overview.summary.obligations.open).toBeGreaterThanOrEqual(1);
    expect(overview.summary.reminders.upcoming).toBeGreaterThanOrEqual(1);
    expect(overview.documents.list[0].obligations).toHaveLength(2);
    expect(overview.documents.list[0].reminders).toHaveLength(1);
    expect(overview.frameworks.map((item) => item.framework)).toEqual(expect.arrayContaining(['GDPR', 'SOC2']));
    expect(overview.auditLog.length).toBeGreaterThanOrEqual(1);
    expect(overview.auditLog.some((event) => event.type === 'legal_audit')).toBe(true);
    expect(overview.legalPolicies.summary.total).toBeGreaterThanOrEqual(1);
    expect(overview.legalPolicies.summary.acknowledged).toBeGreaterThanOrEqual(1);
    expect(overview.legalPolicies.list[0].acknowledgement.status).toBe('granted');
    expect(overview.legalDocuments.summary.total).toBeGreaterThanOrEqual(1);
    expect(overview.legalDocuments.list[0].activeVersion).not.toBeNull();
  });

  it('adds a new document version and acknowledges reminders', async () => {
    const created = await createComplianceDocument(
      {
        ownerId: owner.id,
        title: 'Confidentiality and IP Agreement',
        documentType: 'nda',
        status: 'awaiting_signature',
        storageProvider: 'r2',
        storagePath: 'vault/acme/nda-v1.pdf',
        effectiveDate: daysFromNow(-10),
        expiryDate: daysFromNow(45),
        version: {
          fileKey: 'vault/acme/nda-v1.pdf',
          fileName: 'nda.pdf',
          mimeType: 'application/pdf',
          fileSize: 10240,
          changeSummary: 'Draft issued',
          uploadedById: complianceManager.id,
        },
        reminders: [
          {
            reminderType: 'signature_followup',
            dueAt: daysFromNow(-1),
            status: 'sent',
            createdById: complianceManager.id,
          },
        ],
      },
      { actorId: complianceManager.id },
    );

    const versionResult = await addComplianceDocumentVersion(created.id, {
      fileKey: 'vault/acme/nda-v2.pdf',
      fileName: 'nda-v2.pdf',
      mimeType: 'application/pdf',
      fileSize: 11240,
      changeSummary: 'Countersigned version uploaded',
      signedAt: daysFromNow(-2),
      signedByName: 'Jordan Client',
      status: 'active',
    }, { actorId: complianceManager.id });

    expect(versionResult.document.status).toBe('active');
    expect(versionResult.version.versionNumber).toBe(2);

    const reminderRecord = await ComplianceReminder.findOne({ where: { documentId: created.id } });
    expect(reminderRecord.status).toBe('sent');

    const acknowledgement = await acknowledgeComplianceReminder(reminderRecord.id, 'acknowledged', {
      actorId: owner.id,
    });

    expect(acknowledgement.status).toBe('acknowledged');
    expect(acknowledgement.acknowledgedAt).not.toBeNull();

    const overview = await getComplianceLockerOverview(owner.id, { region: 'global' });
    const documentEntry = overview.documents.list.find((item) => item.id === created.id);
    expect(documentEntry.versions[0].versionNumber).toBe(2);
    expect(overview.summary.totals.totalDocuments).toBe(1);
    expect(overview.summary.reminders.overdue).toBeGreaterThanOrEqual(0);
  });
});
