import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioGallery from '../PortfolioGallery.jsx';

describe('PortfolioGallery', () => {
  const portfolioItems = [
    {
      id: 'case-1',
      title: 'Marketplace relaunch',
      summary: 'Led multi-region marketplace redesign with concierge onboarding.',
      tags: ['Product', 'Growth'],
      metrics: [
        { label: 'GMV', value: '1.3M' },
        { label: 'Activation lift', value: '38%' },
      ],
      imageUrl: 'https://cdn.example.com/marketplace.png',
      featured: true,
      attachments: [{ label: 'Strategy deck', url: 'https://docs.example.com/strategy' }],
    },
    {
      id: 'case-2',
      title: 'Brand accelerator',
      summary: 'Spin-up brand system for venture studios with week-one activation.',
      tags: ['Brand'],
      metrics: [{ label: 'Studios onboarded', value: 28 }],
    },
  ];

  it('renders featured case study and metrics', () => {
    render(<PortfolioGallery items={portfolioItems} />);

    expect(screen.getAllByText('Marketplace relaunch').length).toBeGreaterThan(0);
    expect(screen.getByText('GMV')).toBeInTheDocument();
    expect(screen.getByText('1.3M')).toBeInTheDocument();
    expect(screen.getByText('Strategy deck')).toBeInTheDocument();
  });

  it('filters by category and triggers selection/share callbacks', async () => {
    const onSelect = vi.fn();
    const onShare = vi.fn();
    const user = userEvent.setup();

    render(<PortfolioGallery items={portfolioItems} onSelect={onSelect} onShare={onShare} />);

    const filterGroup = screen.getByText('All work').parentElement;
    const brandFilter = within(filterGroup).getByRole('button', { name: /^brand$/i });
    await user.click(brandFilter);
    expect(screen.getByText('Brand accelerator')).toBeInTheDocument();

    const brandCard = screen.getByText('Brand accelerator');
    await user.click(brandCard);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'case-2' }));

    const shareButton = screen.getByRole('button', { name: /share gallery/i });
    await user.click(shareButton);
    expect(onShare).toHaveBeenCalledWith(expect.objectContaining({ id: 'case-2' }));
  });
});
