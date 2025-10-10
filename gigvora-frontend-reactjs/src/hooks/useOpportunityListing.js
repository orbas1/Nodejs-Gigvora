import useDebounce from './useDebounce.js';
import useCachedResource from './useCachedResource.js';
import { apiClient } from '../services/apiClient.js';

const endpointByCategory = {
  jobs: '/discovery/jobs',
  gigs: '/discovery/gigs',
  projects: '/discovery/projects',
  launchpads: '/discovery/launchpads',
  volunteering: '/discovery/volunteering',
};

export default function useOpportunityListing(category, query, { pageSize = 20 } = {}) {
  const debouncedQuery = useDebounce((query || '').trim(), 400);
  const endpoint = endpointByCategory[category];

  const resource = useCachedResource(
    `opportunity:${category}:${debouncedQuery || 'all'}`,
    ({ signal }) =>
      apiClient.get(endpoint, {
        signal,
        params: {
          q: debouncedQuery || undefined,
          pageSize,
        },
      }),
    { dependencies: [debouncedQuery], ttl: 1000 * 60 * 5 },
  );

  return { ...resource, debouncedQuery };
}
