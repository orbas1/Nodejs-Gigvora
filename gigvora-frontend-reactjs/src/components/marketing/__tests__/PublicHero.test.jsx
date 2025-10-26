import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PublicHero from '../PublicHero.jsx';

describe('PublicHero', () => {
  it('renders hero content, actions, and ticker items', async () => {
    const onPrimary = vi.fn();

    render(
      <PublicHero
        eyebrow="Premium surface"
        headline="Polished hero"
        subheading="Everything teams need to scale"
        primaryAction={{ label: 'Primary action', onClick: onPrimary }}
        secondaryAction={{ label: 'Secondary action', href: '/secondary' }}
        ticker={{ items: ['Alpha', 'Beta'], reduceMotion: false }}
        bottomSlot={<div data-testid="bottom-slot">Bottom slot</div>}
      />,
    );

    expect(screen.getByText('Premium surface')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Polished hero/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Primary action/i }));
    expect(onPrimary).toHaveBeenCalledTimes(1);

    const alphaBadges = screen.getAllByText('Alpha');
    expect(alphaBadges.length).toBeGreaterThan(1);
    expect(screen.getByTestId('bottom-slot')).toBeInTheDocument();
  });

  it('renders ticker skeletons when loading', () => {
    const { container } = render(<PublicHero ticker={{ showSkeleton: true, skeletonCount: 3 }} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
