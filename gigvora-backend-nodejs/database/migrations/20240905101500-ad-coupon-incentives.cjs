'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = Sequelize.JSONB ?? Sequelize.JSON;

      await queryInterface.createTable(
        'ad_coupons',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          code: {
            type: Sequelize.STRING(60),
            allowNull: false,
            unique: true,
          },
          name: {
            type: Sequelize.STRING(160),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          discountType: {
            type: Sequelize.STRING(40),
            allowNull: false,
            defaultValue: 'percentage',
          },
          discountValue: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
          },
          status: {
            type: Sequelize.STRING(40),
            allowNull: false,
            defaultValue: 'draft',
          },
          startAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          endAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          maxRedemptions: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          perUserLimit: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          totalRedemptions: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          metadata: {
            type: jsonType,
            allowNull: true,
          },
          surfaceTargets: {
            type: jsonType,
            allowNull: true,
          },
          termsUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          createdById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          updatedById: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
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

      await queryInterface.addIndex('ad_coupons', ['status'], {
        name: 'ad_coupons_status_idx',
        transaction,
      });
      await queryInterface.addIndex('ad_coupons', ['startAt', 'endAt'], {
        name: 'ad_coupons_window_idx',
        transaction,
      });

      await queryInterface.createTable(
        'ad_placement_coupons',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          couponId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'ad_coupons',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          placementId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'ad_placements',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          priority: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          metadata: {
            type: jsonType,
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

      await queryInterface.addConstraint('ad_placement_coupons', {
        type: 'unique',
        fields: ['couponId', 'placementId'],
        name: 'ad_placement_coupons_coupon_placement_unique',
        transaction,
      });

      await queryInterface.addIndex('ad_placement_coupons', ['placementId', 'priority'], {
        name: 'ad_placement_coupons_priority_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('ad_placement_coupons', 'ad_placement_coupons_priority_idx', {
        transaction,
      }).catch(() => {});
      await queryInterface.removeConstraint(
        'ad_placement_coupons',
        'ad_placement_coupons_coupon_placement_unique',
        { transaction },
      ).catch(() => {});
      await queryInterface.dropTable('ad_placement_coupons', { transaction }).catch(() => {});

      await queryInterface.removeIndex('ad_coupons', 'ad_coupons_window_idx', { transaction }).catch(() => {});
      await queryInterface.removeIndex('ad_coupons', 'ad_coupons_status_idx', { transaction }).catch(() => {});
      await queryInterface.dropTable('ad_coupons', { transaction }).catch(() => {});
    });
  },
};
