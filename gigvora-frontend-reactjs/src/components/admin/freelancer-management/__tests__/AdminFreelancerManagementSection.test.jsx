import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminFreelancerManagementSection from '../AdminFreelancerManagementSection.jsx';

vi.mock('../../../../services/adminFreelancers.js', () => ({
  listAdminFreelancers: vi.fn(),
  fetchAdminFreelancerStats: vi.fn(),
  createAdminFreelancer: vi.fn(),
  updateAdminFreelancer: vi.fn(),
  archiveAdminFreelancer: vi.fn(),
  reactivateAdminFreelancer: vi.fn(),
  sendAdminFreelancerInvite: vi.fn(),
}));

import {
  listAdminFreelancers,
  fetchAdminFreelancerStats,
  createAdminFreelancer,
  updateAdminFreelancer,
  archiveAdminFreelancer,
  reactivateAdminFreelancer,
  sendAdminFreelancerInvite,
} from '../../../../services/adminFreelancers.js';

const baseFreelancers = [
  {
    id: 'freelancer-1',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex@gigvora.com',
    location: 'Berlin, Germany',
    status: 'active',
    hourlyRate: 120,
    availability: 'immediate',
    skills: ['React', 'Node.js'],
    verified: true,
  },
  {
    id: 'freelancer-2',
    firstName: 'Jamie',
    lastName: 'Stone',
    email: 'jamie@gigvora.com',
    location: 'Paris, France',
    status: 'invited',
    hourlyRate: null,
    availability: 'two_weeks',
    skills: ['Design'],
    verified: false,
  },
  {
    id: 'freelancer-3',
    firstName: 'Casey',
    lastName: 'Lee',
    email: 'casey@gigvora.com',
    location: 'Rome, Italy',
    status: 'archived',
    hourlyRate: 95,
    availability: 'project',
    skills: [],
    verified: false,
  },
];

const defaultStats = {
  total: 30,
  active: 20,
  verified: 10,
  invited: 5,
  suspended: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  listAdminFreelancers.mockResolvedValue({
    items: baseFreelancers,
    pagination: { page: 1, pageSize: 20, totalPages: 1, total: baseFreelancers.length },
  });
  fetchAdminFreelancerStats.mockResolvedValue(defaultStats);
  createAdminFreelancer.mockResolvedValue({ id: 'freelancer-new' });
  updateAdminFreelancer.mockResolvedValue({});
  archiveAdminFreelancer.mockResolvedValue({});
  reactivateAdminFreelancer.mockResolvedValue({});
  sendAdminFreelancerInvite.mockResolvedValue({});
});

describe('AdminFreelancerManagementSection', () => {
  it('renders summary cards and freelancer rows', async () => {
    render(<AdminFreelancerManagementSection />);

    await screen.findByText('Alex Johnson');

    expect(listAdminFreelancers).toHaveBeenCalled();
    expect(fetchAdminFreelancerStats).toHaveBeenCalled();
    expect(screen.getByText('Talent roster')).toBeInTheDocument();
    expect(screen.getByText('Freelancers')).toBeInTheDocument();
    expect(screen.getByText(String(defaultStats.total))).toBeInTheDocument();
    expect(screen.getByText('Jamie Stone')).toBeInTheDocument();
  });

  it('applies search and status filters', async () => {
    render(<AdminFreelancerManagementSection />);
    await screen.findByText('Alex Johnson');

    listAdminFreelancers.mockClear();

    fireEvent.change(screen.getByPlaceholderText('Search by name, email, skills'), {
      target: { value: 'alex' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(listAdminFreelancers).toHaveBeenCalled());
    expect(listAdminFreelancers.mock.calls[0][0]).toMatchObject({
      search: 'alex',
      status: undefined,
      page: 1,
      pageSize: 20,
    });

    listAdminFreelancers.mockClear();

    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: 'invited' } });

    await waitFor(() => expect(listAdminFreelancers).toHaveBeenCalled());
    expect(listAdminFreelancers.mock.calls[0][0]).toMatchObject({
      status: 'invited',
      page: 1,
    });
  });

  it('creates a freelancer and refreshes data', async () => {
    render(<AdminFreelancerManagementSection />);
    await screen.findByText('Alex Johnson');

    fireEvent.click(screen.getByRole('button', { name: 'New freelancer' }));
    await screen.findByRole('heading', { name: 'Add freelancer' });

    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Morgan' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Reeves' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'morgan@gigvora.com' } });
    fireEvent.change(screen.getByLabelText('Hourly rate (USD)'), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Skills', { exact: false }), { target: { value: 'React, Node.js' } });
    fireEvent.change(screen.getByLabelText('Industries', { exact: false }), { target: { value: 'Fintech' } });
    fireEvent.click(screen.getByLabelText('Verified profile (ID & compliance checks complete)'));

    fireEvent.click(screen.getByRole('button', { name: 'Save freelancer' }));

    await waitFor(() => expect(createAdminFreelancer).toHaveBeenCalled());
    const payload = createAdminFreelancer.mock.calls[0][0];
    expect(payload).toMatchObject({
      firstName: 'Morgan',
      lastName: 'Reeves',
      email: 'morgan@gigvora.com',
      hourlyRate: 120,
      verified: true,
      skills: ['React', 'Node.js'],
      industries: ['Fintech'],
    });

    await waitFor(() => expect(listAdminFreelancers.mock.calls.length).toBeGreaterThanOrEqual(2));
    await waitFor(() => expect(fetchAdminFreelancerStats.mock.calls.length).toBeGreaterThanOrEqual(2));

  });

  it('updates an existing freelancer', async () => {
    render(<AdminFreelancerManagementSection />);
    await screen.findByText('Alex Johnson');

    const row = screen.getByText('Alex Johnson').closest('tr');
    expect(row).not.toBeNull();
    const editButton = within(row).getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    await screen.findByRole('heading', { name: 'Edit freelancer' });
    const lastNameField = screen.getByLabelText('Last name');
    fireEvent.change(lastNameField, { target: { value: 'Mason' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save freelancer' }));

    await waitFor(() => expect(updateAdminFreelancer).toHaveBeenCalledWith('freelancer-1', expect.any(Object)));
    const [, updatePayload] = updateAdminFreelancer.mock.calls[0];
    expect(updatePayload.lastName).toBe('Mason');

  });

  it('handles archive, reactivate, and invite flows', async () => {
    render(<AdminFreelancerManagementSection />);
    await screen.findByText('Casey Lee');

    const activeRow = screen.getByText('Alex Johnson').closest('tr');
    const archiveButton = within(activeRow).getByRole('button', { name: 'Archive' });
    fireEvent.click(archiveButton);
    await waitFor(() => expect(archiveAdminFreelancer).toHaveBeenCalledWith('freelancer-1'));

    const archivedRow = screen.getByText('Casey Lee').closest('tr');
    const activateButton = within(archivedRow).getByRole('button', { name: 'Activate' });
    fireEvent.click(activateButton);
    await waitFor(() => expect(reactivateAdminFreelancer).toHaveBeenCalledWith('freelancer-3'));

    const invitedRow = screen.getByText('Jamie Stone').closest('tr');
    const resendButton = within(invitedRow).getByRole('button', { name: 'Resend' });
    fireEvent.click(resendButton);
    await waitFor(() => expect(sendAdminFreelancerInvite).toHaveBeenCalledWith('freelancer-2'));

  });

  it('shows an error when the roster cannot be loaded', async () => {
    listAdminFreelancers.mockRejectedValueOnce(new Error('Network failure'));

    render(<AdminFreelancerManagementSection />);

    await screen.findByText('Network failure');
    expect(screen.getByText('No freelancers found.')).toBeInTheDocument();
  });
});
