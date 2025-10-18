import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import AdminCalendarConsole from '../AdminCalendarConsole.jsx';
import {
  fetchAdminCalendarConsole,
  createAdminCalendarAccount,
  updateAdminCalendarAvailability,
  createAdminCalendarEvent,
} from '../../../services/adminCalendar.js';

vi.mock('../../../services/adminCalendar.js', () => ({
  fetchAdminCalendarConsole: vi.fn(),
  createAdminCalendarAccount: vi.fn(),
  updateAdminCalendarAccount: vi.fn(),
  deleteAdminCalendarAccount: vi.fn(),
  updateAdminCalendarAvailability: vi.fn(),
  createAdminCalendarTemplate: vi.fn(),
  updateAdminCalendarTemplate: vi.fn(),
  deleteAdminCalendarTemplate: vi.fn(),
  createAdminCalendarEvent: vi.fn(),
  updateAdminCalendarEvent: vi.fn(),
  deleteAdminCalendarEvent: vi.fn(),
}));

const baseConsolePayload = {
  metrics: {
    accounts: { total: 2, connected: 2, needsAttention: 0, lastSyncedAt: '2024-10-30T10:00:00.000Z' },
    templates: { total: 1, active: 1 },
    events: { total: 2, upcoming: 1, published: 1, scheduled: 1 },
  },
  accounts: [
    {
      id: 10,
      provider: 'google',
      accountEmail: 'ops-calendar@gigvora.com',
      displayName: 'Operations Calendar',
      syncStatus: 'connected',
      timezone: 'UTC',
      lastSyncedAt: '2024-10-30T10:00:00.000Z',
    },
    {
      id: 12,
      provider: 'microsoft',
      accountEmail: 'security-calendar@gigvora.com',
      displayName: 'Security Calendar',
      syncStatus: 'syncing',
      timezone: 'America/New_York',
      lastSyncedAt: '2024-10-30T09:45:00.000Z',
    },
  ],
  templates: [
    {
      id: 21,
      name: 'Incident review',
      defaultEventType: 'ops_review',
      defaultVisibility: 'internal',
      durationMinutes: 60,
      defaultAllowedRoles: ['admin'],
      isActive: true,
    },
  ],
  events: [
    {
      id: 31,
      title: 'Weekly Operations Review',
      eventType: 'ops_review',
      visibility: 'internal',
      status: 'scheduled',
      startsAt: '2024-11-01T09:00:00.000Z',
      endsAt: '2024-11-01T10:00:00.000Z',
      calendarAccount: { id: 10, displayName: 'Operations Calendar' },
    },
  ],
  availability: {
    10: {
      timezone: 'UTC',
      windows: [
        {
          id: 'mon-ops',
          dayOfWeek: 1,
          startTimeMinutes: 540,
          endTimeMinutes: 1020,
          timezone: 'UTC',
        },
      ],
    },
  },
};

const emptyConsolePayload = {
  metrics: { accounts: {}, templates: {}, events: {} },
  accounts: [],
  templates: [],
  events: [],
  availability: {},
};

function renderConsole(props = {}) {
  return render(
    <MemoryRouter>
      <AdminCalendarConsole {...props} />
    </MemoryRouter>,
  );
}

describe('AdminCalendarConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loaded data and allows refreshing the console snapshot', async () => {
    fetchAdminCalendarConsole.mockImplementation(() => Promise.resolve(baseConsolePayload));

    renderConsole();

    expect(await screen.findByRole('heading', { name: /calendar/i })).toBeInTheDocument();
    const refreshButton = await screen.findByRole('button', { name: /refresh/i });
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(fetchAdminCalendarConsole.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('submits a new calendar account and surfaces success messaging', async () => {
    fetchAdminCalendarConsole.mockResolvedValue(emptyConsolePayload);
    createAdminCalendarAccount.mockResolvedValue({ id: 99 });

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Accounts' }));
    await userEvent.click(screen.getByRole('button', { name: /new account/i }));

    await userEvent.selectOptions(screen.getByLabelText('Provider'), 'google');
    await userEvent.type(screen.getByLabelText('Account email'), 'admin-calendar@gigvora.com');
    await userEvent.type(screen.getByLabelText('Display name'), 'Admin Calendar');
    const timezoneField = screen.getByLabelText('Time zone');
    await userEvent.clear(timezoneField);
    await userEvent.type(timezoneField, 'UTC');
    await userEvent.selectOptions(screen.getByLabelText('Sync status'), 'connected');

    await userEvent.click(screen.getByRole('button', { name: /save account/i }));

    await waitFor(() => {
      expect(createAdminCalendarAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
          accountEmail: 'admin-calendar@gigvora.com',
          displayName: 'Admin Calendar',
          timezone: 'UTC',
          syncStatus: 'connected',
        }),
      );
    });

    expect(await screen.findByText('Account connected.')).toBeInTheDocument();
  });

  it('surfaces backend failures while loading console data', async () => {
    fetchAdminCalendarConsole.mockRejectedValueOnce(new Error('calendar console offline'));

    renderConsole();

    expect(await screen.findByText(/calendar console offline/i)).toBeInTheDocument();
  });

  it('persists availability updates for the selected account', async () => {
    fetchAdminCalendarConsole.mockImplementation(() => Promise.resolve(baseConsolePayload));
    updateAdminCalendarAvailability.mockResolvedValueOnce({ success: true });

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Slots' }));
    expect(await screen.findByRole('heading', { name: 'Slots' })).toBeInTheDocument();

    const card = await screen.findByText('Operations Calendar');
    const slotsCard = card.closest('[class*="rounded-3xl"]');
    const slotsWithin = within(slotsCard);
    await userEvent.click(slotsWithin.getByRole('button', { name: /edit slots/i }));

    const overrideField = await screen.findByLabelText('Time zone override');
    await userEvent.clear(overrideField);
    await userEvent.type(overrideField, 'Europe/Berlin');
    await userEvent.clear(screen.getAllByLabelText('Start')[0]);
    await userEvent.type(screen.getAllByLabelText('Start')[0], '08:00');
    await userEvent.clear(screen.getAllByLabelText('End')[0]);
    await userEvent.type(screen.getAllByLabelText('End')[0], '11:00');

    await userEvent.click(screen.getByRole('button', { name: /save slots/i }));

    await waitFor(() => {
      expect(updateAdminCalendarAvailability).toHaveBeenCalledWith(10, expect.any(Object));
    });
  });

  it('creates events using captured form state', async () => {
    fetchAdminCalendarConsole.mockImplementation(() => Promise.resolve({
      ...baseConsolePayload,
      events: [],
    }));
    createAdminCalendarEvent.mockResolvedValueOnce({ id: 401 });

    renderConsole();

    await userEvent.click(await screen.findByRole('button', { name: 'Events' }));
    await userEvent.click(screen.getByRole('button', { name: /new event/i }));

    await userEvent.type(screen.getByLabelText('Title'), 'Launch rehearsal');
    await userEvent.selectOptions(screen.getByLabelText('Account'), '10');
    await userEvent.type(screen.getByLabelText('Starts'), '2024-11-05T09:30');
    await userEvent.type(screen.getByLabelText('Ends'), '2024-11-05T10:00');

    await userEvent.click(screen.getByRole('button', { name: /save event/i }));

    await waitFor(() => {
      expect(createAdminCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Launch rehearsal',
          startsAt: '2024-11-05T09:30:00.000Z',
          endsAt: '2024-11-05T10:00:00.000Z',
        }),
      );
    });
  });

  it('launches quick actions from the overview drawer', async () => {
    fetchAdminCalendarConsole.mockImplementation(() =>
      Promise.resolve({
        ...baseConsolePayload,
        accounts: [baseConsolePayload.accounts[0]],
      }),
    );

    renderConsole();

    const quickCard = await screen.findByTestId('calendar-quick-actions');
    const quickScope = within(quickCard);

    await userEvent.click(quickScope.getByRole('button', { name: /new event/i }));
    expect(await screen.findByLabelText('Title')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    });

    await userEvent.click(quickScope.getByRole('button', { name: /^slots$/i }));
    expect(await screen.findByLabelText('Time zone override')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText('Time zone override')).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Overview' }));
    const refreshedQuick = screen.getByTestId('calendar-quick-actions');
    const refreshedScope = within(refreshedQuick);

    await userEvent.click(refreshedScope.getByRole('button', { name: /new type/i }));
    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
  });
});
