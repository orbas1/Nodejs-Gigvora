import { useEffect } from 'react';
import { getProjectQueueStreamUrl } from '../services/autoAssign.js';

export default function useProjectQueueStream(
  projectId,
  { enabled = true, targetType, onQueue, onError } = {},
) {
  useEffect(() => {
    if (!enabled || !projectId) {
      return undefined;
    }
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      return undefined;
    }

    let isActive = true;
    let eventSource;

    try {
      const url = getProjectQueueStreamUrl(projectId, { targetType });
      eventSource = new EventSource(url, { withCredentials: true });
    } catch (error) {
      if (typeof onError === 'function') {
        onError(error);
      }
      return undefined;
    }

    const handleQueue = (event) => {
      if (!isActive || !event?.data) {
        return;
      }
      try {
        const payload = JSON.parse(event.data);
        if (typeof onQueue === 'function') {
          onQueue(payload);
        }
      } catch (error) {
        if (typeof onError === 'function') {
          onError(error);
        }
      }
    };

    const handleError = (event) => {
      if (typeof onError === 'function') {
        onError(event);
      }
    };

    eventSource.addEventListener('queue', handleQueue);
    eventSource.onmessage = handleQueue;
    eventSource.onerror = handleError;

    return () => {
      isActive = false;
      eventSource.close();
    };
  }, [projectId, enabled, targetType, onQueue, onError]);
}
