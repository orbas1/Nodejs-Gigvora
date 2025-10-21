'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
    const isPostgres = ['postgres', 'postgresql'].includes(dialect);
    const isMySql = ['mysql', 'mariadb'].includes(dialect);
    const supportsCheckConstraints = isPostgres || isMySql;

    const wrapIdentifier = (identifier) => {
      if (isMySql) {
        return `\`${identifier}\``;
      }

      return `"${identifier}"`;
    };

    const addCheckConstraint = async (tableName, constraintName, condition, transaction) => {
      if (!supportsCheckConstraints) {
        return;
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE ${wrapIdentifier(tableName)} ADD CONSTRAINT ${wrapIdentifier(constraintName)} CHECK (${condition});`,
        { transaction },
      );
    };

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'agency_jobs',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspace_id: { type: Sequelize.STRING(120), allowNull: false },
          title: { type: Sequelize.STRING(180), allowNull: false },
          client_name: { type: Sequelize.STRING(180), allowNull: true },
          location: { type: Sequelize.STRING(180), allowNull: true },
          employment_type: {
            type: Sequelize.ENUM('full_time', 'part_time', 'contract', 'temporary', 'internship', 'fractional'),
            allowNull: false,
            defaultValue: 'full_time',
          },
          seniority: {
            type: Sequelize.ENUM('junior', 'mid', 'senior', 'lead', 'director', 'executive'),
            allowNull: true,
          },
          remote_available: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          compensation_min: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          compensation_max: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          compensation_currency: {
            type: Sequelize.ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'SGD', 'JPY'),
            allowNull: false,
            defaultValue: 'USD',
          },
          status: {
            type: Sequelize.ENUM('draft', 'open', 'paused', 'closed', 'filled'),
            allowNull: false,
            defaultValue: 'draft',
          },
          summary: { type: Sequelize.TEXT, allowNull: true },
          responsibilities: { type: Sequelize.TEXT, allowNull: true },
          requirements: { type: Sequelize.TEXT, allowNull: true },
          benefits: { type: Sequelize.TEXT, allowNull: true },
          tags: { type: jsonType, allowNull: true },
          hiring_manager_name: { type: Sequelize.STRING(180), allowNull: true },
          hiring_manager_email: { type: Sequelize.STRING(180), allowNull: true },
          created_by: { type: Sequelize.INTEGER, allowNull: true },
          updated_by: { type: Sequelize.INTEGER, allowNull: true },
          published_at: { type: Sequelize.DATE, allowNull: true },
          closes_at: { type: Sequelize.DATE, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('agency_jobs', ['workspace_id', 'status'], { transaction, name: 'agency_jobs_workspace_status' });
      await queryInterface.addIndex('agency_jobs', ['workspace_id', 'title'], { transaction, name: 'agency_jobs_workspace_title' });
      await queryInterface.addIndex('agency_jobs', ['workspace_id', 'client_name'], { transaction, name: 'agency_jobs_workspace_client' });
      await queryInterface.addIndex('agency_jobs', ['workspace_id', 'status', 'updated_at'], {
        transaction,
        name: 'agency_jobs_workspace_status_updated_at',
      });

      await addCheckConstraint(
        'agency_jobs',
        'agency_jobs_compensation_range',
        'compensation_min IS NULL OR compensation_max IS NULL OR compensation_min <= compensation_max',
        transaction,
      );
      await addCheckConstraint(
        'agency_jobs',
        'agency_jobs_closing_after_publish',
        'closes_at IS NULL OR published_at IS NULL OR closes_at >= published_at',
        transaction,
      );

      await queryInterface.createTable(
        'agency_job_applications',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspace_id: { type: Sequelize.STRING(120), allowNull: false },
          job_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_jobs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          candidate_name: { type: Sequelize.STRING(180), allowNull: false },
          candidate_email: { type: Sequelize.STRING(180), allowNull: true },
          candidate_phone: { type: Sequelize.STRING(60), allowNull: true },
          source: { type: Sequelize.STRING(120), allowNull: true },
          resume_url: { type: Sequelize.STRING(255), allowNull: true },
          portfolio_url: { type: Sequelize.STRING(255), allowNull: true },
          status: {
            type: Sequelize.ENUM('new', 'screening', 'interview', 'offer', 'hired', 'rejected'),
            allowNull: false,
            defaultValue: 'new',
          },
          stage: { type: Sequelize.STRING(120), allowNull: true },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          owner_id: { type: Sequelize.INTEGER, allowNull: true },
          applied_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          tags: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          created_by: { type: Sequelize.INTEGER, allowNull: true },
          updated_by: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'agency_job_applications',
        ['workspace_id', 'job_id', 'status'],
        { transaction, name: 'agency_job_applications_workspace_job_status' },
      );
      await queryInterface.addIndex(
        'agency_job_applications',
        ['workspace_id', 'candidate_email'],
        { transaction, name: 'agency_job_applications_workspace_candidate_email' },
      );
      await queryInterface.addIndex(
        'agency_job_applications',
        ['workspace_id', 'job_id', 'owner_id'],
        { transaction, name: 'agency_job_applications_workspace_job_owner' },
      );
      await queryInterface.addConstraint('agency_job_applications', {
        fields: ['workspace_id', 'job_id', 'candidate_email'],
        type: 'unique',
        name: 'agency_job_applications_unique_candidate_email',
        transaction,
      });
      await addCheckConstraint(
        'agency_job_applications',
        'agency_job_applications_rating_range',
        'rating IS NULL OR (rating >= 0 AND rating <= 5)',
        transaction,
      );

      await queryInterface.createTable(
        'agency_interviews',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspace_id: { type: Sequelize.STRING(120), allowNull: false },
          application_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_job_applications', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          scheduled_at: { type: Sequelize.DATE, allowNull: false },
          duration_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 60 },
          mode: {
            type: Sequelize.ENUM('virtual', 'in_person', 'phone'),
            allowNull: false,
            defaultValue: 'virtual',
          },
          stage: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM('planned', 'completed', 'cancelled', 'reschedule_requested'),
            allowNull: false,
            defaultValue: 'planned',
          },
          interviewer_name: { type: Sequelize.STRING(180), allowNull: true },
          interviewer_email: { type: Sequelize.STRING(180), allowNull: true },
          meeting_url: { type: Sequelize.STRING(255), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          agenda: { type: Sequelize.TEXT, allowNull: true },
          feedback: { type: Sequelize.TEXT, allowNull: true },
          recording_url: { type: Sequelize.STRING(255), allowNull: true },
          created_by: { type: Sequelize.INTEGER, allowNull: true },
          updated_by: { type: Sequelize.INTEGER, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'agency_interviews',
        ['workspace_id', 'application_id', 'status'],
        { transaction, name: 'agency_interviews_workspace_application_status' },
      );
      await queryInterface.addIndex(
        'agency_interviews',
        ['workspace_id', 'scheduled_at'],
        { transaction, name: 'agency_interviews_workspace_scheduled_at' },
      );
      await addCheckConstraint(
        'agency_interviews',
        'agency_interviews_duration_positive',
        'duration_minutes > 0',
        transaction,
      );

      await queryInterface.createTable(
        'agency_job_favorites',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspace_id: { type: Sequelize.STRING(120), allowNull: false },
          job_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_jobs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          member_id: { type: Sequelize.INTEGER, allowNull: false },
          pinned_note: { type: Sequelize.STRING(255), allowNull: true },
          created_by: { type: Sequelize.INTEGER, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'agency_job_favorites',
        ['workspace_id', 'job_id', 'member_id'],
        { transaction, unique: true, name: 'agency_job_favorites_unique_member' },
      );

      await queryInterface.createTable(
        'agency_application_responses',
        {
          id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
          workspace_id: { type: Sequelize.STRING(120), allowNull: false },
          application_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'agency_job_applications', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          author_id: { type: Sequelize.INTEGER, allowNull: true },
          response_type: {
            type: Sequelize.ENUM('note', 'email', 'call', 'sms', 'meeting'),
            allowNull: false,
            defaultValue: 'note',
          },
          visibility: {
            type: Sequelize.ENUM('internal', 'shared_with_client'),
            allowNull: false,
            defaultValue: 'internal',
          },
          subject: { type: Sequelize.STRING(180), allowNull: true },
          body: { type: Sequelize.TEXT, allowNull: false },
          attachments: { type: jsonType, allowNull: true },
          created_by: { type: Sequelize.INTEGER, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'agency_application_responses',
        ['workspace_id', 'application_id'],
        { transaction, name: 'agency_application_responses_workspace_application' },
      );
      await queryInterface.addIndex(
        'agency_application_responses',
        ['workspace_id', 'response_type'],
        { transaction, name: 'agency_application_responses_workspace_response_type' },
      );
    });
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('agency_application_responses', { transaction });
      await queryInterface.dropTable('agency_job_favorites', { transaction });
      await queryInterface.dropTable('agency_interviews', { transaction });
      await queryInterface.dropTable('agency_job_applications', { transaction });
      await queryInterface.dropTable('agency_jobs', { transaction });

      if (['postgres', 'postgresql'].includes(dialect)) {
        const dropEnum = async (typeName) => {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${typeName}";`, { transaction });
        };

        await dropEnum('enum_agency_jobs_employment_type');
        await dropEnum('enum_agency_jobs_seniority');
        await dropEnum('enum_agency_jobs_status');
        await dropEnum('enum_agency_jobs_compensation_currency');
        await dropEnum('enum_agency_job_applications_status');
        await dropEnum('enum_agency_interviews_mode');
        await dropEnum('enum_agency_interviews_status');
        await dropEnum('enum_agency_application_responses_response_type');
        await dropEnum('enum_agency_application_responses_visibility');
      }
    });
  },
};
