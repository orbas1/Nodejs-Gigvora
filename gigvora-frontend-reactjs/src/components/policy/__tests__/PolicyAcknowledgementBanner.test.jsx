import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PolicyAcknowledgementBanner from '../PolicyAcknowledgementBanner.jsx';
import useSession from '../../../hooks/useSession.js';

vi.mock('../../../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../services/policyUpdates.js', () => ({
  fetchPolicyReleaseMetadata: vi.fn(),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: { track: vi.fn() },
}));

const mockUseSession = useSession;
const { fetchPolicyReleaseMetadata } = await import('../../../services/policyUpdates.js');
const analytics = (await import('../../../services/analytics.js')).default;

function renderWithRouter(ui) {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSession.mockReturnValue({ session: { id: '123' } });
  fetchPolicyReleaseMetadata.mockResolvedValue(null);
  analytics.track.mockResolvedValue();
  window.localStorage.clear();
});

describe('PolicyAcknowledgementBanner', () => {
  it('stores acknowledgement and hides banner', async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithRouter(<PolicyAcknowledgementBanner />);
    });

    const toggle = await screen.findByRole('button', { name: /view policy updates/i });
    await act(async () => {
      await user.click(toggle);
    });

    expect(await screen.findByText(/Updated legal terms now live/i)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /acknowledge updates/i }));
    });
    expect(screen.queryByText(/Updated legal terms now live/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view policy updates/i })).not.toBeInTheDocument();

    const storedValue = window.localStorage.getItem('gv-policy-ack:2024.11:123');
    expect(storedValue).toBeTruthy();
    const parsed = JSON.parse(storedValue ?? '{}');
    expect(parsed.version).toBe('2024.11');
    expect(analytics.track).toHaveBeenCalledWith(
      'policy.acknowledged',
      expect.objectContaining({ version: '2024.11' }),
      expect.objectContaining({ userId: '123' }),
    );
  });

  it('does not render when acknowledgement already exists', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    window.localStorage.setItem(
      'gv-policy-ack:2024.11:123',
      JSON.stringify({ version: '2024.11', acknowledgedAt: new Date().toISOString(), expiresAt: future }),
    );
    await act(async () => {
      renderWithRouter(<PolicyAcknowledgementBanner />);
    });

    expect(screen.queryByText(/Updated legal terms now live/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /view policy updates/i })).not.toBeInTheDocument();
  });
});
