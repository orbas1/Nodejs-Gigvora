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

function stableStringify(value) {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return `${value}`;
}

function normaliseFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return null;
  }

  return Object.entries(filters).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length) {
        accumulator[key] = trimmed;
      }
      return accumulator;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      accumulator[key] = value;
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

    if (typeof value === 'object') {
      const nested = normaliseFilters(value);
      if (nested && Object.keys(nested).length) {
        accumulator[key] = nested;
      }
      return accumulator;
    }

    const trimmed = `${value}`.trim();
    if (trimmed.length) {
      accumulator[key] = trimmed;
    const stringValue = `${value}`.trim();
    if (stringValue.length) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

function normaliseHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
function normaliseSort(sort) {
  if (sort == null) {
function stableSerialise(value) {
  if (value == null) {
    return null;
  }
  if (typeof sort === 'string') {
    const trimmed = sort.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof sort === 'object') {
    return normaliseFilters(sort);
  }
  return sort;
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
function normaliseViewport(viewport) {
  if (viewport == null) {
    return null;
  }
  if (typeof viewport === 'string') {
    const trimmed = viewport.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof viewport === 'object') {
    return normaliseFilters(viewport);
  }
  return viewport;
}

function normaliseHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return null;
  }

  return Object.entries(headers).reduce((accumulator, [key, value]) => {
    if (value == null) {
      return accumulator;
    }
    const stringValue = `${value}`.trim();
    if (stringValue.length) {
      accumulator[key] = stringValue;
    }
    return accumulator;
  }, {});
}

function stableSerialise(value) {
  if (value == null) {
  const normalise = (input) => {
    if (Array.isArray(input)) {
      return input
        .map((item) => normalise(item))
        .filter((item) => item !== undefined)
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    }

    if (input && typeof input === 'object') {
      return Object.keys(input)
        .sort()
        .reduce((accumulator, key) => {
          const normalisedValue = normalise(input[key]);
          if (normalisedValue !== undefined && normalisedValue !== null) {
            accumulator[key] = normalisedValue;
          }
          return accumulator;
        }, {});
    }

    if (input === undefined || input === '') {
      return undefined;
    }

    return input;
  };

  const normalised = normalise(value);
  if (normalised == null) {
    return null;
  }

  if (typeof normalised === 'object' && !Array.isArray(normalised) && !Object.keys(normalised).length) {
    return null;
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialise(entry) ?? 'null').join(',')}]`;
  }

  if (typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableSerialise(value[key]) ?? 'null'}`)
      .join(',')}}`;
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
  const trimmedQuery = (query || '').trim();
  const debouncedQuery = useDebounce(trimmedQuery, 400);

  const endpoint = endpointByCategory[category];
  if (!endpoint) {
    throw new Error(`Unsupported opportunity category: ${category}`);
  }

  if (!endpoint) {
    throw new Error(`Unsupported opportunity category: ${category}`);
  }

  const normalisedFilters = useMemo(() => normaliseFilters(filters), [filters]);
  const normalisedHeaders = useMemo(() => normaliseHeaders(headers), [headers]);

  const sortKey = useMemo(() => stableStringify(sort) || 'default-sort', [sort]);
  const filtersKey = useMemo(
    () => (normalisedFilters ? stableStringify(normalisedFilters) : 'no-filters'),
    [normalisedFilters],
  );
  const viewportKey = useMemo(
    () => (viewport == null ? 'no-viewport' : stableStringify(viewport)),
    [viewport],
  );
  const headersKey = useMemo(
    () => (normalisedHeaders ? stableStringify(normalisedHeaders) : 'no-headers'),
    [normalisedHeaders],
  );

  const cacheKey = useMemo(() => {
    const parts = [
      category,
      debouncedQuery || 'all',
      page,
      pageSize,
      filtersKey,
      sortKey,
      includeFacets ? 'with-facets' : 'no-facets',
      viewportKey,
      headersKey,
    ];
    return `opportunity:${parts.join(':')}`;
  }, [category, debouncedQuery, page, pageSize, filtersKey, sortKey, includeFacets, viewportKey, headersKey]);

  const params = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      page: page > 1 ? page : undefined,
  const normalisedSort = useMemo(() => normaliseSort(sort), [sort]);
  const normalisedViewport = useMemo(() => normaliseViewport(viewport), [viewport]);
  const normalisedHeaders = useMemo(() => normaliseHeaders(headers), [headers]);

  const filtersKey = useMemo(() => stableSerialise(normalisedFilters) ?? 'no-filters', [normalisedFilters]);
  const sortKey = useMemo(() => stableSerialise(normalisedSort) ?? 'default-sort', [normalisedSort]);
  const viewportKey = useMemo(() => stableSerialise(normalisedViewport) ?? 'no-viewport', [normalisedViewport]);
  const headersKey = useMemo(() => stableSerialise(normalisedHeaders) ?? 'default-headers', [normalisedHeaders]);

  const cacheKey = useMemo(
    () =>
      [
        'opportunity',
        category,
        debouncedQuery || 'all',
        `page-${page}`,
        `size-${pageSize}`,
        filtersKey,
        sortKey,
        viewportKey,
        includeFacets ? 'facets' : 'no-facets',
        headersKey,
      ].join(':'),
    [category, debouncedQuery, page, pageSize, filtersKey, sortKey, viewportKey, includeFacets, headersKey],
  );
  const trimmedQuery = (query || '').trim();
  const debouncedQuery = useDebounce(trimmedQuery, 400);

  const normalisedFilters = useMemo(() => normaliseFilters(filters), [filters]);
  const filterKey = useMemo(() => stableSerialise(normalisedFilters) ?? 'none', [normalisedFilters]);
  const sortKey = useMemo(() => stableSerialise(sort) ?? 'default', [sort]);
  const viewportKey = useMemo(() => stableSerialise(viewport) ?? 'none', [viewport]);
  const headersKey = useMemo(() => stableSerialise(headers) ?? 'none', [headers]);

  const params = useMemo(
    () => ({
      page,
      pageSize,
      q: debouncedQuery || undefined,
      filters: normalisedFilters ? JSON.stringify(normalisedFilters) : undefined,
      sort:
        typeof normalisedSort === 'string'
          ? normalisedSort
          : normalisedSort
          ? JSON.stringify(normalisedSort)
          : undefined,
      includeFacets: includeFacets ? 'true' : undefined,
      viewport:
        typeof normalisedViewport === 'string'
          ? normalisedViewport
          : normalisedViewport
          ? JSON.stringify(normalisedViewport)
          : undefined,
    }),
    [debouncedQuery, page, pageSize, normalisedFilters, sort, includeFacets, viewport],
    [page, pageSize, debouncedQuery, normalisedFilters, normalisedSort, includeFacets, normalisedViewport],
  );

  const requestHeaders = useMemo(() => {
    if (!normalisedHeaders) {
      return undefined;
    }
    return normalisedHeaders;
  }, [normalisedHeaders]);

  const shouldFetch = Boolean(enabled);

    return Object.entries(headers).reduce((accumulator, [key, value]) => {
      if (value == null) {
        return accumulator;
      }
      const stringValue = `${value}`.trim();
      if (stringValue.length) {
        accumulator[key] = stringValue;
      }
      return accumulator;
    }, {});
  }, [headers, headersKey]);

  const cacheKey = useMemo(() => {
    const queryKey = debouncedQuery || 'all';
    return `opportunity:${category}:${queryKey}:${filterKey}:${sortKey}:${viewportKey}:${includeFacets ? 'facets' : 'no-facets'}:${pageSize}:${headersKey}`;
  }, [category, debouncedQuery, filterKey, sortKey, viewportKey, includeFacets, pageSize, headersKey]);

  const resource = useCachedResource(
    cacheKey,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params,
        headers: requestHeaders,
      }),
    {
      dependencies: [endpoint, cacheKey],
      ttl: 1000 * 60 * 5,
      enabled: shouldFetch,
        headers: normalisedHeaders || undefined,
      }),
    {
      dependencies: [cacheKey],
        headers: requestHeaders,
      }),
    {
      dependencies: [debouncedQuery, filterKey, sortKey, viewportKey, includeFacets, pageSize, headersKey],
      ttl: 1000 * 60 * 5,
      enabled: Boolean(enabled),
    },
  );

  return { ...resource, debouncedQuery };
}
