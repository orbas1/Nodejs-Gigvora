'use strict';

const resolveJsonType = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const gigsDefinition = await queryInterface.describeTable('gigs', { transaction });
      const addGigColumnIfMissing = async (column, definition) => {
        if (!Object.prototype.hasOwnProperty.call(gigsDefinition, column)) {
          await queryInterface.addColumn('gigs', column, definition, { transaction });
        }
      };

      await addGigColumnIfMissing('ownerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      });

      await addGigColumnIfMissing('slug', {
        type: Sequelize.STRING(200),
        allowNull: true,
        unique: true,
      });

      await addGigColumnIfMissing('tagline', { type: Sequelize.STRING(255), allowNull: true });
      await addGigColumnIfMissing('category', { type: Sequelize.STRING(120), allowNull: true });
      await addGigColumnIfMissing('niche', { type: Sequelize.STRING(180), allowNull: true });
      await addGigColumnIfMissing('deliveryModel', { type: Sequelize.STRING(160), allowNull: true });
      await addGigColumnIfMissing('outcomePromise', { type: Sequelize.TEXT, allowNull: true });
      await addGigColumnIfMissing('heroAccent', { type: Sequelize.STRING(20), allowNull: true });
      await addGigColumnIfMissing('targetMetric', { type: Sequelize.INTEGER, allowNull: true });
      await addGigColumnIfMissing('status', {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      });
      await addGigColumnIfMissing('visibility', {
        type: Sequelize.ENUM('private', 'public', 'unlisted'),
        allowNull: false,
        defaultValue: 'private',
      });
      await addGigColumnIfMissing('bannerSettings', { type: jsonType, allowNull: true });
      await addGigColumnIfMissing('availabilityTimezone', { type: Sequelize.STRING(120), allowNull: true });
      await addGigColumnIfMissing('availabilityLeadTimeDays', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      });
      await addGigColumnIfMissing('publishedAt', { type: Sequelize.DATE, allowNull: true });
      await addGigColumnIfMissing('archivedAt', { type: Sequelize.DATE, allowNull: true });

      await queryInterface.addIndex('gigs', ['ownerId'], {
        name: 'gigs_owner_idx',
        transaction,
      });
      await queryInterface.addIndex('gigs', ['status'], {
        name: 'gigs_status_idx_v2',
        transaction,
      });
      await queryInterface.addIndex('gigs', ['visibility'], {
        name: 'gigs_visibility_idx',
        transaction,
      });

      const timestampDefault = Sequelize.literal('CURRENT_TIMESTAMP');

      await queryInterface.createTable(
        'gig_packages',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          packageKey: { type: Sequelize.STRING(80), allowNull: false },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          priceAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          priceCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          deliveryDays: { type: Sequelize.INTEGER, allowNull: true },
          revisionLimit: { type: Sequelize.INTEGER, allowNull: true },
          highlights: { type: jsonType, allowNull: true },
          recommendedFor: { type: Sequelize.STRING(255), allowNull: true },
          isPopular: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('gig_packages', ['gigId', 'packageKey'], {
        name: 'gig_packages_unique_key',
        unique: true,
        transaction,
      });

      await queryInterface.createTable(
        'gig_add_ons',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          addOnKey: { type: Sequelize.STRING(80), allowNull: false },
          name: { type: Sequelize.STRING(160), allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: true },
          priceAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
          priceCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
          isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('gig_add_ons', ['gigId', 'addOnKey'], {
        name: 'gig_add_ons_unique_key',
        unique: true,
        transaction,
      });

      await queryInterface.createTable(
        'gig_availability_slots',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          gigId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'gigs', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          slotDate: { type: Sequelize.DATEONLY, allowNull: false },
          startTime: { type: Sequelize.TIME, allowNull: false },
          endTime: { type: Sequelize.TIME, allowNull: false },
          capacity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
          reservedCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          isBookable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
          notes: { type: Sequelize.STRING(255), allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: timestampDefault },
        },
        { transaction },
      );

      await queryInterface.addIndex('gig_availability_slots', ['gigId', 'slotDate', 'startTime'], {
        name: 'gig_availability_unique_slot',
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dropIndexIfExists = async (table, name) => {
        const indexes = await queryInterface.showIndex(table, { transaction });
        if (indexes.some((index) => index.name === name)) {
          await queryInterface.removeIndex(table, name, { transaction });
        }
      };

      await queryInterface.removeIndex('gig_availability_slots', 'gig_availability_unique_slot', { transaction });
      await queryInterface.dropTable('gig_availability_slots', { transaction });

      await queryInterface.removeIndex('gig_add_ons', 'gig_add_ons_unique_key', { transaction });
      await queryInterface.dropTable('gig_add_ons', { transaction });

      await queryInterface.removeIndex('gig_packages', 'gig_packages_unique_key', { transaction });
      await queryInterface.dropTable('gig_packages', { transaction });

      await dropIndexIfExists('gigs', 'gigs_visibility_idx');
      await dropIndexIfExists('gigs', 'gigs_status_idx_v2');
      await dropIndexIfExists('gigs', 'gigs_owner_idx');

      const currentGigs = await queryInterface.describeTable('gigs', { transaction });
      const gigColumns = [
        'archivedAt',
        'publishedAt',
        'availabilityLeadTimeDays',
        'availabilityTimezone',
        'bannerSettings',
        'visibility',
        'status',
        'targetMetric',
        'heroAccent',
        'outcomePromise',
        'deliveryModel',
        'niche',
        'category',
        'tagline',
        'slug',
        'ownerId',
      ];

      for (const column of gigColumns) {
        if (Object.prototype.hasOwnProperty.call(currentGigs, column)) {
          await queryInterface.removeColumn('gigs', column, { transaction });
        }
      }

      if (['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gigs_status" CASCADE;', { transaction });
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_gigs_visibility" CASCADE;', { transaction });
      }
    });
  },
};
