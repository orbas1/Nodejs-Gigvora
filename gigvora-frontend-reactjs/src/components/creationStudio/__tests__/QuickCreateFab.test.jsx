import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import QuickCreateFab from '../QuickCreateFab.jsx';

const TYPES = [
  { id: 'gig', name: 'Gig', tagline: 'Sell a premium service', icon: () => null },
  { id: 'job', name: 'Job', tagline: 'Open a new role', icon: () => null },
  { id: 'event', name: 'Event', tagline: 'Host a live session', icon: () => null },
];

function buildInsights() {
  return {
    gig: {
      total: 5,
      drafts: 2,
      scheduled: 1,
      published: 2,
      lastUpdated: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      impact: { label: '2 live assets', score: 6 },
    },
    job: {
      total: 1,
      drafts: 1,
      scheduled: 0,
      published: 0,
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  };
}

describe('QuickCreateFab', () => {
  it('presents recommended types and triggers creation', async () => {
    const onCreate = vi.fn();
    render(
      <QuickCreateFab
        types={TYPES}
        insights={buildInsights()}
        activeTypeId="gig"
        onCreate={onCreate}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /quick create/i }));

    expect(screen.getByText(/sell a premium service/i)).toBeInTheDocument();
    expect(screen.getByText(/2 drafts/i)).toBeInTheDocument();
    expect(screen.getByText(/updated 2 hours ago/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /job/i }));
    expect(onCreate).toHaveBeenCalledWith('job', expect.objectContaining({ source: 'quick-create-fab' }));
  });

  it('closes when selecting outside or pressing escape', async () => {
    render(<QuickCreateFab types={TYPES} insights={buildInsights()} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /quick create/i }));
    expect(screen.getByRole('dialog', { name: /quick create recommendations/i })).toBeVisible();

    await user.click(document.body);
    expect(screen.queryByRole('dialog', { name: /quick create recommendations/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /quick create/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /quick create recommendations/i })).not.toBeInTheDocument();
  });

  it('respects disabled state', async () => {
    render(<QuickCreateFab types={TYPES} disabled />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /quick create/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
