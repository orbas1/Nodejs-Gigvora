import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useFreelancerCalendarMock = vi.fn();

const formSpy = vi.fn();
const timelineSpy = vi.fn();
const detailsSpy = vi.fn();

vi.mock('../../../../../hooks/useFreelancerCalendar.js', () => ({
  __esModule: true,
  default: useFreelancerCalendarMock,
}));

vi.mock('../../sections/planning/CalendarEventForm.jsx', () => ({
  __esModule: true,
  default: (props) => {
    formSpy(props);
    return props.open ? <div data-testid="planner-form" /> : null;
  },
}));

vi.mock('../../sections/planning/CalendarEventTimeline.jsx', () => ({
  __esModule: true,
  default: (props) => {
    timelineSpy(props);
    return <div data-testid="planner-timeline" />;
  },
}));

vi.mock('../../sections/planning/CalendarEventDetailsDrawer.jsx', () => ({
  __esModule: true,
  default: (props) => {
    detailsSpy(props);
    return props.open ? <div data-testid="planner-details" /> : null;
  },
}));

const { default: PlannerWorkspace } = await import('../PlannerWorkspace.jsx');

function buildCalendarSnapshot() {
  const refresh = vi.fn().mockResolvedValue();
  const createEvent = vi.fn().mockResolvedValue({ id: 'evt-new' });
  const updateEvent = vi.fn().mockResolvedValue({});
  const deleteEvent = vi.fn().mockResolvedValue({});
  const downloadEventInvite = vi.fn().mockResolvedValue('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n');
  const setFilters = vi.fn();

  useFreelancerCalendarMock.mockReturnValue({
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
    downloadEventInvite,
    setFilters,
  });

  return { refresh, createEvent, updateEvent, deleteEvent, downloadEventInvite, setFilters };
}

function renderWorkspace(overrides) {
  const snapshot = buildCalendarSnapshot();
  const session = { id: 401, memberships: ['freelancer'], ...overrides };
  render(<PlannerWorkspace session={session} />);
  return snapshot;
}

describe('PlannerWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFreelancerCalendarMock.mockReset();
    formSpy.mockReset();
    timelineSpy.mockReset();
    detailsSpy.mockReset();
  });

  it('renders summary cards and applies filters', async () => {
    const { refresh, setFilters } = renderWorkspace();

    expect(useFreelancerCalendarMock).toHaveBeenCalled();

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
    await waitFor(() => expect(timelineSpy).toHaveBeenCalled());
    const timelineProps = timelineSpy.mock.calls.at(-1)?.[0];
    expect(timelineProps).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /New event/i }));

    const formProps = formSpy.mock.calls.at(-1)[0];
    expect(formProps.mode).toBe('create');
    await act(async () => {
      await formProps.onSubmit({ title: 'Strategy sync' });
    });

    expect(createEvent).toHaveBeenCalledWith({ title: 'Strategy sync' }, { actorId: 401 });
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => {
      timelineProps.onEditEvent({ id: 'evt-1', title: 'Client kickoff' });
    });

    const editCall = formSpy.mock.calls.at(-1)[0];
    expect(editCall.mode).toBe('edit');
    await act(async () => {
      await editCall.onSubmit({ title: 'Client kickoff updated' });
    });

    expect(updateEvent).toHaveBeenCalledWith('evt-1', { title: 'Client kickoff updated' }, { actorId: 401 });
    expect(refresh).toHaveBeenCalledTimes(2);

    await act(async () => {
      await timelineProps.onStatusChange({ id: 'evt-1' }, 'completed');
    });

    expect(updateEvent).toHaveBeenCalledWith('evt-1', { status: 'completed' }, { actorId: 401 });
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

  it('exports calendar events as ICS invites', async () => {
    const { downloadEventInvite } = renderWorkspace();
    await waitFor(() => expect(detailsSpy).toHaveBeenCalled());
    const props = detailsSpy.mock.calls.at(-1)[0];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    if (!URL.createObjectURL) {
      URL.createObjectURL = () => '';
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = () => {};
    }
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-ics');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.fn();
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        Object.defineProperty(element, 'click', { value: clickSpy });
      }
      return element;
    });

    await act(async () => {
      await props.onDownload({ id: 'evt-1', title: 'Client kickoff' });
    });

    expect(downloadEventInvite).toHaveBeenCalledWith('evt-1', { actorId: 401 });
    expect(createObjectUrl).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalled();

    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
    if (!originalCreate) {
      delete URL.createObjectURL;
    }
    if (!originalRevoke) {
      delete URL.revokeObjectURL;
    }
    createElementSpy.mockRestore();
  });
});
