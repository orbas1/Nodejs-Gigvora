import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/analytics.js', () => ({
  default: {
    track: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock('@headlessui/react', async (importOriginal) => {
  const actual = await importOriginal();
  const React = await import('react');
  const { Fragment } = React;

  const PopoverRoot = ({ children, className, defaultOpen }) => (
    <div className={className} data-testid="mock-popover">
      {typeof children === 'function'
        ? children({
            open: defaultOpen ?? true,
            close: () => {},
          })
        : children}
    </div>
  );

  const PopoverButton = React.forwardRef(({ children, as: Component = 'button', ...props }, ref) => (
    <Component ref={ref} type={Component === 'button' ? 'button' : undefined} {...props}>
      {typeof children === 'function' ? children({ open: true }) : children}
    </Component>
  ));
  PopoverButton.displayName = 'MockPopoverButton';

  const PopoverPanel = React.forwardRef(({ children, className, as: Component = 'div', ...props }, ref) => (
    <Component ref={ref} className={className} data-testid="mock-popover-panel" {...props}>
      {typeof children === 'function' ? children({ close: () => {} }) : children}
    </Component>
  ));
  PopoverPanel.displayName = 'MockPopoverPanel';

  PopoverRoot.Button = PopoverButton;
  PopoverRoot.Panel = PopoverPanel;

  const TransitionRoot = ({
    children,
    show = true,
    appear: _appear,
    as: Component = Fragment,
  }) => {
    if (!show) {
      return null;
    }

    const content = typeof children === 'function' ? children({}) : children;
    return <Component>{content}</Component>;
  };

  TransitionRoot.Root = TransitionRoot;

  TransitionRoot.Child = ({
    children,
    show = true,
    as: Component = Fragment,
  }) => {
    if (!show) {
      return null;
    }
    const content = typeof children === 'function' ? children({}) : children;
    return <Component>{content}</Component>;
  };

  const DialogRoot = ({
    children,
    open = true,
    onClose = () => {},
    as: Component = 'div',
    ...props
  }) => {
    const content =
      typeof children === 'function'
        ? children({ open, close: onClose })
        : children;
    return (
      <Component data-testid="mock-dialog" {...props}>
        {content}
      </Component>
    );
  };

  DialogRoot.Title = ({ children, as: Component = 'h2', ...props }) => (
    <Component {...props}>{children}</Component>
  );

  DialogRoot.Panel = React.forwardRef(({ children, as: Component = 'div', ...props }, ref) => (
    <Component ref={ref} {...props}>
      {children}
    </Component>
  ));
  DialogRoot.Panel.displayName = 'MockDialogPanel';

  DialogRoot.Overlay = ({ className, ...props }) => (
    <div className={className} {...props} />
  );

  const MenuContext = React.createContext({
    open: false,
    setOpen: () => {},
  });

  const MenuRoot = ({ children, as: Component = 'div', className, ...props }) => {
    const [open, setOpen] = React.useState(false);
    const close = React.useCallback(() => setOpen(false), []);
    const openMenu = React.useCallback(() => setOpen(true), []);
    const value = React.useMemo(
      () => ({ open, close, openMenu, setOpen }),
      [open, close, openMenu],
    );
    const renderedChildren =
      typeof children === 'function' ? children({ open, close }) : children;

    return (
      <MenuContext.Provider value={value}>
        <Component className={className} {...props}>
          {renderedChildren}
        </Component>
      </MenuContext.Provider>
    );
  };

  const MenuButton = React.forwardRef(({ children, onClick, as: Component = 'button', ...props }, ref) => {
    const { open, close, openMenu } = React.useContext(MenuContext);

    const handleClick = (event) => {
      if (open) {
        close();
      } else {
        openMenu();
      }
      onClick?.(event);
    };

    const resolvedChildren =
      typeof children === 'function' ? children({ open }) : children;

    return (
      <Component
        ref={ref}
        type={Component === 'button' ? 'button' : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={handleClick}
        {...props}
      >
        {resolvedChildren}
      </Component>
    );
  });
  MenuButton.displayName = 'MockMenuButton';

  const MenuItems = React.forwardRef(
    ({ children, as: Component = 'div', static: isStatic = false, ...props }, ref) => {
      const { open, close } = React.useContext(MenuContext);
      if (!open && !isStatic) {
        return null;
      }

      const rendered =
        typeof children === 'function' ? children({ open, close }) : children;

      return (
        <Component ref={ref} role="menu" {...props}>
          {rendered}
        </Component>
      );
    },
  );
  MenuItems.displayName = 'MockMenuItems';

  const MenuItem = ({ children, disabled = false }) => {
    const { close } = React.useContext(MenuContext);

    if (typeof children === 'function') {
      const rendered = children({ active: false, disabled, close });
      const handleClick = (event) => {
        rendered.props.onClick?.(event);
        if (!event.defaultPrevented && !disabled) {
          close();
        }
      };
      return React.cloneElement(rendered, {
        role: rendered.props.role ?? 'menuitem',
        tabIndex: rendered.props.tabIndex ?? -1,
        onClick: handleClick,
        'aria-disabled': disabled || undefined,
      });
    }

    return (
      <div role="menuitem" tabIndex={-1} aria-disabled={disabled}>
        {children}
      </div>
    );
  };

  MenuRoot.Button = MenuButton;
  MenuRoot.Items = MenuItems;
  MenuRoot.Item = MenuItem;

  return {
    ...actual,
    Popover: PopoverRoot,
    Dialog: DialogRoot,
    Transition: TransitionRoot,
    Menu: MenuRoot,
  };
});
import MegaMenu from '../MegaMenu.jsx';
import RoleSwitcher from '../RoleSwitcher.jsx';
import AppTopBar from '../AppTopBar.jsx';
import MobileNavigation, { TrendingQuickLinks } from '../MobileNavigation.jsx';
import analytics from '../../../services/analytics.js';
import NavigationChromeContext from '../../../context/NavigationChromeContext.jsx';
import { LanguageProvider } from '../../../context/LanguageContext.jsx';
import { DEFAULT_LANGUAGE } from '../../../i18n/translations.js';

function renderWithRouter(ui) {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
}

function createChromeValue() {
  return {
    locales: [
      {
        code: 'en',
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
    personas: [],
    footer: {
      navigationSections: [],
      statusHighlights: [],
      communityPrograms: [],
      officeLocations: [],
      certifications: [],
      socialLinks: [],
    },
    loading: false,
    error: null,
    lastFetchedAt: null,
    refresh: vi.fn(),
  };
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
    renderWithRouter(<MegaMenu item={item} forceOpen />);

    const plannerLinks = screen.getAllByRole('link', { name: /session planner/i });
    expect(plannerLinks.length).toBeGreaterThan(0);
    const crmLinks = screen.getAllByRole('link', { name: /connection crm/i });
    expect(crmLinks.length).toBeGreaterThan(0);
    expect(crmLinks[0]).toHaveAttribute('href', '/networking/crm');
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

describe('TrendingQuickLinks', () => {
  it('renders trending quick links and closes on navigate', async () => {
    const user = userEvent.setup();
    const entries = [
      { id: 'a', label: 'Creator studio', description: 'Launch premium content', to: '/studio' },
      { id: 'b', label: 'Analytics', description: 'Review performance', to: '/analytics' },
      { id: 'c', label: 'Live events', to: '/events' },
    ];
    const navigateSpy = vi.fn();

    analytics.track.mockClear();
    renderWithRouter(<TrendingQuickLinks entries={entries} onNavigate={navigateSpy} />);

    expect(screen.getByText(/creator studio/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /analytics/i })).toHaveAttribute('href', '/analytics');

    await act(async () => {
      await user.click(screen.getByRole('link', { name: /live events/i }));
    });

    expect(navigateSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
    expect(analytics.track).not.toHaveBeenCalled();
  });
});

beforeEach(() => {
  window.localStorage.clear();
});

describe('AppTopBar analytics', () => {
  it('submits marketing search and tracks analytics', async () => {
    const user = userEvent.setup();
    const onMarketingSearch = vi.fn();

    analytics.track.mockClear();
    const chromeValue = createChromeValue();

    render(
      <NavigationChromeContext.Provider value={chromeValue}>
        <LanguageProvider>
          <MemoryRouter>
            <AppTopBar
              navOpen={false}
              onOpenNav={() => {}}
              onCloseNav={() => {}}
              isAuthenticated
              marketingNavigation={[]}
              marketingSearch={{ placeholder: 'Search the network', ariaLabel: 'Search the network' }}
              primaryNavigation={[{ id: 'home', label: 'Home', to: '/home' }]}
              roleOptions={[]}
              currentRoleKey="founder"
              onLogout={() => {}}
              inboxPreview={{ threads: [], loading: false, error: null, lastFetchedAt: null }}
              connectionState="connected"
              onRefreshInbox={() => {}}
              onInboxMenuOpen={() => {}}
              onInboxThreadClick={() => {}}
              t={(_, defaultValue) => defaultValue}
              session={{ id: 42, name: 'Ada Lovelace' }}
              onMarketingSearch={onMarketingSearch}
              navigationPulse={[]}
              navigationTrending={[]}
            />
          </MemoryRouter>
        </LanguageProvider>
      </NavigationChromeContext.Provider>,
    );

    const searchInput = screen.getByPlaceholderText(/search the network/i);

    await user.type(searchInput, 'growth{enter}');

    expect(onMarketingSearch).toHaveBeenCalledWith('growth');
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
    const storedHistory = window.localStorage.getItem('gigvora:marketing_search_history');
    expect(storedHistory).toBeTruthy();
    expect(JSON.parse(storedHistory ?? '[]')).toContain('growth');
    expect(analytics.track).toHaveBeenCalledWith(
      'web_header_search_submitted',
      expect.objectContaining({ query: 'growth', persona: 'founder' }),
      expect.objectContaining({ userId: 42 }),
    );

    await user.click(searchInput);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Search "growth" again' }),
      ).toBeInTheDocument();
    });
  });

  it('replays spotlight history chips and tracks again', async () => {
    const user = userEvent.setup();
    const onMarketingSearch = vi.fn();

    analytics.track.mockClear();
    const chromeValue = createChromeValue();

    render(
      <NavigationChromeContext.Provider value={chromeValue}>
        <LanguageProvider>
          <MemoryRouter>
            <AppTopBar
              navOpen={false}
              onOpenNav={() => {}}
              onCloseNav={() => {}}
              isAuthenticated
              marketingNavigation={[]}
              marketingSearch={{ placeholder: 'Search the network', ariaLabel: 'Search the network' }}
              primaryNavigation={[{ id: 'home', label: 'Home', to: '/home' }]}
              roleOptions={[]}
              currentRoleKey="founder"
              onLogout={() => {}}
              inboxPreview={{ threads: [], loading: false, error: null, lastFetchedAt: null }}
              connectionState="connected"
              onRefreshInbox={() => {}}
              onInboxMenuOpen={() => {}}
              onInboxThreadClick={() => {}}
              t={(_, defaultValue) => defaultValue}
              session={{ id: 42, name: 'Ada Lovelace' }}
              onMarketingSearch={onMarketingSearch}
              navigationPulse={[]}
              navigationTrending={[]}
            />
          </MemoryRouter>
        </LanguageProvider>
      </NavigationChromeContext.Provider>,
    );

    const searchInput = screen.getByPlaceholderText(/search the network/i);

    await user.type(searchInput, 'design');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(onMarketingSearch).toHaveBeenCalledWith('design');
    });

    await user.click(searchInput);
    const replayChip = await screen.findByRole('button', { name: 'Search "design" again' });

    onMarketingSearch.mockClear();
    analytics.track.mockClear();

    await user.click(replayChip);

    expect(onMarketingSearch).toHaveBeenCalledWith('design');
    expect(analytics.track).toHaveBeenCalledWith(
      'web_header_search_submitted',
      expect.objectContaining({ query: 'design' }),
      expect.objectContaining({ userId: 42 }),
    );
  });

  it('tracks trending selections with persona context', async () => {
    const user = userEvent.setup();
    const onMarketingSearch = vi.fn();

    analytics.track.mockClear();
    const chromeValue = createChromeValue();

    render(
      <NavigationChromeContext.Provider value={chromeValue}>
        <LanguageProvider>
          <MemoryRouter>
            <AppTopBar
              navOpen={false}
              onOpenNav={() => {}}
              onCloseNav={() => {}}
              isAuthenticated
              marketingNavigation={[]}
              marketingSearch={null}
              primaryNavigation={[{ id: 'home', label: 'Home', to: '/home' }]}
              roleOptions={[]}
              currentRoleKey="founder"
              onLogout={() => {}}
              inboxPreview={{ threads: [], loading: false, error: null, lastFetchedAt: null }}
              connectionState="connected"
              onRefreshInbox={() => {}}
              onInboxMenuOpen={() => {}}
              onInboxThreadClick={() => {}}
              t={(_, defaultValue) => defaultValue}
              session={{ id: 42, name: 'Ada Lovelace' }}
              onMarketingSearch={onMarketingSearch}
              navigationPulse={[]}
              navigationTrending={[
                { id: 'trend-1', label: 'Creator studio', description: 'Launch premium content', to: '/studio' },
              ]}
            />
          </MemoryRouter>
        </LanguageProvider>
      </NavigationChromeContext.Provider>,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /insights/i }));
    });

    await act(async () => {
      const [trendingLink] = screen.getAllByRole('link', { name: /creator studio/i });
      await user.click(trendingLink);
    });

    expect(analytics.track).toHaveBeenCalledWith(
      'web_header_trending_navigate',
      expect.objectContaining({
        entryId: 'trend-1',
        destination: '/studio',
        persona: 'founder',
        source: 'web-header',
      }),
      expect.objectContaining({ userId: 42 }),
    );
    expect(onMarketingSearch).not.toHaveBeenCalled();
  });

  it('opens mobile quick search, surfaces trending, and tracks navigation', async () => {
    const user = userEvent.setup();
    const onMarketingSearch = vi.fn();

    analytics.track.mockClear();
    const chromeValue = createChromeValue();

    render(
      <NavigationChromeContext.Provider value={chromeValue}>
        <LanguageProvider>
          <MemoryRouter>
            <AppTopBar
              navOpen={false}
              onOpenNav={() => {}}
              onCloseNav={() => {}}
              isAuthenticated
              marketingNavigation={[]}
              marketingSearch={{ placeholder: 'Search the network', ariaLabel: 'Search the network' }}
              primaryNavigation={[{ id: 'home', label: 'Home', to: '/home' }]}
              roleOptions={[]}
              currentRoleKey="founder"
              onLogout={() => {}}
              inboxPreview={{ threads: [], loading: false, error: null, lastFetchedAt: null }}
              connectionState="connected"
              onRefreshInbox={() => {}}
              onInboxMenuOpen={() => {}}
              onInboxThreadClick={() => {}}
              t={(_, defaultValue) => defaultValue}
              session={{ id: 42, name: 'Ada Lovelace' }}
              onMarketingSearch={onMarketingSearch}
              navigationPulse={[]}
              navigationTrending={[
                { id: 'trend-1', label: 'Creator studio', description: 'Launch premium content', to: '/studio' },
                { id: 'trend-2', label: 'Analytics hub', description: 'Review performance', to: '/analytics' },
              ]}
            />
          </MemoryRouter>
        </LanguageProvider>
      </NavigationChromeContext.Provider>,
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /open quick search/i }));
    });

    expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();

    await act(async () => {
      const [trendingLink] = screen.getAllByRole('link', { name: /creator studio/i });
      await user.click(trendingLink);
    });

    expect(analytics.track).toHaveBeenCalledWith(
      'web_header_trending_navigate',
      expect.objectContaining({ entryId: 'trend-1', destination: '/studio' }),
      expect.objectContaining({ userId: 42 }),
    );
    expect(onMarketingSearch).not.toHaveBeenCalled();
  });

  it('opens quick search overlay with keyboard shortcut', async () => {
    const user = userEvent.setup();
    const onMarketingSearch = vi.fn();

    analytics.track.mockClear();
    const chromeValue = createChromeValue();

    render(
      <NavigationChromeContext.Provider value={chromeValue}>
        <LanguageProvider>
          <MemoryRouter>
            <AppTopBar
              navOpen={false}
              onOpenNav={() => {}}
              onCloseNav={() => {}}
              isAuthenticated
              marketingNavigation={[]}
              marketingSearch={{ placeholder: 'Search the network', ariaLabel: 'Search the network' }}
              primaryNavigation={[{ id: 'home', label: 'Home', to: '/home' }]}
              roleOptions={[]}
              currentRoleKey="founder"
              onLogout={() => {}}
              inboxPreview={{ threads: [], loading: false, error: null, lastFetchedAt: null }}
              connectionState="connected"
              onRefreshInbox={() => {}}
              onInboxMenuOpen={() => {}}
              onInboxThreadClick={() => {}}
              t={(_, defaultValue) => defaultValue}
              session={{ id: 42, name: 'Ada Lovelace' }}
              onMarketingSearch={onMarketingSearch}
              navigationPulse={[]}
              navigationTrending={[]}
            />
          </MemoryRouter>
        </LanguageProvider>
      </NavigationChromeContext.Provider>,
    );

    await user.keyboard('{Control>}k{/Control}');

    expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
  });
});

describe('MobileNavigation analytics', () => {
  it('tracks quick link navigation and closes drawer', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onMarketingSearch = vi.fn();

    analytics.track.mockClear();
    const chromeValue = createChromeValue();

    render(
      <NavigationChromeContext.Provider value={chromeValue}>
        <LanguageProvider>
          <MemoryRouter>
            <MobileNavigation
              open
              onClose={onClose}
              isAuthenticated
              primaryNavigation={[{ id: 'dashboard', label: 'Dashboard', to: '/dashboard' }]}
              marketingNavigation={[]}
              marketingSearch={{ placeholder: 'Search', ariaLabel: 'Search navigation' }}
              onLogout={() => {}}
              roleOptions={[]}
              currentRoleKey="freelancer"
              onMarketingSearch={onMarketingSearch}
              session={{ id: 7, name: 'Grace Hopper' }}
              navigationPulse={[]}
              trendingEntries={[
                { id: 'spotlight', label: 'Analytics hub', description: 'Review performance', to: '/analytics' },
                { id: 'search-trending-1', label: 'Product playbooks', description: 'Search results', to: '/search?q=playbooks' },
              ]}
            />
          </MemoryRouter>
        </LanguageProvider>
      </NavigationChromeContext.Provider>,
    );

    await act(async () => {
      await user.click(screen.getByRole('link', { name: /analytics hub/i }));
    });

    expect(analytics.track).toHaveBeenCalledWith(
      'mobile_nav_trending_navigate',
      expect.objectContaining({
        entryId: 'spotlight',
        destination: '/analytics',
        persona: 'freelancer',
        source: 'mobile-navigation',
        isSearchTrending: false,
      }),
      expect.objectContaining({ userId: 7 }),
    );
    expect(onClose).toHaveBeenCalled();

    await act(async () => {
      await user.click(screen.getByRole('link', { name: /product playbooks/i }));
    });

    expect(onMarketingSearch).toHaveBeenCalledWith('Product playbooks');
    expect(analytics.track).toHaveBeenLastCalledWith(
      'mobile_nav_trending_navigate',
      expect.objectContaining({
        entryId: 'search-trending-1',
        isSearchTrending: true,
      }),
      expect.objectContaining({ userId: 7 }),
    );
  });
});
