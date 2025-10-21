import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import WorkspaceMeetingsTab from '../WorkspaceMeetingsTab.jsx';
import WorkspaceObjectsTab from '../WorkspaceObjectsTab.jsx';
import WorkspaceTasksTab from '../WorkspaceTasksTab.jsx';
import WorkspaceTeamTab from '../WorkspaceTeamTab.jsx';

describe('WorkspaceMeetingsTab', () => {
  it('normalises meeting submission payload', () => {
    const createMeeting = vi.fn();
    render(
      <WorkspaceMeetingsTab
        meetings={[]}
        calendarEvents={[]}
        onCreateMeeting={createMeeting}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /schedule/i }));
    const meetingDialog = screen.getByRole('dialog', { name: /new meeting/i });
    fireEvent.change(within(meetingDialog).getByLabelText(/^Title$/i), { target: { value: ' Kickoff Sync ' } });
    fireEvent.change(within(meetingDialog).getByLabelText(/^Start$/i), { target: { value: '2024-06-01T09:00' } });
    fireEvent.change(within(meetingDialog).getByLabelText(/Duration/i), { target: { value: '45' } });
    fireEvent.click(within(meetingDialog).getByRole('button', { name: /create meeting/i }));

    expect(createMeeting).toHaveBeenCalledTimes(1);
    const payload = createMeeting.mock.calls[0][0];
    expect(payload.title).toBe('Kickoff Sync');
    expect(payload.durationMinutes).toBe(45);
    expect(new Date(payload.scheduledAt).toISOString()).toBe('2024-06-01T09:00:00.000Z');
    expect(payload.status).toBe('scheduled');
  });

  it('normalises timeline event submissions', () => {
    const createEvent = vi.fn();
    render(
      <WorkspaceMeetingsTab
        meetings={[]}
        calendarEvents={[]}
        onCreateEvent={createEvent}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add event/i }));
    const eventDialog = screen.getByRole('dialog', { name: /new timeline event/i });
    fireEvent.change(within(eventDialog).getByLabelText(/^Title$/i), { target: { value: ' Launch ' } });
    fireEvent.change(within(eventDialog).getByLabelText(/^Type$/i), { target: { value: ' milestone ' } });
    fireEvent.change(within(eventDialog).getByLabelText(/^Start$/i), { target: { value: '2024-06-10T10:30' } });
    fireEvent.change(within(eventDialog).getByLabelText(/^End$/i), { target: { value: '2024-06-10T11:00' } });
    fireEvent.click(within(eventDialog).getByRole('button', { name: /create event/i }));

    expect(createEvent).toHaveBeenCalledTimes(1);
    const eventPayload = createEvent.mock.calls[0][0];
    expect(eventPayload.title).toBe('Launch');
    expect(eventPayload.eventType).toBe('milestone');
    expect(new Date(eventPayload.startAt).toISOString()).toBe('2024-06-10T10:30:00.000Z');
  });
});

describe('WorkspaceObjectsTab', () => {
  it('trims and parses quantity when creating a record', () => {
    const create = vi.fn();
    render(<WorkspaceObjectsTab objects={[]} onCreate={create} />);

    fireEvent.click(screen.getByRole('button', { name: /add record/i }));
    fireEvent.change(screen.getByLabelText(/^Label$/i), { target: { value: '  Asset  ' } });
    fireEvent.change(screen.getByLabelText(/^Quantity$/i), { target: { value: '5.5' } });
    const submitButton = screen
      .getAllByRole('button', { name: /add record/i })
      .find((button) => button.getAttribute('type') === 'submit');
    fireEvent.click(submitButton);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      label: 'Asset',
      quantity: 5.5,
    });
  });
});

describe('WorkspaceTasksTab', () => {
  it('sanitises new task payloads', () => {
    const createTask = vi.fn();
    render(<WorkspaceTasksTab tasks={[]} onCreate={createTask} />);

    fireEvent.click(screen.getByRole('button', { name: /add task/i }));
    const taskDialog = screen.getByRole('dialog', { name: /new task/i });
    fireEvent.change(within(taskDialog).getByLabelText(/^Title$/i), { target: { value: '  Draft roadmap ' } });
    fireEvent.change(within(taskDialog).getByLabelText(/^Estimated hours$/i), { target: { value: '3.25' } });
    fireEvent.change(within(taskDialog).getByLabelText(/^Progress/), { target: { value: '120' } });
    fireEvent.click(within(taskDialog).getByRole('button', { name: /create task/i }));

    expect(createTask).toHaveBeenCalledTimes(1);
    const payload = createTask.mock.calls[0][0];
    expect(payload.title).toBe('Draft roadmap');
    expect(payload.estimatedHours).toBe(3.25);
    expect(payload.progressPercent).toBe(100);
  });
});

describe('WorkspaceTeamTab', () => {
  let handlers;

  beforeEach(() => {
    handlers = {
      onCreateRole: vi.fn(),
      onUpdateRole: vi.fn(),
      onDeleteRole: vi.fn(),
      onCreateInvite: vi.fn(),
      onUpdateInvite: vi.fn(),
      onDeleteInvite: vi.fn(),
      onCreateHr: vi.fn(),
      onUpdateHr: vi.fn(),
      onDeleteHr: vi.fn(),
      onCreateTimeEntry: vi.fn(),
      onUpdateTimeEntry: vi.fn(),
      onDeleteTimeEntry: vi.fn(),
    };
  });

  it('normalises role creation payloads', () => {
    render(
      <WorkspaceTeamTab
        roleAssignments={[]}
        invites={[]}
        hrRecords={[]}
        timeEntries={[]}
        {...handlers}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add role/i }));
    fireEvent.change(screen.getByLabelText(/^Role name$/i), { target: { value: ' Strategic Lead ' } });
    fireEvent.change(screen.getByLabelText(/Allocation \(%\)/i), { target: { value: '50' } });
    const submitButton = screen
      .getAllByRole('button', { name: /add role/i })
      .find((button) => button.getAttribute('type') === 'submit');
    fireEvent.click(submitButton);

    expect(handlers.onCreateRole).toHaveBeenCalledTimes(1);
    expect(handlers.onCreateRole.mock.calls[0][0]).toMatchObject({
      roleName: 'Strategic Lead',
      allocationPercent: 50,
      status: 'draft',
    });
  });
});
