import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import WorkspaceBudgetManager from '../workspace/WorkspaceBudgetManager.jsx';

describe('WorkspaceBudgetManager', () => {
  it('renders summary metrics and allows editing and saving a budget line', async () => {
    const budgets = [
      {
        id: 'budget-1',
        category: 'Design research',
        status: 'approved',
        currency: 'USD',
        allocatedAmount: 12500,
        actualAmount: 9800,
        ownerName: 'Amelia Perez',
        notes: 'Includes prototype incentives.',
      },
    ];
    const onSave = vi.fn().mockResolvedValue({});

    const user = userEvent.setup();
    render(<WorkspaceBudgetManager budgets={budgets} onSave={onSave} currency="USD" />);

    expect(screen.getByText(/budget management/i)).toBeInTheDocument();
    expect(screen.getByText(/Allocated:/i).textContent).toMatch(/\$12,500/);
    expect(screen.getByText(/Actual:/i).textContent).toMatch(/\$9,800/);
    expect(screen.getByText(/Over budget lines:/i).textContent).toMatch(/0$/);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const ownerInput = screen.getByLabelText(/Owner/i);
    expect(ownerInput).toHaveValue('Amelia Perez');

    await user.clear(ownerInput);
    await user.type(ownerInput, 'Operations Guild');

    const actualInput = screen.getByLabelText(/Actual amount/i);
    await user.clear(actualInput);
    await user.type(actualInput, '10200');

    await user.click(screen.getByRole('button', { name: /Update budget/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    expect(onSave).toHaveBeenCalledWith({
      id: 'budget-1',
      category: 'Design research',
      status: 'approved',
      currency: 'USD',
      allocatedAmount: 12500,
      actualAmount: 10200,
      ownerName: 'Operations Guild',
      notes: 'Includes prototype incentives.',
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toHaveValue('');
    });
  });

  it('renders the empty state and deletes budget entries', async () => {
    const budgets = [
      {
        id: 'budget-2',
        category: 'Tooling',
        status: 'over_budget',
        currency: 'USD',
        allocatedAmount: 4200,
        actualAmount: 5400,
        ownerName: 'Ops',
        notes: null,
      },
    ];
    const onDelete = vi.fn().mockResolvedValue({});

    const user = userEvent.setup();
    const { rerender } = render(
      <WorkspaceBudgetManager budgets={budgets} onDelete={onDelete} currency="USD" />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(budgets[0]);
    });

    expect(screen.getByText('Budget removed.')).toBeInTheDocument();

    rerender(<WorkspaceBudgetManager budgets={[]} currency="USD" />);

    expect(screen.getByText(/No budget lines yet/i)).toBeInTheDocument();
  });
});

