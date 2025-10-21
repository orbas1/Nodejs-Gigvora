import { z } from 'zod';

export const CATEGORY_COLLECTION_MAP = Object.freeze({
  project: 'projects',
  gig: 'gigs',
  talent: 'talent',
  mentor: 'mentor',
  volunteering: 'volunteering',
  job: 'job',
  launchpad: 'launchpad',
});

const CATEGORY_SCHEMA = z.enum(Object.keys(CATEGORY_COLLECTION_MAP));

export function resolveExplorerCollection(category) {
  const parsed = CATEGORY_SCHEMA.safeParse(category);
  if (!parsed.success) {
    const error = new Error('Explorer category not found');
    error.status = 404;
    throw error;
  }
  return CATEGORY_COLLECTION_MAP[parsed.data];
}

export function getExplorerCollections() {
  return Object.values(CATEGORY_COLLECTION_MAP);
}

export function inferExplorerCategoryFromCollection(collection) {
  const match = Object.entries(CATEGORY_COLLECTION_MAP).find(([, value]) => value === collection);
  return match ? match[0] : collection;
}

export default {
  CATEGORY_COLLECTION_MAP,
  resolveExplorerCollection,
  getExplorerCollections,
  inferExplorerCategoryFromCollection,
};
