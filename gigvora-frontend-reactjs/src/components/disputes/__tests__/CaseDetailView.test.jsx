import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CaseDetailView from '../CaseDetailView.jsx';

const detail = {
  dispute: {
    id: 42,
    summary: 'Quality dispute on milestone A',
    stage: 'mediation',
    status: 'under_review',
    priority: 'high',
    reasonCode: 'quality_issue',
    openedAt: '2024-05-01T10:00:00Z',
    customerDeadlineAt: '2024-05-06T12:00:00Z',
    providerDeadlineAt: '2024-05-05T10:00:00Z',
    assignedToId: 9,
    transaction: { amount: 1250, currencyCode: 'USD', reference: 'ESC-55' },
    resolutionNotes: '',
    updatedAt: '2024-05-02T09:00:00Z',
    events: [],
  },
  events: [
    {
      id: 'evt-1',
      actionType: 'status_change',
      eventAt: '2024-05-02T08:00:00Z',
      notes: 'Escalated to mediation',
      actorType: 'operations',
    },
  ],
  availableStages: ['intake', 'mediation', 'resolved'],
  availableStatuses: ['open', 'under_review', 'settled'],
  availableActionTypes: ['comment', 'status_change'],
  resolutionOptions: [
    { value: 'none', label: 'No fund movement' },
    { value: 'refund', label: 'Refund customer' },
  ],
};

describe('CaseDetailView', () => {
  it('renders detail information and submits updates', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    await act(async () => {
      render(<CaseDetailView detail={detail} onSubmit={onSubmit} />);
    });

    await screen.findByLabelText(/action type/i);
    expect(screen.getByRole('heading', { name: /quality dispute on milestone a/i })).toBeInTheDocument();
    expect(screen.getByText(/escrow amount/i)).toBeInTheDocument();
    expect(screen.getByText(/case readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/key moments/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/action type/i), 'status_change');
    await user.type(screen.getByLabelText(/^notes$/i), 'Reached out to both parties');
    await user.type(screen.getByLabelText(/resolution notes/i), 'Pending customer acceptance');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /log update/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith(42, expect.objectContaining({
      notes: 'Reached out to both parties',
      actionType: 'status_change',
      resolutionNotes: 'Pending customer acceptance',
    }));
  });
});
