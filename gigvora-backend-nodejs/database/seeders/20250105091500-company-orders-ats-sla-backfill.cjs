'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        "UPDATE pgm_gig_orders SET sla_status = COALESCE(sla_status, 'on_track'), ats_last_status = COALESCE(ats_last_status, status), ats_last_synced_at = COALESCE(ats_last_synced_at, NOW())",
        { transaction },
      );

      await queryInterface.sequelize.query(
        "UPDATE gig_orders SET \"slaStatus\" = COALESCE(\"slaStatus\", 'on_track'), \"atsLastStatus\" = COALESCE(\"atsLastStatus\", \"status\"), \"atsLastSyncedAt\" = COALESCE(\"atsLastSyncedAt\", NOW())",
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'UPDATE pgm_gig_orders SET sla_status = NULL, ats_last_status = NULL, ats_last_synced_at = NULL',
        { transaction },
      );
      await queryInterface.sequelize.query(
        'UPDATE gig_orders SET "slaStatus" = NULL, "atsLastStatus" = NULL, "atsLastSyncedAt" = NULL',
        { transaction },
      );
    });
  },
};
