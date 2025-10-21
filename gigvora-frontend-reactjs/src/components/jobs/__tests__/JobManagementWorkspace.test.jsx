import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  items: [],
  createItem: vi.fn(() => ({ id: 'job-new', applications: [] })),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
  resetCollection: vi.fn(),
  clearCollection: vi.fn(),
  hasSeedData: true,
}));

vi.mock('../../../hooks/useLocalCollection.js', () => ({
  __esModule: true,
  default: vi.fn(() => mockState),
  mockState,
}));

import JobManagementWorkspace from '../JobManagementWorkspace.jsx';
import { mockState as collectionState } from '../../../hooks/useLocalCollection.js';

describe('JobManagementWorkspace', () => {
  beforeEach(() => {
    collectionState.items = [
      {
        id: 'job-1',
        title: 'Product Lead',
        company: 'Gigvora',
        location: 'Remote',
        employmentType: 'Full-time',
        salaryRange: '£100k',
        tags: ['Product'],
        applications: [],
      },
    ];
    collectionState.resetCollection.mockClear();
    collectionState.clearCollection.mockClear();
    collectionState.createItem.mockClear();
    collectionState.hasSeedData = true;
  });

  it('offers workspace utilities for sample data and clearing drafts', async () => {
    const user = userEvent.setup();
    render(<JobManagementWorkspace />);

    const restoreButton = screen.getByRole('button', { name: /restore sample roles/i });
    expect(restoreButton).not.toBeDisabled();
    await act(async () => {
      await user.click(restoreButton);
    });
    await waitFor(() => expect(collectionState.resetCollection).toHaveBeenCalledTimes(1));

    const clearButton = screen.getByRole('button', { name: /clear workspace/i });
    await act(async () => {
      await user.click(clearButton);
    });
    await waitFor(() => expect(collectionState.clearCollection).toHaveBeenCalledTimes(1));
  });

  it('opens the role creation form when requested', async () => {
    const user = userEvent.setup();
    render(<JobManagementWorkspace />);

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /new role/i }));
    });
    expect(await screen.findByText(/create new role/i)).toBeInTheDocument();
  });

  it('disables restore when no seed data is available', async () => {
    collectionState.hasSeedData = false;
    render(<JobManagementWorkspace />);
    expect(screen.getByRole('button', { name: /restore sample roles/i })).toBeDisabled();
  });
});
