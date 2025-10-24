'use strict';

const USER_STATUS_VALUES = ['invited', 'active', 'suspended', 'archived', 'deleted'];
const TWO_FACTOR_METHODS = ['email', 'app', 'sms'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();
      const jsonType = ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;

      const describeUsers = await queryInterface.describeTable('users');

      const ensureColumn = async (columnName, definition) => {
        if (!describeUsers[columnName]) {
          await queryInterface.addColumn('users', columnName, definition, { transaction });
        }
      };

      await ensureColumn('location', { type: Sequelize.STRING(255), allowNull: true });
      await ensureColumn('geoLocation', { type: jsonType, allowNull: true });
      await ensureColumn('phoneNumber', { type: Sequelize.STRING(30), allowNull: true });
      await ensureColumn('jobTitle', { type: Sequelize.STRING(120), allowNull: true });
      await ensureColumn('avatarUrl', { type: Sequelize.STRING(2048), allowNull: true });
      await ensureColumn('lastSeenAt', { type: Sequelize.DATE, allowNull: true });
      await ensureColumn('twoFactorEnabled', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
      await ensureColumn('twoFactorMethod', {
        type: Sequelize.ENUM(...TWO_FACTOR_METHODS),
        allowNull: false,
        defaultValue: 'email',
      });
      await ensureColumn('googleId', { type: Sequelize.STRING(255), allowNull: true });
      await ensureColumn('memberships', { type: jsonType, allowNull: false, defaultValue: [] });
      await ensureColumn('primaryDashboard', { type: Sequelize.STRING(60), allowNull: true });

      if (describeUsers.status) {
        await queryInterface.changeColumn(
          'users',
          'status',
          {
            type: Sequelize.ENUM(...USER_STATUS_VALUES),
            allowNull: false,
            defaultValue: 'active',
          },
          { transaction },
        );
      }

      await queryInterface.createTable(
        'password_reset_tokens',
        {
          id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          tokenHash: { type: Sequelize.STRING(128), allowNull: false, unique: true },
          requestedFromIp: { type: Sequelize.STRING(64), allowNull: true },
          requestedUserAgent: { type: Sequelize.STRING(255), allowNull: true },
          attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          metadata: { type: jsonType, allowNull: true },
          expiresAt: { type: Sequelize.DATE, allowNull: false },
          consumedAt: { type: Sequelize.DATE, allowNull: true },
          createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
          updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        { transaction },
      );

      await queryInterface.addIndex('password_reset_tokens', ['userId'], { transaction });
      await queryInterface.addIndex('password_reset_tokens', ['expiresAt'], { transaction });
      await queryInterface.addIndex('password_reset_tokens', ['consumedAt'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dialect = queryInterface.sequelize.getDialect();

      await queryInterface.dropTable('password_reset_tokens', { transaction });

      const columnsToRemove = [
        'location',
        'geoLocation',
        'phoneNumber',
        'jobTitle',
        'avatarUrl',
        'lastSeenAt',
        'twoFactorEnabled',
        'twoFactorMethod',
        'googleId',
        'memberships',
        'primaryDashboard',
      ];

      for (const column of columnsToRemove) {
        const table = await queryInterface.describeTable('users');
        if (table[column]) {
          await queryInterface.removeColumn('users', column, { transaction });
        }
      }

      await queryInterface.changeColumn(
        'users',
        'status',
        {
          type: Sequelize.ENUM('active', 'invited', 'suspended', 'deleted'),
          allowNull: false,
          defaultValue: 'active',
        },
        { transaction },
      );

      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_twoFactorMethod";', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
