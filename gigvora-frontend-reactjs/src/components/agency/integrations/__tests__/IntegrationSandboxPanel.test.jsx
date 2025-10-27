import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import IntegrationSandboxPanel from '../IntegrationSandboxPanel.jsx';

const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(),
};

describe('IntegrationSandboxPanel', () => {
  beforeEach(() => {
    mockClipboard.writeText.mockClear();
  });

  it('renders environment metadata and scenarios', () => {
    render(
      <IntegrationSandboxPanel
        clipboard={mockClipboard}
        environments={[
          {
            id: 'calendar-local',
            name: 'Calendar Scheduling Stub',
            category: 'calendar',
            description: 'Workspace aware sandbox.',
            baseUrl: 'http://localhost:4010',
            latency: { minMs: 120, maxMs: 420 },
            health: { status: 'online', latencyMs: 150, checkedAt: new Date().toISOString() },
            workspaceCount: 2,
            workspaceSource: 'default-dataset',
            eventCount: 42,
            eventTypes: ['gig', 'mentorship'],
            allowedOrigins: ['https://app.gigvora.test'],
            fallbackOrigin: 'http://localhost:4173',
            roles: { view: ['calendar:view'], manage: ['calendar:manage'] },
            scenarios: ['rate-limit', 'forbidden'],
            requiresApiKey: true,
            docsUrl: 'https://docs.example.com',
            status: 'online',
            observability: {
              uptimeLast24h: 99.9,
              averageLatencyMs: 210.4,
              p95LatencyMs: 420,
              sampleSize: 12,
              lastIncidentAt: new Date().toISOString(),
            },
            scenarioDetails: [
              {
                id: 'rate-limit',
                label: 'Rate limit drill',
                description: 'Simulate 429 responses.',
                docsUrl: 'https://docs.example.com/rate-limit',
              },
            ],
            workspaceHighlights: {
              preview: ['Northwind', 'Contoso'],
              timezones: ['UTC'],
              membershipRoles: ['admin'],
            },
            insights: {
              workspaces: {
                preview: ['Northwind', 'Contoso'],
                timezones: ['UTC'],
                membershipRoles: ['admin'],
              },
              events: {
                nextEvent: {
                  title: 'Gig Kickoff',
                  workspaceName: 'Northwind',
                  startsAt: new Date().toISOString(),
                },
                lastEvent: {
                  title: 'Mentorship',
                  workspaceName: 'Contoso',
                  startsAt: new Date(Date.now() - 3600000).toISOString(),
                },
                topEventTypes: [
                  { type: 'gig', count: 20 },
                  { type: 'mentorship', count: 12 },
                ],
                workspaceDensity: [
                  { name: 'Northwind', count: 20 },
                ],
              },
            },
          },
        ]}
      />,
    );

    expect(screen.getByText('Calendar Scheduling Stub')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:4010')).toBeInTheDocument();
    expect(screen.getAllByText('rate-limit').length).toBeGreaterThan(0);
    const docsLinks = screen.getAllByRole('link', { name: /Docs/i });
    expect(docsLinks[docsLinks.length - 1]).toHaveAttribute('href', 'https://docs.example.com');
    expect(screen.getByText(/Uptime \(24h\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Rate limit drill/i)).toBeInTheDocument();
    expect(screen.getByText(/Gig Kickoff/i)).toBeInTheDocument();
  });

  it('copies base URL to clipboard', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <IntegrationSandboxPanel
        clipboard={mockClipboard}
        environments={[
          {
            id: 'calendar-local',
            name: 'Calendar Scheduling Stub',
            category: 'calendar',
            description: 'Workspace aware sandbox.',
            baseUrl: 'http://localhost:4010',
            latency: { minMs: 0, maxMs: 0 },
            health: { status: 'online', latencyMs: 120, checkedAt: new Date().toISOString() },
            workspaceCount: 2,
            workspaceSource: 'default',
            eventCount: 10,
            eventTypes: ['gig'],
            allowedOrigins: [],
            fallbackOrigin: 'http://localhost:4173',
            roles: { view: [], manage: [] },
            scenarios: [],
            requiresApiKey: false,
            status: 'online',
          },
        ]}
      />,
    );

    const copyButton = screen.getByRole('button', { name: /Copy Calendar Scheduling Stub base URL/i });
    await user.click(copyButton);

    expect(screen.getByText('Copied')).toBeInTheDocument();
    await act(async () => {
      vi.runAllTimers();
    });
    expect(mockClipboard.writeText).toHaveBeenCalledWith('http://localhost:4010');
    vi.useRealTimers();
  });

  it('surfaces load errors', () => {
    render(
      <IntegrationSandboxPanel
        clipboard={mockClipboard}
        loading={false}
        error="Unable to load stub environments."
      />,
    );
    expect(screen.getByText('Unable to load stub environments.')).toBeInTheDocument();
  });
});
