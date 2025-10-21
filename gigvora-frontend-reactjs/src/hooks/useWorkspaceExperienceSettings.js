import { useCallback, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchWorkspaceExperienceSettings,
  updateWorkspaceExperienceSettings,
  toggleWorkspaceFeature,
} from '../services/workspaceExperience.js';

const FALLBACK_SETTINGS = Object.freeze({
  features: [
    {
      id: 'feature-collaboration-suite',
      label: 'Collaboration suite',
      description: 'Shared docs, project chat, and canvas tools inside the workspace.',
      enabled: true,
    },
    {
      id: 'feature-advanced-analytics',
      label: 'Advanced analytics',
      description: 'Real-time dashboards for revenue, retention, and delivery health.',
      enabled: true,
    },
    {
      id: 'feature-community-updates',
      label: 'Community updates',
      description: 'Surface partner briefs and referrals to trusted collaborators.',
      enabled: false,
    },
  ],
  safety: {
    requireTwoFactor: true,
    maskSensitiveData: true,
    auditLogsEnabled: true,
  },
  personalization: {
    theme: 'gigvora-light',
    notificationDigest: 'daily',
  },
});

export default function useWorkspaceExperienceSettings({ workspaceId, enabled = true } = {}) {
  const [saving, setSaving] = useState(false);
  const [updatingFeatureId, setUpdatingFeatureId] = useState(null);

  const safeId = workspaceId ?? 'demo-workspace';

  const fetcher = useCallback(
    ({ signal, force } = {}) => {
      if (!workspaceId || !enabled) {
        return Promise.resolve(FALLBACK_SETTINGS);
      }
      return fetchWorkspaceExperienceSettings(workspaceId, { signal, fresh: Boolean(force) });
    },
    [enabled, workspaceId],
  );

  const resource = useCachedResource(`workspace:experience-settings:${safeId}`, fetcher, {
    enabled,
    dependencies: [safeId],
    ttl: 1000 * 60,
  });

  const settings = resource.data ?? FALLBACK_SETTINGS;

  const refresh = useCallback((options) => resource.refresh(options), [resource]);

  const updateSettings = useCallback(
    async (payload) => {
      if (!workspaceId) {
        return { fallback: true };
      }
      setSaving(true);
      try {
        const result = await updateWorkspaceExperienceSettings(workspaceId, payload);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setSaving(false);
      }
    },
    [refresh, workspaceId],
  );

  const toggleFeature = useCallback(
    async (featureId, enabledState) => {
      if (!workspaceId) {
        return { fallback: true };
      }
      setUpdatingFeatureId(featureId);
      try {
        const result = await toggleWorkspaceFeature(workspaceId, featureId, enabledState);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setUpdatingFeatureId(null);
      }
    },
    [refresh, workspaceId],
  );

  return useMemo(
    () => ({
      ...resource,
      settings,
      features: settings.features ?? [],
      safety: settings.safety ?? FALLBACK_SETTINGS.safety,
      personalization: settings.personalization ?? FALLBACK_SETTINGS.personalization,
      updateSettings,
      toggleFeature,
      saving,
      updatingFeatureId,
      refresh,
    }),
    [
      resource,
      settings,
      updateSettings,
      toggleFeature,
      saving,
      updatingFeatureId,
      refresh,
    ],
  );
}
