import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewGigOrderModal from '../NewGigOrderModal.jsx';

describe('NewGigOrderModal', () => {
  it('creates an order from a template preset', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();
    const handleClose = vi.fn();

    render(
      <NewGigOrderModal
        open
        onClose={handleClose}
        onSubmit={handleSubmit}
        preset={{
          name: 'Launch story',
          vendorName: 'StudioX',
          serviceName: 'Story design',
          amount: 5500,
          currency: 'USD',
          requirements: [
            { title: 'Kickoff brief', status: 'pending', dueAt: '2024-07-10' },
          ],
        }}
      />,
    );

    await screen.findByRole('heading', { name: /new order/i });

    await user.clear(screen.getByLabelText(/order id/i));
    await user.type(screen.getByLabelText(/order id/i), 'ORD-9');
    await user.selectOptions(screen.getByLabelText(/^status$/i), 'in_delivery');
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '6000');
    await user.clear(screen.getByLabelText(/currency/i));
    await user.type(screen.getByLabelText(/currency/i), 'eur');
    const kickoffField = screen.getByText(/^kickoff$/i).closest('label');
    const kickoffInput = kickoffField.querySelector('input');
    expect(kickoffInput).toBeInstanceOf(HTMLInputElement);
    await user.type(kickoffInput, '2024-07-05');

    const dueField = screen.getByText(/^due$/i).closest('label');
    const dueInput = dueField.querySelector('input');
    expect(dueInput).toBeInstanceOf(HTMLInputElement);
    await user.type(dueInput, '2024-07-31');
    await user.type(screen.getByLabelText(/^notes$/i), 'Include source files.');

    await user.click(screen.getByRole('button', { name: /^add$/i }));
    const requirementTitles = screen.getAllByLabelText(/requirement title/i);
    await user.type(requirementTitles[1], 'Mockups');
    const requirementStatus = screen.getAllByLabelText(/requirement status/i);
    await user.selectOptions(requirementStatus[1], 'received');
    const requirementDue = screen.getAllByLabelText(/requirement due date/i);
    await user.type(requirementDue[1], '2024-07-18');

    await user.click(screen.getByRole('button', { name: /remove requirement kickoff brief/i }));

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        vendorName: 'StudioX',
        serviceName: 'Story design',
        orderNumber: 'ORD-9',
        status: 'in_delivery',
        amount: 6000,
        currency: 'EUR',
        kickoffAt: '2024-07-05',
        dueAt: '2024-07-31',
        metadata: { notes: 'Include source files.' },
        requirements: [
          {
            title: 'Mockups',
            status: 'received',
            dueAt: '2024-07-18',
            notes: null,
          },
        ],
      });
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
