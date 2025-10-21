import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardInboxWorkspace from '../DashboardInboxWorkspace.jsx';

const toggleModal = vi.fn();
const refreshThreads = vi.fn();

const controller = {
  state: {
    threads: [
      {
        id: 'thread-1',
        title: 'Welcome',
        lastActivityLabel: 'Just now',
        participantsLabel: 'Alex, Taylor',
        lastMessagePreview: 'Let\'s get started',
        unread: true,
      },
    ],
    rawThreads: [],
    threadsLoading: false,
    threadsError: null,
    selectedThreadId: null,
    selectedThread: null,
    messages: [],
    messagesLoading: false,
    messagesError: null,
    composer: '',
    sending: false,
    filters: { view: 'all', unreadOnly: false, channel: 'all', search: '' },
    modals: { newThread: false, call: false, escalate: false, assign: false, supportStatus: false },
    drawers: { filters: false, details: false, support: false },
    callSession: null,
    callBusy: false,
    callError: null,
    pendingAction: null,
  },
  actions: {
    toggleModal,
    toggleDrawer: vi.fn(),
    setFilters: vi.fn(),
    selectThread: vi.fn(),
    refreshThreads,
    sendMessage: vi.fn(),
    beginCall: vi.fn(),
    changeThreadState: vi.fn(),
    toggleMute: vi.fn(),
    escalateCase: vi.fn(),
    assignSupportAgent: vi.fn(),
    updateSupportStatus: vi.fn(),
    createThread: vi.fn(),
    setComposer: vi.fn(),
    loadMessages: vi.fn(),
    loadThreadDetails: vi.fn(),
  },
};

vi.mock('../useInboxController.js', () => ({
  __esModule: true,
  default: vi.fn(() => controller),
}));

describe('DashboardInboxWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the inbox workspace and allows creating a conversation', async () => {
    render(<DashboardInboxWorkspace />);

    expect(screen.getByText(/organize conversations/i)).toBeInTheDocument();
    expect(screen.getByText('Welcome')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /new chat/i }));
    expect(toggleModal).toHaveBeenCalledWith('newThread', true);

    expect(refreshThreads).toHaveBeenCalledTimes(0);
  });
});
