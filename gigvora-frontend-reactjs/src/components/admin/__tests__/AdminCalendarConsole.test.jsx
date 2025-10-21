import { act, render, screen, waitFor, within } from '@testing-library/react';
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

async function renderConsole(props = {}) {
  let view;

  await act(async () => {
    view = render(
      <MemoryRouter>
        <AdminCalendarConsole {...props} />
      </MemoryRouter>,
    );
  });

  return view;
}

describe('AdminCalendarConsole', () => {
  let user;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup({
      eventWrapper: async (callback) => {
        await act(async () => {
          await callback();
        });
      },
    });
  });

  it('renders loaded data and allows refreshing the console snapshot', async () => {
    fetchAdminCalendarConsole.mockImplementation(() => Promise.resolve(baseConsolePayload));

    await renderConsole();

    expect(await screen.findByRole('heading', { name: /calendar/i })).toBeInTheDocument();
    const refreshButton = await screen.findByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(fetchAdminCalendarConsole.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('submits a new calendar account and surfaces success messaging', async () => {
    fetchAdminCalendarConsole.mockResolvedValue(emptyConsolePayload);
    createAdminCalendarAccount.mockResolvedValue({ id: 99 });

    await renderConsole();

    await user.click(await screen.findByRole('button', { name: 'Accounts' }));
    await user.click(screen.getByRole('button', { name: /new account/i }));

    await user.selectOptions(screen.getByLabelText('Provider'), 'google');
    await user.type(screen.getByLabelText('Account email'), 'admin-calendar@gigvora.com');
    await user.type(screen.getByLabelText('Display name'), 'Admin Calendar');
    const timezoneField = screen.getByLabelText('Time zone');
    await user.clear(timezoneField);
    await user.type(timezoneField, 'UTC');
    await user.selectOptions(screen.getByLabelText('Sync status'), 'connected');

    await user.click(screen.getByRole('button', { name: /save account/i }));

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

    await renderConsole();

    expect(await screen.findByText(/calendar console offline/i)).toBeInTheDocument();
  });

  it('persists availability updates for the selected account', async () => {
    fetchAdminCalendarConsole.mockImplementation(() => Promise.resolve(baseConsolePayload));
    updateAdminCalendarAvailability.mockResolvedValueOnce({ success: true });

    await renderConsole();

    const navigation = await screen.findByRole('navigation');
    const slotsNavButton = within(navigation).getByRole('button', { name: 'Slots' });
    await user.click(slotsNavButton);
    expect(await screen.findByRole('heading', { name: 'Slots' })).toBeInTheDocument();

    const card = await screen.findByText('Operations Calendar');
    const slotsCard = card.closest('[class*="rounded-3xl"]');
    const slotsWithin = within(slotsCard);
    await user.click(slotsWithin.getByRole('button', { name: /edit slots/i }));

    const overrideField = await screen.findByLabelText('Time zone override');
    await user.clear(overrideField);
    await user.type(overrideField, 'Europe/Berlin');
    await user.clear(screen.getAllByLabelText('Start')[0]);
    await user.type(screen.getAllByLabelText('Start')[0], '08:00');
    await user.clear(screen.getAllByLabelText('End')[0]);
    await user.type(screen.getAllByLabelText('End')[0], '11:00');

    await user.click(screen.getByRole('button', { name: /save slots/i }));

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

    await renderConsole();

    await user.click(await screen.findByRole('button', { name: 'Events' }));
    await user.click(screen.getByRole('button', { name: /new event/i }));

    await user.type(screen.getByLabelText('Title'), 'Launch rehearsal');
    await user.selectOptions(screen.getByLabelText('Account'), '10');
    await user.type(screen.getByLabelText('Starts'), '2024-11-05T09:30');
    await user.type(screen.getByLabelText('Ends'), '2024-11-05T10:00');

    await user.click(screen.getByRole('button', { name: /save event/i }));

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

    await renderConsole();

    const quickCard = await screen.findByTestId('calendar-quick-actions');
    const quickScope = within(quickCard);

    await user.click(quickScope.getByRole('button', { name: /new event/i }));
    expect(await screen.findByLabelText('Title')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    });

    await user.click(quickScope.getByRole('button', { name: /^slots$/i }));
    expect(await screen.findByLabelText('Time zone override')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText('Time zone override')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Overview' }));
    const refreshedQuick = screen.getByTestId('calendar-quick-actions');
    const refreshedScope = within(refreshedQuick);

    await user.click(refreshedScope.getByRole('button', { name: /new type/i }));
    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
  });
});
