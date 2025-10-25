import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'gigvora:web:gigs:saved';

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
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read saved gigs from storage', error);
    return [];
  }
}

function writeSavedGigs(entries) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('Failed to persist saved gigs', error);
  }
}

function sanitizeString(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function extractTaxonomyLabels(gig) {
  if (Array.isArray(gig?.taxonomyLabels) && gig.taxonomyLabels.length) {
    return gig.taxonomyLabels.filter((entry) => typeof entry === 'string' && entry.trim().length);
  }
  if (Array.isArray(gig?.taxonomies)) {
    return gig.taxonomies
      .map((taxonomy) => taxonomy?.label)
      .filter((entry) => typeof entry === 'string' && entry.trim().length);
  }
  return [];
}

function normaliseGig(gig) {
  if (!gig || gig.id == null) {
    return null;
  }
  const savedAt = new Date().toISOString();
  return {
    id: gig.id,
    title: sanitizeString(gig.title, 'Untitled gig'),
    description: sanitizeString(gig.description ?? gig.summary ?? ''),
    budget: sanitizeString(gig.budget ?? ''),
    duration: sanitizeString(gig.duration ?? ''),
    taxonomies: extractTaxonomyLabels(gig),
    savedAt,
  };
}

export default function useSavedGigs() {
  const [items, setItems] = useState(() => readSavedGigs());

  useEffect(() => {
    writeSavedGigs(items);
  }, [items]);

  const isSaved = useCallback((gigId) => {
    if (gigId == null) {
      return false;
    }
    return items.some((entry) => `${entry.id}` === `${gigId}`);
  }, [items]);

  const saveGig = useCallback((gig) => {
    const entry = normaliseGig(gig);
    if (!entry) {
      return null;
    }
    setItems((previous) => {
      if (previous.some((item) => `${item.id}` === `${entry.id}`)) {
        return previous;
      }
      return [...previous, entry];
    });
    return entry;
  }, []);

  const removeGig = useCallback((gigId) => {
    if (gigId == null) {
      return;
    }
    setItems((previous) => previous.filter((item) => `${item.id}` !== `${gigId}`));
  }, []);

  const toggleGig = useCallback((gig) => {
    if (!gig || gig.id == null) {
      return false;
    }
    let nextSaved = false;
    setItems((previous) => {
      const exists = previous.some((item) => `${item.id}` === `${gig.id}`);
      if (exists) {
        nextSaved = false;
        return previous.filter((item) => `${item.id}` !== `${gig.id}`);
      }
      const entry = normaliseGig(gig);
      if (!entry) {
        nextSaved = false;
        return previous;
      }
      nextSaved = true;
      return [...previous, entry];
    });
    return nextSaved;
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (!a.savedAt || !b.savedAt) {
        return 0;
      }
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });
  }, [items]);

  return {
    items: sortedItems,
    saveGig,
    removeGig,
    toggleGig,
    clear,
    isSaved,
  };
}
