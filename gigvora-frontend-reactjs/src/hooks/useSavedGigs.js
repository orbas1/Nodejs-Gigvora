import { useCallback, useMemo, useState } from 'react';
import { resolveTaxonomyLabels } from '../utils/taxonomy.js';

const LOCAL_STORAGE_KEY = 'gigvora:web:gigs:saved';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable for saved gigs.', error);
    return null;
  }
}

function readSavedGigs() {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse saved gigs from local storage.', error);
    return [];
  }
}

function writeSavedGigs(items) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to persist saved gigs to local storage.', error);
  }
}

function resolveGigId(gig) {
  if (!gig) {
    return null;
  }
  return gig.id ?? gig.slug ?? gig.handle ?? null;
}

function normaliseGigForStorage(gig) {
  const id = resolveGigId(gig);
  if (!id) {
    return null;
  }
  const taxonomyLabels = resolveTaxonomyLabels(gig);
  return {
    id,
    title: typeof gig.title === 'string' && gig.title.trim().length ? gig.title.trim() : 'Untitled gig',
    budget: typeof gig.budget === 'string' && gig.budget.trim().length ? gig.budget.trim() : gig.budget ?? null,
    deliverySpeed:
      gig.deliverySpeed ??
      gig.deliveryTimeline ??
      gig.delivery ??
      gig.turnaround ??
      gig.timeline ??
      null,
    client:
      (gig.client && (gig.client.name ?? gig.client.title)) ??
      gig.clientName ??
      gig.agencyName ??
      null,
    taxonomyLabels,
    savedAt: new Date().toISOString(),
  };
}

export default function useSavedGigs() {
  const [items, setItems] = useState(() => readSavedGigs());

  const ids = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  const saveGig = useCallback((gig) => {
    const entry = normaliseGigForStorage(gig);
    if (!entry) {
      return null;
    }
    if (ids.has(entry.id)) {
      return entry;
    }
    const next = [...items, entry];
    setItems(next);
    writeSavedGigs(next);
    return entry;
  }, [items, ids]);

  const removeGig = useCallback((gigOrId) => {
    const id = typeof gigOrId === 'string' || typeof gigOrId === 'number'
      ? gigOrId
      : resolveGigId(gigOrId);
    if (!id) {
      return;
    }
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    writeSavedGigs(next);
  }, [items]);

  const toggleGig = useCallback((gig) => {
    const id = resolveGigId(gig);
    if (!id) {
      return { saved: false };
    }
    if (ids.has(id)) {
      removeGig(id);
      return { saved: false };
    }
    const entry = saveGig(gig);
    return { saved: Boolean(entry) };
  }, [ids, removeGig, saveGig]);

  const isGigSaved = useCallback((gig) => {
    const id = resolveGigId(gig);
    if (!id) {
      return false;
    }
    return ids.has(id);
  }, [ids]);

  return {
    items,
    saveGig,
    removeGig,
    toggleGig,
    isGigSaved,
  };
}
