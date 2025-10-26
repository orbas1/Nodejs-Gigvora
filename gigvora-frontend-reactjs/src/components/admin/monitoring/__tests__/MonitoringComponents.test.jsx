import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InsightsOverview from '../InsightsOverview.jsx';
import MetricsExplorer from '../MetricsExplorer.jsx';
import AuditTrailViewer from '../AuditTrailViewer.jsx';

const trackMock = vi.fn(() => Promise.resolve());

vi.mock('../../../../services/analytics.js', () => ({
  __esModule: true,
  default: {
    track: (...args) => {
      trackMock(...args);
      return Promise.resolve();
    },
  },
}));

const insightsResponse = {
  summary: {
    totalReach: 128903,
    totalReachDelta: 0.12,
    engagementRate: 0.41,
    engagementRateDelta: 0.08,
    conversionLift: 0.27,
    conversionLiftDelta: 0.05,
    anomalyCoverage: 0.9,
    anomalyCoverageDelta: 0.15,
  },
  timeline: [
    { value: 0.2 },
    { value: 0.24 },
    { value: 0.3 },
  ],
  personas: [
    {
      key: 'creators',
      label: 'Creators',
      engagementRate: 0.56,
      conversionRate: 0.31,
      adoptionRate: 0.72,
      delta: { engagementRate: 0.12 },
      headline: 'Creators are accelerating adoption',
      story: 'Creators responded to the latest spotlight with record uplift.',
    },
  ],
  anomalies: [
    {
      id: 'anomaly-1',
      title: 'Drop in mentorship completions',
      description: 'Mentorship cohorts dipped 12% week over week.',
      severity: 'high',
      timestamp: new Date('2024-06-01T08:00:00Z').toISOString(),
      metric: 'Mentorship completion',
      impact: 0.12,
      population: 'Mentorship cohort',
    },
  ],
  roadmap: [
    {
      id: 'roadmap-1',
      title: 'Launch mentor concierge',
      description: 'Pair mentors with curated prompts to reduce drop-off.',
      impactScore: 9.4,
    },
  ],
  narratives: [
    {
      headline: 'Momentum is surging',
      body: 'Leadership sees a 3x uplift in campaign resonance following the story-driven rollouts.',
    },
  ],
  journeys: [
    {
      stage: 'Awareness',
      conversionRate: 0.45,
      medianDuration: '3d',
      narrative: 'Ads and organic spotlights provide fast traction.',
    },
  ],
  qa: {
    sourceCount: 12,
    trustScore: 0.98,
  },
};

const metricsResponse = {
  metrics: [
    {
      key: 'engagementRate',
      label: 'Engagement rate',
      value: 0.41,
      delta: 0.05,
      sampleSize: 9302,
      narrative: 'High intent cohorts are engaging with story-led narratives.',
      sparkline: [{ value: 0.2 }, { value: 0.24 }],
      tags: ['storytelling'],
    },
    {
      key: 'conversionRate',
      label: 'Conversion rate',
      value: 0.29,
      delta: -0.03,
      sampleSize: 5582,
      narrative: 'Conversion lags due to missing nurture follow-ups.',
      sparkline: [{ value: 0.32 }, { value: 0.29 }],
      tags: ['nurture'],
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      title: 'Conversion threshold breached',
      description: 'Conversion dropped below the 30% guardrail.',
      status: 'at_risk',
      threshold: 0.3,
      value: 0.29,
    },
  ],
  filters: {
    metrics: [
      { value: 'engagementRate', label: 'Engagement rate' },
      { value: 'conversionRate', label: 'Conversion rate' },
    ],
    personas: [
      { value: 'creators', label: 'Creators' },
    ],
    channels: [
      { value: 'email', label: 'Email' },
    ],
  },
};

const metricsViewsResponse = {
  views: [
    {
      id: 'view-analytics',
      name: 'Executive daily pulse',
      timeframe: '14d',
      query: {
        timeframe: '14d',
        metric: 'engagementRate',
        persona: 'creators',
        channel: 'email',
        compareTo: 'previous_period',
        includeBenchmarks: true,
        search: '',
      },
    },
  ],
};

const auditResponse = {
  items: [
    {
      id: 'audit-1',
      severity: 'high',
      action: 'policy.updated',
      summary: 'Updated consent document for EU markets',
      actor: { name: 'Sonia Malik', type: 'compliance_manager' },
      resource: { key: 'policy-12', label: 'Consent policy', type: 'policy' },
      timestamp: new Date('2024-06-01T10:00:00Z').toISOString(),
      metadata: { version: 4, locale: 'en-GB' },
      relatedIncidents: [
        { id: 'incident-4', title: 'Consent review', status: 'resolved', openedAt: new Date('2024-05-28T10:00:00Z').toISOString() },
      ],
    },
  ],
  summary: {
    total: 28,
    critical: 2,
    medianResponseMinutes: 32,
    compliancePosture: 'Compliance posture: excellent',
    residualRiskNarrative: 'Review webhook verification before next release.',
  },
  filters: {
    severities: [
      { value: 'high', label: 'High severity' },
    ],
    actorTypes: [
      { value: 'compliance_manager', label: 'Compliance managers' },
    ],
    resources: [
      { value: 'policy', label: 'Policies' },
    ],
  },
  pagination: { page: 1, pageSize: 50, totalPages: 1 },
};

const exportResponse = {
  fileUrl: 'https://example.com/audit.csv',
};

vi.mock('../../../../services/adminMonitoring.js', () => ({
  __esModule: true,
  fetchInsightsOverview: vi.fn(async () => insightsResponse),
  fetchMetricsExplorer: vi.fn(async () => metricsResponse),
  fetchMetricsExplorerViews: vi.fn(async () => metricsViewsResponse),
  createMetricsExplorerView: vi.fn(async (payload) => ({ id: `server-${payload.name}` })),
  deleteMetricsExplorerView: vi.fn(async () => ({ success: true })),
  fetchAuditTrail: vi.fn(async () => auditResponse),
  exportAuditTrail: vi.fn(async () => exportResponse),
}));

const adminMonitoring = await import('../../../../services/adminMonitoring.js');

describe('InsightsOverview', () => {
  beforeEach(() => {
    trackMock.mockClear();
    adminMonitoring.fetchInsightsOverview.mockClear();
  });

  it('renders summary metrics and persona spotlight', async () => {
    const onSelectPersona = vi.fn();
    render(<InsightsOverview onSelectPersona={onSelectPersona} />);

    await waitFor(() => expect(adminMonitoring.fetchInsightsOverview).toHaveBeenCalled());

    expect(await screen.findByText('Total reach')).toBeInTheDocument();
    expect(await screen.findByText('128,903')).toBeInTheDocument();
    expect((await screen.findAllByText('Engagement rate')).length).toBeGreaterThan(0);

    const personaSelect = screen.getByLabelText('Select persona', { selector: 'select' });
    await userEvent.selectOptions(personaSelect, 'creators');

    await waitFor(() => expect(onSelectPersona).toHaveBeenCalledWith(expect.objectContaining({ key: 'creators' })));
    expect(trackMock).toHaveBeenCalled();
  });
});

describe('MetricsExplorer', () => {
  const originalPrompt = window.prompt;
  const originalOpen = window.open;

  beforeEach(() => {
    window.prompt = vi.fn(() => 'Leadership spotlight');
    window.open = vi.fn();
    trackMock.mockClear();
    adminMonitoring.fetchMetricsExplorer.mockClear();
    adminMonitoring.fetchMetricsExplorerViews.mockClear();
    adminMonitoring.createMetricsExplorerView.mockClear();
    adminMonitoring.deleteMetricsExplorerView.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.prompt = originalPrompt;
    window.open = originalOpen;
  });

  it('loads metrics, saves a view, and filters results', async () => {
    render(<MetricsExplorer />);

    await waitFor(() => expect(adminMonitoring.fetchMetricsExplorer).toHaveBeenCalled());

    const metricLabels = await screen.findAllByText('Engagement rate');
    expect(metricLabels.length).toBeGreaterThan(0);

    const searchInput = screen.getByPlaceholderText('Search metrics, tags, thresholds…');
    await userEvent.type(searchInput, 'nurture');

    await waitFor(() => {
      expect(screen.getByText('Conversion rate')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /Save view/i });
    await userEvent.click(saveButton);

    await waitFor(() => expect(adminMonitoring.createMetricsExplorerView).toHaveBeenCalled());
    expect(await screen.findByText('Leadership spotlight')).toBeInTheDocument();

    const savedViewButtons = screen.getAllByRole('button', { name: /Executive daily pulse/i });
    await userEvent.click(savedViewButtons[0]);
    expect(trackMock).toHaveBeenCalled();
  });
});

describe('AuditTrailViewer', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
    trackMock.mockClear();
    adminMonitoring.fetchAuditTrail.mockClear();
    adminMonitoring.exportAuditTrail.mockClear();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('renders audit events and exports data', async () => {
    render(<AuditTrailViewer />);

    await waitFor(() => expect(adminMonitoring.fetchAuditTrail).toHaveBeenCalled());

    const actionCell = await screen.findByText('policy.updated');
    expect(actionCell).toBeInTheDocument();

    const viewContextButtons = screen.getAllByRole('button', { name: /View context/i });
    await userEvent.click(viewContextButtons[0]);

    expect(await screen.findByText('Event context')).toBeInTheDocument();

    const exportButton = screen.getByRole('button', { name: /Export CSV/i });
    await userEvent.click(exportButton);

    await waitFor(() => expect(adminMonitoring.exportAuditTrail).toHaveBeenCalled());
    expect(window.open).toHaveBeenCalledWith('https://example.com/audit.csv', '_blank', 'noopener');
  });
});
