import { jest } from '@jest/globals';

import {
  markHttpServerStarting,
  markHttpServerReady,
  markHttpServerClosing,
  markHttpServerStopped,
  markHttpServerError,
  markDependencyHealthy,
  markDependencyUnavailable,
  markDependencyDegraded,
  markDependencyDisabled,
  markWorkerHealthy,
  markWorkerFailed,
  getHealthState,
  getOverallStatus,
  buildHealthReport,
  resetRuntimeHealthState,
} from '../../src/lifecycle/runtimeHealth.js';

describe('runtimeHealth', () => {
  beforeEach(() => {
    resetRuntimeHealthState();
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('tracks http lifecycle transitions and reports ok when healthy', () => {
    markHttpServerStarting();
    expect(getOverallStatus()).toBe('starting');

    markHttpServerReady({ port: 4000 });
    markDependencyHealthy('database', { vendor: 'postgres' });
    markWorkerHealthy('profileEngagement', { intervalMs: 1000 });

    expect(getOverallStatus()).toBe('ok');
    const state = getHealthState();
    expect(state.http).toMatchObject({ status: 'ready', port: 4000 });
    expect(state.dependencies.database).toMatchObject({ status: 'ok', vendor: 'postgres' });
    expect(state.workers.profileEngagement).toMatchObject({ status: 'ok', intervalMs: 1000 });
  });

  it('escalates to degraded or error when subsystems fail', () => {
    markHttpServerReady({ port: 4000 });
    markDependencyHealthy('database');
    markWorkerHealthy('profileEngagement');

    expect(getOverallStatus()).toBe('ok');

    markDependencyDegraded('database', new Error('Replication lag'), { replicaLagMs: 3200 });
    expect(getOverallStatus()).toBe('degraded');

    markWorkerFailed('profileEngagement', new Error('Queue empty'));
    expect(getOverallStatus()).toBe('error');

    markDependencyUnavailable('queue', new Error('Redis down'), { region: 'iad' });
    const snapshot = getHealthState();
    expect(snapshot.dependencies.queue).toMatchObject({
      status: 'error',
      error: expect.objectContaining({ message: 'Redis down' }),
      region: 'iad',
    });
  });

  it('records http shutdown state and exposes build report clones', () => {
    markHttpServerReady({ port: 4000 });
    markHttpServerClosing({ reason: 'deploy' });
    expect(getOverallStatus()).toBe('degraded');

    markHttpServerError(new Error('Port conflict'), { port: 4100 });
    const report = buildHealthReport();

    expect(report.status).toBe('error');
    expect(report.http).toMatchObject({ status: 'error', port: 4100 });
    expect(report.http.error).toMatchObject({ message: 'Port conflict' });

    report.http.status = 'mutated';
    expect(getHealthState().http.status).not.toBe('mutated');

    markHttpServerStopped({ reason: 'deploy complete' });
    markDependencyDisabled('searchIndex', { reason: 'environment variables missing' });
    expect(getHealthState().http.status).toBe('stopped');
  });
});
