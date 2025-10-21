import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SyncHistoryList from '../SyncHistoryList.jsx';

describe('SyncHistoryList', () => {
  it('shows an empty state when no runs exist', () => {
    render(<SyncHistoryList runs={[]} />);

    expect(screen.getByText('No sync events recorded.')).toBeInTheDocument();
  });

  it('renders sync run entries with status information', () => {
    render(
      <SyncHistoryList
        runs={[
          {
            id: 'run-1',
            status: 'completed',
            trigger: 'manual',
            startedAt: '2024-05-01T10:00:00Z',
            finishedAt: '2024-05-01T10:05:00Z',
            notes: 'Manual refresh',
          },
        ]}
      />,
    );

    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('manual')).toBeInTheDocument();
    expect(screen.getByText('Manual refresh')).toBeInTheDocument();
  });
});
