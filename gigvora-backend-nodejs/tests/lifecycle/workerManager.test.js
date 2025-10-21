import { jest } from '@jest/globals';

const workerManagerModuleUrl = new URL('../../src/lifecycle/workerManager.js', import.meta.url);
const runtimeConfigModuleUrl = new URL('../../src/config/runtimeConfig.js', import.meta.url);
const runtimeHealthModuleUrl = new URL('../../src/lifecycle/runtimeHealth.js', import.meta.url);
const profileEngagementModuleUrl = new URL('../../src/services/profileEngagementService.js', import.meta.url);
const newsAggregationModuleUrl = new URL('../../src/services/newsAggregationService.js', import.meta.url);
const searchIndexModuleUrl = new URL('../../src/services/searchIndexService.js', import.meta.url);

async function setupWorkerManagerTest({ configOverrides = {} } = {}) {
  jest.resetModules();

  const config = {
    env: 'test',
    workers: {
      autoStart: true,
      profileEngagement: { enabled: true, intervalMs: 15_000 },
      newsAggregation: { enabled: true, intervalMs: 60_000 },
    },
  };

  const mergeConfig = (overrides) => {
    if (!overrides) {
      return;
    }
    if (typeof overrides.autoStart === 'boolean') {
      config.workers.autoStart = overrides.autoStart;
    }
    if (overrides.profileEngagement) {
      Object.assign(config.workers.profileEngagement, overrides.profileEngagement);
    }
    if (overrides.newsAggregation) {
      Object.assign(config.workers.newsAggregation, overrides.newsAggregation);
    }
  };

  mergeConfig(configOverrides);

  const configListeners = new Set();
  const onRuntimeConfigChangeMock = jest.fn((listener) => {
    configListeners.add(listener);
    return () => configListeners.delete(listener);
  });

  jest.unstable_mockModule(runtimeConfigModuleUrl.pathname, () => ({
    getRuntimeConfig: () => config,
    onRuntimeConfigChange: onRuntimeConfigChangeMock,
    __updateConfig: (overrides) => {
      mergeConfig(overrides?.workers ?? {});
      configListeners.forEach((listener) => listener({ config }));
    },
  }));

  const markDependencyHealthy = jest.fn();
  const markDependencyDisabled = jest.fn();
  const markDependencyUnavailable = jest.fn();
  const markWorkerHealthy = jest.fn();
  const markWorkerFailed = jest.fn();
  const markWorkerStopped = jest.fn();

  jest.unstable_mockModule(runtimeHealthModuleUrl.pathname, () => ({
    markDependencyHealthy,
    markDependencyDisabled,
    markDependencyUnavailable,
    markWorkerHealthy,
    markWorkerFailed,
    markWorkerStopped,
  }));

  const bootstrapOpportunitySearch = jest.fn().mockResolvedValue({ configured: true });
  jest.unstable_mockModule(searchIndexModuleUrl.pathname, () => ({
    bootstrapOpportunitySearch,
  }));

  const stopProfileEngagementWorker = jest.fn();
  const startProfileEngagementWorker = jest.fn();
  const getProfileEngagementQueueSnapshot = jest.fn().mockResolvedValue({ queued: 5 });
  jest.unstable_mockModule(profileEngagementModuleUrl.pathname, () => ({
    startProfileEngagementWorker,
    stopProfileEngagementWorker,
    getProfileEngagementQueueSnapshot,
  }));

  const startNewsAggregationWorker = jest.fn().mockResolvedValue({ started: true });
  const stopNewsAggregationWorker = jest.fn();
  const getNewsAggregationStatus = jest.fn().mockResolvedValue({ storiesProcessed: 12 });
  jest.unstable_mockModule(newsAggregationModuleUrl.pathname, () => ({
    startNewsAggregationWorker,
    stopNewsAggregationWorker,
    getNewsAggregationStatus,
  }));

  const workerManagerModule = await import(workerManagerModuleUrl.pathname);
  const runtimeConfigModule = await import(runtimeConfigModuleUrl.pathname);

  return {
    config,
    onRuntimeConfigChangeMock,
    bootstrapOpportunitySearch,
    startProfileEngagementWorker,
    stopProfileEngagementWorker,
    getProfileEngagementQueueSnapshot,
    startNewsAggregationWorker,
    stopNewsAggregationWorker,
    getNewsAggregationStatus,
    markDependencyHealthy,
    markDependencyDisabled,
    markDependencyUnavailable,
    markWorkerHealthy,
    markWorkerFailed,
    markWorkerStopped,
    runtimeConfigModule,
    ...workerManagerModule,
  };
}

describe('workerManager', () => {
  it('starts enabled workers and records telemetry', async () => {
    const context = await setupWorkerManagerTest();

    const startResult = await context.startBackgroundWorkers({});
    expect(context.bootstrapOpportunitySearch).toHaveBeenCalledTimes(1);
    expect(context.markDependencyHealthy).toHaveBeenCalledWith('searchIndex', { configured: true });

    expect(context.startProfileEngagementWorker).toHaveBeenCalledWith(
      expect.objectContaining({ intervalMs: 15_000 }),
    );
    expect(context.markWorkerHealthy).toHaveBeenCalledWith('profileEngagement', { intervalMs: 15_000 });

    expect(context.startNewsAggregationWorker).toHaveBeenCalledWith(
      expect.objectContaining({ intervalMs: 60_000 }),
    );
    expect(context.markWorkerHealthy).toHaveBeenCalledWith('newsAggregation', { intervalMs: 60_000 });

    expect(startResult).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'profileEngagement', started: true }),
        expect.objectContaining({ name: 'newsAggregation', started: true }),
      ]),
    );

    const telemetry = await context.collectWorkerTelemetry({ forceRefresh: true });
    expect(telemetry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'profileEngagement', metrics: { queued: 5 } }),
        expect.objectContaining({ name: 'newsAggregation', metrics: { storiesProcessed: 12 } }),
      ]),
    );

    expect(context.getRegisteredWorkers()).toEqual(expect.arrayContaining(['profileEngagement', 'newsAggregation']));

    await context.stopBackgroundWorkers({});
    expect(context.stopProfileEngagementWorker).toHaveBeenCalledTimes(1);
    expect(context.stopNewsAggregationWorker).toHaveBeenCalledTimes(1);
  });

  it('skips disabled workers and marks them stopped', async () => {
    const context = await setupWorkerManagerTest({
      configOverrides: {
        autoStart: false,
        profileEngagement: { enabled: false },
        newsAggregation: { enabled: false },
      },
    });

    const results = await context.startBackgroundWorkers({});
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'profileEngagement', started: false, reason: 'disabled' }),
        expect.objectContaining({ name: 'newsAggregation', started: false, reason: 'disabled' }),
      ]),
    );

    expect(context.startProfileEngagementWorker).not.toHaveBeenCalled();
    expect(context.startNewsAggregationWorker).not.toHaveBeenCalled();
    expect(context.markWorkerStopped).toHaveBeenCalledWith('profileEngagement', { disabled: true });
    expect(context.markWorkerStopped).toHaveBeenCalledWith('newsAggregation', { disabled: true });

    const telemetry = await context.collectWorkerTelemetry({ forceRefresh: true });
    expect(telemetry).toEqual([]);
  });

  it('cleans up partially started workers when a worker fails', async () => {
    const context = await setupWorkerManagerTest();
    context.startNewsAggregationWorker.mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(context.startBackgroundWorkers({ logger: console })).rejects.toThrow('Network unavailable');

    expect(context.markWorkerFailed).toHaveBeenCalledWith('newsAggregation', expect.any(Error));
    expect(context.stopProfileEngagementWorker).toHaveBeenCalled();
    expect(context.markWorkerStopped).toHaveBeenCalledWith('profileEngagement');
  });
});
