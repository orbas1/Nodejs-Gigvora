import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceGenerator from '../InvoiceGenerator.jsx';

describe('InvoiceGenerator', () => {
  it('submits computed totals for new invoices', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue();

    render(<InvoiceGenerator onSubmit={handleSubmit} />);

    await act(async () => {
      await user.clear(screen.getByLabelText(/Client name/i));
      await user.type(screen.getByLabelText(/Client name/i), 'Alex Rivera');
      await user.type(screen.getByLabelText(/Client email/i), 'alex@example.com');
      await user.type(screen.getByLabelText(/Company or programme/i), 'Leadership accelerator');
      await user.type(screen.getByLabelText(/Invoice reference/i), 'INV-501');

      const descriptionField = screen.getByLabelText(/Description/i);
      await user.clear(descriptionField);
      await user.type(descriptionField, 'Sprint strategy workshop');

      const quantityField = screen.getByLabelText(/^Qty/i);
      await user.clear(quantityField);
      await user.type(quantityField, '2');

      const rateField = screen.getByLabelText(/Rate/i);
      await user.clear(rateField);
      await user.type(rateField, '1500');

      const taxField = screen.getByLabelText(/Tax/i);
      await user.clear(taxField);
      await user.type(taxField, '10');

      const issueDate = screen.getByLabelText(/Issue date/i);
      await user.clear(issueDate);
      await user.type(issueDate, '2024-05-01');

      const dueDate = screen.getByLabelText(/Due date/i);
      await user.clear(dueDate);
      await user.type(dueDate, '2024-05-15');
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /Generate invoice/i }));
    });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      mentee: 'Alex Rivera',
      amount: 3300,
      currency: 'USD',
      status: 'Sent',
      lineItems: [
        expect.objectContaining({ description: 'Sprint strategy workshop', quantity: 2, unitPrice: 1500 }),
      ],
    });
    expect(payload.taxTotal).toBe(300);
    expect(payload.subtotal).toBe(3000);
    expect(payload.dueOn).toMatch(/2024-05-15/);
  });
});
