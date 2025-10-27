const releaseEngineeringDataset = Object.freeze({
  pipelines: [
    {
      id: 'frontend-quality-gate',
      label: 'Frontend quality gate',
      description:
        'Runs eslint, vitest, and Vite build to guard the React shell before deploys leave the pipeline.',
      status: 'passing',
      coverage: 0.94,
      lastRun: '2025-04-07T08:45:00.000Z',
      durationMs: 486_532,
      owner: 'web-platform',
      coverageTargets: { statements: 0.9, lines: 0.9 },
      blockers: [],
      documentation: [
        {
          title: 'Frontend CI playbook',
          url: 'https://gigvora.notion.site/frontend-ci-governance',
        },
      ],
      commands: [
        {
          display: 'npm run lint',
          command: 'npm',
          args: ['run', 'lint'],
          cwd: 'gigvora-frontend-reactjs',
        },
        {
          display: 'npm run test -- --run',
          command: 'npm',
          args: ['run', 'test', '--', '--run'],
          cwd: 'gigvora-frontend-reactjs',
        },
        {
          display: 'npm run build',
          command: 'npm',
          args: ['run', 'build'],
          cwd: 'gigvora-frontend-reactjs',
        },
      ],
      telemetry: {
        testCount: 162,
        flakyTests: 0,
        bundleSizeKb: 812,
      },
    },
    {
      id: 'backend-governance',
      label: 'Backend governance',
      description: 'Executes eslint, jest, and migration verification for the Express API.',
      status: 'passing',
      coverage: 0.91,
      lastRun: '2025-04-07T08:32:00.000Z',
      durationMs: 612_204,
      owner: 'platform-ops',
      coverageTargets: { statements: 0.88, lines: 0.88 },
      blockers: ['Regenerate domain clients when contracts change'],
      documentation: [
        {
          title: 'API deployment checklist',
          url: 'https://gigvora.notion.site/api-deployment-checklist',
        },
      ],
      commands: [
        {
          display: 'npm run lint',
          command: 'npm',
          args: ['run', 'lint'],
          cwd: 'gigvora-backend-nodejs',
        },
        {
          display: 'npm run test',
          command: 'npm',
          args: ['run', 'test'],
          cwd: 'gigvora-backend-nodejs',
        },
        {
          display: 'npm run db:migrate -- --check',
          command: 'node',
          args: ['scripts/runMigrations.js', 'status'],
          cwd: 'gigvora-backend-nodejs',
        },
      ],
      telemetry: {
        testCount: 418,
        flakyTests: 1,
        migrationLag: 0,
      },
    },
    {
      id: 'mobile-sanity',
      label: 'Flutter smoke suite',
      description: 'Runs melos orchestration to build and test the Flutter client smoke flows.',
      status: 'attention',
      coverage: 0.81,
      lastRun: '2025-04-07T07:58:00.000Z',
      durationMs: 734_112,
      owner: 'mobile-eng',
      coverageTargets: { statements: 0.85, lines: 0.85 },
      blockers: ['Stabilise flaky deep-link navigation test'],
      documentation: [
        {
          title: 'Mobile beta launch runbook',
          url: 'https://gigvora.notion.site/mobile-beta-runbook',
        },
      ],
      commands: [
        {
          display: 'melos run ci:verify',
          command: 'melos',
          args: ['run', 'ci:verify'],
          cwd: 'gigvora-flutter-phoneapp',
          optional: true,
        },
      ],
      telemetry: {
        flakyTests: 2,
        deviceMatrix: ['ios-16-sim', 'android-14-emulator'],
      },
    },
  ],
  tooling: {
    orchestratorScript: 'scripts/pipelines/run_release_engineering_pipeline.mjs',
    releaseDigestScript: 'scripts/release-notes/buildReleaseDigest.mjs',
    artifactPath: 'update_docs/release_notes/pipeline-latest.json',
    dashboards: [
      {
        name: 'CI throughput',
        url: 'https://grafana.gigvora.com/d/ci-throughput/ci-overview',
      },
      {
        name: 'Error budget',
        url: 'https://grafana.gigvora.com/d/error-budget/platform-budget',
      },
    ],
  },
  releaseNotes: [
    {
      version: '2025.04.0',
      codename: 'Atlas Lift',
      releasedAt: '2025-04-05T09:30:00.000Z',
      summary:
        'Ships networking analytics overhaul, concierge release engineering board, and federated release digest automation.',
      highlights: [
        'Networking analytics tiles now expose SLA urgency and relationship health in real time.',
        'Concierge command centre gains release engineering dashboard with rollouts, build health, and change ledger.',
        'Automated release digest script publishes enablement notes to update_docs and trust centre feeds.',
      ],
      qaApprovals: [
        { team: 'QA', approver: 'Iris Quinn', signedOffAt: '2025-04-04T17:25:00.000Z' },
        { team: 'Compliance', approver: 'Miguel Harper', signedOffAt: '2025-04-04T18:02:00.000Z' },
      ],
      communications: [
        { channel: 'status-page', publishedAt: '2025-04-05T09:35:00.000Z' },
        { channel: 'trust-centre', publishedAt: '2025-04-05T09:36:00.000Z' },
        { channel: 'in-app-banner', publishedAt: '2025-04-05T09:45:00.000Z' },
      ],
      changeVolume: { stories: 46, migrations: 3, toggles: 6 },
      riskRegister: [
        {
          id: 'ops-rollback-readiness',
          severity: 'medium',
          mitigation: 'Maintain warm standby for networking analytics service.',
        },
      ],
    },
    {
      version: '2025.03.2',
      codename: 'Harbor Pulse',
      releasedAt: '2025-03-18T11:10:00.000Z',
      summary: 'Patch release addressing messaging composer autosave and API rate-limit visibility.',
      highlights: [
        'Composer autosave cadence tuned to 20s with offline recovery.',
        'Runtime telemetry adds alerting for API burst behaviour.',
      ],
      qaApprovals: [
        { team: 'QA', approver: 'Iris Quinn', signedOffAt: '2025-03-18T09:50:00.000Z' },
      ],
      communications: [
        { channel: 'release-notes', publishedAt: '2025-03-18T11:25:00.000Z' },
      ],
      changeVolume: { stories: 18, migrations: 0, toggles: 2 },
      riskRegister: [],
    },
  ],
  upgradeCohorts: [
    {
      name: 'Mentor guild beta',
      featureFlag: 'release_engineering_suite',
      stage: 'pilot',
      rolloutStart: '2025-04-01T08:00:00.000Z',
      targetDecision: '2025-04-15T17:00:00.000Z',
      adoptionRate: 0.68,
      healthScore: 0.83,
      telemetry: {
        engagementLift: 0.12,
        npsDelta: 0.4,
        weeklyActive: 1125,
      },
      guardrails: {
        crashFreeSessions: 0.997,
        errorBudgetRemaining: 0.84,
      },
      blockers: [
        'Awaiting analytics verification for mentor-led release scheduling.',
      ],
      nextCheckpoint: '2025-04-09T16:00:00.000Z',
      owner: 'platform-ops',
      notes:
        'Mentor guild reporting high satisfaction; finalise analytics gating before regional expansion.',
    },
    {
      name: 'Enterprise agencies',
      featureFlag: 'networking_analytics_ga',
      stage: 'staged-rollout',
      rolloutStart: '2025-03-22T10:00:00.000Z',
      targetDecision: '2025-04-10T12:00:00.000Z',
      adoptionRate: 0.54,
      healthScore: 0.78,
      telemetry: {
        engagementLift: 0.17,
        npsDelta: 0.35,
        weeklyActive: 864,
      },
      guardrails: {
        crashFreeSessions: 0.992,
        errorBudgetRemaining: 0.71,
      },
      blockers: ['Expand support docs for APAC agencies'],
      nextCheckpoint: '2025-04-08T14:00:00.000Z',
      owner: 'networking-product',
      notes:
        'Rollout paused overnight for translation QA; resume once localisation sign-off completes.',
    },
    {
      name: 'Global availability',
      featureFlag: 'concierge_release_dashboard',
      stage: 'ga-ready',
      rolloutStart: '2025-03-10T09:00:00.000Z',
      targetDecision: '2025-04-07T19:00:00.000Z',
      adoptionRate: 0.92,
      healthScore: 0.91,
      telemetry: {
        engagementLift: 0.23,
        npsDelta: 0.52,
        weeklyActive: 5210,
      },
      guardrails: {
        crashFreeSessions: 0.998,
        errorBudgetRemaining: 0.9,
      },
      blockers: [],
      nextCheckpoint: '2025-04-07T17:30:00.000Z',
      owner: 'support-ops',
      notes:
        'All guardrails green; awaiting exec go-live approval after governance review.',
    },
  ],
});

export default releaseEngineeringDataset;
