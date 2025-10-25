'use strict';

const BOOKING_STATUSES = ['Scheduled', 'Awaiting pre-work', 'Completed', 'Cancelled', 'Rescheduled'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Refunded', 'Overdue'];
const CLIENT_STATUSES = ['Active', 'Onboarding', 'Paused', 'Graduated', 'Churned'];
const RELATIONSHIP_TIERS = ['Flagship', 'Growth', 'Trial', 'Past'];
const EVENT_TYPES = ['Session', 'Office hours', 'Workshop', 'Cohort'];
const EVENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Awaiting prep'];
const SUPPORT_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const SUPPORT_STATUSES = ['Open', 'Awaiting mentor', 'Awaiting support', 'Resolved'];
const MESSAGE_CHANNELS = ['Explorer', 'Email', 'Slack Connect', 'WhatsApp'];
const MESSAGE_STATUSES = ['Unread', 'Read', 'Archived'];
const DOCUMENT_TYPES = ['Passport', 'National ID', 'Driving licence', 'Business certificate'];
const DOCUMENT_STATUSES = ['Pending', 'In review', 'Approved', 'Action required'];
const VERIFICATION_STATUSES = ['Not started', 'In review', 'Action required', 'Approved'];
const TRANSACTION_TYPES = ['Payout', 'Mentorship earning', 'Adjustment'];
const TRANSACTION_STATUSES = ['Pending', 'Completed', 'Failed', 'Processing'];
const INVOICE_STATUSES = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
const PAYOUT_STATUSES = ['Scheduled', 'Processing', 'Paid', 'Failed'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'mentor_availability_slots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          dayOfWeek: { type: Sequelize.STRING(16), allowNull: false },
          startTime: { type: Sequelize.DATE, allowNull: false },
          endTime: { type: Sequelize.DATE, allowNull: false },
          format: { type: Sequelize.STRING(120), allowNull: false },
          capacity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_availability_slots', ['mentorId'], {
          transaction,
          name: 'mentor_availability_slots_mentor_idx',
        }),
        queryInterface.addIndex('mentor_availability_slots', ['mentorId', 'dayOfWeek'], {
          transaction,
          name: 'mentor_availability_slots_mentor_day_idx',
        }),
      ]);

      await queryInterface.createTable(
        'mentor_packages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          sessions: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'GBP' },
          format: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Virtual' },
          outcome: { type: Sequelize.STRING(255), allowNull: false },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_packages', ['mentorId'], {
        transaction,
        name: 'mentor_packages_mentor_idx',
      });

      await queryInterface.createTable(
        'mentor_bookings',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          menteeName: { type: Sequelize.STRING(191), allowNull: false },
          menteeRole: { type: Sequelize.STRING(191), allowNull: true },
          packageName: { type: Sequelize.STRING(191), allowNull: true },
          focus: { type: Sequelize.STRING(191), allowNull: true },
          scheduledAt: { type: Sequelize.DATE, allowNull: false },
          status: { type: Sequelize.ENUM(...BOOKING_STATUSES), allowNull: false, defaultValue: 'Scheduled' },
          price: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'GBP' },
          paymentStatus: { type: Sequelize.ENUM(...PAYMENT_STATUSES), allowNull: false, defaultValue: 'Pending' },
          channel: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Explorer' },
          segment: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'active' },
          conferenceLink: { type: Sequelize.STRING(512), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_bookings', ['mentorId'], {
          transaction,
          name: 'mentor_bookings_mentor_idx',
        }),
        queryInterface.addIndex('mentor_bookings', ['mentorId', 'scheduledAt'], {
          transaction,
          name: 'mentor_bookings_schedule_idx',
        }),
      ]);

      await queryInterface.createTable(
        'mentor_clients',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(191), allowNull: false },
          company: { type: Sequelize.STRING(191), allowNull: true },
          role: { type: Sequelize.STRING(191), allowNull: true },
          status: { type: Sequelize.ENUM(...CLIENT_STATUSES), allowNull: false, defaultValue: 'Active' },
          tier: { type: Sequelize.ENUM(...RELATIONSHIP_TIERS), allowNull: false, defaultValue: 'Growth' },
          value: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'GBP' },
          channel: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'Explorer' },
          tags: { type: jsonType, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          onboardedAt: { type: Sequelize.DATE, allowNull: true },
          lastSessionAt: { type: Sequelize.DATE, allowNull: true },
          nextSessionAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_clients', ['mentorId'], {
          transaction,
          name: 'mentor_clients_mentor_idx',
        }),
        queryInterface.addIndex('mentor_clients', ['mentorId', 'status'], {
          transaction,
          name: 'mentor_clients_status_idx',
        }),
      ]);

      await queryInterface.createTable(
        'mentor_events',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          clientId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'mentor_clients', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          title: { type: Sequelize.STRING(191), allowNull: false },
          type: { type: Sequelize.ENUM(...EVENT_TYPES), allowNull: false, defaultValue: 'Session' },
          status: { type: Sequelize.ENUM(...EVENT_STATUSES), allowNull: false, defaultValue: 'Scheduled' },
          startsAt: { type: Sequelize.DATE, allowNull: false },
          endsAt: { type: Sequelize.DATE, allowNull: false },
          location: { type: Sequelize.STRING(191), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_events', ['mentorId'], {
          transaction,
          name: 'mentor_events_mentor_idx',
        }),
        queryInterface.addIndex('mentor_events', ['mentorId', 'startsAt'], {
          transaction,
          name: 'mentor_events_schedule_idx',
        }),
      ]);

      await queryInterface.createTable(
        'mentor_support_tickets',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          subject: { type: Sequelize.STRING(191), allowNull: false },
          category: { type: Sequelize.STRING(120), allowNull: false, defaultValue: 'General' },
          priority: { type: Sequelize.ENUM(...SUPPORT_PRIORITIES), allowNull: false, defaultValue: 'Normal' },
          status: { type: Sequelize.ENUM(...SUPPORT_STATUSES), allowNull: false, defaultValue: 'Open' },
          reference: { type: Sequelize.STRING(120), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: false },
          respondedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_support_tickets', ['mentorId'], {
        transaction,
        name: 'mentor_support_tickets_mentor_idx',
      });

      await queryInterface.createTable(
        'mentor_messages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          senderName: { type: Sequelize.STRING(191), allowNull: false },
          channel: { type: Sequelize.ENUM(...MESSAGE_CHANNELS), allowNull: false, defaultValue: 'Explorer' },
          status: { type: Sequelize.ENUM(...MESSAGE_STATUSES), allowNull: false, defaultValue: 'Unread' },
          subject: { type: Sequelize.STRING(191), allowNull: true },
          preview: { type: Sequelize.STRING(512), allowNull: true },
          tags: { type: jsonType, allowNull: true },
          receivedAt: { type: Sequelize.DATE, allowNull: false },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_messages', ['mentorId'], {
          transaction,
          name: 'mentor_messages_mentor_idx',
        }),
        queryInterface.addIndex('mentor_messages', ['mentorId', 'status'], {
          transaction,
          name: 'mentor_messages_status_idx',
        }),
      ]);

      await queryInterface.createTable(
        'mentor_verifications',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          status: { type: Sequelize.ENUM(...VERIFICATION_STATUSES), allowNull: false, defaultValue: 'Not started' },
          lastSubmittedAt: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_verifications', ['mentorId'], {
        transaction,
        name: 'mentor_verifications_mentor_unique',
        unique: true,
      });

      await queryInterface.createTable(
        'mentor_verification_documents',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          type: { type: Sequelize.ENUM(...DOCUMENT_TYPES), allowNull: false },
          status: { type: Sequelize.ENUM(...DOCUMENT_STATUSES), allowNull: false, defaultValue: 'In review' },
          reference: { type: Sequelize.STRING(191), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          storageKey: { type: Sequelize.STRING(255), allowNull: true },
          fileName: { type: Sequelize.STRING(255), allowNull: true },
          contentType: { type: Sequelize.STRING(120), allowNull: true },
          fileSize: { type: Sequelize.INTEGER, allowNull: true },
          submittedAt: { type: Sequelize.DATE, allowNull: false },
          storedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_verification_documents', ['mentorId'], {
        transaction,
        name: 'mentor_verification_documents_mentor_idx',
      });

      await queryInterface.createTable(
        'mentor_wallet_transactions',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          type: { type: Sequelize.ENUM(...TRANSACTION_TYPES), allowNull: false, defaultValue: 'Mentorship earning' },
          status: { type: Sequelize.ENUM(...TRANSACTION_STATUSES), allowNull: false, defaultValue: 'Completed' },
          amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'GBP' },
          reference: { type: Sequelize.STRING(191), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          occurredAt: { type: Sequelize.DATE, allowNull: false },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_wallet_transactions', ['mentorId'], {
          transaction,
          name: 'mentor_wallet_transactions_mentor_idx',
        }),
        queryInterface.addIndex('mentor_wallet_transactions', ['mentorId', 'status'], {
          transaction,
          name: 'mentor_wallet_transactions_status_idx',
        }),
      ]);

      await queryInterface.createTable(
        'mentor_invoices',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          reference: { type: Sequelize.STRING(191), allowNull: false },
          menteeName: { type: Sequelize.STRING(191), allowNull: false },
          amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'GBP' },
          status: { type: Sequelize.ENUM(...INVOICE_STATUSES), allowNull: false, defaultValue: 'Draft' },
          issuedOn: { type: Sequelize.DATE, allowNull: false },
          dueOn: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('mentor_invoices', ['mentorId'], {
        transaction,
        name: 'mentor_invoices_mentor_idx',
      });

      await queryInterface.createTable(
        'mentor_payouts',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          mentorId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          reference: { type: Sequelize.STRING(191), allowNull: false },
          amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
          currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'GBP' },
          status: { type: Sequelize.ENUM(...PAYOUT_STATUSES), allowNull: false, defaultValue: 'Scheduled' },
          scheduledFor: { type: Sequelize.DATE, allowNull: false },
          processedAt: { type: Sequelize.DATE, allowNull: true },
          failureReason: { type: Sequelize.STRING(255), allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_payouts', ['mentorId'], {
          transaction,
          name: 'mentor_payouts_mentor_idx',
        }),
        queryInterface.addIndex('mentor_payouts', ['mentorId', 'status'], {
          transaction,
          name: 'mentor_payouts_status_idx',
        }),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dropTable = (table) => queryInterface.dropTable(table, { transaction });

      await dropTable('mentor_payouts');
      await dropTable('mentor_invoices');
      await dropTable('mentor_wallet_transactions');
      await dropTable('mentor_verification_documents');
      await dropTable('mentor_verifications');
      await dropTable('mentor_messages');
      await dropTable('mentor_support_tickets');
      await dropTable('mentor_events');
      await dropTable('mentor_clients');
      await dropTable('mentor_bookings');
      await dropTable('mentor_packages');
      await dropTable('mentor_availability_slots');

      const enumTypes = [
        'enum_mentor_bookings_status',
        'enum_mentor_bookings_paymentStatus',
        'enum_mentor_clients_status',
        'enum_mentor_clients_tier',
        'enum_mentor_events_type',
        'enum_mentor_events_status',
        'enum_mentor_support_tickets_priority',
        'enum_mentor_support_tickets_status',
        'enum_mentor_messages_channel',
        'enum_mentor_messages_status',
        'enum_mentor_verifications_status',
        'enum_mentor_verification_documents_type',
        'enum_mentor_verification_documents_status',
        'enum_mentor_wallet_transactions_type',
        'enum_mentor_wallet_transactions_status',
        'enum_mentor_invoices_status',
        'enum_mentor_payouts_status',
      ];

      await Promise.all(
        enumTypes.map((typeName) =>
          queryInterface.sequelize
            .query(`DROP TYPE IF EXISTS "${typeName}";`, { transaction })
            .catch(() => {}),
        ),
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
