import { describe, expect, it, beforeEach, afterAll, beforeAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPage from '../pages/NotificationsPage.jsx';
import useSession from '../hooks/useSession.js';
import useNotificationCenter from '../hooks/useNotificationCenter.js';
import useAuthorization from '../hooks/useAuthorization.js';
import { fetchNotificationPreferences, updateNotificationPreferences } from '../services/notificationCenter.js';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useNotificationCenter.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useAuthorization.js', () => ({
  default: vi.fn(),
}));

vi.mock('../services/notificationCenter.js', () => ({
  fetchNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => mockNavigate),
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <NotificationsPage />
    </MemoryRouter>,
  );
}

const originalLocation = window.location;

beforeAll(() => {
  delete window.location;
  window.location = {
    ...originalLocation,
    assign: vi.fn(),
  };
});

afterAll(() => {
  window.location = originalLocation;
});

beforeEach(() => {
  mockNavigate.mockReset();
  window.location.assign.mockReset();
  useSession.mockReset();
  useNotificationCenter.mockReset();
  useAuthorization.mockReset();
  fetchNotificationPreferences.mockReset();
  updateNotificationPreferences.mockReset();
  fetchNotificationPreferences.mockResolvedValue({ preferences: {} });
  updateNotificationPreferences.mockResolvedValue({ preferences: {} });
});

describe('NotificationsPage', () => {
  it('redirects unauthenticated users to the login screen', async () => {
    useSession.mockReturnValue({ session: null, isAuthenticated: false });
    useAuthorization.mockReturnValue({ canAccess: vi.fn(() => false) });
    useNotificationCenter.mockReturnValue({
      notifications: [],
      unreadNotificationCount: 0,
      markNotificationAsRead: vi.fn(),
      markAllNotificationsAsRead: vi.fn(),
    });

    renderPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('shows a restricted view when the user lacks notification centre access', () => {
    useSession.mockReturnValue({ session: { id: 'user-1' }, isAuthenticated: true });
    useAuthorization.mockReturnValue({ canAccess: vi.fn(() => false) });
    useNotificationCenter.mockReturnValue({
      notifications: [],
      unreadNotificationCount: 0,
      markNotificationAsRead: vi.fn(),
      markAllNotificationsAsRead: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Access requires an eligible membership')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return to feed' })).toBeInTheDocument();
  });

  it('sorts notifications newest first and marks them as read when opened', async () => {
    const markNotificationAsRead = vi.fn();
    const markAllNotificationsAsRead = vi.fn();
    useSession.mockReturnValue({ session: { id: 'user-1' }, isAuthenticated: true });
    useAuthorization.mockReturnValue({
      canAccess: vi.fn((permission) => permission === 'notifications:center' || permission === 'notifications:push'),
    });
    useNotificationCenter.mockReturnValue({
      notifications: [
        {
          id: '1',
          title: 'Earlier update',
          body: 'Older activity',
          type: 'Activity',
          timestamp: '2024-01-01T10:00:00.000Z',
          action: { label: 'Review', href: '/activity/1' },
        },
        {
          id: '2',
          title: 'Fresh invite',
          body: 'You have been invited to collaborate.',
          type: 'Invite',
          timestamp: new Date().toISOString(),
          action: { label: 'View details', href: '/projects/42' },
        },
      ],
      unreadNotificationCount: 2,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    });

    renderPage();

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalled();
    });

    const markAllButtons = screen.getAllByRole('button', { name: 'Mark all read' });
    expect(markAllButtons.some((button) => !button.disabled)).toBe(true);

    const notificationHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(notificationHeadings[0]).toHaveTextContent('Fresh invite');
    expect(notificationHeadings[1]).toHaveTextContent('Earlier update');

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'View details' }));

    expect(markNotificationAsRead).toHaveBeenCalledWith('2');
    expect(window.location.assign).toHaveBeenCalledWith(`${window.location.origin}/projects/42`);

    const heroMarkAllButton = screen.getAllByRole('button', { name: 'Mark all read' })[0];
    await user.click(heroMarkAllButton);
    expect(markAllNotificationsAsRead).toHaveBeenCalledTimes(1);
  });

  it('prevents unsafe notification actions from rendering', async () => {
    useSession.mockReturnValue({ session: { id: 'user-1' }, isAuthenticated: true });
    useAuthorization.mockReturnValue({
      canAccess: vi.fn((permission) => permission === 'notifications:center'),
    });
    useNotificationCenter.mockReturnValue({
      notifications: [
        {
          id: '3',
          title: 'Suspicious link',
          body: 'This should not be clickable.',
          type: 'Security',
          timestamp: new Date().toISOString(),
          action: { label: 'Open', href: 'http://insecure.example.com' },
        },
      ],
      unreadNotificationCount: 1,
      markNotificationAsRead: vi.fn(),
      markAllNotificationsAsRead: vi.fn(),
    });

    renderPage();

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalled();
    });

    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument();
  });

  it('updates the push permission state based on browser responses', async () => {
    useSession.mockReturnValue({ session: { id: 'user-1' }, isAuthenticated: true });
    useAuthorization.mockReturnValue({
      canAccess: vi.fn((permission) => permission === 'notifications:center' || permission === 'notifications:push'),
    });
    useNotificationCenter.mockReturnValue({
      notifications: [],
      unreadNotificationCount: 0,
      markNotificationAsRead: vi.fn(),
      markAllNotificationsAsRead: vi.fn(),
    });

    const requestPermission = vi.fn().mockResolvedValue('granted');
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: { requestPermission },
    });

    renderPage();

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalled();
    });

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Request browser alerts' }));

    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Push alerts enabled for this browser.')).toBeInTheDocument();
    });
  });

  it('communicates role restrictions when push alerts are not permitted', async () => {
    useSession.mockReturnValue({ session: { id: 'user-1' }, isAuthenticated: true });
    useAuthorization.mockReturnValue({
      canAccess: vi.fn((permission) => permission === 'notifications:center'),
    });
    useNotificationCenter.mockReturnValue({
      notifications: [],
      unreadNotificationCount: 0,
      markNotificationAsRead: vi.fn(),
      markAllNotificationsAsRead: vi.fn(),
    });

    renderPage();

    await waitFor(() => {
      expect(fetchNotificationPreferences).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'Your current workspace role cannot register for push notifications. Switch to an eligible membership to continue.',
        ),
      ).toBeInTheDocument();
    });
  });
});
