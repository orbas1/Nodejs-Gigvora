import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import WorkforceManager from '../WorkforceManager.jsx';

vi.mock('../PanelDialog.jsx', () => ({
  default: ({ open, children, actions }) => (
    open ? (
      <div data-testid="panel">
        {children}
        <div data-testid="panel-actions">{actions}</div>
      </div>
    ) : null
  ),
}));

describe('WorkforceManager', () => {
  const baseSegments = [
    {
      id: 3,
      segmentName: 'Platform',
      position: 2,
      specialization: 'Engineering',
      availableCount: 3,
      totalCount: 6,
      deliveryModel: 'Hybrid',
      leadTimeDays: 7,
      averageBillRate: 110,
      currency: 'USD',
      location: 'Remote',
      availabilityNotes: 'Core maintenance crew.',
    },
    {
      id: 1,
      segmentName: 'Brand Studio',
      position: 1,
      specialization: 'Design',
      availableCount: 4,
      totalCount: 5,
      deliveryModel: 'Remote',
      leadTimeDays: 5,
      averageBillRate: 90,
      currency: 'USD',
      location: 'Austin',
      availabilityNotes: 'Focus on campaigns.',
    },
    {
      id: 2,
      segmentName: 'Campaign Pods',
      position: 1,
      specialization: 'Marketing',
      availableCount: 2,
      totalCount: 4,
      deliveryModel: 'Onsite',
      leadTimeDays: 3,
      averageBillRate: 85,
      currency: 'EUR',
      location: 'Berlin',
      availabilityNotes: 'Supports launches.',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('orders segments by position then alphabetically', () => {
    render(<WorkforceManager workforce={baseSegments} />);

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      'Brand Studio',
      'Campaign Pods',
      'Platform',
    ]);
  });

  it('invokes delete handler and surfaces errors', async () => {
    const deleteMock = vi.fn().mockRejectedValueOnce(new Error('Unable to remove this segment right now.'));
    const user = userEvent.setup();
    render(<WorkforceManager workforce={baseSegments} onDelete={deleteMock} />);

    const [firstRemove] = screen.getAllByRole('button', { name: /remove/i });
    await user.click(firstRemove);

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText('Unable to remove this segment right now.')).toBeInTheDocument();
  });

  it('submits new segments through the dialog', async () => {
    const createMock = vi.fn().mockResolvedValue();
    const user = userEvent.setup();

    render(<WorkforceManager workforce={[]} onCreate={createMock} />);

    await user.click(screen.getByRole('button', { name: /add/i }));

    await user.type(screen.getByLabelText(/name/i), 'Growth Pod');
    await user.type(screen.getByLabelText(/available/i), '5');
    await user.type(screen.getByLabelText(/total/i), '10');
    await user.type(screen.getByLabelText(/lead time/i), '4');
    await user.type(screen.getByLabelText(/avg rate/i), '125');
    await user.type(screen.getByLabelText(/currency/i), 'USD');
    await user.type(screen.getByLabelText(/order/i), '3');
    await user.type(screen.getByLabelText(/notes/i), 'Supports onboarding');

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalled();
    });

    const payload = createMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      segmentName: 'Growth Pod',
      specialization: null,
      deliveryModel: null,
      availabilityNotes: 'Supports onboarding',
      currency: 'USD',
    });
    expect(payload.availableCount).toBe(5);
    expect(payload.totalCount).toBe(10);
    expect(payload.leadTimeDays).toBe(4);
    expect(payload.averageBillRate).toBe(125);
    expect(payload.position).toBe(3);
  });
});
