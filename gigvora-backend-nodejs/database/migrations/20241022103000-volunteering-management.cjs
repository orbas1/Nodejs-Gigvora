'use strict';

const APPLICATION_TABLE = 'volunteering_applications';
const RESPONSE_TABLE = 'volunteering_responses';
const CONTRACT_TABLE = 'volunteering_contracts';
const SPEND_TABLE = 'volunteering_spend_entries';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        APPLICATION_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          organizationName: { type: Sequelize.STRING(180), allowNull: false },
          focusArea: { type: Sequelize.STRING(120), allowNull: true },
          location: { type: Sequelize.STRING(180), allowNull: true },
          remoteFriendly: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          skills: { type: jsonType, allowNull: true },
          status: {
            type: Sequelize.ENUM('draft', 'submitted', 'interview', 'offer', 'accepted', 'declined', 'withdrawn'),
            allowNull: false,
            defaultValue: 'draft',
          },
          appliedAt: { type: Sequelize.DATE, allowNull: true },
          targetStartDate: { type: Sequelize.DATE, allowNull: true },
          hoursPerWeek: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          impactSummary: { type: Sequelize.TEXT, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          coverImageUrl: { type: Sequelize.STRING(512), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        RESPONSE_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: APPLICATION_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          responderName: { type: Sequelize.STRING(180), allowNull: true },
          responderEmail: { type: Sequelize.STRING(255), allowNull: true },
          status: {
            type: Sequelize.ENUM('awaiting_reply', 'info_requested', 'scheduled', 'completed', 'declined'),
            allowNull: false,
            defaultValue: 'awaiting_reply',
          },
          respondedAt: { type: Sequelize.DATE, allowNull: true },
          nextSteps: { type: Sequelize.STRING(255), allowNull: true },
          message: { type: Sequelize.TEXT, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        CONTRACT_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: APPLICATION_TABLE, key: 'id' },
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          organizationName: { type: Sequelize.STRING(180), allowNull: false },
          status: {
            type: Sequelize.ENUM('pending', 'active', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
          },
          startDate: { type: Sequelize.DATE, allowNull: true },
          endDate: { type: Sequelize.DATE, allowNull: true },
          expectedHours: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
          hoursCommitted: { type: Sequelize.DECIMAL(7, 2), allowNull: true },
          financialValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          currencyCode: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          impactNotes: { type: Sequelize.TEXT, allowNull: true },
          agreementUrl: { type: Sequelize.STRING(512), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        SPEND_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          contractId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: CONTRACT_TABLE, key: 'id' },
            onDelete: 'CASCADE',
          },
          freelancerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          description: { type: Sequelize.STRING(255), allowNull: false },
          category: {
            type: Sequelize.ENUM('travel', 'materials', 'software', 'marketing', 'other'),
            allowNull: false,
            defaultValue: 'other',
          },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          currencyCode: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          spentAt: { type: Sequelize.DATE, allowNull: true },
          receiptUrl: { type: Sequelize.STRING(512), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        APPLICATION_TABLE,
        ['freelancerId', 'status', 'appliedAt'],
        { name: 'volunteering_applications_status_idx', transaction },
      );
      await queryInterface.addIndex(
        RESPONSE_TABLE,
        ['applicationId', 'status'],
        { name: 'volunteering_responses_status_idx', transaction },
      );
      await queryInterface.addIndex(
        CONTRACT_TABLE,
        ['freelancerId', 'status', 'startDate'],
        { name: 'volunteering_contracts_status_idx', transaction },
      );
      await queryInterface.addIndex(
        SPEND_TABLE,
        ['contractId', 'spentAt'],
        { name: 'volunteering_spend_contract_idx', transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const removeIndex = async (table, name) => {
        await queryInterface.removeIndex(table, name, { transaction }).catch(() => {});
      };

      await removeIndex(SPEND_TABLE, 'volunteering_spend_contract_idx');
      await removeIndex(CONTRACT_TABLE, 'volunteering_contracts_status_idx');
      await removeIndex(RESPONSE_TABLE, 'volunteering_responses_status_idx');
      await removeIndex(APPLICATION_TABLE, 'volunteering_applications_status_idx');

      await queryInterface.dropTable(SPEND_TABLE, { transaction });
      await queryInterface.dropTable(CONTRACT_TABLE, { transaction });
      await queryInterface.dropTable(RESPONSE_TABLE, { transaction });
      await queryInterface.dropTable(APPLICATION_TABLE, { transaction });

      const dropEnum = async (enumName) => {
        const dialect = queryInterface.sequelize.getDialect();
        if (dialect === 'postgres' || dialect === 'postgresql') {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
        }
      };

      await dropEnum('enum_volunteering_applications_status');
      await dropEnum('enum_volunteering_responses_status');
      await dropEnum('enum_volunteering_contracts_status');
      await dropEnum('enum_volunteering_spend_entries_category');
    });
  },
};
