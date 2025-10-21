import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calendarMock = { useFreelancerCalendar: vi.fn() };

const formSpy = vi.fn();
const timelineSpy = vi.fn();
const detailsSpy = vi.fn();

const calendarModule = await import('../../../../../hooks/useFreelancerCalendar.js');
vi.spyOn(calendarModule, 'default').mockImplementation(calendarMock.useFreelancerCalendar);

const eventFormModule = await import('../../sections/planning/CalendarEventForm.jsx');
vi.spyOn(eventFormModule, 'default').mockImplementation((props) => {
  formSpy(props);
  return props.open ? <div data-testid="planner-form" /> : null;
});

const eventTimelineModule = await import('../../sections/planning/CalendarEventTimeline.jsx');
vi.spyOn(eventTimelineModule, 'default').mockImplementation((props) => {
  timelineSpy(props);
  return <div data-testid="planner-timeline" />;
});

const eventDetailsModule = await import('../../sections/planning/CalendarEventDetailsDrawer.jsx');
vi.spyOn(eventDetailsModule, 'default').mockImplementation((props) => {
  detailsSpy(props);
  return props.open ? <div data-testid="planner-details" /> : null;
});

const { default: PlannerWorkspace } = await import('../PlannerWorkspace.jsx');

function buildCalendarSnapshot() {
  const refresh = vi.fn().mockResolvedValue();
  const createEvent = vi.fn().mockResolvedValue({ id: 'evt-new' });
  const updateEvent = vi.fn().mockResolvedValue({});
  const deleteEvent = vi.fn().mockResolvedValue({});
  const setFilters = vi.fn();

  calendarMock.useFreelancerCalendar.mockReturnValue({
    events: [
      {
        id: 'evt-1',
        title: 'Client kickoff',
        startsAt: '2024-04-20T12:00:00.000Z',
        status: 'confirmed',
        type: 'project',
      },
      {
        id: 'evt-2',
        title: 'Mentoring session',
        startsAt: '2024-04-18T09:00:00.000Z',
        status: 'tentative',
        type: 'mentorship',
      },
    ],
    metrics: {
      total: 2,
      upcomingCount: 1,
      overdueCount: 0,
      nextEvent: {
        id: 'evt-1',
        title: 'Client kickoff',
        startsAt: '2024-04-20T12:00:00.000Z',
      },
      typeCounts: { project: 1, mentorship: 1 },
      statusCounts: { confirmed: 1, tentative: 1 },
    },
    filters: { types: [], statuses: [] },
    loading: false,
    error: null,
    lastUpdated: '2024-04-18T09:00:00.000Z',
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
    setFilters,
  });

  return { refresh, createEvent, updateEvent, deleteEvent, setFilters };
}

function renderWorkspace(overrides) {
  const snapshot = buildCalendarSnapshot();
  const session = { id: 'freelancer-1', memberships: ['freelancer'], ...overrides };
  render(<PlannerWorkspace session={session} />);
  return snapshot;
}

describe('PlannerWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calendarMock.useFreelancerCalendar.mockReset();
    formSpy.mockReset();
    timelineSpy.mockReset();
    detailsSpy.mockReset();
  });

  it('renders summary cards and applies filters', async () => {
    const { refresh, setFilters } = renderWorkspace();

    expect(calendarMock.useFreelancerCalendar).toHaveBeenCalled();

    expect(screen.getAllByText('Client kickoff')[0]).toBeInTheDocument();
    expect(screen.getByText(/Next/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Project milestone/i }));

    await waitFor(() => {
      expect(setFilters).toHaveBeenCalledWith({ types: ['project'], statuses: undefined });
      expect(refresh).toHaveBeenCalledWith({ types: ['project'], statuses: undefined });
    });

    fireEvent.click(screen.getByRole('button', { name: /Clear filters/i }));

    await waitFor(() => {
      expect(setFilters).toHaveBeenCalledWith({ types: undefined, statuses: undefined });
      expect(refresh).toHaveBeenCalledWith({ types: undefined, statuses: undefined });
    });
  });

  it('supports creating and updating events through the form workflow', async () => {
    const { createEvent, updateEvent, refresh } = renderWorkspace();
    expect(timelineSpy).toHaveBeenCalled();
    const timelineProps = timelineSpy.mock.calls.at(-1)?.[0];
    expect(timelineProps).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /New event/i }));

    const formProps = formSpy.mock.calls.at(-1)[0];
    expect(formProps.mode).toBe('create');
    await act(async () => {
      await formProps.onSubmit({ title: 'Strategy sync' });
    });

    expect(createEvent).toHaveBeenCalledWith({ title: 'Strategy sync' }, { actorId: 'freelancer-1' });
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => {
      timelineProps.onEditEvent({ id: 'evt-1', title: 'Client kickoff' });
    });

    const editCall = formSpy.mock.calls.at(-1)[0];
    expect(editCall.mode).toBe('edit');
    await act(async () => {
      await editCall.onSubmit({ title: 'Client kickoff updated' });
    });

    expect(updateEvent).toHaveBeenCalledWith('evt-1', { title: 'Client kickoff updated' }, { actorId: 'freelancer-1' });
    expect(refresh).toHaveBeenCalledTimes(2);

    await act(async () => {
      await timelineProps.onStatusChange({ id: 'evt-1' }, 'completed');
    });

    expect(updateEvent).toHaveBeenCalledWith('evt-1', { status: 'completed' }, { actorId: 'freelancer-1' });
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it('saves availability preferences and surfaces a timestamp', async () => {
    vi.useFakeTimers().setSystemTime(new Date('2024-04-18T10:00:00.000Z'));
    renderWorkspace();

    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: 'Available for new retainers.' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /Save availability/i }).closest('form'));

    const availabilityForm = screen
      .getByRole('button', { name: /Save availability/i })
      .closest('form');
    expect(availabilityForm?.textContent).toMatch(/Updated/);

    vi.useRealTimers();
  });
});
