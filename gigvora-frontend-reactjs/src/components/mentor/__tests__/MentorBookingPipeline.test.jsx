import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MentorBookingPipeline from '../MentorBookingPipeline.jsx';

describe('MentorBookingPipeline', () => {
  const baseBookings = [
    {
      id: '1',
      mentee: 'Jordan Patel',
      role: 'Founder',
      package: 'Strategy sprint',
      focus: 'Product roadmap',
      scheduledAt: '2024-06-04T10:00:00.000Z',
      status: 'Confirmed',
      currency: 'GBP',
      price: 180,
      paymentStatus: 'Paid',
      channel: 'Zoom',
      segment: 'upcoming',
    },
    {
      id: '2',
      mentee: 'Amina Diallo',
      role: 'Head of Design',
      package: 'Leadership pod',
      focus: 'Storytelling',
      scheduledAt: '2024-06-03T09:00:00.000Z',
      status: 'Pending',
      currency: 'GBP',
      price: 220,
      paymentStatus: 'Payment requested',
      channel: 'Google Meet',
      segment: 'pipeline',
    },
  ];

  it('groups bookings according to the supplied segments', () => {
    render(
      <MentorBookingPipeline
        bookings={baseBookings}
        segments={[
          { id: 'pipeline', title: 'Pipeline', description: 'Awaiting confirmation' },
          { id: 'upcoming', title: 'Upcoming', description: 'Ready to host' },
        ]}
      />,
    );

    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();

    const pipelineHeader = screen.getByText('Pipeline').closest('div')?.parentElement;
    const pipelineList = pipelineHeader?.nextElementSibling;
    expect(pipelineList?.textContent).toContain('Amina Diallo');
    expect(pipelineList?.textContent).not.toContain('Jordan Patel');

    const upcomingHeader = screen.getByText('Upcoming').closest('div')?.parentElement;
    const upcomingList = upcomingHeader?.nextElementSibling;
    expect(upcomingList?.textContent).toContain('Jordan Patel');
    expect(upcomingList?.textContent).not.toContain('Amina Diallo');
  });

  it('sorts bookings chronologically and formats prices', () => {
    render(<MentorBookingPipeline bookings={[...baseBookings].reverse()} />);

    const price = screen.getByText('£220');
    expect(price).toBeInTheDocument();

    const menteeNames = screen
      .getAllByText((content, element) => element.tagName === 'P' && /Patel|Diallo/.test(content))
      .map((node) => node.textContent);
    expect(menteeNames[0]).toContain('Amina Diallo');
    expect(menteeNames[1]).toContain('Jordan Patel');
  });

  it('handles string prices without crashing', () => {
    render(
      <MentorBookingPipeline
        bookings={[
          {
            ...baseBookings[0],
            price: '£90',
            currency: '£',
          },
        ]}
      />,
    );

    expect(screen.getByText('£90')).toBeInTheDocument();
  });
});
