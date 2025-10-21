import { render, screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import AdminInboxCreateThreadForm from '../AdminInboxCreateThreadForm.jsx';
import AdminInboxFilters from '../AdminInboxFilters.jsx';
import AdminInboxLabelManager from '../AdminInboxLabelManager.jsx';
import AdminInboxStats from '../AdminInboxStats.jsx';
import AdminInboxQueueSnapshot from '../AdminInboxQueueSnapshot.jsx';
import AdminInboxThreadList from '../AdminInboxThreadList.jsx';
import AdminInboxThreadDetail from '../AdminInboxThreadDetail.jsx';
import AdminInboxToolbar from '../AdminInboxToolbar.jsx';
import {
  fetchAdminInbox,
  updateAdminThreadState,
  escalateAdminThread,
  createAdminThread,
  listSupportAgents,
} from '../../../../services/adminMessaging.js';

vi.mock('../../../../services/adminMessaging.js', () => ({
  fetchAdminInbox: vi.fn(),
  updateAdminThreadState: vi.fn(),
  escalateAdminThread: vi.fn(),
  createAdminThread: vi.fn(),
  listSupportAgents: vi.fn(),
}));

vi.mock('../../messaging/ConversationMessage.jsx', () => ({
  __esModule: true,
  default: ({ message }) => <div data-testid={`message-${message.id}`}>{message.body}</div>,
}));

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('Admin inbox components', () => {
  it('validates and submits create thread form', async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 99 });
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminInboxCreateThreadForm open onClose={onClose} onCreate={onCreate} busy={false} />, 
    );

    const participantsInput = screen.getByLabelText(/participants/i);
    await runInAct(() => user.type(participantsInput, '101, 101, abc, 202'));
    const metadataInput = screen.getByLabelText(/metadata/i);
    await runInAct(() => user.type(metadataInput, '{{invalid'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /create/i })));

    expect(await screen.findByText(/metadata must be valid json/i)).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();

    await runInAct(() => user.clear(metadataInput));
    await act(async () => {
      fireEvent.change(metadataInput, { target: { value: JSON.stringify({ priority: 'urgent' }) } });
    });
    await runInAct(() => user.type(screen.getByLabelText(/subject/i), '  Escalation  '));
    await runInAct(() => user.click(screen.getByRole('button', { name: /create/i })));

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    const payload = onCreate.mock.calls[0][0];
    expect(payload).toMatchObject({
      subject: 'Escalation',
      channelType: 'support',
      participantIds: [101, 202],
      metadata: { priority: 'urgent' },
    });
    await waitFor(() => expect(screen.getByText(/conversation created/i)).toBeInTheDocument());
    await waitFor(() => expect(participantsInput).toHaveValue(''));
  });

  it('applies and resets filters', async () => {
    const user = userEvent.setup();
    const latest = { current: { channelTypes: [], states: [], labelIds: [] } };

    function Harness() {
      const [filters, setFilters] = useState({ channelTypes: [], states: [], labelIds: [] });
      latest.current = filters;
      return (
        <AdminInboxFilters
          filters={filters}
          onChange={(patch) => {
            const next = { ...filters, ...patch };
            latest.current = next;
            setFilters(next);
          }}
          labels={[{ id: 1, name: 'VIP', color: '#2563eb' }]}
          agents={[{ id: 7, firstName: 'Harper', lastName: 'Lee' }]}
          onReset={() => {
            latest.current = { channelTypes: [], states: [], labelIds: [] };
            setFilters({ channelTypes: [], states: [], labelIds: [] });
          }}
        />
      );
    }

    render(<Harness />);

    const channelSection = screen.getByText(/channel/i).closest('div');
    await runInAct(() => user.click(within(channelSection).getByRole('button', { name: /support/i })));
    expect(latest.current.channelTypes).toContain('support');

    const stateSection = screen.getByText(/state/i).closest('div');
    await runInAct(() => user.click(within(stateSection).getByRole('button', { name: /active/i })));
    expect(latest.current.states).toContain('active');

    await runInAct(() => user.click(screen.getByRole('button', { name: /more/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: 'VIP' })));
    expect(latest.current.labelIds).toContain('1');

    await runInAct(() => user.click(screen.getByRole('button', { name: /reset/i })));
    expect(latest.current).toEqual({ channelTypes: [], states: [], labelIds: [] });
  });

  it('handles label creation and editing', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({ id: 2 });
    const onUpdate = vi.fn().mockResolvedValue({ id: 1 });

    render(
      <AdminInboxLabelManager
        labels={[{ id: 1, name: 'Support', color: '#2563eb', description: 'Queue ownership' }]}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        busy={false}
      />,
    );

    await runInAct(() => user.type(screen.getByLabelText(/name/i), 'VIP customers'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /create/i })));
    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onCreate.mock.calls[0][0]).toMatchObject({ name: 'VIP customers' });
    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue(''));

    await runInAct(() => user.click(screen.getByRole('button', { name: /edit/i })));
    await runInAct(() => user.clear(screen.getByLabelText(/name/i)));
    await runInAct(() => user.type(screen.getByLabelText(/name/i), 'Support tier 1'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /update/i })));
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Support tier 1' })));
  });

  it('renders stats summary', () => {
    render(
      <AdminInboxStats
        metrics={{
          states: { active: 12 },
          supportStatuses: { waiting_on_customer: 4, in_progress: 3 },
          assignment: { unassigned: 5 },
        }}
        pagination={{ total: 42 }}
        lastSyncedAt={new Date('2024-01-01T12:00:00Z').toISOString()}
      />,
    );

    expect(screen.getByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/active/i).closest('div')).toHaveTextContent('12');
    expect(screen.getByText(/waiting/i).closest('div')).toHaveTextContent('7');
    expect(screen.getByText(/unassigned/i).closest('div')).toHaveTextContent('5');
    expect(screen.getByText(/synced/i)).toBeInTheDocument();
  });

  it('loads queue snapshot and handles interactions', async () => {
    const user = userEvent.setup();

    const thread = {
      id: 101,
      subject: 'Billing escalation',
      state: 'active',
      lastMessageAt: new Date('2024-01-20T10:00:00Z').toISOString(),
      supportCase: {
        status: 'triage',
        priority: 'high',
        assignedAgentId: 'agent-1',
      },
    };

    fetchAdminInbox.mockResolvedValue({
      data: [thread],
      metrics: { supportStatuses: { waiting_on_customer: 2 }, channels: { support: 1 } },
    });
    listSupportAgents.mockResolvedValue([
      { id: 'agent-1', firstName: 'Jordan', lastName: 'Lee' },
    ]);
    updateAdminThreadState.mockResolvedValue({ ...thread, state: 'archived' });
    escalateAdminThread.mockResolvedValue({
      id: 'case-22',
      status: 'in_progress',
      priority: 'urgent',
      escalatedAt: new Date().toISOString(),
    });
    createAdminThread.mockResolvedValue({
      id: 303,
      subject: 'New onboarding check-in',
      state: 'active',
      lastMessageAt: new Date().toISOString(),
    });

    const onThreadCreated = vi.fn();

    render(<AdminInboxQueueSnapshot onThreadCreated={onThreadCreated} />);

    await waitFor(() => expect(fetchAdminInbox).toHaveBeenCalled());
    const threadItem = (await screen.findByText(/billing escalation/i)).closest('li');
    expect(threadItem).not.toBeNull();

    await runInAct(() => user.selectOptions(within(threadItem).getByDisplayValue(/active/i), 'archived'));
    await waitFor(() => expect(updateAdminThreadState).toHaveBeenCalledWith(101, { state: 'archived' }));
    expect(await screen.findByText(/thread state updated/i)).toBeInTheDocument();

    const reasonInput = within(threadItem).getByPlaceholderText(/add escalation notes/i);
    await runInAct(() => user.type(reasonInput, '  VIP customer waiting '));
    await runInAct(() => user.selectOptions(within(threadItem).getByDisplayValue(/high/i), 'urgent'));
    await runInAct(() => user.click(within(threadItem).getByRole('button', { name: /escalate/i })));

    await waitFor(() =>
      expect(escalateAdminThread).toHaveBeenCalledWith(101, {
        reason: 'VIP customer waiting',
        priority: 'urgent',
      }),
    );
    expect(await screen.findByText(/thread escalated to support/i)).toBeInTheDocument();

    await runInAct(() => user.click(screen.getByRole('button', { name: /new thread/i })));
    await runInAct(() => user.type(screen.getByLabelText(/participants/i), '404, 505'));
    await runInAct(() => user.type(screen.getByLabelText(/subject/i), ' Onboarding '));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^create$/i })));

    await waitFor(() => expect(createAdminThread).toHaveBeenCalled());
    expect(createAdminThread.mock.calls[0][0]).toMatchObject({
      participantIds: [404, 505],
      subject: 'Onboarding',
    });
    await waitFor(() => expect(onThreadCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 303 })));
  });

  it('renders thread list and reacts to user input', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onRefresh = vi.fn();
    const onLoadMore = vi.fn();

    render(
      <AdminInboxThreadList
        actorId="admin-1"
        threads={[
          {
            id: 1,
            subject: 'Hiring sync',
            channelType: 'support',
            lastMessagePreview: 'Review portfolio',
            lastMessageAt: new Date('2024-03-01T10:00:00Z').toISOString(),
            unreadCount: 2,
            supportCase: { status: 'in_progress', priority: 'high' },
            labels: [{ id: '1', name: 'VIP', color: '#2563eb' }],
          },
          {
            id: 2,
            subject: 'Onboarding follow-up',
            channelType: 'announcements',
            lastMessagePreview: 'Sent agenda',
            lastMessageAt: new Date('2024-03-02T08:00:00Z').toISOString(),
            unreadCount: 0,
          },
        ]}
        selectedThreadId={2}
        onSelect={onSelect}
        loading={false}
        error={null}
        onRefresh={onRefresh}
        pagination={{ page: 1, totalPages: 2 }}
        onLoadMore={onLoadMore}
      />,
    );

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /hiring sync/i }));
    expect(onSelect).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('surfaces toolbar actions', async () => {
    const user = userEvent.setup();
    const callbacks = {
      onOpenFilters: vi.fn(),
      onOpenLabels: vi.fn(),
      onNewThread: vi.fn(),
      onRefresh: vi.fn(),
    };

    render(<AdminInboxToolbar {...callbacks} syncing={false} />);

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    await user.click(screen.getByRole('button', { name: /filters/i }));
    await user.click(screen.getByRole('button', { name: /labels/i }));
    await user.click(screen.getByRole('button', { name: /new/i }));

    expect(callbacks.onRefresh).toHaveBeenCalled();
    expect(callbacks.onOpenFilters).toHaveBeenCalled();
    expect(callbacks.onOpenLabels).toHaveBeenCalled();
    expect(callbacks.onNewThread).toHaveBeenCalled();
  });

  it('manages thread details workflows', async () => {
    const user = userEvent.setup();
    const onUpdateState = vi.fn();
    const onAssign = vi.fn();
    const onUpdateSupport = vi.fn();
    const onEscalate = vi.fn();
    const onSendMessage = vi.fn();
    const onSetLabels = vi.fn();
    const onOpenNewWindow = vi.fn();
    const onExpand = vi.fn();

    const thread = {
      id: 42,
      subject: 'Enterprise onboarding',
      channelType: 'support',
      createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      lastMessageAt: new Date('2024-01-01T01:00:00Z').toISOString(),
      state: 'active',
      supportCase: { status: 'triage', priority: 'medium', assignedTo: 'a-1' },
      labels: [{ id: '1', name: 'VIP', color: '#2563eb' }],
    };

    function Harness({ onSendMessage: handleSendMessage, ...rest }) {
      const [composer, setComposer] = useState('');
      return (
        <AdminInboxThreadDetail
          {...rest}
          composer={composer}
          onComposerChange={setComposer}
          onSendMessage={() => {
            handleSendMessage(composer);
            setComposer('');
          }}
        />
      );
    }

    render(
      <Harness
        actorId="admin-1"
        thread={thread}
        messages={[{ id: 'm-1', body: 'Welcome aboard!' }]}
        loading={false}
        error={null}
        sending={false}
        onUpdateState={onUpdateState}
        onAssign={onAssign}
        assigning={false}
        agents={[{ id: 'a-2', firstName: 'Jamie', lastName: 'Lee' }]}
        onUpdateSupport={onUpdateSupport}
        updatingSupport={false}
        onEscalate={onEscalate}
        escalating={false}
        labels={[{ id: '1', name: 'VIP', color: '#2563eb' }]}
        onSetLabels={onSetLabels}
        updatingLabels={false}
        onOpenNewWindow={onOpenNewWindow}
        onExpand={onExpand}
        onSendMessage={onSendMessage}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /window/i })));
    expect(onOpenNewWindow).toHaveBeenCalledWith(42);

    await runInAct(() => user.click(screen.getByRole('button', { name: /expand/i })));
    expect(onExpand).toHaveBeenCalled();

    const stateSection = screen.getByRole('heading', { name: /thread state/i }).closest('section');
    await runInAct(() => user.selectOptions(within(stateSection).getByRole('combobox'), 'archived'));
    await runInAct(() => user.click(within(stateSection).getByRole('button', { name: /update/i })));
    expect(onUpdateState).toHaveBeenCalledWith('archived');

    const assignmentSection = screen.getByRole('heading', { name: /assignment/i }).closest('section');
    await runInAct(() => user.selectOptions(within(assignmentSection).getByRole('combobox'), 'a-2'));
    await runInAct(() => user.click(within(assignmentSection).getByRole('button', { name: /assign/i })));
    expect(onAssign).toHaveBeenCalledWith({ agentId: 'a-2', notifyAgent: true });

    const supportSection = screen.getByRole('heading', { name: /support case/i }).closest('section');
    const [statusSelect, prioritySelect] = within(supportSection).getAllByRole('combobox');
    await runInAct(() => user.selectOptions(statusSelect, 'resolved'));
    await runInAct(() => user.selectOptions(prioritySelect, 'high'));
    const notesArea = within(supportSection).getByPlaceholderText(/notes/i);
    await runInAct(() => user.type(notesArea, 'Issue resolved'));
    await runInAct(() => user.click(within(supportSection).getByRole('button', { name: /save/i })));
    expect(onUpdateSupport).toHaveBeenCalledWith({
      status: 'resolved',
      metadata: { priority: 'high' },
      resolutionSummary: 'Issue resolved',
    });

    const escalateSection = screen.getByRole('heading', { name: /escalation/i }).closest('section');
    await runInAct(() => user.type(within(escalateSection).getByPlaceholderText(/reason/i), 'Needs audit'));
    await runInAct(() => user.selectOptions(within(escalateSection).getByRole('combobox'), 'urgent'));
    await runInAct(() => user.click(within(escalateSection).getByRole('button', { name: /escalate/i })));
    expect(onEscalate).toHaveBeenCalledWith({ reason: 'Needs audit', priority: 'urgent' });

    const labelsSection = screen.getByRole('heading', { name: /^labels$/i }).closest('section');
    await runInAct(() => user.click(within(labelsSection).getByRole('button', { name: /vip/i })));
    expect(onSetLabels).toHaveBeenCalledWith([]);

    const composer = screen.getByPlaceholderText(/reply/i);
    await runInAct(() => user.type(composer, 'Thanks for the update'));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^send$/i })));
    expect(onSendMessage).toHaveBeenCalledWith('Thanks for the update');
  });
});
