import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminInboxThreadList from '../AdminInboxThreadList.jsx';
import AdminInboxToolbar from '../AdminInboxToolbar.jsx';

async function runInAct(callback) {
  await act(async () => {
    await callback();
  });
}

describe('AdminInboxThreadList', () => {
  const sampleThreads = [
    {
      id: 'thread-1',
      subject: 'Escalated ticket',
      lastMessagePreview: 'Need help with billing.',
      lastMessageAt: new Date('2024-01-02T08:00:00Z').toISOString(),
      unreadCount: 2,
      labels: [
        { id: 'label-1', name: 'Billing', color: '#38bdf8' },
      ],
      supportCase: { status: 'open', priority: 'urgent' },
      participants: [
        { userId: 'user-1', user: { firstName: 'Alex', lastName: 'Customer' } },
        { userId: 'agent-1', user: { firstName: 'Dana', lastName: 'Support' } },
      ],
    },
    {
      id: 'thread-2',
      subject: 'Account question',
      lastMessagePreview: 'How do I reset my password?',
      lastMessageAt: new Date('2024-01-03T16:00:00Z').toISOString(),
      supportCase: { status: 'awaiting_customer', priority: 'standard' },
      participants: [{ userId: 'user-2', user: { firstName: 'Jordan', lastName: 'Member' } }],
    },
  ];

  it('renders threads, handles refresh, and pagination', async () => {
    const user = userEvent.setup();
    const handlers = {
      onSelect: vi.fn(),
      onRefresh: vi.fn(),
      onLoadMore: vi.fn(),
    };

    render(
      <AdminInboxThreadList
        threads={sampleThreads}
        actorId="agent-1"
        selectedThreadId="thread-2"
        onSelect={handlers.onSelect}
        onRefresh={handlers.onRefresh}
        onLoadMore={handlers.onLoadMore}
        pagination={{ page: 1, totalPages: 3 }}
        loading={false}
        error={null}
      />,
    );

    expect(screen.getByText(/threads/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load more/i })).toBeEnabled();

    await runInAct(() => user.click(screen.getByRole('button', { name: /refresh/i })));
    expect(handlers.onRefresh).toHaveBeenCalledTimes(1);

    await runInAct(() => user.click(screen.getByRole('button', { name: /load more/i })));
    expect(handlers.onLoadMore).toHaveBeenCalledTimes(1);

    const firstThread = screen.getByRole('button', { name: /escalated ticket/i });
    await runInAct(() => user.click(firstThread));
    expect(handlers.onSelect).toHaveBeenCalledWith('thread-1');

    const badges = within(firstThread).getAllByText(/open|urgent/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('communicates loading and error states', async () => {
    const user = userEvent.setup();
    const handlers = { onRefresh: vi.fn() };

    const { rerender } = render(
      <AdminInboxThreadList
        threads={[]}
        actorId="agent-1"
        selectedThreadId={null}
        onRefresh={handlers.onRefresh}
        loading
        error={null}
        pagination={{ page: 1, totalPages: 1 }}
      />,
    );

    expect(screen.getByRole('region', { name: /inbox threads/i })).toHaveAttribute('aria-busy', 'true');

    rerender(
      <AdminInboxThreadList
        threads={[]}
        actorId="agent-1"
        selectedThreadId={null}
        onRefresh={handlers.onRefresh}
        loading={false}
        error="Network error"
        pagination={{ page: 1, totalPages: 1 }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);

    await runInAct(() => user.click(screen.getByRole('button', { name: /refresh/i })));
    expect(handlers.onRefresh).toHaveBeenCalled();
  });
});

describe('AdminInboxToolbar', () => {
  it('invokes toolbar actions and disables refresh while syncing', async () => {
    const user = userEvent.setup();
    const callbacks = {
      onOpenFilters: vi.fn(),
      onOpenLabels: vi.fn(),
      onNewThread: vi.fn(),
      onRefresh: vi.fn(),
    };

    const { rerender } = render(
      <AdminInboxToolbar
        {...callbacks}
        syncing={false}
      />,
    );

    await runInAct(() => user.click(screen.getByRole('button', { name: /^refresh$/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: /filters/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: /labels/i })));
    await runInAct(() => user.click(screen.getByRole('button', { name: /^new$/i })));

    expect(callbacks.onRefresh).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenFilters).toHaveBeenCalledTimes(1);
    expect(callbacks.onOpenLabels).toHaveBeenCalledTimes(1);
    expect(callbacks.onNewThread).toHaveBeenCalledTimes(1);

    rerender(<AdminInboxToolbar {...callbacks} syncing />);
    const refreshButton = screen.getByRole('button', { name: /refreshing/i });
    expect(refreshButton).toBeDisabled();
  });
});
