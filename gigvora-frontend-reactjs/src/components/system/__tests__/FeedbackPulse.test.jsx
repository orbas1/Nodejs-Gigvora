import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FeedbackPulse from '../FeedbackPulse.jsx';

const fetchResourceMock = vi.fn();
const mutateResourceMock = vi.fn();
const subscribeMock = vi.fn();
const analyticsTrackMock = vi.fn();

vi.mock('../../../context/DataFetchingLayer.js', () => ({
  __esModule: true,
  useDataFetchingLayer: () => ({
    buildKey: (method, path, params) => `${method}:${path}:${params?.promptId ?? ''}`,
    fetchResource: fetchResourceMock,
    mutateResource: mutateResourceMock,
    subscribe: subscribeMock,
  }),
}));

vi.mock('../../../context/ThemeProvider.tsx', () => ({
  __esModule: true,
  useTheme: () => ({
    tokens: { colors: { accent: '#6366f1' } },
    resolveComponentTokens: () => ({ colors: { accent: '#6366f1' } }),
  }),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: { track: analyticsTrackMock },
}));

vi.mock('../../../context/SessionContext.jsx', () => ({
  useSession: () => ({ session: { id: 'user-456' }, isAuthenticated: true }),
}));

describe('FeedbackPulse', () => {
  let storage;

  beforeEach(() => {
    vi.useFakeTimers();
    storage = new Map();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => (storage.has(key) ? storage.get(key) : null),
        setItem: (key, value) => {
          storage.set(key, String(value));
        },
        removeItem: (key) => {
          storage.delete(key);
        },
      },
    });
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (callback) => {
        return setTimeout(callback, 0);
      };
    }
    subscribeMock.mockReset();
    subscribeMock.mockReturnValue(() => {});
    fetchResourceMock.mockReset();
    mutateResourceMock.mockReset();
    analyticsTrackMock.mockReset();
    fetchResourceMock.mockResolvedValue({ eligible: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    Reflect.deleteProperty(window, 'localStorage');
  });

  it('auto opens after the configured delay', async () => {
    render(<FeedbackPulse initialDelay={200} />);

    await waitFor(() => expect(fetchResourceMock).toHaveBeenCalled());
    expect(screen.queryByText(/feedback pulse/i)).toBeNull();

    vi.advanceTimersByTime(220);

    await screen.findByText(/feedback pulse/i);
  });

  it('submits feedback and shows thank you state', async () => {
    mutateResourceMock.mockResolvedValueOnce({});
    render(<FeedbackPulse initialDelay={100000} />);

    await waitFor(() => expect(fetchResourceMock).toHaveBeenCalled());

    const trigger = screen.getByRole('button', { name: /share feedback/i });
    await userEvent.click(trigger);

    const happyReaction = screen.getByRole('button', { name: /happy/i });
    await userEvent.click(happyReaction);

    const textarea = await screen.findByRole('textbox', { name: /anything we should know/i });
    await userEvent.type(textarea, 'The new analytics flow is smooth.');

    const submit = screen.getByRole('button', { name: /send feedback/i });
    await userEvent.click(submit);

    await waitFor(() => expect(mutateResourceMock).toHaveBeenCalled());

    await screen.findByText(/we received your feedback/i);
    expect(screen.getByText(/thank you for helping us/i)).toBeInTheDocument();
  });

  it('snoozes when dismissed', async () => {
    render(<FeedbackPulse initialDelay={100000} snoozeMinutes={30} />);

    await waitFor(() => expect(fetchResourceMock).toHaveBeenCalled());

    const trigger = screen.getByRole('button', { name: /share feedback/i });
    await userEvent.click(trigger);

    const maybeLater = screen.getByRole('button', { name: /maybe later/i });
    await userEvent.click(maybeLater);

    expect(storage.size).toBe(1);
    const payload = JSON.parse(Array.from(storage.values())[0]);
    expect(payload.promptId).toBe('global-platform-health');
    expect(new Date(payload.snoozeUntil).getTime()).toBeGreaterThan(Date.now());
  });
});
