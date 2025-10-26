import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordReset from '../PasswordReset.jsx';

vi.mock('../../services/auth.js', () => ({
  verifyPasswordResetToken: vi.fn(),
  resetPassword: vi.fn(),
}));

const authService = await import('../../services/auth.js');

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const { MemoryRouter, Routes, Route } = await vi.importActual('react-router-dom');

describe('PasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.verifyPasswordResetToken.mockResolvedValue({
      valid: true,
      maskedEmail: 's****@example.com',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    authService.resetPassword.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderComponent = (token = 'sample-token') =>
    render(
      <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
        <Routes>
          <Route path="/reset-password" element={<PasswordReset />} />
        </Routes>
      </MemoryRouter>,
    );

  it('verifies the reset token and surfaces requirements', async () => {
    renderComponent();

    expect(await screen.findByText(/Reset link verified/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New password/i)).toBeEnabled();
    expect(screen.getByText(/At least 12 characters/i)).toBeInTheDocument();
  });

  it('prevents submission when passwords do not match', async () => {
    const user = userEvent.setup();
    renderComponent();

    await screen.findByText(/Reset link verified/i);

    await user.type(screen.getByLabelText(/New password/i), 'StrongPass#1234');
    await user.type(screen.getByLabelText(/Confirm password/i), 'Mismatch#1234');
    await user.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('submits a strong password and redirects to login', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    renderComponent();

    await screen.findByText(/Reset link verified/i);

    await user.type(screen.getByLabelText(/New password/i), 'EliteStrength#2024');
    await user.type(screen.getByLabelText(/Confirm password/i), 'EliteStrength#2024');
    await user.click(screen.getByRole('button', { name: /Reset password/i }));

    await waitFor(() => expect(authService.resetPassword).toHaveBeenCalledWith({
      token: 'sample-token',
      password: 'EliteStrength#2024',
    }));

    expect(
      await screen.findByText(/Your password has been reset/i),
    ).toBeInTheDocument();

    vi.advanceTimersByTime(2600);
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
