import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../../services/creationStudio.js', () => ({
  listCreationStudioItems: vi.fn(),
}));

vi.mock('../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

import { listCreationStudioItems } from '../../../services/creationStudio.js';
import useSession from '../../../hooks/useSession.js';
import CreationStudioSnapshot from '../CreationStudioSnapshot.jsx';

const mockUseSession = useSession;

describe('CreationStudioSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks visitors to sign in when unauthenticated', () => {
    mockUseSession.mockReturnValue({ session: null, isAuthenticated: false });

    render(<CreationStudioSnapshot />);

    expect(screen.getByText(/sign in to view your creation studio snapshot/i)).toBeInTheDocument();
    expect(listCreationStudioItems).not.toHaveBeenCalled();
  });

  it('blocks users without creator roles', () => {
    mockUseSession.mockReturnValue({
      session: { id: 42, memberships: ['viewer'] },
      isAuthenticated: true,
    });

    render(<CreationStudioSnapshot />);

    expect(
      screen.getByText(/doesn't have creation studio access yet/i),
    ).toBeInTheDocument();
    expect(listCreationStudioItems).not.toHaveBeenCalled();
  });

  it('renders recent creations once loaded', async () => {
    const items = [
      {
        id: 'item-1',
        title: 'Launch blueprint',
        status: 'draft',
        type: 'gig',
        updatedAt: '2024-07-01T00:00:00.000Z',
      },
    ];
    mockUseSession.mockReturnValue({
      session: { id: 99, memberships: ['freelancer'] },
      isAuthenticated: true,
    });
    listCreationStudioItems.mockResolvedValue({ items });

    render(<CreationStudioSnapshot />);

    expect(screen.getByText(/loading your recent creations/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(listCreationStudioItems).toHaveBeenCalledWith(
        { ownerId: 99, pageSize: 5 },
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    expect(await screen.findByText('Launch blueprint')).toBeInTheDocument();
    expect(screen.queryByText(/no launches yet/i)).not.toBeInTheDocument();
  });

  it('surfaces an error state when the request fails', async () => {
    mockUseSession.mockReturnValue({
      session: { id: 55, memberships: ['agency'] },
      isAuthenticated: true,
    });
    listCreationStudioItems.mockRejectedValueOnce(new Error('Network down'));

    render(<CreationStudioSnapshot />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load your recent creations/i)).toBeInTheDocument();
    });
  });
});

