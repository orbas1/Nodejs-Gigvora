import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IncidentList from '../IncidentList.jsx';

describe('IncidentList', () => {
  it('renders an empty state when there are no incidents', () => {
    render(<IncidentList incidents={[]} onCreate={vi.fn()} onResolve={vi.fn()} />);

    expect(screen.getByText('No incidents recorded.')).toBeInTheDocument();
  });

  it('shows the capture form and resolves open incidents', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onResolve = vi.fn();

    render(
      <IncidentList
        incidents={[
          {
            id: 'incident-1',
            status: 'open',
            severity: 'medium',
            summary: 'Sync queue stuck',
            openedAt: '2024-05-01T10:00:00Z',
          },
        ]}
        onCreate={onCreate}
        onResolve={onResolve}
        severityOptions={['low', 'medium']}
      />,
    );

    expect(screen.getByPlaceholderText('Short description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log incident/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mark resolved/i }));
    expect(onResolve).toHaveBeenCalledWith('incident-1');
    expect(onCreate).not.toHaveBeenCalled();
  });
});
