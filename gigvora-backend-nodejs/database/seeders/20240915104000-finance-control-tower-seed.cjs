'use strict';

const seededFinanceTag = 'finance_control_tower_seed_v1';

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const earlierThisMonth = new Date(monthStart.getTime() + 5 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 12);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 18);

      const userId = 2; // Leo Freelancer from base seed

      await queryInterface.bulkInsert(
        'finance_revenue_entries',
        [
          {
            userId,
            revenueType: 'retainer',
            status: 'recognized',
            source: 'workspace',
            clientName: 'Atlas Labs',
            invoiceNumber: 'RET-2024-08-01',
            amount: 14200.0,
            currencyCode: 'USD',
            taxWithholdingAmount: 4260.0,
            taxCategory: 'services',
            recognizedAt: earlierThisMonth,
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            revenueType: 'one_off',
            status: 'recognized',
            source: 'gig',
            clientName: 'Nova Agency',
            invoiceNumber: 'GIG-2024-08-14',
            amount: 8900.0,
            currencyCode: 'USD',
            taxWithholdingAmount: 2670.0,
            taxCategory: 'creative_services',
            recognizedAt: new Date(monthStart.getTime() + 9 * 24 * 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            revenueType: 'passive',
            status: 'recognized',
            source: 'course',
            clientName: 'Gigvora Learning',
            invoiceNumber: 'PASS-2024-08-08',
            amount: 1600.0,
            currencyCode: 'USD',
            taxWithholdingAmount: 480.0,
            taxCategory: 'digital_product',
            recognizedAt: new Date(monthStart.getTime() + 3 * 24 * 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            revenueType: 'retainer',
            status: 'recognized',
            source: 'workspace',
            clientName: 'Atlas Labs',
            invoiceNumber: 'RET-2024-07-01',
            amount: 13340.0,
            currencyCode: 'USD',
            taxWithholdingAmount: 4002.0,
            taxCategory: 'services',
            recognizedAt: lastMonth,
            metadata: { seedTag: seededFinanceTag },
            createdAt: lastMonth,
            updatedAt: lastMonth,
          },
          {
            userId,
            revenueType: 'one_off',
            status: 'recognized',
            source: 'gig',
            clientName: 'Signal Media',
            invoiceNumber: 'GIG-2024-07-10',
            amount: 7940.0,
            currencyCode: 'USD',
            taxWithholdingAmount: 2382.0,
            taxCategory: 'creative_services',
            recognizedAt: new Date(lastMonth.getTime() + 7 * 24 * 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: lastMonth,
            updatedAt: lastMonth,
          },
          {
            userId,
            revenueType: 'passive',
            status: 'recognized',
            source: 'course',
            clientName: 'Gigvora Learning',
            invoiceNumber: 'PASS-2024-07-18',
            amount: 1500.0,
            currencyCode: 'USD',
            taxWithholdingAmount: 450.0,
            taxCategory: 'digital_product',
            recognizedAt: new Date(lastMonth.getTime() + 2 * 24 * 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: lastMonth,
            updatedAt: lastMonth,
          },
          {
            userId,
            revenueType: 'retainer',
            status: 'recognized',
            source: 'workspace',
            clientName: 'Atlas Labs',
            invoiceNumber: 'RET-2024-06-01',
            amount: 12980.0,
            currencyCode: 'USD',
            taxWithholdingAmount: 3894.0,
            taxCategory: 'services',
            recognizedAt: twoMonthsAgo,
            metadata: { seedTag: seededFinanceTag },
            createdAt: twoMonthsAgo,
            updatedAt: twoMonthsAgo,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'finance_expense_entries',
        [
          {
            userId,
            category: 'Software & tooling',
            vendorName: 'Figma',
            cadence: 'Monthly',
            status: 'posted',
            amount: 1120.0,
            currencyCode: 'USD',
            occurredAt: new Date(monthStart.getTime() + 4 * 24 * 60 * 60 * 1000),
            isTaxDeductible: true,
            notes: 'Design, collaboration, and prototyping suite subscription.',
            receiptUrl: null,
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            category: 'Subcontractors',
            vendorName: 'Jules Carter',
            cadence: 'Per project',
            status: 'posted',
            amount: 3400.0,
            currencyCode: 'USD',
            occurredAt: new Date(monthStart.getTime() + 8 * 24 * 60 * 60 * 1000),
            isTaxDeductible: true,
            notes: 'Motion design handoff for brand film project.',
            receiptUrl: null,
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            category: 'Professional services',
            vendorName: 'Ledger & Co.',
            cadence: 'Quarterly',
            status: 'posted',
            amount: 2180.0,
            currencyCode: 'USD',
            occurredAt: new Date(monthStart.getTime() + 6 * 24 * 60 * 60 * 1000),
            isTaxDeductible: true,
            notes: 'Bookkeeping and compliance review.',
            receiptUrl: null,
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            category: 'Benefits & insurance',
            vendorName: 'Indie Health Alliance',
            cadence: 'Monthly',
            status: 'posted',
            amount: 1260.0,
            currencyCode: 'USD',
            occurredAt: new Date(monthStart.getTime() + 2 * 24 * 60 * 60 * 1000),
            isTaxDeductible: true,
            notes: 'Health, disability, and supplemental coverage.',
            receiptUrl: null,
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            category: 'Subcontractors',
            vendorName: 'Maya Chen',
            cadence: 'Per project',
            status: 'posted',
            amount: 1350.0,
            currencyCode: 'USD',
            occurredAt: new Date(lastMonth.getTime() + 5 * 24 * 60 * 60 * 1000),
            isTaxDeductible: true,
            notes: 'UX research for onboarding experience.',
            receiptUrl: null,
            metadata: { seedTag: seededFinanceTag },
            createdAt: lastMonth,
            updatedAt: lastMonth,
          },
          {
            userId,
            category: 'Professional services',
            vendorName: 'Rivera Legal',
            cadence: 'Quarterly',
            status: 'posted',
            amount: 1980.0,
            currencyCode: 'USD',
            occurredAt: new Date(lastMonth.getTime() + 9 * 24 * 60 * 60 * 1000),
            isTaxDeductible: true,
            notes: 'Contract review and IP assignments.',
            receiptUrl: null,
            metadata: { seedTag: seededFinanceTag },
            createdAt: lastMonth,
            updatedAt: lastMonth,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'finance_savings_goals',
        [
          {
            userId,
            name: 'Health & benefits reserve',
            status: 'active',
            targetAmount: 9000.0,
            currentAmount: 5850.0,
            currencyCode: 'USD',
            automationType: 'fixed_transfer',
            automationAmount: 750.0,
            automationCadence: 'monthly',
            isRunwayReserve: true,
            lastContributionAt: new Date(monthStart.getTime() + 1 * 24 * 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: twoMonthsAgo,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            name: 'Creative sabbatical fund',
            status: 'active',
            targetAmount: 12000.0,
            currentAmount: 4560.0,
            currencyCode: 'USD',
            automationType: 'round_up',
            automationAmount: 0.0,
            automationCadence: 'per_payout',
            isRunwayReserve: false,
            lastContributionAt: new Date(monthStart.getTime() + 7 * 24 * 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: lastMonth,
            updatedAt: earlierThisMonth,
          },
          {
            userId,
            name: 'Tax withholding vault',
            status: 'active',
            targetAmount: 16500.0,
            currentAmount: 13530.0,
            currencyCode: 'USD',
            automationType: 'percentage_income',
            automationAmount: 0.3,
            automationCadence: 'per_invoice',
            isRunwayReserve: true,
            lastContributionAt: new Date(monthStart.getTime() + 9 * 24 * 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: twoMonthsAgo,
            updatedAt: earlierThisMonth,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'finance_payout_batches',
        [
          {
            userId,
            name: 'August retainers milestone',
            status: 'completed',
            totalAmount: 9000.0,
            currencyCode: 'USD',
            scheduledAt: new Date(monthStart.getTime() + 10 * 24 * 60 * 60 * 1000),
            executedAt: new Date(monthStart.getTime() + 10 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: earlierThisMonth,
            updatedAt: new Date(monthStart.getTime() + 10 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          },
        ],
        { transaction },
      );

      const [batchRows] = await queryInterface.sequelize.query(
        'SELECT id FROM finance_payout_batches WHERE userId = :userId AND name = :name ORDER BY executedAt DESC, createdAt DESC LIMIT 1',
        {
          transaction,
          replacements: { userId, name: 'August retainers milestone' },
        },
      );

      const batchId = Array.isArray(batchRows) && batchRows.length > 0 ? batchRows[0].id : null;

      if (batchId) {
        await queryInterface.bulkInsert(
          'finance_payout_splits',
          [
            {
              batchId,
              teammateName: 'Jules Carter',
              teammateRole: 'Motion designer',
              recipientEmail: 'jules@gigvora.com',
              status: 'completed',
              sharePercentage: 25.0,
              amount: 2250.0,
              currencyCode: 'USD',
              metadata: { seedTag: seededFinanceTag },
              createdAt: earlierThisMonth,
              updatedAt: earlierThisMonth,
            },
            {
              batchId,
              teammateName: 'Maya Chen',
              teammateRole: 'UX researcher',
              recipientEmail: 'maya@gigvora.com',
              status: 'completed',
              sharePercentage: 15.0,
              amount: 1350.0,
              currencyCode: 'USD',
              metadata: { seedTag: seededFinanceTag },
              createdAt: earlierThisMonth,
              updatedAt: earlierThisMonth,
            },
            {
              batchId,
              teammateName: 'Devon Lee',
              teammateRole: 'Copy strategist',
              recipientEmail: 'devon@gigvora.com',
              status: 'completed',
              sharePercentage: 10.0,
              amount: 900.0,
              currencyCode: 'USD',
              metadata: { seedTag: seededFinanceTag },
              createdAt: earlierThisMonth,
              updatedAt: earlierThisMonth,
            },
          ],
          { transaction },
        );
      }

      await queryInterface.bulkInsert(
        'finance_forecast_scenarios',
        [
          {
            userId,
            label: 'Retainer pipeline',
            scenarioType: 'retainer_pipeline',
            timeframe: 'Next 90 days',
            confidence: 0.8,
            projectedAmount: 32500.0,
            currencyCode: 'USD',
            notes: 'Anchored by three multi-month brand partnerships.',
            generatedAt: now,
            metadata: { seedTag: seededFinanceTag },
            createdAt: now,
            updatedAt: now,
          },
          {
            userId,
            label: 'One-off project velocity',
            scenarioType: 'one_off_pipeline',
            timeframe: 'Next 60 days',
            confidence: 0.6,
            projectedAmount: 11400.0,
            currencyCode: 'USD',
            notes: 'Projected from average conversion over last six launches.',
            generatedAt: now,
            metadata: { seedTag: seededFinanceTag },
            createdAt: now,
            updatedAt: now,
          },
          {
            userId,
            label: 'Stretch upside',
            scenarioType: 'stretch',
            timeframe: 'Next 90 days',
            confidence: 0.2,
            projectedAmount: 6800.0,
            currencyCode: 'USD',
            notes: 'Dependent on agency collaboration upsell.',
            generatedAt: now,
            metadata: { seedTag: seededFinanceTag },
            createdAt: now,
            updatedAt: now,
          },
        ],
        { transaction },
      );

      await queryInterface.bulkInsert(
        'finance_tax_exports',
        [
          {
            userId,
            exportType: 'annual',
            status: 'available',
            periodStart: new Date(now.getFullYear(), 0, 1),
            periodEnd: now,
            amount: 42180.0,
            currencyCode: 'USD',
            downloadUrl: 'https://files.gigvora.com/exports/leo-freelancer-fy24-tax.zip',
            generatedAt: new Date(now.getTime() - 60 * 60 * 1000),
            metadata: { seedTag: seededFinanceTag },
            createdAt: new Date(now.getTime() - 60 * 60 * 1000),
            updatedAt: new Date(now.getTime() - 60 * 60 * 1000),
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('finance_tax_exports', { metadata: { seedTag: seededFinanceTag } });
    await queryInterface.bulkDelete('finance_forecast_scenarios', { metadata: { seedTag: seededFinanceTag } });
    await queryInterface.bulkDelete('finance_payout_splits', { metadata: { seedTag: seededFinanceTag } });
    await queryInterface.bulkDelete('finance_payout_batches', { metadata: { seedTag: seededFinanceTag } });
    await queryInterface.bulkDelete('finance_savings_goals', { metadata: { seedTag: seededFinanceTag } });
    await queryInterface.bulkDelete('finance_expense_entries', { metadata: { seedTag: seededFinanceTag } });
    await queryInterface.bulkDelete('finance_revenue_entries', { metadata: { seedTag: seededFinanceTag } });
  },
};
