import { useCallback, useMemo, useState } from 'react';
import useCachedResource from './useCachedResource.js';
import {
  fetchProjectBlueprints,
  createProjectBlueprint,
  duplicateProjectBlueprint,
  archiveProjectBlueprint,
} from '../services/projectBlueprints.js';

const FALLBACK_RESPONSE = Object.freeze({
  blueprints: [
    {
      id: 'bp-enterprise-handoff',
      name: 'Enterprise discovery & handoff',
      industry: 'Financial services',
      stage: 'in-progress',
      owner: 'Amelia Perez',
      updatedAt: new Date().toISOString(),
      health: 'on-track',
      timelineWeeks: 6,
      budget: '$120k',
    },
    {
      id: 'bp-cx-refresh',
      name: 'Customer experience refresh',
      industry: 'Healthcare',
      stage: 'draft',
      owner: 'Amelia Perez',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      health: 'at-risk',
      timelineWeeks: 8,
      budget: '$95k',
    },
    {
      id: 'bp-network-launch',
      name: 'Network launch playbook',
      industry: 'Marketplace',
      stage: 'in-review',
      owner: 'Ops guild',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      health: 'requires-attention',
      timelineWeeks: 4,
      budget: '$45k',
    },
  ],
  metrics: {
    total: 6,
    drafts: 2,
    live: 3,
    archived: 1,
    automationReady: 4,
  },
  templates: [
    { id: 'template-product', name: 'Product ops accelerator', durationWeeks: 6 },
    { id: 'template-service', name: 'Service design lab', durationWeeks: 4 },
    { id: 'template-compliance', name: 'Compliance remediation', durationWeeks: 3 },
  ],
});

const DEFAULT_FILTERS = Object.freeze({
  stage: 'all',
  industry: 'all',
  query: '',
});

export default function useProjectBlueprints({ freelancerId, enabled = true, initialFilters = {} } = {}) {
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initialFilters });
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  const safeId = freelancerId ?? 'demo-project-lab';

  const fetcher = useCallback(
    ({ signal, force } = {}) => {
      if (!freelancerId || !enabled) {
        return Promise.resolve(FALLBACK_RESPONSE);
      }
      const params = {
        stage: filters.stage,
        industry: filters.industry,
        query: filters.query,
      };
      return fetchProjectBlueprints(freelancerId, params, { signal, fresh: Boolean(force) });
    },
    [enabled, filters, freelancerId],
  );

  const resource = useCachedResource(`freelancer:project-lab:${safeId}:${JSON.stringify(filters)}`, fetcher, {
    enabled,
    dependencies: [safeId, filters.stage, filters.industry, filters.query],
    ttl: 1000 * 30,
  });

  const data = resource.data ?? FALLBACK_RESPONSE;
  const blueprints = useMemo(
    () => data.blueprints ?? [],
    [data.blueprints],
  );
  const metrics = data.metrics ?? FALLBACK_RESPONSE.metrics;
  const templates = data.templates ?? FALLBACK_RESPONSE.templates;

  const refresh = useCallback((options) => resource.refresh(options), [resource]);

  const setFilterValue = useCallback((patch) => {
    setFilters((previous) => ({ ...previous, ...patch }));
  }, []);

  const handleCreate = useCallback(
    async (payload) => {
      if (!freelancerId) {
        return { fallback: true };
      }
      setCreating(true);
      try {
        const result = await createProjectBlueprint(freelancerId, payload);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setCreating(false);
      }
    },
    [freelancerId, refresh],
  );

  const handleDuplicate = useCallback(
    async (blueprintId, payload) => {
      if (!freelancerId) {
        return { fallback: true };
      }
      setDuplicatingId(blueprintId);
      try {
        const result = await duplicateProjectBlueprint(freelancerId, blueprintId, payload);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setDuplicatingId(null);
      }
    },
    [freelancerId, refresh],
  );

  const handleArchive = useCallback(
    async (blueprintId) => {
      if (!freelancerId) {
        return { fallback: true };
      }
      setArchivingId(blueprintId);
      try {
        const result = await archiveProjectBlueprint(freelancerId, blueprintId);
        await refresh({ force: true });
        return { fallback: false, result };
      } finally {
        setArchivingId(null);
      }
    },
    [freelancerId, refresh],
  );

  return useMemo(
    () => ({
      ...resource,
      filters,
      setFilters: setFilterValue,
      blueprints,
      metrics,
      templates,
      refresh,
      createBlueprint: handleCreate,
      duplicateBlueprint: handleDuplicate,
      archiveBlueprint: handleArchive,
      creating,
      duplicatingId,
      archivingId,
    }),
    [
      archivingId,
      blueprints,
      creating,
      duplicatingId,
      filters,
      handleArchive,
      handleCreate,
      handleDuplicate,
      metrics,
      refresh,
      resource,
      setFilterValue,
      templates,
    ],
  );
}
