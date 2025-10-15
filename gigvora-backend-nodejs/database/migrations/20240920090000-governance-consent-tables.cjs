'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

      await queryInterface.createTable(
        'consent_policies',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          code: { type: Sequelize.STRING(80), allowNull: false, unique: true },
          title: { type: Sequelize.STRING(240), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          audience: {
            type: Sequelize.STRING(80),
            allowNull: false,
            defaultValue: 'user',
          },
          region: {
            type: Sequelize.STRING(32),
            allowNull: false,
            defaultValue: 'global',
          },
          legalBasis: {
            type: Sequelize.STRING(80),
            allowNull: false,
          },
          required: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          revocable: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          retentionPeriodDays: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          activeVersionId: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          createdBy: { type: Sequelize.STRING(120), allowNull: true },
          updatedBy: { type: Sequelize.STRING(120), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'consent_policy_versions',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          policyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'consent_policies', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          version: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          documentUrl: { type: Sequelize.STRING(1024), allowNull: true },
          content: { type: Sequelize.TEXT, allowNull: true },
          summary: { type: Sequelize.TEXT, allowNull: true },
          effectiveAt: { type: Sequelize.DATE, allowNull: false },
          supersededAt: { type: Sequelize.DATE, allowNull: true },
          createdBy: { type: Sequelize.STRING(120), allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addConstraint(
        'consent_policy_versions',
        {
          type: 'unique',
          name: 'consent_policy_versions_policy_version_unique',
          fields: ['policyId', 'version'],
          transaction,
        },
      );

      await queryInterface.createTable(
        'user_consents',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          policyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'consent_policies', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          policyVersionId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'consent_policy_versions', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          status: {
            type: Sequelize.ENUM('granted', 'withdrawn'),
            allowNull: false,
          },
          grantedAt: { type: Sequelize.DATE, allowNull: true },
          withdrawnAt: { type: Sequelize.DATE, allowNull: true },
          source: { type: Sequelize.STRING(80), allowNull: false, defaultValue: 'self_service' },
          ipAddress: { type: Sequelize.STRING(120), allowNull: true },
          userAgent: { type: Sequelize.STRING(500), allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addConstraint(
        'user_consents',
        {
          type: 'unique',
          name: 'user_consents_user_policy_unique',
          fields: ['userId', 'policyId'],
          transaction,
        },
      );

      await queryInterface.createTable(
        'consent_audit_events',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          policyId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'consent_policies', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          policyVersionId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'consent_policy_versions', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          userConsentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'user_consents', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          actorId: { type: Sequelize.STRING(120), allowNull: true },
          actorType: {
            type: Sequelize.STRING(80),
            allowNull: false,
            defaultValue: 'system',
          },
          action: {
            type: Sequelize.STRING(80),
            allowNull: false,
          },
          reason: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: false, defaultValue: {} },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('consent_policies', ['audience', 'region'], { transaction });
      await queryInterface.addIndex('consent_policies', ['activeVersionId'], { transaction });
      await queryInterface.addIndex('consent_policy_versions', ['policyId', 'effectiveAt'], { transaction });
      await queryInterface.addIndex('user_consents', ['policyId', 'status'], { transaction });
      await queryInterface.addIndex('user_consents', ['policyVersionId'], { transaction });
      await queryInterface.addIndex('consent_audit_events', ['policyId', 'createdAt'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('consent_audit_events', ['policyId', 'createdAt'], { transaction });
      await queryInterface.removeIndex('user_consents', ['policyVersionId'], { transaction });
      await queryInterface.removeIndex('user_consents', ['policyId', 'status'], { transaction });
      await queryInterface.removeIndex('consent_policy_versions', ['policyId', 'effectiveAt'], { transaction });
      await queryInterface.removeIndex('consent_policies', ['activeVersionId'], { transaction });
      await queryInterface.removeIndex('consent_policies', ['audience', 'region'], { transaction });

      await queryInterface.dropTable('consent_audit_events', { transaction });
      await queryInterface.dropTable('user_consents', { transaction });
      await queryInterface.dropTable('consent_policy_versions', { transaction });
      await queryInterface.dropTable('consent_policies', { transaction });

      if (queryInterface.sequelize.getDialect() === 'postgres') {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_consents_status";', {
          transaction,
        });
      }
    });
  },
};
