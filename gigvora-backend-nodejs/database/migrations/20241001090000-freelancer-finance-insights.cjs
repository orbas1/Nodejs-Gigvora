'use strict';

const FINANCE_VALUE_UNITS = ['currency', 'percentage', 'ratio', 'count'];
const FINANCE_CHANGE_UNITS = ['currency', 'percentage', 'percentage_points', 'count', 'ratio'];
const FINANCE_TRENDS = ['up', 'down', 'neutral'];
const FREELANCER_PAYOUT_STATUSES = ['released', 'scheduled', 'in_escrow', 'pending', 'failed'];
const FREELANCER_TAX_ESTIMATE_STATUSES = ['on_track', 'due_soon', 'past_due', 'paid', 'processing'];
const FREELANCER_FILING_STATUSES = ['not_started', 'in_progress', 'submitted', 'overdue'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'freelancer_finance_metrics',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          metricKey: { type: Sequelize.STRING(64), allowNull: false },
          label: { type: Sequelize.STRING(160), allowNull: false },
          value: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
          valueUnit: { type: Sequelize.ENUM(...FINANCE_VALUE_UNITS), allowNull: false, defaultValue: 'currency' },
          currencyCode: { type: Sequelize.STRING(3), allowNull: true },
          changeValue: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
          changeUnit: { type: Sequelize.ENUM(...FINANCE_CHANGE_UNITS), allowNull: true },
          trend: { type: Sequelize.ENUM(...FINANCE_TRENDS), allowNull: false, defaultValue: 'neutral' },
          caption: { type: Sequelize.TEXT, allowNull: true },
          effectiveAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'freelancer_finance_metrics',
        ['freelancerId', 'metricKey'],
        { transaction },
      );
      await queryInterface.addIndex(
        'freelancer_finance_metrics',
        ['freelancerId', 'effectiveAt'],
        { transaction },
      );

      await queryInterface.createTable(
        'freelancer_revenue_monthlies',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          month: { type: Sequelize.DATEONLY, allowNull: false },
          bookedAmount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
          realizedAmount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
          currencyCode: { type: Sequelize.STRING(3), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addConstraint('freelancer_revenue_monthlies', {
        type: 'unique',
        fields: ['freelancerId', 'month'],
        name: 'freelancer_revenue_monthlies_unique_month',
        transaction,
      });

      await queryInterface.addIndex('freelancer_revenue_monthlies', ['freelancerId', 'createdAt'], { transaction });

      await queryInterface.createTable(
        'freelancer_revenue_streams',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          sharePercent: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
          monthlyRecurringRevenue: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
          currencyCode: { type: Sequelize.STRING(3), allowNull: true },
          yoyChangePercent: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_revenue_streams', ['freelancerId'], { transaction });

      await queryInterface.createTable(
        'freelancer_payouts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          payoutDate: { type: Sequelize.DATEONLY, allowNull: false },
          clientName: { type: Sequelize.STRING(160), allowNull: false },
          gigTitle: { type: Sequelize.STRING(160), allowNull: false },
          amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
          currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          status: { type: Sequelize.ENUM(...FREELANCER_PAYOUT_STATUSES), allowNull: false, defaultValue: 'scheduled' },
          reference: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_payouts', ['freelancerId', 'payoutDate'], { transaction });
      await queryInterface.addIndex('freelancer_payouts', ['status'], { transaction });

      await queryInterface.createTable(
        'freelancer_tax_estimates',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          dueDate: { type: Sequelize.DATEONLY, allowNull: false },
          amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
          currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          status: { type: Sequelize.ENUM(...FREELANCER_TAX_ESTIMATE_STATUSES), allowNull: false, defaultValue: 'on_track' },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_tax_estimates', ['freelancerId', 'dueDate'], { transaction });

      await queryInterface.createTable(
        'freelancer_tax_filings',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(180), allowNull: false },
          jurisdiction: { type: Sequelize.STRING(120), allowNull: true },
          dueDate: { type: Sequelize.DATEONLY, allowNull: false },
          status: { type: Sequelize.ENUM(...FREELANCER_FILING_STATUSES), allowNull: false, defaultValue: 'not_started' },
          submittedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_tax_filings', ['freelancerId'], { transaction });
      await queryInterface.addIndex('freelancer_tax_filings', ['dueDate'], { transaction });

      await queryInterface.createTable(
        'freelancer_deduction_summaries',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          taxYear: { type: Sequelize.INTEGER, allowNull: false },
          amount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
          currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          changePercentage: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addConstraint('freelancer_deduction_summaries', {
        type: 'unique',
        fields: ['freelancerId', 'taxYear'],
        name: 'freelancer_deduction_summaries_unique_year',
        transaction,
      });

      await queryInterface.createTable(
        'freelancer_profitability_metrics',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          metricKey: { type: Sequelize.STRING(64), allowNull: false },
          label: { type: Sequelize.STRING(160), allowNull: false },
          value: { type: Sequelize.DECIMAL(10, 4), allowNull: false, defaultValue: 0 },
          valueUnit: { type: Sequelize.ENUM(...FINANCE_VALUE_UNITS), allowNull: false, defaultValue: 'percentage' },
          changeValue: { type: Sequelize.DECIMAL(10, 4), allowNull: true },
          changeUnit: { type: Sequelize.ENUM(...FINANCE_CHANGE_UNITS), allowNull: true },
          currencyCode: { type: Sequelize.STRING(3), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_profitability_metrics', ['freelancerId', 'metricKey'], { transaction });

      await queryInterface.createTable(
        'freelancer_cost_breakdowns',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          label: { type: Sequelize.STRING(160), allowNull: false },
          percentage: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
          caption: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_cost_breakdowns', ['freelancerId'], { transaction });

      await queryInterface.createTable(
        'freelancer_savings_goals',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          targetAmount: { type: Sequelize.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
          currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          progress: { type: Sequelize.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
          cadence: { type: Sequelize.STRING(160), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_savings_goals', ['freelancerId'], { transaction });

      await queryInterface.createTable(
        'freelancer_finance_controls',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          bullets: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        },
        { transaction },
      );

      await queryInterface.addIndex('freelancer_finance_controls', ['freelancerId'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropTable = (table) => queryInterface.dropTable(table, { transaction }).catch(() => {});

      await dropTable('freelancer_finance_controls');
      await dropTable('freelancer_savings_goals');
      await dropTable('freelancer_cost_breakdowns');
      await dropTable('freelancer_profitability_metrics');
      await dropTable('freelancer_deduction_summaries');
      await dropTable('freelancer_tax_filings');
      await dropTable('freelancer_tax_estimates');
      await dropTable('freelancer_payouts');
      await dropTable('freelancer_revenue_streams');
      await dropTable('freelancer_revenue_monthlies');
      await dropTable('freelancer_finance_metrics');

      await Promise.all([
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_finance_metrics_valueUnit\"", { transaction }).catch(() => {}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_finance_metrics_changeUnit\"", { transaction }).catch(() => {}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_finance_metrics_trend\"", { transaction }).catch(() => {}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_payouts_status\"", { transaction }).catch(() => {}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_tax_estimates_status\"", { transaction }).catch(() => {}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_tax_filings_status\"", { transaction }).catch(() => {}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_profitability_metrics_valueUnit\"", { transaction }).catch(() => {}),
        queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_freelancer_profitability_metrics_changeUnit\"", { transaction }).catch(() => {}),
      ]);
    });
  },
};
