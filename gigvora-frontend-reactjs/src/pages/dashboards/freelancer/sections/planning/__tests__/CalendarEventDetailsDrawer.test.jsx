import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CalendarEventDetailsDrawer from '../CalendarEventDetailsDrawer.jsx';

const BASE_EVENT = {
  id: 'event-1',
  title: 'Kickoff',
  eventType: 'project',
  status: 'confirmed',
  startsAt: '2024-05-01T09:00:00Z',
  endsAt: '2024-05-01T10:00:00Z',
  reminderMinutesBefore: 15,
  relatedEntityName: 'Launchpad',
  location: 'Virtual',
};

describe('CalendarEventDetailsDrawer', () => {
  it('renders event information and surfaces management actions', async () => {
    const handleStatusChange = vi.fn();
    const handleEdit = vi.fn();
    const handleDuplicate = vi.fn();
    const handleDelete = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(
      <CalendarEventDetailsDrawer
        open
        event={BASE_EVENT}
        canManage
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />,
    );

    expect(screen.getByText('Kickoff')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox'), ['completed']);
    expect(handleStatusChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'event-1' }), 'completed');

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'event-1' }));

    await user.click(screen.getByRole('button', { name: /duplicate/i }));
    expect(handleDuplicate).toHaveBeenCalledWith(expect.objectContaining({ id: 'event-1' }));

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByText(/deleting removes the event/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm delete/i }));
    await waitFor(() => expect(handleDelete).toHaveBeenCalledTimes(1));
  });

  it('displays an error if deletion fails', async () => {
    const handleDelete = vi.fn().mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();

    render(
      <CalendarEventDetailsDrawer open event={BASE_EVENT} canManage onDelete={handleDelete} />,
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
  });

  it('prevents status changes while updates are in progress', () => {
    const handleStatusChange = vi.fn();

    render(
      <CalendarEventDetailsDrawer
        open
        event={BASE_EVENT}
        canManage
        statusUpdating
        onStatusChange={handleStatusChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'completed' } });
    expect(handleStatusChange).not.toHaveBeenCalled();
  });
});
