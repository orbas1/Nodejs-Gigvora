import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import ReleaseOperationsBoard from '../../../components/admin/ReleaseOperationsBoard.jsx';
import {
  fetchReleaseOperationsSuite,
  normaliseReleaseSuite,
} from '../../../services/releaseEngineering.js';

const MENU_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { id: 'release-ops', name: 'Release ops', sectionId: 'release-ops' },
      { id: 'maintenance', name: 'Maintenance', href: '/dashboard/admin/maintenance' },
    ],
  },
  {
    label: 'Dashboards',
    items: [
      { id: 'admin-overview', name: 'Admin overview', href: '/dashboard/admin' },
    ],
  },
];

const AVAILABLE_DASHBOARDS = ['admin', 'user', 'freelancer', 'company', 'agency'];

const FALLBACK_SUITE = normaliseReleaseSuite({
  generatedAt: new Date().toISOString(),
  pipelines: {
    stats: {
      total: 3,
      passing: 2,
      attention: 1,
      averageCoverage: 0.89,
      averageDurationMs: 610000,
      overallStatus: 'attention',
    },
    tooling: {
      orchestratorScript: 'scripts/pipelines/run_release_engineering_pipeline.mjs',
      releaseDigestScript: 'scripts/release-notes/buildReleaseDigest.mjs',
    },
    pipelines: [
      {
        id: 'frontend-quality-gate',
        label: 'Frontend quality gate',
        description: 'Lint, vitest, and build guard the React shell.',
        status: 'passing',
        coverage: 0.94,
        durationMs: 486532,
        lastRunAt: new Date().toISOString(),
        blockers: [],
      },
      {
        id: 'backend-governance',
        label: 'Backend governance',
        description: 'API linting, Jest coverage, and migration checks.',
        status: 'passing',
        coverage: 0.91,
        durationMs: 612204,
        lastRunAt: new Date().toISOString(),
        blockers: ['Regenerate domain clients when contracts change'],
      },
      {
        id: 'mobile-sanity',
        label: 'Flutter smoke suite',
        description: 'Melos smoke tests for mobile clients.',
        status: 'attention',
        coverage: 0.81,
        durationMs: 734112,
        lastRunAt: new Date().toISOString(),
        blockers: ['Stabilise flaky deep-link navigation test'],
      },
    ],
  },
  releases: {
    latest: {
      version: '2025.04.0',
      codename: 'Atlas Lift',
      summary: 'Networking analytics overhaul and release control tower upgrades.',
      approvalCount: 2,
      releasedAt: '2025-04-05T09:30:00.000Z',
      highlights: [
        'Networking analytics exposes SLA urgency and relationship health.',
        'Concierge control tower ships release engineering board.',
        'Automated digest script updates enablement docs.',
      ],
    },
    notes: [
      {
        version: '2025.04.0',
        codename: 'Atlas Lift',
        summary: 'Networking analytics overhaul and release control tower upgrades.',
        highlights: [
          'Networking analytics exposes SLA urgency and relationship health.',
          'Concierge control tower ships release engineering board.',
          'Automated digest script updates enablement docs.',
        ],
        releasedAt: '2025-04-05T09:30:00.000Z',
        riskLevel: 'medium',
        approvalCount: 2,
      },
      {
        version: '2025.03.2',
        codename: 'Harbor Pulse',
        summary: 'Composer autosave refinements and runtime telemetry patches.',
        highlights: ['Composer autosave cadence tuned to 20 seconds.', 'Runtime telemetry alerts on API burst behaviour.'],
        releasedAt: '2025-03-18T11:10:00.000Z',
        riskLevel: 'low',
        approvalCount: 1,
      },
    ],
  },
  rollouts: {
    cohorts: [
      {
        name: 'Mentor guild beta',
        stage: 'pilot',
        adoptionRate: 0.68,
        healthScore: 0.83,
        nextCheckpointAt: '2025-04-09T16:00:00.000Z',
        guardrails: {
          crashFreeSessions: 0.997,
          errorBudgetRemaining: 0.84,
        },
        blockers: ['Awaiting analytics verification for mentor-led release scheduling.'],
      },
      {
        name: 'Enterprise agencies',
        stage: 'staged-rollout',
        adoptionRate: 0.54,
        healthScore: 0.78,
        nextCheckpointAt: '2025-04-08T14:00:00.000Z',
        guardrails: {
          crashFreeSessions: 0.992,
          errorBudgetRemaining: 0.71,
        },
        blockers: ['Expand support docs for APAC agencies'],
      },
      {
        name: 'Global availability',
        stage: 'ga-ready',
        adoptionRate: 0.92,
        healthScore: 0.91,
        nextCheckpointAt: '2025-04-07T17:30:00.000Z',
        guardrails: {
          crashFreeSessions: 0.998,
          errorBudgetRemaining: 0.9,
        },
        blockers: [],
      },
    ],
  },
});

export default function AdminReleaseEngineeringDashboard() {
  const [suite, setSuite] = useState(FALLBACK_SUITE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSuite = useCallback(
    async (options = { refresh: false }) => {
      if (options.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const data = await fetchReleaseOperationsSuite();
        setSuite(normaliseReleaseSuite(data));
      } catch (err) {
        console.error('Failed to load release engineering suite', err);
        setError('Unable to load the latest release engineering telemetry. Showing cached data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadSuite({ refresh: false });
  }, [loadSuite]);

  const breadcrumbs = useMemo(
    () => [
      { name: 'Admin', href: '/dashboard/admin' },
      { name: 'Release engineering', href: '/dashboard/admin/release-operations' },
    ],
    [],
  );

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Release engineering"
      subtitle="Build pipelines, change management, and upgrade cohorts"
      description="Monitor build quality, release notes, and rollout cohorts as the enterprise platform scales."
      breadcrumbs={breadcrumbs}
      menuSections={MENU_SECTIONS}
      sections={[{ id: 'release-ops', name: 'Release operations' }]}
      availableDashboards={AVAILABLE_DASHBOARDS}
    >
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50/30 pb-16">
        <div className="mx-auto max-w-screen-2xl space-y-8 px-6 py-12">
          <ReleaseOperationsBoard
            suite={suite}
            loading={loading}
            error={error}
            refreshing={refreshing}
            onRefresh={() => loadSuite({ refresh: true })}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
