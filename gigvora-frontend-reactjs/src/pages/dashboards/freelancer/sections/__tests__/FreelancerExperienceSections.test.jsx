import { vi } from 'vitest';

vi.mock('../../../../../hooks/useSession.js', () => {
  return {
    __esModule: true,
    default: vi.fn(),
  };
});

vi.mock('../../../../../hooks/useFreelancerCalendar.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../../../hooks/useFreelancerPortfolio.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../../../hooks/useFreelancerReferences.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../../../hooks/useFreelancerReviews.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../../../../../hooks/useRoleAccess.js', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../planning/CalendarEventTimeline.jsx', () => ({
  __esModule: true,
  default: ({ events = [], onSelect }) => (
    <div data-testid="planner-timeline">
      {events.map((event) => (
        <button key={event.id ?? event.label} type="button" onClick={() => onSelect?.(event)}>
          {event.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../planning/CalendarEventForm.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../planning/CalendarEventDetailsDrawer.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../planning/CalendarEventMonthView.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../portfolio/PortfolioEditorDrawer.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../portfolio/PortfolioAssetDrawer.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../portfolio/PortfolioSettingsDialog.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../profile-overview/index.js', () => ({
  __esModule: true,
  ProfileSummaryCard: ({ profile }) => (
    <div data-testid="profile-summary-card">{profile?.headline ?? 'Profile summary'}</div>
  ),
  AvailabilityCard: ({ availability }) => (
    <div data-testid="availability-card">{availability?.status ?? 'Availability'}</div>
  ),
  SkillCard: ({ skills = [] }) => <div data-testid="skill-card">{skills.length} skills</div>,
  NetworkPreviewCard: ({ followers = [] }) => (
    <div data-testid="network-preview">{followers.length} followers</div>
  ),
  ConnectionsCard: ({ connections = {} }) => (
    <div data-testid="connections-card">{connections.items?.length ?? 0} connections</div>
  ),
  ProfileInfoDrawer: () => null,
  AvailabilityDrawer: () => null,
  SkillManagerDrawer: () => null,
  ConnectionsDialog: () => null,
  FollowersDialog: () => null,
  ExperienceCard: ({ experience = [] }) => (
    <div data-testid="experience-card">{experience.length} experiences</div>
  ),
  ExperienceDrawer: () => null,
}));

vi.mock('../reviews/ReviewToolbar.jsx', () => ({
  __esModule: true,
  default: ({ activeView, onCreate }) => (
    <div data-testid="review-toolbar">
      Toolbar {activeView}
      <button type="button" onClick={onCreate}>
        New review
      </button>
    </div>
  ),
}));

vi.mock('../reviews/OverviewView.jsx', () => ({
  __esModule: true,
  default: ({ summary = {} }) => (
    <div data-testid="review-overview">Total reviews: {summary.totalReviews ?? 0}</div>
  ),
}));

vi.mock('../reviews/TableView.jsx', () => ({
  __esModule: true,
  default: ({ reviews = [] }) => (
    <div data-testid="review-table">Rows: {reviews.length}</div>
  ),
}));

vi.mock('../reviews/InsightsView.jsx', () => ({
  __esModule: true,
  default: ({ insights = {} }) => (
    <div data-testid="review-insights">Insights synced</div>
  ),
}));

vi.mock('../reviews/ReviewFormDrawer.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../reviews/ReviewDetailModal.jsx', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../project-workspace/ProjectWorkspaceModule.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="project-workspace-module">Workspace module</div>,
}));

vi.mock('../../../../components/support/SupportDeskPanel.jsx', () => ({
  __esModule: true,
  default: ({ userId }) => <div data-testid="support-desk">Support for {userId}</div>,
}));

vi.mock('../../../../components/dashboard/TaskSprintManager.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="task-sprint-manager">Sprint cockpit</div>,
}));

import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import OverviewSection from '../OverviewSection.jsx';
import PlanningSection from '../PlanningSection.jsx';
import PortfolioManagementSection from '../PortfolioManagementSection.jsx';
import ProfileOverviewSection from '../ProfileOverviewSection.jsx';
import ProjectWorkspaceExcellenceSection from '../ProjectWorkspaceExcellenceSection.jsx';
import ReferencesSection from '../ReferencesSection.jsx';
import ReviewManagementSection from '../ReviewManagementSection.jsx';
import SupportSection from '../SupportSection.jsx';
import TaskManagementSection from '../TaskManagementSection.jsx';
import useSessionHook from '../../../../../hooks/useSession.js';
import useFreelancerCalendarHook from '../../../../../hooks/useFreelancerCalendar.js';
import useFreelancerPortfolioHook from '../../../../../hooks/useFreelancerPortfolio.js';
import useFreelancerReferencesHook from '../../../../../hooks/useFreelancerReferences.js';
import useFreelancerReviewsHook from '../../../../../hooks/useFreelancerReviews.js';
import useRoleAccessHook from '../../../../../hooks/useRoleAccess.js';

const useSession = vi.mocked(useSessionHook);
const useFreelancerCalendar = vi.mocked(useFreelancerCalendarHook);
const useFreelancerPortfolio = vi.mocked(useFreelancerPortfolioHook);
const useFreelancerReferences = vi.mocked(useFreelancerReferencesHook);
const useFreelancerReviews = vi.mocked(useFreelancerReviewsHook);
const useRoleAccess = vi.mocked(useRoleAccessHook);

const DEFAULT_SESSION = {
  id: 'user-1',
  activeRole: 'freelancer',
  role: 'freelancer',
  freelancerId: 'freelancer-1',
  memberships: ['freelancer'],
  workspace: { role: 'freelancer', type: 'freelancer' },
};

function createCalendarState() {
  return {
    events: [
      {
        id: 'event-1',
        label: 'Discovery workshop',
        type: 'workshop',
        status: 'confirmed',
        startsAt: '2024-04-20T15:00:00.000Z',
      },
    ],
    metrics: {
      nextEvent: {
        title: 'Discovery workshop',
        startsAt: '2024-04-20T15:00:00.000Z',
      },
      total: 3,
      upcomingCount: 2,
      overdueCount: 1,
      typeCounts: { workshop: 1 },
    },
    loading: false,
    error: null,
    lastUpdated: '2024-04-19T12:00:00.000Z',
    refresh: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  };
}

function createPortfolioState() {
  return {
    data: {
      summary: { total: 6, published: 4, featured: 2, assetCount: 10 },
      items: [
        {
          id: 'case-1',
          title: 'AI Launch Strategy',
          tagline: 'Scaled adoption for robotics line',
          status: 'live',
          visibility: 'public',
          clientName: 'Atlas Robotics',
          role: 'Product strategist',
          updatedAt: '2024-04-15T10:00:00.000Z',
          assets: [{ id: 'asset-1', label: 'Journey map' }],
          impactMetrics: [{ label: 'ROI', value: '180%' }],
        },
      ],
      settings: { theme: 'sleek' },
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
    actions: {
      createItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      createAsset: vi.fn(),
      updateAsset: vi.fn(),
      deleteAsset: vi.fn(),
      updateSettings: vi.fn(),
    },
  };
}

function createReferencesState() {
  return {
    references: [
      {
        id: 'ref-1',
        client: 'Lumina Health',
        relationship: 'Chief Product Officer',
        company: 'Lumina Health',
        quote: 'She orchestrated the go-live flawlessly.',
        rating: 4.9,
        weight: 'Flagship transformation',
        verified: true,
        status: 'published',
        lastInteractionAt: '2024-04-16T09:00:00.000Z',
      },
    ],
    publishedReferences: [
      {
        id: 'ref-1',
        client: 'Lumina Health',
        relationship: 'Chief Product Officer',
        company: 'Lumina Health',
        quote: 'She orchestrated the go-live flawlessly.',
        rating: 4.9,
        weight: 'Flagship transformation',
        verified: true,
        status: 'published',
        lastInteractionAt: '2024-04-16T09:00:00.000Z',
      },
    ],
    pendingReferences: [
      {
        id: 'ref-2',
        client: 'Northwind Bank',
        relationship: 'Director of CX',
        company: 'Northwind Bank',
        quote: 'Discovery cadence and playbooks were excellent.',
        rating: 4.8,
        weight: 'Regulatory programme',
        verified: false,
        status: 'pending_verification',
        lastInteractionAt: '2024-04-17T11:00:00.000Z',
      },
    ],
    summary: [
      { label: 'Published', value: 2, hint: 'Live on profile' },
      { label: 'Pending', value: 1, hint: 'Awaiting response' },
    ],
    insights: { invitesSent: 12, responseRate: 0.78, lastSyncAt: '2024-04-18T18:00:00.000Z' },
    compliance: { verified: 5, flagged: 0, pending: 1 },
    timeline: [
      {
        id: 'timeline-1',
        title: 'Awaiting feedback from Lumina Health',
        interactionDate: '2024-04-18T08:00:00.000Z',
        status: 'pending_verification',
        verified: false,
      },
    ],
    settings: { allowPrivate: true, showBadges: true, autoShareToFeed: true, autoRequest: false, escalateConcerns: true },
    settingsSaving: false,
    settingsError: null,
    updateSettings: vi.fn(),
    requestReference: vi.fn(),
    verifyReference: vi.fn(),
    loading: false,
    error: null,
    refresh: vi.fn(),
    lastUpdated: '2024-04-18T18:30:00.000Z',
    fromCache: false,
  };
}

function createReviewsState() {
  return {
    reviews: [
      {
        id: 'review-1',
        client: 'Atlas Robotics',
        rating: 5,
        status: 'published',
        createdAt: '2024-04-15T10:00:00.000Z',
      },
    ],
    summary: { totalReviews: 12, averageRating: 4.8, highlightedCount: 4 },
    ratingDistribution: { 5: 8, 4: 3, 3: 1 },
    insights: { lastSyncAt: '2024-04-18T18:00:00.000Z', featuredMentions: 3 },
    pagination: { page: 1, perPage: 10, totalPages: 2, totalCount: 12 },
    filters: { status: 'all', query: '', sort: 'recent' },
    setFilters: vi.fn(),
    setPage: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    creating: false,
    updatingId: null,
    deletingId: null,
    loading: false,
    error: null,
    lastError: null,
    refresh: vi.fn(),
  };
}

beforeEach(() => {
  useSession.mockReturnValue({ session: { ...DEFAULT_SESSION } });
  useFreelancerCalendar.mockReturnValue(createCalendarState());
  useFreelancerPortfolio.mockReturnValue(createPortfolioState());
  useFreelancerReferences.mockReturnValue(createReferencesState());
  useFreelancerReviews.mockReturnValue(createReviewsState());
  useRoleAccess.mockReturnValue({ hasAccess: false, isAuthenticated: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Freelancer experience sections', () => {
  it('renders overview metrics and highlights', () => {
    const overview = {
      profile: {
        name: 'Amelia Stone',
        headline: 'Product operations partner',
        summary: 'Helps regulated organisations ship faster.',
        followerCount: 2400,
        followerGoal: 3000,
        trustScore: 87,
        trustScoreChange: 4.2,
        rating: 4.9,
        ratingCount: 58,
      },
      currentDate: { iso: '2024-04-19T09:00:00.000Z', timezone: 'America/New_York' },
      weather: { temperature: 18, units: 'metric', condition: 'Sunny' },
      weatherSettings: { locationName: 'New York', latitude: 40.7128, longitude: -74.006, units: 'metric' },
      workstreams: [
        {
          id: 'ws-1',
          label: 'Lifecycle revamp',
          status: 'in-progress',
          dueDateLabel: 'Friday',
          tone: 'emerald',
        },
      ],
      upcomingSchedule: [
        {
          id: 'sc-1',
          label: 'Client standup',
          type: 'Meeting',
          startsAt: '2024-04-19T14:30:00.000Z',
        },
      ],
      highlights: [
        {
          id: 'hl-1',
          title: 'Trust centre live',
          summary: 'Deployed trust centre with self-serve controls.',
          type: 'update',
          publishedAt: '2024-04-18T12:00:00.000Z',
        },
      ],
    };

    render(<OverviewSection overview={overview} onSave={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 2, name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByText(/Lifecycle revamp/i)).toBeInTheDocument();
    expect(screen.getByText(/Client standup/i)).toBeInTheDocument();
    expect(screen.getByText(/Trust centre live/i)).toBeInTheDocument();
  });

  it('displays planner summary with upcoming events', () => {
    render(
      <MemoryRouter>
        <PlanningSection freelancerId="freelancer-1" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 2, name: /Planner/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Discovery workshop/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Planner snapshot/i)).toBeInTheDocument();
  });

  it('shows portfolio cases and summary counts', () => {
    render(<PortfolioManagementSection freelancerId="freelancer-1" canEdit />);

    expect(screen.getByRole('heading', { level: 2, name: /Portfolio/i })).toBeInTheDocument();
    expect(screen.getByText(/AI Launch Strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/Cases/i)).toBeInTheDocument();
  });

  it('presents profile overview stats and social proof', () => {
    const overview = {
      profile: {
        firstName: 'Amelia',
        lastName: 'Stone',
        headline: 'Product operator',
        bio: 'Empowers operators with actionable systems.',
        availability: { status: 'available', hoursPerWeek: 30 },
        skills: ['Operations', 'Research'],
        stats: { followerCount: 420, connectionCount: 85, pendingConnections: 3 },
        followers: { items: [{ id: 'f-1' }, { id: 'f-2' }] },
        connections: { items: [{ id: 'c-1' }, { id: 'c-2' }] },
        experience: [{ id: 'exp-1', title: 'Head of Product Ops', company: 'Lumina Health' }],
      },
    };

    render(
      <ProfileOverviewSection
        overview={overview}
        onSave={vi.fn()}
        onUploadAvatar={vi.fn()}
        onCreateConnection={vi.fn()}
        onUpdateConnection={vi.fn()}
        onDeleteConnection={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByTestId('profile-summary-card')).toHaveTextContent(/Product operator/i);
    const statsHeadings = screen.getAllByText(/Stats/i);
    expect(statsHeadings.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Followers/i).length).toBeGreaterThan(0);
  });

  it('embeds the project workspace module', () => {
    render(<ProjectWorkspaceExcellenceSection />);

    expect(screen.getByRole('heading', { level: 2, name: /Workspace/i })).toBeInTheDocument();
    expect(screen.getByTestId('project-workspace-module')).toHaveTextContent(/Workspace module/i);
  });

  it('summarises references with verification actions', () => {
    render(<ReferencesSection />);

    expect(screen.getByRole('heading', { level: 2, name: /References & reviews/i })).toBeInTheDocument();
    const references = screen.queryAllByText(/Lumina Health/i);
    expect(references.length).toBeGreaterThan(0);
    expect(screen.getByText(/Flagship transformation/i)).toBeInTheDocument();
  });

  it('surfaces review dashboards for freelancer access', () => {
    render(<ReviewManagementSection />);

    expect(screen.getByRole('heading', { level: 2, name: /Reviews/i })).toBeInTheDocument();
    expect(screen.getByTestId('review-toolbar')).toHaveTextContent(/Toolbar/i);
    expect(screen.getByTestId('review-overview')).toHaveTextContent(/Total reviews: 12/i);
  });

  it('requires authentication before showing support desk', () => {
    useSession.mockReturnValueOnce({ session: null });

    render(<SupportSection />);

    expect(screen.getByRole('heading', { level: 2, name: /Support desk/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in to view escalations, transcripts, and dispute playbooks/i),
    ).toBeInTheDocument();
  });

  it('guards sprint cockpit behind role access', () => {
    render(<TaskManagementSection />);

    expect(screen.getByRole('heading', { level: 2, name: /Task management & delegation/i })).toBeInTheDocument();
    expect(screen.getByText(/Workspace upgrade required/i)).toBeInTheDocument();
    expect(screen.queryByTestId('task-sprint-manager')).not.toBeInTheDocument();
  });
});
