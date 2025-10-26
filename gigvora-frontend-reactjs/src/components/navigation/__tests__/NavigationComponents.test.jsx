import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MegaMenu from '../MegaMenu.jsx';
import RoleSwitcher from '../RoleSwitcher.jsx';
import { TrendingRail } from '../AppTopBar.jsx';
import { TrendingQuickLinks } from '../MobileNavigation.jsx';
import NavigationChromeContext from '../../../context/NavigationChromeContext.jsx';
import { DEFAULT_LANGUAGE } from '../../../i18n/translations.js';

function renderWithRouter(ui) {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
}

describe('MegaMenu', () => {
  const DummyIcon = () => <svg data-testid="dummy-icon" />;
  const item = {
    id: 'networking',
    label: 'Networking',
    description: 'Tools for rotation-led sessions',
    sections: [
      {
        title: 'Launch',
        items: [
          {
            name: 'Session planner',
            description: 'Schedule and configure rotations',
            to: '/networking/planner',
            icon: DummyIcon,
          },
        ],
      },
      {
        title: 'Engage',
        items: [
          {
            name: 'Connection CRM',
            description: 'Log matches and follow-ups',
            to: '/networking/crm',
            icon: DummyIcon,
          },
        ],
      },
    ],
  };

  it('opens the menu and reveals section links', async () => {
    const user = userEvent.setup();
    renderWithRouter(<MegaMenu item={item} />);

    expect(screen.queryByText('Session planner')).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /networking/i }));
    });

    expect(await screen.findByText('Session planner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /connection crm/i })).toHaveAttribute('href', '/networking/crm');
  });
});

describe('RoleSwitcher', () => {
  const options = [
    { key: 'founder', label: 'Founder', to: '/founder', timelineEnabled: true },
    { key: 'agency', label: 'Agency', to: '/agency', timelineEnabled: false },
  ];

  it('renders active role and allows switching', async () => {
    const user = userEvent.setup();
    const personas = [
      {
        key: 'founder',
        label: 'Founder HQ',
        icon: 'sparkles',
        tagline: 'Raise capital, hire leaders, and review investor dashboards.',
        focusAreas: ['Capital', 'Community'],
        metrics: [
          { label: 'Pipeline', value: 'Active', trend: '5 warm investors', positive: true },
          { label: 'Advisors', value: 'Synced' },
        ],
        primaryCta: 'Review founder workspace',
        defaultRoute: '/founder',
        timelineEnabled: true,
      },
      {
        key: 'agency',
        label: 'Agency control centre',
        icon: 'building-office',
        tagline: 'Coordinate crews, retainers, and milestone billing for every client.',
        focusAreas: ['Delivery', 'Finance'],
        metrics: [
          { label: 'Clients', value: 'Portfolio' },
          { label: 'Utilisation', value: 'Live' },
        ],
        primaryCta: 'Open agency control centre',
        defaultRoute: '/agency',
        timelineEnabled: false,
      },
    ];
    const chromeValue = {
      locales: [
        {
          code: DEFAULT_LANGUAGE,
          label: 'English',
          nativeLabel: 'English',
          flag: '🇬🇧',
          region: 'Global',
          coverage: 100,
          status: 'ga',
          supportLead: 'London localisation studio',
          lastUpdated: '2024-05-12T09:00:00Z',
          summary: 'Editorial canon reviewed quarterly.',
          direction: 'ltr',
          isDefault: true,
        },
      ],
      personas,
      footer: { navigationSections: [], statusHighlights: [], communityPrograms: [], officeLocations: [], certifications: [], socialLinks: [] },
      loading: false,
      error: null,
      lastFetchedAt: null,
      refresh: () => {},
    };

    renderWithRouter(
      <NavigationChromeContext.Provider value={chromeValue}>
        <RoleSwitcher options={options} currentKey="founder" />
      </NavigationChromeContext.Provider>,
    );

    expect(screen.getByRole('button', { name: /founder/i })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /founder/i }));
    });
    const agencyOption = await screen.findByRole('menuitem', { name: /agency/i });
    expect(agencyOption).toHaveAttribute('href', '/agency');
    expect(within(agencyOption).getByText(/timeline pending/i)).toBeInTheDocument();
    const founderOption = await screen.findByRole('menuitem', { name: /founder/i });
    expect(within(founderOption).getByText(/timeline/i)).toBeInTheDocument();
    const capitalBadges = within(founderOption).getAllByText(/capital/i);
    expect(capitalBadges.length).toBeGreaterThan(0);
  });
});

describe('TrendingRail', () => {
  it('renders featured and supporting entries', async () => {
    const user = userEvent.setup();
    const entries = [
      { id: '1', label: 'Deal room', description: 'Track warm investors', to: '/deals', badge: 'Spotlight' },
      { id: '2', label: 'Mentor lounge', description: 'Book 1:1 time', to: '/mentors' },
      { id: '3', label: 'Pipeline', description: 'Review active projects', to: '/pipeline' },
    ];

    const navigateSpy = vi.fn();
    renderWithRouter(<TrendingRail entries={entries} onNavigate={navigateSpy} />);

    expect(screen.getByText(/trending now/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Deal room/i })).toHaveAttribute('href', '/deals');
    await act(async () => {
      await user.click(screen.getByRole('link', { name: /pipeline/i }));
    });
    expect(navigateSpy).toHaveBeenCalledWith(expect.objectContaining({ id: '3' }));
  });

  it('hides when no entries are provided', () => {
    const { container } = renderWithRouter(<TrendingRail entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('TrendingQuickLinks', () => {
  it('renders trending quick links and closes on navigate', async () => {
    const user = userEvent.setup();
    const entries = [
      { id: 'a', label: 'Creator studio', description: 'Launch premium content', to: '/studio' },
      { id: 'b', label: 'Analytics', description: 'Review performance', to: '/analytics' },
      { id: 'c', label: 'Live events', to: '/events' },
    ];
    const navigateSpy = vi.fn();

    renderWithRouter(<TrendingQuickLinks entries={entries} onNavigate={navigateSpy} />);

    expect(screen.getByText(/creator studio/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /analytics/i })).toHaveAttribute('href', '/analytics');

    await act(async () => {
      await user.click(screen.getByRole('link', { name: /live events/i }));
    });

    expect(navigateSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
  });
});
