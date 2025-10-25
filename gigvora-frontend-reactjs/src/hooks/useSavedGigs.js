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

function writeSavedGigs(items) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Failed to persist saved gigs', error);
  }
}

function normaliseGig(gig) {
  if (!gig || gig.id == null) {
    return null;
  }

  const taxonomyLabels = Array.isArray(gig.taxonomyLabels) ? gig.taxonomyLabels : [];
  const taxonomySlugs = Array.isArray(gig.taxonomySlugs) ? gig.taxonomySlugs : [];
  const skills = Array.isArray(gig.skills) ? gig.skills : [];

  return {
    id: gig.id,
    title: gig.title ?? 'Gig',
    budget: gig.budget ?? null,
    duration: gig.duration ?? null,
    taxonomyLabels,
    taxonomySlugs,
    skills,
    clientName: gig.poster?.name ?? gig.clientName ?? null,
    savedAt: new Date().toISOString(),
  };
}

export default function useSavedGigs() {
  const [items, setItems] = useState(() => readSavedGigs());

  useEffect(() => {
    writeSavedGigs(items);
  }, [items]);

  const isSaved = useCallback(
    (gigId) => {
      if (gigId == null) {
        return false;
      }
      return items.some((item) => `${item.id}` === `${gigId}`);
    },
    [items],
  );

  const saveGig = useCallback((gig) => {
    const entry = normaliseGig(gig);
    if (!entry) {
      return null;
    }
    let savedEntry = entry;
    setItems((previous) => {
      const exists = previous.some((item) => `${item.id}` === `${entry.id}`);
      if (exists) {
        savedEntry = previous.find((item) => `${item.id}` === `${entry.id}`) ?? entry;
        return previous;
      }
      return [...previous, entry];
    });
    return savedEntry;
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
    let saved = false;
    setItems((previous) => {
      const exists = previous.some((item) => `${item.id}` === `${gig.id}`);
      if (exists) {
        saved = false;
        return previous.filter((item) => `${item.id}` !== `${gig.id}`);
      }
      saved = true;
      const entry = normaliseGig(gig);
      return entry ? [...previous, entry] : previous;
    });
    return saved;
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
