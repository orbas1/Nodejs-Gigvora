'use strict';

const { resolveJsonType, dropEnum } = require('../utils/migrationHelpers.cjs');

function mapTableName(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry.toLowerCase();
  if (typeof entry === 'object') {
    if (entry.tableName) return `${entry.tableName}`.toLowerCase();
    const values = Object.values(entry);
    if (values.length) {
      return `${values[0]}`.toLowerCase();
    }
  }
  return null;
}

async function tableExists(queryInterface, name) {
  const tables = await queryInterface.showAllTables();
  const normalized = new Set(tables.map(mapTableName).filter(Boolean));
  return normalized.has(name.toLowerCase());
}

async function ensureColumn(queryInterface, tableName, columnName, definition, transaction) {
  const tableDefinition = await queryInterface.describeTable(tableName);
  if (!tableDefinition[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition, { transaction });
  }
}

async function removeColumnIfExists(queryInterface, tableName, columnName, transaction) {
  const tableDefinition = await queryInterface.describeTable(tableName);
  if (tableDefinition[columnName]) {
    await queryInterface.removeColumn(tableName, columnName, { transaction });
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const jsonType = resolveJsonType(queryInterface, Sequelize);

      await ensureColumn(queryInterface, 'users', 'location', { type: Sequelize.STRING(255), allowNull: true }, transaction);
      await ensureColumn(queryInterface, 'users', 'geoLocation', { type: jsonType, allowNull: true }, transaction);
      await ensureColumn(queryInterface, 'users', 'twoFactorEnabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      }, transaction);
      await ensureColumn(queryInterface, 'users', 'twoFactorMethod', {
        type: Sequelize.ENUM('email', 'app', 'sms'),
        allowNull: false,
        defaultValue: 'email',
      }, transaction);
      await ensureColumn(queryInterface, 'users', 'googleId', { type: Sequelize.STRING(255), allowNull: true }, transaction);
      await ensureColumn(queryInterface, 'users', 'memberships', {
        type: jsonType,
        allowNull: false,
        defaultValue: [],
      }, transaction);
      await ensureColumn(queryInterface, 'users', 'primaryDashboard', { type: Sequelize.STRING(60), allowNull: true }, transaction);

      if (!(await tableExists(queryInterface, 'user_login_audits'))) {
        await queryInterface.createTable(
          'user_login_audits',
          {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'users', key: 'id' },
              onDelete: 'CASCADE',
            },
            eventType: { type: Sequelize.STRING(60), allowNull: false, defaultValue: 'login' },
            ipAddress: { type: Sequelize.STRING(120), allowNull: true },
            userAgent: { type: Sequelize.STRING(500), allowNull: true },
            metadata: { type: jsonType, allowNull: true },
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
          },
          { transaction },
        );
        await queryInterface.addIndex('user_login_audits', ['userId'], { transaction });
        await queryInterface.addIndex('user_login_audits', ['eventType'], { transaction });
        await queryInterface.addIndex('user_login_audits', ['createdAt'], { transaction });
      }

      const recreateTwoFactorTokens = async () => {
        await dropEnum(queryInterface, 'enum_two_factor_tokens_deliveryMethod', transaction);
        await queryInterface.createTable(
          'two_factor_tokens',
          {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            email: { type: Sequelize.STRING(255), allowNull: false },
            codeHash: { type: Sequelize.STRING(128), allowNull: false },
            deliveryMethod: {
              type: Sequelize.ENUM('email', 'app', 'sms'),
              allowNull: false,
              defaultValue: 'email',
            },
            expiresAt: { type: Sequelize.DATE, allowNull: false },
            attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            consumedAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
          },
          { transaction },
        );
        await queryInterface.addIndex('two_factor_tokens', ['email'], { transaction });
        await queryInterface.addIndex('two_factor_tokens', ['expiresAt'], { transaction });
      };

      if (!(await tableExists(queryInterface, 'two_factor_tokens'))) {
        await recreateTwoFactorTokens();
      } else {
        // Recreate table to match expected structure
        await queryInterface.dropTable('two_factor_tokens', { transaction });
        await dropEnum(queryInterface, 'enum_two_factor_tokens_deliveryMethod', transaction);
        await recreateTwoFactorTokens();
      }

      if (!(await tableExists(queryInterface, 'password_reset_tokens'))) {
        await queryInterface.createTable(
          'password_reset_tokens',
          {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: 'users', key: 'id' },
              onDelete: 'CASCADE',
            },
            tokenHash: { type: Sequelize.STRING(128), allowNull: false },
            expiresAt: { type: Sequelize.DATE, allowNull: false },
            consumedAt: { type: Sequelize.DATE, allowNull: true },
            ipAddress: { type: Sequelize.STRING(120), allowNull: true },
            userAgent: { type: Sequelize.STRING(500), allowNull: true },
            metadata: { type: jsonType, allowNull: true },
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
          },
          { transaction },
        );
        await queryInterface.addIndex('password_reset_tokens', ['userId'], { transaction });
        await queryInterface.addIndex('password_reset_tokens', ['tokenHash'], { unique: true, transaction });
        await queryInterface.addIndex('password_reset_tokens', ['expiresAt'], { transaction });
      }

      if (await tableExists(queryInterface, 'company_profiles')) {
        await ensureColumn(queryInterface, 'company_profiles', 'location', { type: Sequelize.STRING(255), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'company_profiles', 'geoLocation', { type: jsonType, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'company_profiles', 'tagline', { type: Sequelize.STRING(255), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'company_profiles', 'logoUrl', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'company_profiles', 'bannerUrl', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'company_profiles', 'contactEmail', { type: Sequelize.STRING(255), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'company_profiles', 'contactPhone', { type: Sequelize.STRING(60), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'company_profiles', 'socialLinks', { type: jsonType, allowNull: true }, transaction);
      }

      if (await tableExists(queryInterface, 'agency_profiles')) {
        const enumFollower = 'enum_agency_profiles_followerPolicy';
        const enumConnection = 'enum_agency_profiles_connectionPolicy';

        await ensureColumn(queryInterface, 'agency_profiles', 'location', { type: Sequelize.STRING(255), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'geoLocation', { type: jsonType, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'tagline', { type: Sequelize.STRING(160), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'summary', { type: Sequelize.TEXT, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'about', { type: Sequelize.TEXT, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'services', { type: jsonType, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'industries', { type: jsonType, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'clients', { type: jsonType, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'awards', { type: jsonType, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'socialLinks', { type: jsonType, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'teamSize', { type: Sequelize.INTEGER, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'foundedYear', { type: Sequelize.INTEGER, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'primaryContactName', { type: Sequelize.STRING(160), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'primaryContactEmail', { type: Sequelize.STRING(255), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'primaryContactPhone', { type: Sequelize.STRING(60), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'brandColor', { type: Sequelize.STRING(12), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'bannerUrl', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'avatarUrl', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'avatarStorageKey', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'autoAcceptFollowers', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'defaultConnectionMessage', { type: Sequelize.TEXT, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'followerPolicy', {
          type: Sequelize.ENUM('open', 'approval_required', 'closed'),
          allowNull: false,
          defaultValue: 'open',
        }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'connectionPolicy', {
          type: Sequelize.ENUM('open', 'invite_only', 'manual_review'),
          allowNull: false,
          defaultValue: 'open',
        }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'description', { type: Sequelize.TEXT, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'introVideoUrl', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'bannerImageUrl', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'profileImageUrl', { type: Sequelize.STRING(500), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'workforceAvailable', { type: Sequelize.INTEGER, allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'agency_profiles', 'workforceNotes', { type: Sequelize.STRING(255), allowNull: true }, transaction);

        // ensure enums exist (no-op if already created)
        if (queryInterface.sequelize.getDialect() !== 'postgres' && queryInterface.sequelize.getDialect() !== 'postgresql') {
          await queryInterface.changeColumn(
            'agency_profiles',
            'followerPolicy',
            {
              type: Sequelize.ENUM('open', 'approval_required', 'closed'),
              allowNull: false,
              defaultValue: 'open',
            },
            { transaction },
          );
          await queryInterface.changeColumn(
            'agency_profiles',
            'connectionPolicy',
            {
              type: Sequelize.ENUM('open', 'invite_only', 'manual_review'),
              allowNull: false,
              defaultValue: 'open',
            },
            { transaction },
          );
        }
      }

      if (await tableExists(queryInterface, 'freelancer_profiles')) {
        await ensureColumn(queryInterface, 'freelancer_profiles', 'location', { type: Sequelize.STRING(255), allowNull: true }, transaction);
        await ensureColumn(queryInterface, 'freelancer_profiles', 'geoLocation', { type: jsonType, allowNull: true }, transaction);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await removeColumnIfExists(queryInterface, 'users', 'location', transaction);
      await removeColumnIfExists(queryInterface, 'users', 'geoLocation', transaction);
      await removeColumnIfExists(queryInterface, 'users', 'twoFactorEnabled', transaction);
      await removeColumnIfExists(queryInterface, 'users', 'twoFactorMethod', transaction);
      await removeColumnIfExists(queryInterface, 'users', 'googleId', transaction);
      await removeColumnIfExists(queryInterface, 'users', 'memberships', transaction);
      await removeColumnIfExists(queryInterface, 'users', 'primaryDashboard', transaction);

      if (await tableExists(queryInterface, 'password_reset_tokens')) {
        await queryInterface.dropTable('password_reset_tokens', { transaction });
      }

      if (await tableExists(queryInterface, 'two_factor_tokens')) {
        await queryInterface.dropTable('two_factor_tokens', { transaction });
        await queryInterface.createTable(
          'two_factor_tokens',
          {
            email: { type: Sequelize.STRING(191), allowNull: false, primaryKey: true },
            code: { type: Sequelize.STRING(8), allowNull: false },
            attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            expiresAt: { type: Sequelize.DATE, allowNull: false },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
          },
          { transaction },
        );
      }

      if (await tableExists(queryInterface, 'user_login_audits')) {
        await queryInterface.dropTable('user_login_audits', { transaction });
      }

      const tablesToClean = [
        { table: 'company_profiles', columns: ['location', 'geoLocation', 'tagline', 'logoUrl', 'bannerUrl', 'contactEmail', 'contactPhone', 'socialLinks'] },
        {
          table: 'agency_profiles',
          columns: [
            'location',
            'geoLocation',
            'tagline',
            'summary',
            'about',
            'services',
            'industries',
            'clients',
            'awards',
            'socialLinks',
            'teamSize',
            'foundedYear',
            'primaryContactName',
            'primaryContactEmail',
            'primaryContactPhone',
            'brandColor',
            'bannerUrl',
            'avatarUrl',
            'avatarStorageKey',
            'autoAcceptFollowers',
            'defaultConnectionMessage',
            'followerPolicy',
            'connectionPolicy',
            'description',
            'introVideoUrl',
            'bannerImageUrl',
            'profileImageUrl',
            'workforceAvailable',
            'workforceNotes',
          ],
          enums: ['enum_agency_profiles_followerPolicy', 'enum_agency_profiles_connectionPolicy'],
        },
        { table: 'freelancer_profiles', columns: ['location', 'geoLocation'] },
      ];

      for (const entry of tablesToClean) {
        if (await tableExists(queryInterface, entry.table)) {
          for (const column of entry.columns) {
            await removeColumnIfExists(queryInterface, entry.table, column, transaction);
          }
          if (entry.enums) {
            for (const enumName of entry.enums) {
              await dropEnum(queryInterface, enumName, transaction);
            }
          }
        }
      }

      await dropEnum(queryInterface, 'enum_users_twoFactorMethod', transaction);
      await dropEnum(queryInterface, 'enum_two_factor_tokens_deliveryMethod', transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
