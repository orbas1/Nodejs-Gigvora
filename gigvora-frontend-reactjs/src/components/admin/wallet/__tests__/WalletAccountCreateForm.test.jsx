import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletAccountCreateForm from '../WalletAccountCreateForm.jsx';

describe('WalletAccountCreateForm', () => {
  it('validates owner information before allowing the second step', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<WalletAccountCreateForm onSubmit={handleSubmit} loading={false} error="" />);

    await user.click(screen.getByRole('button', { name: /Next/i }));

    expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits the normalized payload when the wizard completes', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<WalletAccountCreateForm onSubmit={handleSubmit} loading={false} error="" />);

    await user.type(screen.getByLabelText(/User ID/i), '91');
    await user.type(screen.getByLabelText(/Profile ID/i), '73');
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await user.selectOptions(screen.getByLabelText(/^Type$/i), 'agency');
    await user.selectOptions(screen.getByLabelText(/^Status$/i), 'pending');
    await user.selectOptions(screen.getByLabelText(/^Provider$/i), 'escrow_com');
    await user.clear(screen.getByLabelText(/Currency/i));
    await user.type(screen.getByLabelText(/Currency/i), 'eur');
    await user.type(screen.getByLabelText(/Provider ID/i), ' acct_789 ');

    await user.click(screen.getByRole('button', { name: /Create/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      userId: 91,
      profileId: 73,
      accountType: 'agency',
      status: 'pending',
      custodyProvider: 'escrow_com',
      currencyCode: 'eur',
      providerAccountId: 'acct_789',
    });
  });
});
