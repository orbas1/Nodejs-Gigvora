import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeatureFlagToggle from '../FeatureFlagToggle.jsx';
import { ThemeProvider } from '../../../context/ThemeProvider.tsx';
import { DataFetchingProvider } from '../../../context/DataFetchingLayer.js';

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
    apiClientMock.get.mockResolvedValueOnce({ key: 'mobile-app-beta', enabled: false, updatedAt: null });
    apiClientMock.patch.mockResolvedValueOnce({ key: 'mobile-app-beta', enabled: true });
    apiClientMock.get.mockResolvedValueOnce({ key: 'mobile-app-beta', enabled: true });

    render(
      createElement(
        ThemeProvider,
        null,
        createElement(
          DataFetchingProvider,
          null,
          createElement(FeatureFlagToggle, {
            flagKey: 'mobile-app-beta',
            label: 'Mobile companion beta',
          }),
        ),
      ),
    );

    const toggle = await screen.findByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(toggle);

    await waitFor(() => expect(apiClientMock.patch).toHaveBeenCalled());
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
  });
});
