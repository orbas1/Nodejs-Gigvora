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
        },
      }),
    { dependencies: [debouncedQuery, shouldFetch], ttl: 1000 * 60 * 5, enabled: shouldFetch },
  );

  return { ...resource, debouncedQuery };
}
