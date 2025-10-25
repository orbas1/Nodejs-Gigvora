'use strict';

const { dropEnum } = require('../utils/migrationHelpers.cjs');

const SLA_STATUSES = ['on_track', 'at_risk', 'breached', 'resolved'];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'pgm_gig_orders',
        'ats_external_id',
        { type: Sequelize.STRING(180), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_orders',
        'ats_last_status',
        { type: Sequelize.STRING(60), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_orders',
        'ats_last_synced_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_orders',
        'sla_status',
        { type: Sequelize.ENUM(...SLA_STATUSES), allowNull: false, defaultValue: 'on_track' },
        { transaction },
      );
      await queryInterface.addColumn(
        'pgm_gig_orders',
        'sla_escalated_at',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );

      await queryInterface.addColumn(
        'gig_orders',
        'atsExternalId',
        { type: Sequelize.STRING(180), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'gig_orders',
        'atsLastStatus',
        { type: Sequelize.STRING(60), allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'gig_orders',
        'atsLastSyncedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'gig_orders',
        'slaStatus',
        { type: Sequelize.ENUM(...SLA_STATUSES), allowNull: false, defaultValue: 'on_track' },
        { transaction },
      );
      await queryInterface.addColumn(
        'gig_orders',
        'slaEscalatedAt',
        { type: Sequelize.DATE, allowNull: true },
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('pgm_gig_orders', 'ats_external_id', { transaction });
      await queryInterface.removeColumn('pgm_gig_orders', 'ats_last_status', { transaction });
      await queryInterface.removeColumn('pgm_gig_orders', 'ats_last_synced_at', { transaction });
      await queryInterface.removeColumn('pgm_gig_orders', 'sla_status', { transaction });
      await queryInterface.removeColumn('pgm_gig_orders', 'sla_escalated_at', { transaction });
      await dropEnum(queryInterface, 'enum_pgm_gig_orders_sla_status', transaction);

      await queryInterface.removeColumn('gig_orders', 'atsExternalId', { transaction });
      await queryInterface.removeColumn('gig_orders', 'atsLastStatus', { transaction });
      await queryInterface.removeColumn('gig_orders', 'atsLastSyncedAt', { transaction });
      await queryInterface.removeColumn('gig_orders', 'slaStatus', { transaction });
      await queryInterface.removeColumn('gig_orders', 'slaEscalatedAt', { transaction });
      await dropEnum(queryInterface, 'enum_gig_orders_slaStatus', transaction);
    });
  },
};
