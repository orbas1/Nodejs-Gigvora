import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react';
import VolunteeringPage from '../pages/VolunteeringPage.jsx';
import useSession from '../hooks/useSession.js';
import useOpportunityListing from '../hooks/useOpportunityListing.js';

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
