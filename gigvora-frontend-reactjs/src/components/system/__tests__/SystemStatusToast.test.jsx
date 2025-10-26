import { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SystemStatusToast from '../SystemStatusToast.jsx';

const mocks = vi.hoisted(() => ({
  fetchResourceMock: vi.fn(),
  subscribeMock: vi.fn(),
  analyticsTrackMock: vi.fn(),
}));

vi.mock('../../../context/DataFetchingLayer.js', () => ({
  __esModule: true,
  useDataFetchingLayer: () => ({
    buildKey: (method, path) => `${method}:${path}`,
    fetchResource: mocks.fetchResourceMock,
    subscribe: mocks.subscribeMock,
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
  default: { track: mocks.analyticsTrackMock },
}));

vi.mock('../../../context/SessionContext.jsx', () => ({
  useSession: () => ({ session: { id: 'user-123' }, isAuthenticated: true }),
}));

describe('SystemStatusToast', () => {
  let storage;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    mocks.subscribeMock.mockReset();
    mocks.subscribeMock.mockReturnValue(() => {});
    mocks.fetchResourceMock.mockReset();
    mocks.fetchResourceMock.mockImplementation(() =>
      Promise.resolve({ severity: 'operational', summary: 'All good', incidents: [], maintenances: [] }),
    );
    mocks.analyticsTrackMock.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      vi.runOnlyPendingTimers();
      vi.clearAllTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
    Reflect.deleteProperty(window, 'localStorage');
  });

  it('does not display toast when system is operational', async () => {
    render(<SystemStatusToast />);

    await waitFor(() => expect(mocks.fetchResourceMock).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders degraded incident details and stores acknowledgement on dismiss', async () => {
    const updatedAt = new Date().toISOString();
    mocks.fetchResourceMock.mockImplementation(() =>
      Promise.resolve({
        severity: 'degraded',
        summary: 'Investigating messaging delays',
        incidents: [
          {
            id: 'inc-1',
          title: 'Messaging delays',
          severity: 'degraded',
          status: 'investigating',
          updatedAt,
          services: ['Messaging'],
        },
      ],
        statusPageUrl: 'https://status.gigvora.com',
        updatedAt,
      }),
    );

    render(<SystemStatusToast autoHideMinutes={12} />);

    await act(async () => {
      await Promise.resolve();
    });

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Messaging delays');

    const dismissButton = screen.getByRole('button', { name: /dismiss system status/i });
    await userEvent.click(dismissButton);

    expect(storage.size).toBe(1);
    const [[, stored]] = Array.from(storage.entries());
    expect(() => JSON.parse(stored)).not.toThrow();
    const payload = JSON.parse(stored);
    expect(payload).toMatchObject({ severity: 'degraded' });
  });

  it('invokes onNavigate when opening the status page', async () => {
    const updatedAt = new Date().toISOString();
    mocks.fetchResourceMock.mockImplementation(() =>
      Promise.resolve({
        severity: 'degraded',
        summary: 'Partial outage',
        statusPageUrl: 'https://status.gigvora.com',
        incidents: [
          {
            id: 'inc-2',
            title: 'API latency',
            severity: 'degraded',
            status: 'investigating',
            updatedAt,
          },
        ],
        updatedAt,
      }),
    );
    const handleNavigate = vi.fn();

    render(<SystemStatusToast onNavigate={handleNavigate} />);

    await act(async () => {
      await Promise.resolve();
    });

    await screen.findByRole('status');

    const cta = screen.getByRole('button', { name: /view full status/i });
    await userEvent.click(cta);

    expect(handleNavigate).toHaveBeenCalledWith('https://status.gigvora.com', expect.any(Object));
  });
});
