'use strict';

const TYPE_VALUES = ['project', 'gig', 'milestone', 'retainer', 'invoice', 'subscription', 'membership'];
const STATUS_VALUES = [
  'initiated',
  'funded',
  'in_escrow',
  'pending_release',
  'held',
  'paused',
  'released',
  'refunded',
  'cancelled',
  'disputed',
];

const LEGACY_TYPE_VALUES = ['project', 'gig', 'milestone', 'retainer'];
const LEGACY_STATUS_VALUES = ['initiated', 'funded', 'in_escrow', 'released', 'refunded', 'cancelled', 'disputed'];

async function addEnumValuesPostgres(queryInterface, enumName, values, transaction) {
  for (const value of values) {
    await queryInterface.sequelize.query(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = '${enumName}' AND e.enumlabel = '${value}') THEN ALTER TYPE "${enumName}" ADD VALUE '${value}'; END IF; END $$;`,
      { transaction },
    );
  }
}

async function alterEnumMySql(queryInterface, table, column, values, transaction) {
  const quotedValues = values.map((value) => `'${value}'`).join(', ');
  await queryInterface.sequelize.query(
    `ALTER TABLE ${table} MODIFY ${column} ENUM(${quotedValues}) NOT NULL`,
    { transaction },
  );
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres' || dialect === 'postgresql') {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await addEnumValuesPostgres(
          queryInterface,
          'enum_escrow_transactions_type',
          ['invoice', 'subscription', 'membership'],
          transaction,
        );
        await addEnumValuesPostgres(
          queryInterface,
          'enum_escrow_transactions_status',
          ['pending_release', 'held', 'paused'],
          transaction,
        );
      });
      return;
    }

    if (dialect === 'mysql' || dialect === 'mariadb') {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await alterEnumMySql(
          queryInterface,
          '`escrow_transactions`',
          '`type`',
          TYPE_VALUES,
          transaction,
        );
        await alterEnumMySql(
          queryInterface,
          '`escrow_transactions`',
          '`status`',
          STATUS_VALUES,
          transaction,
        );
      });
      return;
    }

    // Fallback for dialects without native ENUM support.
    await queryInterface.changeColumn('escrow_transactions', 'type', {
      type: Sequelize.ENUM(...TYPE_VALUES),
      allowNull: false,
      defaultValue: 'project',
    });
    await queryInterface.changeColumn('escrow_transactions', 'status', {
      type: Sequelize.ENUM(...STATUS_VALUES),
      allowNull: false,
      defaultValue: 'initiated',
    });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres' || dialect === 'postgresql') {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(
          `UPDATE "escrow_transactions" SET "type" = 'project' WHERE "type" IN ('invoice', 'subscription', 'membership');`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `UPDATE "escrow_transactions" SET "status" = 'in_escrow' WHERE "status" IN ('pending_release', 'held', 'paused');`,
          { transaction },
        );

        await queryInterface.sequelize.query(
          'ALTER TYPE "enum_escrow_transactions_type" RENAME TO "enum_escrow_transactions_type_old";',
          { transaction },
        );
        await queryInterface.sequelize.query(
          `CREATE TYPE "enum_escrow_transactions_type" AS ENUM (${LEGACY_TYPE_VALUES.map((value) => `'${value}'`).join(', ')});`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          'ALTER TABLE "escrow_transactions" ALTER COLUMN "type" TYPE "enum_escrow_transactions_type" USING "type"::text::"enum_escrow_transactions_type";',
          { transaction },
        );
        await queryInterface.sequelize.query('DROP TYPE "enum_escrow_transactions_type_old";', { transaction });

        await queryInterface.sequelize.query(
          'ALTER TYPE "enum_escrow_transactions_status" RENAME TO "enum_escrow_transactions_status_old";',
          { transaction },
        );
        await queryInterface.sequelize.query(
          `CREATE TYPE "enum_escrow_transactions_status" AS ENUM (${LEGACY_STATUS_VALUES.map((value) => `'${value}'`).join(', ')});`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          'ALTER TABLE "escrow_transactions" ALTER COLUMN "status" TYPE "enum_escrow_transactions_status" USING "status"::text::"enum_escrow_transactions_status";',
          { transaction },
        );
        await queryInterface.sequelize.query('DROP TYPE "enum_escrow_transactions_status_old";', { transaction });
      });
      return;
    }

    if (dialect === 'mysql' || dialect === 'mariadb') {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(
          `UPDATE \`escrow_transactions\` SET \`type\` = 'project' WHERE \`type\` IN ('invoice', 'subscription', 'membership');`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `UPDATE \`escrow_transactions\` SET \`status\` = 'in_escrow' WHERE \`status\` IN ('pending_release', 'held', 'paused');`,
          { transaction },
        );
        await alterEnumMySql(
          queryInterface,
          '`escrow_transactions`',
          '`type`',
          LEGACY_TYPE_VALUES,
          transaction,
        );
        await alterEnumMySql(
          queryInterface,
          '`escrow_transactions`',
          '`status`',
          LEGACY_STATUS_VALUES,
          transaction,
        );
      });
      return;
    }

    await queryInterface.changeColumn('escrow_transactions', 'type', {
      type: Sequelize.ENUM(...LEGACY_TYPE_VALUES),
      allowNull: false,
      defaultValue: 'project',
    });
    await queryInterface.changeColumn('escrow_transactions', 'status', {
      type: Sequelize.ENUM(...LEGACY_STATUS_VALUES),
      allowNull: false,
      defaultValue: 'initiated',
    });
  },
};
