'use strict';

const APPS = [
  {
    displayName: 'Gigvora Executive Companion',
    slug: 'gigvora-executive-companion',
    platform: 'ios',
    status: 'active',
    releaseChannel: 'production',
    complianceStatus: 'ok',
    currentVersion: '3.2.0',
    latestBuildNumber: '320',
    minimumSupportedVersion: '2.8.0',
    storeUrl: 'https://apps.apple.com/app/gigvora-executive',
    supportEmail: 'mobile-ops@gigvora.com',
    supportUrl: 'https://support.gigvora.com/mobile',
    marketingUrl: 'https://gigvora.com/mobile/executive',
    iconUrl: 'https://cdn.gigvora.com/mobile/executive/icon.png',
    heroImageUrl: 'https://cdn.gigvora.com/mobile/executive/hero.png',
    rolloutNotes:
      'Executive governance toolkit shipping risk telemetry, leadership rituals, and compliance-readiness guardrails.',
    metadata: {
      owner: 'executive-office',
      releaseManager: 'sariah.adeleke',
      telemetryDashboards: ['governance-cockpit', 'transformation-briefings'],
    },
    versions: [
      {
        version: '3.2.0',
        buildNumber: '320',
        status: 'released',
        releaseType: 'minor',
        releaseChannel: 'production',
        rolloutPercentage: 100,
        downloadUrl: 'https://cdn.gigvora.com/mobile/ios/gigvora-executive-3.2.0.ipa',
        releaseNotes:
          'Adds executive ritual scheduling, compliance dossier exports, and refreshed presence telemetry widgets.',
        releaseNotesUrl: 'https://gigvora.com/releases/mobile/executive/3-2-0',
        checksum: 'sha256:9a0c21879f1f57d17a1d1206dcbf1f7f073f5fb481905e7ddf1e87ba86df65b9',
        minOsVersion: '16.0',
        sizeBytes: 154_329_600,
        scheduledAt: new Date('2025-02-28T08:00:00Z'),
        releasedAt: new Date('2025-03-01T09:00:00Z'),
        metadata: {
          jiraEpic: 'MOBILE-432',
          complianceTicket: 'GOV-2211',
          analyticsStream: 'exec-companion-production',
        },
      },
      {
        version: '3.3.0',
        buildNumber: '330',
        status: 'in_review',
        releaseType: 'minor',
        releaseChannel: 'beta',
        rolloutPercentage: 25,
        downloadUrl: 'https://cdn.gigvora.com/mobile/ios/gigvora-executive-3.3.0-beta.ipa',
        releaseNotes: 'Introduces AI risk guardrails with live mitigation workflows and audit snapshots.',
        releaseNotesUrl: 'https://gigvora.com/releases/mobile/executive/3-3-0-beta',
        checksum: 'sha256:44c7df32e7b230cdf6a76e8df7a2390f0d6930369ff4c5bbec1ec2d89877f945',
        minOsVersion: '16.0',
        sizeBytes: 158_760_960,
        scheduledAt: new Date('2025-04-20T08:00:00Z'),
        releasedAt: null,
        metadata: {
          jiraEpic: 'MOBILE-451',
          analyticsExperiment: 'exec-governance-rolling-2025Q2',
          pilotCohort: 'boardroom-steering-beta',
        },
      },
    ],
    features: [
      {
        key: 'executive-briefings',
        name: 'Executive Briefings',
        description: 'Synthesises board decisions, compliance checkpoints, and strategic bets in one digest.',
        enabled: true,
        rolloutType: 'global',
        rolloutPercentage: null,
        minAppVersion: '3.0.0',
        maxAppVersion: null,
        audienceRoles: ['executive', 'chief-of-staff'],
        metadata: {
          dashboard: 'governance-briefings',
          dataQuality: 'audited',
        },
      },
      {
        key: 'ai-risk-watch',
        name: 'AI Risk Watch',
        description: 'Monitors AI-driven recommendations with escalation routing and board escalations.',
        enabled: true,
        rolloutType: 'percentage',
        rolloutPercentage: 40,
        minAppVersion: '3.2.0',
        maxAppVersion: null,
        audienceRoles: ['executive', 'governance'],
        metadata: {
          experiment: 'ai-risk-fy25',
          owner: 'platform-risk',
        },
      },
      {
        key: 'advisor-cohort-insights',
        name: 'Advisor Cohort Insights',
        description: 'Streams mentoring cohort telemetry and retention signals for exec sponsors.',
        enabled: false,
        rolloutType: 'cohort',
        rolloutPercentage: null,
        minAppVersion: '3.1.0',
        maxAppVersion: null,
        audienceRoles: ['executive', 'advisor'],
        metadata: {
          pilotRegions: ['emea'],
          governanceStage: 'discovery',
        },
      },
    ],
  },
  {
    displayName: 'Gigvora Operations Companion',
    slug: 'gigvora-operations-companion',
    platform: 'android',
    status: 'active',
    releaseChannel: 'beta',
    complianceStatus: 'review',
    currentVersion: '2.7.1',
    latestBuildNumber: '271',
    minimumSupportedVersion: '2.4.0',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.gigvora.operations',
    supportEmail: 'ops-pm@gigvora.com',
    supportUrl: 'https://support.gigvora.com/mobile/ops',
    marketingUrl: 'https://gigvora.com/mobile/operations',
    iconUrl: 'https://cdn.gigvora.com/mobile/operations/icon.png',
    heroImageUrl: 'https://cdn.gigvora.com/mobile/operations/hero.png',
    rolloutNotes:
      'Operations Android companion aligning workforce staffing, incident response, and logistics telemetry.',
    metadata: {
      owner: 'operations',
      releaseManager: 'mateo.harlow',
      telemetryDashboards: ['ops-mission-control', 'readiness-benchmarks'],
    },
    versions: [
      {
        version: '2.7.1',
        buildNumber: '271',
        status: 'released',
        releaseType: 'patch',
        releaseChannel: 'beta',
        rolloutPercentage: 100,
        downloadUrl: 'https://cdn.gigvora.com/mobile/android/gigvora-operations-2.7.1.apk',
        releaseNotes: 'Delivers staffing surge alerts, mentorship logistics sync, and offline-ready dashboards.',
        releaseNotesUrl: 'https://gigvora.com/releases/mobile/operations/2-7-1',
        checksum: 'sha256:e34fb705a55cdb6fb4016899b5558bf2db8231426f2839ea4ebc1ac8cffd7171',
        minOsVersion: '11',
        sizeBytes: 132_404_224,
        scheduledAt: new Date('2025-01-15T11:00:00Z'),
        releasedAt: new Date('2025-01-17T10:30:00Z'),
        metadata: {
          jiraEpic: 'OPS-MOBILE-288',
          complianceTicket: 'OPS-GOV-882',
        },
      },
      {
        version: '2.8.0',
        buildNumber: '280',
        status: 'in_review',
        releaseType: 'minor',
        releaseChannel: 'production',
        rolloutPercentage: 10,
        downloadUrl: 'https://cdn.gigvora.com/mobile/android/gigvora-operations-2.8.0.apk',
        releaseNotes: 'Launches fulfilment pods, AI-driven shift forecasting, and refreshed compliance audits.',
        releaseNotesUrl: 'https://gigvora.com/releases/mobile/operations/2-8-0',
        checksum: 'sha256:50d54b266f699b4508d6f779e4e157fe63a6cc0a73f45d3d60f8ec2c7034f5bb',
        minOsVersion: '11',
        sizeBytes: 136_857_600,
        scheduledAt: new Date('2025-05-05T07:30:00Z'),
        releasedAt: null,
        metadata: {
          jiraEpic: 'OPS-MOBILE-305',
          pilotProgram: 'ops-beta-hubs-2025',
          analyticsStream: 'ops-companion-canary',
        },
      },
    ],
    features: [
      {
        key: 'mission-control-updates',
        name: 'Mission Control Updates',
        description: 'Pushes shift alerts, staffing escalations, and fulfilment SLAs for ops leads.',
        enabled: true,
        rolloutType: 'global',
        rolloutPercentage: null,
        minAppVersion: '2.6.0',
        maxAppVersion: null,
        audienceRoles: ['operations', 'logistics'],
        metadata: {
          feeds: ['logistics-incidents', 'staffing-surge'],
        },
      },
      {
        key: 'performance-cohort-benchmarks',
        name: 'Performance Cohort Benchmarks',
        description: 'Benchmarks pods, agencies, and fulfilment partners with transformation KPIs.',
        enabled: true,
        rolloutType: 'percentage',
        rolloutPercentage: 55,
        minAppVersion: '2.7.0',
        maxAppVersion: null,
        audienceRoles: ['operations', 'agency'],
        metadata: {
          owner: 'ops-analytics',
          cadence: 'weekly',
        },
      },
      {
        key: 'mentor-logistics-console',
        name: 'Mentor Logistics Console',
        description: 'Bridges mentorship scheduling with staffing dispatch and compliance guardrails.',
        enabled: false,
        rolloutType: 'cohort',
        rolloutPercentage: null,
        minAppVersion: '2.8.0',
        maxAppVersion: null,
        audienceRoles: ['operations', 'mentor'],
        metadata: {
          pilotRegions: ['north-america', 'latam'],
          roadmapTarget: '2025-Q3',
        },
      },
    ],
  },
];

function buildRolloutValue(feature) {
  if (feature.rolloutType === 'percentage' && feature.rolloutPercentage != null) {
    return { percentage: Number(feature.rolloutPercentage) };
  }
  if (feature.rolloutType === 'cohort') {
    const roles = Array.isArray(feature.audienceRoles)
      ? feature.audienceRoles.map((role) => `${role}`.trim().toLowerCase())
      : [];
    return { roles };
  }
  return null;
}

async function upsertMobileApp(queryInterface, transaction, app, now) {
  const existingId = await queryInterface.rawSelect(
    'mobile_apps',
    { where: { slug: app.slug }, transaction },
    ['id'],
  );

  const payload = {
    displayName: app.displayName,
    slug: app.slug,
    platform: app.platform,
    status: app.status,
    releaseChannel: app.releaseChannel,
    complianceStatus: app.complianceStatus,
    currentVersion: app.currentVersion,
    latestBuildNumber: app.latestBuildNumber,
    minimumSupportedVersion: app.minimumSupportedVersion,
    storeUrl: app.storeUrl,
    supportEmail: app.supportEmail,
    supportUrl: app.supportUrl,
    marketingUrl: app.marketingUrl,
    iconUrl: app.iconUrl,
    heroImageUrl: app.heroImageUrl,
    rolloutNotes: app.rolloutNotes,
    metadata: app.metadata,
    updatedAt: now,
  };

  if (existingId) {
    await queryInterface.bulkUpdate('mobile_apps', payload, { id: existingId }, { transaction });
    return existingId;
  }

  const inserted = await queryInterface.bulkInsert(
    'mobile_apps',
    [
      {
        ...payload,
        createdAt: now,
      },
    ],
    { transaction, returning: ['id'] },
  );

  if (Array.isArray(inserted) && inserted.length > 0) {
    return inserted[0].id ?? inserted[0];
  }

  return queryInterface.rawSelect('mobile_apps', { where: { slug: app.slug }, transaction }, ['id']);
}

async function upsertMobileAppVersions(queryInterface, transaction, appId, versions, now) {
  if (!Array.isArray(versions)) {
    return;
  }

  for (const version of versions) {
    const existingId = await queryInterface.rawSelect(
      'mobile_app_versions',
      { where: { appId, version: version.version }, transaction },
      ['id'],
    );

    const payload = {
      appId,
      version: version.version,
      buildNumber: version.buildNumber,
      status: version.status,
      releaseType: version.releaseType,
      releaseChannel: version.releaseChannel,
      rolloutPercentage: version.rolloutPercentage,
      downloadUrl: version.downloadUrl,
      releaseNotes: version.releaseNotes,
      releaseNotesUrl: version.releaseNotesUrl,
      checksum: version.checksum,
      minOsVersion: version.minOsVersion,
      sizeBytes: version.sizeBytes,
      scheduledAt: version.scheduledAt,
      releasedAt: version.releasedAt,
      metadata: version.metadata,
      updatedAt: now,
    };

    if (existingId) {
      await queryInterface.bulkUpdate('mobile_app_versions', payload, { id: existingId }, { transaction });
    } else {
      await queryInterface.bulkInsert(
        'mobile_app_versions',
        [
          {
            ...payload,
            createdAt: now,
          },
        ],
        { transaction },
      );
    }
  }
}

async function upsertMobileAppFeatures(queryInterface, transaction, appId, features, now) {
  if (!Array.isArray(features)) {
    return;
  }

  for (const feature of features) {
    const existingId = await queryInterface.rawSelect(
      'mobile_app_features',
      { where: { appId, key: feature.key }, transaction },
      ['id'],
    );

    const audienceRoles = Array.isArray(feature.audienceRoles)
      ? feature.audienceRoles
      : `${feature.audienceRoles ?? ''}`
          .split(',')
          .map((role) => role.trim())
          .filter(Boolean);

    const payload = {
      appId,
      key: feature.key,
      name: feature.name,
      description: feature.description,
      enabled: feature.enabled,
      rolloutType: feature.rolloutType,
      rolloutValue: buildRolloutValue(feature),
      minAppVersion: feature.minAppVersion,
      maxAppVersion: feature.maxAppVersion,
      audienceRoles,
      metadata: feature.metadata,
      updatedAt: now,
    };

    if (existingId) {
      await queryInterface.bulkUpdate('mobile_app_features', payload, { id: existingId }, { transaction });
    } else {
      await queryInterface.bulkInsert(
        'mobile_app_features',
        [
          {
            ...payload,
            createdAt: now,
          },
        ],
        { transaction },
      );
    }
  }
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();

      for (const app of APPS) {
        const appId = await upsertMobileApp(queryInterface, transaction, app, now);
        if (!appId) {
          // eslint-disable-next-line no-continue
          continue;
        }
        await upsertMobileAppVersions(queryInterface, transaction, appId, app.versions, now);
        await upsertMobileAppFeatures(queryInterface, transaction, appId, app.features, now);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const app of APPS) {
        const appId = await queryInterface.rawSelect(
          'mobile_apps',
          { where: { slug: app.slug }, transaction },
          ['id'],
        );

        if (!appId) {
          // eslint-disable-next-line no-continue
          continue;
        }

        await queryInterface.bulkDelete('mobile_app_features', { appId }, { transaction });
        await queryInterface.bulkDelete('mobile_app_versions', { appId }, { transaction });
        await queryInterface.bulkDelete('mobile_apps', { id: appId }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
