import { renderWidgetHtml } from '../reputationWidgetRenderer.js';

describe('reputationWidgetRenderer', () => {
  it('renders testimonials and metrics into an embeddable HTML document', () => {
    const html = renderWidgetHtml({
      freelancer: {
        name: 'Jordan Smith',
        title: 'Product Designer',
        initials: 'JS',
        profileUrl: 'https://gigvora.com/f/jordan',
      },
      widget: {
        name: 'Portfolio Spotlight',
        theme: 'lilac',
        themeTokens: { background: '#faf5ff', accent: '#7c3aed' },
      },
      testimonials: [
        {
          clientName: 'Alex Client',
          clientRole: 'Head of Product',
          comment: 'Jordan shipped a stellar redesign in record time.',
          rating: 5,
          projectName: 'Platform redesign',
        },
      ],
      metrics: [
        { label: 'Projects Delivered', value: '24', trendLabel: '+4 vs prev.' },
      ],
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Jordan Smith');
    expect(html).toContain('Portfolio Spotlight');
    expect(html).toContain('stellar redesign');
    expect(html).toContain('<script type="application/ld+json">');
  });

  it('falls back to empty testimonial messaging when none provided', () => {
    const html = renderWidgetHtml({ freelancer: { name: 'Taylor' }, widget: { name: 'Trust Badge' } });
    expect(html).toContain('No verified testimonials yet.');
  });
});
