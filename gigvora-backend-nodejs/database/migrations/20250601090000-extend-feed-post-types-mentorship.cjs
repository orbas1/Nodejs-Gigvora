'use strict';

const enumName = 'enum_feed_posts_type';
const tempEnumName = `${enumName}_tmp`;
const values = ['update', 'media', 'job', 'gig', 'project', 'volunteering', 'launchpad', 'mentorship', 'news'];
const previousValues = values.filter((value) => value !== 'mentorship');

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query(
        `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'mentorship';`,
      );
      return;
    }

    if (dialect === 'mysql') {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`feed_posts\` MODIFY COLUMN \`type\` ENUM(${values.map((value) => `'${value}'`).join(',')}) NOT NULL DEFAULT 'update';`,
      );
      return;
    }

    await queryInterface.changeColumn('feed_posts', 'type', {
      type: Sequelize.ENUM(...values),
      allowNull: false,
      defaultValue: 'update',
    });
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(
          `CREATE TYPE "${tempEnumName}" AS ENUM (${previousValues.map((value) => `'${value}'`).join(',')});`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TABLE "feed_posts" ALTER COLUMN "type" TYPE "${tempEnumName}" USING "type"::text::"${tempEnumName}";`,
          { transaction },
        );
        await queryInterface.sequelize.query(`DROP TYPE "${enumName}";`, { transaction });
        await queryInterface.sequelize.query(
          `ALTER TYPE "${tempEnumName}" RENAME TO "${enumName}";`,
          { transaction },
        );
      });
      return;
    }

    if (dialect === 'mysql') {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`feed_posts\` MODIFY COLUMN \`type\` ENUM(${previousValues
          .map((value) => `'${value}'`)
          .join(',')}) NOT NULL DEFAULT 'update';`,
      );
      return;
    }

    await queryInterface.changeColumn('feed_posts', 'type', {
      type: Sequelize.ENUM(...previousValues),
      allowNull: false,
      defaultValue: 'update',
    });
  },
};
