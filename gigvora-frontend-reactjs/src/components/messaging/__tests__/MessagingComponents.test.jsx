import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MessagingDock from '../MessagingDock.jsx';
import ConversationMessage from '../ConversationMessage.jsx';
import AgoraCallPanel from '../AgoraCallPanel.jsx';
import useSession from '../../../hooks/useSession.js';
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
    render(<MessagingDock />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /show messages/i }));
    });

    await waitFor(() => expect(fetchInbox).toHaveBeenCalled());
    expect(await screen.findByText('See you on the call')).toBeInTheDocument();

    await waitFor(() => expect(fetchThreadMessages).toHaveBeenCalledWith('thread-1', expect.any(Object)));
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

  it('hides dock when the user is signed out', () => {
    mockUseSession.mockReturnValue({ session: null, isAuthenticated: false });
    render(<MessagingDock />);
    expect(screen.queryByRole('button', { name: /show messages/i })).not.toBeInTheDocument();
  });
});
