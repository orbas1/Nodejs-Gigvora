'use strict';

const path = require('path');

const PERSONAS = require(path.resolve(__dirname, '../../..', 'shared-contracts/onboarding/personas.json'));

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const slugs = PERSONAS.map((persona) => persona.slug);
    await queryInterface.bulkDelete('onboarding_personas', { slug: slugs });
    await queryInterface.bulkInsert(
      'onboarding_personas',
      PERSONAS.map((persona, index) => ({
        slug: persona.slug,
        title: persona.title,
        subtitle: persona.subtitle,
        headline: persona.headline,
        description: persona.description ?? null,
        benefits: persona.benefits,
        metrics: persona.metrics,
        signatureMoments: persona.signatureMoments,
        recommendedModules: persona.recommendedModules,
        heroMedia: persona.heroMedia ?? {},
        status: 'active',
        sortOrder: index,
        metadata: {
          ...persona.metadata,
          seed: '20250401101500-onboarding-personas-seed',
        },
        createdAt: now,
        updatedAt: now,
      })),
    );
  },

  async down(queryInterface) {
    const slugs = PERSONAS.map((persona) => persona.slug);
    await queryInterface.bulkDelete('onboarding_personas', { slug: slugs });
  },
};
