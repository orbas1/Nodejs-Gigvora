'use strict';

const TARGET_TYPES_WITH_VOLUNTEERING = ['job', 'gig', 'project', 'volunteering'];
const TARGET_TYPES_BASE = ['job', 'gig', 'project'];

async function addPostgresEnumValue(queryInterface, enumName, value) {
  await queryInterface.sequelize
    .query(`ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${value}';`)
    .catch((error) => {
      if (!/duplicate key value/.test(error.message) && !/already exists/.test(error.message)) {
        throw error;
      }
    });
}

async function recreatePostgresEnum(queryInterface, enumName, values, table, column) {
  const tempName = `${enumName}_old`;
  await queryInterface.sequelize.query(`ALTER TYPE "${enumName}" RENAME TO "${tempName}";`);
  await queryInterface.sequelize.query(`CREATE TYPE "${enumName}" AS ENUM (${values.map((v) => `'${v}'`).join(', ')});`);
  await queryInterface.sequelize.query(
    `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE "${enumName}" USING "${column}"::text::"${enumName}";`,
  );
  await queryInterface.sequelize.query(`DROP TYPE "${tempName}";`);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (['postgres', 'postgresql'].includes(dialect)) {
      await addPostgresEnumValue(
        queryInterface,
        'enum_experience_launchpad_placements_targetType',
        'volunteering',
      );
      await addPostgresEnumValue(
        queryInterface,
        'enum_experience_launchpad_opportunity_links_targetType',
        'volunteering',
      );
    }

    await queryInterface.changeColumn('experience_launchpad_placements', 'targetType', {
      type: Sequelize.ENUM(...TARGET_TYPES_WITH_VOLUNTEERING),
      allowNull: true,
    });

    await queryInterface.changeColumn('experience_launchpad_opportunity_links', 'targetType', {
      type: Sequelize.ENUM(...TARGET_TYPES_WITH_VOLUNTEERING),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (['postgres', 'postgresql'].includes(dialect)) {
      await recreatePostgresEnum(
        queryInterface,
        'enum_experience_launchpad_placements_targetType',
        TARGET_TYPES_BASE,
        'experience_launchpad_placements',
        'targetType',
      );

      await recreatePostgresEnum(
        queryInterface,
        'enum_experience_launchpad_opportunity_links_targetType',
        TARGET_TYPES_BASE,
        'experience_launchpad_opportunity_links',
        'targetType',
      );
    } else {
      await queryInterface.changeColumn('experience_launchpad_opportunity_links', 'targetType', {
        type: Sequelize.ENUM(...TARGET_TYPES_BASE),
        allowNull: false,
      });

      await queryInterface.changeColumn('experience_launchpad_placements', 'targetType', {
        type: Sequelize.ENUM(...TARGET_TYPES_BASE),
        allowNull: true,
      });
    }
  },
};
