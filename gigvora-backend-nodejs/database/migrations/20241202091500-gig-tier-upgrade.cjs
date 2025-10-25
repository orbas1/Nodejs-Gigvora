'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

const CUSTOM_REQUEST_STATUSES = ['pending', 'in_progress', 'responded', 'declined', 'cancelled'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      const gigPackageSchema = await queryInterface.describeTable('gig_packages', { transaction }).catch(() => ({}));
      if (!Object.prototype.hasOwnProperty.call(gigPackageSchema, 'deliverables')) {
        await queryInterface.addColumn(
          'gig_packages',
          'deliverables',
          { type: jsonType, allowNull: false, defaultValue: [] },
          { transaction },
        );
      }

      if (!Object.prototype.hasOwnProperty.call(gigPackageSchema, 'tier')) {
        await queryInterface.addColumn(
          'gig_packages',
          'tier',
          { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'basic' },
          { transaction },
        );
        await queryInterface.sequelize.query(
          "UPDATE gig_packages SET tier = LOWER(packageKey) WHERE tier IS NULL",
          { transaction },
        );
      }

      await queryInterface.sequelize.query(
        "UPDATE gig_packages SET deliverables = '[]' WHERE deliverables IS NULL",
        { transaction },
      );

      const gigSchema = await queryInterface.describeTable('gigs', { transaction }).catch(() => ({}));
      if (!Object.prototype.hasOwnProperty.call(gigSchema, 'customRequestEnabled')) {
        await queryInterface.addColumn(
          'gigs',
          'customRequestEnabled',
          { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          { transaction },
        );
      }

      if (!Object.prototype.hasOwnProperty.call(gigSchema, 'customRequestInstructions')) {
        await queryInterface.addColumn(
          'gigs',
          'customRequestInstructions',
          { type: Sequelize.TEXT, allowNull: true },
          { transaction },
        );
      }

      const tables = await queryInterface.showAllTables({ transaction });
      if (!tables.includes('gig_custom_requests')) {
        await queryInterface.createTable(
          'gig_custom_requests',
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            gigId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'gigs', key: 'id' },
              onDelete: 'CASCADE',
            },
            requesterId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'users', key: 'id' },
              onDelete: 'CASCADE',
            },
            packageTier: { type: Sequelize.STRING(40), allowNull: true },
            title: { type: Sequelize.STRING(200), allowNull: false },
            summary: { type: Sequelize.TEXT, allowNull: true },
            requirements: { type: jsonType, allowNull: true },
            budgetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
            budgetCurrency: { type: Sequelize.STRING(6), allowNull: true },
            deliveryDays: { type: Sequelize.INTEGER, allowNull: true },
            preferredStartDate: { type: Sequelize.DATEONLY, allowNull: true },
            communicationChannel: { type: Sequelize.STRING(120), allowNull: true },
            status: { type: Sequelize.ENUM(...CUSTOM_REQUEST_STATUSES), allowNull: false, defaultValue: 'pending' },
            metadata: { type: jsonType, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          },
          { transaction },
        );
        await queryInterface.addIndex(
          'gig_custom_requests',
          ['gigId', 'status'],
          { transaction, name: 'gig_custom_requests_gig_id_status_idx' },
        );
        await queryInterface.addIndex(
          'gig_custom_requests',
          ['requesterId'],
          { transaction, name: 'gig_custom_requests_requester_idx' },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const gigPackageSchema = await queryInterface.describeTable('gig_packages', { transaction }).catch(() => ({}));
      if (Object.prototype.hasOwnProperty.call(gigPackageSchema, 'deliverables')) {
        await queryInterface.removeColumn('gig_packages', 'deliverables', { transaction });
      }
      if (Object.prototype.hasOwnProperty.call(gigPackageSchema, 'tier')) {
        await queryInterface.removeColumn('gig_packages', 'tier', { transaction });
      }

      const gigSchema = await queryInterface.describeTable('gigs', { transaction }).catch(() => ({}));
      if (Object.prototype.hasOwnProperty.call(gigSchema, 'customRequestInstructions')) {
        await queryInterface.removeColumn('gigs', 'customRequestInstructions', { transaction });
      }
      if (Object.prototype.hasOwnProperty.call(gigSchema, 'customRequestEnabled')) {
        await queryInterface.removeColumn('gigs', 'customRequestEnabled', { transaction });
      }

      const tables = await queryInterface.showAllTables({ transaction });
      if (tables.includes('gig_custom_requests')) {
        await queryInterface.removeIndex('gig_custom_requests', 'gig_custom_requests_gig_id_status_idx', { transaction }).catch(() => {});
        await queryInterface.removeIndex('gig_custom_requests', 'gig_custom_requests_requester_idx', { transaction }).catch(() => {});
        await queryInterface.dropTable('gig_custom_requests', { transaction });
      }
    });
  },
};
