import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import { apiClient } from '../services/apiClient.js';
import {
  fetchAgencyProfileManagement,
  updateAgencyProfileBasics,
  createAgencyProfileMedia,
  updateAgencyProfileMedia,
  deleteAgencyProfileMedia,
  createAgencyProfileSkill,
  updateAgencyProfileSkill,
  deleteAgencyProfileSkill,
  createAgencyProfileCredential,
  updateAgencyProfileCredential,
  deleteAgencyProfileCredential,
  createAgencyProfileExperience,
  updateAgencyProfileExperience,
  deleteAgencyProfileExperience,
  createAgencyProfileWorkforceSegment,
  updateAgencyProfileWorkforceSegment,
  deleteAgencyProfileWorkforceSegment,
} from '../services/agency.js';

const CACHE_KEY = 'agency:profile:management';

export function useAgencyProfileManagement({ enabled = true } = {}) {
  const resource = useCachedResource(
    CACHE_KEY,
    ({ signal } = {}) => fetchAgencyProfileManagement({ signal }),
    { enabled, ttl: 1000 * 30 },
  );

  const refreshResource = resource.refresh;

  const runAndRefresh = useCallback(
    async (operation) => {
      const result = await operation();
      apiClient.removeCache(CACHE_KEY);
      await refreshResource({ force: true });
      return result;
    },
    [refreshResource],
  );

  const actions = useMemo(
    () => ({
      refresh: (options) => refreshResource(options),
      updateBasics: (payload) => runAndRefresh(() => updateAgencyProfileBasics(payload)),
      createMedia: (payload) => runAndRefresh(() => createAgencyProfileMedia(payload)),
      updateMedia: (mediaId, payload) => runAndRefresh(() => updateAgencyProfileMedia(mediaId, payload)),
      deleteMedia: (mediaId) => runAndRefresh(() => deleteAgencyProfileMedia(mediaId)),
      createSkill: (payload) => runAndRefresh(() => createAgencyProfileSkill(payload)),
      updateSkill: (skillId, payload) => runAndRefresh(() => updateAgencyProfileSkill(skillId, payload)),
      deleteSkill: (skillId) => runAndRefresh(() => deleteAgencyProfileSkill(skillId)),
      createCredential: (payload) => runAndRefresh(() => createAgencyProfileCredential(payload)),
      updateCredential: (credentialId, payload) =>
        runAndRefresh(() => updateAgencyProfileCredential(credentialId, payload)),
      deleteCredential: (credentialId) => runAndRefresh(() => deleteAgencyProfileCredential(credentialId)),
      createExperience: (payload) => runAndRefresh(() => createAgencyProfileExperience(payload)),
      updateExperience: (experienceId, payload) =>
        runAndRefresh(() => updateAgencyProfileExperience(experienceId, payload)),
      deleteExperience: (experienceId) => runAndRefresh(() => deleteAgencyProfileExperience(experienceId)),
      createWorkforceSegment: (payload) =>
        runAndRefresh(() => createAgencyProfileWorkforceSegment(payload)),
      updateWorkforceSegment: (segmentId, payload) =>
        runAndRefresh(() => updateAgencyProfileWorkforceSegment(segmentId, payload)),
      deleteWorkforceSegment: (segmentId) =>
        runAndRefresh(() => deleteAgencyProfileWorkforceSegment(segmentId)),
    }),
    [runAndRefresh, refreshResource],
  );

  return { ...resource, ...actions };
}

export default useAgencyProfileManagement;
