import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MentorshipManagementSection from '../MentorshipManagementSection.jsx';

describe('MentorshipManagementSection', () => {
  const baseSegments = [
    { id: 'active', title: 'Active mentees', description: 'Currently in programme' },
    { id: 'waitlist', title: 'Waitlist', description: 'Queued for onboarding' },
  ];

  const baseBookings = [
    {
      id: 'bk-1',
      mentee: 'Jordan Lee',
      role: 'PM',
      package: 'Foundations',
      focus: 'Product rituals',
      scheduledAt: '2024-07-01T10:30:00Z',
      status: 'Scheduled',
      price: 250,
      currency: '£',
      paymentStatus: 'Pending',
      channel: 'Explorer',
      segment: 'active',
      conferenceLink: 'https://meet.example.com/jordan',
      notes: 'Send notion workspace.',
    },
  ];

  const renderComponent = (overrideProps = {}) => {
    const props = {
      bookings: baseBookings,
      segments: baseSegments,
      availability: [],
      packages: [],
      onCreateBooking: vi.fn().mockResolvedValue(undefined),
      onUpdateBooking: vi.fn().mockResolvedValue(undefined),
      onDeleteBooking: vi.fn().mockResolvedValue(undefined),
      onSaveAvailability: vi.fn(),
      onSavePackages: vi.fn(),
      bookingSaving: false,
      ...overrideProps,
    };

    const view = render(<MentorshipManagementSection {...props} />);
    return { ...view, props };
  };

  it('summarises segments and initialises the booking form with defaults', () => {
    renderComponent();

    const activeCard = screen.getByText('Active mentees').closest('div');
    expect(activeCard).not.toBeNull();
    expect(within(activeCard).getByText('1')).toBeInTheDocument();

    const waitlistCard = screen.getByText('Waitlist').closest('div');
    expect(waitlistCard).not.toBeNull();
    expect(within(waitlistCard).getByText('0')).toBeInTheDocument();

    expect(screen.getByLabelText('Mentee name')).toHaveValue('');
    expect(screen.getByLabelText('Scheduled at')).toHaveValue('');
    expect(screen.getByLabelText('Booking status')).toHaveValue('Scheduled');
    expect(screen.getByLabelText('Payment')).toHaveValue('Pending');
    expect(screen.getByLabelText('Channel')).toHaveValue('Explorer');
    expect(screen.getByLabelText('Segment')).toHaveValue('active');
  });

  it('prefills booking details when editing and supports updating then deleting the entry', async () => {
    const user = userEvent.setup();
    const { props } = renderComponent();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Edit' }));
    });

    expect(screen.getByLabelText('Mentee name')).toHaveValue('Jordan Lee');
    expect(screen.getByLabelText('Scheduled at')).toHaveValue('2024-07-01T10:30');

    await act(async () => {
      const menteeInput = screen.getByLabelText('Mentee name');
      await user.clear(menteeInput);
      await user.type(menteeInput, 'Jordan Updated');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Update booking' }));
    });
    expect(await screen.findByText('Booking saved.')).toBeInTheDocument();

    expect(props.onUpdateBooking).toHaveBeenCalledWith(
      'bk-1',
      expect.objectContaining({ mentee: 'Jordan Updated' }),
    );

    const bookingRow = screen.getByRole('row', { name: /jordan lee/i });
    const actionButtons = within(bookingRow).getAllByRole('button');
    const deleteButton = actionButtons[actionButtons.length - 1];

    await act(async () => {
      await user.click(deleteButton);
    });
    expect(await screen.findByText('Booking removed.')).toBeInTheDocument();

    expect(props.onDeleteBooking).toHaveBeenCalledWith('bk-1');
  });
});
