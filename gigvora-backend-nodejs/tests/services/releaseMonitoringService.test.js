import {
  persistRolloutSnapshot,
  refreshRolloutDataset,
  loadRollouts,
  getRolloutByVersion,
  getActiveRollouts,
  summariseRollout,
  getRolloutDashboard,
} from '../../src/services/releaseMonitoringService.js';

const baseSnapshot = {
  version: '2025.04.15',
  status: 'monitoring',
  generatedAt: '2025-04-15T10:05:00.000Z',
  pipeline: {
    id: 'web-release',
    name: 'Web Release Pipeline',
    status: 'passed',
    finishedAt: '2025-04-15T10:05:00.000Z',
    durationMs: 699000,
    steps: [
      {
        id: 'frontend-quality',
        name: 'Frontend quality gates',
        status: 'passed',
        durationMs: 315000,
        commands: [
          {
            id: 'frontend-lint',
            label: 'npm run lint',
            command: 'npm run lint',
            workingDirectory: 'gigvora-frontend-reactjs',
            status: 'passed',
            durationMs: 64000,
          },
        ],
      },
      {
        id: 'backend-quality',
        name: 'Backend quality gates',
        status: 'passed',
        durationMs: 246000,
        commands: [
          {
            id: 'backend-test',
            label: 'npm test -- --runInBand',
            command: 'npm test -- --runInBand',
            workingDirectory: 'gigvora-backend-nodejs',
            status: 'passed',
            durationMs: 194000,
          },
        ],
      },
    ],
  },
  quality: {
    status: 'pass',
    gates: [
      { name: 'Frontend quality', status: 'pass', evidence: 'lint, unit, and build pipelines cleared for premium shell' },
      { name: 'Backend reliability', status: 'pass', evidence: 'lint + Jest suite across services' },
    ],
  },
  telemetry: {
    errorBudgetRemaining: 0.96,
    p0Incidents: 0,
    latencyP99Ms: 138,
    regressionAlerts: [],
  },
  cohorts: [
    {
      name: 'Internal champions',
      targetPercentage: 0.05,
      currentPercentage: 0.05,
      errorBudgetRemaining: 0.99,
      health: 'healthy',
      notes: ['Feature toggled for platform leads and reliability guild.'],
    },
    {
      name: 'Mentor beta',
      targetPercentage: 0.25,
      currentPercentage: 0.21,
      errorBudgetRemaining: 0.97,
      health: 'healthy',
      notes: ['Monitoring mentorship activation funnels and release sentiment.'],
    },
  ],
};

const degradeSnapshot = {
  ...baseSnapshot,
  version: '2025.04.16',
  status: 'blocked',
  telemetry: {
    errorBudgetRemaining: 0.72,
    p0Incidents: 2,
    latencyP99Ms: 228,
    regressionAlerts: ['Pause rollout until availability stabilises.'],
  },
  cohorts: baseSnapshot.cohorts.map((cohort) => ({
    ...cohort,
    health: 'blocked',
    currentPercentage: cohort.currentPercentage * 0.4,
    errorBudgetRemaining: 0.62,
  })),
};

beforeEach(async () => {
  refreshRolloutDataset();
  await persistRolloutSnapshot(baseSnapshot);
});

describe('releaseMonitoringService', () => {
  test('persistRolloutSnapshot stores snapshot and returns enriched rollout', async () => {
    const saved = await persistRolloutSnapshot({
      ...baseSnapshot,
      version: '2025.04.17',
      status: 'hold',
      telemetry: { ...baseSnapshot.telemetry, errorBudgetRemaining: 0.9 },
    });

    expect(saved.version).toBe('2025.04.17');
    expect(saved.cohorts[0].analytics).toMatchObject({ adoptionStatus: 'complete' });
    expect(saved.quality.gates).toHaveLength(2);
    expect(saved.pipeline.steps[0].commands[0].command).toBe('npm run lint');
  });

  test('loadRollouts returns enriched cohorts and progress analytics', async () => {
    const rollouts = await loadRollouts();
    expect(rollouts).toHaveLength(1);
    const [rollout] = rollouts;
    expect(rollout.progress.completionRatio).toBeGreaterThan(0.2);
    expect(rollout.cohorts[0].analytics).toMatchObject({
      adoptionStatus: 'complete',
      budgetStatus: 'healthy',
    });
    expect(rollout.alerts).toHaveLength(0);
  });

  test('getRolloutByVersion returns enriched record', async () => {
    const rollout = await getRolloutByVersion('2025.04.15');
    expect(rollout).not.toBeNull();
    expect(rollout?.pipeline.steps).toHaveLength(2);
    expect(rollout?.progress.adoption).toBeGreaterThan(0.2);
  });

  test('getActiveRollouts filters monitoring and hold statuses', async () => {
    await persistRolloutSnapshot({ ...baseSnapshot, version: '2025.04.18', status: 'hold' });
    const rollouts = await getActiveRollouts();
    expect(rollouts.map((rollout) => rollout.status).sort()).toEqual(['hold', 'monitoring']);
  });

  test('summariseRollout surfaces next milestone and quality status', async () => {
    const rollout = await getRolloutByVersion('2025.04.15');
    const summary = summariseRollout(rollout);
    expect(summary).toMatchObject({
      version: '2025.04.15',
      status: 'monitoring',
      qualityStatus: 'pass',
      nextMilestone: 'Mentor beta',
    });
  });

  test('getRolloutDashboard highlights guardrail breaches and alerts', async () => {
    await persistRolloutSnapshot(degradeSnapshot);
    const dashboard = await getRolloutDashboard();
    expect(dashboard).toHaveLength(2);
    const blocked = dashboard.find((item) => item.version === degradeSnapshot.version);
    expect(blocked?.alerts ?? []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'errorBudget' }),
        expect.objectContaining({ type: 'incident' }),
        expect.objectContaining({ type: 'latency' }),
        expect.objectContaining({ type: 'regression' }),
        expect.objectContaining({ type: 'status' }),
      ]),
    );
    expect(blocked?.qualityStatus).toBe('pass');
  });
});
