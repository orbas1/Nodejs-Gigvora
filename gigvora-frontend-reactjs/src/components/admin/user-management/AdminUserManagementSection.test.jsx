import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUserManagementSection from './AdminUserManagementSection.jsx';
import * as adminUsers from '../../../services/adminUsers.js';

vi.mock('../../../services/adminUsers.js', () => {
  const fetchDirectory = vi.fn();
  const fetchMetadata = vi.fn();
  const createUser = vi.fn();
  const updateStatus = vi.fn();

  return {
    fetchDirectory,
    fetchMetadata,
    createUser,
    updateStatus,
    default: {
      fetchDirectory,
      fetchMetadata,
      createUser,
      updateStatus,
    },
  };
});

describe('AdminUserManagementSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads directory data, opens the wizard, and updates user status', async () => {
    adminUsers.fetchDirectory.mockResolvedValue({
      items: [
        {
          id: '1',
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          roles: ['admin', 'owner'],
          status: 'active',
          createdAt: '2024-01-10T10:00:00.000Z',
        },
      ],
      summary: { counts: { active: 5, invited: 2, suspended: 1 } },
    });
    adminUsers.fetchMetadata.mockResolvedValue({
      statuses: ['invited', 'active'],
      memberships: ['user', 'admin'],
      roles: ['admin', 'manager'],
    });
    adminUsers.updateStatus.mockResolvedValue({});
    adminUsers.createUser.mockResolvedValue({});

    const user = userEvent.setup();
    render(<AdminUserManagementSection />);

    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument());
    expect(screen.getByText('Active workspace members across all roles.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /create user/i }));
    await waitFor(() => expect(screen.getByRole('dialog', { name: /new user/i })).toBeInTheDocument());
    expect(adminUsers.fetchMetadata).toHaveBeenCalled();

    const wizard = screen.getByRole('dialog', { name: /new user/i });
    await user.click(within(wizard).getByRole('button', { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /new user/i })).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /suspend/i }));
    const confirmDialog = await screen.findByRole('dialog', { name: /suspend user/i });
    await user.click(within(confirmDialog).getByRole('button', { name: /confirm/i }));

    await waitFor(() => expect(adminUsers.updateStatus).toHaveBeenCalledWith('1', { status: 'suspended', reason: '' }));
    await waitFor(() => expect(adminUsers.fetchDirectory).toHaveBeenCalledTimes(2));
  });

  it('surfaces directory load errors to the operator', async () => {
    adminUsers.fetchDirectory.mockRejectedValueOnce(new Error('Network unavailable'));

    render(<AdminUserManagementSection />);

    await waitFor(() => expect(screen.getByText('Network unavailable')).toBeInTheDocument());
  });
});
