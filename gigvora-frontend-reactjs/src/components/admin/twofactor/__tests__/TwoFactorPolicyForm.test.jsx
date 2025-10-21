import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoFactorPolicyForm from '../TwoFactorPolicyForm.jsx';

describe('TwoFactorPolicyForm', () => {
  it('normalises methods and allow list before submitting', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();

    render(
      <TwoFactorPolicyForm
        open
        onClose={handleClose}
        onSubmit={handleSubmit}
        submitting={false}
        initialValue={{
          name: 'Default policy',
          allowedMethods: ['email'],
          ipAllowlist: ['10.0.0.0/24'],
          enforcementLevel: 'required',
        }}
      />,
    );

    const nameInput = screen.getByLabelText(/Policy name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Critical admins');

    await user.click(screen.getByLabelText(/SMS fallback/i));

    const allowlistInput = screen.getByLabelText(/IP allowlist/i);
    await user.clear(allowlistInput);
    await user.type(allowlistInput, '192.168.1.0/24\n 10.0.0.5');

    await user.click(screen.getByRole('button', { name: /Save policy/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Critical admins',
        allowedMethods: expect.arrayContaining(['email', 'sms']),
        ipAllowlist: ['192.168.1.0/24', '10.0.0.5'],
      }),
    );
  });
});
