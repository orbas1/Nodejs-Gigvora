import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCreationStudioOverview,
  fetchCreationStudioItems,
  fetchCreationStudioItem,
  createCreationStudioItem,
  updateCreationStudioItem,
  publishCreationStudioItem,
  shareCreationStudioItem,
  deleteCreationStudioItem,
} from '../services/agencyCreationStudio.js';

const DEFAULT_STATE = {
  data: null,
  items: [],
  loading: false,
  error: null,
};

export default function useAgencyCreationStudio({
  agencyProfileId,
  page = 1,
  pageSize = 12,
  targetType,
  status,
  search,
  enabled = true,
} = {}) {
  const [state, setState] = useState(() => ({
    ...DEFAULT_STATE,
    loading: Boolean(enabled),
  }));

  const load = useCallback(
    async (overrides = {}) => {
      if (!enabled) {
        setState((current) => ({ ...current, loading: false }));
        return;
      }

      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const params = {
          agencyProfileId,
          page,
          pageSize,
          targetType,
          status,
          search,
          ...overrides,
        };

        const [overviewResponse, itemsResponse] = await Promise.all([
          fetchCreationStudioOverview(params),
          fetchCreationStudioItems(params),
        ]);

        setState({
          data: overviewResponse?.data ?? overviewResponse ?? null,
          items: itemsResponse?.data?.items ?? itemsResponse?.items ?? itemsResponse ?? [],
          loading: false,
          error: null,
        });
      } catch (error) {
        setState((current) => ({ ...current, loading: false, error }));
      }
    },
    [agencyProfileId, enabled, page, pageSize, search, status, targetType],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    load();
  }, [enabled, load]);

  const actions = useMemo(
    () => ({
      async refresh(options = {}) {
        await load(options);
      },
      async get(itemId) {
        return fetchCreationStudioItem(itemId);
      },
      async create(payload) {
        const response = await createCreationStudioItem(payload);
        await load();
        return response;
      },
      async update(itemId, payload) {
        const response = await updateCreationStudioItem(itemId, payload);
        await load();
        return response;
      },
      async publish(itemId, payload) {
        const response = await publishCreationStudioItem(itemId, payload);
        await load();
        return response;
      },
      async share(itemId, payload) {
        const response = await shareCreationStudioItem(itemId, payload);
        await load();
        return response;
      },
      async remove(itemId) {
        await deleteCreationStudioItem(itemId);
        await load();
      },
    }),
    [load],
  );

  return {
    data: state.data,
    items: state.items,
    loading: state.loading,
    error: state.error,
    reload: load,
    actions,
  };
}

