'use strict';

const resolveDecimal = (queryInterface, Sequelize) => {
  const dialect = queryInterface.sequelize.getDialect();
  if (['mysql', 'mariadb'].includes(dialect)) {
    return Sequelize.DECIMAL(6, 4);
  }
  return Sequelize.DECIMAL(5, 4);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const decimalType = resolveDecimal(queryInterface, Sequelize);

      await queryInterface.addColumn(
        'auto_assign_queue_entries',
        'confidence',
        { type: decimalType, allowNull: true },
        { transaction },
      );

      const dialect = queryInterface.sequelize.getDialect();
      if (['postgres', 'postgresql'].includes(dialect)) {
        await queryInterface.sequelize
          .query(
            `UPDATE auto_assign_queue_entries
             SET confidence = COALESCE(
               NULLIF(metadata ->> 'confidence', ''),
               NULLIF("responseMetadata" ->> 'confidence', '')
             )::decimal
             WHERE confidence IS NULL`,
            { transaction },
          )
          .catch(() => undefined);
      } else if (['mysql', 'mariadb'].includes(dialect)) {
        await queryInterface.sequelize
          .query(
            `UPDATE auto_assign_queue_entries
             SET confidence = CAST(
               COALESCE(
                 NULLIF(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.confidence')), ''),
                 NULLIF(JSON_UNQUOTE(JSON_EXTRACT(responseMetadata, '$.confidence')), '')
               ) AS DECIMAL(6,4)
             )
             WHERE confidence IS NULL`,
            { transaction },
          )
          .catch(() => undefined);
      }

      await queryInterface.addIndex(
        'auto_assign_queue_entries',
        ['targetType', 'targetId', 'confidence'],
        {
          name: 'auto_assign_queue_confidence_lookup_idx',
          transaction,
        },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'auto_assign_queue_entries',
        'auto_assign_queue_confidence_lookup_idx',
        { transaction },
      );

      await queryInterface.removeColumn('auto_assign_queue_entries', 'confidence', { transaction });
    });
  },
};
