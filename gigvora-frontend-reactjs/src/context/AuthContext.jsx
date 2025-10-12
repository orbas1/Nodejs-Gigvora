import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import apiClient from '../services/apiClient.js';

const SESSION_STORAGE_KEY = 'gigvora:web:auth:session';
const USER_ID_STORAGE_KEY = 'gigvora:web:userId';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable for auth session.', error);
    return null;
  }
}

function readStoredSession(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to parse stored session', error);
    return null;
  }
}

function persistSession(storage, session) {
  if (!storage) return;
  try {
    if (session) {
      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      if (session.refreshToken) {
        storage.setItem(apiClient.REFRESH_TOKEN_KEY, session.refreshToken);
      }
      storage.setItem(USER_ID_STORAGE_KEY, String(session.user.id));
    } else {
      storage.removeItem(SESSION_STORAGE_KEY);
      storage.removeItem(apiClient.REFRESH_TOKEN_KEY);
      storage.removeItem(USER_ID_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist auth session', error);
  }
}

const AuthContext = createContext({
  status: 'anonymous',
  user: null,
  challenge: null,
  error: null,
  loginWithPassword: async () => {},
  verifyTwoFactor: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const storage = getStorage();
  const storedSession = readStoredSession(storage);

  if (storedSession?.accessToken) {
    apiClient.setAccessToken(storedSession.accessToken);
  }

  const [state, setState] = useState(() => {
    if (storedSession?.user && storedSession.accessToken) {
      return {
        status: 'authenticated',
        user: storedSession.user,
        accessToken: storedSession.accessToken,
        refreshToken: storedSession.refreshToken ?? null,
        challenge: null,
        error: null,
      };
    }
    return {
      status: 'anonymous',
      user: null,
      accessToken: null,
      refreshToken: null,
      challenge: null,
      error: null,
    };
  });

  const loginWithPassword = useCallback(async (email, password) => {
    setState((prev) => ({ ...prev, status: 'authenticating', error: null }));
    try {
      await apiClient.post('/auth/login', { email, password });
      setState({
        status: 'challenge',
        user: null,
        accessToken: null,
        refreshToken: null,
        challenge: { email },
        error: null,
      });
    } catch (error) {
      setState({
        status: 'anonymous',
        user: null,
        accessToken: null,
        refreshToken: null,
        challenge: null,
        error: error.message || 'Unable to request verification code.',
      });
      throw error;
    }
  }, []);

  const verifyTwoFactor = useCallback(
    async (code) => {
      setState((prev) => ({ ...prev, status: 'authenticating', error: null }));
      const email = state.challenge?.email;
      if (!email) {
        const error = new Error('No pending verification challenge.');
        setState((prev) => ({ ...prev, status: 'anonymous', error: error.message }));
        throw error;
      }
      try {
        const response = await apiClient.post('/auth/verify-2fa', { email, code });
        apiClient.setAccessToken(response.accessToken);
        persistSession(storage, {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        setState({
          status: 'authenticated',
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          challenge: null,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, status: 'challenge', error: error.message || 'Verification failed.' }));
        throw error;
      }
    },
    [state.challenge, storage],
  );

  const logout = useCallback(() => {
    apiClient.clearAccessToken();
    persistSession(storage, null);
    setState({
      status: 'anonymous',
      user: null,
      accessToken: null,
      refreshToken: null,
      challenge: null,
      error: null,
    });
  }, [storage]);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      challenge: state.challenge,
      error: state.error,
      loginWithPassword,
      verifyTwoFactor,
      logout,
    }),
    [state, loginWithPassword, verifyTwoFactor, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider.');
  }
  return context;
}

export default AuthContext;
