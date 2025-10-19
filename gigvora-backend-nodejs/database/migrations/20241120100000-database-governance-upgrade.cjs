'use strict';

const crypto = require('crypto');

async function removeDuplicateProfiles(queryInterface, table, transaction) {
  const [records] = await queryInterface.sequelize.query(
    `SELECT id, userId FROM ${table}`,
    { transaction },
  );

  if (!Array.isArray(records) || records.length === 0) {
    return;
  }

  const seen = new Set();
  const duplicateIds = [];
  for (const record of records) {
    if (!record || record.userId == null) {
      continue;
    }
    const key = String(record.userId);
    if (seen.has(key)) {
      duplicateIds.push(record.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicateIds.length > 0) {
    await queryInterface.bulkDelete(
      table,
      { id: duplicateIds },
      { transaction },
    );
  }
}

async function resetForeignKey(queryInterface, table, column, transaction) {
  if (typeof queryInterface.getForeignKeyReferencesForTable === 'function') {
    const references = await queryInterface.getForeignKeyReferencesForTable(table, { transaction });
    for (const reference of references) {
      if (reference.columnName === column) {
        try {
          await queryInterface.removeConstraint(table, reference.constraintName, { transaction });
        } catch (error) {
          if (!/constraint/i.test(error.message)) {
            throw error;
          }
        }
      }
    }
  }

  const constraintName = `${table}_${column}_fkey`;
  try {
    await queryInterface.removeConstraint(table, constraintName, { transaction });
  } catch (error) {
    if (!/constraint/i.test(error.message)) {
      throw error;
    }
  }

  await queryInterface.addConstraint(table, {
    type: 'foreign key',
    name: constraintName,
    fields: [column],
    references: { table: 'users', field: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    transaction,
  });
}

async function addUniqueIndex(queryInterface, table, column, transaction) {
  const indexName = `${table}_${column}_unique`;
  try {
    await queryInterface.addConstraint(table, {
      fields: [column],
      type: 'unique',
      name: indexName,
      transaction,
    });
  } catch (error) {
    if (!/unique/i.test(error.message)) {
      throw error;
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'freelancer_profiles',
        'hourlyRate',
        {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        { transaction },
      );

      const personaTables = ['profiles', 'company_profiles', 'agency_profiles', 'freelancer_profiles'];
      for (const table of personaTables) {
        await removeDuplicateProfiles(queryInterface, table, transaction);
        await resetForeignKey(queryInterface, table, 'userId', transaction);
        await addUniqueIndex(queryInterface, table, 'userId', transaction);
      }

      const [legacyTokens] = await queryInterface.sequelize.query(
        'SELECT email, code, expiresAt FROM two_factor_tokens',
        { transaction },
      );

      await queryInterface.dropTable('two_factor_tokens', { transaction });

      const dialect = queryInterface.sequelize.getDialect();
      const idColumn = {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      };

      if (dialect === 'mysql' || dialect === 'mariadb') {
        idColumn.defaultValue = Sequelize.literal('UUID()');
      } else if (dialect === 'postgres' || dialect === 'postgresql') {
        idColumn.defaultValue = Sequelize.literal('gen_random_uuid()');
      }

      await queryInterface.createTable(
        'two_factor_tokens',
        {
          id: idColumn,
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

      await queryInterface.addIndex('two_factor_tokens', ['email'], {
        name: 'two_factor_tokens_email_idx',
        transaction,
      });
      await queryInterface.addIndex('two_factor_tokens', ['expiresAt'], {
        name: 'two_factor_tokens_expires_idx',
        transaction,
      });

      if (Array.isArray(legacyTokens) && legacyTokens.length > 0) {
        const hashed = legacyTokens
          .filter((token) => token && token.email && token.code)
          .map((token) => ({
            id: crypto.randomUUID(),
            email: token.email,
            codeHash: crypto
              .createHash('sha256')
              .update(String(token.code ?? ''))
              .digest('hex'),
            deliveryMethod: 'email',
            expiresAt: token.expiresAt ? new Date(token.expiresAt) : new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
            consumedAt: null,
            createdAt: new Date(),
          }));

        if (hashed.length > 0) {
          await queryInterface.bulkInsert('two_factor_tokens', hashed, { transaction });
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const dialect = queryInterface.sequelize.getDialect();

      await queryInterface.changeColumn(
        'freelancer_profiles',
        'hourlyRate',
        {
          type: Sequelize.DECIMAL,
          allowNull: true,
        },
        { transaction },
      );

      const personaTables = ['profiles', 'company_profiles', 'agency_profiles', 'freelancer_profiles'];
      for (const table of personaTables) {
        const indexName = `${table}_userId_unique`;
        try {
          await queryInterface.removeConstraint(table, indexName, { transaction });
        } catch (error) {
          if (!/constraint/i.test(error.message)) {
            throw error;
          }
        }

        const constraintName = `${table}_userId_fkey`;
        try {
          await queryInterface.removeConstraint(table, constraintName, { transaction });
        } catch (error) {
          if (!/constraint/i.test(error.message)) {
            throw error;
          }
        }

        await queryInterface.addConstraint(table, {
          type: 'foreign key',
          name: constraintName,
          fields: ['userId'],
          references: { table: 'users', field: 'id' },
          onDelete: 'CASCADE',
          transaction,
        });
      }

      await queryInterface.dropTable('two_factor_tokens', { transaction });

      await queryInterface.createTable(
        'two_factor_tokens',
        {
          email: { type: Sequelize.STRING, primaryKey: true },
          code: { type: Sequelize.STRING, allowNull: false },
          expiresAt: { type: Sequelize.DATE, allowNull: true },
        },
        { transaction },
      );

      if (dialect === 'postgres' || dialect === 'postgresql') {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_two_factor_tokens_deliveryMethod";',
          { transaction },
        );
      }
    });
  },
};
