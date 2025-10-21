import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import CalendarTemplateForm from '../CalendarTemplateForm.jsx';

describe('CalendarTemplateForm', () => {
  it('normalises values before invoking onSubmit', async () => {
    const handleSubmit = vi.fn();
    render(
      <CalendarTemplateForm
        initialValue={null}
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
        submitting={false}
      />,
    );

    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), '  Launch Briefing  ');
    await userEvent.clear(screen.getByLabelText('Duration (minutes)'));
    await userEvent.type(screen.getByLabelText('Duration (minutes)'), ' 45 ');
    await userEvent.selectOptions(screen.getByLabelText('Event type'), 'webinar');
    await userEvent.selectOptions(screen.getByLabelText('Visibility'), 'external');
    await userEvent.type(screen.getByLabelText('Meeting link'), ' https://meet.gigvora.com/briefing ');
    await userEvent.type(screen.getByLabelText('Location'), ' Virtual ');
    await userEvent.type(screen.getByLabelText('Allowed roles'), ' host, co-host, host ');
    await userEvent.type(screen.getByLabelText('Reminders (minutes)'), '60, 15 , 60');
    await userEvent.type(screen.getByLabelText('Banner image'), ' https://gigvora.com/banner.png ');
    await userEvent.type(screen.getByLabelText('Host notes'), 'Bring the partner deck.');

    await userEvent.click(screen.getByRole('button', { name: /save type/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: 'Launch Briefing',
      defaultEventType: 'webinar',
      defaultVisibility: 'external',
      durationMinutes: 45,
      defaultMeetingUrl: 'https://meet.gigvora.com/briefing',
      defaultLocation: 'Virtual',
      bannerImageUrl: 'https://gigvora.com/banner.png',
      instructions: 'Bring the partner deck.',
      defaultAllowedRoles: ['host', 'co-host'],
      reminderMinutes: [15, 60],
    });
  });

  it('shows inline validation errors for invalid duration or reminders', async () => {
    const handleSubmit = vi.fn();
    render(
      <CalendarTemplateForm
        initialValue={null}
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
        submitting={false}
      />,
    );

    await userEvent.type(screen.getByLabelText('Name'), 'Validation case');
    await userEvent.clear(screen.getByLabelText('Duration (minutes)'));
    await userEvent.type(screen.getByLabelText('Duration (minutes)'), '0');
    await userEvent.type(screen.getByLabelText('Reminders (minutes)'), 'foo,bar');

    await userEvent.click(screen.getByRole('button', { name: /save type/i }));

    expect(await screen.findByText('Duration must be a positive number of minutes.')).toBeInTheDocument();
    expect(await screen.findByText('Enter reminders as comma separated positive numbers.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
