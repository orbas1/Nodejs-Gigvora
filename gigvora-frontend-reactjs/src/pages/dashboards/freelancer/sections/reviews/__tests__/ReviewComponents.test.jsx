import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ReviewToolbar from '../ReviewToolbar.jsx';
import StatusBadge from '../StatusBadge.jsx';
import TableView from '../TableView.jsx';
import { formatDate, formatDateTime, getStatusConfig, toFormValues, toPayload } from '../utils.js';

describe('freelancer review components', () => {
  it('allows switching views and triggering actions from the toolbar', async () => {
    const onViewChange = vi.fn();
    const onCreate = vi.fn();
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <ReviewToolbar
        activeView="overview"
        onViewChange={onViewChange}
        onCreate={onCreate}
        onRefresh={onRefresh}
        refreshing={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Table' }));
    expect(onViewChange).toHaveBeenCalledWith('table');

    await user.click(screen.getByRole('button', { name: 'New' }));
    expect(onCreate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders status badges with fallbacks for unknown statuses', () => {
    const { rerender } = render(<StatusBadge status="published" />);
    expect(screen.getByText('Live')).toBeInTheDocument();

    rerender(<StatusBadge status="pending" />);
    expect(screen.getByText('Queue')).toBeInTheDocument();

    rerender(<StatusBadge status="mystery" />);
    expect(screen.getByText(getStatusConfig('mystery').label)).toBeInTheDocument();
  });

  it('presents reviews in a sortable table and supports pagination controls', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const onFilterReset = vi.fn();
    const onPageChange = vi.fn();
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    const reviews = [
      {
        id: 'rev-1',
        title: 'Incredible partnership',
        reviewerName: 'Taylor',
        reviewerCompany: 'Atlas Labs',
        rating: 4.8,
        status: 'published',
        tags: ['Delivery', 'Strategy'],
        updatedAt: '2024-04-01T12:00:00Z',
      },
      {
        id: 'rev-2',
        title: 'Strong collaboration',
        reviewerName: 'Jordan',
        reviewerCompany: 'Lumina',
        rating: 4,
        status: 'pending',
        tags: ['Team'],
        updatedAt: '2024-04-02T12:00:00Z',
      },
    ];

    render(
      <TableView
        reviews={reviews}
        filters={{ query: '', status: 'all', highlighted: 'all', minRating: null }}
        onFilterChange={onFilterChange}
        onFilterReset={onFilterReset}
        pagination={{ page: 2, pageSize: 10, total: 30, totalPages: 3 }}
        onPageChange={onPageChange}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        deletingId="rev-1"
      />,
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // header + two rows

    const firstRow = within(rows[1]);
    await user.click(firstRow.getByRole('button', { name: 'View review' }));
    expect(onView).toHaveBeenCalledWith(reviews[0]);

    await user.click(firstRow.getByRole('button', { name: 'Edit review' }));
    expect(onEdit).toHaveBeenCalledWith(reviews[0]);

    const deleteButton = firstRow.getByRole('button', { name: 'Delete review' });
    expect(deleteButton).toBeDisabled();

    const secondRow = within(rows[2]);
    await user.click(secondRow.getByRole('button', { name: 'Delete review' }));
    expect(onDelete).toHaveBeenCalledWith(reviews[1]);

    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    expect(screen.getByText('Showing 11 - 20 of 30')).toBeInTheDocument();
  });

  it('formats dates and times gracefully for varied inputs', () => {
    expect(formatDate('2024-02-10T00:00:00Z')).not.toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDateTime('2024-02-10T13:45:00Z')).not.toBe('—');
    expect(formatDateTime('invalid')).toBe('invalid');
  });

  it('normalises review form values and payload transformations', () => {
    const blank = toFormValues(null);
    expect(blank).toMatchObject({
      title: '',
      status: 'draft',
      highlighted: false,
      reviewSource: 'manual',
      tags: '',
    });

    const sourceReview = {
      id: 'rev-9',
      title: 'Great results',
      reviewerName: 'Alex',
      rating: 4.5,
      highlighted: true,
      reviewSource: 'invited',
      capturedAt: '2024-01-01T00:00:00.000Z',
      publishedAt: '2024-01-02T00:00:00.000Z',
      tags: ['Growth', 'Delivery'],
      privateNotes: 'Keep private',
    };

    const formValues = toFormValues(sourceReview);
    expect(formValues).toMatchObject({
      title: 'Great results',
      highlighted: true,
      tags: 'Growth, Delivery',
    });

    const payload = toPayload({ ...formValues, rating: '4.5' });
    expect(payload.rating).toBe(4.5);
    expect(payload.tags).toEqual(['Growth', 'Delivery']);
    expect(payload.capturedAt).toBe('2024-01-01T00:00:00.000Z');
    expect(payload.publishedAt).toBe('2024-01-02T00:00:00.000Z');
    expect(payload.privateNotes).toBe('Keep private');
  });
});
