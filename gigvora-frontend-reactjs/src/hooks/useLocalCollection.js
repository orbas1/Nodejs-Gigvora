import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_PREFIX = 'gigvora:web:collection:';

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function normaliseItem(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const now = new Date().toISOString();
  const id = candidate.id ?? generateId();

  return {
    ...candidate,
    id,
    createdAt: candidate.createdAt ?? now,
    updatedAt: candidate.updatedAt ?? now,
  };
}

function readFromStorage(key) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed
      .map((item) => normaliseItem(item))
      .filter((item) => item !== null);
  } catch (error) {
    console.warn(`Failed to read local collection for ${key}`, error);
    return null;
  }
}

function writeToStorage(key, items) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.warn(`Failed to persist local collection for ${key}`, error);
  }
}

export default function useLocalCollection(key, { seed = [], autoPersist = true } = {}) {
  const storageKey = useMemo(() => `${STORAGE_PREFIX}${key}`, [key]);
  const seededRef = useRef(false);

  const [items, setItems] = useState(() => {
    const stored = readFromStorage(storageKey);
    if (stored && stored.length) {
      seededRef.current = true;
      return stored;
    }
    const seededItems = Array.isArray(seed) ? seed.map((item) => normaliseItem(item)).filter(Boolean) : [];
    if (seededItems.length) {
      seededRef.current = true;
      if (autoPersist) {
        writeToStorage(storageKey, seededItems);
      }
    }
    return seededItems;
  });

  useEffect(() => {
    if (!autoPersist) {
      return;
    }
    writeToStorage(storageKey, items);
  }, [autoPersist, items, storageKey]);

  const createItem = useCallback(
    (payload = {}) => {
      const item = normaliseItem({ ...payload, id: payload.id ?? generateId() });
      setItems((previous) => [...previous, item]);
      return item;
    },
    [],
  );

  const upsertMany = useCallback((entries = []) => {
    const normalised = entries.map((item) => normaliseItem(item)).filter(Boolean);
    if (!normalised.length) {
      return;
    }
    setItems((previous) => {
      const map = new Map(previous.map((item) => [item.id, item]));
      normalised.forEach((item) => {
        map.set(item.id, {
          ...map.get(item.id),
          ...item,
          id: item.id,
          createdAt: map.get(item.id)?.createdAt ?? item.createdAt,
          updatedAt: new Date().toISOString(),
        });
      });
      return Array.from(map.values());
    });
  }, []);

  const updateItem = useCallback((id, updater) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }
        const nextValue = typeof updater === 'function' ? updater(item) ?? item : { ...item, ...updater };
        const now = new Date().toISOString();
        return {
          ...item,
          ...nextValue,
          id: item.id,
          createdAt: item.createdAt ?? now,
          updatedAt: now,
        };
      }),
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const resetCollection = useCallback(() => {
    const seededItems = Array.isArray(seed) ? seed.map((item) => normaliseItem(item)).filter(Boolean) : [];
    seededRef.current = true;
    setItems(seededItems);
  }, [seed]);

  const clearCollection = useCallback(() => {
    seededRef.current = false;
    setItems([]);
  }, []);

  const hasSeedData = seededRef.current;

  return {
    items,
    createItem,
    updateItem,
    removeItem,
    upsertMany,
    resetCollection,
    clearCollection,
    hasSeedData,
  };
}
