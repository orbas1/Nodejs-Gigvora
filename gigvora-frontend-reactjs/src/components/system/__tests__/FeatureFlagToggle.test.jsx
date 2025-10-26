import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeatureFlagToggle from '../FeatureFlagToggle.jsx';

const storage = new Map();
const apiClientMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  writeCache: vi.fn((key, value) => {
    storage.set(key, { data: value, timestamp: new Date() });
  }),
  readCache: vi.fn((key) => storage.get(key) ?? null),
  removeCache: vi.fn((key) => storage.delete(key)),
};

const subscribers = new Map();

function updateCache(key, updater, options = {}) {
  const previous = storage.get(key)?.data ?? null;
  const next = typeof updater === 'function' ? updater(previous) : updater;
  if (next === null) {
    storage.delete(key);
  } else {
    storage.set(key, { data: next, timestamp: new Date() });
  }
  if (!options.silent) {
    const callbacks = subscribers.get(key) ?? [];
    callbacks.forEach((callback) => callback({ data: next }));
  }
  return { previous };
}

vi.mock('../../../context/DataFetchingLayer.js', () => ({
  __esModule: true,
  useDataFetchingLayer: () => ({
    buildKey: (method, path) => `${method}:${path}`,
    fetchResource: vi.fn(async (path, { key }) => {
      const response = await apiClientMock.get(path);
      const payload = response?.flag ? response : { flag: response };
      storage.set(key, { data: payload, timestamp: new Date() });
      return payload;
    }),
    mutateResource: vi.fn(async (path, options) => {
      let rollback = () => {};
      if (typeof options.optimisticUpdate === 'function') {
        rollback = options.optimisticUpdate((key, updater, meta) => updateCache(key, updater, meta));
      }
      try {
        const response = await apiClientMock.patch(path, options.body);
        if (Array.isArray(options.invalidate)) {
          options.invalidate.forEach((key) => {
            const entry = storage.get(key);
            if (entry) {
              const callbacks = subscribers.get(key) ?? [];
              callbacks.forEach((callback) => callback({ data: entry.data }));
            }
          });
        }
        return response;
      } catch (error) {
        rollback?.();
        throw error;
      }
    }),
    subscribe: vi.fn((key, callback) => {
      const callbacks = subscribers.get(key) ?? [];
      subscribers.set(key, [...callbacks, callback]);
      return () => {
        const current = subscribers.get(key) ?? [];
        subscribers.set(
          key,
          current.filter((item) => item !== callback),
        );
      };
    }),
  }),
}));

vi.mock('../../../context/ThemeProvider.tsx', () => ({
  __esModule: true,
  useTheme: () => ({
    tokens: { colors: { accent: '#6366f1' } },
    registerComponentTokens: vi.fn(),
    removeComponentTokens: vi.fn(),
    resolveComponentTokens: () => ({ colors: { accent: '#6366f1' } }),
  }),
}));

vi.mock('../../../services/apiClient.js', () => ({
  __esModule: true,
  apiClient: apiClientMock,
  default: apiClientMock,
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: {
    track: vi.fn(),
    setGlobalContext: vi.fn(),
  },
}));

vi.mock('../../../context/SessionContext.jsx', () => ({
  useSession: () => ({ session: { id: 'user-987' }, isAuthenticated: true }),
}));

describe('FeatureFlagToggle', () => {
  beforeEach(() => {
    storage.clear();
    subscribers.clear();
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));
    }
  });

  it('renders flag state and toggles optimistically', async () => {
    apiClientMock.get.mockResolvedValueOnce({
      flag: { key: 'mobile-app-beta', status: 'disabled', enabled: false, updatedAt: null },
    });
    apiClientMock.patch.mockResolvedValueOnce({
      flag: { key: 'mobile-app-beta', status: 'active', enabled: true },
    });
    apiClientMock.get.mockResolvedValueOnce({
      flag: { key: 'mobile-app-beta', status: 'active', enabled: true },
    });

    render(
      createElement(FeatureFlagToggle, {
        flagKey: 'mobile-app-beta',
        label: 'Mobile companion beta',
      }),
    );

    const toggle = await screen.findByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(toggle);

    await waitFor(() => expect(apiClientMock.patch).toHaveBeenCalled());
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
  });
});
