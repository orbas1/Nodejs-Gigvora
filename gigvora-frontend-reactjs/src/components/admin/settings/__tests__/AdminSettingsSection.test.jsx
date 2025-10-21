import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminSettingsSection from '../AdminSettingsSection.jsx';

const mockFetchSystemSettings = vi.fn();
const mockUpdateSystemSettings = vi.fn();

vi.mock('../../../../services/systemSettings.js', () => ({
  fetchSystemSettings: (...args) => mockFetchSystemSettings(...args),
  updateSystemSettings: (...args) => mockUpdateSystemSettings(...args),
}));

const SETTINGS_RESPONSE = {
  general: {
    supportEmail: 'support@gigvora.com',
    supportPhone: '+1 234 000 0000',
    timezone: 'UTC',
    defaultLocale: 'en-US',
  },
  security: {
    requireTwoFactor: true,
    sessionTimeoutMinutes: 60,
  },
  notifications: {
    incidentWebhookUrl: 'https://hooks.slack.com/services/example',
  },
  maintenance: {
    autoBroadcast: true,
    supportChannel: '#ops-alerts',
    upcomingWindows: [],
  },
};

describe('AdminSettingsSection', () => {
  let user;

  beforeEach(() => {
    mockFetchSystemSettings.mockReset();
    mockUpdateSystemSettings.mockReset();
    user = userEvent.setup({ applyAcceptDefaultUnhandledRejections: false });
  });

  it('loads existing settings and submits updates', async () => {
    mockFetchSystemSettings.mockResolvedValueOnce(SETTINGS_RESPONSE);
    mockUpdateSystemSettings.mockResolvedValueOnce(SETTINGS_RESPONSE);

    render(<AdminSettingsSection />);

    const emailInput = await screen.findByLabelText('Support email');
    expect(emailInput).toHaveValue('support@gigvora.com');

    await act(async () => {
      await user.clear(emailInput);
      await user.type(emailInput, 'helpdesk@gigvora.com');
    });

    const twoFactorSwitch = screen.getByRole('switch', {
      name: 'Require two-factor authentication',
    });
    await act(async () => {
      await user.click(twoFactorSwitch);
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save settings' }));
    });

    await waitFor(() => {
      expect(mockUpdateSystemSettings).toHaveBeenCalled();
    });

    const payload = mockUpdateSystemSettings.mock.calls[0][0];
    expect(payload.general.supportEmail).toBe('helpdesk@gigvora.com');
    expect(payload.security.requireTwoFactor).toBe(false);
  });

  it('shows an RBAC warning when the settings endpoint denies access', async () => {
    mockFetchSystemSettings.mockRejectedValueOnce({ status: 403 });

    render(<AdminSettingsSection />);

    expect(
      await screen.findByText(/You do not have permission to view system controls/i),
    ).toBeInTheDocument();
  });

  it('surfaces RBAC feedback when saving fails', async () => {
    mockFetchSystemSettings.mockResolvedValueOnce(SETTINGS_RESPONSE);
    mockUpdateSystemSettings.mockRejectedValueOnce({ status: 403 });

    render(<AdminSettingsSection />);

    await screen.findByLabelText('Support email');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save settings' }));
    });

    expect(
      await screen.findByText(/You do not have permission to update system controls/i),
    ).toBeInTheDocument();
  });
});
