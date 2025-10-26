import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MaintenanceNotificationForm from '../MaintenanceNotificationForm.jsx';
import MaintenanceScheduleTable from '../MaintenanceScheduleTable.jsx';
import MaintenanceStatusCard from '../MaintenanceStatusCard.jsx';

function buildWindow(overrides = {}) {
  return {
    id: overrides.id ?? `window-${Math.random().toString(36).slice(2)}`,
    title: 'API maintenance',
    owner: 'SRE',
    impact: 'Platform',
    startAt: '2024-05-01T10:00:00.000Z',
    endAt: '2024-05-01T11:00:00.000Z',
    channels: ['status-page', 'email'],
    ...overrides,
  };
}

describe('MaintenanceNotificationForm', () => {
  it('generates a preview and resets after sending', async () => {
    const onSend = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<MaintenanceNotificationForm onSend={onSend} sending={false} />);

    await user.click(screen.getByRole('button', { name: /preview/i }));

    expect(
      screen.getByText(/Channels: email, in-app/i, { selector: 'pre' }),
    ).toBeInTheDocument();

    const subjectInput = screen.getByLabelText('Subject / heading');
    await user.clear(subjectInput);
    await user.type(subjectInput, 'Urgent maintenance');

    await user.click(screen.getByRole('button', { name: /send broadcast/i }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Urgent maintenance',
          channels: expect.arrayContaining(['email', 'in-app']),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Subject / heading')).toHaveValue(
        'Scheduled maintenance window',
      );
    });
  });
});

describe('MaintenanceScheduleTable', () => {
  it('sorts maintenance windows by start date', () => {
    const first = buildWindow({ id: 'a', title: 'First', startAt: '2024-05-01T08:00:00.000Z' });
    const second = buildWindow({ id: 'b', title: 'Second', startAt: '2024-05-01T12:00:00.000Z' });

    const { container } = render(
      <MaintenanceScheduleTable windows={[second, first]} creating={false} />,
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('First');
    expect(rows[1].textContent).toContain('Second');
  });

  it('creates a new window with numeric lead time', async () => {
    const onCreate = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(
      <MaintenanceScheduleTable
        windows={[]}
        creating={false}
        onCreate={onCreate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /new window/i }));

    await screen.findByRole('heading', { name: /new window/i });

    await user.type(screen.getByLabelText('Title'), 'Database upgrade');

    const ownerInput = screen.getByLabelText('Owner');
    await user.clear(ownerInput);
    await user.type(ownerInput, 'Platform');

    const impactInput = screen.getByLabelText('Impact');
    await user.clear(impactInput);
    await user.type(impactInput, 'Database');

    const notifyInput = screen.getByLabelText(/Notify before/i);
    await user.clear(notifyInput);
    await user.type(notifyInput, '90');

    const startInput = screen.getByLabelText('Start');
    await user.clear(startInput);
    await user.type(startInput, '2024-06-01T10:00');

    const endInput = screen.getByLabelText('End');
    await user.clear(endInput);
    await user.type(endInput, '2024-06-01T12:00');
    await user.selectOptions(screen.getByLabelText('Channels'), ['email', 'sms']);
    await user.type(screen.getByLabelText('Rollback plan'), 'Rollback via snapshot');

    await user.click(screen.getByRole('button', { name: /schedule window/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationLeadMinutes: 90,
          channels: expect.arrayContaining(['email', 'sms']),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /new window/i })).not.toBeInTheDocument();
    });
  });

  it('updates an existing window from inline editor', async () => {
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    const windowItem = buildWindow({ id: 'window-1', title: 'Cache refresh' });

    render(
      <MaintenanceScheduleTable
        windows={[windowItem]}
        creating={false}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));

    const titleInput = screen.getByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated cache refresh');

    await user.click(screen.getByRole('button', { name: /save window/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      'window-1',
      expect.objectContaining({ title: 'Updated cache refresh' }),
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('window-1');
  });
});

describe('MaintenanceStatusCard', () => {
  it('toggles maintenance mode', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <MaintenanceStatusCard
        status={{ enabled: false, message: 'All systems go' }}
        onToggle={onToggle}
        updating={false}
      />,
    );

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(onToggle).toHaveBeenCalledWith({ enabled: true });
  });

  it('renders feedback analytics when provided', () => {
    render(
      <MaintenanceStatusCard
        status={{
          enabled: true,
          message: 'Maintenance active',
          feedback: {
            experienceScore: 4.7,
            trendDelta: 0.4,
            queueDepth: 6,
            medianResponseMinutes: 2,
            lastUpdated: '2024-05-11T22:40:00.000Z',
            segments: [{ id: 'ops', label: 'Operations', score: 4.7, delta: 0.2 }],
            highlights: [
              {
                id: 'ops-lead',
                persona: 'Ops Lead',
                quote: 'Updates are clear and timely.',
                sentiment: 'Positive',
                recordedAt: '2024-05-11T22:35:00.000Z',
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText(/Experience pulse/i)).toBeInTheDocument();
    expect(screen.getByText('Ops Lead')).toBeInTheDocument();
  });
});
