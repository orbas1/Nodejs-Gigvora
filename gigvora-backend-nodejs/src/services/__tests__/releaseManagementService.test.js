import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  getReleaseRolloutSnapshot,
  markChecklistItemStatus,
  markReleasePhaseStatus,
  recordMonitorSample,
  resetReleaseStateCache,
  upsertActiveRelease,
} from '../releaseManagementService.js';

const BASE_STATE = {
  activeRelease: {
    id: '2025.04-platform-elevation',
    name: 'Platform Elevation',
    version: '2025.04',
    owner: 'ops@gigvora.com',
    phase: 'canary',
    startedAt: '2025-04-15T09:00:00.000Z',
    targetCompletion: '2025-04-25T18:00:00.000Z',
    phases: [
      { key: 'plan', name: 'Planning', status: 'complete', completedAt: '2025-04-10T12:00:00.000Z', coverage: 100 },
      { key: 'enablement', name: 'Enablement', status: 'complete', completedAt: '2025-04-12T18:00:00.000Z', coverage: 100 },
      { key: 'canary', name: 'Canary Cohort', status: 'in_progress', coverage: 35 },
      { key: 'global', name: 'Global Rollout', status: 'pending', coverage: 0 },
    ],
    segments: [
      { key: 'operations', name: 'Operations Staff', status: 'complete', coverage: 100 },
      { key: 'enterprise', name: 'Enterprise Customers', status: 'in_progress', coverage: 45 },
      { key: 'freelancer', name: 'Freelancer Network', status: 'pending', coverage: 15 },
    ],
    checklist: [
      { key: 'ux-approvals', name: 'UX approvals', status: 'complete', completedAt: '2025-04-13T14:00:00.000Z' },
      { key: 'ci-signed-off', name: 'CI signed off', status: 'pending' },
    ],
  },
  monitors: {
    'api-latency': {
      id: 'api-latency',
      name: 'API latency',
      status: 'passing',
      environment: 'production',
      metrics: { p95Ms: 280 },
      lastSampleAt: '2025-04-16T08:00:00.000Z',
    },
  },
  events: [],
  updatedAt: '2025-04-16T08:00:00.000Z',
};

async function readStateFile(path) {
  const contents = await readFile(path, 'utf8');
  return JSON.parse(contents);
}

describe('releaseManagementService', () => {
  let tempDir;
  let statePath;
  const originalEnv = process.env.GIGVORA_RELEASE_STATE_PATH;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'release-service-'));
    statePath = join(tempDir, 'active-release.json');
    process.env.GIGVORA_RELEASE_STATE_PATH = statePath;
  });

  beforeEach(async () => {
    await writeFile(statePath, `${JSON.stringify(BASE_STATE, null, 2)}\n`);
    resetReleaseStateCache();
  });

  afterEach(() => {
    resetReleaseStateCache();
  });

  afterAll(async () => {
    process.env.GIGVORA_RELEASE_STATE_PATH = originalEnv;
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns rollout snapshot with derived phase and checklist summary', async () => {
    const snapshot = await getReleaseRolloutSnapshot();
    expect(snapshot.active).toBe(true);
    expect(snapshot.release.phase).toBe('canary');
    expect(snapshot.release.phases).toHaveLength(4);
    expect(snapshot.checklist.total).toBe(2);
    expect(snapshot.checklist.completed).toBe(1);
    expect(snapshot.monitors).toHaveLength(1);
  });

  it('updates phase status and persists changes', async () => {
    const phase = await markReleasePhaseStatus('canary', 'complete', { coverage: 80, summary: 'Graduated canary cohorts.' });
    expect(phase.status).toBe('complete');
    expect(phase.coverage).toBe(80);
    const fileContents = await readStateFile(statePath);
    const storedPhase = fileContents.activeRelease.phases.find((entry) => entry.key === 'canary');
    expect(storedPhase.status).toBe('complete');
    expect(storedPhase.summary).toBe('Graduated canary cohorts.');
  });

  it('records monitor samples and appends events', async () => {
    const sample = await recordMonitorSample('ci-frontend-lint', {
      name: 'CI frontend lint',
      status: 'passing',
      environment: 'ci',
      metrics: { durationMs: 32000 },
    });

    expect(sample.status).toBe('passing');
    const persisted = await readStateFile(statePath);
    expect(persisted.monitors['ci-frontend-lint'].metrics.durationMs).toBe(32000);
    expect(persisted.events[persisted.events.length - 1].type).toBe('monitor_sample');
  });

  it('marks checklist items complete and stores completion timestamp', async () => {
    const item = await markChecklistItemStatus('ci-signed-off', 'complete', { summary: 'All CI tasks passed.' });
    expect(item.status).toBe('complete');
    expect(item.completedAt).toBeDefined();
    const persisted = await readStateFile(statePath);
    const storedItem = persisted.activeRelease.checklist.find((entry) => entry.key === 'ci-signed-off');
    expect(storedItem.status).toBe('complete');
    expect(storedItem.completedAt).toBeDefined();
  });

  it('upserts release metadata when onboarding a new plan', async () => {
    await upsertActiveRelease({
      id: '2025.05-global-story',
      name: 'Global Storytelling',
      version: '2025.05',
      phases: [
        { key: 'plan', name: 'Planning', status: 'in_progress' },
        { key: 'launch', name: 'Launch', status: 'pending' },
      ],
      segments: [
        { key: 'alpha', name: 'Alpha cohort', status: 'pending', coverage: 5 },
      ],
      checklist: [{ key: 'kickoff', name: 'Kickoff runbook', status: 'pending' }],
    });

    const snapshot = await getReleaseRolloutSnapshot();
    expect(snapshot.release.id).toBe('2025.05-global-story');
    expect(snapshot.release.phases[0].status).toBe('in_progress');
    expect(snapshot.release.segments).toHaveLength(1);
    expect(snapshot.checklist.total).toBe(1);
  });
});
