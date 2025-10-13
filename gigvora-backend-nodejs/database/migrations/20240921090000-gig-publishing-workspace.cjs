'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gigs', 'ownerId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('gigs', 'slug', {
      type: Sequelize.STRING(200),
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn('gigs', 'tagline', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'category', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'niche', {
      type: Sequelize.STRING(180),
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'deliveryModel', {
      type: Sequelize.STRING(160),
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'outcomePromise', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'heroAccent', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'targetMetric', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'status', {
      type: Sequelize.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    });

    await queryInterface.addColumn('gigs', 'visibility', {
      type: Sequelize.ENUM('private', 'public', 'unlisted'),
      allowNull: false,
      defaultValue: 'private',
    });

    await queryInterface.addColumn('gigs', 'bannerSettings', {
      type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
        ? Sequelize.JSONB
        : Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'availabilityTimezone', {
      type: Sequelize.STRING(120),
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'availabilityLeadTimeDays', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 2,
    });

    await queryInterface.addColumn('gigs', 'publishedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('gigs', 'archivedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('gigs', ['ownerId']);
    await queryInterface.addIndex('gigs', ['status']);
    await queryInterface.addIndex('gigs', ['visibility']);

    await queryInterface.createTable('gig_packages', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      gigId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gigs', key: 'id' },
        onDelete: 'CASCADE',
      },
      packageKey: { type: Sequelize.STRING(80), allowNull: false },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      priceAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      priceCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      deliveryDays: { type: Sequelize.INTEGER, allowNull: true },
      revisionLimit: { type: Sequelize.INTEGER, allowNull: true },
      highlights: {
        type: ['postgres', 'postgresql'].includes(queryInterface.sequelize.getDialect())
          ? Sequelize.JSONB
          : Sequelize.JSON,
        allowNull: true,
      },
      recommendedFor: { type: Sequelize.STRING(255), allowNull: true },
      isPopular: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('gig_packages', ['gigId', 'packageKey'], {
      unique: true,
      name: 'gig_packages_unique_key',
    });

    await queryInterface.createTable('gig_add_ons', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      gigId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gigs', key: 'id' },
        onDelete: 'CASCADE',
      },
      addOnKey: { type: Sequelize.STRING(80), allowNull: false },
      name: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      priceAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      priceCurrency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('gig_add_ons', ['gigId', 'addOnKey'], {
      unique: true,
      name: 'gig_add_ons_unique_key',
    });

    await queryInterface.createTable('gig_availability_slots', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      gigId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'gigs', key: 'id' },
        onDelete: 'CASCADE',
      },
      slotDate: { type: Sequelize.DATEONLY, allowNull: false },
      startTime: { type: Sequelize.TIME, allowNull: false },
      endTime: { type: Sequelize.TIME, allowNull: false },
      capacity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      reservedCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isBookable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notes: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('gig_availability_slots', ['gigId', 'slotDate', 'startTime'], {
      unique: true,
      name: 'gig_availability_unique_slot',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('gig_availability_slots', 'gig_availability_unique_slot');
    await queryInterface.dropTable('gig_availability_slots');

    await queryInterface.removeIndex('gig_add_ons', 'gig_add_ons_unique_key');
    await queryInterface.dropTable('gig_add_ons');

    await queryInterface.removeIndex('gig_packages', 'gig_packages_unique_key');
    await queryInterface.dropTable('gig_packages');

    await queryInterface.removeIndex('gigs', ['visibility']);
    await queryInterface.removeIndex('gigs', ['status']);
    await queryInterface.removeIndex('gigs', ['ownerId']);

    await queryInterface.removeColumn('gigs', 'archivedAt');
    await queryInterface.removeColumn('gigs', 'publishedAt');
    await queryInterface.removeColumn('gigs', 'availabilityLeadTimeDays');
    await queryInterface.removeColumn('gigs', 'availabilityTimezone');
    await queryInterface.removeColumn('gigs', 'bannerSettings');
    await queryInterface.removeColumn('gigs', 'visibility');
    await queryInterface.removeColumn('gigs', 'status');
    await queryInterface.removeColumn('gigs', 'targetMetric');
    await queryInterface.removeColumn('gigs', 'heroAccent');
    await queryInterface.removeColumn('gigs', 'outcomePromise');
    await queryInterface.removeColumn('gigs', 'deliveryModel');
    await queryInterface.removeColumn('gigs', 'niche');
    await queryInterface.removeColumn('gigs', 'category');
    await queryInterface.removeColumn('gigs', 'tagline');
    await queryInterface.removeColumn('gigs', 'slug');
    await queryInterface.removeColumn('gigs', 'ownerId');

    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_gigs_status\" CASCADE;");
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_gigs_visibility\" CASCADE;");
  },
};
