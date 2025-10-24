import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'gigvora:web:mentors:saved';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable for saved mentors.', error);
    return null;
  }
}

function readSavedMentors() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read saved mentors from storage', error);
    return [];
  }
}

function writeSavedMentors(list) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('Failed to persist saved mentors', error);
  }
}

function normaliseMentor(mentor) {
  if (!mentor || mentor.id == null) {
    return null;
  }

  const expertise = Array.isArray(mentor.expertise) ? mentor.expertise : [];
  return {
    id: mentor.id,
    name: mentor.name ?? 'Mentor',
    headline: mentor.headline ?? '',
    expertise,
    region: mentor.region ?? '',
    avatarUrl: mentor.avatarUrl ?? mentor.photoUrl ?? mentor.imageUrl ?? null,
    savedAt: new Date().toISOString(),
  };
}

export default function useSavedMentors() {
  const [items, setItems] = useState(() => readSavedMentors());

  useEffect(() => {
    writeSavedMentors(items);
  }, [items]);

  const isSaved = useCallback((mentorId) => {
    if (mentorId == null) {
      return false;
    }
    return items.some((item) => `${item.id}` === `${mentorId}`);
  }, [items]);

  const saveMentor = useCallback((mentor) => {
    const entry = normaliseMentor(mentor);
    if (!entry) {
      return null;
    }
    let nextEntry = entry;
    setItems((previous) => {
      if (previous.some((item) => `${item.id}` === `${entry.id}`)) {
        nextEntry = previous.find((item) => `${item.id}` === `${entry.id}`) ?? entry;
        return previous;
      }
      return [...previous, entry];
    });
    return nextEntry;
  }, []);

  const removeMentor = useCallback((mentorId) => {
    if (mentorId == null) {
      return;
    }
    setItems((previous) => previous.filter((item) => `${item.id}` !== `${mentorId}`));
  }, []);

  const toggleMentor = useCallback((mentor) => {
    if (!mentor || mentor.id == null) {
      return false;
    }
    let saved = false;
    setItems((previous) => {
      const exists = previous.some((item) => `${item.id}` === `${mentor.id}`);
      if (exists) {
        saved = false;
        return previous.filter((item) => `${item.id}` !== `${mentor.id}`);
      }
      saved = true;
      const entry = normaliseMentor(mentor);
      return entry ? [...previous, entry] : previous;
    });
    return saved;
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (!a.savedAt || !b.savedAt) {
          return 0;
        }
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      }),
    [items],
  );

  return {
    items: sortedItems,
    saveMentor,
    removeMentor,
    toggleMentor,
    clear,
    isSaved,
  };
}
