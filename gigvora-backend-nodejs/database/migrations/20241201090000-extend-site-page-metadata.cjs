'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await Promise.all([
        queryInterface.addColumn(
          'site_pages',
          'heroEyebrow',
          { type: Sequelize.STRING(160), allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'site_pages',
          'heroMeta',
          { type: Sequelize.STRING(255), allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'site_pages',
          'contactEmail',
          { type: Sequelize.STRING(255), allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'site_pages',
          'contactPhone',
          { type: Sequelize.STRING(80), allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'site_pages',
          'jurisdiction',
          { type: Sequelize.STRING(160), allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'site_pages',
          'version',
          { type: Sequelize.STRING(40), allowNull: true },
          { transaction },
        ),
        queryInterface.addColumn(
          'site_pages',
          'lastReviewedAt',
          { type: Sequelize.DATE, allowNull: true },
          { transaction },
        ),
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
        queryInterface.removeColumn('site_pages', 'heroEyebrow', { transaction }),
        queryInterface.removeColumn('site_pages', 'heroMeta', { transaction }),
        queryInterface.removeColumn('site_pages', 'contactEmail', { transaction }),
        queryInterface.removeColumn('site_pages', 'contactPhone', { transaction }),
        queryInterface.removeColumn('site_pages', 'jurisdiction', { transaction }),
        queryInterface.removeColumn('site_pages', 'version', { transaction }),
        queryInterface.removeColumn('site_pages', 'lastReviewedAt', { transaction }),
      ]);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
