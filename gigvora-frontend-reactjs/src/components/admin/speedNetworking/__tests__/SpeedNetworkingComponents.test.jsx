import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import SpeedNetworkingFilters from '../SpeedNetworkingFilters.jsx';
import SpeedNetworkingParticipantManager from '../SpeedNetworkingParticipantManager.jsx';
import SpeedNetworkingSessionDrawer from '../SpeedNetworkingSessionDrawer.jsx';
import SpeedNetworkingSessionsTable from '../SpeedNetworkingSessionsTable.jsx';
import SpeedNetworkingStats from '../SpeedNetworkingStats.jsx';

async function actAndWait(callback) {
  await act(async () => {
    await callback();
  });
}

describe('SpeedNetworkingFilters', () => {
  it('invokes callbacks for filter changes and reset', async () => {
    const catalog = {
      statuses: [
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
      ],
      hosts: [
        { id: '5', name: 'Jordan Lee', userType: 'Admin' },
      ],
      workspaces: [
        { id: '12', name: 'Growth Hub' },
      ],
    };
    const filters = { status: [], hostId: '', workspaceId: '', from: '', to: '', search: '' };
    const onChange = vi.fn();
    const onReset = vi.fn();
    const user = userEvent.setup();

    render(
      <SpeedNetworkingFilters catalog={catalog} filters={filters} onChange={onChange} onReset={onReset} />,
    );

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Scheduled' })));
    expect(onChange).toHaveBeenCalledWith({ status: ['scheduled'] });

    await actAndWait(() => user.selectOptions(screen.getByLabelText('Host'), ['5']));
    expect(onChange).toHaveBeenLastCalledWith({ hostId: '5' });

    await actAndWait(() => user.selectOptions(screen.getByLabelText('Workspace'), ['12']));
    expect(onChange).toHaveBeenLastCalledWith({ workspaceId: '12' });

    await actAndWait(() => user.type(screen.getByLabelText('Search'), 'investor'));
    const searchCalls = onChange.mock.calls.filter(([payload]) => Object.prototype.hasOwnProperty.call(payload ?? {}, 'search'));
    expect(searchCalls.length).toBeGreaterThan(0);

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Reset' })));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe('SpeedNetworkingParticipantManager', () => {
  const catalog = {
    participantRoles: [
      { value: 'attendee', label: 'Attendee' },
      { value: 'mentor', label: 'Mentor' },
    ],
    participantStatuses: [
      { value: 'invited', label: 'Invited' },
      { value: 'checked_in', label: 'Checked in' },
    ],
  };

  const session = {
    participants: [
      {
        id: 9,
        fullName: 'Jordan Lee',
        email: 'jordan@gigvora.com',
        role: 'mentor',
        status: 'checked_in',
        assignedRoom: { id: 3, name: 'Atlas' },
      },
    ],
    rooms: [
      { id: 3, name: 'Atlas' },
      { id: 4, name: 'Nova' },
    ],
  };

  it('updates, removes, and creates participants with validation', async () => {
    const onCreate = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <SpeedNetworkingParticipantManager
        session={session}
        catalog={catalog}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        busy={false}
      />,
    );

    const participantRow = screen.getByText('Jordan Lee').closest('tr');
    expect(participantRow).not.toBeNull();

    const [roleSelect, statusSelect, roomSelect] = within(participantRow).getAllByRole('combobox');

    await actAndWait(() => user.selectOptions(roleSelect, ['attendee']));
    await actAndWait(() => user.selectOptions(statusSelect, ['invited']));
    await actAndWait(() => user.selectOptions(roomSelect, ['4']));

    await actAndWait(() => user.click(within(participantRow).getByRole('button', { name: 'Save' })));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(9, {
        role: 'attendee',
        status: 'invited',
        assignedRoomId: 4,
      });
    });

    await actAndWait(() => user.click(within(participantRow).getByRole('button', { name: 'Remove' })));
    expect(onDelete).toHaveBeenCalledWith(9);

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Add participant' })));
    expect(screen.getByText('Name or email is required.')).toBeInTheDocument();

    await actAndWait(() => user.type(screen.getByLabelText('Full name'), '  Alex  '));
    await actAndWait(() => user.type(screen.getByLabelText('Email'), 'alex@example.com '));
    await actAndWait(() => user.selectOptions(screen.getByLabelText('Role'), ['mentor']));
    await actAndWait(() => user.selectOptions(screen.getByLabelText('Status'), ['checked_in']));
    await actAndWait(() => user.selectOptions(screen.getByLabelText('Room assignment'), ['3']));

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Add participant' })));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        fullName: 'Alex',
        email: 'alex@example.com',
        role: 'mentor',
        status: 'checked_in',
        assignedRoomId: 3,
      });
    });
  });
});

describe('SpeedNetworkingSessionDrawer', () => {
  const catalog = {
    hosts: [{ id: 5, name: 'Jordan Lee' }],
    statuses: [
      { value: 'draft', label: 'Draft' },
      { value: 'scheduled', label: 'Scheduled' },
    ],
    accessLevels: [
      { value: 'invite_only', label: 'Invite only' },
      { value: 'public', label: 'Public' },
    ],
    visibilities: [
      { value: 'internal', label: 'Internal' },
      { value: 'external', label: 'External' },
    ],
    matchingStrategies: [
      { value: 'round_robin', label: 'Round robin' },
      { value: 'interest_based', label: 'Interest based' },
    ],
    workspaces: [{ id: 7, name: 'Global Ops' }],
  };

  it('validates title and normalises payload on submit', async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <SpeedNetworkingSessionDrawer
        open
        mode="create"
        onClose={onClose}
        onSubmit={onSubmit}
        catalog={catalog}
      />,
    );

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Create session' })));
    expect(screen.getByText('Title is required.')).toBeInTheDocument();

    const [titleInput] = await screen.findAllByLabelText(/Title/i);
    const descriptionInput = await screen.findByLabelText(/^Description\b/i);
    const statusSelect = await screen.findByLabelText(/^Status\b/i);
    const hostSelect = await screen.findByLabelText(/^Host\b/i);
    const ownerInput = await screen.findByLabelText(/^Owner\b/i);
    const workspaceSelect = await screen.findByLabelText(/^Workspace\b/i);
    const capacityInput = await screen.findByLabelText(/^Capacity\b/i);
    const roundDurationInput = await screen.findByLabelText(/^Round duration/i);
    const roundsInput = await screen.findByLabelText(/^Rounds\b/i);
    const bufferInput = await screen.findByLabelText(/^Buffer/i);
    const startsAtInput = await screen.findByLabelText(/^Starts\b/i);
    const endsAtInput = await screen.findByLabelText(/^Ends\b/i);
    const timezoneInput = await screen.findByLabelText(/^Timezone/i);
    const registrationInput = await screen.findByLabelText(/^Registration closes/i);
    const lobbyInput = await screen.findByLabelText(/^Lobby URL/i);
    const meetingInput = await screen.findByLabelText(/^Primary meeting URL/i);
    const instructionsInput = await screen.findByLabelText(/^Participant instructions/i);
    const matchingSelect = await screen.findByLabelText(/^Matching strategy/i);
    const tagsInput = await screen.findByLabelText(/^Tags\b/i);

    await actAndWait(() => user.type(titleInput, ' Founder Mixer '));
    await actAndWait(() => user.type(descriptionInput, 'Connect founders across regions.'));
    await actAndWait(() => user.selectOptions(statusSelect, ['scheduled']));
    await actAndWait(() => user.selectOptions(hostSelect, ['5']));
    await actAndWait(() => user.type(ownerInput, '11'));
    await actAndWait(() => user.selectOptions(workspaceSelect, ['7']));
    await actAndWait(() => user.clear(capacityInput));
    await actAndWait(() => user.type(capacityInput, '30'));
    await actAndWait(() => user.clear(roundDurationInput));
    await actAndWait(() => user.type(roundDurationInput, '480'));
    await actAndWait(() => user.clear(roundsInput));
    await actAndWait(() => user.type(roundsInput, '6'));
    await actAndWait(() => user.clear(bufferInput));
    await actAndWait(() => user.type(bufferInput, '90'));
    await actAndWait(() => user.clear(startsAtInput));
    await actAndWait(() => user.type(startsAtInput, '2024-07-18T09:30'));
    await actAndWait(() => user.clear(endsAtInput));
    await actAndWait(() => user.type(endsAtInput, '2024-07-18T11:00'));
    await actAndWait(() => user.type(timezoneInput, 'UTC'));
    await actAndWait(() => user.type(registrationInput, '2024-07-17T23:00'));
    await actAndWait(() => user.type(lobbyInput, 'https://gigvora.com/lobby'));
    await actAndWait(() => user.type(meetingInput, 'https://meet.gigvora.com/mixer'));
    await actAndWait(() => user.type(instructionsInput, 'Arrive 5 minutes early.'));
    await actAndWait(() => user.selectOptions(matchingSelect, ['interest_based']));
    await actAndWait(() => user.type(tagsInput, 'founders, growth '));

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Add room' })));

    const roomHeading = screen.getByText('Room 1');
    expect(roomHeading).toBeInTheDocument();

    const nameInput = screen.getAllByLabelText(/^Name$/i).at(-1);
    const topicInput = screen.getAllByLabelText(/^Topic$/i).at(-1);
    const roomCapacityInput = screen.getAllByLabelText(/^Capacity$/i).at(-1);
    const facilitatorInput = screen.getAllByLabelText(/Facilitator ID/i).at(-1);
    const roomMeetingInput = screen.getAllByLabelText(/^Meeting URL$/i).at(-1);
    const rotationInput = screen.getAllByLabelText(/Rotation interval/i).at(-1);
    const roomInstructionsInput = screen.getAllByLabelText(/Room instructions/i).at(-1);

    expect(nameInput).toBeTruthy();
    expect(topicInput).toBeTruthy();
    expect(roomCapacityInput).toBeTruthy();
    expect(facilitatorInput).toBeTruthy();
    expect(roomMeetingInput).toBeTruthy();
    expect(rotationInput).toBeTruthy();
    expect(roomInstructionsInput).toBeTruthy();

    await actAndWait(() => user.type(nameInput, 'Atlas'));
    await actAndWait(() => user.type(topicInput, 'Fundraising'));
    await actAndWait(() => user.type(roomCapacityInput, '12'));
    await actAndWait(() => user.type(facilitatorInput, '44'));
    await actAndWait(() => user.type(roomMeetingInput, 'https://meet.gigvora.com/atlas'));
    await actAndWait(() => user.type(rotationInput, '180'));
    await actAndWait(() => user.type(roomInstructionsInput, 'Rotate after each round.'));

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Create session' })));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.title).toBe('Founder Mixer');
    expect(payload.status).toBe('scheduled');
    expect(payload.hostId).toBe(5);
    expect(payload.adminOwnerId).toBe(11);
    expect(payload.workspaceId).toBe(7);
    expect(payload.capacity).toBe(30);
    expect(payload.roundDurationSeconds).toBe(480);
    expect(payload.totalRounds).toBe(6);
    expect(payload.bufferSeconds).toBe(90);
    expect(payload.tags).toEqual(['founders', 'growth']);
    expect(payload.rooms).toEqual([
      {
        id: undefined,
        name: 'Atlas',
        topic: 'Fundraising',
        capacity: 12,
        facilitatorId: 44,
        meetingUrl: 'https://meet.gigvora.com/atlas',
        rotationIntervalSeconds: 180,
        instructions: 'Rotate after each round.',
      },
    ]);
  });
});

describe('SpeedNetworkingSessionsTable', () => {
  const pagination = { page: 1, totalPages: 3, total: 14 };
  const sessions = [
    {
      id: 'sess-1',
      title: 'Founder Mixer',
      description: 'Connect founders.',
      scheduledStart: '2024-07-18T09:30:00.000Z',
      scheduledEnd: '2024-07-18T11:00:00.000Z',
      status: 'scheduled',
      host: { name: 'Jordan Lee' },
      participantCounts: {
        total: 24,
        checked_in: 10,
        active: 6,
        completed: 4,
      },
    },
  ];

  it('renders sessions and wires action handlers', async () => {
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <SpeedNetworkingSessionsTable
        sessions={sessions}
        loading={false}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        pagination={pagination}
        onPageChange={onPageChange}
      />,
    );

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Founder Mixer' })));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'sess-1' }));

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Edit' })));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'sess-1' }));

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Remove' })));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'sess-1' }));

    const previous = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next' });
    expect(previous).toBeDisabled();

    await actAndWait(() => user.click(next));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('shows empty state when no sessions match', () => {
    render(
      <SpeedNetworkingSessionsTable
        sessions={[]}
        loading={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        pagination={{ page: 2, totalPages: 2, total: 0 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('No sessions match these filters yet.')).toBeInTheDocument();
  });
});

describe('SpeedNetworkingStats', () => {
  it('renders metrics and handles actions', async () => {
    const onCreate = vi.fn();
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <SpeedNetworkingStats
        metrics={{
          totalsByStatus: { in_progress: 2, scheduled: 3, draft: 1, cancelled: 1, archived: 4 },
          participantsEngaged: 45,
          participantsTotal: 90,
          nextSession: '2024-07-18T09:30:00.000Z',
        }}
        onCreate={onCreate}
        onRefresh={onRefresh}
        refreshing={false}
      />,
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
    expect(screen.getByText(/Drafts awaiting setup/i)).toBeInTheDocument();

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'Refresh' })));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await actAndWait(() => user.click(screen.getByRole('button', { name: 'New session' })));
    expect(onCreate).toHaveBeenCalledTimes(1);

    rerender(
      <SpeedNetworkingStats
        metrics={null}
        onCreate={onCreate}
        onRefresh={onRefresh}
        refreshing
      />,
    );

    expect(screen.getByRole('button', { name: 'Refreshing…' })).toBeDisabled();
  });
});
