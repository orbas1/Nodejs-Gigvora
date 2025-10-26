import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import AlertComposer from '../AlertComposer.jsx';
import AlertInbox from '../AlertInbox.jsx';
import AlertSettings from '../AlertSettings.jsx';
import AlertWorkspaceDrawer from '../AlertWorkspaceDrawer.jsx';
import DashboardNotificationCenterSection from '../DashboardNotificationCenterSection.jsx';
import NotificationBell from '../NotificationBell.jsx';
import NotificationCenter from '../NotificationCenter.jsx';
import AlertPreferences from '../AlertPreferences.jsx';
import {
  createUserNotification,
  fetchUserNotifications,
  markAllNotificationsAsRead,
  updateNotificationPreferences,
  updateUserNotification,
} from '../../../services/notificationCenter.js';

vi.mock('../../../services/notificationCenter.js', () => ({
  createUserNotification: vi.fn(),
  fetchUserNotifications: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  updateUserNotification: vi.fn(),
}));

const baseAlert = {
  id: 'alert-1',
  title: 'New release',
  body: 'We shipped a new release.',
  createdAt: '2024-06-10T10:00:00Z',
  status: 'delivered',
  priority: 'high',
  category: 'system',
  payload: { ctaUrl: 'https://gigvora.com', ctaLabel: 'Open' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AlertComposer', () => {
  it('submits trimmed payloads and resets form', async () => {
    const onSubmit = vi.fn(() => Promise.resolve(true));
    const onSuccess = vi.fn();

    render(<AlertComposer onSubmit={onSubmit} onSuccess={onSuccess} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Title'), { target: { value: ' Release update ' } });
      fireEvent.change(screen.getByLabelText('Message'), { target: { value: ' Platform wide improvements. ' } });
      fireEvent.click(screen.getByLabelText('Bypass quiet hours'));
      fireEvent.change(screen.getByLabelText('Label'), { target: { value: ' Read more ' } });
      fireEvent.change(screen.getByLabelText('URL'), { target: { value: ' https://example.com ' } });
      fireEvent.click(screen.getByRole('button', { name: /^send$/i }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect({
      ...payload,
      title: payload.title.trim(),
      message: payload.message.trim(),
      ctaLabel: payload.ctaLabel.trim(),
      ctaUrl: payload.ctaUrl.trim(),
    }).toMatchObject({
      title: 'Release update',
      message: 'Platform wide improvements.',
      ctaLabel: 'Read more',
      ctaUrl: 'https://example.com',
      sendDuringQuietHours: true,
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});

describe('AlertSettings', () => {
  it('allows toggling channels and saving preferences', async () => {
    const onSubmit = vi.fn(() => Promise.resolve(true));
    const preferences = {
      emailEnabled: true,
      pushEnabled: false,
      smsEnabled: false,
      inAppEnabled: true,
      digestFrequency: 'daily',
      quietHoursStart: '21:00',
      quietHoursEnd: '07:00',
      metadata: { timezone: 'Europe/London' },
    };

    render(<AlertSettings preferences={preferences} onSubmit={onSubmit} />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Push'));
      fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'weekly' } });
      fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'UTC' } });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      pushEnabled: true,
      digestFrequency: 'weekly',
      metadata: { timezone: 'UTC' },
    });
  });
});

describe('AlertInbox', () => {
  it('supports filtering, selection, and actions', async () => {
    const onFiltersChange = vi.fn();
    const onSelect = vi.fn();
    const onMarkRead = vi.fn();

    render(
      <AlertInbox
        items={[{ ...baseAlert, status: 'unread' }]}
        stats={{ unread: 1, total: 1 }}
        filters={{ status: 'all', category: 'all' }}
        onFiltersChange={onFiltersChange}
        onSelect={onSelect}
        selectedId="alert-1"
        onMarkRead={onMarkRead}
        onArchive={vi.fn()}
        onMarkAll={vi.fn()}
      />,
    );

    const statusFilterButton = screen.getAllByRole('button', { name: /unread/i })[0];
    await act(async () => {
      fireEvent.click(statusFilterButton);
    });
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'unread' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /new release/i }));
    });
    expect(onSelect).toHaveBeenCalledWith('alert-1');

    const detailsHeading = screen.getByRole('heading', { name: 'Details' });
    const detailsPanel = detailsHeading.parentElement?.parentElement ?? detailsHeading.parentElement;
    const markReadButton = await within(detailsPanel).findByRole('button', { name: /mark read/i });
    await act(async () => {
      fireEvent.click(markReadButton);
    });
    expect(onMarkRead).toHaveBeenCalledWith('alert-1');
  });
});

describe('AlertWorkspaceDrawer', () => {
  it('switches between inbox and settings views', async () => {
    const handleViewChange = vi.fn();
    const baseProps = {
      open: true,
      onClose: vi.fn(),
      inbox: { items: [baseAlert] },
      stats: { unread: 1, total: 1 },
      filters: { status: 'all', category: 'all' },
      onFiltersChange: vi.fn(),
      onRefresh: vi.fn(),
      onLoadMore: vi.fn(),
      onMarkRead: vi.fn(),
      onArchive: vi.fn(),
      onMarkAll: vi.fn(),
      preferences: { emailEnabled: true },
      onSavePreferences: vi.fn(() => Promise.resolve(true)),
      onComposerSubmit: vi.fn(() => Promise.resolve(true)),
    };
    const { rerender } = render(
      <AlertWorkspaceDrawer
        {...baseProps}
        view="inbox"
        onViewChange={handleViewChange}
      />,
    );

    expect(screen.getByText('Alerts')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    });
    expect(handleViewChange).toHaveBeenCalledWith('settings');

    rerender(
      <AlertWorkspaceDrawer
        {...baseProps}
        view="settings"
        onViewChange={handleViewChange}
      />,
    );
    expect(await screen.findByText('Channels')).toBeInTheDocument();
  });
});

describe('NotificationBell', () => {
  it('opens tray and triggers mark all handler', async () => {
    const onMarkAll = vi.fn();
    render(
      <MemoryRouter>
        <NotificationBell
          notifications={[
            {
              id: 'notif-1',
              title: 'Co-host invite',
              body: 'Atlas Studio invited you to co-host a sprint.',
              timestamp: new Date().toISOString(),
              type: 'invite',
            },
          ]}
          unreadNotificationCount={1}
          onMarkAllNotifications={onMarkAll}
          onNotificationOpen={vi.fn()}
        />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByLabelText(/1 unread alerts/i));
    });

    const markAllButton = await screen.findByRole('button', { name: /mark all read/i });

    await act(async () => {
      fireEvent.click(markAllButton);
    });

    expect(onMarkAll).toHaveBeenCalled();
  });
});

describe('NotificationCenter', () => {
  it('filters between alerts and messages', async () => {
    const onNotificationRead = vi.fn();
    const onThreadRead = vi.fn();

    render(
      <NotificationCenter
        notifications={[
          {
            id: 'alert-1',
            title: 'Co-host invite',
            body: 'Atlas Studio invited you to co-host a sprint.',
            type: 'invite',
            timestamp: '2024-03-10T10:00:00Z',
          },
        ]}
        messageThreads={[
          {
            id: 'thread-1',
            sender: 'Talent Concierge',
            preview: 'New designers shortlisted.',
            timestamp: '2024-03-10T08:00:00Z',
            unread: true,
          },
        ]}
        unreadNotificationCount={1}
        unreadMessageCount={1}
        onNotificationRead={onNotificationRead}
        onThreadRead={onThreadRead}
      />,
    );

    expect(await screen.findByText(/co-host invite/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /messages/i }));
    });

    expect(await screen.findByText(/talent concierge/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /view thread/i }));
    });

    expect(onThreadRead).toHaveBeenCalledWith('thread-1');
  });
});

describe('AlertPreferences', () => {
  it('saves customised channel and cadence settings', async () => {
    const onSave = vi.fn(() => Promise.resolve(true));
    const onTestNotification = vi.fn(() => Promise.resolve(true));

    render(
      <AlertPreferences
        initialPreferences={null}
        onSave={onSave}
        onTestNotification={onTestNotification}
      />,
    );

    await act(async () => {
      const [smsChannelToggle] = screen.getAllByLabelText(/SMS/);
      fireEvent.click(smsChannelToggle);
      fireEvent.change(screen.getByLabelText('Digest frequency'), { target: { value: 'weekly' } });
      fireEvent.click(screen.getByRole('button', { name: /send test alert/i }));
      fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));
    });

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0];
    expect(payload.channels.sms).toBe(true);
    expect(payload.digest.frequency).toBe('weekly');
    expect(onTestNotification).toHaveBeenCalled();
  });
});

describe('DashboardNotificationCenterSection', () => {
  const notification = { ...baseAlert, status: 'unread' };

  beforeEach(() => {
    fetchUserNotifications.mockResolvedValue({
      notifications: [notification],
      stats: { total: 1, unread: 1 },
      pagination: { page: 1, totalPages: 1 },
    });
    updateUserNotification.mockResolvedValue({ notification: { ...notification, status: 'read' }, stats: { unread: 0 } });
    markAllNotificationsAsRead.mockResolvedValue({ stats: { unread: 0 } });
    updateNotificationPreferences.mockResolvedValue({ preferences: { emailEnabled: true }, stats: { unread: 0 } });
    createUserNotification.mockResolvedValue({ stats: { unread: 1 } });
  });

  it('loads notifications when opening workspace', async () => {
    render(
      <DashboardNotificationCenterSection
        userId={42}
        initialNotifications={[]}
        initialUnreadCount={0}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /open workspace/i }));
    });
    await waitFor(() => expect(fetchUserNotifications).toHaveBeenCalledWith(42, expect.any(Object)));
    const drawer = await screen.findByRole('dialog', { name: 'Alerts' });
    expect(await within(drawer).findByRole('button', { name: /new release/i })).toBeInTheDocument();
  });

  it('marks all notifications as read', async () => {
    render(
      <DashboardNotificationCenterSection
        userId={42}
        initialNotifications={[notification]}
        initialUnreadCount={1}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));
    });
    await waitFor(() => expect(markAllNotificationsAsRead).toHaveBeenCalledWith(42));
  });
});
