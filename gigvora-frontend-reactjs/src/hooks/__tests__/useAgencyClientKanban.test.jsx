import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAgencyClientKanban from '../useAgencyClientKanban.js';

const fetchAgencyClientKanban = vi.fn();
const createKanbanColumn = vi.fn();
const updateKanbanColumn = vi.fn();
const deleteKanbanColumn = vi.fn();
const createKanbanCard = vi.fn();
const updateKanbanCard = vi.fn();
const moveKanbanCard = vi.fn();
const deleteKanbanCard = vi.fn();
const createChecklistItem = vi.fn();
const updateChecklistItem = vi.fn();
const deleteChecklistItem = vi.fn();
const createClientAccount = vi.fn();
const updateClientAccount = vi.fn();

vi.mock('../../services/agencyClientKanban.js', () => ({
  fetchAgencyClientKanban: (...args) => fetchAgencyClientKanban(...args),
  createKanbanColumn: (...args) => createKanbanColumn(...args),
  updateKanbanColumn: (...args) => updateKanbanColumn(...args),
  deleteKanbanColumn: (...args) => deleteKanbanColumn(...args),
  createKanbanCard: (...args) => createKanbanCard(...args),
  updateKanbanCard: (...args) => updateKanbanCard(...args),
  moveKanbanCard: (...args) => moveKanbanCard(...args),
  deleteKanbanCard: (...args) => deleteKanbanCard(...args),
  createChecklistItem: (...args) => createChecklistItem(...args),
  updateChecklistItem: (...args) => updateChecklistItem(...args),
  deleteChecklistItem: (...args) => deleteChecklistItem(...args),
  createClientAccount: (...args) => createClientAccount(...args),
  updateClientAccount: (...args) => updateClientAccount(...args),
}));

describe('useAgencyClientKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAgencyClientKanban.mockResolvedValue({ columns: [] });
    createKanbanColumn.mockResolvedValue({ id: 'col-1' });
  });

  it('loads workspace data and can create columns', async () => {
    const { result } = renderHook(() => useAgencyClientKanban({ workspaceId: 'ws-1' }));

    await waitFor(() => expect(fetchAgencyClientKanban).toHaveBeenCalledWith({ workspaceId: 'ws-1' }));
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.actions.createColumn({ name: 'Backlog' });
    });

    expect(createKanbanColumn).toHaveBeenCalledWith({ name: 'Backlog' }, { workspaceId: 'ws-1' });
  });
});
