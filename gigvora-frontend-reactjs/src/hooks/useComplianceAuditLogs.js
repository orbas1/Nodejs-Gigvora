import { useCallback, useMemo, useState } from 'react';
import useSession from './useSession.js';
import useCachedResource from './useCachedResource.js';
import { fetchComplianceAuditLogs } from '../services/complianceAuditLogs.js';

const FALLBACK = {
  workspace: null,
  summary: {
    total: 0,
    open: 0,
    closed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    latestEventAt: null,
  },
  filters: {
    statuses: [],
    severities: [],
  },
  events: [],
};

export default function useComplianceAuditLogs({ workspaceId, enabled = true } = {}) {
  const { session } = useSession();
  const resolvedWorkspaceId = workspaceId ?? session?.workspace?.id ?? session?.workspaceId ?? null;
  const cacheKey = useMemo(() => `compliance-audit-logs:${resolvedWorkspaceId ?? 'global'}`, [resolvedWorkspaceId]);

  const [filters, setFilters] = useState({ status: [], severity: [], search: '' });

  const fetcher = useCallback(
    async ({ signal } = {}) => {
      if (!resolvedWorkspaceId) {
        return FALLBACK;
      }
      const payload = await fetchComplianceAuditLogs(
        {
          workspaceId: resolvedWorkspaceId,
          status: filters.status,
          severity: filters.severity,
          search: filters.search || undefined,
        },
        { signal },
      );
      return payload ?? FALLBACK;
    },
    [resolvedWorkspaceId, filters.status, filters.severity, filters.search],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    enabled: enabled !== false,
    dependencies: [cacheKey, filters.status.join(':'), filters.severity.join(':'), filters.search],
    ttl: 1000 * 20,
  });

  const updateFilters = useCallback((partial) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      status: partial.status ?? prev.status,
      severity: partial.severity ?? prev.severity,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ status: [], severity: [], search: '' });
  }, []);

  return {
    ...resource,
    data: resource.data ?? FALLBACK,
    filters,
    setFilters: updateFilters,
    clearFilters,
  };
}
