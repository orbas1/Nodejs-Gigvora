import { useCallback, useEffect, useMemo, useState } from 'react';
import AgencyBlogWorkspaceSelector from './AgencyBlogWorkspaceSelector.jsx';
import AgencyBlogPostForm from './AgencyBlogPostForm.jsx';
import AgencyBlogPostList from './AgencyBlogPostList.jsx';
import AgencyBlogTaxonomyPanel from './AgencyBlogTaxonomyPanel.jsx';
import AgencyBlogPostDrawer from './AgencyBlogPostDrawer.jsx';
import {
  fetchAgencyBlogWorkspaces,
  fetchAgencyBlogPosts,
  createAgencyBlogPost,
  updateAgencyBlogPost,
  deleteAgencyBlogPost,
  fetchAgencyBlogCategories,
  fetchAgencyBlogTags,
  createAgencyBlogCategory,
  createAgencyBlogTag,
  createAgencyBlogMedia,
} from '../../../services/blog.js';

const DEFAULT_FORM = {
  id: null,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
  categoryId: '',
  readingTimeMinutes: 5,
  featured: false,
  coverImageUrl: '',
  mediaUrls: '',
  tagsText: '',
};

const VIEW_TABS = [
  { id: 'write', label: 'Write' },
  { id: 'posts', label: 'Posts' },
  { id: 'library', label: 'Library' },
];

function mapPostToForm(post) {
  if (!post) {
    return { ...DEFAULT_FORM };
  }
  return {
    id: post.id ?? null,
    title: post.title ?? '',
    slug: post.slug ?? '',
    excerpt: post.excerpt ?? '',
    content: post.content ?? '',
    status: post.status ?? 'draft',
    categoryId: post.category?.id ? String(post.category.id) : '',
    readingTimeMinutes: post.readingTimeMinutes ?? 5,
    featured: Boolean(post.featured),
    coverImageUrl: post.coverImage?.url ?? '',
    mediaUrls: Array.isArray(post.media)
      ? post.media
          .map((item) => item.media?.url ?? '')
          .filter(Boolean)
          .join('\n')
      : '',
    tagsText: Array.isArray(post.tags) ? post.tags.map((tag) => tag.name).join(', ') : '',
  };
}

function buildPayloadFromForm(formState) {
  return {
    title: formState.title,
    slug: formState.slug || undefined,
    excerpt: formState.excerpt || undefined,
    content: formState.content,
    status: formState.status,
    categoryId: formState.categoryId ? Number(formState.categoryId) : undefined,
    featured: Boolean(formState.featured),
    readingTimeMinutes: formState.readingTimeMinutes
      ? Number(formState.readingTimeMinutes)
      : undefined,
    coverImage: formState.coverImageUrl ? { url: formState.coverImageUrl } : undefined,
    tags: formState.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    media: formState.mediaUrls
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, index) => ({ url, position: index })),
  };
}

export default function AgencyBlogManager() {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', search: '' });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);
  const [taxonomySaving, setTaxonomySaving] = useState(false);

  const [activeView, setActiveView] = useState('write');
  const [composeState, setComposeState] = useState(DEFAULT_FORM);
  const [composeSaving, setComposeSaving] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editorState, setEditorState] = useState(DEFAULT_FORM);
  const [editorSaving, setEditorSaving] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const data = await fetchAgencyBlogWorkspaces();
      setWorkspaces(data);
      if (!selectedWorkspaceId && data.length) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (error) {
      setWorkspaceError(error);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [selectedWorkspaceId]);

  const loadPosts = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setPosts([]);
      return;
    }
    setPostsLoading(true);
    setPostsError(null);
    try {
      const payload = await fetchAgencyBlogPosts({
        workspaceId: selectedWorkspaceId,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
        pageSize: 50,
      });
      setPosts(payload?.results ?? []);
    } catch (error) {
      setPostsError(error);
    } finally {
      setPostsLoading(false);
    }
  }, [selectedWorkspaceId, filters.status, filters.search]);

  const loadTaxonomy = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setCategories([]);
      setTags([]);
      return;
    }
    setTaxonomyLoading(true);
    try {
      const [categoryResults, tagResults] = await Promise.all([
        fetchAgencyBlogCategories(selectedWorkspaceId),
        fetchAgencyBlogTags(selectedWorkspaceId),
      ]);
      setCategories(categoryResults);
      setTags(tagResults);
    } finally {
      setTaxonomyLoading(false);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadPosts();
    loadTaxonomy();
    setComposeState(DEFAULT_FORM);
    setEditorState(DEFAULT_FORM);
    setDrawerOpen(false);
  }, [loadPosts, loadTaxonomy]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [workspaces, selectedWorkspaceId],
  );

  const handleComposeSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedWorkspaceId) {
        return;
      }
      setComposeSaving(true);
      try {
        await createAgencyBlogPost(selectedWorkspaceId, buildPayloadFromForm(composeState));
        setComposeState(DEFAULT_FORM);
        await loadPosts();
        await loadTaxonomy();
        setActiveView('posts');
      } finally {
        setComposeSaving(false);
      }
    },
    [composeState, selectedWorkspaceId, loadPosts, loadTaxonomy],
  );

  const openDrawerWithPost = useCallback((post) => {
    setEditorState(mapPostToForm(post));
    setDrawerOpen(true);
  }, []);

  const openDrawerForNew = useCallback(() => {
    setEditorState(DEFAULT_FORM);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setEditorState(DEFAULT_FORM);
  }, []);

  const handleDrawerSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!selectedWorkspaceId) {
        return;
      }
      setEditorSaving(true);
      try {
        const payload = buildPayloadFromForm(editorState);
        if (editorState.id) {
          await updateAgencyBlogPost(editorState.id, selectedWorkspaceId, payload);
        } else {
          await createAgencyBlogPost(selectedWorkspaceId, payload);
        }
        await loadPosts();
        await loadTaxonomy();
        handleDrawerClose();
        setActiveView('posts');
      } finally {
        setEditorSaving(false);
      }
    },
    [editorState, selectedWorkspaceId, loadPosts, loadTaxonomy, handleDrawerClose],
  );

  const handleDelete = useCallback(
    async (postId) => {
      if (!postId || !selectedWorkspaceId) return;
      // eslint-disable-next-line no-alert
      const confirmDelete = window.confirm('Delete this post?');
      if (!confirmDelete) {
        return;
      }
      await deleteAgencyBlogPost(postId, selectedWorkspaceId);
      if (editorState.id === postId) {
        handleDrawerClose();
      }
      await loadPosts();
    },
    [selectedWorkspaceId, editorState.id, handleDrawerClose, loadPosts],
  );

  const handleCreateCategory = useCallback(
    async (categoryPayload) => {
      if (!selectedWorkspaceId) return;
      setTaxonomySaving(true);
      try {
        await createAgencyBlogCategory(selectedWorkspaceId, categoryPayload);
        await loadTaxonomy();
      } finally {
        setTaxonomySaving(false);
      }
    },
    [selectedWorkspaceId, loadTaxonomy],
  );

  const handleCreateTag = useCallback(
    async (tagPayload) => {
      if (!selectedWorkspaceId) return;
      setTaxonomySaving(true);
      try {
        await createAgencyBlogTag(selectedWorkspaceId, tagPayload);
        await loadTaxonomy();
      } finally {
        setTaxonomySaving(false);
      }
    },
    [selectedWorkspaceId, loadTaxonomy],
  );

  const handleCreateMedia = useCallback(
    async (mediaPayload) => {
      if (!selectedWorkspaceId) return;
      setTaxonomySaving(true);
      try {
        await createAgencyBlogMedia(selectedWorkspaceId, mediaPayload);
        await loadTaxonomy();
      } finally {
        setTaxonomySaving(false);
      }
    },
    [selectedWorkspaceId, loadTaxonomy],
  );

  const summary = useMemo(() => {
    const totals = { draft: 0, scheduled: 0, published: 0 };
    posts.forEach((post) => {
      totals[post.status] = (totals[post.status] || 0) + 1;
    });
    return [
      { id: 'published', label: 'Live', value: totals.published ?? 0 },
      { id: 'draft', label: 'Draft', value: totals.draft ?? 0 },
      { id: 'scheduled', label: 'Queue', value: totals.scheduled ?? 0 },
    ];
  }, [posts]);

  return (
    <div className="space-y-6" id="blog-management">
      <AgencyBlogWorkspaceSelector
        workspaces={workspaces}
        value={selectedWorkspaceId}
        onChange={setSelectedWorkspaceId}
        loading={workspaceLoading}
        error={workspaceError}
      />

      {selectedWorkspaceId ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {summary.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-soft"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-soft">
            {VIEW_TABS.map((tab) => {
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-accent text-white shadow-soft'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            {activeView === 'write' ? (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-slate-900">New post</h2>
                <AgencyBlogPostForm
                  formState={composeState}
                  onChange={setComposeState}
                  onSubmit={handleComposeSubmit}
                  onReset={() => setComposeState(DEFAULT_FORM)}
                  saving={composeSaving}
                  categories={categories}
                  workspaceName={selectedWorkspace?.name}
                  submitLabel="Publish"
                />
              </div>
            ) : null}

            {activeView === 'posts' ? (
              <AgencyBlogPostList
                posts={posts}
                onSelect={openDrawerWithPost}
                onCreate={openDrawerForNew}
                selectedId={editorState.id}
                onDelete={handleDelete}
                onRefresh={loadPosts}
                loading={postsLoading}
                filters={filters}
                onFilterChange={setFilters}
                error={postsError}
              />
            ) : null}

            {activeView === 'library' ? (
              <AgencyBlogTaxonomyPanel
                categories={categories}
                tags={tags}
                onCreateCategory={handleCreateCategory}
                onCreateTag={handleCreateTag}
                onCreateMedia={handleCreateMedia}
                creating={taxonomySaving}
                loading={taxonomyLoading}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <AgencyBlogPostDrawer
        open={drawerOpen}
        formState={editorState}
        onChange={setEditorState}
        onClose={handleDrawerClose}
        onSubmit={handleDrawerSubmit}
        saving={editorSaving}
        categories={categories}
        workspaceName={selectedWorkspace?.name}
        onDelete={editorState.id ? () => handleDelete(editorState.id) : null}
      />
    </div>
  );
}
