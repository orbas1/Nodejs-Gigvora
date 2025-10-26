import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublicHero from '../PublicHero.jsx';
import { ValuePillars } from '../ValuePillars.jsx';

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock('../../../services/analytics.js', () => ({
  __esModule: true,
  default: analyticsMock,
  analytics: analyticsMock,
}));

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  analyticsMock.track.mockClear();
});

afterAll(() => {
  if (originalMatchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  } else {
    delete window.matchMedia;
  }
});

describe('PublicHero', () => {
  it('renders fallback copy, persona chips, and ticker items', () => {
    render(
      <PublicHero
        componentId="marketing-hero"
        fallbackHeadline="A polished marketing hero"
        fallbackSubheading="Premium positioning across personas."
        fallbackTickerItems={[{ label: 'Verified launch telemetry' }]}
        personaChips={[{ label: 'Founders' }, 'Agencies']}
        valuePillars={[
          {
            id: 'pillar',
            title: 'Premium storytelling',
            description: 'Showcases proof points.',
            icon: 'ShieldCheckIcon',
            highlights: ['Every persona sees tailored proof.'],
          },
        ]}
        analyticsMetadata={{ source: 'unit-test', viewEventName: 'hero_view' }}
      />,
    );

    expect(screen.getByText('A polished marketing hero')).toBeInTheDocument();
    expect(screen.getByText('Premium positioning across personas.')).toBeInTheDocument();
    expect(screen.getByText('Founders')).toBeInTheDocument();
    expect(screen.getByText('Agencies')).toBeInTheDocument();
    expect(screen.getByText('Verified launch telemetry')).toBeInTheDocument();
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'hero_view',
      expect.objectContaining({ heroId: 'marketing-hero' }),
      expect.objectContaining({ source: 'unit-test' }),
    );
  });

  it('tracks CTA clicks and triggers callbacks', () => {
    const primarySpy = vi.fn();

    render(
      <PublicHero
        componentId="marketing-hero"
        primaryAction={{ id: 'primary', label: 'Get started', onClick: primarySpy }}
        secondaryAction={{ id: 'secondary', label: 'Talk to us', href: 'https://gigvora.com/contact' }}
        analyticsMetadata={{ source: 'unit-test', viewEventName: 'hero_view', ctaEventName: 'hero_cta' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(primarySpy).toHaveBeenCalledTimes(1);
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'hero_cta',
      expect.objectContaining({ action: 'primary', heroId: 'marketing-hero' }),
      expect.objectContaining({ source: 'unit-test' }),
    );
  });
});

describe('ValuePillars', () => {
  it('renders metrics, highlights, and fires analytics on action', () => {
    const actionSpy = vi.fn();

    render(
      <ValuePillars
        analyticsMetadata={{ source: 'unit-test', heroId: 'marketing-hero', pillarEventName: 'pillar_action' }}
        pillars={[
          {
            id: 'growth',
            title: 'Growth programs',
            description: 'Orchestrate premium funnels.',
            highlights: ['AI nudges keep conversions high'],
            metric: { label: 'Pipeline lift', value: '34%' },
            action: { id: 'explore', label: 'See playbook', onClick: actionSpy },
          },
          {
            id: 'trust',
            title: 'Trust guardrails',
            description: 'Compliance and audit in one timeline.',
            highlights: ['SOC2 ready with guardrails'],
            icon: 'ShieldCheckIcon',
            action: { label: 'Review trust centre', href: '/trust' },
          },
        ]}
      />,
    );

    expect(screen.getByText(/growth programs/i)).toBeInTheDocument();
    expect(screen.getByText(/34%/i)).toBeInTheDocument();
    expect(screen.getByText(/ai nudges keep conversions high/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /see playbook/i }));
    expect(actionSpy).toHaveBeenCalledTimes(1);
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'pillar_action',
      expect.objectContaining({ pillarId: 'growth', heroId: 'marketing-hero' }),
      expect.objectContaining({ source: 'unit-test' }),
    );

    const trustLink = screen.getByRole('link', { name: /review trust centre/i });
    trustLink.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(trustLink);
    expect(analyticsMock.track).toHaveBeenCalledWith(
      'pillar_action',
      expect.objectContaining({ pillarId: 'trust', heroId: 'marketing-hero' }),
      expect.objectContaining({ source: 'unit-test' }),
    );
  });
});
