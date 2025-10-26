import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SystemStatusToast, { createSystemStatusToastPayload } from '../SystemStatusToast.jsx';

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: {
    track: vi.fn(),
  },
}));

describe('SystemStatusToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headline, description, and impacted services', () => {
    render(
      <SystemStatusToast
        status="degraded"
        headline="API latency spike"
        description="Response times are above target while we rebalance traffic."
        impactedServices={[
          { id: 'api', name: 'Core API', status: 'degraded', impact: 'Latency +2.3s', eta: '2024-05-01T12:30:00Z' },
          { id: 'search', name: 'Search index', status: 'recovering', impact: 'Indexing queue delays' },
        ]}
        updatedAt="2024-05-01T11:45:00Z"
        dismiss={vi.fn()}
      />,
    );

    expect(screen.getByText('API latency spike')).toBeInTheDocument();
    expect(screen.getByText('Response times are above target while we rebalance traffic.')).toBeInTheDocument();
    expect(screen.getByText('Core API')).toBeInTheDocument();
    expect(screen.getByText('Search index')).toBeInTheDocument();
    expect(screen.getByText(/Latency/)).toBeInTheDocument();
    expect(screen.getByText(/ETA/)).toBeInTheDocument();
  });

  it('invokes callbacks when acknowledging the toast', async () => {
    const onAcknowledge = vi.fn();
    const dismiss = vi.fn();
    render(
      <SystemStatusToast
        status="outage"
        headline="Realtime sync outage"
        onAcknowledge={onAcknowledge}
        dismiss={dismiss}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Acknowledge/i }));

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('creates a toast payload with accent and renderer', () => {
    const payload = createSystemStatusToastPayload({
      id: 'status-toast',
      status: 'maintenance',
      headline: 'Scheduled upgrade',
    });

    expect(payload).toMatchObject({ tone: 'info', accent: '#6366f1', id: 'status-toast' });
    expect(typeof payload.content).toBe('function');

    const dismiss = vi.fn();
    const { container } = render(payload.content({ dismiss }));
    expect(container.querySelector('div')).toBeTruthy();
  });
});
