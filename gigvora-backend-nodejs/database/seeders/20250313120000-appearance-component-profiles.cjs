'use strict';

const crypto = require('crypto');
const path = require('path');
const { pathToFileURL } = require('url');
const { QueryTypes } = require('sequelize');

const SEED_KEY = 'appearance-component-profiles-20250313';

async function loadComponentTokens() {
  const moduleUrl = pathToFileURL(
    path.resolve(__dirname, '../../../shared-contracts/domain/platform/component-tokens.js'),
  );
  const module = await import(moduleUrl.href);
  const tokens = module.DEFAULT_COMPONENT_TOKENS ?? {};
  const version = module.COMPONENT_TOKEN_VERSION ?? '2025.03';
  return {
    version,
    tokens: JSON.parse(JSON.stringify(tokens)),
  };
}

function buildProfilePayload({ id = crypto.randomUUID(), themeId, componentKey, definition, metadata }) {
  const now = new Date();
  return {
    id,
    themeId,
    componentKey,
    status: 'active',
    definition,
    metadata: { ...metadata, seedKey: SEED_KEY },
    createdBy: null,
    updatedBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const { tokens, version } = await loadComponentTokens();
      const [defaultTheme] = await queryInterface.sequelize.query(
        'SELECT id FROM appearance_themes WHERE "isDefault" = true LIMIT 1',
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      const themeId = defaultTheme?.id ?? null;
      const componentKeys = [
        'buttonSuite',
        'inputFieldSet',
        'cardScaffold',
        'brandBadge',
        'personaChip',
        'statBlock',
      ];

      const components = componentKeys
        .filter((componentKey) => tokens[componentKey])
        .map((componentKey) => ({
          componentKey,
          definition: JSON.parse(JSON.stringify(tokens[componentKey])),
        }));

      for (const component of components) {
        await queryInterface.bulkDelete(
          'appearance_component_profiles',
          { componentKey: component.componentKey, themeId },
          { transaction },
        );

        await queryInterface.bulkInsert(
          'appearance_component_profiles',
          [
            buildProfilePayload({
              themeId,
              componentKey: component.componentKey,
              definition: component.definition,
              metadata: { version },
            }),
          ],
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (['postgres', 'postgresql'].includes(dialect)) {
      await queryInterface.sequelize.query(
        `DELETE FROM "appearance_component_profiles" WHERE metadata @> '{"seedKey":"${SEED_KEY}"}'`,
      );
      return;
    }

    if (['mysql', 'mariadb'].includes(dialect)) {
      await queryInterface.sequelize.query(
        `DELETE FROM appearance_component_profiles WHERE JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.seedKey')) = '${SEED_KEY}'`,
      );
      return;
    }

    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query(
        `DELETE FROM appearance_component_profiles WHERE json_extract(metadata, '$.seedKey') = '${SEED_KEY}'`,
      );
      return;
    }

    await queryInterface.bulkDelete(
      'appearance_component_profiles',
      { metadata: { seedKey: SEED_KEY } },
    );
  },
};
