'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

const APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'in_review',
  'interview',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

const RESPONSE_TYPES = ['message', 'request_info', 'approval', 'rejection', 'update'];
const CONTRACT_STATUSES = ['draft', 'awaiting_signature', 'active', 'on_hold', 'completed', 'cancelled'];
const SPEND_CATEGORIES = ['travel', 'stipend', 'equipment', 'training', 'operations', 'other'];
const REVIEW_VISIBILITIES = ['private', 'shared'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await queryInterface.createTable(
        'volunteer_applications',
        {
          id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          volunteeringRoleId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'volunteering_roles', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM(...APPLICATION_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          motivation: { type: Sequelize.TEXT, allowNull: true },
          availabilityStart: { type: Sequelize.DATEONLY, allowNull: true },
          availabilityHoursPerWeek: { type: Sequelize.INTEGER, allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: true },
          decisionAt: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'volunteer_responses',
        {
          id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'volunteer_applications', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          responderId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          responseType: {
            type: Sequelize.ENUM(...RESPONSE_TYPES),
            allowNull: false,
            defaultValue: 'message',
          },
          message: { type: Sequelize.TEXT, allowNull: false },
          requestedAction: { type: Sequelize.STRING(255), allowNull: true },
          respondedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'volunteer_contracts',
        {
          id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'volunteer_applications', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM(...CONTRACT_STATUSES),
            allowNull: false,
            defaultValue: 'draft',
          },
          startDate: { type: Sequelize.DATEONLY, allowNull: true },
          endDate: { type: Sequelize.DATEONLY, allowNull: true },
          commitmentHours: { type: Sequelize.INTEGER, allowNull: true },
          hourlyRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          currencyCode: { type: Sequelize.STRING(3), allowNull: true },
          totalValue: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          spendToDate: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'volunteer_contract_spend',
        {
          id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          contractId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'volunteer_contracts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          recordedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
          currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          category: {
            type: Sequelize.ENUM(...SPEND_CATEGORIES),
            allowNull: false,
            defaultValue: 'other',
          },
          description: { type: Sequelize.STRING(255), allowNull: true },
          incurredAt: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_DATE'),
          },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'volunteer_contract_reviews',
        {
          id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
          contractId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'volunteer_contracts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          reviewerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          rating: { type: Sequelize.INTEGER, allowNull: false },
          headline: { type: Sequelize.STRING(180), allowNull: true },
          feedback: { type: Sequelize.TEXT, allowNull: true },
          visibility: {
            type: Sequelize.ENUM(...REVIEW_VISIBILITIES),
            allowNull: false,
            defaultValue: 'private',
          },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('volunteer_contract_reviews', { transaction });
      await queryInterface.dropTable('volunteer_contract_spend', { transaction });
      await queryInterface.dropTable('volunteer_contracts', { transaction });
      await queryInterface.dropTable('volunteer_responses', { transaction });
      await queryInterface.dropTable('volunteer_applications', { transaction });

      const enumNames = [
        'enum_volunteer_contract_reviews_visibility',
        'enum_volunteer_contract_spend_category',
        'enum_volunteer_contracts_status',
        'enum_volunteer_responses_responseType',
        'enum_volunteer_applications_status',
      ];

      await Promise.all(enumNames.map((enumName) => dropEnum(queryInterface, enumName, transaction)));
    });
  },
};
