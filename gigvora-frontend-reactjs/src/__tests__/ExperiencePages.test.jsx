import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react';
import PagesPage from '../pages/PagesPage.jsx';
import SearchPage from '../pages/SearchPage.jsx';
import VolunteeringPage from '../pages/VolunteeringPage.jsx';
import useSession from '../hooks/useSession.js';
import useOpportunityListing from '../hooks/useOpportunityListing.js';
import useCachedResource from '../hooks/useCachedResource.js';
import useSavedSearches from '../hooks/useSavedSearches.js';
import useEngagementSignals from '../hooks/useEngagementSignals.js';

vi.mock('../components/PageHeader.jsx', () => ({
  default: ({ title, description, actions, meta }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      <p>{description}</p>
      {actions}
      {meta}
    </header>
  ),
}));

vi.mock('../components/UserAvatar.jsx', () => ({
  default: ({ name }) => <span data-testid="avatar">{name}</span>,
}));

vi.mock('../components/marketing/GigvoraAds.jsx', () => ({
  GigvoraAdBanner: () => <div data-testid="ad-banner" />,
  GigvoraAdGrid: () => <div data-testid="ad-grid" />,
}));

vi.mock('../components/explorer/ExplorerMap.jsx', () => ({
  default: () => <div data-testid="explorer-map" />,
}));

vi.mock('../components/explorer/ExplorerFilterDrawer.jsx', () => ({
  default: () => <div data-testid="explorer-filter-drawer" />,
}));

vi.mock('../components/explorer/SavedSearchList.jsx', () => ({
  default: () => <div data-testid="saved-search-list" />,
}));

vi.mock('../components/explorer/ExplorerManagementPanel.jsx', () => ({
  default: () => <div data-testid="explorer-management-panel" />,
}));

vi.mock('../components/volunteering/VolunteerOpportunityManager.jsx', () => ({
  default: () => <div data-testid="volunteer-manager" />,
}));

vi.mock('../services/analytics.js', () => ({
  default: { track: vi.fn() },
}));

vi.mock('../hooks/useSession.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useOpportunityListing.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useCachedResource.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useSavedSearches.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useEngagementSignals.js', () => ({
  default: vi.fn(),
}));

vi.mock('../hooks/useDebounce.js', () => ({
  default: (value) => value,
}));

vi.mock('../services/apiClient.js', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

describe('Experience focused pages', () => {
  beforeEach(() => {
    useSession.mockReset();
    useOpportunityListing.mockReset();
    useCachedResource.mockReset();
    useSavedSearches.mockReset();
    useEngagementSignals.mockReset();
  });

  it('asks non-company or agency users to request access on PagesPage', () => {
    useSession.mockReturnValue({ session: { memberships: ['freelancer'] }, isAuthenticated: true });

    render(
      <MemoryRouter>
        <PagesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Access limited to company and agency workspaces.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request access' })).toBeInTheDocument();
  });

  it('allows authorised users to create a new page draft', async () => {
    const user = userEvent.setup();
    useSession.mockReturnValue({
      session: { memberships: ['company'], name: 'Pat Operator' },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <PagesPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(screen.getByLabelText('Page name'), 'Impact Studio');
      await user.type(screen.getByLabelText('Headline'), 'Amplifying community-driven innovation.');
      await user.click(screen.getByRole('button', { name: 'Create a page' }));
    });

    const createdEntries = await screen.findAllByText('Impact Studio');
    expect(createdEntries.length).toBeGreaterThan(0);
  });

  it('shows a sign-in prompt on Explorer search when unauthenticated', () => {
    useSession.mockReturnValue({ session: null, isAuthenticated: false });
    useSavedSearches.mockReturnValue({ items: [], loading: false, createSavedSearch: vi.fn(), updateSavedSearch: vi.fn(), deleteSavedSearch: vi.fn(), canUseServer: false });
    useEngagementSignals.mockReturnValue({ signals: [] });
    useCachedResource.mockReturnValue({ data: { items: [], total: 0, totalPages: 1, page: 1, pageSize: 20 }, error: null, loading: false, lastUpdated: null, refresh: vi.fn() });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sign in to unlock Explorer')).toBeInTheDocument();
  });

  it('renders volunteering access messaging when membership is missing', () => {
    useSession.mockReturnValue({ session: { memberships: ['freelancer'] }, isAuthenticated: true });
    useOpportunityListing.mockReturnValue({
      data: { items: [] },
      error: null,
      loading: false,
      fromCache: false,
      lastUpdated: null,
      refresh: vi.fn(),
      debouncedQuery: '',
    });

    render(
      <MemoryRouter>
        <VolunteeringPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Unlock the volunteer command centre')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request access' })).toBeInTheDocument();
  });
});
