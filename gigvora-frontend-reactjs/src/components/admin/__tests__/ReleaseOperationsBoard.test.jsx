import { render, screen } from '@testing-library/react';
import ReleaseOperationsBoard from '../ReleaseOperationsBoard.jsx';

const SUITE = {
  generatedAt: '2025-04-05T09:30:00.000Z',
  pipelines: {
    stats: {
      total: 3,
      passing: 2,
      attention: 1,
      overallStatus: 'attention',
      averageCoverage: 0.89,
      averageDurationMs: 610000,
    },
    pipelines: [
      {
        id: 'frontend-quality-gate',
        label: 'Frontend quality gate',
        description: 'Lint, vitest, and build guard the React shell.',
        status: 'passing',
        coverage: 0.94,
        durationMs: 486532,
        lastRunAt: '2025-04-05T09:00:00.000Z',
        blockers: [],
      },
      {
        id: 'backend-governance',
        label: 'Backend governance',
        description: 'API linting, Jest coverage, and migration checks.',
        status: 'passing',
        coverage: 0.91,
        durationMs: 612204,
        lastRunAt: '2025-04-05T08:55:00.000Z',
        blockers: ['Regenerate domain clients when contracts change'],
      },
    ],
  },
  releases: {
    latest: {
      version: '2025.04.0',
      codename: 'Atlas Lift',
      approvalCount: 2,
      releasedAt: '2025-04-05T09:30:00.000Z',
    },
    notes: [
      {
        version: '2025.04.0',
        codename: 'Atlas Lift',
        summary: 'Networking analytics overhaul and release control tower upgrades.',
        highlights: ['Networking analytics exposes SLA urgency and relationship health.'],
        releasedAt: '2025-04-05T09:30:00.000Z',
        riskLevel: 'medium',
        approvalCount: 2,
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
    ],
  },
};

describe('ReleaseOperationsBoard', () => {
  it('renders pipeline, release, and cohort information', () => {
    render(
      <ReleaseOperationsBoard suite={SUITE} loading={false} error="" refreshing={false} onRefresh={() => {}} />,
    );

    expect(screen.getByText('Release engineering control tower')).toBeInTheDocument();
    expect(screen.getByText('Frontend quality gate')).toBeInTheDocument();
    expect(screen.getByText('Networking analytics overhaul and release control tower upgrades.')).toBeInTheDocument();
    expect(screen.getByText('Mentor guild beta')).toBeInTheDocument();
  });
});
