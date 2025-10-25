'use strict';

function resolveJsonType(queryInterface, Sequelize) {
  const dialect = queryInterface.sequelize.getDialect();
  return ['postgres', 'postgresql'].includes(dialect) ? Sequelize.JSONB : Sequelize.JSON;
}

async function refreshAddonPositions(queryInterface, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  if (['postgres', 'postgresql'].includes(dialect)) {
    await queryInterface.sequelize.query(
      `WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "gigId" ORDER BY id) - 1 AS rn
        FROM gig_add_ons
      )
      UPDATE gig_add_ons
      SET position = ranked.rn
      FROM ranked
      WHERE ranked.id = gig_add_ons.id;`,
      { transaction },
    );
    return;
  }

  await queryInterface.sequelize.query(
    `UPDATE gig_add_ons ga
     JOIN (
       SELECT id, gigId, ROW_NUMBER() OVER (PARTITION BY gigId ORDER BY id) - 1 AS rn
       FROM gig_add_ons
     ) ranked ON ranked.id = ga.id
     SET ga.position = ranked.rn;`,
    { transaction },
  );
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const jsonType = resolveJsonType(queryInterface, Sequelize);
      const schema = await queryInterface.describeTable('gig_add_ons', { transaction }).catch(() => ({}));

      if (!Object.prototype.hasOwnProperty.call(schema, 'position')) {
        await queryInterface.addColumn(
          'gig_add_ons',
          'position',
          { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
          { transaction },
        );
        await refreshAddonPositions(queryInterface, transaction);
      }

      if (!Object.prototype.hasOwnProperty.call(schema, 'metadata')) {
        await queryInterface.addColumn(
          'gig_add_ons',
          'metadata',
          { type: jsonType, allowNull: true },
          { transaction },
        );
      }

      const indexes = await queryInterface.showIndex('gig_add_ons', { transaction }).catch(() => []);
      if (!indexes.some((index) => index.name === 'gig_add_ons_position_idx')) {
        await queryInterface.addIndex('gig_add_ons', ['gigId', 'position'], {
          name: 'gig_add_ons_position_idx',
          transaction,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('gig_add_ons', 'gig_add_ons_position_idx', { transaction }).catch(() => {});

      const schema = await queryInterface.describeTable('gig_add_ons', { transaction }).catch(() => ({}));
      if (Object.prototype.hasOwnProperty.call(schema, 'metadata')) {
        await queryInterface.removeColumn('gig_add_ons', 'metadata', { transaction });
      }
      if (Object.prototype.hasOwnProperty.call(schema, 'position')) {
        await queryInterface.removeColumn('gig_add_ons', 'position', { transaction });
      }
    });
  },
};
