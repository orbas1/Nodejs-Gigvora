'use strict';

const SERVICE_LINES_TABLE = 'service_lines';
const COURSES_TABLE = 'learning_courses';
const COURSE_MODULES_TABLE = 'learning_course_modules';
const ENROLLMENTS_TABLE = 'learning_course_enrollments';
const MENTORING_TABLE = 'peer_mentoring_sessions';
const DIAGNOSTICS_TABLE = 'skill_gap_diagnostics';
const CERTIFICATIONS_TABLE = 'freelancer_certifications';
const RECOMMENDATIONS_TABLE = 'ai_service_recommendations';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);
    const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        SERVICE_LINES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          name: { type: Sequelize.STRING(160), allowNull: false },
          slug: { type: Sequelize.STRING(160), allowNull: false, unique: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint(SERVICE_LINES_TABLE, {
        type: 'unique',
        fields: ['slug'],
        name: 'service_lines_slug_unique',
        transaction,
      });

      await queryInterface.createTable(
        COURSES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          serviceLineId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: SERVICE_LINES_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: true },
          difficulty: {
            type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
            allowNull: false,
            defaultValue: 'intermediate',
          },
          format: { type: Sequelize.STRING(120), allowNull: true },
          durationHours: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.createTable(
        COURSE_MODULES_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          courseId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: COURSES_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          moduleType: { type: Sequelize.STRING(120), allowNull: true },
          durationMinutes: { type: Sequelize.INTEGER, allowNull: true },
          sequence: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          resources: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.createTable(
        ENROLLMENTS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          courseId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: COURSES_TABLE, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          status: {
            type: Sequelize.ENUM('not_started', 'in_progress', 'completed', 'archived'),
            allowNull: false,
            defaultValue: 'not_started',
          },
          progress: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          lastAccessedAt: { type: Sequelize.DATE, allowNull: true },
          startedAt: { type: Sequelize.DATE, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addConstraint(ENROLLMENTS_TABLE, {
        type: 'unique',
        fields: ['userId', 'courseId'],
        name: 'learning_course_enrollments_unique_user_course',
        transaction,
      });

      await queryInterface.createTable(
        MENTORING_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          serviceLineId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: SERVICE_LINES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          menteeId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          topic: { type: Sequelize.STRING(255), allowNull: false },
          agenda: { type: Sequelize.TEXT, allowNull: true },
          scheduledAt: { type: Sequelize.DATE, allowNull: false },
          durationMinutes: { type: Sequelize.INTEGER, allowNull: true },
          status: {
            type: Sequelize.ENUM('requested', 'scheduled', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'requested',
          },
          meetingUrl: { type: Sequelize.STRING(255), allowNull: true },
          recordingUrl: { type: Sequelize.STRING(255), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.createTable(
        DIAGNOSTICS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          serviceLineId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: SERVICE_LINES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          summary: { type: Sequelize.TEXT, allowNull: true },
          strengths: { type: jsonType, allowNull: true },
          gaps: { type: jsonType, allowNull: true },
          recommendedActions: { type: jsonType, allowNull: true },
          completedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.createTable(
        CERTIFICATIONS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          serviceLineId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: SERVICE_LINES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          name: { type: Sequelize.STRING(200), allowNull: false },
          issuingOrganization: { type: Sequelize.STRING(200), allowNull: true },
          credentialId: { type: Sequelize.STRING(120), allowNull: true },
          credentialUrl: { type: Sequelize.STRING(255), allowNull: true },
          issueDate: { type: Sequelize.DATEONLY, allowNull: true },
          expirationDate: { type: Sequelize.DATEONLY, allowNull: true },
          status: {
            type: Sequelize.ENUM('active', 'expiring_soon', 'expired', 'revoked'),
            allowNull: false,
            defaultValue: 'active',
          },
          reminderSentAt: { type: Sequelize.DATE, allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.createTable(
        RECOMMENDATIONS_TABLE,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          serviceLineId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: SERVICE_LINES_TABLE, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          confidenceScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
          sourceSignals: { type: jsonType, allowNull: true },
          generatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      const indexDefinitions = [
        [COURSES_TABLE, ['serviceLineId'], 'learning_courses_service_line_idx'],
        [COURSES_TABLE, ['difficulty'], 'learning_courses_difficulty_idx'],
        [ENROLLMENTS_TABLE, ['userId', 'status'], 'learning_enrollments_user_status_idx'],
        [ENROLLMENTS_TABLE, ['courseId'], 'learning_enrollments_course_idx'],
        [MENTORING_TABLE, ['menteeId', 'status', 'scheduledAt'], 'peer_mentoring_mentee_status_schedule_idx'],
        [MENTORING_TABLE, ['mentorId', 'status'], 'peer_mentoring_mentor_status_idx'],
        [DIAGNOSTICS_TABLE, ['userId', 'serviceLineId'], 'skill_gap_diagnostics_user_service_idx'],
        [CERTIFICATIONS_TABLE, ['userId', 'status'], 'freelancer_certifications_user_status_idx'],
        [CERTIFICATIONS_TABLE, ['expirationDate'], 'freelancer_certifications_expiration_idx'],
        [RECOMMENDATIONS_TABLE, ['userId', 'generatedAt'], 'ai_service_recommendations_user_generated_idx'],
      ];

      for (const [table, fields, name] of indexDefinitions) {
        await queryInterface.addIndex(table, fields, { transaction, name });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const indexMappings = [
        [RECOMMENDATIONS_TABLE, 'ai_service_recommendations_user_generated_idx'],
        [CERTIFICATIONS_TABLE, 'freelancer_certifications_expiration_idx'],
        [CERTIFICATIONS_TABLE, 'freelancer_certifications_user_status_idx'],
        [DIAGNOSTICS_TABLE, 'skill_gap_diagnostics_user_service_idx'],
        [MENTORING_TABLE, 'peer_mentoring_mentor_status_idx'],
        [MENTORING_TABLE, 'peer_mentoring_mentee_status_schedule_idx'],
        [ENROLLMENTS_TABLE, 'learning_enrollments_course_idx'],
        [ENROLLMENTS_TABLE, 'learning_enrollments_user_status_idx'],
        [COURSES_TABLE, 'learning_courses_difficulty_idx'],
        [COURSES_TABLE, 'learning_courses_service_line_idx'],
      ];

      for (const [table, name] of indexMappings) {
        await queryInterface.removeIndex(table, name, { transaction });
      }

      await queryInterface.removeConstraint(
        ENROLLMENTS_TABLE,
        'learning_course_enrollments_unique_user_course',
        { transaction },
      );

      await queryInterface.dropTable(RECOMMENDATIONS_TABLE, { transaction });
      await queryInterface.dropTable(CERTIFICATIONS_TABLE, { transaction });
      await queryInterface.dropTable(DIAGNOSTICS_TABLE, { transaction });
      await queryInterface.dropTable(MENTORING_TABLE, { transaction });
      await queryInterface.dropTable(ENROLLMENTS_TABLE, { transaction });
      await queryInterface.dropTable(COURSE_MODULES_TABLE, { transaction });
      await queryInterface.dropTable(COURSES_TABLE, { transaction });
      await queryInterface.removeConstraint(SERVICE_LINES_TABLE, 'service_lines_slug_unique', { transaction });
      await queryInterface.dropTable(SERVICE_LINES_TABLE, { transaction });

      const dropEnum = async (enumName) => {
        const dialect = queryInterface.sequelize.getDialect();
        if (dialect === 'postgres' || dialect === 'postgresql') {
          await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction });
        }
      };

      await dropEnum('enum_learning_courses_difficulty');
      await dropEnum('enum_learning_course_enrollments_status');
      await dropEnum('enum_peer_mentoring_sessions_status');
      await dropEnum('enum_freelancer_certifications_status');
    });
  },
};
