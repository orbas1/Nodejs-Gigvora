import { useCallback, useEffect, useRef } from 'react';

export default function useAdminAutoRefresh(callback, { interval = 60000, enabled = true, immediate = false } = {}) {
  const savedCallback = useRef(() => {});

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (immediate) {
      savedCallback.current?.();
    }

    if (!interval || interval <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      savedCallback.current?.();
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, immediate, interval]);

  return useCallback(() => {
    savedCallback.current?.();
  }, []);
}
