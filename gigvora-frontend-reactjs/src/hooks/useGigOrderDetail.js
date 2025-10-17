import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchGigOrderDetail,
  createGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission as updateGigSubmissionRequest,
  postGigChatMessage,
  acknowledgeGigChatMessage,
} from '../services/projectGigManagement.js';

export default function useGigOrderDetail(userId, orderId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !orderId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchGigOrderDetail(userId, orderId);
      setData(response?.order ?? null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load gig order detail.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useMemo(
    () => ({
      async addTimelineEvent(payload) {
        if (!userId || !orderId) {
          throw new Error('Select a gig order before adding timeline events.');
        }
        setPendingAction(true);
        try {
          const response = await createGigTimelineEvent(userId, orderId, payload);
          setData(response?.order ?? null);
          return response?.event ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async createSubmission(payload) {
        if (!userId || !orderId) {
          throw new Error('Select a gig order before recording submissions.');
        }
        setPendingAction(true);
        try {
          const response = await createGigSubmission(userId, orderId, payload);
          setData(response?.order ?? null);
          return response?.submission ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async updateSubmission(submissionId, payload) {
        if (!userId || !orderId) {
          throw new Error('Select a gig order before updating submissions.');
        }
        setPendingAction(true);
        try {
          const response = await updateGigSubmissionRequest(userId, orderId, submissionId, payload);
          setData(response?.order ?? null);
          return response?.submission ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async sendMessage(payload) {
        if (!userId || !orderId) {
          throw new Error('Select a gig order before starting chat.');
        }
        setPendingAction(true);
        try {
          const response = await postGigChatMessage(userId, orderId, payload);
          setData(response?.order ?? null);
          return response?.message ?? null;
        } finally {
          setPendingAction(false);
        }
      },
      async acknowledgeMessage(messageId) {
        if (!userId || !orderId) {
          throw new Error('Select a gig order before acknowledging messages.');
        }
        setPendingAction(true);
        try {
          const response = await acknowledgeGigChatMessage(userId, orderId, messageId);
          setData(response?.order ?? null);
          return response?.message ?? null;
        } finally {
          setPendingAction(false);
        }
      },
    }),
    [userId, orderId],
  );

  return { data, loading, error, actions, refresh: load, pendingAction };
}
