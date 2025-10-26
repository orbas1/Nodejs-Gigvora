import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HuddleRoomLauncher from '../HuddleRoomLauncher.jsx';
import useHuddleLauncher from '../../../hooks/useHuddleLauncher.js';
import usePresence from '../../../hooks/usePresence.js';

vi.mock('../../../hooks/useHuddleLauncher.js');
vi.mock('../../../hooks/usePresence.js');

const mockUseHuddleLauncher = useHuddleLauncher;
const mockUsePresence = usePresence;

describe('HuddleRoomLauncher', () => {
  let launchNowMock;

  beforeEach(() => {
    mockUsePresence.mockReturnValue({
      summary: {
        label: 'Available',
        nextEvent: { title: 'Pitch run-through', startsAt: '2024-01-01T12:00:00Z' },
        calendar: { lastSyncedAt: '2024-01-01T10:00:00Z' },
      },
      loading: false,
      error: null,
    });

    launchNowMock = vi.fn().mockResolvedValue({ id: 'huddle-1' });

    mockUseHuddleLauncher.mockReturnValue({
      context: { data: { templates: [], focusRooms: [{ id: 'room-1', name: 'Product war room' }] }, loading: false, error: null, refresh: vi.fn() },
      recommendedParticipants: [
        { id: '1', name: 'Nova Patel', role: 'Product Lead' },
      ],
      launchNow: launchNowMock,
      schedule: vi.fn().mockResolvedValue({ id: 'huddle-2' }),
    });
  });

  it('renders recommended participants and triggers instant launch', async () => {
    render(<HuddleRoomLauncher hostId="user-1" workspaceId="ws-1" />);

    expect(screen.getByText('Nova Patel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /launch live huddle/i }));
    expect(launchNowMock).toHaveBeenCalled();
  });
});
