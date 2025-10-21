import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoFactorBypassForm from '../TwoFactorBypassForm.jsx';

describe('TwoFactorBypassForm', () => {
  it('submits a normalized payload and resets the form', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue({});

    render(<TwoFactorBypassForm onSubmit={handleSubmit} submitting={false} />);

    await user.type(screen.getByLabelText(/User ID/i), '42');
    await user.type(screen.getByLabelText(/User email/i), 'Admin@Example.com  ');
    await user.type(screen.getByLabelText(/Reason/i), ' Lost device ');
    await user.selectOptions(screen.getByLabelText(/Expires in/i), '72');
    await user.selectOptions(screen.getByLabelText(/Initial status/i), 'approved');
    await user.type(screen.getByLabelText(/Notes for audit trail/i), ' Needs YubiKey replacement ');

    await user.click(screen.getByRole('button', { name: /Issue bypass/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        userEmail: 'admin@example.com',
        reason: 'Lost device',
        status: 'approved',
        notes: 'Needs YubiKey replacement',
      }),
    );

    expect(screen.getByLabelText(/User ID/i).value).toBe('');
    expect(screen.getByLabelText(/User email/i).value).toBe('');
    expect(screen.getByLabelText(/Reason/i).value).toBe('');
  });

  it('does not submit when both user id and email are missing', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<TwoFactorBypassForm onSubmit={handleSubmit} submitting={false} />);

    await user.type(screen.getByLabelText(/Reason/i), 'Hardware failure');
    await user.click(screen.getByRole('button', { name: /Issue bypass/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
