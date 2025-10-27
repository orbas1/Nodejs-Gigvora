import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscriptionManager from '../SubscriptionManager.jsx';
import useSavedSearches from '../../../hooks/useSavedSearches.js';

vi.mock('../../../hooks/useSavedSearches.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

describe('SubscriptionManager', () => {
  const mockCreate = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockRun = vi.fn();
  const mockRefresh = vi.fn();
  const originalConfirm = window.confirm;

  beforeEach(() => {
    window.confirm = vi.fn(() => true);
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockRun.mockReset();
    mockRefresh.mockReset();

    useSavedSearches.mockReturnValue({
      items: [
        {
          id: 'sub-1',
          name: 'Product leads',
          category: 'talent',
          frequency: 'daily',
          notifyByEmail: true,
          notifyInApp: true,
          nextRunAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      ],
      loading: false,
      error: null,
      createSavedSearch: mockCreate,
      updateSavedSearch: mockUpdate,
      deleteSavedSearch: mockDelete,
      runSavedSearch: mockRun,
      refresh: mockRefresh,
      canUseServer: true,
    });
  });

  afterEach(() => {
    window.confirm = originalConfirm;
  });

  it('shows subscription summary and runs actions', async () => {
    const user = userEvent.setup();
    render(<SubscriptionManager />);

    const totalCard = screen.getByText(/Total subscriptions/i).closest('div');
    expect(totalCard).not.toBeNull();
    expect(within(totalCard).getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/Product leads/i)).toBeInTheDocument();

    const emailButton = screen.getByRole('button', { name: /Email/i });
    const runButton = screen.getByRole('button', { name: /Run now/i });
    const removeButton = screen.getByRole('button', { name: /Remove/i });

    await act(async () => {
      await user.click(emailButton);
      await user.click(runButton);
      await user.click(removeButton);
    });

    expect(mockUpdate).toHaveBeenCalledWith('sub-1', { notifyByEmail: false });
    expect(mockRun).toHaveBeenCalledWith('sub-1');
    expect(mockDelete).toHaveBeenCalledWith('sub-1');
  });

  it('creates new subscriptions from the form', async () => {
    const user = userEvent.setup();
    render(<SubscriptionManager />);

    await act(async () => {
      await user.type(screen.getByLabelText(/Name/i), 'Growth alerts');
      await user.type(screen.getByLabelText(/Query or segment/i), 'role:"Growth"');
      await user.selectOptions(screen.getByLabelText(/Frequency/i), 'weekly');
      await user.click(screen.getByRole('button', { name: /Create subscription/i }));
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Growth alerts', query: 'role:"Growth"', frequency: 'weekly' }),
    );
  });
});
