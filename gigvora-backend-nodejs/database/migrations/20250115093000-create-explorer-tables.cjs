'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      await queryInterface.createTable(
        'explorer_records',
        {
          id: {
            type: Sequelize.STRING(120),
            allowNull: false,
            primaryKey: true,
          },
          collection: { type: Sequelize.STRING(60), allowNull: false },
          category: { type: Sequelize.STRING(60), allowNull: false },
          title: { type: Sequelize.STRING(255), allowNull: false },
          summary: { type: Sequelize.TEXT, allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          longDescription: { type: Sequelize.TEXT, allowNull: true },
          status: { type: Sequelize.STRING(80), allowNull: false },
          organization: { type: Sequelize.STRING(180), allowNull: true },
          location: { type: Sequelize.STRING(255), allowNull: true },
          employmentType: { type: Sequelize.STRING(120), allowNull: true },
          duration: { type: Sequelize.STRING(120), allowNull: true },
          experienceLevel: { type: Sequelize.STRING(120), allowNull: true },
          availability: { type: Sequelize.STRING(120), allowNull: true },
          track: { type: Sequelize.STRING(120), allowNull: true },
          isRemote: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
          skills: { type: jsonType, allowNull: true },
          tags: { type: jsonType, allowNull: true },
          priceAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          priceCurrency: { type: Sequelize.STRING(12), allowNull: true },
          priceUnit: { type: Sequelize.STRING(60), allowNull: true },
          heroImage: { type: Sequelize.STRING(2048), allowNull: true },
          gallery: { type: jsonType, allowNull: true },
          videoUrl: { type: Sequelize.STRING(2048), allowNull: true },
          detailUrl: { type: Sequelize.STRING(2048), allowNull: true },
          applicationUrl: { type: Sequelize.STRING(2048), allowNull: true },
          rating: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
          reviewCount: { type: Sequelize.INTEGER, allowNull: true },
          ownerName: { type: Sequelize.STRING(180), allowNull: true },
          ownerRole: { type: Sequelize.STRING(180), allowNull: true },
          ownerAvatar: { type: Sequelize.STRING(2048), allowNull: true },
          geoLat: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          geoLng: { type: Sequelize.DECIMAL(10, 6), allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('explorer_records', ['collection'], { transaction });
      await queryInterface.addIndex('explorer_records', ['category'], { transaction });
      await queryInterface.addIndex('explorer_records', ['status'], { transaction });
      await queryInterface.addIndex('explorer_records', ['employmentType'], { transaction });
      await queryInterface.addIndex('explorer_records', ['isRemote'], { transaction });
      await queryInterface.addIndex('explorer_records', ['updatedAt'], { transaction });

      await queryInterface.createTable(
        'explorer_interactions',
        {
          id: {
            type: Sequelize.STRING(120),
            allowNull: false,
            primaryKey: true,
          },
          recordId: {
            type: Sequelize.STRING(120),
            allowNull: false,
            references: { model: 'explorer_records', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          collection: { type: Sequelize.STRING(60), allowNull: false },
          category: { type: Sequelize.STRING(60), allowNull: false },
          type: { type: Sequelize.STRING(60), allowNull: false },
          name: { type: Sequelize.STRING(180), allowNull: false },
          email: { type: Sequelize.STRING(255), allowNull: false },
          phone: { type: Sequelize.STRING(80), allowNull: true },
          company: { type: Sequelize.STRING(180), allowNull: true },
          headline: { type: Sequelize.STRING(255), allowNull: true },
          message: { type: Sequelize.TEXT, allowNull: false },
          budgetAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
          budgetCurrency: { type: Sequelize.STRING(12), allowNull: true },
          availability: { type: Sequelize.STRING(120), allowNull: true },
          startDate: { type: Sequelize.STRING(120), allowNull: true },
          attachments: { type: jsonType, allowNull: true },
          linkedin: { type: Sequelize.STRING(2048), allowNull: true },
          website: { type: Sequelize.STRING(2048), allowNull: true },
          status: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'new' },
          internalNotes: { type: Sequelize.TEXT, allowNull: true },
          metadata: { type: jsonType, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('explorer_interactions', ['collection'], { transaction });
      await queryInterface.addIndex('explorer_interactions', ['recordId'], { transaction });
      await queryInterface.addIndex('explorer_interactions', ['type'], { transaction });
      await queryInterface.addIndex('explorer_interactions', ['status'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('explorer_interactions', { transaction });
      await queryInterface.dropTable('explorer_records', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
