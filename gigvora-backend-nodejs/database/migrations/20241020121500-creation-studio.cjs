'use strict';

module.exports = {
  async up(queryInterface) {
    // This migration previously attempted to recreate creation studio tables. The schema is now
    // established in 20240930090000-create-creation-studio.cjs so we ensure the expected indexes
    // exist without duplicating table definitions.
    await queryInterface.addIndex('creation_studio_items', ['owner_id', 'type'], {
      name: 'creation_studio_items_owner_type_idx',
      unique: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('creation_studio_items', 'creation_studio_items_owner_type_idx');
  },
};
