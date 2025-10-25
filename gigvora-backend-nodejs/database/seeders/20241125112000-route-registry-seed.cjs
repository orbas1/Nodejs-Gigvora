'use strict';

module.exports = {
  async up() {
    const { syncRouteRegistry } = await import('../../src/services/routeRegistryService.js');
    await syncRouteRegistry({ actor: { actorId: 'seed:route-registry' } });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('route_registry_entries', null, {});
  },
};
