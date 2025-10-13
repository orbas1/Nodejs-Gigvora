import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { fetchCommunitySpotlight } from '../services/communitySpotlight.js';

export function useCommunitySpotlight({ freelancerId, profileId, includeDraft = false, enabled = true } = {}) {
  const cacheKey = useMemo(() => {
    if (!freelancerId) {
      return 'communitySpotlight:freelancer:none';
    }
    const profilePart = profileId ? `:${profileId}` : '';
    const draftPart = includeDraft ? ':draft' : ':published';
    return `communitySpotlight:freelancer:${freelancerId}${profilePart}${draftPart}`;
  }, [freelancerId, profileId, includeDraft]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!freelancerId) {
        return Promise.reject(new Error('freelancerId is required to load community spotlight.'));
      }
      return fetchCommunitySpotlight({ freelancerId, profileId, includeDraft, signal });
    },
    [freelancerId, profileId, includeDraft],
  );

  return useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(freelancerId),
    dependencies: [freelancerId, profileId, includeDraft],
    ttl: 1000 * 45,
  });
}

export default useCommunitySpotlight;
