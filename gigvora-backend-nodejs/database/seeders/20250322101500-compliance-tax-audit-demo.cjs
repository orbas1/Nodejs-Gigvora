'use strict';

const { QueryTypes } = require('sequelize');

const SEED_KEY = 'compliance-tax-audit-demo';
const FREELANCER_EMAIL = 'leo@gigvora.com';
const WORKSPACE_SLUG = 'lumen-analytics-ats';

function buildDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date;
}

async function resolveFreelancerId(queryInterface, transaction) {
  const [record] = await queryInterface.sequelize.query(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    {
      replacements: { email: FREELANCER_EMAIL },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  if (!record?.id) {
    throw new Error(`Seed prerequisite missing freelancer ${FREELANCER_EMAIL}`);
  }
  return record.id;
}

async function resolveWorkspaceId(queryInterface, transaction) {
  const [workspace] = await queryInterface.sequelize.query(
    'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
    {
      replacements: { slug: WORKSPACE_SLUG },
      type: QueryTypes.SELECT,
      transaction,
    },
  );
  if (!workspace?.id) {
    throw new Error(`Seed prerequisite missing workspace ${WORKSPACE_SLUG}`);
  }
  return workspace.id;
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const freelancerId = await resolveFreelancerId(queryInterface, transaction);
      const workspaceId = await resolveWorkspaceId(queryInterface, transaction);
      const now = new Date();

      const estimatePayloads = [
        {
          freelancerId,
          dueDate: buildDate(45),
          amount: 2850.75,
          currencyCode: 'USD',
          status: 'due_soon',
          notes: 'Quarterly estimate for US federal taxes.',
          metadata: { seedKey: SEED_KEY, taxYear: new Date().getFullYear() },
        },
        {
          freelancerId,
          dueDate: buildDate(220),
          amount: 4100,
          currencyCode: 'USD',
          status: 'on_track',
          notes: 'Advance projection for EU VAT obligations on cross-border work.',
          metadata: { seedKey: SEED_KEY, jurisdiction: 'EU' },
        },
      ];

      for (const payload of estimatePayloads) {
        const existingId = await queryInterface.rawSelect(
          'freelancer_tax_estimates',
          {
            where: {
              freelancerId: payload.freelancerId,
              dueDate: payload.dueDate,
              status: payload.status,
            },
            transaction,
          },
          ['id'],
        );
        if (!existingId) {
          await queryInterface.bulkInsert(
            'freelancer_tax_estimates',
            [
              {
                ...payload,
                metadata: payload.metadata,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const filings = [
        {
          key: 'us-annual',
          name: `US Form 1040 ${new Date().getFullYear() - 1}`,
          jurisdiction: 'United States',
          dueDate: buildDate(25),
          status: 'in_progress',
          metadata: {
            taxYear: new Date().getFullYear() - 1,
            seedKey: SEED_KEY,
            amount: 3200,
          },
        },
        {
          key: 'ca-gst',
          name: 'Canada GST/HST Q1 Filing',
          jurisdiction: 'Canada',
          dueDate: buildDate(60),
          status: 'not_started',
          metadata: {
            taxYear: new Date().getFullYear(),
            seedKey: SEED_KEY,
            amount: 980,
          },
        },
        {
          key: 'es-vat',
          name: 'Spain IVA Q4 Submission',
          jurisdiction: 'Spain',
          dueDate: buildDate(-10),
          status: 'overdue',
          metadata: {
            taxYear: new Date().getFullYear() - 1,
            seedKey: SEED_KEY,
            amount: 640,
          },
        },
      ];

      const filingIdByKey = new Map();

      for (const filing of filings) {
        const where = {
          freelancerId,
          name: filing.name,
          dueDate: filing.dueDate,
        };
        let filingId = await queryInterface.rawSelect(
          'freelancer_tax_filings',
          { where, transaction },
          ['id'],
        );
        if (!filingId) {
          await queryInterface.bulkInsert(
            'freelancer_tax_filings',
            [
              {
                freelancerId,
                name: filing.name,
                jurisdiction: filing.jurisdiction,
                dueDate: filing.dueDate,
                status: filing.status,
                submittedAt: null,
                metadata: filing.metadata,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
          filingId = await queryInterface.rawSelect(
            'freelancer_tax_filings',
            { where, transaction },
            ['id'],
          );
        }
        filingIdByKey.set(filing.key, filingId);
      }

      const documentDefinitions = [
        {
          filingKey: 'us-annual',
          title: 'US Annual Return Package',
          storagePath: 'tax/2025/03/us-annual-return.pdf',
          fileName: 'us-annual-return.pdf',
          mimeType: 'application/pdf',
        },
        {
          filingKey: 'ca-gst',
          title: 'GST Remittance Receipt',
          storagePath: 'tax/2025/03/ca-gst-remittance.pdf',
          fileName: 'ca-gst-remittance.pdf',
          mimeType: 'application/pdf',
        },
      ];

      for (const definition of documentDefinitions) {
        const filingId = filingIdByKey.get(definition.filingKey);
        if (!filingId) {
          continue;
        }

        const filingMetadata = filings.find((item) => item.key === definition.filingKey)?.metadata ?? {};

        const existingDocumentId = await queryInterface.rawSelect(
          'compliance_documents',
          {
            where: {
              ownerId: freelancerId,
              storagePath: definition.storagePath,
            },
            transaction,
          },
          ['id'],
        );

        let documentId = existingDocumentId;
        if (!documentId) {
          await queryInterface.bulkInsert(
            'compliance_documents',
            [
              {
                ownerId: freelancerId,
                workspaceId,
                title: definition.title,
                documentType: 'tax',
                status: 'active',
                storageProvider: 'filesystem',
                storagePath: definition.storagePath,
                storageRegion: 'us-east-1',
                latestVersionId: null,
                jurisdiction: filings.find((item) => item.key === definition.filingKey)?.jurisdiction ?? null,
                effectiveDate: filings.find((item) => item.key === definition.filingKey)?.dueDate ?? null,
                tags: ['tax', `tax-year-${filingMetadata.taxYear ?? ''}`].filter(Boolean),
                metadata: {
                  seedKey: SEED_KEY,
                  taxFilingId: filingId,
                  taxYear: filingMetadata.taxYear ?? null,
                },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );

          const [created] = await queryInterface.sequelize.query(
            'SELECT id FROM compliance_documents WHERE ownerId = :ownerId AND storagePath = :storagePath ORDER BY id DESC LIMIT 1',
            {
              replacements: { ownerId: freelancerId, storagePath: definition.storagePath },
              type: QueryTypes.SELECT,
              transaction,
            },
          );
          documentId = created?.id;
        }

        if (!documentId) {
          continue;
        }

        const [versionExists] = await queryInterface.sequelize.query(
          'SELECT id FROM compliance_document_versions WHERE documentId = :documentId AND fileKey = :fileKey LIMIT 1',
          {
            replacements: { documentId, fileKey: definition.storagePath },
            type: QueryTypes.SELECT,
            transaction,
          },
        );

        let versionId = versionExists?.id;
        if (!versionId) {
          await queryInterface.bulkInsert(
            'compliance_document_versions',
            [
              {
                documentId,
                versionNumber: 1,
                fileKey: definition.storagePath,
                fileName: definition.fileName,
                mimeType: definition.mimeType,
                fileSize: 524288,
                sha256: 'seeded-tax-doc',
                uploadedById: freelancerId,
                metadata: { seedKey: SEED_KEY },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );

          const [insertedVersion] = await queryInterface.sequelize.query(
            'SELECT id FROM compliance_document_versions WHERE documentId = :documentId ORDER BY versionNumber DESC LIMIT 1',
            {
              replacements: { documentId },
              type: QueryTypes.SELECT,
              transaction,
            },
          );
          versionId = insertedVersion?.id;
        }

        if (versionId) {
          await queryInterface.bulkUpdate(
            'compliance_documents',
            { latestVersionId: versionId },
            { id: documentId },
            { transaction },
          );

          await queryInterface.bulkUpdate(
            'freelancer_tax_filings',
            {
              metadata: {
                ...(filings.find((entry) => entry.key === definition.filingKey)?.metadata ?? {}),
                seedKey: SEED_KEY,
                taxYear: filingMetadata.taxYear ?? null,
                documentId,
                documentVersionId: versionId,
              },
              updatedAt: now,
            },
            { id: filingId },
            { transaction },
          );
        }

        const existingReminder = await queryInterface.rawSelect(
          'compliance_reminders',
          {
            where: {
              documentId,
              reminderType: 'submission_deadline',
              dueAt: filings.find((entry) => entry.key === definition.filingKey)?.dueDate ?? now,
            },
            transaction,
          },
          ['id'],
        );

        if (!existingReminder) {
          await queryInterface.bulkInsert(
            'compliance_reminders',
            [
              {
                documentId,
                obligationId: null,
                reminderType: 'submission_deadline',
                dueAt: filings.find((entry) => entry.key === definition.filingKey)?.dueDate ?? now,
                status: 'scheduled',
                channel: 'email',
                createdById: null,
                sentAt: null,
                acknowledgedAt: null,
                metadata: { seedKey: SEED_KEY, taxFilingId: filingId },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const auditLogs = [
        {
          auditType: 'identity_verification_review',
          region: 'North America',
          status: 'in_progress',
          escalationLevel: 'priority',
          openedAt: buildDate(-4),
          closedAt: null,
          findingsCount: 3,
          severityScore: 72.5,
          metadata: {
            seedKey: SEED_KEY,
            signals: ['selfie_mismatch', 'document_expiring'],
          },
        },
        {
          auditType: 'tax_document_submission',
          region: 'EMEA',
          status: 'scheduled',
          escalationLevel: 'standard',
          openedAt: buildDate(2),
          closedAt: null,
          findingsCount: 0,
          severityScore: 38.4,
          metadata: {
            seedKey: SEED_KEY,
            reviewers: ['EMEA Compliance Desk'],
          },
        },
        {
          auditType: 'wallet_release_override',
          region: 'APAC',
          status: 'completed',
          escalationLevel: 'executive',
          openedAt: buildDate(-30),
          closedAt: buildDate(-25),
          findingsCount: 1,
          severityScore: 88.1,
          metadata: {
            seedKey: SEED_KEY,
            resolution: 'Payout released after multi-factor escalation.',
          },
        },
      ];

      for (const log of auditLogs) {
        const existingAuditId = await queryInterface.rawSelect(
          'compliance_audit_logs',
          {
            where: {
              workspaceId,
              auditType: log.auditType,
              openedAt: log.openedAt,
            },
            transaction,
          },
          ['id'],
        );
        if (!existingAuditId) {
          await queryInterface.bulkInsert(
            'compliance_audit_logs',
            [
              {
                workspaceId,
                auditType: log.auditType,
                region: log.region,
                status: log.status,
                escalationLevel: log.escalationLevel,
                openedAt: log.openedAt,
                closedAt: log.closedAt,
                findingsCount: log.findingsCount,
                severityScore: log.severityScore,
                metadata: log.metadata,
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
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
      await queryInterface.bulkDelete(
        'compliance_audit_logs',
        { "metadata->>'seedKey'": SEED_KEY },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'compliance_reminders',
        { "metadata->>'seedKey'": SEED_KEY },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'compliance_document_versions',
        { "metadata->>'seedKey'": SEED_KEY },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'compliance_documents',
        { "metadata->>'seedKey'": SEED_KEY },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'freelancer_tax_filings',
        { "metadata->>'seedKey'": SEED_KEY },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'freelancer_tax_estimates',
        { "metadata->>'seedKey'": SEED_KEY },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
