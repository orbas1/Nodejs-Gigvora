import { DEFAULT_GIG_BLUEPRINT_ID } from '@shared-contracts/domain/marketplace/gig-blueprints.js';
import useCachedResource from './useCachedResource.js';
import { fetchGigBlueprint } from '../services/gigBlueprintService.js';

export default function useGigBlueprint(identifier = DEFAULT_GIG_BLUEPRINT_ID, options = {}) {
  const { ttl, dependencies = [], enabled = true } = options ?? {};
  const safeIdentifier = identifier ?? DEFAULT_GIG_BLUEPRINT_ID;
  return useCachedResource(
    `gig-blueprint:${safeIdentifier}`,
    ({ signal }) => fetchGigBlueprint(safeIdentifier, { signal }),
    {
      ttl,
      dependencies: [safeIdentifier, ...dependencies],
      enabled,
    },
  );
}
