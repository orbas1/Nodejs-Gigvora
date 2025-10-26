import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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

  it('renders testimonials hero controls and updates payload', () => {
    const handleChange = vi.fn();
    const value = {
      hero: {
        eyebrow: 'Social proof',
        heading: 'Trusted by pioneers',
        description: 'Operators rave about the polish.',
        stats: [{ id: 'stat-1', value: '92%', label: 'Renewals', helper: '60 day window' }],
        logos: ['Northwind Labs'],
      },
      items: [
        {
          id: 't1',
          quote: 'Gigvora accelerated our launches.',
          authorName: 'Alex',
          authorRole: 'Head of Product',
          authorCompany: 'Northwind',
          badge: 'Enterprise rollout',
        },
      ],
    };
    render(<HomepageTestimonialsForm value={value} onChange={handleChange} />);

    expect(screen.getByLabelText(/Hero heading/i).value).toBe('Trusted by pioneers');
    expect(screen.getByLabelText(/Hero description/i).value).toContain('Operators rave');
    expect(screen.getByText(/Testimonial 1/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Hero eyebrow/i), { target: { value: 'Proof points' } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ hero: expect.objectContaining({ eyebrow: 'Proof points' }) }),
    );
  });
});
