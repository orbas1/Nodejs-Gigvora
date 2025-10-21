import { render, screen } from '@testing-library/react';
import HomepageHeroForm from '../HomepageHeroForm.jsx';
import HomepageFaqForm from '../HomepageFaqForm.jsx';
import HomepageFeatureSectionsForm from '../HomepageFeatureSectionsForm.jsx';
import HomepageSeoForm from '../HomepageSeoForm.jsx';
import HomepageTestimonialsForm from '../HomepageTestimonialsForm.jsx';

describe('Homepage admin forms snapshots', () => {
  it('renders hero form headings and fields', () => {
    const value = {
      title: 'Launch globally',
      subtitle: 'Coordinate distributed teams',
      primaryCtaLabel: 'Book demo',
      overlayOpacity: 0.5,
      stats: [{ id: 'stat-1', label: 'Time saved', value: 30, suffix: '%' }],
    };
    const { container } = render(<HomepageHeroForm value={value} onChange={() => {}} />);
    expect(screen.getByText(/hero headline/i)).toBeInTheDocument();
    expect(container.querySelector('#hero-title').value).toBe('Launch globally');
    expect(container.querySelector('#hero-subtitle').value).toBe('Coordinate distributed teams');
  });

  it('renders FAQ form with existing entry', () => {
    const { container } = render(
      <HomepageFaqForm value={[{ id: 'faq-1', question: 'How fast?', answer: 'Under 48h' }]} onChange={() => {}} />,
    );
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    expect(container.querySelector('input').value).toBe('How fast?');
    expect(container.querySelector('textarea').value).toBe('Under 48h');
  });

  it('renders feature sections with bullets', () => {
    const value = [
      {
        id: 'section-1',
        title: 'Automation',
        description: 'Coordinate onboarding across regions.',
        mediaUrl: 'https://cdn.example.com/feature.png',
        bullets: [{ id: 'bullet-1', text: 'Automate compliance handoffs' }],
      },
    ];
    const { container } = render(<HomepageFeatureSectionsForm value={value} onChange={() => {}} />);
    expect(screen.getByText(/deep dive sections/i)).toBeInTheDocument();
    expect(container.querySelector('textarea').value).toContain('Coordinate onboarding');
    expect(container.querySelectorAll('textarea')[1].value).toContain('compliance handoffs');
  });

  it('renders SEO form with metadata values', () => {
    const value = {
      title: 'Gigvora | Platform',
      description: 'Enterprise-ready talent cloud.',
      keywords: ['gigvora', 'automation', 'compliance'],
    };
    const { container } = render(<HomepageSeoForm value={value} onChange={() => {}} />);
    expect(screen.getByText(/seo & social metadata/i)).toBeInTheDocument();
    expect(container.querySelector('#seo-title').value).toBe('Gigvora | Platform');
    expect(container.querySelector('#seo-keywords').value).toBe('gigvora, automation, compliance');
  });

  it('renders testimonials with highlight checkbox', () => {
    const value = [
      {
        id: 't1',
        quote: 'Gigvora accelerated our launches.',
        authorName: 'Alex',
        authorRole: 'Head of Product',
        highlight: true,
      },
    ];
    const { container } = render(<HomepageTestimonialsForm value={value} onChange={() => {}} />);
    expect(screen.getByText(/testimonials/i)).toBeInTheDocument();
    expect(container.querySelector('textarea').value).toContain('accelerated');
    expect(container.querySelector('input[type="checkbox"]').checked).toBe(true);
  });
});
