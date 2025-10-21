import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import InterviewsPanel from '../InterviewsPanel.jsx';

describe('InterviewsPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const applications = [
    { id: 1, detail: { title: 'Product Designer', companyName: 'Gigvora' } },
  ];

  const interviews = [
    {
      id: 'int-1',
      applicationId: 1,
      scheduledAt: '2024-05-02T15:00:00Z',
      type: 'video',
      status: 'awaiting_feedback',
      durationMinutes: 45,
    },
  ];

  it('renders interviews with formatted metadata', () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <InterviewsPanel
        interviews={interviews}
        applications={applications}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Product Designer')).toBeInTheDocument();
    expect(screen.getByText(/video/)).toBeInTheDocument();
    expect(screen.getByText(/45 min/)).toBeInTheDocument();
  });

  it('invokes callbacks for create, edit, and delete actions', async () => {
    const onCreate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <InterviewsPanel
        interviews={interviews}
        applications={applications}
        onCreate={onCreate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /schedule interview/i }));
    expect(onCreate).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(interviews[0]);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(interviews[0]);
  });
});
