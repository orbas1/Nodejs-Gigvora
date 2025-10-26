'use strict';

module.exports = {
  async up(queryInterface) {
    const { refreshThreadMetrics } = await import('../../src/services/messagingService.js');
    const [threads] = await queryInterface.sequelize.query('SELECT id FROM message_threads ORDER BY id ASC');
    for (const thread of threads) {
      try {
        await refreshThreadMetrics(thread.id);
      } catch (error) {
        console.warn(`Failed to refresh metrics for thread ${thread.id}:`, error.message);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('message_thread_metrics', null, {});
  },
};
