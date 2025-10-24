import { useEffect, useRef } from 'react';

export default function useAutoSave(value, { enabled = false, delay = 1200, onSave, isDirty } = {}) {
  const latestValueRef = useRef(value);
  const timerRef = useRef(null);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!enabled || typeof onSave !== 'function') {
      return undefined;
    }
    if (isDirty && !isDirty()) {
      return undefined;
    }

    timerRef.current = setTimeout(() => {
      try {
        const result = onSave(latestValueRef.current);
        if (result && typeof result.then === 'function') {
          result.catch(() => {});
        }
      } catch (error) {
        // Autosave should never throw synchronously.
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, delay, onSave, isDirty, value]);
}
