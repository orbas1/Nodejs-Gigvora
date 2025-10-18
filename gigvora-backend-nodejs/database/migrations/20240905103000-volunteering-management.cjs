'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('volunteering_posts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(180), allowNull: false },
      summary: { type: Sequelize.STRING(255), allowNull: true },
      description: { type: Sequelize.TEXT('long'), allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'open', 'paused', 'closed', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      location: { type: Sequelize.STRING(255), allowNull: true },
      remoteFriendly: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      commitmentHours: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      applicationUrl: { type: Sequelize.STRING(500), allowNull: true },
      contactEmail: { type: Sequelize.STRING(255), allowNull: true },
      startDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      applicationDeadline: { type: Sequelize.DATE, allowNull: true },
      tags: { type: jsonType, allowNull: true },
      skills: { type: jsonType, allowNull: true },
      benefits: { type: jsonType, allowNull: true },
      requirements: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('volunteering_posts', ['workspaceId']);
    await queryInterface.addIndex('volunteering_posts', ['status']);
    await queryInterface.addIndex('volunteering_posts', ['applicationDeadline']);

    await queryInterface.createTable('volunteering_applications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_posts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      candidateName: { type: Sequelize.STRING(180), allowNull: false },
      candidateEmail: { type: Sequelize.STRING(255), allowNull: true },
      candidatePhone: { type: Sequelize.STRING(60), allowNull: true },
      resumeUrl: { type: Sequelize.STRING(500), allowNull: true },
      portfolioUrl: { type: Sequelize.STRING(500), allowNull: true },
      coverLetter: { type: Sequelize.TEXT('long'), allowNull: true },
      status: {
        type: Sequelize.ENUM('submitted', 'in_review', 'interview', 'offer', 'placed', 'declined', 'withdrawn'),
        allowNull: false,
        defaultValue: 'submitted',
      },
      stage: { type: Sequelize.STRING(120), allowNull: true },
      submittedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      assignedTo: { type: Sequelize.STRING(180), allowNull: true },
      source: { type: Sequelize.STRING(120), allowNull: true },
      notes: { type: Sequelize.TEXT('long'), allowNull: true },
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

    await queryInterface.addIndex('volunteering_applications', ['workspaceId']);
    await queryInterface.addIndex('volunteering_applications', ['postId']);
    await queryInterface.addIndex('volunteering_applications', ['status']);
    await queryInterface.addIndex('volunteering_applications', ['submittedAt']);

    await queryInterface.createTable('volunteering_application_responses', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      actorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      actorName: { type: Sequelize.STRING(180), allowNull: true },
      actorRole: { type: Sequelize.STRING(120), allowNull: true },
      responseType: {
        type: Sequelize.ENUM('message', 'note', 'status_update'),
        allowNull: false,
        defaultValue: 'message',
      },
      visibility: {
        type: Sequelize.ENUM('internal', 'candidate'),
        allowNull: false,
        defaultValue: 'internal',
      },
      message: { type: Sequelize.TEXT('long'), allowNull: false },
      attachments: { type: jsonType, allowNull: true },
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
    });

    await queryInterface.addIndex('volunteering_application_responses', ['workspaceId']);
    await queryInterface.addIndex('volunteering_application_responses', ['applicationId']);
    await queryInterface.addIndex('volunteering_application_responses', ['sentAt']);

    await queryInterface.createTable('volunteering_interviews', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      scheduledAt: { type: Sequelize.DATE, allowNull: false },
      durationMinutes: { type: Sequelize.INTEGER, allowNull: true },
      interviewerName: { type: Sequelize.STRING(180), allowNull: true },
      interviewerEmail: { type: Sequelize.STRING(255), allowNull: true },
      location: { type: Sequelize.STRING(255), allowNull: true },
      meetingUrl: { type: Sequelize.STRING(500), allowNull: true },
      status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      feedback: { type: Sequelize.TEXT('long'), allowNull: true },
      score: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
      notes: { type: Sequelize.TEXT('long'), allowNull: true },
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

    await queryInterface.addIndex('volunteering_interviews', ['workspaceId']);
    await queryInterface.addIndex('volunteering_interviews', ['applicationId']);
    await queryInterface.addIndex('volunteering_interviews', ['scheduledAt']);
    await queryInterface.addIndex('volunteering_interviews', ['status']);

    await queryInterface.createTable('volunteering_contracts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_applications', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      contractType: {
        type: Sequelize.ENUM('fixed_term', 'ongoing', 'event'),
        allowNull: false,
        defaultValue: 'fixed_term',
      },
      startDate: { type: Sequelize.DATE, allowNull: true },
      endDate: { type: Sequelize.DATE, allowNull: true },
      hoursPerWeek: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      stipendAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
      deliverables: { type: jsonType, allowNull: true },
      terms: { type: Sequelize.TEXT('long'), allowNull: true },
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

    await queryInterface.addIndex('volunteering_contracts', ['workspaceId']);
    await queryInterface.addIndex('volunteering_contracts', ['applicationId']);
    await queryInterface.addIndex('volunteering_contracts', ['status']);

    await queryInterface.createTable('volunteering_contract_spend', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      contractId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'volunteering_contracts', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      updatedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
      category: { type: Sequelize.STRING(120), allowNull: true },
      description: { type: Sequelize.STRING(255), allowNull: true },
      spentAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      receiptUrl: { type: Sequelize.STRING(500), allowNull: true },
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

    await queryInterface.addIndex('volunteering_contract_spend', ['workspaceId']);
    await queryInterface.addIndex('volunteering_contract_spend', ['contractId']);
    await queryInterface.addIndex('volunteering_contract_spend', ['spentAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('volunteering_contract_spend');
    await queryInterface.dropTable('volunteering_contracts');
    await queryInterface.dropTable('volunteering_interviews');
    await queryInterface.dropTable('volunteering_application_responses');
    await queryInterface.dropTable('volunteering_applications');
    await queryInterface.dropTable('volunteering_posts');

    const dropEnum = async (table, column) => {
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres' || dialect === 'postgresql') {
        const enumName = `enum_${table}_${column}`;
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}"`);
      }
    };

    await dropEnum('volunteering_posts', 'status');
    await dropEnum('volunteering_applications', 'status');
    await dropEnum('volunteering_application_responses', 'responseType');
    await dropEnum('volunteering_application_responses', 'visibility');
    await dropEnum('volunteering_interviews', 'status');
    await dropEnum('volunteering_contracts', 'status');
    await dropEnum('volunteering_contracts', 'contractType');
  },
};
