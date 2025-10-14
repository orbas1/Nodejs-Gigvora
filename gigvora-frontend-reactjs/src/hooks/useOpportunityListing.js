import { useMemo } from 'react';
import useDebounce from './useDebounce.js';
import useCachedResource from './useCachedResource.js';
import { apiClient } from '../services/apiClient.js';

const OPPORTUNITY_CACHE_TTL = 1000 * 60 * 5; // five minutes

const endpointByCategory = {
  jobs: '/discovery/jobs',
  gigs: '/discovery/gigs',
  projects: '/discovery/projects',
  launchpads: '/discovery/launchpads',
  volunteering: '/discovery/volunteering',
  mentors: '/discovery/mentors',
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normaliseFilters(filters) {
  if (!isPlainObject(filters)) {
    return null;
  }

  return Object.entries(filters).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map((entry) => {
          if (entry == null) {
            return null;
          }
          if (typeof entry === 'string') {
            const trimmed = entry.trim();
            return trimmed.length ? trimmed : null;
          }
          return entry;
        })
        .filter((entry) => entry !== null);

      if (cleaned.length) {
        accumulator[key] = cleaned;
      }
      return accumulator;
    }

    if (isPlainObject(value)) {
      const nested = normaliseFilters(value);
      if (nested && Object.keys(nested).length) {
        accumulator[key] = nested;
      }
      return accumulator;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length) {
        accumulator[key] = trimmed;
      }
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});
}

function normaliseSort(sort) {
  if (sort == null) {
    return null;
  }

  if (typeof sort === 'string') {
    const trimmed = sort.trim();
    return trimmed.length ? trimmed : null;
  }

  if (Array.isArray(sort)) {
    const cleaned = sort
      .map((entry) => {
        if (entry == null) {
          return null;
        }
        if (typeof entry === 'string') {
          const trimmed = entry.trim();
          return trimmed.length ? trimmed : null;
        }
        if (isPlainObject(entry)) {
          const nested = normaliseSort(entry);
          return nested && Object.keys(nested).length ? nested : null;
        }
        return entry;
      })
      .filter((entry) => entry !== null);

    return cleaned.length ? cleaned : null;
  }

  if (isPlainObject(sort)) {
    const cleaned = normaliseFilters(sort);
    return cleaned && Object.keys(cleaned).length ? cleaned : null;
  }

  return sort;
}

function normaliseViewport(viewport) {
  if (viewport == null) {
    return null;
  }

  if (typeof viewport === 'string') {
    const trimmed = viewport.trim();
    return trimmed.length ? trimmed : null;
  }

  if (Array.isArray(viewport)) {
    const cleaned = viewport
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter((entry) => entry != null && (`${entry}`.length > 0));
    return cleaned.length ? cleaned : null;
  }

  if (isPlainObject(viewport)) {
    const cleaned = normaliseFilters(viewport);
    return cleaned && Object.keys(cleaned).length ? cleaned : null;
  }

  return viewport;
}

function normaliseHeaders(headers) {
  if (!isPlainObject(headers)) {
    return null;
  }

  return Object.entries(headers).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }
    const trimmed = `${value}`.trim();
    if (trimmed.length) {
      accumulator[key] = trimmed;
    }
    return accumulator;
  }, {});
}

function stableSerialise(value) {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    const entries = value
      .map((item) => stableSerialise(item))
      .filter((item) => item !== null)
      .sort();
    if (!entries.length) {
      return null;
    }
    return `[${entries.join(',')}]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    if (!keys.length) {
      return null;
    }
    return `{${keys
      .map((key) => `${key}:${stableSerialise(value[key]) ?? 'null'}`)
      .join(',')}}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  return `${value}`;
}

export default function useOpportunityListing(
  category,
  query,
  {
    page = 1,
    pageSize = 20,
    filters = null,
    sort = null,
    includeFacets = false,
    viewport = null,
    headers = null,
    enabled = true,
  } = {},
) {
  const endpoint = endpointByCategory[category];
  if (!endpoint) {
    throw new Error(`Unsupported opportunity category: ${category}`);
  }

  const trimmedQuery = useMemo(() => (query || '').trim(), [query]);
  const debouncedQuery = useDebounce(trimmedQuery, 400);

  const normalisedFilters = useMemo(() => normaliseFilters(filters), [filters]);
  const normalisedSort = useMemo(() => normaliseSort(sort), [sort]);
  const normalisedViewport = useMemo(() => normaliseViewport(viewport), [viewport]);
  const normalisedHeaders = useMemo(() => normaliseHeaders(headers), [headers]);

  const filtersKey = useMemo(() => stableSerialise(normalisedFilters) ?? 'filters:none', [normalisedFilters]);
  const sortKey = useMemo(() => stableSerialise(normalisedSort) ?? 'sort:default', [normalisedSort]);
  const viewportKey = useMemo(() => stableSerialise(normalisedViewport) ?? 'viewport:none', [normalisedViewport]);
  const headersKey = useMemo(() => stableSerialise(normalisedHeaders) ?? 'headers:default', [normalisedHeaders]);

  const cacheKey = useMemo(
    () =>
      [
        'opportunity',
        category,
        debouncedQuery || 'query:all',
        `page:${page}`,
        `size:${pageSize}`,
        filtersKey,
        sortKey,
        viewportKey,
        includeFacets ? 'facets:on' : 'facets:off',
        headersKey,
      ].join('|'),
    [category, debouncedQuery, page, pageSize, filtersKey, sortKey, viewportKey, includeFacets, headersKey],
  );

  const params = useMemo(() => {
    const payload = {
      page: page > 1 ? page : undefined,
      pageSize,
      q: debouncedQuery || undefined,
      includeFacets: includeFacets ? 'true' : undefined,
    };

    if (normalisedFilters) {
      payload.filters = JSON.stringify(normalisedFilters);
    }

    if (normalisedSort) {
      payload.sort =
        typeof normalisedSort === 'string' ? normalisedSort : JSON.stringify(normalisedSort);
    }

    if (normalisedViewport) {
      payload.viewport =
        typeof normalisedViewport === 'string' ? normalisedViewport : JSON.stringify(normalisedViewport);
    }

    return payload;
  }, [page, pageSize, debouncedQuery, includeFacets, normalisedFilters, normalisedSort, normalisedViewport]);

  const requestHeaders = useMemo(() => (normalisedHeaders ? normalisedHeaders : undefined), [normalisedHeaders]);

  const shouldFetch = Boolean(enabled);

  const resource = useCachedResource(
    cacheKey,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params,
        headers: requestHeaders,
      }),
    {
      ttl: OPPORTUNITY_CACHE_TTL,
      dependencies: [endpoint, cacheKey, params, requestHeaders],
      enabled: shouldFetch,
    },
  );

  return { ...resource, debouncedQuery };
}
