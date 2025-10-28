import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InboxSection from '../InboxSection.jsx';

const refreshMock = vi.fn();
const sendMessageMock = vi.fn(() => Promise.resolve());

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => ({ session: { id: 500 } }),
}));

vi.mock('../../../../../hooks/useFreelancerInboxWorkspace.js', () => ({
  __esModule: true,
  default: () => ({
    workspace: {
      activeThreads: [
        {
          id: 'thread-1',
          title: 'Archie White',
          preview: 'Great connecting earlier today.',
          lastActivityAt: '2024-04-10T10:00:00Z',
          unread: true,
          messages: [
            {
              id: 'msg-1',
              body: 'Great connecting earlier today.',
              author: { id: 'thread-1-author', name: 'Archie White' },
              createdAt: '2024-04-10T10:00:00Z',
            },
          ],
        },
        {
          id: 'thread-2',
          title: 'Jamila Thomas',
          preview: 'Let’s sync tomorrow.',
          lastActivityAt: '2024-04-09T12:00:00Z',
          unread: false,
          messages: [
            {
              id: 'msg-2',
              body: 'Let’s sync tomorrow.',
              author: { id: 'thread-2-author', name: 'Jamila Thomas' },
              createdAt: '2024-04-09T12:00:00Z',
            },
          ],
        },
      ],
    },
    loading: false,
    error: null,
    fromCache: false,
    lastSyncedAt: '2024-04-10T10:30:00Z',
    refresh: refreshMock,
  }),
}));

vi.mock('../../../../../services/messaging.js', () => ({
  __esModule: true,
  sendMessage: (...args) => sendMessageMock(...args),
}));

describe('InboxSection', () => {
  beforeEach(() => {
    refreshMock.mockClear();
    sendMessageMock.mockClear();
  });

  it('renders messaging header and thread list', () => {
    render(<InboxSection />);

    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText(/Stay on top of recruiter/i)).toBeInTheDocument();
    expect(screen.getAllByText('Archie White').length).toBeGreaterThan(0);
    expect(screen.getByText('Inbox health')).toBeInTheDocument();
  });

  it('sends a message from the composer', async () => {
    const user = userEvent.setup();
    render(<InboxSection />);

    await user.type(screen.getByPlaceholderText(/Write a message/i), 'Appreciate the intro!');
    await user.click(screen.getByRole('button', { name: /Send/i }));

    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith('thread-1', {
        userId: 500,
        body: 'Appreciate the intro!',
      });
    });
  });
});
