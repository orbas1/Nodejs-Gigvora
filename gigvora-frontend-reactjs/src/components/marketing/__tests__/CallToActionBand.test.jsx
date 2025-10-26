import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CallToActionBand } from '../CallToActionBand.jsx';

const STATS = [
  { label: 'Teams onboarded', value: '3,800+', helper: 'Accelerating launches worldwide' },
  { label: 'Mentor network', value: '420+', helper: 'Operators coaching every cohort' },
];

const SUPPORTING_POINTS = ['Curated crews aligned to your roadmap', 'Enterprise-ready compliance and payments'];

const LOGOS = ['Northwind Digital', 'Forma Studio'];

describe('CallToActionBand', () => {
  it('renders actions, stats, and supporting points', () => {
    render(
      <MemoryRouter>
        <CallToActionBand
          eyebrow="Membership"
          title="Join the community"
          description="Align every operator, mentor, and specialist inside one polished command centre."
          primaryAction={{ label: 'Claim your seat', to: '/register' }}
          secondaryAction={{ label: 'Talk with our team', href: 'mailto:hello@gigvora.com' }}
          supportingPoints={SUPPORTING_POINTS}
          stats={STATS}
          logos={LOGOS}
          footnote="Telemetry-backed confidence."
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /claim your seat/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /talk with our team/i })).toHaveAttribute(
      'href',
      'mailto:hello@gigvora.com',
    );
    expect(screen.getByText(/teams onboarded/i)).toBeInTheDocument();
    expect(screen.getByText(/curated crews aligned/i)).toBeInTheDocument();
    expect(screen.getByText(/northwind digital/i)).toBeInTheDocument();
    expect(screen.getByText(/telemetry-backed confidence/i)).toBeInTheDocument();
  });
});
