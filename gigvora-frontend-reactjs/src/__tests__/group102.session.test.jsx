import { act, renderHook } from '@testing-library/react';
import { SessionProvider } from '../context/SessionContext.jsx';
import useSession from '../hooks/useSession.js';

const storageMap = new Map();
const localStorageStub = {
  getItem: (key) => storageMap.get(key) ?? null,
  setItem: (key, value) => storageMap.set(key, value),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

beforeEach(() => {
  storageMap.clear();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: localStorageStub });
});

describe('useSession hook', () => {
  it('exposes login and logout helpers from the session provider', async () => {
    const wrapper = ({ children }) => <SessionProvider>{children}</SessionProvider>;
    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.login({
        id: 'user-1',
        email: 'demo@gigvora.com',
        firstName: 'Demo',
        lastName: 'User',
        accessToken: 'token-1',
        refreshToken: 'token-2',
        memberships: ['user'],
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.session.email).toBe('demo@gigvora.com');
    expect(result.current.roleKeys).toContain('user');

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
