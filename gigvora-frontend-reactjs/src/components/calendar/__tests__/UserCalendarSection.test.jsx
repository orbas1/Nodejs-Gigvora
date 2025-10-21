import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserCalendarSection from '../UserCalendarSection.jsx';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/userCalendar.js', () => {
  const mock = {
    fetchCalendarOverview: vi.fn(),
    createCalendarEvent: vi.fn(),
    updateCalendarEvent: vi.fn(),
    deleteCalendarEvent: vi.fn(),
    createFocusSession: vi.fn(),
    updateFocusSession: vi.fn(),
    deleteFocusSession: vi.fn(),
    updateCalendarSettings: vi.fn(),
  };
  return mock;
});

import * as calendarService from '../../../services/userCalendar.js';

const {
  fetchCalendarOverview,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createFocusSession,
  updateFocusSession,
  deleteFocusSession,
  updateCalendarSettings,
} = calendarService;

describe('UserCalendarSection', () => {
  const baseInsights = {
    events: [
      {
        id: 'evt-1',
        title: 'Interview with hiring manager',
        eventType: 'job_interview',
        startsAt: '2024-05-21T09:00:00.000Z',
        endsAt: '2024-05-21T10:00:00.000Z',
        location: 'HQ',
      },
    ],
    focus: {
      sessions: [
        {
          id: 'focus-1',
          focusType: 'deep_work',
          startedAt: '2024-05-20T08:00:00.000Z',
          durationMinutes: 90,
          notes: 'Interview prep',
        },
      ],
    },
    integrations: [
      { id: 'integration-1', provider: 'Google', status: 'connected' },
    ],
    settings: {
      timezone: 'UTC',
      weekStart: 1,
      workStartMinutes: 9 * 60,
      workEndMinutes: 17 * 60,
      defaultReminderMinutes: 30,
    },
    summary: {
      nextEventAt: '2024-05-21T09:00:00.000Z',
    },
  };

  beforeEach(() => {
    fetchCalendarOverview.mockResolvedValue({
      events: baseInsights.events,
      focusSessions: baseInsights.focus.sessions,
      integrations: baseInsights.integrations,
      settings: baseInsights.settings,
    });
    createCalendarEvent.mockResolvedValue({
      id: 'evt-created',
      title: 'New event',
      eventType: 'project',
      startsAt: '2024-05-22T12:00:00.000Z',
    });
    updateCalendarEvent.mockResolvedValue({
      id: 'evt-1',
      title: 'Interview with hiring manager',
    });
    deleteCalendarEvent.mockResolvedValue(undefined);
    createFocusSession.mockResolvedValue({
      id: 'focus-created',
      focusType: 'networking',
      startedAt: '2024-05-22T15:00:00.000Z',
    });
    updateFocusSession.mockResolvedValue({ id: 'focus-1' });
    deleteFocusSession.mockResolvedValue(undefined);
    updateCalendarSettings.mockResolvedValue({ ...baseInsights.settings, timezone: 'Europe/London' });
  });

  it('renders summary insights and supports management actions', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <MemoryRouter>
          <UserCalendarSection userId="user-123" insights={baseInsights} />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(fetchCalendarOverview).toHaveBeenCalledWith('user-123', {}, { params: { limit: 60 } });
      });

      expect(screen.getByRole('heading', { name: /Schedule/i })).toBeInTheDocument();
      expect(screen.getByText(/Interview with hiring manager/i)).toBeInTheDocument();
      expect(screen.getByText(/1h 30m/i)).toBeInTheDocument();

      await user.click(screen.getByTitle('New event'));
      expect(screen.getByRole('heading', { name: /New event/i })).toBeInTheDocument();

      await user.click(screen.getByTitle('Log focus'));
      expect(screen.getByText(/Log focus session/i)).toBeInTheDocument();

      await user.click(screen.getByTitle('Preferences'));
      expect(screen.getByText(/Save settings/i)).toBeInTheDocument();

      const eventCard = screen.getByRole('button', { name: /Interview with hiring manager/i });
      await user.click(within(eventCard).getByRole('button', { name: /Delete/i }));
      await waitFor(() => {
        expect(deleteCalendarEvent).toHaveBeenCalledWith('user-123', 'evt-1');
      });

      expect(confirmSpy).toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
      confirmSpy.mockRestore();
    }
  });
});
