import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

const { mockUseSession, mockUseFreelancerReviews } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockUseFreelancerReviews: vi.fn(),
}));

vi.mock('../../../../../hooks/useSession.js', () => ({
  __esModule: true,
  default: mockUseSession,
}));

vi.mock('../../../../../hooks/useFreelancerReviews.js', () => ({
  __esModule: true,
  default: mockUseFreelancerReviews,
}));

const ReviewManagementSection = (await import('../ReviewManagementSection.jsx')).default;

function buildReviewsResponse(overrides = {}) {
  return {
    reviews: [
      {
        id: 'review-1',
        reviewerName: 'Casey Fox',
        reviewerCompany: 'Atlas Robotics',
        title: 'Operational powerhouse',
        rating: 4.8,
        status: 'published',
        updatedAt: '2024-04-16T12:00:00Z',
        tags: ['delivery'],
      },
    ],
    summary: {
      overallRating: 4.9,
      totalReviews: 1,
      highlightCount: 1,
    },
    ratingDistribution: [
      { rating: 5, count: 1 },
      { rating: 4, count: 0 },
    ],
    insights: [
      { id: 'insight-1', title: 'Trending up', body: 'Engagement is up 12% week over week.' },
    ],
    pagination: { page: 1, total: 1, totalPages: 1, pageSize: 10 },
    filters: {
      status: 'all',
      highlighted: undefined,
      minRating: null,
      maxRating: null,
      sort: 'recent',
      query: '',
      tags: [],
      page: 1,
    },
    setFilters: vi.fn(),
    setPage: vi.fn(),
    createReview: vi.fn().mockResolvedValue({}),
    updateReview: vi.fn().mockResolvedValue({}),
    deleteReview: vi.fn().mockResolvedValue({}),
    creating: false,
    updatingId: null,
    deletingId: null,
    loading: false,
    error: null,
    lastError: null,
    refresh: vi.fn(),
    ...overrides,
  };
}

describe('ReviewManagementSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      session: {
        activeRole: 'freelancer',
        freelancerId: 'freelancer-42',
        memberships: ['freelancer'],
        workspace: { type: 'freelancer' },
      },
    });
    mockUseFreelancerReviews.mockReturnValue(buildReviewsResponse());
  });

  it('restricts access when the session is not a freelancer', () => {
    mockUseSession.mockReturnValue({
      session: { activeRole: 'viewer', memberships: ['viewer'], workspace: { type: 'client' } },
    });

    render(<ReviewManagementSection />);

    expect(screen.getByText(/freelancer access required/i)).toBeInTheDocument();
  });

  it('renders review data and refreshes on demand', async () => {
    const refresh = vi.fn();
    mockUseSession.mockReturnValue({
      session: {
        activeRole: 'freelancer',
        freelancerId: 'freelancer-42',
        memberships: ['freelancer'],
        workspace: { type: 'freelancer' },
      },
    });
    mockUseFreelancerReviews.mockReturnValue(
      buildReviewsResponse({ refresh }),
    );

    render(<ReviewManagementSection />);

    fireEvent.click(screen.getByRole('button', { name: /table/i }));

    expect(await screen.findByText('Operational powerhouse')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^refresh$/i }));

    expect(refresh).toHaveBeenCalledWith({ force: true });

    fireEvent.click(screen.getByRole('button', { name: /^new$/i }));

    expect(await screen.findByText(/new review/i)).toBeInTheDocument();
  });
});
