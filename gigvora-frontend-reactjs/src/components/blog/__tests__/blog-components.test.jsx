import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BlogCard from '../BlogCard.jsx';
import DashboardBlogSpotlight from '../DashboardBlogSpotlight.jsx';

vi.mock('../../../services/blog.js', () => ({
  __esModule: true,
  fetchBlogPosts: vi.fn(),
}));

const { fetchBlogPosts } = await import('../../../services/blog.js');

const samplePost = {
  id: '1',
  slug: 'growing-an-agency',
  title: 'Growing an agency',
  coverImage: { altText: 'Cover', url: 'https://example.com/cover.jpg' },
  category: { name: 'Operations' },
  tags: [{ id: 'ops', name: 'ops' }],
  publishedAt: '2024-01-10T12:00:00.000Z',
  readingTimeMinutes: 6,
  excerpt: 'Playbooks and tactics to scale.',
};

describe('Blog components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders post data in BlogCard', () => {
    render(
      <MemoryRouter>
        <BlogCard post={samplePost} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /growing an agency/i })).toBeInTheDocument();
    expect(screen.getByText(/Playbooks and tactics/i)).toBeInTheDocument();
    expect(screen.getByText(/6 min read/i)).toBeInTheDocument();
  });

  it('loads spotlight posts from the API', async () => {
    fetchBlogPosts.mockResolvedValue({ results: [samplePost] });

    render(
      <MemoryRouter>
        <DashboardBlogSpotlight />
      </MemoryRouter>,
    );

    expect(fetchBlogPosts).toHaveBeenCalledWith({ pageSize: 3 }, expect.any(Object));
    expect(await screen.findByText(/Growing an agency/i)).toBeInTheDocument();
  });
});
