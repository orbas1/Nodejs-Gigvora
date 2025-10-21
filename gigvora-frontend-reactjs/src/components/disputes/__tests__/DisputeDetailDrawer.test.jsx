import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisputeDetailDrawer from '../DisputeDetailDrawer.jsx';

const baseDispute = {
  id: 42,
  reasonCode: 'scope_change',
  openedAt: '2024-05-01T09:30:00.000Z',
  summary: 'Customer reports work was not delivered as agreed.',
  stage: 'intake',
  status: 'open',
  priority: 'medium',
  transaction: { amount: 1250, currencyCode: 'USD' },
  events: [],
};

describe('DisputeDetailDrawer', () => {
  it('supports template application and update submission in drawer variant', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn().mockResolvedValue();
    const onAddEvent = vi.fn().mockResolvedValue();

    render(
      <DisputeDetailDrawer
        dispute={baseDispute}
        open
        onUpdate={onUpdate}
        onAddEvent={onAddEvent}
        templates={[
          {
            id: 1,
            name: 'Escalate to mediation',
            defaultStage: 'mediation',
            defaultPriority: 'high',
            reasonCode: 'non_payment',
            guidance: 'Notify both parties and schedule mediation.',
          },
        ]}
      />,
    );

    const templateSelect = screen.getByLabelText(/resolution template/i);
    await user.selectOptions(templateSelect, '1');

    const stageSelect = screen.getByLabelText(/^stage$/i);
    expect(stageSelect).toHaveValue('mediation');

    const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
    expect(prioritySelect).toHaveValue('high');

    const deadlineInput = screen.getByLabelText(/customer deadline/i);
    await user.clear(deadlineInput);
    await user.type(deadlineInput, '2024-05-03T10:00');

    const summaryInput = screen.getByLabelText(/^summary$/i);
    await user.clear(summaryInput);
    await user.type(summaryInput, 'Updated summary after mediation.');

    await user.click(screen.getByRole('button', { name: /save updates/i }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1);
    });

    const [, payload] = onUpdate.mock.calls[0];
    expect(payload.stage).toBe('mediation');
    expect(payload.priority).toBe('high');
    expect(payload.customerDeadlineAt).toContain('2024-05-03T10:00');
    expect(payload.summary).toBe('Updated summary after mediation.');

    const notesBox = screen.getByPlaceholderText(/provide an update/i);
    await user.clear(notesBox);
    await user.type(notesBox, 'Reached out to both parties.');
    await user.click(screen.getByRole('button', { name: /log update/i }));

    await waitFor(() => {
      expect(onAddEvent).toHaveBeenCalledTimes(1);
    });

    const eventCall = onAddEvent.mock.calls[0];
    const eventPayload = eventCall.length === 1 ? eventCall[0] : eventCall[1];
    expect(eventPayload.notes).toBe('Reached out to both parties.');
  });

  it('renders inline variant with metadata driven options and logs events via alias', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    const dispute = {
      ...baseDispute,
      events: [
        {
          id: 1,
          actionType: 'comment',
          notes: 'Initial intake recorded.',
          eventAt: '2024-05-01T10:00:00.000Z',
        },
      ],
    };

    render(
      <DisputeDetailDrawer
        dispute={dispute}
        open
        variant="inline"
        metadata={{
          stages: [{ value: 'investigation', label: 'Investigation' }],
          statuses: [{ value: 'pending_review', label: 'Pending review' }],
          priorities: ['critical'],
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/case summary/i)).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 3, name: /#42/ });
    const inlineAside = heading.closest('aside');
    expect(inlineAside?.className).toContain('rounded-3xl');
    expect(inlineAside?.className).not.toContain('fixed');

    const eventStageSelect = screen.getByRole('combobox', { name: /update stage/i });
    await user.selectOptions(eventStageSelect, 'investigation');

    const eventStatusSelect = screen.getByRole('combobox', { name: /update status/i });
    await user.selectOptions(eventStatusSelect, 'pending_review');

    const notesBox = screen.getByPlaceholderText(/provide an update/i);
    await user.type(notesBox, 'Customer uploaded supporting documents.');
    await user.click(screen.getByRole('button', { name: /log update/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const [eventPayload] = onSubmit.mock.calls[0];
    expect(eventPayload.notes).toBe('Customer uploaded supporting documents.');
    expect(eventPayload.stage).toBe('investigation');
    expect(eventPayload.status).toBe('pending_review');
  });
});
