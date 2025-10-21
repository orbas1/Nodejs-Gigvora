import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSettingsSection from '../UserSettingsSection.jsx';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../../../services/notificationCenter.js';
import { fetchUser, updateUserAccount } from '../../../../services/user.js';
import {
  fetchUserAiSettings,
  updateUserAiSettings,
  testUserAiSettingsConnection,
} from '../../../../services/userAiSettings.js';

vi.mock('../../../../services/notificationCenter.js', () => ({
  __esModule: true,
  fetchNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
}));

vi.mock('../../../../services/user.js', () => ({
  __esModule: true,
  fetchUser: vi.fn(),
  updateUserAccount: vi.fn(),
}));

vi.mock('../../../../services/userAiSettings.js', () => ({
  __esModule: true,
  fetchUserAiSettings: vi.fn(),
  updateUserAiSettings: vi.fn(),
  testUserAiSettingsConnection: vi.fn(),
}));

describe('UserSettingsSection', () => {
  const userId = 101;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchUser.mockResolvedValue({
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex@gigvora.com',
      phoneNumber: '+44 20 0000 0000',
      jobTitle: 'Programme Lead',
      location: 'London',
    });
    fetchNotificationPreferences.mockResolvedValue({
      preferences: {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
        digestFrequency: 'weekly',
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      },
      stats: { weeklyDigest: { lastSentAt: new Date().toISOString() } },
    });
    fetchUserAiSettings.mockResolvedValue({
      provider: 'openai',
      model: 'gpt-4o-mini',
      connection: { baseUrl: 'https://api.openai.com/v1', lastTestedAt: null },
      autoReplies: { enabled: true, channels: ['direct'], instructions: 'Be warm.', temperature: 0.4 },
      apiKey: { configured: true, fingerprint: 'sk_live', updatedAt: null },
    });
    updateUserAccount.mockResolvedValue({});
    updateNotificationPreferences.mockResolvedValue({});
    updateUserAiSettings.mockResolvedValue({});
  });

  it('tests the concierge connection and surfaces latency feedback', async () => {
    testUserAiSettingsConnection.mockResolvedValue({
      result: { status: 'ok', latencyMs: 98, fingerprint: 'fp-123', testedAt: new Date().toISOString() },
    });
    const user = userEvent.setup();

    render(<UserSettingsSection userId={userId} />);

    const testButton = await screen.findByRole('button', { name: /test concierge connection/i });
    const apiKeyInput = await screen.findByLabelText(/rotate api key/i);
    await user.type(apiKeyInput, 'sk-test-123');
    await user.click(testButton);

    await waitFor(() => {
      expect(testUserAiSettingsConnection).toHaveBeenCalledTimes(1);
    });
    const [calledUserId, payload] = testUserAiSettingsConnection.mock.calls[0];
    expect(calledUserId).toBe(userId);
    expect(payload).toMatchObject({
      provider: 'openai',
      model: 'gpt-4o-mini',
      connection: { baseUrl: 'https://api.openai.com/v1' },
      apiKey: 'sk-test-123',
    });

    await waitFor(() => {
      expect(
        screen.getByText(/connection verified in 98ms/i),
      ).toBeInTheDocument();
    });
  });

  it('gracefully handles unavailable concierge test endpoints', async () => {
    const unavailableError = new Error('Testing disabled for this environment');
    unavailableError.code = 'AI_TEST_UNAVAILABLE';
    testUserAiSettingsConnection.mockRejectedValue(unavailableError);
    const user = userEvent.setup();

    render(<UserSettingsSection userId={userId} />);

    const testButton = await screen.findByRole('button', { name: /test concierge connection/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(testUserAiSettingsConnection).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/testing disabled for this environment/i),
      ).toBeInTheDocument();
    });
  });
});
