import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import CalendarEventForm from '../CalendarEventForm.jsx';

const accounts = [
  { id: 10, displayName: 'Operations Calendar', accountEmail: 'ops@gigvora.com' },
];

const templates = [
  { id: 21, name: 'Incident Review' },
];

describe('CalendarEventForm', () => {
  it('sanitises payload data before submitting', async () => {
    const handleSubmit = vi.fn();
    render(
      <CalendarEventForm
        accounts={accounts}
        templates={templates}
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
        submitting={false}
      />,
    );

    await userEvent.type(screen.getByLabelText('Title'), '  Weekly Sync  ');
    await userEvent.selectOptions(screen.getByLabelText('Account'), '10');
    await userEvent.selectOptions(screen.getByLabelText('Template'), '21');
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'webinar');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'published');
    await userEvent.selectOptions(screen.getByLabelText('Visibility'), 'external');
    await userEvent.type(screen.getByLabelText('Starts'), '2024-11-05T09:00');
    await userEvent.type(screen.getByLabelText('Ends'), '2024-11-05T09:45');
    await userEvent.type(screen.getByLabelText('Meeting link'), 'https://meet.gigvora.com/sync');
    await userEvent.type(screen.getByLabelText('Location'), 'HQ boardroom');
    await userEvent.type(screen.getByLabelText('Allowed roles'), ' admin , finance , admin ');
    await userEvent.type(screen.getByLabelText('Invitees'), 'ops@gigvora.com,  ceo@gigvora.com ');
    await userEvent.type(screen.getByLabelText('Attachments'), ' https://gigvora.com/doc.pdf ,');
    await userEvent.type(screen.getByLabelText('Notes'), 'Prepare audit update');

    await userEvent.click(screen.getByRole('button', { name: /save event/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0][0];

    expect(payload).toMatchObject({
      title: 'Weekly Sync',
      calendarAccountId: 10,
      templateId: 21,
      eventType: 'webinar',
      status: 'published',
      visibility: 'external',
      meetingUrl: 'https://meet.gigvora.com/sync',
      location: 'HQ boardroom',
      description: 'Prepare audit update',
    });
    expect(payload.allowedRoles).toEqual(['admin', 'finance']);
    expect(payload.invitees).toEqual(['ops@gigvora.com', 'ceo@gigvora.com']);
    expect(payload.attachments).toEqual(['https://gigvora.com/doc.pdf']);
    expect(payload.startsAt).toBe('2024-11-05T09:00:00.000Z');
    expect(payload.endsAt).toBe('2024-11-05T09:45:00.000Z');
  });

  it('prevents submission when end time is before the start time', async () => {
    const handleSubmit = vi.fn();
    render(
      <CalendarEventForm
        accounts={accounts}
        templates={templates}
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
        submitting={false}
      />,
    );

    await userEvent.type(screen.getByLabelText('Title'), 'Compliance review');
    await userEvent.selectOptions(screen.getByLabelText('Account'), '10');
    await userEvent.type(screen.getByLabelText('Starts'), '2024-11-06T12:00');
    await userEvent.type(screen.getByLabelText('Ends'), '2024-11-06T11:00');

    await userEvent.click(screen.getByRole('button', { name: /save event/i }));

    expect(await screen.findByText('End time must be after the start time.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
