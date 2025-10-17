import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAgencyClientKanban,
  createKanbanColumn,
  updateKanbanColumn,
  deleteKanbanColumn,
  createKanbanCard,
  updateKanbanCard,
  moveKanbanCard,
  deleteKanbanCard,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  createClientAccount,
  updateClientAccount,
} from '../services/agencyClientKanban.js';

export default function useAgencyClientKanban({ workspaceId, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchAgencyClientKanban({ workspaceId });
      setData(snapshot);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const actions = useMemo(
    () => ({
      async refresh() {
        await load();
      },
      async createColumn(payload) {
        const column = await createKanbanColumn(payload, { workspaceId });
        await load();
        return column;
      },
      async updateColumn(columnId, payload) {
        const column = await updateKanbanColumn(columnId, payload, { workspaceId });
        await load();
        return column;
      },
      async deleteColumn(columnId) {
        await deleteKanbanColumn(columnId, { workspaceId });
        await load();
      },
      async createCard(payload) {
        const card = await createKanbanCard(payload, { workspaceId });
        await load();
        return card;
      },
      async updateCard(cardId, payload) {
        const card = await updateKanbanCard(cardId, payload, { workspaceId });
        await load();
        return card;
      },
      async moveCard(cardId, payload) {
        const card = await moveKanbanCard(cardId, payload, { workspaceId });
        await load();
        return card;
      },
      async deleteCard(cardId) {
        await deleteKanbanCard(cardId, { workspaceId });
        await load();
      },
      async addChecklistItem(cardId, payload) {
        const item = await createChecklistItem(cardId, payload, { workspaceId });
        await load();
        return item;
      },
      async updateChecklistItem(cardId, itemId, payload) {
        const item = await updateChecklistItem(cardId, itemId, payload, { workspaceId });
        await load();
        return item;
      },
      async deleteChecklistItem(cardId, itemId) {
        await deleteChecklistItem(cardId, itemId, { workspaceId });
        await load();
      },
      async createClient(payload) {
        const client = await createClientAccount(payload, { workspaceId });
        await load();
        return client;
      },
      async updateClient(clientId, payload) {
        const client = await updateClientAccount(clientId, payload, { workspaceId });
        await load();
        return client;
      },
    }),
    [workspaceId, load],
  );

  return { data, loading, error, actions, refresh: load };
}

