'use strict';

const { QueryTypes, Op } = require('sequelize');

const seedInvoices = ['DEMO-RET-2024-08', 'DEMO-REV-2024-08', 'DEMO-PASSIVE-2024-07'];
const seedVendors = ['Demo Software Stack', 'Demo Subcontractor Collective', 'Demo Compliance Review'];
const seedGoals = ['Demo runway reserve', 'Demo sabbatical fund'];
const seedBatchName = 'Demo August retainers';
const seedScenarios = ['demo-retainer-base', 'demo-retainer-stretch'];
const seedExportKey = 'demo-tax-export-2024';

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

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();
      const userId = await findUserId(queryInterface, transaction, 'leo@gigvora.com');

      if (!userId) {
        throw new Error('Finance control tower seed requires leo@gigvora.com to exist.');
      }

      const revenueRows = [
        {
          revenueType: 'retainer',
          status: 'recognized',
          source: 'workspace',
          clientName: 'Atlas Labs',
          invoiceNumber: seedInvoices[0],
          amount: 14200,
          currencyCode: 'USD',
          taxWithholdingAmount: 4260,
          taxCategory: 'services',
          recognizedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          metadata: { seed: 'finance-demo' },
        },
        {
          revenueType: 'one_off',
          status: 'recognized',
          source: 'gig',
          clientName: 'Nova Agency',
          invoiceNumber: seedInvoices[1],
          amount: 7200,
          currencyCode: 'USD',
          taxWithholdingAmount: 2160,
          taxCategory: 'creative_services',
          recognizedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
          metadata: { seed: 'finance-demo' },
        },
        {
          revenueType: 'passive',
          status: 'recognized',
          source: 'course',
          clientName: 'Gigvora Learning',
          invoiceNumber: seedInvoices[2],
          amount: 1600,
          currencyCode: 'USD',
          taxWithholdingAmount: 480,
          taxCategory: 'digital_product',
          recognizedAt: new Date(now.getTime() - 33 * 24 * 60 * 60 * 1000),
          metadata: { seed: 'finance-demo' },
        },
      ];

      for (const entry of revenueRows) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM finance_revenue_entries WHERE userId = :userId AND invoiceNumber = :invoice LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, invoice: entry.invoiceNumber },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'finance_revenue_entries',
          [
            {
              userId,
              ...entry,
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const expenseRows = [
        {
          category: 'Software & tooling',
          vendorName: seedVendors[0],
          cadence: 'Monthly',
          amount: 1120,
          notes: 'Design collaboration and prototyping suite.',
        },
        {
          category: 'Subcontractors',
          vendorName: seedVendors[1],
          cadence: 'Per project',
          amount: 3400,
          notes: 'Motion design partner support.',
        },
        {
          category: 'Professional services',
          vendorName: seedVendors[2],
          cadence: 'Quarterly',
          amount: 1980,
          notes: 'Contract review and compliance audit.',
        },
      ];

      for (const expense of expenseRows) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM finance_expense_entries WHERE userId = :userId AND vendorName = :vendor LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, vendor: expense.vendorName },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'finance_expense_entries',
          [
            {
              userId,
              ...expense,
              status: 'posted',
              currencyCode: 'USD',
              occurredAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
              isTaxDeductible: true,
              receiptUrl: null,
              metadata: { seed: 'finance-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const goalRows = [
        {
          name: seedGoals[0],
          targetAmount: 9000,
          currentAmount: 5850,
          automationType: 'fixed_transfer',
          automationAmount: 750,
          automationCadence: 'monthly',
          isRunwayReserve: true,
        },
        {
          name: seedGoals[1],
          targetAmount: 12000,
          currentAmount: 4560,
          automationType: 'percentage_income',
          automationAmount: 0.2,
          automationCadence: 'per_invoice',
          isRunwayReserve: false,
        },
      ];

      for (const goal of goalRows) {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM finance_savings_goals WHERE userId = :userId AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, name: goal.name },
          },
        );
        if (existing?.id) continue;
        await queryInterface.bulkInsert(
          'finance_savings_goals',
          [
            {
              userId,
              ...goal,
              status: 'active',
              currencyCode: 'USD',
              lastContributionAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
              metadata: { seed: 'finance-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingBatch] = await queryInterface.sequelize.query(
        'SELECT id FROM finance_payout_batches WHERE userId = :userId AND name = :name LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId, name: seedBatchName },
        },
      );

      let batchId = existingBatch?.id ?? null;
      if (!batchId) {
        await queryInterface.bulkInsert(
          'finance_payout_batches',
          [
            {
              userId,
              name: seedBatchName,
              status: 'completed',
              totalAmount: 9000,
              currencyCode: 'USD',
              scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
              executedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
              metadata: { seed: 'finance-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
        const [insertedBatch] = await queryInterface.sequelize.query(
          'SELECT id FROM finance_payout_batches WHERE userId = :userId AND name = :name LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, name: seedBatchName },
          },
        );
        batchId = insertedBatch?.id ?? null;
      }

      if (batchId) {
        const payoutSplits = [
          {
            teammateName: 'Jules Carter',
            recipientEmail: 'jules@gigvora.com',
            sharePercentage: 25,
            amount: 2250,
          },
          {
            teammateName: 'Devon Lee',
            recipientEmail: 'devon@gigvora.com',
            sharePercentage: 15,
            amount: 1350,
          },
        ];
        for (const split of payoutSplits) {
          const [existingSplit] = await queryInterface.sequelize.query(
            'SELECT id FROM finance_payout_splits WHERE batchId = :batchId AND recipientEmail = :email LIMIT 1',
            {
              type: QueryTypes.SELECT,
              transaction,
              replacements: { batchId, email: split.recipientEmail },
            },
          );
          if (existingSplit?.id) continue;
          await queryInterface.bulkInsert(
            'finance_payout_splits',
            [
              {
                batchId,
                teammateName: split.teammateName,
                teammateRole: 'Contributor',
                recipientEmail: split.recipientEmail,
                status: 'completed',
                sharePercentage: split.sharePercentage,
                amount: split.amount,
                currencyCode: 'USD',
                metadata: { seed: 'finance-demo' },
                createdAt: now,
                updatedAt: now,
              },
            ],
            { transaction },
          );
        }
      }

      const scenarioRows = [
        {
          label: 'Retainer pipeline',
          scenarioType: 'retainer_pipeline',
          timeframe: 'Next 90 days',
          confidence: 0.8,
          projectedAmount: 32000,
          notes: 'Anchored by three renewals and one upsell.',
          key: seedScenarios[0],
        },
        {
          label: 'Stretch upside',
          scenarioType: 'stretch',
          timeframe: 'Next 90 days',
          confidence: 0.25,
          projectedAmount: 6800,
          notes: 'Requires converting enterprise workshop to retainer.',
          key: seedScenarios[1],
        },
      ];

      for (const scenario of scenarioRows) {
        const [existingScenario] = await queryInterface.sequelize.query(
          'SELECT id FROM finance_forecast_scenarios WHERE userId = :userId AND label = :label LIMIT 1',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { userId, label: scenario.label },
          },
        );
        if (existingScenario?.id) continue;
        await queryInterface.bulkInsert(
          'finance_forecast_scenarios',
          [
            {
              userId,
              label: scenario.label,
              scenarioType: scenario.scenarioType,
              timeframe: scenario.timeframe,
              confidence: scenario.confidence,
              projectedAmount: scenario.projectedAmount,
              currencyCode: 'USD',
              notes: scenario.notes,
              generatedAt: now,
              metadata: { seed: 'finance-demo', key: scenario.key },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const [existingExport] = await queryInterface.sequelize.query(
        'SELECT id FROM finance_tax_exports WHERE userId = :userId AND downloadUrl LIKE :key LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId, key: `%${seedExportKey}%` },
        },
      );
      if (!existingExport?.id) {
        await queryInterface.bulkInsert(
          'finance_tax_exports',
          [
            {
              userId,
              exportType: 'annual',
              status: 'available',
              periodStart: new Date(now.getFullYear(), 0, 1),
              periodEnd: now,
              amount: 42180,
              currencyCode: 'USD',
              downloadUrl: `https://files.gigvora.example.com/exports/${seedExportKey}.zip`,
              generatedAt: new Date(now.getTime() - 60 * 60 * 1000),
              metadata: { seed: 'finance-demo' },
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const userId = await findUserId(queryInterface, transaction, 'leo@gigvora.com');
      if (!userId) return;

      await queryInterface.bulkDelete(
        'finance_tax_exports',
        {
          userId,
          downloadUrl: { [Op.like]: `%${seedExportKey}%` },
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'finance_forecast_scenarios',
        {
          userId,
          label: { [Op.in]: ['Retainer pipeline', 'Stretch upside'] },
        },
        { transaction },
      );

      const [batch] = await queryInterface.sequelize.query(
        'SELECT id FROM finance_payout_batches WHERE userId = :userId AND name = :name LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
          replacements: { userId, name: seedBatchName },
        },
      );
      const batchId = batch?.id ?? null;
      if (batchId) {
        await queryInterface.bulkDelete('finance_payout_splits', { batchId }, { transaction });
        await queryInterface.bulkDelete('finance_payout_batches', { id: batchId }, { transaction });
      }

      await queryInterface.bulkDelete(
        'finance_savings_goals',
        {
          userId,
          name: { [Op.in]: seedGoals },
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'finance_expense_entries',
        {
          userId,
          vendorName: { [Op.in]: seedVendors },
        },
        { transaction },
      );

      await queryInterface.bulkDelete(
        'finance_revenue_entries',
        {
          userId,
          invoiceNumber: { [Op.in]: seedInvoices },
        },
        { transaction },
      );
    });
  },
};
