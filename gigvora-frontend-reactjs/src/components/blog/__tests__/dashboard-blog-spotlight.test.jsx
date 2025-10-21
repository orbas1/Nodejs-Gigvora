import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardBlogSpotlight from '../DashboardBlogSpotlight.jsx';

const { fetchBlogPostsMock, BlogCardMock } = vi.hoisted(() => ({
  fetchBlogPostsMock: vi.fn(),
  BlogCardMock: vi.fn(({ post }) => <div data-testid="blog-card">{post.title}</div>),
}));

vi.mock('../../../services/blog.js', () => ({
  fetchBlogPosts: fetchBlogPostsMock,
}));

vi.mock('../BlogCard.jsx', () => ({
  __esModule: true,
  default: BlogCardMock,
}));

afterEach(() => {
  fetchBlogPostsMock.mockReset();
  BlogCardMock.mockReset();
});

function renderSpotlight() {
  return render(
    <MemoryRouter>
      <DashboardBlogSpotlight />
    </MemoryRouter>,
  );
}

describe('DashboardBlogSpotlight', () => {
  it('renders spotlight cards when posts are fetched', async () => {
    fetchBlogPostsMock.mockImplementation(() =>
      Promise.resolve({
        results: [
          { id: '1', title: 'Ops excellence', excerpt: 'Playbook' },
          { id: '2', title: 'Growth signals', excerpt: 'Signals' },
        ],
      }),
    );

    renderSpotlight();

    await waitFor(() => {
      expect(fetchBlogPostsMock).toHaveBeenCalledWith({ pageSize: 3 }, expect.any(Object));
    });
    const cards = await screen.findAllByTestId('blog-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Ops excellence');
  });

  it('shows an error callout when the fetch fails', async () => {
    fetchBlogPostsMock.mockImplementation(() => Promise.reject(new Error('Timeout')));

    renderSpotlight();

    expect(await screen.findByText(/having trouble loading the latest blog insights/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open blog hub/i })).toBeInTheDocument();
  });

  it('renders nothing when no posts are returned', async () => {
    fetchBlogPostsMock.mockImplementation(() => Promise.resolve({ results: [] }));

    const { container } = renderSpotlight();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
