import { act, render, screen } from '@testing-library/react';
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
  it('presents recommended types, tracks analytics, and triggers creation', async () => {
    const onCreate = vi.fn();
    const onTrack = vi.fn();
    await act(async () => {
      render(
        <QuickCreateFab
          types={TYPES}
          insights={buildInsights()}
          activeTypeId="gig"
          onCreate={onCreate}
          onTrack={onTrack}
        />
      );
    });

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });

    const openedPayload = onTrack.mock.calls.find(([payload]) => payload.event === 'quick_create_opened')?.[0];
    expect(openedPayload).toBeDefined();
    expect(openedPayload.recommendations?.length).toBeGreaterThan(0);
    expect(openedPayload.activeTypeId).toBe('gig');

    expect(screen.getByText(/sell a premium service/i)).toBeInTheDocument();
    expect(screen.getByText(/2 drafts/i)).toBeInTheDocument();
    expect(screen.getByText(/updated 2 hours ago/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /job/i }));
    });
    expect(onCreate).toHaveBeenCalledWith('job', expect.objectContaining({ source: 'quick-create-fab' }));
    const selectedPayload = onTrack.mock.calls.find(([payload]) => payload.event === 'quick_create_selected')?.[0];
    expect(selectedPayload).toMatchObject({ typeId: 'job' });
    const closedPayload = onTrack.mock.calls.filter(([payload]) => payload.event === 'quick_create_closed').pop()?.[0];
    expect(closedPayload).toMatchObject({ reason: 'selection' });
    expect(closedPayload.recommendations?.length).toBeGreaterThan(0);
  });

  it('closes when selecting outside or pressing escape', async () => {
    await act(async () => {
      render(<QuickCreateFab types={TYPES} insights={buildInsights()} />);
    });
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });
    expect(await screen.findByRole('dialog', { name: /quick create recommendations/i })).toBeVisible();

    await act(async () => {
      await user.click(document.body);
    });
    expect(screen.queryByRole('dialog', { name: /quick create recommendations/i })).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });
    await act(async () => {
      await user.keyboard('{Escape}');
    });
    expect(screen.queryByRole('dialog', { name: /quick create recommendations/i })).not.toBeInTheDocument();
  });

  it('emits analytics when dismissing the menu', async () => {
    const onTrack = vi.fn();
    await act(async () => {
      render(<QuickCreateFab types={TYPES} insights={buildInsights()} onTrack={onTrack} />);
    });
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });
    expect(onTrack.mock.calls.at(-1)?.[0]).toMatchObject({ event: 'quick_create_opened' });

    await act(async () => {
      await user.click(document.body);
    });
    expect(onTrack.mock.calls.at(-1)?.[0]).toMatchObject({ event: 'quick_create_closed', reason: 'outside' });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });
    await act(async () => {
      await user.keyboard('{Escape}');
    });
    expect(onTrack.mock.calls.at(-1)?.[0]).toMatchObject({ event: 'quick_create_closed', reason: 'escape' });
  });

  it('respects disabled state', async () => {
    await act(async () => {
      render(<QuickCreateFab types={TYPES} disabled />);
    });
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /quick create/i }));
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
