import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  refreshRolloutDataset,
  loadRollouts,
  getRolloutByVersion,
  getActiveRollouts,
  summariseRollout,
  getRolloutDashboard,
} from '../../src/services/releaseMonitoringService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(__dirname, '..', '..', 'src', 'data', 'release-rollouts.json');

const baseRollout = {
  version: '2025.04.15',
  status: 'monitoring',
  generatedAt: '2025-04-15T10:00:00.000Z',
  pipeline: {
    id: 'web-release',
    name: 'Web Release Pipeline',
    status: 'passed',
    finishedAt: '2025-04-15T10:10:00.000Z',
    durationMs: 600000,
    steps: [
      { id: 'frontend-quality', name: 'Frontend quality gates', status: 'passed', durationMs: 120000 },
      { id: 'backend-quality', name: 'Backend quality gates', status: 'passed', durationMs: 180000 },
    ],
  },
  quality: {
    status: 'pass',
    gates: [
      { name: 'Frontend quality', status: 'pass', evidence: 'npm run check' },
      { name: 'Backend reliability', status: 'pass', evidence: 'npm run test' },
    ],
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
      currentPercentage: 0.18,
      errorBudgetRemaining: 0.97,
      health: 'healthy',
      notes: ['Monitors mentorship activation funnels and release sentiment.'],
    },
  ],
  telemetry: {
    errorBudgetRemaining: 0.96,
    p0Incidents: 0,
    latencyP99Ms: 140,
    regressionAlerts: [],
  },
  releaseNotesPath: 'update_docs/release-notes/2025.04.15.md',
};

const writeDataset = async (rollouts) => {
  await writeFile(datasetPath, `${JSON.stringify({ rollouts }, null, 2)}\n`);
  refreshRolloutDataset();
};

beforeEach(async () => {
  await writeDataset([baseRollout]);
});

afterAll(async () => {
  await writeDataset([baseRollout]);
});

describe('releaseMonitoringService', () => {
  test('loadRollouts returns enriched cohorts and progress analytics', async () => {
    const rollouts = await loadRollouts();
    expect(rollouts).toHaveLength(1);
    const [rollout] = rollouts;
    expect(rollout.progress.completionRatio).toBeGreaterThan(0.17);
    expect(rollout.cohorts[0].analytics).toMatchObject({
      adoptionStatus: 'complete',
      budgetStatus: 'healthy',
    });
    expect(rollout.alerts).toHaveLength(0);
  });

  test('getRolloutByVersion returns enriched record', async () => {
    const rollout = await getRolloutByVersion('2025.04.15');
    expect(rollout).not.toBeNull();
    expect(rollout.version).toBe('2025.04.15');
    expect(rollout.progress.adoption).toBeGreaterThan(0.17);
  });

  test('getActiveRollouts filters monitoring and hold statuses', async () => {
    const rollouts = await getActiveRollouts();
    expect(rollouts.map((rollout) => rollout.status)).toEqual(['monitoring']);
    await writeDataset([
      { ...baseRollout, version: '2025.04.16', status: 'hold' },
      { ...baseRollout, version: '2025.04.17', status: 'blocked' },
    ]);
    const updated = await getActiveRollouts();
    expect(updated.map((rollout) => rollout.status)).toEqual(['hold']);
  });

  test('summariseRollout surfaces next milestone and alerts', async () => {
    const rollout = await getRolloutByVersion('2025.04.15');
    const summary = summariseRollout(rollout);
    expect(summary).toMatchObject({
      version: '2025.04.15',
      status: 'monitoring',
      nextMilestone: 'Mentor beta',
    });
  });

  test('getRolloutDashboard highlights guardrail breaches', async () => {
    const degradedRollout = {
      ...baseRollout,
      version: '2025.04.18',
      status: 'blocked',
      telemetry: {
        errorBudgetRemaining: 0.8,
        p0Incidents: 1,
        latencyP99Ms: 210,
        regressionAlerts: ['Pause rollout'],
      },
    };
    await writeDataset([degradedRollout]);
    const dashboard = await getRolloutDashboard();
    expect(dashboard).toHaveLength(1);
    expect(dashboard[0].alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'errorBudget' }),
        expect.objectContaining({ type: 'incident' }),
        expect.objectContaining({ type: 'status' }),
      ]),
    );
    expect(dashboard[0].qualityStatus).toBe('pass');
  });
});
