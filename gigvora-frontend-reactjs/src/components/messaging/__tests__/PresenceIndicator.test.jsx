import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PresenceIndicator from '../PresenceIndicator.jsx';
import usePresence from '../../../hooks/usePresence.js';

vi.mock('../../../hooks/usePresence.js');

const mockUsePresence = usePresence;

describe('PresenceIndicator', () => {
  beforeEach(() => {
    mockUsePresence.mockReturnValue({
      summary: {
        state: 'available',
        label: 'Available',
        tone: 'bg-emerald-50 text-emerald-700 ring-emerald-500/40',
        customMessage: 'Ready to connect',
        timeline: [
          { id: '1', type: 'status', startAt: '2024-01-01T09:00:00Z', title: 'Available' },
        ],
        calendar: { lastSyncedAt: '2024-01-01T08:45:00Z' },
      },
      availableStatuses: [
        { value: 'available', label: 'Available' },
        { value: 'focus', label: 'Focus mode' },
      ],
      loading: false,
      error: null,
      setAvailability: vi.fn(),
      startFocus: vi.fn(),
      endFocus: vi.fn(),
      triggerCalendarRefresh: vi.fn(),
    });
  });

  it('renders presence context and allows status selection', () => {
    render(<PresenceIndicator memberId="user-1" displayName="Jordan" />);

    expect(screen.getByText('Jordan')).toBeInTheDocument();
    expect(screen.getByText(/Live presence context/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /available/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
