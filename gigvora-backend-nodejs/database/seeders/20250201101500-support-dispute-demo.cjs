'use strict';

const { QueryTypes } = require('sequelize');

const SEED_KEY = 'support-dispute-demo';
const ESCROW_EXTERNAL_ID = 'seed-freelancer-jonah-escrow';
const WORKSPACE_SLUG = 'atlas-collective-ops';
const WORKFLOW_SEED_KEY = `${SEED_KEY}-workflow`;
const TRANSACTION_SEED_KEYS = {
  automation: `${SEED_KEY}-automation`,
  qa: `${SEED_KEY}-qa`,
};
const DISPUTE_SEED_KEYS = {
  open: `${SEED_KEY}-case-open`,
  awaiting: `${SEED_KEY}-case-awaiting`,
};
const TEMPLATE_SEED_KEYS = {
  global: `${SEED_KEY}-template-global`,
  workspace: `${SEED_KEY}-template-workspace`,
};

function buildMetadata(seedKey, extra = {}) {
  return JSON.stringify({ seedKey, ...extra });
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();

      const [freelancer] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: 'jonah.freelancer.demo@gigvora.com' } },
      );

      if (!freelancer?.id) {
        return;
      }

      const freelancerId = Number(freelancer.id);

      const [trustOperator] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = :email LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { email: 'lara.ops.demo@gigvora.com' } },
      );

      const trustOperatorId = trustOperator?.id ?? freelancerId;

      let escrowAccountId = await queryInterface.rawSelect(
        'escrow_accounts',
        { where: { userId: freelancerId, externalId: ESCROW_EXTERNAL_ID }, transaction },
        ['id'],
      );

      if (!escrowAccountId) {
        await queryInterface.bulkInsert(
          'escrow_accounts',
          [
            {
              userId: freelancerId,
              externalId: ESCROW_EXTERNAL_ID,
              status: 'active',
              currentBalance: 11250.75,
              pendingReleaseTotal: 3500.5,
              metadata: buildMetadata(SEED_KEY, { purpose: 'freelancer-dispute-showcase' }),
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );

        escrowAccountId = await queryInterface.rawSelect(
          'escrow_accounts',
          { where: { userId: freelancerId, externalId: ESCROW_EXTERNAL_ID }, transaction },
          ['id'],
        );
      }

      if (!escrowAccountId) {
        throw new Error('Unable to seed escrow account for dispute demo.');
      }

      const escrowTransactions = [
        {
          reference: 'seed-dispute-automation',
          status: 'in_escrow',
          amount: 2850,
          milestoneLabel: 'Automation blueprint delivery',
          scheduledReleaseAt: new Date(Date.UTC(2025, 0, 20, 17, 0, 0)),
          metadataKey: TRANSACTION_SEED_KEYS.automation,
        },
        {
          reference: 'seed-dispute-qa',
          status: 'disputed',
          amount: 1750,
          milestoneLabel: 'QA review sprint',
          scheduledReleaseAt: new Date(Date.UTC(2025, 0, 10, 14, 0, 0)),
          metadataKey: TRANSACTION_SEED_KEYS.qa,
        },
      ];

      const transactionIdMap = new Map();

      for (const record of escrowTransactions) {
        const existingId = await queryInterface.rawSelect(
          'escrow_transactions',
          { where: { reference: record.reference }, transaction },
          ['id'],
        );

        if (!existingId) {
          await queryInterface.bulkInsert(
            'escrow_transactions',
            [
              {
                accountId: escrowAccountId,
                reference: record.reference,
                type: 'project',
                status: record.status,
                amount: record.amount,
                currencyCode: 'USD',
                feeAmount: 72.5,
                netAmount: Number((record.amount - 72.5).toFixed(2)),
                initiatedById: trustOperatorId,
                counterpartyId: null,
                projectId: null,
                milestoneLabel: record.milestoneLabel,
                scheduledReleaseAt: record.scheduledReleaseAt,
                metadata: buildMetadata(record.metadataKey, { origin: SEED_KEY }),
                auditTrail: JSON.stringify({ seedKey: SEED_KEY, events: ['seeded'] }),
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }

        const transactionId = await queryInterface.rawSelect(
          'escrow_transactions',
          { where: { reference: record.reference }, transaction },
          ['id'],
        );

        if (transactionId) {
          transactionIdMap.set(record.reference, transactionId);
        }
      }

      const disputeSeeds = [
        {
          seedKey: DISPUTE_SEED_KEYS.open,
          summary: 'Clarify automation deliverables scope',
          reasonCode: 'scope_disagreement',
          priority: 'high',
          stage: 'mediation',
          status: 'open',
          assignedToId: trustOperatorId,
          transactionReference: 'seed-dispute-automation',
          customerDeadlineAt: new Date(Date.UTC(2025, 0, 18, 16, 0, 0)),
          providerDeadlineAt: new Date(Date.UTC(2025, 0, 17, 18, 0, 0)),
          openedAt: new Date(Date.UTC(2025, 0, 12, 12, 30, 0)),
          updatedAt: new Date(Date.UTC(2025, 0, 15, 11, 45, 0)),
          resolutionNotes: null,
        },
        {
          seedKey: DISPUTE_SEED_KEYS.awaiting,
          summary: 'QA adjustments before final payment',
          reasonCode: 'quality_issue',
          priority: 'urgent',
          stage: 'mediation',
          status: 'awaiting_customer',
          assignedToId: trustOperatorId,
          transactionReference: 'seed-dispute-qa',
          customerDeadlineAt: new Date(Date.UTC(2025, 0, 14, 15, 0, 0)),
          providerDeadlineAt: new Date(Date.UTC(2025, 0, 13, 15, 0, 0)),
          openedAt: new Date(Date.UTC(2025, 0, 9, 9, 15, 0)),
          updatedAt: new Date(Date.UTC(2025, 0, 15, 9, 45, 0)),
          resolutionNotes: 'Customer reviewing annotated Loom walkthrough and QA checklist.',
        },
      ];

      const disputeIdMap = new Map();

      for (const seed of disputeSeeds) {
        const transactionId = transactionIdMap.get(seed.transactionReference);
        if (!transactionId) {
          continue;
        }

        const existingId = await queryInterface.rawSelect(
          'dispute_cases',
          {
            where: queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedKey'),
              seed.seedKey,
            ),
            transaction,
          },
          ['id'],
        );

        if (!existingId) {
          await queryInterface.bulkInsert(
            'dispute_cases',
            [
              {
                escrowTransactionId: transactionId,
                openedById: freelancerId,
                assignedToId: seed.assignedToId,
                stage: seed.stage,
                status: seed.status,
                priority: seed.priority,
                reasonCode: seed.reasonCode,
                summary: seed.summary,
                customerDeadlineAt: seed.customerDeadlineAt,
                providerDeadlineAt: seed.providerDeadlineAt,
                resolutionNotes: seed.resolutionNotes,
                openedAt: seed.openedAt,
                resolvedAt: null,
                metadata: buildMetadata(seed.seedKey, { transactionReference: seed.transactionReference }),
                createdAt: seed.openedAt,
                updatedAt: seed.updatedAt,
              },
            ],
            { transaction },
          );
        }

        const disputeId = await queryInterface.rawSelect(
          'dispute_cases',
          {
            where: queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedKey'),
              seed.seedKey,
            ),
            transaction,
          },
          ['id'],
        );

        if (disputeId) {
          disputeIdMap.set(seed.seedKey, disputeId);
        }
      }

      const eventSeeds = [
        {
          seedKey: `${SEED_KEY}-event-open-intake`,
          disputeSeedKey: DISPUTE_SEED_KEYS.open,
          actorType: 'provider',
          actionType: 'comment',
          notes: 'Opened dispute to clarify automation deliverables and requested mediation support.',
          eventAt: new Date(Date.UTC(2025, 0, 12, 13, 0, 0)),
        },
        {
          seedKey: `${SEED_KEY}-event-open-review`,
          disputeSeedKey: DISPUTE_SEED_KEYS.open,
          actorType: 'mediator',
          actionType: 'status_change',
          notes: 'Trust team reviewing shared Loom walkthrough and scope document updates.',
          eventAt: new Date(Date.UTC(2025, 0, 15, 11, 45, 0)),
          context: { stage: 'mediation', status: 'open' },
        },
        {
          seedKey: `${SEED_KEY}-event-awaiting-intake`,
          disputeSeedKey: DISPUTE_SEED_KEYS.awaiting,
          actorType: 'provider',
          actionType: 'comment',
          notes: 'Submitted QA revision notes with annotated checklist for customer review.',
          eventAt: new Date(Date.UTC(2025, 0, 9, 9, 30, 0)),
        },
        {
          seedKey: `${SEED_KEY}-event-awaiting-extension`,
          disputeSeedKey: DISPUTE_SEED_KEYS.awaiting,
          actorType: 'mediator',
          actionType: 'deadline_adjusted',
          notes: 'Customer requested 24 additional hours to validate the revised assets.',
          eventAt: new Date(Date.UTC(2025, 0, 14, 12, 0, 0)),
          context: {
            customerDeadlineAt: new Date(Date.UTC(2025, 0, 14, 15, 0, 0)).toISOString(),
            providerDeadlineAt: new Date(Date.UTC(2025, 0, 13, 15, 0, 0)).toISOString(),
          },
        },
      ];

      for (const seed of eventSeeds) {
        const disputeId = disputeIdMap.get(seed.disputeSeedKey);
        if (!disputeId) {
          continue;
        }

        const existingId = await queryInterface.rawSelect(
          'dispute_events',
          {
            where: queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedKey'),
              seed.seedKey,
            ),
            transaction,
          },
          ['id'],
        );

        if (!existingId) {
          await queryInterface.bulkInsert(
            'dispute_events',
            [
              {
                disputeCaseId: disputeId,
                actorId: seed.actorType === 'provider' ? freelancerId : trustOperatorId,
                actorType: seed.actorType,
                actionType: seed.actionType,
                notes: seed.notes,
                eventAt: seed.eventAt,
                metadata: buildMetadata(seed.seedKey, {
                  disputeSeedKey: seed.disputeSeedKey,
                  context: seed.context ?? null,
                }),
                createdAt: seed.eventAt,
                updatedAt: seed.eventAt,
              },
            ],
            { transaction },
          );
        }
      }

      const [workspace] = await queryInterface.sequelize.query(
        'SELECT id FROM provider_workspaces WHERE slug = :slug LIMIT 1',
        { type: QueryTypes.SELECT, transaction, replacements: { slug: WORKSPACE_SLUG } },
      );

      const workspaceId = workspace?.id ?? null;

      if (workspaceId) {
        const existingWorkflowId = await queryInterface.rawSelect(
          'dispute_workflow_settings',
          {
            where: queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedKey'),
              WORKFLOW_SEED_KEY,
            ),
            transaction,
          },
          ['id'],
        );

        if (!existingWorkflowId) {
          await queryInterface.bulkInsert(
            'dispute_workflow_settings',
            [
              {
                workspaceId,
                defaultAssigneeId: trustOperatorId,
                responseSlaHours: 6,
                resolutionSlaHours: 48,
                autoEscalateHours: 72,
                autoCloseHours: null,
                evidenceRequirements: JSON.stringify([
                  { type: 'document', label: 'Contract or SOW excerpt', required: true },
                  { type: 'media', label: 'Annotated walkthrough video', required: false },
                  { type: 'checklist', label: 'Customer confirmation checklist', required: false },
                ]),
                notificationEmails: JSON.stringify(['trust@gigvora.demo']),
                metadata: buildMetadata(WORKFLOW_SEED_KEY, { workspaceSlug: WORKSPACE_SLUG }),
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const templateSeeds = [
        {
          seedKey: TEMPLATE_SEED_KEYS.global,
          workspaceId: null,
          name: 'Quality assurance dispute playbook',
          reasonCode: 'quality_issue',
          defaultStage: 'intake',
          defaultPriority: 'medium',
          guidance:
            'Acknowledge the customer within two hours, gather annotated evidence, and outline the mediation path with clear checkpoints.',
          checklist: [
            'Send personalised acknowledgement with expected next update time.',
            'Collect annotated deliverables and QA notes from the provider.',
            'Align on acceptance criteria with the customer before committing next steps.',
          ],
        },
        {
          seedKey: TEMPLATE_SEED_KEYS.workspace,
          workspaceId,
          name: 'Automation scope mediation',
          reasonCode: 'scope_disagreement',
          defaultStage: 'mediation',
          defaultPriority: 'high',
          guidance:
            'Review signed scope, highlight confirmed deliverables, and document agreed adjustments with deadlines and owners.',
          checklist: [
            'Review scope excerpt alongside latest changelog notes.',
            'Capture agreed adjustments with customer and provider sign-off.',
            'Update dispute deadlines and assigned owner before closing the session.',
          ],
        },
      ];

      for (const seed of templateSeeds) {
        if (seed.workspaceId === null && seed.seedKey === TEMPLATE_SEED_KEYS.workspace && !workspaceId) {
          continue;
        }

        const existingTemplateId = await queryInterface.rawSelect(
          'dispute_templates',
          {
            where: queryInterface.sequelize.where(
              queryInterface.sequelize.json('metadata.seedKey'),
              seed.seedKey,
            ),
            transaction,
          },
          ['id'],
        );

        if (!existingTemplateId) {
          await queryInterface.bulkInsert(
            'dispute_templates',
            [
              {
                workspaceId: seed.workspaceId ?? null,
                name: seed.name,
                reasonCode: seed.reasonCode,
                defaultStage: seed.defaultStage,
                defaultPriority: seed.defaultPriority,
                guidance: seed.guidance,
                checklist: JSON.stringify(seed.checklist),
                active: true,
                createdById: trustOperatorId,
                updatedById: trustOperatorId,
                metadata: buildMetadata(seed.seedKey, { workspaceSlug: seed.workspaceId ? WORKSPACE_SLUG : null }),
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const disputeSeedKeys = Object.values(DISPUTE_SEED_KEYS);
      const transactionSeedKeys = Object.values(TRANSACTION_SEED_KEYS);
      const templateSeedKeys = Object.values(TEMPLATE_SEED_KEYS);

      await queryInterface.sequelize.query(
        "DELETE FROM dispute_templates WHERE metadata->>'seedKey' IN (:seedKeys)",
        { transaction, replacements: { seedKeys: templateSeedKeys } },
      );

      await queryInterface.sequelize.query(
        "DELETE FROM dispute_workflow_settings WHERE metadata->>'seedKey' = :seedKey",
        { transaction, replacements: { seedKey: WORKFLOW_SEED_KEY } },
      );

      await queryInterface.sequelize.query(
        "DELETE FROM dispute_cases WHERE metadata->>'seedKey' IN (:seedKeys)",
        { transaction, replacements: { seedKeys: disputeSeedKeys } },
      );

      await queryInterface.sequelize.query(
        "DELETE FROM escrow_transactions WHERE metadata->>'seedKey' IN (:seedKeys)",
        { transaction, replacements: { seedKeys: transactionSeedKeys } },
      );

      await queryInterface.sequelize.query(
        "DELETE FROM escrow_accounts WHERE externalId = :externalId AND metadata->>'seedKey' = :seedKey",
        { transaction, replacements: { externalId: ESCROW_EXTERNAL_ID, seedKey: SEED_KEY } },
      );
    });
  },
};
