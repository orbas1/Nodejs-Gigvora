'use strict';

const dropEnum = async (queryInterface, enumName) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (dialect === 'postgres' || dialect === 'postgresql') {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
      ? Sequelize.JSONB
      : Sequelize.JSON;

    await queryInterface.createTable('applications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      applicantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      targetType: {
        type: Sequelize.ENUM('job', 'gig', 'project', 'launchpad', 'volunteer'),
        allowNull: false,
      },
      targetId: { type: Sequelize.INTEGER, allowNull: false },
      status: {
        type: Sequelize.ENUM(
          'draft',
          'submitted',
          'under_review',
          'shortlisted',
          'interview',
          'offered',
          'hired',
          'rejected',
          'withdrawn',
        ),
        allowNull: false,
        defaultValue: 'submitted',
      },
      sourceChannel: {
        type: Sequelize.ENUM('web', 'mobile', 'referral', 'agency', 'import'),
        allowNull: false,
        defaultValue: 'web',
      },
      coverLetter: { type: Sequelize.TEXT, allowNull: true },
      attachments: { type: jsonType, allowNull: true },
      rateExpectation: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      currencyCode: { type: Sequelize.STRING(3), allowNull: true },
      availabilityDate: { type: Sequelize.DATEONLY, allowNull: true },
      isArchived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      submittedAt: { type: Sequelize.DATE, allowNull: true },
      decisionAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('applications', ['applicantId']);
    await queryInterface.addIndex('applications', ['targetType', 'targetId']);
    await queryInterface.addIndex('applications', ['status']);

    await queryInterface.createTable('application_reviews', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      applicationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      reviewerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      stage: {
        type: Sequelize.ENUM('screen', 'interview', 'assessment', 'final', 'offer'),
        allowNull: false,
      },
      decision: {
        type: Sequelize.ENUM('pending', 'advance', 'reject', 'hold', 'withdrawn'),
        allowNull: false,
        defaultValue: 'pending',
      },
      score: { type: Sequelize.INTEGER, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      decidedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('application_reviews', ['applicationId']);
    await queryInterface.addIndex('application_reviews', ['reviewerId']);
    await queryInterface.addIndex('application_reviews', ['stage']);

    await queryInterface.createTable('message_threads', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      subject: { type: Sequelize.STRING(255), allowNull: true },
      channelType: {
        type: Sequelize.ENUM('support', 'project', 'contract', 'group', 'direct'),
        allowNull: false,
        defaultValue: 'direct',
      },
      state: {
        type: Sequelize.ENUM('active', 'archived', 'locked'),
        allowNull: false,
        defaultValue: 'active',
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      lastMessageAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('message_threads', ['channelType']);
    await queryInterface.addIndex('message_threads', ['state']);

    await queryInterface.createTable('message_participants', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      threadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'message_threads', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'participant', 'support', 'system'),
        allowNull: false,
        defaultValue: 'participant',
      },
      notificationsEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      mutedUntil: { type: Sequelize.DATE, allowNull: true },
      lastReadAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addConstraint('message_participants', {
      fields: ['threadId', 'userId'],
      type: 'unique',
      name: 'message_participants_thread_user_unique',
    });
    await queryInterface.addIndex('message_participants', ['userId']);

    await queryInterface.createTable('messages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      threadId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'message_threads', key: 'id' },
        onDelete: 'CASCADE',
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      messageType: {
        type: Sequelize.ENUM('text', 'file', 'system', 'event'),
        allowNull: false,
        defaultValue: 'text',
      },
      body: { type: Sequelize.TEXT, allowNull: true },
      metadata: { type: jsonType, allowNull: true },
      isEdited: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      editedAt: { type: Sequelize.DATE, allowNull: true },
      deletedAt: { type: Sequelize.DATE, allowNull: true },
      deliveredAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('messages', ['threadId']);
    await queryInterface.addIndex('messages', ['senderId']);
    await queryInterface.addIndex('messages', ['createdAt']);

    await queryInterface.createTable('message_attachments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'messages', key: 'id' },
        onDelete: 'CASCADE',
      },
      storageKey: { type: Sequelize.STRING(512), allowNull: false },
      fileName: { type: Sequelize.STRING(255), allowNull: false },
      mimeType: { type: Sequelize.STRING(128), allowNull: false },
      fileSize: { type: Sequelize.BIGINT, allowNull: false },
      checksum: { type: Sequelize.STRING(128), allowNull: true },
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

    await queryInterface.addIndex('message_attachments', ['messageId']);

    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      category: {
        type: Sequelize.ENUM('system', 'message', 'project', 'financial', 'compliance', 'marketing'),
        allowNull: false,
        defaultValue: 'system',
      },
      type: { type: Sequelize.STRING(128), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      payload: { type: jsonType, allowNull: true },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'normal',
      },
      status: {
        type: Sequelize.ENUM('pending', 'delivered', 'read', 'dismissed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      deliveredAt: { type: Sequelize.DATE, allowNull: true },
      readAt: { type: Sequelize.DATE, allowNull: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['status']);
    await queryInterface.addIndex('notifications', ['category']);

    await queryInterface.createTable('notification_preferences', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      emailEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      pushEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      smsEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      inAppEnabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      digestFrequency: {
        type: Sequelize.ENUM('immediate', 'daily', 'weekly'),
        allowNull: false,
        defaultValue: 'immediate',
      },
      quietHoursStart: { type: Sequelize.TIME, allowNull: true },
      quietHoursEnd: { type: Sequelize.TIME, allowNull: true },
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

    await queryInterface.createTable('analytics_events', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      eventName: { type: Sequelize.STRING(128), allowNull: false },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      actorType: {
        type: Sequelize.ENUM('user', 'system', 'anonymous'),
        allowNull: false,
        defaultValue: 'user',
      },
      entityType: { type: Sequelize.STRING(64), allowNull: true },
      entityId: { type: Sequelize.INTEGER, allowNull: true },
      source: { type: Sequelize.STRING(64), allowNull: true },
      context: { type: jsonType, allowNull: true },
      occurredAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      ingestedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('analytics_events', ['eventName']);
    await queryInterface.addIndex('analytics_events', ['occurredAt']);
    await queryInterface.addIndex('analytics_events', ['entityType', 'entityId']);

    await queryInterface.createTable('analytics_daily_rollups', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      metricKey: { type: Sequelize.STRING(128), allowNull: false },
      dimensionHash: { type: Sequelize.STRING(64), allowNull: false },
      dimensions: { type: jsonType, allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      value: { type: Sequelize.DECIMAL(18, 4), allowNull: false },
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

    await queryInterface.addConstraint('analytics_daily_rollups', {
      fields: ['metricKey', 'date', 'dimensionHash'],
      type: 'unique',
      name: 'analytics_daily_rollups_unique_metric_date_dimension',
    });
    await queryInterface.addIndex('analytics_daily_rollups', ['metricKey']);

    await queryInterface.createTable('provider_workspaces', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      type: {
        type: Sequelize.ENUM('agency', 'company', 'recruiter', 'partner'),
        allowNull: false,
        defaultValue: 'agency',
      },
      timezone: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'UTC' },
      defaultCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      intakeEmail: { type: Sequelize.STRING(255), allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      settings: { type: jsonType, allowNull: true },
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

    await queryInterface.addIndex('provider_workspaces', ['type']);
    await queryInterface.addIndex('provider_workspaces', ['ownerId']);

    await queryInterface.createTable('provider_workspace_members', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'manager', 'staff', 'viewer'),
        allowNull: false,
        defaultValue: 'staff',
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'suspended', 'revoked'),
        allowNull: false,
        defaultValue: 'pending',
      },
      invitedById: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      joinedAt: { type: Sequelize.DATE, allowNull: true },
      lastActiveAt: { type: Sequelize.DATE, allowNull: true },
      removedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addConstraint('provider_workspace_members', {
      fields: ['workspaceId', 'userId'],
      type: 'unique',
      name: 'provider_workspace_members_workspace_user_unique',
    });
    await queryInterface.addIndex('provider_workspace_members', ['workspaceId']);
    await queryInterface.addIndex('provider_workspace_members', ['status']);

    await queryInterface.createTable('provider_workspace_invites', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      email: { type: Sequelize.STRING(255), allowNull: false },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'manager', 'staff', 'viewer'),
        allowNull: false,
        defaultValue: 'staff',
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'expired', 'revoked'),
        allowNull: false,
        defaultValue: 'pending',
      },
      inviteToken: { type: Sequelize.STRING(64), allowNull: false, unique: true },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      invitedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      acceptedAt: { type: Sequelize.DATE, allowNull: true },
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

    await queryInterface.addIndex('provider_workspace_invites', ['workspaceId']);
    await queryInterface.addIndex('provider_workspace_invites', ['status']);

    await queryInterface.createTable('provider_contact_notes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'provider_workspaces', key: 'id' },
        onDelete: 'CASCADE',
      },
      subjectUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      note: { type: Sequelize.TEXT, allowNull: false },
      visibility: {
        type: Sequelize.ENUM('internal', 'shared', 'compliance'),
        allowNull: false,
        defaultValue: 'internal',
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
    });

    await queryInterface.addIndex('provider_contact_notes', ['workspaceId']);
    await queryInterface.addIndex('provider_contact_notes', ['subjectUserId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_contact_notes');
    await queryInterface.dropTable('provider_workspace_invites');
    await queryInterface.dropTable('provider_workspace_members');
    await queryInterface.dropTable('provider_workspaces');
    await queryInterface.dropTable('analytics_daily_rollups');
    await queryInterface.dropTable('analytics_events');
    await queryInterface.dropTable('notification_preferences');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('message_attachments');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('message_participants');
    await queryInterface.dropTable('message_threads');
    await queryInterface.dropTable('application_reviews');
    await queryInterface.dropTable('applications');

    await dropEnum(queryInterface, 'enum_provider_contact_notes_visibility');
    await dropEnum(queryInterface, 'enum_provider_workspace_invites_status');
    await dropEnum(queryInterface, 'enum_provider_workspace_invites_role');
    await dropEnum(queryInterface, 'enum_provider_workspace_members_status');
    await dropEnum(queryInterface, 'enum_provider_workspace_members_role');
    await dropEnum(queryInterface, 'enum_provider_workspaces_type');
    await dropEnum(queryInterface, 'enum_analytics_events_actorType');
    await dropEnum(queryInterface, 'enum_notification_preferences_digestFrequency');
    await dropEnum(queryInterface, 'enum_notifications_status');
    await dropEnum(queryInterface, 'enum_notifications_priority');
    await dropEnum(queryInterface, 'enum_notifications_category');
    await dropEnum(queryInterface, 'enum_messages_messageType');
    await dropEnum(queryInterface, 'enum_message_participants_role');
    await dropEnum(queryInterface, 'enum_message_threads_state');
    await dropEnum(queryInterface, 'enum_message_threads_channelType');
    await dropEnum(queryInterface, 'enum_application_reviews_decision');
    await dropEnum(queryInterface, 'enum_application_reviews_stage');
    await dropEnum(queryInterface, 'enum_applications_sourceChannel');
    await dropEnum(queryInterface, 'enum_applications_status');
    await dropEnum(queryInterface, 'enum_applications_targetType');
  },
};
