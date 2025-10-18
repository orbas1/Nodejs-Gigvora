import { useEffect, useMemo, useState } from 'react';
import useDebounce from './useDebounce.js';
import { searchPeople } from '../services/search.js';

export default function usePeopleSearch(query, { minLength = 2, limit = 10 } = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedQuery = useDebounce(query, 300);

  const effectiveQuery = useMemo(() => debouncedQuery.trim(), [debouncedQuery]);
  const isEnabled = effectiveQuery.length >= minLength;

  useEffect(() => {
    if (!isEnabled) {
      setResults([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    const abortController = new AbortController();
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const people = await searchPeople(effectiveQuery, { limit, signal: abortController.signal });
        if (mounted) {
          setResults(people);
        }
      } catch (err) {
        if (mounted && err?.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [effectiveQuery, isEnabled, limit]);

  return { results, loading, error, canSearch: isEnabled };
}
