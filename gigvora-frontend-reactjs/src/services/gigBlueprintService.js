import { DEFAULT_GIG_BLUEPRINT_ID } from '@shared-contracts/domain/marketplace/gig-blueprints.js';
import { apiClient } from './apiClient.js';

function ensureIdentifier(identifier) {
  if (identifier === undefined || identifier === null) {
    return String(DEFAULT_GIG_BLUEPRINT_ID);
  }
  const value = `${identifier}`.trim();
  return value.length ? value : String(DEFAULT_GIG_BLUEPRINT_ID);
}

export async function fetchGigBlueprints(options = {}) {
  const { signal } = options ?? {};
  const response = await apiClient.get('/marketplace/gig-blueprints', signal ? { signal } : undefined);
  return {
    blueprints: response?.blueprints ?? [],
    meta: response?.meta ?? {},
  };
}

export async function fetchGigBlueprint(identifier, options = {}) {
  const { signal } = options ?? {};
  const safeIdentifier = ensureIdentifier(identifier);
  const response = await apiClient.get(
    `/marketplace/gig-blueprints/${encodeURIComponent(safeIdentifier)}`,
    signal ? { signal } : undefined,
  );
  return {
    blueprint: response?.blueprint ?? null,
    meta: response?.meta ?? {},
  };
}

export default {
  fetchGigBlueprints,
  fetchGigBlueprint,
};
