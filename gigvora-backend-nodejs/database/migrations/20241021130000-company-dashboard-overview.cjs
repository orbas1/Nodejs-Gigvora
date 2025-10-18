'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const jsonType = resolveJsonType(queryInterface, Sequelize);

    await queryInterface.createTable('company_dashboard_overviews', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      workspaceId: { type: Sequelize.INTEGER, allowNull: false },
      displayName: { type: Sequelize.STRING(150), allowNull: false },
      summary: { type: Sequelize.TEXT, allowNull: true },
      avatarUrl: { type: Sequelize.STRING(1024), allowNull: true },
      followerCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      trustScore: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
      rating: { type: Sequelize.DECIMAL(3, 2), allowNull: true },
      preferences: { type: jsonType, allowNull: true },
      lastEditedById: { type: Sequelize.INTEGER, allowNull: true },
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
    });

    await queryInterface.addConstraint('company_dashboard_overviews', {
      fields: ['workspaceId'],
      type: 'foreign key',
      name: 'company_dashboard_overviews_workspace_fk',
      references: {
        table: 'provider_workspaces',
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    await queryInterface.addConstraint('company_dashboard_overviews', {
      fields: ['lastEditedById'],
      type: 'foreign key',
      name: 'company_dashboard_overviews_user_fk',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'set null',
      onUpdate: 'cascade',
    });

    await queryInterface.addIndex('company_dashboard_overviews', ['workspaceId'], {
      unique: true,
      name: 'company_dashboard_overviews_workspace_unique',
    });
    await queryInterface.addIndex('company_dashboard_overviews', ['lastEditedById']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('company_dashboard_overviews');
  },
};
