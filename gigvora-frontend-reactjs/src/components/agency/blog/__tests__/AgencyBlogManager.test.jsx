import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AgencyBlogManager from '../AgencyBlogManager.jsx';

let workspaceSelectorProps;
let postListProps;
let taxonomyPanelProps;
let drawerProps;

vi.mock('../AgencyBlogWorkspaceSelector.jsx', () => ({
  default: (props) => {
    workspaceSelectorProps = props;
    return (
      <div data-testid="workspace-selector">
        {props.workspaces.map((workspace) => (
          <button key={workspace.id} type="button" onClick={() => props.onChange(workspace.id)}>
            {workspace.name}
          </button>
        ))}
      </div>
    );
  },
}));

vi.mock('../AgencyBlogPostForm.jsx', () => ({
  default: ({ onSubmit, onChange, formState }) => (
    <form onSubmit={onSubmit}>
      <input
        aria-label="Title"
        value={formState.title}
        onChange={(event) => onChange((prev) => ({ ...prev, title: event.target.value }))}
      />
      <button type="submit">submit</button>
    </form>
  ),
}));

vi.mock('../AgencyBlogPostList.jsx', () => ({
  default: (props) => {
    postListProps = props;
    return (
      <div data-testid="post-list">
        {props.posts.map((post) => (
          <article key={post.id}>{post.title}</article>
        ))}
      </div>
    );
  },
}));

vi.mock('../AgencyBlogTaxonomyPanel.jsx', () => ({
  default: (props) => {
    taxonomyPanelProps = props;
    return (
      <div data-testid="taxonomy-panel">
        <button type="button" onClick={() => props.onCreateCategory({ name: 'Insights' })}>
          add category
        </button>
        <button type="button" onClick={() => props.onCreateTag({ name: 'AI' })}>
          add tag
        </button>
        <button type="button" onClick={() => props.onCreateMedia({ url: 'https://cdn' })}>
          add media
        </button>
      </div>
    );
  },
}));

vi.mock('../AgencyBlogPostDrawer.jsx', () => ({
  default: (props) => {
    drawerProps = props;
    return props.open ? (
      <div data-testid="post-drawer">
        <button type="button" onClick={props.onClose}>
          close drawer
        </button>
        <button type="button" onClick={props.onSubmit}>
          save drawer
        </button>
      </div>
    ) : null;
  },
}));

const fetchAgencyBlogWorkspaces = vi.fn();
const fetchAgencyBlogPosts = vi.fn();
const createAgencyBlogPost = vi.fn();
const updateAgencyBlogPost = vi.fn();
const deleteAgencyBlogPost = vi.fn();
const fetchAgencyBlogCategories = vi.fn();
const fetchAgencyBlogTags = vi.fn();
const createAgencyBlogCategory = vi.fn();
const createAgencyBlogTag = vi.fn();
const createAgencyBlogMedia = vi.fn();

vi.mock('../../../../services/blog.js', () => ({
  fetchAgencyBlogWorkspaces: (...args) => fetchAgencyBlogWorkspaces(...args),
  fetchAgencyBlogPosts: (...args) => fetchAgencyBlogPosts(...args),
  createAgencyBlogPost: (...args) => createAgencyBlogPost(...args),
  updateAgencyBlogPost: (...args) => updateAgencyBlogPost(...args),
  deleteAgencyBlogPost: (...args) => deleteAgencyBlogPost(...args),
  fetchAgencyBlogCategories: (...args) => fetchAgencyBlogCategories(...args),
  fetchAgencyBlogTags: (...args) => fetchAgencyBlogTags(...args),
  createAgencyBlogCategory: (...args) => createAgencyBlogCategory(...args),
  createAgencyBlogTag: (...args) => createAgencyBlogTag(...args),
  createAgencyBlogMedia: (...args) => createAgencyBlogMedia(...args),
}));

describe('AgencyBlogManager', () => {
  beforeEach(() => {
    workspaceSelectorProps = undefined;
    postListProps = undefined;
    taxonomyPanelProps = undefined;
    drawerProps = undefined;
    fetchAgencyBlogWorkspaces.mockResolvedValue([{ id: 10, name: 'Global' }]);
    fetchAgencyBlogPosts.mockResolvedValue({
      results: [
        { id: 1, title: 'Launch', status: 'published' },
        { id: 2, title: 'Teaser', status: 'draft' },
        { id: 3, title: 'Webinar', status: 'scheduled' },
      ],
    });
    fetchAgencyBlogCategories.mockResolvedValue([{ id: 5, name: 'Announcements' }]);
    fetchAgencyBlogTags.mockResolvedValue([{ id: 8, name: 'Growth' }]);
    createAgencyBlogPost.mockResolvedValue({ id: 99 });
    updateAgencyBlogPost.mockResolvedValue({});
    deleteAgencyBlogPost.mockResolvedValue({});
    createAgencyBlogCategory.mockResolvedValue({});
    createAgencyBlogTag.mockResolvedValue({});
    createAgencyBlogMedia.mockResolvedValue({});
  });

  it('loads workspaces and renders summary metrics', async () => {
    render(<AgencyBlogManager />);

    await waitFor(() => expect(fetchAgencyBlogWorkspaces).toHaveBeenCalled());
    await waitFor(() => expect(fetchAgencyBlogPosts).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 10, pageSize: 50 }),
    ));

    expect(await screen.findByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('handles post deletion and refresh', async () => {
    window.confirm = vi.fn(() => true);
    const user = userEvent.setup();

    render(<AgencyBlogManager />);
    await user.click(await screen.findByRole('button', { name: /posts/i }));
    await waitFor(() => expect(postListProps).toBeDefined());
    const initialCalls = fetchAgencyBlogPosts.mock.calls.length;

    await act(async () => {
      await postListProps.onDelete(1);
    });

    expect(deleteAgencyBlogPost).toHaveBeenCalledWith(1, 10);
    await waitFor(() => expect(fetchAgencyBlogPosts).toHaveBeenCalledTimes(initialCalls + 1));
  });

  it('creates taxonomy assets for selected workspace', async () => {
    const user = userEvent.setup();
    render(<AgencyBlogManager />);

    await user.click(await screen.findByRole('button', { name: /library/i }));
    await waitFor(() => expect(taxonomyPanelProps).toBeDefined());

    await act(async () => {
      await taxonomyPanelProps.onCreateCategory({ name: 'Insights' });
    });
    expect(createAgencyBlogCategory).toHaveBeenCalledWith(10, { name: 'Insights' });

    await act(async () => {
      await taxonomyPanelProps.onCreateTag({ name: 'AI' });
    });
    expect(createAgencyBlogTag).toHaveBeenCalledWith(10, { name: 'AI' });

    await act(async () => {
      await taxonomyPanelProps.onCreateMedia({ url: 'https://cdn' });
    });
    expect(createAgencyBlogMedia).toHaveBeenCalledWith(10, { url: 'https://cdn' });
  });
});
