import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useInboxController from '../useInboxController.js';

const fetchInbox = vi.fn();
const fetchThread = vi.fn();
const fetchThreadMessages = vi.fn();
const sendMessage = vi.fn();
const createCallSession = vi.fn();
const createThread = vi.fn();
const markThreadRead = vi.fn();
const updateThreadState = vi.fn();
const muteThread = vi.fn();
const escalateThread = vi.fn();
const assignSupportAgent = vi.fn();
const updateSupportStatus = vi.fn();

vi.mock('../../../hooks/useSession.js', () => ({
  default: () => ({
    session: { id: 101, profileId: 201 },
    isAuthenticated: true,
  }),
}));

vi.mock('../../../services/messaging.js', () => ({
  fetchInbox: (...args) => fetchInbox(...args),
  fetchThread: (...args) => fetchThread(...args),
  fetchThreadMessages: (...args) => fetchThreadMessages(...args),
  sendMessage: (...args) => sendMessage(...args),
  createCallSession: (...args) => createCallSession(...args),
  createThread: (...args) => createThread(...args),
  markThreadRead: (...args) => markThreadRead(...args),
  updateThreadState: (...args) => updateThreadState(...args),
  muteThread: (...args) => muteThread(...args),
  escalateThread: (...args) => escalateThread(...args),
  assignSupportAgent: (...args) => assignSupportAgent(...args),
  updateSupportStatus: (...args) => updateSupportStatus(...args),
}));

describe('useInboxController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchInbox.mockResolvedValue({
      data: [
        {
          id: 'thread-1',
          subject: 'Welcome',
          lastMessagePreview: 'Hello',
          participants: [{ id: 1, name: 'Alex' }],
          channelType: 'direct',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
    fetchThread.mockResolvedValue({
      data: {
        id: 'thread-1',
        subject: 'Welcome',
        supportCase: null,
      },
    });
    fetchThreadMessages.mockResolvedValue([
      {
        id: 'msg-1',
        body: 'Hello there',
        createdAt: '2024-01-01T00:00:00Z',
        authorId: 101,
      },
    ]);
    sendMessage.mockResolvedValue({ data: { id: 'msg-2', body: 'Hi!', createdAt: '2024-01-01T00:01:00Z' } });
    createCallSession.mockResolvedValue({ data: { channelName: 'room', token: 'abc' } });
    createThread.mockResolvedValue({ data: { id: 'thread-2', subject: 'New thread' } });
    markThreadRead.mockResolvedValue({});
    updateThreadState.mockResolvedValue({});
    muteThread.mockResolvedValue({});
    escalateThread.mockResolvedValue({});
    assignSupportAgent.mockResolvedValue({});
    updateSupportStatus.mockResolvedValue({});
  });

  it('loads threads, allows selecting a thread, and sending messages', async () => {
    const { result } = renderHook(() => useInboxController());

    await act(async () => {
      await result.current.actions.refreshThreads();
    });

    await waitFor(() => expect(fetchInbox).toHaveBeenCalled());
    await waitFor(() => expect(result.current.state.threads).toHaveLength(1));

    await act(async () => {
      await result.current.actions.selectThread('thread-1');
    });

    await waitFor(() => expect(fetchThreadMessages).toHaveBeenCalledWith('thread-1', expect.any(Object)));
    await waitFor(() => expect(result.current.state.messages).toHaveLength(1));

    await act(async () => {
      await result.current.actions.sendMessage(' Hello team ');
    });

    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith(
        'thread-1',
        expect.objectContaining({ body: 'Hello team', userId: 101 }),
      ),
    );
  });
});
