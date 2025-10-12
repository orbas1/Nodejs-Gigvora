'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function ensureColumn(queryInterface, tableName, columnName, definition) {
  const columns = await queryInterface.describeTable(tableName);
  if (!columns[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await ensureColumn(queryInterface, 'experience_launchpads', 'programType', {
      type: Sequelize.STRING(60),
      allowNull: false,
      defaultValue: 'cohort',
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'status', {
      type: Sequelize.ENUM('draft', 'recruiting', 'active', 'archived'),
      allowNull: false,
      defaultValue: 'recruiting',
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'applicationUrl', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'mentorLead', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'startDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'endDate', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'capacity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'eligibilityCriteria', {
      type: jsonType,
      allowNull: true,
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'employerSponsorship', {
      type: jsonType,
      allowNull: true,
    });

    await ensureColumn(queryInterface, 'experience_launchpads', 'publishedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.createTable('experience_launchpad_applications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      launchpadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'experience_launchpads', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      applicantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'applications', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('screening', 'interview', 'accepted', 'waitlisted', 'rejected', 'withdrawn', 'completed'),
        allowNull: false,
        defaultValue: 'screening',
      },
      qualificationScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      yearsExperience: { type: Sequelize.DECIMAL(4, 1), allowNull: true },
      skills: { type: Sequelize.JSON, allowNull: true },
      motivations: { type: Sequelize.TEXT, allowNull: true },
      portfolioUrl: { type: Sequelize.STRING(500), allowNull: true },
      availabilityDate: { type: Sequelize.DATE, allowNull: true },
      eligibilitySnapshot: { type: jsonType, allowNull: true },
      assignedMentor: { type: Sequelize.STRING(255), allowNull: true },
      interviewScheduledAt: { type: Sequelize.DATE, allowNull: true },
      decisionNotes: { type: Sequelize.TEXT, allowNull: true },
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
    });

    await queryInterface.addIndex('experience_launchpad_applications', ['launchpadId', 'status']);
    await queryInterface.addIndex('experience_launchpad_applications', ['applicantId']);

    await queryInterface.createTable('experience_launchpad_employer_requests', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      launchpadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'experience_launchpads', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      organizationName: { type: Sequelize.STRING(255), allowNull: false },
      contactName: { type: Sequelize.STRING(255), allowNull: false },
      contactEmail: { type: Sequelize.STRING(255), allowNull: false },
      headcount: { type: Sequelize.INTEGER, allowNull: true },
      engagementTypes: { type: Sequelize.JSON, allowNull: true },
      targetStartDate: { type: Sequelize.DATE, allowNull: true },
      idealCandidateProfile: { type: Sequelize.TEXT, allowNull: true },
      hiringNotes: { type: Sequelize.TEXT, allowNull: true },
      status: {
        type: Sequelize.ENUM('new', 'needs_review', 'approved', 'declined', 'paused'),
        allowNull: false,
        defaultValue: 'new',
      },
      slaCommitmentDays: { type: Sequelize.INTEGER, allowNull: true },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
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
    });

    await queryInterface.addIndex('experience_launchpad_employer_requests', ['launchpadId', 'status']);
    await queryInterface.addIndex('experience_launchpad_employer_requests', ['contactEmail']);

    await queryInterface.createTable('experience_launchpad_placements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      launchpadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'experience_launchpads', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      candidateId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'experience_launchpad_applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      employerRequestId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'experience_launchpad_employer_requests', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      targetType: {
        type: Sequelize.ENUM('job', 'gig', 'project'),
        allowNull: true,
      },
      targetId: { type: Sequelize.INTEGER, allowNull: true },
      status: {
        type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      placementDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      compensation: { type: jsonType, allowNull: true },
      feedbackScore: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
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
    });

    await queryInterface.addIndex('experience_launchpad_placements', ['launchpadId', 'status']);
    await queryInterface.addIndex('experience_launchpad_placements', ['candidateId']);

    await queryInterface.createTable('experience_launchpad_opportunity_links', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      launchpadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'experience_launchpads', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      targetType: {
        type: Sequelize.ENUM('job', 'gig', 'project'),
        allowNull: false,
      },
      targetId: { type: Sequelize.INTEGER, allowNull: false },
      source: {
        type: Sequelize.ENUM('employer_request', 'placement', 'manual'),
        allowNull: false,
        defaultValue: 'manual',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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
    });

    await queryInterface.addIndex('experience_launchpad_opportunity_links', ['launchpadId', 'targetType']);
    await queryInterface.addIndex('experience_launchpad_opportunity_links', ['targetType', 'targetId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('experience_launchpad_opportunity_links', ['targetType', 'targetId']).catch(() => {});
    await queryInterface.removeIndex('experience_launchpad_opportunity_links', ['launchpadId', 'targetType']).catch(() => {});
    await queryInterface.dropTable('experience_launchpad_opportunity_links').catch(() => {});

    await queryInterface.removeIndex('experience_launchpad_placements', ['candidateId']).catch(() => {});
    await queryInterface.removeIndex('experience_launchpad_placements', ['launchpadId', 'status']).catch(() => {});
    await queryInterface.dropTable('experience_launchpad_placements').catch(() => {});

    await queryInterface.removeIndex('experience_launchpad_employer_requests', ['contactEmail']).catch(() => {});
    await queryInterface.removeIndex('experience_launchpad_employer_requests', ['launchpadId', 'status']).catch(() => {});
    await queryInterface.dropTable('experience_launchpad_employer_requests').catch(() => {});

    await queryInterface.removeIndex('experience_launchpad_applications', ['applicantId']).catch(() => {});
    await queryInterface.removeIndex('experience_launchpad_applications', ['launchpadId', 'status']).catch(() => {});
    await queryInterface.dropTable('experience_launchpad_applications').catch(() => {});

    const columns = await queryInterface.describeTable('experience_launchpads');
    const dropColumn = async (name) => {
      if (columns[name]) {
        await queryInterface.removeColumn('experience_launchpads', name).catch(() => {});
      }
    };

    await dropColumn('publishedAt');
    await dropColumn('employerSponsorship');
    await dropColumn('eligibilityCriteria');
    await dropColumn('capacity');
    await dropColumn('endDate');
    await dropColumn('startDate');
    await dropColumn('mentorLead');
    await dropColumn('applicationUrl');
    await dropColumn('status');
    await dropColumn('programType');

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_experience_launchpads_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_experience_launchpad_applications_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_experience_launchpad_employer_requests_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_experience_launchpad_placements_status";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_experience_launchpad_placements_targetType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_experience_launchpad_opportunity_links_targetType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_experience_launchpad_opportunity_links_source";');
    }
  },
};
