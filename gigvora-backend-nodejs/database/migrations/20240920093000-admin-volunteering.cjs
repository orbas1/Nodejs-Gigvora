'use strict';

const ROLE_STATUSES = ['draft', 'open', 'paused', 'filled', 'archived'];
const SHIFT_STATUSES = ['planned', 'open', 'locked', 'complete', 'cancelled'];
const ASSIGNMENT_STATUSES = ['invited', 'confirmed', 'checked_in', 'checked_out', 'declined', 'no_show'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

      await queryInterface.createTable(
        'volunteer_programs',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          name: { allowNull: false, type: Sequelize.STRING(160) },
          summary: { allowNull: true, type: Sequelize.TEXT },
          status: { allowNull: false, type: Sequelize.ENUM('draft', 'active', 'paused', 'archived'), defaultValue: 'draft' },
          contactEmail: { allowNull: true, type: Sequelize.STRING(255) },
          contactPhone: { allowNull: true, type: Sequelize.STRING(40) },
          location: { allowNull: true, type: Sequelize.STRING(255) },
          tags: { allowNull: true, type: jsonType },
          startsAt: { allowNull: true, type: Sequelize.DATE },
          endsAt: { allowNull: true, type: Sequelize.DATE },
          maxVolunteers: { allowNull: true, type: Sequelize.INTEGER },
          metadata: { allowNull: true, type: jsonType },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'volunteer_shifts',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          programId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'volunteer_programs', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          roleId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'volunteering_roles', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          title: { allowNull: false, type: Sequelize.STRING(160) },
          shiftDate: { allowNull: false, type: Sequelize.DATEONLY },
          startTime: { allowNull: true, type: Sequelize.TIME },
          endTime: { allowNull: true, type: Sequelize.TIME },
          timezone: { allowNull: true, type: Sequelize.STRING(120) },
          location: { allowNull: true, type: Sequelize.STRING(255) },
          requirements: { allowNull: true, type: jsonType },
          capacity: { allowNull: true, type: Sequelize.INTEGER },
          reserved: { allowNull: true, type: Sequelize.INTEGER },
          status: { allowNull: false, type: Sequelize.ENUM(...SHIFT_STATUSES), defaultValue: 'planned' },
          notes: { allowNull: true, type: Sequelize.TEXT },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'volunteer_assignments',
        {
          id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
          shiftId: {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: { model: 'volunteer_shifts', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          volunteerId: {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          fullName: { allowNull: true, type: Sequelize.STRING(160) },
          email: { allowNull: true, type: Sequelize.STRING(255) },
          phone: { allowNull: true, type: Sequelize.STRING(40) },
          status: { allowNull: false, type: Sequelize.ENUM(...ASSIGNMENT_STATUSES), defaultValue: 'invited' },
          notes: { allowNull: true, type: Sequelize.TEXT },
          checkInAt: { allowNull: true, type: Sequelize.DATE },
          checkOutAt: { allowNull: true, type: Sequelize.DATE },
          metadata: { allowNull: true, type: jsonType },
          createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'programId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'volunteer_programs', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'status',
        { type: Sequelize.ENUM(...ROLE_STATUSES), allowNull: false, defaultValue: 'draft' },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'summary',
        { type: Sequelize.TEXT, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'commitmentHours',
        { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'applicationUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'applicationDeadline',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'remoteType',
        { type: Sequelize.STRING(20), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'spots',
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'skills',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'requirements',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'tags',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'imageUrl',
        { type: Sequelize.STRING(500), allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'publishedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'accessRoles',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'volunteering_roles',
        'metadata',
        { type: jsonType, allowNull: true },
        { transaction },
      );

      await queryInterface.addIndex(
        'volunteering_roles',
        ['status'],
        { name: 'volunteering_roles_status_idx', transaction },
      );

      await queryInterface.addIndex(
        'volunteering_roles',
        ['programId'],
        { name: 'volunteering_roles_program_idx', transaction },
      );

      await queryInterface.addIndex(
        'volunteer_shifts',
        ['roleId', 'shiftDate'],
        { name: 'volunteer_shifts_role_date_idx', transaction },
      );

      await queryInterface.addIndex(
        'volunteer_shifts',
        ['programId'],
        { name: 'volunteer_shifts_program_idx', transaction },
      );

      await queryInterface.addIndex(
        'volunteer_assignments',
        ['shiftId'],
        { name: 'volunteer_assignments_shift_idx', transaction },
      );

      await queryInterface.addIndex(
        'volunteer_assignments',
        ['volunteerId'],
        { name: 'volunteer_assignments_volunteer_idx', transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('volunteer_assignments', 'volunteer_assignments_volunteer_idx', { transaction });
      await queryInterface.removeIndex('volunteer_assignments', 'volunteer_assignments_shift_idx', { transaction });
      await queryInterface.removeIndex('volunteer_shifts', 'volunteer_shifts_program_idx', { transaction });
      await queryInterface.removeIndex('volunteer_shifts', 'volunteer_shifts_role_date_idx', { transaction });
      await queryInterface.removeIndex('volunteering_roles', 'volunteering_roles_program_idx', { transaction });
      await queryInterface.removeIndex('volunteering_roles', 'volunteering_roles_status_idx', { transaction });

      await queryInterface.removeColumn('volunteering_roles', 'metadata', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'accessRoles', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'publishedAt', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'imageUrl', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'tags', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'requirements', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'skills', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'spots', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'remoteType', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'applicationDeadline', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'applicationUrl', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'commitmentHours', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'summary', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'status', { transaction });
      await queryInterface.removeColumn('volunteering_roles', 'programId', { transaction });

      await queryInterface.dropTable('volunteer_assignments', { transaction });
      await queryInterface.dropTable('volunteer_shifts', { transaction });
      await queryInterface.dropTable('volunteer_programs', { transaction });

      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteer_assignments_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteer_shifts_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteering_roles_status"', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteer_programs_status"', { transaction });
    });
  },
};
