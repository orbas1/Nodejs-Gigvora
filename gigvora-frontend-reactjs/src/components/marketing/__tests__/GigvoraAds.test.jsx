import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GigvoraAdBanner, GigvoraAdGrid } from '../GigvoraAds.jsx';

describe('GigvoraAdBanner', () => {
  it('applies hardened rel attributes for outbound CTAs', () => {
    render(
      <GigvoraAdBanner
        title="Scale your campaigns"
        description="Trusted ad placements with community-led creatives."
        stats={[]}
        cta={{ label: 'Launch ads', href: 'https://gigvora.com/ads', target: '_blank' }}
      />,
    );

    const link = screen.getByRole('link', { name: /launch ads/i });
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});

describe('GigvoraAdGrid', () => {
  it('renders ad cards with metrics', () => {
    render(
      <GigvoraAdGrid
        ads={[
          {
            id: 'ad-1',
            title: 'Mentor spotlight',
            description: 'Generate qualified mentorship leads.',
            href: '#',
            metrics: [
              { label: 'CTR', value: '6.2%' },
              { label: 'ROI', value: '4.3x' },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Mentor spotlight')).toBeInTheDocument();
    expect(screen.getByText('6.2%')).toBeInTheDocument();
  });
});
