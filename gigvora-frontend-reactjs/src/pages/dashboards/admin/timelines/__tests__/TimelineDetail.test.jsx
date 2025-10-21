import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimelineDetail from '../TimelineDetail.jsx';

const baseTimeline = {
  id: 'tl-1',
  name: 'Launch alpha',
  summary: 'Alpha rollout',
  status: 'active',
  visibility: 'internal',
  startDate: '2024-05-01T00:00:00.000Z',
  endDate: '2024-06-01T00:00:00.000Z',
  settings: {
    programOwner: 'Alex',
    programEmail: 'alex@example.com',
    coordinationChannel: '#launch',
    riskNotes: 'Watch dependencies',
  },
};

const events = [
  {
    id: 'evt-1',
    title: 'Kick-off',
    eventType: 'milestone',
    status: 'planned',
    startDate: '2024-05-02T00:00:00.000Z',
    ownerName: 'Jamie',
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TimelineDetail', () => {
  it('renders empty state when no timeline is selected', () => {
    render(
      <TimelineDetail
        timeline={null}
        events={[]}
        loading={false}
        busy={false}
        onEditTimeline={() => {}}
      />,
    );

    expect(screen.getByText(/choose a timeline/i)).toBeVisible();
  });

  it('surfaces actions for timeline and events', async () => {
    const onDeleteTimeline = vi.fn();
    const onDeleteEvent = vi.fn();
    const onReorderEvent = vi.fn();
    const onPreviewEvent = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <TimelineDetail
        timeline={baseTimeline}
        events={events}
        loading={false}
        busy={false}
        onEditTimeline={() => {}}
        onDeleteTimeline={onDeleteTimeline}
        onAddEvent={() => {}}
        onEditEvent={() => {}}
        onDeleteEvent={onDeleteEvent}
        onReorderEvent={onReorderEvent}
        onPreviewEvent={onPreviewEvent}
      />,
    );

    expect(screen.getByText(/May/)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(onPreviewEvent).toHaveBeenCalledWith(events[0]);

    await userEvent.click(screen.getByRole('button', { name: /delete/i, exact: false }));
    expect(onDeleteTimeline).toHaveBeenCalledWith('tl-1');

    const eventDeleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(eventDeleteButtons[eventDeleteButtons.length - 1]);
    expect(onDeleteEvent).toHaveBeenCalledWith('evt-1');

    const moveDownButton = screen.getByTitle(/move down/i);
    await userEvent.click(moveDownButton);
    expect(onReorderEvent).toHaveBeenCalledWith('evt-1', 'down');
  });
});
