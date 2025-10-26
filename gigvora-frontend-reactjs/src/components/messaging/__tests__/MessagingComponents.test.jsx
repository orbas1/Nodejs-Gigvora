import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import MessagingDock from '../MessagingDock.jsx';
import ConversationMessage from '../ConversationMessage.jsx';
import AgoraCallPanel from '../AgoraCallPanel.jsx';
import MessagesInbox from '../MessagesInbox.jsx';
import MessageComposerBar from '../MessageComposerBar.jsx';
import useSession from '../../../hooks/useSession.js';
import { LanguageProvider } from '../../../context/LanguageContext.jsx';
import {
  fetchInbox,
  fetchThreadMessages,
  sendMessage,
  createCallSession,
} from '../../../services/messaging.js';

vi.mock('../../../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../services/messaging.js', () => ({
  fetchInbox: vi.fn(),
  fetchThreadMessages: vi.fn(),
  sendMessage: vi.fn(),
  createCallSession: vi.fn(),
}));

const agoraMocks = vi.hoisted(() => {
  const joinMock = vi.fn();
  const publishMock = vi.fn();
  const leaveMock = vi.fn();
  const subscribeMock = vi.fn();
  const removeAllListenersMock = vi.fn();
  const onMock = vi.fn();
  const audioTrack = {
    stop: vi.fn(),
    close: vi.fn(),
    play: vi.fn(),
    setEnabled: vi.fn(() => Promise.resolve()),
  };
  const videoTrack = {
    stop: vi.fn(),
    close: vi.fn(),
    play: vi.fn(),
    setEnabled: vi.fn(() => Promise.resolve()),
  };
  return {
    joinMock,
    publishMock,
    leaveMock,
    subscribeMock,
    removeAllListenersMock,
    onMock,
    audioTrack,
    videoTrack,
    createClientMock: vi.fn(() => ({
      remoteUsers: [],
      join: joinMock,
      publish: publishMock,
      subscribe: subscribeMock,
      leave: leaveMock,
      removeAllListeners: removeAllListenersMock,
      on: onMock,
    })),
    createMicrophoneAndCameraTracksMock: vi.fn(() => Promise.resolve([audioTrack, videoTrack])),
    createMicrophoneAudioTrackMock: vi.fn(() => Promise.resolve(audioTrack)),
  };
});

vi.mock('agora-rtc-sdk-ng', () => ({
  default: {
    createClient: agoraMocks.createClientMock,
    createMicrophoneAndCameraTracks: agoraMocks.createMicrophoneAndCameraTracksMock,
    createMicrophoneAudioTrack: agoraMocks.createMicrophoneAudioTrackMock,
  },
}));

const mockUseSession = useSession;

function renderWithLanguage(ui) {
  return render(ui, {
    wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
  });
}

const baseSession = {
  session: { id: 1, memberships: ['user'] },
  isAuthenticated: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSession.mockReturnValue(baseSession);
  agoraMocks.joinMock.mockResolvedValue();
  agoraMocks.publishMock.mockResolvedValue();
  agoraMocks.subscribeMock.mockResolvedValue();
  agoraMocks.leaveMock.mockResolvedValue();
});

afterEach(() => {
  vi.clearAllMocks();
});

function ControlledComposer({ initialValue = '', ...props }) {
  const [value, setValue] = useState(initialValue);
  return (
    <MessageComposerBar
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

describe('ConversationMessage', () => {
  it('renders standard message bubbles with sender context', () => {
    const message = {
      id: 'msg-1',
      createdAt: '2024-06-10T10:00:00Z',
      senderId: 2,
      sender: { id: 2, firstName: 'Sky', lastName: 'Rivera' },
      body: 'Thanks for sharing the deck! 🚀',
      messageType: 'text',
    };

    render(<ConversationMessage message={message} actorId={1} />);

    expect(screen.getByText(/Sky Rivera/)).toBeInTheDocument();
    expect(screen.getByText('Thanks for sharing the deck! 🚀')).toBeInTheDocument();
  });

  it('renders metadata links beneath the message body when provided', () => {
    const message = {
      id: 'msg-2',
      createdAt: '2024-06-11T10:00:00Z',
      senderId: 3,
      sender: { id: 3, firstName: 'Mira', lastName: 'Stone' },
      body: 'Sharing the case study here.',
      messageType: 'text',
      metadata: {
        links: [{ title: 'Case study', url: 'https://gigvora.com/case-study' }],
      },
    };

    render(<ConversationMessage message={message} actorId={1} />);

    const link = screen.getByRole('link', { name: /Case study/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://gigvora.com/case-study');
  });

  it('renders call events and disables join button when call ended', () => {
    const message = {
      id: 'call-1',
      createdAt: '2024-06-10T10:00:00Z',
      senderId: 1,
      sender: { id: 1, firstName: 'Alex', lastName: 'Rivers' },
      messageType: 'event',
      metadata: {
        eventType: 'call',
        call: {
          id: 'session-1',
          type: 'video',
          expiresAt: '2024-06-09T10:00:00Z',
          participants: [{ userId: 1 }, { userId: 2 }],
        },
      },
    };

    render(<ConversationMessage message={message} actorId={1} joiningCall activeCallId={null} />);

    const joinButton = screen.getByRole('button', { name: /call ended/i });
    expect(joinButton).toBeDisabled();
    expect(screen.getByText('Participants: You, User 2')).toBeInTheDocument();
  });
});

describe('MessagesInbox', () => {
  it('filters threads with search and unread toggle', async () => {
    const user = userEvent.setup();
    const threads = [
      {
        id: 'thread-1',
        subject: 'Product kickoff',
        pinned: true,
        unreadCount: 0,
        channelType: 'direct',
        lastMessageAt: '2024-06-09T10:00:00Z',
        participants: [{ userId: 2, user: { firstName: 'Sky', lastName: 'Rivera' } }],
      },
      {
        id: 'thread-2',
        subject: 'Growth sync',
        unreadCount: 2,
        channelType: 'support',
        lastMessageAt: '2024-06-11T10:00:00Z',
        participants: [{ userId: 3, user: { firstName: 'Mira', lastName: 'Stone' } }],
      },
      {
        id: 'thread-3',
        subject: 'Design QA',
        unreadCount: 1,
        channelType: 'product',
        lastMessageAt: '2024-06-12T10:00:00Z',
        participants: [{ userId: 4, user: { firstName: 'Leo', lastName: 'Park' } }],
      },
    ];

    const onSelectThread = vi.fn();

    render(
      <MessagesInbox
        actorId={1}
        threads={threads}
        loading={false}
        onSelectThread={onSelectThread}
        selectedThreadId="thread-1"
        onTogglePin={vi.fn()}
      />,
    );

    expect(screen.getByText('Product kickoff')).toBeInTheDocument();
    const search = screen.getByPlaceholderText(/search by name/i);
    await act(async () => {
      await user.type(search, 'growth');
    });
    expect(screen.getByText('Growth sync')).toBeInTheDocument();
    expect(screen.queryByText('Product kickoff')).not.toBeInTheDocument();

    await act(async () => {
      await user.clear(search);
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Unread/i }));
    });
    expect(screen.queryByText('Product kickoff')).not.toBeInTheDocument();
    expect(screen.getByText('Design QA')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByLabelText('Open conversation Design QA'));
    });
    expect(onSelectThread).toHaveBeenCalledWith('thread-3');
  });
});

describe('MessageComposerBar', () => {
  it('sends message payload with links metadata', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue();

    render(
      <ControlledComposer
        threadId="thread-1"
        initialValue="Let’s align"
        onSend={onSend}
        savedReplies={[]}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Add link/i }));
    });
    await act(async () => {
      await user.type(screen.getByPlaceholderText(/Link title/i), 'Roadmap');
    });
    await act(async () => {
      await user.type(screen.getByPlaceholderText(/https:\/\//i), 'https://gigvora.com/roadmap');
    });
    const attachButton = screen.getByRole('button', { name: /^Attach$/i });
    await act(async () => {
      await user.click(attachButton);
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Send message/i }));
    });

    await waitFor(() => expect(onSend).toHaveBeenCalled());
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'Let’s align',
        metadata: {
          links: [expect.objectContaining({ url: 'https://gigvora.com/roadmap', title: 'Roadmap' })],
        },
      }),
    );
  });

  it('inserts saved reply content into composer', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ControlledComposer
        threadId="thread-1"
        savedReplies={[{ id: 'reply-1', title: 'Welcome note', body: 'Hello there!' }]}
        onChange={onChange}
      />,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Saved replies/i }));
    });
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Welcome note/i }));
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('Hello there!'));
  });
});

describe('AgoraCallPanel', () => {
  const baseSessionData = {
    agoraAppId: 'test-app',
    channelName: 'room-1',
    rtcToken: 'token',
    identity: 'user-1',
    callType: 'video',
    expiresAt: '2024-07-01T10:00:00Z',
  };

  it('joins Agora session and toggles microphone', async () => {
    render(<AgoraCallPanel session={baseSessionData} onClose={vi.fn()} />);

    await waitFor(() => expect(agoraMocks.joinMock).toHaveBeenCalled());
    expect(agoraMocks.publishMock).toHaveBeenCalled();

    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /mute/i }));
    });
    expect(agoraMocks.audioTrack.setEnabled).toHaveBeenCalledWith(false);

    await waitFor(() => expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument());

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /unmute/i }));
    });
    expect(agoraMocks.audioTrack.setEnabled).toHaveBeenLastCalledWith(true);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /stop video/i }));
    });
    expect(agoraMocks.videoTrack.setEnabled).toHaveBeenCalledWith(false);

    await waitFor(() => expect(screen.getByRole('button', { name: /start video/i })).toBeInTheDocument());

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /start video/i }));
    });
    expect(agoraMocks.videoTrack.setEnabled).toHaveBeenLastCalledWith(true);
  });

  it('cleans up when leaving the call', async () => {
    const onClose = vi.fn();
    render(<AgoraCallPanel session={baseSessionData} onClose={onClose} />);

    await waitFor(() => expect(agoraMocks.joinMock).toHaveBeenCalled());

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /leave call/i }));
    });

    await waitFor(() => expect(agoraMocks.leaveMock).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });
});

describe('MessagingDock', () => {
  const thread = {
    id: 'thread-1',
    participants: [
      { userId: 1, user: { firstName: 'Alex', lastName: 'Rivers' } },
      { userId: 2, user: { firstName: 'Sky', lastName: 'Patel' } },
    ],
    lastMessageAt: '2024-06-10T09:00:00Z',
    lastMessagePreview: 'See you on the call',
    unreadCount: 1,
  };
  const message = {
    id: 'message-1',
    createdAt: '2024-06-10T08:55:00Z',
    senderId: 2,
    sender: { id: 2, firstName: 'Sky', lastName: 'Patel' },
    body: 'Ready when you are',
    messageType: 'text',
  };

  beforeEach(() => {
    fetchInbox.mockResolvedValue({ data: [thread] });
    fetchThreadMessages.mockResolvedValue({ data: [message] });
    sendMessage.mockResolvedValue({ ...message, id: 'message-2', body: 'Sending notes shortly' });
    createCallSession.mockResolvedValue({
      callId: 'call-1',
      callType: 'video',
      channelName: 'room-1',
      agoraAppId: 'app',
      rtcToken: 'token',
      identity: 'user-1',
      expiresAt: '2024-07-01T10:00:00Z',
      message: {
        id: 'call-message',
        createdAt: '2024-06-10T09:05:00Z',
        senderId: 1,
        sender: { id: 1, firstName: 'Alex', lastName: 'Rivers' },
        messageType: 'event',
        metadata: { eventType: 'call', call: { id: 'call-1', type: 'video' } },
      },
    });
  });

  it('loads inbox, sends messages, and starts a call', async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithLanguage(<MessagingDock />);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /show messages/i }));
    });

    await waitFor(() => expect(fetchInbox).toHaveBeenCalled());
    expect(fetchInbox).toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(Number), includeParticipants: true, page: 1, pageSize: 20 }),
    );
    expect(await screen.findByText('See you on the call')).toBeInTheDocument();

    await waitFor(() => expect(fetchThreadMessages).toHaveBeenCalled());
    expect(await screen.findByText('Ready when you are')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/write your reply/i);

    await act(async () => {
      await user.type(textarea, ' Sending notes ');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^send$/i }));
    });
    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(sendMessage).toHaveBeenCalledWith('thread-1', expect.objectContaining({ body: 'Sending notes' }));

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /start video/i }));
    });
    await waitFor(() => expect(createCallSession).toHaveBeenCalledWith('thread-1', expect.any(Object)));
    expect(await screen.findByText(/video call in progress/i)).toBeInTheDocument();
  });

  it('hides dock when the user is signed out', async () => {
    mockUseSession.mockReturnValue({ session: null, isAuthenticated: false });
    await act(async () => {
      renderWithLanguage(<MessagingDock />);
    });
    expect(screen.queryByRole('button', { name: /show messages/i })).not.toBeInTheDocument();
  });

  it('fetches older pages when load more is requested', async () => {
    const olderThread = {
      ...thread,
      id: 'thread-2',
      lastMessagePreview: 'Follow-up sync',
      unreadCount: 0,
    };
    fetchInbox.mockReset();
    fetchInbox
      .mockResolvedValueOnce({ data: [thread], meta: { hasMore: true } })
      .mockResolvedValueOnce({ data: [olderThread], meta: { hasMore: false } });
    fetchThreadMessages.mockResolvedValue({ data: [message] });

    const user = userEvent.setup();
    await act(async () => {
      renderWithLanguage(<MessagingDock />);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /show messages/i }));
    });

    await screen.findByText('See you on the call');
    const loadMoreButton = await screen.findByRole('button', { name: /load older conversations/i });
    await act(async () => {
      await user.click(loadMoreButton);
    });

    await waitFor(() =>
      expect(fetchInbox).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 20, includeParticipants: true }),
      ),
    );
    expect(await screen.findByText('Follow-up sync')).toBeInTheDocument();
  });
});
