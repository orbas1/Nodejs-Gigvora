/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.createTable(
      'governance_content_submissions',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        referenceId: {
          type: Sequelize.STRING(120),
          allowNull: false,
        },
        referenceType: {
          type: Sequelize.STRING(120),
          allowNull: false,
        },
        channel: {
          type: Sequelize.STRING(120),
          allowNull: true,
        },
        submittedById: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        submittedByType: {
          type: Sequelize.STRING(60),
          allowNull: false,
          defaultValue: 'user',
        },
        assignedReviewerId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        assignedTeam: {
          type: Sequelize.STRING(120),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM(
            'pending',
            'in_review',
            'approved',
            'rejected',
            'escalated',
            'needs_changes',
          ),
          allowNull: false,
          defaultValue: 'pending',
        },
        priority: {
          type: Sequelize.ENUM('low', 'standard', 'high', 'urgent'),
          allowNull: false,
          defaultValue: 'standard',
        },
        severity: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
          allowNull: false,
          defaultValue: 'medium',
        },
        riskScore: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        title: {
          type: Sequelize.STRING(240),
          allowNull: false,
        },
        summary: {
          type: Sequelize.STRING(600),
          allowNull: true,
        },
        submittedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        lastActivityAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        slaMinutes: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        region: {
          type: Sequelize.STRING(60),
          allowNull: true,
        },
        language: {
          type: Sequelize.STRING(12),
          allowNull: true,
        },
        metadata: {
          type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
            ? Sequelize.JSONB
            : Sequelize.JSON,
          allowNull: true,
          defaultValue: {},
        },
        rejectionReason: {
          type: Sequelize.STRING(600),
          allowNull: true,
        },
        resolutionNotes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      },
      { transaction },
    );

    await queryInterface.createTable(
      'governance_moderation_actions',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        submissionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'governance_content_submissions',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        actorId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        actorType: {
          type: Sequelize.STRING(60),
          allowNull: false,
          defaultValue: 'admin',
        },
        action: {
          type: Sequelize.ENUM(
            'assign',
            'approve',
            'reject',
            'escalate',
            'request_changes',
            'restore',
            'suspend',
            'add_note',
          ),
          allowNull: false,
          defaultValue: 'add_note',
        },
        severity: {
          type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
          allowNull: false,
          defaultValue: 'medium',
        },
        riskScore: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        reason: {
          type: Sequelize.STRING(600),
          allowNull: true,
        },
        guidanceLink: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        metadata: {
          type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
            ? Sequelize.JSONB
            : Sequelize.JSON,
          allowNull: true,
          defaultValue: {},
        },
        resolutionSummary: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      },
      { transaction },
    );

    await queryInterface.addIndex('governance_content_submissions', ['status'], { transaction });
    await queryInterface.addIndex('governance_content_submissions', ['priority'], { transaction });
    await queryInterface.addIndex('governance_content_submissions', ['severity'], { transaction });
    await queryInterface.addIndex('governance_content_submissions', ['assignedReviewerId'], { transaction });
    await queryInterface.addIndex('governance_content_submissions', ['submittedAt'], { transaction });
    await queryInterface.addIndex('governance_content_submissions', ['referenceId', 'referenceType'], {
      transaction,
    });
    await queryInterface.addIndex('governance_moderation_actions', ['submissionId'], { transaction });
    await queryInterface.addIndex('governance_moderation_actions', ['action'], { transaction });
    await queryInterface.addIndex('governance_moderation_actions', ['createdAt'], { transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.dropTable('governance_moderation_actions', { transaction });
    await queryInterface.dropTable('governance_content_submissions', { transaction });

    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_governance_content_submissions_status"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_governance_content_submissions_priority"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_governance_content_submissions_severity"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_governance_moderation_actions_action"', {
        transaction,
      });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_governance_moderation_actions_severity"', {
        transaction,
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
