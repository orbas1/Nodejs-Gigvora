import { useCallback, useMemo, useState } from 'react';
import useSession from './useSession.js';
import useCachedResource from './useCachedResource.js';
import {
  fetchTaxDocuments,
  acknowledgeTaxDocument,
  uploadTaxDocument,
  downloadTaxDocument,
  snoozeTaxReminder,
} from '../services/taxDocuments.js';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

const FALLBACK_PAYLOAD = {
  freelancerId: null,
  summary: {
    totalFilings: 0,
    submittedFilings: 0,
    outstandingFilings: 0,
    overdueFilings: 0,
    nextDeadline: null,
    updatedAt: null,
  },
  documents: [],
  estimates: [],
  reminders: [],
};

export default function useTaxDocuments({ freelancerId, lookbackYears = 3, enabled = true } = {}) {
  const { session } = useSession();
  const resolvedFreelancerId = freelancerId ?? session?.id ?? session?.userId ?? null;
  const cacheKey = useMemo(() => `tax-documents:${resolvedFreelancerId ?? 'guest'}`, [resolvedFreelancerId]);

  const [actionState, setActionState] = useState({ status: 'idle', error: null });

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!resolvedFreelancerId) {
        return FALLBACK_PAYLOAD;
      }
      const payload = await fetchTaxDocuments({ freelancerId: resolvedFreelancerId, lookbackYears }, { signal });
      return payload ?? FALLBACK_PAYLOAD;
    },
    [resolvedFreelancerId, lookbackYears],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: enabled !== false,
    dependencies: [cacheKey, lookbackYears],
    ttl: 1000 * 30,
  });

  const acknowledge = useCallback(
    async (filingId, payload = {}) => {
      setActionState({ status: 'pending', error: null });
      try {
        await acknowledgeTaxDocument(filingId, payload);
        await resource.refresh({ force: true });
        setActionState({ status: 'success', error: null });
      } catch (error) {
        setActionState({ status: 'error', error });
        throw error;
      }
    },
    [resource],
  );

  const upload = useCallback(
    async (filingId, { file, data, fileName, contentType, actorId } = {}) => {
      if (!file && (!data || !fileName || !contentType)) {
        throw new Error('File or explicit data payload is required to upload a tax document.');
      }
      setActionState({ status: 'pending', error: null });
      try {
        let payload = { data, fileName, contentType, actorId };
        if (file) {
          const base64 = await fileToBase64(file);
          payload = {
            data: base64,
            fileName: file.name,
            contentType: file.type || 'application/octet-stream',
            actorId,
          };
        }
        await uploadTaxDocument(filingId, payload);
        await resource.refresh({ force: true });
        setActionState({ status: 'success', error: null });
      } catch (error) {
        setActionState({ status: 'error', error });
        throw error;
      }
    },
    [resource],
  );

  const download = useCallback(async (filingId) => {
    return downloadTaxDocument(filingId);
  }, []);

  const snooze = useCallback(
    async (reminderId, payload = {}) => {
      await snoozeTaxReminder(reminderId, payload);
      await resource.refresh({ force: true });
    },
    [resource],
  );

  return {
    ...resource,
    data: resource.data ?? FALLBACK_PAYLOAD,
    acknowledge,
    upload,
    download,
    snooze,
    actionState,
  };
}
