import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InboxSection from '../InboxSection.jsx';

const sessionStub = vi.hoisted(() => ({ session: { id: 500 } }));
const inboxStub = vi.hoisted(() => ({ current: null }));
const canAccessMessagingMock = vi.hoisted(() => vi.fn());
const getMessagingMembershipsMock = vi.hoisted(() => vi.fn());
const createThreadMock = vi.hoisted(() => vi.fn());
const sendMessageMock = vi.hoisted(() => vi.fn());
const markThreadReadMock = vi.hoisted(() => vi.fn());
const updateSupportStatusMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: () => sessionStub,
}));

vi.mock('../../../../../hooks/useFreelancerInboxWorkspace.js', () => ({
  __esModule: true,
  default: () => inboxStub.current,
}));

vi.mock('../../../../../constants/access.js', () => ({
  __esModule: true,
  canAccessMessaging: canAccessMessagingMock,
  getMessagingMemberships: getMessagingMembershipsMock,
}));

vi.mock('../../../../../services/messaging.js', () => ({
  __esModule: true,
  createThread: createThreadMock,
  sendMessage: sendMessageMock,
  markThreadRead: markThreadReadMock,
  updateSupportStatus: updateSupportStatusMock,
}));

function buildWorkspace(overrides = {}) {
  const addSavedReply = vi.fn().mockResolvedValue({ id: 1 });
  inboxStub.current = {
    workspace: {
      summary: { unreadThreads: 0, awaitingReply: 0, avgResponseMinutes: 0, openSupportCases: 0 },
      preferences: {
        timezone: 'UTC',
        notificationsEmail: 'freelancer@example.com',
        notificationsPush: true,
        autoArchiveAfterDays: 30,
        autoResponderEnabled: false,
        autoResponderMessage: '',
        escalationKeywords: [],
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '12:00' },
          sunday: { enabled: false, start: '09:00', end: '12:00' },
        },
      },
      participantDirectory: [],
      savedReplies: [],
      routingRules: [],
      ...overrides.workspace,
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
    updatePreferences: vi.fn().mockResolvedValue({}),
    addSavedReply,
    editSavedReply: vi.fn().mockResolvedValue({}),
    removeSavedReply: vi.fn().mockResolvedValue({}),
    addRoutingRule: vi.fn().mockResolvedValue({}),
    editRoutingRule: vi.fn().mockResolvedValue({}),
    removeRoutingRule: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
  return inboxStub.current;
}

describe('InboxSection', () => {
  beforeEach(() => {
    sessionStub.session = { id: 500, memberships: ['messaging:manage'] };
    canAccessMessagingMock.mockReset();
    getMessagingMembershipsMock.mockReset();
    createThreadMock.mockReset();
    sendMessageMock.mockReset();
    markThreadReadMock.mockReset();
    updateSupportStatusMock.mockReset();
  });

  it('requires messaging memberships when access is absent', () => {
    canAccessMessagingMock.mockReturnValue(false);
    getMessagingMembershipsMock.mockReturnValue(['messaging:manage', 'support']);
    buildWorkspace();

    render(
      <MemoryRouter>
        <InboxSection />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Messaging memberships required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage memberships/i })).toBeInTheDocument();
  });

  it('creates saved replies through the workspace form', async () => {
    canAccessMessagingMock.mockReturnValue(true);
    getMessagingMembershipsMock.mockReturnValue(['messaging:manage']);
    const workspaceState = buildWorkspace();

    render(
      <MemoryRouter>
        <InboxSection />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /New reply/i }));
    fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: 'Welcome' } });
    fireEvent.change(screen.getByLabelText(/Message body/i), { target: { value: 'Thanks for reaching out!' } });
    fireEvent.click(screen.getByRole('button', { name: /Save reply/i }));

    await waitFor(() => {
      expect(workspaceState.addSavedReply).toHaveBeenCalledWith({
        title: 'Welcome',
        body: 'Thanks for reaching out!',
        shortcut: '',
        category: '',
        isDefault: false,
      });
    });
  });
});
