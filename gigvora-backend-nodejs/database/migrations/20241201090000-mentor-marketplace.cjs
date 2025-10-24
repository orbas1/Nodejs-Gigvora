'use strict';

const AVAILABILITY_STATUSES = ['open', 'waitlist', 'booked_out'];
const PRICE_TIERS = ['tier_entry', 'tier_growth', 'tier_scale'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'mentor_profiles',
        {
          id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          slug: { type: Sequelize.STRING(191), allowNull: false, unique: true },
          name: { type: Sequelize.STRING(191), allowNull: false },
          headline: { type: Sequelize.STRING(255), allowNull: true },
          bio: { type: Sequelize.TEXT, allowNull: true },
          region: { type: Sequelize.STRING(191), allowNull: true },
          discipline: { type: Sequelize.STRING(120), allowNull: true },
          expertise: { type: jsonType, allowNull: true },
          searchVector: { type: Sequelize.TEXT, allowNull: true },
          sessionFeeAmount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
          sessionFeeCurrency: { type: Sequelize.STRING(3), allowNull: true },
          sessionFeeUnit: { type: Sequelize.STRING(60), allowNull: true, defaultValue: 'session' },
          priceTier: { type: Sequelize.ENUM(...PRICE_TIERS), allowNull: false, defaultValue: 'tier_entry' },
          availabilityStatus: {
            type: Sequelize.ENUM(...AVAILABILITY_STATUSES),
            allowNull: false,
            defaultValue: 'open',
          },
          availabilityNotes: { type: Sequelize.TEXT, allowNull: true },
          responseTimeHours: { type: Sequelize.INTEGER, allowNull: true },
          reviewCount: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
          rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
          verificationBadge: { type: Sequelize.STRING(191), allowNull: true },
          testimonialHighlight: { type: Sequelize.TEXT, allowNull: true },
          testimonialHighlightAuthor: { type: Sequelize.STRING(191), allowNull: true },
          testimonials: { type: jsonType, allowNull: true },
          packages: { type: jsonType, allowNull: true },
          avatarUrl: { type: Sequelize.STRING(512), allowNull: true },
          promoted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          rankingScore: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
          lastActiveAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await Promise.all([
        queryInterface.addIndex('mentor_profiles', ['slug'], {
          transaction,
          unique: true,
          name: 'mentor_profiles_slug_unique',
        }),
        queryInterface.addIndex('mentor_profiles', ['discipline'], {
          transaction,
          name: 'mentor_profiles_discipline_idx',
        }),
        queryInterface.addIndex('mentor_profiles', ['priceTier'], {
          transaction,
          name: 'mentor_profiles_price_tier_idx',
        }),
        queryInterface.addIndex('mentor_profiles', ['availabilityStatus'], {
          transaction,
          name: 'mentor_profiles_availability_idx',
        }),
        queryInterface.addIndex('mentor_profiles', ['rankingScore', 'reviewCount'], {
          transaction,
          name: 'mentor_profiles_ranking_idx',
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
      await Promise.all([
        queryInterface.removeIndex('mentor_profiles', 'mentor_profiles_slug_unique', { transaction }).catch(() => {}),
        queryInterface.removeIndex('mentor_profiles', 'mentor_profiles_discipline_idx', { transaction }).catch(() => {}),
        queryInterface.removeIndex('mentor_profiles', 'mentor_profiles_price_tier_idx', { transaction }).catch(() => {}),
        queryInterface.removeIndex('mentor_profiles', 'mentor_profiles_availability_idx', { transaction }).catch(() => {}),
        queryInterface.removeIndex('mentor_profiles', 'mentor_profiles_ranking_idx', { transaction }).catch(() => {}),
      ]);

      await queryInterface.dropTable('mentor_profiles', { transaction });

      await Promise.all([
        queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mentor_profiles_priceTier";', { transaction }),
        queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mentor_profiles_availabilityStatus";', { transaction }),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
