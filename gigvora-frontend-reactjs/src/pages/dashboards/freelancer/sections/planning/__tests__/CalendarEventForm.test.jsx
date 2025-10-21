import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CalendarEventForm from '../CalendarEventForm.jsx';

function getInput(label) {
  return screen.getByLabelText(label, { selector: 'input, textarea, select' });
}

describe('CalendarEventForm', () => {
  it('submits sanitized payload with ISO timestamps and metadata', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();

    render(<CalendarEventForm open onSubmit={handleSubmit} />);

    await user.clear(getInput(/event title/i));
    await user.type(getInput(/event title/i), 'Project Kickoff');

    fireEvent.change(getInput(/starts/i), { target: { value: '2024-05-01T09:00' } });
    fireEvent.change(getInput(/^ends$/i), { target: { value: '2024-05-01T10:30' } });
    fireEvent.change(getInput(/meeting/i), { target: { value: 'https://example.com/meeting' } });
    fireEvent.change(getInput(/related workspace/i), { target: { value: 'project' } });
    fireEvent.change(getInput(/workspace id/i), { target: { value: 'proj-123' } });

    const metadataKey = screen.getByPlaceholderText(/zoomPasscode/i);
    const metadataValue = screen.getByPlaceholderText(/value/i);
    await user.clear(metadataKey);
    await user.type(metadataKey, 'zoomPasscode');
    await user.clear(metadataValue);
    await user.type(metadataValue, '1234');

    fireEvent.change(getInput(/reminder/i), { target: { value: '15' } });

    await user.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1));
    const payload = handleSubmit.mock.calls[0][0];

    expect(payload.title).toBe('Project Kickoff');
    expect(payload.startsAt).toMatch(/T09:00:00/);
    expect(new Date(payload.startsAt).toISOString()).toBe(payload.startsAt);
    expect(new Date(payload.endsAt).toISOString()).toBe(payload.endsAt);
    expect(payload.meetingUrl).toBe('https://example.com/meeting');
    expect(payload.relatedEntityType).toBe('project');
    expect(payload.relatedEntityId).toBe('proj-123');
    expect(payload.metadata).toEqual({ zoomPasscode: '1234' });
    expect(payload.reminderMinutesBefore).toBe(15);
  });

  it('blocks submission when meeting url is invalid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<CalendarEventForm open onSubmit={handleSubmit} />);

    await user.clear(getInput(/event title/i));
    await user.type(getInput(/event title/i), 'Invalid Link');
    fireEvent.change(getInput(/starts/i), { target: { value: '2024-05-01T09:00' } });
    fireEvent.change(getInput(/meeting/i), { target: { value: 'ftp://example.com' } });

    await user.click(screen.getByRole('button', { name: /create event/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/meeting link must be a valid url/i)).toBeInTheDocument();
  });

  it('requires a workspace id when a related workspace type is selected', async () => {
    const user = userEvent.setup();

    render(<CalendarEventForm open />);

    await user.clear(getInput(/event title/i));
    await user.type(getInput(/event title/i), 'Workspace check');
    fireEvent.change(getInput(/starts/i), { target: { value: '2024-05-01T09:00' } });
    fireEvent.change(getInput(/related workspace/i), { target: { value: 'project' } });

    await user.click(screen.getByRole('button', { name: /create event/i }));

    expect(screen.getByText(/reference the workspace id/i)).toBeInTheDocument();
  });
});
