import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import OverviewPanel from '../panels/OverviewPanel.jsx';
import ResponsesPanel from '../panels/ResponsesPanel.jsx';

describe('OverviewPanel', () => {
  it('renders key metrics and triggers quick actions', async () => {
    const onCreateApplication = vi.fn();
    const onCreateInterview = vi.fn();
    const onCreateFavourite = vi.fn();
    const onCreateResponse = vi.fn();

    render(
      <OverviewPanel
        summary={{
          totalApplications: 12,
          activeApplications: 6,
          interviewsScheduled: 3,
          offersNegotiating: 1,
          favourites: 2,
          pendingResponses: 4,
        }}
        statusBreakdown={[
          { status: 'active', label: 'Active', count: 6 },
          { status: 'meets', label: 'Interviews', count: 3 },
          { status: 'offers', label: 'Offers', count: 1 },
          { status: 'saved', label: 'Saved', count: -2 },
        ]}
        recommendedActions={[{ id: '1', title: 'Reply to saved mentors' }]}
        onCreateApplication={onCreateApplication}
        onCreateInterview={onCreateInterview}
        onCreateFavourite={onCreateFavourite}
        onCreateResponse={onCreateResponse}
      />,
    );

    expect(screen.getByText('12 total')).toBeInTheDocument();
    const quickActions = within(screen.getByTestId('overview-quick-actions')).getAllByRole('button');
    expect(quickActions).toHaveLength(4);

    await userEvent.click(quickActions[0]);
    expect(onCreateApplication).toHaveBeenCalledTimes(1);
  });
});

describe('ResponsesPanel', () => {
  it('sorts responses by date and shows missing links notice', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ResponsesPanel
        responses={[
          {
            id: 'older',
            applicationId: 'a1',
            direction: 'outbound',
            channel: 'email',
            status: 'sent',
            subject: 'Thank you for the update',
            sentAt: '2024-05-20T10:00:00Z',
          },
          {
            id: 'latest',
            applicationId: 'missing',
            direction: 'inbound',
            channel: 'phone',
            status: 'received',
            subject: 'Interview confirmation',
            sentAt: '2024-05-21T11:00:00Z',
          },
        ]}
        applications={[
          {
            id: 'a1',
            detail: { title: 'Product Designer', companyName: 'Gigvora' },
          },
        ]}
        onCreate={vi.fn()}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Interview confirmation');
    expect(items[0]).toHaveTextContent('Not linked');
  });
});
