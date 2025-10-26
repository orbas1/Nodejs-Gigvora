import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CalendarSyncBadge from '../CalendarSyncBadge.jsx';
import useCalendarSync from '../../../hooks/useCalendarSync.js';
import usePresence from '../../../hooks/usePresence.js';

vi.mock('../../../hooks/useCalendarSync.js');
vi.mock('../../../hooks/usePresence.js');

const mockUseCalendarSync = useCalendarSync;
const mockUsePresence = usePresence;

describe('CalendarSyncBadge', () => {
  let refreshMock;

  beforeEach(() => {
    refreshMock = vi.fn();
    mockUseCalendarSync.mockReturnValue({
      status: { data: { state: 'synced', lastSyncedAt: '2024-01-01T09:00:00Z' }, loading: false, error: null, refresh: refreshMock },
      events: { data: { events: [{ id: 'evt-1', title: 'Investor sync', startsAt: '2024-01-01T12:00:00Z' }] }, loading: false, error: null },
      refresh: refreshMock,
      nextEvents: [{ id: 'evt-1', title: 'Investor sync', startsAt: '2024-01-01T12:00:00Z' }],
    });
    mockUsePresence.mockReturnValue({ summary: null });
  });

  it('shows sync status and refresh action', () => {
    render(<CalendarSyncBadge userId="user-1" displayName="Sky" />);

    expect(screen.getByText(/Sky’s scheduling signal/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /refresh calendar sync/i }));
    expect(refreshMock).toHaveBeenCalled();
  });
});
