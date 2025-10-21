import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSitePage } from '../services/publicSite.js';

export default function useSitePage(slug, { fallback = null, autoFetch = true } = {}) {
  const [page, setPage] = useState(fallback ?? null);
  const [loading, setLoading] = useState(Boolean(autoFetch));
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(Boolean(fallback));
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [lastErrorAt, setLastErrorAt] = useState(null);

  const load = useCallback(
    async (options = {}) => {
      if (!slug) {
        setError(new Error('A slug is required.'));
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetchSitePage(slug, options.params ?? {}, options);
        setPage(result);
        setUsingFallback(false);
        setLastFetchedAt(new Date());
        setLastErrorAt(null);
        return result;
      } catch (err) {
        setError(err);
        setUsingFallback(true);
        setLastErrorAt(new Date());
        return null;
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    if (!fallback) {
      return;
    }
    setPage((current) => {
      if (current && !usingFallback) {
        return current;
      }
      return fallback;
    });
  }, [fallback, usingFallback]);

  useEffect(() => {
    if (!autoFetch || !slug) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    const controller = new AbortController();
    load({ signal: controller.signal }).catch(() => {
      if (isMounted) {
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [autoFetch, load, slug]);

  const resolvedPage = useMemo(() => page ?? fallback ?? null, [fallback, page]);

  return {
    page: resolvedPage,
    loading,
    error,
    refresh: load,
    usingFallback,
    fallback,
    lastFetchedAt,
    lastErrorAt,
  };
}
