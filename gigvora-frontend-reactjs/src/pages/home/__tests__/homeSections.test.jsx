import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunityPulseSection } from '../CommunityPulseSection.jsx';
import { CreationStudioWorkflowSection } from '../CreationStudioWorkflowSection.jsx';
import { ExplorerShowcaseSection } from '../ExplorerShowcaseSection.jsx';
import { FeesShowcaseSection } from '../FeesShowcaseSection.jsx';
import { HomeHeroSection } from '../HomeHeroSection.jsx';
import { JoinCommunitySection } from '../JoinCommunitySection.jsx';
import { MarketplaceLaunchesSection } from '../MarketplaceLaunchesSection.jsx';
import { OperationsTrustSection } from '../OperationsTrustSection.jsx';
import { PersonaJourneysSection } from '../PersonaJourneysSection.jsx';
import { TestimonialsSection } from '../TestimonialsSection.jsx';

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
});

afterEach(() => {
  vi.clearAllMocks();
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

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('HomeHeroSection', () => {
  it('renders defaults and triggers callbacks', () => {
    const claimSpy = vi.fn();
    const browseSpy = vi.fn();

    renderWithRouter(
      <HomeHeroSection
        headline="A vibrant headline"
        subheading="A detailed subheading"
        keywords={[{ label: 'First' }, 'Second']}
        onClaimWorkspace={claimSpy}
        onBrowseOpportunities={browseSpy}
      />,
    );

    expect(screen.getByText('A vibrant headline')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /claim your workspace/i }));
    fireEvent.click(screen.getByRole('button', { name: /browse live opportunities/i }));

    expect(claimSpy).toHaveBeenCalledTimes(1);
    expect(browseSpy).toHaveBeenCalledTimes(1);
    expect(analyticsMock.track).toHaveBeenCalledTimes(3);
    expect(analyticsMock.track).toHaveBeenNthCalledWith(
      1,
      'web_home_hero_viewed',
      expect.objectContaining({ heroId: 'home-hero' }),
      expect.any(Object),
    );
  });

  it('falls back gracefully when errored', () => {
    renderWithRouter(<HomeHeroSection error="boom" loading />);

    expect(screen.getByText('Stay tuned for what is next.')).toBeInTheDocument();
    expect(screen.getByText('Gathering the latest programmes…')).toBeInTheDocument();
  });

  it('renders video media when provided', () => {
    renderWithRouter(
      <HomeHeroSection
        productMedia={{
          videoUrl: 'https://cdn.example.com/hero.mp4',
          posterUrl: 'https://cdn.example.com/poster.jpg',
          caption: 'Live product walkthrough',
          alt: 'Product tour video',
        }}
      />,
    );

    expect(screen.getByTestId('home-hero-media-video')).toBeInTheDocument();
    expect(screen.queryByTestId('home-hero-media-image')).not.toBeInTheDocument();
  });
});

describe('CreationStudioWorkflowSection', () => {
  it('highlights steps on hover and updates panel content', () => {
    renderWithRouter(<CreationStudioWorkflowSection />);

    const collaborateButton = screen.getByRole('button', { name: /collaborate/i });

    expect(screen.getByText('Generate polished narratives and portfolio prompts in seconds.')).toBeInTheDocument();

    act(() => {
      fireEvent.mouseEnter(collaborateButton);
    });

    expect(
      screen.getByText('Comment inline on tone, achievements, and compliance evidence.'),
    ).toBeInTheDocument();
  });
});

describe('ExplorerShowcaseSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseCreation = {
    id: '1',
    type: 'gigs',
    title: 'Prototype testing mission',
    summary: 'Help us validate the next release.',
    ownerName: 'Alex Rivera',
    publishedAt: '2024-04-01T00:00:00Z',
    deepLink: '/creations/1',
  };

  it('renders creations and allows type switching', () => {
    renderWithRouter(
      <ExplorerShowcaseSection
        creations={[
          baseCreation,
          {
            ...baseCreation,
            id: '2',
            type: 'mentorships',
            title: 'Mentorship power hour',
            ownerName: 'Jamie',
            deepLink: '/creations/2',
          },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: /prototype testing mission/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mentorships/i }));
    expect(screen.getByRole('heading', { name: /Mentorship power hour/i })).toBeInTheDocument();
  });

  it('shows fallback cards when no creations available', () => {
    renderWithRouter(<ExplorerShowcaseSection creations={[]} loading={false} error={null} />);

    expect(screen.getByText(/Spin up a specialist pod/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    renderWithRouter(<ExplorerShowcaseSection error="Server unavailable" />);

    expect(screen.getByText(/Unable to reach Explorer right now/i)).toBeInTheDocument();
  });
});

describe('MarketplaceLaunchesSection', () => {
  it('renders stats and creations', () => {
    renderWithRouter(
      <MarketplaceLaunchesSection
        communityStats={[{ label: 'Live gigs', value: '24' }]}
        trendingCreations={[
          {
            id: 'launch-1',
            type: 'Gig',
            title: 'Frontend revamp',
            summary: 'Ship a new marketing site.',
            ownerName: 'Taylor',
            publishedAt: '2024-04-01T00:00:00Z',
            deepLink: '/creation/launch-1',
          },
        ]}
      />,
    );

    expect(screen.getByText('Live gigs')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review opportunity/i })).toHaveAttribute(
      'href',
      '/creation/launch-1',
    );
  });

  it('renders placeholder when no creations and error provided', () => {
    renderWithRouter(
      <MarketplaceLaunchesSection loading={false} error="Oops" communityStats={[]} trendingCreations={[]} />,
    );

    expect(
      screen.getByText('Unable to load the latest launches. Please try again soon.'),
    ).toBeInTheDocument();
  });
});

describe('OperationsTrustSection', () => {
  it('normalises metrics and displays fallback data', () => {
    renderWithRouter(<OperationsTrustSection homeData={{}} />);

    expect(screen.getByText('99.2% uptime')).toBeInTheDocument();
    expect(screen.getByText('3.2 hrs median')).toBeInTheDocument();
    expect(screen.getByText('87% automated')).toBeInTheDocument();
  });

  it('shows loading and error badges', () => {
    renderWithRouter(
      <OperationsTrustSection
        homeData={{}}
        loading
        error="Telemetry offline"
      />,
    );

    expect(screen.getByText('Telemetry offline')).toBeInTheDocument();
    expect(screen.getByText('Syncing telemetry…')).toBeInTheDocument();
  });
});

describe('PersonaJourneysSection', () => {
  it('triggers callback when persona CTA clicked', () => {
    const handler = vi.fn();
    renderWithRouter(<PersonaJourneysSection onSelectPersona={handler} />);

    fireEvent.click(screen.getByRole('link', { name: /Enter freelancer HQ/i }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({ key: 'freelancer' });
  });

  it('merges CMS personas and renders metrics', () => {
    const handler = vi.fn();
    const personas = [
      {
        key: 'freelancer',
        title: 'Creator collective',
        description: 'Custom copy from CMS',
        ctaLabel: 'Explore creators',
        metrics: [
          { label: 'Active missions', value: '42' },
          { label: 'Avg. payout', value: '36h' },
        ],
      },
    ];

    renderWithRouter(
      <PersonaJourneysSection
        personas={personas}
        personaMetrics={[{ persona: 'mentor', label: 'Sessions queued', value: '12' }]}
        onSelectPersona={handler}
      />,
    );

    expect(screen.getByRole('heading', { name: /Creator collective/i })).toBeInTheDocument();
    expect(screen.getByText('Active missions')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Explore creators/i }));
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toMatchObject({
      key: 'freelancer',
      metrics: expect.arrayContaining([expect.objectContaining({ label: 'Active missions', value: '42' })]),
    });
  });
});

describe('CommunityPulseSection', () => {
  it('renders skeleton placeholders while loading', () => {
    const { container } = renderWithRouter(<CommunityPulseSection loading homeData={{}} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('FeesShowcaseSection', () => {
  it('displays pricing tiers', () => {
    renderWithRouter(<FeesShowcaseSection />);
    expect(screen.getByText('Pricing that respects every partnership')).toBeInTheDocument();
    expect(screen.getByText('5× Job Posts')).toBeInTheDocument();
  });
});

describe('JoinCommunitySection', () => {
  it('renders call to action links', () => {
    renderWithRouter(<JoinCommunitySection />);
    expect(screen.getByRole('link', { name: /Claim your seat/i })).toHaveAttribute('href', '/register');
  });
});

describe('TestimonialsSection', () => {
  it('renders testimonials with fallback data', () => {
    renderWithRouter(<TestimonialsSection loading error />);
    expect(screen.getByText(/Trusted by leaders and makers/i)).toBeInTheDocument();
    // ensures fallback testimonial present
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0);
  });
});
