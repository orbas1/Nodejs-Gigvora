'use strict';

const TABLES = {
  events: 'user_events',
  agenda: 'user_event_agenda_items',
  tasks: 'user_event_tasks',
  guests: 'user_event_guests',
  budgetItems: 'user_event_budget_items',
  assets: 'user_event_assets',
  checklist: 'user_event_checklist_items',
};

const ENUMS = {
  eventStatus: 'enum_user_events_status',
  eventFormat: 'enum_user_events_format',
  eventVisibility: 'enum_user_events_visibility',
  taskStatus: 'enum_user_event_tasks_status',
  taskPriority: 'enum_user_event_tasks_priority',
  guestStatus: 'enum_user_event_guests_status',
  budgetStatus: 'enum_user_event_budget_items_status',
  assetType: 'enum_user_event_assets_assetType',
  assetVisibility: 'enum_user_event_assets_visibility',
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        TABLES.events,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          ownerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(180), allowNull: false },
          slug: { type: Sequelize.STRING(200), allowNull: true, unique: true },
          status: {
            type: Sequelize.ENUM('draft', 'planned', 'registration_open', 'in_progress', 'completed', 'cancelled', 'archived'),
            allowNull: false,
            defaultValue: 'draft',
          },
          format: {
            type: Sequelize.ENUM('virtual', 'in_person', 'hybrid'),
            allowNull: false,
            defaultValue: 'virtual',
          },
          visibility: {
            type: Sequelize.ENUM('private', 'invite_only', 'public'),
            allowNull: false,
            defaultValue: 'invite_only',
          },
          timezone: { type: Sequelize.STRING(60), allowNull: true },
          locationLabel: { type: Sequelize.STRING(255), allowNull: true },
          locationAddress: { type: Sequelize.STRING(255), allowNull: true },
          locationDetails: { type: jsonType, allowNull: true },
          startAt: { type: Sequelize.DATE, allowNull: true },
          endAt: { type: Sequelize.DATE, allowNull: true },
          registrationOpensAt: { type: Sequelize.DATE, allowNull: true },
          registrationClosesAt: { type: Sequelize.DATE, allowNull: true },
          capacity: { type: Sequelize.INTEGER, allowNull: true },
          registrationUrl: { type: Sequelize.STRING(255), allowNull: true },
          streamingUrl: { type: Sequelize.STRING(255), allowNull: true },
          bannerImageUrl: { type: Sequelize.STRING(255), allowNull: true },
          contactEmail: { type: Sequelize.STRING(180), allowNull: true },
          targetAudience: { type: Sequelize.STRING(255), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          goals: { type: Sequelize.TEXT, allowNull: true },
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

      await queryInterface.addIndex(TABLES.events, ['ownerId'], { transaction });
      await queryInterface.addIndex(TABLES.events, ['status'], { transaction });
      await queryInterface.addIndex(TABLES.events, ['startAt'], { transaction });

      await queryInterface.createTable(
        TABLES.agenda,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          eventId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.events, key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          startAt: { type: Sequelize.DATE, allowNull: true },
          endAt: { type: Sequelize.DATE, allowNull: true },
          ownerName: { type: Sequelize.STRING(180), allowNull: true },
          ownerEmail: { type: Sequelize.STRING(180), allowNull: true },
          location: { type: Sequelize.STRING(180), allowNull: true },
          orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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
      await queryInterface.addIndex(TABLES.agenda, ['eventId'], { transaction });
      await queryInterface.addIndex(TABLES.agenda, ['startAt'], { transaction });

      await queryInterface.createTable(
        TABLES.tasks,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          eventId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.events, key: 'id' },
            onDelete: 'CASCADE',
          },
          title: { type: Sequelize.STRING(200), allowNull: false },
          status: {
            type: Sequelize.ENUM('todo', 'in_progress', 'blocked', 'done'),
            allowNull: false,
            defaultValue: 'todo',
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium',
          },
          ownerName: { type: Sequelize.STRING(180), allowNull: true },
          ownerEmail: { type: Sequelize.STRING(180), allowNull: true },
          assigneeId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
          },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          notes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },\n          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );
      await queryInterface.addIndex(TABLES.tasks, ['eventId'], { transaction });
      await queryInterface.addIndex(TABLES.tasks, ['status'], { transaction });
      await queryInterface.addIndex(TABLES.tasks, ['dueAt'], { transaction });

      await queryInterface.createTable(
        TABLES.guests,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          eventId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.events, key: 'id' },
            onDelete: 'CASCADE',
          },
          fullName: { type: Sequelize.STRING(200), allowNull: false },
          email: { type: Sequelize.STRING(200), allowNull: true },
          company: { type: Sequelize.STRING(180), allowNull: true },
          role: { type: Sequelize.STRING(160), allowNull: true },
          ticketType: { type: Sequelize.STRING(120), allowNull: true },
          status: {
            type: Sequelize.ENUM('invited', 'confirmed', 'waitlisted', 'declined', 'checked_in'),
            allowNull: false,
            defaultValue: 'invited',
          },
          seatsReserved: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          checkedInAt: { type: Sequelize.DATE, allowNull: true },
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
      await queryInterface.addIndex(TABLES.guests, ['eventId'], { transaction });
      await queryInterface.addIndex(TABLES.guests, ['status'], { transaction });
      await queryInterface.addIndex(TABLES.guests, ['email'], { transaction });

      await queryInterface.createTable(
        TABLES.budgetItems,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          eventId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.events, key: 'id' },
            onDelete: 'CASCADE',
          },
          category: { type: Sequelize.STRING(160), allowNull: false },
          vendorName: { type: Sequelize.STRING(180), allowNull: true },
          description: { type: Sequelize.TEXT, allowNull: true },
          amountPlanned: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          amountActual: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
          currency: { type: Sequelize.STRING(6), allowNull: false, defaultValue: 'USD' },
          status: {
            type: Sequelize.ENUM('planned', 'committed', 'invoiced', 'paid', 'cancelled'),
            allowNull: false,
            defaultValue: 'planned',
          },
          notes: { type: Sequelize.TEXT, allowNull: true },
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
      await queryInterface.addIndex(TABLES.budgetItems, ['eventId'], { transaction });
      await queryInterface.addIndex(TABLES.budgetItems, ['category'], { transaction });
      await queryInterface.addIndex(TABLES.budgetItems, ['status'], { transaction });

      await queryInterface.createTable(
        TABLES.assets,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          eventId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.events, key: 'id' },
            onDelete: 'CASCADE',
          },
          name: { type: Sequelize.STRING(200), allowNull: false },
          assetType: {
            type: Sequelize.ENUM('image', 'document', 'presentation', 'video', 'link'),
            allowNull: false,
            defaultValue: 'image',
          },
          url: { type: Sequelize.STRING(255), allowNull: false },
          thumbnailUrl: { type: Sequelize.STRING(255), allowNull: true },
          visibility: {
            type: Sequelize.ENUM('internal', 'shared', 'public'),
            allowNull: false,
            defaultValue: 'internal',
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
        },
        { transaction },
      );
      await queryInterface.addIndex(TABLES.assets, ['eventId'], { transaction });
      await queryInterface.addIndex(TABLES.assets, ['assetType'], { transaction });

      await queryInterface.createTable(
        TABLES.checklist,
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          eventId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: TABLES.events, key: 'id' },
            onDelete: 'CASCADE',
          },
          label: { type: Sequelize.STRING(200), allowNull: false },
          isComplete: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          ownerName: { type: Sequelize.STRING(180), allowNull: true },
          dueAt: { type: Sequelize.DATE, allowNull: true },
          orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
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
      await queryInterface.addIndex(TABLES.checklist, ['eventId'], { transaction });
      await queryInterface.addIndex(TABLES.checklist, ['isComplete'], { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable(TABLES.checklist, { transaction });
      await queryInterface.dropTable(TABLES.assets, { transaction });
      await queryInterface.dropTable(TABLES.budgetItems, { transaction });
      await queryInterface.dropTable(TABLES.guests, { transaction });
      await queryInterface.dropTable(TABLES.tasks, { transaction });
      await queryInterface.dropTable(TABLES.agenda, { transaction });
      await queryInterface.dropTable(TABLES.events, { transaction });

      await Promise.all(
        Object.values(ENUMS).map((enumName) =>
          queryInterface.sequelize
            .query(`DROP TYPE IF EXISTS "${enumName}";`, { transaction })
            .catch(() => {}),
        ),
      );
    });
  },
};
