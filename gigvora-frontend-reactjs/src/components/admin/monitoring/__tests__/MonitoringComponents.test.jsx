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

const fetchInsightsOverviewMock = vi.fn(async () => ({
  summary: {
    totalReach: 150000,
    totalReachDelta: 0.12,
    engagementRate: 0.41,
    engagementRateDelta: 0.08,
    conversionLift: 0.27,
    conversionLiftDelta: 0.05,
    anomalyCoverage: 0.9,
    anomalyCoverageDelta: 0.15,
  },
  timeline: [{ value: 0.2 }, { value: 0.24 }, { value: 0.3 }],
  personas: [
    {
      key: 'creators',
      label: 'Creators',
      engagementRate: 0.56,
      delta: { engagementRate: 0.12 },
      headline: 'Creators are accelerating adoption',
      story: 'Creators responded to the latest spotlight with record uplift.',
    },
    {
      key: 'mentors',
      label: 'Mentors',
      engagementRate: 0.33,
      delta: { engagementRate: -0.04 },
      headline: 'Mentor cohorts require prompts',
      story: 'Mentors slowed outreach after the compliance policy update.',
    },
  ],
  anomalies: [
    {
      id: 'anomaly-1',
      title: 'Mentorship drop',
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
      targetDate: '2024-07-15',
    },
  ],
  narratives: [
    {
      headline: 'Momentum is surging',
      body: 'Leadership sees a 3x uplift following the story-driven rollouts.',
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
    notes: 'Validated with Mixpanel, CRM, and finance exports.',
  },
}));

const fetchMetricsExplorerMock = vi.fn(async () => ({
  metrics: [
    {
      id: 'metric-1',
      key: 'engagementRate',
      label: 'Engagement rate',
      value: 0.41,
      delta: 0.05,
      sampleSize: 9302,
      narrative: 'High intent cohorts are engaging with story-led narratives.',
      tags: ['storytelling'],
      persona: 'creators',
      personaLabel: 'Creators',
      channel: 'email',
      channelLabel: 'Email',
      includeBenchmarks: true,
      timeframe: '14d',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      metricKey: 'conversionRate',
      title: 'Conversion threshold breached',
      description: 'Conversion dropped below the 30% guardrail.',
      status: 'at_risk',
      threshold: 0.3,
      value: 0.29,
      timeframe: '14d',
    },
  ],
  filters: {
    metrics: [
      { value: 'engagementRate', label: 'Engagement rate' },
      { value: 'conversionRate', label: 'Conversion rate' },
    ],
    personas: [{ value: 'creators', label: 'Creators' }],
    channels: [{ value: 'email', label: 'Email' }],
  },
}));

const fetchMetricsExplorerViewsMock = vi.fn(async () => ({
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
}));

const createMetricsExplorerViewMock = vi.fn(async (payload) => ({
  id: 'view-new',
  name: payload.name,
  timeframe: payload.query.timeframe,
  query: payload.query,
}));

const deleteMetricsExplorerViewMock = vi.fn(async () => ({ success: true }));

const fetchAuditTrailMock = vi.fn(async () => ({
  items: [
    {
      id: 'audit-1',
      severity: 'high',
      action: 'policy.updated',
      summary: 'Updated consent document for EU markets',
      actor: { name: 'Sonia Malik', type: 'compliance_manager' },
      resource: { key: 'policy-12', label: 'Consent policy', type: 'policy' },
      timestamp: new Date('2024-06-01T10:00:00Z').toISOString(),
      metadata: { version: 4, locale: 'en-GB', responseMinutes: 28 },
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
    severities: [{ value: 'high', label: 'High' }],
    actorTypes: [{ value: 'compliance_manager', label: 'Compliance manager' }],
    resources: [{ value: 'policy', label: 'Policy' }],
  },
  pagination: { page: 1, pageSize: 10, totalPages: 1 },
}));

const exportAuditTrailMock = vi.fn(async () => ({
  fileUrl: 'https://cdn.gigvora.com/exports/monitoring/audit.csv',
  filePath: '/tmp/audit.csv',
  expiresAt: new Date(Date.now() + 900000).toISOString(),
}));

vi.mock('../../../../services/adminMonitoring.js', () => ({
  __esModule: true,
  fetchInsightsOverview: (...args) => fetchInsightsOverviewMock(...args),
  fetchMetricsExplorer: (...args) => fetchMetricsExplorerMock(...args),
  fetchMetricsExplorerViews: (...args) => fetchMetricsExplorerViewsMock(...args),
  createMetricsExplorerView: (...args) => createMetricsExplorerViewMock(...args),
  deleteMetricsExplorerView: (...args) => deleteMetricsExplorerViewMock(...args),
  fetchAuditTrail: (...args) => fetchAuditTrailMock(...args),
  exportAuditTrail: (...args) => exportAuditTrailMock(...args),
}));

describe('Monitoring components', () => {
  beforeEach(() => {
    trackMock.mockClear();
    fetchInsightsOverviewMock.mockClear();
    fetchMetricsExplorerMock.mockClear();
    fetchMetricsExplorerViewsMock.mockClear();
    createMetricsExplorerViewMock.mockClear();
    deleteMetricsExplorerViewMock.mockClear();
    fetchAuditTrailMock.mockClear();
    exportAuditTrailMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('InsightsOverview', () => {
    it('renders premium summary metrics and persona details', async () => {
      render(<InsightsOverview />);
      expect(await screen.findByText('Insights overview')).toBeInTheDocument();
      const totals = await screen.findAllByText(/150,000/);
      expect(totals.length).toBeGreaterThan(0);
      expect(screen.getByText('Momentum is surging')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /Mentors/i }));
      await waitFor(() => expect(trackMock).toHaveBeenCalledWith('admin.monitoring.insights.persona.selected', expect.any(Object)));
      expect(screen.getByText('Mentor cohorts require prompts')).toBeInTheDocument();
    });

    it('changes timeframe and triggers analytics', async () => {
      render(<InsightsOverview />);
      const select = await screen.findByLabelText('Timeframe');
      await userEvent.selectOptions(select, '30d');
      await waitFor(() => expect(trackMock).toHaveBeenCalledWith('admin.monitoring.insights.timeframe.changed', expect.any(Object)));
      await waitFor(() => expect(fetchInsightsOverviewMock).toHaveBeenCalledTimes(2));
    });
  });

  describe('MetricsExplorer', () => {
    it('renders metrics, saved views, and allows saving a new view', async () => {
      render(<MetricsExplorer />);
      expect(await screen.findByText('Metrics explorer')).toBeInTheDocument();
      const metricLabels = await screen.findAllByText('Engagement rate');
      expect(metricLabels.length).toBeGreaterThan(0);
      expect(screen.getByText('Conversion threshold breached')).toBeInTheDocument();
      expect(screen.getByText('Executive daily pulse')).toBeInTheDocument();

      await userEvent.type(screen.getByPlaceholderText('Name this view'), 'All creators');
      await userEvent.click(screen.getByRole('button', { name: /Save view/i }));

      await waitFor(() => expect(createMetricsExplorerViewMock).toHaveBeenCalled());
      expect(screen.getByText('All creators')).toBeInTheDocument();
    });

    it('applies and deletes a saved view', async () => {
      render(<MetricsExplorer />);
      await screen.findByText('Executive daily pulse');

      await userEvent.click(screen.getByText('Executive daily pulse'));
      await waitFor(() => expect(fetchMetricsExplorerMock).toHaveBeenCalledTimes(2));

      await userEvent.click(screen.getByRole('button', { name: /Delete view Executive daily pulse/i }));
      await waitFor(() => expect(deleteMetricsExplorerViewMock).toHaveBeenCalled());
    });
  });

  describe('AuditTrailViewer', () => {
    it('renders audit events and summary cards, and exports data', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<AuditTrailViewer />);

      expect(await screen.findByText('Audit trail viewer')).toBeInTheDocument();
      expect(screen.getByText('Total events')).toBeInTheDocument();
      expect(screen.getByText('Updated consent document for EU markets')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Updated consent document for EU markets'));
      expect(screen.getByText('Metadata')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /Export CSV/i }));
      await waitFor(() => expect(exportAuditTrailMock).toHaveBeenCalled());
      expect(openSpy).toHaveBeenCalledWith('https://cdn.gigvora.com/exports/monitoring/audit.csv', '_blank', 'noopener');
      openSpy.mockRestore();
    });
  });
});
