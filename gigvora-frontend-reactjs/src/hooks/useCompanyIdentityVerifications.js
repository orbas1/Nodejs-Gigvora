import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchIdentityVerifications } from '../services/companyIdentity.js';

function normaliseParams(params = {}) {
  const normalised = { ...params };
  Object.entries(normalised).forEach(([key, value]) => {
    if (value === undefined || value === null || `${value}`.length === 0) {
      delete normalised[key];
    }
  });
  return normalised;
}

export function useCompanyIdentityVerifications(params = {}, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const requestParams = useMemo(() => normaliseParams(params), [params]);

  const load = useCallback(
    async ({ overrides = {}, signal } = {}) => {
      if (!enabled) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetchIdentityVerifications({ ...requestParams, ...overrides }, { signal });
        setData(response);
        setLastUpdated(new Date());
        return response;
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [requestParams, enabled],
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const controller = new AbortController();
    load({ signal: controller.signal }).catch((err) => {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Failed to load identity verifications', err);
    });
    return () => controller.abort();
  }, [load, enabled]);

  const refresh = useCallback(
    async (overrides = {}) => load({ overrides }),
    [load],
  );

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    setData,
  };
}

export default useCompanyIdentityVerifications;
