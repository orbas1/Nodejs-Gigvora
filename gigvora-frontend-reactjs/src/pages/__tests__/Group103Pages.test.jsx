import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act } from 'react';

import AutoAssignQueuePage, {
  formatCurrency as formatQueueCurrency,
  formatCountdown,
  STATUS_STYLES,
} from '../AutoAssignQueuePage.jsx';
import { formatDate as formatBlogDate } from '../BlogArticlePage.jsx';
import { FilterPill as BlogFilterPill } from '../BlogPage.jsx';
import { COMMUNITY_GUIDELINES_SLUG } from '../CommunityGuidelinesPage.jsx';
import CompanyRegisterPage, { INITIAL_FORM, PARTNERSHIP_PILLARS } from '../CompanyRegisterPage.jsx';
import { ConnectionCard } from '../ConnectionsPage.jsx';
import { creationTracks, stats as creationStudioStats } from '../CreationStudioWizardPage.jsx';
import {
  buildHighlights as buildExplorerHighlights,
  CATEGORY_CONFIG as EXPLORER_CATEGORY_CONFIG,
} from '../ExplorerRecordPage.jsx';
import { FAQ_SLUG } from '../FaqPage.jsx';
import {
  normaliseFeedPost,
  resolveAuthor,
  resolvePostType,
  extractMediaAttachments,
} from '../FeedPage.jsx';
import { parseFinanceOverview } from '../FinanceHubPage.jsx';
import { formatNumber as formatGigNumber } from '../GigsPage.jsx';
import { formatTaxonomyLabelFromSlug } from '../../utils/taxonomy.js';
import {
  formatPercent as formatGroupPercent,
  formatDate as formatGroupDate,
  formatTimelineDate,
} from '../GroupProfilePage.jsx';
import {
  formatNumber as formatGroupDirectoryNumber,
  getErrorMessage as getGroupErrorMessage,
  normaliseDiscoverResponse,
  COMMUNITY_MEMBERSHIPS,
  FALLBACK_DISCOVER_GROUPS,
} from '../GroupsPage.jsx';
import { DEFAULT_COMMUNITY_STATS } from '../HomePage.jsx';
import {
  sortThreads,
  formatMembershipLabel,
  INBOX_REFRESH_INTERVAL,
  ThreadCard,
} from '../InboxPage.jsx';
import {
  createDefaultFilters,
  formatPercent as formatJobPercent,
  formatStatusLabel,
  JOB_TABS,
} from '../JobsPage.jsx';
import { buildLaunchpadAccessLabel, LAUNCHPAD_LISTING_RESOURCE } from '../LaunchpadPage.jsx';
import { resolveLanding, formatExpiry, DASHBOARD_ROUTES } from '../LoginPage.jsx';
import { MENTOR_LISTING_RESOURCE } from '../MentorsPage.jsx';

vi.mock('../../components/PageHeader.jsx', () => ({
  __esModule: true,
  default: ({ title = 'Header', description = null, actions = null, meta = null }) => (
    <header data-testid="page-header">
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {actions}
      {meta}
    </header>
  ),
}));

vi.mock('../../components/DataStatus.jsx', () => ({
  __esModule: true,
  default: ({ loading, error, onRefresh }) => (
    <div data-testid="data-status" data-loading={loading} data-error={Boolean(error)}>
      <button type="button" onClick={() => onRefresh?.({ force: true })}>
        refresh
      </button>
    </div>
  ),
}));

vi.mock('../../components/UserAvatar.jsx', () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid="user-avatar">{name}</span>,
}));

const mockUseCachedResource = vi.fn();
vi.mock('../../hooks/useCachedResource.js', () => ({
  __esModule: true,
  default: (...args) => mockUseCachedResource(...args),
}));

const mockUseSession = vi.fn();
vi.mock('../../hooks/useSession.js', () => ({
  __esModule: true,
  default: (...args) => mockUseSession(...args),
}));

const { mockRegisterCompany, mockRegisterAgency } = vi.hoisted(() => ({
  mockRegisterCompany: vi.fn(),
  mockRegisterAgency: vi.fn(),
}));

const agoraMocks = vi.hoisted(() => ({
  createClient: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    removeAllListeners: vi.fn(),
    subscribe: vi.fn(async () => {}),
    publish: vi.fn(async () => {}),
    join: vi.fn(async () => {}),
    leave: vi.fn(async () => {}),
    remoteUsers: [],
  })),
  createMicrophoneAndCameraTracks: vi.fn(async () => [
    {
      setEnabled: vi.fn(async () => {}),
      stop: vi.fn(),
      close: vi.fn(),
    },
    {
      setEnabled: vi.fn(async () => {}),
      stop: vi.fn(),
      close: vi.fn(),
      play: vi.fn(),
    },
  ]),
  createMicrophoneAudioTrack: vi.fn(async () => ({
    setEnabled: vi.fn(async () => {}),
    stop: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock('agora-rtc-sdk-ng', () => ({
  __esModule: true,
  default: {
    createClient: (...args) => agoraMocks.createClient(...args),
    createMicrophoneAndCameraTracks: (...args) => agoraMocks.createMicrophoneAndCameraTracks(...args),
    createMicrophoneAudioTrack: (...args) => agoraMocks.createMicrophoneAudioTrack(...args),
  },
}));
vi.mock('../../services/auth.js', async () => {
  const actual = await vi.importActual('../../services/auth.js');
  return {
    ...actual,
    registerCompany: mockRegisterCompany,
    registerAgency: mockRegisterAgency,
  };
});

beforeEach(() => {
  mockUseCachedResource.mockReset();
  mockUseSession.mockReset();
  mockRegisterCompany.mockReset();
  mockRegisterAgency.mockReset();
});

describe('AutoAssignQueuePage helpers', () => {
  it('formats queue currency values with USD symbol', () => {
    expect(formatQueueCurrency(1500)).toBe('$1,500');
    expect(formatQueueCurrency(null)).toBe('—');
  });

  it('returns countdown strings and expiry states', () => {
    const future = new Date(Date.now() + 1000 * 60 * 90).toISOString();
    expect(formatCountdown(future)).toMatch(/\d{2}:\d{2}h/);
    expect(formatCountdown(new Date(Date.now() - 1000).toISOString())).toBe('Expired');
    expect(formatCountdown(null)).toBe('—');
  });

  it('renders queue entries when session has access', async () => {
    mockUseSession.mockReturnValue({ isAuthenticated: true, session: { memberships: ['freelancer'], id: 42 } });
    mockUseCachedResource.mockReturnValue({
      data: {
        entries: [
          {
            id: 'match-1',
            position: 1,
            projectName: 'AI launch roadmap',
            targetId: 'project-44',
            score: 0.92,
            priorityBucket: 'prime',
            status: 'pending',
            projectValue: 7200,
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            createdAt: new Date().toISOString(),
            breakdown: {},
            weights: { expertise: 0.6, availability: 0.4 },
          },
        ],
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
      fromCache: false,
      lastUpdated: new Date(),
    });

    render(
      <MemoryRouter initialEntries={['/auto-assign?freelancerId=42']}>
        <Routes>
          <Route path="/auto-assign" element={<AutoAssignQueuePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /AI launch roadmap/i })).toBeInTheDocument();
    expect(screen.getByText('pending')).toHaveClass(STATUS_STYLES.pending);
  });

  it('shows guidance when user lacks queue access', () => {
    mockUseSession.mockReturnValue({ isAuthenticated: false, session: null });
    mockUseCachedResource.mockReturnValue({ data: null, loading: false, error: null, refresh: vi.fn() });

    render(
      <MemoryRouter initialEntries={['/auto-assign']}>
        <Routes>
          <Route path="/auto-assign" element={<AutoAssignQueuePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/auto-assign queues/i)).toBeInTheDocument();
  });

  it('prompts queue admins to choose a freelancer when none is specified', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: { memberships: ['admin'] },
    });
    mockUseCachedResource.mockReturnValue({ data: null, loading: false, error: null, refresh: vi.fn() });

    render(
      <MemoryRouter initialEntries={['/auto-assign']}>
        <Routes>
          <Route path="/auto-assign" element={<AutoAssignQueuePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/select a freelancer id to inspect their current auto-assign queue/i),
    ).toBeInTheDocument();
  });
});

describe('Blog helpers', () => {
  it('formats blog dates gracefully', () => {
    expect(formatBlogDate('2024-05-01T10:00:00Z')).toContain('2024');
    expect(formatBlogDate('invalid')).toBeNull();
  });

  it('applies active styling to filter pill', () => {
    const { rerender } = render(<BlogFilterPill label="All" active onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveClass('text-white');

    rerender(<BlogFilterPill label="All" active={false} onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveClass('text-slate-600');
  });
});

describe('Site documents', () => {
  it('exposes slugs for documentation pages', () => {
    expect(COMMUNITY_GUIDELINES_SLUG).toBeTruthy();
    expect(FAQ_SLUG).toBeTruthy();
  });
});

describe('CompanyRegisterPage', () => {
  beforeEach(() => {
    mockRegisterCompany.mockResolvedValue({ id: 'company-1' });
    mockRegisterAgency.mockResolvedValue({ id: 'agency-1' });
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      session: null,
      login: vi.fn((session) => session),
      updateSession: vi.fn(),
    });
  });

  it('provides initial form defaults and partnership pillars', () => {
    expect(INITIAL_FORM.twoFactorEnabled).toBe(true);
    expect(PARTNERSHIP_PILLARS).toHaveLength(3);
  });

  it('submits company registration payload', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CompanyRegisterPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(screen.getByLabelText(/workspace name/i), 'Acme Labs');
      await user.type(screen.getByLabelText(/primary contact/i), 'Jordan');
      await user.type(screen.getByLabelText(/work email/i), 'founder@example.com');
      await user.type(screen.getByLabelText(/create password/i), 'StrongPass!1');
      await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass!1');
      await user.click(screen.getByRole('button', { name: /create company workspace/i }));
    });

    await waitFor(() =>
      expect(mockRegisterCompany).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: 'Acme Labs', email: 'founder@example.com' }),
      ),
    );

    expect(await screen.findByText(/workspace request received/i)).toBeInTheDocument();
  });

  it('prevents submission when form validation fails', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CompanyRegisterPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(screen.getByLabelText(/workspace name/i), 'Mismatch Labs');
      await user.type(screen.getByLabelText(/work email/i), 'mismatch@example.com');
      await user.type(screen.getByLabelText(/create password/i), 'Mismatch1!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Mismatch2!');
      await user.click(screen.getByRole('button', { name: /create company workspace/i }));
    });

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockRegisterCompany).not.toHaveBeenCalled();
  });
});

describe('ConnectionsPage cards', () => {
  it('disables connect button when policy forbids requests', () => {
    render(
      <ConnectionCard
        node={{
          id: 'user-1',
          name: 'Jordan',
          degreeLabel: '1st degree',
          actions: { canRequestConnection: false, reason: 'Already connected' },
        }}
      />,
    );

    const button = screen.getByRole('button', { name: /connect/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/already connected/i)).toBeInTheDocument();
  });
});

describe('Creation Studio wizard exports', () => {
  it('exposes creation tracks and stats', () => {
    expect(creationTracks.find((track) => track.id === 'gig')).toBeTruthy();
    expect(creationStudioStats.map((entry) => entry.label)).toContain('Automation coverage');
  });
});

describe('Explorer record helpers', () => {
  it('builds highlight metadata for records', () => {
    const highlights = buildExplorerHighlights({
      status: 'live',
      price: { amount: 1000, currency: 'USD' },
      duration: '3 weeks',
      isRemote: true,
    });
    expect(highlights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Status', value: 'live' }),
        expect.objectContaining({ label: 'Budget', value: '$1,000' }),
      ]),
    );
    expect(EXPLORER_CATEGORY_CONFIG.project.primaryAction.type).toBe('bid');
  });
});

describe('Feed helpers', () => {
  it('normalises feed posts with derived author data', () => {
    const post = normaliseFeedPost(
      {
        id: 'post-1',
        content: 'Launch update',
        User: { firstName: 'Jordan', lastName: 'Lee', Profile: { headline: 'Builder' } },
        type: 'news',
        mediaAttachments: [{ url: 'https://cdn.test/file.jpg', alt: 'file' }],
      },
      { name: 'Fallback User', title: 'Ops' },
    );

    expect(post.authorHeadline).toBe('Builder');
    expect(resolveAuthor(post).name).toContain('Jordan');
    expect(resolvePostType(post).key).toBe('news');
    expect(extractMediaAttachments(post)).toHaveLength(1);
  });
});

describe('Finance overview parsing', () => {
  it('normalises mixed payload shapes', () => {
    const overview = parseFinanceOverview({
      summary: { inEscrow: '1200', currency: 'GBP' },
      automation: { autoReleaseRate: 0.9 },
      accounts: [{ id: 'acct-1', balance: '500', lastReconciledAt: '2024-05-01T10:00:00Z' }],
      releaseQueue: [{ id: 'rel-1', amount: 250, currency: 'GBP', scheduledAt: '2024-05-02T10:00:00Z' }],
      disputeQueue: [{ id: 'd-1', amount: 120, currency: 'GBP', openedAt: '2024-04-30T12:00:00Z' }],
      complianceTasks: [{ id: 'task-1', title: 'Review report', dueDate: '2024-05-04' }],
      cashflow: [{ label: 'Week 1', inflow: 500, outflow: 200 }],
    });

    expect(overview.summary.inEscrow).toBe(1200);
    expect(overview.accounts[0].currency).toBe('GBP');
    expect(overview.releaseQueue[0].automation).toBe('manual');
  });
});

describe('Gig listings helpers', () => {
  it('formats taxonomy labels and numbers', () => {
    expect(formatTaxonomyLabelFromSlug('design-ops')).toBe('Design Ops');
    expect(formatGigNumber(1500)).toBe('1,500');
  });
});

describe('Group profile helpers', () => {
  it('formats percentages and dates safely', () => {
    expect(formatGroupPercent(0.82)).toBe('82%');
    expect(formatGroupDate('2024-05-01T10:00:00Z')).toContain('May');
    expect(formatTimelineDate('2024-06-01T00:00:00Z')).toMatch(/Jun/);
  });
});

describe('Group directory helpers', () => {
  it('supports number and error formatting', () => {
    expect(formatGroupDirectoryNumber(2300)).toBe('2.3k');
    expect(getGroupErrorMessage({ body: { message: 'Error' } })).toBe('Error');
    expect(normaliseDiscoverResponse({ data: { items: [{ id: 1 }], metadata: { page: 1 } } })).toEqual({
      items: [{ id: 1 }],
      metadata: { page: 1 },
    });
    expect(COMMUNITY_MEMBERSHIPS).toContain('freelancer');
    expect(FALLBACK_DISCOVER_GROUPS.length).toBeGreaterThan(0);
  });
});

describe('Home page defaults', () => {
  it('exposes default community stats', () => {
    expect(DEFAULT_COMMUNITY_STATS).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Global specialists' })]),
    );
  });
});

describe('Inbox helpers', () => {
  it('sorts threads by last activity', () => {
    const sorted = sortThreads([
      { id: '1', lastMessageAt: '2024-05-01T10:00:00Z' },
      { id: '2', lastMessageAt: '2024-05-03T10:00:00Z' },
    ]);
    expect(sorted[0].id).toBe('2');
  });

  it('formats membership labels using dashboard links', () => {
    expect(formatMembershipLabel('freelancer')).toBe('Freelancer');
    expect(INBOX_REFRESH_INTERVAL).toBe(60_000);
  });

  it('renders thread card with unread badge', () => {
    render(
      <ThreadCard
        thread={{
          id: 'thread-1',
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: 'New update',
          participants: [],
          messages: [],
        }}
        actorId="user-1"
        onSelect={() => {}}
        selected={false}
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-label');
  });
});

describe('Jobs helpers', () => {
  it('builds default filters and formatters', () => {
    expect(createDefaultFilters()).toEqual({ employmentTypes: [], isRemote: null, updatedWithin: '30d' });
    expect(formatJobPercent(50)).toBe('50%');
    expect(formatJobPercent(null)).toBe('0%');
    expect(formatStatusLabel('in_review')).toBe('In Review');
    expect(JOB_TABS.map((tab) => tab.id)).toContain('manage');
  });
});

describe('Launchpad helpers', () => {
  it('builds access labels and exposes resource key', () => {
    expect(buildLaunchpadAccessLabel(['mentor_success'])).toBe('Mentor success');
    expect(buildLaunchpadAccessLabel([])).toBeNull();
    expect(LAUNCHPAD_LISTING_RESOURCE).toBe('launchpads');
  });
});

describe('Login helpers', () => {
  it('resolves landing destinations and expiry', () => {
    expect(resolveLanding({ primaryDashboard: 'admin' })).toBe(DASHBOARD_ROUTES.admin);
    expect(resolveLanding(null)).toBe('/feed');
    expect(formatExpiry('2024-05-01T10:00:00Z')).toMatch(/10:00/);
  });
});

describe('Mentors page', () => {
  it('exposes listing resource key', () => {
    expect(MENTOR_LISTING_RESOURCE).toBe('mentors');
  });
});
