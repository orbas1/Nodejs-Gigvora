'use strict';

const RELEASE_TABLE = 'enterprise_release_tracks';
const INITIATIVE_TABLE = 'executive_alignment_initiatives';

const RELEASE_ROWS = [
  {
    platform_key: 'web_command_center',
    platform_name: 'Web Command Center',
    channel: 'stable',
    current_version: '2024.09.1',
    parity_score: 98.6,
    mobile_readiness: 97.2,
    release_velocity_weeks: 2.5,
    last_release_at: new Date('2024-03-28T09:00:00Z'),
    next_release_window: new Date('2024-04-11T09:00:00Z'),
    status: 'stable',
    blockers: [],
    notes: 'Web release cadence maintains two-week trains aligned to enterprise sign-off windows.',
  },
  {
    platform_key: 'ios_companion',
    platform_name: 'iOS Companion',
    channel: 'rolling',
    current_version: '2.14.0',
    parity_score: 94.1,
    mobile_readiness: 95.4,
    release_velocity_weeks: 3.0,
    last_release_at: new Date('2024-03-22T15:00:00Z'),
    next_release_window: new Date('2024-04-08T15:00:00Z'),
    status: 'rolling',
    blockers: [
      {
        code: 'app_store_review',
        severity: 'medium',
        summary: 'Awaiting app store privacy nutrition label confirmation for concierge messaging.',
        owner: 'mobile-platform',
      },
    ],
    notes: 'Mobile release tracks share component libraries with Flutter for feature parity.',
  },
  {
    platform_key: 'android_companion',
    platform_name: 'Android Companion',
    channel: 'rolling',
    current_version: '2.13.2',
    parity_score: 91.8,
    mobile_readiness: 92.6,
    release_velocity_weeks: 3.0,
    last_release_at: new Date('2024-03-25T18:00:00Z'),
    next_release_window: new Date('2024-04-12T18:00:00Z'),
    status: 'delayed',
    blockers: [
      {
        code: 'play_store_compliance',
        severity: 'high',
        summary: 'Play Store compliance requested clarification on encrypted credential storage.',
        owner: 'security-governance',
      },
      {
        code: 'push_messaging',
        severity: 'medium',
        summary: 'Firebase messaging SDK upgrade requires coordinated rollout with operations.',
        owner: 'mobile-platform',
      },
    ],
    notes: 'Android build reuses navigation schema contracts exported from the web router.',
  },
  {
    platform_key: 'executive_tablet',
    platform_name: 'Executive Tablet Shell',
    channel: 'pilot',
    current_version: '2024.04.0-beta',
    parity_score: 88.3,
    mobile_readiness: 90.5,
    release_velocity_weeks: 4.0,
    last_release_at: new Date('2024-03-18T12:00:00Z'),
    next_release_window: new Date('2024-04-22T12:00:00Z'),
    status: 'blocked',
    blockers: [
      {
        code: 'governance_sign_off',
        severity: 'high',
        summary: 'Executive steering committee requested additional resilience drills before graduating pilot.',
        owner: 'enterprise-pmo',
      },
    ],
    notes: 'Tablet experience consumes the same Enterprise 360 snapshot contract as the admin web shell.',
  },
];

const INITIATIVE_ROWS = [
  {
    initiative_key: 'enterprise-360-rollout',
    title: 'Enterprise 360 Snapshot Rollout',
    executive_owner: 'Amelia Santos',
    sponsor_team: 'Platform PMO',
    status: 'on_track',
    progress_percent: 72.5,
    risk_level: 'medium',
    next_milestone_at: new Date('2024-04-18T16:00:00Z'),
    last_review_at: new Date('2024-03-21T16:00:00Z'),
    governance_cadence: 'Bi-weekly steering committee',
    outcome_metric: 'Parity score > 95 across all surfaces',
    narrative:
      'Deploy unified Enterprise 360 telemetry panels across web, Flutter, and analytics exports with shared contracts.',
    notes: 'Final analytics QA pending; training materials drafted for success managers.',
  },
  {
    initiative_key: 'mobile-governance-harmonisation',
    title: 'Mobile Governance Harmonisation',
    executive_owner: 'DeAndre Cole',
    sponsor_team: 'Security & Compliance',
    status: 'at_risk',
    progress_percent: 46.0,
    risk_level: 'high',
    next_milestone_at: new Date('2024-04-10T14:00:00Z'),
    last_review_at: new Date('2024-03-27T14:00:00Z'),
    governance_cadence: 'Weekly tiger team sync',
    outcome_metric: 'Zero critical audit findings for mobile releases',
    narrative:
      'Align app store submissions, consent flows, and mobile analytics instrumentation with enterprise governance policies.',
    notes: 'Pending legal review of updated consent copy and renewed SOC2 evidence for mobile SDKs.',
  },
  {
    initiative_key: 'executive-briefing-refresh',
    title: 'Executive Briefing Refresh',
    executive_owner: 'Priya Narayanan',
    sponsor_team: 'Customer Success',
    status: 'planning',
    progress_percent: 18.0,
    risk_level: 'low',
    next_milestone_at: new Date('2024-05-02T17:00:00Z'),
    last_review_at: new Date('2024-03-15T17:00:00Z'),
    governance_cadence: 'Monthly exec readout',
    outcome_metric: 'Adoption of Enterprise 360 story in 100% of Q2 enterprise renewals',
    narrative:
      'Craft refreshed executive briefing assets leveraging cross-platform readiness dashboards and governance metrics.',
    notes: 'Story outline completed; awaiting input from marketing on hero narrative and data viz.',
  },
];

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const now = new Date();

      const [existingReleases] = await queryInterface.sequelize.query(
        `SELECT platform_key FROM ${RELEASE_TABLE}`,
        { transaction },
      );
      const existingReleaseKeys = new Set(
        (existingReleases || []).map((row) => `${row.platform_key}`.toLowerCase()),
      );

      const releasesToInsert = RELEASE_ROWS.filter(
        (row) => !existingReleaseKeys.has(row.platform_key.toLowerCase()),
      ).map((row) => ({
        ...row,
        created_at: now,
        updated_at: now,
      }));

      if (releasesToInsert.length) {
        await queryInterface.bulkInsert(RELEASE_TABLE, releasesToInsert, { transaction });
      }

      const [existingInitiatives] = await queryInterface.sequelize.query(
        `SELECT initiative_key FROM ${INITIATIVE_TABLE}`,
        { transaction },
      );
      const existingInitiativeKeys = new Set(
        (existingInitiatives || []).map((row) => `${row.initiative_key}`.toLowerCase()),
      );

      const initiativesToInsert = INITIATIVE_ROWS.filter(
        (row) => !existingInitiativeKeys.has(row.initiative_key.toLowerCase()),
      ).map((row) => ({
        ...row,
        created_at: now,
        updated_at: now,
      }));

      if (initiativesToInsert.length) {
        await queryInterface.bulkInsert(INITIATIVE_TABLE, initiativesToInsert, { transaction });
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
      const releaseKeys = RELEASE_ROWS.map((row) => row.platform_key);
      const initiativeKeys = INITIATIVE_ROWS.map((row) => row.initiative_key);

      await queryInterface.bulkDelete(
        RELEASE_TABLE,
        { platform_key: releaseKeys },
        { transaction },
      );

      await queryInterface.bulkDelete(
        INITIATIVE_TABLE,
        { initiative_key: initiativeKeys },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
