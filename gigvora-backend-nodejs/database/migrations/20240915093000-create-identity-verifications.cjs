'use strict';

const TABLE_NAME = 'identity_verifications';
const STATUS_ENUM_NAME = 'enum_identity_verifications_status';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TABLE_NAME,
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'profiles', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('pending', 'submitted', 'in_review', 'verified', 'rejected', 'expired'),
            allowNull: false,
            defaultValue: 'pending',
          },
          verificationProvider: {
            type: Sequelize.STRING(80),
            allowNull: false,
            defaultValue: 'manual_review',
          },
          typeOfId: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          idNumberLast4: {
            type: Sequelize.STRING(16),
            allowNull: true,
          },
          issuingCountry: {
            type: Sequelize.STRING(4),
            allowNull: true,
          },
          issuedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          expiresAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          documentFrontKey: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          documentBackKey: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          selfieKey: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          fullName: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          dateOfBirth: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          addressLine1: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          addressLine2: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          city: {
            type: Sequelize.STRING(120),
            allowNull: false,
          },
          state: {
            type: Sequelize.STRING(120),
            allowNull: true,
          },
          postalCode: {
            type: Sequelize.STRING(40),
            allowNull: false,
          },
          country: {
            type: Sequelize.STRING(4),
            allowNull: false,
          },
          reviewNotes: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          declinedReason: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          reviewerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          submittedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          reviewedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          metadata: {
            type: Sequelize.JSONB ?? Sequelize.JSON,
            allowNull: true,
          },
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

      await Promise.all([
        queryInterface.addIndex(TABLE_NAME, ['userId'], { transaction }),
        queryInterface.addIndex(TABLE_NAME, ['profileId'], { transaction }),
        queryInterface.addIndex(TABLE_NAME, ['status'], { transaction }),
        queryInterface.addIndex(TABLE_NAME, ['verificationProvider'], { transaction }),
        queryInterface.addIndex(TABLE_NAME, ['reviewerId'], { transaction }),
      ]);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLE_NAME, { transaction });
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${STATUS_ENUM_NAME}";`, { transaction });
    });
  },
};
