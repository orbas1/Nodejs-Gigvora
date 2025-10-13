import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchProjectGigManagement,
  createProject,
  addProjectAsset,
  updateWorkspace,
  createGigOrder,
  updateGigOrder,
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
      await createProject(userId, payload);
      await load();
    },
    async addAsset(projectId, payload) {
      await addProjectAsset(userId, projectId, payload);
      await load();
    },
    async updateWorkspace(projectId, payload) {
      await updateWorkspace(userId, projectId, payload);
      await load();
    },
    async createGigOrder(payload) {
      await createGigOrder(userId, payload);
      await load();
    },
    async updateGigOrder(orderId, payload) {
      await updateGigOrder(userId, orderId, payload);
      await load();
    },
  }), [userId, load]);

  return { data, loading, error, actions, reload: load };
}
