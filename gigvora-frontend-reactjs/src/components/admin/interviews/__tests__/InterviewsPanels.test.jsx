import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrepPortalsPanel from '../PrepPortalsPanel.jsx';
import RoomsPanel from '../RoomsPanel.jsx';
import StatsStrip from '../StatsStrip.jsx';
import TemplatesPanel from '../TemplatesPanel.jsx';
import WorkflowPanel from '../WorkflowPanel.jsx';
import WorkspaceSwitcher from '../WorkspaceSwitcher.jsx';

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('PrepPortalsPanel', () => {
  it('creates new prep portal entries', async () => {
    const user = userEvent.setup();
    const onCreatePortal = vi.fn().mockResolvedValue({});

    render(
      <PrepPortalsPanel
        prepPortals={[]}
        onCreatePortal={onCreatePortal}
        onUpdatePortal={vi.fn()}
        onDeletePortal={vi.fn()}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /^new$/i })));
    await runInAct(() => user.type(screen.getByLabelText(/title/i), 'Interview Warmup'));
    await runInAct(() => user.type(screen.getByLabelText(/share link/i), 'https://gigvora.com/prep'));
    await runInAct(() => user.type(screen.getByLabelText(/resources/i), 'Agenda | https://gigvora.com/agenda'));
    await runInAct(() => user.type(screen.getByLabelText(/checklist/i), 'Confirm resume'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^save$/i })));

    expect(onCreatePortal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Interview Warmup',
        resources: [
          expect.objectContaining({ label: 'Agenda', url: 'https://gigvora.com/agenda' }),
        ],
        checklist: ['Confirm resume'],
      }),
    );
  });
});

describe('RoomsPanel', () => {
  it('edits room details via modal', async () => {
    const user = userEvent.setup();
    const onUpdateRoom = vi.fn().mockResolvedValue({});

    render(
      <RoomsPanel
        rooms={[
          {
            id: 'room-1',
            stage: 'Screen',
            status: 'scheduled',
            scheduledAt: new Date('2024-03-01T10:00:00Z').toISOString(),
            participants: [],
            checklist: [],
          },
        ]}
        onCreateRoom={vi.fn()}
        onUpdateRoom={onUpdateRoom}
        onDeleteRoom={vi.fn()}
        onAddParticipant={vi.fn().mockResolvedValue({})}
        onUpdateParticipant={vi.fn().mockResolvedValue({})}
        onRemoveParticipant={vi.fn().mockResolvedValue({})}
        onAddChecklistItem={vi.fn().mockResolvedValue({})}
        onUpdateChecklistItem={vi.fn().mockResolvedValue({})}
        onRemoveChecklistItem={vi.fn().mockResolvedValue({})}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /manage/i })));
    const modal = screen.getByRole('dialog');
    await runInAct(() => user.clear(within(modal).getByLabelText(/stage/i)));
    await runInAct(() => user.type(within(modal).getByLabelText(/stage/i), 'Panel Interview'));
    await runInAct(() => user.click(within(modal).getByRole('button', { name: /save details/i })));

    expect(onUpdateRoom).toHaveBeenCalledWith('room-1', expect.objectContaining({ stage: 'Panel Interview' }));
  });
});

describe('TemplatesPanel', () => {
  it('updates existing template', async () => {
    const user = userEvent.setup();
    const onUpdateTemplate = vi.fn().mockResolvedValue({});

    render(
      <TemplatesPanel
        templates={[
          {
            id: 'template-1',
            name: 'Culture Fit',
            stage: 'Loop',
            durationMinutes: 60,
            focusAreas: ['Culture'],
            interviewerRoster: [{ id: 'person-1', name: 'Jamie', title: 'Lead' }],
          },
        ]}
        onCreateTemplate={vi.fn()}
        onUpdateTemplate={onUpdateTemplate}
        onDeleteTemplate={vi.fn()}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /edit template/i })));
    const modal = screen.getByRole('dialog');
    await runInAct(() => user.type(within(modal).getByLabelText(/name/i), ' Plus'));
    await runInAct(() => user.click(within(modal).getByRole('button', { name: /^save$/i })));

    expect(onUpdateTemplate).toHaveBeenCalledWith('template-1', expect.objectContaining({ name: 'Culture Fit Plus' }));
  });
});

describe('WorkflowPanel', () => {
  it('creates lanes and updates cards', async () => {
    const user = userEvent.setup();
    const callbacks = {
      onCreateLane: vi.fn().mockResolvedValue({}),
      onUpdateLane: vi.fn().mockResolvedValue({}),
      onDeleteLane: vi.fn(),
      onCreateCard: vi.fn().mockResolvedValue({}),
      onUpdateCard: vi.fn().mockResolvedValue({}),
      onDeleteCard: vi.fn(),
    };

    render(
      <WorkflowPanel
        workflow={{
          lanes: [
            {
              id: 'lane-1',
              name: 'Phone screen',
              slaMinutes: 240,
              cards: [
                {
                  id: 'card-1',
                  candidateName: 'Morgan',
                  jobTitle: 'Engineer',
                  status: 'scheduled',
                  scheduledAt: new Date('2024-03-02T14:00:00Z').toISOString(),
                },
              ],
            },
          ],
        }}
        {...callbacks}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /^new$/i })));
    const laneModal = screen.getByRole('dialog');
    await runInAct(() => user.clear(within(laneModal).getByLabelText(/name/i)));
    await runInAct(() => user.type(within(laneModal).getByLabelText(/name/i), 'Onsite'));
    await runInAct(() => user.clear(within(laneModal).getByLabelText(/sla minutes/i)));
    await runInAct(() => user.type(within(laneModal).getByLabelText(/sla minutes/i), '480'));
    await runInAct(() => user.click(within(laneModal).getByRole('button', { name: /^save$/i })));

    expect(callbacks.onCreateLane).toHaveBeenCalledWith(expect.objectContaining({ name: 'Onsite' }));

    await runInAct(() => user.click(screen.getByRole('button', { name: /morgan/i })));
    const dialogs = await screen.findAllByRole('dialog');
    const cardModal = dialogs[dialogs.length - 1];
    await runInAct(() => user.clear(within(cardModal).getByLabelText(/candidate/i)));
    await runInAct(() => user.type(within(cardModal).getByLabelText(/candidate/i), 'Morgan Smith'));
    const saveCardButton = await within(cardModal).findByText('Save', { selector: 'button' });
    await runInAct(() => user.click(saveCardButton));

    expect(callbacks.onUpdateCard).toHaveBeenCalledWith('lane-1', 'card-1', expect.objectContaining({ candidateName: 'Morgan Smith' }));
  });
});

describe('StatsStrip', () => {
  it('formats statistics for display', () => {
    render(
      <StatsStrip
        stats={{
          totalRooms: 12,
          upcoming: 4,
          awaitingFeedback: 2,
          averageSlaMinutes: 135,
          totalTemplates: 6,
          totalPrepPortals: 3,
        }}
      />,
    );

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('2.3 h')).toBeInTheDocument();
  });
});

describe('WorkspaceSwitcher', () => {
  it('changes workspace and refreshes data', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onRefresh = vi.fn();

    render(
      <WorkspaceSwitcher
        workspaces={[
          { id: 'ws-1', name: 'EMEA', rooms: 5, lanes: 4 },
          { id: 'ws-2', name: 'APAC', rooms: 3, lanes: 2 },
        ]}
        value="ws-1"
        onChange={onChange}
        onRefresh={onRefresh}
      />,
    );

    await runInAct(() => user.selectOptions(screen.getByRole('combobox'), 'ws-2'));
    expect(onChange).toHaveBeenCalledWith('ws-2');

    await runInAct(() => user.click(screen.getByRole('button', { name: /refresh/i })));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
