import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PolicyAcknowledgementBanner from '../PolicyAcknowledgementBanner.jsx';
import useSession from '../../../hooks/useSession.js';

vi.mock('../../../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

const mockUseSession = useSession;

function renderWithRouter(ui) {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
}

beforeEach(() => {
  mockUseSession.mockReturnValue({ session: { id: '123' } });
  window.localStorage.clear();
});

describe('PolicyAcknowledgementBanner', () => {
  it('stores acknowledgement and hides banner', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PolicyAcknowledgementBanner />);

    expect(screen.getByText(/Updated legal terms now live/i)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /acknowledge updates/i }));
    });
    expect(screen.queryByText(/Updated legal terms now live/i)).not.toBeInTheDocument();

    const storedValue = window.localStorage.getItem('gv-policy-ack-2024-11:123');
    expect(storedValue).toBeTruthy();
  });

  it('does not render when acknowledgement already exists', () => {
    window.localStorage.setItem('gv-policy-ack-2024-11:123', new Date().toISOString());
    renderWithRouter(<PolicyAcknowledgementBanner />);

    expect(screen.queryByText(/Updated legal terms now live/i)).not.toBeInTheDocument();
  });
});
