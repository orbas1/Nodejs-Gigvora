import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAdminCalendarConsole from '../useAdminCalendarConsole.js';

const fetchAdminCalendarConsole = vi.fn();
const createAdminCalendarAccount = vi.fn();
const updateAdminCalendarAccount = vi.fn();
const deleteAdminCalendarAccount = vi.fn();
const updateAdminCalendarAvailability = vi.fn();
const createAdminCalendarTemplate = vi.fn();
const updateAdminCalendarTemplate = vi.fn();
const deleteAdminCalendarTemplate = vi.fn();
const createAdminCalendarEvent = vi.fn();
const updateAdminCalendarEvent = vi.fn();
const deleteAdminCalendarEvent = vi.fn();

vi.mock('../../services/adminCalendar.js', () => ({
  fetchAdminCalendarConsole: (...args) => fetchAdminCalendarConsole(...args),
  createAdminCalendarAccount: (...args) => createAdminCalendarAccount(...args),
  updateAdminCalendarAccount: (...args) => updateAdminCalendarAccount(...args),
  deleteAdminCalendarAccount: (...args) => deleteAdminCalendarAccount(...args),
  updateAdminCalendarAvailability: (...args) => updateAdminCalendarAvailability(...args),
  createAdminCalendarTemplate: (...args) => createAdminCalendarTemplate(...args),
  updateAdminCalendarTemplate: (...args) => updateAdminCalendarTemplate(...args),
  deleteAdminCalendarTemplate: (...args) => deleteAdminCalendarTemplate(...args),
  createAdminCalendarEvent: (...args) => createAdminCalendarEvent(...args),
  updateAdminCalendarEvent: (...args) => updateAdminCalendarEvent(...args),
  deleteAdminCalendarEvent: (...args) => deleteAdminCalendarEvent(...args),
}));

describe('useAdminCalendarConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminCalendarConsole.mockResolvedValue({
      accounts: [{ id: 'acc-1', name: 'Primary' }],
      templates: [],
      events: [],
      availability: {},
      metrics: { accounts: { total: 1, connected: 1, needsAttention: 0 } },
    });
    updateAdminCalendarAccount.mockResolvedValue({ id: 'acc-1', name: 'Updated' });
    createAdminCalendarAccount.mockResolvedValue({ id: 'acc-2', name: 'Secondary' });
  });

  it('loads console data and supports account actions', async () => {
    const { result } = renderHook(() => useAdminCalendarConsole());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchAdminCalendarConsole).toHaveBeenCalled();
    expect(result.current.metrics.accounts.total).toBe(1);

    await act(async () => {
      await result.current.actions.saveAccount('acc-1', { name: 'Updated' });
    });
    expect(updateAdminCalendarAccount).toHaveBeenCalledWith('acc-1', { name: 'Updated' });

    await act(async () => {
      await result.current.actions.saveAccount(null, { name: 'Secondary' });
    });
    expect(createAdminCalendarAccount).toHaveBeenCalledWith({ name: 'Secondary' });
  });
});
