import { useCallback, useMemo } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchCompanyPages,
  fetchCompanyPage,
  createCompanyPage,
  updateCompanyPage,
  replaceCompanyPageSections,
  replaceCompanyPageCollaborators,
  publishCompanyPage,
  archiveCompanyPage,
  deleteCompanyPage,
} from '../services/company.js';

function buildCacheKey(workspaceId, filters) {
  const parts = [workspaceId ?? 'none'];
  if (filters.status) parts.push(`status:${filters.status}`);
  if (filters.visibility) parts.push(`visibility:${filters.visibility}`);
  if (filters.search) parts.push(`q:${filters.search}`);
  return `company:pages:${parts.join(':')}`;
}

export function useCompanyPagesManagement({ workspaceId, filters = {}, enabled = true } = {}) {
  const normalizedFilters = useMemo(
    () => ({
      status: filters.status ?? undefined,
      visibility: filters.visibility ?? undefined,
      search: filters.search ?? undefined,
      limit: filters.limit ?? undefined,
      offset: filters.offset ?? undefined,
    }),
    [filters.limit, filters.offset, filters.search, filters.status, filters.visibility],
  );

  const cacheKey = useMemo(() => buildCacheKey(workspaceId, normalizedFilters), [workspaceId, normalizedFilters]);

  const fetcher = useCallback(
    ({ signal } = {}) => {
      if (!workspaceId) {
        return Promise.resolve(null);
      }
      return fetchCompanyPages({ workspaceId, ...normalizedFilters, signal });
    },
    [workspaceId, normalizedFilters],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: enabled && Boolean(workspaceId),
    dependencies: [workspaceId, normalizedFilters.status, normalizedFilters.visibility, normalizedFilters.search],
    ttl: 1000 * 30,
  });

  const { refresh } = resource;

  const create = useCallback(
    async (payload) => {
      if (!workspaceId) throw new Error('workspaceId is required to create a page.');
      const result = await createCompanyPage({ workspaceId, ...payload });
      await refresh({ force: true });
      return result;
    },
    [refresh, workspaceId],
  );

  const update = useCallback(
    async (pageId, payload) => {
      if (!workspaceId) throw new Error('workspaceId is required to update a page.');
      const result = await updateCompanyPage(pageId, { workspaceId, ...payload });
      await refresh({ force: true });
      return result;
    },
    [refresh, workspaceId],
  );

  const updateSections = useCallback(
    async (pageId, sections) => {
      if (!workspaceId) throw new Error('workspaceId is required to update sections.');
      const result = await replaceCompanyPageSections(pageId, { workspaceId, sections });
      await refresh({ force: true });
      return result;
    },
    [refresh, workspaceId],
  );

  const updateCollaborators = useCallback(
    async (pageId, collaborators) => {
      if (!workspaceId) throw new Error('workspaceId is required to update collaborators.');
      const result = await replaceCompanyPageCollaborators(pageId, { workspaceId, collaborators });
      await refresh({ force: true });
      return result;
    },
    [refresh, workspaceId],
  );

  const publish = useCallback(
    async (pageId) => {
      if (!workspaceId) throw new Error('workspaceId is required to publish a page.');
      const result = await publishCompanyPage(pageId, { workspaceId });
      await refresh({ force: true });
      return result;
    },
    [refresh, workspaceId],
  );

  const archive = useCallback(
    async (pageId) => {
      if (!workspaceId) throw new Error('workspaceId is required to archive a page.');
      await archiveCompanyPage(pageId, { workspaceId });
      await refresh({ force: true });
    },
    [refresh, workspaceId],
  );

  const remove = useCallback(
    async (pageId) => {
      if (!workspaceId) throw new Error('workspaceId is required to delete a page.');
      await deleteCompanyPage(pageId, { workspaceId });
      await refresh({ force: true });
    },
    [refresh, workspaceId],
  );

  const loadPage = useCallback(
    async (pageId, { signal } = {}) => {
      if (!workspaceId) throw new Error('workspaceId is required to load a page.');
      const response = await fetchCompanyPage({ workspaceId, pageId, signal });
      return response?.page ?? null;
    },
    [workspaceId],
  );

  const data = resource.data ?? {};

  return {
    ...resource,
    data,
    pages: data.pages ?? [],
    stats: data.stats ?? {},
    governance: data.governance ?? {},
    blueprints: data.blueprints ?? [],
    sectionLibrary: data.sectionLibrary ?? [],
    collaboratorRoles: data.collaboratorRoles ?? [],
    visibilityOptions: data.visibilityOptions ?? [],
    statusOptions: data.statusOptions ?? [],
    createPage: create,
    updatePage: update,
    updateSections,
    updateCollaborators,
    publishPage: publish,
    archivePage: archive,
    deletePage: remove,
    loadPage,
  };
}

export default useCompanyPagesManagement;
