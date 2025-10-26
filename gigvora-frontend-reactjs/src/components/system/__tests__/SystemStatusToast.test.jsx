import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SystemStatusToast from '../SystemStatusToast.jsx';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: analytics,
}));

describe('SystemStatusToast', () => {
  beforeEach(() => {
    analytics.track.mockClear();
  });

  it('renders outage state with metadata, services, and actions', async () => {
    const onAcknowledge = vi.fn();
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <SystemStatusToast
        status="outage"
        message="Payments API is degraded for EU traffic while we roll back a proxy change."
        timestamp="2024-01-01T01:30:00Z"
        impactedServices={["Payments API", 'Receivables ledger']}
        meta={[
          { label: 'Incident', value: '#7842' },
          { label: 'Owner', value: 'Payments SRE' },
        ]}
        nextSteps={[
          'Redirect 40% of traffic to backup region',
          'Publish customer advisory with updated timelines',
        ]}
        actions={[
          { label: 'View status page', href: 'https://status.gigvora.com/incidents/7842' },
          { label: 'Join war room', onClick: vi.fn(), variant: 'secondary' },
        ]}
        acknowledgeLabel="Mark as acknowledged"
        onAcknowledge={onAcknowledge}
        onDismiss={onDismiss}
        referenceTime="2024-01-01T02:00:00Z"
      />,
    );

    expect(screen.getByText('Service disruption')).toBeInTheDocument();
    expect(screen.getByText('Payments API is degraded for EU traffic while we roll back a proxy change.')).toBeInTheDocument();
    expect(screen.getByText('Payments API')).toBeInTheDocument();
    expect(screen.getByText('Receivables ledger')).toBeInTheDocument();
    expect(screen.getByText('#7842')).toBeInTheDocument();
    expect(screen.getByText('Payments SRE')).toBeInTheDocument();
    expect(screen.getByText('Updated 30 minutes ago')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark as acknowledged' }));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('tracks analytics when viewed', () => {
    render(
      <SystemStatusToast
        status="maintenance"
        timestamp="2024-01-01T01:50:00Z"
        impactedServices={["Realtime messaging"]}
        nextSteps={['Route traffic to standby cluster']}
        analyticsContext={{ workspace: 'operations' }}
        referenceTime="2024-01-01T02:00:00Z"
      />,
    );

    expect(analytics.track).toHaveBeenCalledWith('system_status_toast_viewed', expect.objectContaining({
      status: 'Scheduled maintenance',
      severity: 'notice',
      hasActions: false,
      hasNextSteps: true,
      impactedServices: 1,
      workspace: 'operations',
    }));
  });
});
