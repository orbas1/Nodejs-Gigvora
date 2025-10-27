'use strict';

const crypto = require('crypto');
const path = require('path');
const { pathToFileURL } = require('url');
const { QueryTypes } = require('sequelize');

const SEED_ACTOR = 'seed:design-system-governance-baseline';

function buildHash(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function loadDesignContracts() {
  const moduleUrl = pathToFileURL(
    path.resolve(__dirname, '../../shared-contracts/domain/platform/design-system.js'),
  );
  return import(moduleUrl.href);
}

async function loadNavigationContracts() {
  const moduleUrl = pathToFileURL(
    path.resolve(__dirname, '../../shared-contracts/domain/platform/navigation-governance.js'),
  );
  return import(moduleUrl.href);
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const { createDesignSystemSnapshot } = await loadDesignContracts();
      const [theme] = await queryInterface.sequelize.query(
        'SELECT * FROM appearance_themes WHERE "isDefault" = true ORDER BY "updatedAt" DESC LIMIT 1',
        { type: QueryTypes.SELECT, transaction },
      );

      if (theme) {
        const assets = await queryInterface.sequelize.query(
          'SELECT id, "themeId", type, label, description, url, "altText", metadata, "allowedRoles", status, "isPrimary", "sortOrder", "createdAt", "updatedAt" FROM appearance_assets WHERE "themeId" = :themeId AND status = :status ORDER BY "sortOrder" ASC, "createdAt" ASC',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { themeId: theme.id, status: 'active' },
          },
        );

        const componentProfiles = await queryInterface.sequelize.query(
          'SELECT "componentKey", definition, metadata, "updatedAt" FROM appearance_component_profiles WHERE "themeId" = :themeId AND status = :status ORDER BY "componentKey" ASC',
          {
            type: QueryTypes.SELECT,
            transaction,
            replacements: { themeId: theme.id, status: 'active' },
          },
        );

        const componentRegistry = componentProfiles.reduce((acc, profile) => {
          if (profile.componentKey) {
            acc[profile.componentKey] = profile.definition ?? {};
          }
          return acc;
        }, {});

        const componentTokenVersion = componentProfiles.reduce((version, profile) => {
          const profileVersion = profile?.metadata?.version;
          return profileVersion && typeof profileVersion === 'string' ? profileVersion : version;
        }, undefined);

        const preferences = { mode: 'light', accent: 'azure', density: 'comfortable' };

        const metadata = {
          theme: {
            id: theme.id,
            slug: theme.slug,
            name: theme.name,
            status: theme.status,
            accessibility: theme.accessibility ?? {},
            tokens: theme.tokens ?? {},
            assets,
            updatedAt: theme.updatedAt,
          },
          release: {
            seed: SEED_ACTOR,
            source: 'appearance_themes',
          },
        };

        const analytics = {
          themeAssetCount: Array.isArray(assets) ? assets.length : 0,
          componentProfileCount: componentProfiles.length,
        };

        const snapshot = createDesignSystemSnapshot({
          ...preferences,
          componentTokens: componentRegistry,
          componentTokenVersion,
          metadata,
          analytics,
        });

        const serialisedSnapshot = JSON.parse(JSON.stringify(snapshot));
        const themeHash = buildHash({
          tokens: metadata.theme.tokens ?? {},
          assets,
          componentRegistry,
        });
        const checksum = buildHash(serialisedSnapshot);
        const now = new Date();

        await queryInterface.bulkInsert(
          'design_system_releases',
          [
            {
              id: crypto.randomUUID(),
              themeId: theme.id,
              version: serialisedSnapshot.version,
              preferences,
              snapshot: serialisedSnapshot,
              analytics: serialisedSnapshot.metadata?.analytics ?? {},
              metadata,
              themeHash,
              checksum,
              releasedBy: SEED_ACTOR,
              releasedAt: now,
              releaseNotes: 'Seeded baseline design system release from default theme tokens.',
              createdAt: now,
              updatedAt: now,
            },
          ],
          { transaction },
        );
      }

      const { buildNavigationGovernanceSnapshot } = await loadNavigationContracts();
      const locales = await queryInterface.sequelize.query(
        'SELECT code, label, "nativeLabel", flag, region, coverage, status, summary, direction, "isDefault", metadata FROM navigation_locales ORDER BY "sortOrder" ASC, code ASC',
        { type: QueryTypes.SELECT, transaction },
      );
      const personas = await queryInterface.sequelize.query(
        'SELECT "personaKey" as key, label, icon, tagline, "focusAreas", metrics, "primaryCta", "defaultRoute", "timelineEnabled", metadata FROM navigation_personas ORDER BY "sortOrder" ASC, "personaKey" ASC',
        { type: QueryTypes.SELECT, transaction },
      );
      const routes = await queryInterface.sequelize.query(
        'SELECT collection, path, "absolutePath", title, icon, persona, "featureFlag", "modulePath" as module, metadata FROM route_registry_entries WHERE "isActive" = true ORDER BY collection ASC, "absolutePath" ASC',
        { type: QueryTypes.SELECT, transaction },
      );

      const governanceSnapshot = buildNavigationGovernanceSnapshot({ locales, personas, routes });
      const serialisedGovernance = JSON.parse(JSON.stringify(governanceSnapshot));
      const governanceChecksum = buildHash(serialisedGovernance);
      const governanceNow = new Date(serialisedGovernance.generatedAt ?? Date.now());

      await queryInterface.bulkInsert(
        'navigation_governance_audits',
        [
          {
            id: crypto.randomUUID(),
            snapshotVersion: serialisedGovernance.version,
            localeCount: serialisedGovernance.locales?.length ?? 0,
            personaCount: serialisedGovernance.personas?.length ?? 0,
            routeCount: serialisedGovernance.analytics?.totalRoutes ?? 0,
            duplicateRouteCount: serialisedGovernance.analytics?.duplicatePathCount ?? 0,
            personaCoverage: serialisedGovernance.analytics?.personaCoverage ?? [],
            localeCoverage: serialisedGovernance.analytics?.localeCoverage ?? {},
            taxonomy: serialisedGovernance.taxonomy ?? {},
            metadata: serialisedGovernance.metadata ?? {},
            checksum: governanceChecksum,
            generatedBy: SEED_ACTOR,
            generatedAt: governanceNow,
            createdAt: governanceNow,
            updatedAt: governanceNow,
          },
        ],
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('design_system_releases', { releasedBy: SEED_ACTOR }, { transaction });
      await queryInterface.bulkDelete('navigation_governance_audits', { generatedBy: SEED_ACTOR }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
