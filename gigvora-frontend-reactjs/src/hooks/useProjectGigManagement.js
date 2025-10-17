import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProjectGigManagement,
  createProject,
  addProjectAsset,
  updateWorkspace,
  createGigOrder,
  updateGigOrder,
  createGigTimelineEvent,
  updateGigTimelineEvent,
  createGigSubmission,
  updateGigSubmission,
  postGigChatMessage,
} from '../services/projectGigManagement.js';

export default function useProjectGigManagement(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchProjectGigManagement(userId);
      setData(snapshot);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      load();
    }
  }, [userId, load]);

  const actions = useMemo(() => ({
    async createProject(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to create project workspaces.');
      }
      await createProject(userId, payload);
      await load();
    },
    async addAsset(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project workspace.');
      }
      await addProjectAsset(userId, projectId, payload);
      await load();
    },
    async updateWorkspace(projectId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update this project workspace.');
      }
      await updateWorkspace(userId, projectId, payload);
      await load();
    },
    async createGigOrder(payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig orders.');
      }
      await createGigOrder(userId, payload);
      await load();
    },
    async updateGigOrder(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig orders.');
      }
      await updateGigOrder(userId, orderId, payload);
      await load();
    },
    async createGigTimelineEvent(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig timelines.');
      }
      await createGigTimelineEvent(userId, orderId, payload);
      await load();
    },
    async updateGigTimelineEvent(orderId, eventId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to manage gig timelines.');
      }
      await updateGigTimelineEvent(userId, orderId, eventId, payload);
      await load();
    },
    async createGigSubmission(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to log gig submissions.');
      }
      await createGigSubmission(userId, orderId, payload);
      await load();
    },
    async updateGigSubmission(orderId, submissionId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to update gig submissions.');
      }
      await updateGigSubmission(userId, orderId, submissionId, payload);
      await load();
    },
    async postGigChatMessage(orderId, payload) {
      if (data?.access?.canManage === false) {
        throw new Error('You do not have permission to post in-gig chat messages.');
      }
      await postGigChatMessage(userId, orderId, payload);
      await load();
    },
  }), [data?.access?.canManage, userId, load]);

  return { data, loading, error, actions, reload: load };
}
