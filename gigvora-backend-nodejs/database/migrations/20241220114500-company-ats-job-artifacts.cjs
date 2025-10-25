'use strict';

const dropEnum = async (queryInterface, enumName, transaction) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'job_adverts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          jobId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'jobs', key: 'id' },
            onDelete: 'CASCADE',
          },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('draft', 'open', 'paused', 'closed', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          openings: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          remoteType: {
            type: Sequelize.ENUM('onsite', 'hybrid', 'remote'),
            allowNull: false,
            defaultValue: 'remote',
          },
          currencyCode: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          compensationMin: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          compensationMax: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          hiringManagerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          publishedAt: { type: Sequelize.DATE, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex('job_adverts', ['jobId'], { transaction, unique: true, name: 'job_adverts_job_unique' });
      await queryInterface.addIndex('job_adverts', ['workspaceId'], { transaction });
      await queryInterface.addIndex('job_adverts', ['status'], { transaction });

      await queryInterface.createTable(
        'job_advert_history',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          jobId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'jobs', key: 'id' },
            onDelete: 'CASCADE',
          },
          actorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          changeType: { type: Sequelize.STRING(120), allowNull: false },
          summary: { type: Sequelize.STRING(255), allowNull: true },
          payload: { type: jsonType, allowNull: true },
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
      await queryInterface.addIndex('job_advert_history', ['workspaceId'], { transaction });
      await queryInterface.addIndex('job_advert_history', ['jobId'], { transaction });
      await queryInterface.addIndex('job_advert_history', ['changeType'], { transaction });

      await queryInterface.createTable(
        'job_keywords',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          jobId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'jobs', key: 'id' },
            onDelete: 'CASCADE',
          },
          keyword: { type: Sequelize.STRING(120), allowNull: false },
          weight: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
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
      await queryInterface.addIndex('job_keywords', ['jobId'], { transaction });
      await queryInterface.addIndex('job_keywords', ['keyword'], { transaction });

      await queryInterface.createTable(
        'job_favorites',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          jobId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'jobs', key: 'id' },
            onDelete: 'CASCADE',
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          notes: { type: Sequelize.TEXT, allowNull: true },
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
      await queryInterface.addIndex('job_favorites', ['workspaceId'], { transaction });
      await queryInterface.addIndex('job_favorites', ['jobId'], { transaction });
      await queryInterface.addIndex('job_favorites', ['userId'], { transaction });
      await queryInterface.addIndex('job_favorites', ['workspaceId', 'jobId', 'userId'], {
        transaction,
        unique: true,
        name: 'job_favorites_workspace_job_user_unique',
      });

      await queryInterface.createTable(
        'job_candidate_responses',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          jobId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'jobs', key: 'id' },
            onDelete: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'applications', key: 'id' },
            onDelete: 'SET NULL',
          },
          respondentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          respondentName: { type: Sequelize.STRING(255), allowNull: true },
          channel: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'message' },
          direction: {
            type: Sequelize.ENUM('inbound', 'outbound'),
            allowNull: false,
            defaultValue: 'inbound',
          },
          message: { type: Sequelize.TEXT, allowNull: false },
          sentAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
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
      await queryInterface.addIndex('job_candidate_responses', ['workspaceId'], { transaction });
      await queryInterface.addIndex('job_candidate_responses', ['jobId'], { transaction });
      await queryInterface.addIndex('job_candidate_responses', ['applicationId'], { transaction });
      await queryInterface.addIndex('job_candidate_responses', ['sentAt'], { transaction });

      await queryInterface.createTable(
        'job_candidate_notes',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          workspaceId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'provider_workspaces', key: 'id' },
            onDelete: 'CASCADE',
          },
          jobId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'jobs', key: 'id' },
            onDelete: 'CASCADE',
          },
          applicationId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'applications', key: 'id' },
            onDelete: 'CASCADE',
          },
          authorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          stage: { type: Sequelize.STRING(120), allowNull: true },
          sentiment: {
            type: Sequelize.ENUM('positive', 'neutral', 'concern'),
            allowNull: false,
            defaultValue: 'neutral',
          },
          summary: { type: Sequelize.STRING(255), allowNull: false },
          nextSteps: { type: Sequelize.TEXT, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
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
      await queryInterface.addIndex('job_candidate_notes', ['workspaceId'], { transaction });
      await queryInterface.addIndex('job_candidate_notes', ['jobId'], { transaction });
      await queryInterface.addIndex('job_candidate_notes', ['applicationId'], { transaction });
      await queryInterface.addIndex('job_candidate_notes', ['stage'], { transaction });
      await queryInterface.addIndex('job_candidate_notes', ['sentiment'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('job_candidate_notes', { transaction });
      await queryInterface.dropTable('job_candidate_responses', { transaction });
      await queryInterface.dropTable('job_favorites', { transaction });
      await queryInterface.dropTable('job_keywords', { transaction });
      await queryInterface.dropTable('job_advert_history', { transaction });
      await queryInterface.dropTable('job_adverts', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await dropEnum(queryInterface, 'enum_job_candidate_notes_sentiment');
    await dropEnum(queryInterface, 'enum_job_candidate_responses_direction');
    await dropEnum(queryInterface, 'enum_job_adverts_remoteType');
    await dropEnum(queryInterface, 'enum_job_adverts_status');
  },
};
