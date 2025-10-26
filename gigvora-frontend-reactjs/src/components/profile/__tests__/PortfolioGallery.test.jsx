import { render, screen } from '@testing-library/react';
import PortfolioGallery from '../PortfolioGallery.jsx';

describe('PortfolioGallery', () => {
  it('renders empty state when no links are provided', () => {
    render(<PortfolioGallery links={[]} />);

    expect(screen.getByText('Portfolio & case studies')).toBeInTheDocument();
    expect(
      screen.getByText('Add curated projects, case studies, or campaign recaps to showcase delivery excellence.'),
    ).toBeInTheDocument();
  });

  it('renders portfolio cards with metadata and link', () => {
    render(
      <PortfolioGallery
        links={[
          {
            label: 'Founder CRM launch',
            url: 'https://gigvora.com/case-study',
            description: 'Built revenue ops motion with multi-touch nurture.',
            tags: ['RevOps', 'Lifecycle'],
            metrics: { reach: '12k founders', conversion: '32%' },
          },
        ]}
      />,
    );

    expect(screen.getByText('Founder CRM launch')).toBeInTheDocument();
    expect(screen.getByText('gigvora.com')).toBeInTheDocument();
    expect(screen.getByText('Built revenue ops motion with multi-touch nurture.')).toBeInTheDocument();
    expect(screen.getByText('RevOps')).toBeInTheDocument();
    expect(screen.getByText('12k founders')).toBeInTheDocument();
  });
});
