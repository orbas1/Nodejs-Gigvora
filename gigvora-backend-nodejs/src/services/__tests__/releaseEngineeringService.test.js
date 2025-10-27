import releaseEngineeringDataset from '../../data/releaseEngineeringDataset.js';
import { ReleaseEngineeringService } from '../releaseEngineeringService.js';

describe('ReleaseEngineeringService', () => {
  let service;

  beforeEach(() => {
    service = new ReleaseEngineeringService(releaseEngineeringDataset);
  });

  it('summarises pipeline health with derived metrics', () => {
    const summary = service.getPipelineSummary();

    expect(summary.stats.total).toBe(3);
    expect(summary.stats.passing).toBe(2);
    expect(summary.stats.attention).toBe(1);
    expect(summary.stats.overallStatus).toBe('attention');
    expect(summary.stats.blockers).toContain('Regenerate domain clients when contracts change');
    expect(summary.stats.blockers).toContain('Stabilise flaky deep-link navigation test');
    expect(summary.stats.averageCoverage).toBeGreaterThan(0.8);
    expect(summary.stats.averageDurationMs).toBeGreaterThan(400000);
    expect(summary.tooling.orchestratorScript).toBe(
      'scripts/pipelines/run_release_engineering_pipeline.mjs',
    );
  });

  it('orders release notes by recency and exposes approvals', () => {
    const { notes, latest, stats } = service.getReleaseNotes();

    expect(notes[0].version).toBe('2025.04.0');
    expect(latest.version).toBe('2025.04.0');
    expect(latest.highlightCount).toBeGreaterThan(0);
    expect(latest.approvalCount).toBe(2);
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.latestVersion).toBe('2025.04.0');
  });

  it('ranks upgrade cohorts by stage and adoption', () => {
    const { cohorts, stats } = service.getUpgradeRollouts();

    expect(cohorts[0].stage).toBe('pilot');
    expect(cohorts[0].name).toBe('Mentor guild beta');
    expect(cohorts[cohorts.length - 1].stage).toBe('ga-ready');
    expect(stats.total).toBe(3);
    expect(stats.gaReady).toBe(1);
    expect(stats.averageAdoption).toBeGreaterThan(0.6);
    expect(stats.blockers).toContain('Awaiting analytics verification for mentor-led release scheduling.');
  });

  it('provides a combined operations suite payload', () => {
    const suite = service.getOperationsSuite();

    expect(suite.generatedAt).toBeInstanceOf(Date);
    expect(suite.pipelines.stats.total).toBe(3);
    expect(suite.releases.latest.version).toBe('2025.04.0');
    expect(suite.rollouts.stats.total).toBe(3);
    expect(suite.health.blockers.length).toBeGreaterThan(0);
  });
});
