import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import UserNetworkingSection from '../UserNetworkingSection.jsx';
import { listNetworkingSessions } from '../../../services/networking.js';
import {
  createUserNetworkingBooking,
  createUserNetworkingPurchase,
  createUserNetworkingConnection,
} from '../../../services/userNetworking.js';

vi.mock('../../../services/networking.js', () => ({
  listNetworkingSessions: vi.fn(),
}));

vi.mock('../../../services/userNetworking.js', () => ({
  createUserNetworkingBooking: vi.fn(),
  createUserNetworkingPurchase: vi.fn(),
  createUserNetworkingConnection: vi.fn(),
}));

const userId = 'user-123';

const baseNetworking = {
  summary: {
    sessionsBooked: 4,
    upcomingSessions: 2,
    completedSessions: 1,
    totalSpendCents: 12500,
    pendingSpendCents: 2500,
    refundedCents: 1500,
    averageSatisfaction: 4.6,
    connectionsTracked: 3,
    followStatusCounts: { connected: 2, saved: 1 },
    checkedInCount: 2,
    currency: 'USD',
  },
  bookings: {
    list: [
      {
        id: 'bk-1',
        status: 'registered',
        seatNumber: 5,
        joinUrl: 'https://meet.example.com',
        checkedInAt: '2024-05-21T10:00:00.000Z',
        completedAt: null,
        sessionId: 201,
        session: { id: 201, title: 'Growth Sprint' },
      },
    ],
  },
  purchases: {
    currency: 'USD',
    list: [
      {
        id: 'po-1',
        amountCents: 5600,
        currency: 'USD',
        status: 'paid',
        purchasedAt: '2024-05-22T12:00:00.000Z',
        reference: 'INV-100',
        notes: 'Initial payment',
        sessionId: 201,
        session: { id: 201, title: 'Growth Sprint' },
      },
    ],
  },
  connections: {
    list: [
      {
        id: 'conn-1',
        connectionName: 'Ava Martin',
        connectionEmail: 'ava@gigvora.com',
        connectionHeadline: 'Growth Lead',
        connectionCompany: 'Civic Labs',
        followStatus: 'connected',
        connectedAt: '2024-05-20T09:00:00.000Z',
        lastContactedAt: '2024-05-21T09:00:00.000Z',
        sessionId: 201,
        session: { id: 201, title: 'Growth Sprint' },
        tags: ['mentor'],
      },
    ],
  },
};

describe('UserNetworkingSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary metrics and filters listings by tab', async () => {
    listNetworkingSessions.mockResolvedValue({ sessions: [] });

    render(<UserNetworkingSection userId={userId} networking={baseNetworking} onRefresh={vi.fn()} />);

    expect(await screen.findByText('Networking')).toBeInTheDocument();
    expect(screen.getByText('4.6/5')).toBeInTheDocument();

    const sessionButtons = screen.getAllByRole('button', { name: 'Sessions' });
    await userEvent.click(sessionButtons[sessionButtons.length - 1]);
    expect(await screen.findByText('Growth Sprint')).toBeInTheDocument();

    const spendButtons = screen.getAllByRole('button', { name: 'Spend' });
    await userEvent.click(spendButtons[spendButtons.length - 1]);
    expect(await screen.findByText('Initial payment')).toBeInTheDocument();

    const peopleButtons = screen.getAllByRole('button', { name: 'People' });
    await userEvent.click(peopleButtons[peopleButtons.length - 1]);
    expect(await screen.findByText('Ava Martin')).toBeInTheDocument();

    await waitFor(() => {
      expect(listNetworkingSessions).toHaveBeenCalled();
    });
  });

  it('creates bookings, spend, and connections then refreshes data', async () => {
    listNetworkingSessions.mockResolvedValue({
      sessions: [
        { id: 301, title: 'Partnership Lab' },
      ],
    });
    createUserNetworkingBooking.mockResolvedValue({ id: 'bk-new' });
    createUserNetworkingPurchase.mockResolvedValue({ id: 'po-new' });
    createUserNetworkingConnection.mockResolvedValue({ id: 'conn-new' });

    const onRefresh = vi.fn(() => Promise.resolve());

    render(<UserNetworkingSection userId={userId} networking={baseNetworking} onRefresh={onRefresh} />);

    const bookingButton = screen.getByRole('button', { name: 'Book' });
    await userEvent.click(bookingButton);

    const bookingDialog = await screen.findByRole('dialog', { name: /add session booking/i });
    const sessionField = within(bookingDialog).getByPlaceholderText('Session ID');
    await userEvent.type(sessionField, '301');
    await userEvent.type(within(bookingDialog).getByLabelText('Email'), 'guest@gigvora.com');
    await userEvent.type(within(bookingDialog).getByLabelText('Name'), 'Jordan Impact');
    await userEvent.type(within(bookingDialog).getByLabelText('Seat'), '7');
    await userEvent.type(within(bookingDialog).getByLabelText('Link'), 'https://join.example.com');
    await userEvent.type(within(bookingDialog).getByLabelText('Check-in'), '2024-05-20T10:00');
    await userEvent.type(within(bookingDialog).getByLabelText('Completed'), '2024-05-20T11:00');
    await userEvent.type(within(bookingDialog).getByLabelText('Notes'), 'Bring extra materials');
    await userEvent.click(within(bookingDialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createUserNetworkingBooking).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          sessionId: 301,
          participantEmail: 'guest@gigvora.com',
          participantName: 'Jordan Impact',
          seatNumber: 7,
          joinUrl: 'https://join.example.com',
          userNotes: 'Bring extra materials',
        }),
      );
    });

    await screen.findByText('Booking saved.');
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    onRefresh.mockClear();

    const spendQuickAction = screen.getAllByRole('button', { name: 'Spend' }).at(-1);
    await userEvent.click(spendQuickAction);

    const spendDialog = await screen.findByRole('dialog', { name: /add session spend/i });
    await userEvent.type(within(spendDialog).getByPlaceholderText('Session ID'), '301');
    await userEvent.type(within(spendDialog).getByLabelText('Amount'), '275.5');
    const currencyField = within(spendDialog).getByLabelText('Currency');
    await userEvent.clear(currencyField);
    await userEvent.type(currencyField, 'eur');
    await userEvent.type(within(spendDialog).getByLabelText('Purchased'), '2024-05-22T12:00');
    await userEvent.type(within(spendDialog).getByLabelText('Reference'), 'INV-22');
    await userEvent.type(within(spendDialog).getByLabelText('Notes'), 'Paid by card');
    await userEvent.click(within(spendDialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createUserNetworkingPurchase).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          sessionId: 301,
          amount: 275.5,
          currency: 'EUR',
          reference: 'INV-22',
          notes: 'Paid by card',
        }),
      );
    });
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    onRefresh.mockClear();

    const peopleQuickAction = screen.getAllByRole('button', { name: 'People' }).at(-1);
    await userEvent.click(peopleQuickAction);

    const peopleDialog = await screen.findByRole('dialog', { name: /add connection/i });
    await userEvent.type(within(peopleDialog).getByLabelText('Name'), 'Kai Builder');
    await userEvent.type(within(peopleDialog).getByLabelText('Email'), 'kai@gigvora.com');
    await userEvent.selectOptions(within(peopleDialog).getByLabelText('Status'), 'connected');
    await userEvent.type(within(peopleDialog).getByPlaceholderText('Session ID'), '301');
    await userEvent.type(within(peopleDialog).getByLabelText('Connected'), '2024-05-24T09:30');
    await userEvent.type(within(peopleDialog).getByLabelText('Follow-up'), '2024-05-25T15:00');
    await userEvent.type(within(peopleDialog).getByLabelText('User'), '77');
    await userEvent.type(within(peopleDialog).getByLabelText('Tags'), 'mentor, intro');
    await userEvent.type(within(peopleDialog).getByLabelText('Notes'), 'Met at the partnership lab');
    await userEvent.click(within(peopleDialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(createUserNetworkingConnection).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          connectionName: 'Kai Builder',
          connectionEmail: 'kai@gigvora.com',
          followStatus: 'connected',
          sessionId: 301,
          connectionUserId: 77,
          tags: ['mentor', 'intro'],
          notes: 'Met at the partnership lab',
        }),
      );
    });
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });
});
