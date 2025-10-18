import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchFreelancerProfileOverview,
  saveFreelancerProfileOverview,
  uploadFreelancerAvatar,
  createFreelancerConnection,
  updateFreelancerConnection,
  deleteFreelancerConnection,
} from '../services/freelancerProfileOverview.js';

export default function useFreelancerProfileOverview({ userId, enabled = true } = {}) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [connectionSaving, setConnectionSaving] = useState(false);
  const [error, setError] = useState(null);

  const canFetch = enabled && Boolean(userId);

  const refresh = useCallback(
    async ({ fresh = false } = {}) => {
      if (!canFetch) {
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFreelancerProfileOverview(userId, { fresh });
        setOverview(data);
        return data;
      } catch (err) {
        const normalised = err instanceof Error ? err : new Error('Unable to load profile overview.');
        setError(normalised);
        throw normalised;
      } finally {
        setLoading(false);
      }
    },
    [canFetch, userId],
  );

  useEffect(() => {
    if (!canFetch) {
      return;
    }
    refresh().catch(() => {});
  }, [canFetch, refresh]);

  const handleSaveProfile = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('Cannot save profile without a userId.');
      }
      setSaving(true);
      try {
        const data = await saveFreelancerProfileOverview(userId, payload);
        setOverview(data);
        return data;
      } finally {
        setSaving(false);
      }
    },
    [userId],
  );

  const handleAvatarUpload = useCallback(
    async (file) => {
      if (!userId) {
        throw new Error('Cannot upload avatar without a userId.');
      }
      setAvatarUploading(true);
      try {
        const data = await uploadFreelancerAvatar(userId, file);
        setOverview(data);
        return data;
      } finally {
        setAvatarUploading(false);
      }
    },
    [userId],
  );

  const handleCreateConnection = useCallback(
    async (payload) => {
      if (!userId) {
        throw new Error('Cannot create connection without a userId.');
      }
      setConnectionSaving(true);
      try {
        const data = await createFreelancerConnection(userId, payload);
        setOverview(data);
        return data;
      } finally {
        setConnectionSaving(false);
      }
    },
    [userId],
  );

  const handleUpdateConnection = useCallback(
    async (connectionId, payload) => {
      if (!userId || !connectionId) {
        throw new Error('A userId and connectionId are required to update connections.');
      }
      setConnectionSaving(true);
      try {
        const data = await updateFreelancerConnection(userId, connectionId, payload);
        setOverview(data);
        return data;
      } finally {
        setConnectionSaving(false);
      }
    },
    [userId],
  );

  const handleDeleteConnection = useCallback(
    async (connectionId) => {
      if (!userId || !connectionId) {
        throw new Error('A userId and connectionId are required to delete connections.');
      }
      setConnectionSaving(true);
      try {
        const data = await deleteFreelancerConnection(userId, connectionId);
        setOverview(data);
        return data;
      } finally {
        setConnectionSaving(false);
      }
    },
    [userId],
  );

  const state = useMemo(
    () => ({
      overview,
      loading,
      saving,
      avatarUploading,
      connectionSaving,
      error,
    }),
    [overview, loading, saving, avatarUploading, connectionSaving, error],
  );

  return {
    ...state,
    refresh,
    saveProfile: handleSaveProfile,
    uploadAvatar: handleAvatarUpload,
    createConnection: handleCreateConnection,
    updateConnection: handleUpdateConnection,
    deleteConnection: handleDeleteConnection,
  };
}
