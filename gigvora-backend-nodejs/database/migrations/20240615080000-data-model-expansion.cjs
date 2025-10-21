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
      const jsonType = ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON;
      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

      await queryInterface.createTable(
        'applications',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('applications', ['applicantId'], {
        name: 'applications_applicant_idx',
        transaction,
      });
      await queryInterface.addIndex('applications', ['targetType', 'targetId'], {
        name: 'applications_target_idx',
        transaction,
      });
      await queryInterface.addIndex('applications', ['status'], {
        name: 'applications_status_idx',
        transaction,
      });

      await queryInterface.createTable(
        'application_reviews',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('application_reviews', ['applicationId'], {
        name: 'application_reviews_application_idx',
        transaction,
      });
      await queryInterface.addIndex('application_reviews', ['reviewerId'], {
        name: 'application_reviews_reviewer_idx',
        transaction,
      });
      await queryInterface.addIndex('application_reviews', ['stage'], {
        name: 'application_reviews_stage_idx',
        transaction,
      });

      await queryInterface.createTable(
        'message_threads',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('message_threads', ['channelType'], {
        name: 'message_threads_channel_idx',
        transaction,
      });
      await queryInterface.addIndex('message_threads', ['state'], {
        name: 'message_threads_state_idx',
        transaction,
      });

      await queryInterface.createTable(
        'message_participants',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('message_participants', {
        fields: ['threadId', 'userId'],
        type: 'unique',
        name: 'message_participants_thread_user_unique',
        transaction,
      });
      await queryInterface.addIndex('message_participants', ['userId'], {
        name: 'message_participants_user_idx',
        transaction,
      });

      await queryInterface.createTable(
        'messages',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('messages', ['threadId'], {
        name: 'messages_thread_idx',
        transaction,
      });
      await queryInterface.addIndex('messages', ['senderId'], {
        name: 'messages_sender_idx',
        transaction,
      });
      await queryInterface.addIndex('messages', ['createdAt'], {
        name: 'messages_created_at_idx',
        transaction,
      });

      await queryInterface.createTable(
        'message_attachments',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('message_attachments', ['messageId'], {
        name: 'message_attachments_message_idx',
        transaction,
      });

      await queryInterface.createTable(
        'notifications',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('notifications', ['userId'], {
        name: 'notifications_user_idx',
        transaction,
      });
      await queryInterface.addIndex('notifications', ['status'], {
        name: 'notifications_status_idx',
        transaction,
      });
      await queryInterface.addIndex('notifications', ['category'], {
        name: 'notifications_category_idx',
        transaction,
      });

      await queryInterface.createTable(
        'notification_preferences',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'analytics_events',
        {
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
            defaultValue: timestampDefault,
          },
          ingestedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('analytics_events', ['eventName'], {
        name: 'analytics_events_name_idx',
        transaction,
      });
      await queryInterface.addIndex('analytics_events', ['occurredAt'], {
        name: 'analytics_events_occurred_idx',
        transaction,
      });
      await queryInterface.addIndex('analytics_events', ['entityType', 'entityId'], {
        name: 'analytics_events_entity_idx',
        transaction,
      });

      await queryInterface.createTable(
        'analytics_daily_rollups',
        {
          id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
          metricKey: { type: Sequelize.STRING(128), allowNull: false },
          dimensionHash: { type: Sequelize.STRING(64), allowNull: false },
          dimensions: { type: jsonType, allowNull: true },
          date: { type: Sequelize.DATEONLY, allowNull: false },
          value: { type: Sequelize.DECIMAL(18, 4), allowNull: false },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('analytics_daily_rollups', {
        fields: ['metricKey', 'date', 'dimensionHash'],
        type: 'unique',
        name: 'analytics_daily_rollups_unique_metric_date_dimension',
        transaction,
      });
      await queryInterface.addIndex('analytics_daily_rollups', ['metricKey'], {
        name: 'analytics_daily_rollups_metric_idx',
        transaction,
      });

      await queryInterface.createTable(
        'provider_workspaces',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('provider_workspaces', ['type'], {
        name: 'provider_workspaces_type_idx',
        transaction,
      });
      await queryInterface.addIndex('provider_workspaces', ['ownerId'], {
        name: 'provider_workspaces_owner_idx',
        transaction,
      });

      await queryInterface.createTable(
        'provider_workspace_members',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('provider_workspace_members', {
        fields: ['workspaceId', 'userId'],
        type: 'unique',
        name: 'provider_workspace_members_workspace_user_unique',
        transaction,
      });
      await queryInterface.addIndex('provider_workspace_members', ['workspaceId'], {
        name: 'provider_workspace_members_workspace_idx',
        transaction,
      });
      await queryInterface.addIndex('provider_workspace_members', ['status'], {
        name: 'provider_workspace_members_status_idx',
        transaction,
      });

      await queryInterface.createTable(
        'provider_workspace_invites',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('provider_workspace_invites', ['workspaceId'], {
        name: 'provider_workspace_invites_workspace_idx',
        transaction,
      });
      await queryInterface.addIndex('provider_workspace_invites', ['status'], {
        name: 'provider_workspace_invites_status_idx',
        transaction,
      });

      await queryInterface.createTable(
        'provider_contact_notes',
        {
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
            defaultValue: timestampDefault,
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: timestampDefault,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('provider_contact_notes', ['workspaceId'], {
        name: 'provider_contact_notes_workspace_idx',
        transaction,
      });
      await queryInterface.addIndex('provider_contact_notes', ['subjectUserId'], {
        name: 'provider_contact_notes_subject_idx',
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('provider_contact_notes', { transaction });
      await queryInterface.dropTable('provider_workspace_invites', { transaction });
      await queryInterface.dropTable('provider_workspace_members', { transaction });
      await queryInterface.dropTable('provider_workspaces', { transaction });
      await queryInterface.dropTable('analytics_daily_rollups', { transaction });
      await queryInterface.dropTable('analytics_events', { transaction });
      await queryInterface.dropTable('notification_preferences', { transaction });
      await queryInterface.dropTable('notifications', { transaction });
      await queryInterface.dropTable('message_attachments', { transaction });
      await queryInterface.dropTable('messages', { transaction });
      await queryInterface.dropTable('message_participants', { transaction });
      await queryInterface.dropTable('message_threads', { transaction });
      await queryInterface.dropTable('application_reviews', { transaction });
      await queryInterface.dropTable('applications', { transaction });

      await dropEnum(queryInterface, 'enum_provider_contact_notes_visibility', transaction);
      await dropEnum(queryInterface, 'enum_provider_workspace_invites_status', transaction);
      await dropEnum(queryInterface, 'enum_provider_workspace_invites_role', transaction);
      await dropEnum(queryInterface, 'enum_provider_workspace_members_status', transaction);
      await dropEnum(queryInterface, 'enum_provider_workspace_members_role', transaction);
      await dropEnum(queryInterface, 'enum_provider_workspaces_type', transaction);
      await dropEnum(queryInterface, 'enum_analytics_events_actorType', transaction);
      await dropEnum(queryInterface, 'enum_notification_preferences_digestFrequency', transaction);
      await dropEnum(queryInterface, 'enum_notifications_status', transaction);
      await dropEnum(queryInterface, 'enum_notifications_priority', transaction);
      await dropEnum(queryInterface, 'enum_notifications_category', transaction);
      await dropEnum(queryInterface, 'enum_messages_messageType', transaction);
      await dropEnum(queryInterface, 'enum_message_participants_role', transaction);
      await dropEnum(queryInterface, 'enum_message_threads_state', transaction);
      await dropEnum(queryInterface, 'enum_message_threads_channelType', transaction);
      await dropEnum(queryInterface, 'enum_application_reviews_decision', transaction);
      await dropEnum(queryInterface, 'enum_application_reviews_stage', transaction);
      await dropEnum(queryInterface, 'enum_applications_sourceChannel', transaction);
      await dropEnum(queryInterface, 'enum_applications_status', transaction);
      await dropEnum(queryInterface, 'enum_applications_targetType', transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
