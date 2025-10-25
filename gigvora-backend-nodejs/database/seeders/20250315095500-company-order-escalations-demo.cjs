'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [orders] = await queryInterface.sequelize.query(
        `SELECT id, owner_id, order_number, due_at
         FROM pgm_gig_orders
         ORDER BY updated_at DESC
         LIMIT 3`,
        { transaction },
      );

      if (!orders || orders.length === 0) {
        await transaction.commit();
        return;
      }

      const now = Date.now();
      const rows = orders.map((order, index) => {
        const hours = (index + 1) * 6;
        const detectedAt = new Date(now - hours * 60 * 60 * 1000);
        const severity = hours >= 24 ? 'critical' : 'warning';
        const dueAt = order.due_at ? new Date(order.due_at).toISOString() : null;
        return {
          owner_id: order.owner_id,
          order_id: order.id,
          status: index === 0 ? 'queued' : index === 1 ? 'notified' : 'queued',
          severity,
          message: `Seeded escalation for order ${order.order_number}: ${hours}h overdue`,
          hours_overdue: hours,
          detected_at: detectedAt,
          escalated_at: detectedAt,
          resolved_at: null,
          support_case_id: null,
          support_thread_id: null,
          metadata: {
            seed: 'company-order-escalations-demo',
            dueAt,
            lastDetectedAt: detectedAt.toISOString(),
            hoursOverdue: hours,
          },
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      await queryInterface.bulkInsert('pgm_gig_order_escalations', rows, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(
        "DELETE FROM pgm_gig_order_escalations WHERE message LIKE 'Seeded escalation for order%'",
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
