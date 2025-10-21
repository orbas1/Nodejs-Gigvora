import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@headlessui/react', () => {
  const React = require('react');

  const DialogComponent = Object.assign(
    ({ children, onClose, ...props }) => (
      <div data-testid="dialog" {...props} onClick={(event) => props.onClick?.(event)}>
        {typeof children === 'function' ? children({ close: onClose }) : children}
      </div>
    ),
    {
      Panel: ({ children, ...panelProps }) => (
        <div data-testid="dialog-panel" {...panelProps}>
          {children}
        </div>
      ),
      Title: ({ children, ...titleProps }) => (
        <h2 data-testid="dialog-title" {...titleProps}>
          {children}
        </h2>
      ),
    },
  );

  const TransitionRoot = ({ children }) => <>{typeof children === 'function' ? children({}) : children}</>;
  const TransitionChild = ({ children }) => <>{typeof children === 'function' ? children({}) : children}</>;

  return {
    Dialog: DialogComponent,
    Transition: {
      Root: TransitionRoot,
      Child: TransitionChild,
    },
  };
});

const messagePanelSpy = vi.fn();

vi.mock('../pages/dashboards/agency/inbox/components/MessagePanel.jsx', () => ({
  __esModule: true,
  default: (props) => {
    messagePanelSpy(props);
    return (
      <div data-testid="message-panel">
        <span>MessagePanel</span>
      </div>
    );
  },
}));

import SupportDrawer from '../pages/dashboards/agency/inbox/components/SupportDrawer.jsx';
import ThreadPanel from '../pages/dashboards/agency/inbox/components/ThreadPanel.jsx';
import ThreadViewerDialog from '../pages/dashboards/agency/inbox/components/ThreadViewerDialog.jsx';

describe('Agency inbox support tooling', () => {
  beforeEach(() => {
    messagePanelSpy.mockClear();
  });

  const baseSupportProps = {
    open: true,
    onClose: vi.fn(),
    supportCase: {
      id: 14,
      status: 'triage',
      resolutionSummary: 'Investigating root cause',
      assignedAgent: { id: 7 },
    },
    thread: { id: 99 },
    onEscalate: vi.fn(),
    onAssign: vi.fn(),
    onUpdateStatus: vi.fn(),
    onChangeState: vi.fn(),
    onMute: vi.fn(),
    onAutomationChange: vi.fn(),
    onSaveAutomations: vi.fn(),
    automationSettings: { autoRoute: true, shareTranscript: false },
    workspaceMembers: [
      { userId: 7, status: 'active', user: { firstName: 'Ada', lastName: 'Lovelace' } },
      { userId: 11, status: 'invited', user: { firstName: 'Invited', lastName: 'User' } },
    ],
    escalating: false,
    assigning: false,
    updatingStatus: false,
    stateUpdating: false,
    muting: false,
    savingAutomations: false,
  };

  it('allows escalation with trimmed reason and chosen priority', async () => {
    const user = userEvent.setup();
    const onEscalate = vi.fn();
    render(<SupportDrawer {...baseSupportProps} onEscalate={onEscalate} />);

    const reasonField = screen.getByPlaceholderText('Reason');
    await user.type(reasonField, '  Investigate delays  ');

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'urgent');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onEscalate).toHaveBeenCalledWith({ reason: 'Investigate delays', priority: 'urgent' });
  });

  it('surfaces assignment, status, conversation, mute, and automation actions', async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    const onUpdateStatus = vi.fn();
    const onChangeState = vi.fn();
    const onMute = vi.fn();
    const onAutomationChange = vi.fn();
    const onSaveAutomations = vi.fn();

    render(
      <SupportDrawer
        {...baseSupportProps}
        onAssign={onAssign}
        onUpdateStatus={onUpdateStatus}
        onChangeState={onChangeState}
        onMute={onMute}
        onAutomationChange={onAutomationChange}
        onSaveAutomations={onSaveAutomations}
      />,
    );

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[1], '7');
    await user.click(screen.getByRole('button', { name: /set owner/i }));

    expect(onAssign).toHaveBeenCalledWith({ agentId: 7 });

    const resolutionArea = screen.getByPlaceholderText('Resolution');
    await user.clear(resolutionArea);
    await user.type(resolutionArea, 'Restored connectivity');
    await user.selectOptions(selects[2], 'resolved');
    await user.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onUpdateStatus).toHaveBeenCalledWith({ status: 'resolved', resolutionSummary: 'Restored connectivity' });

    await user.click(screen.getByRole('button', { name: 'Archived' }));
    expect(onChangeState).toHaveBeenCalledWith('archived');

    await user.selectOptions(selects[3], '3600000');
    await user.click(screen.getByRole('button', { name: /^set$/i }));
    expect(onMute).toHaveBeenCalledWith('3600000');

    const automationToggle = screen.getByRole('checkbox', { name: 'Share transcript' });
    await user.click(automationToggle);
    expect(onAutomationChange).toHaveBeenCalledWith({ ...baseSupportProps.automationSettings, shareTranscript: true });

    await user.click(screen.getByRole('button', { name: /save automations/i }));
    expect(onSaveAutomations).toHaveBeenCalledWith(baseSupportProps.automationSettings);
  });

  it('shows friendly error banner when provided', () => {
    render(<SupportDrawer {...baseSupportProps} error="Failed to update" />);
    expect(screen.getByText('Failed to update')).toBeInTheDocument();
  });

  it('renders thread list with search, states, and selection handling', async () => {
    const user = userEvent.setup();
    const now = Date.now();
    const threads = [
      {
        id: 1,
        subject: 'First thread',
        lastMessageAt: new Date(now).toISOString(),
        viewerState: { lastReadAt: new Date(now - 1000 * 60 * 5).toISOString() },
        lastMessagePreview: 'Preview message',
      },
    ];
    const onSelectThread = vi.fn();
    const onSearchChange = vi.fn();

    render(
      <ThreadPanel
        threads={threads}
        loading={false}
        error={null}
        searchValue=""
        onSearchChange={onSearchChange}
        selectedThreadId={null}
        onSelectThread={onSelectThread}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search'), 'status');
    expect(onSearchChange).toHaveBeenCalled();
    const searchValues = onSearchChange.mock.calls.map((call) => call[0]).join('');
    expect(searchValues).toContain('status');

    await user.click(screen.getByRole('button', { name: /first thread/i }));
    expect(onSelectThread).toHaveBeenCalledWith(1);
  });

  it('shows skeletons when loading and empty state otherwise', () => {
    const { rerender, container } = render(<ThreadPanel threads={[]} loading error={null} searchValue="" />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    rerender(<ThreadPanel threads={[]} loading={false} error={null} searchValue="" />);
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('passes data through to MessagePanel in ThreadViewerDialog and handles close', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const thread = { id: 9 };
    const messages = [{ id: 1, body: 'Hello' }];

    render(
      <ThreadViewerDialog
        open
        onClose={onClose}
        thread={thread}
        messages={messages}
        composer="Draft"
        onComposerChange={() => {}}
        onSend={() => {}}
        sending={false}
        loading={false}
        error={null}
        onRefresh={() => {}}
        quickReplies={[{ id: '1', body: 'Thanks!' }]}
        onSelectQuickReply={() => {}}
        actorId={42}
        onOpenSupport={() => {}}
        onOpenPeople={() => {}}
      />,
    );

    expect(screen.getByTestId('message-panel')).toBeInTheDocument();
    expect(messagePanelSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        thread,
        messages,
        composer: 'Draft',
        actorId: 42,
      }),
    );

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
