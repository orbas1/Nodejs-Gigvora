import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SessionCatalog from '../SessionCatalog.jsx';

const SAMPLE_SESSION = {
  id: 'session-1',
  title: 'Mentor table: Product leadership',
  startTime: '2024-05-01T12:00:00Z',
  endTime: '2024-05-01T13:00:00Z',
  hostName: 'Alex Mercer',
  priceCents: 12500,
};

describe('SessionCatalog', () => {
  it('renders a loading state with polite status', () => {
    render(<SessionCatalog sessions={[]} loading onReserve={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading sessions…');
  });

  it('renders an empty state when no sessions are available', () => {
    render(<SessionCatalog sessions={[]} loading={false} />);

    expect(screen.getByText('No sessions ready')).toBeInTheDocument();
    expect(screen.getByText('Check back soon or ask your concierge for upcoming tables.')).toBeInTheDocument();
  });

  it('renders sessions and triggers reserve handler when provided', () => {
    const handleReserve = vi.fn();

    render(<SessionCatalog sessions={[SAMPLE_SESSION]} loading={false} onReserve={handleReserve} />);

    fireEvent.click(screen.getByRole('button', { name: /reserve/i }));

    expect(handleReserve).toHaveBeenCalledTimes(1);
    expect(handleReserve).toHaveBeenCalledWith(expect.objectContaining({ id: SAMPLE_SESSION.id }));
  });

  it('disables the reserve action when no handler is provided', () => {
    render(<SessionCatalog sessions={[SAMPLE_SESSION]} loading={false} />);

    const reserveButton = screen.getByRole('button', { name: /reserve/i });
    expect(reserveButton).toBeDisabled();
  });
});
