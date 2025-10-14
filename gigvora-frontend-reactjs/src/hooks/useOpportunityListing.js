import { useMemo } from 'react';
import useDebounce from './useDebounce.js';
import useCachedResource from './useCachedResource.js';
import { apiClient } from '../services/apiClient.js';

const endpointByCategory = {
  jobs: '/discovery/jobs',
  gigs: '/discovery/gigs',
  projects: '/discovery/projects',
  launchpads: '/discovery/launchpads',
  volunteering: '/discovery/volunteering',
  mentors: '/discovery/mentors',
};

function stableSerialise(value) {
  if (!value) {
    return null;
  }

  const normalise = (input) => {
    if (Array.isArray(input)) {
      return input.map((item) => normalise(item)).filter((item) => item !== undefined);
    }
    if (input && typeof input === 'object') {
      return Object.keys(input)
        .sort()
        .reduce((acc, key) => {
          const normalised = normalise(input[key]);
          if (normalised !== undefined && normalised !== null && `${normalised}`.length > 0) {
            acc[key] = normalised;
          }
          return acc;
        }, {});
    }
    if (input === null || input === undefined) {
      return undefined;
    }
    return input;
  };

  const normalised = normalise(value);
  if (normalised && typeof normalised === 'object' && !Array.isArray(normalised) && !Object.keys(normalised).length) {
    return null;
  }

  return JSON.stringify(normalised);
}

export default function useOpportunityListing(
  category,
  query,
  { pageSize = 20, filters = null, headers = null, enabled = true } = {},
) {
  const debouncedQuery = useDebounce((query || '').trim(), 400);
  const endpoint = endpointByCategory[category];

  const filtersKey = useMemo(() => stableSerialise(filters) ?? 'none', [filters]);
  const headersKey = useMemo(() => stableSerialise(headers) ?? 'none', [headers]);
  const paramsFilters = useMemo(() => {
    const payload = stableSerialise(filters);
    return payload ? payload : undefined;
  }, [filtersKey]);
  const requestHeaders = useMemo(() => {
    if (!headers) {
      return undefined;
    }
    return Object.entries(headers).reduce((acc, [key, value]) => {
      if (value != null && `${value}`.length > 0) {
        acc[key] = `${value}`;
      }
      return acc;
    }, {});
  }, [headersKey]);

  const cacheKey = useMemo(() => {
    const queryKey = debouncedQuery || 'all';
    return `opportunity:${category}:${queryKey}:${filtersKey}:${headersKey}`;
  }, [category, debouncedQuery, filtersKey, headersKey]);

  const resource = useCachedResource(
    cacheKey,
export default function useOpportunityListing(category, query, { pageSize = 20, enabled = true } = {}) {
  const trimmedQuery = (query || '').trim();
  const debouncedQuery = useDebounce(trimmedQuery, 400);
  const endpoint = endpointByCategory[category];

  if (!endpoint) {
    throw new Error(`Unsupported opportunity category: ${category}`);
  }

  const shouldFetch = Boolean(enabled);
  const cacheKeyQuery = shouldFetch ? debouncedQuery : 'disabled';

  const resource = useCachedResource(
    `opportunity:${category}:${cacheKeyQuery || 'all'}`,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params: {
          q: debouncedQuery || undefined,
          pageSize,
          filters: paramsFilters,
        },
        headers: requestHeaders,
      }),
    { dependencies: [debouncedQuery, filtersKey, headersKey], ttl: 1000 * 60 * 5, enabled: Boolean(enabled && endpoint) },
    { dependencies: [debouncedQuery, shouldFetch], ttl: 1000 * 60 * 5, enabled: shouldFetch },
  );

  return { ...resource, debouncedQuery };
}
